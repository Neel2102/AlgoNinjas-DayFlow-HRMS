import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import connectDB from "../config/mongodb.js";
import User from "../models/User.js";
import Employee from "../models/Employee.js";
import Attendance from "../models/Attendance.js";
import Leave from "../models/Leave.js";

const monthRegex = /^\d{4}-\d{2}$/;

const dateKey = (d) => new Date(d).toISOString().slice(0, 10);

const monthRange = (month) => {
  const [y, m] = String(month).split("-").map((x) => Number(x));
  const start = new Date(y, (m || 1) - 1, 1);
  const end = new Date(y, (m || 1), 0);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  return { start, end };
};

const enumerateWorkingDays = (start, end) => {
  const days = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const day = d.getDay();
    // Mon-Fri only
    if (day !== 0 && day !== 6) days.push(dateKey(d));
  }
  return days;
};

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const makeSalary = () => {
  const basic = randInt(15000, 50000);
  const hra = Math.round(basic * 0.4);
  const da = Math.round(basic * 0.1);
  const specialAllowance = randInt(2000, 12000);
  const transportAllowance = randInt(800, 3000);
  const medicalAllowance = randInt(500, 2000);

  // Rough deductions (not accurate compliance, just demo)
  const pf = Math.round(basic * 0.12);
  const professionalTax = randInt(0, 2000);
  const incomeTax = randInt(0, 8000);

  return {
    basic,
    hra,
    da,
    specialAllowance,
    transportAllowance,
    medicalAllowance,
    pf,
    professionalTax,
    incomeTax,
    currency: "INR",
    monthlyWage: 0,
    yearlyWage: 0,
  };
};

const main = async () => {
  const month = String(process.env.SEED_MONTH || "2026-01").trim();
  const password = String(process.env.SEED_PASSWORD || "Password@123");
  const count = Number(process.env.SEED_COUNT || 20);

  if (!monthRegex.test(month)) {
    throw new Error("SEED_MONTH must be in YYYY-MM format (example: 2026-01)");
  }

  await connectDB();

  // Remove previous demo data only (safe + idempotent)
  const demoUsers = await User.find({ employeeId: { $regex: /^DEMO/ } }).select("_id");
  const demoUserIds = demoUsers.map((u) => u._id);

  if (demoUserIds.length > 0) {
    await Promise.all([
      Attendance.deleteMany({ user: { $in: demoUserIds } }),
      Leave.deleteMany({ user: { $in: demoUserIds } }),
      Employee.deleteMany({ user: { $in: demoUserIds } }),
      User.deleteMany({ _id: { $in: demoUserIds } }),
    ]);
  }

  const firstNames = [
    "Aarav",
    "Vivaan",
    "Aditya",
    "Vihaan",
    "Arjun",
    "Reyansh",
    "Muhammad",
    "Sai",
    "Arnav",
    "Krishna",
    "Ishaan",
    "Shaurya",
    "Atharv",
    "Dhruv",
    "Kabir",
    "Ananya",
    "Diya",
    "Isha",
    "Aadhya",
    "Meera",
    "Saanvi",
    "Myra",
    "Aarohi",
    "Kiara",
  ];
  const lastNames = [
    "Sharma",
    "Verma",
    "Gupta",
    "Patel",
    "Reddy",
    "Iyer",
    "Khan",
    "Singh",
    "Jain",
    "Mehta",
    "Nair",
    "Das",
  ];
  const departments = ["Engineering", "HR", "Finance", "Sales", "Operations", "Support"];
  const titles = ["Software Engineer", "Analyst", "Executive", "Associate", "Manager"];

  const passwordHash = await bcrypt.hash(password, 10);

  const users = [];
  for (let i = 1; i <= count; i += 1) {
    const fn = pick(firstNames);
    const ln = pick(lastNames);
    const fullName = `${fn} ${ln}`;
    const employeeId = `DEMO${String(i).padStart(3, "0")}`;
    const email = `demo${String(i).padStart(3, "0")}@hrms.local`;

    const user = await User.create({
      employeeId,
      email,
      passwordHash,
      role: "employee",
      isEmailVerified: true,
      emailVerificationToken: null,
      emailVerificationTokenExpiresAt: null,
      emailOtpHash: null,
      emailOtpExpiresAt: null,
      passwordResetOtpHash: null,
      passwordResetOtpExpiresAt: null,
    });

    await Employee.create({
      user: user._id,
      personal: {
        fullName,
        phone: `9${randInt(100000000, 999999999)}`,
        gender: pick(["Male", "Female", "Other"]),
        address: {
          line1: `${randInt(1, 200)} ${pick(["MG Road", "Park Street", "Link Road", "Station Road"])}`,
          line2: "",
          city: pick(["Mumbai", "Pune", "Bengaluru", "Hyderabad", "Delhi", "Chennai"]),
          state: pick(["MH", "KA", "TS", "DL", "TN"]),
          country: "India",
          postalCode: String(randInt(100000, 999999)),
        },
      },
      job: {
        title: pick(titles),
        department: pick(departments),
        joinDate: new Date(Date.now() - randInt(30, 900) * 24 * 60 * 60 * 1000),
        employmentType: pick(["Full-time", "Intern", "Contract"]),
        workLocation: pick(["Office", "Remote", "Hybrid"]),
        workEmail: email,
      },
      salary: makeSalary(),
      bank: {
        accountHolderName: fullName,
        bankName: pick(["HDFC", "ICICI", "SBI", "Axis", "Kotak"]),
        accountNumber: String(randInt(10 ** 9, 10 ** 10 - 1)),
        ifscCode: `DEMO0${randInt(1000, 9999)}`,
        branch: pick(["Main", "Central", "City", "Industrial"]),
        accountType: pick(["Savings", "Current"]),
      },
      documents: [],
    });

    users.push({ user, fullName });
  }

  const { start, end } = monthRange(month);
  const workingDays = enumerateWorkingDays(start, end);

  // Create attendance & some approved leave
  for (const { user } of users) {
    // random 1-2 leave blocks per employee (approved)
    const leaveBlocks = randInt(0, 2);
    const leaveDates = new Set();

    for (let b = 0; b < leaveBlocks; b += 1) {
      if (workingDays.length < 5) break;
      const startIdx = randInt(0, Math.max(0, workingDays.length - 4));
      const len = randInt(1, 3);
      const startStr = workingDays[startIdx];
      const endStr = workingDays[Math.min(workingDays.length - 1, startIdx + len - 1)];

      const leave = await Leave.create({
        user: user._id,
        type: pick(["Paid", "Sick", "Unpaid"]),
        startDate: new Date(`${startStr}T00:00:00.000Z`),
        endDate: new Date(`${endStr}T00:00:00.000Z`),
        remarks: "Demo leave",
        status: "Approved",
        adminComment: "Approved (demo)",
        decidedBy: null,
        decidedAt: new Date(),
      });

      // Mark attendance Leave for those dates
      const s = new Date(leave.startDate);
      const e = new Date(leave.endDate);
      s.setHours(0, 0, 0, 0);
      e.setHours(0, 0, 0, 0);
      for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
        leaveDates.add(dateKey(d));
      }
    }

    const ops = [];
    for (const day of workingDays) {
      let status;

      if (leaveDates.has(day)) {
        status = "Leave";
      } else {
        const r = Math.random();
        if (r < 0.78) status = "Present";
        else if (r < 0.86) status = "Half-day";
        else status = "Absent";
      }

      const checkInAt = status === "Present" || status === "Half-day"
        ? new Date(`${day}T${String(randInt(9, 11)).padStart(2, "0")}:${String(randInt(0, 59)).padStart(2, "0")}:00.000Z`)
        : null;

      const checkOutAt = status === "Present" || status === "Half-day"
        ? new Date(`${day}T${String(randInt(17, 19)).padStart(2, "0")}:${String(randInt(0, 59)).padStart(2, "0")}:00.000Z`)
        : null;

      ops.push({
        updateOne: {
          filter: { user: user._id, date: day },
          update: { $set: { status, checkInAt, checkOutAt } },
          upsert: true,
        },
      });
    }

    if (ops.length > 0) {
      await Attendance.bulkWrite(ops);
    }
  }

  console.log("\n✅ Demo data seeded successfully");
  console.log(`- Employees created: ${count}`);
  console.log(`- Attendance seeded for month: ${month} (weekdays only)`);
  console.log(`\nLogin for demo employees (email/password):`);
  console.log(`- demo001@hrms.local / ${password}`);
  console.log(`- demo020@hrms.local / ${password}`);

  await mongoose.connection.close();
};

main().catch(async (err) => {
  console.error("\n❌ Seed failed:", err);
  try {
    await mongoose.connection.close();
  } catch (_) {
    // ignore
  }
  process.exit(1);
});
