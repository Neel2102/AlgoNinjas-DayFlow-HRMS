import express from "express";
import {
  checkIn,
  checkOut,
  getAllAttendance,
  getMyAttendance,
} from "../controllers/attendanceController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { requireRole } from "../middlewares/roleMiddleware.js";

const router = express.Router();

router.post("/check-in", requireAuth, checkIn);
router.post("/check-out", requireAuth, checkOut);
router.get("/me", requireAuth, getMyAttendance);

router.get("/", requireAuth, requireRole("admin"), getAllAttendance);

export default router;
