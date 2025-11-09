"use client";

import React, { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

// Helper to format dates as DD/MM/YYYY
const formatDateDMY = (value) => {
  if (!value) return "";
  const dateStr = typeof value === "string" ? value.split("T")[0] : value;
  if (typeof dateStr !== "string") return "";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return "";
  const [yyyy, mm, dd] = parts;
  const d = String(dd).padStart(2, "0");
  const m = String(mm).padStart(2, "0");
  return `${d}/${m}/${yyyy}`;
};

const fetchJson = async (path, opts = {}) => {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  const headers = { ...(opts.headers || {}) };
  if (token && !headers.Authorization) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { credentials: "include", ...opts, headers });
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

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyProjects = async () => {
      try {
        // Fetch only projects where the logged-in employee is assigned
        const data = await fetchJson("/employee/projects");
        setProjects(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMyProjects();
  }, []);

  return (
    <div className="w-full">
      <h2 className="text-3xl font-bold text-[#0EA6F0] mb-6">📁 My Projects</h2>

      <div className="card-glow overflow-x-auto no-scrollbar rounded-lg p-4 bg-[var(--color-surface)]">
        {loading ? (
          <p className="p-6 text-center text-gray-400 animate-pulse">Loading projects...</p>
        ) : projects.length > 0 ? (
          <table className="w-full min-w-[600px] text-left">
            <thead className="bg-[rgba(14,166,240,0.1)] text-gray-400 text-sm">
              <tr>
                <th className="p-4">Project Name</th>
                <th className="p-4">Description</th>
                <th className="p-4">Start Date</th>
                <th className="p-4">End Date</th>
                <th className="p-4">Status</th>
                <th className="p-4">Completion</th>
                <th className="p-4">Teams</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p._id} className="border-t border-[rgba(255,255,255,0.1)] hover:bg-[rgba(14,166,240,0.05)] transition-all">
                  <td className="p-4 font-medium">{p.name}</td>
                  <td className="p-4">{p.description || "-"}</td>
                  <td className="p-4">{p.startDate ? formatDateDMY(p.startDate) : "-"}</td>
                  <td className="p-4">{p.endDate ? formatDateDMY(p.endDate) : "-"}</td>
                  <td className="p-4">{p.status}</td>
                  <td className="p-4">{p.completion}%</td>
                  <td className="p-4">{p.assignedTeams?.map(t => t.name).join(", ") || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-center py-6 text-gray-400">No projects assigned yet.</p>
        )}
      </div>
    </div>
  );
};

export default Projects;
