import React, { useEffect, useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Award, Briefcase, Users, Flame } from "lucide-react";

// CountUp component to animate metrics numbers
const CountUp = ({ to, label, icon: Icon }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (isInView) {
      let start = 0;
      const duration = 1.5; // seconds
      const end = parseInt(to, 10);
      if (start === end) return;

      let totalMiliseconds = duration * 1000;
      let incrementTime = Math.abs(Math.floor(totalMiliseconds / end));

      let timer = setInterval(() => {
        start += 1;
        setCount(start);
        if (start === end) clearInterval(timer);
      }, incrementTime);

      return () => clearInterval(timer);
    }
  }, [isInView, to]);

  return (
    <div
      ref={ref}
      className="flex-1 min-h-[148px] rounded-3xl border border-gray-200 bg-white px-6 py-7 shadow-sm flex flex-col items-center justify-center gap-3 text-center"
    >
      <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
        <Icon size={20} />
      </div>
      <div className="space-y-0.5">
        <div className="text-3xl font-black text-slate-900 leading-none">
          {count}+
        </div>
        <div className="text-xs text-slate-400 uppercase font-black tracking-wider">
          {label}
        </div>
      </div>
    </div>
  );
};

const About = () => {
  return (
    <section
      id="about"
      className="min-h-screen py-24 bg-white flex flex-col items-center justify-center px-6"
    >
      <div className="max-w-5xl mx-auto w-full">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <p className="text-xs uppercase tracking-widest font-black text-primary mb-3">OUR IDENTITY</p>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-none">
            About <span className="text-primary inline-block">QiroTech Innovation</span>
          </h2>
        </motion.div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
          {/* Left Block: Company Description */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="md:col-span-7 flex flex-col justify-center space-y-6 text-left"
          >
            <p className="text-lg md:text-xl text-slate-600 leading-relaxed font-semibold">
              Qirotech Innovation Pvt. Ltd. was founded by a team of forward-thinking
              entrepreneurs who recognized the need for reliable, high-impact
              development services.
            </p>
            <p className="text-slate-550 leading-relaxed font-medium">
              Driven by a culture of creativity, precision, and
              passion, we transform ideas into exceptional digital experiences.
            </p>
          </motion.div>

          {/* Right Block: Capabilities and Metrics */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="md:col-span-5 flex flex-col justify-between space-y-6"
          >
            <div className="bg-slate-50 p-8 rounded-3xl border border-gray-150 text-left">
              <p className="text-slate-500 leading-relaxed text-sm font-medium mb-6">
                Today, we are a trusted global tech partner—delivering top-tier web and
                mobile development, custom product solutions, and scalable digital
                platforms.
              </p>

              {/* Counters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <CountUp to="100" label="Projects Done" icon={Briefcase} />
                <CountUp to="50" label="Clients Served" icon={Users} />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default About;
