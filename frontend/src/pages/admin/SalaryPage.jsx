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
  const [showSuccess, setShowSuccess] = useState(false); // ✅ Modal state
  const [isCrediting, setIsCrediting] = useState(false); // Loading state
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");

  useEffect(() => {
    fetchUsers();
    fetchSalaryHistory();
  }, []);

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
    <div className="min-h-[calc(100vh-48px)] bg-[#111828] text-[var(--color-text-primary)] p-6 overflow-x-hidden">
      <h2 className="text-2xl font-semibold"></h2>
      <h2 className="py-4 text-3xl font-bold text-[#0EA6F0]">
        💵 Salary Management
      </h2>

      {/* Input Section */}
      <div className="mt-4 card-glow p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            disabled={isCrediting}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded shadow-lg hover:shadow-xl hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCrediting ? "Crediting..." : "Credit Salary"}
          </button>
        </div>
      </div>

      {/* ✅ Success Modal */}
      {showSuccess && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-[var(--color-surface)] p-6 rounded-xl w-full max-w-md shadow-lg card-glow animate-fadeIn">
            <h3 className="text-xl font-semibold mb-3 text-green-500">
              ✅ Salary Credited Successfully
            </h3>
            <p className="text-[var(--color-text-secondary)] mb-4">
              Salary for <span className="font-medium">{selected.name}</span>{" "}
              has been credited successfully.
            </p>
            <div className="text-sm mb-6 space-y-1">
              <p>
                Base Salary: <strong>₹{selected.salary}</strong>
              </p>
              <p>
                Bonus: <strong>₹{bonus || 0}</strong>
              </p>
              <p>
                Total:{" "}
                <strong>₹{Number(selected.salary) + Number(bonus || 0)}</strong>
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
      <div className="mt-8">
        <h3 className="text-xl font-semibold">Salary History</h3>
        <table className="w-full mt-4 border-collapse border border-gray-300 bg-[var(--color-surface)] text-[var(--color-text-primary)]">
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
  );
};

export default SalaryPage;
