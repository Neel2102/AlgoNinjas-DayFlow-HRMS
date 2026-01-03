import Employee from "../models/Employee.js";
import User from "../models/User.js";
import Leave from "../models/Leave.js";
import { sendError, sendSuccess } from "../utils/responseHandler.js";
import cloudinary from "../config/cloudinary.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const sanitizeEmployee = (employee) => {
  if (!employee) return employee;
  const obj = employee.toObject ? employee.toObject() : employee;
  return obj;
};

const makeNameCode = (fullName) => {
  const parts = String(fullName || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const first = (parts[0] || "").toUpperCase();
  const last = (parts.length > 1 ? parts[parts.length - 1] : "").toUpperCase();
  const a = (first.slice(0, 2) || "XX").padEnd(2, "X");
  const b = (last.slice(0, 2) || "XX").padEnd(2, "X");
  return `${a}${b}`.replace(/[^A-Z]/g, "X");
};

const generateEmployeeId = async ({ fullName }) => {
  const companyCode = String(process.env.ORG_CODE || "OI").trim().toUpperCase() || "OI";
  const year = String(new Date().getFullYear());
  const nameCode = makeNameCode(fullName);

  const prefix = `${companyCode}${nameCode}${year}`;
  const count = await User.countDocuments({ employeeId: { $regex: `^${prefix}` } });
  const serial = String(count + 1).padStart(4, "0");
  return `${prefix}${serial}`;
};

export const getMyProfile = async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id }).populate(
      "user",
      "employeeId email role isEmailVerified"
    );
    if (!employee) return sendError(res, "Profile not found", 404);
    return sendSuccess(res, sanitizeEmployee(employee));
  } catch (err) {
    next(err);
  }
};

export const updateMyProfile = async (req, res, next) => {
  try {
    const allowed = ["address", "phone", "profilePictureUrl", "fullName"];
    const updates = {};
    for (const key of allowed) {
      if (req.body?.[key] !== undefined) {
        if (!updates.personal) updates.personal = {};
        updates.personal[key === "profilePictureUrl" ? "profilePictureUrl" : key] = req.body[key];
      }
    }

    const employee = await Employee.findOneAndUpdate(
      { user: req.user._id },
      { $set: updates },
      { new: true }
    ).populate("user", "employeeId email role isEmailVerified");
    if (!employee) return sendError(res, "Profile not found", 404);
    return sendSuccess(res, sanitizeEmployee(employee), "Profile updated");
  } catch (err) {
    next(err);
  }
};

export const uploadMyProfilePicture = async (req, res, next) => {
  try {
    const dataUrl = String(req.body?.dataUrl || "").trim();
    if (!dataUrl) return sendError(res, "dataUrl is required", 400);

    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) return sendError(res, "Profile not found", 404);

    const result = await cloudinary.uploader.upload(dataUrl, {
      folder: "dayflow/profile_pictures",
      public_id: `user_${req.user._id.toString()}`,
      overwrite: true,
      resource_type: "image",
    });

    employee.personal = employee.personal || {};
    employee.personal.profilePictureUrl = String(result?.secure_url || result?.url || "");
    await employee.save();

    const refreshed = await Employee.findOne({ user: req.user._id }).populate(
      "user",
      "employeeId email role isEmailVerified"
    );

    return sendSuccess(res, sanitizeEmployee(refreshed), "Profile picture updated");
  } catch (err) {
    next(err);
  }
};

export const listEmployees = async (req, res, next) => {
  try {
    const employees = await Employee.find()
      .populate("user", "employeeId email role isEmailVerified")
      .sort({ createdAt: -1 });

    const userIds = (employees || []).map((e) => e?.user?._id).filter(Boolean);
    const statsRows = await Leave.aggregate([
      { $match: { user: { $in: userIds } } },
      {
        $group: {
          _id: { user: "$user", status: "$status", type: "$type" },
          days: { $sum: { $ifNull: ["$days", 1] } },
          count: { $sum: 1 },
        },
      },
    ]);

    const statsByUser = new Map();
    for (const r of statsRows || []) {
      const uid = r?._id?.user ? String(r._id.user) : "";
      if (!uid) continue;
      const status = String(r?._id?.status || "");
      const type = String(r?._id?.type || "");
      const days = Number(r?.days) || 0;
      const count = Number(r?.count) || 0;

      const cur = statsByUser.get(uid) || {
        approvedDays: 0,
        pendingDays: 0,
        approvedByType: { Paid: 0, Sick: 0, Unpaid: 0 },
        pendingByType: { Paid: 0, Sick: 0, Unpaid: 0 },
        approvedCount: 0,
        pendingCount: 0,
      };

      if (status === "Approved") {
        cur.approvedDays += days;
        cur.approvedCount += count;
        if (cur.approvedByType[type] !== undefined) cur.approvedByType[type] += days;
      }
      if (status === "Pending") {
        cur.pendingDays += days;
        cur.pendingCount += count;
        if (cur.pendingByType[type] !== undefined) cur.pendingByType[type] += days;
      }

      statsByUser.set(uid, cur);
    }

    const out = (employees || []).map((e) => {
      const obj = sanitizeEmployee(e);
      const uid = e?.user?._id ? String(e.user._id) : "";
      return {
        ...obj,
        leaveStats: statsByUser.get(uid) || {
          approvedDays: 0,
          pendingDays: 0,
          approvedByType: { Paid: 0, Sick: 0, Unpaid: 0 },
          pendingByType: { Paid: 0, Sick: 0, Unpaid: 0 },
          approvedCount: 0,
          pendingCount: 0,
        },
      };
    });

    return sendSuccess(res, out);
  } catch (err) {
    next(err);
  }
};

export const getEmployeeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findById(id).populate(
      "user",
      "employeeId email role isEmailVerified"
    );
    if (!employee) return sendError(res, "Employee not found", 404);

    const userId = employee?.user?._id;
    let leaveStats = {
      approvedDays: 0,
      pendingDays: 0,
      approvedByType: { Paid: 0, Sick: 0, Unpaid: 0 },
      pendingByType: { Paid: 0, Sick: 0, Unpaid: 0 },
      approvedCount: 0,
      pendingCount: 0,
    };

    if (userId) {
      const statsRows = await Leave.aggregate([
        { $match: { user: userId } },
        {
          $group: {
            _id: { status: "$status", type: "$type" },
            days: { $sum: { $ifNull: ["$days", 1] } },
            count: { $sum: 1 },
          },
        },
      ]);

      for (const r of statsRows || []) {
        const status = String(r?._id?.status || "");
        const type = String(r?._id?.type || "");
        const days = Number(r?.days) || 0;
        const count = Number(r?.count) || 0;

        if (status === "Approved") {
          leaveStats.approvedDays += days;
          leaveStats.approvedCount += count;
          if (leaveStats.approvedByType[type] !== undefined) leaveStats.approvedByType[type] += days;
        }
        if (status === "Pending") {
          leaveStats.pendingDays += days;
          leaveStats.pendingCount += count;
          if (leaveStats.pendingByType[type] !== undefined) leaveStats.pendingByType[type] += days;
        }
      }
    }

    return sendSuccess(res, { ...sanitizeEmployee(employee), leaveStats });
  } catch (err) {
    next(err);
  }
};

export const updateEmployeeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findById(id);
    if (!employee) return sendError(res, "Employee not found", 404);

    const { personal, job, salary, bank, skills, certifications, salaryStructure, documents, user } = req.body;

    if (personal && typeof personal === "object") {
      const current = employee.personal && employee.personal.toObject ? employee.personal.toObject() : {};
      employee.personal = { ...current, ...personal };
    }
    if (job && typeof job === "object") {
      const current = employee.job && employee.job.toObject ? employee.job.toObject() : {};
      employee.job = { ...current, ...job };
    }
    if (salary && typeof salary === "object") {
      const current = employee.salary && employee.salary.toObject ? employee.salary.toObject() : {};
      employee.salary = { ...current, ...salary };
    }
    if (bank && typeof bank === "object") {
      const current = employee.bank && employee.bank.toObject ? employee.bank.toObject() : {};
      employee.bank = { ...current, ...bank };
    }
    if (Array.isArray(skills)) {
      employee.skills = skills;
    }
    if (Array.isArray(certifications)) {
      employee.certifications = certifications;
    }
    if (salaryStructure && typeof salaryStructure === "object") {
      const current =
        employee.salaryStructure && employee.salaryStructure.toObject
          ? employee.salaryStructure.toObject()
          : {};
      employee.salaryStructure = { ...current, ...salaryStructure };
    }
    if (Array.isArray(documents)) {
      employee.documents = documents.map((d) => {
        if (!d || typeof d !== "object") return d;
        const next = { ...d };
        if (!next.fileUrl && next.url) next.fileUrl = next.url;
        if (!next.url && next.fileUrl) next.url = next.fileUrl;
        return next;
      });
    }

    await employee.save();

    if (user && typeof user === "object") {
      const allowedUserUpdates = {};
      if (user.email) allowedUserUpdates.email = String(user.email).trim().toLowerCase();
      if (user.employeeId) allowedUserUpdates.employeeId = String(user.employeeId).trim();
      if (user.role) allowedUserUpdates.role = user.role;
      if (Object.keys(allowedUserUpdates).length > 0) {
        await User.findByIdAndUpdate(employee.user, { $set: allowedUserUpdates });
      }
    }

    const refreshed = await Employee.findById(id).populate(
      "user",
      "employeeId email role isEmailVerified"
    );
    return sendSuccess(res, sanitizeEmployee(refreshed), "Employee updated");
  } catch (err) {
    next(err);
  }
};

export const createEmployeeUser = async (req, res, next) => {
  try {
    const { fullName, emailPrefix, domain, personalEmail } = req.body || {};
    const cleanFullName = String(fullName || "").trim();
    if (!cleanFullName) return sendError(res, "fullName is required", 400);

    const resolvedDomain = String(domain || process.env.ORG_EMAIL_DOMAIN || "").trim();
    if (!resolvedDomain) return sendError(res, "domain is required", 400);

    const prefixCandidate = String(emailPrefix || cleanFullName || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ".")
      .replace(/[^a-z0-9._-]/g, "");

    if (!prefixCandidate) return sendError(res, "emailPrefix is required", 400);

    const email = `${prefixCandidate}@${resolvedDomain}`.toLowerCase();
    const cleanEmployeeId = await generateEmployeeId({ fullName: cleanFullName });

    const existing = await User.findOne({ $or: [{ email }, { employeeId: cleanEmployeeId }] });
    if (existing) return sendError(res, "User already exists", 409);

    const rawPassword = crypto.randomBytes(6).toString("base64").replace(/[^a-zA-Z0-9]/g, "").slice(0, 10);
    const passwordHash = await bcrypt.hash(String(rawPassword), 10);

    const user = await User.create({
      employeeId: cleanEmployeeId,
      email,
      passwordHash,
      role: "employee",
      isEmailVerified: true,
      emailVerificationToken: null,
      emailVerificationTokenExpiresAt: null,
    });

    const employee = await Employee.create({
      user: user._id,
      personal:
        fullName || personalEmail
          ? {
              ...(fullName ? { fullName: String(fullName).trim() } : {}),
              ...(personalEmail ? { email: String(personalEmail).trim().toLowerCase() } : {}),
            }
          : undefined,
    });

    const populated = await Employee.findById(employee._id).populate(
      "user",
      "employeeId email role isEmailVerified"
    );

    return sendSuccess(
      res,
      { employee: sanitizeEmployee(populated), credentials: { employeeId: cleanEmployeeId, email, password: rawPassword } },
      "Employee created",
      201
    );
  } catch (err) {
    next(err);
  }
};
