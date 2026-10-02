import { stringify } from "csv-stringify/sync";
import Student from "../models/Student.js";
import Subject from "../models/Subject.js";
import Mark from "../models/Mark.js";
import Attendance from "../models/Attendance.js";
import Fee from "../models/Fee.js";
import Parent from "../models/Parent.js";
import User from "../models/User.js";
import { Admission, Book, ContactMessage, Gallery, Notice, Resource } from "../models/Content.js";
import { gradeCardPdf, idCardPdf } from "../services/report.service.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";

export async function analytics(_req, res) {
  const [totalStudents, totalClasses, marks, recentAdmissions, pendingFees, attendance] = await Promise.all([
    Student.countDocuments({ status: "active" }),
    Student.distinct("className"),
    Mark.find().lean(),
    Admission.find().sort("-createdAt").limit(5).lean(),
    Fee.countDocuments({ status: { $in: ["pending", "partial"] } }),
    Attendance.find().lean()
  ]);
  const passPercentage = marks.length ? Math.round((marks.filter((m) => m.obtainedMarks >= 40).length / marks.length) * 100) : 100;
  const present = attendance.filter((item) => item.status === "present").length;
  const attendanceSummary = attendance.length ? Math.round((present / attendance.length) * 100) : 100;
  res.json({ totalStudents, totalClasses: totalClasses.length, passPercentage, recentAdmissions, pendingFees, attendanceSummary });
}

export async function listStudents(req, res) {
  const q = req.query.q ? { $or: [{ name: new RegExp(req.query.q, "i") }, { rollNumber: new RegExp(req.query.q, "i") }] } : {};
  const students = await Student.find(q).populate("subjects").sort("rollNumber").lean();
  res.json({ students });
}

export async function createStudent(req, res) {
  const student = await Student.create(req.body);
  res.status(201).json({ student });
}

export async function updateStudent(req, res) {
  const student = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json({ student });
}

export async function deleteStudent(req, res) {
  await Student.findByIdAndDelete(req.params.id);
  res.json({ message: "Student deleted" });
}

export async function uploadStudentPhoto(req, res) {
  if (!req.file) return res.status(422).json({ message: "Student photo is required" });
  const file = await uploadToCloudinary(req.file, "darsgah/students");
  const photoUrl = file.url;
  const student = await Student.findByIdAndUpdate(req.params.id, { photoUrl }, { new: true });
  if (!student) return res.status(404).json({ message: "Student not found" });
  res.json({ student });
}

export async function createParent(req, res) {
  const parent = await Parent.create(req.body);
  res.status(201).json({ parent });
}

export async function createSubject(req, res) {
  const subject = await Subject.create(req.body);
  res.status(201).json({ subject });
}

export async function addMark(req, res) {
  const mark = await Mark.create(req.body);
  res.status(201).json({ mark });
}

export async function updateAttendance(req, res) {
  const attendance = await Attendance.create(req.body);
  res.status(201).json({ attendance });
}

export async function upsertFee(req, res) {
  const fee = await Fee.create(req.body);
  res.status(201).json({ fee });
}

export async function createNotice(req, res) {
  const notice = await Notice.create(req.body);
  res.status(201).json({ notice });
}

export async function createBook(req, res) {
  const book = await Book.create(req.body);
  res.status(201).json({ book });
}

export async function createResource(req, res) {
  const resource = await Resource.create(req.body);
  res.status(201).json({ resource });
}

export async function createGalleryItem(req, res) {
  const gallery = await Gallery.create(req.body);
  res.status(201).json({ gallery });
}

export async function contactMessages(_req, res) {
  const messages = await ContactMessage.find().sort("-createdAt").lean();
  res.json({ messages });
}

export async function exportStudents(_req, res) {
  const students = await Student.find().lean();
  const csv = stringify(students.map((s) => ({
    rollNumber: s.rollNumber,
    admissionNumber: s.admissionNumber,
    name: s.name,
    fatherName: s.fatherName,
    className: s.className,
    section: s.section,
    contact: s.contact
  })), { header: true });
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=students.csv");
  res.send(csv);
}

export async function issueStudentLogin(req, res) {
  const { studentId, password } = req.body;
  const student = await Student.findById(studentId);
  const user = await User.create({ name: student.name, username: student.rollNumber.toLowerCase(), password, role: "student", studentId });
  res.status(201).json({ user: { id: user._id, username: user.username } });
}

export async function adminGradeCard(req, res) {
  const student = await Student.findById(req.params.id);
  if (!student) return res.status(404).json({ message: "Student not found" });
  await gradeCardPdf(student, res);
}

export async function adminIdCard(req, res) {
  const student = await Student.findById(req.params.id);
  if (!student) return res.status(404).json({ message: "Student not found" });
  await idCardPdf(student, res, { layout: req.query.layout });
}
