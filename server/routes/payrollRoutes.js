import express from "express";
import {
  generatePayrollForAll,
  generatePayrollForUser,
  listPayroll,
  myPayroll,
} from "../controllers/payrollController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { requireRole } from "../middlewares/roleMiddleware.js";

const router = express.Router();

router.get("/me", requireAuth, myPayroll);

router.get("/", requireAuth, requireRole("admin", "hr"), listPayroll);

router.post("/:userId/:month/generate", requireAuth, requireRole("admin", "hr"), generatePayrollForUser);
router.post("/generate/:month", requireAuth, requireRole("admin", "hr"), generatePayrollForAll);

export default router;
