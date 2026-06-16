import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, CheckSquare, IndianRupee, Calendar, ArrowRight, UserCheck, Play } from "lucide-react";

const Hero = () => {
  // Demo Dashboard States
  const [clockedIn, setClockedIn] = useState(false);
  const [clockTime, setClockTime] = useState("09:00:00 AM");
  const [activeTab, setActiveTab] = useState("attendance");
  const [tasks, setTasks] = useState([
    { id: 1, text: "Approve leaf requests", completed: false },
    { id: 2, text: "Review payroll slips", completed: true },
    { id: 3, text: "Onboard new designer", completed: false },
  ]);
  const [hoursWorked, setHoursWorked] = useState(40);
  const hourlyRate = 35;

  // Clock simulator
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setClockTime(now.toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Calculate task completion percentage
  const completedCount = tasks.filter(t => t.completed).length;
  const progressPercent = Math.round((completedCount / tasks.length) * 100);

  const toggleTask = (id) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
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
      className="min-h-screen pt-28 pb-16 flex items-center justify-center relative overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-100"
    >
      {/* Decorative Blur Blobs */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-secondary/8 rounded-full blur-3xl animate-pulse delay-1000"></div>

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10 w-full">
        {/* Left Column: Title and CTA */}
        <div className="lg:col-span-6 flex flex-col text-left">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-slate-900 leading-tight">
              Empower Your <br />
              Workforce with{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                Efficiency
              </span>
            </h2>

            <motion.p 
              variants={wordVariants}
              className="text-lg md:text-xl text-slate-600 max-w-lg leading-relaxed font-medium"
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
                  className="bg-primary hover:bg-secondary text-white px-8 py-4 rounded-2xl font-extrabold shadow-lg shadow-primary/30 flex items-center gap-2 cursor-pointer transition-colors duration-300"
                >
                  Get Started <ArrowRight size={18} />
                </motion.div>
              </Link>

              <motion.button
                onClick={() => {
                  const section = document.getElementById("about");
                  if (section) section.scrollIntoView({ behavior: "smooth" });
                }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 rounded-2xl font-extrabold border border-gray-200 text-slate-650 hover:bg-gray-50 flex items-center gap-2 transition-colors shadow-sm bg-white"
              >
                Learn More
              </motion.button>
            </motion.div>
          </motion.div>
        </div>

        {/* Right Column: High Fidelity Interactive Mockup */}
        <div className="lg:col-span-6 w-full flex justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, type: "spring" }}
            className="w-full max-w-md bg-white border border-gray-200/80 rounded-3xl p-6 shadow-2xl relative overflow-hidden"
          >
            {/* Header Bar */}
            <div className="flex justify-between items-center pb-4 mb-6 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full bg-red-450"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-450"></div>
                <div className="w-3 h-3 rounded-full bg-green-450"></div>
                <span className="text-[10px] font-black text-slate-400 ml-2">PORTAL DEMO</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${clockedIn ? 'bg-emerald-500 animate-ping' : 'bg-rose-500'}`} />
                <span className="text-xs font-bold uppercase text-slate-500">
                  {clockedIn ? "Clocked In" : "Clocked Out"}
                </span>
              </div>
            </div>

            {/* Simulated Navigation tabs for widgets */}
            <div className="flex gap-2 mb-6 bg-slate-100/80 p-1 rounded-xl">
              {[
                { id: "attendance", label: "Attendance", icon: Clock },
                { id: "tasks", label: "Tasks", icon: CheckSquare },
                { id: "payroll", label: "Payroll", icon: IndianRupee }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all duration-300 ${
                    activeTab === tab.id
                      ? "bg-white text-primary shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <tab.icon size={14} />
                  {tab.label}
                </button>
              ))}
            </div>

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
                    <div className="text-center py-4 bg-slate-50/70 rounded-2xl border border-gray-150/50 relative">
                      <span className="absolute top-2 right-2 text-[9px] font-black uppercase tracking-widest bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full border border-amber-200">Demo</span>
                      <div className="text-sm font-semibold text-slate-400">Current Time</div>
                      <div className="text-3xl font-black text-slate-800 font-mono mt-1">{clockTime}</div>
                      <div className="text-xs text-slate-500 mt-1">Pune, India (GMT+5:30)</div>
                    </div>

                    <div className="flex justify-center">
                      <motion.button
                        onClick={() => setClockedIn(!clockedIn)}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className={`w-full py-4 px-6 rounded-2xl font-bold flex items-center justify-center gap-2.5 shadow-lg transition-all duration-300 ${
                          clockedIn
                            ? "bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/25"
                            : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/25"
                        }`}
                      >
                        <UserCheck size={18} />
                        {clockedIn ? "CLOCK OUT (DEMO)" : "CLOCK IN (DEMO)"}
                      </motion.button>
                    </div>

                    {/* Small activity ticker */}
                    <div className="text-left text-xs bg-slate-50/80 p-3.5 rounded-xl border border-gray-150/40 text-slate-550 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={13} className="text-primary" />
                        Today: {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                      </span>
                      <span>Shift: 9:30 AM - 6:30 PM</span>
                    </div>
                  </motion.div>
                )}

                {activeTab === "tasks" && (
                  <motion.div
                    key="tasks"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-4 text-left"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-slate-400 uppercase">My Tasks ({completedCount}/{tasks.length})</span>
                      <span className="text-xs font-extrabold text-primary">{progressPercent}%</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-primary to-secondary"
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        transition={{ duration: 0.4 }}
                      />
                    </div>

                    <div className="space-y-2.5 pt-2">
                      {tasks.map(task => (
                        <div
                          key={task.id}
                          onClick={() => toggleTask(task.id)}
                          className="flex items-center gap-3 p-3 bg-slate-50/70 hover:bg-slate-100/50 border border-gray-150/40 rounded-xl cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={() => {}} // handled by div onClick
                            className="rounded text-primary focus:ring-primary w-4 h-4 border-slate-350 cursor-pointer"
                          />
                          <span className={`text-sm font-semibold transition-all ${
                            task.completed
                              ? "line-through text-slate-400"
                              : "text-slate-700"
                          }`}>
                            {task.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {activeTab === "payroll" && (
                  <motion.div
                    key="payroll"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-4 text-left"
                  >
                    <div className="p-4 bg-slate-50/75 border border-gray-150/50 rounded-2xl flex items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold text-slate-400">ESTIMATED PAY</span>
                        <div className="text-3xl font-black text-slate-800 mt-1 font-mono">
                          ₹{(hoursWorked * hourlyRate).toLocaleString("en-IN")}
                        </div>
                      </div>
                      <div className="bg-primary/10 text-primary p-3 rounded-xl">
                        <IndianRupee size={24} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-bold text-slate-400">
                        <span>HOURS WORKED: {hoursWorked} Hrs</span>
                        <span>RATE: ₹{hourlyRate}/Hr</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="80"
                        value={hoursWorked}
                        onChange={(e) => setHoursWorked(Number(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                    </div>

                    <div className="text-center text-[10px] text-slate-450 pt-2 border-t border-gray-100">
                      Demo calculation includes flat hourly rate estimates.
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
