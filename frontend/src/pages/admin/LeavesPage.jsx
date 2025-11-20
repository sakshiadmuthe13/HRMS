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

const AdminLeaves = () => {
  const [leaves, setLeaves] = useState([]);
  const [modal, setModal] = useState({ show: false, type: "", message: "" });
  const [pendingAction, setPendingAction] = useState({ id: null, type: "" });

  useEffect(() => {
    fetchAllLeaves();
  }, []);

  const fetchAllLeaves = async () => {
    try {
      const res = await fetchJson("/admin/leave/all");
      setLeaves(res || []);
    } catch (e) {
      console.error(e);
      setModal({ show: true, type: "error", message: "Failed to fetch leaves." });
    }
  };

  const handleAction = async (id, action) => {
    try {
      setPendingAction({ id, type: action });
      await fetchJson(`/admin/leave/${id}/${action}`, { method: "PATCH" });
      await fetchAllLeaves();
      setModal({ show: true, type: "success", message: `Leave ${action} successfully! ✅` });
    } catch (e) {
      console.error(e);
      setModal({ show: true, type: "error", message: "Failed to perform action." });
    } finally {
      setPendingAction({ id: null, type: "" });
    }
  };

  const closeModal = () => setModal({ show: false, type: "", message: "" });

  return (
    <div className="min-h-[calc(100vh-48px)] bg-[#111828] text-[var(--color-text-primary)] p-3 sm:p-4 md:p-6 overflow-x-hidden">
      <h2 className="text-2xl sm:text-3xl font-bold text-[#A756FA] mb-4 sm:mb-6">📝 Leaves</h2>

      <div className="card-glow bg-[var(--color-surface)] p-6 rounded-xl">
        <div className="overflow-x-auto">
          <table className="w-full table-auto text-left">
            <thead>
              <tr className="text-sm text-gray-400">
                <th className="py-3">Applicant</th>
                <th>Role</th>
                <th>From</th>
                <th>To</th>
                <th>Days</th>
                <th>Reason</th>
                <th>Status</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {leaves.length === 0 && (
                <tr>
                  <td colSpan="8" className="py-6 text-center text-sm text-gray-400">
                    No leave applications yet
                  </td>
                </tr>
              )}
              {leaves.map((l) => {
                const from = new Date(l.fromDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
                const to = new Date(l.toDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
                const applicant = l.user || {};
                const isProcessing = pendingAction.id === l._id;
                const statusLabel = isProcessing
                  ? (pendingAction.type === 'approve' ? 'Approving…' : 'Rejecting…')
                  : l.status;
                const statusClass = isProcessing
                  ? "px-2 py-1 rounded bg-yellow-600/40 text-sm animate-pulse"
                  : l.status === "Pending"
                  ? "px-2 py-1 rounded bg-yellow-600/40 text-sm"
                  : l.status === "Approved"
                  ? "px-2 py-1 rounded bg-green-600/30 text-sm"
                  : "px-2 py-1 rounded bg-red-600/30 text-sm";
                return (
                  <tr key={l._id} className="border-t">
                    <td className="py-4">{applicant.name ?? "Unknown"}</td>
                    <td>{applicant.role ?? "—"}</td>
                    <td>{from}</td>
                    <td>{to}</td>
                    <td>{l.totalDays ?? calcTotalDays(l.fromDate, l.toDate)}</td>
                    <td className="max-w-[320px]">{l.reason}</td>
                    <td>
                      <span className={statusClass}>
                        {statusLabel}
                      </span>
                    </td>
                    <td className="text-center">
                      {l.status === "Pending" ? (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            disabled={Boolean(pendingAction.id)}
                            onClick={() => handleAction(l._id, "approve")}
                            className="px-3 py-1 rounded bg-green-500 text-white disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            {isProcessing && pendingAction.type === 'approve' ? (
                              <>
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                </svg>
                                Approving…
                              </>
                            ) : (
                              "Approve"
                            )}
                          </button>
                          <button
                            disabled={Boolean(pendingAction.id)}
                            onClick={() => handleAction(l._id, "reject")}
                            className="px-3 py-1 rounded bg-red-500 text-white disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            {isProcessing && pendingAction.type === 'reject' ? (
                              <>
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                </svg>
                                Rejecting…
                              </>
                            ) : (
                              "Reject"
                            )}
                          </button>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-400">—</div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL */}
      {modal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn p-3 sm:p-4">
          <div className="bg-[var(--color-surface)] border border-[var(--color-accent)] rounded-2xl shadow-lg p-6 sm:p-8 w-full max-w-md text-center card-glow animate-scaleIn">
            <div className="text-5xl mb-4">
              {modal.type === "success" ? "✅" : "❌"}
            </div>
            <h3 className="text-2xl font-semibold mb-2">
              {modal.type === "success" ? "Success!" : "Error!"}
            </h3>
            <p className="text-[var(--color-text-secondary)] mb-6">{modal.message}</p>
            <button
              onClick={closeModal}
              className="px-6 py-2 bg-[var(--color-primary)] text-white font-medium rounded-xl hover:bg-[var(--color-primary-dark)] transition-all duration-300 shadow-md"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLeaves;
