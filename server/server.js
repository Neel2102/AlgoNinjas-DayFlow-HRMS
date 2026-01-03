import connectDB from "./config/mongodb.js";
import express from "express";
const app = express();
import 'dotenv/config';
import cors from 'cors';
import helmet from "helmet";
import compression from "compression";

import authRoutes from "./routes/authRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import leaveRoutes from "./routes/leaveRoutes.js";
import payrollRoutes from "./routes/payrollRoutes.js";
import { errorHandler, notFound } from "./middlewares/errorMiddleware.js";

app.use(express.json());
app.use(cors({ origin: process.env.CORS_ORIGIN || true, credentials: true }));
app.use(helmet());
app.use(compression());

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/payroll", payrollRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

connectDB();