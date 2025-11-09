"use client";

import React from "react";
import { Home, Calendar, FileText, Layers, CheckSquare, HelpCircle, Settings, LogOut, User, Phone } from "lucide-react";
import NotificationDropdown from "../../components/NotificationDropdown";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

const tabIcons = {
  Dashboard: <Home size={18} />,
  Attendance: <Calendar size={18} />,
  "Apply Leave": <FileText size={18} />,
  "My Teams": <Layers size={18} />,
  "My Tasks": <CheckSquare size={18} />,
  "My Projects": <FileText size={18} />,
  "Contact Employee": <Phone size={18} />,
  Profile: <User size={18} />,
};

const EmployeeSidebar = ({ tabs = [], active, onChange }) => {
  const doLogout = async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, { method: "POST", credentials: "include" });
    } catch {
      // Ignore logout errors
    }
    try { localStorage.removeItem("token"); } catch {
      // Ignore localStorage errors
    }
    try { sessionStorage.removeItem("token"); } catch {
      // Ignore sessionStorage errors
    }
    window.location.href = "/login";
  };

  return (
    <aside
      className="fixed left-0 top-0 h-screen w-64 flex flex-col bg-gradient-to-b from-[#0F0F1E] to-[#141428] text-white shadow-[0_0_20px_rgba(167,86,250,0.15)] border-r border-[#1C1436] overflow-hidden transition-all duration-300"
      style={{ zIndex: 40 }}
    >
      <div className="pt-6 pb-8 px-4">
        <h3 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
          DW Innovation
        </h3>
        <p className="text-sm text-gray-400 mt-1 ml-2">Employee Portal</p>
      </div>

      <ul className="space-y-1 flex-1 px-3">
  {tabs.map((t) => (
    <li key={t}>
      <button
        onClick={() => onChange(t)}
        className={`flex items-center gap-3 w-full px-4 py-2 rounded-lg text-md font-medium transition-all duration-200 relative
        ${
          active === t
            ? "bg-gradient-to-r from-purple-500 to-blue-500 text-black font-semibold shadow-lg"
            : "text-gray-300 hover:text-white hover:bg-white/5"
        }`}
      >
        {tabIcons[t] || null}
        <span>{t}</span>

        {active === t && (
          <span className="absolute left-0 top-0 h-full w-[3px] bg-blue-400 rounded-r-lg"></span>
        )}
      </button>
    </li>
  ))}
</ul>

      <div className="mt-auto px-3 pb-6 space-y-1">
        {/* Notifications */}
      <div className="flex items-center gap-3 w-full px-2 rounded-lg text-gray-300 transition">
        <NotificationDropdown /> 
      </div>
        {/* <button className="flex items-center gap-3 w-full px-4 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/5 transition">
          <HelpCircle size={18} /> Help & Supports
        </button>
        <button className="flex items-center gap-3 w-full px-4 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/5 transition">
          <Settings size={18} /> Settings
        </button> */}
        <button onClick={doLogout} className="flex items-center gap-3 w-full px-4 py-2 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-500/10 transition">
          <LogOut size={18} /> Logout
        </button>
      </div>
    </aside>
  );
};

export default EmployeeSidebar;
