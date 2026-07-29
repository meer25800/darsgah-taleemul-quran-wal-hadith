import Parent from "../models/Parent.js";
import { Notice } from "../models/Content.js";
import { buildStudentSummary, gradeCardPdf, idCardPdf } from "../services/report.service.js";
import { Assignment, Announcement, Syllabus, Timetable } from "../models/ErpModels.js";
import Fee from "../models/Fee.js";

export async function parentDashboard(req, res) {
  const parent = await Parent.findById(req.user.parentId).populate("students").lean();
  if (!parent) return res.status(404).json({ message: "Parent not found" });
  const children = await Promise.all(parent.students.map(async (student) => {
    const classMatch = student.classId ? { $or: [{ classId: student.classId }, { className: student.className }] } : { className: student.className };
    const sectionMatch = { $or: [{ section: student.section }, { section: null }, { section: "" }] };
    return {
      student,
      summary: await buildStudentSummary(student),
      assignments: await Assignment.find({ className: student.className, section: student.section }).sort("-createdAt").limit(10).lean(),
      syllabus: await Syllabus.find({ $and: [classMatch, sectionMatch], isPublished: { $ne: false } }).sort("-createdAt").limit(20).lean(),
      timetable: await Timetable.find({ $and: [classMatch, { section: student.section }] }).populate("subject", "name").populate("faculty", "name").sort("day startTime").lean(),
      fees: await Fee.find({ student: student._id }).sort("-month").limit(24).lean()
    };
  }));
  const notices = await Notice.find({ audience: { $in: ["parent", "all"] } }).sort("-createdAt").limit(10).lean();
  const announcements = await Announcement.find({ isPublished: { $ne: false }, audience: { $in: ["parent", "all", "everyone"] } }).sort("-createdAt").limit(10).lean();
  res.json({ parent, children, notices, announcements, teacherRemarks: "Regular recitation practice is encouraged at home." });
}

async function linkedChild(req, res) {
  const parent = await Parent.findById(req.user.parentId).populate("students");
  if (!parent) {
    res.status(404).json({ message: "Parent not found" });
    return null;
  }
  const student = parent.students.find((item) => String(item._id) === String(req.params.studentId));
  if (!student) {
    res.status(403).json({ message: "This child is not linked with your parent account" });
    return null;
  }
  return student;
}

export async function childGradeCard(req, res) {
  const student = await linkedChild(req, res);
  if (student) await gradeCardPdf(student, res);
}

export async function childIdCard(req, res) {
  const student = await linkedChild(req, res);
  if (student) await idCardPdf(student, res);
}
