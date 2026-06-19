// src/pages/Home.jsx
import React from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Features from "../components/Features";
import About from "../components/About";
import Testimonials from "../components/Testimonials";
import FAQ from "../components/FAQ";
import Contact from "../components/Contact";
import { Link } from "react-router-dom";

const Home = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <div className="bg-slate-50 text-slate-850 selection:bg-primary selection:text-white min-h-screen relative">
      {/* Scroll Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-secondary origin-left z-50"
        style={{ scaleX }}
      />

      <Navbar />
      <Hero />
      <Features />
      <About />
      <Testimonials />
      <FAQ />
      <Contact />

      {/* Modern SaaS Slate Footer */}
      <footer className="bg-slate-100 text-slate-800 border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-6 space-y-4 text-left">
            <h4 className="text-2xl font-black tracking-tight">
              Ready to Streamline Your HR Operations?
            </h4>
            <p className="text-slate-500 text-sm max-w-sm leading-relaxed font-semibold">
              Experience the automated employee management suite built for modern teams.
            </p>
          </div>

          <div className="md:col-span-6 flex flex-col sm:flex-row items-start sm:items-center justify-end gap-4">
            <Link to="/login">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-primary hover:bg-secondary text-white px-8 py-3.5 rounded-2xl font-extrabold shadow-lg shadow-primary/20 transition-colors"
              >
                Get Started
              </motion.button>
            </Link>
            
            <button
              onClick={() => {
                const sec = document.getElementById("contact");
                if (sec) sec.scrollIntoView({ behavior: "smooth" });
              }}
              className="text-slate-500 hover:text-slate-800 text-sm font-semibold transition"
            >
              Contact Support
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8 border-t border-slate-200/60 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4 text-center sm:text-left">
          <div className="flex-1">
            © {new Date().getFullYear()} QiroTech Innovation Pvt. Ltd. — All rights reserved.
          </div>
          <div className="flex-1 text-center font-medium">
            Developed by QiroTech Innovation Private Limited
          </div>
          <div className="flex flex-1 justify-center sm:justify-end gap-6">
            <Link to="/privacy" className="hover:text-slate-650 transition">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-slate-650 transition">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
