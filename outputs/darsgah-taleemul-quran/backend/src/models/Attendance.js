import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject" },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: "ClassRoom" },
    className: String,
    section: String,
    faculty: { type: mongoose.Schema.Types.ObjectId, ref: "Faculty" },
    date: { type: Date, required: true },
    status: { type: String, enum: ["present", "absent", "late", "leave"], required: true },
    note: String
  },
  { timestamps: true }
);

attendanceSchema.index({ student: 1, subject: 1, date: 1 }, { unique: true });
attendanceSchema.index({ className: 1, subject: 1, date: 1 });

export default mongoose.model("Attendance", attendanceSchema);
