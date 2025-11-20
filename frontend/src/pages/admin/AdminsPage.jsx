"use client";

import React, { useEffect, useState } from "react";

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
    <div className="min-h-[calc(100vh-48px)] bg-[#111828] text-[var(--color-text-primary)] p-3 sm:p-4 md:p-6 overflow-x-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6 sm:mb-8 mt-2 sm:mt-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-primary)]">🛡️ Admins</h2>
        <button onClick={handleCreate} className="bg-[var(--color-primary)] hover:bg-[var(--color-secondary)] text-white px-4 py-2 rounded-lg shadow-md transition-all duration-200">+ Create Admin</button>
      </div>

      {error && <p className="text-red-400 bg-[var(--color-surface)] border border-[var(--color-danger)] px-3 py-2 rounded mb-4">⚠️ {error}</p>}

      <div className="card-glow overflow-x-auto no-scrollbar rounded-lg">
        {loading ? (
          <p className="p-6 text-center text-[var(--color-text-secondary)] animate-pulse">Loading admins...</p>
        ) : admins.length > 0 ? (
          <table className="w-full text-left min-w-[600px]">
            <thead className="bg-[rgba(14,166,240,0.1)] text-[var(--color-text-secondary)] text-sm">
              <tr>
                <th className="p-4">Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Phone</th>
                <th className="p-4">Position</th>
                <th className="p-4">Date of Joining</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((e, i) => (
                <tr key={e._id || i} className="border-t border-[rgba(255,255,255,0.1)] hover:bg-[rgba(14,166,240,0.05)] transition-all">
                  <td className="p-4 font-medium">{e.name}</td>
                  <td className="p-4">{e.email}</td>
                  <td className="p-4">{e.phone}</td>
                  <td className="p-4">{e.position}</td>
                  <td className="p-4">{e.dateOfJoining ? new Date(e.dateOfJoining).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : "-"}</td>
                  <td className="p-4 flex justify-end gap-5">
                    <button onClick={() => handleEdit(e)} className="text-[var(--color-primary)] hover:text-[var(--color-secondary)] text-sm font-medium">Edit</button>
                    <button onClick={() => handleDeleteClick(e)} className="text-[var(--color-danger)] hover:underline text-sm font-medium">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <p className="text-center py-6 text-[var(--color-text-secondary)]">No admins found.</p>}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4">
          <div className="bg-[var(--color-surface)] p-4 sm:p-5 md:p-6 rounded-xl w-full max-w-2xl shadow-lg card-glow animate-fadeIn max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-semibold mb-4 text-[var(--color-primary)]">{editing === "new" ? "Create New Admin" : "Edit Admin"}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {["name","email","password","phone","address","position","salary"].map(k => (
                <div key={k}>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1 capitalize">{k}</label>
                  <input type={k==="password"?"password":"text"} value={form[k]||""} onChange={e=>setForm({...form,[k]:e.target.value})} placeholder={`Enter ${k}`} className="w-full p-3 bg-[var(--color-background)] border border-[rgba(255,255,255,0.1)] rounded-md text-[var(--color-text-primary)] focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition-all" />
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={handleSave} className="bg-[var(--color-primary)] hover:bg-[var(--color-secondary)] text-white px-5 py-2 rounded-lg shadow-md transition-all">💾 Save</button>
              <button onClick={() => setEditing(null)} className="px-5 py-2 border border-[rgba(255,255,255,0.1)] rounded-lg hover:bg-[rgba(255,255,255,0.05)] transition">✖ Cancel</button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4">
          <div className="bg-[var(--color-surface)] p-4 sm:p-5 md:p-6 rounded-xl w-full max-w-md shadow-lg card-glow animate-fadeIn">
            <h3 className="text-xl font-semibold mb-4 text-[var(--color-danger)]">⚠️ Confirm Deletion</h3>
            <p className="text-[var(--color-text-secondary)] mb-6">Are you sure you want to delete <span className="font-medium">{deleteTarget.name}</span>? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button onClick={cancelDelete} className="px-4 py-2 border border-[rgba(255,255,255,0.1)] rounded-lg hover:bg-[rgba(255,255,255,0.05)] transition">Cancel</button>
              <button onClick={confirmDelete} className="bg-[var(--color-danger)] hover:bg-[rgba(255,70,56,0.8)] text-white px-4 py-2 rounded-lg shadow-md transition-all">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminsPage;
