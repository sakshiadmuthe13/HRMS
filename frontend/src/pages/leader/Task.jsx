import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Layout, User, Clock, AlertCircle, Send, History, Filter, ClipboardCheck, ExternalLink, FileText, Paperclip } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

const fetchJson = async (path, opts = {}) => {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
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
const apiPost = (p, body) => fetchJson(p, { method: "POST", body: JSON.stringify(body), headers: { "Content-Type": "application/json" } });

export default function AssignTaskPage() {
  const [projects, setProjects] = useState([]);
  const [teammates, setTeammates] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [form, setForm] = useState({ project: "", assignedTo: "", description: "", deadline: "", file: null });

  useEffect(() => { fetchProjects(); fetchMyTasks(); }, []);
  useEffect(() => { if (form.project) fetchTeammates(form.project); else setTeammates([]); }, [form.project]);

  const fetchProjects = async () => { try { setProjects(await apiGet("/leader/projects") || []); } catch (e) { console.error(e); } };
  const fetchTeammates = async (projectId) => { try { setTeammates(await apiGet(`/leader/team-members?projectId=${projectId}`) || []); } catch (e) { console.error(e); setTeammates([]); } };
  const fetchMyTasks = async () => { try { setTasks(await apiGet("/leader/my-assigned-tasks") || []); } catch (e) { console.error(e); } };

  const assignTask = async () => {
    if (!form.project || !form.assignedTo || !form.description.trim()) {
      setSuccessMessage("Please complete all fields.");
      return;
    }
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("projectId", form.project);
      formData.append("assignedTo", form.assignedTo);
      formData.append("description", form.description);
      if (form.deadline) {
        formData.append("deadline", new Date(form.deadline).toISOString());
      }
      if (form.file) {
        formData.append("file", form.file);
      }

      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const headers = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/leader/assign-task`, {
        method: "POST",
        body: formData,
        headers,
        credentials: "include",
      });
      if (!res.ok) {
        let text = await res.text();
        try { text = JSON.parse(text); } catch { }
        throw new Error(text?.message || res.statusText || "API error");
      }

      setForm({ project: "", assignedTo: "", description: "", deadline: "", file: null });
      fetchMyTasks();
      setSuccessMessage("Task assigned successfully.");
    } catch (e) { setSuccessMessage(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="animate-fadeIn max-w-7xl mx-auto space-y-12 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shrink-0">
            <ClipboardCheck size={28} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-primary tracking-tight">Assign Tasks</h2>
            <p className="text-xs font-bold text-secondary/60 uppercase tracking-widest mt-1">Task Assignment & Tracking</p>
          </div>
        </div>
        <div className="p-3 bg-primary/10 rounded-2xl text-primary"><Send size={24} /></div>
      </div>

      {/* Task Dispatcher Form */}
      <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-gray-200 space-y-10">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/5 rounded-2xl text-primary"><Layout size={20} /></div>
          <h3 className="text-xl font-black text-primary tracking-tight">New Task</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-secondary uppercase tracking-widest px-1">Project</label>
            <select
              value={form.project}
              onChange={e => setForm(f => ({ ...f, project: e.target.value, assignedTo: "" }))}
              className="w-full bg-gray-50 border border-gray-200 text-primary font-bold p-4 rounded-2xl outline-none focus:ring-4 focus:ring-primary/10 transition-all appearance-none"
            >
              <option value="">Select Project</option>
              {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-secondary uppercase tracking-widest px-1">Assignee</label>
            <select
              value={form.assignedTo}
              onChange={e => setForm(f => ({ ...f, assignedTo: e.target.value }))}
              className="w-full bg-gray-50 border border-gray-200 text-primary font-bold p-4 rounded-2xl outline-none focus:ring-4 focus:ring-primary/10 transition-all appearance-none disabled:opacity-50"
              disabled={!form.project || teammates.length === 0}
            >
              <option value="">{form.project ? (teammates.length ? "Select Teammate" : "No teammates found") : "Select project first"}</option>
              {teammates.map(t => (
                <option key={t._id} value={t._id} disabled={t.isOnHoliday} className={t.isOnHoliday ? "text-red-400 font-normal" : ""}>
                  {t.name} {t.isOnHoliday ? " (On Holiday / Leave)" : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-secondary uppercase tracking-widest px-1">Task Deadline</label>
            <input
              type="datetime-local"
              value={form.deadline}
              onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
              className="w-full bg-gray-50 border border-gray-200 text-primary font-bold p-4 rounded-2xl outline-none focus:ring-4 focus:ring-primary/10 transition-all"
            />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-secondary uppercase tracking-widest px-1">Task Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full bg-gray-50 border border-gray-200 text-primary font-bold p-4 rounded-2xl outline-none focus:ring-4 focus:ring-primary/10 transition-all min-h-[120px]"
              placeholder="Detailed instructions..."
            />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-secondary uppercase tracking-widest px-1">Attachment</label>
            <label className="flex items-center gap-3 w-full bg-gray-50 border border-gray-200 text-primary font-bold p-4 rounded-2xl cursor-pointer hover:bg-gray-100 transition-all">
              <Paperclip size={16} />
              <span className="text-xs truncate">{form.file ? form.file.name : "Upload File (Optional)"}</span>
              <input type="file" onChange={e => setForm(f => ({ ...f, file: e.target.files[0] }))} className="hidden" />
            </label>
          </div>

          <div className="flex items-end">
            <button onClick={assignTask} disabled={loading} className="w-full px-12 py-5 bg-primary text-white font-black rounded-3xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3">
              {loading ? "Processing..." : <><Send size={16} /> Assign Task</>}
            </button>
          </div>
        </div>
      </div>

      {/* Operational Ledger */}
      <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-gray-200 space-y-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-secondary/10 rounded-2xl text-secondary"><History size={20} /></div>
            <h3 className="text-xl font-black text-primary tracking-tight">Assigned Tasks Log</h3>
          </div>
          <div className="flex gap-4">
            <div className="px-6 py-2 bg-gray-50 border border-gray-200 rounded-xl text-[10px] font-black text-secondary/40 uppercase tracking-widest flex items-center gap-2"><Filter size={12} /> Filtered Views</div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="p-6 text-[10px] font-black text-secondary uppercase tracking-widest">Project & Assignee</th>
                <th className="p-6 text-[10px] font-black text-secondary uppercase tracking-widest hidden lg:table-cell">Timeline</th>
                <th className="p-6 text-[10px] font-black text-secondary uppercase tracking-widest text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tasks.length === 0 ? (
                <tr><td colSpan="3" className="p-20 text-center text-secondary/20 font-black italic">No tasks assigned yet</td></tr>
              ) : (
                tasks.map((t, i) => (
                  <motion.tr key={t._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="group transition-colors">
                    <td className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-xs uppercase">{t.assignedTo?.name?.charAt(0) || "?"}</div>
                        <div>
                          <p className="text-xs font-black text-primary">{t.assignedTo?.name || "Unknown"}</p>
                          <p className="text-[10px] font-bold text-secondary/50 truncate max-w-[150px]">{t.description}</p>
                          {t.project?.name && (
                            <p className="text-[9px] font-bold text-secondary/40 mt-0.5">Project: {t.project.name}</p>
                          )}
                          {t.attachmentUrl && (
                            <div className="mt-1.5 flex items-center gap-1.5 bg-gray-50 border border-gray-100 rounded-lg p-1.5 max-w-max">
                              <Paperclip size={10} className="text-primary" />
                              <a href={t.attachmentUrl} target="_blank" rel="noreferrer" className="text-[9px] font-black text-primary uppercase hover:underline">
                                {t.attachmentName || "View Attachment"}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-6 hidden lg:table-cell">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-secondary/60 uppercase">
                          <Clock size={12} className="text-green-600" />
                          <span>Started: {t.assignedAt ? new Date(t.assignedAt).toLocaleDateString() : 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-secondary/60 uppercase">
                          <AlertCircle size={12} className="text-red-500" />
                          <span>Deadline: {t.deadline ? new Date(t.deadline).toLocaleDateString() : 'Continuous'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-6 text-center">
                      <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                        t.status === "Completed" ? "bg-green-50 text-green-600 border-green-200" :
                        t.status === "In Progress" ? "bg-amber-50 text-amber-600 border-amber-200" :
                        "bg-red-50 text-red-500 border-red-200"
                      }`}>{t.status || "Pending"}</span>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Success Notification Modal */}
      <AnimatePresence>
        {successMessage && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSuccessMessage("")} className="absolute inset-0 bg-primary/20 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative bg-white p-12 rounded-[3.5rem] shadow-2xl border border-gray-200 max-w-md w-full text-center space-y-8">
              <div className="flex justify-center">
                <div className="p-6 bg-green-50 text-green-600 rounded-[2rem]">
                  <CheckCircle2 size={48} />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-black text-primary uppercase tracking-tight mb-2">Notification</h3>
                <p className="text-sm font-bold text-secondary/60 leading-relaxed">{successMessage}</p>
              </div>
              <button onClick={() => setSuccessMessage("")} className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 transition-all uppercase tracking-widest text-[10px]">Acknowledge</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
