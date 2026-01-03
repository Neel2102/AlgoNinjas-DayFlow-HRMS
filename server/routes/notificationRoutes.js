import express from "express";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { requireRole } from "../middlewares/roleMiddleware.js";
import {
  alertUser,
  broadcastAlert,
  getMyNotifications,
  markNotificationRead,
} from "../controllers/notificationController.js";

const router = express.Router();

router.get("/my", requireAuth, getMyNotifications);
router.post("/my/:id/read", requireAuth, markNotificationRead);

router.post("/broadcast", requireAuth, requireRole("admin", "hr"), broadcastAlert);
router.post("/user/:userId", requireAuth, requireRole("admin", "hr"), alertUser);

export default router;
