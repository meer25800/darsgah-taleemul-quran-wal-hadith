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
    const allowed = new Map([
      [".jpg", ["image/jpeg"]],
      [".jpeg", ["image/jpeg"]],
      [".png", ["image/png"]],
      [".webp", ["image/webp"]],
      [".pdf", ["application/pdf"]],
      [".doc", ["application/msword"]],
      [".docx", ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"]],
      [".ppt", ["application/vnd.ms-powerpoint"]],
      [".pptx", ["application/vnd.openxmlformats-officedocument.presentationml.presentation"]],
      [".mp3", ["audio/mpeg", "audio/mp3"]],
      [".mp4", ["video/mp4"]],
      [".wav", ["audio/wav", "audio/x-wav"]]
    ]);
    const extension = path.extname(file.originalname).toLowerCase();
    const mimeTypes = allowed.get(extension);
    if (!mimeTypes || !mimeTypes.includes(file.mimetype)) {
      const error = new Error("Unsupported or mismatched file type");
      error.statusCode = 422;
      return cb(error);
    }
    cb(null, true);
  }
});
