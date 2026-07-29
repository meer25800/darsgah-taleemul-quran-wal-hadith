import dotenv from "dotenv";
import Student from "../models/Student.js";
import Subject from "../models/Subject.js";
import Attendance from "../models/Attendance.js";
import { ClassRoom, Faculty, Syllabus, Timetable } from "../models/ErpModels.js";
import { connectDB } from "../utils/db.js";

dotenv.config();

const allowedClasses = Array.from({ length: 8 }, (_, index) => `Class ${index + 1}`);

function normalizeClassName(value = "") {
  const raw = String(value || "").trim();
  const digit = raw.match(/[1-8]/)?.[0];
  return digit ? `Class ${digit}` : raw;
}

async function classRecord(className, section = "A") {
  const normalized = normalizeClassName(className);
  if (!allowedClasses.includes(normalized)) return null;
  return ClassRoom.findOneAndUpdate(
    { name: normalized, section: section || "A" },
    { name: normalized, section: section || "A", academicSession: "2026-2027", capacity: 30, status: "active" },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

async function run() {
  await connectDB();
  const students = await Student.find();
  for (const student of students) {
    const cls = await classRecord(student.className, student.section);
    if (cls) {
      student.classId = cls._id;
      student.className = cls.name;
      student.section = cls.section;
      await student.save();
    }
  }

  const subjects = await Subject.find();
  for (const subject of subjects) {
    const cls = await classRecord(subject.className || "Class 1", "A");
    if (cls) await Subject.updateOne({ _id: subject._id }, { classId: cls._id, className: cls.name });
  }

  const collections = [Attendance, Syllabus, Timetable];
  for (const Model of collections) {
    const records = await Model.find();
    for (const record of records) {
      const cls = await classRecord(record.className || "Class 1", record.section || "A");
      if (cls) await Model.updateOne({ _id: record._id }, { classId: cls._id, className: cls.name, section: cls.section });
    }
  }

  const faculty = await Faculty.find();
  for (const member of faculty) {
    const refs = [];
    const normalized = [];
    for (const item of member.assignedClasses || []) {
      const cls = await classRecord(item, "A");
      if (cls) {
        refs.push(cls._id);
        normalized.push(cls.name);
      }
    }
    member.assignedClassRefs = refs;
    member.assignedClasses = [...new Set(normalized)];
    await member.save();
  }

  console.log(`Class references normalized for ${students.length} students.`);
  process.exit(0);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
