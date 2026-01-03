import Payroll from "../models/Payroll.js";
import Employee from "../models/Employee.js";
import Attendance from "../models/Attendance.js";
import { sendError, sendSuccess } from "../utils/responseHandler.js";

const monthRegex = /^\d{4}-\d{2}$/;

const dateKey = (d) => new Date(d).toISOString().slice(0, 10);

const monthRange = (month) => {
  const [y, m] = String(month).split("-").map((x) => Number(x));
  const start = new Date(y, (m || 1) - 1, 1);
  const end = new Date(y, (m || 1), 0);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  return { start, end };
};

const enumerateWorkingDays = (start, end) => {
  const days = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const day = d.getDay();
    // Mon-Fri only
    if (day !== 0 && day !== 6) days.push(dateKey(d));
  }
  return days;
};

const statusToPayable = (status) => {
  if (status === "Present") return 1;
  if (status === "Half-day") return 0.5;
  if (status === "Leave") return 1;
  return 0;
};

const computeAttendanceForMonth = async ({ userId, month }) => {
  const { start, end } = monthRange(month);
  const workingDayKeys = enumerateWorkingDays(start, end);
  const fromKey = workingDayKeys[0] || dateKey(start);
  const toKey = workingDayKeys[workingDayKeys.length - 1] || dateKey(end);

  const rows = await Attendance.find({
    user: userId,
    date: { $gte: fromKey, $lte: toKey },
  }).select("date status");

  const map = new Map();
  for (const r of rows) {
    if (r?.date) map.set(String(r.date), String(r.status || ""));
  }

  const workingDays = workingDayKeys.length;
  let payableDays = 0;
  for (const dk of workingDayKeys) {
    payableDays += statusToPayable(map.get(dk));
  }
  payableDays = Math.max(0, payableDays);
  const lopDays = Math.max(0, workingDays - payableDays);
  return { workingDays, payableDays, lopDays };
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

const applyLop = ({ computed, attendance }) => {
  const baseGrossPay = Math.max(0, Number(computed.grossPay) || 0);
  const deductions = Math.max(0, Number(computed.deductions) || 0);
  const workingDays = Math.max(0, Number(attendance.workingDays) || 0);
  const payableDays = Math.max(0, Number(attendance.payableDays) || 0);
  const lopDays = Math.max(0, Number(attendance.lopDays) || 0);

  const perDayRate = workingDays > 0 ? baseGrossPay / workingDays : 0;
  const lopAmount = Math.max(0, lopDays * perDayRate);

  const grossPay = Math.max(0, baseGrossPay - lopAmount);
  const netPay = Math.max(0, grossPay - deductions);

  return {
    baseGrossPay,
    grossPay,
    deductions,
    netPay,
    workingDays,
    payableDays,
    lopDays,
    lopAmount,
  };
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
    const attendance = await computeAttendanceForMonth({ userId, month: cleanMonth });
    const refined = applyLop({ computed, attendance });
    const notes = String(req.body?.notes || "Auto-generated from salary structure");

    const row = await Payroll.findOneAndUpdate(
      { user: userId, month: cleanMonth },
      { $set: { ...computed, ...refined, notes } },
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
      const attendance = await computeAttendanceForMonth({ userId: e.user, month: cleanMonth });
      const refined = applyLop({ computed, attendance });
      const row = await Payroll.findOneAndUpdate(
        { user: e.user, month: cleanMonth },
        { $set: { ...computed, ...refined, notes } },
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
