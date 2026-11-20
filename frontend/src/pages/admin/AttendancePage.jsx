import React, { useEffect, useState } from "react";
import DatePicker from "../../components/DatePicker";
import { CalendarCheck, Eye, X, Coffee } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

const fetchJson = async (path, opts = {}) => {
  const token = (() => {
    try {
      return localStorage.getItem("token") || sessionStorage.getItem("token");
    } catch {
      return null;
    }
  })();

  const headers = { ...(opts.headers || {}) };
  if (token && !headers.Authorization && !headers.authorization)
    headers.Authorization = `Bearer ${token}`;

  const res = await fetch(path, { credentials: "include", ...opts, headers });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API Error: ${res.status} - ${text}`);
  }

  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return res.json();
  } else {
    const text = await res.text();
    console.warn("⚠️ Non-JSON response received:", text.slice(0, 200));
    return null;
  }
};

const apiGet = (p) => fetchJson(p);

const isAdminRow = (row) => {
  if (row?.user?.role) return row.user.role === "admin";
  if (row?.role) return row.role === "admin";
  return false;
};

const formatDuration = (mins) => {
  if (!mins) return "0 mins";
  if (mins < 60) return `${mins} mins`;
  const hrs = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return remainingMins > 0 ? `${hrs}h ${remainingMins}m` : `${hrs}h`;
};

const AttendancePage = () => {
  const role = localStorage.getItem("role") || "admin";
  const isHr = role === "hr";

  const getLocalDateDMY = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${dd}/${mm}/${yyyy}`;
  };

  const convertDMYtoYMD = (dmy) => {
    if (!dmy) return "";
    const parts = dmy.split("/");
    if (parts.length !== 3) return "";
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  };

  const [date, setDate] = useState(getLocalDateDMY());
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [breakModal, setBreakModal] = useState({ show: false, name: "", breaks: [], total: 0 });

  const [showReportModal, setShowReportModal] = useState(false);
  const [reportStartDate, setReportStartDate] = useState(getLocalDateDMY());
  const [reportEndDate, setReportEndDate] = useState(getLocalDateDMY());
  const [reportRows, setReportRows] = useState([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState("");

  // Helper: normalize/check various possible shapes from the API/db for check times
  const extractCheck = (row, which) => {
    if (!row) return null;
    if (row[which]) return row[which];
    if (row.attendance && row.attendance[which]) return row.attendance[which];
    if (Array.isArray(row.attendance) && row.attendance.length > 0) {
      const first = row.attendance[0];
      if (first && first[which]) return first[which];
    }
    if (row.userAttendance && row.userAttendance[which]) return row.userAttendance[which];
    if (row.attendanceRecords && Array.isArray(row.attendanceRecords) && row.attendanceRecords[0] && row.attendanceRecords[0][which])
      return row.attendanceRecords[0][which];
    return null;
  };

  const formatTime = (val) => {
    if (!val) return "-";
    try {
      return new Date(val).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return String(val);
    }
  };

  useEffect(() => {
    search();
  }, []);

  const search = async () => {
    try {
      setLoading(true);
      setError("");
      const ymdDate = convertDMYtoYMD(date);
      const endpoint = isHr
        ? `${API_BASE}/hr/manage/attendance?date=${ymdDate}`
        : `${API_BASE}/admin/attendance/by-date?date=${ymdDate}`;
      const res = await apiGet(endpoint);
      setRows((res || []).filter((row) => !isAdminRow(row)));
    } catch (err) {
      console.error("Error fetching attendance:", err);
      setError("Failed to load attendance data. Please check server or date.");
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    try {
      setReportLoading(true);
      setReportError("");
      const start = convertDMYtoYMD(reportStartDate);
      const end = convertDMYtoYMD(reportEndDate);
      const endpoint = isHr
        ? `${API_BASE}/hr/manage/presence-report?startDate=${start}&endDate=${end}`
        : `${API_BASE}/admin/attendance/presence-report?startDate=${start}&endDate=${end}`;
      const res = await apiGet(endpoint);
      setReportRows((res || []).filter((row) => !isAdminRow(row)));
    } catch (err) {
      console.error("Error generating report:", err);
      setReportError("Failed to generate report.");
    } finally {
      setReportLoading(false);
    }
  };

  return (
    <div className={`min-h-screen bg-background text-primary animate-fadeIn ${isHr ? "max-w-6xl mx-auto space-y-10" : ""}`}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shrink-0">
            <CalendarCheck size={28} />
          </div>
          <div>
            <h2 className="text-4xl font-black text-primary tracking-tight mb-2">
              {isHr ? "Manage Attendance" : "Attendance"}
            </h2>
            <p className="text-secondary font-medium opacity-80">
              {isHr
                ? `Track employee and leader presence for ${date}.`
                : `Track organization presence for ${date}.`}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center w-full lg:w-auto">
          <button
            onClick={() => setShowReportModal(true)}
            className="bg-secondary/10 hover:bg-secondary/20 text-secondary px-6 py-3 rounded-2xl font-bold transition-all duration-300 active:scale-95 whitespace-nowrap"
          >
            Calculate Presence
          </button>
          <div className="relative w-full sm:w-56">
            <DatePicker value={date} onChange={setDate} />
          </div>

          <button
            onClick={search}
            className="bg-primary hover:bg-secondary text-white px-8 py-3 rounded-2xl font-bold shadow-xl shadow-primary/20 transition-all duration-300 active:scale-95"
          >
            Search
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 text-red-500 border border-red-200 p-4 rounded-2xl mb-6 font-bold flex items-center gap-2">
          <span>⚠️</span> {error}
        </div>
      )}

      {/* Table Section */}
      <div className="bg-white rounded-[2rem] shadow-xl shadow-primary/5 border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-20 text-center text-secondary font-bold animate-pulse">
            Retrieving attendance logs...
          </div>
        ) : rows.length === 0 ? (
          <div className="p-20 text-center text-secondary font-medium">
            No attendance records found for this date.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-200">
                  <th className="p-5 font-bold text-secondary uppercase tracking-widest text-xs">
                    {isHr ? "Name" : "Employee"}
                  </th>
                  <th className="p-5 font-bold text-secondary uppercase tracking-widest text-xs">Role</th>
                  <th className="p-5 font-bold text-secondary uppercase tracking-widest text-xs">Check In</th>
                  <th className="p-5 font-bold text-secondary uppercase tracking-widest text-xs">Check Out</th>
                  <th className="p-5 font-bold text-secondary uppercase tracking-widest text-xs">Break Time</th>
                  <th className="p-5 font-bold text-secondary uppercase tracking-widest text-xs">Working Time</th>
                  <th className="p-5 font-bold text-secondary uppercase tracking-widest text-xs">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((r, i) => (
                  <tr key={r._id || r.user?._id || i} className="hover:bg-primary/5 transition-colors group">
                    <td className="p-5">
                      <div className="font-bold text-primary">{r.user?.name || (typeof r.user === "string" ? r.user : "-")}</div>
                      {r.user?.position && <div className="text-[10px] text-secondary">{r.user.position}</div>}
                    </td>
                    <td className="p-5">
                      <span className="px-3 py-1 bg-gray-50 text-secondary rounded-full text-xs font-bold uppercase tracking-wider">
                        {r.user?.role || "-"}
                      </span>
                    </td>
                    <td className="p-5 font-medium text-primary">
                      {formatTime(extractCheck(r, "checkIn"))}
                    </td>
                    <td className="p-5 font-medium text-primary">
                      {formatTime(extractCheck(r, "checkOut"))}
                    </td>
                    <td className="p-5 font-medium text-primary">
                      <div className="flex items-center gap-2">
                        <span>{formatDuration(r.total_break_minutes)}</span>
                        {r.breaks && r.breaks.length > 0 && (
                          <button
                            onClick={() => setBreakModal({
                              show: true,
                              name: r.user?.name || (typeof r.user === "string" ? r.user : "Employee"),
                              breaks: r.breaks,
                              total: r.total_break_minutes || 0
                            })}
                            className="p-1.5 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-600 transition-all active:scale-95 flex items-center justify-center"
                            title="View break history"
                          >
                            <Eye size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="p-5 font-medium text-primary">
                      {formatDuration(r.total_working_minutes)}
                    </td>
                    <td className="p-5">
                      {(() => {
                        const rawStatus = r.status;
                        const ci = extractCheck(r, "checkIn");
                        const co = extractCheck(r, "checkOut");
                        const isOvertime = rawStatus === "Over-time" || (rawStatus === "Holiday" && (ci || co));
                        const label = isOvertime ? "Over-time" : rawStatus;
                        
                        const colorMap = {
                          "Present": "bg-green-50 text-green-600 border-green-200",
                          "Leave": "bg-amber-50 text-amber-600 border-amber-200",
                          "Holiday": "bg-cyan-50 text-[#1A9DC2] border-cyan-200",
                          "Absent": "bg-red-50 text-red-500 border-red-200",
                          "Over-time": "bg-primary/10 text-[#1A9DC2] border-primary/20"
                        };

                        const cls = colorMap[label] || "bg-gray-50 text-gray-500 border-gray-200";

                        return (
                          <span className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest border ${cls}`} title={r.holidayDescription || ""}>
                            {label}
                          </span>
                        );
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Presence Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-2xl font-black text-primary">Calculate Presence & Salary Deductions</h3>
              <button onClick={() => setShowReportModal(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            
            <div className="p-6 flex flex-col sm:flex-row gap-4 items-end border-b border-gray-100">
               <div>
                  <label className="block text-sm font-bold text-secondary mb-2">From Date</label>
                  <div className="w-48"><DatePicker value={reportStartDate} onChange={setReportStartDate} /></div>
               </div>
               <div>
                  <label className="block text-sm font-bold text-secondary mb-2">To Date</label>
                  <div className="w-48"><DatePicker value={reportEndDate} onChange={setReportEndDate} /></div>
               </div>
               <button
                  onClick={generateReport}
                  className="bg-primary hover:bg-secondary text-white px-8 py-3 rounded-2xl font-bold shadow-lg transition-all active:scale-95"
                  disabled={reportLoading}
               >
                  {reportLoading ? "Generating..." : "Generate Report"}
               </button>
            </div>
            
            <div className="flex-1 overflow-auto p-6 bg-gray-50/30">
               {reportError && <div className="text-red-500 font-bold mb-4">{reportError}</div>}
               
               {reportRows.length > 0 ? (
                 <table className="w-full text-left border-collapse bg-white rounded-2xl overflow-hidden shadow-sm">
                   <thead>
                     <tr className="bg-primary/5 border-b border-primary/10">
                       <th className="p-4 font-bold text-secondary text-xs uppercase">Employee</th>
                       <th className="p-4 font-bold text-secondary text-xs uppercase">Total Req.</th>
                       <th className="p-4 font-bold text-secondary text-xs uppercase">Completed</th>
                       <th className="p-4 font-bold text-secondary text-xs uppercase text-red-500">Missed</th>
                       <th className="p-4 font-bold text-secondary text-xs uppercase">Absent</th>
                       <th className="p-4 font-bold text-secondary text-xs uppercase text-right">Deduction (Rs)</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-50">
                     {reportRows.map(row => (
                       <tr key={row.user._id} className="hover:bg-gray-50/50">
                         <td className="p-4 font-bold text-primary">{row.user.name}</td>
                         <td className="p-4 text-sm font-medium">{formatDuration(row.totalRequiredMinutes)}</td>
                         <td className="p-4 text-sm font-medium text-green-600">{formatDuration(row.totalCompletedMinutes)}</td>
                         <td className="p-4 text-sm font-black text-red-500">{formatDuration(row.totalMissedMinutes)}</td>
                         <td className="p-4 text-sm font-medium">{formatDuration(row.totalAbsentMinutes)}</td>
                         <td className="p-4 text-sm font-black text-red-600 text-right">₹{row.salaryDeduction}</td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               ) : (
                 !reportLoading && <div className="text-center text-gray-400 font-medium py-10">Select a date range and click Generate Report.</div>
               )}
            </div>
          </div>
        </div>
      )}

      {/* ── Break History Modal ── */}
      {breakModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 to-orange-500" />
            <div className="flex items-center justify-between px-7 pt-8 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-2xl flex items-center justify-center">
                  <Coffee size={20} className="text-amber-600" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-800 tracking-tight">Break History</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{breakModal.name}</p>
                </div>
              </div>
              <button
                onClick={() => setBreakModal({ show: false, name: "", breaks: [], total: 0 })}
                className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-500 transition-all"
              >
                <X size={16} />
              </button>
            </div>
            <div className="mx-7 mb-4 px-4 py-2.5 bg-amber-50 rounded-2xl border border-amber-100 flex items-center justify-between">
              <span className="text-xs font-bold text-amber-700">Total Break Time</span>
              <span className="text-sm font-black text-amber-600">
                {Math.floor(breakModal.total / 60) > 0 ? `${Math.floor(breakModal.total / 60)}h ` : ""}{breakModal.total % 60}m
              </span>
            </div>
            <div className="px-7 pb-7 space-y-3 max-h-64 overflow-y-auto">
              {breakModal.breaks.map((b, idx) => {
                const startTime = b.start ? new Date(b.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "–";
                const endTime = b.end ? new Date(b.end).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Ongoing";
                const diffMin = b.start && b.end ? Math.round((new Date(b.end) - new Date(b.start)) / 60000) : null;
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-amber-200 hover:bg-amber-50/50 transition-all"
                  >
                    <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                      <span className="text-[11px] font-black text-amber-700">#{idx + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black text-gray-700">{startTime}</span>
                        <span className="text-gray-300 font-bold">→</span>
                        <span className={`text-xs font-black ${b.end ? "text-gray-700" : "text-amber-500"}`}>{endTime}</span>
                      </div>
                      {diffMin !== null && (
                        <p className="text-[10px] font-bold text-gray-400 mt-0.5">
                          Duration: {diffMin >= 60 ? `${Math.floor(diffMin / 60)}h ${diffMin % 60}m` : `${diffMin} min`}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendancePage;
