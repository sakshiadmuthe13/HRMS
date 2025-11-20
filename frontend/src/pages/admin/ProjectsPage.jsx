"use client";

import React, { useEffect, useState } from "react";
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

const ProjectsPage = () => {
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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [proj, tms] = await Promise.all([
        apiGet("/admin/projects"),
        apiGet("/admin/teams"),
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
        await apiPut(`/admin/projects/${editing}`, payload);
      } else {
        await apiPost("/admin/projects", payload);
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

      await apiDelete(`/admin/projects/${deleteTarget._id}`);
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
    <div className="min-h-[calc(100vh-48px)] bg-[#111828] text-[var(--color-text-primary)] p-6 overflow-x-hidden">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-[var(--color-primary)]">
          📁 Projects
        </h2>
        <button
          onClick={handleCreate}
          className="bg-[var(--color-primary)] hover:bg-[var(--color-secondary)] text-white px-4 py-2 rounded-lg shadow-md transition-all duration-200"
        >
          + Add Project
        </button>
      </div>

      {error && (
        <p className="text-red-400 bg-[var(--color-surface)] border border-[var(--color-danger)] px-3 py-2 rounded mb-4">
          ⚠️ {error}
        </p>
      )}

      <div className="card-glow overflow-x-auto no-scrollbar rounded-lg">
        {loading ? (
          <p className="p-6 text-center text-[var(--color-text-secondary)] animate-pulse">
            Loading projects...
          </p>
        ) : projects.length > 0 ? (
          <table className="w-full text-left min-w-[600px]">
            <thead className="bg-[rgba(14,166,240,0.1)] text-[var(--color-text-secondary)] text-sm">
              <tr>
                <th className="p-4">Name</th>
                <th className="p-4">Description</th>
                <th className="p-4">Start Date</th>
                <th className="p-4">End Date</th>
                <th className="p-4">Status</th>
                <th className="p-4">Completion</th>
                <th className="p-4">Teams</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr
                  key={p._id}
                  className="border-t border-[rgba(255,255,255,0.1)] hover:bg-[rgba(14,166,240,0.05)] transition-all"
                >
                  <td className="p-4 font-medium">{p.name}</td>
                  <td className="p-4">{p.description}</td>
                  <td className="p-4">
                    {p.startDate
                      ? new Date(p.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
                      : "-"}
                  </td>
                  <td className="p-4">
                    {p.endDate
                      ? new Date(p.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
                      : "-"}
                  </td>
                  <td className="p-4">{p.status}</td>
                  <td className="p-4">{p.completion}%</td>
                  <td className="p-4">
                    {p.assignedTeams.map((t) => t.name).join(", ")}
                  </td>
                  <td className="p-4 flex justify-end gap-3">
                    <button
                      onClick={() => handleEdit(p)}
                      className="text-[var(--color-primary)] hover:text-[var(--color-secondary)] text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClick(p)}
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
          <p className="text-center py-6 text-[var(--color-text-secondary)]">
            No projects found.
          </p>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-[var(--color-surface)] p-6 rounded-xl w-full max-w-2xl shadow-lg card-glow animate-fadeIn">
            <h3 className="text-2xl font-semibold mb-4 text-[var(--color-primary)]">
              {editing ? "Edit Project" : "Create Project"}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.keys(emptyProject).map((k) => (
                <div key={k}>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1 capitalize">
                    {k}
                  </label>
                  {k === "status" ? (
                    <select
                      value={form.status}
                      onChange={handleInputChange}
                      name="status"
                      className="w-full p-3 bg-[var(--color-background)] border border-[rgba(255,255,255,0.1)] rounded-md text-[var(--color-text-primary)] focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition-all"
                    >
                      {["Planning", "In Progress", "Completed", "On Hold"].map(
                        (s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        )
                      )}
                    </select>
                  ) : k === "description" ? (
                    <textarea
                      value={form.description}
                      onChange={handleInputChange}
                      name="description"
                      className="w-full p-3 bg-[var(--color-background)] border border-[rgba(255,255,255,0.1)] rounded-md text-[var(--color-text-primary)] focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition-all"
                    />
                  ) : k === "startDate" ? (
                    <DatePicker 
                      value={displayStartDate} 
                      onChange={(val) => {
                        setDisplayStartDate(val);
                        setForm((prev) => ({ ...prev, startDate: convertDMYtoYMD(val) }));
                      }} 
                      placeholder="dd/mm/yyyy" 
                    />
                  ) : k === "endDate" ? (
                    <DatePicker 
                      value={displayEndDate} 
                      onChange={(val) => {
                        setDisplayEndDate(val);
                        setForm((prev) => ({ ...prev, endDate: convertDMYtoYMD(val) }));
                      }} 
                      placeholder="dd/mm/yyyy" 
                    />
                  ) : (
                    <input
                      type="text"
                      value={form[k]}
                      onChange={handleInputChange}
                      name={k}
                      className="w-full p-3 bg-[var(--color-background)] border border-[rgba(255,255,255,0.1)] rounded-md text-[var(--color-text-primary)] focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition-all"
                    />
                  )}
                </div>
              ))}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  Assign Teams
                </label>
                <div className="flex flex-wrap gap-3">
                  {teams.map((team) => (
                    <label
                      key={team._id}
                      className="flex items-center gap-2 bg-[rgba(14,166,240,0.1)] px-3 py-1 rounded-md cursor-pointer hover:bg-[rgba(14,166,240,0.2)]"
                    >
                      <input
                        type="checkbox"
                        checked={form.assignedTeams.includes(team._id)}
                        onChange={() => toggleTeam(team._id)}
                      />
                      {team.name}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={handleSave}
                className="bg-[var(--color-primary)] hover:bg-[var(--color-secondary)] text-white px-5 py-2 rounded-lg shadow-md transition-all"
              >
                💾 Save
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2 border border-[rgba(255,255,255,0.1)] rounded-lg hover:bg-[rgba(255,255,255,0.05)] transition"
              >
                ✖ Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-[var(--color-surface)] p-6 rounded-xl w-full max-w-md shadow-lg card-glow animate-fadeIn">
            <h3 className="text-xl font-semibold mb-4 text-red-400">
              ⚠️ Confirm Deletion
            </h3>
            <p className="text-[var(--color-text-secondary)] mb-6">
              Are you sure you want to delete{" "}
              <span className="font-medium">{deleteTarget.name}</span>? This
              action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 border border-[rgba(255,255,255,0.1)] rounded-lg hover:bg-[rgba(255,255,255,0.05)] transition"
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

export default ProjectsPage;
