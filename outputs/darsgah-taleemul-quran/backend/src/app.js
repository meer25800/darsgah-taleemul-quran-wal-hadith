import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
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

app.use(helmet());
const allowedOrigins = new Set([
  process.env.CLIENT_URL,
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:5173"
].filter(Boolean));

app.use(cors({
  origin(origin, callback) {
    if (!origin || process.env.CLIENT_URL === "*" || allowedOrigins.has(origin)) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true
}));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.get("/health", (_req, res) => res.json({ ok: true, name: "Darsgah API" }));
app.use("/api/auth", authRoutes);
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
