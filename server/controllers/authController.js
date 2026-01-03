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

const generateOtp = () => {
  return String(Math.floor(100000 + Math.random() * 900000));
};

const sendEmailOtp = async (user) => {
  const otp = generateOtp();
  const otpHash = await bcrypt.hash(otp, 10);

  user.emailOtpHash = otpHash;
  user.emailOtpExpiresAt = new Date(Date.now() + 1000 * 60 * 10);
  user.emailVerificationToken = null;
  user.emailVerificationTokenExpiresAt = null;
  await user.save();

  await sendEmail({
    to: user.email,
    subject: "Dayflow HRMS - Email Verification OTP",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2 style="margin: 0 0 10px;">Verify your email</h2>
        <p>Your OTP for email verification is:</p>
        <div style="font-size: 26px; font-weight: 800; letter-spacing: 4px; padding: 10px 14px; display: inline-block; border: 1px solid #ddd; border-radius: 10px;">
          ${otp}
        </div>
        <p style="margin-top: 14px;">This OTP will expire in <b>10 minutes</b>.</p>
        <p style="color: #666; font-size: 12px;">If you did not request this, you can ignore this email.</p>
      </div>
    `,
  });
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
      await sendEmailOtp(user);
      return sendSuccess(
        res,
        {
          verificationRequired: true,
          email: user.email,
          user: { id: user._id, email: user.email, employeeId: user.employeeId, role: user.role, isEmailVerified: user.isEmailVerified },
        },
        "OTP sent to email",
        201
      );
    }

    const token = signToken({ sub: user._id.toString(), role: user.role });
    return sendSuccess(
      res,
      { token, user: { id: user._id, email: user.email, employeeId: user.employeeId, role: user.role, isEmailVerified: user.isEmailVerified } },
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

export const verifyOtp = async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const otp = String(req.body?.otp || "").trim();
    if (!email || !otp) return sendError(res, "email and otp are required", 400);

    const user = await User.findOne({ email });
    if (!user) return sendError(res, "Invalid OTP", 400);
    if (user.isEmailVerified) {
      const token = signToken({ sub: user._id.toString(), role: user.role });
      return sendSuccess(res, { token, user: { id: user._id, email: user.email, employeeId: user.employeeId, role: user.role, isEmailVerified: true } }, "Already verified");
    }

    if (!user.emailOtpHash || !user.emailOtpExpiresAt) return sendError(res, "OTP not requested", 400);
    if (user.emailOtpExpiresAt < new Date()) return sendError(res, "OTP expired", 400);

    const ok = await bcrypt.compare(otp, user.emailOtpHash);
    if (!ok) return sendError(res, "Invalid OTP", 400);

    user.isEmailVerified = true;
    user.emailOtpHash = null;
    user.emailOtpExpiresAt = null;
    user.emailVerificationToken = null;
    user.emailVerificationTokenExpiresAt = null;
    await user.save();

    const token = signToken({ sub: user._id.toString(), role: user.role });
    return sendSuccess(res, { token, user: { id: user._id, email: user.email, employeeId: user.employeeId, role: user.role, isEmailVerified: true } }, "Email verified");
  } catch (err) {
    next(err);
  }
};

export const resendOtp = async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email);
    if (!email) return sendError(res, "email is required", 400);

    const user = await User.findOne({ email });
    if (!user) return sendError(res, "User not found", 404);
    if (user.isEmailVerified) return sendSuccess(res, null, "Email already verified");

    if (isEmailVerificationDisabled()) {
      user.isEmailVerified = true;
      user.emailOtpHash = null;
      user.emailOtpExpiresAt = null;
      await user.save();
      const token = signToken({ sub: user._id.toString(), role: user.role });
      return sendSuccess(res, { token, user: { id: user._id, email: user.email, employeeId: user.employeeId, role: user.role, isEmailVerified: true } }, "Email verification disabled");
    }

    await sendEmailOtp(user);
    return sendSuccess(res, { email: user.email, verificationRequired: true }, "OTP sent");
  } catch (err) {
    next(err);
  }
};
