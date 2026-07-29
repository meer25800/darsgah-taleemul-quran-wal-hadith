import mongoose from "mongoose";

const ref = (model) => ({ type: mongoose.Schema.Types.ObjectId, ref: model });
const fileSchema = new mongoose.Schema({
  url: String,
  publicId: String,
  mimeType: String,
  size: Number,
  originalName: String
}, { _id: false });

const facultySchema = new mongoose.Schema({
  employeeId: { type: String, unique: true, sparse: true },
  name: { type: String, required: true },
  fatherName: String,
  phone: String,
  email: { type: String, lowercase: true, trim: true },
  address: String,
  qualification: String,
  designation: String,
  photoUrl: String,
  assignedClasses: [String],
  assignedClassRefs: [ref("ClassRoom")],
  assignedSections: [String],
  assignedSubjects: [ref("Subject")],
  joiningDate: Date,
  isPublished: { type: Boolean, default: true },
  status: { type: String, enum: ["active", "inactive"], default: "active" }
}, { timestamps: true });

const classSchema = new mongoose.Schema({
  name: { type: String, required: true },
  section: { type: String, default: "A" },
  classTeacher: ref("Faculty"),
  subjects: [ref("Subject")],
  academicSession: String,
  capacity: Number,
  status: { type: String, enum: ["active", "inactive"], default: "active" }
}, { timestamps: true });

const timetableSchema = new mongoose.Schema({
  classId: ref("ClassRoom"),
  className: String,
  section: String,
  subject: ref("Subject"),
  faculty: ref("Faculty"),
  day: String,
  startTime: String,
  endTime: String,
  room: String,
  periods: [{
    startTime: String,
    endTime: String,
    subject: ref("Subject"),
    faculty: ref("Faculty"),
    room: String
  }]
}, { timestamps: true });

const syllabusSchema = new mongoose.Schema({
  title: { type: String, required: true },
  classId: ref("ClassRoom"),
  className: String,
  section: String,
  subject: ref("Subject"),
  subjectName: String,
  category: String,
  description: String,
  uploadType: { type: String, enum: ["complete-class", "subject-wise"], default: "complete-class" },
  textContent: String,
  fileUrl: String,
  fileType: String,
  files: [fileSchema],
  academicYear: String,
  isPublished: { type: Boolean, default: true },
  type: { type: String, enum: ["pdf", "image"], default: "pdf" },
  file: fileSchema,
  uploadedBy: ref("User"),
  uploadDate: { type: Date, default: Date.now },
  isPublic: { type: Boolean, default: true }
}, { timestamps: true });

const assignmentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  className: String,
  section: String,
  subject: ref("Subject"),
  faculty: ref("Faculty"),
  dueDate: Date,
  description: String,
  file: fileSchema,
  status: { type: String, enum: ["draft", "published"], default: "published" }
}, { timestamps: true });

const resultSchema = new mongoose.Schema({
  student: ref("Student"),
  classId: ref("ClassRoom"),
  className: String,
  section: String,
  exam: String,
  term: String,
  academicYear: String,
  subjects: [{
    subject: ref("Subject"),
    obtainedMarks: Number,
    maxMarks: Number,
    remarks: String
  }],
  total: Number,
  maxMarks: Number,
  percentage: Number,
  grade: String,
  status: { type: String, enum: ["pass", "fail"], default: "pass" },
  position: Number,
  rank: Number,
  classAverage: Number,
  remarks: String,
  isPublished: { type: Boolean, default: true },
  generatedBy: ref("User")
}, { timestamps: true });

const gradeCardSchema = new mongoose.Schema({
  student: ref("Student"),
  result: ref("Result"),
  pdfUrl: String,
  qrCode: String,
  generatedBy: ref("User"),
  generatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const idCardSchema = new mongoose.Schema({
  student: ref("Student"),
  pdfUrl: String,
  qrCode: String,
  issueDate: Date,
  expiryDate: Date,
  session: String,
  generatedBy: ref("User")
}, { timestamps: true });

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  date: Date,
  venue: String,
  audience: { type: String, enum: ["public", "student", "parent", "faculty", "all"], default: "public" },
  image: fileSchema
}, { timestamps: true });

const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  body: String,
  message: String,
  audience: { type: String, enum: ["everyone", "student", "parent", "faculty", "admin", "selected-class", "all"], default: "all" },
  classId: ref("ClassRoom"),
  className: String,
  priority: { type: String, enum: ["low", "normal", "high", "important", "urgent"], default: "normal" },
  publishDate: Date,
  expiryDate: Date,
  attachment: fileSchema,
  isPublished: { type: Boolean, default: true },
  sentBy: ref("User")
}, { timestamps: true });

const settingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: mongoose.Schema.Types.Mixed
}, { timestamps: true });

const notificationSchema = new mongoose.Schema({
  title: String,
  body: String,
  role: String,
  user: ref("User"),
  readAt: Date,
  sentBy: ref("User")
}, { timestamps: true });

const leaveRequestSchema = new mongoose.Schema({
  faculty: ref("Faculty"),
  from: Date,
  to: Date,
  reason: String,
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" }
}, { timestamps: true });

const galleryPhotoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  imageUrl: { type: String, required: true },
  cloudinaryPublicId: String,
  category: {
    type: String,
    enum: ["Events", "Classes", "Quran Competition", "Seerat Program", "Annual Result Day", "Institute Building"],
    default: "Events"
  },
  isFeatured: { type: Boolean, default: false }
}, { timestamps: true });

const videoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  youtubeUrl: { type: String, required: true },
  embedUrl: { type: String, required: true },
  thumbnailUrl: String,
  description: String,
  category: String,
  showOnHome: { type: Boolean, default: true }
}, { timestamps: true });

classSchema.index({ name: 1, section: 1 }, { unique: true });
timetableSchema.index({ classId: 1, section: 1, day: 1, startTime: 1, endTime: 1 });
syllabusSchema.index({ classId: 1, section: 1, subject: 1, uploadType: 1, academicYear: 1 });
syllabusSchema.index({ className: 1, isPublic: 1, createdAt: -1 });
galleryPhotoSchema.index({ isFeatured: 1, createdAt: -1 });
videoSchema.index({ showOnHome: 1, createdAt: -1 });

export const Faculty = mongoose.model("Faculty", facultySchema);
export const ClassRoom = mongoose.model("ClassRoom", classSchema);
export const Timetable = mongoose.model("Timetable", timetableSchema);
export const Syllabus = mongoose.model("Syllabus", syllabusSchema);
export const Assignment = mongoose.model("Assignment", assignmentSchema);
export const Result = mongoose.model("Result", resultSchema);
export const GradeCard = mongoose.model("GradeCard", gradeCardSchema);
export const IdCard = mongoose.model("IdCard", idCardSchema);
export const Event = mongoose.model("Event", eventSchema);
export const Announcement = mongoose.model("Announcement", announcementSchema);
export const Setting = mongoose.model("Setting", settingSchema);
export const Notification = mongoose.model("Notification", notificationSchema);
export const LeaveRequest = mongoose.model("LeaveRequest", leaveRequestSchema);
export const GalleryPhoto = mongoose.model("GalleryPhoto", galleryPhotoSchema);
export const Video = mongoose.models.Video || mongoose.model("Video", videoSchema);
