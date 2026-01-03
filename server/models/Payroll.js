import mongoose from "mongoose";

const payrollSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    month: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    grossPay: { type: Number, default: 0 },
    deductions: { type: Number, default: 0 },
    netPay: { type: Number, default: 0 },
    currency: { type: String, trim: true, default: "INR" },
    notes: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

payrollSchema.index({ user: 1, month: 1 }, { unique: true });

const Payroll = mongoose.models.Payroll || mongoose.model("Payroll", payrollSchema);

export default Payroll;
