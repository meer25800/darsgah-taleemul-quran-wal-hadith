import Student from "../models/Student.js";
import Parent from "../models/Parent.js";
import { Faculty, Event, Syllabus } from "../models/ErpModels.js";
import { Admission, Book, Gallery, Notice, Resource, Video } from "../models/Content.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import { formatFileSize, inspectUploadedDocument, pdfThumbnailUrl } from "../utils/documentMetadata.js";

const searchModels = [
  ["books", Book, ["title", "author", "category", "description"]],
  ["resources", Resource, ["title", "category", "description"]],
  ["videos", Video, ["title", "category", "description"]],
  ["notices", Notice, ["title", "body"]],
  ["events", Event, ["title", "description", "venue"]],
  ["gallery", Gallery, ["title", "description", "category"]],
  ["admissions", Admission, ["studentName", "fatherName", "phone", "className", "message", "status"]],
  ["students", Student, ["name", "rollNumber", "admissionNumber", "fatherName"]],
  ["faculty", Faculty, ["name", "employeeId", "designation"]],
  ["syllabus", Syllabus, ["title", "className", "category", "description"]]
];

function filterFor(q, fields) {
  return { $or: fields.map((field) => ({ [field]: new RegExp(q, "i") })) };
}

export async function globalSearch(req, res) {
  const q = String(req.query.q || "").trim();
  if (!q) return res.json({ results: [] });
  const groups = await Promise.all(searchModels.map(async ([type, Model, fields]) => {
    const items = await Model.find(filterFor(q, fields)).limit(8).lean();
    return items.map((item) => ({
      type,
      id: item._id,
      title: item.title || item.name || item.studentName || item.rollNumber || item.className,
      description: item.description || item.body || item.message || item.category || item.className,
      fileUrl: item.fileUrl || item.previewUrl || item.file?.url || null,
      imageUrl: item.imageUrl || item.thumbnailUrl || null,
      embedUrl: item.embedUrl || null
    }));
  }));
  res.json({ results: groups.flat() });
}

export async function trackBookView(req, res) {
  const item = await Book.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } }, { new: true });
  if (!item) return res.status(404).json({ message: "Book not found" });
  res.json({ item });
}

export async function trackBookDownload(req, res) {
  const item = await Book.findByIdAndUpdate(req.params.id, { $inc: { downloads: 1 } }, { new: true });
  if (!item) return res.status(404).json({ message: "Book not found" });
  const fileUrl = item.fileUrl || item.previewUrl;
  if (!fileUrl) return res.status(404).json({ message: "This document is currently unavailable. Please contact the institute administration." });
  res.redirect(fileUrl);
}

export async function trackResourceView(req, res) {
  const item = await Resource.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } }, { new: true });
  if (!item) return res.status(404).json({ message: "Resource not found" });
  res.json({ item });
}

export async function trackResourceDownload(req, res) {
  const item = await Resource.findByIdAndUpdate(req.params.id, { $inc: { downloads: 1 } }, { new: true });
  if (!item) return res.status(404).json({ message: "Resource not found" });
  const fileUrl = item.fileUrl || item.previewUrl;
  if (!fileUrl) return res.status(404).json({ message: "This document is currently unavailable. Please contact the institute administration." });
  res.redirect(fileUrl);
}

export async function viewSyllabus(req, res) {
  const item = await Syllabus.findById(req.params.id).lean();
  if (!item) return res.status(404).json({ message: "Syllabus not found" });
  res.json({ item });
}

export async function uploadResource(req, res) {
  const metadata = await inspectUploadedDocument(req.file);
  const file = req.file ? await uploadToCloudinary(req.file, "darsgah/resources") : null;
  const fileUrl = file?.url || req.body.fileUrl || "";
  const item = await Resource.create({
    title: req.body.title,
    category: req.body.category || "Other",
    description: req.body.description,
    classId: req.body.classId || undefined,
    className: req.body.className,
    subjectId: req.body.subjectId || req.body.subject || undefined,
    externalUrl: req.body.externalUrl,
    isFeatured: req.body.isFeatured === "true" || req.body.isFeatured === true,
    displayOrder: Number(req.body.displayOrder || 0),
    fileType: req.body.fileType || (file?.mimeType?.split("/")[1] || "pdf"),
    fileUrl,
    previewUrl: fileUrl || req.body.previewUrl,
    thumbnailUrl: req.body.thumbnailUrl || pdfThumbnailUrl(fileUrl),
    fileSize: formatFileSize(metadata.fileSizeBytes) || req.body.fileSize,
    ...metadata,
    fileAvailable: Boolean(fileUrl),
    uploadedBy: req.user?.name || "Admin",
    uploadDate: new Date(),
    isPublic: req.body.isPublic !== "false",
    published: req.body.published !== "false"
  });
  res.status(201).json({ message: "Resource uploaded", item });
}

export async function uploadBook(req, res) {
  const pdfUpload = req.files?.pdf?.[0];
  const metadata = await inspectUploadedDocument(pdfUpload);
  const pdfFile = pdfUpload ? await uploadToCloudinary(pdfUpload, "darsgah/books") : null;
  const coverFile = req.files?.cover?.[0] ? await uploadToCloudinary(req.files.cover[0], "darsgah/book-covers") : null;
  if (!pdfFile && !req.body.externalUrl) return res.status(422).json({ message: "Upload a PDF or provide an external website link" });
  const fileUrl = pdfFile?.url || req.body.fileUrl || "";
  const generatedCover = pdfThumbnailUrl(fileUrl);
  const item = await Book.create({
    title: req.body.title,
    author: req.body.author,
    publisher: req.body.publisher,
    description: req.body.description,
    category: req.body.category || "Quran",
    language: req.body.language || "Urdu",
    classId: req.body.classId || undefined,
    className: req.body.className,
    subjectId: req.body.subjectId || req.body.subject || undefined,
    externalUrl: req.body.externalUrl,
    isFeatured: req.body.isFeatured === "true" || req.body.isFeatured === true,
    displayOrder: Number(req.body.displayOrder || 0),
    fileUrl,
    previewUrl: fileUrl || req.body.previewUrl,
    fileSize: formatFileSize(metadata.fileSizeBytes) || req.body.fileSize,
    coverUrl: coverFile?.url || req.body.coverUrl || generatedCover,
    thumbnailUrl: coverFile?.url || req.body.thumbnailUrl || generatedCover,
    pages: metadata.pageCount,
    ...metadata,
    fileAvailable: Boolean(fileUrl || req.body.externalUrl),
    isPublic: req.body.isPublic !== "false",
    published: req.body.published !== "false"
  });
  res.status(201).json({ message: "Book uploaded", item });
}
