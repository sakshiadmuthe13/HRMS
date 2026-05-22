import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const faqData = [
  {
    q: "What is QiroTech Innovation Employee Management System?",
    a: "It is an all-in-one corporate workspace portal designed to centralize attendance tracking, team task boards, employee profiles, and automated payroll slip generation."
  },
  {
    q: "How does the smart clock-in/out attendance tracker work?",
    a: "Employees can clock in/out directly from their dashboard. The system records precise timestamps and supports options for geotag validation to ensure record integrity."
  },
  {
    q: "Can we generate and download PDF pay slips?",
    a: "Yes! The system automatically calculates gross pay, tax deductions, and net pay based on active work hour configurations. Certified PDF pay slips can be downloaded in one click."
  },
  {
    q: "How is data security handled on the platform?",
    a: "We implement secure authentication protocols, role-based access control (Admin, Leader, HR, Employee), and database encryption to ensure that workforce metrics and payroll records remain completely private."
  }
];

const AccordionItem = ({ question, answer, isOpen, toggle }) => {
  return (
    <div className="border-b border-gray-200/60 py-4">
      <button
        onClick={toggle}
        className="w-full flex justify-between items-center text-left py-3 text-slate-800 font-bold text-base sm:text-lg transition-colors hover:text-primary"
      >
        <span>{question}</span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.25 }}
          className="text-slate-400 group-hover:text-primary ml-4"
        >
          <ChevronDown size={20} />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="text-slate-550 text-sm leading-relaxed pb-4 pr-6">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const handleToggle = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-24 bg-white px-6">
      <div className="max-w-3xl mx-auto w-full">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16 space-y-4"
        >
          <p className="text-xs uppercase tracking-widest font-black text-primary">Need Help?</p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-900">
            Frequently Asked Questions
          </h2>
        </motion.div>

        {/* Accordion List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="bg-slate-50/80 border border-gray-150 p-6 sm:p-8 rounded-3xl backdrop-blur-sm shadow-sm"
        >
          {faqData.map((faq, index) => (
            <AccordionItem
              key={index}
              question={faq.q}
              answer={faq.a}
              isOpen={openIndex === index}
              toggle={() => handleToggle(index)}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default FAQ;
