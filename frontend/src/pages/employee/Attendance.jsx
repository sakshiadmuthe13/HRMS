import React, { useEffect, useState, useCallback } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  subMonths,
  addMonths,
  getDay,
} from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaArrowLeft, FaArrowRight, FaCheck, FaTimes } from "react-icons/fa";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

const fetchJson = async (path, opts = {}) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    ...opts,
  });

  if (!res.ok) {
    let text = await res.text();
    try {
      text = JSON.parse(text);
    } catch {
      /* ignore */
    }
    throw new Error((text && text.message) || res.statusText || "API error");
  }

  const t = await res.text();
  return t ? JSON.parse(t) : null;
};

const apiGet = (path) => fetchJson(path);
const apiPost = (path, body) =>
  fetchJson(path, { method: "POST", body: JSON.stringify(body) });

// Convert UTC date to IST yyyy-MM-dd for calendar key
const TZ = "Asia/Kolkata";

const toISTDate = (inputDate) => {
  if (!inputDate) return null;
  return toZonedTime(new Date(inputDate), TZ);
};

const formatDateInIST = (date, fmt) => {
  if (!date) return "";
  return format(toISTDate(date), fmt);
};

const toISTDateKey = (inputDate) => {
  const zoned = toISTDate(inputDate);
  return zoned ? format(zoned, "yyyy-MM-dd") : null;
};

const getTodayIST = () => toISTDateKey(new Date());
const getTodayISTKey = () => getTodayIST();
const getTodayISTLabel = () =>
  new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

const CelebrationCard = ({ title, items, loading, error, emptyMessage }) => {
  return (
    <div className="p-4 rounded-lg bg-[var(--color-surface)] border border-gray-800">
      <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-2">
        {title}
      </h3>
      {loading ? (
        <p className="text-sm text-gray-400">Loading...</p>
      ) : error ? (
        <p className="text-sm text-red-400">{error}</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-gray-400">{emptyMessage}</p>
      ) : (
        <ul className="space-y-2 text-sm text-gray-200">
          {items.map((item) => (
            <li key={item.id} className="flex flex-col">
              <span className="font-semibold text-gray-100">{item.name}</span>
              {item.role && (
                <span className="text-xs text-gray-400">Role: {item.role}</span>
              )}
              {item.email && (
                <span className="text-xs text-gray-500">{item.email}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const Attendance = () => {
  const [loading, setLoading] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [monthRecords, setMonthRecords] = useState({});
  const [holidayMap, setHolidayMap] = useState({});
  const [leaveMap, setLeaveMap] = useState({});
  const [canCheckIn, setCanCheckIn] = useState(true);
  const [canCheckOut, setCanCheckOut] = useState(false);
  const [celebrations, setCelebrations] = useState({
    birthdays: [],
    workAnniversaries: [],
    marriageAnniversaries: [],
  });
  const [celebrationsLoading, setCelebrationsLoading] = useState(false);
  const [celebrationsError, setCelebrationsError] = useState("");

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const currentYear = new Date().getFullYear();
  const viewingYear = calendarDate.getFullYear();
  const baseYears = Array.from({ length: 6 }, (_, idx) => currentYear - idx);
  const selectableYears = Array.from(new Set([...baseYears, viewingYear])).sort(
    (a, b) => b - a
  );

  const handleMonthChange = (event) => {
    const selectedMonth = Number(event.target.value);
    setCalendarDate((prevDate) => {
      const updatedDate = new Date(prevDate);
      updatedDate.setMonth(selectedMonth, 1);
      return updatedDate;
    });
  };

  const handleYearChange = (event) => {
    const selectedYear = Number(event.target.value);
    setCalendarDate((prevDate) => {
      const updatedDate = new Date(prevDate);
      updatedDate.setFullYear(selectedYear, updatedDate.getMonth(), 1);
      return updatedDate;
    });
  };

  // Update button state safely
  const updateButtonState = (rec) => {
    const hasCheckIn = rec?.checkIn ? true : false;
    const hasCheckOut = rec?.checkOut ? true : false;

    setCanCheckIn(!hasCheckIn);
    setCanCheckOut(hasCheckIn && !hasCheckOut);
  };

  // Fetch today's attendance
  const fetchTodayAttendance = useCallback(async () => {
    setLoading(true);
    try {
      const dateStr = getTodayIST();
      const res = await apiGet(`/employee/attendance?date=${dateStr}`);
      updateButtonState(res || null);
    } catch (e) {
      console.error(e);
      toast.error(e.message || "Failed to fetch today's attendance.");
      setCanCheckIn(true);
      setCanCheckOut(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch monthly attendance
  const fetchMonthAttendance = useCallback(async () => {
    const start = formatDateInIST(startOfMonth(calendarDate), "yyyy-MM-dd");
    const end = formatDateInIST(endOfMonth(calendarDate), "yyyy-MM-dd");

    try {
      const res = await apiGet(
        `/employee/attendance?start=${start}&end=${end}`
      );
      const formatted = {};
      Object.values(res || {}).forEach((rec) => {
        const key = toISTDateKey(rec?.date ?? rec?.checkIn ?? rec?.checkOut);
        if (key) formatted[key] = rec;
      });
      setMonthRecords(formatted);
      // Fetch holidays for this range (authenticated employee endpoint)
      try {
        const holidays = await apiGet(
          `/employee/holidays?start=${start}&end=${end}`
        );
        const hmap = {};
        (holidays || []).forEach((h) => {
          const k = toISTDateKey(h.date);
          if (k) hmap[k] = h;
        });
        setHolidayMap(hmap);
      } catch (hErr) {
        console.error("Failed to fetch holidays:", hErr);
        setHolidayMap({});
      }

      // Fetch user's leaves and map to dates in range
      try {
        const leaveRes = await apiGet(`/employee/leave/my`);
        const myLeaves = (leaveRes && leaveRes.leaves) || [];
        const lmap = {};
        myLeaves.forEach((lv) => {
          const from = new Date(lv.fromDate);
          const to = new Date(lv.toDate);
          const cursor = new Date(from);
          cursor.setHours(0, 0, 0, 0);
          while (cursor <= to) {
            const key = toISTDateKey(new Date(cursor));
            if (key) lmap[key] = lv;
            cursor.setDate(cursor.getDate() + 1);
          }
        });
        setLeaveMap(lmap);
      } catch (lErr) {
        console.error("Failed to fetch leaves:", lErr);
        setLeaveMap({});
      }
    } catch (e) {
      console.error(e);
    }
  }, [calendarDate]);

  const fetchTodayCelebrations = useCallback(async () => {
    setCelebrationsLoading(true);
    setCelebrationsError("");
    try {
      // Use role-based endpoint and shared helper for auth/error handling
      const data = await apiGet(`/employee/celebrations/today`);
      setCelebrations(
        data || {
          birthdays: [],
          workAnniversaries: [],
          marriageAnniversaries: [],
        }
      );
    } catch (error) {
      console.error("fetchTodayCelebrations error:", error);
      setCelebrationsError(error.message || "Failed to fetch celebrations");
      setCelebrations({
        birthdays: [],
        workAnniversaries: [],
        marriageAnniversaries: [],
      });
    } finally {
      setCelebrationsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTodayAttendance();
    fetchMonthAttendance();
    fetchTodayCelebrations();
  }, [
    calendarDate,
    fetchTodayAttendance,
    fetchMonthAttendance,
    fetchTodayCelebrations,
  ]);

  // Check In
  const handleCheckIn = async () => {
    setLoading(true);
    try {
      await apiPost("/employee/attendance/checkin", {});
      toast.success("Checked in successfully!");
      await fetchTodayAttendance();
      await fetchMonthAttendance();
    } catch (e) {
      console.error(e);
      if (e.message === "Already checked in today") {
        toast.info("You have already checked in today.");
      } else {
        toast.error(e.message || "Failed to check in.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Check Out
  const handleCheckOut = async () => {
    setLoading(true);
    try {
      await apiPost("/employee/attendance/checkout", {});
      toast.success("Checked out successfully!");
      await fetchTodayAttendance();
      await fetchMonthAttendance();
    } catch (e) {
      console.error(e);
      toast.error(e.message || "Failed to check out.");
    } finally {
      setLoading(false);
    }
  };

  // Build calendar grid for month aligned to weekdays (IST-based)
  const buildCalendarGrid = () => {
    const zonedStart = toISTDate(startOfMonth(calendarDate));
    const zonedEnd = toISTDate(endOfMonth(calendarDate));

    const firstWeekday = getDay(zonedStart); // 0=Sun, timezone-aware
    const monthDays = eachDayOfInterval({
      start: zonedStart,
      end: zonedEnd,
    }).map((d) => toISTDateKey(d));

    const cells = [];
    // leading empty cells
    for (let i = 0; i < firstWeekday; i++) cells.push(null);
    // days
    monthDays.forEach((k) => cells.push(k));
    return cells;
  };
  const days = buildCalendarGrid();

  return (
    <div className="p-6">
      <ToastContainer />
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-2">
        <div>
          <h2 className="text-3xl font-bold text-[var(--color-primary)]">
            🕒 Attendance
          </h2>
          <p className="text-sm text-gray-500 pt-4 pl-12">
            Today: {getTodayISTLabel()}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {canCheckIn && (
            <button
              onClick={handleCheckIn}
              disabled={loading}
              className="px-6 py-2 font-semibold text-white rounded bg-green-500 hover:bg-green-600 transition-colors flex items-center gap-2"
            >
              <FaCheck /> Check In
            </button>
          )}
          {canCheckOut && (
            <button
              onClick={handleCheckOut}
              disabled={loading}
              className="px-6 py-2 font-semibold text-white rounded bg-red-500 hover:bg-red-600 transition-colors flex items-center gap-2"
            >
              <FaTimes /> Check Out
            </button>
          )}
        </div>
      </div>
      <div className="p-6">
        {/* Month Navigation */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <button
            onClick={() => setCalendarDate(subMonths(calendarDate, 1))}
            className="px-4 py-2 rounded bg-gray-800 text-white flex items-center gap-2 shadow-md hover:bg-gray-700 transition-colors"
          >
            <FaArrowLeft /> Prev
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center justify-center gap-3 md:flex-1">
            <label className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm font-semibold text-gray-200">
              <span>Month</span>
              <select
                value={calendarDate.getMonth()}
                onChange={handleMonthChange}
                className="px-3 py-2 rounded-lg border border-gray-700 bg-gray-900 text-white shadow-inner focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              >
                {months.map((month, index) => (
                  <option key={month} value={index}>
                    {month}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm font-semibold text-gray-200">
              <span>Year</span>
              <select
                value={calendarDate.getFullYear()}
                onChange={handleYearChange}
                className="px-3 py-2 rounded-lg border border-gray-700 bg-gray-900 text-white shadow-inner focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              >
                {selectableYears.map((yearOption) => (
                  <option key={yearOption} value={yearOption}>
                    {yearOption}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <button
            onClick={() => setCalendarDate(addMonths(calendarDate, 1))}
            className="px-4 py-2 rounded bg-gray-800 text-white flex items-center gap-2 shadow-md hover:bg-gray-700 transition-colors"
          >
            Next <FaArrowRight />
          </button>
        </div>

        {/* Calendar */}
        <div className="grid grid-cols-7 gap-2 mt-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="text-center font-semibold text-secondary">
              {d}
            </div>
          ))}

          {days.map((cellKey, idx) => {
            if (!cellKey) {
              return <div key={`empty-${idx}`} className={`h-20 p-1`} />;
            }

            const rec = monthRecords[cellKey];
            const isHoliday = holidayMap?.[cellKey];
            const isLeave = leaveMap?.[cellKey];
            const isTodayCell = cellKey === getTodayISTKey();

            // Color precedence: Holiday (red) > Present (green, in+out) > Absent (orange, past no check-in) > Future blank (yellow) > Default
            const todayKey = getTodayISTKey();
            const isPast = cellKey < todayKey;
            const hasIn = !!rec?.checkIn;
            const hasOut = !!rec?.checkOut;
            const isPresent = hasIn && hasOut;
            const isAbsent = (isPast && !hasIn && !isHoliday && !isLeave) || (isPast && hasIn && !hasOut && !isHoliday && !isLeave);
            const isFutureBlank =
              cellKey > todayKey && !hasIn && !isHoliday && !isLeave;
            const leaveStatus = isLeave?.status;

            let bgClass = "bg-white text-gray-900 border border-gray-700";
            if (isHoliday) bgClass = "bg-red-600 text-white";
            else if (isPresent) bgClass = "bg-green-600 text-white";
            else if (isLeave) bgClass = "bg-blue-400 text-white";
            else if (isAbsent) bgClass = "bg-orange-400 text-white";
            else if (isFutureBlank) bgClass = "bg-yellow-200 text-black";

            const dayNumber = Number(cellKey.split("-")[2]);

            return (
              <div
                key={cellKey}
                className={`h-22 p-1 flex flex-col justify-center items-center rounded cursor-pointer font-semibold ${bgClass} ${
                  isTodayCell ? "border-4 border-yellow-500" : ""
                }`}
              >
                <div>{dayNumber}</div>
                {isHoliday?.description && (
                  <div className="text-[10px] mt-1 text-white text-center px-1">
                    {isHoliday.description}
                  </div>
                )}
                <div className="text-xs mt-1">
                  {isLeave
                    ? "Leave Day"
                    : isAbsent
                    ? "Absent Day"
                    : rec?.checkIn
                    ? `In: ${formatDateInIST(rec.checkIn, "hh:mm a")}`
                    : ""}
                </div>
                <div className="text-xs">
                  {!isLeave && !isAbsent && rec?.checkOut
                    ? `Out: ${formatDateInIST(rec.checkOut, "hh:mm a")}`
                    : ""}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend Section */}
      <div className="mt-3 ml-6 p-6 rounded-xl bg-gray-900 border border-gray-700 w-19/20 shadow-lg">
        <h3 className="text-base font-semibold text-[var(--color-primary)] mb-3 ">
          Legend
        </h3>
        <div className="flex flex-wrap gap-4 text-sm items-center">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-red-600 border border-gray-700" />
            <span className="text-gray-200">Holiday</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-green-600 border border-gray-700" />
            <span className="text-gray-200">Present Day</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-orange-500 border border-gray-700" />
            <span className="text-gray-200">Absent Day</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-blue-600 border border-gray-700" />
            <span className="text-gray-200">Leave Day</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-yellow-200 border border-gray-700" />
            <span className="text-gray-200">Upcoming / Regular Day</span>
          </div>
        </div>
      </div>

      <h2 className="text-2xl mt-6 mb-6 font-bold text-[var(--color-primary)]">
        ✨ Today's Celebrations
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
        <CelebrationCard
          title="🎉 Birthdays Today"
          items={celebrations.birthdays}
          loading={celebrationsLoading}
          error={celebrationsError}
          emptyMessage="No birthdays today"
        />
        <CelebrationCard
          title="🪪 Work Anniversaries Today"
          items={celebrations.workAnniversaries}
          loading={celebrationsLoading}
          error={celebrationsError}
          emptyMessage="No work anniversaries today"
        />
        <CelebrationCard
          title="💍 Marriage Anniversaries Today"
          items={celebrations.marriageAnniversaries}
          loading={celebrationsLoading}
          error={celebrationsError}
          emptyMessage="No marriage anniversaries today"
        />
      </div>
    </div>
  );
};

export default Attendance;
