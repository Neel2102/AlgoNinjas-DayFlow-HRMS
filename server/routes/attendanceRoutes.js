import express from "express";
import {
  breakEnd,
  breakStart,
  checkIn,
  checkOut,
  getAllAttendance,
  getMyMonthAttendance,
  getMyAttendance,
  listPresentByDate,
} from "../controllers/attendanceController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { requireRole } from "../middlewares/roleMiddleware.js";

const router = express.Router();

router.post("/check-in", requireAuth, checkIn);
router.post("/check-out", requireAuth, checkOut);
router.post("/break-start", requireAuth, breakStart);
router.post("/break-end", requireAuth, breakEnd);
router.get("/me", requireAuth, getMyAttendance);
router.get("/me/month", requireAuth, getMyMonthAttendance);

router.get("/present", requireAuth, requireRole("admin", "hr"), listPresentByDate);
router.get("/", requireAuth, requireRole("admin", "hr"), getAllAttendance);

export default router;
