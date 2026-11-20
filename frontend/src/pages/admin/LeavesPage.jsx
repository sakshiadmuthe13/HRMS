import React, { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";
const getToken = () => localStorage.getItem("token");

const fetchJson = async (path, opts = {}) => {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...opts,
  });
  if (!res.ok) {
    let text = await res.text();
    try { text = JSON.parse(text); } catch {
      // Ignore JSON parse errors, use text as-is
    }
    throw new Error((text && text.message) || res.statusText || "API error");
  }
  const t = await res.text();
  return t ? JSON.parse(t) : null;
};

const calcTotalDays = (fromStr, toStr) => {
  if (!fromStr || !toStr) return 0;
  const from = new Date(fromStr);
  const to = new Date(toStr);
  if (isNaN(from) || isNaN(to) || to < from) return 0;
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor((to - from) / oneDay) + 1;
};

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, Clock, AlertCircle, ClipboardList } from "lucide-react";

const LeavesPage = () => {
  const role = localStorage.getItem("role") || "admin";
  const isHr = role === "hr";

  const [leaves, setLeaves] = useState([]);
  const [modal, setModal] = useState({ show: false, type: "", message: "" });
  const [pendingAction, setPendingAction] = useState({ id: null, type: "" });

  useEffect(() => {
    fetchAllLeaves();
  }, []);

  const fetchAllLeaves = async () => {
    try {
      const endpoint = isHr ? "/hr/manage/leaves" : "/admin/leave/all";
      const res = await fetchJson(endpoint);
      setLeaves(res || []);
    } catch (e) {
      console.error(e);
      setModal({ show: true, type: "error", message: "Failed to fetch leaves." });
    }
  };

  const handleAction = async (id, action) => {
    try {
      setPendingAction({ id, type: action });
      if (isHr) {
        const statusMap = {
          approve: "Approved",
          reject: "Rejected"
        };
        await fetchJson(`/hr/manage/leave/${id}/status`, {
          method: "PUT",
          body: JSON.stringify({ status: statusMap[action] })
        });
      } else {
        await fetchJson(`/admin/leave/${id}/${action}`, { method: "PATCH" });
      }
      await fetchAllLeaves();
      setModal({ show: true, type: "success", message: `Leave ${action}ed successfully!` });
    } catch (e) {
      console.error(e);
      // The server may have committed the status before a secondary action failed.
      // Reload to avoid leaving a stale Pending row on screen.
      await fetchAllLeaves();
      setModal({ show: true, type: "error", message: e.message || "Failed to perform action." });
    } finally {
      setPendingAction({ id: null, type: "" });
    }
  };

  const closeModal = () => setModal({ show: false, type: "", message: "" });

  return (
    <div className={`min-h-screen bg-background text-primary animate-fadeIn ${isHr ? "max-w-6xl mx-auto space-y-10" : ""}`}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-10 mb-10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shrink-0">
            <ClipboardList size={28} />
          </div>
          <div>
            <h2 className="text-4xl font-black text-primary tracking-tight mb-2">
              {isHr ? "Review Applications" : "Leave Applications"}
            </h2>
            <p className="text-secondary font-medium opacity-80">
              {isHr ? "Review and manage employee leave requests." : "Review and manage employee leave requests."}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-xl shadow-primary/5 border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-200">
                <th className="p-5 font-bold text-secondary uppercase tracking-widest text-xs">Applicant</th>
                <th className="p-5 font-bold text-secondary uppercase tracking-widest text-xs hidden md:table-cell">Role</th>
                <th className="p-5 font-bold text-secondary uppercase tracking-widest text-xs">Duration</th>
                <th className="p-5 font-bold text-secondary uppercase tracking-widest text-xs">Days</th>
                <th className="p-5 font-bold text-secondary uppercase tracking-widest text-xs">Reason</th>
                <th className="p-5 font-bold text-secondary uppercase tracking-widest text-xs">Status</th>
                <th className="p-5 font-bold text-secondary uppercase tracking-widest text-xs text-center">Decision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {leaves.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-20 text-center text-secondary font-medium">
                    No leave applications pending review.
                  </td>
                </tr>
              ) : (
                leaves.map((l) => {
                  const from = new Date(l.fromDate).toLocaleDateString('en-GB');
                  const to = new Date(l.toDate).toLocaleDateString('en-GB');
                  const applicant = l.user || {};
                  const isProcessing = pendingAction.id === l._id;
                  
                  const statusColors = {
                    "Pending": "bg-amber-50 text-amber-600 border-amber-200",
                    "Approved": "bg-green-50 text-green-600 border-green-200",
                    "Rejected": "bg-red-50 text-red-500 border-red-200"
                  };

                  return (
                    <motion.tr 
                      layout
                      key={l._id} 
                      className="hover:bg-primary/5 transition-colors group"
                    >
                      <td className="p-5">
                        <div className="font-bold text-primary">{applicant.name || "Unknown"}</div>
                      </td>
                      <td className="p-5 hidden md:table-cell">
                        <span className="px-3 py-1 bg-gray-50 text-secondary rounded-full text-xs font-bold uppercase tracking-wider">
                          {applicant.role || "—"}
                        </span>
                      </td>
                      <td className="p-5 text-secondary font-medium">
                        <div className="text-xs opacity-60">FROM</div>
                        <div className="text-primary font-bold">{from}</div>
                        <div className="text-xs opacity-60 mt-1">TO</div>
                        <div className="text-primary font-bold">{to}</div>
                      </td>
                      <td className="p-5">
                        <div className="flex flex-col items-start gap-1">
                          <div>
                            <span className="text-lg font-black text-primary">
                              {l.totalDays ?? calcTotalDays(l.fromDate, l.toDate)}
                            </span>
                            <span className="text-xs font-bold text-secondary ml-1">DAYS</span>
                          </div>
                          {l.halfDay && (
                            <span className="text-[8px] font-black bg-blue-50 text-blue-600 border border-blue-200 px-1.5 py-0.5 rounded uppercase leading-none">
                              {l.halfDayType === "first_half" ? "First Half" : "Second Half"}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-5 max-w-xs">
                        <p className="text-secondary font-medium line-clamp-3 text-sm italic">
                          "{l.reason}"
                        </p>
                      </td>
                      <td className="p-5">
                        <span className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest border flex items-center gap-2 w-fit ${statusColors[l.status] || "bg-gray-50 text-gray-500"}`}>
                          {l.status === "Pending" && <Clock size={14} />}
                          {l.status === "Approved" && <CheckCircle2 size={14} />}
                          {l.status === "Rejected" && <XCircle size={14} />}
                          {isProcessing ? "Updating..." : l.status}
                        </span>
                      </td>
                      <td className="p-5">
                        {l.status === "Pending" ? (
                          <div className="flex items-center justify-center gap-3">
                            <button
                              disabled={Boolean(pendingAction.id)}
                              onClick={() => handleAction(l._id, "approve")}
                              className="p-3 bg-green-50 text-green-600 rounded-2xl hover:bg-green-500 hover:text-white transition-all shadow-lg shadow-green-500/10 active:scale-95"
                              title="Approve"
                            >
                              <CheckCircle2 size={20} />
                            </button>
                            <button
                              disabled={Boolean(pendingAction.id)}
                              onClick={() => handleAction(l._id, "reject")}
                              className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-500/10 active:scale-95"
                              title="Reject"
                            >
                              <XCircle size={20} />
                            </button>
                          </div>
                        ) : (
                          <div className="text-center text-secondary opacity-20">—</div>
                        )}
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL */}
      <AnimatePresence>
        {modal.show && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/20 backdrop-blur-md p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white p-8 rounded-[2.5rem] w-full max-w-md shadow-2xl border border-gray-200 text-center"
            >
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl ${modal.type === "success" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}>
                {modal.type === "success" ? <CheckCircle2 size={40} /> : <AlertCircle size={40} />}
              </div>
              <h3 className="text-2xl font-black mb-3 text-primary tracking-tight">
                {modal.type === "success" ? "Action Complete" : "Error Occurred"}
              </h3>
              <p className="text-secondary font-medium mb-8 leading-relaxed">{modal.message}</p>
              <button
                onClick={closeModal}
                className="w-full py-4 bg-primary text-white font-bold rounded-2xl hover:bg-secondary transition-all shadow-xl shadow-primary/20"
              >
                Continue
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LeavesPage;
