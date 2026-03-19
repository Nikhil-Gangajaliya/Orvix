import {pool} from "../db/connectDB.js";

// CREATE USER
const createUser = async ({ name, email, passwordHash, role }) => {
    const query = `
    INSERT INTO users (name, email, password_hash, role)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;
    const { rows } = await pool.query(query, [
        name,
        email,
        passwordHash,
        role
    ]);
    return rows[0];
};

// FIND USER
const findUserByEmail = async (email) => {
    const { rows } = await pool.query(
        `SELECT * FROM users WHERE email = $1`,
        [email]
    );
    return rows[0];
};

// SAVE REFRESH TOKEN
const saveRefreshToken = async (userId, refreshToken) => {
  await pool.query(
    `UPDATE users SET refresh_token = $1 WHERE id = $2`,
    [refreshToken, userId]
  );
};

// REMOVE REFRESH TOKEN
const removeRefreshToken = async (userId) => {
  await pool.query(
    `UPDATE users SET refresh_token = NULL WHERE id = $1`,
    [userId]
  );
};

export {
    createUser,
    findUserByEmail,
    saveRefreshToken,
    removeRefreshToken
}