import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Calendar, CheckCircle, Clock, FolderOpen, AlertCircle, ArrowUpRight, TrendingUp, Target, Layout, User, Layers, FileText, CheckSquare, Phone } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import EmployeeSidebar from "./EmployeeSidebar";
import Attendance from "./Attendance";
import Leaves from "./Leaves";
import Teams from "./Teams";
import Tasks from "./Tasks";
import Projects from "./Projects";
import Profile from "./Profile";
import ContactEmployeePage from "./ContactEmployee";

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
      // Ignore JSON parse errors, use text as-is
    }
    throw new Error((text && text.message) || res.statusText || "API error");
  }
  const t = await res.text();
  return t ? JSON.parse(t) : null;
};

const apiGet = (p) => fetchJson(p);

const TABS = [
  { id: "Dashboard", label: "Dashboard", icon: Layout },
  { id: "Profile", label: "Profile", icon: User },
  { id: "Attendance", label: "Attendance", icon: Calendar },
  { id: "My Tasks", label: "My Tasks", icon: CheckSquare },
  { id: "My Teams", label: "My Teams", icon: Layers },
  { id: "My Projects", label: "My Projects", icon: FolderOpen },
  { id: "Contact Employee", label: "Contact Employee", icon: Phone },
  { id: "Apply Leave", label: "Apply Leave", icon: FileText },
];

const EmployeeDashboard = () => {
  const [active, setActive] = useState("Dashboard");
  const [summary, setSummary] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [leaveAllowance, setLeaveAllowance] = useState(12);
  const [leavesRemaining, setLeavesRemaining] = useState(12);
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [profileVerified, setProfileVerified] = useState(true);

  useEffect(() => {
    if (active === "Dashboard") {
      fetchAllData();
      fetchProfileStatus();
    }
  }, [active]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [summaryRes, leavesRes, tasksRes, projectsRes] = await Promise.all([
        apiGet("/employee/dashboard").catch(() => null),
        apiGet("/employee/leave/my").catch(() => ({ leaves: [], leaveAllowance: 12 })),
        apiGet("/employee/tasks").catch(() => []),
        apiGet("/employee/projects").catch(() => []),
      ]);
      setSummary(summaryRes);
      const myLeaves = leavesRes?.leaves || leavesRes || [];
      setLeaves(myLeaves);
      const allowance = leavesRes?.leaveAllowance ?? 12;
      setLeaveAllowance(allowance);

      try {
        const now = new Date();
        const yearStart = new Date(now.getFullYear(), 0, 1);
        const yearEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
        let used = 0;
        for (const l of myLeaves) {
          if (!l) continue;
          const status = (l.status || "").toString().toLowerCase();
          if (status !== "approved") continue;
          const from = l.fromDate ? new Date(l.fromDate) : null;
          const to = l.toDate ? new Date(l.toDate) : null;
          if (!from || !to || isNaN(from) || isNaN(to)) continue;
          const start = from < yearStart ? yearStart : from;
          const end = to > yearEnd ? yearEnd : to;
          if (end < start) continue;
          used += Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
        }
        setLeavesRemaining(Math.max(0, allowance - used));
      } catch {
        setLeavesRemaining(allowance);
      }
      setTasks(tasksRes || []);
      setProjects(projectsRes || []);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfileStatus = async () => {
    try {
      const response = await apiGet("/employee/profile");
      setProfileVerified(response?.profileVerified || false);
    } catch (error) {
      console.error("Error fetching profile status:", error);
      setProfileVerified(false);
    }
  };

  const leavesTaken = leaves.filter(l => l.status === 'Approved').reduce((sum, l) => sum + (l.totalDays || 0), 0);
  const pendingLeaves = leaves.filter(l => l.status === 'Pending').length;
  const tasksCompleted = tasks.filter(t => t.status === 'Completed').length;
  const projectsAssigned = projects.length;

  const taskStatusData = [
    { name: 'Pending', value: tasks.filter(t => t.status === 'Pending').length },
    { name: 'In Progress', value: tasks.filter(t => t.status === 'In Progress').length },
    { name: 'Completed', value: tasks.filter(t => t.status === 'Completed').length },
  ];

  const leaveStatusData = [
    { name: 'Pending', value: pendingLeaves },
    { name: 'Approved', value: leaves.filter(l => l.status === 'Approved').length },
    { name: 'Rejected', value: leaves.filter(l => l.status === 'Rejected').length },
  ];

  const COLORS = ['#12637E', '#1A9DC2', '#242736'];

  return (
    <div className="min-h-screen flex bg-gray-50/50">
      <EmployeeSidebar tabs={TABS} active={active} onChange={setActive} />

      <main className="flex-1 md:ml-60 min-h-screen overflow-x-hidden transition-all duration-300">
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-12">
        {active === "Dashboard" && (
          <div className="animate-fadeIn space-y-12">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 animate-slideUp">
              <div>
                <h2 className="text-5xl font-black mb-3 text-primary tracking-tighter leading-tight">
                  Welcome back, <span className="text-secondary">{summary?.employeeName || "Explorer"}</span>!
                </h2>
                <p className="text-lg font-semibold text-secondary/70 flex items-center gap-2">
                  <Calendar size={18} />
                  {format(new Date(), 'EEEE, MMMM do yyyy')}
                </p>
              </div>
              {!profileVerified && (
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex items-center gap-2 bg-amber-50 text-amber-600 px-4 py-2.5 rounded-xl text-[10px] font-black border border-amber-200 uppercase tracking-widest shadow-sm"
                >
                  <AlertCircle size={14} /> Verification Pending
                </motion.div>
              )}
            </header>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { label: "Leaves Utilized", val: leavesTaken, icon: <Calendar />, color: "bg-cyan-50 text-[#12637E]", desc: "Approved days" },
                { label: "Pending Requests", val: pendingLeaves, icon: <Clock />, color: "bg-amber-50 text-amber-600", desc: "Awaiting review" },
                { label: "Tasks Finished", val: tasksCompleted, icon: <CheckCircle />, color: "bg-green-50 text-green-600", desc: "Milestones met" },
                { label: "Active Projects", val: projectsAssigned, icon: <FolderOpen />, color: "bg-blue-50 text-[#1A9DC2]", desc: "Live assignments" },
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
                    <div className="text-[10px] text-secondary/60 mt-1 font-medium">{stat.desc}</div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Visualization Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-gray-200">
                <h3 className="text-xl font-black text-primary tracking-tight mb-8 flex items-center gap-3">
                  <Target size={20} className="text-secondary" /> Task Distribution
                </h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={taskStatusData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#12637E' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#12637E' }} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: '900' }}
                        cursor={{ fill: 'rgba(18, 99, 126, 0.05)' }}
                      />
                      <Bar dataKey="value" fill="#12637E" radius={[10, 10, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-gray-200">
                <h3 className="text-xl font-black text-primary tracking-tight mb-8 flex items-center gap-3">
                  <Calendar size={20} className="text-secondary" /> Leave Allocation
                </h3>
                <div className="h-[300px] w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={leaveStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {leaveStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: '900' }} />
                      <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Live Feed Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {/* Task Feed */}
              <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-gray-200 overflow-hidden flex flex-col justify-between">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-black text-primary tracking-tight">Active Tasks</h3>
                  <button onClick={() => setActive("My Tasks")} className="text-[10px] font-black text-primary uppercase tracking-widest hover:translate-x-1 transition-transform flex items-center gap-1">
                    Full Log <ArrowUpRight size={14} />
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50/50">
                      <tr>
                        <th className="p-4 text-[10px] font-black text-secondary uppercase tracking-widest">Project</th>
                        <th className="p-4 text-[10px] font-black text-secondary uppercase tracking-widest hidden sm:table-cell">Initiator</th>
                        <th className="p-4 text-[10px] font-black text-secondary uppercase tracking-widest text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {tasks.length === 0 ? (
                        <tr><td colSpan="3" className="p-10 text-center text-secondary font-medium italic">No active tasks</td></tr>
                      ) : (
                        tasks.slice(0, 5).map((t) => (
                          <tr key={t._id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="p-4 font-bold text-primary text-sm">{t.project?.name || "System Task"}</td>
                            <td className="p-4 hidden sm:table-cell text-secondary font-medium text-xs">{t.assignedBy?.name || "Admin"}</td>
                            <td className="p-4 text-right">
                              <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                                t.status === "Completed" ? "bg-green-50 text-green-600" :
                                t.status === "In Progress" ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-500"
                              }`}>
                                {t.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Leave Feed */}
              <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-gray-200 overflow-hidden flex flex-col justify-between">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-black text-primary tracking-tight">Recent Leave Logs</h3>
                  <button onClick={() => setActive("Apply Leave")} className="text-[10px] font-black text-primary uppercase tracking-widest hover:translate-x-1 transition-transform flex items-center gap-1">
                    Manage <ArrowUpRight size={14} />
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50/50">
                      <tr>
                        <th className="p-4 text-[10px] font-black text-secondary uppercase tracking-widest">Commencement</th>
                        <th className="p-4 text-[10px] font-black text-secondary uppercase tracking-widest">Duration</th>
                        <th className="p-4 text-[10px] font-black text-secondary uppercase tracking-widest text-right">Authorization</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {leaves.length === 0 ? (
                        <tr><td colSpan="3" className="p-10 text-center text-secondary font-medium italic">No leave history detected</td></tr>
                      ) : (
                        leaves.slice(0, 5).map((l) => (
                          <tr key={l._id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="p-4 font-bold text-primary text-sm">{new Date(l.fromDate).toLocaleDateString('en-GB')}</td>
                            <td className="p-4 text-secondary font-black text-xs">{l.totalDays ?? 0} DAYS</td>
                            <td className="p-4 text-right">
                              <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                                l.status === "Approved" ? "bg-green-50 text-green-600" :
                                l.status === "Pending" ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-500"
                              }`}>
                                {l.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {active === "Attendance" && <Attendance />}
        {active === "Apply Leave" && <Leaves />}
        {active === "My Teams" && <Teams />}
        {active === "My Tasks" && <Tasks />}
        {active === "My Projects" && <Projects />}
        {active === "Profile" && <Profile />}
        {active === "Contact Employee" && <ContactEmployeePage />}
        </div>
      </main>
    </div>
  );
};

export default EmployeeDashboard;
