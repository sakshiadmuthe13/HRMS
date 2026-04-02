"use client";

import React, { useState } from "react";
import {
  Home,
  Users,
  UserCheck,
  UserPlus,
  Calendar,
  CalendarDays,
  FileText,
  DollarSign,
  Layers,
  Briefcase,
  AlertTriangle,
  Shield,
  Settings,
  HelpCircle,
  LogOut,
  CheckCircle,
  BarChart3,
  Menu,
  X,
} from "lucide-react";
import NotificationDropdown from "../../components/NotificationDropdown";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

const tabIcons = {
  Dashboard: <Home size={18} />,
  Employees: <Users size={18} />,
  Leaders: <UserCheck size={18} />,
  Admins: <UserPlus size={18} />,
  Attendance: <Calendar size={18} />,
  "Holiday Calendar": <CalendarDays size={18} />,
  Leaves: <FileText size={18} />,
  Salary: <DollarSign size={18} />,
  Teams: <Layers size={18} />,
  Projects: <Briefcase size={18} />,
  "Profile Verification": <CheckCircle size={18} />,
  Issues: <AlertTriangle size={18} />,
  "Threat Details": <Shield size={18} />,
  Reports: <BarChart3 size={18} />,
};

const AdminSidebar = ({ tabs = [], active, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const doLogout = async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, { method: "POST", credentials: "include" });
    } catch (e) {
      console.error("Logout error:", e);
    }
    try { localStorage.removeItem("token"); } catch (e) { console.error("localStorage error:", e); }
    try { sessionStorage.removeItem("token"); } catch (e) { console.error("sessionStorage error:", e); }
    window.location.href = "/login";
  };

  const handleTabChange = (tab) => {
    onChange(tab);
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 md:hidden p-2 text-white hover:bg-white/10 rounded-lg transition"
      >
        {!isOpen && <Menu size={24} />}
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-screen w-64 flex flex-col bg-gradient-to-b from-[#0F0F1E] to-[#141428] text-white shadow-[0_0_20px_rgba(167,86,250,0.15)] border-r border-[#1C1436] overflow-hidden transition-all duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
        style={{ zIndex: 40 }}
      >
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 z-50 md:hidden p-2 text-white hover:bg-white/10 rounded-lg transition"
        >
          <X size={24} />
        </button>

      {/* Brand */}
      <div className="pt-16 md:pt-6 pb-8 px-4">
        <h3 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
          QiroTech Innovation
        </h3>
        <p className="text-sm text-gray-400 mt-1 ml-2">Admin Portal</p>
      </div>

      {/* Tabs */}
      <ul className="space-y-1 flex-1 px-3">
        {tabs.map((t) => (
          <li key={t}>
            <button
              onClick={() => handleTabChange(t)}
              className={`flex items-center gap-3 w-full px-4 py-2 rounded-lg text-md font-medium transition-all duration-200 relative ${
                active === t
                  ? "bg-gradient-to-r from-purple-500 to-blue-500 text-black font-semibold shadow-lg"
                  : "text-gray-300 hover:text-white hover:bg-white/5"
              }`}
            >
              {tabIcons[t] || null}
              <span className="truncate">{t}</span>
              {active === t && (
                <span className="absolute left-0 top-0 h-full w-[3px] bg-blue-400 rounded-r-lg"></span>
              )}
            </button>
          </li>
        ))}
      </ul>

      {/* Bottom actions */}
      <div className="mt-auto px-3 pb-6 space-y-1">
        <div className="flex items-center gap-3 w-full px-2 rounded-lg text-gray-300 transition">
          <NotificationDropdown />
        </div>
        <button onClick={doLogout} className="flex items-center gap-3 w-full px-4 py-2 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-500/10 transition">
          <LogOut size={18} /> Logout
        </button>
      </div>
    </aside>
    </>
  );
};

export default AdminSidebar;
