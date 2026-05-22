import React, { useEffect, useState } from "react";
import AdminSidebar from "./AdminSidebar";
import EmployeesPage from "./EmployeesPage";
import LeadersPage from "./LeadersPage";
import AdminsPage from "./AdminsPage";
import HRsPage from "./HRsPage";
import AttendancePage from "./AttendancePage";
import AdminHolidayCalendar from "./AdminHolidayCalendar";
import LeavesPage from "./LeavesPage";
import SalaryPage from "../hr/HRSalaryPage";
import HRGenerateLetterPage from "../hr/HRGenerateLetterPage";
import HRHiringPage from "../hr/HRHiringPage";
import ProfileVerificationPage from "./ProfileVerificationPage";
import TeamsPage from "./TeamsPage";
import ProjectsPage from "./ProjectsPage";
import ReportsPage from "./ReportsPage";
import VacancyManagementPage from "../../components/VacancyManagementPage";
import AdminTasksPage from "./AdminTasksPage";
import AdminContactEmployeePage from "./AdminContactEmployeePage";
import { Users, UserCheck, FileText, Briefcase, Calendar, AlertTriangle, Shield, CheckCircle } from "lucide-react";
import { differenceInDays, format } from "date-fns";
import { motion } from "framer-motion";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

const fetchJson = async (path, opts = {}) => {
  const token = (() => {
    try {
      return localStorage.getItem("token") || sessionStorage.getItem("token");
    } catch {
      return null;
    }
  })();
  const headers = { ...(opts.headers || {}) };
  if (token && !headers.Authorization && !headers.authorization)
    headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    ...opts,
    headers,
  });
  if (!res.ok) {
    let text = await res.text();
    try {
      text = JSON.parse(text);
    } catch {
      // Ignore JSON parse errors, use text as-is
    }
    throw new Error((text && text.message) || res.statusText || "API error");
  }
  const t = await res.text();
  return t ? JSON.parse(t) : null;
};

const apiGet = (p) => fetchJson(p);

const TABS = [
  "Dashboard",
  "Employees",
  "Leaders",
  "HRs",
  "Admins",
  "Attendance",
  "Holiday Calendar",
  "Leaves",
  "Salary",
  "Teams",
  "Projects",
  "Tasks",
  "Contact Employee",
  "Profile Verification",
  "Generate Letter",
  "Hiring & Vacancies",
  "Hiring",
  "Reports",
];

const AdminDashboard = () => {
  const [active, setActive] = useState("Dashboard");
  const [summary, setSummary] = useState(null);
  const [pendingLeaves, setPendingLeaves] = useState(0);
  const [totalProjects, setTotalProjects] = useState(0);
  const [todaysPresent, setTodaysPresent] = useState(0);
  const [pendingProfiles, setPendingProfiles] = useState(0);
  const [projects, setProjects] = useState([]);
  const [allLeaves, setAllLeaves] = useState([]);
  const [filterStatus, setFilterStatus] = useState("All");
  const [userName, setUserName] = useState("");
  const [delayedTasks, setDelayedTasks] = useState([]);

  useEffect(() => {
    // Get user name from localStorage
    const name = localStorage.getItem("name");
    if (name) {
      setUserName(name);
    }
  }, []);

  useEffect(() => {
    if (active === "Dashboard") {
      fetchSummary();
      fetchLeaves();
      fetchProjects();
      fetchAttendance();
      fetchDelayedTasks();
    }
  }, [active]);

  const fetchSummary = async () => {
    try {
      const [employees, leaders, verifications] = await Promise.all([
        apiGet("/admin/employees"),
        apiGet("/admin/leaders"),
        apiGet("/admin/verification/employees"),
      ]);
      setSummary({
        totalEmployees: employees.length,
        totalLeaders: leaders.length,
      });
      setPendingProfiles(verifications.filter(e => !e.profileVerified).length);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLeaves = async () => {
    try {
      const res = await apiGet("/admin/leave/all");
      setAllLeaves(res);
      setPendingLeaves(res.filter((l) => l.status === "Pending").length);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await apiGet("/admin/projects");
      setProjects(res);
      setTotalProjects(res.length);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAttendance = async () => {
    const today = new Date().toISOString().split("T")[0];
    try {
      const res = await apiGet(`/admin/attendance/by-date?date=${today}`);
      const extractCheck = (row, which) => {
        if (!row) return null;
        if (row[which]) return row[which];
        if (row.attendance && row.attendance[which]) return row.attendance[which];
        if (Array.isArray(row.attendance) && row.attendance.length > 0) {
          const first = row.attendance[0];
          if (first && first[which]) return first[which];
        }
        if (row.userAttendance && row.userAttendance[which]) return row.userAttendance[which];
        if (row.attendanceRecords && Array.isArray(row.attendanceRecords) && row.attendanceRecords[0] && row.attendanceRecords[0][which])
          return row.attendanceRecords[0][which];
        return null;
      };
      const count = (res || []).filter(r => {
        const rawStatus = r.status;
        const ci = extractCheck(r, "checkIn");
        const co = extractCheck(r, "checkOut");
        const isOvertime = rawStatus === "Over-time" || (rawStatus === "Holiday" && (ci || co));
        return rawStatus === "Present" || isOvertime;
      }).length;
      setTodaysPresent(count);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDelayedTasks = async () => {
    try {
      const res = await apiGet("/admin/delayed-tasks");
      setDelayedTasks(res || []);
    } catch (err) {
      console.error(err);
    }
  };

  const projectStatusData = () => {
    const counts = {};
    projects.forEach((p) => {
      counts[p.status] = (counts[p.status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  };

  const COLORS = ["#12637E", "#22C55E", "#F59E0B", "#EF4444"];

  return (
    <div className="flex bg-background text-primary min-h-screen">
      <AdminSidebar tabs={TABS} active={active} onChange={setActive} />

      <main className="flex-1 px-6 sm:px-10 md:px-10 py-10 md:ml-60 overflow-y-auto w-full pt-20 md:pt-10">
        {active === "Dashboard" && (
          <section className="flex flex-col h-full animate-fadeIn max-w-7xl mx-auto space-y-12">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 animate-slideUp">
              <div>
                <h2 className="text-5xl font-black mb-3 text-primary tracking-tighter leading-tight">
                  Welcome back, <span className="text-secondary">{userName || "Admin"}</span>!
                </h2>
                <p className="text-lg font-semibold text-secondary/70 flex items-center gap-2">
                  <Briefcase size={20} className="text-primary" />
                  System Overview Overview — {format(new Date(), 'MMMM yyyy')}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-black text-primary">Master Control</div>
                  <div className="text-[10px] font-bold text-secondary uppercase tracking-widest">v2.4.0 Active</div>
                </div>
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 shadow-inner">
                  <Shield size={28} className="text-primary" />
                </div>
              </div>
            </header>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
              {[
                { label: "Total Employees", val: summary?.totalEmployees ?? "--", icon: <Users />, color: "bg-cyan-50 text-[#12637E]" },
                { label: "Total Leaders", val: summary?.totalLeaders ?? "--", icon: <UserCheck />, color: "bg-blue-50 text-[#1A9DC2]" },
                { label: "Today's Attendance", val: todaysPresent, icon: <Calendar />, color: "bg-emerald-50 text-emerald-600" },
                { label: "Pending Leaves", val: pendingLeaves, icon: <FileText />, color: "bg-amber-50 text-amber-600" },
                { label: "Pending Profiles", val: pendingProfiles, icon: <CheckCircle />, color: "bg-indigo-50 text-indigo-600" },
                { label: "Delayed Tasks", val: delayedTasks.length, icon: <AlertTriangle />, color: "bg-red-50 text-red-600" },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`card-premium p-8 group relative overflow-hidden ${stat.label === 'Delayed Tasks' ? 'border-red-100' : ''}`}
                >
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    {React.cloneElement(stat.icon, { size: 60 })}
                  </div>
                  <div className="flex items-center justify-between mb-6">
                    <div className={`p-4 rounded-2xl ${stat.color} shadow-inner group-hover:scale-110 transition-transform duration-300`}>
                      {React.cloneElement(stat.icon, { size: 28 })}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className={`text-4xl font-black tracking-tight ${stat.label === 'Delayed Tasks' ? 'text-red-600' : 'text-primary'}`}>
                      {stat.val}
                    </div>
                    <div className="text-[11px] font-black text-secondary/60 uppercase tracking-[0.25em]">{stat.label}</div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Project Chart & Leave Requests */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {/* Project Pie Chart */}
              <div className="card-premium p-8 h-full bg-white">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-black text-primary tracking-tight">Project Summary</h3>
                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center">
                    <Briefcase size={20} className="text-secondary" />
                  </div>
                </div>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={projectStatusData()}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {projectStatusData().map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                            className="outline-none"
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                      />
                      <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Leave Requests Table */}
              <div className="card-premium p-8 h-full flex flex-col bg-white">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                  <h3 className="text-2xl font-black text-primary tracking-tight">Leave Requests</h3>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full md:w-auto px-4 py-2 border border-gray-100 rounded-xl bg-gray-50 text-primary text-xs font-bold uppercase tracking-widest focus:ring-4 focus:ring-primary/5 outline-none cursor-pointer transition-all"
                  >
                    <option value="All">All Requests</option>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                <div className="flex-1 overflow-hidden rounded-2xl border border-gray-100">
                  <div className="overflow-x-auto overflow-y-auto max-h-[350px] no-scrollbar">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50/50 sticky top-0 backdrop-blur-sm">
                        <tr>
                          <th className="px-6 py-4 font-black text-[10px] text-secondary uppercase tracking-widest">Name</th>
                          <th className="px-6 py-4 font-black text-[10px] text-secondary uppercase tracking-widest text-center">Days</th>
                          <th className="px-6 py-4 font-black text-[10px] text-secondary uppercase tracking-widest text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {allLeaves
                          .filter((l) => filterStatus === "All" || l.status === filterStatus)
                          .map((leave) => {
                            const daysCount = differenceInDays(new Date(leave.toDate), new Date(leave.fromDate)) + 1;
                            const statusStyle = {
                              Approved: "bg-emerald-50 text-emerald-600 border-emerald-100",
                              Pending: "bg-amber-50 text-amber-600 border-amber-100",
                              Rejected: "bg-red-50 text-red-600 border-red-100",
                            }[leave.status] || "bg-gray-50 text-gray-600";

                            return (
                              <tr key={leave._id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4">
                                  <div className="font-bold text-primary">{leave.user?.name || "N/A"}</div>
                                  <div className="text-[10px] font-medium text-secondary">{leave.user?.role || "N/A"}</div>
                                </td>
                                <td className="px-6 py-4 text-center font-black text-primary">{daysCount}</td>
                                <td className="px-6 py-4 text-right">
                                  <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${statusStyle}`}>
                                    {leave.status}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Other Tabs */}
        {active === "Employees" && <EmployeesPage />}
        {active === "Leaders" && <LeadersPage />}
        {active === "HRs" && <HRsPage />}
        {active === "Admins" && <AdminsPage />}
        {active === "Attendance" && <AttendancePage />}
        {active === "Holiday Calendar" && <AdminHolidayCalendar />}
        {active === "Leaves" && <LeavesPage />}
        {active === "Salary" && <SalaryPage />}
        {active === "Teams" && <TeamsPage />}
        {active === "Projects" && <ProjectsPage />}
        {active === "Tasks" && <AdminTasksPage />}
        {active === "Contact Employee" && <AdminContactEmployeePage />}
        {active === "Profile Verification" && <ProfileVerificationPage />}
        {active === "Reports" && <ReportsPage />}
        {active === "Hiring & Vacancies" && <VacancyManagementPage />}
        {active === "Generate Letter" && <HRGenerateLetterPage />}
        {active === "Hiring" && <HRHiringPage />}
      </main>
    </div>
  );
};

export default AdminDashboard;
