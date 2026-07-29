import mongoose from "mongoose";

const feeSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: "ClassRoom" },
    className: String,
    month: String,
    amount: Number,
    paidAmount: { type: Number, default: 0 },
    balance: { type: Number, default: 0 },
    dueDate: Date,
    paymentDate: Date,
    paymentMethod: String,
    receiptNumber: String,
    remarks: String,
    status: { type: String, enum: ["paid", "pending", "partial", "waived"], default: "pending" }
  },
  { timestamps: true }
);

feeSchema.index({ student: 1, month: 1 }, { unique: true });
feeSchema.index({ className: 1, status: 1, month: 1 });

export default mongoose.model("Fee", feeSchema);
