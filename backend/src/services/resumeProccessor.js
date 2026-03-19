import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import { pool } from "../db/connectDB.js";

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

// ✅ Gemini embedding dimension = 768
const DEFAULT_EMBEDDING_DIMENSION = 768;

// ✅ Ensure numeric array
function toNumericEmbeddingArray(embedding) {
    if (!embedding) throw new Error("Embedding is null/undefined");

    if (!Array.isArray(embedding)) {
        throw new Error("Embedding must be an array");
    }

    const normalized = embedding.map((v, i) => {
        const num = Number(v);
        if (!Number.isFinite(num)) {
            throw new Error(`Invalid number at index ${i}`);
        }
        return num;
    });

    if (normalized.length !== DEFAULT_EMBEDDING_DIMENSION) {
        console.warn(
            `⚠️ Expected ${DEFAULT_EMBEDDING_DIMENSION}, got ${normalized.length}`
        );
    }

    return normalized;
}

// ✅ Convert to pgvector format
function formatEmbeddingForPgvector(arr) {
    return `[${arr.join(",")}]`;
}

// ✅ Save embedding
export async function saveEmbeddingToDB(conn, candidateId, embedding) {
    if (!conn) throw new Error("DB connection required");
    if (!candidateId) throw new Error("Candidate ID required");

    console.log("💾 Preparing embedding for DB...");

    const normalized = toNumericEmbeddingArray(embedding);
    const vectorString = formatEmbeddingForPgvector(normalized);

    console.log("📊 Embedding length:", normalized.length);

    await conn.query(
        `
    INSERT INTO candidate_embeddings (candidate_id, embedding)
    VALUES ($1, $2::vector)
    ON CONFLICT (candidate_id)
    DO UPDATE SET embedding = EXCLUDED.embedding
    `,
        [candidateId, vectorString]
    );

    console.log("✅ Embedding saved in DB");
}

// 🔥 MAIN FUNCTION
export async function processResume(candidateId, filePath) {
    const conn = await pool.connect();

    try {
        console.log("🚀 Processing resume:", candidateId);

        // 1. Read file
        const fileBuffer = fs.readFileSync(filePath);
        const base64File = fileBuffer.toString("base64");

        let mimeType = "application/pdf";
        if (filePath.endsWith(".png")) mimeType = "image/png";
        if (filePath.endsWith(".jpg") || filePath.endsWith(".jpeg"))
            mimeType = "image/jpeg";
        if (filePath.endsWith(".docx"))
            mimeType =
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

        // 2. Gemini analysis
        const model = genAI.getGenerativeModel({
            model: "gemini-3-flash-preview"
        });

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

        const raw = result.response.text();
        const data = safeJSONParse(raw);

        console.log("✅ Resume parsed");

        // 3. Save analysis
        await conn.query(
            `INSERT INTO resume_analysis (candidate_id, parsed_json)
       VALUES ($1, $2)`,
            [candidateId, data]
        );

        // 4. Update candidate
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

        console.log("✅ Candidate updated");

        // 5. Prepare embedding text
        const embeddingText = `
skills: ${(data.skills || []).join(", ")}
roles: ${(data.roles || []).join(", ")}
experience: ${data.experience_years || 0}
industry: ${data.industry || ""}
summary: ${data.summary || ""}
`;

        // 6. Generate embedding
        console.log("🧠 Generating embedding...");

        const embedModel = genAI.getGenerativeModel({
            model: "gemini-embedding-2-preview"
        });

        const embeddingRes = await embedModel.embedContent({
            content: {
                parts: [{ text: embeddingText }]
            }
        });

        console.log("📦 Raw embedding response received");

        // ✅ SAFE extraction
        let embedding;

        if (embeddingRes.embedding?.values) {
            embedding = embeddingRes.embedding.values;
        } else if (embeddingRes.embeddings?.[0]?.values) {
            embedding = embeddingRes.embeddings[0].values;
        } else {
            throw new Error("❌ Invalid embedding response structure");
        }

        console.log("📊 Embedding extracted:", embedding.length);

        // 7. Save embedding
        await saveEmbeddingToDB(conn, candidateId, embedding);

        console.log("🎉 Resume fully processed:", candidateId);

        return { success: true, data };

    } catch (err) {
        console.error("❌ Resume Processing Error:", err);
        throw err;
    } finally {
        conn.release();
    }
}