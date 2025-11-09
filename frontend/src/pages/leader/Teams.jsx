"use client";

import React, { useEffect, useState } from "react";

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
    <div className="w-full">
      <h2 className="text-3xl font-bold text-[#A756FA] mb-6">
        👥 My Teams
      </h2>

      <div className="card-glow overflow-x-auto no-scrollbar rounded-lg bg-[var(--color-surface)] p-4">
        {loading ? (
          <p className="p-6 text-center text-gray-400 animate-pulse">
            Loading teams...
          </p>
        ) : teams.length > 0 ? (
          <table className="w-full min-w-[700px] text-left">
            <thead className="bg-[rgba(167,86,250,0.1)] text-gray-400 text-sm">
              <tr>
                <th className="p-4">Team Name</th>
                <th className="p-4">Total Members</th>
                <th className="p-4">Members</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team, i) => (
                <tr
                  key={team._id || i}
                  className="border-t border-[rgba(255,255,255,0.1)] hover:bg-[rgba(167,86,250,0.05)] transition-all"
                >
                  <td className="p-4 font-medium">{team.name}</td>
                  <td className="p-4">{team.members?.length || 0}</td>
                  <td className="p-4 text-sm text-gray-300">
                    {team.members?.map((m) => m.name).join(", ") || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-center py-6 text-gray-400">
            You don’t have any teams assigned yet.
          </p>
        )}
      </div>
    </div>
  );
};

export default LeaderTeamsPage;
