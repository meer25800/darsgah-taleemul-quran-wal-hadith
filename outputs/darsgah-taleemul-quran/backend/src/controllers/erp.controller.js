import { validationResult } from "express-validator";
import mongoose from "mongoose";
import qrcode from "qrcode";
import Student from "../models/Student.js";
import Parent from "../models/Parent.js";
import Subject from "../models/Subject.js";
import Mark from "../models/Mark.js";
import Attendance from "../models/Attendance.js";
import Fee from "../models/Fee.js";
import User from "../models/User.js";
import { Admission, Book, ContactMessage, Gallery, Notice, Resource, Video } from "../models/Content.js";
import { Announcement, Assignment, ClassRoom, Event, Faculty, GradeCard, IdCard, LeaveRequest, Notification, Result, Setting, Syllabus, Timetable } from "../models/ErpModels.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import { buildStudentSummary } from "../services/report.service.js";

const registry = {
  students: Student,
  parents: Parent,
  faculty: Faculty,
  classes: ClassRoom,
  subjects: Subject,
  marks: Mark,
  attendance: Attendance,
  fees: Fee,
  books: Book,
  resources: Resource,
  gallery: Gallery,
  galleryPhotos: Gallery,
  videos: Video,
  events: Event,
  notices: Notice,
  admissions: Admission,
  contactMessages: ContactMessage,
  timetable: Timetable,
  syllabus: Syllabus,
  assignments: Assignment,
  results: Result,
  gradecards: GradeCard,
  idcards: IdCard,
  announcements: Announcement,
  settings: Setting,
  notifications: Notification,
  leaveRequests: LeaveRequest
};

const allowedClasses = Array.from({ length: 8 }, (_, index) => `Class ${index + 1}`);
const dayOptions = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function normalizeClassName(value = "") {
  const raw = String(value || "").trim();
  const digit = raw.match(/[1-8]/)?.[0];
  if (digit) return `Class ${digit}`;
  return allowedClasses.includes(raw) ? raw : raw;
}

function assertClassName(value) {
  const className = normalizeClassName(value);
  if (!allowedClasses.includes(className)) {
    const error = new Error("Class must be Class 1 to Class 8");
    error.statusCode = 422;
    throw error;
  }
  return className;
}

function minutes(value = "") {
  const [h, m] = String(value).split(":").map(Number);
  return h * 60 + (m || 0);
}

function overlaps(aStart, aEnd, bStart, bEnd) {
  return minutes(aStart) < minutes(bEnd) && minutes(bStart) < minutes(aEnd);
}

async function resolveClass({ classId, className, name, section = "A" }, { create = false } = {}) {
  if (classId && mongoose.isValidObjectId(classId)) {
    const found = await ClassRoom.findById(classId);
    if (found) return found;
  }
  const normalized = assertClassName(className || name);
  const cleanSection = section || "A";
  let found = await ClassRoom.findOne({ name: normalized, section: cleanSection });
  if (!found && create) {
    found = await ClassRoom.create({ name: normalized, section: cleanSection, academicSession: "2026-2027", capacity: 30 });
  }
  if (!found) {
    const error = new Error(`Create ${normalized} - ${cleanSection} in Manage Classes first`);
    error.statusCode = 422;
    throw error;
  }
  return found;
}

function feeStatus(amount, paidAmount, requested) {
  if (requested === "waived") return "waived";
  const total = Number(amount) || 0;
  const paid = Number(paidAmount) || 0;
  if (paid >= total && total > 0) return "paid";
  if (paid > 0) return "partial";
  return "pending";
}

function modelFor(name) {
  const model = registry[name];
  if (!model) {
    const error = new Error(`Unknown ERP resource: ${name}`);
    error.statusCode = 404;
    throw error;
  }
  return model;
}

export async function listResource(req, res) {
  const Model = modelFor(req.params.resource);
  const limit = Math.min(Number(req.query.limit) || 25, 100);
  const page = Math.max(Number(req.query.page) || 1, 1);
  const q = req.query.q;
  const filter = {};
  if (q) {
    filter.$or = ["name", "title", "rollNumber", "admissionNumber", "phone", "email"].map((field) => ({ [field]: new RegExp(q, "i") }));
  }
  ["className", "section", "day", "status", "month", "uploadType", "academicYear", "audience", "priority"].forEach((key) => {
    if (req.query[key]) filter[key] = key === "className" ? normalizeClassName(req.query[key]) : req.query[key];
  });
  if (req.query.subject) filter.subject = req.query.subject;
  let query = Model.find(filter).sort("-createdAt").skip((page - 1) * limit).limit(limit);
  if (req.params.resource === "fees") query = query.populate("student", "name admissionNumber rollNumber className section photoUrl");
  if (req.params.resource === "timetable") query = query.populate("subject", "name").populate("faculty", "name").populate("classId", "name section");
  if (req.params.resource === "syllabus") query = query.populate("subject", "name").populate("classId", "name section");
  if (req.params.resource === "classes") query = query.populate("classTeacher", "name");
  const [rawItems, total] = await Promise.all([
    query.lean(),
    Model.countDocuments(filter)
  ]);
  let items = rawItems;
  if (req.params.resource === "classes") {
    const counts = await Student.aggregate([{ $group: { _id: { classId: "$classId", className: "$className", section: "$section" }, count: { $sum: 1 } } }]);
    items = rawItems.map((item) => {
      const count = counts.find((entry) => String(entry._id.classId || "") === String(item._id) || (entry._id.className === item.name && entry._id.section === item.section));
      return { ...item, currentStudentCount: count?.count || 0 };
    });
  }
  res.json({ items, total, page, pages: Math.ceil(total / limit) });
}

export async function getResource(req, res) {
  const Model = modelFor(req.params.resource);
  const item = await Model.findById(req.params.id).lean();
  if (!item) return res.status(404).json({ message: "Record not found" });
  res.json({ item });
}

export async function createResource(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
  const item = await saveStructuredResource(req.params.resource, req.body, req.user);
  res.status(201).json({ message: "Saved", item });
}

export async function updateResource(req, res) {
  const Model = modelFor(req.params.resource);
  let item;
  if (["classes", "students", "timetable", "fees", "attendance", "results", "announcements", "admissions"].includes(req.params.resource)) {
    item = await saveStructuredResource(req.params.resource, req.body, req.user, req.params.id);
  } else {
    item = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  }
  if (!item) return res.status(404).json({ message: "Record not found" });
  res.json({ message: "Updated", item });
}

export async function deleteResource(req, res) {
  const Model = modelFor(req.params.resource);
  await Model.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
}

async function saveStructuredResource(resource, body, user, id) {
  if (resource === "classes") {
    const name = assertClassName(body.name || body.className);
    const section = body.section || "A";
    if (!body.academicSession) throw Object.assign(new Error("Academic year is required"), { statusCode: 422 });
    const duplicate = await ClassRoom.findOne({ name, section, ...(id ? { _id: { $ne: id } } : {}) });
    if (duplicate) throw Object.assign(new Error("This class and section already exists"), { statusCode: 409 });
    return id
      ? ClassRoom.findByIdAndUpdate(id, { name, section, academicSession: body.academicSession, capacity: Number(body.capacity || 0), status: body.status || "active" }, { new: true, runValidators: true })
      : ClassRoom.create({ name, section, academicSession: body.academicSession, capacity: Number(body.capacity || 0), status: body.status || "active" });
  }

  if (resource === "students") {
    const classDoc = await resolveClass(body, { create: true });
    const payload = { ...body, classId: classDoc._id, className: classDoc.name, section: classDoc.section };
    return id ? Student.findByIdAndUpdate(id, payload, { new: true, runValidators: true }) : Student.create(payload);
  }

  if (resource === "timetable") {
    const classDoc = await resolveClass(body);
    if (!body.subject) throw Object.assign(new Error("Subject is required"), { statusCode: 422 });
    if (!body.faculty) throw Object.assign(new Error("Faculty is required"), { statusCode: 422 });
    if (!dayOptions.includes(body.day)) throw Object.assign(new Error("Day is required"), { statusCode: 422 });
    if (!body.startTime || !body.endTime || minutes(body.endTime) <= minutes(body.startTime)) {
      throw Object.assign(new Error("Start time and end time are required"), { statusCode: 422 });
    }
    const clash = await Timetable.findOne({
      _id: id ? { $ne: id } : { $exists: true },
      classId: classDoc._id,
      section: classDoc.section,
      day: body.day,
      $or: [{ subject: body.subject }, { faculty: body.faculty }, { room: body.room }]
    }).lean();
    if (clash && overlaps(body.startTime, body.endTime, clash.startTime, clash.endTime)) {
      throw Object.assign(new Error("Timetable period overlaps with an existing class, faculty, subject, or room entry"), { statusCode: 409 });
    }
    const payload = {
      classId: classDoc._id,
      className: classDoc.name,
      section: classDoc.section,
      subject: body.subject,
      faculty: body.faculty,
      day: body.day,
      startTime: body.startTime,
      endTime: body.endTime,
      room: body.room
    };
    return id ? Timetable.findByIdAndUpdate(id, payload, { new: true, runValidators: true }) : Timetable.create(payload);
  }

  if (resource === "fees") {
    if (!body.student) throw Object.assign(new Error("Student is required"), { statusCode: 422 });
    if (!body.month) throw Object.assign(new Error("Fee month is required"), { statusCode: 422 });
    const student = await Student.findById(body.student).lean();
    if (!student) throw Object.assign(new Error("Student not found"), { statusCode: 404 });
    const amount = Number(body.amount || 0);
    const paidAmount = Number(body.paidAmount || 0);
    const payload = {
      student: student._id,
      classId: student.classId,
      className: student.className,
      month: body.month,
      amount,
      paidAmount,
      balance: Math.max(0, amount - paidAmount),
      paymentDate: body.paymentDate || undefined,
      paymentMethod: body.paymentMethod,
      receiptNumber: body.receiptNumber,
      remarks: body.remarks,
      status: feeStatus(amount, paidAmount, body.status)
    };
    const duplicate = await Fee.findOne({ student: student._id, month: body.month, ...(id ? { _id: { $ne: id } } : {}) });
    if (duplicate) throw Object.assign(new Error("Fee record already exists for this student and month"), { statusCode: 409 });
    return id ? Fee.findByIdAndUpdate(id, payload, { new: true, runValidators: true }) : Fee.create(payload);
  }

  if (resource === "attendance") {
    const classDoc = await resolveClass(body);
    if (!body.student || !body.subject || !body.date || !body.status) throw Object.assign(new Error("Student, subject, date and status are required"), { statusCode: 422 });
    const payload = {
      student: body.student,
      subject: body.subject,
      classId: classDoc._id,
      className: classDoc.name,
      section: classDoc.section,
      faculty: body.faculty,
      date: new Date(body.date),
      status: body.status,
      note: body.note
    };
    return Attendance.findOneAndUpdate({ student: body.student, subject: body.subject, date: payload.date }, payload, { upsert: true, new: true, setDefaultsOnInsert: true });
  }

  if (resource === "results") {
    const classDoc = await resolveClass(body);
    const subjects = Array.isArray(body.subjects) ? body.subjects : [];
    const total = subjects.reduce((sum, item) => sum + Number(item.obtainedMarks || 0), 0);
    const maxMarks = subjects.reduce((sum, item) => sum + Number(item.maxMarks || 0), 0) || Number(body.maxMarks || 100);
    const percentage = Math.round((total / maxMarks) * 100);
    const grade = percentage >= 90 ? "A+" : percentage >= 80 ? "A" : percentage >= 70 ? "B" : percentage >= 60 ? "C" : "D";
    const payload = { ...body, classId: classDoc._id, className: classDoc.name, section: classDoc.section, total, maxMarks, percentage, grade, status: percentage >= 40 ? "pass" : "fail", generatedBy: user._id };
    return id ? Result.findByIdAndUpdate(id, payload, { new: true, runValidators: true }) : Result.create(payload);
  }

  if (resource === "announcements") {
    const payload = { ...body, body: body.body || body.message, message: body.message || body.body, sentBy: user._id };
    if (payload.className) {
      const classDoc = await resolveClass(payload);
      payload.classId = classDoc._id;
      payload.className = classDoc.name;
    }
    return id ? Announcement.findByIdAndUpdate(id, payload, { new: true, runValidators: true }) : Announcement.create(payload);
  }

  if (resource === "admissions") {
    const applicationId = body.applicationId || `ADM-${Date.now()}`;
    const payload = { ...body, applicationId, className: normalizeClassName(body.classApplyingFor || body.className), classApplyingFor: normalizeClassName(body.classApplyingFor || body.className) };
    return id ? Admission.findByIdAndUpdate(id, payload, { new: true, runValidators: true }) : Admission.create(payload);
  }

  const Model = modelFor(resource);
  return id ? Model.findByIdAndUpdate(id, body, { new: true, runValidators: true }) : Model.create(body);
}

export async function uploadFile(req, res) {
  const file = await uploadToCloudinary(req.file, req.body.folder || "darsgah");
  res.status(201).json({ message: "Uploaded", file });
}

export async function uploadSyllabus(req, res) {
  const uploadType = req.body.uploadType || "complete-class";
  const classDoc = await resolveClass(req.body, { create: true });
  if (!req.body.title) return res.status(422).json({ message: "Title is required" });
  if (uploadType === "complete-class" && !req.files?.length) return res.status(422).json({ message: "Upload one PDF or one/more JPG/PNG syllabus images" });
  if (uploadType === "subject-wise" && !req.body.textContent) return res.status(422).json({ message: "Subject-wise syllabus content is required" });
  const duplicateFilter = {
    classId: classDoc._id,
    section: classDoc.section,
    subject: req.body.subject || undefined,
    uploadType,
    academicYear: req.body.academicYear || "2026-2027",
    title: req.body.title
  };
  const duplicate = await Syllabus.findOne(duplicateFilter).lean();
  if (duplicate) return res.status(409).json({ message: "A syllabus record with this class, subject, type, year, and title already exists" });
  const files = [];
  for (const localFile of req.files || []) {
    files.push(await uploadToCloudinary(localFile, "darsgah/syllabus"));
  }
  const firstFile = files[0];
  const type = firstFile?.mimeType?.startsWith("image/") ? "image" : "pdf";
  const syllabus = await Syllabus.create({
    title: req.body.title,
    classId: classDoc._id,
    className: classDoc.name,
    section: classDoc.section,
    subject: req.body.subject || undefined,
    subjectName: req.body.subjectName,
    category: req.body.category || "Quran",
    description: req.body.description,
    uploadType,
    textContent: req.body.textContent,
    fileUrl: firstFile?.url,
    fileType: firstFile?.mimeType,
    files,
    academicYear: req.body.academicYear || "2026-2027",
    isPublished: req.body.isPublished !== "false",
    type,
    file: firstFile,
    uploadedBy: req.user._id,
    uploadDate: new Date(),
    isPublic: req.body.isPublic !== "false"
  });
  res.status(201).json({ message: "Syllabus uploaded", syllabus });
}

export async function saveCredentials(req, res) {
  const { role, ownerId, username, email, name, phone, permissionGroup, password, confirmPassword, isActive = true, mustChangePassword = false } = req.body;
  if (!["student", "parent", "faculty", "admin"].includes(role)) return res.status(422).json({ message: "Role must be student, parent, faculty, or admin" });
  if (role === "admin") {
    if (req.user.role !== "super_admin") return res.status(403).json({ message: "Only the super administrator can manage administrator accounts." });
    const normalizedEmail = String(email || username || "").toLowerCase().trim().replace(/,/g, ".");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) return res.status(422).json({ message: "Valid admin email is required" });
    if (password !== confirmPassword) return res.status(422).json({ message: "Passwords do not match" });
    if (password && password.length < 8) return res.status(422).json({ message: "Admin password must be at least 8 characters" });
    let user = await User.findOne({ username: normalizedEmail, role: { $in: ["admin", "super_admin"] } }).select("+password");
    if (!user && !password) return res.status(422).json({ message: "Temporary password is required for a new admin" });
    if (user?.role === "super_admin" && normalizedEmail === "aamirmir08@gmail.com" && isActive === false) return res.status(422).json({ message: "The primary super administrator cannot be deactivated." });
    if (!user) user = new User({ role: "admin", username: normalizedEmail, email: normalizedEmail, name: name || normalizedEmail, createdBy: req.user._id });
    user.name = name || user.name || normalizedEmail;
    user.email = normalizedEmail;
    user.username = normalizedEmail;
    user.isActive = Boolean(isActive);
    user.mustChangePassword = Boolean(mustChangePassword);
    user.permissionGroup = permissionGroup || "standard";
    if (phone) user.phone = phone;
    if (password) user.password = password;
    await user.save();
    await Notification.create({ title: "Administrator credentials updated", body: `${user.username} was updated by ${req.user.username}.`, role: "super_admin", sentBy: req.user._id });
    return res.json({ message: "Administrator credentials saved securely", temporaryPassword: password || undefined, user: { id: user._id, username: user.username, email: user.email, name: user.name, role: user.role, isActive: user.isActive, mustChangePassword: user.mustChangePassword } });
  }
  if (!ownerId || !username) return res.status(422).json({ message: "Select user and enter username" });
  if (password && password !== confirmPassword) return res.status(422).json({ message: "Passwords do not match" });
  if (password && password.length < 6) return res.status(422).json({ message: "Password must be at least 6 characters" });

  const ownerField = role === "student" ? "studentId" : role === "parent" ? "parentId" : "facultyId";
  const ownerModel = role === "student" ? Student : role === "parent" ? Parent : Faculty;
  const owner = await ownerModel.findById(ownerId).lean();
  if (!owner) return res.status(404).json({ message: "Selected user not found" });

  const normalizedUsername = String(username).toLowerCase().trim();
  let user = await User.findOne({ role, [ownerField]: ownerId }).select("+password");
  const usernameOwner = await User.findOne({ username: normalizedUsername, role }).lean();
  if (usernameOwner && (!user || String(usernameOwner._id) !== String(user._id))) {
    return res.status(409).json({ message: "Username is already assigned to another account" });
  }
  if (!user) user = new User({ role, [ownerField]: ownerId, name: owner.name || owner.fatherName || normalizedUsername });
  user.username = normalizedUsername;
  user.name = owner.name || owner.fatherName || normalizedUsername;
  user.isActive = Boolean(isActive);
  user.mustChangePassword = Boolean(mustChangePassword);
  if (password) user.password = password;
  await user.save();
  res.json({ message: "Credentials saved securely", temporaryPassword: password || undefined, user: { id: user._id, username: user.username, role: user.role, isActive: user.isActive, mustChangePassword: user.mustChangePassword } });
}

export async function listAccounts(req, res) {
  const filter = {};
  if (req.query.role === "admin") filter.role = { $in: ["admin", "super_admin"] };
  else if (req.query.role) filter.role = req.query.role;
  if (req.query.q) {
    filter.$or = [
      { username: new RegExp(req.query.q, "i") },
      { name: new RegExp(req.query.q, "i") }
    ];
  }
  const items = await User.find(filter)
    .populate("studentId", "name rollNumber admissionNumber className section photoUrl")
    .populate("parentId", "name phone email students")
    .populate("facultyId", "name employeeId designation qualification photoUrl")
    .sort("role username")
    .limit(Math.min(Number(req.query.limit) || 100, 200))
    .lean();
  res.json({
    items: items.map((item) => ({
      _id: item._id,
      name: item.name,
      username: item.username,
      email: item.email,
      role: item.role,
      isActive: item.isActive,
      mustChangePassword: item.mustChangePassword,
      createdBy: item.createdBy,
      lastLoginAt: item.lastLoginAt,
      student: item.studentId,
      parent: item.parentId,
      faculty: item.facultyId,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    }))
  });
}

export async function generateLogin(req, res) {
  const { role, ownerId, username, password, name } = req.body;
  const payload = { name, username, password, role };
  if (role === "student") payload.studentId = ownerId;
  if (role === "parent") payload.parentId = ownerId;
  if (role === "faculty") payload.facultyId = ownerId;
  const user = await User.create(payload);
  res.status(201).json({ message: "Login generated", user: { id: user._id, username: user.username, role: user.role } });
}

export async function facultyDashboard(req, res) {
  const faculty = await Faculty.findById(req.user.facultyId).populate("assignedSubjects").lean();
  const normalizedAssignedClasses = (faculty?.assignedClasses || []).map(normalizeClassName).filter((item) => allowedClasses.includes(item));
  const classQuery = faculty?.assignedClassRefs?.length
    ? { _id: { $in: faculty.assignedClassRefs } }
    : normalizedAssignedClasses.length
      ? { name: { $in: normalizedAssignedClasses } }
      : { name: { $in: allowedClasses } };
  const classes = await ClassRoom.find(classQuery).sort("name section").lean();
  const classIds = classes.map((item) => item._id);
  const classNames = classes.map((item) => item.name);
  const studentFilter = classIds.length
    ? { $or: [{ classId: { $in: classIds } }, { className: { $in: classNames } }] }
    : {};
  const [students, subjects, timetable, assignments, syllabus, notices] = await Promise.all([
    Student.find(studentFilter).sort("className section rollNumber").lean(),
    Subject.find().sort("name").lean(),
    Timetable.find({ $or: [{ faculty: req.user.facultyId }, { classId: { $in: classIds } }] }).populate("subject", "name").lean(),
    Assignment.find({ faculty: req.user.facultyId }).sort("-createdAt").limit(20).lean(),
    Syllabus.find({ isPublished: { $ne: false }, $or: [{ classId: { $in: classIds } }, { className: { $in: classNames } }] }).sort("-createdAt").limit(50).lean(),
    Notice.find({ audience: { $in: ["faculty", "all"] } }).sort("-createdAt").limit(20).lean()
  ]);
  res.json({ faculty, classes, students, subjects, timetable, assignments, syllabus, notices });
}

export async function saveClassAttendance(req, res) {
  const { className, subject, date, records } = req.body;
  const classDoc = await resolveClass(req.body);
  if (!subject) return res.status(422).json({ message: "Subject is required" });
  if (!Array.isArray(records) || !records.length) return res.status(422).json({ message: "Select at least one student" });
  const attendanceDate = date ? new Date(date) : new Date();
  const docs = await Promise.all(records.map((record) => Attendance.findOneAndUpdate(
    { student: record.student, subject, date: attendanceDate },
    {
      student: record.student,
      subject,
      classId: classDoc._id,
      className: classDoc.name,
      section: classDoc.section,
      faculty: req.user.facultyId,
      date: attendanceDate,
      status: record.status,
      note: record.note
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  )));
  await Notification.create({ title: "Attendance updated", body: "Attendance has been saved.", role: "admin", sentBy: req.user._id });
  res.status(201).json({ message: "Attendance saved", count: docs.length });
}

export async function saveResultEntry(req, res) {
  const { student, subject, term, exam, obtainedMarks, maxMarks, remarks } = req.body;
  if (!["Term 1", "Term 2"].includes(term || exam)) return res.status(422).json({ message: "Only Term 1 and Term 2 are allowed" });
  const mark = await Mark.findOneAndUpdate(
    { student, subject, term: term || exam },
    { student, subject, term: term || exam, obtainedMarks, maxMarks, remarks },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  const summary = await buildStudentSummary({ _id: student });
  const result = await Result.create({
    student,
    exam,
    term,
    total: summary.total,
    maxMarks: summary.max,
    percentage: summary.percentage,
    grade: summary.grade,
    remarks,
    generatedBy: req.user._id
  });
  await Notification.create({ title: "Result updated", body: "New marks/result has been posted.", role: "student", sentBy: req.user._id });
  res.status(201).json({ message: "Result saved", mark, result });
}

function youtubeEmbed(url) {
  const raw = String(url || "");
  const match = raw.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{6,})/);
  const id = match?.[1];
  return {
    embedUrl: id ? `https://www.youtube.com/embed/${id}` : raw,
    thumbnailUrl: id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : ""
  };
}

export async function listGallery(req, res) {
  const limit = Math.min(Number(req.query.limit) || 12, 48);
  const page = Math.max(Number(req.query.page) || 1, 1);
  const filter = req.query.category ? { category: req.query.category } : {};
  const [items, total] = await Promise.all([
    Gallery.find(filter).sort("-createdAt").skip((page - 1) * limit).limit(limit).lean(),
    Gallery.countDocuments(filter)
  ]);
  res.json({ items, total, page, pages: Math.ceil(total / limit) });
}

export async function createGallery(req, res) {
  let imageUrl = req.body.imageUrl;
  let cloudinaryPublicId = req.body.cloudinaryPublicId;
  if (req.file) {
    const file = await uploadToCloudinary(req.file, "darsgah/gallery");
    imageUrl = file.url;
    cloudinaryPublicId = file.publicId;
  }
  const photo = await Gallery.create({ ...req.body, imageUrl, cloudinaryPublicId, isFeatured: req.body.isFeatured === "true" || req.body.isFeatured === true });
  res.status(201).json({ message: "Gallery photo saved", photo });
}

export async function updateGallery(req, res) {
  const photo = await Gallery.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!photo) return res.status(404).json({ message: "Photo not found" });
  res.json({ message: "Gallery photo updated", photo });
}

export async function deleteGallery(req, res) {
  await Gallery.findByIdAndDelete(req.params.id);
  res.json({ message: "Gallery photo deleted" });
}

export async function listVideos(req, res) {
  const filter = req.query.home === "true" ? { showOnHome: true } : {};
  const items = await Video.find(filter).sort("-createdAt").limit(Math.min(Number(req.query.limit) || 12, 48)).lean();
  res.json({ items });
}

export async function createVideo(req, res) {
  const converted = youtubeEmbed(req.body.youtubeUrl);
  const video = await Video.create({ ...req.body, ...converted, showOnHome: req.body.showOnHome !== false && req.body.showOnHome !== "false" });
  res.status(201).json({ message: "Video saved", video });
}

export async function updateVideo(req, res) {
  const converted = req.body.youtubeUrl ? youtubeEmbed(req.body.youtubeUrl) : {};
  const video = await Video.findByIdAndUpdate(req.params.id, { ...req.body, ...converted }, { new: true, runValidators: true });
  if (!video) return res.status(404).json({ message: "Video not found" });
  res.json({ message: "Video updated", video });
}

export async function deleteVideo(req, res) {
  await Video.findByIdAndDelete(req.params.id);
  res.json({ message: "Video deleted" });
}

export async function analytics(req, res) {
  const [students, parents, faculty, classes, books, resources, videos, gallery, notices, events, fees, admissions, attendance, results] = await Promise.all([
    Student.countDocuments({ status: "active" }),
    Parent.countDocuments(),
    Faculty.countDocuments({ status: "active" }),
    ClassRoom.countDocuments(),
    Book.countDocuments(),
    Resource.countDocuments(),
    Video.countDocuments(),
    Gallery.countDocuments(),
    Notice.countDocuments(),
    Event.countDocuments(),
    Fee.countDocuments({ status: { $in: ["pending", "partial"] } }),
    Admission.find().sort("-createdAt").limit(8).lean(),
    Attendance.find().lean(),
    Result.find().sort("-createdAt").limit(10).lean()
  ]);
  const present = attendance.filter((item) => item.status === "present").length;
  res.json({
    students,
    parents,
    faculty,
    classes,
    books,
    resources,
    videos,
    gallery,
    notices,
    events,
    pendingFees: fees,
    recentAdmissions: admissions,
    attendancePercentage: attendance.length ? Math.round((present / attendance.length) * 100) : 100,
    recentResults: results
  });
}

export async function studentPerformance(req, res) {
  const student = await Student.findById(req.params.id || req.user.studentId).lean();
  if (!student) return res.status(404).json({ message: "Student not found" });
  const summary = await buildStudentSummary(student);
  const subjectBars = summary.marks.map((mark) => ({
    subject: mark.subject?.name || "Subject",
    obtained: mark.obtainedMarks,
    max: mark.maxMarks
  }));
  const attendancePie = [
    { name: "Present", value: summary.attendancePercentage },
    { name: "Absent/Leave", value: Math.max(0, 100 - summary.attendancePercentage) }
  ];
  const progressLine = summary.marks.map((mark, index) => ({ month: `M${index + 1}`, percentage: Math.round((mark.obtainedMarks / mark.maxMarks) * 100) }));
  const qrCode = await qrcode.toDataURL(`${student.rollNumber}:${student.admissionNumber}`);
  res.json({ student, summary, charts: { subjectBars, attendancePie, progressLine }, qrCode });
}

export { registry };
