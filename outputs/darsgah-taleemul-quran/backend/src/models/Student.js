import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    rollNumber: { type: String, required: true, unique: true },
    admissionNumber: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    nameUrdu: String,
    fatherName: { type: String, required: true },
    motherName: String,
    classId: { type: mongoose.Schema.Types.ObjectId, ref: "ClassRoom" },
    className: { type: String, required: true },
    section: { type: String, default: "A" },
    dob: Date,
    gender: { type: String, enum: ["Male", "Female", "Other"], default: "Male" },
    contact: String,
    address: String,
    photoUrl: String,
    subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: "Subject" }],
    admissionDate: { type: Date, default: Date.now },
    status: { type: String, enum: ["active", "inactive", "passed_out"], default: "active" }
  },
  { timestamps: true }
);

export default mongoose.model("Student", studentSchema);
