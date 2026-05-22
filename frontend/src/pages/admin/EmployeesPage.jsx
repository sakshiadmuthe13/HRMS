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
    <div className="min-h-screen bg-background text-primary animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
        <div>
          <h2 className="text-4xl font-black text-primary tracking-tight mb-2">Employees</h2>
          <p className="text-secondary font-medium opacity-80">Manage your organization's workforce.</p>
        </div>
        <button 
          onClick={handleCreate} 
          className="bg-primary hover:bg-secondary text-white px-6 py-3 rounded-2xl font-bold shadow-xl shadow-primary/20 transition-all duration-300 active:scale-95"
        >
          + Add Employee
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 text-red-500 border border-red-200 p-4 rounded-2xl mb-6 font-bold flex items-center gap-2">
          <span>⚠️</span> {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-[2rem] shadow-xl shadow-primary/5 border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-20 text-center text-secondary font-bold animate-pulse">
            Retrieving personnel records...
          </div>
        ) : employees.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-200">
                  <th className="p-5 font-bold text-secondary uppercase tracking-widest text-xs">Name</th>
                  <th className="p-5 font-bold text-secondary uppercase tracking-widest text-xs hidden md:table-cell">Email</th>
                  <th className="p-5 font-bold text-secondary uppercase tracking-widest text-xs">Position</th>
                  <th className="p-5 font-bold text-secondary uppercase tracking-widest text-xs hidden lg:table-cell">Joining Date</th>
                  <th className="p-5 font-bold text-secondary uppercase tracking-widest text-xs text-center hidden sm:table-cell">Leave</th>
                  <th className="p-5 font-bold text-secondary uppercase tracking-widest text-xs text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {employees.map((e, i) => (
                  <tr key={e._id || i} className="hover:bg-primary/5 transition-colors group">
                    <td className="p-5">
                      <div className="font-bold text-primary">{e.name}</div>
                      <div className="text-xs text-secondary md:hidden">{e.email}</div>
                    </td>
                    <td className="p-5 hidden md:table-cell text-secondary font-medium">{e.email}</td>
                    <td className="p-5">
                      <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-wider">
                        {e.position}
                      </span>
                    </td>
                    <td className="p-5 hidden lg:table-cell text-secondary font-medium">
                      {e.dateOfJoining ? new Date(e.dateOfJoining).toLocaleDateString('en-GB') : "-"}
                    </td>
                    <td className="p-5 text-center hidden sm:table-cell font-bold text-primary">
                      <button onClick={() => { setLeaveAllowanceModal({ userId: e._id, currentAllowance: e.leaveAllowance || 12, name: e.name }); setNewAllowance(e.leaveAllowance || 12); }} className="hover:text-secondary transition">
                        {e.leaveAllowance || 12}d
                      </button>
                    </td>
                    <td className="p-5 text-right">
                      <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(e)} className="p-2 bg-primary/10 text-primary rounded-xl hover:bg-primary hover:text-white transition-all font-bold">Edit</button>
                        <button onClick={() => handleDeleteClick(e)} className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all font-bold">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-20 text-center text-secondary font-medium">No employees found in the directory.</div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/20 backdrop-blur-md p-4">
          <div className="bg-white p-8 rounded-[2.5rem] w-full max-w-3xl shadow-2xl border border-gray-200 animate-fadeIn max-h-[90vh] overflow-y-auto no-scrollbar">
            <h3 className="text-3xl font-black mb-8 text-primary tracking-tight">
              {editing === "new" ? "New Professional Profile" : "Refine Profile"}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {["name","email","password","phone","address","position","salary"].map(k => (
                <div key={k} className="space-y-1.5">
                  <label className="block text-xs font-bold text-primary/70 uppercase tracking-widest ml-1">{k.replace(/([A-Z])/g, ' $1')}</label>
                  <input 
                    type={k==="password"?"password":"text"} 
                    value={form[k]||""} 
                    onChange={e=>setForm({...form,[k]:e.target.value})} 
                    placeholder={`Employee ${k}`} 
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-primary font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                  />
                </div>
              ))}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-primary/70 uppercase tracking-widest ml-1">Date of Birth</label>
                <DatePicker value={form.dateOfBirth||""} onChange={e=>setForm({...form,dateOfBirth:e})} />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-primary/70 uppercase tracking-widest ml-1">Leave Allowance (Days)</label>
                <input
                  type="number"
                  min="0"
                  value={form.leaveAllowance !== undefined ? form.leaveAllowance : 12}
                  onChange={e=>setForm({...form, leaveAllowance: parseInt(e.target.value) || 0})}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-primary font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                />
              </div>
              {["reportingManager","technicalReporting","administrativeReporting"].map(k => (
                <div key={k} className="space-y-1.5">
                  <label className="block text-xs font-bold text-primary/70 uppercase tracking-widest ml-1">{k.replace(/([A-Z])/g, ' $1')}</label>
                  <select value={form[k]||""} onChange={e=>setForm({...form,[k]:e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-primary font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all">
                    <option value="">-- Select Authority --</option>
                    {allUsers.map(u => (
                      <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            <div className="mt-10 flex justify-end gap-4">
              <button onClick={() => setEditing(null)} className="px-8 py-4 font-bold text-secondary hover:text-primary transition-all">Discard</button>
              <button onClick={handleSave} className="bg-primary hover:bg-secondary text-white px-10 py-4 rounded-2xl font-bold shadow-xl shadow-primary/20 transition-all duration-300">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-red-50 backdrop-blur-md p-4">
          <div className="bg-white p-8 rounded-[2rem] w-full max-w-md shadow-2xl border border-red-50 animate-fadeIn text-center">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">⚠️</div>
            <h3 className="text-2xl font-black mb-3 text-primary tracking-tight">Confirm Deletion</h3>
            <p className="text-secondary font-medium mb-8">Are you certain you want to remove <span className="text-primary font-black">{deleteTarget.name}</span> from the system? This process is irreversible.</p>
            <div className="flex gap-4">
              <button onClick={cancelDelete} className="flex-1 px-6 py-4 font-bold text-secondary border border-gray-200 rounded-2xl hover:bg-gray-50 transition-all">Cancel</button>
              <button onClick={confirmDelete} className="flex-1 bg-red-500 hover:bg-red-500 text-white px-6 py-4 rounded-2xl font-bold shadow-xl shadow-red-500/20 transition-all">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Leave Allowance Modal */}
      {leaveAllowanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/20 backdrop-blur-md p-4">
          <div className="bg-white p-8 rounded-[2rem] w-full max-w-md shadow-2xl border border-gray-200 animate-fadeIn">
            <h3 className="text-2xl font-black mb-2 text-primary tracking-tight">Update Allocation</h3>
            <p className="text-secondary font-medium mb-8">Yearly leave allowance for <span className="text-primary font-black">{leaveAllowanceModal.name}</span>.</p>
            <div className="space-y-4 mb-8">
              <label className="block text-xs font-bold text-primary/70 uppercase tracking-widest ml-1">Annual Allowance (Days)</label>
              <input
                type="number"
                min="0"
                value={newAllowance}
                onChange={e => setNewAllowance(e.target.value)}
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-primary font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
              />
            </div>
            <div className="flex gap-4">
              <button onClick={() => { setLeaveAllowanceModal(null); setNewAllowance(""); }} className="flex-1 px-6 py-4 font-bold text-secondary border border-gray-200 rounded-2xl hover:bg-gray-50 transition-all">Discard</button>
              <button
                onClick={async () => {
                  try {
                    const allowance = parseInt(newAllowance);
                    if (isNaN(allowance) || allowance < 0) { setError("Please enter a valid positive number"); return; }
                    await apiPut(`/admin/users/${leaveAllowanceModal.userId}/leave-allowance`, { leaveAllowance: allowance });
                    setLeaveAllowanceModal(null); setNewAllowance(""); fetchEmployees();
                  } catch (err) { setError(err.message || "Failed to update leave allowance"); setLeaveAllowanceModal(null); }
                }}
                className="flex-1 bg-primary hover:bg-secondary text-white px-6 py-4 rounded-2xl font-bold shadow-xl shadow-primary/20 transition-all"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeesPage;
