import React, { useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

// Helper to format dates as DD/MM/YYYY
const formatDateDMY = (value) => {
  if (!value) return "";
  const dateStr = typeof value === "string" ? value.split("T")[0] : value;
  if (typeof dateStr !== "string") return "";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return "";
  const [yyyy, mm, dd] = parts;
  const d = String(dd).padStart(2, "0");
  const m = String(mm).padStart(2, "0");
  return `${d}/${m}/${yyyy}`;
};

const ContactEmployeePage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const query = searchTerm.trim();
    if (!query) {
      setError("Please enter a search term.");
      return;
    }

    setLoading(true);
    try {
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");
      const response = await fetch(
        `${API_BASE}/employee/contact?query=${encodeURIComponent(query)}`,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : undefined,
          },
          credentials: "include",
        }
      );

      if (!response.ok) {
        const message = await response.text();
        throw new Error(
          message ? JSON.parse(message).message : "Failed to fetch employees"
        );
      }

      const data = await response.json();
      setResults(data || []);
    } catch (err) {
      console.error("Contact search error:", err);
      setError(err.message || "Failed to fetch employees");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-6 md:pt-10 px-3 md:px-0">
      <h2 className="text-2xl md:text-3xl font-extrabold mb-4 md:mb-6 text-[var(--color-primary)]">
        📞 Contact Employees
      </h2>

      <form
        onSubmit={handleSubmit}
        className="bg-[var(--color-surface)] card-glow p-4 md:p-6 rounded-lg mb-4 md:mb-6 flex flex-col gap-3 md:gap-4"
      >
        <div>
          <label className="block text-xs md:text-sm font-semibold text-gray-300 mb-2">
            Search by name, email, or phone
          </label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="e.g. John Doe or john@example.com"
            className="w-full px-3 md:px-4 py-2 rounded-md bg-gray-800 border border-gray-700 text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        {error && (
          <div className="text-red-400 text-xs md:text-sm" role="alert">
            {error}
          </div>
        )}
        <button
          type="submit"
          className="w-full md:w-auto md:self-center px-4 md:px-5 py-2 text-sm md:text-base bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold rounded-md shadow hover:shadow-lg transition-transform hover:scale-105 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Searching..." : "Show Report"}
        </button>
      </form>

      <div className="bg-[var(--color-surface)] card-glow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-full md:min-w-full border-collapse">
            <thead className="bg-gray-800 text-gray-300 text-xs md:text-sm uppercase sticky top-0">
              <tr>
                <th className="px-2 md:px-4 py-2 md:py-3">Name</th>
                <th className="px-2 md:px-4 py-2 md:py-3">Email</th>
                <th className="px-2 md:px-4 py-2 md:py-3 hidden sm:table-cell">Phone</th>
                <th className="px-2 md:px-4 py-2 md:py-3 hidden lg:table-cell">Address</th>
                <th className="px-2 md:px-4 py-2 md:py-3">Position</th>
                <th className="px-2 md:px-4 py-2 md:py-3 hidden md:table-cell">DOB</th>
                <th className="px-2 md:px-4 py-2 md:py-3 hidden md:table-cell">Join Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-4 md:py-6 text-gray-400 text-sm">
                    Loading...
                  </td>
                </tr>
              ) : results.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-4 md:py-6 text-gray-400 text-sm">
                    No employees found. Try a different search.
                  </td>
                </tr>
              ) : (
                results.map((employee) => (
                  <tr
                    key={employee._id}
                    className="border-t border-gray-700 hover:bg-gray-800/60 text-xs md:text-sm"
                  >
                    <td className="px-2 md:px-4 py-2 md:py-3 font-medium text-gray-100">
                      {employee.name || "-"}
                    </td>
                    <td className="px-2 md:px-4 py-2 md:py-3 text-gray-300 truncate">
                      {employee.email || "-"}
                    </td>
                    <td className="px-2 md:px-4 py-2 md:py-3 text-gray-300 hidden sm:table-cell">
                      {employee.phone || "-"}
                    </td>
                    <td className="px-2 md:px-4 py-2 md:py-3 text-gray-300 hidden lg:table-cell truncate">
                      {employee.address || "-"}
                    </td>
                    <td className="px-2 md:px-4 py-2 md:py-3 text-gray-300">
                      {employee.position || "-"}
                    </td>
                    <td className="px-2 md:px-4 py-2 md:py-3 text-gray-300 hidden md:table-cell">
                      {employee.dateOfBirth
                        ? formatDateDMY(employee.dateOfBirth)
                        : "-"}
                    </td>
                    <td className="px-2 md:px-4 py-2 md:py-3 text-gray-300 hidden md:table-cell">
                      {employee.dateOfJoining
                        ? formatDateDMY(employee.dateOfJoining)
                        : "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ContactEmployeePage;