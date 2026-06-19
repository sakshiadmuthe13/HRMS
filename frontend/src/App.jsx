import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import './App.css'
import Login from "./pages/auth/Login";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import AdminDashboard from "./pages/admin/admin-dashboard";
import EmployeeDashboard from "./pages/employee/employee-dashboard";
import LeaderDashboard from "./pages/leader/Leader-dashboard";
import HRDashboard from "./pages/hr/hr-dashboard";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { NotificationProvider } from "./contexts/NotificationContext";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";

function App() {
  return (
    <NotificationProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/employee-dashboard" element={<EmployeeDashboard />} />
          <Route path="/leader-dashboard" element={<LeaderDashboard />} />
          <Route path="/hr-dashboard" element={<HRDashboard />} />
        </Routes>
      </Router>
      <ToastContainer position="top-right" autoClose={3000} theme="light" />
    </NotificationProvider>
  )
}

export default App
