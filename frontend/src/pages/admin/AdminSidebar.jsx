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
  IndianRupee,
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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

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
  Salary: <IndianRupee size={18} />,
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

const AdminSidebar = ({ tabs = [], active, onChange, isCollapsed = false, onToggleCollapse }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredTab, setHoveredTab] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });

  const handleMouseEnter = (e, tab) => {
    if (!isCollapsed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({
      top: rect.top + rect.height / 2,
      left: rect.right + 12,
    });
    setHoveredTab(tab);
  };

  const handleMouseLeave = () => {
    setHoveredTab(null);
  };

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
        className={`fixed left-0 top-0 h-screen flex flex-col bg-white text-primary shadow-2xl border-r border-gray-100 overflow-visible transition-all duration-300 ease-in-out ${
          isCollapsed ? "w-20" : "w-60"
        } ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
        style={{ zIndex: 40 }}
      >
        <button
          onClick={onToggleCollapse}
          className="hidden md:flex absolute -right-3 top-8 w-6 h-6 bg-white border border-gray-200 rounded-full items-center justify-center shadow-md hover:bg-gray-50 transition-all z-50 text-primary cursor-pointer"
          aria-label={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-6 right-6 z-50 md:hidden p-2 text-primary hover:bg-gray-100 rounded-xl transition-all"
        >
          <X size={24} />
        </button>

      <div className={`pt-6 pb-6 transition-all duration-300 ${isCollapsed ? "px-5" : "px-8"}`}>
        <div className="flex items-center gap-4 mb-3">
          <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 transition-transform hover:rotate-12 flex-shrink-0">
            <img src="/qiro-logo.png" alt="Logo" className="w-6 h-6 object-contain invert brightness-0" />
          </div>
          {!isCollapsed && (
            <h3 className="text-2xl font-black tracking-tighter text-primary truncate whitespace-nowrap">
              QiroTech
            </h3>
          )}
        </div>
        {!isCollapsed && (
          <div className="whitespace-nowrap">
            <div className="h-1 w-12 bg-primary rounded-full mb-2"></div>
            <p className="text-[10px] font-black text-secondary uppercase tracking-[0.3em] ml-1 opacity-60">Master Admin</p>
          </div>
        )}
      </div>

      <nav className={`flex-1 px-4 w-full overflow-y-auto overflow-x-hidden no-scrollbar`}>
        <ul className="space-y-2">
          {tabs.map((t, idx) => (
            <li key={t} className="animate-slideUp" style={{ animationDelay: `${idx * 0.05}s` }}>
              <button
                onClick={() => handleTabChange(t)}
                onMouseEnter={(e) => handleMouseEnter(e, t)}
                onMouseLeave={handleMouseLeave}
                className={`flex items-center w-full py-3 rounded-2xl text-[13px] font-bold transition-all duration-300 group relative ${
                  isCollapsed ? "justify-center px-0" : "gap-4 px-5"
                } ${active === t
                  ? "bg-primary text-white shadow-xl shadow-primary/25 scale-[1.02]"
                  : "text-secondary hover:text-primary hover:bg-primary/5"
                }`}
              >
                <span className={`transition-transform duration-300 group-hover:scale-110 flex-shrink-0 ${active === t ? "text-white" : "text-primary/70"}`}>
                  {tabIcons[t] || null}
                </span>
                {!isCollapsed && <span className="truncate tracking-tight whitespace-nowrap">{t}</span>}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className={`mt-auto px-2 pb-2 space-y-2 border-t border-gray-100 pt-2 w-full flex flex-col ${isCollapsed ? "items-center" : ""}`}>
        <button 
          onClick={doLogout} 
          onMouseEnter={(e) => handleMouseEnter(e, "Logout")}
          onMouseLeave={handleMouseLeave}
          className={`flex items-center w-full py-2 rounded-2xl text-sm font-bold text-red-500 hover:bg-red-50 transition-all duration-300 border border-transparent hover:border-red-100 group ${
            isCollapsed ? "justify-center px-0" : "gap-4 px-5"
          }`}
        >
          <div className="p-2 bg-red-50 rounded-lg group-hover:bg-red-100 transition-colors flex-shrink-0">
            <LogOut size={18} /> 
          </div>
          {!isCollapsed && <span className="whitespace-nowrap">Logout</span>}
        </button>
      </div>
    </aside>
      {isCollapsed && hoveredTab && (
        <div 
          className="fixed px-3 py-1.5 bg-[#1e293b] text-white text-xs font-bold rounded-lg shadow-xl whitespace-nowrap z-[100] pointer-events-none transition-opacity duration-200"
          style={{ 
            top: `${tooltipPos.top}px`, 
            left: `${tooltipPos.left}px`,
            transform: 'translateY(-50%)'
          }}
        >
          <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-2 bg-[#1e293b] rotate-45" />
          <span className="relative z-10">{hoveredTab}</span>
        </div>
      )}
    </>
  );
};

export default AdminSidebar;
