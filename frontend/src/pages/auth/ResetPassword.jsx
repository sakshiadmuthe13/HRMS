import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import { KeyRound, Lock, ChevronLeft, ShieldAlert } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

const ResetPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || "";

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
        `${API_BASE}/auth/reset-password`,
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
    <div className="min-h-screen flex items-center justify-center bg-surface px-6 relative overflow-hidden">
      {/* Page Background Bubbles */}
      <div className="absolute top-[-25%] left-[-15%] w-[50vw] h-[50vw] rounded-full bg-[#1A9DC2] opacity-10 z-0 pointer-events-none"></div>
      <div className="absolute bottom-[-40%] right-[-20%] w-[60vw] h-[60vw] rounded-full bg-[#12637E] opacity-5 z-0 pointer-events-none"></div>

      {/* Decorative Full Bubbles */}
      <div className="absolute top-[-200px] right-[10%] md:right-[15%] w-[300px] h-[300px] rounded-full bg-[#1A9DC2] opacity-10 z-0 pointer-events-none"></div>
      <div className="absolute bottom-[-200px] left-[10%] md:left-[15%] w-[300px] h-[300px] rounded-full bg-[#12637E] opacity-10 z-0 pointer-events-none"></div>

      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
      <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-secondary/5 rounded-full blur-3xl -ml-20 -mb-20"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col md:flex-row w-full max-w-5xl bg-white rounded-[2.5rem] shadow-2xl shadow-primary/10 overflow-hidden border border-gray-200 z-10"
      >
        {/* Left Section */}
        <div className="w-full md:w-1/2 p-10 lg:p-16 flex flex-col justify-center">
          <div className="mb-10 text-center">
            <h2 className="text-4xl font-black mb-3 text-primary tracking-tight">
              Reset Password
            </h2>
            <p className="text-secondary font-medium">
              Enter the OTP sent to <span className="text-primary font-bold">{email}</span>
            </p>
          </div>

          <form onSubmit={handleReset} className="space-y-6">
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-primary/70 uppercase tracking-widest ml-1">
                One-Time Password (OTP)
              </label>
              <div className="relative">
                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary" size={20} />
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit OTP"
                  className="w-full pl-12 pr-5 py-4 rounded-2xl border border-gray-200 bg-gray-50 text-primary outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-medium"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-primary/70 uppercase tracking-widest ml-1">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary" size={20} />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-5 py-4 rounded-2xl border border-gray-200 bg-gray-50 text-primary outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-medium"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-primary/20 hover:bg-secondary transition-all duration-300 disabled:opacity-50 active:scale-[0.98]"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>

            {message && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-sm font-bold text-primary bg-primary/5 p-4 rounded-xl border border-primary/10"
              >
                {message}
              </motion.p>
            )}

            <div className="pt-4">
              <button
                onClick={() => navigate("/login")}
                className="w-full flex items-center justify-center gap-2 text-secondary hover:text-primary font-bold transition group"
              >
                <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                Back to Login
              </button>
            </div>
          </form>
        </div>

        {/* Right Section */}
        <div
          className="hidden md:flex md:w-1/2 p-12 lg:p-16 flex-col justify-center items-center text-center relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, #12637E 0%, #1A9DC2 100%)`,
          }}
        >
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
            <div className="grid grid-cols-6 gap-4 rotate-12">
              {[...Array(24)].map((_, i) => (
                <div key={i} className="w-12 h-12 bg-white rounded-xl"></div>
              ))}
            </div>
          </div>

          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="z-10"
          >
            <div className="bg-white/20 p-6 rounded-[2rem] mb-8 inline-block backdrop-blur-md">
              <ShieldAlert size={48} className="text-white" />
            </div>
            <h3 className="text-3xl lg:text-4xl font-black text-white mb-6 tracking-tight">
              Finalize Security
            </h3>
            <p className="text-white/80 font-medium leading-relaxed max-w-sm mx-auto">
              Please enter the code sent to your email and choose a strong new password to regain access to your account.
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
