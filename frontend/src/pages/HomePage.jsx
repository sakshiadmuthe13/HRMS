import React from "react";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import About from "../components/About";
import Contact from "../components/Contact";

// Feature Card Component
const Feature = ({ title, desc, icon }) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.3 }}
    whileHover={{ y: -6, scale: 1.02, borderRadius: "2rem" }}
    transition={{ duration: 0.45 }}
    className="bg-white/85 backdrop-blur-md border border-primary/15 rounded-2xl p-6 flex flex-col gap-4 shadow-sm"
  >
    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-xl">{icon}</div>
    <h3 className="text-xl font-semibold text-slate-800">{title}</h3>
    <p className="text-slate-500">{desc}</p>
  </motion.div>
);

// Stats Component
const Stat = ({ value, label }) => (
  <motion.div
    initial={{ opacity: 0, y: 18 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.6 }}
    whileHover={{ y: -4, borderRadius: "1.4rem" }}
    transition={{ duration: 0.35 }}
    className="flex-1 text-center bg-white border border-gray-200/70 rounded-xl py-6 px-4 shadow-sm"
  >
    <div className="text-3xl md:text-4xl font-extrabold text-slate-800">{value}</div>
    <div className="text-sm text-slate-500 mt-1">{label}</div>
  </motion.div>
);

const HomePage = () => {
  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  });
  const heroRadius = useTransform(smoothProgress, [0, 0.35], [20, 70]);
  const heroBorderOpacity = useTransform(smoothProgress, [0, 0.35], [0.35, 0.12]);
  const heroBorderColor = useTransform(heroBorderOpacity, (v) => `rgba(18,99,126,${v})`);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-800 selection:bg-primary selection:text-white">

      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-secondary origin-left z-50"
        style={{ scaleX: smoothProgress }}
      />

      <Navbar />

      {/* Hero Section */}
      <motion.section
        id="home"
        className="min-h-screen flex flex-col items-center justify-center text-center px-6 md:px-0 border border-primary/30 backdrop-blur-md relative mb-16 mx-4 md:mx-6 overflow-hidden"
        style={{
          background: "linear-gradient(145deg, rgba(26,157,194,0.12), rgba(18,99,126,0.08))",
          borderRadius: heroRadius,
          borderColor: heroBorderColor,
        }}
      >
        <motion.div
          aria-hidden
          className="absolute -top-24 -left-24 w-72 h-72 bg-primary/10 rounded-full blur-3xl pointer-events-none"
          animate={{ x: [0, 20, 0], y: [0, -15, 0], scale: [1, 1.08, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          aria-hidden
          className="absolute -bottom-24 -right-24 w-80 h-80 bg-secondary/15 rounded-full blur-3xl pointer-events-none"
          animate={{ x: [0, -24, 0], y: [0, 16, 0], scale: [1, 1.06, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <Hero />
      </motion.section>

      {/* Features Section */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.6 }}
        className="py-16"
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-10">
            <p className="text-sm text-primary font-semibold uppercase">All-in-one platform</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900">Built for teams that value time and accuracy</h2>
            <p className="mt-3 text-slate-500 max-w-2xl mx-auto">From attendance to payroll - manage everything centrally with powerful automation and clear reporting.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Feature
              icon={"🕒"}
              title="Smart Attendance"
              desc="Accurate clock-in/out with reports and approvals to keep your records clean."
            />
            <Feature
              icon={"📁"}
              title="Project & Task Tracking"
              desc="Organize work, assign owners and track progress with ease."
            />
            <Feature
              icon={"💸"}
              title="Payroll Automation"
              desc="Automate salary calculations, taxes and payslips — reduce errors and save time."
            />
          </div>
        </div>
      </motion.section>

      {/* Stats Section */}
      <section className="py-12 border-t border-gray-200/70">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row gap-6">
          <Stat value={"10k+"} label={"Employees Managed"} />
          <Stat value={"99.9%"} label={"Uptime"} />
          <Stat value={"24/7"} label={"Support"} />
        </div>
      </section>

      {/* About Section */}
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0, borderRadius: [28, 40, 28] }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.8 }}
        className="py-16 rounded-3xl border border-secondary/20 backdrop-blur-md mx-6 mb-16"
        style={{
          background: "linear-gradient(145deg, rgba(26,157,194,0.08), rgba(18,99,126,0.04))",
        }}
      >
        <div className="max-w-7xl mx-auto px-6">
          <About />
        </div>
      </motion.section>

      {/* Testimonials Section */}
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.6 }}
        className="py-16 bg-slate-50/70 border-t border-gray-200/80"
      >
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h3 className="text-primary font-semibold">Trusted by teams</h3>
          <h2 className="text-3xl md:text-4xl font-extrabold mb-8 text-slate-900">Hear from customers</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { text: "Switching to this platform cut our payroll processing time in half. The reports are invaluable.", name: "Priya, HR Manager" },
              { text: "Attendance tracking is smooth and integrates well with our shifts.", name: "Rohan, Operations Lead" },
              { text: "Excellent support and easy onboarding for our staff.", name: "Shalini, Finance" }
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.6 }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
                whileHover={{ y: -6, rotate: idx === 1 ? 0 : idx % 2 === 0 ? -0.5 : 0.5 }}
                className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm"
              >
                <p className="text-slate-500">{`"${item.text}"`}</p>
                <div className="mt-4 font-semibold text-slate-800">- {item.name}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Contact Section */}
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.7 }}
        className="py-16 rounded-3xl border border-primary/20 backdrop-blur-md mx-6 mb-16"
        style={{
          background: "linear-gradient(145deg, rgba(26,157,194,0.05), rgba(18,99,126,0.03))",
        }}
      >
        <div className="max-w-7xl mx-auto px-6">
          <Contact />
        </div>
      </motion.section>

      {/* CTA Footer */}
      <footer className="bg-slate-100 border-t border-gray-200/80">
        <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h4 className="text-xl font-extrabold text-slate-900">Ready to streamline HR?</h4>
            <p className="text-slate-500">Start your free trial or book a demo with our team.</p>
          </div>

          <div className="flex items-center gap-4">
            <a href="/login" className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-secondary hover:scale-105 transition-all duration-300">Get Started</a>
            <a href="/contact" className="text-slate-500 underline hover:text-primary transition">Contact Sales</a>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-6 text-sm text-slate-500 border-t border-gray-200/80">
          © {new Date().getFullYear()} QiroTech Innovation Pvt. Ltd. - All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
