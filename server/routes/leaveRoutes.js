import express from "express";
import {
  applyLeave,
  approveLeave,
  listLeaves,
  myLeaves,
  rejectLeave,
} from "../controllers/leaveController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { requireRole } from "../middlewares/roleMiddleware.js";

const router = express.Router();

router.post("/", requireAuth, applyLeave);
router.get("/me", requireAuth, myLeaves);

router.get("/", requireAuth, requireRole("admin", "hr"), listLeaves);
router.patch("/:id/approve", requireAuth, requireRole("admin", "hr"), approveLeave);
router.patch("/:id/reject", requireAuth, requireRole("admin", "hr"), rejectLeave);

export default router;
