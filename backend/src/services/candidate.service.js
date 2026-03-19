import {pool} from "../db/connectDB.js";

const createCandidate = async ({
  user_id,
  phone,
  location,
  profile_summary,
  total_experience_years,
  resume_url
}) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const query = `
      INSERT INTO candidates
      (user_id, phone, location, profile_summary, total_experience_years, resume_url)
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *
    `;

    const { rows } = await client.query(query, [
      user_id,
      phone,
      location,
      profile_summary,
      total_experience_years,
      resume_url
    ]);

    await client.query("COMMIT");

    return rows[0];

  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

// candidate.service.js
const getCandidateByIdService = async (id) => {
  const { rows } = await pool.query(
    `SELECT * FROM candidates WHERE id = $1`,
    [id]
  );
  return rows[0];
};

export { createCandidate, getCandidateByIdService };