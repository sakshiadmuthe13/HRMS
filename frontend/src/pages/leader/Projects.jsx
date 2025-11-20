"use client";

import React, { useEffect, useState } from "react";
import { X } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

const fetchJson = async (path, opts = {}) => {
  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");
  const headers = { ...(opts.headers || {}) };
  if (token && !headers.Authorization)
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
    } catch {}
    throw new Error(text?.message || res.statusText || "API error");
  }
  const t = await res.text();
  return t ? JSON.parse(t) : null;
};

const LeaderProjectsPage = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderProjects = async () => {
      try {
        const data = await fetchJson("/leader/projects");
        setProjects(data || []);
      } catch (err) {
        console.error("Error fetching leader projects:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderProjects();
  }, []);

  return (
    <div className="w-full p-3 sm:p-6 relative">
      {/* <button
        onClick={() => window.history.back()}
        className="absolute top-3 right-3 sm:top-6 sm:right-6 p-2 text-gray-400 hover:text-red-500 transition-colors"
        title="Close"
      >
        <X size={24} />
      </button> */}
      <h2 className="text-2xl sm:text-3xl font-bold text-[#A756FA] mb-6 pr-10 sm:pr-0">📁 My Projects</h2>

      <div className="card-glow overflow-x-auto no-scrollbar rounded-lg p-3 sm:p-4 bg-[var(--color-surface)]">
        {loading ? (
          <p className="p-6 text-center text-sm text-gray-400 animate-pulse">
            Loading projects...
          </p>
        ) : projects.length > 0 ? (
          <table className="w-full min-w-[600px] text-left text-xs sm:text-sm">
            <thead className="bg-[rgba(167,86,250,0.1)] text-gray-400 text-xs sm:text-sm">
              <tr>
                <th className="p-2 sm:p-4">Project Name</th>
                <th className="p-2 sm:p-4 hidden sm:table-cell">Description</th>
                <th className="p-2 sm:p-4">Start Date</th>
                <th className="p-2 sm:p-4 hidden md:table-cell">End Date</th>
                <th className="p-2 sm:p-4">Status</th>
                <th className="p-2 sm:p-4">%</th>
                <th className="p-2 sm:p-4 hidden lg:table-cell">Teams</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr
                  key={p._id}
                  className="border-t border-[rgba(255,255,255,0.1)] hover:bg-[rgba(167,86,250,0.05)] transition-all"
                >
                  <td className="p-2 sm:p-4 font-medium">{p.name}</td>
                  <td className="p-2 sm:p-4 hidden sm:table-cell truncate max-w-[150px]">{p.description || "-"}</td>
                  <td className="p-2 sm:p-4 text-xs">
                    {p.startDate
                      ? new Date(p.startDate).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })
                      : "-"}
                  </td>
                  <td className="p-2 sm:p-4 text-xs hidden md:table-cell">
                    {p.endDate
                      ? new Date(p.endDate).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })
                      : "-"}
                  </td>
                  <td className="p-2 sm:p-4">{p.status}</td>
                  <td className="p-2 sm:p-4">{p.completion ?? 0}%</td>
                  <td className="p-2 sm:p-4 hidden lg:table-cell text-xs">
                    {p.assignedTeams?.map((t) => t.name).join(", ") || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-center py-6 text-xs sm:text-sm text-gray-400">
            You have no projects assigned yet.
          </p>
        )}
      </div>
    </div>
  );
};

export default LeaderProjectsPage;
