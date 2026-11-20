import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ClipboardList,
  Search,
  Filter,
  Clock,
  AlertCircle,
  CheckCircle2,
  User,
  Briefcase,
  RefreshCw,
  ExternalLink,
  FileText,
  Plus,
  X,
  Send,
  Edit3,
  Trash2,
  Link,
  Image,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

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
    let text = await res.text();
    try {
      text = JSON.parse(text);
    } catch {}
    throw new Error(text?.message || res.statusText || "API error");
  }
  const t = await res.text();
  return t ? JSON.parse(t) : null;
};

const STATUS_OPTIONS = ["All", "Pending", "In Progress", "R&D", "Development", "Under Testing", "Completed", "Delayed"];

const statusStyle = (status) => {
  switch (status) {
    case "Completed":
      return "bg-emerald-50 text-emerald-600 border-emerald-100";
    case "In Progress":
      return "bg-blue-50 text-blue-600 border-blue-100";
    case "R&D":
      return "bg-purple-50 text-purple-600 border-purple-100";
    case "Development":
      return "bg-indigo-50 text-indigo-600 border-indigo-100";
    case "Under Testing":
      return "bg-amber-50 text-amber-600 border-amber-100";
    case "Delayed":
      return "bg-red-50 text-red-500 border-red-200";
    default:
      return "bg-gray-50 text-gray-500 border-gray-200";
  }
};

const statusIcon = (status) => {
  switch (status) {
    case "Completed":
      return <CheckCircle2 size={12} className="text-emerald-500" />;
    case "In Progress":
      return <Clock size={12} className="text-amber-500" />;
    case "Delayed":
      return <AlertCircle size={12} className="text-red-500" />;
    default:
      return <Clock size={12} className="text-gray-400" />;
  }
};

export default function AdminTasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [projectsList, setProjectsList] = useState([]);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [assignForm, setAssignForm] = useState({
    assignedTo: "",
    projectId: "",
    description: "",
    deadline: "",
    referenceUrl: "",
    file: null,
  });
  const [assignLoading, setAssignLoading] = useState(false);

  const fetchAssignModalData = async () => {
    try {
      const empData = await fetchJson("/admin/employees");
      setEmployees(empData || []);
      const projData = await fetchJson("/admin/projects");
      setProjectsList(projData || []);
    } catch (e) { console.error("Failed to load assign modal data:", e); }
  };

  const handleEditClick = (task) => {
    setEditingTaskId(task._id);
    setAssignForm({
      assignedTo: task.assignedTo?._id || task.assignedTo || "",
      projectId: task.project?._id || task.project || "",
      description: task.description || "",
      deadline: task.deadline ? new Date(task.deadline).toISOString().slice(0, 16) : "",
      referenceUrl: task.referenceUrl || "",
      file: null,
    });
    if (employees.length === 0) fetchAssignModalData();
    setShowAssignModal(true);
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      await fetchJson(`/leader/tasks/${taskId}`, { method: "DELETE" });
      alert("Task deleted successfully");
      fetchTasks();
    } catch (err) {
      alert(err.message || "Failed to delete task");
    }
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    const hasSelection = Array.isArray(assignForm.assignedTo) ? assignForm.assignedTo.length > 0 : Boolean(assignForm.assignedTo);
    if (!hasSelection || !assignForm.description.trim()) {
      alert("Please select at least one employee and enter task description.");
      return;
    }

    setAssignLoading(true);
    try {
      const endpoint = editingTaskId ? `/leader/tasks/${editingTaskId}` : "/leader/assign-task";
      const method = editingTaskId ? "PUT" : "POST";

      const formData = new FormData();
      if (Array.isArray(assignForm.assignedTo)) {
        assignForm.assignedTo.forEach(id => formData.append("assignedTo", id));
      } else {
        formData.append("assignedTo", assignForm.assignedTo);
      }
      formData.append("projectId", assignForm.projectId);
      formData.append("description", assignForm.description);
      if (assignForm.deadline) formData.append("deadline", new Date(assignForm.deadline).toISOString());
      if (assignForm.referenceUrl) formData.append("referenceUrl", assignForm.referenceUrl);
      if (assignForm.file) formData.append("file", assignForm.file);

      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const headers = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}${endpoint}`, {
        method,
        body: formData,
        headers,
        credentials: "include",
      });

      if (!res.ok) {
        let text = await res.text();
        try { text = JSON.parse(text); } catch {}
        throw new Error(text?.message || res.statusText || "API error");
      }

      alert(editingTaskId ? "Task updated successfully!" : "Task assigned successfully!");
      setShowAssignModal(false);
      setEditingTaskId(null);
      setAssignForm({ assignedTo: "", projectId: "", description: "", deadline: "", referenceUrl: "", file: null });
      fetchTasks();
    } catch (err) {
      alert(err.message || "Failed to save task");
    } finally {
      setAssignLoading(false);
    }
  };

  const fetchTasks = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "All") params.set("status", statusFilter);
      if (search.trim()) params.set("search", search.trim());
      const data = await fetchJson(`/admin/all-tasks?${params.toString()}`);
      setTasks(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchTasks();
  };

  // Client-side filtering for instant search feedback
  const filtered = tasks.filter((t) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      t.description?.toLowerCase().includes(q) ||
      t.assignedTo?.name?.toLowerCase().includes(q) ||
      t.project?.name?.toLowerCase().includes(q) ||
      t.assignedBy?.name?.toLowerCase().includes(q)
    );
  });

  const stats = {
    total: tasks.length,
    completed: tasks.filter((t) => t.status === "Completed").length,
    inProgress: tasks.filter((t) => t.status === "In Progress").length,
    delayed: tasks.filter((t) => t.status === "Delayed").length,
    pending: tasks.filter((t) => !["Completed", "In Progress", "Delayed"].includes(t.status)).length,
  };

  return (
    <div className="animate-fadeIn max-w-7xl mx-auto space-y-10 pb-20">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shrink-0">
            <ClipboardList size={28} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-primary tracking-tight">
              All Tasks
            </h2>
            <p className="text-xs font-bold text-secondary/60 uppercase tracking-widest mt-1">
              System-Wide Task Overview
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setShowAssignModal(true);
              if (employees.length === 0) fetchAssignModalData();
            }}
            className="flex items-center gap-2 px-5 py-3 bg-primary text-white hover:bg-primary/90 rounded-2xl text-xs font-bold shadow-lg shadow-primary/20 transition-all"
          >
            <Plus size={18} /> Assign Task
          </button>
          <button
            onClick={fetchTasks}
            className="p-3 bg-primary/10 hover:bg-primary/20 rounded-2xl text-primary transition-all"
            title="Refresh"
          >
            <RefreshCw size={20} />
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
        {[
          { label: "Total Tasks", val: stats.total, color: "bg-primary/10 text-primary" },
          { label: "Completed", val: stats.completed, color: "bg-emerald-50 text-emerald-600" },
          { label: "In Progress", val: stats.inProgress, color: "bg-amber-50 text-amber-600" },
          { label: "Delayed", val: stats.delayed, color: "bg-red-50 text-red-600" },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="card-premium p-6 flex flex-col gap-2"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg ${s.color}`}>
              {s.val}
            </div>
            <div className="text-[10px] font-black text-secondary/50 uppercase tracking-widest">
              {s.label}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-gray-200 space-y-6">
        {/* Status Filter */}
        <div className="flex flex-wrap gap-3">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-5 py-2 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all border ${
                statusFilter === s
                  ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                  : "bg-gray-50 text-secondary border-gray-200 hover:bg-primary/5 hover:border-primary/20"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-secondary/30" size={18} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by employee, project, or task description..."
              className="w-full bg-gray-50 border border-gray-200 p-4 pl-12 rounded-2xl text-sm font-bold text-primary outline-none focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-secondary/20"
            />
          </div>
          <button
            type="submit"
            className="px-8 py-4 bg-primary text-white font-black rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all text-xs uppercase tracking-widest"
          >
            Search
          </button>
        </form>

        {error && (
          <p className="text-[10px] font-black text-red-500 uppercase tracking-widest px-2">
            {error}
          </p>
        )}
      </div>

      {/* Tasks Table */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-gray-200 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/5 rounded-xl text-primary">
              <Filter size={16} />
            </div>
            <h3 className="text-lg font-black text-primary tracking-tight">
              Task Registry
            </h3>
          </div>
          <div className="text-[10px] font-black text-secondary/40 uppercase tracking-widest bg-gray-50 px-4 py-2 rounded-full">
            {filtered.length} Tasks
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/60">
                <th className="p-5 text-[10px] font-black text-secondary uppercase tracking-widest">
                  Employee & Project
                </th>
                <th className="p-5 text-[10px] font-black text-secondary uppercase tracking-widest hidden md:table-cell">
                  Description
                </th>
                <th className="p-5 text-[10px] font-black text-secondary uppercase tracking-widest hidden lg:table-cell">
                  Timeline
                </th>
                <th className="p-5 text-[10px] font-black text-secondary uppercase tracking-widest hidden lg:table-cell">
                  Assigned By
                </th>
                <th className="p-5 text-[10px] font-black text-secondary uppercase tracking-widest text-center">
                  Status
                </th>
                <th className="p-5 text-[10px] font-black text-secondary uppercase tracking-widest text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan="6" className="p-5">
                      <div className="h-12 bg-gray-100 rounded-2xl" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="p-20 text-center text-secondary/20 font-black italic text-lg uppercase tracking-widest"
                  >
                    No tasks found
                  </td>
                </tr>
              ) : (
                filtered.map((task, i) => (
                  <motion.tr
                    key={task._id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="group hover:bg-gray-50/40 transition-colors"
                  >
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary font-black shrink-0">
                          {task.assignedTo?.name?.charAt(0) || "?"}
                        </div>
                        <div>
                          <div className="text-sm font-black text-primary tracking-tight">
                            {task.assignedTo?.name || "Unassigned"}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Briefcase size={10} className="text-secondary/30" />
                            <span className="text-[10px] font-bold text-secondary/50 uppercase">
                              {task.project?.name || "No Project"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-5 hidden md:table-cell max-w-xs">
                      <p className="text-xs font-medium text-primary/70 line-clamp-2 leading-relaxed">
                        {task.description || "—"}
                      </p>
                      {task.referenceUrl && (
                        <div className="mt-2 flex items-center gap-1.5">
                          <Link size={12} className="text-blue-500 shrink-0" />
                          <a
                            href={task.referenceUrl.startsWith("http") ? task.referenceUrl : `https://${task.referenceUrl}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] font-bold text-blue-600 hover:underline truncate max-w-[200px]"
                          >
                            Reference Link
                          </a>
                        </div>
                      )}
                      {task.attachmentUrl && (
                        <div className="mt-1 flex items-center gap-1.5">
                          <Image size={12} className="text-purple-500 shrink-0" />
                          <a href={task.attachmentUrl} target="_blank" rel="noreferrer" className="text-[11px] font-bold text-purple-600 hover:underline">
                            View Attachment
                          </a>
                        </div>
                      )}
                      {task.status === "Completed" && (task.completionDescription || task.deployedLink) && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-xl space-y-2 border border-gray-100">
                          {task.completionDescription && (
                            <div className="flex items-start gap-2">
                              <FileText size={12} className="text-secondary/40 mt-0.5 shrink-0" />
                              <span className="text-[10px] font-bold text-secondary/80 leading-relaxed">{task.completionDescription}</span>
                            </div>
                          )}
                          {task.deployedLink && (
                            <div className="flex items-center gap-2">
                              <ExternalLink size={12} className="text-primary/60 shrink-0" />
                              <a href={task.deployedLink} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-primary hover:underline truncate max-w-[200px]">
                                {task.deployedLink}
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="p-5 hidden lg:table-cell">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-secondary/50 uppercase">
                          <Clock size={11} className="text-green-500" />
                          <span>
                            {task.assignedAt
                              ? new Date(task.assignedAt).toLocaleDateString()
                              : "N/A"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-secondary/50 uppercase">
                          <AlertCircle size={11} className="text-red-400" />
                          <span>
                            {task.deadline
                              ? new Date(task.deadline).toLocaleDateString()
                              : "No Deadline"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-5 hidden lg:table-cell">
                      <div className="flex items-center gap-2">
                        <User size={12} className="text-secondary/30" />
                        <span className="text-[11px] font-bold text-primary/60">
                          {task.assignedBy?.name || "System"}
                        </span>
                      </div>
                    </td>
                    <td className="p-5 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${statusStyle(
                          task.status
                        )}`}
                      >
                        {statusIcon(task.status)}
                        {task.status || "Pending"}
                      </span>
                    </td>
                    <td className="p-5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEditClick(task)}
                          className="p-2 hover:bg-blue-50 text-blue-600 rounded-xl transition-all"
                          title="Edit Task"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task._id)}
                          className="p-2 hover:bg-red-50 text-red-600 rounded-xl transition-all"
                          title="Delete Task"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assign Task Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl border border-gray-100 space-y-5 relative max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  <ClipboardList size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-primary">Assign New Task</h3>
                  <p className="text-xs text-secondary font-medium">Direct Task Dispatch</p>
                </div>
              </div>
              <button
                onClick={() => setShowAssignModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full text-secondary transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-secondary uppercase tracking-widest">
                  Project (Optional)
                </label>
                <select
                  value={assignForm.projectId}
                  onChange={(e) => {
                    const projId = e.target.value;
                    setAssignForm({ ...assignForm, projectId: projId });
                  }}
                  className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-primary font-bold outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                >
                  <option value="">-- General / Direct Task (No Project) --</option>
                  {projectsList.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-secondary uppercase tracking-widest">
                    Select Employee(s) <span className="text-red-500">*</span>
                  </label>
                  {!editingTaskId && employees.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const allIds = employees.map(e => e._id);
                        const isAllSelected = Array.isArray(assignForm.assignedTo) && assignForm.assignedTo.length === employees.length;
                        setAssignForm({ ...assignForm, assignedTo: isAllSelected ? [] : allIds });
                      }}
                      className="text-[11px] font-black text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition-all"
                    >
                      {Array.isArray(assignForm.assignedTo) && assignForm.assignedTo.length === employees.length ? "Deselect All" : "Select All Employees"}
                    </button>
                  )}
                </div>
                
                {editingTaskId ? (
                  <select
                    required
                    value={assignForm.assignedTo}
                    onChange={(e) => setAssignForm({ ...assignForm, assignedTo: e.target.value })}
                    className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-primary font-bold outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                  >
                    <option value="">-- Choose Employee --</option>
                    {employees.map((e) => (
                      <option key={e._id} value={e._id}>
                        {e.name} ({e.employeeId || "QT-B66A0F"})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-2xl p-3 max-h-48 overflow-y-auto space-y-2">
                    {employees.length === 0 ? (
                      <div className="text-xs text-secondary font-medium p-2 text-center">Loading employees list...</div>
                    ) : (
                      employees.map((e) => {
                        const isSelected = Array.isArray(assignForm.assignedTo)
                          ? assignForm.assignedTo.includes(e._id)
                          : assignForm.assignedTo === e._id;
                        const activeCount = tasks.filter(t => (t.assignedTo?._id === e._id || t.assignedTo === e._id) && ["Pending", "In Progress"].includes(t.status)).length;

                        return (
                          <label
                            key={e._id}
                            className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                              isSelected
                                ? "bg-primary/10 border-primary text-primary font-bold shadow-sm"
                                : "bg-white border-gray-100 text-gray-700 hover:bg-gray-100/60"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(evt) => {
                                  let current = Array.isArray(assignForm.assignedTo)
                                    ? [...assignForm.assignedTo]
                                    : (assignForm.assignedTo ? [assignForm.assignedTo] : []);
                                  if (evt.target.checked) {
                                    if (!current.includes(e._id)) current.push(e._id);
                                  } else {
                                    current = current.filter(id => id !== e._id);
                                  }
                                  setAssignForm({ ...assignForm, assignedTo: current });
                                }}
                                className="w-4 h-4 text-primary rounded focus:ring-primary/20"
                              />
                              <span className="text-xs font-bold">{e.name}</span>
                              <span className="text-[10px] font-semibold text-secondary/60">({e.employeeId || "QT-B66A0F"})</span>
                            </div>
                            {activeCount > 0 && (
                              <span className="text-[10px] font-black px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md">
                                ⚠️ {activeCount} Active
                              </span>
                            )}
                          </label>
                        );
                      })
                    )}
                  </div>
                )}

                {assignForm.assignedTo && (() => {
                  const activeTasks = tasks.filter(t => (t.assignedTo?._id === assignForm.assignedTo || t.assignedTo === assignForm.assignedTo) && ["Pending", "In Progress"].includes(t.status));
                  if (activeTasks.length === 0) return null;
                  return (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs font-semibold flex items-start gap-2.5 animate-fadeIn">
                      <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-black text-amber-800">⚠️ Employee Already Has Active Work!</div>
                        <p className="mt-0.5 text-amber-700">
                          This employee is currently working on <strong>{activeTasks.length} active task/project</strong> ({activeTasks[0]?.project?.name || activeTasks[0]?.description?.slice(0, 30) || "In Progress"}).
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </div>



              <div className="space-y-1.5">
                <label className="text-xs font-bold text-secondary uppercase tracking-widest">
                  Task Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Enter detailed task instructions..."
                  value={assignForm.description}
                  onChange={(e) => setAssignForm({ ...assignForm, description: e.target.value })}
                  className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-primary font-bold outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-secondary uppercase tracking-widest flex items-center gap-1.5">
                  <Link size={14} className="text-blue-500" /> Reference URL / Link (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://figma.com/design-link or https://github.com/..."
                  value={assignForm.referenceUrl}
                  onChange={(e) => setAssignForm({ ...assignForm, referenceUrl: e.target.value })}
                  className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-primary font-bold outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-secondary uppercase tracking-widest flex items-center gap-1.5">
                  <Image size={14} className="text-purple-500" /> Image / Reference File (Optional)
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={(e) => setAssignForm({ ...assignForm, file: e.target.files[0] })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-secondary uppercase tracking-widest">
                  Deadline (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={assignForm.deadline}
                  onChange={(e) => setAssignForm({ ...assignForm, deadline: e.target.value })}
                  className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-primary font-bold outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-5 py-3 bg-gray-100 hover:bg-gray-200 text-secondary rounded-xl text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assignLoading}
                  className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-bold shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
                >
                  <Send size={16} /> {assignLoading ? "Assigning..." : "Assign Task Now"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
