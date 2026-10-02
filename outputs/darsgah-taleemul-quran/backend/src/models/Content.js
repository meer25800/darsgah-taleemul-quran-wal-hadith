import mongoose from "mongoose";

const noticeSchema = new mongoose.Schema({
  title: String,
  body: String,
  audience: { type: String, enum: ["public", "student", "parent", "faculty", "admin", "all"], default: "public" },
  isImportant: { type: Boolean, default: false }
}, { timestamps: true });

const admissionSchema = new mongoose.Schema({
  applicationId: { type: String, unique: true, sparse: true },
  studentName: String,
  fatherName: String,
  guardianName: String,
  dob: Date,
  gender: String,
  address: String,
  phone: String,
  previousClass: String,
  className: String,
  classApplyingFor: String,
  admissionDate: Date,
  academicYear: String,
  photo: {
    url: String,
    publicId: String,
    mimeType: String,
    size: Number,
    originalName: String
  },
  birthCertificate: {
    url: String,
    publicId: String,
    mimeType: String,
    size: Number,
    originalName: String
  },
  qualificationDocument: {
    url: String,
    publicId: String,
    mimeType: String,
    size: Number,
    originalName: String
  },
  message: String,
  approvedStudent: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
  status: { type: String, enum: ["new", "reviewing", "accepted", "rejected", "pending", "approved", "waitlisted"], default: "pending" }
}, { timestamps: true });

const bookSchema = new mongoose.Schema({
  title: String,
  author: String,
  publisher: String,
  description: String,
  category: String,
  language: { type: String, default: "Urdu" },
  pages: Number,
  pageCount: Number,
  edition: String,
  fileSize: String,
  fileSizeBytes: Number,
  originalFilename: String,
  mimeType: String,
  fileAvailable: { type: Boolean, default: false },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: "ClassRoom" },
  className: String,
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: "Subject" },
  externalUrl: String,
  isFeatured: { type: Boolean, default: false },
  displayOrder: { type: Number, default: 0 },
  thumbnailUrl: String,
  coverUrl: String,
  fileUrl: String,
  previewUrl: String,
  views: { type: Number, default: 0 },
  downloads: { type: Number, default: 0 },
  bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  isPublic: { type: Boolean, default: true },
  published: { type: Boolean, default: true }
}, { timestamps: true });

bookSchema.index({ title: "text", author: "text", category: "text", description: "text" }, { default_language: "none", language_override: "textLanguage" });
bookSchema.index({ isPublic: 1, createdAt: -1 });

const resourceSchema = new mongoose.Schema({
  title: String,
  category: {
    type: String,
    enum: ["Quran", "Hadees", "Hadith", "Fiqh", "Aqeedah", "Seerah", "Seerat", "Arabic", "Tajweed", "Islamic History", "Islamic Etiquettes", "Duas", "Akhlaq", "Children Stories", "Islamic Quiz", "Daily Hadith", "Daily Ayah", "Prayer Timetable", "Ramadan", "Eid", "Islamic Calendar", "Other"],
    required: true
  },
  description: String,
  thumbnailUrl: String,
  previewUrl: String,
  fileUrl: String,
  classId: { type: mongoose.Schema.Types.ObjectId, ref: "ClassRoom" },
  className: String,
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: "Subject" },
  externalUrl: String,
  isFeatured: { type: Boolean, default: false },
  displayOrder: { type: Number, default: 0 },
  fileType: { type: String, enum: ["pdf", "image", "video", "ppt", "doc", "note", "worksheet", "audio", "link"], default: "pdf" },
  fileSize: String,
  fileSizeBytes: Number,
  pageCount: Number,
  originalFilename: String,
  mimeType: String,
  fileAvailable: { type: Boolean, default: false },
  uploadedBy: String,
  uploadDate: { type: Date, default: Date.now },
  views: { type: Number, default: 0 },
  downloads: { type: Number, default: 0 },
  isPublic: { type: Boolean, default: true },
  published: { type: Boolean, default: true }
}, { timestamps: true });

resourceSchema.index({ title: "text", category: "text", description: "text" }, { default_language: "none", language_override: "textLanguage" });
resourceSchema.index({ isPublic: 1, createdAt: -1 });

const gallerySchema = new mongoose.Schema({
  title: String,
  description: String,
  imageUrl: String,
  thumbnailUrl: String,
  cloudinaryPublicId: String,
  category: String,
  album: String,
  caption: String,
  eventDate: Date,
  displayOrder: { type: Number, default: 0 },
  uploadedBy: String,
  uploadDate: { type: Date, default: Date.now },
  views: { type: Number, default: 0 },
  isFeatured: { type: Boolean, default: false },
  published: { type: Boolean, default: true }
}, { timestamps: true });

gallerySchema.index({ category: 1, createdAt: -1 });
gallerySchema.index({ isFeatured: 1, createdAt: -1 });

const videoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  youtubeUrl: { type: String, required: true },
  videoType: { type: String, enum: ["YouTube", "MP4"], default: "YouTube" },
  youtubeVideoId: String,
  videoUrl: String,
  embedUrl: String,
  thumbnailUrl: String,
  description: String,
  category: String,
  duration: String,
  views: { type: Number, default: 0 },
  isFeatured: { type: Boolean, default: false },
  published: { type: Boolean, default: true },
  displayOrder: { type: Number, default: 0 },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: "ClassRoom" },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: "Subject" },
  showOnHome: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

videoSchema.index({ published: 1, showOnHome: 1, isFeatured: -1, displayOrder: 1 });
videoSchema.index({ category: 1, createdAt: -1 });
videoSchema.index({ youtubeVideoId: 1 }, { unique: true, sparse: true });

const contactSchema = new mongoose.Schema({
  name: String,
  phone: String,
  email: String,
  message: String,
  status: { type: String, enum: ["new", "read", "closed"], default: "new" }
}, { timestamps: true });

export const Notice = mongoose.model("Notice", noticeSchema);
export const Admission = mongoose.model("Admission", admissionSchema);
export const Book = mongoose.model("Book", bookSchema);
export const Resource = mongoose.model("Resource", resourceSchema);
export const Gallery = mongoose.model("Gallery", gallerySchema);
export const Video = mongoose.models.Video || mongoose.model("Video", videoSchema);
export const ContactMessage = mongoose.model("ContactMessage", contactSchema);
