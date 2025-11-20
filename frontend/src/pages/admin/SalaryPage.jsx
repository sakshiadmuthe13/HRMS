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
    let text = await res.text();
    try {
      text = JSON.parse(text);
    } catch {
      // Ignore JSON parse errors, use text as-is
    }
    throw new Error((text && text.message) || res.statusText || "API error");
  }
  const t = await res.text();
  return t ? JSON.parse(t) : null;
};

const apiGet = (p) => fetchJson(`${API_BASE}${p}`);
const apiPost = (p, body) =>
  fetchJson(`${API_BASE}${p}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

const SalaryPage = () => {
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [bonus, setBonus] = useState(0);
  const [salaryHistory, setSalaryHistory] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isCrediting, setIsCrediting] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [salaryDetails, setSalaryDetails] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchSalaryHistory();
  }, []);

  useEffect(() => {
    if (selected && selectedMonth && selectedYear) {
      calculateSalaryDetails();
    } else {
      setSalaryDetails(null);
    }
  }, [selected, selectedMonth, selectedYear]);

  const fetchUsers = async () => {
    try {
      const employees = await apiGet("/admin/employees");
      const leaders = await apiGet("/admin/leaders");
      setUsers([...employees, ...leaders]);
    } catch (e) {
      console.error("Error fetching users:", e);
    }
  };

  const fetchSalaryHistory = async () => {
    try {
      const history = await apiGet("/admin/salary");
      setSalaryHistory(history);
    } catch (e) {
      console.error("Error fetching salary history:", e);
    }
  };

  const calculateSalaryDetails = async () => {
    setIsCalculating(true);
    try {
      const yr = Number(selectedYear || new Date().getFullYear());
      const details = await apiPost("/admin/salary/calculate", {
        userId: selected._id,
        month: selectedMonth.toLowerCase(),
        year: yr,
      });
      setSalaryDetails(details);
    } catch (e) {
      console.error("Error calculating salary:", e);
      setSalaryDetails(null);
    } finally {
      setIsCalculating(false);
    }
  };

  const credit = async () => {
    if (!selected) return alert("Select a user");
    if (!selectedMonth) return alert("Select a month");
    const yr = Number(selectedYear || new Date().getFullYear());
    if (!yr || yr < 2000 || yr > 2100) return alert("Enter a valid year (2000-2100)");

    setIsCrediting(true);
    try {
      await apiPost("/admin/salary/credit", {
        userId: selected._id,
        bonus: Number(bonus || 0),
        month: selectedMonth.toLowerCase(),
        year: yr,
      });
      setShowSuccess(true); // ✅ Show success modal
      fetchSalaryHistory();
    } catch (e) {
      console.error("Error crediting salary:", e);
      alert(e?.message || "Failed to credit salary");
    } finally {
      setIsCrediting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-48px)] bg-[#111828] text-[var(--color-text-primary)] p-3 sm:p-4 md:p-6 overflow-x-hidden">
      <h2 className="py-2 sm:py-4 text-2xl sm:text-3xl font-bold text-[#0EA6F0]">
        💵 Salary Management
      </h2>

      {/* Input Section */}
      <div className="mt-4 card-glow p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <label className="text-sm">Select Employee / Leader</label>
          <select
            onChange={(e) =>
              setSelected(
                users.find((u) => u._id.toString() === e.target.value)
              )
            }
            className="mt-4 w-full p-2 border rounded bg-[var(--color-surface)] text-[var(--color-text-primary)] "
          >
            <option value="">Choose Employee</option>
            {users.map((u) => (
              <option
                key={u._id}
                value={u._id.toString()}
                className="bg-[var(--color-surface)] text-[var(--color-text-primary)]"
              >
                {u.name} ({u.email}) - ₹{u.salary}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-sm">Bonus</label>
            <input
              type="number"
              value={bonus}
              onChange={(e) => setBonus(e.target.value)}
              className="mt-4 mb-3 w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="text-sm">Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="mt-4 mb-3 w-full p-2 border rounded bg-[var(--color-surface)] text-[var(--color-text-primary)]"
            >
              <option value="">Select Month</option>
              {[
                "January","February","March","April","May","June",
                "July","August","September","October","November","December"
              ].map((m)=> (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm">Year</label>
            <input
              type="number"
              min="2000"
              max="2100"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              placeholder={new Date().getFullYear()}
              className="mt-4 mb-3 w-full p-2 border rounded"
            />
          </div>
        </div>

        <div className="sm:col-span-2 flex justify-center">
          <button
            onClick={credit}
            disabled={isCrediting || !salaryDetails}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded shadow-lg hover:shadow-xl hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCrediting ? "Crediting..." : "Credit Salary"}
          </button>
        </div>
      </div>

      {isCalculating && (
        <div className="mt-4 text-center text-[var(--color-text-secondary)]">
          Calculating salary details...
        </div>
      )}

      {salaryDetails && (
        <div className="mt-6 card-glow p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <h3 className="text-xl font-semibold mb-4 text-[#0EA6F0]">Salary Breakdown</h3>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-[var(--color-text-secondary)]">Days in Month:</span>
              <span className="font-semibold">{salaryDetails.daysInMonth}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-[var(--color-text-secondary)]">Weekends:</span>
              <span className="font-semibold">{salaryDetails.weekends}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-[var(--color-text-secondary)]">Holidays:</span>
              <span className="font-semibold">{salaryDetails.holidays}</span>
            </div>
            <div className="flex justify-between border-t border-[var(--color-border)] pt-2 mt-2">
              <span className="text-sm text-[var(--color-text-secondary)] font-semibold">Working Days:</span>
              <span className="font-semibold">{salaryDetails.workingDays}</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between bg-green-500/10 p-2 rounded">
              <span className="text-sm text-[var(--color-text-secondary)]">Present Days:</span>
              <span className="font-semibold text-green-400">{salaryDetails.presentDays}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-[var(--color-text-secondary)]">Absent Days:</span>
              <span className="font-semibold">{salaryDetails.absentDays}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-[var(--color-text-secondary)]">Leave Days:</span>
              <span className="font-semibold">{salaryDetails.leaveDays}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-[var(--color-text-secondary)]">Overtime Days:</span>
              <span className="font-semibold text-blue-400">{salaryDetails.overtimeDays}</span>
            </div>
          </div>

          <div className="sm:col-span-2 space-y-3 border-t border-[var(--color-border)] pt-4 mt-2">
            <div className="flex justify-between">
              <span className="text-sm text-[var(--color-text-secondary)]">Base Salary:</span>
              <span className="font-semibold">₹{salaryDetails.baseSalary}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-[var(--color-text-secondary)]">Daily Rate:</span>
              <span className="font-semibold">₹{salaryDetails.dailyRate}</span>
            </div>
            <div className="flex justify-between bg-blue-500/10 p-2 rounded">
              <span className="text-sm text-[var(--color-text-secondary)] font-semibold">Calculated Salary (Present Days × Daily Rate):</span>
              <span className="font-bold text-blue-400 text-lg">₹{salaryDetails.calculatedSalary}</span>
            </div>
            <div className="flex justify-between bg-purple-500/10 p-2 rounded">
              <span className="text-sm text-[var(--color-text-secondary)] font-semibold">Total with Bonus:</span>
              <span className="font-bold text-purple-400 text-lg">₹{salaryDetails.calculatedSalary + Number(bonus || 0)}</span>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Success Modal */}
      {showSuccess && selected && salaryDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4">
          <div className="bg-[var(--color-surface)] p-4 sm:p-5 md:p-6 rounded-xl w-full max-w-md shadow-lg card-glow animate-fadeIn max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-3 text-green-500">
              ✅ Salary Credited Successfully
            </h3>
            <p className="text-[var(--color-text-secondary)] mb-4">
              Salary for <span className="font-medium">{selected.name}</span>{" "}
              has been credited for {selectedMonth} {selectedYear}.
            </p>
            <div className="text-sm mb-6 space-y-2 bg-[var(--color-border)]/20 p-3 rounded">
              <p>
                <span className="text-[var(--color-text-secondary)]">Working Days:</span> <strong>{salaryDetails.workingDays}</strong>
              </p>
              <p>
                <span className="text-[var(--color-text-secondary)]">Present Days:</span> <strong className="text-green-400">{salaryDetails.presentDays}</strong>
              </p>
              <p>
                <span className="text-[var(--color-text-secondary)]">Daily Rate:</span> <strong>₹{salaryDetails.dailyRate}</strong>
              </p>
              <hr className="my-2 border-[var(--color-border)]" />
              <p>
                <span className="text-[var(--color-text-secondary)]">Calculated Salary:</span> <strong className="text-blue-400">₹{salaryDetails.calculatedSalary}</strong>
              </p>
              <p>
                <span className="text-[var(--color-text-secondary)]">Bonus:</span> <strong>₹{bonus || 0}</strong>
              </p>
              <p className="border-t border-[var(--color-border)] pt-2 mt-2">
                <span className="text-[var(--color-text-secondary)]">Total Credited:</span>{" "}
                <strong className="text-purple-400 text-lg">₹{salaryDetails.calculatedSalary + Number(bonus || 0)}</strong>
              </p>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setShowSuccess(false)}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Salary History */}
      <div className="mt-8 overflow-x-auto">
        <h3 className="text-lg sm:text-xl font-semibold mb-4">Salary History</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300 bg-[var(--color-surface)] text-[var(--color-text-primary)] text-sm md:text-base">
          <thead>
            <tr className="bg-[var(--color-border)] text-[var(--color-primary)]">
              <th className="border p-2">Employee</th>
              <th className="border p-2">Base Salary</th>
              <th className="border p-2">Bonus</th>
              <th className="border p-2">Total Credited</th>
              <th className="border p-2">Month</th>
              <th className="border p-2">Year</th>
              <th className="border p-2">Credited On</th>
            </tr>
          </thead>
          <tbody>
            {salaryHistory.map((record) => (
              <tr key={record._id} className="hover:bg-[var(--color-border)]">
                <td className="border p-2 text-center">
                  {record.user?.name || "N/A"}
                </td>
                <td className="border p-2 text-center">
                  ₹{record.baseSalary ?? 0}
                </td>
                <td className="border p-2 text-center">₹{record.bonus ?? 0}</td>
                <td className="border p-2 text-center">
                  ₹{record.totalCredited ?? 0}
                </td>
                <td className="border p-2 text-center">
                  {record.month ? (record.month.split(' ')[0].charAt(0).toUpperCase() + record.month.split(' ')[0].slice(1)) : "N/A"}
                </td>
                <td className="border p-2 text-center">
                  {record.year ?? (record.month?.split(' ')[1] || "N/A")}
                </td>
                <td className="border p-2 text-center">
                  {record.creditedOn
                    ? `${new Date(record.creditedOn).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })} ${new Date(record.creditedOn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`
                    : "N/A"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
};

export default SalaryPage;
