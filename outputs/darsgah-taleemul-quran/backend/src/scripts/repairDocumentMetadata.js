import "dotenv/config";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { PDFDocument } from "pdf-lib";
import { connectDB } from "../utils/db.js";
import { Book, Resource } from "../models/Content.js";
import { formatFileSize } from "../utils/documentMetadata.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, "../..");
const logoFallbacks = new Set(["/institute-logo.png", "/institute-logo-official.png", "/institute-logo-badge.png"]);

function localFilePath(value) {
  if (!value) return "";
  try {
    const pathname = /^https?:\/\//i.test(value) ? new URL(value).pathname : value;
    if (!pathname.startsWith("/uploads/")) return "";
    return path.join(backendRoot, pathname.replace(/^\/+/, ""));
  } catch {
    return "";
  }
}

async function inspectRecord(record) {
  const fileUrl = record.fileUrl || record.previewUrl || "";
  const localPath = localFilePath(fileUrl);
  const set = { fileAvailable: Boolean(fileUrl || record.externalUrl) };
  const unset = {};
  if (localPath) {
    try {
      const bytes = await fs.readFile(localPath);
      const pdf = await PDFDocument.load(bytes, { ignoreEncryption: false, updateMetadata: false });
      set.pageCount = pdf.getPageCount();
      set.pages = pdf.getPageCount();
      set.fileSizeBytes = bytes.length;
      set.fileSize = formatFileSize(bytes.length);
      set.mimeType = "application/pdf";
      set.fileAvailable = true;
    } catch {
      set.fileAvailable = false;
      unset.pageCount = 1;
      unset.pages = 1;
      unset.fileSize = 1;
      unset.fileSizeBytes = 1;
    }
  } else if (!fileUrl && !record.externalUrl) {
    unset.pageCount = 1;
    unset.pages = 1;
    unset.fileSize = 1;
    unset.fileSizeBytes = 1;
  }
  if (logoFallbacks.has(record.coverUrl)) unset.coverUrl = 1;
  if (logoFallbacks.has(record.thumbnailUrl)) unset.thumbnailUrl = 1;
  if (/prepared for institute students with clear revision points/i.test(record.description || "")) unset.description = 1;
  return { set, unset };
}

await connectDB();
let changed = 0;
for (const Model of [Book, Resource]) {
  const records = await Model.find({}).lean();
  for (const record of records) {
    const { set, unset } = await inspectRecord(record);
    await Model.updateOne({ _id: record._id }, { $set: set, ...(Object.keys(unset).length ? { $unset: unset } : {}) });
    changed += 1;
  }
}
console.log(`Repaired metadata for ${changed} document records.`);
process.exit(0);
