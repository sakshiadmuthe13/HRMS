"use client";

import React from "react";
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
} from "lucide-react";
import NotificationDropdown from "../../components/NotificationDropdown";

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
  const doLogout = async () => {
    try {
      // attempt server-side logout if endpoint exists
      await fetch((import.meta.env.VITE_API_BASE || "http://localhost:5000/api") + "/auth/logout", { method: "POST", credentials: "include" });
    } catch {
      // ignore errors
    }
    // clear client-side auth
    try { localStorage.removeItem("token"); } catch { /* ignore */ }
    try { sessionStorage.removeItem("token"); } catch { /* ignore */ }
    // redirect to login
    window.location.href = "/login";
  };

  return (
    <aside
      className="fixed left-0 top-0 h-screen w-64 flex flex-col bg-gradient-to-b from-[#0F0F1E] to-[#141428] text-white shadow-[0_0_20px_rgba(167,86,250,0.15)] border-r border-[#1C1436] overflow-hidden transition-all duration-300"
      style={{ zIndex: 40 }}
    >

      {/* Brand */}
      <div className="pt-6 pb-8 px-4">
        <h3 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
          DW Innovation
        </h3>
        <p className="text-sm text-gray-400 mt-1 ml-2">Admin Portal</p>
      </div>

      {/* Tabs */}
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
              {/* Icon */}
              {tabIcons[t] || null}
              <span>{t}</span>

              {/* Active glow */}
              {active === t && (
                <span className="absolute left-0 top-0 h-full w-[3px] bg-blue-400 rounded-r-lg"></span>
              )}
            </button>
          </li>
        ))}
      </ul>

      {/* Bottom actions */}
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

export default AdminSidebar;
