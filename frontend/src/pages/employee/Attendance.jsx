import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, subMonths, addMonths, getDay } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { toast } from "react-toastify";
import { ChevronLeft, ChevronRight, CheckCircle, Gift, Award, Heart, LogIn, LogOut, Calendar as CalendarIcon, Eye, X, Coffee } from "lucide-react";
import ProfileAvatar from "../../components/ProfileAvatar";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

const fetchJson = async (path, opts = {}) => {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  const headers = { ...(opts.headers || {}) };
  if (token && !headers.Authorization && !headers.authorization) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { credentials: "include", ...opts, headers });
  if (!res.ok) {
    let text = await res.text();
    try { text = JSON.parse(text); } catch { }
    throw new Error(text?.message || res.statusText || "API error");
  }
  const t = await res.text();
  return t ? JSON.parse(t) : null;
};

const apiGet = (p) => fetchJson(p);
const apiPost = (p, body) => fetchJson(p, { method: "POST", body: JSON.stringify(body), headers: { "Content-Type": "application/json" } });

const CelebrationCard = ({ title, items, loading, emptyMessage, icon: Icon, iconColor }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex-1 p-5 rounded-2xl bg-white border border-gray-100 shadow-sm flex flex-col gap-4 hover:shadow-md transition-all"
  >
    {/* Card header */}
    <div className="flex items-center gap-2.5">
      <Icon size={18} className={iconColor} />
      <h3 className="text-[11px] font-black text-primary uppercase tracking-[0.18em]">{title}</h3>
    </div>
    {/* Card body */}
    {loading ? (
      <div className="space-y-2 animate-pulse">
        <div className="h-4 bg-gray-100 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
      </div>
    ) : items.length === 0 ? (
      <div className="py-3 px-4 text-center border-2 border-dashed border-gray-200 rounded-xl">
        <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.18em]">{emptyMessage}</p>
      </div>
    ) : (
      <ul className="space-y-2">
        {items.map((item, i) => (
          <motion.li
            key={item.id || i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <ProfileAvatar user={item} className="w-8 h-8 text-[10px]" />
            <div className="min-w-0">
              <span className="block font-bold text-gray-800 text-xs truncate">{item.name}</span>
              <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-tight truncate">{item.role || "Team Member"}</span>
            </div>
          </motion.li>
        ))}
      </ul>
    )}
  </motion.div>
);

const Attendance = () => {
  const [loading, setLoading] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [confirmModal, setConfirmModal] = useState({ show: false, title: "", message: "", onConfirm: null });
  const [monthRecords, setMonthRecords] = useState({});
  const [holidayMap, setHolidayMap] = useState({});
  const [leaveMap, setLeaveMap] = useState({});
  const [canCheckIn, setCanCheckIn] = useState(true);
  const [canCheckOut, setCanCheckOut] = useState(false);
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [totalBreakMinutes, setTotalBreakMinutes] = useState(0);
  const [celebrations, setCelebrations] = useState({ birthdays: [], workAnniversaries: [], marriageAnniversaries: [] });
  const [celebrationsLoading, setCelebrationsLoading] = useState(false);
  const [breakModal, setBreakModal] = useState({ show: false, date: "", breaks: [], total: 0 });

  const TZ = "Asia/Kolkata";
  const toISTDate = (d) => d ? toZonedTime(new Date(d), TZ) : null;
  const toISTDateKey = (d) => { const z = toISTDate(d); return z ? format(z, "yyyy-MM-dd") : null; };
  const getTodayISTKey = () => toISTDateKey(new Date());

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const currentYear = new Date().getFullYear();
  const selectableYears = Array.from({ length: 10 }, (_, i) => currentYear - i);

  const fetchTodayAttendance = useCallback(async () => {
    try {
      const res = await apiGet(`/employee/attendance?date=${getTodayISTKey()}`);
      const hasIn = !!res?.checkIn;
      const hasOut = !!res?.checkOut;
      setCanCheckIn(!hasIn);
      setCanCheckOut(hasIn && !hasOut);
      setIsOnBreak(!!res?.is_on_break);
      setTotalBreakMinutes(res?.total_break_minutes || 0);
    } catch {
      setCanCheckIn(true);
      setCanCheckOut(false);
      setIsOnBreak(false);
      setTotalBreakMinutes(0);
    }
  }, []);

  const fetchMonthAttendance = useCallback(async () => {
    const start = format(startOfMonth(calendarDate), "yyyy-MM-dd");
    const end = format(endOfMonth(calendarDate), "yyyy-MM-dd");
    try {
      const [attRes, holRes, leaveRes] = await Promise.all([
        apiGet(`/employee/attendance?start=${start}&end=${end}`),
        apiGet(`/employee/holidays?start=${start}&end=${end}`),
        apiGet(`/employee/leave/my`)
      ]);
      const attMap = {};
      Object.values(attRes || {}).forEach(rec => {
        const key = toISTDateKey(rec?.date ?? rec?.checkIn ?? rec?.checkOut);
        if (key) attMap[key] = rec;
      });
      setMonthRecords(attMap);

      const hMap = {};
      (holRes || []).forEach(h => { const k = toISTDateKey(h.date); if (k) hMap[k] = h; });
      setHolidayMap(hMap);

      const lMap = {};
      (leaveRes?.leaves || []).forEach(lv => {
        const cursor = new Date(lv.fromDate);
        const to = new Date(lv.toDate);
        cursor.setHours(0, 0, 0, 0);
        while (cursor <= to) { const k = toISTDateKey(new Date(cursor)); if (k) lMap[k] = lv; cursor.setDate(cursor.getDate() + 1); }
      });
      setLeaveMap(lMap);
    } catch (e) { console.error(e); }
  }, [calendarDate]);

  const fetchTodayCelebrations = useCallback(async () => {
    setCelebrationsLoading(true);
    try {
      const data = await apiGet(`/employee/celebrations/today`);
      setCelebrations(data || { birthdays: [], workAnniversaries: [], marriageAnniversaries: [] });
    } catch { } finally { setCelebrationsLoading(false); }
  }, []);

  useEffect(() => {
    fetchTodayAttendance();
    fetchMonthAttendance();
    fetchTodayCelebrations();
  }, [calendarDate, fetchTodayAttendance, fetchMonthAttendance, fetchTodayCelebrations]);

  const checkTimingWarnings = (actionType) => {
    const todayKey = getTodayISTKey();
    const todayLeave = leaveMap[todayKey];
    const isApprovedHalfDay = todayLeave && todayLeave.status === "Approved" && todayLeave.halfDay;
    const halfDayType = isApprovedHalfDay ? todayLeave.halfDayType : null;

    const now = new Date();
    const nowIST = toZonedTime(now, TZ);
    const hours = nowIST.getHours();
    const minutes = nowIST.getMinutes();
    const totalMinutes = hours * 60 + minutes;

    if (actionType === "checkin") {
      if (halfDayType === "first_half") {
        const threshold = 14 * 60 + 30; // 2:30 PM
        if (totalMinutes > threshold) {
          return { isWarning: true, minutes: totalMinutes - threshold, message: `You are checking in late by ${totalMinutes - threshold} minutes. Salary deduction may apply.` };
        }
      } else { // second_half or normal
        const threshold = 10 * 60; // 10:00 AM
        if (totalMinutes > threshold) {
          return { isWarning: true, minutes: totalMinutes - threshold, message: `You are checking in late by ${totalMinutes - threshold} minutes. Salary deduction may apply.` };
        }
      }
    } else if (actionType === "checkout") {
      if (halfDayType === "second_half") {
        const threshold = 14 * 60; // 2:00 PM
        if (totalMinutes < threshold) {
          return { isWarning: true, minutes: threshold - totalMinutes, message: `You are checking out ${threshold - totalMinutes} minutes early. Salary deduction may apply.` };
        }
      } else { // first_half or normal
        const threshold = 18 * 60 + 30; // 6:30 PM
        if (totalMinutes < threshold) {
          return { isWarning: true, minutes: threshold - totalMinutes, message: `You are checking out ${threshold - totalMinutes} minutes early. Salary deduction may apply.` };
        }
      }
    }
    return { isWarning: false };
  };

  const executeCheckAction = async (type) => {
    setConfirmModal({ show: false, title: "", message: "", onConfirm: null });
    setLoading(true);
    try {
      await apiPost(`/employee/attendance/${type}`, {});
      toast.success(`Successfully ${type === "checkin" ? "checked in" : "checked out"}!`);
      await fetchTodayAttendance();
      await fetchMonthAttendance();
    } catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const handleBreakAction = async () => {
    setLoading(true);
    const action = isOnBreak ? "end" : "start";
    try {
      const res = await apiPost(`/employee/attendance/break/${action}`, {});
      toast.success(isOnBreak ? "Break ended! Welcome back." : "Break started! Enjoy your break.");

      if (isOnBreak && res?.total_break_minutes > 60) {
        const exceeded = res.total_break_minutes - 60;
        setConfirmModal({
          show: true,
          title: "Break Time Exceeded",
          message: `Your break time exceeded by ${exceeded} minutes (Total break: ${res.total_break_minutes} mins). This will affect your salary calculation.`,
          onConfirm: () => setConfirmModal({ show: false, title: "", message: "", onConfirm: null })
        });
      }

      await fetchTodayAttendance();
      await fetchMonthAttendance();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckAction = async (type) => {
    const warning = checkTimingWarnings(type);
    if (warning.isWarning) {
      setConfirmModal({
        show: true,
        title: type === "checkin" ? "Late Check-In Alert" : "Early Check-Out Alert",
        message: warning.message,
        onConfirm: () => executeCheckAction(type)
      });
    } else {
      await executeCheckAction(type);
    }
  };

  const days = (() => {
    const zonedStart = toISTDate(startOfMonth(calendarDate));
    const firstWeekday = getDay(zonedStart);
    const monthDays = eachDayOfInterval({ start: zonedStart, end: toISTDate(endOfMonth(calendarDate)) }).map(d => toISTDateKey(d));
    return Array(firstWeekday).fill(null).concat(monthDays);
  })();

  return (
    <div className="space-y-10">

      {/* ── Page Header ── */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shrink-0">
            <CalendarIcon size={28} />
          </div>
          <div>
            <h2 className="text-4xl md:text-5xl font-black text-primary tracking-tighter mb-2 leading-tight">
              My Attendance Hub
            </h2>
            <div className="inline-flex items-center gap-2 text-gray-500 font-semibold text-sm bg-white px-4 py-2 rounded-2xl shadow-sm border border-gray-200">
              <CalendarIcon size={15} className="text-primary" />
              {format(new Date(), "EEEE, do MMMM yyyy")}
            </div>
          </div>
        </div>

        {/* Check-in / Check-out button */}
        <div className="flex items-center gap-4 w-full lg:w-auto">
          <AnimatePresence mode="wait">
            {canCheckIn ? (
              <motion.button
                key="in"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                onClick={() => handleCheckAction("checkin")}
                disabled={loading}
                className="flex-1 lg:flex-none inline-flex items-center justify-center gap-2 px-10 py-4 bg-green-500 hover:bg-green-600 active:scale-95 text-white font-black text-sm rounded-2xl shadow-lg shadow-green-500/30 transition-all disabled:opacity-50 uppercase tracking-wide"
              >
                <LogIn size={20} /> Check In
              </motion.button>
            ) : canCheckOut ? (
              <div className="flex gap-3 w-full lg:w-auto">
                <motion.button
                  key="break"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  onClick={handleBreakAction}
                  disabled={loading}
                  className={`flex-1 lg:flex-none inline-flex items-center justify-center gap-2 px-8 py-4 ${isOnBreak ? "bg-amber-500 hover:bg-amber-600 shadow-amber-500/30" : "bg-blue-500 hover:bg-blue-600 shadow-blue-500/30"} active:scale-95 text-white font-black text-sm rounded-2xl shadow-lg transition-all disabled:opacity-50 uppercase tracking-wide`}
                >
                  {isOnBreak ? "Resume Work" : "Take Break"}
                </motion.button>
                <motion.button
                  key="out"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  onClick={() => handleCheckAction("checkout")}
                  disabled={loading}
                  className="flex-1 lg:flex-none inline-flex items-center justify-center gap-2 px-10 py-4 bg-red-500 hover:bg-red-600 active:scale-95 text-white font-black text-sm rounded-2xl shadow-lg shadow-red-500/30 transition-all disabled:opacity-50 uppercase tracking-wide"
                >
                  <LogOut size={20} /> Check Out
                </motion.button>
              </div>
            ) : (
              <div className="flex-1 lg:flex-none inline-flex items-center justify-center gap-2 px-10 py-4 bg-white text-gray-500 font-black text-sm rounded-2xl border border-green-100 shadow-sm uppercase tracking-wide">
                <CheckCircle size={20} className="text-green-500" /> SHIFT COMPLETE
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 gap-8 p-4">

        {/* Calendar + Legend */}
        <div className="lg:col-span-8 space-y-6">

          {/* Calendar Card */}
          <div className="bg-white rounded-3xl border border-gray-200 shadow-lg overflow-hidden">
            <div className="p-8 md:p-10">
              {/* Month/Year controls */}
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-2">
                  <select
                    value={calendarDate.getMonth()}
                    onChange={(e) => setCalendarDate(new Date(calendarDate.setMonth(e.target.value)))}
                    className="bg-gray-50 border border-gray-200 text-primary font-black uppercase tracking-wider text-[10px] py-2.5 px-4 rounded-xl outline-none focus:ring-4 focus:ring-primary/10 transition-all appearance-none cursor-pointer"
                  >
                    {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
                  </select>
                  <select
                    value={calendarDate.getFullYear()}
                    onChange={(e) => setCalendarDate(new Date(calendarDate.setFullYear(e.target.value)))}
                    className="bg-gray-50 border border-gray-200 text-primary font-black uppercase tracking-wider text-[10px] py-2.5 px-4 rounded-xl outline-none focus:ring-4 focus:ring-primary/10 transition-all appearance-none cursor-pointer"
                  >
                    {selectableYears.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setCalendarDate(subMonths(calendarDate, 1))} className="p-2.5 bg-gray-50 rounded-xl text-primary hover:bg-primary hover:text-white transition-all border border-gray-200">
                    <ChevronLeft size={18} />
                  </button>
                  <button onClick={() => setCalendarDate(addMonths(calendarDate, 1))} className="p-2.5 bg-gray-50 rounded-xl text-primary hover:bg-primary hover:text-white transition-all border border-gray-200">
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-5">
                {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map(d => (
                  <div key={d} className="text-center font-black text-gray-400 text-[9px] tracking-widest pb-3">{d}</div>
                ))}
                {days.map((cell, i) => {
                  if (!cell) return <div key={`empty-${i}`} className="aspect-square" />;
                  const rec = monthRecords[cell];
                  const isHoliday = holidayMap[cell];
                  const isLeave = leaveMap[cell];
                  const isToday = cell === getTodayISTKey();
                  const isPresent = !!rec?.checkIn && !!rec?.checkOut;

                  let cellClass = "bg-gray-50 border-transparent text-gray-700";
                  if (isHoliday) cellClass = "bg-red-50 border-red-100 text-red-500";
                  else if (isPresent) cellClass = "bg-green-50 border-green-100 text-green-600";
                  else if (isLeave) cellClass = "bg-cyan-50 border-cyan-100 text-[#12637E]";
                  if (isToday) cellClass = "bg-primary/8 border-primary shadow-md shadow-primary/10 text-primary";

                  return (
                    <motion.div
                      key={cell}
                      whileHover={{ y: -2, scale: 1.04 }}
                      className={`aspect-square p-1.5 rounded-2xl border-2 transition-all flex flex-col items-center justify-center relative cursor-default ${cellClass}`}
                    >
                      <span className="text-sm font-black leading-none mb-0.5">{Number(cell.split("-")[2])}</span>
                      {rec?.checkIn && !isHoliday && !isLeave && (
                        <div className="flex flex-col items-center gap-0.5 mt-1">
                          <div className="text-[12px] font-black uppercase tracking-tight opacity-80 bg-white/30 px-1 py-0.5 rounded-full leading-none">
                            {format(new Date(rec.checkIn), "h:mm a").toLowerCase()} - {rec.checkOut ? format(new Date(rec.checkOut), "h:mm a").toLowerCase() : "…"}
                          </div>
                          {rec.breaks && rec.breaks.length > 0 && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setBreakModal({ show: true, date: cell, breaks: rec.breaks, total: rec.total_break_minutes || 0 }); }}
                              className="mt-3 flex items-center gap-0.5 px-1 py-0.5 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-600 transition-all"
                              title="View break history"
                            >
                              <span className="text-[10px] font-black">Break:</span>
                              <Eye size={14} />
                            </button>
                          )}
                        </div>
                      )}
                      {isHoliday && <div className="text-[7px] font-black uppercase tracking-tight truncate w-full text-center px-0.5 leading-none">Holiday</div>}
                      {isLeave && <div className="text-[7px] font-black uppercase tracking-tight leading-none">Leave</div>}
                      {isToday && <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-primary rounded-full" />}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="bg-white/20 rounded-2xl border-2 border-dashed border-gray-200 px-8 py-5 flex flex-wrap gap-8 justify-center">
            {[
              { label: "Holiday", color: "bg-red-500" },
              { label: "Present", color: "bg-green-500" },
              { label: "Leave", color: "bg-secondary" },
              { label: "Today", color: "bg-primary" },
            ].map(k => (
              <div key={k.label} className="flex items-center gap-2.5">
                <div className={`w-2.5 h-2.5 rounded-full ${k.color} shadow-sm`} />
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{k.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Sidebar */}
        {/* <div className="lg:col-span-4 space-y-6">

          <div className="card-premium p-10 bg-white text-center flex flex-col justify-center items-center group relative overflow-hidden h-full min-h-[400px]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-700" />

            <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mb-8 shadow-inner">
              <CalendarIcon size={40} className="text-primary" />
            </div>

            <h3 className="text-2xl font-black text-primary mb-4 tracking-tight">Attendance Protocol</h3>
            <p className="text-base text-secondary/80 font-medium leading-relaxed px-4">
              Precision in attendance tracking ensures smooth payroll and resource management.
              Please record your entries and exits promptly.
            </p>

            <div className="mt-10 p-5 bg-gray-50 rounded-2xl w-full border border-gray-100">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-secondary">Completion Status</span>
                <span className="text-xs font-black text-primary">
                  {Math.min(100, Math.round((Object.keys(monthRecords).length / 26) * 100))}%
                </span>
              </div>
              <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, Math.round((Object.keys(monthRecords).length / 26) * 100))}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="bg-primary h-full rounded-full shadow-sm"
                />
              </div>
            </div>
          </div>

        </div> */}
      </div>

      {/* ── Social Pulse ── */}
      <div className="space-y-4">
        {/* Section heading */}
        <div className="flex items-center gap-3">
          <div className="w-7 h-0.5 bg-primary rounded-full" />
          <h3 className="text-sm font-black text-primary uppercase tracking-[0.25em]">Social Pulse</h3>
        </div>
        {/* Three-column cards row */}
        <div className="flex flex-col md:flex-row gap-4">
          <CelebrationCard
            title="Birthdays"
            items={celebrations.birthdays}
            loading={celebrationsLoading}
            emptyMessage="No Birthday Celebrations Today"
            icon={Gift}
            iconColor="text-primary"
          />
          <CelebrationCard
            title="Work Tenure"
            items={celebrations.workAnniversaries}
            loading={celebrationsLoading}
            emptyMessage="No Career Milestones Today"
            icon={Award}
            iconColor="text-primary"
          />
          <CelebrationCard
            title="Marital Milestones"
            items={celebrations.marriageAnniversaries}
            loading={celebrationsLoading}
            emptyMessage="No Social Events Today"
            icon={Heart}
            iconColor="text-rose-500"
          />
        </div>
      </div>

      {/* ── Break History Modal ── */}
      <AnimatePresence>
        {breakModal.show && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full relative overflow-hidden"
            >
              {/* Top accent bar */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 to-orange-500" />
              {/* Header */}
              <div className="flex items-center justify-between px-7 pt-8 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-2xl flex items-center justify-center">
                    <Coffee size={20} className="text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-gray-800 tracking-tight">Break History</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{breakModal.date}</p>
                  </div>
                </div>
                <button
                  onClick={() => setBreakModal({ show: false, date: "", breaks: [], total: 0 })}
                  className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-500 transition-all"
                >
                  <X size={16} />
                </button>
              </div>
              {/* Summary pill */}
              <div className="mx-7 mb-4 px-4 py-2.5 bg-amber-50 rounded-2xl border border-amber-100 flex items-center justify-between">
                <span className="text-xs font-bold text-amber-700">Total Break Time</span>
                <span className="text-sm font-black text-amber-600">
                  {Math.floor(breakModal.total / 60) > 0 ? `${Math.floor(breakModal.total / 60)}h ` : ""}{breakModal.total % 60}m
                </span>
              </div>
              {/* Break sessions list */}
              <div className="px-7 pb-7 space-y-3 max-h-64 overflow-y-auto">
                {breakModal.breaks.map((b, idx) => {
                  const startTime = b.start ? format(new Date(b.start), "h:mm a").toLowerCase() : "–";
                  const endTime = b.end ? format(new Date(b.end), "h:mm a").toLowerCase() : "Ongoing";
                  const diffMin = b.start && b.end ? Math.round((new Date(b.end) - new Date(b.start)) / 60000) : null;
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.06 }}
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
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Confirmation Modal ── */}
      <AnimatePresence>
        {confirmModal.show && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-gray-150 p-8 shadow-2xl max-w-md w-full relative overflow-hidden text-left"
            >
              <div className="absolute top-0 left-0 right-0 h-2 bg-amber-500" />
              <h3 className="text-2xl font-black text-amber-600 mb-4 tracking-tight">
                {confirmModal.title}
              </h3>
              <p className="text-slate-650 text-sm font-semibold leading-relaxed mb-6">
                {confirmModal.message}
              </p>
              <div className="flex gap-4">
                {confirmModal.title !== "Break Time Exceeded" && (
                  <button
                    onClick={() => setConfirmModal({ show: false, title: "", message: "", onConfirm: null })}
                    className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 text-slate-700 font-bold rounded-2xl active:scale-95 transition-all text-xs uppercase tracking-wider"
                  >
                    Cancel
                  </button>
                )}
                <button
                  onClick={confirmModal.onConfirm || (() => setConfirmModal({ show: false, title: "", message: "", onConfirm: null }))}
                  className="flex-1 py-3.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-2xl active:scale-95 transition-all text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20"
                >
                  {confirmModal.title === "Break Time Exceeded" ? "OK" : (confirmModal.title.includes("Check-In") ? "Continue Check-In" : "Check Out Anyway")}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Attendance;
