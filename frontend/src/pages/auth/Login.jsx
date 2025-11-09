// src/pages/Login.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      // Save JWT token & user info in localStorage
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);
      localStorage.setItem("name", data.name);

      // Role-based redirect
      if (data.role === "admin") navigate("/admin-dashboard");
      else if (data.role === "leader") navigate("/leader-dashboard");
      else if (data.role === "employee") navigate("/employee-dashboard");
      else navigate("/");

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark1 px-6 ">
      <div className="flex flex-col md:flex-row w-full max-w-4xl bg-dark2 rounded-3xl shadow-2xl overflow-hidden border border-[#1C1436]">
        {/* Left Section - Login Form */}
        <div className="md:w-1/2 p-10 flex flex-col justify-center relative z-10 bg-dark2">
          <h2 className="text-4xl font-extrabold mb-6 text-primary text-center">
            Login
          </h2>
          <p className="text-gray-300 mb-8 text-center">
            Enter your credentials to access your account
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="text-red-500 text-center font-medium">{error}</div>
            )}

            <div>
              <label className="block text-gray-300 mb-2 font-medium">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="w-full px-5 py-3 rounded-xl border border-gray-300 bg-dark3 text-textLight outline-none focus:ring-2 focus:ring-primary focus:border-primary transition"
                required
              />
            </div>

            <div>
              <label className="block text-gray-300 mb-2 font-medium">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                className="w-full px-5 py-3 rounded-xl border border-gray-300 bg-dark3 text-textLight outline-none focus:ring-2 focus:ring-primary focus:border-primary transition"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-3 rounded-xl font-semibold text-lg shadow-md hover:bg-secondary hover:shadow-lg transition-all duration-300 disabled:opacity-50"
            >
              {loading ? "Logging in..." : "Login"}
            </button>

            <div className="text-center">
              <Link
                to="/forgot-password"
                className="text-base text-primary text-center hover:underline cursor-pointer"
              >
                Forgot Password?
              </Link>
            </div>

            <div className="text-center">
              <Link
                to="/"
                className="text-base text-primary text-center cursor-pointer"
              >
                ← Back to Home
              </Link>
            </div>
          </form>
        </div>

        {/* Right Section - Info Panel */}
        <div
          className="hidden md:flex md:w-1/2 p-10 flex-col justify-center items-center text-center relative"
          style={{
            backdropFilter: "blur(20px)",
            background: `linear-gradient(135deg, rgba(14,166,240,0.4) 0%, rgba(167,86,250,0.4) 50%, rgba(14,166,240,0.2) 100%)`,
          }}
        >
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
            Secure Login
          </h3>
          <p className="text-gray-300 max-w-xs">
            Your credentials are encrypted and safely stored. Login securely to
            access your employee dashboard and manage tasks efficiently.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
