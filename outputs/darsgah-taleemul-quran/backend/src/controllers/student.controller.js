import Student from "../models/Student.js";
import { Notice } from "../models/Content.js";
import { buildStudentSummary, gradeCardPdf, idCardPdf } from "../services/report.service.js";
import { Assignment, Syllabus, Timetable, Event, Announcement } from "../models/ErpModels.js";
import Fee from "../models/Fee.js";

export async function myDashboard(req, res) {
  const student = await Student.findById(req.user.studentId).populate("subjects").lean();
  if (!student) return res.status(404).json({ message: "Student not found" });
  const summary = await buildStudentSummary(student);
  const classMatch = student.classId ? { $or: [{ classId: student.classId }, { className: student.className }] } : { className: student.className };
  const sectionMatch = { $or: [{ section: student.section }, { section: null }, { section: "" }] };
  const [notices, assignments, syllabus, timetable, events, announcements, fees] = await Promise.all([
    Notice.find({ audience: { $in: ["student", "all"] } }).sort("-createdAt").limit(10).lean(),
    Assignment.find({ className: student.className, section: student.section }).sort("-createdAt").limit(20).lean(),
    Syllabus.find({ $and: [classMatch, sectionMatch], isPublished: { $ne: false } }).sort("-createdAt").limit(20).lean(),
    Timetable.find({ $and: [classMatch, { section: student.section }] }).populate("subject", "name").populate("faculty", "name").sort("day startTime").lean(),
    Event.find({ audience: { $in: ["student", "all", "public"] } }).sort("-createdAt").limit(10).lean(),
    Announcement.find({ isPublished: { $ne: false }, $or: [{ audience: { $in: ["student", "all", "everyone"] } }, { className: student.className }] }).sort("-createdAt").limit(10).lean(),
    Fee.find({ student: student._id }).sort("-month").limit(24).lean()
  ]);
  res.json({ student, ...summary, notices, assignments, syllabus, timetable, events, announcements, fees });
}

export async function downloadGradeCard(req, res) {
  const student = await Student.findById(req.user.studentId);
  if (!student) return res.status(404).json({ message: "Student not found" });
  await gradeCardPdf(student, res);
}

export async function downloadIdCard(req, res) {
  const student = await Student.findById(req.user.studentId);
  if (!student) return res.status(404).json({ message: "Student not found" });
  await idCardPdf(student, res);
}
