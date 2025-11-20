"use client";

import React, { useEffect, useState } from "react";
import DatePicker from "../../components/DatePicker";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

const fetchJson = async (path, opts = {}) => {
  const token = (() => { try { return localStorage.getItem("token") || sessionStorage.getItem("token"); } catch { return null; } })();
  const headers = { ...(opts.headers || {}) };
  if (token && !headers.Authorization && !headers.authorization) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    ...opts,
    headers,
  });
  if (!res.ok) {
    let text = await res.text();
    try { text = JSON.parse(text); } catch {
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

const empty = { name: "", email: "", password: "", phone: "", address: "", position: "", salary: "", dateOfBirth: "", reportingManager: "", technicalReporting: "", administrativeReporting: "" };

const EmployeesPage = () => {
  const [employees, setEmployees] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [allUsers, setAllUsers] = useState([]); // For reporting manager dropdowns
  const [leaveAllowanceModal, setLeaveAllowanceModal] = useState(null); // {userId, currentAllowance, name}
  const [newAllowance, setNewAllowance] = useState("");

  useEffect(() => { fetchEmployees(); fetchAllUsers(); }, []);

  const fetchEmployees = async () => {
    setLoading(true); setError("");
    try {
      const res = await apiGet("/admin/employees");
      setEmployees(res || []);
    } catch (err) { setError(err.message || "Failed to fetch employees"); }
    finally { setLoading(false); }
  };

  const fetchAllUsers = async () => {
    try {
      // Fetch all users (employees, leaders, admins) for reporting manager selection
      const [emps, leads, admins] = await Promise.all([
        apiGet("/admin/employees"),
        apiGet("/admin/leaders"),
        apiGet("/admin/admins")
      ]);
      setAllUsers([...(emps || []), ...(leads || []), ...(admins || [])]);
    } catch (err) {
      console.error("Failed to fetch users for dropdowns:", err);
    }
  };

  const handleCreate = () => { setForm(empty); setEditing("new"); };
  const handleEdit = (u) => { setForm({ ...u, password: "" }); setEditing(u._id); };
  const handleSave = async () => {
    setError("");
    if (!form.name || !form.email || (editing === "new" && !form.password)) return setError("Please fill required fields");
    try {
      if (editing === "new") await apiPost("/admin/employees", form);
      else {
        const payload = { ...form }; if (!payload.password) delete payload.password;
        await apiPut(`/admin/employees/${editing}`, payload);
      }
      setEditing(null); fetchEmployees();
    } catch (err) { setError(err.message || "Failed to save employee"); }
  };

  const handleDeleteClick = (employee) => setDeleteTarget(employee);
  const confirmDelete = async () => {
    try { await apiDelete(`/admin/employees/${deleteTarget._id}`); setDeleteTarget(null); fetchEmployees(); }
    catch (err) { setError(err.message || "Failed to delete employee"); setDeleteTarget(null); }
  };
  const cancelDelete = () => setDeleteTarget(null);

  return (
    <div className="min-h-[calc(100vh-48px)] bg-[#111828] text-[var(--color-text-primary)] p-3 sm:p-4 md:p-6 overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6 sm:mb-8 mt-2 sm:mt-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-primary)]">👥 Employees</h2>
        <button onClick={handleCreate} className="bg-[var(--color-primary)] hover:bg-[var(--color-secondary)] text-white px-4 py-2 rounded-lg shadow-md transition-all duration-200">
          + Create Employee
        </button>
      </div>

      {/* Error */}
      {error && <p className="text-red-400 bg-[var(--color-surface)] border border-[var(--color-danger)] px-3 py-2 rounded mb-4">⚠️ {error}</p>}

      {/* Table */}
      <div className="card-glow overflow-x-auto no-scrollbar rounded-lg">
        {loading ? (
          <p className="p-6 text-center text-[var(--color-text-secondary)] animate-pulse">Loading employees...</p>
        ) : employees.length > 0 ? (
          <table className="w-full text-left min-w-[350px] md:min-w-[600px] text-xs md:text-sm">
            <thead className="bg-[rgba(14,166,240,0.1)] text-[var(--color-text-secondary)] text-xs md:text-sm sticky top-0">
              <tr>
                <th className="p-2 md:p-4">Name</th>
                <th className="p-2 md:p-4 hidden md:table-cell">Email</th>
                <th className="p-2 md:p-4 hidden lg:table-cell">Phone</th>
                <th className="p-2 md:p-4">Position</th>
                <th className="p-2 md:p-4 hidden lg:table-cell">Date of Joining</th>
                <th className="p-2 md:p-4 text-center hidden sm:table-cell">Leave</th>
                <th className="p-2 md:p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((e, i) => (
                <tr key={e._id || i} className="border-t border-[rgba(255,255,255,0.1)] hover:bg-[rgba(14,166,240,0.05)] transition-all">
                  <td className="p-2 md:p-4 font-medium truncate">{e.name}</td>
                  <td className="p-2 md:p-4 hidden md:table-cell truncate text-xs md:text-sm">{e.email}</td>
                  <td className="p-2 md:p-4 hidden lg:table-cell text-xs md:text-sm">{e.phone}</td>
                  <td className="p-2 md:p-4 text-xs md:text-sm">{e.position}</td>
                  <td className="p-2 md:p-4 hidden lg:table-cell text-xs md:text-sm">{e.dateOfJoining ? new Date(e.dateOfJoining).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : "-"}</td>
                  <td className="p-2 md:p-4 text-center hidden sm:table-cell">
                    <button onClick={() => { setLeaveAllowanceModal({ userId: e._id, currentAllowance: e.leaveAllowance || 12, name: e.name }); setNewAllowance(e.leaveAllowance || 12); }} className="text-[var(--color-primary)] hover:text-[var(--color-secondary)] text-xs md:text-sm font-medium">
                      {e.leaveAllowance || 12} d
                    </button>
                  </td>
                  <td className="p-2 md:p-4 flex justify-end gap-2 md:gap-6">
                    <button onClick={() => handleEdit(e)} className="text-[var(--color-primary)] hover:text-[var(--color-secondary)] text-xs md:text-sm font-medium">Edit</button>
                    <button onClick={() => handleDeleteClick(e)} className="text-[var(--color-danger)] hover:underline text-xs md:text-sm font-medium">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <p className="text-center py-6 text-[var(--color-text-secondary)]">No employees found.</p>}
      </div>

      {/* Modals */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4">
          <div className="bg-[var(--color-surface)] p-4 sm:p-5 md:p-6 rounded-xl w-full max-w-2xl shadow-lg card-glow animate-fadeIn max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl md:text-2xl font-semibold mb-4 text-[var(--color-primary)]">{editing === "new" ? "Create New Employee" : "Edit Employee"}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              {["name","email","password","phone","address","position","salary"].map(k => (
                <div key={k}>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1 capitalize">{k.replace(/([A-Z])/g, ' $1')}</label>
                  <input type={k==="password"?"password":"text"} value={form[k]||""} onChange={e=>setForm({...form,[k]:e.target.value})} placeholder={`Enter ${k.replace(/([A-Z])/g, ' $1').toLowerCase()}`} className="w-full p-3 bg-[var(--color-background)] border border-[rgba(255,255,255,0.1)] rounded-md text-[var(--color-text-primary)] focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition-all"/>
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Date of birth</label>
                <DatePicker value={form.dateOfBirth||""} onChange={e=>setForm({...form,dateOfBirth:e})} placeholder="dd/mm/yyyy" />
              </div>
              {/* Leave Allowance */}
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  Leave Allowance (days/year)
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.leaveAllowance !== undefined ? form.leaveAllowance : 12}
                  onChange={e=>setForm({...form, leaveAllowance: parseInt(e.target.value) || 0})}
                  placeholder="Enter yearly leave allowance"
                  className="w-full p-3 bg-[var(--color-background)] border border-[rgba(255,255,255,0.1)] rounded-md text-[var(--color-text-primary)] focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition-all"
                />
                <p className="text-xs text-[var(--color-text-secondary)] mt-1">Default: 12 days</p>
              </div>
              {/* Reporting Manager Dropdowns */}
              {["reportingManager","technicalReporting","administrativeReporting"].map(k => (
                <div key={k}>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1 capitalize">{k.replace(/([A-Z])/g, ' $1')}</label>
                  <select value={form[k]||""} onChange={e=>setForm({...form,[k]:e.target.value})} className="w-full p-3 bg-[var(--color-background)] border border-[rgba(255,255,255,0.1)] rounded-md text-[var(--color-text-primary)] focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition-all">
                    <option value="">-- Select {k.replace(/([A-Z])/g, ' $1')} --</option>
                    {allUsers.map(u => (
                      <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-col md:flex-row justify-end gap-2 md:gap-3">
              <button onClick={handleSave} className="bg-[var(--color-primary)] hover:bg-[var(--color-secondary)] text-white px-4 md:px-5 py-2 rounded-lg shadow-md transition-all text-sm md:text-base">💾 Save</button>
              <button onClick={() => setEditing(null)} className="px-4 md:px-5 py-2 border border-[rgba(255,255,255,0.1)] rounded-lg hover:bg-[rgba(255,255,255,0.05)] transition text-sm md:text-base">✖ Cancel</button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4">
          <div className="bg-[var(--color-surface)] p-4 sm:p-5 md:p-6 rounded-xl w-full max-w-md shadow-lg card-glow animate-fadeIn">
            <h3 className="text-lg md:text-xl font-semibold mb-4 text-[var(--color-danger)]">⚠️ Confirm Deletion</h3>
            <p className="text-sm md:text-base text-[var(--color-text-secondary)] mb-6">Are you sure you want to delete <span className="font-medium">{deleteTarget.name}</span>? This action cannot be undone.</p>
            <div className="flex flex-col md:flex-row justify-end gap-2 md:gap-3">
              <button onClick={cancelDelete} className="px-3 md:px-4 py-2 border border-[rgba(255,255,255,0.1)] rounded-lg hover:bg-[rgba(255,255,255,0.05)] transition text-sm md:text-base order-2 md:order-1">Cancel</button>
              <button onClick={confirmDelete} className="bg-[var(--color-danger)] hover:bg-[rgba(255,70,56,0.8)] text-white px-3 md:px-4 py-2 rounded-lg shadow-md transition-all text-sm md:text-base order-1 md:order-2">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Leave Allowance Modal */}
      {leaveAllowanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4">
          <div className="bg-[var(--color-surface)] p-4 sm:p-5 md:p-6 rounded-xl w-full max-w-md shadow-lg card-glow animate-fadeIn">
            <h3 className="text-xl font-semibold mb-4 text-[var(--color-primary)]">📅 Update Leave Allowance</h3>
            <p className="text-[var(--color-text-secondary)] mb-4">
              Update yearly leave allowance for <span className="font-medium text-[var(--color-text-primary)]">{leaveAllowanceModal.name}</span>
            </p>
            <div className="mb-6">
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Yearly Leave Allowance (days)</label>
              <input
                type="number"
                min="0"
                value={newAllowance}
                onChange={e => setNewAllowance(e.target.value)}
                className="w-full p-3 bg-[var(--color-background)] border border-[rgba(255,255,255,0.1)] rounded-md text-[var(--color-text-primary)] focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition-all"
                placeholder="Enter leave allowance"
              />
              <p className="text-xs text-[var(--color-text-secondary)] mt-2">Current allowance: {leaveAllowanceModal.currentAllowance} days</p>
            </div>
            <div className="flex flex-col md:flex-row justify-end gap-2 md:gap-3">
              <button
                onClick={async () => {
                  try {
                    const allowance = parseInt(newAllowance);
                    if (isNaN(allowance) || allowance < 0) {
                      setError("Please enter a valid positive number");
                      return;
                    }
                    await apiPut(`/admin/users/${leaveAllowanceModal.userId}/leave-allowance`, { leaveAllowance: allowance });
                    setLeaveAllowanceModal(null);
                    setNewAllowance("");
                    fetchEmployees();
                  } catch (err) {
                    setError(err.message || "Failed to update leave allowance");
                    setLeaveAllowanceModal(null);
                  }
                }}
                className="bg-[var(--color-primary)] hover:bg-[var(--color-secondary)] text-white px-4 md:px-5 py-2 rounded-lg shadow-md transition-all text-sm md:text-base order-2 md:order-1"
              >
                💾 Save
              </button>
              <button
                onClick={() => { setLeaveAllowanceModal(null); setNewAllowance(""); }}
                className="px-4 md:px-5 py-2 border border-[rgba(255,255,255,0.1)] rounded-lg hover:bg-[rgba(255,255,255,0.05)] transition text-sm md:text-base order-1 md:order-2"
              >
                ✖ Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeesPage;
