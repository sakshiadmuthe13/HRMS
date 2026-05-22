import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Crown, User, Shield, ArrowRight, UserCheck, Search, Layout, MoreHorizontal } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

const fetchJson = async (path, opts = {}) => {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  const headers = { ...(opts.headers || {}) };
  if (token && !headers.Authorization && !headers.authorization) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    ...opts,
    headers,
  });
  if (!res.ok) {
    let text = await res.text();
    try { text = JSON.parse(text); } catch { }
    throw new Error(text?.message || res.statusText || "API error");
  }
  const t = await res.text();
  return t ? JSON.parse(t) : null;
};

const Teams = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyTeams = async () => {
      try {
        const data = await fetchJson("/employee/teams");
        setTeams(data || []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchMyTeams();
  }, []);

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/10 border-t-primary"></div>
    </div>
  );

  return (
    <div className="animate-fadeIn max-w-7xl mx-auto space-y-12 pb-20">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shrink-0">
            <Users size={28} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-primary tracking-tight">My Teams</h2>
            <p className="text-xs font-bold text-secondary/60 uppercase tracking-widest mt-1">Cross-Functional Teams</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {teams.length > 0 ? teams.map((team, i) => (
          <motion.div
            key={team._id || i}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white rounded-[2.5rem] shadow-xl border border-gray-200 overflow-hidden flex flex-col group hover:border-primary transition-all"
          >
            <div className="p-8 border-b border-gray-200 flex items-center justify-between bg-gray-50/30">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary text-white rounded-2xl shadow-lg shadow-primary/20"><Layout size={20} /></div>
                <h3 className="text-xl font-black text-primary tracking-tight uppercase">{team.name}</h3>
              </div>
              <div className="p-2 bg-white rounded-xl border border-gray-200 text-secondary/30"><MoreHorizontal size={16} /></div>
            </div>

            <div className="p-8 space-y-8">
              <div className="flex items-center gap-4 p-4 bg-primary/5 rounded-3xl border border-primary/10">
                <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-primary"><Crown size={24} /></div>
                <div>
                  <div className="text-[10px] font-black text-primary/40 uppercase tracking-widest">Team Architect</div>
                  <div className="text-sm font-black text-primary">{team.leader?.name || "System Managed"}</div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="text-[10px] font-black text-secondary/40 uppercase tracking-[0.2em] px-1">Collaborators</div>
                <div className="grid grid-cols-2 gap-3">
                  {team.members?.map((m, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50/50 rounded-2xl border border-gray-200 hover:bg-white hover:border-primary/20 transition-all cursor-default">
                      <div className="w-8 h-8 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-[9px] font-black text-secondary uppercase shadow-sm">{m.name?.slice(0, 2)}</div>
                      <div className="text-[10px] font-bold text-secondary truncate">{m.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-auto p-6 bg-gray-50/30 border-t border-gray-200 flex justify-between items-center px-8">
              <span className="text-[10px] font-black text-secondary/40 uppercase tracking-widest">{team.members?.length || 0} active members</span>
              <button className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-widest group-hover:gap-4 transition-all">
                Project Logs <ArrowRight size={12} />
              </button>
            </div>
          </motion.div>
        )) : (
          <div className="col-span-full py-20 bg-gray-50/50 rounded-[3rem] border border-dashed border-gray-200 flex flex-col items-center justify-center text-center">
            <div className="p-6 bg-white rounded-full shadow-xl mb-4 text-secondary/20"><Users size={48} /></div>
            <h4 className="text-xl font-black text-primary tracking-tight">No Active Alignments</h4>
            <p className="text-xs font-bold text-secondary/50 uppercase tracking-widest mt-2">Team assignments are managed by central operations</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Teams;
