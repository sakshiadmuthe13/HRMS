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

const STATUS_OPTIONS = ["All", "Pending", "In Progress", "Completed", "Delayed"];

const statusStyle = (status) => {
  switch (status) {
    case "Completed":
      return "bg-emerald-50 text-emerald-600 border-emerald-100";
    case "In Progress":
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
        <button
          onClick={fetchTasks}
          className="p-3 bg-primary/10 hover:bg-primary/20 rounded-2xl text-primary transition-all"
          title="Refresh"
        >
          <RefreshCw size={20} />
        </button>
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
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan="5" className="p-5">
                      <div className="h-12 bg-gray-100 rounded-2xl" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
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
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
