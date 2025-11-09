// src/components/Hero.jsx
import React from "react";
import { Link } from "react-router-dom"; // agar tu React Router use kar raha hai

const Hero = () => {
  return (
    <section
      id="home"
      className="min-h-screen flex flex-col items-center justify-center text-center px-6 md:px-0
             relative card-glow"
      style={{
        background:
          "linear-gradient(145deg, rgba(14,166,240,0.08), rgba(167,86,250,0.05))",
        border: "1px solid rgba(167,86,250,0.3)",
      }}
    >
      <h2 className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight">
        Empower Your Workforce with{" "}
        <span className="text-primary">Efficiency</span>
      </h2>

      <p className="text-lg md:text-xl text-gray-300 max-w-2xl mb-10">
        Manage employees, attendance, and payroll all in one platform — simple,
        fast, and powerful.
      </p>

      <Link
        to="/login"
        className="bg-primary text-white px-8 py-3 md:px-10 md:py-4 rounded-lg text-lg md:text-xl font-semibold shadow-lg hover:bg-secondary hover:scale-105 transition-all duration-300"
      >
        Get Started
      </Link>
    </section>
  );
};

export default Hero;
