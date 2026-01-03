import express from "express";
import {
  forgotPassword,
  resendOtp,
  resetPassword,
  signIn,
  signUp,
  verifyEmail,
  verifyOtp,
} from "../controllers/authController.js";
import { requireFields } from "../middlewares/validateMiddleware.js";

const router = express.Router();

router.post("/signup", requireFields(["employeeId", "email", "password"]), signUp);
router.post("/signin", requireFields(["email", "password"]), signIn);
router.post("/verify-otp", requireFields(["email", "otp"]), verifyOtp);
router.post("/resend-otp", requireFields(["email"]), resendOtp);
router.post("/forgot-password", requireFields(["email"]), forgotPassword);
router.post("/reset-password", requireFields(["email", "otp", "newPassword"]), resetPassword);
router.get("/verify-email", verifyEmail);

export default router;
