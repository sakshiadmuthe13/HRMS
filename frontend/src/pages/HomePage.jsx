import React from "react";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import About from "../components/About";
import Contact from "../components/Contact";

// Feature Card Component
const Feature = ({ title, desc, icon }) => (
  <div className="bg-dark2/80 backdrop-blur-md border border-primary/30 rounded-2xl p-6 flex flex-col gap-4 hover:scale-105 hover:shadow-lg transition-transform duration-300">
    <div className="w-12 h-12 rounded-lg bg-primary/30 flex items-center justify-center text-primary text-xl">{icon}</div>
    <h3 className="text-xl font-semibold text-white">{title}</h3>
    <p className="text-gray-300">{desc}</p>
  </div>
);

// Stats Component
const Stat = ({ value, label }) => (
  <div className="flex-1 text-center">
    <div className="text-3xl md:text-4xl font-extrabold text-white">{value}</div>
    <div className="text-sm text-gray-300 mt-1">{label}</div>
  </div>
);

const HomePage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white">

      <Navbar />

      {/* Hero Section */}
      <section
        id="home"
        className="min-h-screen flex flex-col items-center justify-center text-center px-6 md:px-0 rounded-3xl border border-primary/40 backdrop-blur-md relative mb-16"
        style={{
          background: 'linear-gradient(145deg, rgba(14,166,240,0.15), rgba(167,86,250,0.1))'
        }}
      >
        <Hero />
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-10">
            <p className="text-sm text-primary font-semibold uppercase">All-in-one platform</p>
            <h2 className="text-3xl md:text-4xl font-extrabold">Built for teams that value time and accuracy</h2>
            <p className="mt-3 text-gray-300 max-w-2xl mx-auto">From attendance to payroll — manage everything centrally with powerful automation and clear reporting.</p>
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
      </section>

      {/* Stats Section */}
      <section className="py-12 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row gap-6">
          <Stat value={"10k+"} label={"Employees Managed"} />
          <Stat value={"99.9%"} label={"Uptime"} />
          <Stat value={"24/7"} label={"Support"} />
        </div>
      </section>

      {/* About Section */}
      <section
        className="py-16 rounded-3xl border border-secondary/30 backdrop-blur-md mx-6 md:mx-0 mb-16"
        style={{
          background: 'linear-gradient(145deg, rgba(14,166,240,0.08), rgba(167,86,250,0.05))'
        }}
      >
        <div className="max-w-7xl mx-auto px-6">
          <About />
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-white/5 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h3 className="text-primary font-semibold">Trusted by teams</h3>
          <h2 className="text-3xl md:text-4xl font-extrabold mb-8">Hear from customers</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { text: "Switching to this platform cut our payroll processing time in half. The reports are invaluable.", name: "Priya, HR Manager" },
              { text: "Attendance tracking is smooth and integrates well with our shifts.", name: "Rohan, Operations Lead" },
              { text: "Excellent support and easy onboarding for our staff.", name: "Shalini, Finance" }
            ].map((item, idx) => (
              <div key={idx} className="bg-dark2/70 p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                <p className="text-gray-300">{`"${item.text}"`}</p>
                <div className="mt-4 font-semibold text-white">— {item.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section
        className="py-16 rounded-3xl border border-primary/30 backdrop-blur-md mx-6 md:mx-0 mb-16"
        style={{
          background: 'linear-gradient(145deg, rgba(14,166,240,0.05), rgba(167,86,250,0.03))'
        }}
      >
        <div className="max-w-7xl mx-auto px-6">
          <Contact />
        </div>
      </section>

      {/* CTA Footer */}
      <footer className="bg-slate-900 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h4 className="text-xl font-extrabold">Ready to streamline HR?</h4>
            <p className="text-gray-300">Start your free trial or book a demo with our team.</p>
          </div>

          <div className="flex items-center gap-4">
            <a href="/login" className="bg-primary text-black px-6 py-3 rounded-lg font-semibold hover:bg-secondary hover:scale-105 transition-all duration-300">Get Started</a>
            <a href="/contact" className="text-gray-300 underline hover:text-primary transition">Contact Sales</a>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-6 text-sm text-gray-400 border-t border-white/3">
          © {new Date().getFullYear()} QiroTech Innovation Pvt. Ltd. — All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
