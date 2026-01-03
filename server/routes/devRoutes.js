import express from "express";

import { seedDevData } from "../controllers/devController.js";

const router = express.Router();

router.post("/seed", seedDevData);

export default router;
