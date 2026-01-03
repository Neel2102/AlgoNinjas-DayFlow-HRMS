import express from "express";
import { listPayroll, myPayroll, upsertPayroll } from "../controllers/payrollController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { requireRole } from "../middlewares/roleMiddleware.js";

const router = express.Router();

router.get("/me", requireAuth, myPayroll);

router.get("/", requireAuth, requireRole("admin"), listPayroll);
router.put("/:userId/:month", requireAuth, requireRole("admin"), upsertPayroll);

export default router;
