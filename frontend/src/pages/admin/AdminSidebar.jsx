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
  ClipboardList,
  PhoneCall,
} from "lucide-react";
import NotificationDropdown from "../../components/NotificationDropdown";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

const tabIcons = {
  Dashboard: <Home size={18} />,
  Employees: <Users size={18} />,
  Leaders: <UserCheck size={18} />,
  HRs: <Users size={18} />,
  Admins: <UserPlus size={18} />,
  Attendance: <Calendar size={18} />,
  "Holiday Calendar": <CalendarDays size={18} />,
  Leaves: <FileText size={18} />,
  Salary: <DollarSign size={18} />,
  Teams: <Layers size={18} />,
  Projects: <Briefcase size={18} />,
  Tasks: <ClipboardList size={18} />,
  "Contact Employee": <PhoneCall size={18} />,
  "Profile Verification": <CheckCircle size={18} />,
  Issues: <AlertTriangle size={18} />,
  "Threat Details": <Shield size={18} />,
  "Hiring & Vacancies": <Briefcase size={18} />,
  Hiring: <UserPlus size={18} />,
  "Generate Letter": <FileText size={18} />,
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
        className="fixed top-4 left-4 z-50 md:hidden p-2 text-primary hover:bg-gray-50 rounded-lg transition"
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
        className={`fixed left-0 top-0 h-screen w-60 flex flex-col bg-white text-primary shadow-2xl border-r border-gray-100 overflow-hidden transition-all duration-500 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
        style={{ zIndex: 40 }}
      >
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-6 right-6 z-50 md:hidden p-2 text-primary hover:bg-gray-100 rounded-xl transition-all"
        >
          <X size={24} />
        </button>

      <div className="pt-6 pb-6 px-8">
        <div className="flex items-center gap-4 mb-3">
          <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 transition-transform hover:rotate-12">
            <img src="/qiro-logo.png" alt="Logo" className="w-6 h-6 object-contain invert brightness-0" />
          </div>
          <h3 className="text-2xl font-black tracking-tighter text-primary">
            QiroTech
          </h3>
        </div>
        <div className="h-1 w-12 bg-primary rounded-full mb-2"></div>
        <p className="text-[10px] font-black text-secondary uppercase tracking-[0.3em] ml-1 opacity-60">Master Admin</p>
      </div>

      <nav className="flex-1 px-4 overflow-y-auto ">
        <ul className="space-y-2">
          {tabs.map((t, idx) => (
            <li key={t} className="animate-slideUp" style={{ animationDelay: `${idx * 0.05}s` }}>
              <button
                onClick={() => handleTabChange(t)}
                className={`flex items-center gap-4 w-full px-5 py-3 rounded-2xl text-[13px] font-bold transition-all duration-300 group relative ${
                  active === t
                    ? "bg-primary text-white shadow-xl shadow-primary/25 scale-[1.02]"
                    : "text-secondary hover:text-primary hover:bg-primary/5"
                }`}
              >
                <span className={`transition-transform duration-300 group-hover:scale-110 ${active === t ? "text-white" : "text-primary/70"}`}>
                  {tabIcons[t] || null}
                </span>
                <span className="truncate tracking-tight">{t}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-auto px-2 pb-2 space-y-2 border-t border-gray-100 pt-2">
        <NotificationDropdown />
        <button 
          onClick={doLogout} 
          className="flex items-center gap-4 w-full px-5 py-2 rounded-2xl text-sm font-bold text-red-500 hover:bg-red-50 transition-all duration-300 border border-transparent hover:border-red-100 group"
        >
          <div className="p-2 bg-red-50 rounded-lg group-hover:bg-red-100 transition-colors">
            <LogOut size={18} /> 
          </div>
          Logout
        </button>
      </div>
    </aside>
    </>
  );
};

export default AdminSidebar;
