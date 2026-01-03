import Employee from "../models/Employee.js";
import User from "../models/User.js";
import { sendError, sendSuccess } from "../utils/responseHandler.js";

const sanitizeEmployee = (employee) => {
  if (!employee) return employee;
  const obj = employee.toObject ? employee.toObject() : employee;
  return obj;
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

export const listEmployees = async (req, res, next) => {
  try {
    const employees = await Employee.find()
      .populate("user", "employeeId email role isEmailVerified")
      .sort({ createdAt: -1 });
    return sendSuccess(res, employees.map(sanitizeEmployee));
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
    return sendSuccess(res, sanitizeEmployee(employee));
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
