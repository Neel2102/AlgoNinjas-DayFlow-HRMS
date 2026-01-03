import nodemailer from "nodemailer";

const cleanEnv = (v) => String(v || "").trim().replace(/^"|"$/g, "").replace(/^'|'$/g, "");
const cleanPass = (v) => cleanEnv(v).replace(/\s+/g, "");

const SMTP_USER = cleanEnv(process.env.SMTP_USER);
const SMTP_PASS = cleanPass(process.env.SMTP_PASS);

const transporter = nodemailer.createTransport({
  service: "gmail",
  secure: true,
  port: 465,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

transporter.verify((err) => {
  if (err) {
    console.error("[mail] transporter verify failed:", err?.message || err);
  } else {
    console.log("[mail] transporter ready (user:", SMTP_USER + ")");
  }
});

export const getSenderEmail = () => {
  // For Gmail, safest is to send FROM the authenticated address.
  return SMTP_USER;
};

export const getReplyToEmail = () => {
  const reply = cleanEnv(process.env.SENDER_EMAIL);
  return reply || undefined;
};

export default transporter;