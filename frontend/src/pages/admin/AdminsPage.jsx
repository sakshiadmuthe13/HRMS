"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Plus, Edit2, Trash2, Mail, Phone, MapPin, Briefcase, IndianRupee, X, Save, AlertTriangle } from "lucide-react";
import ProfileAvatar from "../../components/ProfileAvatar";
import UserViewModal from "../../components/UserViewModal";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

const fetchJson = async (path, opts = {}) => {
  // attach Authorization header from stored token if available
  const token = (() => {
    try { return localStorage.getItem("token") || sessionStorage.getItem("token"); } catch { return null; }
  })();
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

const empty = { name: "", email: "", password: "" };

const AdminsPage = () => {
  const [admins, setAdmins] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [viewingUserId, setViewingUserId] = useState(null);

  useEffect(() => { fetchAdmins(); }, []);

  const fetchAdmins = async () => {
    setLoading(true); setError("");
    try { const res = await apiGet("/admin/admins"); setAdmins(res || []); } catch (err) { console.error(err); setError(err.message || "Failed to fetch admins"); } finally { setLoading(false); }
  };

  const handleCreate = () => { setForm(empty); setEditing("new"); };
  const handleEdit = (u) => { setForm({ ...u, password: "" }); setEditing(u._id); };

  const handleSave = async () => {
    setError("");
    if (!form.name || !form.email || (editing === "new" && !form.password)) { setError("Please fill required fields"); return; }
    try {
      if (editing === "new") await apiPost("/admin/admins", { ...form, role: "admin" });
      else {
        const payload = { ...form }; if (!payload.password) delete payload.password; await apiPut(`/admin/admins/${editing}`, payload);
      }
      setEditing(null); fetchAdmins();
    } catch (err) { console.error(err); setError(err.message || "Failed to save admin"); }
  };

  const handleDeleteClick = (admin) => setDeleteTarget(admin);
  const confirmDelete = async () => {
    try { await apiDelete(`/admin/admins/${deleteTarget._id}`); setDeleteTarget(null); fetchAdmins(); }
    catch (err) { console.error(err); setError(err.message || "Failed to delete admin"); setDeleteTarget(null); }
  };
  const cancelDelete = () => setDeleteTarget(null);

  return (
    <div className="min-h-screen bg-background text-primary animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
        <div>
          <h2 className="text-4xl font-black text-primary tracking-tight mb-2 flex items-center gap-3">
            <Shield size={32} className="text-primary" />
            Administrative Council
          </h2>
          <p className="text-secondary font-medium opacity-80">Manage system administrators and high-level permissions.</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 bg-primary hover:bg-secondary text-white px-6 py-3 rounded-2xl font-bold shadow-xl shadow-primary/20 transition-all duration-300 active:scale-95"
        >
          <Plus size={20} />
          Add Administrator
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-500 border border-red-200 p-4 rounded-2xl mb-6 font-bold flex items-center gap-2">
          <AlertTriangle size={20} />
          {error}
        </div>
      )}

      {/* Admins Table */}
      <div className="bg-white rounded-[2.5rem] shadow-xl shadow-primary/5 border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-20 text-center text-secondary font-bold animate-pulse">
            Establishing secure connection to admin registry...
          </div>
        ) : admins.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-200">
                  <th className="p-5 font-bold text-secondary uppercase tracking-widest text-xs">Administrator</th>
                  <th className="p-5 font-bold text-secondary uppercase tracking-widest text-xs hidden lg:table-cell">Contact</th>
                  <th className="p-5 font-bold text-secondary uppercase tracking-widest text-xs">Designation</th>
                  <th className="p-5 font-bold text-secondary uppercase tracking-widest text-xs hidden md:table-cell">Joined On</th>
                  <th className="p-5 font-bold text-secondary uppercase tracking-widest text-xs text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {admins.map((e, i) => (
                  <tr key={e._id || i} className="hover:bg-primary/5 transition-colors group">
                    <td className="p-5">
                      <div className="flex items-center gap-4">
                        <ProfileAvatar user={e} className="w-12 h-12 text-sm" />
                        <div>
                          <div className="font-bold text-primary text-lg">{e.name}</div>
                          <div className="text-xs text-secondary font-medium mt-0.5">UID: {e._id.slice(-6).toUpperCase()}</div>
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
                          {e.phone || "No phone listed"}
                        </div>
                      </div>
                    </td>
                    <td className="p-5">
                      <span className="px-3 py-1 bg-gray-50 text-primary rounded-lg text-[10px] font-black uppercase tracking-widest">
                        {e.position || "Administrator"}
                      </span>
                    </td>
                    <td className="p-5 hidden md:table-cell text-secondary font-medium text-sm">
                      {e.dateOfJoining ? new Date(e.dateOfJoining).toLocaleDateString('en-GB') : "—"}
                    </td>
                    <td className="p-5 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setViewingUserId(e._id)} className="p-2 bg-primary/10 text-primary rounded-xl hover:bg-primary hover:text-white transition-all font-bold text-xs">View</button>
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
          <div className="p-20 text-center text-secondary font-medium">No administrators found in the system.</div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {editing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/20 backdrop-blur-md p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white p-8 rounded-[2.5rem] w-full max-w-2xl shadow-2xl border border-gray-200 animate-fadeIn max-h-[90vh] overflow-y-auto no-scrollbar"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-3xl font-black text-primary tracking-tight">
                  {editing === "new" ? "New Admin Profile" : "Refine Admin Credentials"}
                </h3>
                <button onClick={() => setEditing(null)} className="p-2 hover:bg-gray-50 rounded-full transition-colors">
                  <X size={24} className="text-secondary" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-primary/70 uppercase tracking-widest ml-1">Full Legal Name</label>
                  <input type="text" value={form.name||""} onChange={e=>setForm({...form,name:e.target.value})} placeholder="e.g. Alexander Pierce" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-primary font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-primary/70 uppercase tracking-widest ml-1">Email Address</label>
                  <input type="email" value={form.email||""} onChange={e=>setForm({...form,email:e.target.value})} placeholder="admin@domain.com" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-primary font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-primary/70 uppercase tracking-widest ml-1">Security Access Key</label>
                  <input type="password" value={form.password||""} onChange={e=>setForm({...form,password:e.target.value})} placeholder={editing === "new" ? "Create secure password" : "Leave blank to keep current"} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-primary font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-primary/70 uppercase tracking-widest ml-1">Contact Terminal</label>
                  <input type="text" value={form.phone||""} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="+91 00000 00000" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-primary font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all" />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="block text-xs font-bold text-primary/70 uppercase tracking-widest ml-1">Residential Coordinates</label>
                  <input type="text" value={form.address||""} onChange={e=>setForm({...form,address:e.target.value})} placeholder="Full address details" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-primary font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-primary/70 uppercase tracking-widest ml-1">Position Authority</label>
                  <input type="text" value={form.position||""} onChange={e=>setForm({...form,position:e.target.value})} placeholder="e.g. Chief Systems Officer" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-primary font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-primary/70 uppercase tracking-widest ml-1">Renumeration Scale</label>
                  <div className="relative">
                    <IndianRupee size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary" />
                    <input type="number" value={form.salary||""} onChange={e=>setForm({...form,salary:e.target.value})} placeholder="Annual CTC" className="w-full p-4 pl-10 bg-gray-50 border border-gray-200 rounded-2xl text-primary font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all" />
                  </div>
                </div>
              </div>

              <div className="mt-10 flex justify-end gap-4">
                <button onClick={() => setEditing(null)} className="px-8 py-4 font-bold text-secondary hover:text-primary transition-all">Discard</button>
                <button
                  onClick={handleSave}
                  className="bg-primary hover:bg-secondary text-white px-10 py-4 rounded-2xl font-bold shadow-xl shadow-primary/20 transition-all duration-300 flex items-center gap-2"
                >
                  <Save size={20} />
                  {editing === "new" ? "Finalize Profile" : "Update Credentials"}
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
              <h3 className="text-2xl font-black mb-3 text-primary tracking-tight">Revoke Access?</h3>
              <p className="text-secondary font-medium mb-8">Are you certain you want to delete <span className="text-primary font-black">{deleteTarget.name}</span>? This administrator will lose all system control.</p>
              <div className="flex gap-4">
                <button onClick={cancelDelete} className="flex-1 px-6 py-4 font-bold text-secondary border border-gray-200 rounded-2xl hover:bg-gray-50 transition-all">Cancel</button>
                <button onClick={confirmDelete} className="flex-1 bg-red-500 hover:bg-red-500 text-white px-6 py-4 rounded-2xl font-bold shadow-xl shadow-red-500/20 transition-all">Revoke</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <UserViewModal
        isOpen={Boolean(viewingUserId)}
        onClose={() => setViewingUserId(null)}
        userId={viewingUserId}
      />
    </div>
  );
};

export default AdminsPage;
