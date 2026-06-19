import React, { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";
import NotificationDropdown from "./NotificationDropdown";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

const DashboardNavbar = () => {
  const [profile, setProfile] = useState(null);
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("theme") || "light";
    } catch {
      return "light";
    }
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        if (!token) return;
        const res = await fetch(`${API_BASE}/auth/profile`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
        }
      } catch (err) {
        console.error("Error fetching navbar profile:", err);
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem("theme", theme);
    } catch (e) {
      console.error(e);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-surface/80 backdrop-blur-md border-b border-border transition-all duration-300">
      <div className="flex items-center justify-between px-6 py-4 md:px-8">
        {/* Left spacing or console label */}
        <div className="flex items-center gap-4">
          <span className="hidden md:inline-block text-xs font-black uppercase tracking-widest text-primary">
            Console Overview
          </span>
        </div>

        {/* Right Action Items */}
        <div className="flex items-center gap-4">
          

          {/* Notifications Dropdown (opens top-right to bottom) */}
          <div className="relative flex items-center justify-center">
            <NotificationDropdown
              showText={false}
              positionClasses="md:right-10 md:top-20 md:bottom-auto md:left-auto md:rounded-3xl"
            />
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-elevated hover:bg-border text-primary hover:text-secondary transition-all duration-300 shadow-sm border border-border cursor-pointer"
            aria-label="Toggle Theme"
          >
            {theme === "light" ? (
              <Moon size={18} className="transition-transform duration-300 hover:rotate-12" />
            ) : (
              <Sun size={18} className="text-amber-400 transition-transform duration-300 hover:rotate-45" />
            )}
          </button>

          {/* Vertical Divider */}
          <div className="h-6 w-px bg-border" />

          {/* User Profile Summary */}
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary bg-elevated flex items-center justify-center flex-shrink-0 shadow-sm">
              {profile?.documents?.passportPhoto?.path ? (
                <img
                  src={profile.documents.passportPhoto.path}
                  alt={profile.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xs font-black text-primary">
                  {getInitials(profile?.name || localStorage.getItem("name"))}
                </span>
              )}
            </div>

            {/* Name and Email */}
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-sm font-extrabold text-text leading-tight">
                {profile?.name || localStorage.getItem("name") || "User"}
              </span>
              <span className="text-[10px] font-bold text-text-secondary">
                {profile?.email || `${localStorage.getItem("role")}@qirotech.com`}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardNavbar;
