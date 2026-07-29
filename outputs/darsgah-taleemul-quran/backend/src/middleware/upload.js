import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = "uploads/";
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (_req, file, cb) => {
    const safe = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.]/g, "-")}`;
    cb(null, safe);
  }
});

export const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [".jpg", ".jpeg", ".png", ".webp", ".pdf", ".doc", ".docx", ".ppt", ".pptx", ".mp3", ".mp4", ".wav"];
    cb(null, allowed.includes(path.extname(file.originalname).toLowerCase()));
  }
});
