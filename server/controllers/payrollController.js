import Payroll from "../models/Payroll.js";
import Employee from "../models/Employee.js";
import Attendance from "../models/Attendance.js";
import { sendError, sendSuccess } from "../utils/responseHandler.js";

const monthRegex = /^\d{4}-\d{2}$/;

const isoDateKey = (d) => new Date(d).toISOString().slice(0, 10);

const monthRange = (month) => {
  const clean = String(month || "").trim();
  if (!monthRegex.test(clean)) return null;
  const [y, m] = clean.split("-").map((x) => Number(x));
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 0);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  return { start, end, from: isoDateKey(start), to: isoDateKey(end), month: clean };
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

const computeAttendanceSummaryForUserMonth = async ({ userId, month }) => {
  const mr = monthRange(month);
  if (!mr) return null;
  const rows = await Attendance.find({ user: userId, date: { $gte: mr.from, $lte: mr.to } }).select(
    "date status leaveType"
  );
  const byDate = new Map((rows || []).map((r) => [r?.date, r]));
  const dates = enumerateDates(mr.start, mr.end);
  return computeMonthSummary({ dates, byDate });
};

const computeFromSalary = (salary) => {
  const s = salary && typeof salary === "object" ? salary : {};
  const earnings =
    (Number(s.basic) || 0) +
    (Number(s.hra) || 0) +
    (Number(s.da) || 0) +
    (Number(s.specialAllowance) || 0) +
    (Number(s.transportAllowance) || 0) +
    (Number(s.medicalAllowance) || 0);
  const deductions =
    (Number(s.pf) || 0) + (Number(s.professionalTax) || 0) + (Number(s.incomeTax) || 0);
  const grossPay = Math.max(0, earnings);
  const d = Math.max(0, deductions);
  const netPay = Math.max(0, grossPay - d);
  const currency = String(s.currency || "INR").trim() || "INR";
  return { grossPay, deductions: d, netPay, currency };
};

export const myPayroll = async (req, res, next) => {
  try {
    const filter = { user: req.user._id };
    if (req.query.month) filter.month = String(req.query.month).trim();
    const rows = await Payroll.find(filter).sort({ month: -1 });
    return sendSuccess(res, rows);
  } catch (err) {
    next(err);
  }
};

export const generatePayrollForUser = async (req, res, next) => {
  try {
    const { userId, month } = req.params;
    if (!userId || !month) return sendError(res, "userId and month required", 400);

    const cleanMonth = String(month).trim();
    if (!monthRegex.test(cleanMonth)) {
      return sendError(res, "month must be in YYYY-MM format", 400);
    }

    const employee = await Employee.findOne({ user: userId }).populate("user", "employeeId email");
    if (!employee) return sendError(res, "Employee not found", 404);

    const computed = computeFromSalary(employee.salary);
    const attendanceSummary = await computeAttendanceSummaryForUserMonth({ userId, month: cleanMonth });
    const notes = String(req.body?.notes || "Auto-generated from salary structure");

    const row = await Payroll.findOneAndUpdate(
      { user: userId, month: cleanMonth },
      { $set: { ...computed, ...(attendanceSummary || {}), notes } },
      { new: true, upsert: true }
    ).populate("user", "employeeId email");

    return sendSuccess(res, row, "Payroll generated");
  } catch (err) {
    next(err);
  }
};

export const generatePayrollForAll = async (req, res, next) => {
  try {
    const { month } = req.params;
    if (!month) return sendError(res, "month required", 400);

    const cleanMonth = String(month).trim();
    if (!monthRegex.test(cleanMonth)) {
      return sendError(res, "month must be in YYYY-MM format", 400);
    }

    const employees = await Employee.find().select("user salary");
    const notes = String(req.body?.notes || "Auto-generated from salary structure");

    const results = [];
    for (const e of employees) {
      if (!e?.user) continue;
      const computed = computeFromSalary(e.salary);
      const attendanceSummary = await computeAttendanceSummaryForUserMonth({ userId: e.user, month: cleanMonth });
      const row = await Payroll.findOneAndUpdate(
        { user: e.user, month: cleanMonth },
        { $set: { ...computed, ...(attendanceSummary || {}), notes } },
        { new: true, upsert: true }
      );
      results.push(row);
    }

    return sendSuccess(
      res,
      { month: cleanMonth, generated: results.length },
      "Payroll generated for all employees"
    );
  } catch (err) {
    next(err);
  }
};

export const listPayroll = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.userId) filter.user = String(req.query.userId).trim();
    if (req.query.month) filter.month = String(req.query.month).trim();
    const rows = await Payroll.find(filter)
      .populate("user", "employeeId email")
      .sort({ month: -1 });
    return sendSuccess(res, rows);
  } catch (err) {
    next(err);
  }
};
