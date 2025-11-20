import React, { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  format,
  parse,
  addMonths,
  subMonths,
  eachDayOfInterval,
  endOfMonth,
  startOfMonth,
  getDay,
  isSameMonth,
} from "date-fns";
import { createPortal } from "react-dom"

const DatePicker = ({ value, onChange, placeholder = "dd/mm/yyyy" }) => {
  const [showPicker, setShowPicker] = useState(false);
  const [displayDate, setDisplayDate] = useState(new Date());
  const pickerRef = useRef(null);

  const parseDate = (dateString) => {
    if (!dateString) return null;
    try {
      return parse(dateString, "dd/MM/yyyy", new Date());
    } catch {
      return null;
    }
  };

  const formatDate = (date) => {
    try {
      return format(date, "dd/MM/yyyy");
    } catch {
      return "";
    }
  };

  useEffect(() => {
    if (value) {
      const parsed = parseDate(value);
      if (parsed && !isNaN(parsed)) {
        setDisplayDate(parsed);
      }
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        const portal = document.querySelector('[class*="z-\\[999999\\]"]');
        if (!portal || !portal.contains(e.target)) {
          setShowPicker(false);
        }
      }
    };

    if (showPicker) {
      setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
      }, 0);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showPicker]);

  const days = eachDayOfInterval({
    start: startOfMonth(displayDate),
    end: endOfMonth(displayDate),
  });

  const firstDay = getDay(startOfMonth(displayDate));
  const emptyDays = Array(firstDay).fill(null);

  const handleDateSelect = (day) => {
    const formatted = formatDate(day);
    onChange(formatted);
    setDisplayDate(day);
    setShowPicker(false);
  };

  const handlePrevMonth = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDisplayDate(subMonths(displayDate, 1));
  };

  const handleNextMonth = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDisplayDate(addMonths(displayDate, 1));
  };

  return (
    <div className="relative w-full" ref={pickerRef}>
      <input
        type="text"
        value={value || ""}
        onChange={(e) => {
          const val = e.target.value;
          onChange(val);
          const parsed = parseDate(val);
          if (parsed && !isNaN(parsed)) {
            setDisplayDate(parsed);
          }
        }}
        onClick={() => setShowPicker(!showPicker)}
        placeholder={placeholder}
        className="w-full p-3 bg-[var(--color-background)] border border-[rgba(255,255,255,0.1)] rounded-md text-[var(--color-text-primary)] focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition-all cursor-pointer"
      />

      {showPicker &&
        createPortal(
          <div
            className="fixed z-[999999] left-0 top-0 flex justify-center items-start mt-2"
            style={{
              position: "absolute",
              top:
                pickerRef.current?.getBoundingClientRect().bottom +
                window.scrollY,
              left: pickerRef.current?.getBoundingClientRect().left,
            }}
          >
            <div className="bg-[var(--color-surface)] border border-[rgba(14,166,240,0.3)] rounded-lg shadow-lg p-4 w-72">
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1 hover:bg-[rgba(14,166,240,0.2)] rounded"
                >
                  <ChevronLeft
                    size={20}
                    className="text-[var(--color-primary)]"
                  />
                </button>
                <span className="text-sm font-semibold text-[var(--color-primary)]">
                  {format(displayDate, "MMMM yyyy")}
                </span>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1 hover:bg-[rgba(14,166,240,0.2)] rounded"
                >
                  <ChevronRight
                    size={20}
                    className="text-[var(--color-primary)]"
                  />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                  <div
                    key={d}
                    className="text-xs text-center font-medium text-[var(--color-text-secondary)] py-2"
                  >
                    {d}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {emptyDays.map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {days.map((day) => {
                  const isSelected =
                    value && format(day, "dd/MM/yyyy") === value;
                  const isCurrentMonth = isSameMonth(day, displayDate);
                  return (
                    <button
                      type="button"
                      key={format(day, "yyyy-MM-dd")}
                      onClick={() => handleDateSelect(day)}
                      disabled={!isCurrentMonth}
                      className={`p-2 text-xs rounded text-center transition-all ${
                        isSelected
                          ? "bg-[var(--color-primary)] text-white font-semibold"
                          : isCurrentMonth
                          ? "text-[var(--color-text-primary)] hover:bg-[rgba(14,166,240,0.2)]"
                          : "text-[var(--color-text-secondary)] opacity-50 cursor-not-allowed"
                      }`}
                    >
                      {format(day, "d")}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setShowPicker(false)}
                className="mt-4 w-full py-2 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-all"
              >
                Close
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default DatePicker;
