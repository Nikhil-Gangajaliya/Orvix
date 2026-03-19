import { createCompany } from "../services/company.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { pool } from "../db/connectDB.js";
import { getCandidateByIdService } from "../services/candidate.service.js";

const onboardCompany = async (req, res, next) => {
  try {
    // console.log("USER:", req.user);
    // console.log("BODY:", req.body);

    const userId = req.user.id; // verify this

    const {
      company_name,
      website,
      location,
      description
    } = req.body;

    if (!company_name) {
      throw new ApiError(400, "Company name is required");
    }

    const company = await createCompany({
      user_id: userId,
      company_name,
      website,
      location,
      description
    });

    res.status(200).json(
      new ApiResponse(200, company, "Company onboarded")
    );

  } catch (err) {
    throw new ApiError(500, "Failed to onboard company", err);
  }
};

const getCompanyProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const { rows } = await pool.query(
      `
      SELECT *
      FROM companies
      WHERE user_id = $1
      `,
      [userId]
    );

    if (rows.length === 0) {
      throw new ApiError(404, "Company profile not found");
    }

    res.status(200).json(
      new ApiResponse(200, rows[0], "Company profile fetched")
    );

  } catch (err) {
    console.error("Get Company Profile Error:", err);
    next(err);
  }
};

const getCandidateForCompany = async (req, res, next) => {
  try {
    const { id } = req.params;

    const candidate = await getCandidateByIdService(id);

    if (!candidate) {
      throw new ApiError(404, "Candidate not found");
    }

    res.status(200).json(
      new ApiResponse(200, candidate, "Candidate fetched")
    );

  } catch (err) {
    console.error("Get Candidate (Company) Error:", err);
    next(err);
  }
};

export { 
  onboardCompany,
  getCompanyProfile,
  getCandidateForCompany
};