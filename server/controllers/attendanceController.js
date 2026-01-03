import Attendance from "../models/Attendance.js";
import { sendError, sendSuccess } from "../utils/responseHandler.js";

const todayKey = () => new Date().toISOString().slice(0, 10);

const parseRange = (req) => {
  const from = req.query.from ? String(req.query.from).trim() : null;
  const to = req.query.to ? String(req.query.to).trim() : null;
  const q = {};
  if (from) q.$gte = from;
  if (to) q.$lte = to;
  return Object.keys(q).length > 0 ? q : null;
};

export const checkIn = async (req, res, next) => {
  try {
    const date = todayKey();
    const now = new Date();

    const record = await Attendance.findOne({ user: req.user._id, date });
    if (record?.checkInAt) return sendError(res, "Already checked in", 409);

    const updated = await Attendance.findOneAndUpdate(
      { user: req.user._id, date },
      { $set: { checkInAt: now, status: "Present" } },
      { upsert: true, new: true }
    );

    return sendSuccess(res, updated, "Checked in");
  } catch (err) {
    next(err);
  }
};

export const checkOut = async (req, res, next) => {
  try {
    const date = todayKey();
    const now = new Date();

    const record = await Attendance.findOne({ user: req.user._id, date });
    if (!record?.checkInAt) return sendError(res, "Check-in required", 400);
    if (record?.checkOutAt) return sendError(res, "Already checked out", 409);

    record.checkOutAt = now;
    await record.save();

    return sendSuccess(res, record, "Checked out");
  } catch (err) {
    next(err);
  }
};

export const getMyAttendance = async (req, res, next) => {
  try {
    const range = parseRange(req);
    const filter = { user: req.user._id };
    if (range) filter.date = range;

    const rows = await Attendance.find(filter).sort({ date: -1 });
    return sendSuccess(res, rows);
  } catch (err) {
    next(err);
  }
};

export const getAllAttendance = async (req, res, next) => {
  try {
    const range = parseRange(req);
    const filter = {};
    if (req.query.userId) filter.user = String(req.query.userId).trim();
    if (range) filter.date = range;

    const rows = await Attendance.find(filter)
      .populate("user", "employeeId email role")
      .sort({ date: -1 });
    return sendSuccess(res, rows);
  } catch (err) {
    next(err);
  }
};
