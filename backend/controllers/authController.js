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
  try {
    const { email } = req.body;
    if (!email || !email.trim()) {
      return res.status(400).json({ message: "Please enter your email address." });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: { $regex: new RegExp(`^${cleanEmail}$`, "i") } });
    if (!user) {
      return res.status(404).json({ message: "No registered account found with this email." });
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins validity

    await ResetToken.deleteMany({ email: cleanEmail }); // clear old
    await ResetToken.create({ email: cleanEmail, otp, expiresAt });

    console.log(`🔑 [Forgot Password] Generating OTP ${otp} for ${cleanEmail}...`);
    await sendMail(
      cleanEmail,
      "Password Reset OTP - Qirotech EMS",
      `Your OTP for password reset is ${otp}. It is valid for 10 minutes.`,
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
              <h1 style="margin:0; color:#fff; font-size:24px;">Qirotech Innovation Pvt. Ltd.</h1>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding:30px 25px; text-align:center;">
              <p style="font-size:16px; color:#555; margin-bottom:20px;">
                Hello <strong>${user.name}</strong>,
              </p>
              <p style="font-size:15px; color:#555; margin-bottom:30px;">
                You requested a password reset for your EMS account. Use the OTP below to reset your password. This OTP is valid for <strong>10 minutes</strong>.
              </p>
              
              <!-- OTP Code -->
              <div style="background-color:#f0f9ff; border: 2px dashed #0EA6F0; padding: 15px; border-radius: 12px; display: inline-block;">
                <p style="font-size:32px; font-weight:bold; color:#0EA6F0; letter-spacing:5px; margin:0;">
                  ${otp}
                </p>
              </div>
              
              <p style="font-size:13px; color:#777; margin-top:25px;">
                If you did not request a password reset, please ignore this email.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color:#f0f3f8; text-align:center; padding:20px 15px;">
              <p style="margin:0; font-size:12px; color:#999;">
                &copy; 2026 Qirotech Innovation Pvt. Ltd. All rights reserved.
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
    console.log(`✅ [Forgot Password] OTP email successfully sent to ${cleanEmail}`);

    return res.status(200).json({ message: "OTP sent to your registered email successfully." });
  } catch (error) {
    console.error("forgotPassword error:", error);
    return res.status(500).json({ message: "Failed to send OTP email", error: error.message });
  }
};

// Reset Password
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: "Email, OTP, and new password are required." });
    }

    const cleanEmail = email.trim().toLowerCase();
    const tokenData = await ResetToken.findOne({
      email: { $regex: new RegExp(`^${cleanEmail}$`, "i") },
      otp: otp.trim(),
    });

    if (!tokenData) return res.status(400).json({ message: "Invalid OTP code." });

    if (tokenData.expiresAt < Date.now())
      return res.status(400).json({ message: "OTP has expired. Please request a new OTP." });

    const hashed = await bcrypt.hash(newPassword, 10);
    await User.findOneAndUpdate(
      { email: { $regex: new RegExp(`^${cleanEmail}$`, "i") } },
      { password: hashed }
    );
    await ResetToken.deleteMany({ email: { $regex: new RegExp(`^${cleanEmail}$`, "i") } });

    res.json({ message: "Password reset successfully. Please login with your new password." });
  } catch (error) {
    console.error("resetPassword error:", error);
    res.status(500).json({ message: "Failed to reset password", error: error.message });
  }
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
