import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/generateToken.js";
import { generateOTP } from "../utils/otpGenerator.js";
import { sendMail } from "../utils/sendMail.js";
import ResetToken from "../models/ResetToken.js";

// ---------------------- Login ----------------------
export const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user)
    return res.status(400).json({ message: "Invalid email or password" });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch)
    return res.status(400).json({ message: "Invalid email or password" });

  const token = generateToken(user._id, user.role);
  res.json({ token, role: user.role, name: user.name });
};

// Send OTP
export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: "User not found" });

  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins validity

  await ResetToken.deleteMany({ email }); // clear old
  await ResetToken.create({ email, otp, expiresAt });

  await sendMail(
    email,
    "Password Reset OTP",
    `Your OTP for password reset is ${otp}. It is valid for 5 minutes.`,
    `
    <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Password Reset OTP</title>
</head>
<body style="margin:0; padding:0; font-family: Arial, sans-serif; background-color:#f4f6fa; color:#333;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6fa; padding:20px 0;">
    <tr>
      <td align="center">
        <table width="500" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 10px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(90deg, #0EA6F0, #A756FA); text-align:center; padding:30px 20px; border-top-left-radius:12px; border-top-right-radius:12px;">
              <h1 style="margin:0; color:#fff; font-size:24px;">QiroTech Innovation Pvt. Ltd.</h1>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding:30px 25px; text-align:center;">
              <p style="font-size:16px; color:#555; margin-bottom:30px;">
                You requested a password reset. Use the OTP below to reset your password. This OTP is valid for <strong>5 minutes</strong>.
              </p>
              
              <!-- OTP Code -->
              <p style="font-size:28px; font-weight:bold; color:#0EA6F0; letter-spacing:3px; margin:20px 0;">
                ${otp}
              </p>
              
              <p style="font-size:14px; color:#777; margin-top:20px;">
                If you did not request a password reset, please ignore this email.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color:#f0f3f8; text-align:center; padding:20px 15px;">
              <p style="margin:0; font-size:12px; color:#999;">
                &copy; 2025 QiroTech Innovation Pvt. Ltd. All rights reserved.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>

    `
  );

  res.json({ message: "OTP sent to your registered email." });
};

// Reset Password
export const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  const tokenData = await ResetToken.findOne({ email, otp });
  if (!tokenData) return res.status(400).json({ message: "Invalid OTP." });

  if (tokenData.expiresAt < Date.now())
    return res.status(400).json({ message: "OTP expired." });

  const hashed = await bcrypt.hash(newPassword, 10);
  await User.findOneAndUpdate({ email }, { password: hashed });
  await ResetToken.deleteMany({ email });

  res.json({ message: "Password reset successfully. Please login again." });
};

// Logout (clear cookie/session)
export const logout = async (req, res) => {
  try {
    // If JWT is stored in an httpOnly cookie named 'token', clear it
    res.clearCookie && res.clearCookie("token", { httpOnly: true, path: "/" });
  } catch (e) {
    // ignore
  }
  return res.json({ message: "Logged out" });
};

// Get profile of the currently logged-in user
export const getProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(req.user);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch profile info" });
  }
};
