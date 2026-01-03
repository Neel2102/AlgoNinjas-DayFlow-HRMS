import bcrypt from "bcryptjs";

import Attendance from "../models/Attendance.js";
import Employee from "../models/Employee.js";
import Leave from "../models/Leave.js";
import User from "../models/User.js";
import { sendError, sendSuccess } from "../utils/responseHandler.js";

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

const isoDateKey = (d) => new Date(d).toISOString().slice(0, 10);

const lastNDaysKeys = (n) => {
  const out = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < n; i += 1) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    out.push(isoDateKey(d));
  }
  return out;
};

const requireDevSecret = (req) => {
  const header = req.headers["x-dev-secret"];
  if (typeof header === "string" && header.trim()) return header.trim();
  if (req.body?.secret && String(req.body.secret).trim()) return String(req.body.secret).trim();
  return "";
};

export const seedDevData = async (req, res, next) => {
  try {
    if (String(process.env.NODE_ENV || "").toLowerCase() === "production") {
      return sendError(res, "Not available", 404);
    }

    const required = String(process.env.DEV_SEED_SECRET || "").trim();
    const provided = requireDevSecret(req);
    if (!required) return sendError(res, "DEV_SEED_SECRET is not configured", 500);
    if (!provided || provided !== required) return sendError(res, "Forbidden", 403);

    const password = String(req.body?.password || "Password@123");
    const passwordHash = await bcrypt.hash(password, 10);

    const adminEmail = normalizeEmail(req.body?.adminEmail || "admin@dayflow.test");
    const adminEmployeeId = String(req.body?.adminEmployeeId || "ADM001").trim();
    const hrEmail = normalizeEmail(req.body?.hrEmail || "hr@dayflow.test");
    const hrEmployeeId = String(req.body?.hrEmployeeId || "HR001").trim();

    const employees = Array.isArray(req.body?.employees)
      ? req.body.employees
      : [
          { employeeId: "EMP001", email: "alice@dayflow.test", fullName: "Alice Roy" },
          { employeeId: "EMP002", email: "rahul@dayflow.test", fullName: "Rahul Verma" },
          { employeeId: "EMP003", email: "sara@dayflow.test", fullName: "Sara Khan" },
        ];

    const createdUsers = [];

    const ensureUser = async ({ employeeId, email, role }) => {
      const cleanEmail = normalizeEmail(email);
      const existing = await User.findOne({ $or: [{ email: cleanEmail }, { employeeId }] });
      if (existing) return existing;

      const u = await User.create({
        employeeId: String(employeeId).trim(),
        email: cleanEmail,
        passwordHash,
        role,
        isEmailVerified: true,
        emailVerificationToken: null,
        emailVerificationTokenExpiresAt: null,
      });
      await Employee.create({ user: u._id, personal: { fullName: "" } });
      createdUsers.push(u);
      return u;
    };

    const adminUser = await ensureUser({ employeeId: adminEmployeeId, email: adminEmail, role: "admin" });
    await ensureUser({ employeeId: hrEmployeeId, email: hrEmail, role: "hr" });

    const employeeUsers = [];
    for (const e of employees) {
      const u = await ensureUser({ employeeId: e.employeeId, email: e.email, role: "employee" });
      employeeUsers.push(u);
      if (e.fullName) {
        await Employee.findOneAndUpdate(
          { user: u._id },
          { $set: { "personal.fullName": String(e.fullName) } },
          { new: true }
        );
      }
    }

    const dateKeys = lastNDaysKeys(7);
    const statuses = ["Present", "Present", "Present", "Half-day", "Absent", "Present", "Leave"];

    for (const user of employeeUsers) {
      for (let i = 0; i < dateKeys.length; i += 1) {
        const date = dateKeys[i];
        const status = statuses[i % statuses.length];

        const base = new Date(`${date}T09:30:00.000Z`);
        const checkInAt = status === "Absent" ? null : base;
        const checkOutAt = status === "Absent" ? null : new Date(base.getTime() + 1000 * 60 * 60 * 8);

        await Attendance.findOneAndUpdate(
          { user: user._id, date },
          { $set: { status, checkInAt, checkOutAt } },
          { upsert: true, new: true }
        );
      }
    }

    if (employeeUsers[0]) {
      const start = new Date();
      start.setDate(start.getDate() + 2);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(start.getDate() + 1);

      await Leave.findOneAndUpdate(
        { user: employeeUsers[0]._id, status: "Pending" },
        {
          $setOnInsert: {
            user: employeeUsers[0]._id,
            type: "Paid",
            startDate: start,
            endDate: end,
            remarks: "Family function",
            status: "Pending",
            adminComment: "",
            decidedBy: null,
            decidedAt: null,
          },
        },
        { upsert: true, new: true }
      );
    }

    if (employeeUsers[1]) {
      const start = new Date();
      start.setDate(start.getDate() - 3);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(start.getDate());

      await Leave.findOneAndUpdate(
        { user: employeeUsers[1]._id, status: "Approved" },
        {
          $setOnInsert: {
            user: employeeUsers[1]._id,
            type: "Sick",
            startDate: start,
            endDate: end,
            remarks: "Fever",
            status: "Approved",
            adminComment: "Get well soon",
            decidedBy: adminUser._id,
            decidedAt: new Date(),
          },
        },
        { upsert: true, new: true }
      );
    }

    return sendSuccess(res, {
      message: "Seed complete",
      credentials: {
        admin: { email: adminEmail, employeeId: adminEmployeeId, password },
        hr: { email: hrEmail, employeeId: hrEmployeeId, password },
        employees: employees.map((e) => ({ email: normalizeEmail(e.email), employeeId: String(e.employeeId).trim(), password })),
      },
      createdUsers: createdUsers.length,
    });
  } catch (err) {
    next(err);
  }
};
