import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    date: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    checkInAt: { type: Date, default: null },
    checkOutAt: { type: Date, default: null },
    breaks: {
      type: [
        {
          startAt: { type: Date, required: true },
          endAt: { type: Date, required: true },
        },
      ],
      default: [],
    },
    breakStartAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ["Present", "Absent", "Half-day", "Leave"],
      default: "Present",
    },
    leaveType: {
      type: String,
      enum: ["Paid", "Sick", "Unpaid"],
      default: null,
    },
  },
  { timestamps: true }
);

attendanceSchema.index({ user: 1, date: 1 }, { unique: true });

const Attendance =
  mongoose.models.Attendance || mongoose.model("Attendance", attendanceSchema);

export default Attendance;
