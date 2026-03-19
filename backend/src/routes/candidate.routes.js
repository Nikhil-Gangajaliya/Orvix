import { Router } from "express";
import { 
  onboardCandidate,
  getCandidateProfile,
  getCompanyForCandidate
} from "../controllers/candidate.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../utils/multer.js";

const router = Router();

// 🔥 resume upload here
router.post("/onboard", verifyJWT, upload.single("resume_url"), onboardCandidate);

router.route("/profile").get(verifyJWT, getCandidateProfile);

router.route("/company/:id").get(verifyJWT, getCompanyForCandidate);

export default router;