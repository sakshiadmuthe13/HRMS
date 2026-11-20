import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Calendar as CalendarIcon, User, Briefcase, Filter, Search, CheckCircle2, RefreshCw, Link, Image, ExternalLink } from "lucide-react";
import ProfileAvatar from "../../components/ProfileAvatar";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

const fetchJson = async (path, opts = {}) => {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  const headers = { ...(opts.headers || {}) };
  if (token && !headers.Authorization) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { credentials: "include", ...opts, headers });
  if (!res.ok) {
    let text = await res.text();
    try { text = JSON.parse(text); } catch {}
    throw new Error(text?.message || res.statusText || "API error");
  }
  const t = await res.text();
  return t ? JSON.parse(t) : null;
};

const TIME_SLOTS = [
  "09:00 AM - 10:00 AM",
  "10:00 AM - 11:00 AM",
  "11:00 AM - 12:00 PM",
  "12:00 PM - 01:00 PM",
  "01:00 PM - 02:00 PM",
  "02:00 PM - 03:00 PM",
  "03:00 PM - 04:00 PM",
  "04:00 PM - 05:00 PM",
  "05:00 PM - 06:00 PM",
  "06:00 PM - 07:00 PM",
  "07:00 PM - 08:00 PM"
];

export default function AdminWorkLogsPage() {
  const [logs, setLogs] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedUser, setSelectedUser] = useState("All");
  const [selectedProject, setSelectedProject] = useState("All");
  const [loading, setLoading] = useState(false);

  // Add Log Modal State for Employees & Leaders
  const [showAddModal, setShowAddModal] = useState(false);
  const [logForm, setLogForm] = useState({ timeSlot: "09:00 AM - 10:00 AM", activity: "", projectId: "", taskId: "", linkUrl: "", files: [], status: "Completed" });
  const [submitLoading, setSubmitLoading] = useState(false);

  const role = localStorage.getItem("role") || "admin";
  const apiPrefix = role === "leader" ? "/leader" : (role === "employee" ? "/employee" : "/admin");

  useEffect(() => {
    fetchEmployees();
    fetchProjects();
    fetchMyTasks();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [selectedDate, selectedUser, selectedProject]);

  const fetchEmployees = async () => {
    try {
      const res = await fetchJson(`${apiPrefix}/all-employees`);
      setEmployees(Array.isArray(res) ? res : []);
    } catch (e) {
      try {
        const res = await fetchJson("/admin/employees");
        setEmployees(Array.isArray(res) ? res : []);
      } catch (err) { console.error("Failed to fetch employees:", err); }
    }
  };

  const fetchProjects = async () => {
    try {
      if (role === "employee") {
        const res = await fetchJson("/employee/projects");
        setProjects(Array.isArray(res) ? res : []);
        return;
      }
      const res = await fetchJson(`${apiPrefix}/all-projects`);
      setProjects(Array.isArray(res) ? res : []);
    } catch (e) {
      try {
        const res = await fetchJson("/admin/projects");
        setProjects(Array.isArray(res) ? res : []);
      } catch (err) { console.error("Failed to fetch projects:", err); }
    }
  };

  const fetchMyTasks = async () => {
    try {
      const res = await fetchJson("/employee/tasks");
      setMyTasks(Array.isArray(res) ? res : []);
    } catch (e) {
      try {
        const res = await fetchJson("/leader/my-assigned-tasks");
        setMyTasks(Array.isArray(res) ? res : []);
      } catch (err) { console.error("Failed to fetch my tasks:", err); }
    }
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let url = `${apiPrefix}/work-logs?date=${selectedDate}`;
      if (selectedUser !== "All") url += `&userId=${selectedUser}`;
      const res = await fetchJson(url);
      
      // If single log array returned from user query, convert to list format
      const logList = Array.isArray(res) ? res : (res && res.entries ? [res] : []);
      setLogs(logList);
    } catch (e) {
      console.error("Failed to fetch work logs:", e);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLogSubmit = async (e) => {
    e.preventDefault();
    if (!logForm.activity.trim()) {
      alert("Please enter activity / work description.");
      return;
    }
    setSubmitLoading(true);
    try {
      const formData = new FormData();
      formData.append("timeSlot", logForm.timeSlot);
      formData.append("activity", logForm.activity);
      if (logForm.projectId) formData.append("projectId", logForm.projectId);
      if (logForm.taskId) formData.append("taskId", logForm.taskId);
      if (logForm.linkUrl) formData.append("linkUrl", logForm.linkUrl);
      if (logForm.status) formData.append("status", logForm.status);
      
      if (Array.isArray(logForm.files) && logForm.files.length > 0) {
        logForm.files.forEach((file) => formData.append("files", file));
      } else if (logForm.file) {
        formData.append("file", logForm.file);
      }

      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const headers = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/employee/work-logs`, {
        method: "POST",
        body: formData,
        headers,
        credentials: "include"
      });

      if (!res.ok) {
        let text = await res.text();
        try { text = JSON.parse(text); } catch {}
        throw new Error(text?.message || res.statusText || "API error");
      }

      alert("Work log entry added successfully!");
      setShowAddModal(false);
      setLogForm({ timeSlot: "09:00 AM - 10:00 AM", activity: "", projectId: "", taskId: "", linkUrl: "", files: [], status: "Completed" });
      fetchLogs();
    } catch (err) {
      alert(err.message || "Failed to add work log entry");
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="animate-fadeIn max-w-7xl mx-auto space-y-8 pb-20 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shrink-0">
            <Clock size={28} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-primary tracking-tight">Hourly Work Activity Logs</h2>
            <p className="text-xs font-bold text-secondary/60 uppercase tracking-widest mt-1">Real-time 1-Hour Employee Task Timeline</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-bold shadow-lg shadow-primary/20 transition-all"
          >
            <Clock size={16} /> ➕ Log Hourly Activity
          </button>
          <button
            onClick={fetchLogs}
            className="flex items-center gap-2 px-4 py-3 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-xl text-xs font-bold transition-all"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      {/* Controls / Filters Card */}
      <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-bold text-secondary uppercase tracking-widest flex items-center gap-1.5">
            <CalendarIcon size={14} /> Select Date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-primary font-bold outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-secondary uppercase tracking-widest flex items-center gap-1.5">
            <User size={14} /> Select Employee
          </label>
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-primary font-bold outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="All">All Employees</option>
            {employees.map((e) => (
              <option key={e._id} value={e._id}>
                {e.name} ({e.employeeId || "QT-B66A0F"})
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-secondary uppercase tracking-widest flex items-center gap-1.5">
            <Briefcase size={14} /> Filter Project
          </label>
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-primary font-bold outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="All">All Projects</option>
            {projects.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Logs Timeline Table / Cards */}
      <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 className="text-lg font-black text-primary flex items-center gap-2">
            <Clock size={20} className="text-blue-500" /> Activity Log Timeline ({selectedDate})
          </h3>
          <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-black rounded-full uppercase tracking-wider">
            30-Min Interval Tracking
          </span>
        </div>

        {loading ? (
          <div className="p-16 text-center text-secondary font-medium animate-pulse">Loading half-hourly activity logs...</div>
        ) : logs.length === 0 || !logs.some(l => l.entries && l.entries.length > 0) ? (
          <div className="p-16 text-center text-secondary font-medium">
            No half-hourly activity entries found for {selectedDate}.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="p-5 font-bold text-secondary uppercase tracking-widest text-xs">Time Slot</th>
                  <th className="p-5 font-bold text-secondary uppercase tracking-widest text-xs">Employee</th>
                  <th className="p-5 font-bold text-secondary uppercase tracking-widest text-xs">Project & Task</th>
                  <th className="p-5 font-bold text-secondary uppercase tracking-widest text-xs">Half-Hourly Activity Log</th>
                  <th className="p-5 font-bold text-secondary uppercase tracking-widest text-xs">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.flatMap((userLog) =>
                  (userLog.entries || []).map((entry, idx) => (
                    <tr key={`${userLog._id}-${idx}`} className="hover:bg-primary/5 transition-colors">
                      <td className="p-5 font-black text-primary text-xs whitespace-nowrap">
                        <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 font-mono">
                          {entry.timeSlot}
                        </span>
                      </td>
                      <td className="p-5 font-bold text-primary text-sm">
                        <div className="flex items-center gap-2.5">
                          <ProfileAvatar user={userLog.user} className="w-8 h-8 text-xs" />
                          <div>
                            <div>{userLog.user?.name || "Employee"}</div>
                            <div className="text-[10px] text-secondary font-medium">{userLog.user?.position || "Developer"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-5 text-sm font-semibold text-secondary">
                        <div className="font-bold text-primary">
                          {entry.project?.name || "General Project Work"}
                        </div>
                        {entry.task && (
                          <div className="mt-1 flex items-center gap-1 text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-md w-fit border border-blue-100">
                            🎯 Task: {entry.task.description || entry.task}
                          </div>
                        )}
                      </td>
                      <td className="p-5 text-sm font-medium text-gray-800 max-w-md space-y-1.5">
                        <div>{entry.activity}</div>
                        {entry.linkUrl && (
                          <a
                            href={entry.linkUrl.startsWith("http") ? entry.linkUrl : `https://${entry.linkUrl}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 transition-all w-fit"
                          >
                            <ExternalLink size={13} /> {entry.linkUrl.length > 30 ? entry.linkUrl.slice(0, 30) + "..." : entry.linkUrl}
                          </a>
                        )}
                        {((Array.isArray(entry.attachments) && entry.attachments.length > 0) || entry.attachmentUrl) && (
                          <div className="flex flex-wrap gap-2 pt-1.5">
                            {(Array.isArray(entry.attachments) && entry.attachments.length > 0
                              ? entry.attachments
                              : [entry.attachmentUrl]
                            ).map((imgUrl, i) => (
                              <a key={i} href={imgUrl} target="_blank" rel="noreferrer" className="block">
                                <img
                                  src={imgUrl}
                                  alt={`Screenshot ${i + 1}`}
                                  className="h-16 w-auto rounded-lg object-cover border border-gray-200 shadow-sm hover:scale-105 transition-all"
                                />
                              </a>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="p-5 text-xs font-bold">
                        <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-200 flex items-center gap-1 w-fit">
                          <CheckCircle2 size={12} /> {entry.status || "Completed"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Work Log Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-gray-100 space-y-5 relative max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  <Clock size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-primary">Log Hourly Activity</h3>
                  <p className="text-xs text-secondary font-medium">Record 1-hour work update</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full text-secondary transition-all font-black text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddLogSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-secondary uppercase tracking-widest">
                  Select Time Slot <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={logForm.timeSlot}
                  onChange={(e) => setLogForm({ ...logForm, timeSlot: e.target.value })}
                  className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-primary font-bold outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                >
                  {TIME_SLOTS.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-secondary uppercase tracking-widest flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-blue-500" /> Select Assigned Task (Optional)
                </label>
                <select
                  value={logForm.taskId}
                  onChange={(e) => {
                    const selTask = myTasks.find(t => t._id === e.target.value);
                    setLogForm({
                      ...logForm,
                      taskId: e.target.value,
                      projectId: selTask?.project?._id || selTask?.project || logForm.projectId,
                      linkUrl: selTask?.referenceUrl || logForm.linkUrl
                    });
                  }}
                  className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-primary font-bold outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                >
                  <option value="">-- General / No Specific Task --</option>
                  {myTasks.filter(t => t.status !== "Completed").map((t) => (
                    <option key={t._id} value={t._id}>
                      🎯 {t.description?.slice(0, 50)} {t.project?.name ? `(${t.project.name})` : ""}
                    </option>
                  ))}
                </select>
                {logForm.taskId && myTasks.find(t => t._id === logForm.taskId)?.referenceUrl && (
                  <div className="mt-2 flex items-center gap-2 text-xs font-bold text-blue-600 bg-blue-50 p-2.5 rounded-xl border border-blue-200">
                    <Link size={14} className="shrink-0 text-blue-500" />
                    <span className="shrink-0">Task Ref Link:</span>
                    <a
                      href={myTasks.find(t => t._id === logForm.taskId).referenceUrl.startsWith("http") ? myTasks.find(t => t._id === logForm.taskId).referenceUrl : `https://${myTasks.find(t => t._id === logForm.taskId).referenceUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      className="underline truncate max-w-[200px]"
                    >
                      {myTasks.find(t => t._id === logForm.taskId).referenceUrl}
                    </a>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-secondary uppercase tracking-widest">
                  Project (Optional)
                </label>
                <select
                  value={logForm.projectId}
                  onChange={(e) => setLogForm({ ...logForm, projectId: e.target.value })}
                  className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-primary font-bold outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                >
                  <option value="">-- General Task (No Specific Project) --</option>
                  {projects.filter(p => p.status !== "Completed").map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-secondary uppercase tracking-widest flex items-center gap-1.5">
                  <Link size={14} className="text-blue-500" /> Vercel / Live Deployment Link (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://my-app.vercel.app or https://github.com/..."
                  value={logForm.linkUrl}
                  onChange={(e) => setLogForm({ ...logForm, linkUrl: e.target.value })}
                  className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-primary font-bold outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-secondary uppercase tracking-widest flex items-center gap-1.5">
                  <Image size={14} className="text-purple-500" /> Image / Screenshot Attachments (Multiple Allowed)
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => setLogForm({ ...logForm, files: Array.from(e.target.files) })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium"
                />
                {Array.isArray(logForm.files) && logForm.files.length > 0 && (
                  <div className="text-[11px] font-bold text-purple-600">
                    📎 {logForm.files.length} screenshot(s) selected: {logForm.files.map(f => f.name).join(", ")}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-secondary uppercase tracking-widest">
                  Activity / Work Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="What task or work did you perform during this 30-minute interval?"
                  value={logForm.activity}
                  onChange={(e) => setLogForm({ ...logForm, activity: e.target.value })}
                  className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-primary font-bold outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-secondary uppercase tracking-widest">
                  Status
                </label>
                <select
                  value={logForm.status}
                  onChange={(e) => setLogForm({ ...logForm, status: e.target.value })}
                  className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-primary font-bold outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                >
                  <option value="Completed">Completed</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Blocked">Blocked</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-3 bg-gray-100 hover:bg-gray-200 text-secondary rounded-xl text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-bold shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
                >
                  {submitLoading ? "Saving..." : "Save Work Log"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
