import { Pool } from "pg";
import dotenv from "dotenv";
import createTables from "./createTables.js";

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

const connectDB = async () => {
    try {
        await pool.connect();
        console.log("PostgreSQL Connected");

        // 🔥 CREATE TABLES HERE
        await createTables();

    } catch (error) {
        console.error("DB Connection Error:", error);
    }
};

export { pool, connectDB };