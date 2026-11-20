import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Calendar, X, ExternalLink, Image, CheckCircle2, User, Layers, FileText } from "lucide-react";
import ProfileAvatar from "./ProfileAvatar";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

const fetchJson = async (path, opts = {}) => {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  const headers = { ...(opts.headers || {}) };
  if (token && !headers.Authorization && !headers.authorization) {
    headers.Authorization = `Bearer ${token}`;
  }
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

export default function ProjectLogsModal({ isOpen, onClose, project }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUserFilter, setSelectedUserFilter] = useState("All");

  const role = localStorage.getItem("role") || "admin";
  const prefix = role === "leader" ? "/leader" : (role === "employee" ? "/employee" : "/admin");

  useEffect(() => {
    if (isOpen && project) {
      fetchProjectLogs();
    } else {
      setLogs([]);
    }
  }, [isOpen, project]);

  const fetchProjectLogs = async () => {
    setLoading(true);
    try {
      const projId = project._id || project.id || project.projectId;
      const res = await fetchJson(`${prefix}/work-logs?projectId=${projId}&date=all`);
      setLogs(Array.isArray(res) ? res : []);
    } catch (e) {
      console.error("Failed to load project work logs:", e);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !project) return null;

  // Flatten entries across user logs
  const allEntries = logs.flatMap((userLog) =>
    (userLog.entries || []).map((entry) => ({
      ...entry,
      user: userLog.user,
      date: userLog.date,
    }))
  ).sort((a, b) => new Date(b.date + " " + (b.createdAt || "")) - new Date(a.date + " " + (a.createdAt || "")));

  // Extract unique team members from logs
  const uniqueUsers = Array.from(
    new Set(allEntries.map((e) => e.user?._id).filter(Boolean))
  ).map((id) => allEntries.find((e) => e.user?._id === id)?.user);

  const filteredEntries = selectedUserFilter === "All"
    ? allEntries
    : allEntries.filter((e) => e.user?._id === selectedUserFilter);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative bg-white w-full max-w-4xl p-6 sm:p-8 rounded-[2.5rem] shadow-2xl border border-gray-100 space-y-6 max-h-[90vh] overflow-y-auto"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shrink-0">
                <Layers size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-primary tracking-tight">
                  {project.name || project.title || "Project Activity Audit Logs"}
                </h3>
                <p className="text-xs font-bold text-secondary/60 uppercase tracking-widest mt-0.5">
                  Detailed Work Updates & Activity Timeline
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full text-secondary font-black text-sm transition-all"
            >
              <X size={20} />
            </button>
          </div>

          {/* Member Filter Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
            <div className="text-xs font-bold text-secondary flex items-center gap-2">
              <Clock size={16} className="text-primary" />
              <span>Total Activity Logs Recorded: <strong className="text-primary font-black">{filteredEntries.length}</strong></span>
            </div>

            {uniqueUsers.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-secondary uppercase tracking-widest">Filter Member:</span>
                <select
                  value={selectedUserFilter}
                  onChange={(e) => setSelectedUserFilter(e.target.value)}
                  className="p-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-primary outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="All">All Team Members ({uniqueUsers.length})</option>
                  {uniqueUsers.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name} ({u.position || "Member"})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Activity Logs Timeline */}
          {loading ? (
            <div className="py-20 text-center text-secondary font-bold animate-pulse">
              Loading project work activity logs...
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="py-20 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200 text-center">
              <FileText size={40} className="mx-auto text-secondary/30 mb-3" />
              <h4 className="text-base font-black text-primary">No Work Logs Recorded Yet</h4>
              <p className="text-xs text-secondary/60 font-bold mt-1">
                Team members will log their hourly project progress here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEntries.map((entry, idx) => (
                <div
                  key={`${entry._id || idx}`}
                  className="p-5 bg-white border border-gray-150 rounded-2xl shadow-sm hover:shadow-md hover:border-primary/30 transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                    {/* User Profile */}
                    <div className="flex items-center gap-3">
                      <ProfileAvatar user={entry.user} className="w-10 h-10 text-xs" />
                      <div>
                        <div className="text-sm font-black text-primary">{entry.user?.name || "Employee"}</div>
                        <div className="text-[10px] font-bold text-secondary/60 uppercase tracking-wider">
                          {entry.user?.position || "Developer"}
                        </div>
                      </div>
                    </div>

                    {/* Date and Time Slot */}
                    <div className="flex items-center gap-2 text-xs font-mono font-bold">
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg border border-gray-200 flex items-center gap-1">
                        <Calendar size={12} /> {entry.date}
                      </span>
                      <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg border border-blue-200">
                        {entry.timeSlot}
                      </span>
                    </div>
                  </div>

                  {/* Task Title if assigned */}
                  {entry.task && (
                    <div className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100 w-fit">
                      🎯 Task: {entry.task.description || entry.task}
                    </div>
                  )}

                  {/* Work Description */}
                  <p className="text-sm font-semibold text-primary/90 leading-relaxed whitespace-pre-wrap">
                    {entry.activity}
                  </p>

                  {/* Links & Screenshot Gallery */}
                  <div className="flex flex-wrap items-center gap-4 pt-1">
                    {entry.linkUrl && (
                      <a
                        href={entry.linkUrl.startsWith("http") ? entry.linkUrl : `https://${entry.linkUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200 transition-all"
                      >
                        <ExternalLink size={14} /> Live Deployment Link
                      </a>
                    )}

                    {((Array.isArray(entry.attachments) && entry.attachments.length > 0) || entry.attachmentUrl) && (
                      <div className="flex flex-wrap gap-2">
                        {(Array.isArray(entry.attachments) && entry.attachments.length > 0
                          ? entry.attachments
                          : [entry.attachmentUrl]
                        ).map((imgUrl, i) => (
                          <a key={i} href={imgUrl} target="_blank" rel="noreferrer" className="block">
                            <img
                              src={imgUrl}
                              alt={`Screenshot ${i + 1}`}
                              className="h-16 w-auto rounded-xl object-cover border border-gray-200 shadow-sm hover:scale-105 transition-all"
                            />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-2 text-right border-t border-gray-100">
            <button
              onClick={onClose}
              className="px-8 py-3 bg-primary text-white font-black rounded-2xl text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
