import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, subMonths, addMonths, getDay } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { toast } from "react-toastify";
import { ChevronLeft, ChevronRight, CheckCircle, Gift, Award, Heart, LogIn, LogOut, Calendar as CalendarIcon, Clock, ShieldCheck, Cake, Briefcase, X } from "lucide-react";
import ProfileAvatar from "../../components/ProfileAvatar";

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
const apiPost = (p, body) => fetchJson(p, { method: "POST", body: JSON.stringify(body), headers: { "Content-Type": "application/json" } });

const TZ = "Asia/Kolkata";
const toISTDate = (d) => d ? toZonedTime(new Date(d), TZ) : null;
const toISTDateKey = (d) => {
  const zoned = toISTDate(d);
  return zoned ? format(zoned, "yyyy-MM-dd") : null;
};
const getTodayISTKey = () => toISTDateKey(new Date());
const getTodayIST = () => getTodayISTKey();
const formatDateInIST = (date, formatStr) => {
  if (!date) return "";
  const zoned = toISTDate(date);
  return zoned ? format(zoned, formatStr) : "";
};
const getTodayISTLabel = () => {
  const zoned = toISTDate(new Date());
  return zoned ? format(zoned, "EEEE, MMMM d, yyyy") : "";
};

const CelebrationCard = ({ title, items, loading, error, emptyMessage, icon: Icon, accentColor }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 rounded-[2rem] bg-white border border-gray-200 shadow-xl shadow-primary/5 flex flex-col h-full group hover:border-primary transition-all"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-xl bg-${accentColor}-50 text-${accentColor}-600`}>
          <Icon size={20} />
        </div>
        <h3 className="text-sm font-black text-primary uppercase tracking-widest">
          {title}
        </h3>
      </div>
      
      <div className="flex-1">
        {loading ? (
          <div className="space-y-2 animate-pulse">
            <div className="h-4 bg-gray-50 rounded w-3/4"></div>
            <div className="h-3 bg-gray-50 rounded w-1/2"></div>
          </div>
        ) : error ? (
          <p className="text-xs text-red-500 font-medium">{error}</p>
        ) : items.length === 0 ? (
          <div className="py-4 text-center border-2 border-dashed border-gray-200 rounded-2xl">
            <p className="text-[10px] font-black text-secondary/30 uppercase tracking-[0.2em]">{emptyMessage}</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {items.map((item, i) => (
              <motion.li 
                key={item.id || i} 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <ProfileAvatar user={item} className="w-8 h-8 text-[10px]" />
                <div className="min-w-0">
                  <span className="block font-bold text-primary text-xs truncate">{item.name}</span>
                  <span className="block text-[9px] font-black text-secondary/60 uppercase tracking-tighter truncate">{item.role || "Team Member"}</span>
                </div>
              </motion.li>
            ))}
          </ul>
        )}
      </div>
    </motion.div>
  );
};

const LeaderAttendance = () => {
  const [loading, setLoading] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [confirmModal, setConfirmModal] = useState({ show: false, title: "", message: "", onConfirm: null });
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

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const currentYear = new Date().getFullYear();
  const selectableYears = Array.from({ length: 10 }, (_, i) => currentYear - i);

  const fetchTodayAttendance = useCallback(async () => {
    try {
      const dateStr = getTodayISTKey();
      const res = await apiGet(`/leader/attendance?date=${dateStr}`);
      const hasIn = !!res?.checkIn;
      const hasOut = !!res?.checkOut;
      setCanCheckIn(!hasIn);
      setCanCheckOut(hasIn && !hasOut);
    } catch (e) {
      console.error(e);
      setCanCheckIn(true);
      setCanCheckOut(false);
    }
  }, []);

  const fetchMonthAttendance = useCallback(async () => {
    const start = format(startOfMonth(calendarDate), "yyyy-MM-dd");
    const end = format(endOfMonth(calendarDate), "yyyy-MM-dd");

    try {
      const [attRes, holidayRes, leaveRes] = await Promise.all([
        apiGet(`/leader/attendance?start=${start}&end=${end}`),
        apiGet(`/leader/holidays?start=${start}&end=${end}`),
        apiGet(`/leader/leave/my`)
      ]);

      const attMap = {};
      Object.values(attRes || {}).forEach(rec => {
        const key = toISTDateKey(rec?.date ?? rec?.checkIn ?? rec?.checkOut);
        if (key) attMap[key] = rec;
      });
      setMonthRecords(attMap);

      const hMap = {};
      (holidayRes || []).forEach(h => {
        const k = toISTDateKey(h.date);
        if (k) hMap[k] = h;
      });
      setHolidayMap(hMap);

      const lMap = {};
      (leaveRes?.leaves || []).forEach(lv => {
        const cursor = new Date(lv.fromDate);
        const to = new Date(lv.toDate);
        cursor.setHours(0,0,0,0);
        while (cursor <= to) {
          const k = toISTDateKey(new Date(cursor));
          if (k) lMap[k] = lv;
          cursor.setDate(cursor.getDate() + 1);
        }
      });
      setLeaveMap(lMap);
    } catch (e) { console.error(e); }
  }, [calendarDate]);

  const fetchTodayCelebrations = useCallback(async () => {
    setCelebrationsLoading(true);
    try {
      const data = await apiGet(`/leader/celebrations/today`);
      setCelebrations(data || { birthdays: [], workAnniversaries: [], marriageAnniversaries: [] });
    } catch (e) {
      console.error(e);
    } finally {
      setCelebrationsLoading(false);
    }
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
      await apiPost(`/leader/attendance/${type}`, {});
      toast.success(`Successfully ${type === 'checkin' ? 'checked in' : 'checked out'}!`);
      await fetchTodayAttendance();
      await fetchMonthAttendance();
    } catch (e) {
      toast.error(e.message);
    } finally { setLoading(false); }
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
    const cells = Array(firstWeekday).fill(null).concat(monthDays);
    return cells;
  })();

  return (
    <div className="animate-fadeIn space-y-12 max-w-6xl mx-auto">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-10 animate-slideUp">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shrink-0">
              <CalendarIcon size={28} />
            </div>
            <div>
              <h2 className="text-5xl font-black text-primary tracking-tighter mb-3 leading-tight">My Attendance Hub</h2>
              <div className="inline-flex items-center gap-3 text-secondary/80 font-bold text-sm bg-white px-5 py-2.5 rounded-2xl shadow-sm border border-gray-100">
                <Clock size={18} className="text-primary" />
                {getTodayISTLabel()}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 w-full lg:w-auto">
            <AnimatePresence mode="wait">
              {canCheckIn ? (
                <motion.button
                  key="in"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  onClick={() => handleCheckAction('checkin')}
                  disabled={loading}
                  className="btn btn-primary flex-1 lg:flex-none py-4 px-12 text-lg shadow-green-500/20 bg-green-500 hover:bg-green-600"
                >
                  <LogIn size={22} /> LOG ENTRY
                </motion.button>
              ) : canCheckOut ? (
                <motion.button
                  key="out"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  onClick={() => handleCheckAction('checkout')}
                  disabled={loading}
                  className="btn btn-primary flex-1 lg:flex-none py-4 px-12 text-lg shadow-red-500/20 bg-red-500 hover:bg-red-600"
                >
                  <LogOut size={22} /> LOG EXIT
                </motion.button>
              ) : (
                <div className="flex-1 lg:flex-none py-4 px-12 bg-white text-secondary font-black rounded-2xl border border-green-100 flex items-center gap-3 shadow-sm">
                  <CheckCircle size={22} className="text-green-500" /> SHIFT COMPLETE
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-8 animate-slideUp" style={{ animationDelay: '0.1s' }}>
            <div className="card-premium p-10 bg-white">
              <div className="flex items-center justify-between mb-12">
                <div className="flex items-center gap-3">
                  <select
                    value={calendarDate.getMonth()}
                    onChange={(e) => setCalendarDate(new Date(calendarDate.setMonth(e.target.value)))}
                    className="bg-gray-50 border border-gray-100 text-primary font-black uppercase tracking-[0.2em] text-[10px] py-3 px-5 rounded-xl outline-none focus:ring-4 focus:ring-primary/5 transition-all appearance-none cursor-pointer"
                  >
                    {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
                  </select>
                  <select
                    value={calendarDate.getFullYear()}
                    onChange={(e) => setCalendarDate(new Date(calendarDate.setFullYear(e.target.value)))}
                    className="bg-gray-50 border border-gray-100 text-primary font-black uppercase tracking-[0.2em] text-[10px] py-3 px-5 rounded-xl outline-none focus:ring-4 focus:ring-primary/5 transition-all appearance-none cursor-pointer"
                  >
                    {selectableYears.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setCalendarDate(subMonths(calendarDate, 1))} className="p-3 bg-gray-50 rounded-xl text-primary hover:bg-primary hover:text-white transition-all shadow-sm"><ChevronLeft size={20} /></button>
                  <button onClick={() => setCalendarDate(addMonths(calendarDate, 1))} className="p-3 bg-gray-50 rounded-xl text-primary hover:bg-primary hover:text-white transition-all shadow-sm"><ChevronRight size={20} /></button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-4">
                {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map(d => (
                  <div key={d} className="text-center font-black text-secondary/30 text-[10px] tracking-[0.3em] mb-6">{d}</div>
                ))}
                {days.map((cell, i) => {
                  if (!cell) return <div key={`empty-${i}`} className="aspect-square" />;
                  const rec = monthRecords[cell];
                  const isHoliday = holidayMap[cell];
                  const isLeave = leaveMap[cell];
                  const isToday = cell === getTodayISTKey();
                  const isPresent = !!rec?.checkIn && !!rec?.checkOut;

                  return (
                    <motion.div
                      key={cell}
                      whileHover={{ y: -3, scale: 1.05 }}
                      className={`aspect-square p-3 rounded-[1.25rem] border-2 transition-all flex flex-col items-center justify-center relative overflow-hidden group cursor-default ${
                        isToday ? "border-primary bg-primary/5 shadow-xl shadow-primary/10" : "border-transparent bg-gray-50/50"
                      } ${
                        isHoliday ? "bg-red-50 text-red-500 border-red-100" :
                        isPresent ? "bg-green-50/70 text-green-600 border-green-100" :
                        isLeave ? "bg-cyan-50 text-[#12637E] border-cyan-100" : ""
                      }`}
                    >
                      <span className={`text-base font-black mb-1 ${isToday ? "text-primary" : "text-gray-700"}`}>
                        {Number(cell.split("-")[2])}
                      </span>
                      {rec?.checkIn && !isHoliday && !isLeave && (
                        <div className="text-[8px] font-black uppercase tracking-tighter opacity-80 bg-white/50 px-2 py-0.5 rounded-full">
                          {format(new Date(rec.checkIn), 'HH:mm')} - {rec.checkOut ? format(new Date(rec.checkOut), 'HH:mm') : '...'}
                        </div>
                      )}
                      {isHoliday && <div className="text-[8px] font-black uppercase tracking-tighter truncate w-full text-center px-1">{isHoliday.description || "Holiday"}</div>}
                      {isLeave && <div className="text-[8px] font-black uppercase tracking-tighter">Leave</div>}
                      
                      {isToday && <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-primary rounded-full"></div>}
                    </motion.div>
                  );
                })}
              </div>
            </div>

            <div className="card-premium p-8 bg-white/50 border-dashed border-2 flex flex-wrap gap-10 justify-center">
              {[
                { label: "Holiday", color: "bg-red-500 shadow-red-500/30" },
                { label: "Present", color: "bg-green-500 shadow-green-500/30" },
                { label: "Leave", color: "bg-secondary shadow-secondary/30" },
                { label: "Today", color: "bg-primary shadow-primary/30" },
              ].map(k => (
                <div key={k.label} className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${k.color} shadow-lg`}></div>
                  <span className="text-[11px] font-black text-secondary uppercase tracking-[0.2em]">{k.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-4 space-y-8 animate-slideUp" style={{ animationDelay: '0.2s' }}>
             <div className="card-premium p-10 bg-white text-center flex flex-col justify-center items-center group relative overflow-hidden h-full min-h-[400px]">
               <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-700"></div>
               
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
                   <span className="text-xs font-black text-primary">85%</span>
                 </div>
                 <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                   <div className="bg-primary h-full w-[85%] rounded-full shadow-sm"></div>
                 </div>
               </div>
             </div>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-4 mb-8">
            <div className="h-1 w-12 bg-primary rounded-full" />
            <h2 className="text-2xl font-black text-primary tracking-tight uppercase">Social Pulse</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <CelebrationCard title="Birthdays" items={celebrations.birthdays} loading={celebrationsLoading} emptyMessage="No birthday celebrations today" icon={Cake} accentColor="pink" />
            <CelebrationCard title="Work Tenure" items={celebrations.workAnniversaries} loading={celebrationsLoading} emptyMessage="No career milestones today" icon={Briefcase} accentColor="cyan" />
            <CelebrationCard title="Marital Milestones" items={celebrations.marriageAnniversaries} loading={celebrationsLoading} emptyMessage="No social events today" icon={Heart} accentColor="red" />
          </div>
        </div>

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
                <button
                  onClick={() => setConfirmModal({ show: false, title: "", message: "", onConfirm: null })}
                  className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 text-slate-700 font-bold rounded-2xl active:scale-95 transition-all text-xs uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmModal.onConfirm}
                  className="flex-1 py-3.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-2xl active:scale-95 transition-all text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20"
                >
                  {confirmModal.title.includes("Check-In") ? "Continue Check-In" : "Check Out Anyway"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LeaderAttendance;
