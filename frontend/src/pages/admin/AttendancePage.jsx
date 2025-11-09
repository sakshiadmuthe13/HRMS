import React, { useEffect, useState } from "react";

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
  // Use client's local date (YYYY-MM-DD) so the initial date matches user's local day
  const getLocalDateYMD = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const [date, setDate] = useState(getLocalDateYMD());
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Helper: normalize/check various possible shapes from the API/db for check times
  const extractCheck = (row, which) => {
    // which is 'checkIn' or 'checkOut'
    // try common possibilities safely
    if (!row) return null;
    if (row[which]) return row[which];
    if (row.attendance && row.attendance[which]) return row.attendance[which];
    if (Array.isArray(row.attendance) && row.attendance.length > 0) {
      const first = row.attendance[0];
      if (first && first[which]) return first[which];
    }
    if (row.userAttendance && row.userAttendance[which]) return row.userAttendance[which];
    // fallback: sometimes nested under attendanceRecords or records
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
      const res = await apiGet(
        `${API_BASE}/admin/attendance/by-date?date=${date}`
      );
      setRows(res || []);
    } catch (err) {
      console.error("Error fetching attendance:", err);
      setError("Failed to load attendance data. Please check server or date.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-48px)] bg-[#111828] text-[var(--color-text-primary)] p-2 overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 mt-4">
        <h2 className="text-3xl font-bold text-[var(--color-primary)] flex items-center gap-2">
          🕒 Attendance
        </h2>

        <div className="flex gap-3 items-center">
          <div className="relative mt-5">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input w-auto bg-[var(--color-surface)] border border-white text-white pl-3 pr-3 rounded-md shadow-[0_0_10px_#0EA6F0] focus:shadow-[0_0_10px_#0EA6F0] focus:outline-none appearance-none"
            />
          </div>

          <button
            onClick={search}
            className="btn bg-[var(--color-primary)] hover:bg-[var(--color-secondary)] text-white shadow-md"
          >
            Search
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <p className="text-red-400 bg-[var(--color-surface)] border border-[var(--color-danger)] px-3 py-2 rounded mb-4">
          ⚠️ {error}
        </p>
      )}

      {/* Table Section */}
      <div className="card-glow overflow-x-auto no-scrollbar rounded-lg">
        {loading ? (
          <p className="p-6 text-center text-[var(--color-text-secondary)] animate-pulse">
            Loading attendance records...
          </p>
        ) : rows.length === 0 ? (
          <p className="text-center py-8 text-[var(--color-text-secondary)]">
            No attendance records found for this date.
          </p>
        ) : (
          <table className="w-full text-left min-w-[700px]">
            <thead className="bg-[rgba(14,166,240,0.1)] text-[var(--color-text-secondary)] text-sm">
              <tr>
                <th className="p-4">Name</th>
                <th className="p-4">Role</th>
                <th className="p-4">Check In</th>
                <th className="p-4">Check Out</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr
                  key={r._id || i}
                  className="border-t border-[rgba(255,255,255,0.1)] hover:bg-[rgba(14,166,240,0.05)] transition-all"
                >
                  <td className="p-4 font-medium text-[var(--color-text-primary)]">
                    {r.user?.name || r.user}
                  </td>
                  <td className="p-4 text-[var(--color-text-secondary)]">
                    {r.user?.role || "-"}
                  </td>
                  {/* Check times: try to extract from a few DB shapes */}
                  <td className="p-4">{formatTime(extractCheck(r, "checkIn"))}</td>
                  <td className="p-4">{formatTime(extractCheck(r, "checkOut"))}</td>
                  <td className="p-4">
                    {(() => {
                      const rawStatus = r.status;
                      const ci = extractCheck(r, "checkIn");
                      const co = extractCheck(r, "checkOut");
                      // treat stored status "Over-time" as overtime, or Holiday with check times
                      const isOvertime = rawStatus === "Over-time" || (rawStatus === "Holiday" && (ci || co));
                      const label = isOvertime ? "Over-time" : rawStatus;
                      const cls = isOvertime
                        ? "bg-pink-500/20 text-pink-400"
                        : rawStatus === "Present"
                        ? "bg-green-500/20 text-green-400"
                        : rawStatus === "Leave"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : rawStatus === "Holiday"
                        ? "bg-blue-500/20 text-blue-400"
                        : "bg-red-500/20 text-red-400";

                      return (
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${cls}`} title={r.holidayDescription || ""}>
                          {label}
                        </span>
                      );
                    })()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AttendancePage;
