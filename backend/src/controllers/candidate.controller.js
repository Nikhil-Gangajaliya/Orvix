import { createCandidate } from "../services/candidate.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { pool } from "../db/connectDB.js";
import { getCompanyByIdService } from "../services/company.service.js";

const onboardCandidate = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const {
      phone,
      location,
      profile_summary,
      total_experience_years
    } = req.body;

    const resume_url = req.file?.path;

    if (!resume_url) {
      throw new ApiError(400, "Resume file is required");
    }

    const candidate = await createCandidate({
      user_id: userId,
      phone,
      location,
      profile_summary: null, // default to null if not provided
      total_experience_years: null, // default to null if not provided
      resume_url
    });

    res.status(200).json(
      new ApiResponse(200, candidate, "Candidate onboarded")
    );

  } catch (err) {
    console.error("Onboard Candidate Error:", err);
    next(err);
  }
};

const getCandidateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const { rows } = await pool.query(
      `
      SELECT 
        c.*,
        u.name AS candidate_name,
        u.email
      FROM candidates c
      JOIN users u ON c.user_id = u.id
      WHERE c.user_id = $1
      `,
      [userId]
    );

    if (rows.length === 0) {
      throw new ApiError(404, "Candidate profile not found");
    }

    res.status(200).json(
      new ApiResponse(200, rows[0], "Candidate profile fetched")
    );

  } catch (err) {
    console.error("Get Candidate Profile Error:", err);
    next(err);
  }
};

const getCompanyForCandidate = async (req, res, next) => {
  try {
    const { id } = req.params;

    const company = await getCompanyByIdService(id);

    if (!company) {
      throw new ApiError(404, "Company not found");
    }

    res.status(200).json(
      new ApiResponse(200, company, "Company fetched")
    );

  } catch (err) {
    console.error("Get Company (Candidate) Error:", err);
    next(err);
  }
};

export { 
  onboardCandidate,
  getCandidateProfile,
  getCompanyForCandidate
};