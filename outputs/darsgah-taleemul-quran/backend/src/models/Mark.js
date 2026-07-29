import mongoose from "mongoose";

const markSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
    term: { type: String, enum: ["Term 1", "Term 2"], required: true },
    obtainedMarks: { type: Number, required: true },
    maxMarks: { type: Number, default: 100 },
    remarks: String
  },
  { timestamps: true }
);

markSchema.index({ student: 1, term: 1 });
markSchema.index({ subject: 1, term: 1 });

export default mongoose.model("Mark", markSchema);
