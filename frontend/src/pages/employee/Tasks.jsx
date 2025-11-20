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
    } catch {
      // Ignore JSON parse errors, use text as-is
    }
    throw new Error(text?.message || res.statusText || "API error");
  }

  const t = await res.text();
  return t ? JSON.parse(t) : null;
};

const apiGet = (path) => fetchJson(path);
const apiPatch = (path, body) =>
  fetchJson(path, { method: "PATCH", body: JSON.stringify(body) });

export default function EmployeeTasksPage() {
  const [tasks, setTasks] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchMyTasks();
  }, []);

  const fetchMyTasks = async () => {
    try {
      setTasks((await apiGet("/employee/tasks")) || []);
    } catch (e) {
      console.error("Failed to load tasks:", e);
    }
  };

  const getCompletionStatus = (t) => {
    // Show '-' while not completed; otherwise compare completion time vs deadline
    if (!t?.completedAt) return "-";
    if (!t?.deadline) return "On Time";
    return new Date(t.completedAt) > new Date(t.deadline) ? "Delayed" : "On Time";
  };

  const handleStatusChange = async (taskId, status) => {
    try {
      // Employees cannot set "Delayed" directly; it's derived automatically.
      await apiPatch(`/employee/tasks/${taskId}/status`, { status });
      setMessage("✅ Task status updated successfully!");
      fetchMyTasks();
    } catch (e) {
      console.error(e);
      setMessage(e.message || "Failed to update status");
    }
  };

  return (
    <div className="font-sans text-white min-h-full p-3 md:p-6 space-y-6 md:space-y-8">
      <h2 className="text-2xl md:text-3xl font-bold text-[#A756FA] mb-4 md:mb-6">
        🧾 My Tasks
      </h2>

      <section className="bg-[#161b22] rounded-2xl shadow-lg p-3 md:p-6 border border-gray-700 card-glow overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-full table-auto text-left text-xs md:text-sm">
            <thead className="text-gray-400 border-b border-gray-700 text-xs md:text-sm">
              <tr>
                <th className="py-2 md:py-3 px-1 md:px-2">Project</th>
                <th className="py-2 md:py-3 px-1 md:px-2 hidden sm:table-cell">Description</th>
                <th className="py-2 md:py-3 px-1 md:px-2 hidden md:table-cell">Assigned By</th>
                <th className="py-2 md:py-3 px-1 md:px-2">Status</th>
                <th className="py-2 md:py-3 px-1 md:px-2 hidden sm:table-cell">Completion</th>
                <th className="py-2 md:py-3 px-1 md:px-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {tasks.length ? (
                tasks.map((t) => (
                  <tr
                    key={t._id}
                    className="border-t border-gray-800 hover:bg-[#21262d] transition-colors"
                  >
                    <td className="py-2 md:py-3 px-1 md:px-2 font-medium truncate">{t.project?.name || "-"}</td>
                    <td className="py-2 md:py-3 px-1 md:px-2 text-gray-300 hidden sm:table-cell truncate">{t.description}</td>
                    <td className="py-2 md:py-3 px-1 md:px-2 hidden md:table-cell truncate">{t.assignedBy?.name || "-"}</td>
                    <td className="py-2 md:py-3 px-1 md:px-2 text-yellow-400 font-medium">{t.status}</td>
                    <td className="py-2 md:py-3 px-1 md:px-2 text-gray-300 hidden sm:table-cell text-xs">{getCompletionStatus(t)}</td>
                    <td className="py-2 md:py-3 px-1 md:px-2">
                      <select
                        value={t.status}
                        onChange={(e) =>
                          handleStatusChange(t._id, e.target.value)
                        }
                        className="bg-[#0d1117] border border-gray-700 rounded-md p-1 text-xs md:text-sm focus:ring-2 focus:ring-[#58a6ff] w-full md:w-auto"
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-4 md:py-6 text-gray-500 text-xs md:text-sm">
                    No tasks assigned to you.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {message && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-[#161b22] p-6 rounded-xl w-full max-w-md shadow-lg card-glow animate-fadeIn">
            <h3 className="text-xl font-semibold mb-4 text-green-400">🎉</h3>
            <p className="text-gray-300 mb-6">{message}</p>
            <div className="flex justify-end">
              <button
                onClick={() => setMessage("")}
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
