import Notification from "../models/Notification.js";
import Employee from "../models/Employee.js";
import User from "../models/User.js";
import { sendError, sendSuccess } from "../utils/responseHandler.js";
import transporter, { getReplyToEmail, getSenderEmail } from "../config/nodemailer.js";

const emailTitle = (title) => {
  const t = String(title || "Alert");
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <div style="font-size: 22px; font-weight: 900; letter-spacing: 0.6px; margin: 0 0 14px;">Dayflow HRMS AlgoNinjas</div>
      <h2 style="margin: 0 0 10px;">${t}</h2>
    </div>
  `;
};

const sendMailSafe = async ({ to, subject, message }) => {
  const from = getSenderEmail();
  const replyTo = getReplyToEmail();
  const s = String(subject || "Alert");
  const m = String(message || "");

  try {
    const info = await transporter.sendMail({
      from,
      replyTo,
      to,
      subject: s,
      text: m,
      headers: {
        "X-Dayflow-App": "HRMS",
      },
      html: `
        <div>
          <p><strong>${s}</strong></p>
          <p style="white-space: pre-wrap;">${m}</p>
          <p style="font-size: 12px; color: #666;">Sent by Dayflow HRMS</p>
        </div>
      `,
    });
    console.log("[mail] sent:", { messageId: info?.messageId, accepted: info?.accepted?.length || 0, rejected: info?.rejected?.length || 0 });
    return info;
  } catch (err) {
    console.error("[mail] sendMail failed:", {
      message: err?.message,
      response: err?.response,
      responseCode: err?.responseCode,
      command: err?.command,
      to,
    });
    throw err;
  }
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export const broadcastAlert = async (req, res, next) => {
  try {
    const { subject, message, sendEmail = true, sendInApp = true } = req.body || {};
    const s = String(subject || "").trim();
    const m = String(message || "").trim();
    if (!s || !m) return sendError(res, "subject and message are required", 400);

    const employees = await Employee.find().populate("user", "_id email role");
    const employeeUsers = (employees || [])
      .map((e) => ({ user: e?.user, deliveryEmail: e?.personal?.email }))
      .filter((x) => x?.user && x.user.role === "employee");
    const users = employeeUsers.map((x) => x.user);
    const deliveryEmails = employeeUsers
      .map((x) => String(x.deliveryEmail || "").trim().toLowerCase())
      .filter(Boolean);
    const skippedEmailCount = employeeUsers.length - deliveryEmails.length;

    let created = 0;
    if (sendInApp) {
      const docs = users.map((u) => ({
        user: u._id,
        title: s,
        message: m,
        createdBy: req.user?._id,
      }));
      if (docs.length) {
        await Notification.insertMany(docs);
        created = docs.length;
      }
    }

    let sent = 0;
    let failed = 0;
    const failures = [];
    if (sendEmail && deliveryEmails.length) {
      // Gmail often blocks bulk/BCC blasts. Send one email per recipient with a small throttle.
      for (const to of deliveryEmails) {
        try {
          await sendMailSafe({ to, subject: s, message: m });
          sent += 1;
          await sleep(400);
        } catch (err) {
          failed += 1;
          failures.push({ email: to, error: String(err?.response || err?.message || err) });
          await sleep(500);
        }
      }
    }

    return sendSuccess(
      res,
      {
        sent: sendEmail ? sent : 0,
        skipped: sendEmail ? skippedEmailCount : 0,
        failed: sendEmail ? failed : 0,
        failures: failures.slice(0, 10),
        notificationsCreated: created,
      },
      "Alert sent"
    );
  } catch (err) {
    next(err);
  }
};

export const alertUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { subject, message, sendEmail = true, sendInApp = true } = req.body || {};
    const s = String(subject || "").trim();
    const m = String(message || "").trim();
    if (!s || !m) return sendError(res, "subject and message are required", 400);

    const user = await User.findById(userId).select("_id email role");
    if (!user) return sendError(res, "User not found", 404);

    const employee = await Employee.findOne({ user: user._id });
    const deliveryEmail = String(employee?.personal?.email || "").trim().toLowerCase();

    let notif = null;
    if (sendInApp) {
      notif = await Notification.create({
        user: user._id,
        title: s,
        message: m,
        createdBy: req.user?._id,
      });
    }

    if (sendEmail) {
      if (!deliveryEmail) return sendError(res, "Employee personal email is not set", 400);
      await sendMailSafe({ to: deliveryEmail, subject: s, message: m });
    }

    return sendSuccess(res, { notification: notif }, "Alert sent");
  } catch (err) {
    next(err);
  }
};

export const getMyNotifications = async (req, res, next) => {
  try {
    const rows = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(100);
    return sendSuccess(res, rows);
  } catch (err) {
    next(err);
  }
};

export const markNotificationRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const n = await Notification.findOneAndUpdate(
      { _id: id, user: req.user._id },
      { $set: { readAt: new Date() } },
      { new: true }
    );
    if (!n) return sendError(res, "Notification not found", 404);
    return sendSuccess(res, n, "Marked as read");
  } catch (err) {
    next(err);
  }
};
