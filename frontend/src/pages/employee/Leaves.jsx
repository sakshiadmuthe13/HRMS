import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { parseISO, differenceInCalendarDays, startOfYear, endOfYear, max as dateMax, min as dateMin, format } from "date-fns";
import { Info, Calendar, Plus, FileText, CheckCircle2, XCircle, AlertTriangle, ArrowRight, History } from "lucide-react";
import DatePicker from "../../components/DatePicker";

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

const convertDMYToYMD = (dmy) => {
  if (!dmy) return "";
  const parts = dmy.split("/");
  if (parts.length !== 3) return "";
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
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

const calcTotalDays = (start, end) => {
  if (!start || !end) return 0;
  const s = new Date(start);
  const e = new Date(end);
  if (isNaN(s) || isNaN(e)) return 0;
  return differenceInCalendarDays(e, s) + 1;
};

const calcApprovedDaysThisYear = (leaves) => {
  const now = new Date();
  const yearStart = startOfYear(now);
  const yearEnd = endOfYear(now);
  let total = 0;
  (leaves || []).forEach(l => {
    if (l.status !== "Approved") return;
    const from = parseISO(l.fromDate);
    const to = parseISO(l.toDate);
    const actualStart = dateMax([from, yearStart]);
    const actualEnd = dateMin([to, yearEnd]);
    if (actualStart <= actualEnd) {
      total += differenceInCalendarDays(actualEnd, actualStart) + 1;
    }
  });
  return total;
};

const Leaves = () => {
  const [leaves, setLeaves] = useState([]);
  const [leaveAllowance, setLeaveAllowance] = useState(12);
  const [remainingPaid, setRemainingPaid] = useState(12);
  const [approvedUsedDays, setApprovedUsedDays] = useState(null);
  const [unpaidUsedDays, setUnpaidUsedDays] = useState(null);
  const [loading, setLoading] = useState(false);
  const role = localStorage.getItem("role");
  const [form, setForm] = useState({ fromDate: "", toDate: "", reason: "" });
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({ fromDate: "", toDate: "", reason: "", id: "" });
  const [savingEdit, setSavingEdit] = useState(false);
  const [modal, setModal] = useState({ show: false, type: "", message: "", onConfirm: null });

  useEffect(() => { fetchMyLeaves(); }, []);

  const fetchMyLeaves = async () => {
    try {
      setLoading(true);
      const res = await fetchJson("/employee/leave/my");
      const { leaves: list = [], leaveAllowance: allowance = 12, approvedUsedDays: srvApprovedUsed = null, unpaidUsedDays: srvUnpaidUsed = null } = res || {};
      setLeaves(list);
      setLeaveAllowance(allowance);
      if (srvApprovedUsed !== null) setApprovedUsedDays(srvApprovedUsed);
      if (srvUnpaidUsed !== null) setUnpaidUsedDays(srvUnpaidUsed);
      const used = srvApprovedUsed !== null ? srvApprovedUsed : calcApprovedDaysThisYear(list);
      setRemainingPaid(Math.max(0, allowance - used));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const apply = async () => {
    const { fromDate, toDate, reason } = form;
    if (!fromDate || !toDate || !reason) return setModal({ show: true, type: "error", message: "Please complete all fields." });
    
    const fromDateYMD = convertDMYToYMD(fromDate);
    const toDateYMD = convertDMYToYMD(toDate);
    if (new Date(toDateYMD) < new Date(fromDateYMD)) return setModal({ show: true, type: "error", message: "Invalid date range." });

    const requestedDays = calcTotalDays(fromDateYMD, toDateYMD);

    const submit = async () => {
      try {
        await fetchJson("/employee/leave/apply", { method: "POST", body: JSON.stringify({ fromDate: fromDateYMD, toDate: toDateYMD, reason }) });
        setForm({ fromDate: "", toDate: "", reason: "" });
        await fetchMyLeaves();
        setModal({ show: true, type: "success", message: "Application submitted successfully." });
      } catch (err) { setModal({ show: true, type: "error", message: err.message }); }
    };

    if (role !== "admin" && remainingPaid < requestedDays) {
      setModal({
        show: true,
        type: "info",
        message: `Requested: ${requestedDays} days\nAvailable: ${remainingPaid} paid days\n\n${requestedDays - remainingPaid} days will be UNPAID.`,
        onConfirm: submit
      });
    } else {
      await submit();
    }
  };

  const openEdit = (l) => {
    setEditing(l);
    setEditForm({ 
      fromDate: formatDateDMY(l.fromDate), 
      toDate: formatDateDMY(l.toDate), 
      reason: l.reason || "", 
      id: l._id 
    });
  };

  const saveEdit = async () => {
    try {
      setSavingEdit(true);
      const fromDateYMD = convertDMYToYMD(editForm.fromDate);
      const toDateYMD = convertDMYToYMD(editForm.toDate);
      await fetchJson(`/employee/leave/${editForm.id}`, { 
        method: "PATCH", 
        body: JSON.stringify({ fromDate: fromDateYMD, toDate: toDateYMD, reason: editForm.reason }) 
      });
      await fetchMyLeaves();
      setEditing(null);
      setModal({ show: true, type: "success", message: "Application updated." });
    } catch (err) { setModal({ show: true, type: "error", message: err.message }); }
    finally { setSavingEdit(false); }
  };

  const approvedUsed = approvedUsedDays ?? calcApprovedDaysThisYear(leaves);
  const paidUsed = Math.min(approvedUsed, leaveAllowance);
  const unpaidUsed = unpaidUsedDays ?? Math.max(0, approvedUsed - leaveAllowance);

  return (
    <div className="animate-fadeIn max-w-7xl mx-auto space-y-12 pb-20">
      
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-10 animate-slideUp">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shrink-0">
            <FileText size={28} />
          </div>
          <div>
            <h2 className="text-5xl font-black text-primary tracking-tighter mb-3 leading-tight">My Leaves</h2>
            <div className="inline-flex items-center gap-3 text-secondary/80 font-bold text-sm bg-white px-5 py-2.5 rounded-2xl shadow-sm border border-gray-100">
              <Calendar size={18} className="text-primary" />
              {format(new Date(), 'EEEE, do MMMM yyyy')}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Annual Allowance", val: leaveAllowance, icon: <Calendar />, color: "bg-primary text-white", desc: "Total paid days per year" },
          { label: "Utilized Days", val: paidUsed, icon: <CheckCircle2 />, color: "bg-green-50 text-green-600", desc: "Approved paid leave" },
          { label: "Unpaid Days", val: unpaidUsed, icon: <AlertTriangle />, color: "bg-amber-50 text-amber-600", desc: "Exceeded allowance" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-[2.5rem] shadow-xl shadow-primary/5 border border-gray-200 flex flex-col items-center text-center group hover:border-primary transition-all"
          >
            <div className={`p-4 rounded-2xl ${stat.color} mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-current/10`}>
              {React.cloneElement(stat.icon, { size: 24 })}
            </div>
            <div className="text-3xl font-black text-primary mb-1">{stat.val}</div>
            <div className="text-[10px] font-black text-secondary uppercase tracking-[0.2em]">{stat.label}</div>
            <div className="text-[10px] text-secondary/50 mt-2 font-bold">{stat.desc}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-200 sticky top-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-primary/10 rounded-xl text-primary">
                <Plus size={20} />
              </div>
              <h3 className="text-xl font-black text-primary tracking-tight">Apply for Leave</h3>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-secondary uppercase tracking-widest px-1">Start Date</label>
                  <DatePicker 
                    value={form.fromDate} 
                    onChange={(val) => setForm(f => ({ ...f, fromDate: val }))} 
                    placeholder="DD/MM/YYYY" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-secondary uppercase tracking-widest px-1">End Date</label>
                  <DatePicker 
                    value={form.toDate} 
                    onChange={(val) => setForm(f => ({ ...f, toDate: val }))} 
                    placeholder="DD/MM/YYYY" 
                  />
                </div>
              </div>

              <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2 text-secondary font-bold text-xs uppercase tracking-tight">
                  <Info size={14} /> Total Duration
                </div>
                <div className="text-lg font-black text-primary">
                  {calcTotalDays(convertDMYToYMD(form.fromDate), convertDMYToYMD(form.toDate)) || "0"} <span className="text-[10px] uppercase font-black opacity-40">Days</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-secondary uppercase tracking-widest px-1">Purpose of Leave</label>
                <textarea 
                  value={form.reason} 
                  onChange={(e) => setForm(f => ({ ...f, reason: e.target.value }))}
                  className="w-full bg-gray-50/50 border border-gray-200 text-primary font-bold text-sm p-4 rounded-2xl outline-none focus:ring-4 focus:ring-primary/10 transition-all min-h-[120px] resize-none"
                  placeholder="Tell us why you need this time..."
                />
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={apply}
                  className="flex-1 py-4 bg-primary text-white font-black rounded-2xl hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 active:scale-95"
                >
                  SUBMIT APPLICATION
                </button>
                <button 
                  onClick={() => setForm({ fromDate: "", toDate: "", reason: "" })}
                  className="px-6 bg-gray-50 text-secondary font-black rounded-2xl border border-gray-200 hover:bg-gray-50 transition-all"
                >
                  RESET
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7">
          <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-200 overflow-hidden">
            <div className="p-8 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-secondary/10 rounded-xl text-secondary">
                  <History size={20} />
                </div>
                <h3 className="text-xl font-black text-primary tracking-tight">Recent Logs</h3>
              </div>
              <span className="text-[10px] font-black text-secondary uppercase tracking-widest">{leaves.length} Applications</span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="p-5 text-[10px] font-black text-secondary uppercase tracking-widest">Duration</th>
                    <th className="p-5 text-[10px] font-black text-secondary uppercase tracking-widest">Type / Reason</th>
                    <th className="p-5 text-[10px] font-black text-secondary uppercase tracking-widest">Status</th>
                    <th className="p-5 text-[10px] font-black text-secondary uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {leaves.length === 0 ? (
                    <tr><td colSpan="4" className="p-10 text-center text-secondary font-bold italic opacity-40">No leave applications found</td></tr>
                  ) : (
                    leaves.map((l) => (
                      <tr key={l._id} className="hover:bg-gray-50 transition-colors group">
                        <td className="p-5">
                          <div className="text-xs font-black text-primary">{formatDateDMY(l.fromDate)}</div>
                          <div className="text-[9px] font-bold text-secondary flex items-center gap-1 mt-1 opacity-60">
                            <ArrowRight size={10} /> {formatDateDMY(l.toDate)}
                          </div>
                        </td>
                        <td className="p-5">
                          <div className="text-[10px] font-black text-primary truncate max-w-[150px] uppercase tracking-tighter">{l.reason || "Casual Leave"}</div>
                          <div className="text-[9px] font-bold text-secondary mt-1">{l.totalDays || 0} Days Requested</div>
                        </td>
                        <td className="p-5">
                          <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter ${
                            l.status === "Approved" ? "bg-green-50 text-green-600 border border-green-200" :
                            l.status === "Pending" ? "bg-amber-50 text-amber-600 border border-amber-200" : "bg-red-50 text-red-500 border border-red-200"
                          }`}>
                            {l.status}
                          </span>
                        </td>
                        <td className="p-5 text-right">
                          {l.status === "Pending" ? (
                            <button 
                              onClick={() => openEdit(l)}
                              className="p-2 text-primary hover:bg-primary/5 rounded-xl transition-all active:scale-95"
                            >
                              <FileText size={16} />
                            </button>
                          ) : <span className="text-[9px] font-bold text-secondary/30 italic">Locked</span>}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {editing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setEditing(null)}
              className="absolute inset-0 bg-primary/20 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-lg p-8 rounded-[2.5rem] shadow-2xl border border-gray-200 overflow-hidden"
            >
              <h3 className="text-2xl font-black text-primary tracking-tight mb-8">Refine Application</h3>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-secondary uppercase tracking-widest px-1">Start Date</label>
                    <DatePicker value={editForm.fromDate} onChange={(val) => setEditForm(f => ({ ...f, fromDate: val }))} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-secondary uppercase tracking-widest px-1">End Date</label>
                    <DatePicker value={editForm.toDate} onChange={(val) => setEditForm(f => ({ ...f, toDate: val }))} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-secondary uppercase tracking-widest px-1">Reason</label>
                  <textarea 
                    value={editForm.reason} 
                    onChange={(e) => setEditForm(f => ({ ...f, reason: e.target.value }))}
                    className="w-full bg-gray-50/50 border border-gray-200 text-primary font-bold text-sm p-4 rounded-2xl outline-none focus:ring-4 focus:ring-primary/10 transition-all min-h-[100px]"
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button onClick={saveEdit} disabled={savingEdit} className="flex-1 py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 active:scale-95 disabled:opacity-50">
                    {savingEdit ? "SAVING..." : "UPDATE APPLICATION"}
                  </button>
                  <button onClick={() => setEditing(null)} className="px-6 bg-gray-50 text-secondary font-black rounded-2xl border border-gray-200 hover:bg-gray-50 transition-all">CANCEL</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modal.show && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-primary/40 backdrop-blur-md" />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white w-full max-w-sm p-10 rounded-[3rem] shadow-2xl text-center border border-gray-200"
            >
              <div className={`w-20 h-20 mx-auto rounded-3xl flex items-center justify-center mb-6 shadow-lg ${
                modal.type === 'success' ? 'bg-green-50 text-green-600' : 
                modal.type === 'error' ? 'bg-red-50 text-red-500' : 'bg-primary/5 text-primary'
              }`}>
                {modal.type === 'success' ? <CheckCircle2 size={40} /> : modal.type === 'error' ? <XCircle size={40} /> : <Info size={40} />}
              </div>
              <h4 className="text-xl font-black text-primary tracking-tight mb-2 uppercase">
                {modal.type === 'success' ? 'All Set!' : modal.type === 'error' ? 'Notice' : 'Allocation Note'}
              </h4>
              <p className="text-secondary font-bold text-sm leading-relaxed mb-8 opacity-70 whitespace-pre-line">{modal.message}</p>
              <div className="flex gap-3">
                {modal.onConfirm && (
                  <button onClick={() => { setModal(m => ({ ...m, show: false })); modal.onConfirm(); }} className="flex-1 py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 active:scale-95">PROCEED</button>
                )}
                <button onClick={() => setModal({ show: false, type: "", message: "", onConfirm: null })} className={`${modal.onConfirm ? 'px-6 bg-gray-50 text-secondary' : 'w-full bg-primary text-white shadow-primary/20'} py-4 font-black rounded-2xl border border-gray-200 active:scale-95`}>
                  {modal.onConfirm ? 'CANCEL' : 'ACKNOWLEDGE'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Leaves;
