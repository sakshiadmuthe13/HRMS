"use client";

import React, { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

const fetchJson = async (path, opts = {}) => {
  const token = (() => {
    try { return localStorage.getItem("token") || sessionStorage.getItem("token"); } catch { return null; }
  })();
  const headers = { ...(opts.headers || {}) };
  if (token && !headers.Authorization && !headers.authorization)
    headers.Authorization = `Bearer ${token}`;

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
const apiPost = (p, body) =>
  fetchJson(p, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
const apiDelete = (p) => fetchJson(p, { method: "DELETE" });
const apiPut = (p, body) =>
  fetchJson(p, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

const emptyForm = { name: "", leader: "", members: [] };

const TeamsPage = () => {
  const [teams, setTeams] = useState([]);
  const [leaders, setLeaders] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingTeam, setEditingTeam] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true); setError("");
    try {
      const [teamsData, leadersData, employeesData] = await Promise.all([
        apiGet("/admin/teams"),
        apiGet("/admin/leaders"),
        apiGet("/admin/employees"),
      ]);
      setTeams(teamsData || []);
      setLeaders(leadersData || []);
      setEmployees(employeesData || []);
    } catch (err) {
      setError(err.message || "Failed to load data");
    } finally { setLoading(false); }
  };

  const handleCreate = () => {
    setForm(emptyForm);
    setEditingTeam(null);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.leader) {
      setError("Please fill all required fields");
      return;
    }
    try {
      if (editingTeam) {
        await apiPut(`/admin/teams/${editingTeam._id}`, form);
      } else {
        await apiPost("/admin/teams", form);
      }
      setEditingTeam(null);
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to save team");
    }
  };

  const handleEdit = (team) => {
    setEditingTeam(team);
    setForm({
      name: team.name,
      leader: team.leader?._id || "",
      members: team.members.map((m) => m._id),
      projects: team.projects.map((p) => p._id),
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (team) => setDeleteTarget(team);
  const confirmDelete = async () => {
    try {
      await apiDelete(`/admin/teams/${deleteTarget._id}`);
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to delete team");
    }
  };
  const cancelDelete = () => setDeleteTarget(null);

  const toggleMember = (id) => {
    setForm((prev) => ({
      ...prev,
      members: prev.members.includes(id)
        ? prev.members.filter((m) => m !== id)
        : [...prev.members, id],
    }));
  };

  return (
    <div className="min-h-[calc(100vh-48px)] bg-[#111828] text-[var(--color-text-primary)] p-3 sm:p-4 md:p-6 overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6 sm:mb-8 mt-2 sm:mt-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#0EA6F0]">👥 Teams</h2>
        <button
          onClick={handleCreate}
          className="bg-[#0EA6F0] hover:bg-[#A756FA] text-white px-4 py-2 rounded-lg shadow-md transition-all duration-200"
        >
          + Add Team
        </button>
      </div>

      {error && (
        <p className="text-red-400 bg-[#111828] border border-red-500/30 px-3 py-2 rounded mb-4">
          ⚠️ {error}
        </p>
      )}

      {/* Teams Table */}
      <div className="card-glow overflow-x-auto no-scrollbar rounded-lg">
        {loading ? (
          <p className="p-6 text-center text-gray-400 animate-pulse">
            Loading teams...
          </p>
        ) : teams.length > 0 ? (
          <table className="w-full text-left min-w-[600px]">
            <thead className="bg-[rgba(14,166,240,0.1)] text-gray-400 text-sm">
              <tr>
                <th className="p-4">Team Name</th>
                <th className="p-4">Leader</th>
                <th className="p-4">Members</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team, i) => (
                <tr
                  key={team._id || i}
                  className="border-t border-[rgba(255,255,255,0.1)] hover:bg-[rgba(14,166,240,0.05)] transition-all"
                >
                  <td className="p-4 font-medium">{team.name}</td>
                  <td className="p-4">{team.leader?.name || "-"}</td>
                  <td className="p-4 text-sm text-gray-300">
                    {team.members.map((m) => m.name).join(", ") || "-"}
                  </td>
                  <td className="p-4 flex justify-end gap-5">
                    <button
                      onClick={() => handleEdit(team)}
                      className="text-blue-400 hover:text-blue-500 text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClick(team)}
                      className="text-red-400 hover:text-red-500 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-center py-6 text-gray-400">No teams found.</p>
        )}
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4">
          <div className="bg-[#111828] p-4 sm:p-5 md:p-6 rounded-xl w-full max-w-xl shadow-lg card-glow animate-fadeIn max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-semibold mb-4 text-[#0EA6F0]">
              {editingTeam ? "Edit Team" : "Create New Team"}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Team Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Enter team name"
                  className="w-full p-3 bg-[#030712] border border-gray-700 rounded-md text-white focus:ring-2 focus:ring-[#0EA6F0] outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Team Leader</label>
                <select
                  value={form.leader}
                  onChange={(e) => setForm({ ...form, leader: e.target.value })}
                  className="w-full p-3 bg-[#030712] border border-gray-700 rounded-md text-white focus:ring-2 focus:ring-[#0EA6F0] outline-none transition-all"
                >
                  <option value="">Select Leader</option>
                  {leaders.map((l) => (
                    <option key={l._id} value={l._id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Members</label>
                <div className="bg-[#030712] border border-gray-700 rounded-md max-h-40 overflow-y-auto p-2">
                  {employees.map((e) => (
                    <label
                      key={e._id}
                      className="flex items-center gap-2 p-1 text-gray-300 hover:text-white hover:bg-[#0EA6F0]/10 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={form.members.includes(e._id)}
                        onChange={() => toggleMember(e._id)}
                      />
                      {e.name}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={handleSave}
                className="bg-[#0EA6F0] hover:bg-[#A756FA] text-white px-5 py-2 rounded-lg shadow-md transition-all"
              >
                {editingTeam ? "💾 Update" : "💾 Save"}
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2 border border-gray-700 rounded-lg hover:bg-gray-800 transition text-gray-300"
              >
                ✖ Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4">
          <div className="bg-[#111828] p-4 sm:p-5 md:p-6 rounded-xl w-full max-w-md shadow-lg card-glow animate-fadeIn">
            <h3 className="text-xl font-semibold mb-4 text-red-400">
              ⚠️ Confirm Deletion
            </h3>
            <p className="text-gray-400 mb-6">
              Are you sure you want to delete{" "}
              <span className="font-medium">{deleteTarget.name}</span>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 border border-gray-700 rounded-lg hover:bg-gray-800 transition text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg shadow-md transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamsPage;
