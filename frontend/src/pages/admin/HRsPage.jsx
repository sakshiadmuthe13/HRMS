import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, UserPlus, Edit2, Trash2, Mail, Phone, MapPin, Briefcase, IndianRupee, X, Save, AlertTriangle, Calendar, Award, UserCheck } from "lucide-react";
import DatePicker from "../../components/DatePicker";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

const fetchJson = async (path, opts = {}) => {
  const token = (() => { try { return localStorage.getItem("token") || sessionStorage.getItem("token"); } catch { return null; } })();
  const headers = { ...(opts.headers || {}) };
  if (token && !headers.Authorization && !headers.authorization) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { credentials: "include", ...opts, headers });
  if (!res.ok) {
    let text = await res.text();
    try {
      text = JSON.parse(text);
    } catch {
      // Ignore JSON parse errors, use text as-is
    }
    throw new Error(text?.message || res.statusText || "API error");
  }
  const t = await res.text();
  return t ? JSON.parse(t) : null;
};

const apiGet = (p) => fetchJson(p);
const apiPost = (p, body) => fetchJson(p, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
const apiPut = (p, body) => fetchJson(p, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
const apiDelete = (p) => fetchJson(p, { method: "DELETE" });

const empty = { name: "", email: "", password: "", phone: "", address: "", position: "", salary: "", dateOfBirth: "" };

const formatDateDMY = (dateVal) => {
  if (!dateVal) return "";
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "";
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return "";
  }
};

const HRsPage = () => {
  const [hrs, setHrs] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [leaveAllowanceModal, setLeaveAllowanceModal] = useState(null); // {userId, currentAllowance, name}
  const [newAllowance, setNewAllowance] = useState("");

  useEffect(() => { fetchHRs(); }, []);

  const fetchHRs = async () => {
    setLoading(true); setError("");
    try {
      const res = await apiGet("/admin/hrs");
      setHrs(res || []);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to fetch HRs");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => { setForm(empty); setEditing("new"); };
  const handleEdit = (u) => { setForm({ ...u, password: "", dateOfBirth: u.dateOfBirth ? formatDateDMY(u.dateOfBirth) : "" }); setEditing(u._id); };

  const handleSave = async () => {
    setError("");
    if (!form.name || !form.email || (editing === "new" && !form.password)) {
      setError("Please fill required fields");
      return;
    }

    try {
      if (editing === "new") {
        await apiPost("/admin/hrs", { ...form, role: "hr" });
      } else {
        const payload = { ...form };
        if (!payload.password) delete payload.password;
        await apiPut(`/admin/hrs/${editing}`, payload);
      }
      setEditing(null);
      fetchHRs();
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to save HR");
    }
  };

  const handleDeleteClick = (hr) => setDeleteTarget(hr);
  const confirmDelete = async () => {
    try { await apiDelete(`/admin/hrs/${deleteTarget._id}`); setDeleteTarget(null); fetchHRs(); }
    catch (err) { console.error(err); setError(err.message || "Failed to delete HR"); setDeleteTarget(null); }
  };
  const cancelDelete = () => setDeleteTarget(null);

  return (
    <div className="min-h-screen bg-background text-primary animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
        <div>
          <h2 className="text-4xl font-black text-primary tracking-tight mb-2 flex items-center gap-3">
            <Users size={32} className="text-primary" />
            HR Registry
          </h2>
          <p className="text-secondary font-medium opacity-80">Oversee Human Resource professionals and administrators.</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 bg-primary hover:bg-secondary text-white px-6 py-3 rounded-2xl font-bold shadow-xl shadow-primary/20 transition-all duration-300 active:scale-95"
        >
          <UserPlus size={20} />
          Appoint HR Executive
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-500 border border-red-200 p-4 rounded-2xl mb-6 font-bold flex items-center gap-2">
          <AlertTriangle size={20} />
          {error}
        </div>
      )}

      {/* HRs Table */}
      <div className="bg-white rounded-[2.5rem] shadow-xl shadow-primary/5 border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-20 text-center text-secondary font-bold animate-pulse">
            Compiling HR data...
          </div>
        ) : hrs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-200">
                  <th className="p-5 font-bold text-secondary uppercase tracking-widest text-xs">HR Executive</th>
                  <th className="p-5 font-bold text-secondary uppercase tracking-widest text-xs hidden lg:table-cell">Contact</th>
                  <th className="p-5 font-bold text-secondary uppercase tracking-widest text-xs">Role</th>
                  <th className="p-5 font-bold text-secondary uppercase tracking-widest text-xs text-center">Allowance</th>
                  <th className="p-5 font-bold text-secondary uppercase tracking-widest text-xs text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {hrs.map((e, i) => (
                  <tr key={e._id || i} className="hover:bg-primary/5 transition-colors group">
                    <td className="p-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary font-black text-lg">
                          {e.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-primary text-lg">{e.name}</div>
                          <div className="text-xs text-secondary font-medium mt-0.5">EST: {e.dateOfJoining ? new Date(e.dateOfJoining).getFullYear() : 'N/A'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-5 hidden lg:table-cell">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-secondary font-medium">
                          <Mail size={12} className="text-primary/60" />
                          {e.email}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-secondary font-medium">
                          <Phone size={12} className="text-primary/60" />
                          {e.phone || "No terminal linked"}
                        </div>
                      </div>
                    </td>
                    <td className="p-5">
                      <span className="px-3 py-1 bg-primary/10 text-primary rounded-lg text-[10px] font-black uppercase tracking-widest w-fit">
                        {e.position || "HR Executive"}
                      </span>
                    </td>
                    <td className="p-5 text-center">
                      <button 
                        onClick={() => { setLeaveAllowanceModal({ userId: e._id, currentAllowance: e.leaveAllowance || 12, name: e.name }); setNewAllowance(e.leaveAllowance || 12); }}
                        className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-primary font-black text-xs hover:border-primary transition-all flex items-center gap-2 mx-auto"
                      >
                        <Award size={14} className="text-secondary" />
                        {e.leaveAllowance || 12} DAYS
                      </button>
                    </td>
                    <td className="p-5 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(e)} className="p-2 bg-primary/10 text-primary rounded-xl hover:bg-primary hover:text-white transition-all">
                          <Edit2 size={18} />
                        </button>
                        <button onClick={() => handleDeleteClick(e)} className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-20 text-center text-secondary font-medium">No HR executives registered in the system.</div>
        )}
      </div>

      {/* Edit/Create Modal */}
      <AnimatePresence>
        {editing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/20 backdrop-blur-md p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white p-8 rounded-[2.5rem] w-full max-w-4xl shadow-2xl border border-gray-200 animate-fadeIn max-h-[90vh] overflow-y-auto no-scrollbar"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-3xl font-black text-primary tracking-tight">
                    {editing === "new" ? "New HR Appointment" : "Amend HR Profile"}
                  </h3>
                  <p className="text-secondary font-medium text-sm">Configure HR details.</p>
                </div>
                <button onClick={() => setEditing(null)} className="p-2 hover:bg-gray-50 rounded-full transition-colors">
                  <X size={24} className="text-secondary" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-primary/70 uppercase tracking-widest ml-1">Full Name</label>
                  <input type="text" value={form.name||""} onChange={e=>setForm({...form,name:e.target.value})} placeholder="e.g. John Doe" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-primary font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-primary/70 uppercase tracking-widest ml-1">Email Terminal</label>
                  <input type="email" value={form.email||""} onChange={e=>setForm({...form,email:e.target.value})} placeholder="hr@org.com" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-primary font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-primary/70 uppercase tracking-widest ml-1">Security Key</label>
                  <input type="password" value={form.password||""} onChange={e=>setForm({...form,password:e.target.value})} placeholder="••••••••" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-primary font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-primary/70 uppercase tracking-widest ml-1">Contact No.</label>
                  <input type="text" value={form.phone||""} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="+91 00000 00000" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-primary font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-primary/70 uppercase tracking-widest ml-1">Authority Level</label>
                  <input type="text" value={form.position||""} onChange={e=>setForm({...form,position:e.target.value})} placeholder="e.g. Senior HR" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-primary font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-primary/70 uppercase tracking-widest ml-1">Compensation (₹)</label>
                  <input type="number" value={form.salary||""} onChange={e=>setForm({...form,salary:e.target.value})} placeholder="Annual CTC" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-primary font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-primary/70 uppercase tracking-widest ml-1">Birth Date</label>
                  <DatePicker value={form.dateOfBirth||""} onChange={e=>setForm({...form,dateOfBirth:e})} placeholder="dd/mm/yyyy" />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="block text-xs font-bold text-primary/70 uppercase tracking-widest ml-1">Workplace Address</label>
                  <input type="text" value={form.address||""} onChange={e=>setForm({...form,address:e.target.value})} placeholder="Office coordinates / Personal address" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-primary font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all" />
                </div>
              </div>

              <div className="mt-10 flex justify-end gap-4">
                <button onClick={() => setEditing(null)} className="px-8 py-4 font-bold text-secondary hover:text-primary transition-all">Discard Changes</button>
                <button
                  onClick={handleSave}
                  className="bg-primary hover:bg-secondary text-white px-10 py-4 rounded-2xl font-bold shadow-xl shadow-primary/20 transition-all duration-300 flex items-center gap-2"
                >
                  <Save size={20} />
                  {editing === "new" ? "Appoint HR" : "Synchronize Data"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Leave Allowance Inline Modal */}
      <AnimatePresence>
        {leaveAllowanceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/20 backdrop-blur-md p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white p-8 rounded-[2.5rem] w-full max-w-md shadow-2xl border border-gray-200"
            >
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6">
                <Award size={32} />
              </div>
              <h3 className="text-2xl font-black text-primary tracking-tight mb-2">Leave Allocation</h3>
              <p className="text-secondary font-medium mb-8">Update yearly leave credits for <span className="text-primary font-black">{leaveAllowanceModal.name}</span>.</p>
              
              <div className="space-y-1.5 mb-8 text-left">
                <label className="block text-xs font-bold text-primary/70 uppercase tracking-widest ml-1">Yearly Days</label>
                <input
                  type="number"
                  min="0"
                  value={newAllowance}
                  onChange={e => setNewAllowance(e.target.value)}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-primary font-black text-xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                />
              </div>

              <div className="flex gap-4">
                <button onClick={() => setLeaveAllowanceModal(null)} className="flex-1 px-6 py-4 font-bold text-secondary border border-gray-200 rounded-2xl hover:bg-gray-50 transition-all">Cancel</button>
                <button 
                  onClick={async () => {
                    const allowance = parseInt(newAllowance);
                    if (isNaN(allowance) || allowance < 0) return setError("Invalid allowance");
                    await apiPut(`/admin/users/${leaveAllowanceModal.userId}/leave-allowance`, { leaveAllowance: allowance });
                    setLeaveAllowanceModal(null);
                    fetchHRs();
                  }}
                  className="flex-1 bg-primary hover:bg-secondary text-white px-6 py-4 rounded-2xl font-bold shadow-xl shadow-primary/20 transition-all"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-red-50 backdrop-blur-md p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white p-8 rounded-[2rem] w-full max-w-md shadow-2xl border border-red-50 text-center"
            >
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 size={32} />
              </div>
              <h3 className="text-2xl font-black mb-3 text-primary tracking-tight">Revoke HR Privilege?</h3>
              <p className="text-secondary font-medium mb-8">Are you sure you want to remove <span className="text-primary font-black">{deleteTarget.name}</span>?</p>
              <div className="flex gap-4">
                <button onClick={cancelDelete} className="flex-1 px-6 py-4 font-bold text-secondary border border-gray-200 rounded-2xl hover:bg-gray-50 transition-all">Cancel</button>
                <button onClick={confirmDelete} className="flex-1 bg-red-500 hover:bg-red-500 text-white px-6 py-4 rounded-2xl font-bold shadow-xl shadow-red-500/20 transition-all">Remove</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HRsPage;
