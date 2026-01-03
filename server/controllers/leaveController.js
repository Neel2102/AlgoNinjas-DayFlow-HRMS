import Leave from "../models/Leave.js";
import Attendance from "../models/Attendance.js";
import { sendError, sendSuccess } from "../utils/responseHandler.js";

const dateKey = (d) => new Date(d).toISOString().slice(0, 10);

const enumerateDates = (start, end) => {
  const dates = [];
  const s = new Date(start);
  const e = new Date(end);
  s.setHours(0, 0, 0, 0);
  e.setHours(0, 0, 0, 0);
  for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
    dates.push(dateKey(d));
  }
  return dates;
};

export const applyLeave = async (req, res, next) => {
  try {
    const { type, startDate, endDate, remarks } = req.body;
    if (!type || !startDate || !endDate) {
      return sendError(res, "type, startDate, endDate are required", 400);
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return sendError(res, "Invalid date range", 400);
    }
    if (end < start) return sendError(res, "endDate must be after startDate", 400);

    const leave = await Leave.create({
      user: req.user._id,
      type,
      startDate: start,
      endDate: end,
      remarks: remarks || "",
      status: "Pending",
    });

    return sendSuccess(res, leave, "Leave request submitted", 201);
  } catch (err) {
    next(err);
  }
};

export const myLeaves = async (req, res, next) => {
  try {
    const rows = await Leave.find({ user: req.user._id }).sort({ createdAt: -1 });
    return sendSuccess(res, rows);
  } catch (err) {
    next(err);
  }
};

export const listLeaves = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = String(req.query.status).trim();
    if (req.query.userId) filter.user = String(req.query.userId).trim();

    const rows = await Leave.find(filter)
      .populate("user", "employeeId email")
      .sort({ createdAt: -1 });
    return sendSuccess(res, rows);
  } catch (err) {
    next(err);
  }
};

const decide = async ({ req, res, next, status }) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    const leave = await Leave.findById(id);
    if (!leave) return sendError(res, "Leave request not found", 404);
    if (leave.status !== "Pending") return sendError(res, "Leave already decided", 409);

    leave.status = status;
    leave.adminComment = comment || "";
    leave.decidedBy = req.user._id;
    leave.decidedAt = new Date();
    await leave.save();

    if (status === "Approved") {
      const days = enumerateDates(leave.startDate, leave.endDate);
      for (const date of days) {
        await Attendance.findOneAndUpdate(
          { user: leave.user, date },
          { $set: { status: "Leave" } },
          { upsert: true, new: true }
        );
      }
    }

    const populated = await Leave.findById(id).populate("user", "employeeId email");
    return sendSuccess(res, populated, `Leave ${status.toLowerCase()}`);
  } catch (err) {
    next(err);
  }
};

export const approveLeave = (req, res, next) => decide({ req, res, next, status: "Approved" });
export const rejectLeave = (req, res, next) => decide({ req, res, next, status: "Rejected" });
