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

router.get("/", requireAuth, requireRole("admin"), listEmployees);
router.get("/:id", requireAuth, requireRole("admin"), getEmployeeById);
router.put("/:id", requireAuth, requireRole("admin"), updateEmployeeById);

export default router;
