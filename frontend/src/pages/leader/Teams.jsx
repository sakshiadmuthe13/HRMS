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

const LeaderTeamsPage = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderTeams = async () => {
      try {
        const data = await fetchJson("/leader/teams");
        setTeams(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderTeams();
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
      <h2 className="text-2xl sm:text-3xl font-bold text-[#A756FA] mb-6 pr-10 sm:pr-0">
        👥 My Teams
      </h2>

      <div className="card-glow overflow-x-auto no-scrollbar rounded-lg bg-[var(--color-surface)] p-3 sm:p-4">
        {loading ? (
          <p className="p-6 text-center text-sm text-gray-400 animate-pulse">
            Loading teams...
          </p>
        ) : teams.length > 0 ? (
          <table className="w-full min-w-[500px] text-left text-xs sm:text-sm">
            <thead className="bg-[rgba(167,86,250,0.1)] text-gray-400 text-xs sm:text-sm">
              <tr>
                <th className="p-2 sm:p-4">Team Name</th>
                <th className="p-2 sm:p-4">Members</th>
                <th className="p-2 sm:p-4 hidden sm:table-cell">Team Members</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team, i) => (
                <tr
                  key={team._id || i}
                  className="border-t border-[rgba(255,255,255,0.1)] hover:bg-[rgba(167,86,250,0.05)] transition-all"
                >
                  <td className="p-2 sm:p-4 font-medium">{team.name}</td>
                  <td className="p-2 sm:p-4">{team.members?.length || 0}</td>
                  <td className="p-2 sm:p-4 text-xs sm:text-sm text-gray-300 hidden sm:table-cell truncate max-w-[200px]">
                    {team.members?.map((m) => m.name).join(", ") || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-center py-6 text-xs sm:text-sm text-gray-400">
            You don't have any teams assigned yet.
          </p>
        )}
      </div>
    </div>
  );
};

export default LeaderTeamsPage;
