import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    email: { type: String, lowercase: true, trim: true, sparse: true },
    password: { type: String, required: true, minlength: 6, select: false },
    role: { type: String, enum: ["super_admin", "admin", "student", "parent", "faculty"], required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: "Parent" },
    facultyId: { type: mongoose.Schema.Types.ObjectId, ref: "Faculty" },
    isActive: { type: Boolean, default: true },
    mustChangePassword: { type: Boolean, default: false },
    permissionGroup: { type: String, default: "standard" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    lastLoginAt: Date
  },
  { timestamps: true }
);

userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, Number(process.env.BCRYPT_ROUNDS) || 10);
  next();
});

userSchema.methods.matchPassword = function matchPassword(password) {
  return bcrypt.compare(password, this.password);
};

export default mongoose.model("User", userSchema);
