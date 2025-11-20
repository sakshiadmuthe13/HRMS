import React, { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import LeaderSidebar from "./LeaderSidebar";
import LeaderAttendancePage from "./Attendance";
import LeaderTeamsPage from "./Teams";
import LeaderProjectsPage from "./Projects";
import LeaderLeavesPage from "./Leave";
import AssignTaskPage from "./Task";
import Profile from "./Profile";
import ContactEmployeePage from "./ContactEmployee";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

// Helper function to handle fetch with token
const fetchJson = async (path, opts = {}) => {
  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");
  const headers = { ...(opts.headers || {}) };
  if (token && !headers.Authorization)
    headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    ...opts,
    headers,
  });
  if (!res.ok) {
    const text = await res.text();
    try {
      throw new Error(JSON.parse(text).message || "API Error");
    } catch {
      throw new Error("API Error");
    }
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
};

const TABS = [
  "Dashboard",
  "Profile",
  "Attendance",
  "Leaves",
  "Assign Task",
  "My Teams",
  "My Projects",
  "Contact Employee",
];

const LeaderDashboard = () => {
  const [active, setActive] = useState("Dashboard");
  const [summary, setSummary] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [teamAttendance, setTeamAttendance] = useState([]);
  const [leaveAllowance, setLeaveAllowance] = useState(12);
  const [leavesRemaining, setLeavesRemaining] = useState(12);
  const [taskFilter, setTaskFilter] = useState("All");
  const [profileVerified, setProfileVerified] = useState(true);

  // ✅ All functions defined inside component (before useEffect)
  const fetchSummary = async () => {
    try {
      const res = await fetchJson("/leader/dashboard");
      setSummary(res);
    } catch (err) {
      console.error("Error fetching leader dashboard summary:", err);
    }
  };

  const fetchTasks = async () => {
    try {
      const res = await fetchJson("/leader/my-assigned-tasks");
      setTasks(res || []);
    } catch (err) {
      console.error("Error fetching tasks:", err);
    }
  };

  const fetchTeamAttendance = async () => {
    try {
      const res = await fetchJson("/leader/team-attendance");
      setTeamAttendance(res || []);
    } catch (err) {
      console.error("Error fetching team attendance:", err);
    }
  };

  const fetchProfileStatus = async () => {
    try {
      const res = await fetchJson("/leader/profile");
      setProfileVerified(res?.profileVerified || false);
    } catch (err) {
      console.error("Error fetching profile status:", err);
    }
  };

  // ✅ useEffect runs when "active" changes
  useEffect(() => {
    if (active === "Dashboard") {
      fetchSummary();
      fetchTasks();
      fetchTeamAttendance();
      fetchProfileStatus();
    }
  }, [active]);

  // Prepare data for Attendance Pie Chart
  const getAttendanceData = () => {
    const statusCount = { Present: 0, Leave: 0, Absent: 0, "Over-time": 0 };
    teamAttendance.forEach((member) => {
      const raw = member?.status;
      const ci = member?.attendance?.checkIn;
      const co = member?.attendance?.checkOut;
      const label = raw === "Over-time" || (raw === "Holiday" && (ci || co)) ? "Over-time" : raw;
      if (label in statusCount) {
        statusCount[label]++;
      } else {
        statusCount.Absent++;
      }
    });
    return [
      { name: "Present", value: statusCount.Present, color: "#10B981" },
      { name: "Leave", value: statusCount.Leave, color: "#3B82F6" },
      { name: "Over-time", value: statusCount["Over-time"], color: "#EC4899" },
      { name: "Absent", value: statusCount.Absent, color: "#EF4444" },
    ];
  };

  // Prepare data for Task Status Bar Chart
  const getTaskData = () => {
    const statusCount = { Completed: 0, "In Progress": 0, Pending: 0 };
    tasks.forEach((task) => {
      if (task.status in statusCount) {
        statusCount[task.status]++;
      }
    });
    return [
      { status: "Completed", count: statusCount.Completed },
      { status: "In Progress", count: statusCount["In Progress"] },
      { status: "Pending", count: statusCount.Pending },
    ];
  };

  return (
    <div className="min-h-screen flex bg-[var(--color-surface)] text-[var(--color-text-primary)]">
      <LeaderSidebar tabs={TABS} active={active} onChange={setActive} />

      <main className="flex-1 px-2 sm:px-4 md:px-10 py-4 sm:py-6 md:ml-64 h-screen overflow-y-auto pt-16 md:pt-6">
        {active === "Dashboard" && (
          <section>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold mb-2 text-[var(--color-primary)]">
                  Welcome back, {summary?.leaderName || "Leader"}!
                </h2>
                <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">
                  Team's performance overview
                </p>
              </div>
              {!profileVerified && (
                <div className="w-full md:w-auto bg-yellow-900/30 text-yellow-400 border border-yellow-800 px-2 sm:px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium">
                  ⚠️ Profile Unverified - Complete verification
                </div>
              )}
            </div>

            {/* Dashboard Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2 sm:gap-3 md:gap-5">
              <div className="p-3 sm:p-5 mb-2 card-glow">
                <div className="text-xs sm:text-sm text-[var(--color-text-secondary)]">
                  Total Team Members
                </div>
                <div className="text-3xl sm:text-4xl font-bold mt-2">
                  {summary?.teamMembers ?? "--"}
                </div>
                <div className="text-xs text-[var(--color-text-secondary)] mt-1">
                  Members under supervision
                </div>
              </div>

              <div className="p-3 sm:p-5 card-glow">
                <div className="text-xs sm:text-sm text-[var(--color-text-secondary)]">
                  Tasks Assigned
                </div>
                <div className="text-3xl sm:text-4xl font-bold mt-2">
                  {summary?.tasksAssigned ?? "--"}
                </div>
                <div className="text-xs text-[var(--color-text-secondary)] mt-1">
                  Tasks assigned
                </div>
              </div>

              <div className="p-3 sm:p-5 card-glow">
                <div className="text-xs sm:text-sm text-[var(--color-text-secondary)]">
                  Projects under Leader
                </div>
                <div className="text-3xl sm:text-4xl font-bold mt-2">
                  {summary?.projectsUnderLeader ?? "--"}
                </div>
                <div className="text-xs text-[var(--color-text-secondary)] mt-1">
                  Projects leading
                </div>
              </div>

              <div className="p-3 sm:p-5 card-glow">
                <div className="text-xs sm:text-sm text-[var(--color-text-secondary)]">Leaves Remaining</div>
                <div className="text-3xl sm:text-4xl font-bold mt-2">{leavesRemaining ?? "--"}</div>
                <div className="text-xs text-[var(--color-text-secondary)] mt-1">
                  Paid days left (of {leaveAllowance})
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="mt-3 sm:mt-4 grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
              {/* Attendance Pie Chart */}
              <div className="min-h-[300px] sm:min-h-[350px] md:min-h-[400px]">
                <h3 className="text-sm sm:text-base md:text-lg font-medium mb-4">Attendance Overview</h3>
                <div className="card-glow rounded-lg bg-[var(--color-surface)] p-2 sm:p-3 md:p-4">
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={getAttendanceData()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {getAttendanceData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Task Status Bar Chart */}
              <div className="min-h-[300px] sm:min-h-[350px] md:min-h-[400px]">
                <h3 className="text-sm sm:text-base md:text-lg font-medium mb-4">Task Status Overview</h3>
                <div className="card-glow rounded-lg bg-[var(--color-surface)] p-2 sm:p-3 md:p-4">
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={getTaskData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="status" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#A855F7" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Task Overview and Team Members Attendance */}
            <div className="mt-3 sm:mt-4 md:mt-2 grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6 items-start">
              {/* Team Members Attendance */}
              <div className="max-h-[350px] md:max-h-[400px] overflow-y-auto">
                <h3 className="text-sm sm:text-base md:text-lg font-medium mb-4">Team Members Attendance</h3>
                <div className="card-glow overflow-x-auto max-h-64 overflow-y-auto rounded-lg bg-[var(--color-surface)] p-2 sm:p-3 md:p-4">
                  {teamAttendance.length > 0 ? (
                    <table className="w-full min-w-[320px] text-left text-xs md:text-sm">
                      <thead className="bg-[rgba(167,86,250,0.1)] text-gray-400 text-xs md:text-sm sticky top-0">
                        <tr>
                          <th className="p-1 sm:p-2 md:p-4">Name</th>
                          <th className="p-1 sm:p-2 md:p-4">Status</th>
                          <th className="p-1 sm:p-2 md:p-4 hidden md:table-cell">Check In</th>
                          <th className="p-1 sm:p-2 md:p-4 hidden md:table-cell">Check Out</th>
                        </tr>
                      </thead>
                      <tbody>
                        {teamAttendance.map((member) => (
                          <tr
                            key={member._id}
                            className="border-t border-[rgba(255,255,255,0.1)] hover:bg-[rgba(167,86,250,0.05)] transition-all"
                          >
                            <td className="p-1 sm:p-2 md:p-4 font-medium text-xs sm:text-sm">{member.name}</td>
                            <td className="p-1 sm:p-2 md:p-4">
                              <span
                                className={`px-1 sm:px-2 py-0.5 md:py-1 rounded text-xs md:text-sm ${
                                  member.status === "Present"
                                    ? "bg-green-600/30 text-green-400"
                                    : member.status === "Leave"
                                    ? "bg-blue-600/30 text-blue-400"
                                    : member.status === "Over-time"
                                    ? "bg-pink-600/30 text-pink-400"
                                    : "bg-red-600/30 text-red-400"
                                }`}
                              >
                                {member.status}
                              </span>
                            </td>
                            <td className="p-1 sm:p-2 md:p-4 text-xs hidden md:table-cell">
                              {member.attendance?.checkIn
                                ? new Date(member.attendance.checkIn).toLocaleTimeString()
                                : "-"}
                            </td>
                            <td className="p-1 sm:p-2 md:p-4 text-xs hidden md:table-cell">
                              {member.attendance?.checkOut
                                ? new Date(member.attendance.checkOut).toLocaleTimeString()
                                : "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-center py-6 text-xs sm:text-sm text-gray-400">
                      No team members found.
                    </p>
                  )}
                </div>
              </div>

              {/* Task Overview */}
              <div className="max-h-[400px] overflow-y-auto">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                  <h3 className="text-sm sm:text-base md:text-lg font-medium">Task Overview</h3>
                  <select
                    value={taskFilter}
                    onChange={(e) => setTaskFilter(e.target.value)}
                    className="px-2 sm:px-3 py-1 rounded text-xs sm:text-sm bg-gray-700 text-gray-300 border border-gray-600 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  >
                    <option value="All">All</option>
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
                <div className="card-glow overflow-x-auto max-h-64 overflow-y-auto rounded-lg bg-[var(--color-surface)] p-2 sm:p-3 md:p-4">
                  {tasks.filter((task) => taskFilter === "All" || task.status === taskFilter).length > 0 ? (
                    <table className="w-full min-w-[350px] text-left text-xs md:text-sm">
                      <thead className="bg-[rgba(167,86,250,0.1)] text-gray-400 text-xs md:text-sm">
                        <tr>
                          <th className="p-1 sm:p-2 md:p-4">Assigned To</th>
                          <th className="p-1 sm:p-2 md:p-4">Status</th>
                          <th className="p-1 sm:p-2 md:p-4">Assigned On</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tasks
                          .filter((task) => taskFilter === "All" || task.status === taskFilter)
                          .map((task) => (
                            <tr
                              key={task._id}
                              className="border-t border-[rgba(255,255,255,0.1)] hover:bg-[rgba(167,86,250,0.05)] transition-all"
                            >
                              <td className="p-1 sm:p-2 md:p-4 text-xs sm:text-sm">
                                {task.assignedTo?.name || "-"}
                              </td>
                              <td className="p-1 sm:p-2 md:p-4">
                                <span
                                  className={`px-1 sm:px-2 py-0.5 sm:py-1 rounded text-xs md:text-sm ${
                                    task.status === "Completed"
                                      ? "bg-green-600/30 text-green-400"
                                      : task.status === "In Progress"
                                      ? "bg-yellow-600/30 text-yellow-400"
                                      : "bg-red-600/30 text-red-400"
                                  }`}
                                >
                                  {task.status}
                                </span>
                              </td>
                              <td className="p-1 sm:p-2 md:p-4 text-xs">
                                {new Date(task.assignedAt).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-center py-6 text-xs sm:text-sm text-gray-400">
                      No {taskFilter === "All" ? "" : `${taskFilter.toLowerCase()} `}tasks found.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {active === "Attendance" && <LeaderAttendancePage />}
        {active === "My Teams" && <LeaderTeamsPage />}
        {active === "My Projects" && <LeaderProjectsPage />}
        {active === "Leaves" && <LeaderLeavesPage />}
        {active === "Assign Task" && <AssignTaskPage />}
        {active === "Profile" && <Profile />}
        {active === "Contact Employee" && <ContactEmployeePage />}
      </main>
    </div>
  );
};

export default LeaderDashboard;
