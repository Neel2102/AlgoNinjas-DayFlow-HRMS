import Leave from "../models/Leave.js";
import Attendance from "../models/Attendance.js";
import Employee from "../models/Employee.js";
import { sendError, sendSuccess } from "../utils/responseHandler.js";
import cloudinary from "../config/cloudinary.js";

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

export const uploadLeaveAttachment = async (req, res, next) => {
  try {
    const dataUrl = String(req.body?.dataUrl || "").trim();
    const fileName = String(req.body?.fileName || "").trim();
    if (!dataUrl) return sendError(res, "dataUrl is required", 400);

    const result = await cloudinary.uploader.upload(dataUrl, {
      folder: "dayflow/leave_attachments",
      resource_type: "auto",
      overwrite: false,
    });

    const url = String(result?.secure_url || result?.url || "");
    return sendSuccess(res, { attachmentUrl: url, attachmentName: fileName }, "Uploaded");
  } catch (err) {
    next(err);
  }
};

export const applyLeave = async (req, res, next) => {
  try {
    const { type, startDate, endDate, remarks, attachmentName, attachmentUrl } = req.body;
    if (!type || !startDate || !endDate) {
      return sendError(res, "type, startDate, endDate are required", 400);
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return sendError(res, "Invalid date range", 400);
    }
    if (end < start) return sendError(res, "endDate must be after startDate", 400);

    const days = enumerateDates(start, end).length;

    const leave = await Leave.create({
      user: req.user._id,
      type,
      startDate: start,
      endDate: end,
      days,
      remarks: remarks || "",
      attachmentName: attachmentName || "",
      attachmentUrl: attachmentUrl || "",
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

    const userIds = rows.map((r) => r?.user?._id).filter(Boolean);
    const employees = await Employee.find({ user: { $in: userIds } }).select(
      "user personal.fullName personal.profilePictureUrl leaveBalance"
    );
    const byUserId = new Map((employees || []).map((e) => [String(e.user), e]));

    const enriched = rows.map((r) => {
      const obj = r.toObject ? r.toObject() : r;
      const uid = obj?.user?._id ? String(obj.user._id) : "";
      const emp = byUserId.get(uid);
      return {
        ...obj,
        employeeName: emp?.personal?.fullName || "",
        employee: emp
          ? {
              fullName: emp?.personal?.fullName || "",
              profilePictureUrl: emp?.personal?.profilePictureUrl || "",
              leaveBalance: emp?.leaveBalance || null,
            }
          : null,
      };
    });

    return sendSuccess(res, enriched);
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

    if (status === "Approved") {
      const type = String(leave.type || "");
      if (type === "Paid" || type === "Sick") {
        const emp = await Employee.findOne({ user: leave.user }).select("leaveBalance");
        const daysCount = Number(leave.days) > 0 ? Number(leave.days) : enumerateDates(leave.startDate, leave.endDate).length;

        const allocated =
          type === "Paid"
            ? Number(emp?.leaveBalance?.paid?.allocated) || 0
            : Number(emp?.leaveBalance?.sick?.allocated) || 0;
        const used =
          type === "Paid"
            ? Number(emp?.leaveBalance?.paid?.used) || 0
            : Number(emp?.leaveBalance?.sick?.used) || 0;
        const remaining = Math.max(0, allocated - used);

        if (daysCount > remaining) {
          return sendError(res, `Insufficient ${type.toLowerCase()} leave balance`, 409);
        }
      }
    }

    leave.status = status;
    leave.adminComment = comment || "";
    leave.decidedBy = req.user._id;
    leave.decidedAt = new Date();
    await leave.save();

    if (status === "Approved") {
      const dayKeys = enumerateDates(leave.startDate, leave.endDate);
      for (const date of dayKeys) {
        await Attendance.findOneAndUpdate(
          { user: leave.user, date },
          { $set: { status: "Leave", leaveType: leave.type || null } },
          { upsert: true, new: true }
        );
      }

      const daysCount = Number(leave.days) > 0 ? Number(leave.days) : dayKeys.length;
      const type = String(leave.type || "");
      const update = {};
      if (type === "Paid") update["leaveBalance.paid.used"] = daysCount;
      if (type === "Sick") update["leaveBalance.sick.used"] = daysCount;
      if (type === "Unpaid") update["leaveBalance.unpaid.used"] = daysCount;
      if (Object.keys(update).length > 0) {
        await Employee.findOneAndUpdate(
          { user: leave.user },
          { $inc: update },
          { new: false }
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
