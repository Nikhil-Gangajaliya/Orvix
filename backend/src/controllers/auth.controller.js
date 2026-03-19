import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {pool} from "../db/connectDB.js";

import {
  findUserByEmail,
  saveRefreshToken,
  removeRefreshToken,
  createUser
} from "../services/auth.service.js";

import {
  generateAccessToken,
  generateRefreshToken
} from "../services/token.service.js";


import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";

// ================= REGISTER CANDIDATE =================
const registerCandidate = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existing = await findUserByEmail(email);
    if (existing) {
      throw new ApiError(400, "User already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await createUser({
      name,
      email,
      passwordHash: hashedPassword,
      role: "candidate" // 🔥 CHANGED (fixed role)
    });

    res.status(201).json(
      new ApiResponse(201, user, "Candidate registered")
    );

  } catch (err) {
    console.error("Register Candidate Error:", err); // 🔥 CHANGED
    next(err);
  }
};

// ================= REGISTER COMPANY =================
const registerCompany = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existing = await findUserByEmail(email);
    if (existing) {
      throw new ApiError(400, "User already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await createUser({
      name,
      email,
      passwordHash: hashedPassword,
      role: "company" // 🔥 CHANGED
    });

    res.status(201).json(
      new ApiResponse(201, user, "Company registered")
    );

  } catch (err) {
    console.error("Register Company Error:", err); // 🔥 CHANGED
    next(err);
  }
};

// ================= LOGIN =================
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await findUserByEmail(email);
    if (!user) throw new ApiError(404, "User not found");

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) throw new ApiError(401, "Invalid credentials");

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await saveRefreshToken(user.id, refreshToken);

    res
      .cookie("accessToken", accessToken, { httpOnly: true })
      .cookie("refreshToken", refreshToken, { httpOnly: true })
      .status(200)
      .json(
        new ApiResponse(
          200,
          {
            user: {
              id: user.id,
              email: user.email,
              role: user.role
            },
            accessToken
          },
          "Login successful"
        )
      );
  } catch (error) {
    throw new ApiError(500, "Login failed", error);
  }
};

// ================= LOGOUT =================
const logout = async (req, res, next) => {
  try {
    await removeRefreshToken(req.user.id);

    res
      .clearCookie("accessToken")
      .clearCookie("refreshToken")
      .status(200)
      .json(new ApiResponse(200, {}, "Logged out successfully"));
  } catch (err) {
    throw new ApiError(500, "Logout failed", err);
  }
};

// ================= REFRESH TOKEN =================
const refreshAccessToken = async (req, res, next) => {
  try {
    const incomingToken = req.cookies?.refreshToken;

    if (!incomingToken) {
      throw new ApiError(401, "No refresh token");
    }

    const decoded = jwt.verify(
      incomingToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const { rows } = await pool.query(
      `SELECT * FROM users WHERE id = $1`,
      [decoded.id]
    );

    const user = rows[0];

    if (!user || user.refresh_token !== incomingToken) {
      throw new ApiError(401, "Invalid refresh token");
    }

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    await saveRefreshToken(user.id, newRefreshToken);

    res
      .cookie("accessToken", newAccessToken, { httpOnly: true })
      .cookie("refreshToken", newRefreshToken, { httpOnly: true })
      .json(
        new ApiResponse(200, { accessToken: newAccessToken }, "Token refreshed")
      );
  } catch (err) {
    throw new ApiError(401, "Invalid or expired refresh token", err);
  }
};

export {
  registerCandidate,
  registerCompany,
  login,
  logout,
  refreshAccessToken
};