import { pool } from "./connectDB.js";

const createTables = async () => {
  try {
    /* Enable vector extension */
    await pool.query(`
      CREATE EXTENSION IF NOT EXISTS vector;
    `);

    /* USERS */
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id BIGSERIAL PRIMARY KEY,
        name VARCHAR(120) NOT NULL,
        email VARCHAR(180) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role VARCHAR(20),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    /* CANDIDATES */
    await pool.query(`
      CREATE TABLE IF NOT EXISTS candidates (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        phone VARCHAR(20),
        location VARCHAR(150),
        profile_summary TEXT,
        total_experience_years SMALLINT,
        resume_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    /* COMPANIES */
    await pool.query(`
      CREATE TABLE IF NOT EXISTS companies (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
        company_name VARCHAR(200),
        website VARCHAR(200),
        location VARCHAR(150),
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    /* INDUSTRIES */
    await pool.query(`
      CREATE TABLE IF NOT EXISTS industries (
        id SERIAL PRIMARY KEY,
        industry_name VARCHAR(150) UNIQUE NOT NULL
      );
    `);

    /* COMPANY INDUSTRY MAP */
    await pool.query(`
      CREATE TABLE IF NOT EXISTS company_industry_map (
        id BIGSERIAL PRIMARY KEY,
        company_name VARCHAR(200) UNIQUE,
        industry_id INT REFERENCES industries(id)
      );
    `);

    /* WORK HISTORY */
    await pool.query(`
      CREATE TABLE IF NOT EXISTS candidate_work_history (
        id BIGSERIAL PRIMARY KEY,
        candidate_id BIGINT REFERENCES candidates(id) ON DELETE CASCADE,
        company_name VARCHAR(200),
        role_title VARCHAR(150),
        industry_id INT REFERENCES industries(id),
        start_date DATE,
        end_date DATE,
        description TEXT
      );
    `);

    /* ROLES */
    await pool.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id SERIAL PRIMARY KEY,
        role_name VARCHAR(150) UNIQUE NOT NULL,
        parent_role_id INT REFERENCES roles(id)
      );
    `);

    /* SKILLS */
    await pool.query(`
      CREATE TABLE IF NOT EXISTS skills (
        id SERIAL PRIMARY KEY,
        skill_name VARCHAR(120) UNIQUE NOT NULL,
        category VARCHAR(100)
      );
    `);

    /* SKILL ALIASES */
    await pool.query(`
      CREATE TABLE IF NOT EXISTS skill_aliases (
        id SERIAL PRIMARY KEY,
        alias_name VARCHAR(120),
        skill_id INT REFERENCES skills(id)
      );
    `);

    /* CANDIDATE SKILLS */
    await pool.query(`
      CREATE TABLE IF NOT EXISTS candidate_skills (
        id BIGSERIAL PRIMARY KEY,
        candidate_id BIGINT REFERENCES candidates(id) ON DELETE CASCADE,
        skill_id INT REFERENCES skills(id),
        proficiency_level SMALLINT,
        UNIQUE(candidate_id, skill_id)
      );
    `);

    /* JOBS */
    await pool.query(`
      CREATE TABLE IF NOT EXISTS jobs (
        id BIGSERIAL PRIMARY KEY,
        company_id BIGINT REFERENCES companies(id),
        role_id INT REFERENCES roles(id),
        title VARCHAR(180),
        description TEXT,
        industry_id INT REFERENCES industries(id),
        experience_required SMALLINT,
        location VARCHAR(150),
        salary_min INTEGER,
        salary_max INTEGER,
        employment_type VARCHAR(50),
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    /* JOB SKILLS */
    await pool.query(`
      CREATE TABLE IF NOT EXISTS job_skills (
        id BIGSERIAL PRIMARY KEY,
        job_id BIGINT REFERENCES jobs(id) ON DELETE CASCADE,
        skill_id INT REFERENCES skills(id),
        importance_weight SMALLINT DEFAULT 1,
        UNIQUE(job_id, skill_id)
      );
    `);

    /* APPLICATIONS */
    await pool.query(`
      CREATE TABLE IF NOT EXISTS applications (
        id BIGSERIAL PRIMARY KEY,
        candidate_id BIGINT REFERENCES candidates(id),
        job_id BIGINT REFERENCES jobs(id),
        status VARCHAR(20) DEFAULT 'applied',
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(candidate_id, job_id)
      );
    `);

    /* RESUME ANALYSIS */
    await pool.query(`
      CREATE TABLE IF NOT EXISTS resume_analysis (
        id BIGSERIAL PRIMARY KEY,
        candidate_id BIGINT REFERENCES candidates(id),
        parsed_json JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    /* JOB ANALYSIS */
    await pool.query(`
      CREATE TABLE IF NOT EXISTS job_analysis (
        id BIGSERIAL PRIMARY KEY,
        job_id BIGINT REFERENCES jobs(id),
        parsed_json JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    /* CANDIDATE EMBEDDINGS */
    await pool.query(`
      CREATE TABLE IF NOT EXISTS candidate_embeddings (
        id BIGSERIAL PRIMARY KEY,
        candidate_id BIGINT REFERENCES candidates(id),
        embedding VECTOR(1536),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(candidate_id)
      );
    `);

    /* JOB EMBEDDINGS */
    await pool.query(`
      CREATE TABLE IF NOT EXISTS job_embeddings (
        id BIGSERIAL PRIMARY KEY,
        job_id BIGINT REFERENCES jobs(id),
        embedding VECTOR(1536),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(job_id)
      );
    `);

    /* MATCH SCORES */
    await pool.query(`
      CREATE TABLE IF NOT EXISTS match_scores (
        id BIGSERIAL PRIMARY KEY,
        candidate_id BIGINT REFERENCES candidates(id),
        job_id BIGINT REFERENCES jobs(id),
        semantic_score FLOAT,
        skill_score FLOAT,
        industry_score FLOAT,
        experience_score FLOAT,
        final_score FLOAT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    /* HIRING FEEDBACK */
    await pool.query(`
      CREATE TABLE IF NOT EXISTS hiring_feedback (
        id BIGSERIAL PRIMARY KEY,
        candidate_id BIGINT REFERENCES candidates(id),
        job_id BIGINT REFERENCES jobs(id),
        decision VARCHAR(20),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    /* VECTOR INDEXES */
    await pool.query(`
      CREATE INDEX IF NOT EXISTS candidate_vector_index
      ON candidate_embeddings
      USING ivfflat (embedding vector_cosine_ops);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS job_vector_index
      ON job_embeddings
      USING ivfflat (embedding vector_cosine_ops);
    `);

    console.log("updated tables successfully");

  } catch (error) {
    console.error(error);
  }
};

export default createTables;