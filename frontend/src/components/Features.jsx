import React, { useState } from "react";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { Clock, Calendar, CheckSquare, ListTodo, IndianRupee, CreditCard } from "lucide-react";

// Feature Card with Spotlight Hover Effect
const FeatureCard = ({ title, desc, icon, badge, children }) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }) {
    let { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      className="group relative rounded-3xl border border-gray-200 bg-white p-8 shadow-lg shadow-black/5 overflow-hidden flex flex-col justify-between min-h-[350px]"
    >
      {/* Background Spotlight Glow */}
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 group-hover:opacity-100 transition duration-300"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              400px circle at ${mouseX}px ${mouseY}px,
              rgba(18, 99, 126, 0.04),
              transparent 80%
            )
          `,
        }}
      />

      <div>
        <div className="flex justify-between items-start mb-6">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-xl font-bold">
            {icon}
          </div>
          {badge && (
            <span className="text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-1 bg-primary/10 text-primary rounded-full">
              {badge}
            </span>
          )}
        </div>

        <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-3">
          {title}
        </h3>
        <p className="text-slate-500 text-sm leading-relaxed mb-6">
          {desc}
        </p>
      </div>

      {/* Interactive Graphic Area */}
      <div className="mt-auto pt-4 border-t border-gray-100">
        {children}
      </div>
    </motion.div>
  );
};

const Features = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 12 } },
  };

  return (
    <section id="features" className="py-24 relative overflow-hidden bg-slate-50/50">
      {/* Mesh lines effect */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Section Heading */}
        <div className="text-center mb-16 space-y-4">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xs uppercase tracking-widest font-black text-primary"
          >
            All-In-One SaaS Suite
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-900 max-w-2xl mx-auto leading-tight"
          >
            Built for Teams That Value <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Accuracy & Speed</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-sm md:text-base text-slate-500 max-w-xl mx-auto leading-relaxed font-medium"
          >
            From attendance and tracking to payroll automation — manage your complete digital workspace centrally.
          </motion.p>
        </div>

        {/* Feature Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {/* Smart Attendance Card */}
          <motion.div variants={cardVariants}>
            <FeatureCard
              title="Smart Attendance"
              desc="Accurate log management with instant check-ins, geotag verification, and auto-computed report slips."
              icon={<Clock size={22} />}
              badge="Real-time"
            >
              <div className="space-y-2">
                <div className="flex justify-between items-center bg-slate-50 p-2 rounded-xl text-[11px] font-semibold border border-gray-100">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Clocked In
                  </span>
                  <span className="text-slate-400">09:02 AM</span>
                </div>
                <div className="flex justify-between items-center bg-slate-50 p-2 rounded-xl text-[11px] font-semibold border border-gray-100">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Out for Lunch
                  </span>
                  <span className="text-slate-400">01:00 PM</span>
                </div>
              </div>
            </FeatureCard>
          </motion.div>

          {/* Task Board Card */}
          <motion.div variants={cardVariants}>
            <FeatureCard
              title="Project & Task Board"
              desc="Assign tasks, prioritize workflows, track execution status, and review milestones effortlessly."
              icon={<CheckSquare size={22} />}
              badge="Kanban"
            >
              <div className="flex justify-between gap-2.5">
                {["Todo", "Active", "Done"].map((col, idx) => (
                  <div key={col} className="flex-1 text-center py-2.5 px-1 bg-slate-50 border border-gray-100 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">{col}</span>
                    <div className="w-full h-1.5 bg-gray-205 rounded-full overflow-hidden mt-2">
                      <div className={`h-full ${idx === 2 ? 'bg-emerald-400 w-full' : idx === 1 ? 'bg-primary w-2/3' : 'bg-yellow-400 w-1/3'}`} />
                    </div>
                  </div>
                ))}
              </div>
            </FeatureCard>
          </motion.div>

          {/* Payroll Automation Card */}
          <motion.div variants={cardVariants}>
            <FeatureCard
              title="Payroll Automation"
              desc="Calculate gross payouts, verify deductions, and export professional PDF pay stubs seamlessly."
              icon={<IndianRupee size={22} />}
              badge="Automated"
            >
              <div className="bg-slate-50 border border-gray-100 p-3 rounded-2xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="bg-emerald-500/10 p-2 rounded-xl text-emerald-500">
                    <CreditCard size={15} />
                  </div>
                  <div>
                    <div className="font-bold text-slate-700">Export Pay Slip</div>
                    <span className="text-[10px] text-slate-400 font-medium">Auto-generated PDF</span>
                  </div>
                </div>
                <button className="text-[10px] font-bold bg-primary text-white py-1 px-3.5 rounded-lg shadow-md shadow-primary/10">
                  Get PDF
                </button>
              </div>
            </FeatureCard>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default Features;
