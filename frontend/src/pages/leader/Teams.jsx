import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Shield, ArrowUpRight, Search, Filter } from "lucide-react";

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

const apiGet = (p) => fetchJson(p);

const LeaderTeamsPage = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderTeams = async () => {
      try {
        const data = await apiGet("/leader/teams");
        setTeams(data || []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchLeaderTeams();
  }, []);

  return (
    <div className="animate-fadeIn max-w-7xl mx-auto space-y-12 pb-20">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shrink-0">
            <Users size={28} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-primary tracking-tight">My Teams</h2>
            <p className="text-xs font-bold text-secondary/60 uppercase tracking-widest mt-1">Oversight of Team Members & Structures</p>
          </div>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <div className="flex-1 md:w-64 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary/30" size={16} />
            <input type="text" placeholder="Search Teams..." className="w-full bg-white border border-gray-200 p-4 pl-12 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all shadow-sm" />
          </div>
          <button className="p-4 bg-white border border-gray-200 rounded-2xl text-secondary hover:text-primary transition-all shadow-sm"><Filter size={18} /></button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map(i => <div key={i} className="h-64 bg-gray-50 rounded-[2.5rem] animate-pulse border border-gray-200" />)}
        </div>
      ) : teams.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {teams.map((team, i) => (
            <motion.div
              key={team._id || i}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              className="group bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-200 hover:border-primary/20 transition-all relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-20 group-hover:scale-110 transition-all text-primary rotate-12"><Shield size={80} /></div>
              
              <div className="flex items-center justify-between mb-8">
                <div className="p-3 bg-primary/5 rounded-2xl text-primary group-hover:bg-primary group-hover:text-white transition-all"><Users size={20} /></div>
                <div className="text-[10px] font-black text-secondary/40 uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-full">{team.members?.length || 0} Members</div>
              </div>

              <h3 className="text-xl font-black text-primary tracking-tight mb-2 group-hover:translate-x-1 transition-transform">{team.name}</h3>
              <p className="text-[10px] font-bold text-secondary/60 uppercase tracking-widest mb-8">Team Members</p>

              <div className="space-y-3">
                <div className="text-[10px] font-black text-primary/40 uppercase tracking-widest px-1">Team Members List</div>
                <div className="flex flex-wrap gap-2">
                  {team.members?.slice(0, 4).map((m, idx) => (
                    <div key={idx} className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-[9px] font-black text-secondary uppercase tracking-tight group-hover:bg-white group-hover:border-primary/10 transition-all">{m.name}</div>
                  ))}
                  {team.members?.length > 4 && (
                    <div className="px-3 py-1.5 bg-primary/5 text-primary rounded-xl text-[9px] font-black uppercase tracking-tight">+{team.members.length - 4} More</div>
                  )}
                </div>
              </div>

              <div className="mt-10 pt-6 border-t border-gray-200 flex items-center justify-between">
                <span className="text-[10px] font-black text-secondary/30 uppercase tracking-widest">Active</span>
                <button className="p-2 text-primary hover:bg-primary/5 rounded-xl transition-all"><ArrowUpRight size={18} /></button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-20 rounded-[3rem] shadow-xl border border-gray-200 text-center space-y-4">
          <div className="w-20 h-20 bg-gray-50 rounded-[2rem] flex items-center justify-center mx-auto text-secondary/20"><Users size={40} /></div>
          <div>
            <h3 className="text-xl font-black text-primary uppercase tracking-tight">No Active Teams</h3>
            <p className="text-sm font-bold text-secondary/40 uppercase tracking-widest">No teams registered under your administration.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaderTeamsPage;
