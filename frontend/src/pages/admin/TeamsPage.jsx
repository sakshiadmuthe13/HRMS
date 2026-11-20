"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Plus, Edit2, Trash2, UserCheck, ShieldAlert, CheckCircle2 } from "lucide-react";

import ProjectLogsModal from "../../components/ProjectLogsModal";

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

const TeamsPage = ({ isLeader = false }) => {
  const [teams, setTeams] = useState([]);
  const [leaders, setLeaders] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingTeam, setEditingTeam] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const savingRef = useRef(false);

  const prefix = isLeader ? "/leader" : "/admin";
  const getTeamsPath = isLeader ? "/leader/all-teams" : "/admin/teams";
  const getLeadersPath = isLeader ? "/leader/all-leaders" : "/admin/leaders";
  const getEmployeesPath = isLeader ? "/leader/all-employees" : "/admin/employees";

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true); setError("");
    try {
      const [teamsData, leadersData, employeesData] = await Promise.all([
        apiGet(getTeamsPath),
        apiGet(getLeadersPath),
        apiGet(getEmployeesPath),
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
    setError("");
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (savingRef.current) return;
    if (!form.name || !form.leader) {
      setError("Please fill all required fields");
      return;
    }
    savingRef.current = true;
    setIsSaving(true);
    setError("");
    try {
      const teamData = { ...form, name: form.name.trim() };
      if (editingTeam) {
        await apiPut(`${prefix}/teams/${editingTeam._id}`, teamData);
      } else {
        await apiPost(`${prefix}/teams`, teamData);
      }
      setEditingTeam(null);
      setIsModalOpen(false);
      await loadData();
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to save team");
    } finally {
      savingRef.current = false;
      setIsSaving(false);
    }
  };

  const handleEdit = (team) => {
    setEditingTeam(team);
    setError("");
    setForm({
      name: team.name,
      leader: team.leader?._id || "",
      members: team.members.map((m) => m._id),
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (team) => setDeleteTarget(team);
  const confirmDelete = async () => {
    try {
      await apiDelete(`${prefix}/teams/${deleteTarget._id}`);
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
    <div className="min-h-screen bg-background text-primary animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
        <div>
          <h2 className="text-4xl font-black text-primary tracking-tight mb-2">Team Management</h2>
          <p className="text-secondary font-medium opacity-80">Organize your workforce into high-performance units.</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 bg-primary hover:bg-secondary text-white px-6 py-3 rounded-2xl font-bold shadow-xl shadow-primary/20 transition-all duration-300 active:scale-95"
        >
          <Plus size={20} />
          Create Team
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-500 border border-red-200 p-4 rounded-2xl mb-6 font-bold flex items-center gap-2">
          <ShieldAlert size={20} />
          {error}
        </div>
      )}

      {/* Teams Table */}
      <div className="bg-white rounded-[2.5rem] shadow-xl shadow-primary/5 border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-20 text-center text-secondary font-bold animate-pulse">
            Retrieving team structures...
          </div>
        ) : teams.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-200">
                  <th className="p-5 font-bold text-secondary uppercase tracking-widest text-xs">Team Name</th>
                  <th className="p-5 font-bold text-secondary uppercase tracking-widest text-xs">Team Lead</th>
                  <th className="p-5 font-bold text-secondary uppercase tracking-widest text-xs hidden md:table-cell">Members</th>
                  <th className="p-5 font-bold text-secondary uppercase tracking-widest text-xs text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {teams.map((team, i) => (
                  <tr key={team._id || i} className="hover:bg-primary/5 transition-colors group">
                    <td className="p-5">
                      <div className="font-bold text-primary text-lg flex items-center gap-2">
                        <Users size={18} className="text-primary/40" />
                        {team.name}
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="flex items-center gap-2 font-medium text-secondary">
                        <UserCheck size={16} className="text-primary" />
                        {team.leader?.name || "-"}
                      </div>
                    </td>
                    <td className="p-5 hidden md:table-cell max-w-xs">
                      <div className="flex flex-wrap gap-1">
                        {team.members.map((m, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-gray-50 text-secondary rounded-lg text-[10px] font-bold">
                            {m.name}
                          </span>
                        ))}
                        {team.members.length === 0 && <span className="text-secondary opacity-40 italic">No members</span>}
                      </div>
                    </td>
                    <td className="p-5 text-right">
                      <div className="flex justify-end items-center gap-2">
                        <button 
                          onClick={() => setSelectedProject({ _id: team._id || team.project?._id, name: team.name })}
                          className="px-3 py-1.5 bg-blue-50 text-blue-600 font-bold rounded-xl text-xs flex items-center gap-1 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                        >
                          <CheckCircle2 size={13} /> Project Logs
                        </button>
                        <button onClick={() => handleEdit(team)} className="p-2 bg-primary/10 text-primary rounded-xl hover:bg-primary hover:text-white transition-all">
                          <Edit2 size={18} />
                        </button>
                        <button onClick={() => handleDeleteClick(team)} className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all">
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
          <div className="p-20 text-center text-secondary font-medium">No teams defined yet.</div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-primary/20 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white p-8 rounded-[2.5rem] w-full max-w-xl shadow-2xl border border-gray-200 animate-fadeIn max-h-[90vh] overflow-y-auto no-scrollbar"
            >
              <h3 className="text-3xl font-black mb-8 text-primary tracking-tight">
                {editingTeam ? "Refine Team Structure" : "Assemble New Team"}
              </h3>
              {error && (
                <div role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-600">
                  {error}
                </div>
              )}
              <div className="space-y-6">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-primary/70 uppercase tracking-widest ml-1">Team Designation</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Frontend Development"
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-primary font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-primary/70 uppercase tracking-widest ml-1">Assigned Team Lead</label>
                  <select
                    value={form.leader}
                    onChange={(e) => setForm({ ...form, leader: e.target.value })}
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-primary font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                  >
                    <option value="">Select an Authority</option>
                    {leaders.map((l) => (
                      <option key={l._id} value={l._id}>{l.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-bold text-primary/70 uppercase tracking-widest ml-1">Personnel Allocation</label>
                  <div className="bg-gray-50 border border-gray-200 rounded-[1.5rem] p-4 max-h-60 overflow-y-auto no-scrollbar">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {employees.map((e) => (
                        <button
                          key={e._id}
                          type="button"
                          onClick={() => toggleMember(e._id)}
                          className={`flex items-center gap-3 p-3 rounded-xl transition-all border ${
                            form.members.includes(e._id)
                              ? "bg-primary text-white border-primary shadow-lg shadow-primary/10"
                              : "bg-white text-secondary border-gray-200 hover:border-primary/30"
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                            form.members.includes(e._id) ? "border-white bg-white/20" : "border-gray-300"
                          }`}>
                            {form.members.includes(e._id) && <CheckCircle2 size={12} className="text-white" />}
                          </div>
                          <span className="text-sm font-bold truncate">{e.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    disabled={isSaving}
                    className="px-6 py-3 border border-gray-200 rounded-xl font-bold text-secondary hover:bg-gray-50 transition-all text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-6 py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-secondary transition-all text-sm disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSaving ? "Saving..." : editingTeam ? "Update Team" : "Deploy Team"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 bg-primary/20 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white p-8 rounded-[2.5rem] w-full max-w-md shadow-2xl border border-gray-200 text-center"
            >
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 size={32} />
              </div>
              <h3 className="text-2xl font-black mb-3 text-primary tracking-tight">Disband Team?</h3>
              <p className="text-secondary font-medium mb-8">Are you certain you want to delete <span className="text-primary font-black">{deleteTarget.name}</span>? This action will remove the team designation.</p>
              <div className="flex gap-4">
                <button onClick={cancelDelete} className="flex-1 px-6 py-4 font-bold text-secondary border border-gray-200 rounded-2xl hover:bg-gray-50 transition-all">Cancel</button>
                <button onClick={confirmDelete} className="flex-1 bg-red-500 hover:bg-red-500 text-white px-6 py-4 rounded-2xl font-bold shadow-xl shadow-red-500/20 transition-all">Disband</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ProjectLogsModal
        isOpen={!!selectedProject}
        onClose={() => setSelectedProject(null)}
        project={selectedProject}
      />
    </div>
  );
};

export default TeamsPage;
