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
      alternatePhone: { type: String, trim: true, default: "" },
      dateOfBirth: { type: Date, default: null },
      gender: { type: String, trim: true, default: "" },
      maritalStatus: { type: String, trim: true, default: "" },
      bloodGroup: { type: String, trim: true, default: "" },
      nationality: { type: String, trim: true, default: "" },
      address: { type: mongoose.Schema.Types.Mixed, default: "" },
      emergencyContact: {
        name: { type: String, trim: true, default: "" },
        relationship: { type: String, trim: true, default: "" },
        phone: { type: String, trim: true, default: "" },
        address: { type: String, trim: true, default: "" },
      },
      profilePictureUrl: { type: String, trim: true, default: "" },
    },
    job: {
      title: { type: String, trim: true, default: "" },
      department: { type: String, trim: true, default: "" },
      managerName: { type: String, trim: true, default: "" },
      joinDate: { type: Date, default: null },
      employmentType: { type: String, trim: true, default: "" },
      probationEndDate: { type: Date, default: null },
      workLocation: { type: String, trim: true, default: "" },
      workEmail: { type: String, trim: true, default: "" },
      workPhone: { type: String, trim: true, default: "" },
    },
    salary: {
      basic: { type: Number, default: 0 },
      hra: { type: Number, default: 0 },
      da: { type: Number, default: 0 },
      specialAllowance: { type: Number, default: 0 },
      transportAllowance: { type: Number, default: 0 },
      medicalAllowance: { type: Number, default: 0 },
      pf: { type: Number, default: 0 },
      professionalTax: { type: Number, default: 0 },
      incomeTax: { type: Number, default: 0 },
      currency: { type: String, trim: true, default: "INR" },
    },
    bank: {
      accountHolderName: { type: String, trim: true, default: "" },
      bankName: { type: String, trim: true, default: "" },
      accountNumber: { type: String, trim: true, default: "" },
      ifscCode: { type: String, trim: true, default: "" },
      branch: { type: String, trim: true, default: "" },
      accountType: { type: String, trim: true, default: "" },
    },
    skills: { type: [String], default: [] },
    certifications: {
      type: [
        {
          name: { type: String, trim: true, default: "" },
          issuingOrganization: { type: String, trim: true, default: "" },
          issueDate: { type: Date, default: null },
          expirationDate: { type: Date, default: null },
          credentialId: { type: String, trim: true, default: "" },
          credentialUrl: { type: String, trim: true, default: "" },
        },
      ],
      default: [],
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
          category: { type: String, trim: true, default: "other" },
          fileName: { type: String, trim: true, default: "" },
          fileUrl: { type: String, trim: true, default: "" },
          uploadDate: { type: Date, default: null },
          url: { type: String, trim: true, default: "" },
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
