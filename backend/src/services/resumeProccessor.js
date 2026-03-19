import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import { pool } from "../db/connectDB.js";
import { log } from "console";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 🔒 Safe JSON parser
function safeJSONParse(text) {
    try {
        return JSON.parse(text);
    } catch {
        const match = text.match(/\{[\s\S]*\}/);
        if (!match) throw new Error("Invalid JSON from Gemini");
        return JSON.parse(match[0]);
    }
}

const DEFAULT_EMBEDDING_DIMENSION = 1536;

function toNumericEmbeddingArray(embedding, expectedDimension = DEFAULT_EMBEDDING_DIMENSION) {
    if (embedding == null) {
        throw new Error("Embedding is null or undefined");
    }

    let vector;

    if (Array.isArray(embedding)) {
        vector = embedding;
    } else if (typeof embedding === "string") {
        const trimmed = embedding.trim();
        if (!trimmed) throw new Error("Embedding string is empty");

        if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
            const inside = trimmed.slice(1, -1).trim();
            if (!inside) {
                vector = [];
            } else {
                vector = inside.split(",").map((x) => Number(x.trim()));
            }
        } else {
            throw new Error("Embedding string must be in vector format like [0.1,0.2,...]");
        }
    } else if (typeof embedding === "object" && embedding.values) {
        vector = embedding.values;
    } else {
        throw new Error("Unsupported embedding input type");
    }

    if (!Array.isArray(vector) || vector.length === 0) {
        throw new Error("Embedding must be a non-empty array of numbers");
    }

    const normalized = vector.map((value, idx) => {
        const num = Number(value);
        if (!Number.isFinite(num)) {
            throw new Error(`Embedding value at index ${idx} is not a finite number: ${value}`);
        }
        return num;
    });

    if (expectedDimension && normalized.length !== expectedDimension) {
        console.warn(
            `Embedding length ${normalized.length} does not match expected dimension ${expectedDimension}. Continuing with actual length.`
        );
    }

    return normalized;
}

function formatEmbeddingForPgvector(embeddingArray) {
    const normalized = toNumericEmbeddingArray(embeddingArray);
    return `[${normalized.join(",")}]`;
}

export async function saveEmbeddingToDB(conn, candidateId, embedding) {
    console.log("Level 1");
    if (!conn) {
        throw new Error("Database connection is required to save embedding");
    }
    if (!candidateId) {
        throw new Error("Candidate ID is required to save embedding");
    }

    const vectorString = formatEmbeddingForPgvector(embedding);
    console.log("Level 2");
    await conn.query(
        `INSERT INTO candidate_embeddings (candidate_id, embedding)
       VALUES ($1, $2::vector)
       ON CONFLICT (candidate_id)
       DO UPDATE SET embedding = EXCLUDED.embedding`,
        [candidateId, vectorString]
    );
    console.log("Level 3");

}

export async function processResume(candidateId, filePath) {
    const conn = await pool.connect();

    try {
        // 1. Read file → base64
        const fileBuffer = fs.readFileSync(filePath);
        const base64File = fileBuffer.toString("base64");

        // detect mime type
        let mimeType = "application/pdf";

        if (filePath.endsWith(".png")) mimeType = "image/png";
        if (filePath.endsWith(".jpg") || filePath.endsWith(".jpeg"))
            mimeType = "image/jpeg";
        if (filePath.endsWith(".docx"))
            mimeType =
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

        // 2. Gemini model
        const model = genAI.getGenerativeModel({
            model: "gemini-3-flash-preview"
        });

        // 3. Send file + prompt
        const result = await model.generateContent([
            {
                inlineData: {
                    mimeType,
                    data: base64File
                }
            },
            {
                text: `
Analyze this resume and return structured JSON.

STRICT RULES:
- Return ONLY valid JSON
- No explanation
- No extra text
- No markdown
- summary should be less than 200 characters

FORMAT:
{
  "skills": ["lowercase, full-form"],
  "experience_years": number,
  "roles": ["job roles"],
  "industry": "string",
  "summary": "short summary"
}

Calculate total experience in years based on given dates.

- If "Now" is present, use current date.
- Calculate accurately.
- Return ONLY integer (no decimals).

Example:
Feb 2025 – Now → 1 year
`
            }
        ]);

        const response = await result.response;
        const raw = response.text();

        const data = safeJSONParse(raw);

        // 4. Save RAW JSON
        await conn.query(
            `INSERT INTO resume_analysis (candidate_id, parsed_json)
       VALUES ($1, $2)`,
            [candidateId, data]
        );

        // 5. Update candidate
        await conn.query(
            `UPDATE candidates
       SET total_experience_years = $1,
           profile_summary = $2
       WHERE id = $3`,
            [
                data.experience_years || null,
                data.summary || null,
                candidateId
            ]
        );

        // 6. Create embedding text
        const embeddingText = `
skills: ${(data.skills || []).join(", ")}
roles: ${(data.roles || []).join(", ")}
experience: ${data.experience_years || 0} years
industry: ${data.industry || ""}
summary: ${data.summary || ""}
`;

        // 7. Generate embedding (Gemini)
        const embedModel = genAI.getGenerativeModel({
            model: "gemini-embedding-001"
        });

        const embeddingRes = await embedModel.embedContent({
            content: {
                parts: [
                    {
                        text: `${embeddingText}`
                    }
                ]
            }
        });

        const embedding = embeddingRes.embedding.values;

        // 8. Store embedding
        await saveEmbeddingToDB(conn, candidateId, embedding);

        console.log("✅ Resume processed (Gemini):", candidateId);

        return {
            success: true,
            data
        };

    } catch (err) {
        console.error("❌ Gemini Resume Processing Error:", err);
        throw err;
    } finally {
        conn.release();
    }
}