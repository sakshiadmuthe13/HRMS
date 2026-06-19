import React, { useEffect } from 'react';
import Navbar from '../components/Navbar';
import { motion } from 'framer-motion';

const Terms = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="bg-slate-50 text-slate-850 min-h-screen relative font-sans">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 py-24 sm:py-32">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-8 sm:p-12 shadow-sm border border-slate-200"
        >
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mb-8 text-center">Terms of Service</h1>
          <div className="space-y-6 text-slate-600 leading-relaxed">
            {/* <p>
              <strong>Last Updated: {new Date().toLocaleDateString()}</strong>
            </p> */}
            <p>
              These Terms of Service ("Terms") govern your access to and use of our Human Resource Management System (HRMS). By accessing or using the system, you agree to be bound by these Terms.
            </p>
            
            <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">1. Use of the System</h2>
            <p>
              You agree to use the HRMS only for lawful purposes and in accordance with your employer's policies. You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account.
            </p>
            
            <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">2. User Conduct</h2>
            <p>
              You agree not to:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Upload or transmit any malicious code, viruses, or unauthorized files.</li>
              <li>Attempt to gain unauthorized access to any part of the system or other users' accounts.</li>
              <li>Use the system to harass, discriminate, or engage in any unlawful activity.</li>
              <li>Falsify attendance records, task progress, or any other data submitted to the system.</li>
            </ul>

            <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">3. Data Accuracy</h2>
            <p>
              You are responsible for ensuring that any personal information, task updates, and documents you provide are accurate, current, and complete. Your employer relies on this information for critical operations such as payroll and performance evaluation.
            </p>

            <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">4. Intellectual Property</h2>
            <p>
              The HRMS platform, including its software, designs, text, and graphics, is the intellectual property of the service provider. You are granted a limited, non-exclusive license to use the system for employment-related purposes.
            </p>

            <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">5. Termination</h2>
            <p>
              Your access to the HRMS may be suspended or terminated if your employment ends or if you violate these Terms or your employer's policies.
            </p>

            <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">6. Limitation of Liability</h2>
            <p>
              We are not liable for any direct, indirect, incidental, or consequential damages arising from your use of the HRMS, to the extent permitted by law.
            </p>

            <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">7. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. Significant changes will be communicated to you via the system or by your HR administrator.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Terms;
