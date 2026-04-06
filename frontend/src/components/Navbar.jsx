import React, { useState } from "react";
import { Menu, X } from "lucide-react";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const scrollToSection = (id) => {
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
      setMenuOpen(false);
    }
  };

  return (
    <nav className="fixed top-0 left-0 w-full backdrop-blur-md text-textLight shadow-lg z-50 border-b border-dark1/40 transition-all duration-300" style={{ backgroundColor: '#192736' }}>
      <div className="max-w-7xl mx-auto flex items-center justify-between py-4 px-6">
        {/* Logo */}
        <h1 className="text-3xl font-extrabold tracking-wide select-none flex items-center gap-1">
          <img
            src="/qiro-logo.png"
            alt="Logo"
            className="w-12 h-12 mt-2 mr-2"
            // style={{
            //   boxShadow: '0 0 10px rgba(14,166,240,0.6), 0 0 20px rgba(14,166,240,0.4), 0 0 40px rgba(167,86,250,0.3)',
            //   animation: 'logoGlow 2s ease-in-out infinite alternate',
            // }}
          />
          <span className="text-white">QiroTech</span>
          <span
            className="font-extrabold"
            style={{
              background: 'linear-gradient(90deg, rgba(14,166,240,1) 0%, rgba(167,86,250,1) 50%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            Innovation
          </span>
        </h1>

        {/* Desktop Nav */}
        <ul className="hidden md:flex items-center gap-8 text-lg font-medium">
          {["home", "about", "contact"].map((item) => (
            <li key={item}>
              <button
                onClick={() => scrollToSection(item)}
                className="relative group transition-all duration-300"
              >
                <span className="text-textLight group-hover:text-primary transition duration-300">
                  {item.charAt(0).toUpperCase() + item.slice(1)}
                </span>
                {/* underline animation */}
                <span className="absolute left-0 bottom-0 w-0 h-[2px] bg-primary transition-all duration-300 group-hover:w-full"></span>
              </button>
            </li>
          ))}

          <li>
            <a
              href="/login"
              className="bg-primary text-white px-5 py-2 rounded-lg shadow-md hover:bg-secondary transition-all duration-300 hover:shadow-lg hover:scale-105"
            >
              Login
            </a>
          </li>
        </ul>

        {/* Mobile Menu Toggle */}
        <div className="md:hidden">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-textLight hover:text-primary transition"
          >
            {menuOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden backdrop-blur-md border-t border-dark1/40 px-6 py-4 space-y-4" style={{ backgroundColor: '#192736' }}>
          {["home", "about", "contact"].map((item) => (
            <button
              key={item}
              onClick={() => scrollToSection(item)}
              className="block w-full text-left text-textLight hover:text-primary text-lg font-medium py-2 transition"
            >
              {item.charAt(0).toUpperCase() + item.slice(1)}
            </button>
          ))}

          <a
            href="/login"
            className="block w-full text-center bg-primary text-white py-2 rounded-lg font-semibold shadow-md hover:bg-secondary hover:shadow-lg transition-all duration-300"
          >
            Login
          </a>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
