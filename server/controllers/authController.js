import bcrypt from "bcryptjs";
import crypto from "crypto";

import User from "../models/User.js";
import Employee from "../models/Employee.js";
import { signToken } from "../config/jwt.js";
import { sendEmail } from "../utils/emailService.js";
import { sendError, sendSuccess } from "../utils/responseHandler.js";

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

const isEmailVerificationDisabled = () => {
  return String(process.env.DISABLE_EMAIL_VERIFICATION || "false") === "true";
};

export const signUp = async (req, res, next) => {
  try {
    const { employeeId, email, password, role, adminSecret } = req.body;
    if (!employeeId || !email || !password) {
      return sendError(res, "employeeId, email and password are required", 400);
    }

    const cleanEmail = normalizeEmail(email);

    const existing = await User.findOne({ $or: [{ email: cleanEmail }, { employeeId }] });
    if (existing) return sendError(res, "User already exists", 409);

    let finalRole = "employee";
    if (role === "admin") {
      const required = process.env.ADMIN_SIGNUP_SECRET;
      if (!required || adminSecret !== required) {
        return sendError(res, "Not allowed to create admin", 403);
      }
      finalRole = "admin";
    }
    if (role === "hr") {
      const required = process.env.HR_SIGNUP_SECRET || process.env.ADMIN_SIGNUP_SECRET;
      if (!required || adminSecret !== required) {
        return sendError(res, "Not allowed to create hr", 403);
      }
      finalRole = "hr";
    }

    const passwordHash = await bcrypt.hash(String(password), 10);
    const verificationToken = crypto.randomBytes(24).toString("hex");

    const user = await User.create({
      employeeId: String(employeeId).trim(),
      email: cleanEmail,
      passwordHash,
      role: finalRole,
      isEmailVerified: isEmailVerificationDisabled() ? true : false,
      emailVerificationToken: isEmailVerificationDisabled() ? null : verificationToken,
      emailVerificationTokenExpiresAt: isEmailVerificationDisabled()
        ? null
        : new Date(Date.now() + 1000 * 60 * 60 * 24),
    });

    await Employee.create({ user: user._id });

    if (!user.isEmailVerified) {
      const appUrl = process.env.APP_URL || "http://localhost:3000";
      const verifyUrl = `${appUrl}/verify-email?token=${verificationToken}`;
      await sendEmail({
        to: user.email,
        subject: "Verify your email",
        html: `<p>Verify your email by clicking: <a href="${verifyUrl}">${verifyUrl}</a></p>`,
      });
    }

    const token = signToken({ sub: user._id.toString(), role: user.role });
    return sendSuccess(
      res,
      { token, user: { id: user._id, email: user.email, employeeId: user.employeeId, role: user.role } },
      "Signed up",
      201
    );
  } catch (err) {
    next(err);
  }
};

export const signIn = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return sendError(res, "email and password are required", 400);

    const user = await User.findOne({ email: normalizeEmail(email) });
    if (!user) return sendError(res, "Invalid credentials", 401);

    const ok = await bcrypt.compare(String(password), user.passwordHash);
    if (!ok) return sendError(res, "Invalid credentials", 401);

    if (!isEmailVerificationDisabled() && !user.isEmailVerified) {
      return sendError(res, "Email is not verified", 403);
    }

    const token = signToken({ sub: user._id.toString(), role: user.role });
    return sendSuccess(res, { token, user: { id: user._id, email: user.email, employeeId: user.employeeId, role: user.role } }, "Signed in");
  } catch (err) {
    next(err);
  }
};

export const verifyEmail = async (req, res, next) => {
  try {
    const token = String(req.query.token || "").trim();
    if (!token) return sendError(res, "token is required", 400);

    const user = await User.findOne({ emailVerificationToken: token });
    if (!user) return sendError(res, "Invalid token", 400);

    if (user.emailVerificationTokenExpiresAt && user.emailVerificationTokenExpiresAt < new Date()) {
      return sendError(res, "Token expired", 400);
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationTokenExpiresAt = null;
    await user.save();

    return sendSuccess(res, null, "Email verified");
  } catch (err) {
    next(err);
  }
};
