import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Briefcase, Calendar, IndianRupee, FileText, CheckCircle, XCircle, File, Eye } from "lucide-react";

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

const UserViewModal = ({ isOpen, onClose, userId }) => {
  const [activeTab, setActiveTab] = useState("basic");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserFullDetails();
      setActiveTab("basic");
    }
  }, [isOpen, userId]);

  const fetchUserFullDetails = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetchJson(`/admin/users/${userId}/view`);
      setData(res);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load user details");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? "N/A" : d.toLocaleDateString("en-GB");
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? "N/A" : d.toLocaleTimeString("en-GB", { hour: '2-digit', minute: '2-digit' });
  };

  const tabs = [
    { id: "basic", label: "Basic Info", icon: <User size={16} /> },
    { id: "employment", label: "Employment", icon: <Briefcase size={16} /> },
    { id: "attendance", label: "Attendance", icon: <Calendar size={16} /> },
    { id: "leaves", label: "Leaves", icon: <FileText size={16} /> },
    { id: "salary", label: "Salary History", icon: <IndianRupee size={16} /> },
    { id: "documents", label: "Documents", icon: <File size={16} /> },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-primary/30 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 cursor-default"
          onClick={onClose}
        />
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative bg-white w-full max-w-4xl p-6 md:p-8 rounded-[2.5rem] shadow-2xl border border-gray-100 flex flex-col max-h-[85vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
            <div>
              <h3 className="text-2xl font-black text-primary tracking-tight">
                {loading ? "Loading Profile..." : data?.user?.name || "User Profile"}
              </h3>
              <p className="text-secondary text-xs font-semibold opacity-70">
                {data?.user?.position} • <span className="uppercase">{data?.user?.role}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2.5 bg-gray-50 hover:bg-gray-100 text-secondary hover:text-primary rounded-xl transition-all"
            >
              <X size={20} />
            </button>
          </div>

          {/* Loading / Error states */}
          {loading && (
            <div className="flex-1 flex flex-col items-center justify-center p-20 animate-pulse text-secondary font-bold">
              Fetching personnel data sheets...
            </div>
          )}

          {error && (
            <div className="flex-1 flex flex-col items-center justify-center p-10 text-red-500 font-bold">
              ⚠️ {error}
            </div>
          )}

          {/* Modal Content */}
          {!loading && !error && data && (
            <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden">
              {/* Sidebar Tabs */}
              <div className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0 border-b md:border-b-0 md:border-r border-gray-100 pr-0 md:pr-4 shrink-0">
                {tabs.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={`flex items-center gap-2.5 px-4 py-3 rounded-xl font-bold text-xs whitespace-nowrap transition-all outline-none ${
                      activeTab === t.id
                        ? "bg-primary text-white shadow-lg shadow-primary/20"
                        : "text-secondary hover:bg-gray-50 hover:text-primary"
                    }`}
                  >
                    {t.icon}
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Tab Panels */}
              <div className="flex-1 overflow-y-auto pr-2 no-scrollbar">
                {/* 1. Basic Info */}
                {activeTab === "basic" && (
                  <div className="space-y-6">
                    <h4 className="text-base font-bold text-primary border-b border-gray-50 pb-2">Basic Personal Profile</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { label: "Full Name", val: data.user.name },
                        { label: "Email Address", val: data.user.email },
                        { label: "Phone Number", val: data.user.phone || "N/A" },
                        { label: "Address", val: data.user.address || "N/A" },
                        { label: "Date of Birth", val: formatDate(data.user.dateOfBirth) },
                        { label: "Marital Status", val: data.user.isMarried ? "Married" : "Single" },
                        { label: "Marriage Anniversary", val: data.user.isMarried ? formatDate(data.user.marriageAnniversary) : "N/A" },
                        { label: "Account Status", val: data.user.isActive ? "Active" : "Inactive" },
                      ].map((item, idx) => (
                        <div key={idx} className="bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                          <div className="text-[10px] font-black text-secondary uppercase tracking-wider">{item.label}</div>
                          <div className="text-sm font-bold text-primary mt-1">{item.val}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Employment */}
                {activeTab === "employment" && (
                  <div className="space-y-6">
                    <h4 className="text-base font-bold text-primary border-b border-gray-50 pb-2">Corporate Employment Info</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { label: "Assigned Position", val: data.user.position || "N/A" },
                        { label: "Date of Joining", val: formatDate(data.user.dateOfJoining) },
                        { label: "Access Privilege (Role)", val: data.user.role?.toUpperCase() || "N/A" },
                        { label: "Annual Leave Allowance", val: `${data.user.leaveAllowance ?? 12} Days` },
                      ].map((item, idx) => (
                        <div key={idx} className="bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                          <div className="text-[10px] font-black text-secondary uppercase tracking-wider">{item.label}</div>
                          <div className="text-sm font-bold text-primary mt-1">{item.val}</div>
                        </div>
                      ))}
                    </div>
                    
                    <h5 className="text-xs font-black text-secondary uppercase tracking-wider mt-4">Reporting Authorities</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {[
                        { label: "Reporting Manager", val: data.user.reportingManager?.name || "N/A", sub: data.user.reportingManager?.role },
                        { label: "Technical Reporting", val: data.user.technicalReporting?.name || "N/A", sub: data.user.technicalReporting?.role },
                        { label: "Administrative Reporting", val: data.user.administrativeReporting?.name || "N/A", sub: data.user.administrativeReporting?.role },
                      ].map((item, idx) => (
                        <div key={idx} className="bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                          <div className="text-[10px] font-black text-secondary uppercase tracking-wider">{item.label}</div>
                          <div className="text-sm font-bold text-primary mt-1">{item.val}</div>
                          {item.sub && <div className="text-[10px] text-secondary font-bold uppercase mt-0.5">{item.sub}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Attendance */}
                {activeTab === "attendance" && (
                  <div className="space-y-6">
                    <h4 className="text-base font-bold text-primary border-b border-gray-50 pb-2">Recent Attendance Timeline (Last 100 Logs)</h4>
                    {data.attendance?.length === 0 ? (
                      <div className="text-center py-10 font-bold text-secondary italic opacity-60">No attendance records found</div>
                    ) : (
                      <div className="border border-gray-100 rounded-2xl overflow-hidden">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-gray-50 text-secondary uppercase tracking-widest text-[9px] font-black border-b border-gray-150">
                              <th className="p-3">Date</th>
                              <th className="p-3">Check-In</th>
                              <th className="p-3">Check-Out</th>
                              <th className="p-3">Late/Early Details</th>
                              <th className="p-3">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50 font-bold">
                            {data.attendance.map((att) => {
                              const lateMin = att.late_minutes || 0;
                              const earlyMin = att.early_checkout_minutes || 0;
                              return (
                                <tr key={att._id} className="hover:bg-gray-50/50">
                                  <td className="p-3 text-primary">{formatDate(att.date)}</td>
                                  <td className="p-3 text-secondary">{formatTime(att.checkIn)}</td>
                                  <td className="p-3 text-secondary">{formatTime(att.checkOut)}</td>
                                  <td className="p-3 text-[10px]">
                                    {att.is_late && <div className="text-red-500 font-bold">Late: {lateMin} mins</div>}
                                    {att.is_early_checkout && <div className="text-amber-500 font-bold">Early: {earlyMin} mins</div>}
                                    {!att.is_late && !att.is_early_checkout && <div className="text-green-600 font-bold">On Time</div>}
                                  </td>
                                  <td className="p-3">
                                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase border ${
                                      att.attendance_status === "On Time" ? "bg-green-50 text-green-600 border-green-200" :
                                      att.attendance_status?.startsWith("Half Day") ? "bg-blue-50 text-blue-600 border-blue-200" :
                                      att.attendance_status === "Late" || att.attendance_status === "Very Late" ? "bg-red-50 text-red-500 border-red-200" :
                                      "bg-amber-50 text-amber-600 border-amber-200"
                                    }`}>
                                      {att.attendance_status || att.status}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* 4. Leaves */}
                {activeTab === "leaves" && (
                  <div className="space-y-6">
                    <h4 className="text-base font-bold text-primary border-b border-gray-50 pb-2">Leave Summary & Application Logs</h4>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 text-center">
                        <div className="text-[10px] font-black text-secondary uppercase tracking-wider">Leave Allowance</div>
                        <div className="text-2xl font-black text-primary mt-1">{data.user.leaveAllowance ?? 12}d</div>
                      </div>
                      <div className="bg-green-50/20 p-4 rounded-xl border border-green-100 text-center">
                        <div className="text-[10px] font-black text-green-600 uppercase tracking-wider">Approved Leaves</div>
                        <div className="text-2xl font-black text-green-600 mt-1">
                          {data.leaves?.filter(l => l.status === "Approved").reduce((acc, curr) => acc + (curr.totalDays || 0), 0) || 0}d
                        </div>
                      </div>
                      <div className="bg-amber-50/20 p-4 rounded-xl border border-amber-100 text-center">
                        <div className="text-[10px] font-black text-amber-600 uppercase tracking-wider">Pending Applications</div>
                        <div className="text-2xl font-black text-amber-600 mt-1">
                          {data.leaves?.filter(l => l.status === "Pending").length || 0}
                        </div>
                      </div>
                    </div>

                    {data.leaves?.length === 0 ? (
                      <div className="text-center py-10 font-bold text-secondary italic opacity-60">No leave logs available</div>
                    ) : (
                      <div className="border border-gray-100 rounded-2xl overflow-hidden">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-gray-50 text-secondary uppercase tracking-widest text-[9px] font-black border-b border-gray-150">
                              <th className="p-3">Period</th>
                              <th className="p-3">Duration</th>
                              <th className="p-3">Type & Reason</th>
                              <th className="p-3">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50 font-bold">
                            {data.leaves.map((l) => (
                              <tr key={l._id} className="hover:bg-gray-50/50">
                                <td className="p-3 text-primary">
                                  {formatDate(l.fromDate)} → {formatDate(l.toDate)}
                                </td>
                                <td className="p-3 text-primary">
                                  {l.totalDays} Days
                                </td>
                                <td className="p-3">
                                  <div className="text-primary truncate max-w-[200px]">{l.reason || "Casual Leave"}</div>
                                  {l.halfDay && (
                                    <span className="text-[8px] font-black bg-blue-50 text-blue-600 border border-blue-150 px-1 py-0.2 rounded uppercase leading-none mt-1 inline-block">
                                      {l.halfDayType === "first_half" ? "First Half" : "Second Half"}
                                    </span>
                                  )}
                                </td>
                                <td className="p-3">
                                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase border ${
                                    l.status === "Approved" ? "bg-green-50 text-green-600 border-green-200" :
                                    l.status === "Pending" ? "bg-amber-50 text-amber-600 border-amber-200" : "bg-red-50 text-red-500 border-red-200"
                                  }`}>
                                    {l.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* 5. Salary */}
                {activeTab === "salary" && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                      <h4 className="text-base font-bold text-primary">Salary Configuration & Credits</h4>
                      <div className="text-right">
                        <span className="text-[10px] font-black text-secondary uppercase block">Annual CTC</span>
                        <span className="text-base font-black text-primary">₹ {data.user.salary?.toLocaleString("en-IN") || 0}</span>
                      </div>
                    </div>

                    {data.salaries?.length === 0 ? (
                      <div className="text-center py-10 font-bold text-secondary italic opacity-60">No salary disbursement records found</div>
                    ) : (
                      <div className="border border-gray-100 rounded-2xl overflow-hidden">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-gray-50 text-secondary uppercase tracking-widest text-[9px] font-black border-b border-gray-150">
                              <th className="p-3">Month/Year</th>
                              <th className="p-3">Base Amount</th>
                              <th className="p-3">Bonus Applied</th>
                              <th className="p-3">Total Paid</th>
                              <th className="p-3">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50 font-bold">
                            {data.salaries.map((sal) => (
                              <tr key={sal._id} className="hover:bg-gray-50/50">
                                <td className="p-3 text-primary">{sal.month} {sal.year}</td>
                                <td className="p-3 text-secondary">₹ {sal.baseSalary?.toLocaleString("en-IN")}</td>
                                <td className="p-3 text-green-600">+ ₹ {sal.bonus?.toLocaleString("en-IN")}</td>
                                <td className="p-3 text-primary font-black">₹ {sal.totalCredited?.toLocaleString("en-IN")}</td>
                                <td className="p-3">
                                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase border ${
                                    sal.isCredited ? "bg-green-50 text-green-600 border-green-200" : "bg-red-50 text-red-500 border-red-200"
                                  }`}>
                                    {sal.isCredited ? "Credited" : "Hold"}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* 6. Documents */}
                {activeTab === "documents" && (
                  <div className="space-y-6">
                    <h4 className="text-base font-bold text-primary border-b border-gray-50 pb-2">Uploaded Document Status</h4>
                    <div className="border border-gray-100 rounded-2xl overflow-hidden">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-gray-50 text-secondary uppercase tracking-widest text-[9px] font-black border-b border-gray-150">
                            <th className="p-3">Document Name</th>
                            <th className="p-3">Upload Date</th>
                            <th className="p-3">Verification</th>
                            <th className="p-3 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 font-bold">
                          {Object.entries(data.user.documents || {}).map(([key, doc]) => {
                            if (typeof doc !== "object" || !doc || !doc.path) return null;
                            const displayName = key.replace(/([A-Z])/g, ' $1').toUpperCase();
                            return (
                              <tr key={key} className="hover:bg-gray-50/50">
                                <td className="p-3 text-primary text-[11px] font-black tracking-tight">{displayName}</td>
                                <td className="p-3 text-secondary">{formatDate(doc.uploadedAt)}</td>
                                <td className="p-3">
                                   <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase border flex items-center gap-1 w-fit ${
                                     doc.verified ? "bg-green-50 text-green-600 border-green-200" : doc.rejectionReason ? "bg-red-50 text-red-500 border-red-200" : "bg-amber-50 text-amber-600 border-amber-200"
                                   }`}>
                                     {doc.verified ? <CheckCircle size={10} /> : <XCircle size={10} />}
                                     {doc.verified ? "Verified" : doc.rejectionReason ? "Rejected" : "Pending"}
                                   </span>
                                   {doc.rejectionReason && (
                                     <div className="text-[10px] text-red-500 mt-1 font-bold">
                                       Reason: {doc.rejectionReason}
                                     </div>
                                   )}
                                 </td>
                                <td className="p-3 text-center">
                                  <a
                                    href={doc.path}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 text-primary hover:text-secondary text-[10px] font-black uppercase tracking-wider bg-primary/10 hover:bg-primary/20 px-2 py-1 rounded-lg transition"
                                  >
                                    <Eye size={12} /> View
                                  </a>
                                </td>
                              </tr>
                            );
                          })}
                          {/* Aadhar details / banks details checks */}
                          {(!data.user.documents || Object.keys(data.user.documents).filter(k => typeof data.user.documents[k] === "object" && data.user.documents[k] && data.user.documents[k].path).length === 0) && (
                            <tr>
                              <td colSpan="4" className="p-10 text-center text-secondary font-bold italic opacity-60">
                                No profile documents uploaded yet
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default UserViewModal;
