import React, { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      // Background elevation state
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }

      // Check current visible section for homepage
      if (location.pathname === "/") {
        const sections = ["home", "about", "contact"];
        let current = "home";

        for (const sectionId of sections) {
          const el = document.getElementById(sectionId);
          if (el) {
            const rect = el.getBoundingClientRect();
            // If the section top is above or near the middle of screen
            if (rect.top <= window.innerHeight * 0.4) {
              current = sectionId;
            }
          }
        }
        setActiveSection(current);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [location]);

  const scrollToSection = (id) => {
    if (location.pathname !== "/") {
      window.location.href = `/#${id.toLowerCase()}`;
      return;
    }
    const section = document.getElementById(id.toLowerCase());
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
      setMenuOpen(false);
    }
  };

  return (
    <nav 
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 py-4 px-6 ${
        scrolled 
          ? "bg-white/90 backdrop-blur-xl border-b border-gray-200/60 shadow-lg shadow-black/5" 
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <motion.img
            src="/qiro-logo.png"
            alt="Logo"
            className="w-10 h-10 object-contain group-hover:rotate-12 transition-transform duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          />
          <h1 className="text-xl font-bold tracking-tight select-none flex items-center gap-1">
            <span className="text-primary font-black text-2xl">QiroTech</span>
            <span
              className="font-extrabold text-2xl"
              style={{
                background: 'linear-gradient(135deg, #12637E 0%, #1A9DC2 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              Innovation
            </span>
          </h1>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8 bg-gray-100/60 p-1.5 rounded-full border border-gray-200/40 backdrop-blur-md">
          {["Home", "About", "Contact"].map((item) => {
            const itemLower = item.toLowerCase();
            const isActive = activeSection === itemLower;
            return (
              <button
                key={item}
                onClick={() => scrollToSection(item)}
                className="relative px-5 py-2 text-sm font-semibold uppercase tracking-wider transition-colors duration-300 text-slate-600 hover:text-primary"
              >
                {isActive && (
                  <motion.span
                    layoutId="activeNavBackground"
                    className="absolute inset-0 bg-white rounded-full shadow-sm"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{item}</span>
              </button>
            );
          })}
        </div>

        {/* CTA Login Button */}
        <div className="hidden md:block">
          <Link to="/login">
            <motion.button
              whileHover={{ 
                scale: 1.05,
                boxShadow: "0 10px 25px -5px rgba(18, 99, 126, 0.4)"
              }}
              whileTap={{ scale: 0.95 }}
              className="bg-primary hover:bg-secondary text-white px-7 py-2.5 rounded-full font-bold shadow-lg shadow-primary/20 transition-colors duration-300"
            >
              Login
            </motion.button>
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <div className="md:hidden">
          <motion.button
            onClick={() => setMenuOpen(!menuOpen)}
            whileTap={{ scale: 0.9 }}
            className="text-primary hover:bg-gray-100 p-2.5 rounded-xl transition-colors border border-gray-200/60"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </motion.button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 w-full bg-white/95 backdrop-blur-2xl border-b border-gray-200 px-6 py-6 space-y-4 shadow-xl"
          >
            {["Home", "About", "Contact"].map((item) => (
              <button
                key={item}
                onClick={() => scrollToSection(item)}
                className={`block w-full text-left py-2 px-4 rounded-xl text-lg font-bold transition-all ${
                  activeSection === item.toLowerCase()
                    ? "bg-primary/5 text-primary"
                    : "text-slate-600 hover:bg-gray-50"
                }`}
              >
                {item}
              </button>
            ))}

            <div className="pt-2 border-t border-gray-100">
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="block w-full text-center bg-primary hover:bg-secondary text-white py-3.5 rounded-xl font-bold shadow-lg shadow-primary/20 transition-all duration-300"
              >
                Login
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
