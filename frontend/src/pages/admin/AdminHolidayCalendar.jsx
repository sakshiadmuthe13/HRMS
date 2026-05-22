import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  startOfMonth,
  subMonths,
} from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar as CalendarIcon, Plus, Trash2, ChevronLeft, ChevronRight, Info, AlertCircle, Clock } from "lucide-react";
import { toast } from "react-toastify";
import DatePicker from "../../components/DatePicker";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

const fetchJson = async (path, opts = {}) => {
  const token = (() => {
    try {
      return localStorage.getItem("token") || sessionStorage.getItem("token");
    } catch {
      return null;
    }
  })();

  const headers = { "Content-Type": "application/json", ...(opts.headers || {}) };
  if (token && !headers.Authorization && !headers.authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    ...opts,
    headers,
  });

  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || "Request failed");
  }

  const text = await res.text();
  return text ? JSON.parse(text) : null;
};

const AdminHolidayCalendar = () => {
  const convertYMDtoDMY = (ymd) => {
    if (!ymd) return "";
    const parts = ymd.split("-");
    if (parts.length !== 3) return "";
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  const convertDMYtoYMD = (dmy) => {
    if (!dmy) return "";
    const parts = dmy.split("/");
    if (parts.length !== 3) return "";
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  };

  const [activeMonth, setActiveMonth] = useState(new Date());
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ date: "", description: "" });
  const [displayDate, setDisplayDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const daysInMonth = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfMonth(activeMonth),
        end: endOfMonth(activeMonth),
      }),
    [activeMonth]
  );

  const firstDayOfMonth = useMemo(
    () => getDay(startOfMonth(activeMonth)),
    [activeMonth]
  );

  const fetchHolidays = useCallback(async () => {
    setLoading(true);
    try {
      const start = format(startOfMonth(activeMonth), "yyyy-MM-dd");
      const end = format(endOfMonth(activeMonth), "yyyy-MM-dd");
      const data = await fetchJson(`/admin/holidays?start=${start}&end=${end}`);
      setHolidays(data || []);
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to load holidays");
    } finally {
      setLoading(false);
    }
  }, [activeMonth]);

  useEffect(() => {
    fetchHolidays();
  }, [activeMonth, fetchHolidays]);

  const monthHolidayMap = useMemo(() => {
    const map = new Map();
    holidays.forEach((holiday) => {
      const key = format(new Date(holiday.date), "yyyy-MM-dd");
      map.set(key, holiday);
    });
    return map;
  }, [holidays]);

  const handleCreateHoliday = async (e) => {
    e.preventDefault();
    if (!form.date || !form.description) {
      toast.warn("Please fill date and description");
      return;
    }

    try {
      setSubmitting(true);
      toast.info("Adding holiday and sending notifications to all users...", {
        autoClose: 3000,
      });
      await fetchJson(`/admin/holidays`, {
        method: "POST",
        body: JSON.stringify(form),
      });
      toast.success("Holiday added successfully! Email notifications sent to all users.", {
        autoClose: 5000,
      });
      setForm({ date: "", description: "" });
      await fetchHolidays();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to add holiday");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteHoliday = async (holiday) => {
    if (holiday.type === "WEEKEND") {
      toast.info("Weekend holidays cannot be removed");
      return;
    }

    try {
      await fetchJson(`/admin/holidays/${holiday._id}`, { method: "DELETE" });
      toast.success("Holiday removed");
      await fetchHolidays();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to remove holiday");
    }
  };


  return (
    <div className="min-h-screen bg-background text-primary animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
        <div>
          <h2 className="text-4xl font-black text-primary tracking-tight mb-2 flex items-center gap-3">
            <CalendarIcon size={32} className="text-primary" />
            Holiday Registry
          </h2>
          <p className="text-secondary font-medium opacity-80">Define organizational holidays and manage weekend cycles.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl shadow-xl shadow-primary/5 border border-gray-200">
          <button
            onClick={() => setActiveMonth(subMonths(activeMonth, 1))}
            className="p-3 hover:bg-gray-50 rounded-xl text-primary transition-all"
          >
            <ChevronLeft size={24} />
          </button>
          <div className="px-6 font-black text-primary text-lg">
            {format(activeMonth, "MMMM yyyy")}
          </div>
          <button
            onClick={() => setActiveMonth(addMonths(activeMonth, 1))}
            className="p-3 hover:bg-gray-50 rounded-xl text-primary transition-all"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-primary/5 border border-gray-200">
            <div className="grid grid-cols-7 gap-4">
              {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day) => (
                <div key={day} className="text-center text-[10px] font-black text-secondary uppercase tracking-widest mb-4">
                  {day}
                </div>
              ))}

              {Array.from({ length: firstDayOfMonth }).map((_, index) => (
                <div key={`empty-${index}`} className="aspect-square"></div>
              ))}

              {daysInMonth.map((day) => {
                const key = format(day, "yyyy-MM-dd");
                const holiday = monthHolidayMap.get(key);
                const isHoliday = !!holiday;

                const cellVariantClass = isHoliday
                  ? holiday?.type === "WEEKEND"
                    ? "bg-[#EF4444]/50 border-red-200 text-red-500 shadow-md"
                    : "bg-red-600 border-red-700 text-white shadow-lg shadow-red-700/20"
                  : "bg-gray-50/50 border-gray-200 text-primary hover:bg-white hover:shadow-xl hover:shadow-primary/5";

                return (
                  <motion.div
                    key={key}
                    whileHover={{ scale: 1.05 }}
                    className={`aspect-square p-3 rounded-2xl border transition-all flex flex-col items-start justify-between relative group overflow-hidden ${cellVariantClass}`}
                  >
                    <div className="text-sm font-black">{format(day, "d")}</div>

                    {isHoliday && (
                      <div className="text-[9px] font-bold leading-tight opacity-80 uppercase tracking-tighter">
                        {holiday.type === "WEEKEND" ? "Weekend" : holiday.description}
                      </div>
                    )}

                    {holiday && holiday.type === "CUSTOM" && (
                      <button
                        onClick={() => handleDeleteHoliday(holiday)}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>

          <div className="bg-primary p-8 rounded-[2.5rem] shadow-2xl text-white flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/10 rounded-2xl border border-gray-200/5">
                <Info size={24} />
              </div>
              <div>
                <h4 className="font-black text-lg">Auto-Notifications Active</h4>
                <p className="text-sm opacity-60 font-medium">All employees will be alerted of new holiday scheduling.</p>
              </div>
            </div>
            <Clock size={40} className="opacity-10" />
          </div>
        </div>

        {/* Action Sidebar */}
        <div className="space-y-8">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-200">
            <h3 className="text-xl font-black mb-6 text-primary flex items-center gap-2">
              <Plus size={20} />
              Provision Holiday
            </h3>
            <form className="space-y-6" onSubmit={handleCreateHoliday}>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-primary/70 uppercase tracking-widest ml-1">Event Date</label>
                <DatePicker 
                  value={displayDate} 
                  onChange={(val) => {
                    setDisplayDate(val);
                    setForm((prev) => ({ ...prev, date: convertDMYtoYMD(val) }));
                  }} 
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-primary/70 uppercase tracking-widest ml-1">Reason / Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="e.g. Annual Summit"
                  rows={4}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-primary font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-primary text-white font-bold rounded-2xl hover:bg-secondary transition-all shadow-xl shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? "Processing..." : <><Plus size={20} /> Add to Calendar</>}
              </button>
            </form>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-200">
            <h4 className="text-xs font-black text-primary uppercase tracking-widest mb-6">Calendar Key</h4>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-red-500 shadow-lg shadow-red-500/20"></div>
                <span className="text-sm font-bold text-secondary">Statutory Holiday</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-gray-50 border border-gray-200"></div>
                <span className="text-sm font-bold text-secondary">Regular Working Day</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-[#EF4444]/50"></div>
                <span className="text-sm font-bold text-secondary">Weekend Cycle</span>
              </div>
            </div>
            
            <div className="mt-8 pt-8 border-t border-gray-200">
              <div className="flex items-start gap-3">
                <AlertCircle size={18} className="text-secondary mt-0.5" />
                <p className="text-[10px] text-secondary font-medium leading-relaxed uppercase tracking-wider opacity-60">
                  Weekend cycles are automatically calculated based on organizational policy and cannot be manually modified.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminHolidayCalendar;