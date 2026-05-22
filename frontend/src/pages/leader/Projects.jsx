import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Briefcase, Layers, Calendar, UserCheck, ArrowUpRight, Search, Filter } from "lucide-react";

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

const LeaderProjectsPage = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderProjects = async () => {
      try {
        const data = await apiGet("/leader/projects");
        setProjects(data || []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchLeaderProjects();
  }, []);

  return (
    <div className="animate-fadeIn max-w-7xl mx-auto space-y-12 pb-20">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shrink-0">
            <Briefcase size={28} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-primary tracking-tight">My Projects</h2>
            <p className="text-xs font-bold text-secondary/60 uppercase tracking-widest mt-1">Project Oversight & Execution</p>
          </div>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <div className="flex-1 md:w-64 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary/30" size={16} />
            <input type="text" placeholder="Search Projects..." className="w-full bg-white border border-gray-200 p-4 pl-12 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all shadow-sm" />
          </div>
          <button className="p-4 bg-white border border-gray-200 rounded-2xl text-secondary hover:text-primary transition-all shadow-sm"><Filter size={18} /></button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map(i => <div key={i} className="h-80 bg-gray-50 rounded-[2.5rem] animate-pulse border border-gray-200" />)}
        </div>
      ) : projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((p, i) => (
            <motion.div
              key={p._id || i}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              className="group bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-200 hover:border-primary/20 transition-all relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-20 group-hover:scale-110 transition-all text-primary rotate-12"><Briefcase size={80} /></div>
              
              <div className="flex items-center justify-between mb-8">
                <div className="p-3 bg-primary/5 rounded-2xl text-primary group-hover:bg-primary group-hover:text-white transition-all"><Layers size={20} /></div>
                <div className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                  p.status === 'Completed' ? 'bg-green-50 text-green-600 border-green-200' :
                  p.status === 'In Progress' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                  'bg-red-50 text-red-500 border-red-200'
                }`}>{p.status}</div>
              </div>

              <h3 className="text-xl font-black text-primary tracking-tight mb-2 group-hover:translate-x-1 transition-transform">{p.name}</h3>
              <p className="text-[10px] font-bold text-secondary/40 uppercase tracking-widest mb-8 line-clamp-2 min-h-[32px]">{p.description || "No project description provided."}</p>

              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-black text-primary/40 uppercase tracking-widest">Project Progress</span>
                    <span className="text-[10px] font-black text-primary uppercase tracking-widest">{p.completion || 0}%</span>
                  </div>
                  <div className="h-2 bg-gray-50 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${p.completion || 0}%` }} className="h-full bg-primary rounded-full shadow-[0_0_10px_rgba(18,99,126,0.3)]" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200">
                    <div className="flex items-center gap-2 text-[8px] font-black text-secondary/40 uppercase tracking-widest mb-1"><Calendar size={10} /> Start Date</div>
                    <div className="text-[10px] font-black text-primary">{p.startDate ? new Date(p.startDate).toLocaleDateString() : 'TBD'}</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200">
                    <div className="flex items-center gap-2 text-[8px] font-black text-secondary/40 uppercase tracking-widest mb-1"><UserCheck size={10} /> Teams</div>
                    <div className="text-[10px] font-black text-primary">{p.assignedTeams?.length || 0} Teams</div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-200 flex items-center justify-between">
                <div className="flex -space-x-2">
                  {p.assignedTeams?.slice(0, 3).map((t, idx) => (
                    <div key={idx} className="w-8 h-8 rounded-full bg-white border-2 border-gray-200 shadow-sm flex items-center justify-center text-[8px] font-black text-primary uppercase ring-1 ring-gray-200">{t.name?.charAt(0)}</div>
                  ))}
                  {p.assignedTeams?.length > 3 && (
                    <div className="w-8 h-8 rounded-full bg-primary/5 border-2 border-gray-200 shadow-sm flex items-center justify-center text-[8px] font-black text-primary ring-1 ring-gray-200">+{p.assignedTeams.length - 3}</div>
                  )}
                </div>
                <button className="p-2 text-primary hover:bg-primary/5 rounded-xl transition-all"><ArrowUpRight size={18} /></button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-20 rounded-[3rem] shadow-xl border border-gray-200 text-center space-y-4">
          <div className="w-20 h-20 bg-gray-50 rounded-[2rem] flex items-center justify-center mx-auto text-secondary/20"><Briefcase size={40} /></div>
          <div>
            <h3 className="text-xl font-black text-primary uppercase tracking-tight">No Active Projects</h3>
            <p className="text-sm font-bold text-secondary/40 uppercase tracking-widest">No projects registered under your administration.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaderProjectsPage;
