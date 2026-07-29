import { validationResult } from "express-validator";
import User from "../models/User.js";
import { signToken } from "../utils/tokens.js";

const ADMIN_EMAIL = "aamirmir08@gmail.com";
const otpStore = new Map();

function normalizeLogin(value = "") {
  return String(value).toLowerCase().trim().replace(/,/g, ".");
}

async function sendOtpMail(otp) {
  const smtpUser = process.env.GMAIL_USER || process.env.SMTP_USER;
  const smtpPass = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS;
  if (!smtpUser || !smtpPass) {
    if (process.env.NODE_ENV === "production") {
      const error = new Error("Gmail SMTP is not configured.");
      error.statusCode = 503;
      error.publicMessage = "Email service is not configured. Please contact the Darsgah administrator.";
      throw error;
    }
    console.log(`Admin password reset OTP: ${otp}`);
    return { configured: false };
  }
  const nodemailer = await import("nodemailer");
  const transporter = nodemailer.default.createTransport({
    service: "gmail",
    auth: { user: smtpUser, pass: smtpPass }
  });
  await transporter.sendMail({
    from: smtpUser,
    to: ADMIN_EMAIL,
    subject: "Darsgah ERP Admin Password Reset OTP",
    text: `Your Darsgah ERP password reset OTP is ${otp}. It expires in 5 minutes.`
  });
  return { configured: true };
}

export async function login(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
  const { password, role } = req.body;
  const normalizedUsername = normalizeLogin(req.body.username);
  const roleFilter = role === "admin" ? { $in: ["super_admin", "admin"] } : role;
  const user = await User.findOne({ username: normalizedUsername, role: roleFilter }).select("+password");
  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ message: "Invalid credentials" });
  }
  if (!user.isActive) return res.status(403).json({ message: "Login is disabled. Contact admin." });
  if (normalizedUsername === ADMIN_EMAIL && user.role === "admin") {
    user.role = "super_admin";
    user.email = ADMIN_EMAIL;
  }
  user.lastLoginAt = new Date();
  await user.save();
  res.json({
    token: signToken(user),
    user: { id: user._id, name: user.name, username: user.username, role: user.role, mustChangePassword: user.mustChangePassword },
    role: role === "admin" ? "admin" : user.role
  });
}

export async function me(req, res) {
  res.json({ user: req.user });
}

export async function forgotPasswordRequest(req, res) {
  const email = normalizeLogin(req.body.email);
  if (email !== ADMIN_EMAIL) return res.status(403).json({ message: "Password reset is allowed only for the super admin email." });
  const admin = await User.findOne({ username: ADMIN_EMAIL, role: { $in: ["super_admin", "admin"] } });
  if (!admin) return res.status(404).json({ message: "Super admin account not found. Run npm run seed." });
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  otpStore.set(ADMIN_EMAIL, { otp, expiresAt: Date.now() + 5 * 60 * 1000, verified: false });
  try {
    const mail = await sendOtpMail(otp);
    res.json({ message: mail.configured ? "OTP sent to super admin email." : "OTP generated for local testing. Configure Gmail SMTP to send email." });
  } catch (error) {
    otpStore.delete(ADMIN_EMAIL);
    console.error("Failed to send admin reset OTP:", error.message);
    res.status(error.statusCode || 500).json({ message: error.publicMessage || "Could not send OTP email. Please try again later." });
  }
}

export async function forgotPasswordVerify(req, res) {
  const email = normalizeLogin(req.body.email);
  const entry = otpStore.get(email);
  if (email !== ADMIN_EMAIL || !entry || entry.expiresAt < Date.now() || entry.otp !== String(req.body.otp || "").trim()) {
    return res.status(422).json({ message: "Invalid or expired OTP" });
  }
  entry.verified = true;
  otpStore.set(email, entry);
  res.json({ message: "OTP verified. You can reset the password now." });
}

export async function forgotPasswordReset(req, res) {
  const email = normalizeLogin(req.body.email);
  const entry = otpStore.get(email);
  const password = String(req.body.password || "");
  if (email !== ADMIN_EMAIL || !entry || !entry.verified || entry.expiresAt < Date.now()) {
    return res.status(422).json({ message: "OTP verification required or expired" });
  }
  if (password.length < 6 || password !== req.body.confirmPassword) {
    return res.status(422).json({ message: "Passwords must match and be at least 6 characters" });
  }
  const admin = await User.findOne({ username: ADMIN_EMAIL, role: { $in: ["super_admin", "admin"] } }).select("+password");
  if (!admin) return res.status(404).json({ message: "Super admin account not found" });
  admin.password = password;
  await admin.save();
  otpStore.delete(email);
  res.json({ message: "Admin password reset successfully." });
}
