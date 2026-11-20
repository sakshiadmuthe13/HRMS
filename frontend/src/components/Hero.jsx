import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Calendar, ArrowRight, UserCheck } from "lucide-react";

const Hero = () => {
  const navigate = useNavigate();
  // Demo Dashboard States
  const [clockedIn, setClockedIn] = useState(false);
  const [clockTime, setClockTime] = useState(() => 
    new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    })
  );
  const [activeTab, setActiveTab] = useState("attendance");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setClockTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleCheckDemo = () => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (token && role) {
      if (role === "admin") navigate("/admin-dashboard", { state: { activeTab: "Attendance" } });
      else if (role === "leader") navigate("/leader-dashboard", { state: { activeTab: "Attendance" } });
      else if (role === "employee") navigate("/employee-dashboard", { state: { activeTab: "Attendance" } });
      else if (role === "hr") navigate("/hr-dashboard", { state: { activeTab: "Attendance" } });
      else navigate("/login");
    } else {
      navigate("/login");
    }
  };

  // Heading animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  };

  const wordVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100, damping: 10 } }
  };

  return (
    <section
      id="home"
      className="min-h-screen pt-28 pb-16 flex items-center justify-center relative overflow-hidden bg-[#0b1e28]"
    >
      {/* Background Company Image Layer */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-35 scale-105 transition-transform duration-1000 z-0"
        style={{ backgroundImage: `url('/company-img.webp')` }}
      ></div>

      {/* Dark Gradient Overlay for Maximum White Text Contrast */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0b1e28]/95 via-[#0b1e28]/85 to-[#0b1e28]/95 z-0"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#12637E]/30 via-transparent to-transparent z-0"></div>

      {/* Decorative Glow Blobs */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-[#1A9DC2]/20 rounded-full blur-[120px] animate-pulse z-0"></div>
      <div className="absolute bottom-1/4 -right-20 w-[30rem] h-[30rem] bg-[#12637E]/25 rounded-full blur-[140px] animate-pulse delay-1000 z-0"></div>

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10 w-full">
        {/* Left Column: Title and CTA */}
        <div className="lg:col-span-6 flex flex-col text-left">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight !text-white leading-tight" style={{ color: "#ffffff" }}>
              Empower Your <br />
              Workforce with{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-400">
                Efficiency
              </span>
            </h2>

            <motion.p
              variants={wordVariants}
              className="text-lg md:text-xl text-slate-200 max-w-lg leading-relaxed font-medium"
            >
              Manage employees, attendance, and payroll all in one professional platform — simplified, automated, and powerful.
            </motion.p>

            <motion.div
              variants={wordVariants}
              className="flex flex-wrap gap-4 pt-4"
            >
              <Link to="/login">
                <motion.div
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-r from-cyan-500 to-[#12637E] hover:from-cyan-600 hover:to-[#0f5269] text-white px-8 py-4 rounded-2xl font-extrabold shadow-xl shadow-cyan-500/25 flex items-center gap-2 cursor-pointer transition-all duration-300"
                >
                  Get Started <ArrowRight size={18} />
                </motion.div>
              </Link>

              <motion.button
                onClick={handleCheckDemo}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 rounded-2xl font-extrabold border border-gray-200 text-slate-800 hover:bg-gray-50 flex items-center gap-2 transition-colors shadow-sm bg-white"
              >
                Explore Portal
              </motion.button>
            </motion.div>
          </motion.div>
        </div>
        {/* Right Column: High Fidelity Modern Interactive Mockup */}
        <div className="lg:col-span-6 w-full flex justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, type: "spring" }}
            className="w-full max-w-md bg-white/95 backdrop-blur-2xl border border-gray-200/90 rounded-[2.5rem] p-7 shadow-[0_25px_60px_-15px_rgba(18,99,126,0.15)] relative overflow-hidden"
          >
            {/* Widget Contents */}
            <div className="min-h-[220px]">
              <AnimatePresence mode="wait">
                {activeTab === "attendance" && (
                  <motion.div
                    key="attendance"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-4"
                  >
                    {/* Live Clock Card */}
                    <div className="text-center py-5 px-4 bg-gradient-to-br from-slate-50 via-white to-blue-50/30 rounded-2xl border border-slate-200/80 shadow-inner relative overflow-hidden group">
                      <div className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center justify-center gap-1.5 mb-1">
                        <Clock size={13} className="text-[#12637E]" />
                        Current Time (IST)
                      </div>
                      <div className="text-4xl font-black text-slate-900 font-mono tracking-wider my-1 drop-shadow-sm">
                        {clockTime || "09:30:00 AM"}
                      </div>
                      <div className="text-xs text-slate-500 font-semibold flex items-center justify-center gap-1">
                        <span>📍 Pune, India</span>
                        <span className="text-slate-400">(GMT+5:30)</span>
                      </div>
                    </div>

                    {/* Clock In Action Button */}
                    <div className="flex justify-center">
                      <motion.button
                        onClick={handleCheckDemo}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`w-full py-4 px-6 rounded-2xl font-black flex items-center justify-center gap-2.5 shadow-xl transition-all duration-300 text-sm tracking-wide ${
                          clockedIn
                            ? "bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white shadow-rose-500/30"
                            : "bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-emerald-500/30"
                        }`}
                      >
                        <UserCheck size={20} className="stroke-[2.5]" />
                        {clockedIn ? "CLOCK OUT NOW" : "CLOCK IN NOW"}
                      </motion.button>
                    </div>

                    {/* Today & Shift Info Bar */}
                    <div className="text-xs bg-slate-50/90 p-4 rounded-2xl border border-gray-200/80 text-slate-600 flex items-center justify-between shadow-sm">
                      <span className="flex items-center gap-2 font-bold text-slate-800">
                        <Calendar size={14} className="text-[#12637E]" />
                        Today: {new Date().toLocaleDateString('en-GB', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </span>
                      <span className="font-extrabold text-[#12637E] bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                        Shift: 9:30 AM - 6:30 PM
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
