import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ListTodo, CheckCircle2, Clock, PlayCircle, AlertCircle, ArrowRight, UserCheck, Layout, CheckCircle } from "lucide-react";

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
const apiPatch = (p, body) => fetchJson(p, { method: "PATCH", body: JSON.stringify(body), headers: { "Content-Type": "application/json" } });

export default function EmployeeTasksPage() {
  const [tasks, setTasks] = useState([]);
  const [message, setMessage] = useState("");
  const [completionModal, setCompletionModal] = useState({ isOpen: false, taskId: null, status: null });
  const [completionForm, setCompletionForm] = useState({ description: "", link: "" });

  useEffect(() => { fetchMyTasks(); }, []);

  const fetchMyTasks = async () => {
    try { setTasks((await apiGet("/employee/tasks")) || []); } 
    catch (e) { console.error("Failed to load tasks:", e); }
  };

  const getCompletionStatus = (t) => {
    if (!t?.completedAt) return "In Queue";
    if (!t?.deadline) return "Success";
    return new Date(t.completedAt) > new Date(t.deadline) ? "Delayed" : "On Time";
  };

  const handleStatusChange = async (taskId, status) => {
    if (status === "Completed") {
      setCompletionModal({ isOpen: true, taskId, status });
      setCompletionForm({ description: "", link: "" });
      return;
    }
    await submitStatusChange(taskId, status);
  };

  const submitStatusChange = async (taskId, status, description = "", link = "") => {
    try {
      const payload = { status };
      if (status === "Completed") {
        payload.completionDescription = description;
        payload.deployedLink = link;
      }
      await apiPatch(`/employee/tasks/${taskId}/status`, payload);
      setMessage("Task status synchronized successfully.");
      fetchMyTasks();
      setCompletionModal({ isOpen: false, taskId: null, status: null });
    } catch (e) { setMessage(e.message || "Failed to update status"); }
  };

  return (
    <div className="animate-fadeIn max-w-7xl mx-auto space-y-12 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shrink-0">
            <ListTodo size={28} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-primary tracking-tight">My Tasks</h2>
            <p className="text-xs font-bold text-secondary/60 uppercase tracking-widest mt-1">Personal Worklog</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] shadow-2xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="p-6 text-[10px] font-black text-secondary uppercase tracking-widest">Project Assignment</th>
                <th className="p-6 text-[10px] font-black text-secondary uppercase tracking-widest">Origin</th>
                <th className="p-6 text-[10px] font-black text-secondary uppercase tracking-widest">State</th>
                <th className="p-6 text-[10px] font-black text-secondary uppercase tracking-widest">Fulfillment</th>
                <th className="p-6 text-[10px] font-black text-secondary uppercase tracking-widest text-right">Commitment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tasks.length ? tasks.map((t, i) => (
                <motion.tr 
                  key={t._id} 
                  initial={{ opacity: 0, x: -10 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  transition={{ delay: i * 0.05 }}
                  className="hover:bg-gray-50/50 transition-colors group"
                >
                  <td className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/5 rounded-xl text-primary group-hover:bg-primary group-hover:text-white transition-all"><Layout size={16} /></div>
                      <div>
                        <div className="text-sm font-black text-primary tracking-tight">{t.project?.name || "Independent Task"}</div>
                        <div className="text-[10px] font-bold text-secondary/50 truncate max-w-[200px]">{t.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-secondary/10 flex items-center justify-center text-[10px] font-black text-secondary uppercase">{t.assignedBy?.name?.slice(0, 2) || "AD"}</div>
                      <span className="text-[10px] font-black text-secondary uppercase tracking-tighter">{t.assignedBy?.name || "System Admin"}</span>
                    </div>
                  </td>
                  <td className="p-6">
                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                      t.status === 'Completed' ? 'bg-green-50 text-green-600 border-green-200' :
                      t.status === 'In Progress' ? 'bg-primary/5 text-primary border-primary/10' : 'bg-amber-50 text-amber-600 border-amber-200'
                    }`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-2 text-[10px] font-black text-secondary/40 uppercase tracking-tighter">
                      {getCompletionStatus(t) === 'On Time' ? <CheckCircle2 size={12} className="text-green-600" /> : <Clock size={12} />}
                      {getCompletionStatus(t)}
                    </div>
                  </td>
                  <td className="p-6 text-right">
                    <select
                      value={t.status}
                      onChange={(e) => handleStatusChange(t._id, e.target.value)}
                      className="bg-gray-50 border border-gray-200 text-[10px] font-black text-primary uppercase tracking-widest p-2 rounded-xl outline-none focus:ring-4 focus:ring-primary/10 transition-all cursor-pointer"
                    >
                      <option value="Pending">Hold</option>
                      <option value="In Progress">Execute</option>
                      <option value="Completed">Finalize</option>
                    </select>
                  </td>
                </motion.tr>
              )) : (
                <tr><td colSpan="5" className="p-20 text-center text-secondary/30 font-bold italic">No directives assigned for this period</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {message && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-primary/20 backdrop-blur-md" />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white w-full max-w-sm p-10 rounded-[3rem] shadow-2xl text-center border border-gray-200"
            >
              <div className="w-20 h-20 mx-auto bg-green-50 text-green-600 rounded-3xl flex items-center justify-center mb-6 shadow-lg shadow-green-500/10">
                <CheckCircle size={40} />
              </div>
              <h4 className="text-xl font-black text-primary tracking-tight mb-2 uppercase">Status Synced</h4>
              <p className="text-secondary font-bold text-sm leading-relaxed mb-8 opacity-70">{message}</p>
              <button onClick={() => setMessage("")} className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 active:scale-95 transition-all">CONFIRM</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {completionModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-primary/20 backdrop-blur-md" onClick={() => {
              setCompletionModal({ isOpen: false, taskId: null, status: null });
              fetchMyTasks();
            }} />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white w-full max-w-md p-10 rounded-[3rem] shadow-2xl border border-gray-200"
            >
              <h4 className="text-xl font-black text-primary tracking-tight mb-4 uppercase">Task Completion Details</h4>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-secondary uppercase tracking-widest px-1 block mb-2">What did you do today?</label>
                  <textarea
                    value={completionForm.description}
                    onChange={(e) => setCompletionForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Briefly describe your work..."
                    className="w-full bg-gray-50 border border-gray-200 text-primary font-bold p-4 rounded-2xl min-h-[100px] outline-none focus:ring-4 focus:ring-primary/10 transition-all resize-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-secondary uppercase tracking-widest px-1 block mb-2">Deployed Link (Optional)</label>
                  <input
                    type="url"
                    value={completionForm.link}
                    onChange={(e) => setCompletionForm(f => ({ ...f, link: e.target.value }))}
                    placeholder="https://..."
                    className="w-full bg-gray-50 border border-gray-200 text-primary font-bold p-4 rounded-2xl outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                  />
                </div>
                <div className="flex gap-4 mt-6">
                  <button onClick={() => {
                    setCompletionModal({ isOpen: false, taskId: null, status: null });
                    fetchMyTasks();
                  }} className="flex-1 py-4 bg-gray-100 text-secondary font-black rounded-2xl active:scale-95 transition-all uppercase text-xs">CANCEL</button>
                  <button onClick={() => {
                    submitStatusChange(completionModal.taskId, completionModal.status, completionForm.description, completionForm.link);
                  }} className="flex-1 py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 active:scale-95 transition-all uppercase text-xs">SUBMIT</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
