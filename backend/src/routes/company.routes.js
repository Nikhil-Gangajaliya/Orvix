import { Router } from "express";
import {
    onboardCompany,
    getCompanyProfile,
    getCandidateForCompany
} from "../controllers/company.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/onboard").post(verifyJWT, onboardCompany);

router.route("/profile").get(verifyJWT, getCompanyProfile);

router.route("/candidate/:id").get(verifyJWT, getCandidateForCompany);

export default router;