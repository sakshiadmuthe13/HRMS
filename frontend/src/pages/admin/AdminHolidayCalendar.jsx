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
import { Calendar as CalendarIcon, Plus, Trash2 } from "lucide-react";
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
    <div className="min-h-[calc(100vh-48px)] bg-[#111828] text-[var(--color-text-primary)] p-2 overflow-x-hidden">
      <div className="flex items-center justify-between mt-4 mb-8">
        <h2 className="text-3xl font-bold text-[var(--color-primary)] flex items-center gap-2">
          <CalendarIcon className="w-8 h-8" /> Holiday Calendar
        </h2>
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveMonth(subMonths(activeMonth, 1))}
            className="btn bg-[var(--color-surface)] border border-white/10 hover:bg-white/5 text-white shadow-md"
          >
            Prev
          </button>
          <button
            onClick={() => setActiveMonth(addMonths(activeMonth, 1))}
            className="btn bg-[var(--color-primary)] hover:bg-[var(--color-secondary)] text-white shadow-md"
          >
            Next
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 card-glow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">
              {format(activeMonth, "MMMM yyyy")}
            </h3>
            {loading && (
              <span className="text-sm text-[var(--color-text-secondary)] animate-pulse">
                Loading...
              </span>
            )}
          </div>

          <div className="grid grid-cols-7 gap-3">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="text-center text-sm font-medium text-[var(--color-text-secondary)]"
              >
                {day}
              </div>
            ))}

            {/* Empty cells for days before the first day of the month */}
            {Array.from({ length: firstDayOfMonth }).map((_, index) => (
              <div key={`empty-${index}`} className="h-24"></div>
            ))}

            {daysInMonth.map((day) => {
              const key = format(day, "yyyy-MM-dd");
              const holiday = monthHolidayMap.get(key);

              const bgColor = holiday
                ? "bg-red-500/90"
                : "bg-green-500/80";
              const borderColor = holiday ? "border-red-300" : "border-green-300";
              const description = holiday?.description || "Working Day";

              return (
                <div
                  key={key}
                  className={`h-24 p-3 rounded-lg border shadow-md flex flex-col items-start justify-between text-white transition-all duration-200 hover:scale-[1.02] ${bgColor} ${borderColor}`}
                >
                  <div className="text-lg font-bold">{format(day, "d")}</div>
                  <div className="text-xs leading-snug">
                    {holiday?.type === "WEEKEND" ? "Weekend Off" : description}
                  </div>
                  {holiday && holiday.type === "CUSTOM" && (
                    <button
                      onClick={() => handleDeleteHoliday(holiday)}
                      className="self-end flex items-center gap-1 text-xs text-white/80 hover:text-white"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="card-glow p-6 h-full">
          <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
            <Plus size={18} /> Schedule Holiday
          </h3>
          <form className="space-y-4" onSubmit={handleCreateHoliday}>
            <div>
              <label className="block text-sm text-[var(--color-text-secondary)] mb-1">
                Date
              </label>
              <DatePicker 
                value={displayDate} 
                onChange={(val) => {
                  setDisplayDate(val);
                  setForm((prev) => ({ ...prev, date: convertDMYtoYMD(val) }));
                }} 
                placeholder="dd/mm/yyyy" 
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--color-text-secondary)] mb-1">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Reason for holiday"
                rows={3}
                className="w-full bg-[var(--color-background)] border border-white/10 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full btn bg-[var(--color-primary)] hover:bg-[var(--color-secondary)] text-white shadow-md"
            >
              {submitting ? "Saving..." : "Add Holiday"}
            </button>
          </form>

          <div className="mt-6">
            <h4 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mb-2">
              Legend
            </h4>
            <ul className="space-y-2 text-sm text-[var(--color-text-secondary)]">
              <li>
                <span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-2"></span>
                Working Day
              </li>
              <li>
                <span className="inline-block w-3 h-3 rounded-full bg-red-500 mr-2"></span>
                Holiday
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminHolidayCalendar;