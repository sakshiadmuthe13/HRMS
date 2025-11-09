// src/pages/Home.jsx
import React from "react";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import About from "../components/About";
import Contact from "../components/Contact";

const Home = () => {
  return (
    <div className="bg-dark1 text-textLight font-reddit">
      <Navbar />
      <Hero />
      <About />
      <Contact />
    </div>
  );
};

export default Home;
