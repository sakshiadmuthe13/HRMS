"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Folder, Plus, Edit2, Trash2, Users, Calendar, Info, AlertCircle } from "lucide-react";
import DatePicker from "../../components/DatePicker";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

const fetchJson = async (path, opts = {}) => {
  const token = (() => {
    try {
      return localStorage.getItem("token") || sessionStorage.getItem("token");
    } catch {
      return null;
    }
  })();
  const headers = { ...(opts.headers || {}) };
  if (token && !headers.Authorization && !headers.authorization)
    headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    ...opts,
    headers,
  });
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
const apiPut = (p, body) =>
  fetchJson(p, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
const apiDelete = (p) => fetchJson(p, { method: "DELETE" });

const emptyProject = {
  name: "",
  description: "",
  startDate: "",
  endDate: "",
  status: "Planning",
  completion: 0,
  assignedTeams: [],
};

const convertYMDtoDMY = (ymd) => {
  if (!ymd) return "";
  const parts = ymd.split("-");
  if (parts.length !== 3) return "";
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

const convertDMYtoYMD = (dmy) => {
  if (!dmy) return "";
  const parts = dmy.split("/");
  if (parts.length !== 3) return "";
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
};

const ProjectsPage = ({ isLeader = false }) => {
  const [projects, setProjects] = useState([]);
  const [teams, setTeams] = useState([]);
  const [form, setForm] = useState(emptyProject);
  const [displayStartDate, setDisplayStartDate] = useState("");
  const [displayEndDate, setDisplayEndDate] = useState("");
  const [editing, setEditing] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const prefix = isLeader ? "/leader" : "/admin";
  const getProjectsPath = isLeader ? "/leader/all-projects" : "/admin/projects";
  const getTeamsPath = isLeader ? "/leader/all-teams" : "/admin/teams";

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [proj, tms] = await Promise.all([
        apiGet(getProjectsPath),
        apiGet(getTeamsPath),
      ]);
      setProjects(proj || []);
      setTeams(tms || []);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setForm(emptyProject);
    setDisplayStartDate("");
    setDisplayEndDate("");
    setEditing(null);
    setIsModalOpen(true);
  };

  const handleEdit = (project) => {
    const startDateYMD = project.startDate ? project.startDate.split("T")[0] : "";
    const endDateYMD = project.endDate ? project.endDate.split("T")[0] : "";
    setForm({
      ...project,
      startDate: startDateYMD,
      endDate: endDateYMD,
      assignedTeams: project.assignedTeams.map((t) => t._id),
    });
    setDisplayStartDate(convertYMDtoDMY(startDateYMD));
    setDisplayEndDate(convertYMDtoDMY(endDateYMD));
    setEditing(project._id);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    setError("");

    // Basic validation
    if (!form.name) {
      setError("Project name is required");
      return;
    }

    // Prepare payload with correct types
    const payload = {
      name: form.name,
      description: form.description || "",
      startDate: form.startDate ? new Date(form.startDate) : null,
      endDate: form.endDate ? new Date(form.endDate) : null,
      status: form.status || "Planning",
      completion: Number(form.completion) || 0,
      assignedTeams: Array.isArray(form.assignedTeams)
        ? form.assignedTeams.filter((id) => id)
        : [],
    };

    try {
      if (editing) {
        await apiPut(`${prefix}/projects/${editing}`, payload);
      } else {
        await apiPost(`${prefix}/projects`, payload);
      }
      setEditing(null);
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error("Error saving project:", err);
      setError(err.message || "Failed to save project");
    }
  };

  const handleDeleteClick = (project) => setDeleteTarget(project);
  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      console.log("Deleting project with ID:", deleteTarget._id); // Log the ID being sent

      await apiDelete(`${prefix}/projects/${deleteTarget._id}`);
      setDeleteTarget(null);
      fetchData(); // Refresh the project list
    } catch (e) {
      console.error("Error deleting project:", e);
      alert("Failed to delete project");
    }
  };
  const cancelDelete = () => setDeleteTarget(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const toggleTeam = (id) => {
    setForm((prev) => ({
      ...prev,
      assignedTeams: prev.assignedTeams.includes(id)
        ? prev.assignedTeams.filter((tid) => tid !== id)
        : [...prev.assignedTeams, id],
    }));
  };

  return (
    <div className="min-h-screen bg-background text-primary animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
        <div>
          <h2 className="text-4xl font-black text-primary tracking-tight mb-2">Projects</h2>
          <p className="text-secondary font-medium opacity-80">Track and manage organizational initiatives.</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 bg-primary hover:bg-secondary text-white px-6 py-3 rounded-2xl font-bold shadow-xl shadow-primary/20 transition-all duration-300 active:scale-95"
        >
          <Plus size={20} />
          New Project
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-500 border border-red-200 p-4 rounded-2xl mb-6 font-bold flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {/* Table Section */}
      <div className="bg-white rounded-[2rem] shadow-xl shadow-primary/5 border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-20 text-center text-secondary font-bold animate-pulse">
            Retrieving project matrix...
          </div>
        ) : projects.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-200">
                  <th className="p-5 font-bold text-secondary uppercase tracking-widest text-xs">Project</th>
                  <th className="p-5 font-bold text-secondary uppercase tracking-widest text-xs hidden lg:table-cell">Dates</th>
                  <th className="p-5 font-bold text-secondary uppercase tracking-widest text-xs">Status</th>
                  <th className="p-5 font-bold text-secondary uppercase tracking-widest text-xs">Progress</th>
                  <th className="p-5 font-bold text-secondary uppercase tracking-widest text-xs hidden md:table-cell">Teams</th>
                  <th className="p-5 font-bold text-secondary uppercase tracking-widest text-xs text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {projects.map((p) => (
                  <tr key={p._id} className="hover:bg-primary/5 transition-colors group">
                    <td className="p-5">
                      <div className="font-bold text-primary text-lg">{p.name}</div>
                      <div className="text-xs text-secondary font-medium mt-1 line-clamp-1 max-w-xs">{p.description}</div>
                    </td>
                    <td className="p-5 hidden lg:table-cell text-secondary font-medium">
                      <div className="flex flex-col gap-1">
                        <span className="flex items-center gap-2 text-xs">
                          <Calendar size={12} className="text-primary" />
                          {p.startDate ? new Date(p.startDate).toLocaleDateString('en-GB') : "-"}
                        </span>
                        <span className="flex items-center gap-2 text-xs">
                          <Calendar size={12} className="text-secondary" />
                          {p.endDate ? new Date(p.endDate).toLocaleDateString('en-GB') : "-"}
                        </span>
                      </div>
                    </td>
                    <td className="p-5">
                      {(() => {
                        const statusColors = {
                          "Planning": "bg-cyan-50 text-[#1A9DC2] border-cyan-200",
                          "In Progress": "bg-amber-50 text-amber-600 border-amber-200",
                          "Completed": "bg-green-50 text-green-600 border-green-200",
                          "On Hold": "bg-red-50 text-red-500 border-red-200"
                        };
                        const cls = statusColors[p.status] || "bg-gray-50 text-gray-500 border-gray-200";
                        return (
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${cls}`}>
                            {p.status}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-gray-50 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary transition-all duration-1000" 
                            style={{ width: `${p.completion}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-black text-primary">{p.completion}%</span>
                      </div>
                    </td>
                    <td className="p-5 hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {p.assignedTeams.map((t, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-gray-50 text-secondary rounded-md text-[10px] font-bold">
                            {t.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-5 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(p)} className="p-2 bg-primary/10 text-primary rounded-xl hover:bg-primary hover:text-white transition-all">
                          <Edit2 size={18} />
                        </button>
                        <button onClick={() => handleDeleteClick(p)} className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all">
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
          <div className="p-20 text-center text-secondary font-medium">No active projects found.</div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/20 backdrop-blur-md p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white p-8 rounded-[2.5rem] w-full max-w-2xl shadow-2xl border border-gray-200 animate-fadeIn max-h-[90vh] overflow-y-auto no-scrollbar"
            >
              <h3 className="text-3xl font-black mb-8 text-primary tracking-tight">
                {editing ? "Edit Project Details" : "Initiate New Project"}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="block text-xs font-bold text-primary/70 uppercase tracking-widest ml-1">Project Name</label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleInputChange}
                    placeholder="Enter project name"
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-primary font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                  />
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="block text-xs font-bold text-primary/70 uppercase tracking-widest ml-1">Description</label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleInputChange}
                    placeholder="Brief overview of the project..."
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-primary font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all h-24 resize-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-primary/70 uppercase tracking-widest ml-1">Start Date</label>
                  <DatePicker 
                    value={displayStartDate} 
                    onChange={(val) => {
                      setDisplayStartDate(val);
                      setForm((prev) => ({ ...prev, startDate: convertDMYtoYMD(val) }));
                    }} 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-primary/70 uppercase tracking-widest ml-1">End Date</label>
                  <DatePicker 
                    value={displayEndDate} 
                    onChange={(val) => {
                      setDisplayEndDate(val);
                      setForm((prev) => ({ ...prev, endDate: convertDMYtoYMD(val) }));
                    }} 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-primary/70 uppercase tracking-widest ml-1">Current Status</label>
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleInputChange}
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-primary font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                  >
                    {["Planning", "In Progress", "Completed", "On Hold"].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-primary/70 uppercase tracking-widest ml-1">Completion %</label>
                  <input
                    type="number"
                    name="completion"
                    value={form.completion}
                    onChange={handleInputChange}
                    min="0" max="100"
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-primary font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                  />
                </div>
                <div className="sm:col-span-2 space-y-3">
                  <label className="block text-xs font-bold text-primary/70 uppercase tracking-widest ml-1">Assign Teams</label>
                  <div className="flex flex-wrap gap-2">
                    {teams.map((team) => (
                      <button
                        key={team._id}
                        type="button"
                        onClick={() => toggleTeam(team._id)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                          form.assignedTeams.includes(team._id)
                            ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                            : "bg-gray-50 text-secondary border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        {team.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-10 flex justify-end gap-4">
                <button onClick={() => setIsModalOpen(false)} className="px-8 py-4 font-bold text-secondary hover:text-primary transition-all">Discard</button>
                <button onClick={handleSave} className="bg-primary hover:bg-secondary text-white px-10 py-4 rounded-2xl font-bold shadow-xl shadow-primary/20 transition-all duration-300">
                  {editing ? "Update Project" : "Create Project"}
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
              <h3 className="text-2xl font-black mb-3 text-primary tracking-tight">Remove Project?</h3>
              <p className="text-secondary font-medium mb-8">Are you certain you want to delete <span className="text-primary font-black">{deleteTarget.name}</span>? All associated data will be lost.</p>
              <div className="flex gap-4">
                <button onClick={cancelDelete} className="flex-1 px-6 py-4 font-bold text-secondary border border-gray-200 rounded-2xl hover:bg-gray-50 transition-all">Keep</button>
                <button onClick={confirmDelete} className="flex-1 bg-red-500 hover:bg-red-500 text-white px-6 py-4 rounded-2xl font-bold shadow-xl shadow-red-500/20 transition-all">Delete</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProjectsPage;
