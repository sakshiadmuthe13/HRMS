import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { Calendar, CheckCircle, Clock, FolderOpen } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";
import EmployeeSidebar from "./EmployeeSidebar";
import Attendance from "./Attendance";
import Leaves from "./Leaves";
import Teams from "./Teams";
import Tasks from "./Tasks";
import Projects from "./Projects";
import Profile from "./Profile";
import ContactEmployeePage from "./ContactEmployee";

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

const TABS = ["Dashboard", "Profile", "Attendance", "My Tasks", "My Teams", "My Projects", "Contact Employee", "Apply Leave"];

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
      // Handle the new response format { leaves, leaveAllowance }
      const myLeaves = leavesRes?.leaves || leavesRes || [];
      setLeaves(myLeaves);
      const allowance = leavesRes?.leaveAllowance ?? 12;
      setLeaveAllowance(allowance);

      // compute approved days this calendar year (bound to year)
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

  const COLORS = ['#FFBB28', '#00C49F', '#FF8042'];

  return (
    <div className="min-h-screen flex bg-[var(--color-surface)] text-[var(--color-text-primary)]">
      <EmployeeSidebar tabs={TABS} active={active} onChange={setActive} />

      <main className="flex-1 px-4 md:px-10 py-6 md:ml-64 h-screen overflow-y-auto pt-16 md:pt-6">
        {active === "Dashboard" && (
          <section>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-4 mb-4 md:mb-8">
              <div>
                <h2 className="text-xl md:text-3xl font-extrabold mb-1 md:mb-2 text-[var(--color-primary)]">Welcome back, {summary?.employeeName}!</h2>
                <p className="text-xs md:text-sm text-[var(--color-text-secondary)]">Your quick overview</p>
              </div>
              {!profileVerified && (
                <div className="w-full md:w-auto bg-yellow-900/30 text-yellow-400 border border-yellow-800 px-2 md:px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap">
                  ⚠️ Profile Unverified
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-6">
              <div className="p-4 md:p-6 card-glow shadow-lg rounded-xl transition-transform hover:scale-105">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs md:text-sm text-[var(--color-text-secondary)]">Leaves Taken</div>
                    <div className="text-3xl md:text-4xl font-bold mt-2">{loading ? "--" : leavesTaken}</div>
                    <div className="text-xs text-[var(--color-text-secondary)] mt-1">Approved leave days</div>
                  </div>
                  <Calendar size={32} className="text-green-500 flex-shrink-0" />
                </div>
              </div>

              <div className="p-4 md:p-6 card-glow shadow-lg rounded-xl transition-transform hover:scale-105">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs md:text-sm text-[var(--color-text-secondary)]">Pending Leaves</div>
                    <div className="text-3xl md:text-4xl font-bold mt-2">{loading ? "--" : pendingLeaves}</div>
                    <div className="text-xs text-[var(--color-text-secondary)] mt-1">Awaiting approval</div>
                  </div>
                  <Clock size={32} className="text-yellow-500 flex-shrink-0" />
                </div>
              </div>

              <div className="p-4 md:p-6 card-glow shadow-lg rounded-xl transition-transform hover:scale-105">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs md:text-sm text-[var(--color-text-secondary)]">Tasks Completed</div>
                    <div className="text-3xl md:text-4xl font-bold mt-2">{loading ? "--" : tasksCompleted}</div>
                    <div className="text-xs text-[var(--color-text-secondary)] mt-1">Finished tasks</div>
                  </div>
                  <CheckCircle size={32} className="text-blue-500 flex-shrink-0" />
                </div>
              </div>

              <div className="p-4 md:p-6 card-glow shadow-lg rounded-xl transition-transform hover:scale-105">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs md:text-sm text-[var(--color-text-secondary)]">Projects Assigned</div>
                    <div className="text-3xl md:text-4xl font-bold mt-2">{loading ? "--" : projectsAssigned}</div>
                    <div className="text-xs text-[var(--color-text-secondary)] mt-1">Active projects</div>
                  </div>
                  <FolderOpen size={32} className="text-purple-500 flex-shrink-0" />
                </div>
              </div>
            </div>

            {/* Visualizations */}
            <div className="mt-4 md:mt-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-6">
                <div>
                  <h3 className="text-base md:text-lg font-bold mb-3 md:mb-4">Tasks by Status</h3>
                  <div className="card-glow bg-[var(--color-surface)] p-3 md:p-6 rounded-xl shadow-lg overflow-x-auto">
                    <BarChart width={Math.min(280, window.innerWidth - 40)} height={200} data={taskStatusData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#8884d8" />
                    </BarChart>
                  </div>
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-bold mb-3 md:mb-4">Leaves by Status</h3>
                  <div className="card-glow bg-[var(--color-surface)] p-3 md:p-6 rounded-xl shadow-lg overflow-x-auto">
                    <PieChart width={Math.min(280, window.innerWidth - 40)} height={200}>
                      <Pie
                        data={leaveStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                        outerRadius={50}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {leaveStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </div>
                </div>
              </div>
            </div>

            {/* Tables Grid */}
            <div className="mt-6 md:mt-10 grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-8">
              {/* My Tasks Table */}
              <div>
                <h3 className="text-base md:text-lg font-bold mb-3 md:mb-4">My Tasks</h3>
                <div className="card-glow bg-[var(--color-surface)] p-3 md:p-6 rounded-xl shadow-lg">
                  <div className="overflow-x-auto max-h-64 overflow-y-auto rounded-lg border border-gray-700">
                    <table className="w-full table-auto text-left border-collapse text-xs md:text-sm">
                    <thead className="bg-gray-800 sticky top-0">
                      <tr>
                        <th className="px-2 md:px-4 py-2 md:py-3 text-left font-semibold text-gray-300">Project</th>
                        <th className="px-2 md:px-4 py-2 md:py-3 text-left font-semibold text-gray-300 hidden sm:table-cell">Assigned By</th>
                        <th className="px-2 md:px-4 py-2 md:py-3 text-left font-semibold text-gray-300">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tasks.length === 0 ? (
                        <tr>
                          <td colSpan="3" className="py-4 text-center text-xs md:text-sm text-gray-400">No tasks assigned</td>
                        </tr>
                      ) : (
                        tasks.map((t) => (
                          <tr key={t._id} className="border-t border-gray-700 hover:bg-gray-800 transition-colors duration-200">
                            <td className="py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm truncate">{t.project?.name || "-"}</td>
                            <td className="py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm hidden sm:table-cell truncate">{t.assignedBy?.name || "-"}</td>
                            <td className="py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm">
                              <span className={`px-2 md:px-3 py-1 rounded-full text-xs font-medium inline-block ${
                                t.status === "Completed"
                                  ? "bg-green-500 text-white"
                                  : t.status === "In Progress"
                                  ? "bg-orange-500 text-white"
                                  : "bg-red-500 text-white"
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
              </div>

              {/* My Leaves Table */}
              <div>
                <h3 className="text-base md:text-lg font-bold mb-3 md:mb-4">My Leaves</h3>
                <div className="card-glow bg-[var(--color-surface)] p-3 md:p-6 rounded-xl shadow-lg">
                  <div className="overflow-x-auto max-h-64 overflow-y-auto rounded-lg border border-gray-700">
                    <table className="w-full table-auto text-left border-collapse text-xs md:text-sm">
                    <thead className="bg-gray-800 sticky top-0">
                      <tr>
                        <th className="px-2 md:px-4 py-2 md:py-3 text-left font-semibold text-gray-300">From</th>
                        <th className="px-2 md:px-4 py-2 md:py-3 text-left font-semibold text-gray-300">Days</th>
                        <th className="px-2 md:px-4 py-2 md:py-3 text-left font-semibold text-gray-300">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaves.length === 0 ? (
                        <tr>
                          <td colSpan="3" className="py-4 text-center text-xs md:text-sm text-gray-400">No leaves applied yet</td>
                        </tr>
                      ) : (
                        leaves.map((l) => (
                          <tr key={l._id} className="border-t border-gray-700 hover:bg-gray-800 transition-colors duration-200">
                            <td className="py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm">{new Date(l.fromDate).toLocaleDateString()}</td>
                            <td className="py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm">{l.totalDays ?? 0}</td>
                            <td className="py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm">
                              <span className={`px-2 md:px-3 py-1 rounded-full text-xs font-medium inline-block ${
                                l.status === "Approved"
                                  ? "bg-green-500 text-white"
                                  : l.status === "Pending"
                                  ? "bg-orange-500 text-white"
                                  : "bg-red-500 text-white"
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
          </section>
        )}

        {active === "Attendance" && <Attendance />}
        {active === "Apply Leave" && <Leaves />}
        {active === "My Teams" && <Teams />}
        {active === "My Tasks" && <Tasks />}
        {active === "My Projects" && <Projects />}
        {active === "Profile" && <Profile />}
        {active === "Contact Employee" && <ContactEmployeePage />}
      </main>
    </div>
  );
};

export default EmployeeDashboard;
