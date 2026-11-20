import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FolderKanban, Calendar, Users, BarChart3, Clock, ArrowRight, MoreVertical, Layers } from "lucide-react";

import ProjectLogsModal from "../../components/ProjectLogsModal";

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

const formatDateDMY = (date) => {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d)) return "";
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const getInitials = (name) => {
  if (!name) return "EM";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    const fetchMyProjects = async () => {
      try {
        const data = await fetchJson("/employee/projects");
        setProjects(data || []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchMyProjects();
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
            <FolderKanban size={28} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-primary tracking-tight">My Projects</h2>
            <p className="text-xs font-bold text-secondary/60 uppercase tracking-widest mt-1">Project Portfolio</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {projects.length > 0 ? projects.map((p, i) => (
          <motion.div
            key={p._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-200 hover:border-primary transition-all group flex flex-col cursor-pointer"
            onClick={() => setSelectedProject(p)}
          >
            <div className="flex justify-between items-start mb-6">
              <div className="p-4 bg-gray-50 rounded-3xl text-secondary group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                <Layers size={24} />
              </div>
              <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                p.status === 'Completed' ? 'bg-green-50 text-green-600 border border-green-200' : 
                p.status === 'In Progress' ? 'bg-primary/5 text-primary border border-primary/10' : 'bg-amber-50 text-amber-600 border border-amber-200'
              }`}>
                {p.status}
              </div>
            </div>

            <h3 className="text-xl font-black text-primary tracking-tight mb-2 group-hover:text-primary transition-colors">{p.name}</h3>
            <p className="text-xs text-secondary/70 font-bold leading-relaxed mb-8 line-clamp-2">
              {p.description || "Active software development project."}
            </p>

            <div className="mt-auto space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-black text-secondary uppercase tracking-widest px-1">
                  <span>Development Progress {p.totalTasks ? `(${p.completedTasks}/${p.totalTasks} Tasks)` : ''}</span>
                  <span className="text-primary font-black">{p.completion}%</span>
                </div>
                <div className="h-3 bg-gray-50 rounded-full overflow-hidden border border-gray-200">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${p.completion}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="h-full bg-gradient-to-r from-primary to-secondary"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex -space-x-2 overflow-hidden">
                  {Array.isArray(p.members) && p.members.length > 0 ? (
                    p.members.slice(0, 4).map((m, idx) => (
                      <div
                        key={m._id || idx}
                        title={`${m.name} (${m.position || "Member"})`}
                        className="w-9 h-9 rounded-xl bg-primary text-white border-2 border-white flex items-center justify-center text-[10px] font-black shadow-sm"
                      >
                        {getInitials(m.name)}
                      </div>
                    ))
                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-gray-100 text-secondary border-2 border-white flex items-center justify-center text-[10px] font-black">
                      TEAM
                    </div>
                  )}
                  {Array.isArray(p.members) && p.members.length > 4 && (
                    <div className="w-9 h-9 rounded-xl bg-gray-200 text-secondary border-2 border-white flex items-center justify-center text-[10px] font-black">
                      +{p.members.length - 4}
                    </div>
                  )}
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); setSelectedProject(p); }}
                  className="flex items-center gap-1 text-[10px] font-black text-primary uppercase tracking-widest hover:text-blue-600 transition-all"
                >
                  Project Logs <ArrowRight size={12} />
                </button>
              </div>
            </div>
          </motion.div>
        )) : (
          <div className="col-span-full py-20 bg-gray-50/50 rounded-[3rem] border border-dashed border-gray-200 flex flex-col items-center justify-center text-center">
            <div className="p-6 bg-white rounded-full shadow-xl mb-4 text-secondary/20"><FolderKanban size={48} /></div>
            <h4 className="text-xl font-black text-primary tracking-tight">No Active Assignments</h4>
            <p className="text-xs font-bold text-secondary/50 uppercase tracking-widest mt-2">Check back later for new task allocations</p>
          </div>
        )}
      </div>

      <ProjectLogsModal
        isOpen={!!selectedProject}
        onClose={() => setSelectedProject(null)}
        project={selectedProject}
      />
    </div>
  );
};

export default Projects;
