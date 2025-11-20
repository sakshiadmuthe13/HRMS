import React, { useEffect, useState } from "react";
import AdminSidebar from "./AdminSidebar";
import EmployeesPage from "./EmployeesPage";
import LeadersPage from "./LeadersPage";
import AdminsPage from "./AdminsPage";
import AttendancePage from "./AttendancePage";
import AdminHolidayCalendar from "./AdminHolidayCalendar";
import LeavesPage from "./LeavesPage";
import SalaryPage from "./SalaryPage";
import ProfileVerificationPage from "./ProfileVerificationPage";
import TeamsPage from "./TeamsPage";
import ProjectsPage from "./ProjectsPage";
import ReportsPage from "./ReportsPage";
import { Users, UserCheck, FileText, Briefcase, Calendar, AlertTriangle } from "lucide-react";
import { differenceInDays } from "date-fns";
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
  "Admins",
  "Attendance",
  "Holiday Calendar",
  "Leaves",
  "Salary",
  "Teams",
  "Projects",
  "Profile Verification",
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

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

  return (
    <div className="flex bg-[var(--color-surface)] text-[var(--color-text-primary)] min-h-screen">
      <AdminSidebar tabs={TABS} active={active} onChange={setActive} />

      <main className="flex-1 px-3 sm:px-6 md:px-10 py-4 sm:py-6 md:ml-64 overflow-y-auto pt-16 md:pt-6 w-full">
        {active === "Dashboard" && (
          <section className="flex flex-col h-full">
            {/* Header */}
            <div className="mb-6">
              <h2 className="text-3xl font-extrabold pt-3 mb-1 text-[var(--color-primary)]">
                Welcome back, {userName || "Admin"}!
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Overview of our organization at a glance
              </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-5">
              <div className="p-5 card-glow">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-[var(--color-text-secondary)]">
                      Total Employees
                    </div>
                    <div className="text-4xl font-bold mt-2">
                      {summary?.totalEmployees ?? "--"}
                    </div>
                  </div>
                  <Users size={40} className="text-[var(--color-primary)]" />
                </div>
                <div className="text-xs text-[var(--color-text-secondary)] mt-1">
                  Active employees in the system
                </div>
              </div>

              <div className="p-5 card-glow">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-[var(--color-text-secondary)]">
                      Total Leaders
                    </div>
                    <div className="text-4xl font-bold mt-2">
                      {summary?.totalLeaders ?? "--"}
                    </div>
                  </div>
                  <UserCheck
                    size={40}
                    className="text-[var(--color-primary)]"
                  />
                </div>
                <div className="text-xs text-[var(--color-text-secondary)] mt-1">
                  Team leaders
                </div>
              </div>

              
              <div className="p-5 card-glow">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-[var(--color-text-secondary)]">
                      Today's Present
                    </div>
                    <div className="text-4xl font-bold mt-2">
                      {todaysPresent}
                    </div>
                  </div>
                  <Calendar size={40} className="text-[var(--color-primary)]" />
                </div>
                <div className="text-xs text-[var(--color-text-secondary)] mt-1">
                  Employees + Leaders Present today
                </div>
              </div>

              <div className="p-5 card-glow">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-[var(--color-text-secondary)]">
                      Pending Leaves
                    </div>
                    <div className="text-4xl font-bold mt-2">
                      {pendingLeaves}
                    </div>
                  </div>
                  <FileText size={40} className="text-[var(--color-primary)]" />
                </div>
                <div className="text-xs text-[var(--color-text-secondary)] mt-1">
                  Open leave requests
                </div>
              </div>

              <div className="p-5 card-glow">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-[var(--color-text-secondary)]">
                      Pending Profiles
                    </div>
                    <div className="text-4xl font-bold mt-2">
                      {pendingProfiles}
                    </div>
                  </div>
                  <FileText size={40} className="text-[var(--color-primary)]" />
                </div>
                <div className="text-xs text-[var(--color-text-secondary)] mt-1">
                  Unverified employee profiles
                </div>
              </div>

              <div className="p-5 card-glow">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-[var(--color-text-secondary)]">
                      Delayed Tasks
                    </div>
                    <div className="text-4xl font-bold mt-2">
                      {delayedTasks.length}
                    </div>
                  </div>
                  <AlertTriangle size={40} className="text-red-500" />
                </div>
                <div className="text-xs text-[var(--color-text-secondary)] mt-1">
                  Tasks completed after deadline
                </div>
              </div>
            </div>

            {/* Project Chart & Leave Requests */}
            <div className="flex-1 mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8 h-full">
              {/* Project Pie Chart */}
              <div className="card-glow p-5 h-full">
                <h3 className="text-xl font-bold mb-4">Project Summary</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={projectStatusData()}
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
                      {projectStatusData().map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Leave Requests Table */}
              <div className="card-glow p-4 md:p-5 h-full flex flex-col">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4">
                  <h3 className="text-lg md:text-xl font-bold">Leave Requests</h3>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full md:w-auto p-2 border border-gray-600 rounded bg-gray-800 text-white text-sm"
                  >
                    <option value="All">All</option>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                <div className="overflow-x-auto overflow-y-auto max-h-70 rounded border border-gray-700">
                  <table className="min-w-full table-auto border-collapse text-xs md:text-sm">
                    <thead className="bg-gray-900 sticky top-0">
                      <tr>
                        <th className="px-2 md:px-6 py-2 md:py-3 text-left font-semibold text-[var(--color-text-secondary)]">
                          Name
                        </th>
                        <th className="px-2 md:px-6 py-2 md:py-3 text-left font-semibold text-[var(--color-text-secondary)]">
                          Type
                        </th>
                        <th className="px-2 md:px-6 py-2 md:py-3 text-left font-semibold text-[var(--color-text-secondary)]">
                          Days
                        </th>
                        <th className="px-2 md:px-6 py-2 md:py-3 text-left font-semibold text-[var(--color-text-secondary)]">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {allLeaves
                        .filter(
                          (l) =>
                            filterStatus === "All" || l.status === filterStatus
                        )
                        .map((leave) => {
                          const days =
                            differenceInDays(
                              new Date(leave.toDate),
                              new Date(leave.fromDate)
                            ) + 1;
                          const statusBadge =
                            {
                              Approved: "bg-green-600 text-white",
                              Pending: "bg-yellow-600 text-black",
                              Rejected: "bg-red-600 text-white",
                            }[leave.status] || "bg-gray-600 text-white";

                          return (
                            <tr
                              key={leave._id}
                              className="border-b border-gray-700 hover:bg-gray-800 transition-colors duration-200"
                            >
                              <td className="px-2 md:px-6 py-2 md:py-4 font-medium">
                                {leave.user?.name || "N/A"}
                              </td>
                              <td className="px-2 md:px-6 py-2 md:py-4 text-[var(--color-text-secondary)]">
                                {leave.user?.role || "N/A"}
                              </td>
                              <td className="px-2 md:px-6 py-2 md:py-4 font-bold text-[var(--color-primary)]">
                                {days}
                              </td>
                              <td className="px-2 md:px-6 py-2 md:py-4">
                                <span
                                  className={`inline-block px-2 md:px-3 py-1 rounded-full text-xs font-medium ${statusBadge}`}
                                >
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
          </section>
        )}

        {/* Other Tabs */}
        {active === "Employees" && <EmployeesPage />}
        {active === "Leaders" && <LeadersPage />}
        {active === "Admins" && <AdminsPage />}
        {active === "Attendance" && <AttendancePage />}
        {active === "Holiday Calendar" && <AdminHolidayCalendar />}
        {active === "Leaves" && <LeavesPage />}
        {active === "Salary" && <SalaryPage />}
        {active === "Teams" && <TeamsPage />}
        {active === "Projects" && <ProjectsPage />}
        {active === "Profile Verification" && <ProfileVerificationPage />}
        {active === "Reports" && <ReportsPage />}
      </main>
    </div>
  );
};

export default AdminDashboard;
