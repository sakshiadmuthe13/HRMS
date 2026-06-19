import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Briefcase, FileText, ClipboardCheck, TrendingUp, Calendar, Clock, Layout, CheckCircle2, AlertCircle } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import LeaderSidebar from "./LeaderSidebar";
import DashboardNavbar from "../../components/DashboardNavbar";
import LeaderAttendance from "./Attendance";
import LeaderTeamsPage from "../admin/TeamsPage";
import LeaderProjectsPage from "../admin/ProjectsPage";
import LeaderLeavesPage from "./Leave";
import AssignTaskPage from "./Task";
import Profile from "./Profile";
import ContactEmployeeLeaderPage from "./ContactEmployee";
import VacancyManagementPage from "../../components/VacancyManagementPage";
import DashboardSkeleton from "../../components/DashboardSkeleton";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

const apiGet = async (path) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error("API Failure");
  return res.json();
};

const TABS = [
  { id: "Dashboard", label: "Dashboard", icon: Layout },
  { id: "Profile", label: "Profile", icon: Users },
  { id: "Attendance", label: "Attendance", icon: Calendar },
  { id: "My Teams", label: "Teams", icon: Users },
  { id: "My Projects", label: "Projects", icon: Briefcase },
  { id: "Leaves", label: "Leaves", icon: FileText },
  { id: "Assign Task", label: "Assign Task", icon: ClipboardCheck },
  { id: "Contact Employee", label: "Contact Employee", icon: Users },
  { id: "Hiring Requirements", label: "Hiring Requirements", icon: Briefcase },
];

const LeaderDashboard = () => {
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
  const [tasks, setTasks] = useState([]);
  const [teamAttendance, setTeamAttendance] = useState([]);
  const [leaveAllowance, setLeaveAllowance] = useState(12);
  const [leavesRemaining, setLeavesRemaining] = useState(12);
  const [profileVerified, setProfileVerified] = useState(true);
  const [expandedUser, setExpandedUser] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setPageLoading(false), 400);
    return () => clearTimeout(t);
  }, []);

  const fetchSummary = async () => {
    try { const res = await apiGet("/leader/dashboard"); setSummary(res); } 
    catch (err) { console.error(err); }
  };

  const fetchTasks = async () => {
    try { const res = await apiGet("/leader/my-assigned-tasks"); setTasks(res || []); } 
    catch (err) { console.error(err); }
  };

  const fetchTeamAttendance = async () => {
    try { const res = await apiGet("/leader/team-attendance"); setTeamAttendance(res || []); } 
    catch (err) { console.error(err); }
  };

  const fetchProfileStatus = async () => {
    try { const res = await apiGet("/leader/profile"); setProfileVerified(res?.profileVerified || false); } 
    catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (active === "Dashboard") {
      fetchSummary();
      fetchTasks();
      fetchTeamAttendance();
      fetchProfileStatus();
    }
  }, [active]);

  if (pageLoading) return <DashboardSkeleton role="leader" />;

  const toggleCollapse = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    try {
      localStorage.setItem("sidebar-collapsed", next.toString());
    } catch (e) {
      console.error(e);
    }
  };

  const formatBreakTime = (timeStr) => {
    if (!timeStr) return "...";
    try {
      const date = new Date(timeStr);
      return date.toLocaleTimeString("en-US", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      });
    } catch (e) {
      return "...";
    }
  };



  const getAttendanceData = () => {
    const statusCount = { Present: 0, Leave: 0, Absent: 0, "Over-time": 0 };
    teamAttendance.forEach((member) => {
      const label = member?.status === "Over-time" ? "Over-time" : member?.status;
      if (label in statusCount) statusCount[label]++;
      else statusCount.Absent++;
    });
    return [
      { name: "Present", value: statusCount.Present, color: "#12637E" },
      { name: "Leave", value: statusCount.Leave, color: "#1A9DC2" },
      { name: "Over-time", value: statusCount["Over-time"], color: "#242736" },
      { name: "Absent", value: statusCount.Absent, color: "#EF4444" },
    ];
  };

  const getTaskData = () => {
    const statusCount = { Completed: 0, "In Progress": 0, Pending: 0 };
    tasks.forEach((task) => { if (task.status in statusCount) statusCount[task.status]++; });
    return [
      { status: "Done", count: statusCount.Completed },
      { status: "Doing", count: statusCount["In Progress"] },
      { status: "Todo", count: statusCount.Pending },
    ];
  };

  return (
    <div className="min-h-screen flex bg-gray-50/50">
      <LeaderSidebar tabs={TABS} active={active} onChange={setActive} isCollapsed={isCollapsed} onToggleCollapse={toggleCollapse} />

      <main className={`flex-1 min-h-screen overflow-x-hidden transition-all duration-300 ${isCollapsed ? "md:ml-20" : "md:ml-60"}`}>
        <DashboardNavbar />
        <div className={`p-6 md:p-8 space-y-12 transition-all duration-300 ${isCollapsed ? "max-w-none w-full" : "max-w-7xl mx-auto"}`}>
          {active === "Dashboard" && (
            <div className="animate-fadeIn space-y-12">
              <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 animate-slideUp">
                <div>
                  <h2 className="text-5xl font-black mb-3 text-primary tracking-tighter leading-tight">
                    Welcome back, <span className="text-secondary">{summary?.leaderName || "Leader"}</span>!
                  </h2>
                  <p className="text-lg font-semibold text-secondary/70 flex items-center gap-2">
                    <Calendar size={18} />
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                {!profileVerified && (
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center gap-2 bg-amber-50 text-amber-600 px-4 py-2.5 rounded-xl text-[10px] font-black border border-amber-200 uppercase tracking-widest shadow-sm">
                    <AlertCircle size={14} /> Verification Pending
                  </motion.div>
                )}
              </header>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                  { label: "Total Members", val: summary?.teamMembers || 0, sub: "Team Size", icon: <Users />, color: "bg-cyan-50 text-[#12637E]" },
                  { label: "Tasks Assigned", val: summary?.tasksAssigned || 0, sub: "Assigned Tasks", icon: <ClipboardCheck />, color: "bg-blue-50 text-[#1A9DC2]" },
                  { label: "My Projects", val: summary?.projectsUnderLeader || 0, sub: "Active Projects", icon: <Briefcase />, color: "bg-amber-50 text-amber-600" },
                  { label: "Leaves Remaining", val: leavesRemaining ?? 0, sub: `Of ${leaveAllowance} Days`, icon: <FileText />, color: "bg-emerald-50 text-emerald-600" },
                ].map((s, i) => (
                  <motion.div
                      key={s.label}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1, duration: 0.5 }}
                      className="bg-white p-6 rounded-[2rem] border border-gray-150 shadow-md hover:shadow-lg transition-all flex flex-col justify-between h-[160px] relative overflow-hidden group"
                  >
                    <div className="absolute top-0 right-0 p-5 opacity-[0.03] group-hover:opacity-[0.06] group-hover:scale-110 transition-all text-primary rotate-12">
                      {React.cloneElement(s.icon, { size: 100 })}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{s.label}</span>
                      <div className={`p-2.5 rounded-xl ${s.color} shadow-sm`}>
                        {React.cloneElement(s.icon, { size: 20 })}
                      </div>
                    </div>
                    <div>
                      <div className="text-3xl font-extrabold text-gray-900 tracking-tight">{s.val}</div>
                      <div className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-wider">{s.sub}</div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {teamAttendance.filter(m => m.status === 'Leave').length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-[2rem] p-6 flex items-start gap-4 shadow-sm animate-slideUp">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-blue-900">Employees on Holiday / Leave Today</h4>
                    <p className="text-xs font-bold text-blue-700/80 mt-1">
                      {teamAttendance.filter(m => m.status === 'Leave').map(m => m.name).join(", ")}
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-gray-200">
                  <h3 className="text-xl font-black text-primary tracking-tight mb-8 flex items-center gap-3">
                    <TrendingUp size={20} className="text-secondary" /> Workforce Pulse
                  </h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={getAttendanceData()} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                          {getAttendanceData().map((e, i) => <Cell key={i} fill={e.color} />)}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: '900' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-8">
                    {getAttendanceData().map((e, i) => (
                      <div key={i} className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-200">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: e.color }} />
                        <div className="text-[10px] font-black text-primary uppercase tracking-widest">{e.name}</div>
                        <div className="ml-auto text-[10px] font-black text-secondary">{e.value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-gray-200">
                  <h3 className="text-xl font-black text-primary tracking-tight mb-8 flex items-center gap-3">
                    <CheckCircle2 size={20} className="text-secondary" /> Execution Velocity
                  </h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={getTaskData()}>
                        <XAxis dataKey="status" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#12637E' }} />
                        <Tooltip cursor={{ fill: 'rgba(18, 99, 126, 0.05)' }} contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: '900' }} />
                        <Bar dataKey="count" fill="#12637E" radius={[10, 10, 0, 0]} barSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-gray-200 overflow-hidden">
                   <h3 className="text-xl font-black text-primary tracking-tight mb-8">Team Presence Status</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50/50">
                        <tr>
                           <th className="p-4 text-[10px] font-black text-secondary uppercase tracking-widest">Name</th>
                           <th className="p-4 text-[10px] font-black text-secondary uppercase tracking-widest text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {teamAttendance.map((m) => {
                          const isOnBreak = m.attendance?.is_on_break;
                          const totalBreak = m.attendance?.total_break_minutes || 0;
                          const breaksList = m.attendance?.breaks || [];
                          const isExpanded = expandedUser === m._id;

                          return (
                            <React.Fragment key={m._id}>
                              <tr className="hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => setExpandedUser(isExpanded ? null : m._id)}>
                                <td className="p-4 text-sm font-black text-primary">
                                  <div className="flex flex-col">
                                    <span>{m.name}</span>
                                    <span className="text-[10px] font-medium text-gray-450">{m.email}</span>
                                  </div>
                                </td>
                                <td className="p-4 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    {isOnBreak && (
                                      <span className="relative flex h-2 w-2 mr-1">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                                      </span>
                                    )}
                                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                                      isOnBreak ? 'bg-amber-50 text-amber-600 border-amber-200' :
                                      m.status === 'Present' ? 'bg-green-50 text-green-600 border-green-200' :
                                      m.status === 'Leave' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                                      m.status === 'Absent' ? 'bg-red-50 text-red-500 border-red-200' :
                                      'bg-amber-50 text-amber-600 border-amber-200'
                                    }`}>{isOnBreak ? 'On Break' : m.status}</span>
                                  </div>
                                </td>
                              </tr>
                              {isExpanded && (
                                <tr>
                                  <td colSpan="2" className="p-4 bg-gray-50/70 border-t border-gray-150">
                                    <div className="space-y-2 text-xs font-bold text-secondary">
                                      <div className="flex justify-between">
                                        <span>Total Break Time:</span>
                                        <span className="text-primary font-black">{totalBreak} minutes</span>
                                      </div>
                                      {breaksList.length > 0 ? (
                                        <div className="mt-2 space-y-1">
                                          <div className="text-[9px] font-black uppercase tracking-wider text-gray-400">Break Sessions:</div>
                                          {breaksList.map((b, idx) => (
                                            <div key={idx} className="flex justify-between bg-white px-3 py-1.5 rounded-lg border border-gray-100">
                                              <span>Session {idx + 1}:</span>
                                              <span className="font-mono text-[10px]">
                                                {formatBreakTime(b.start)} - {b.end ? formatBreakTime(b.end) : <span className="text-amber-500 font-bold uppercase tracking-widest text-[8px] animate-pulse">In Progress</span>}
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <div className="text-center text-[10px] text-gray-450 uppercase tracking-widest py-2">
                                          No breaks taken today
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-gray-200 overflow-hidden">
                   <h3 className="text-xl font-black text-primary tracking-tight mb-8">Recent Tasks</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50/50">
                        <tr>
                          <th className="p-4 text-[10px] font-black text-secondary uppercase tracking-widest">Task</th>
                           <th className="p-4 text-[10px] font-black text-secondary uppercase tracking-widest text-right">Assigned Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {tasks.slice(0, 5).map((t) => (
                          <tr key={t._id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="p-4">
                              <div className="text-sm font-black text-primary">{t.assignedTo?.name}</div>
                              <div className="text-[9px] font-bold text-secondary/40 uppercase tracking-widest">{t.status}</div>
                            </td>
                             <td className="p-4 text-right text-[10px] font-black text-secondary/40 uppercase tracking-widest">
                              {new Date(t.assignedAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {active === "Attendance" && <LeaderAttendance />}
          {active === "My Teams" && <LeaderTeamsPage isLeader={true} />}
          {active === "My Projects" && <LeaderProjectsPage isLeader={true} />}
          {active === "Leaves" && <LeaderLeavesPage />}
          {active === "Assign Task" && <AssignTaskPage />}
          {active === "Hiring Requirements" && <VacancyManagementPage />}
          {active === "Profile" && <Profile />}
          {active === "Contact Employee" && <ContactEmployeeLeaderPage />}
        </div>
      </main>
    </div>
  );
};

export default LeaderDashboard;
