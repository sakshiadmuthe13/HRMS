// src/pages/ForgotPassword.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/forgot-password",
        { email }
      );
      setMessage(res.data.message);
      setTimeout(() => {
        navigate("/reset-password", { state: { email } }); // pass email to next page
      }, 2000);
    } catch (err) {
      setMessage(err.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark1 px-6">
      <div className="flex flex-col md:flex-row w-full max-w-4xl bg-dark2 rounded-3xl shadow-2xl overflow-hidden border border-[#1C1436]">
        {/* Left Section */}
        <div className="md:w-1/2 p-10 flex flex-col justify-center bg-dark2">
          <h2 className="text-4xl font-extrabold mb-6 text-primary text-center">
            Forgot Password
          </h2>
          <p className="text-gray-300 mb-8 text-center">
            Enter your email to OTP
          </p>

          <form onSubmit={handleEmailSubmit} className="space-y-6">
            <div>
              <label className="block text-gray-300 mb-2 font-medium">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-5 py-3 rounded-xl border border-gray-300 bg-dark3 text-textLight outline-none focus:ring-2 focus:ring-primary focus:border-primary transition"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-3 rounded-xl font-semibold text-lg shadow-md hover:bg-secondary hover:shadow-lg transition-all duration-300"
            >
              {loading ? "Sending..." : "Send OTP"}
            </button>

            {message && (
              <p className="text-center text-sm mt-4 text-gray-300">
                {message}
              </p>
            )}
          </form>

          <p className="text-center text-gray-400 mt-6">
            Remember your password?{" "}
            <span
              onClick={() => navigate("/login")}
              className="text-primary hover:underline cursor-pointer"
            >
              Login
            </span>
          </p>
          <div className="text-center !mt-6">
            <Link to="/" className="text-base text-primary cursor-pointer">
              ← Back to Home
            </Link>
          </div>
        </div>

        {/* Right Section */}
        <div
          className="hidden md:flex md:w-1/2 p-10 flex-col justify-center items-center text-center relative"
          style={{
            backdropFilter: "blur(20px)",
            background: `linear-gradient(135deg, rgba(14,166,240,0.4) 0%, rgba(167,86,250,0.4) 50%, rgba(14,166,240,0.2) 100%)`,
          }}>
          <div className="bg-white/10 p-6 rounded-xl mb-6">
            <svg
              className="w-12 h-12 text-white mb-4 mx-auto"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2M8 11V7a4 4 0 118 0v4M4 11h16v10H4V11z"
              />
            </svg>
          </div>
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Secure Password Reset
          </h3>
          <p className="text-gray-300 max-w-xs">
            Your credentials are encrypted and safely stored. Reset your
            password securely.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
