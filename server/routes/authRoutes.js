import express from "express";
import { resendOtp, signIn, signUp, verifyEmail, verifyOtp } from "../controllers/authController.js";
import { requireFields } from "../middlewares/validateMiddleware.js";

const router = express.Router();

router.post("/signup", requireFields(["employeeId", "email", "password"]), signUp);
router.post("/signin", requireFields(["email", "password"]), signIn);
router.post("/verify-otp", requireFields(["email", "otp"]), verifyOtp);
router.post("/resend-otp", requireFields(["email"]), resendOtp);
router.get("/verify-email", verifyEmail);

export default router;
