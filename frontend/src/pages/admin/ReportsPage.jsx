"use client";

import React, { useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";
import jsPDF from "jspdf";
import { 
  Users, 
  UserCheck, 
  Filter as FilterIcon, 
  Download, 
  RefreshCcw, 
  User as UserIcon, 
  FileText, 
  Calendar, 
  Briefcase, 
  BarChart3, 
  ChevronRight, 
  LayoutDashboard, 
  Search, 
  AlertCircle 
} from "lucide-react";
import DatePicker from "../../components/DatePicker";
import { motion, AnimatePresence } from "framer-motion";

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
    const overtimeCount = (reportData.attendances || []).filter(a => {
      const s = (a.status || '').toLowerCase();
      return s === 'over-time' || s === 'overtime';
    }).length;
    doc.text(`Overtime Days: ${overtimeCount}`, 20, yPosition);
    yPosition += 15;
    doc.setFontSize(16);
    doc.text("Leave History", 20, yPosition);
    yPosition += 10;
    doc.setFontSize(12);
    reportData.leaves.slice(0, 10).forEach((leave, index) => {
      if (yPosition > 270) { doc.addPage(); yPosition = 20; }
      doc.text(`${index + 1}. ${leave.reason} (${new Date(leave.fromDate).toLocaleDateString()} - ${new Date(leave.toDate).toLocaleDateString()}) - ${leave.status}`, 20, yPosition);
      yPosition += 8;
    });
    yPosition += 10;
    doc.setFontSize(16);
    doc.text("Project Assignments", 20, yPosition);
    yPosition += 10;
    doc.setFontSize(12);
    reportData.projects.forEach((project, index) => {
      if (yPosition > 270) { doc.addPage(); yPosition = 20; }
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
    <div className="min-h-screen bg-background text-primary animate-fadeIn">
      <div className="max-w-6xl mx-auto w-full">
        {/* Header */}
        <div className="mb-10">
          <h2 className="text-4xl font-black text-primary tracking-tight mb-2 flex items-center gap-3">
            <BarChart3 size={32} className="text-primary" />
            Intelligence Reports
          </h2>
          <p className="text-secondary font-medium opacity-80">Generate comprehensive performance and data audit reports.</p>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-primary/5 border border-gray-200"
            >
              <h3 className="text-2xl font-black text-primary mb-8 tracking-tight">Select Organizational Role</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[
                  { id: 'employee', label: 'Employees', icon: Users, desc: 'Performance metrics for technical staff', color: 'bg-primary' },
                  { id: 'leader', label: 'Team Leaders', icon: UserCheck, desc: 'Leadership and project management data', color: 'bg-[var(--color-secondary)]' }
                ].map((role) => (
                  <button
                    key={role.id}
                    onClick={() => { setSelectedRole(role.id); setStep(2); }}
                    className="flex flex-col items-start text-left p-8 rounded-[2rem] bg-gray-50 border border-gray-200 hover:border-primary hover:bg-white transition-all group relative overflow-hidden"
                  >
                    <div className={`p-4 rounded-2xl ${role.color} text-white mb-6 group-hover:scale-110 transition-transform`}>
                      <role.icon size={32} />
                    </div>
                    <h4 className="text-xl font-black text-primary mb-2">{role.label}</h4>
                    <p className="text-secondary font-medium text-sm opacity-70">{role.desc}</p>
                    <div className="absolute top-8 right-8 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronRight size={24} className="text-primary" />
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-primary/5 border border-gray-200"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-black text-primary tracking-tight">Audit Source: {selectedRole === 'employee' ? 'Employee Index' : 'Leadership Registry'}</h3>
                  <p className="text-secondary font-medium opacity-60">Select an individual to initiate data aggregation.</p>
                </div>
                <button onClick={resetSelection} className="px-6 py-3 font-bold text-secondary hover:text-primary transition-all">Back</button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto no-scrollbar pr-2">
                {users.map((user) => (
                  <button
                    key={user._id}
                    onClick={() => { setSelectedUser(user); fetchUserData(); }}
                    className="flex items-center gap-4 p-5 rounded-2xl bg-gray-50 border border-gray-200 hover:border-primary hover:bg-white transition-all text-left group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-primary group-hover:text-primary">{user.name}</h4>
                      <p className="text-xs text-secondary font-medium truncate w-32 md:w-40">{user.email}</p>
                      <span className="text-[10px] font-black uppercase text-primary/60 tracking-widest">{user.position || user.role}</span>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 3 && selectedUser && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Filter Dashboard */}
              <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-primary/5 border border-gray-200">
                <div className="flex flex-col md:flex-row gap-6 items-end">
                  <div className="flex-1 space-y-1.5">
                    <label className="block text-xs font-bold text-primary/70 uppercase tracking-widest ml-1">Reporting Period (Start)</label>
                    <DatePicker 
                      value={displayStartDate} 
                      onChange={(val) => {
                        setDisplayStartDate(val);
                        setFilters({ ...filters, startDate: convertDMYtoYMD(val) });
                      }} 
                    />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <label className="block text-xs font-bold text-primary/70 uppercase tracking-widest ml-1">Reporting Period (End)</label>
                    <DatePicker 
                      value={displayEndDate} 
                      onChange={(val) => {
                        setDisplayEndDate(val);
                        setFilters({ ...filters, endDate: convertDMYtoYMD(val) });
                      }} 
                    />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <label className="block text-xs font-bold text-primary/70 uppercase tracking-widest ml-1">Lifecycle Status</label>
                    <select
                      value={filters.projectStatus}
                      onChange={(e) => setFilters({ ...filters, projectStatus: e.target.value })}
                      className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-primary font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                    >
                      <option value="">All Statuses</option>
                      <option value="Active">Active</option>
                      <option value="Completed">Completed</option>
                      <option value="On Hold">On Hold</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={fetchUserData} className="p-4 bg-primary text-white rounded-2xl hover:bg-[var(--color-secondary)] transition-all shadow-lg shadow-primary/20">
                      <Search size={24} />
                    </button>
                    <button onClick={generatePDF} className="p-4 bg-[var(--color-secondary)] text-white rounded-2xl hover:bg-primary transition-all shadow-lg shadow-[0_12px_30px_rgba(26,157,194,0.2)]">
                      <Download size={24} />
                    </button>
                    <button onClick={resetSelection} className="p-4 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all">
                      <RefreshCcw size={24} />
                    </button>
                  </div>
                </div>
              </div>

              {reportData && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Performance Snapshot */}
                  <div className="bg-primary p-8 rounded-[2.5rem] shadow-2xl text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-10 opacity-10">
                      <LayoutDashboard size={140} />
                    </div>
                    <h3 className="text-xl font-black mb-8 flex items-center gap-2">
                      <FileText size={20} />
                      Performance Intelligence
                    </h3>
                    <div className="grid grid-cols-2 gap-6 relative z-10">
                      {[
                        { label: 'Tasks Assigned', val: reportData.performanceSummary.totalTasks },
                        { label: 'Finalized', val: reportData.performanceSummary.completedTasks },
                        { label: 'Delayed', val: reportData.performanceSummary.delayedTasks },
                        { label: 'Attendance', val: reportData.performanceSummary.totalAttendance }
                      ].map((item, idx) => (
                        <div key={idx} className="bg-white/10 p-5 rounded-2xl border border-gray-200/5">
                          <div className="text-[10px] font-black opacity-60 uppercase tracking-widest mb-1">{item.label}</div>
                          <div className="text-3xl font-black">{item.val}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Profile Context */}
                  <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-200">
                    <h3 className="text-xl font-black mb-8 text-primary flex items-center gap-2">
                      <UserIcon size={20} />
                      Profile Metadata
                    </h3>
                    <div className="space-y-4">
                      {[
                        { label: 'Full Name', val: reportData.user.name },
                        { label: 'Primary Email', val: reportData.user.email },
                        { label: 'Designation', val: reportData.user.position || 'Standard Personnel' },
                        { label: 'Administrative Role', val: reportData.user.role }
                      ].map((info, idx) => (
                        <div key={idx} className="flex items-center justify-between py-3 border-b border-gray-200 last:border-0">
                          <span className="text-xs font-bold text-secondary uppercase tracking-widest">{info.label}</span>
                          <span className="text-sm font-bold text-primary">{info.val}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Attendance Log */}
                  <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-200">
                    <h3 className="text-xl font-black mb-6 text-primary flex items-center gap-2">
                      <Calendar size={20} />
                      Chronological Logs
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 h-64 overflow-y-auto no-scrollbar pr-2">
                      {reportData.attendances.map((att, idx) => (
                        <div key={idx} className="p-3 rounded-xl bg-gray-50 border border-gray-200 flex flex-col items-center">
                          <span className="text-[10px] font-bold text-secondary">{new Date(att.date).toLocaleDateString()}</span>
                          <span className={`text-[9px] font-black uppercase mt-1 ${att.status.toLowerCase() === 'present' ? 'text-green-600' : 'text-amber-600'}`}>{att.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Leave Audit */}
                  <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-200">
                    <h3 className="text-xl font-black mb-6 text-primary flex items-center gap-2">
                      <AlertCircle size={20} />
                      Absence Audit
                    </h3>
                    <div className="space-y-3 h-64 overflow-y-auto no-scrollbar pr-2">
                      {reportData.leaves.map((leave, idx) => (
                        <div key={idx} className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex justify-between items-start">
                          <div>
                            <div className="font-bold text-primary text-sm">{leave.reason}</div>
                            <div className="text-[10px] text-secondary font-medium">{new Date(leave.fromDate).toLocaleDateString()} — {new Date(leave.toDate).toLocaleDateString()}</div>
                          </div>
                          <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase border ${
                            leave.status.toLowerCase() === 'approved' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-amber-50 text-amber-600 border-amber-200'
                          }`}>{leave.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Project Allocations */}
                  <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-200 lg:col-span-2">
                    <h3 className="text-xl font-black mb-8 text-primary flex items-center gap-2">
                      <Briefcase size={20} />
                      Project Allocation Matrix
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {reportData.projects.map((project, idx) => (
                        <div key={idx} className="p-6 rounded-[2rem] bg-gray-50 border border-gray-200 hover:border-primary/30 transition-all">
                          <div className="flex justify-between items-start mb-4">
                            <h4 className="font-black text-primary text-lg">{project.name}</h4>
                            <span className="px-3 py-1 bg-white border border-gray-200 text-primary rounded-full text-[10px] font-black uppercase tracking-widest">{project.status}</span>
                          </div>
                          <p className="text-sm text-secondary font-medium mb-6 opacity-80 line-clamp-2">{project.description}</p>
                          <div className="flex gap-6">
                            <div>
                              <div className="text-[9px] font-black text-secondary uppercase tracking-widest opacity-60">Initiation</div>
                              <div className="text-xs font-bold text-primary">{new Date(project.startDate).toLocaleDateString()}</div>
                            </div>
                            <div>
                              <div className="text-[9px] font-black text-secondary uppercase tracking-widest opacity-60">Deadline</div>
                              <div className="text-xs font-bold text-primary">{new Date(project.endDate).toLocaleDateString()}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ReportsPage;
