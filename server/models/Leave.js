import mongoose from "mongoose";

const leaveSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["Paid", "Sick", "Unpaid"],
      required: true,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    days: { type: Number, default: 1 },
    remarks: { type: String, trim: true, default: "" },
    attachmentName: { type: String, trim: true, default: "" },
    attachmentUrl: { type: String, trim: true, default: "" },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
      index: true,
    },
    adminComment: { type: String, trim: true, default: "" },
    decidedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    decidedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const Leave = mongoose.models.Leave || mongoose.model("Leave", leaveSchema);

export default Leave;
