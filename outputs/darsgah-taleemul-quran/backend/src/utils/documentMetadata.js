import fs from "fs/promises";
import { PDFDocument } from "pdf-lib";

export async function inspectUploadedDocument(file) {
  if (!file) return {};
  const metadata = {
    fileSizeBytes: Number(file.size || 0),
    originalFilename: file.originalname || "",
    mimeType: file.mimetype || "",
    fileAvailable: true
  };
  if (file.mimetype !== "application/pdf") return metadata;
  try {
    const bytes = await fs.readFile(file.path);
    const pdf = await PDFDocument.load(bytes, { ignoreEncryption: false, updateMetadata: false });
    return { ...metadata, pageCount: pdf.getPageCount() };
  } catch {
    const error = new Error("The uploaded PDF is corrupted, encrypted, or invalid");
    error.statusCode = 422;
    throw error;
  }
}

export function formatFileSize(bytes) {
  const value = Number(bytes || 0);
  if (!value) return "";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${Math.ceil(value / 1024)} KB`;
  return `${(value / (1024 * 1024)).toFixed(value >= 10 * 1024 * 1024 ? 0 : 1)} MB`;
}

export function pdfThumbnailUrl(fileUrl) {
  if (!fileUrl || !/res\.cloudinary\.com/i.test(fileUrl) || !/\.pdf(?:$|\?)/i.test(fileUrl)) return "";
  return fileUrl
    .replace("/upload/", "/upload/pg_1,w_720,h_960,c_fit,f_jpg,q_auto/")
    .replace(/\.pdf(?=$|\?)/i, ".jpg");
}
