// src/components/About.jsx
import React from "react";

const About = () => {
  return (
    <section
      id="about"
      className="min-h-screen flex flex-col items-center justify-center px-6 py-20 card-glow"
      style={{
        background:
          "linear-gradient(145deg, rgba(14,166,240,0.15), rgba(167,86,250,0.1))",
        border: "1px solid rgba(14,166,240,0.4)",
      }}
    >
      <h2 className="text-4xl md:text-5xl font-extrabold mb-8 text-primary text-center">
        About <span className="text-white">QiroTech Innovation</span>
      </h2>

      <p className="max-w-4xl text-center text-gray-300 leading-relaxed md:leading-loose text-lg md:text-xl space-y-4">
        QIROTECH INNOVATION PVT. LTD. was founded by a team of forward-thinking
        entrepreneurs who recognized the need for reliable, high-impact
        development services. Driven by a culture of creativity, precision, and
        passion, we transform ideas into exceptional digital experiences.
      </p>

      <p className="max-w-4xl text-center text-gray-300 leading-relaxed md:leading-loose text-lg md:text-xl mt-6">
        Today, we are a trusted global tech partner—delivering top-tier web and
        mobile development, custom product solutions, and scalable digital
        platforms. Our commitment to quality and client success has made us a
        standout name in the technology space.
      </p>
    </section>
  );
};

export default About;
