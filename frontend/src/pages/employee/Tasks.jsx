import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ListTodo, CheckCircle2, Clock, PlayCircle, AlertCircle, ArrowRight, UserCheck, Layout, CheckCircle, Paperclip, Link, ExternalLink } from "lucide-react";

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
  const [selectedTaskDetails, setSelectedTaskDetails] = useState(null);

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
            <p className="text-xs font-bold text-secondary/60 uppercase tracking-widest mt-1">Personal Worklog & Stage Directives</p>
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
                <th className="p-6 text-[10px] font-black text-secondary uppercase tracking-widest text-right">Commitment / Stage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tasks.length ? tasks.map((t, i) => (
                <motion.tr 
                  key={t._id} 
                  initial={{ opacity: 0, x: -10 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  transition={{ delay: i * 0.05 }}
                  className="transition-colors group hover:bg-gray-50/60 cursor-pointer"
                >
                  <td className="p-6" onClick={() => setSelectedTaskDetails(t)}>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/5 rounded-xl text-primary group-hover:bg-primary group-hover:text-white transition-all"><Layout size={16} /></div>
                      <div>
                        <div className="text-sm font-black text-primary tracking-tight">{t.project?.name || "Independent Task"}</div>
                        <div className="text-[10px] font-bold text-secondary/50 truncate max-w-[200px]">{t.description}</div>
                        {t.referenceUrl && (
                          <div className="mt-1.5 flex items-center gap-1.5 bg-blue-50 border border-blue-100 rounded-lg p-1.5 max-w-max" onClick={(e) => e.stopPropagation()}>
                            <Link size={10} className="text-blue-600" />
                            <a
                              href={t.referenceUrl.startsWith("http") ? t.referenceUrl : `https://${t.referenceUrl}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[9px] font-black text-blue-600 uppercase hover:underline flex items-center gap-1"
                            >
                              Reference Link <ExternalLink size={9} />
                            </a>
                          </div>
                        )}
                        {t.attachmentUrl && (
                          <div className="mt-1.5 flex items-center gap-1.5 bg-gray-50 border border-gray-100 rounded-lg p-1.5 max-w-max" onClick={(e) => e.stopPropagation()}>
                            <Paperclip size={10} className="text-primary" />
                            <a href={t.attachmentUrl} target="_blank" rel="noreferrer" className="text-[9px] font-black text-primary uppercase hover:underline">
                              {t.attachmentName || "View Attachment"}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-6" onClick={() => setSelectedTaskDetails(t)}>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-secondary/10 flex items-center justify-center text-[10px] font-black text-secondary uppercase">{t.assignedBy?.name?.slice(0, 2) || "AD"}</div>
                      <span className="text-[10px] font-black text-secondary uppercase tracking-tighter">{t.assignedBy?.name || "System Admin"}</span>
                    </div>
                  </td>
                  <td className="p-6" onClick={() => setSelectedTaskDetails(t)}>
                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                      t.status === 'Completed' ? 'bg-green-50 text-green-600 border-green-200' :
                      t.status === 'In Progress' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                      t.status === 'R&D' ? 'bg-purple-50 text-purple-600 border-purple-200' :
                      t.status === 'Development' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' :
                      t.status === 'Under Testing' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                      'bg-gray-50 text-gray-600 border-gray-200'
                    }`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="p-6" onClick={() => setSelectedTaskDetails(t)}>
                    <div className="flex items-center gap-2 text-[10px] font-black text-secondary/40 uppercase tracking-tighter">
                      {getCompletionStatus(t) === 'On Time' ? <CheckCircle2 size={12} className="text-green-600" /> : <Clock size={12} />}
                      {getCompletionStatus(t)}
                    </div>
                  </td>
                  <td className="p-6 text-right" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={t.status}
                      onChange={(e) => handleStatusChange(t._id, e.target.value)}
                      className="bg-gray-50 border border-gray-200 text-[10px] font-black text-primary uppercase tracking-widest p-2 rounded-xl outline-none focus:ring-4 focus:ring-primary/10 transition-all cursor-pointer"
                    >
                      <option value="Pending">Hold (Pending)</option>
                      <option value="R&D">R&D (Research)</option>
                      <option value="Development">Development</option>
                      <option value="Under Testing">Under Testing</option>
                      <option value="In Progress">Execute (In Progress)</option>
                      <option value="Completed">Finalize (Completed)</option>
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

      {/* Task Full Details Modal */}
      <AnimatePresence>
        {selectedTaskDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setSelectedTaskDetails(null)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white w-full max-w-2xl p-8 sm:p-10 rounded-[3rem] shadow-2xl border border-gray-100 space-y-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                    <Layout size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-primary tracking-tight">
                      {selectedTaskDetails.project?.name || "Independent Task"}
                    </h3>
                    <p className="text-xs font-bold text-secondary/60 uppercase tracking-widest mt-0.5">
                      Task Directives & Full Details
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTaskDetails(null)}
                  className="p-2 hover:bg-gray-100 rounded-full text-secondary font-black text-sm transition-all"
                >
                  ✕
                </button>
              </div>

              {/* Status and Fulfillment Badges */}
              <div className="flex flex-wrap items-center gap-3">
                <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border ${
                  selectedTaskDetails.status === 'Completed' ? 'bg-green-50 text-green-600 border-green-200' :
                  selectedTaskDetails.status === 'In Progress' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                  selectedTaskDetails.status === 'R&D' ? 'bg-purple-50 text-purple-600 border-purple-200' :
                  selectedTaskDetails.status === 'Development' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' :
                  selectedTaskDetails.status === 'Under Testing' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                  'bg-gray-50 text-gray-600 border-gray-200'
                }`}>
                  Stage: {selectedTaskDetails.status}
                </span>

                <span className="px-4 py-1.5 bg-gray-50 text-secondary border border-gray-200 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-1.5">
                  <Clock size={14} /> Fulfillment: {getCompletionStatus(selectedTaskDetails)}
                </span>
              </div>

              {/* Origin / Leader Details */}
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center text-xs font-black text-secondary uppercase">
                    {selectedTaskDetails.assignedBy?.name?.slice(0, 2) || "AD"}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-secondary/50 uppercase tracking-widest">Assigned By (Originator)</div>
                    <div className="text-sm font-black text-primary">{selectedTaskDetails.assignedBy?.name || "System Admin"}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-secondary/50 uppercase tracking-widest">Assigned On</div>
                  <div className="text-xs font-black text-primary">
                    {selectedTaskDetails.assignedAt ? new Date(selectedTaskDetails.assignedAt).toLocaleDateString() : "N/A"}
                  </div>
                </div>
              </div>

              {/* Work Instructions / Full Description */}
              <div className="space-y-2">
                <h4 className="text-xs font-black text-secondary uppercase tracking-widest">Work Description & Instructions</h4>
                <div className="p-5 bg-blue-50/50 border border-blue-100 rounded-2xl text-sm font-semibold text-primary leading-relaxed whitespace-pre-wrap">
                  {selectedTaskDetails.description}
                </div>
              </div>

              {/* Reference Links & Attachments */}
              <div className="space-y-3">
                {selectedTaskDetails.referenceUrl && (
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-blue-600">
                      <Link size={16} /> Reference Link:
                    </div>
                    <a
                      href={selectedTaskDetails.referenceUrl.startsWith("http") ? selectedTaskDetails.referenceUrl : `https://${selectedTaskDetails.referenceUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-black text-blue-600 underline hover:text-blue-800 truncate max-w-[250px]"
                    >
                      {selectedTaskDetails.referenceUrl}
                    </a>
                  </div>
                )}

                {selectedTaskDetails.attachmentUrl && (
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-primary">
                      <Paperclip size={16} /> Attached File:
                    </div>
                    <a
                      href={selectedTaskDetails.attachmentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-black text-primary underline hover:text-secondary truncate max-w-[250px]"
                    >
                      {selectedTaskDetails.attachmentName || "View Attachment"}
                    </a>
                  </div>
                )}
              </div>

              {/* Completion Notes if Completed */}
              {selectedTaskDetails.status === "Completed" && (
                <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2">
                  <div className="text-xs font-black text-emerald-700 uppercase tracking-widest flex items-center gap-1.5">
                    <CheckCircle2 size={16} /> Completion Submission
                  </div>
                  {selectedTaskDetails.completionDescription && (
                    <p className="text-xs font-semibold text-emerald-800">{selectedTaskDetails.completionDescription}</p>
                  )}
                  {selectedTaskDetails.deployedLink && (
                    <a
                      href={selectedTaskDetails.deployedLink.startsWith("http") ? selectedTaskDetails.deployedLink : `https://${selectedTaskDetails.deployedLink}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-bold text-emerald-700 underline block pt-1"
                    >
                      🚀 Live Link: {selectedTaskDetails.deployedLink}
                    </a>
                  )}
                </div>
              )}

              <div className="pt-2 text-right">
                <button
                  onClick={() => setSelectedTaskDetails(null)}
                  className="px-8 py-3 bg-primary text-white font-black rounded-2xl text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
