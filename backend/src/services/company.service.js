import { pool } from "../db/connectDB.js";

const createCompany = async ({
  user_id,
  company_name,
  website,
  location,
  description
}) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 🔹 Insert company
    const companyQuery = `
      INSERT INTO companies
      (user_id, company_name, website, location, description)
      VALUES ($1,$2,$3,$4,$5)
      RETURNING *
    `;

    const { rows } = await client.query(companyQuery, [
      user_id,
      company_name,
      website,
      location,
      description
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

// company.service.js
const getCompanyByIdService = async (id) => {
  const { rows } = await pool.query(
    `SELECT * FROM companies WHERE id = $1`,
    [id]
  );
  return rows[0];
};

export { createCompany, getCompanyByIdService };