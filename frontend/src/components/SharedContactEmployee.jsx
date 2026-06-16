import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Users,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  Filter,
  ArrowRight,
  Shield,
  Calendar,
  UserPlus
} from "lucide-react";
import ProfileAvatar from "./ProfileAvatar";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

const roleBadgeStyle = (role) => {
  switch (role) {
    case "admin":
      return "bg-violet-50 text-violet-600 border-violet-200";
    case "leader":
      return "bg-blue-50 text-blue-600 border-blue-200";
    case "hr":
      return "bg-rose-50 text-rose-600 border-rose-200";
    default:
      return "bg-green-50 text-green-600 border-green-200";
  }
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

const SharedContactEmployee = ({ role = "employee" }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    const query = searchTerm.trim();
    if (!query) {
      setError("Please enter a search term.");
      return;
    }

    setLoading(true);
    setSearched(true);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      // Use the appropriate endpoint based on the role prop
      const response = await fetch(
        `${API_BASE}/${role}/contact?query=${encodeURIComponent(query)}`,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : undefined,
          },
          credentials: "include",
        }
      );
      if (!response.ok) throw new Error("Employee directory is currently inaccessible.");
      const data = await response.json();
      setResults(data || []);
    } catch (err) {
      setError(err.message);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const roleLabels = {
    admin: "Admin Access — All Roles",
    leader: "Leader Access — Team & Org",
    hr: "HR Access — Organization Wide",
    employee: "Employee Access — Directory"
  };

  return (
    <div className="animate-fadeIn max-w-7xl mx-auto space-y-10 pb-20">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shrink-0">
            <Users size={28} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-primary tracking-tight">
              Contact Employee
            </h2>
            <p className="text-xs font-bold text-secondary/60 uppercase tracking-widest mt-1">
              Search & Contact Personnel
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-primary/5 px-4 py-2 rounded-2xl border border-primary/10">
          <Shield size={14} className="text-primary" />
          <span className="text-[10px] font-black text-primary uppercase tracking-widest">
            {roleLabels[role] || "Directory Access"}
          </span>
        </div>
      </div>

      {/* Search Form */}
      <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-gray-200">
        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 relative">
            <Search
              className="absolute left-6 top-1/2 -translate-y-1/2 text-secondary/30"
              size={20}
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Name, Email, Phone, or Department..."
              className="w-full bg-gray-50 border border-gray-200 p-6 pl-16 rounded-[2rem] text-sm font-bold text-primary outline-none focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-secondary/20 shadow-inner"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-12 py-6 bg-primary text-white font-black rounded-[2rem] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 min-w-[200px]"
          >
            {loading ? (
              "Searching..."
            ) : (
              <>
                <ArrowRight size={16} /> Search
              </>
            )}
          </button>
        </form>
        {error && (
          <p className="mt-4 text-[10px] font-black text-red-500 uppercase tracking-widest px-6">
            {error}
          </p>
        )}
      </div>

      {/* Results Table */}
      <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-gray-200 space-y-8 overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-100 pb-6">
          <h3 className="text-xl font-black text-primary flex items-center gap-3">
            <Briefcase size={18} className="text-secondary" />
            Personnel Directory
          </h3>
          <div className="text-[10px] font-black text-secondary/40 uppercase tracking-widest bg-gray-50 px-4 py-2 rounded-full flex items-center gap-2">
            <Filter size={12} />
            {searched ? `${results.length} Found` : "Search above"}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="p-6 text-[10px] font-black text-secondary uppercase tracking-widest">
                  Employee Identity
                </th>
                <th className="p-6 text-[10px] font-black text-secondary uppercase tracking-widest hidden md:table-cell">
                  Contact Information
                </th>
                <th className="p-6 text-[10px] font-black text-secondary uppercase tracking-widest hidden lg:table-cell">
                  Location & Tenure
                </th>
                <th className="p-6 text-[10px] font-black text-secondary uppercase tracking-widest text-center">
                  Status / Role
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                [1, 2, 3].map((i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan="4" className="p-5">
                      <div className="h-12 bg-gray-100 rounded-2xl" />
                    </td>
                  </tr>
                ))
              ) : !searched ? (
                <tr>
                  <td
                    colSpan="4"
                    className="p-20 text-center text-secondary/10 font-black italic text-lg uppercase tracking-widest"
                  >
                    Enter a name, email, or phone to search
                  </td>
                </tr>
              ) : results.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className="p-20 text-center text-secondary/10 font-black italic text-lg uppercase tracking-widest"
                  >
                    No employees found
                  </td>
                </tr>
              ) : (
                results.map((employee, i) => (
                  <motion.tr
                    key={employee._id}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="group hover:bg-gray-50/30 transition-all cursor-pointer"
                  >
                    <td className="p-6">
                      <div className="flex items-center gap-4">
                        <ProfileAvatar user={employee} className="w-12 h-12 text-sm" />
                        <div>
                          <div className="text-sm font-black text-primary tracking-tight">
                            {employee.name || "Anonymous"}
                          </div>
                          <div className="text-[10px] font-bold text-secondary/40 uppercase tracking-widest">
                            {employee.position || "Employee"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-6 hidden md:table-cell">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-primary/60">
                          <Mail size={12} className="text-secondary/30" />
                          {employee.email || "—"}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-primary/60">
                          <Phone size={12} className="text-secondary/30" />
                          {employee.phone || "—"}
                        </div>
                      </div>
                    </td>
                    <td className="p-6 hidden lg:table-cell">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-secondary/40 uppercase">
                          <MapPin size={12} className="text-secondary/20" />
                          {employee.address || "Office"}
                        </div>
                        <div className="flex flex-col gap-1 mt-1">
                          {employee.dateOfBirth && (
                            <div className="text-[9px] font-black text-secondary/40 uppercase tracking-tighter flex items-center gap-1">
                              <Calendar size={10} /> Born: {formatDateDMY(employee.dateOfBirth)}
                            </div>
                          )}
                          <div className="text-[9px] font-black text-primary/40 uppercase tracking-tighter flex items-center gap-1">
                            <UserPlus size={10} /> Joined: {employee.dateOfJoining ? formatDateDMY(employee.dateOfJoining) : "TBD"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-6 text-center">
                      {(role === "admin" || role === "hr") && employee.role ? (
                        <span
                          className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border inline-block ${roleBadgeStyle(
                            employee.role
                          )}`}
                        >
                          {employee.role}
                        </span>
                      ) : (
                        <span className="px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest bg-green-50 text-green-600 border border-green-200 inline-block">
                          Active
                        </span>
                      )}
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SharedContactEmployee;
