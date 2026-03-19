import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(express.static("public"));
app.use(cookieParser());

// 🔥 ROUTES
import authRoutes from "./routes/auth.routes.js";
import candidateRoutes from "./routes/candidate.routes.js";
import companyRoutes from "./routes/company.routes.js";

app.use("/api/v1/auth", authRoutes);       // ✅ ADD THIS
app.use("/api/v1/candidate", candidateRoutes);
app.use("/api/v1/company", companyRoutes);

export { app };