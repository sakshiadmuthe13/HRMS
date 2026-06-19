import React, { useEffect } from 'react';
import Navbar from '../components/Navbar';
import { motion } from 'framer-motion';

const Privacy = () => {
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
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mb-8 text-center">Privacy Policy</h1>
          <div className="space-y-6 text-slate-600 leading-relaxed">
            {/* <p>
              <strong>Last Updated: {new Date().toLocaleDateString()}</strong>
            </p> */}
            <p>
              Welcome to our Human Resource Management System (HRMS). Your privacy is critically important to us. This Privacy Policy explains how we collect, use, and share information about you when you use our HRMS.
            </p>
            
            <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">1. Information We Collect</h2>
            <p>
              We collect information that you or your employer provide directly to us. This includes:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li><strong>Personal Data:</strong> Name, contact information, date of birth, emergency contacts.</li>
              <li><strong>Employment Data:</strong> Job title, department, salary, performance reviews, attendance records.</li>
              <li><strong>System Data:</strong> IP addresses, browser types, and login timestamps for security purposes.</li>
            </ul>
            
            <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">2. How We Use Information</h2>
            <p>
              The information we collect is used to:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Provide, operate, and maintain our HRMS services.</li>
              <li>Process payroll, benefits, and manage employee records.</li>
              <li>Communicate with you regarding system updates, security alerts, and administrative messages.</li>
              <li>Comply with legal and regulatory obligations.</li>
            </ul>

            <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">3. Data Security</h2>
            <p>
              We implement industry-standard security measures to protect your data from unauthorized access, alteration, disclosure, or destruction. We use encryption, access controls, and secure server hosting environments.
            </p>

            <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">4. Sharing of Information</h2>
            <p>
              We do not sell your personal data. We may share information with trusted third-party service providers who assist us in operating our system (such as payroll processors or cloud hosting services), provided they agree to keep this information confidential.
            </p>

            <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">5. Your Rights</h2>
            <p>
              You have the right to access, correct, or request deletion of your personal data stored in our system, subject to certain exceptions prescribed by law and your employer's retention policies.
            </p>

            <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">6. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact your HR administrator or our support team.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Privacy;
