import React, { useEffect, useState } from "react";
import DatePicker from "../../components/DatePicker";
import { CalendarCheck } from "lucide-react";

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
      setRows(res || []);
    } catch (err) {
      console.error("Error fetching attendance:", err);
      setError("Failed to load attendance data. Please check server or date.");
    } finally {
      setLoading(false);
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
    </div>
  );
};

export default AttendancePage;
