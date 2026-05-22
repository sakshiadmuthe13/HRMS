import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";

const testimonials = [
  {
    text: "Switching to this platform cut our payroll processing time in half. The reports are invaluable.",
    name: "Priya",
    role: "HR Manager"
  },
  {
    text: "Attendance tracking is smooth and integrates well with our shifts.",
    name: "Rohan",
    role: "Operations Lead"
  },
  {
    text: "Excellent support and easy onboarding for our staff.",
    name: "Shalini",
    role: "Finance Executive"
  }
];

const Testimonials = () => {
  const [index, setIndex] = useState(0);

  const prev = () => {
    setIndex((prevIndex) => (prevIndex === 0 ? testimonials.length - 1 : prevIndex - 1));
  };

  const next = () => {
    setIndex((prevIndex) => (prevIndex === testimonials.length - 1 ? 0 : prevIndex + 1));
  };

  return (
    <section className="py-24 bg-slate-50/50 relative overflow-hidden">
      {/* Background circle decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl pointer-events-none"></div>

      <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="space-y-4 mb-16"
        >
          <p className="text-xs uppercase tracking-widest font-black text-primary">Trusted by Teams</p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-900">
            Hear From Our Clients
          </h2>
        </motion.div>

        {/* Carousel Container */}
        <div className="relative min-h-[300px] flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, x: 50, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -50, scale: 0.95 }}
              transition={{ duration: 0.4, type: "spring", stiffness: 100, damping: 15 }}
              className="w-full max-w-2xl bg-white border border-gray-200 rounded-3xl p-8 sm:p-12 shadow-xl flex flex-col justify-between"
            >
              {/* Quote Icon */}
              <div className="text-primary/10 mb-6 flex justify-center">
                <Quote size={56} fill="currentColor" className="stroke-none" />
              </div>

              {/* Testimonial Text */}
              <p className="text-lg sm:text-xl md:text-2xl text-slate-750 font-semibold italic leading-relaxed mb-8">
                "{testimonials[index].text}"
              </p>

              {/* Author details */}
              <div className="mt-auto">
                <div className="font-extrabold text-slate-900 text-lg">
                  {testimonials[index].name}
                </div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mt-1">
                  {testimonials[index].role}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Controls */}
        <div className="flex justify-center items-center gap-4 mt-8">
          <motion.button
            onClick={prev}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="w-12 h-12 rounded-full border border-gray-200 bg-white text-slate-650 shadow-sm flex items-center justify-center hover:bg-slate-50 transition-colors"
          >
            <ChevronLeft size={20} />
          </motion.button>
          
          <div className="flex gap-2">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  i === index ? "w-8 bg-primary" : "w-2.5 bg-gray-200"
                }`}
              />
            ))}
          </div>

          <motion.button
            onClick={next}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="w-12 h-12 rounded-full border border-gray-200 bg-white text-slate-650 shadow-sm flex items-center justify-center hover:bg-slate-50 transition-colors"
          >
            <ChevronRight size={20} />
          </motion.button>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
