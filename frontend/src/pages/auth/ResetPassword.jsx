// src/pages/ResetPassword.jsx
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

const ResetPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || ""; // from ForgotPassword page

  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    if (!email) {
      setMessage("Email missing. Please restart password reset.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/reset-password",
        {
          email,
          otp,
          newPassword,
        }
      );

      setMessage(res.data.message);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setMessage(err.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark1 px-6">
      <div className="flex flex-col md:flex-row w-full max-w-4xl bg-dark2 rounded-3xl shadow-2xl overflow-hidden border border-[#1C1436]">
        {/* Left Section */}
        <div className="w-full md:w-1/2 p-10 flex flex-col justify-center">
          <h2 className="text-4xl font-extrabold mb-6 text-primary text-center">
            Reset Password
          </h2>
          <p className="text-gray-300 mb-8 text-center">
            Enter the OTP sent to <span className="text-primary">{email}</span>
          </p>

          <form onSubmit={handleReset} className="space-y-6">
            <div>
              <label className="block text-gray-300 mb-2 font-medium">
                OTP
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter OTP"
                className="w-full px-5 py-3 rounded-xl border border-gray-300 bg-dark3 text-textLight outline-none focus:ring-2 focus:ring-primary focus:border-primary transition"
                required
              />
            </div>

            <div>
              <label className="block text-gray-300 mb-2 font-medium">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter New Password"
                className="w-full px-5 py-3 rounded-xl border border-gray-300 bg-dark3 text-textLight outline-none focus:ring-2 focus:ring-primary focus:border-primary transition"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-3 rounded-xl font-semibold text-lg shadow-md hover:bg-secondary hover:shadow-lg transition-all duration-300"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>

            {message && (
              <p className="text-center text-sm mt-4 text-gray-300">
                {message}
              </p>
            )}
          </form>
        </div>

        {/* Right Section */}
        <div
          className="hidden md:flex md:w-1/2 p-10 flex-col justify-center items-center text-center relative"
          style={{
            backdropFilter: "blur(20px)",
            background: `linear-gradient(135deg, rgba(14,166,240,0.4) 0%, rgba(167,86,250,0.4) 50%, rgba(14,166,240,0.2) 100%)`,
          }}
        >
          <div className="bg-white/10 p-6 rounded-xl mb-6">
            <svg
              className="w-12 h-12 text-white mb-4 mx-auto"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2M8 11V7a4 4 0 118 0v4M4 11h16v10H4V11z"
              />
            </svg>
          </div>
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Secure Password Reset
          </h3>
          <p className="text-gray-300 max-w-xs">
            Enter your OTP and create a new password to securely regain access.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
