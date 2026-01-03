import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    personal: {
      fullName: { type: String, trim: true, default: "" },
      phone: { type: String, trim: true, default: "" },
      address: { type: String, trim: true, default: "" },
      profilePictureUrl: { type: String, trim: true, default: "" },
    },
    job: {
      title: { type: String, trim: true, default: "" },
      department: { type: String, trim: true, default: "" },
      managerName: { type: String, trim: true, default: "" },
      joinDate: { type: Date, default: null },
    },
    salaryStructure: {
      basic: { type: Number, default: 0 },
      allowances: { type: Number, default: 0 },
      deductions: { type: Number, default: 0 },
      currency: { type: String, trim: true, default: "INR" },
    },
    documents: {
      type: [
        {
          name: { type: String, trim: true, required: true },
          url: { type: String, trim: true, required: true },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

const Employee =
  mongoose.models.Employee || mongoose.model("Employee", employeeSchema);

export default Employee;
