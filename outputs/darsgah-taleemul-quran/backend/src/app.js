import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import cookieParser from "cookie-parser";
import { rateLimit } from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";
import { errorHandler, notFound } from "./middleware/error.js";
import authRoutes from "./routes/auth.routes.js";
import studentRoutes from "./routes/student.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import publicRoutes from "./routes/public.routes.js";
import parentRoutes from "./routes/parent.routes.js";
import erpRoutes from "./routes/erp.routes.js";
import mediaRoutes from "./routes/media.routes.js";
import contentRoutes from "./routes/content.routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.disable("x-powered-by");
if (process.env.NODE_ENV === "production") app.set("trust proxy", 1);
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  hsts: process.env.NODE_ENV === "production"
}));
app.use(compression());
app.use(cookieParser());

const configuredOrigins = String(process.env.CLIENT_URLS || process.env.CLIENT_URL || "")
  .split(",")
  .map((value) => value.trim().replace(/\/+$/, ""))
  .filter(Boolean);
const allowedOrigins = new Set([
  ...configuredOrigins,
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:5173"
].filter(Boolean));

app.use(cors({
  origin(origin, callback) {
    const normalizedOrigin = origin?.replace(/\/+$/, "");
    if (!origin || process.env.CLIENT_URL === "*" || allowedOrigins.has(normalizedOrigin)) {
      return callback(null, true);
    }
    return callback(new Error("Origin is not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Authorization", "Content-Type", "Range"]
}));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb", parameterLimit: 200 }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: Number(process.env.API_RATE_LIMIT_PER_MINUTE || 120),
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "Too many requests. Please wait and try again." }
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.AUTH_RATE_LIMIT_PER_15_MINUTES || 20),
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { message: "Too many login attempts. Please wait and try again." }
});

app.get("/", (_req, res) => res.json({
  name: "Darsgah Taleemul Quran Wal Hadith API",
  status: "ok",
  health: "/health"
}));
app.get("/health", (_req, res) => res.json({ ok: true, name: "Darsgah API" }));
app.use("/api", apiLimiter);
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/parents", parentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/erp", erpRoutes);
app.use("/api", mediaRoutes);
app.use("/api", contentRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
