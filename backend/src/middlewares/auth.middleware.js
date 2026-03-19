import jwt from "jsonwebtoken";
import {pool} from "../db/connectDB.js";
import {ApiError} from "../utils/ApiError.js";

const verifyJWT = async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "Unauthorized");
    }

    const decoded = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET
    );

    const { rows } = await pool.query(
      `SELECT id, name, email, role FROM users WHERE id = $1`,
      [decoded.id]
    );

    const user = rows[0];

    if (!user) {
      throw new ApiError(401, "Invalid token");
    }

    req.user = user;
    next();
  } catch (err) {
    throw new ApiError(401, "Unauthorized");
  }
};

export {
  verifyJWT
}