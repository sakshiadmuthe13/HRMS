import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import { Mail, ShieldCheck, ArrowLeft } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await axios.post(
        `${API_BASE}/auth/forgot-password`,
        { email }
      );
      setMessage(res.data.message);
      setTimeout(() => {
        navigate("/reset-password", { state: { email } });
      }, 2000);
    } catch (err) {
      setMessage(err.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] p-6 font-sans relative overflow-hidden">
      {/* Page Background Bubbles */}
      <div className="absolute top-[-25%] left-[-15%] w-[50vw] h-[50vw] rounded-full bg-[#1A9DC2] opacity-10 z-0 pointer-events-none"></div>
      <div className="absolute bottom-[-40%] right-[-20%] w-[60vw] h-[60vw] rounded-full bg-[#12637E] opacity-5 z-0 pointer-events-none"></div>

      {/* Decorative Full Bubbles */}
      <div className="absolute top-[-200px] right-[10%] md:right-[15%] w-[300px] h-[300px] rounded-full bg-[#1A9DC2] opacity-10 z-0 pointer-events-none"></div>
      <div className="absolute bottom-[-200px] left-[10%] md:left-[15%] w-[300px] h-[300px] rounded-full bg-[#12637E] opacity-10 z-0 pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[850px] bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex flex-col md:flex-row overflow-hidden relative z-10"
        style={{ minHeight: '500px' }}
      >
        {/* Left Decorative Section */}
        <div className="hidden md:flex md:w-[45%] relative overflow-hidden flex-col justify-center z-0">
          {/* Company Image Background */}
          <img
            src="/company-img.webp"
            alt="Company Facility"
            className="absolute inset-0 w-full h-full object-cover z-0"
          />
          {/* Thematic Overlays for color consistency */}
          <div className="absolute inset-0 bg-[#12637E]/20 mix-blend-multiply z-0"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#12637E] to-transparent opacity-80 z-0"></div>

          {/* Toggle buttons overlay */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col items-end z-20">
            <Link to="/login" className="py-2.5 pr-10 text-[13px] font-black tracking-wide text-white/70 hover:text-white transition">
              LOGIN
            </Link>
            <div className="bg-white rounded-l-full py-2.5 pl-8 pr-10 text-[13px] font-black tracking-wide shadow-lg text-[#12637E] relative z-10 flex items-center mt-2">
              RECOVER
            </div>
          </div>
        </div>

        {/* Right Form Section */}
        <div className="w-full md:w-[55%] p-10 lg:p-12 flex flex-col justify-center relative bg-white z-10">
          <div className="flex flex-col items-center mb-10">
            <div className="w-[72px] h-[72px] rounded-full bg-gradient-to-b from-[#1A9DC2] to-[#12637E] flex items-center justify-center mb-4 shadow-[0_10px_20px_rgba(18,99,126,0.3)] border-4 border-gray-200 relative">
              <div className="absolute inset-0 rounded-full border border-gray-200/20"></div>
              <ShieldCheck className="text-white" size={32} strokeWidth={2} />
            </div>
            <h2 className="text-[20px] font-black text-[#12637E] tracking-widest uppercase">
              Recovery
            </h2>
          </div>

          <form onSubmit={handleEmailSubmit} className="space-y-7 w-full max-w-[300px] mx-auto">
            <div className="relative border-b-[1.5px] border-gray-200 focus-within:border-[#12637E] transition-colors py-2 flex items-center group">
              <Mail className="text-gray-500 group-focus-within:text-[#12637E] mr-4 transition-colors" size={18} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Registered Email"
                className="w-full bg-transparent outline-none text-gray-900 placeholder-gray-400 text-[13px] font-semibold"
                required
              />
            </div>

            <div className="flex items-center justify-center pt-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-[#1A9DC2] hover:bg-[#12637E] text-white px-10 py-2.5 rounded-full font-bold text-[12px] tracking-wide shadow-[0_5px_15px_rgba(72,138,160,0.4)] transition-all duration-300 disabled:opacity-50 active:scale-95 w-full"
              >
                {loading ? "..." : "SEND OTP"}
              </button>
            </div>

            {message && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-[11px] font-bold text-[#12637E] bg-[#12637E]/5 p-3 rounded-lg border border-[#12637E]/10"
              >
                {message}
              </motion.p>
            )}
          </form>
          <div className="mt-12 w-full max-w-[300px] mx-auto flex items-center justify-center text-[11px] font-bold text-gray-900">
            <span>Remembered? </span>
            <Link to="/login" className="ml-1 text-[#12637E] hover:underline">
              Sign In
            </Link>
          </div>

          <div className="pt-10 text-center text-[13px] font-black text-[#1A9DC2] hover:text-[#12637E] transition">
            <Link to="/">
              <div className="flex items-center gap-2 justify-center">
                <ArrowLeft size={18} /> Back home
              </div>
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;

