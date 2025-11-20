"use client";

import React, { useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";
import jsPDF from "jspdf";
import { Users, UserCheck, Filter as FilterIcon, Download, RefreshCcw, User as UserIcon, FileText, Calendar, Briefcase, BarChart3 } from "lucide-react";
import DatePicker from "../../components/DatePicker";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

const fetchJson = async (path, opts = {}) => {
  const token = (() => { try { return localStorage.getItem("token") || sessionStorage.getItem("token"); } catch { return null; } })();
  const headers = { ...(opts.headers || {}) };
  if (token && !headers.Authorization && !headers.authorization) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    ...opts,
    headers,
  });
  if (!res.ok) {
    let text = await res.text();
    try { text = JSON.parse(text); } catch { }
    throw new Error(text?.message || res.statusText || "API error");
  }
  const t = await res.text();
  return t ? JSON.parse(t) : null;
};

const apiGet = (p) => fetchJson(p);

const convertYMDtoDMY = (ymd) => {
  if (!ymd) return "";
  const parts = ymd.split("-");
  if (parts.length !== 3) return "";
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

const convertDMYtoYMD = (dmy) => {
  if (!dmy) return "";
  const parts = dmy.split("/");
  if (parts.length !== 3) return "";
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
};

const ReportsPage = () => {
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState("");
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    projectStatus: ""
  });
  const [displayStartDate, setDisplayStartDate] = useState("");
  const [displayEndDate, setDisplayEndDate] = useState("");
  const [leaveStats, setLeaveStats] = useState({ paid: 0, unpaid: 0 });

  const fetchUsers = useCallback(async () => {
    try {
      const endpoint = selectedRole === "employee" ? "/admin/employees" : "/admin/leaders";
      const data = await apiGet(endpoint);
      setUsers(data || []);
    } catch {
      toast.error("Failed to load users");
    }
  }, [selectedRole]);

  useEffect(() => {
    if (selectedRole) {
      fetchUsers();
    }
  }, [selectedRole, fetchUsers]);

  const fetchUserData = async () => {
    if (!selectedUser) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("userId", selectedUser._id);
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);

      const data = await apiGet(`/admin/reports/user-data?${params}`);
      setReportData(data);
      setStep(3);
    } catch {
      toast.error("Failed to fetch user data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const run = async () => {
      if (!reportData?.user?._id) return;
      const now = new Date();
      const ys = new Date(now.getFullYear(), 0, 1);
      const ye = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
      let used = 0;
      for (const l of reportData.leaves || []) {
        const s = (l?.status || "").toString().toLowerCase();
        if (s !== "approved") continue;
        const from = l.fromDate ? new Date(l.fromDate) : null;
        const to = l.toDate ? new Date(l.toDate) : null;
        if (!from || !to || isNaN(from) || isNaN(to)) continue;
        const start = from < ys ? ys : from;
        const end = to > ye ? ye : to;
        if (end < start) continue;
        used += Math.floor((end - start) / 86400000) + 1;
      }
      let allowance = 12;
      try {
        const info = await apiGet(`/admin/users/${reportData.user._id}/leave-info`);
        if (info && typeof info.leaveAllowance === "number") allowance = info.leaveAllowance;
      } catch {}
      const paid = Math.min(used, allowance);
      const unpaid = Math.max(0, used - allowance);
      setLeaveStats({ paid, unpaid });
    };
    run();
  }, [reportData]);

  const generatePDF = () => {
    if (!reportData) return;

    const doc = new jsPDF();
    let yPosition = 20;

    doc.setFontSize(18);
    doc.text("Employee Performance Report", 20, yPosition);
    yPosition += 10;

    doc.setFontSize(14);
    doc.text(`Name: ${reportData.user.name}`, 20, yPosition);
    yPosition += 10;
    doc.text(`Role: ${reportData.user.role}`, 20, yPosition);
    yPosition += 10;
    doc.text(`Email: ${reportData.user.email}`, 20, yPosition);
    yPosition += 10;
    doc.text(`ID: ${reportData.user._id}`, 20, yPosition);
    yPosition += 15;

    doc.setFontSize(16);
    doc.text("Attendance Summary", 20, yPosition);
    yPosition += 10;
    doc.setFontSize(12);
    doc.text(`Total Days: ${reportData.performanceSummary.totalAttendance}`, 20, yPosition);
    yPosition += 10;
    doc.text(`Present Days: ${reportData.performanceSummary.presentDays}`, 20, yPosition);
    yPosition += 10;
    // add overtime days
    const overtimeCount = (reportData.attendances || []).filter(a => {
      const s = (a.status || '').toLowerCase();
      return s === 'over-time' || s === 'overtime';
    }).length;
    doc.text(`Overtime Days: ${overtimeCount}`, 20, yPosition);
    yPosition += 15;
    // doc.text(`Attendance Rate: ${reportData.performanceSummary.attendanceRate}%`, 20, yPosition);
    // yPosition += 20;

    doc.setFontSize(16);
    doc.text("Leave History", 20, yPosition);
    yPosition += 10;
    doc.setFontSize(12);
    reportData.leaves.slice(0, 10).forEach((leave, index) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
      doc.text(`${index + 1}. ${leave.reason} (${new Date(leave.fromDate).toLocaleDateString()} - ${new Date(leave.toDate).toLocaleDateString()}) - ${leave.status}`, 20, yPosition);
      yPosition += 8;
    });
    yPosition += 10;

    doc.setFontSize(16);
    doc.text("Project Assignments", 20, yPosition);
    yPosition += 10;
    doc.setFontSize(12);
    reportData.projects.forEach((project, index) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
      doc.text(`${index + 1}. ${project.name} - ${project.status}`, 20, yPosition);
      yPosition += 8;
    });
    yPosition += 15;

    doc.setFontSize(16);
    doc.text("Performance Summary", 20, yPosition);
    yPosition += 10;
    doc.setFontSize(12);
    doc.text(`Total Tasks Assigned: ${reportData.performanceSummary.totalTasks}`, 20, yPosition);
    yPosition += 10;
    doc.text(`Completed Tasks: ${reportData.performanceSummary.completedTasks}`, 20, yPosition);
    yPosition += 10;
    doc.text(`Delayed Tasks: ${reportData.performanceSummary.delayedTasks}`, 20, yPosition);
    yPosition += 10;
    doc.text(`Paid Leaves: ${leaveStats.paid}`, 20, yPosition);
    yPosition += 10;
    doc.text(`Unpaid Leaves: ${leaveStats.unpaid}`, 20, yPosition);

    doc.save(`${reportData.user.name}_report.pdf`);
    toast.success("PDF downloaded successfully!");
  };

  const resetSelection = () => {
    setStep(1);
    setSelectedRole("");
    setSelectedUser(null);
    setReportData(null);
    setFilters({ startDate: "", endDate: "", projectStatus: "" });
    setDisplayStartDate("");
    setDisplayEndDate("");
  };

  return (
    <div className="min-h-[calc(100vh-48px)] bg-[#111828] text-[var(--color-text-primary)] p-3 sm:p-4 md:p-6 overflow-x-hidden">
      <div className="max-w-6xl mx-auto w-full">
        <h1 className="text-2xl sm:text-3xl font-extrabold mb-6 sm:mb-8 flex items-center gap-2"><BarChart3 size={24} sm:size={28} className="text-[var(--color-primary)]" /><span className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] bg-clip-text text-transparent">Detailed Reports</span></h1>

        {step === 1 && (
          <div className="bg-[var(--color-surface)] rounded-lg p-4 sm:p-6 card-glow">
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-4">Select Role</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                onClick={() => { setSelectedRole("employee"); setStep(2); }}
                className="flex items-center gap-3 p-5 rounded-md cursor-pointer card-glow transition-transform hover:scale-[1.02]"
             >
                <Users size={28} className="text-[var(--color-primary)]" />
                <span className="text-lg">Employee</span>
              </div>
              <div
                onClick={() => { setSelectedRole("leader"); setStep(2); }}
                className="flex items-center gap-3 p-5 rounded-md cursor-pointer card-glow transition-transform hover:scale-[1.02]"
              >
                <UserCheck size={28} className="text-[var(--color-secondary)]" />
                <span className="text-lg">Leader</span>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="bg-[var(--color-surface)] rounded-lg p-4 sm:p-6 card-glow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">Select {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}</h2>
              <button
                onClick={resetSelection}
                className="px-4 py-2 bg-[var(--color-danger)] text-[var(--color-text-primary)] rounded-md hover:bg-red-600 transition-colors btn"
              >
                Back
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {users.map((user) => (
                <div
                  key={user._id}
                  onClick={() => { setSelectedUser(user); fetchUserData(); }}
                  className="p-5 rounded-md cursor-pointer transition-transform hover:scale-[1.02] card-glow"
                >
                  <h3 className="font-semibold text-[var(--color-text-primary)]">{user.name}</h3>
                  <p className="text-[var(--color-text-secondary)]">{user.email}</p>
                  <p className="text-sm text-[var(--color-text-secondary)]">{user.position || user.role}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 3 && selectedUser && (
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-[var(--color-surface)] rounded-lg p-4 sm:p-6 card-glow">
              <div className="flex items-center gap-2 mb-4">
                <FilterIcon size={20} className="text-[var(--color-primary)]" />
                <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">Filters</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative z-[99999]">
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Start Date</label>
                  <DatePicker 
                    value={displayStartDate} 
                    onChange={(val) => {
                      setDisplayStartDate(val);
                      setFilters({ ...filters, startDate: convertDMYtoYMD(val) });
                    }} 
                    placeholder="dd/mm/yyyy" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">End Date</label>
                  <DatePicker 
                    value={displayEndDate} 
                    onChange={(val) => {
                      setDisplayEndDate(val);
                      setFilters({ ...filters, endDate: convertDMYtoYMD(val) });
                    }} 
                    placeholder="dd/mm/yyyy" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Project Status</label>
                  <select
                    value={filters.projectStatus}
                    onChange={(e) => setFilters({ ...filters, projectStatus: e.target.value })}
                    className="w-full px-3 py-2 border border-[var(--color-border)] rounded-md bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] input"
                  >
                    <option value="">All</option>
                    <option value="Active">Active</option>
                    <option value="Completed">Completed</option>
                    <option value="On Hold">On Hold</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-4 mt-4 justify-center">
                <button
                  onClick={fetchUserData}
                  disabled={loading}
                  className="px-6 py-2 bg-[var(--color-primary)] text-[var(--color-text-primary)] rounded-md hover:bg-[var(--color-secondary)] disabled:opacity-50 btn flex items-center gap-2"
                >
                  <FilterIcon size={18} />
                  {loading ? "Loading..." : "Apply Filters"}
                </button>
                <button
                  onClick={generatePDF}
                  disabled={!reportData}
                  className="px-6 py-2 bg-[var(--color-secondary)] text-[var(--color-text-primary)] rounded-md hover:bg-[var(--color-primary)] disabled:opacity-50 btn flex items-center gap-2"
                >
                  <Download size={18} />
                  Download PDF
                </button>
                <button
                  onClick={resetSelection}
                  className="px-6 py-2 bg-[var(--color-danger)] text-[var(--color-text-primary)] rounded-md hover:bg-red-600 btn flex items-center gap-2"
                >
                  <RefreshCcw size={18} />
                  New Report
                </button>
              </div>
            </div>

            {reportData && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-[var(--color-surface)] rounded-lg p-6 card-glow">
                  <div className="flex items-center gap-2 mb-4">
                    <UserIcon size={20} className="text-[var(--color-primary)]" />
                    <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">User Details</h3>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[var(--color-text-primary)]"><strong>Name:</strong> {reportData.user.name}</p>
                    <p className="text-[var(--color-text-primary)]"><strong>Email:</strong> {reportData.user.email}</p>
                    <p className="text-[var(--color-text-primary)]"><strong>Role:</strong> {reportData.user.role}</p>
                    <p className="text-[var(--color-text-primary)]"><strong>Position:</strong> {reportData.user.position || 'N/A'}</p>
                    <p className="text-[var(--color-text-primary)]"><strong>Phone:</strong> {reportData.user.phone || 'N/A'}</p>
                  </div>
                </div>

                <div className="bg-[var(--color-surface)] rounded-lg p-6 card-glow">
                  <div className="flex items-center gap-2 mb-4">
                    <FileText size={20} className="text-[var(--color-primary)]" />
                    <h3 className="text-lg font-semibold text=[var(--color-text-primary)]">Performance Summary</h3>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[var(--color-text-primary)]"><strong>Total Tasks Assigned:</strong> {reportData.performanceSummary.totalTasks}</p>
                    <p className="text-[var(--color-text-primary)]"><strong>Completed Tasks:</strong> {reportData.performanceSummary.completedTasks}</p>
                    <p className="text-[var(--color-text-primary)]"><strong>Delayed Tasks:</strong> {reportData.performanceSummary.delayedTasks}</p>
                    {/* <p className="text-[var(--color-text-primary)]"><strong>Completion Rate:</strong> {reportData.performanceSummary.completionRate}%</p> */}
                    {/* <p className="text-[var(--color-text-primary)]"><strong>Attendance Rate:</strong> {reportData.performanceSummary.attendanceRate}%</p> */}
                    <p className="text-[var(--color-text-primary)]"><strong>Paid Leaves:</strong> {leaveStats.paid}</p>
                    <p className="text-[var(--color-text-primary)]"><strong>Unpaid Leaves:</strong> {leaveStats.unpaid}</p>
                  </div>
                </div>

                <div className="bg-[var(--color-surface)] rounded-lg p-6 card-glow">
                  <div className="flex items-center gap-2 mb-4">
                    <Calendar size={20} className="text-[var(--color-primary)]" />
                    <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Attendance</h3>
                  </div>
                  <div className="h-60 overflow-y-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {reportData.attendances.slice(0, 366).map((att, index) => (
                        <div key={index} className="text-sm p-2 rounded-md bg-[rgba(255,255,255,0.02)]">
                          <p className="text-[var(--color-text-primary)]"><strong>{new Date(att.date).toLocaleDateString()}:</strong> {att.status}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-[var(--color-surface)] rounded-lg p-6 card-glow">
                  <div className="flex items-center gap-2 mb-4">
                    <Calendar size={20} className="text-[var(--color-primary)]" />
                    <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Leave History</h3>
                  </div>
                  <div className="h-60 overflow-y-auto space-y-2">
                    {reportData.leaves.slice(0, 100).map((leave, index) => (
                      <div key={index} className="text-sm p-2 rounded-md bg-[rgba(255,255,255,0.02)]">
                        <p className="text-[var(--color-text-primary)]"><strong>{leave.reason}:</strong> {new Date(leave.fromDate).toLocaleDateString()} - {new Date(leave.toDate).toLocaleDateString()}</p>
                        <p className="text-[var(--color-text-secondary)]">Status: {leave.status}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[var(--color-surface)] rounded-lg p-6 lg:col-span-2 card-glow">
                  <div className="flex items-center gap-2 mb-4">
                    <Briefcase size={20} className="text-[var(--color-primary)]" />
                    <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Project Assignments</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {reportData.projects.map((project, index) => (
                      <div key={index} className="p-4 rounded-md card-glow">
                        <h4 className="font-semibold text-[var(--color-text-primary)]">{project.name}</h4>
                        <p className="text-sm text-[var(--color-text-secondary)]">{project.description}</p>
                        <p className="text-sm text-[var(--color-text-primary)]"><strong>Status:</strong> {project.status}</p>
                        <p className="text-sm text-[var(--color-text-primary)]"><strong>Start:</strong> {new Date(project.startDate).toLocaleDateString()}</p>
                        <p className="text-sm text-[var(--color-text-primary)]"><strong>End:</strong> {new Date(project.endDate).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;
