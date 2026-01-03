import express from "express";
import {
  getEmployeeById,
  getMyProfile,
  listEmployees,
  updateEmployeeById,
  updateMyProfile,
} from "../controllers/employeeController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { requireRole } from "../middlewares/roleMiddleware.js";

const router = express.Router();

router.get("/me", requireAuth, getMyProfile);
router.put("/me", requireAuth, updateMyProfile);

router.get("/", requireAuth, requireRole("admin", "hr"), listEmployees);
router.get("/:id", requireAuth, requireRole("admin", "hr"), getEmployeeById);
router.put("/:id", requireAuth, requireRole("admin", "hr"), updateEmployeeById);

export default router;
