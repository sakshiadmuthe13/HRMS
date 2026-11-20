import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { Users, UserCheck, Calendar, Clock, ArrowUpRight, Target } from "lucide-react";
import { motion } from "framer-motion";
import HRSidebar from "./HRSidebar";
import DashboardNavbar from "../../components/DashboardNavbar";
import HRProfilePage from "./HRProfilePage";
import HRAttendancePage from "./HRAttendancePage";
import HRManageAttendancePage from "./HRManageAttendancePage";
import HRLeavePage from "./HRLeavePage";
import HRManageLeavesPage from "./HRManageLeavesPage";
import HRGenerateLetterPage from "./HRGenerateLetterPage";
import HRSalaryPage from "./HRSalaryPage";
import HRHiringPage from "./HRHiringPage";
import ProfileVerificationPage from "../admin/ProfileVerificationPage";
import AdminWorkLogsPage from "../admin/AdminWorkLogsPage";
import HRContactEmployeePage from "./HRContactEmployeePage";
import DashboardSkeleton from "../../components/DashboardSkeleton";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

const fetchJson = async (path, opts = {}) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    ...opts,
  });
  if (!res.ok) {
    let text = await res.text();
    try {
      text = JSON.parse(text);
    } catch {
      // Ignore
    }
    throw new Error((text && text.message) || res.statusText || "API error");
  }
  const t = await res.text();
  return t ? JSON.parse(t) : null;
};

const TABS = ["Dashboard", "Profile", "My Attendance", "My Leaves", "Manage Attendance", "Manage Leaves", "Salary", "Work Activity Logs", "Generate Letter", "Hiring", "Profile Verification", "Contact Employee"];

const HRDashboard = () => {
  const [active, setActive] = useState("Dashboard");
  const [pageLoading, setPageLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem("sidebar-collapsed") === "true";
    } catch {
      return false;
    }
  });
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  const toggleCollapse = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    try {
      localStorage.setItem("sidebar-collapsed", next.toString());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const data = await fetchJson("/hr/dashboard");
      setSummary(data);
    } catch (err) {
      console.error("Failed to fetch HR dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => setPageLoading(false), 400);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (active === "Dashboard") {
      fetchDashboard();
    }
  }, [active]);

  if (pageLoading) return <DashboardSkeleton role="hr" />;

  return (
    <div className="min-h-screen flex bg-background text-primary">
      <HRSidebar tabs={TABS} active={active} onChange={setActive} isCollapsed={isCollapsed} onToggleCollapse={toggleCollapse} />

      <main className={`flex-1 animate-fadeIn overflow-x-hidden transition-all duration-300 ${isCollapsed ? "md:ml-20" : "md:ml-60"}`}>
        <DashboardNavbar />
        <div className="p-6 md:p-8 w-full">
          {active === "Dashboard" && (
            <section className={`transition-all duration-300 ${isCollapsed ? "max-w-none w-full" : "max-w-7xl mx-auto"} space-y-12`}>
              <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 animate-slideUp">
                <div>
                  <h2 className="text-5xl font-black mb-3 text-primary tracking-tighter leading-tight">
                    Welcome back, <span className="text-secondary">{summary?.userName || "HR"}</span>!
                  </h2>
                  <p className="text-lg font-semibold text-secondary/70 flex items-center gap-2">
                    <Calendar size={18} />
                    {format(new Date(), 'EEEE, MMMM do yyyy')}
                  </p>
                </div>
              </header>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                  { label: "Total Employees", val: summary?.employeesCount || 0, icon: <Users />, color: "bg-cyan-50 text-[#12637E]" },
                  { label: "Total Leaders", val: summary?.leadersCount || 0, icon: <UserCheck />, color: "bg-blue-50 text-[#1A9DC2]" },
                  { label: "Attendance Status", val: summary?.todayStatus || "--", icon: <Clock />, color: "bg-amber-50 text-amber-600" },
                  { label: "Active Requests", val: "12 Pending", icon: <Target />, color: "bg-emerald-50 text-emerald-600" },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1, duration: 0.5 }}
                    className="card-premium p-8 group relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      {React.cloneElement(stat.icon, { size: 80 })}
                    </div>
                    
                    <div className="flex items-center justify-between mb-6">
                      <div className={`p-4 rounded-2xl ${stat.color} shadow-inner group-hover:scale-110 transition-all duration-300`}>
                        {React.cloneElement(stat.icon, { size: 28 })}
                      </div>
                      <ArrowUpRight className="text-gray-300 group-hover:text-primary transition-colors" size={20} />
                    </div>
                    
                    <div className="space-y-1">
                      <div className="text-4xl font-black text-primary tracking-tight">
                        {loading ? <span className="animate-pulse text-gray-200">---</span> : stat.val}
                      </div>
                      <div className="text-[11px] font-black text-secondary/60 uppercase tracking-[0.25em]">{stat.label}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="card-premium p-10 md:p-16 relative overflow-hidden flex flex-col items-center justify-center text-center bg-gradient-to-br from-[var(--color-bg-card)] to-[var(--color-bg-elevated)] border-[var(--color-border)]"
              >
                 <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary"></div>
                 <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
                 <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-secondary/5 rounded-full blur-3xl"></div>
 
                 <div className="relative z-10 max-w-2xl">
                   <h3 className="text-4xl font-black mb-6 tracking-tight">HR Management Hub</h3>
                   <p className="text-lg text-[var(--color-text-secondary)] font-medium mb-10 leading-relaxed">
                     Streamline your organizational workflow. Manage attendance, process leave requests, and monitor employee performance from a single unified interface.
                   </p>
                   <div className="flex flex-wrap items-center justify-center gap-4">
                     <button 
                      onClick={() => setActive("Manage Leaves")} 
                      className="btn btn-primary text-lg px-10 py-4"
                     >
                      Review Pending Leaves
                     </button>
                     <button 
                      onClick={() => setActive("Hiring")} 
                      className="btn btn-secondary text-lg px-10 py-4"
                     >
                      Recruitment Pipeline
                     </button>
                   </div>
                 </div>
              </motion.div>
            </section>
          )}

          {active === "Profile" && <HRProfilePage />}
          {active === "My Attendance" && <HRAttendancePage />}
          {active === "Manage Attendance" && <HRManageAttendancePage />}
          {active === "My Leaves" && <HRLeavePage />}
          {active === "Manage Leaves" && <HRManageLeavesPage />}
          {active === "Salary" && <HRSalaryPage />}
          {active === "Work Activity Logs" && <AdminWorkLogsPage />}
          {active === "Generate Letter" && <HRGenerateLetterPage />}
          {active === "Hiring" && <HRHiringPage />}
          {active === "Profile Verification" && <ProfileVerificationPage />}
          {active === "Contact Employee" && <HRContactEmployeePage />}
        </div>
      </main>
    </div>
  );
};

export default HRDashboard;
