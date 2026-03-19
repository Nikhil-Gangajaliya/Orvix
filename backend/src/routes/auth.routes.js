import { Router } from "express";
import {
  registerCandidate,
  registerCompany,
  login,
  logout,
  refreshAccessToken
} from "../controllers/auth.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// ✅ SIMPLE AUTH
router.route("/register/candidate").post(registerCandidate);
router.route("/register/company").post(registerCompany);
router.route("/login").post(login);
router.route("/logout").post(verifyJWT, logout);
router.route("/refresh").post(refreshAccessToken);

export default router;