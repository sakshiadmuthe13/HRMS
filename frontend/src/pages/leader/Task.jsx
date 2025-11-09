"use client";

import React, { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

const fetchJson = async (path, opts = {}) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opts.headers,
    },
    ...opts,
  });

  if (!res.ok) {
    let text = await res.text();
    try {
      text = JSON.parse(text);
    } catch {}
    throw new Error(text?.message || res.statusText || "API error");
  }

  const t = await res.text();
  return t ? JSON.parse(t) : null;
};

const apiGet = (path) => fetchJson(path);
const apiPost = (path, body) =>
  fetchJson(path, { method: "POST", body: JSON.stringify(body) });

export default function AssignTaskPage() {
  const [projects, setProjects] = useState([]);
  const [teammates, setTeammates] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [form, setForm] = useState({
    project: "",
    assignedTo: "",
    description: "",
  });

  useEffect(() => {
    fetchProjects();
    fetchMyTasks();
  }, []);

  useEffect(() => {
    if (form.project) fetchTeammates(form.project);
    else setTeammates([]);
  }, [form.project]);

  const fetchProjects = async () => {
    try {
      setProjects((await apiGet("/leader/projects")) || []);
    } catch (e) {
      console.error("Failed to load projects:", e);
    }
  };

  const fetchTeammates = async (projectId) => {
    try {
      setTeammates(
        (await apiGet(`/leader/team-members?projectId=${projectId}`)) || []
      );
    } catch (e) {
      console.error("Failed to load teammates:", e);
      setTeammates([]);
    }
  };

  const fetchMyTasks = async () => {
    try {
      setTasks((await apiGet("/leader/my-assigned-tasks")) || []);
    } catch (e) {
      console.error("Failed to load tasks:", e);
    }
  };

  const assignTask = async () => {
    if (!form.project || !form.assignedTo || !form.description.trim()) {
      setSuccessMessage("Please fill all fields!");
      return;
    }

    try {
      setLoading(true);
      await apiPost("/leader/assign-task", {
        projectId: form.project,
        assignedTo: form.assignedTo,
        description: form.description,
        deadline: form.deadline
          ? new Date(form.deadline).toISOString()
          : undefined,
      });

      setForm({ project: "", assignedTo: "", description: "", deadline: "" });
      setTeammates([]);
      fetchMyTasks();
      setSuccessMessage("✅ Task assigned successfully!");
    } catch (e) {
      console.error(e);
      setSuccessMessage(e.message || "Failed to assign task");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-sans text-white min-h-full p-6 space-y-8">
      <h2 className="text-3xl font-bold text-[#A756FA] mb-6">📋 Tasks</h2>
      <section className="bg-[#161b22] rounded-2xl shadow-lg p-6 border border-gray-700 card-glow">
        <h2 className="text-2xl font-semibold mb-4 text-[#58a6ff]">
          Assign New Task
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <select
            value={form.project}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                project: e.target.value,
                assignedTo: "",
              }))
            }
            className="p-2 rounded-md bg-[#0d1117] border border-gray-700 focus:ring-2 focus:ring-[#58a6ff] ml-6"
          >
            <option value="">Select Project</option>
            {projects.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>

          <select
            value={form.assignedTo}
            onChange={(e) =>
              setForm((f) => ({ ...f, assignedTo: e.target.value }))
            }
            className="p-2 rounded-md bg-[#0d1117] border border-gray-700 focus:ring-2 focus:ring-[#58a6ff]"
            disabled={!form.project || teammates.length === 0}
          >
            <option value="">
              {form.project
                ? teammates.length
                  ? "Select Teammate"
                  : "No teammates found"
                : "Select Project First"}
            </option>
            {teammates.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name}
              </option>
            ))}
          </select>

          <div className="flex flex-col-2">
            <h3 className="pt-2">Deadline: &nbsp; </h3>
          <input
            type="datetime-local"
            value={form.deadline}
            onChange={(e) =>
              setForm((f) => ({ ...f, deadline: e.target.value }))
            }
            className="p-2 rounded-md bg-[#0d1117] border border-gray-700 focus:ring-2 focus:ring-[#58a6ff] color-white"
          />
          </div>

          <textarea
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
            placeholder="Enter task description..."
            className="p-2 rounded-md bg-[#0d1117] border border-gray-700 focus:ring-2 focus:ring-[#58a6ff] sm:col-span-3 mx-6"
          />
          <div className="sm:col-span-3 text-center">
            <button
              onClick={assignTask}
              disabled={loading}
              className="bg-[#238636] hover:bg-[#2ea043] px-5 py-2 rounded-md"
            >
              {loading ? "Assigning..." : "Assign Task"}
            </button>
          </div>
        </div>
      </section>

      <section className="bg-[#161b22] rounded-2xl shadow-lg p-6 border border-gray-700 card-glow">
        <h3 className="text-xl font-semibold mb-4 text-[#58a6ff]">
          My Assigned Tasks
        </h3>
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-0 table-auto text-left text-sm">
            <thead className="text-gray-400 border-b border-gray-700">
              <tr>
                <th className="py-2">Project</th>
                <th className="py-2">Assigned To</th>
                <th className="py-2">Description</th>
                <th className="py-2">Assigned On</th>
                <th className="py-2">Deadline</th>
                <th className="py-2">Status</th>
                <th className="py-2">Completed On</th>               
                <th className="py-2">Task Status</th>
              </tr>
            </thead>
            <tbody>
              {tasks.length ? (
                tasks.map((t) => (
                  <tr
                    key={t._id}
                    className="border-t border-gray-800 hover:bg-[#21262d]"
                  >
                    <td className="py-2">{t.project?.name || "-"}</td>
                    <td className="py-2">{t.assignedTo?.name || "-"}</td>
                    <td className="py-2 text-gray-300">{t.description}</td>
                    <td className="py-2 text-gray-400">
                      {t.assignedAt
                        ? new Date(t.assignedAt).toLocaleString("en-GB", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })
                        : "-"}
                    </td>
                    <td className="py-2 text-gray-400">
                      {t.deadline
                        ? new Date(t.deadline).toLocaleString("en-GB", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })
                        : "-"}
                    </td>
                    <td className="py-2 text-yellow-400">
                      {t.status || "Pending"}
                    </td>
                    <td className="py-2 text-gray-400">
                      {t.completedAt
                        ? new Date(t.completedAt).toLocaleString("en-GB", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })
                        : "-"}
                    </td>
                    <td className="py-2 text-gray-300">
                      {t.completedAt
                        ? t.deadline &&
                          new Date(t.completedAt) > new Date(t.deadline)
                          ? "Delayed"
                          : "On Time"
                        : "-"}
                    </td>
                    
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-4 text-gray-500">
                    No tasks assigned yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      {successMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-[#161b22] p-6 rounded-xl w-full max-w-md shadow-lg card-glow animate-fadeIn">
            <h3 className="text-xl font-semibold mb-4 text-green-400">
              🎉 Success
            </h3>
            <p className="text-gray-300 mb-6">{successMessage}</p>
            <div className="flex justify-end">
              <button
                onClick={() => setSuccessMessage("")}
                className="px-4 py-2 border border-[rgba(255,255,255,0.1)] rounded-lg hover:bg-[rgba(255,255,255,0.05)] transition"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
