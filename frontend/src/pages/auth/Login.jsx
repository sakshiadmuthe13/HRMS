import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, User, ArrowLeft, Eye, EyeOff } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

/* ─── Role colour map ─────────────────────────────────── */
const ROLE_CONFIG = {
  admin: {
    label: "Admin",
    bg: "bg-[#12637E]",
    text: "text-white",
    ring: "ring-[#12637E]/30",
    icon: "🛡️",
  },
  employee: {
    label: "Employee",
    bg: "bg-[#1A9DC2]",
    text: "text-white",
    ring: "ring-[#1A9DC2]/30",
    icon: "👤",
  },
  hr: {
    label: "HR Manager",
    bg: "bg-purple-600",
    text: "text-white",
    ring: "ring-purple-300",
    icon: "🏢",
  },
  leader: {
    label: "Project Leader",
    bg: "bg-amber-500",
    text: "text-white",
    ring: "ring-amber-300",
    icon: "⭐",
  },
};

/* ─── Animated green-tick SVG ─────────────────────────── */
const GreenTick = () => (
  <div className="relative flex items-center justify-center">
    {/* Pulsing ring */}
    <span className="absolute w-28 h-28 rounded-full bg-green-100 animate-ping opacity-30" />
    <span className="absolute w-24 h-24 rounded-full bg-green-50" />

    {/* Circle + checkmark */}
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.15 }}
      className="relative w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-xl shadow-green-400/40"
    >
      <motion.svg
        viewBox="0 0 52 52"
        className="w-10 h-10"
        fill="none"
        stroke="white"
        strokeWidth={4}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <motion.path
          d="M14 27 L22 35 L38 17"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.4, delay: 0.4, ease: "easeOut" }}
        />
      </motion.svg>
    </motion.div>
  </div>
);

/* ─── Success Popup Overlay ───────────────────────────── */
const LoginSuccessPopup = ({ name, role }) => {
  const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.employee;

  return (
    <motion.div
      key="success-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[999] flex items-center justify-center"
      style={{ backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", backgroundColor: "rgba(249,250,251,0.75)" }}
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: -20 }}
        transition={{ type: "spring", stiffness: 280, damping: 24, delay: 0.05 }}
        className="relative bg-white rounded-[2.5rem] shadow-[0_30px_80px_rgba(0,0,0,0.12)] border border-gray-100 px-12 py-12 flex flex-col items-center gap-6 max-w-sm w-full mx-4 overflow-hidden"
      >
        {/* top accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 rounded-t-[2.5rem]" />

        {/* decorative blobs */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-green-50 rounded-full opacity-60 pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-28 h-28 bg-emerald-50 rounded-full opacity-60 pointer-events-none" />

        <GreenTick />

        <div className="text-center space-y-1.5 relative z-10">
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-2xl font-black text-gray-900 tracking-tight"
          >
            Login Successful!
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-base font-bold text-gray-600"
          >
            Welcome back,{" "}
            <span className="text-[#12637E] font-black">{name}</span>
          </motion.p>
        </div>

        {/* Role badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7, type: "spring", stiffness: 200 }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full ${cfg.bg} ${cfg.text} text-sm font-black tracking-wide shadow-lg ring-4 ${cfg.ring}`}
        >
          <span className="text-base">{cfg.icon}</span>
          {cfg.label}
        </motion.div>

        {/* Redirect message + progress bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.85 }}
          className="flex flex-col items-center gap-3 w-full relative z-10"
        >
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
            Redirecting to your dashboard…
          </p>
          {/* animated progress bar */}
          <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 1.6, ease: "linear", delay: 0.2 }}
            />
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

/* ─── Main Login Component ────────────────────────────── */
const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [successData, setSuccessData] = useState(null); // { name, role }
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);
      localStorage.setItem("name", data.name);

      // Show success popup first, then navigate
      setSuccessData({ name: data.name, role: data.role });

      const routeMap = {
        admin: "/admin-dashboard",
        leader: "/leader-dashboard",
        employee: "/employee-dashboard",
        hr: "/hr-dashboard",
      };
      const destination = routeMap[data.role] || "/";

      setTimeout(() => {
        navigate(destination);
      }, 1900);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* ── Success Popup Overlay ── */}
      <AnimatePresence>
        {successData && (
          <LoginSuccessPopup name={successData.name} role={successData.role} />
        )}
      </AnimatePresence>

      {/* ── Login Page ── */}
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
              <div className="bg-white rounded-l-full py-2.5 pl-8 pr-10 text-[13px] font-black tracking-wide shadow-lg text-[#12637E] relative z-10 flex items-center">
                LOGIN
              </div>
              <Link to="/forgot-password" className="py-2.5 pr-10 text-[13px] font-black tracking-wide text-white/70 hover:text-white transition mt-1">
                Recover
              </Link>
            </div>
          </div>

          {/* Right Form Section */}
          <div className="w-full md:w-[55%] p-10 lg:p-12 flex flex-col justify-center relative bg-white z-10">
            <div className="flex flex-col items-center mb-10">
              <div className="w-[72px] h-[72px] rounded-full bg-gradient-to-b from-[#1A9DC2] to-[#12637E] flex items-center justify-center mb-4 shadow-[0_10px_20px_rgba(18,99,126,0.3)] border-4 border-gray-200 relative">
                <div className="absolute inset-0 rounded-full border border-gray-200/20"></div>
                <User className="text-white" size={32} strokeWidth={2} />
              </div>
              <h2 className="text-[20px] font-black text-[#12637E] tracking-widest uppercase">
                LOGIN
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-7 w-full max-w-[300px] mx-auto">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 text-red-500 p-3 rounded-lg text-xs font-bold border border-red-200 text-center"
                >
                  {error}
                </motion.div>
              )}

              <div className="relative border-b-[1.5px] border-gray-200 focus-within:border-[#12637E] transition-colors py-2 flex items-center group">
                <User className="text-gray-500 group-focus-within:text-[#12637E] mr-4 transition-colors" size={18} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email"
                  className="w-full bg-transparent outline-none text-gray-900 placeholder-gray-400 text-[13px] font-semibold"
                  required
                />
              </div>

              <div className="relative border-b-[1.5px] border-gray-200 focus-within:border-[#12637E] transition-colors py-2 flex items-center group">
                <Lock className="text-gray-500 group-focus-within:text-[#12637E] mr-4 transition-colors" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Password"
                  className="w-full bg-transparent outline-none text-gray-900 placeholder-gray-400 text-[13px] font-semibold pr-8"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 text-gray-400 hover:text-[#12637E] transition-colors focus:outline-none"
                  tabIndex="-1"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <div className="flex items-center justify-between pt-4">
                <Link to="/forgot-password" className="text-[10px] font-bold text-[#1A9DC2] hover:text-[#12637E] transition">
                  Forgot Password?
                </Link>
                <button
                  type="submit"
                  disabled={loading || !!successData}
                  className="bg-[#1A9DC2] hover:bg-[#12637E] text-white px-8 py-2.5 rounded-full font-bold text-[12px] tracking-wide shadow-[0_5px_15px_rgba(72,138,160,0.4)] transition-all duration-300 disabled:opacity-50 active:scale-95"
                >
                  {loading ? "..." : "LOGIN"}
                </button>
              </div>
            </form>

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
    </>
  );
};

export default Login;
