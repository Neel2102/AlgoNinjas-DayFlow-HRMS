import Attendance from "../models/Attendance.js";
import { sendError, sendSuccess } from "../utils/responseHandler.js";

const todayKey = () => new Date().toISOString().slice(0, 10);

const isoDateKey = (d) => new Date(d).toISOString().slice(0, 10);

const monthRange = (month) => {
  const clean = String(month || "").trim();
  if (!/^\d{4}-\d{2}$/.test(clean)) return null;
  const [y, m] = clean.split("-").map((x) => Number(x));
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 0);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  return { start, end, from: isoDateKey(start), to: isoDateKey(end) };
};

const calcBreakMs = (record, now = new Date()) => {
  const sessions = Array.isArray(record?.breaks) ? record.breaks : [];
  let total = 0;
  for (const s of sessions) {
    const a = s?.startAt ? new Date(s.startAt).getTime() : NaN;
    const b = s?.endAt ? new Date(s.endAt).getTime() : NaN;
    if (!Number.isNaN(a) && !Number.isNaN(b) && b > a) total += b - a;
  }

  const active = record?.breakStartAt ? new Date(record.breakStartAt).getTime() : NaN;
  const n = now ? new Date(now).getTime() : Date.now();
  if (!Number.isNaN(active) && n > active) total += n - active;
  return total;
};

const enumerateDates = (start, end) => {
  const out = [];
  const s = new Date(start);
  const e = new Date(end);
  s.setHours(0, 0, 0, 0);
  e.setHours(0, 0, 0, 0);
  for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
    out.push(isoDateKey(d));
  }
  return out;
};

const computeMonthSummary = ({ dates, byDate }) => {
  let presentDays = 0;
  let leaveDays = 0;
  let unpaidLeaveDays = 0;
  let missingAttendanceDays = 0;

  for (const date of dates) {
    const r = byDate.get(date);
    const status = String(r?.status || "Absent");

    if (status === "Present" || status === "Half-day") {
      presentDays += 1;
      continue;
    }

    if (status === "Leave") {
      leaveDays += 1;
      if (String(r?.leaveType || "") === "Unpaid") unpaidLeaveDays += 1;
      continue;
    }

    missingAttendanceDays += 1;
  }

  const totalWorkingDays = dates.length;
  const payableDays = Math.max(0, totalWorkingDays - unpaidLeaveDays - missingAttendanceDays);

  return {
    totalWorkingDays,
    presentDays,
    leaveDays,
    unpaidLeaveDays,
    missingAttendanceDays,
    payableDays,
  };
};

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
    if (record?.breakStartAt) return sendError(res, "End break before checking out", 409);
    if (record?.checkOutAt) return sendError(res, "Already checked out", 409);

    record.checkOutAt = now;
    await record.save();

    return sendSuccess(res, record, "Checked out");
  } catch (err) {
    next(err);
  }
};

export const breakStart = async (req, res, next) => {
  try {
    const date = todayKey();
    const now = new Date();

    const record = await Attendance.findOne({ user: req.user._id, date });
    if (!record?.checkInAt) return sendError(res, "Check-in required", 400);
    if (record?.checkOutAt) return sendError(res, "Already checked out", 409);
    if (record?.breakStartAt) return sendError(res, "Break already started", 409);

    record.breakStartAt = now;
    await record.save();
    return sendSuccess(res, record, "Break started");
  } catch (err) {
    next(err);
  }
};

export const breakEnd = async (req, res, next) => {
  try {
    const date = todayKey();
    const now = new Date();

    const record = await Attendance.findOne({ user: req.user._id, date });
    if (!record?.checkInAt) return sendError(res, "Check-in required", 400);
    if (record?.checkOutAt) return sendError(res, "Already checked out", 409);
    if (!record?.breakStartAt) return sendError(res, "No active break", 409);

    const start = new Date(record.breakStartAt);
    if (Number.isNaN(start.getTime()) || now.getTime() <= start.getTime()) {
      return sendError(res, "Invalid break time", 400);
    }

    record.breaks = Array.isArray(record.breaks) ? record.breaks : [];
    record.breaks.push({ startAt: start, endAt: now });
    record.breakStartAt = null;
    await record.save();
    return sendSuccess(res, record, "Break ended");
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

export const getMyMonthAttendance = async (req, res, next) => {
  try {
    const { month } = req.query;
    const mr = monthRange(month);
    if (!mr) return sendError(res, "month must be in YYYY-MM format", 400);

    const rows = await Attendance.find({ user: req.user._id, date: { $gte: mr.from, $lte: mr.to } })
      .sort({ date: 1 });

    const byDate = new Map((rows || []).map((r) => [r?.date, r]));
    const dates = enumerateDates(mr.start, mr.end);
    const expanded = dates.map((date) => {
      const r = byDate.get(date);
      if (r) return r;
      return {
        date,
        status: "Absent",
        checkInAt: null,
        checkOutAt: null,
        breaks: [],
        breakStartAt: null,
        leaveType: null,
      };
    });

    const summary = computeMonthSummary({ dates, byDate });
    return sendSuccess(res, { month: String(month).trim(), from: mr.from, to: mr.to, summary, rows: expanded });
  } catch (err) {
    next(err);
  }
};

export const listPresentByDate = async (req, res, next) => {
  try {
    const date = req.query.date ? String(req.query.date).trim() : todayKey();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return sendError(res, "date must be in YYYY-MM-DD format", 400);

    const rows = await Attendance.find({ date, status: { $in: ["Present", "Half-day"] } })
      .populate("user", "employeeId email role")
      .sort({ createdAt: -1 });

    return sendSuccess(res, { date, count: rows.length, rows });
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
