import React, { useEffect, useState } from "react";
import { parseISO, differenceInCalendarDays, startOfYear, endOfYear, max as dateMax, min as dateMin } from "date-fns";
import DatePicker from "../../components/DatePicker";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";
const getToken = () => localStorage.getItem("token");

const formatDateDMY = (value) => {
  if (!value) return "";
  const dateStr = typeof value === "string" ? value.split("T")[0] : value;
  if (typeof dateStr !== "string") return "";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return "";
  const [yyyy, mm, dd] = parts;
  const d = String(dd).padStart(2, "0");
  const m = String(mm).padStart(2, "0");
  return `${d}/${m}/${yyyy}`;
};

const parseDateDMY = (dateStr) => {
  if (!dateStr) return "";
  try {
    if (dateStr.includes("/")) {
      const [d, m, yyyy] = dateStr.split("/");
      return `${yyyy}-${m}-${d}`;
    }
    return dateStr;
  } catch {
    return "";
  }
};

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
  try { text = JSON.parse(text); } catch (err) { void err; }
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

// Calculate approved leave days falling inside the current calendar year
const calcApprovedDaysThisYear = (leaves = []) => {
  const yearStart = startOfYear(new Date());
  const yearEnd = endOfYear(new Date());
  let used = 0;
  for (const l of leaves) {
    if (!l) continue;
    const status = (l.status || "").toString().toLowerCase();
    if (status !== "approved") continue; // only count approved leaves
    const from = l.fromDate ? parseISO(l.fromDate) : null;
    const to = l.toDate ? parseISO(l.toDate) : null;
    if (!from || !to || isNaN(from) || isNaN(to)) continue;
    // Bound the leave to the current year
    const start = dateMax([from, yearStart]);
    const end = dateMin([to, yearEnd]);
    if (end < start) continue;
    const days = differenceInCalendarDays(end, start) + 1;
    used += days;
  }
  return used;
};


const LeaderLeaves = () => {
  const [leaves, setLeaves] = useState([]);
  const [leaveAllowance, setLeaveAllowance] = useState(12);
  const [remainingPaid, setRemainingPaid] = useState(12); // default 12 paid leaves per year
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ fromDate: "", toDate: "", reason: "" });
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({ fromDate: "", toDate: "", reason: "", id: "" });
  const [savingEdit, setSavingEdit] = useState(false);
  const [modal, setModal] = useState({ show: false, type: "", message: "", onConfirm: null });

  useEffect(() => {
    fetchMyLeaves();
  }, []);

  const fetchMyLeaves = async () => {
    try {
      setLoading(true);
      const res = await fetchJson("/leader/leave/my"); // Leader endpoint
      const { leaves: list = [], leaveAllowance: allowance = 12 } = res || {};
      setLeaves(list);
      setLeaveAllowance(allowance);
      // compute remaining paid leaves from approved leaves
      try {
        const used = calcApprovedDaysThisYear(list);
        setRemainingPaid(Math.max(0, allowance - used));
      } catch (err) {
        console.error("Failed to compute remaining leaves", err);
        setRemainingPaid(12);
      }
    } catch (e) {
      console.error(e);
      setModal({ show: true, type: "error", message: "Failed to fetch leaves. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const apply = async () => {
    try {
      const { fromDate, toDate, reason } = form;
      if (!fromDate || !toDate || !reason)
        return setModal({ show: true, type: "error", message: "Please fill all fields." });
      if (new Date(toDate) < new Date(fromDate))
        return setModal({ show: true, type: "error", message: "To date cannot be before From date." });

      // Calculate requested days
      const requestedDays = calcTotalDays(fromDate, toDate);

      // Show info message if this will be unpaid leave
      const role = localStorage.getItem("role");
      if (role !== "admin" && remainingPaid === 0) {
        // All requested days will be unpaid
        setModal({
          show: true,
          type: "info",
          message: `ℹ️ No Paid Leaves Remaining\n\nYou have used all ${leaveAllowance} paid leave days for this year.\n\nYour request for ${requestedDays} day(s) will be counted as UNPAID LEAVE.\n\nClick OK to continue with unpaid leave application.`,
          onConfirm: async () => {
            try {
              await fetchJson("/leader/leave/apply", {
                method: "POST",
                body: JSON.stringify(form),
              });
              setForm({ fromDate: "", toDate: "", reason: "" });
              await fetchMyLeaves();
              setModal({ show: true, type: "success", message: "Your unpaid leave has been applied successfully! 📋" });
            } catch (err) {
              console.error(err);
              setModal({ show: true, type: "error", message: "Failed to apply leave." });
            }
          }
        });
        return;
      } else if (role !== "admin" && remainingPaid < requestedDays) {
        // Partial unpaid leave
        const paidDays = remainingPaid;
        const unpaidDays = requestedDays - remainingPaid;
        setModal({
          show: true,
          type: "info",
          message: `ℹ️ Partial Paid Leave Available\n\nYou are requesting ${requestedDays} day(s), but only ${paidDays} paid day(s) remaining.\n\n✅ ${paidDays} day(s) will be PAID\n⚠️ ${unpaidDays} day(s) will be UNPAID\n\nClick OK to continue with this leave application.`,
          onConfirm: async () => {
            try {
              await fetchJson("/leader/leave/apply", {
                method: "POST",
                body: JSON.stringify(form),
              });
              setForm({ fromDate: "", toDate: "", reason: "" });
              await fetchMyLeaves();
              setModal({ show: true, type: "success", message: "Your leave has been applied successfully! 🏖️" });
            } catch (err) {
              console.error(err);
              setModal({ show: true, type: "error", message: "Failed to apply leave." });
            }
          }
        });
        return;
      }

      // Normal case - all paid leave or admin
      await fetchJson("/leader/leave/apply", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setForm({ fromDate: "", toDate: "", reason: "" });
      await fetchMyLeaves();
      setModal({ show: true, type: "success", message: "Your leave has been applied successfully! 🏖️" });
    } catch (err) {
      console.error(err);
      setModal({ show: true, type: "error", message: "Failed to apply leave." });
    }
  };

  const openEdit = (leave) => {
    setEditing(leave);
    setEditForm({
      fromDate: new Date(leave.fromDate).toISOString().slice(0, 10),
      toDate: new Date(leave.toDate).toISOString().slice(0, 10),
      reason: leave.reason || "",
      id: leave._id,
    });
  };

  const closeEdit = () => {
    setEditing(null);
    setEditForm({ fromDate: "", toDate: "", reason: "", id: "" });
  };

  const saveEdit = async () => {
    try {
      if (!editForm.fromDate || !editForm.toDate || !editForm.reason)
        return setModal({ show: true, type: "error", message: "Please fill all fields." });
      if (new Date(editForm.toDate) < new Date(editForm.fromDate))
        return setModal({ show: true, type: "error", message: "To date cannot be before From date." });

      // Calculate new requested days
      const newRequestedDays = calcTotalDays(editForm.fromDate, editForm.toDate);

      // Find the original leave to calculate the difference
      const originalLeave = leaves.find(l => l._id === editForm.id);
      const originalDays = originalLeave ? calcTotalDays(originalLeave.fromDate, originalLeave.toDate) : 0;

      // Show info message if this will be unpaid leave (only for approved leaves being edited)
      const role = localStorage.getItem("role");
      if (role !== "admin" && originalLeave?.status === "Approved") {
        const usedDays = leaveAllowance - remainingPaid;
        const usedWithoutOriginal = usedDays - originalDays;
        const availableAfterRemovingOriginal = leaveAllowance - usedWithoutOriginal;

        if (availableAfterRemovingOriginal === 0) {
          // All requested days will be unpaid
          setModal({
            show: true,
            type: "info",
            message: `ℹ️ No Paid Leaves Remaining\n\nYou have used all ${leaveAllowance} paid leave days for this year.\n\nYour updated request for ${newRequestedDays} day(s) will be counted as UNPAID LEAVE.\n\nClick OK to continue.`,
            onConfirm: async () => {
              try {
                setSavingEdit(true);
                await fetchJson(`/leader/leave/${editForm.id}`, {
                  method: "PATCH",
                  body: JSON.stringify({
                    fromDate: editForm.fromDate,
                    toDate: editForm.toDate,
                    reason: editForm.reason,
                  }),
                });
                await fetchMyLeaves();
                closeEdit();
                setModal({ show: true, type: "update", message: "Your leave details have been updated successfully! ✏️" });
              } catch (err) {
                console.error(err);
                setModal({ show: true, type: "error", message: "Failed to update leave." });
              } finally { setSavingEdit(false); }
            }
          });
          return;
        } else if (availableAfterRemovingOriginal < newRequestedDays) {
          // Partial unpaid leave
          const paidDays = availableAfterRemovingOriginal;
          const unpaidDays = newRequestedDays - availableAfterRemovingOriginal;
          setModal({
            show: true,
            type: "info",
            message: `ℹ️ Partial Paid Leave Available\n\nYou are requesting ${newRequestedDays} day(s), but only ${paidDays} paid day(s) remaining.\n\n✅ ${paidDays} day(s) will be PAID\n⚠️ ${unpaidDays} day(s) will be UNPAID\n\nClick OK to continue.`,
            onConfirm: async () => {
              try {
                setSavingEdit(true);
                await fetchJson(`/leader/leave/${editForm.id}`, {
                  method: "PATCH",
                  body: JSON.stringify({
                    fromDate: editForm.fromDate,
                    toDate: editForm.toDate,
                    reason: editForm.reason,
                  }),
                });
                await fetchMyLeaves();
                closeEdit();
                setModal({ show: true, type: "update", message: "Your leave details have been updated successfully! ✏️" });
              } catch (err) {
                console.error(err);
                setModal({ show: true, type: "error", message: "Failed to update leave." });
              } finally { setSavingEdit(false); }
            }
          });
          return;
        }
      }

      // Normal case - all paid leave or admin or pending leave
      setSavingEdit(true);
      await fetchJson(`/leader/leave/${editForm.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          fromDate: editForm.fromDate,
          toDate: editForm.toDate,
          reason: editForm.reason,
        }),
      });
      await fetchMyLeaves();
      closeEdit();
      setModal({ show: true, type: "update", message: "Your leave details have been updated successfully! ✏️" });
    } catch (e) {
      console.error(e);
      setModal({ show: true, type: "error", message: "Failed to update leave." });
    } finally {
      setSavingEdit(false);
    }
  };

  const closeModal = () => setModal({ show: false, type: "", message: "", onConfirm: null });

  const approvedUsed = calcApprovedDaysThisYear(leaves);
  const paidUsed = Math.min(approvedUsed, leaveAllowance);
  const unpaidUsed = Math.max(0, approvedUsed - leaveAllowance);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-[#A756FA] mb-6">📋 Leaves</h2>
        <div className="text-sm bg-white/5 px-3 py-2 rounded-md">
          <span>Yearly allowance: <span className="font-semibold">{leaveAllowance}</span></span>
          <span className="text-gray-300"> &middot; </span>
          <span>Paid Used: <span className="font-semibold">{paidUsed}</span></span>
          <span className="text-gray-300"> &middot; </span>
          <span>Unpaid used: <span className="font-semibold">{unpaidUsed}</span></span>
        </div>
      </div>

      {/* Info message if no paid leaves remaining */}
      {remainingPaid === 0 && localStorage.getItem("role") !== "admin" && (
        <div className="card-glow bg-blue-600/20 border border-blue-500/30 p-4 rounded-xl">
          <div className="flex items-center gap-3">
            <span className="text-2xl">ℹ️</span>
            <div>
              <div className="font-semibold text-blue-300">No Paid Leaves Remaining</div>
              <div className="text-sm text-blue-200">
                You have used all {leaveAllowance} paid leave days for this year.
                Any new leave applications will be counted as <strong>unpaid leaves</strong>.
                Contact an admin if you need to increase your paid leave allowance.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Warning if exceeded */}
      {remainingPaid < 0 && localStorage.getItem("role") !== "admin" && (
        <div className="card-glow bg-red-600/20 border border-red-500/30 p-4 rounded-xl">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <div className="font-semibold text-red-300">Leave allowance exceeded</div>
              <div className="text-sm text-red-200">
                You have used {leaveAllowance - remainingPaid} out of {leaveAllowance} yearly paid leaves.
                Contact an admin to increase your allowance if needed.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* APPLY LEAVE - Always visible */}
      <div className="card-glow bg-[var(--color-surface)] p-6 rounded-xl">
          <h2 className="text-xl font-semibold text-[#58a6ff]">Apply for Leave</h2>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-sm mb-1 block">From</label>
              <DatePicker
                value={formatDateDMY(form.fromDate)}
                onChange={(value) => setForm((f) => ({ ...f, fromDate: parseDateDMY(value) }))}
                placeholder="dd/mm/yyyy"
              />
            </div>
            <div>
              <label className="text-sm mb-1 block">To</label>
              <DatePicker
                value={formatDateDMY(form.toDate)}
                onChange={(value) => setForm((f) => ({ ...f, toDate: parseDateDMY(value) }))}
                placeholder="dd/mm/yyyy"
              />
            </div>
            <div>
              <label className="text-sm mb-1 block">Total days</label>
              <div className="p-2 rounded border min-h-[40px] flex items-center">
                {calcTotalDays(form.fromDate, form.toDate) || "-"}
              </div>
            </div>

            {/* Live validation warning - Show info about unpaid leaves */}
            {(() => {
              const requestedDays = calcTotalDays(form.fromDate, form.toDate);
              const role = localStorage.getItem("role");
              if (requestedDays > 0 && role !== "admin") {
                if (remainingPaid === 0) {
                  return (
                    <div className="sm:col-span-3 bg-blue-900/30 border border-blue-500/50 p-3 rounded-lg">
                      <div className="flex items-start gap-2">
                        <span className="text-blue-400 text-lg">ℹ️</span>
                        <div className="text-sm">
                          <div className="font-semibold text-blue-300">This will be unpaid leave</div>
                          <div className="text-blue-200 mt-1">
                            You have no paid leaves remaining. Requesting {requestedDays} day(s) will be counted as unpaid leave.
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                } else if (requestedDays > remainingPaid) {
                  const paidDays = remainingPaid;
                  const unpaidDays = requestedDays - remainingPaid;
                  return (
                    <div className="sm:col-span-3 bg-yellow-900/30 border border-yellow-500/50 p-3 rounded-lg">
                      <div className="flex items-start gap-2">
                        <span className="text-yellow-400 text-lg">⚠️</span>
                        <div className="text-sm">
                          <div className="font-semibold text-yellow-300">Partial unpaid leave</div>
                          <div className="text-yellow-200 mt-1">
                            {paidDays} day(s) will be paid, {unpaidDays} day(s) will be unpaid.
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }
              }
              return null;
            })()}

            <div className="sm:col-span-3">
              <label className="text-sm mb-1 block">Reason</label>
              <textarea
                value={form.reason}
                onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                className="w-full p-3 rounded border bg-transparent min-h-[80px]"
                placeholder="Explain reason for leave..."
              />
            </div>

            <div className="sm:col-span-3 flex gap-3 pt-2 align-center justify-center">
              <button onClick={apply} className="bg-primary text-white px-4 py-2 rounded">Apply</button>
              <button onClick={() => setForm({ fromDate: "", toDate: "", reason: "" })} className="px-4 py-2 rounded border">Reset</button>
            </div>
          </div>
        </div>

      {/* LEAVES TABLE */}
      <div className="card-glow bg-[var(--color-surface)] p-6 rounded-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-[#58a6ff]">My Leaves</h3>
          <div className="text-sm text-muted">{loading ? "Loading..." : `${leaves.length} requests`}</div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full table-auto text-left">
            <thead>
              <tr className="text-sm text-gray-400">
                <th className="py-2">From</th>
                <th>To</th>
                <th>Days</th>
                <th>Reason</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {leaves.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-6 text-center text-sm text-gray-400">
                    No leaves applied yet
                  </td>
                </tr>
              )}
              {leaves.map((l) => {
                const from = new Date(l.fromDate).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                });
                const to = new Date(l.toDate).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                });
                return (
                  <tr key={l._id} className="border-t">
                    <td className="py-3">{from}</td>
                    <td>{to}</td>
                    <td>{l.totalDays ?? calcTotalDays(l.fromDate, l.toDate)}</td>
                    <td className="max-w-[320px]">{l.reason}</td>
                    <td>
                      <span className={
                        l.status === "Pending"
                          ? "px-2 py-1 rounded bg-yellow-600/40 text-sm"
                          : l.status === "Approved"
                          ? "px-2 py-1 rounded bg-green-600/30 text-sm"
                          : "px-2 py-1 rounded bg-red-600/30 text-sm"
                      }>
                        {l.status}
                      </span>
                    </td>
                    <td className="text-right">
                      {l.status === "Pending" ? (
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openEdit(l)} className="px-3 py-1 rounded border">Edit</button>
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

      {/* EDIT MODAL */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg p-6 rounded-xl card-glow bg-[var(--color-surface)]">
            <h4 className="text-lg font-semibold mb-3">Edit Leave</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm mb-1">From</label>
                <DatePicker
                  value={formatDateDMY(editForm.fromDate)}
                  onChange={(value) => setEditForm((f) => ({ ...f, fromDate: parseDateDMY(value) }))}
                  placeholder="dd/mm/yyyy"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">To</label>
                <DatePicker
                  value={formatDateDMY(editForm.toDate)}
                  onChange={(value) => setEditForm((f) => ({ ...f, toDate: parseDateDMY(value) }))}
                  placeholder="dd/mm/yyyy"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Days</label>
                <div className="p-2 rounded border">{calcTotalDays(editForm.fromDate, editForm.toDate) || "-"}</div>
              </div>
              <div className="sm:col-span-3">
                <label className="block text-sm mb-1">Reason</label>
                <textarea
                  value={editForm.reason}
                  onChange={(e) => setEditForm((f) => ({ ...f, reason: e.target.value }))}
                  className="w-full p-3 rounded border bg-transparent min-h-[90px]"
                />
              </div>
              <div className="sm:col-span-3 flex justify-end gap-3 pt-2">
                <button onClick={closeEdit} className="px-4 py-2 rounded border">Close</button>
                <button onClick={saveEdit} className="px-4 py-2 rounded bg-primary text-white" disabled={savingEdit}>
                  {savingEdit ? "Saving..." : "Save changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL - Support for info type and confirmation */}
      {modal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[var(--color-surface)] border border-[var(--color-accent)] rounded-2xl shadow-lg p-8 w-full max-w-md text-center card-glow animate-scaleIn">
            <div className="text-5xl mb-4">
              {modal.type === "success" && "✅"}
              {modal.type === "update" && "📝"}
              {modal.type === "info" && "ℹ️"}
              {modal.type === "error" && "❌"}
            </div>
            <h3 className="text-2xl font-semibold mb-2 text-[var(--color-text)]">
              {modal.type === "success" ? "Success!" : modal.type === "update" ? "Updated!" : modal.type === "info" ? "Information" : "Error!"}
            </h3>
            <p className="text-[var(--color-text-secondary)] mb-6 whitespace-pre-line">{modal.message}</p>
            <div className="flex gap-3 justify-center">
              {modal.onConfirm ? (
                <>
                  <button
                    onClick={() => {
                      setModal({ show: false, type: "", message: "", onConfirm: null });
                    }}
                    className="px-6 py-2 bg-gray-500 text-white font-medium rounded-xl hover:bg-gray-600 transition-all duration-300 shadow-md"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      const confirmAction = modal.onConfirm;
                      setModal({ show: false, type: "", message: "", onConfirm: null });
                      confirmAction();
                    }}
                    className="px-6 py-2 bg-[var(--color-primary)] text-white font-medium rounded-xl hover:bg-[var(--color-primary-dark)] transition-all duration-300 shadow-md"
                  >
                    OK, Continue
                  </button>
                </>
              ) : (
                <button
                  onClick={closeModal}
                  className="px-6 py-2 bg-[var(--color-primary)] text-white font-medium rounded-xl hover:bg-[var(--color-primary-dark)] transition-all duration-300 shadow-md"
                >
                  OK
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaderLeaves;
