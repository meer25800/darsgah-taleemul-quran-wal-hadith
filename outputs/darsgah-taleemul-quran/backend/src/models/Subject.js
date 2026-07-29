import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: "ClassRoom" },
    className: String,
    teacher: String,
    maxMarks: { type: Number, default: 100 }
  },
  { timestamps: true }
);

export default mongoose.model("Subject", subjectSchema);
