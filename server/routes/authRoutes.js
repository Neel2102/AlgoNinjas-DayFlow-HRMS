import express from "express";
import { signIn, signUp, verifyEmail } from "../controllers/authController.js";
import { requireFields } from "../middlewares/validateMiddleware.js";

const router = express.Router();

router.post("/signup", requireFields(["employeeId", "email", "password"]), signUp);
router.post("/signin", requireFields(["email", "password"]), signIn);
router.get("/verify-email", verifyEmail);

export default router;
