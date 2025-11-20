import React, { useState } from "react";
import { X } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

const ContactEmployeeLeaderPage = () => {
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
        `${API_BASE}/leader/contact?query=${encodeURIComponent(query)}`,
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
      console.error("Leader contact search error:", err);
      setError(err.message || "Failed to fetch employees");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-3 sm:p-6 relative">
      {/* <button
        onClick={() => window.history.back()}
        className="absolute top-3 right-3 sm:top-6 sm:right-6 p-2 text-gray-400 hover:text-red-500 transition-colors"
        title="Close"
      >
        <X size={24} />
      </button> */}
      <h2 className="text-2xl sm:text-3xl font-extrabold mb-6 text-[var(--color-primary)] pr-10 sm:pr-0">
        📞 Contact Employees
      </h2>

      <form
        onSubmit={handleSubmit}
        className="bg-[var(--color-surface)] card-glow p-4 sm:p-6 rounded-lg mb-6 flex flex-col gap-4"
      >
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-gray-300 mb-2">
            Search by name, email, or phone
          </label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="e.g. John Doe or john@example.com"
            className="w-full px-3 sm:px-4 py-2 text-sm rounded-md bg-gray-800 border border-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        {error && (
          <div className="text-red-400 text-xs sm:text-sm" role="alert">
            {error}
          </div>
        )}
        <button
          type="submit"
          className="self-center px-4 sm:px-5 py-2 text-sm sm:text-base bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold rounded-md shadow hover:shadow-lg transition-transform hover:scale-105"
          disabled={loading}
        >
          {loading ? "Searching..." : "Show Report"}
        </button>
      </form>

      <div className="bg-[var(--color-surface)] card-glow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[600px] border-collapse text-xs sm:text-sm">
            <thead className="bg-gray-800 text-gray-300 text-xs sm:text-sm uppercase">
              <tr>
                <th className="px-2 sm:px-4 py-3">Name</th>
                <th className="px-2 sm:px-4 py-3 hidden sm:table-cell">Email</th>
                <th className="px-2 sm:px-4 py-3">Phone</th>
                <th className="px-2 sm:px-4 py-3 hidden md:table-cell">Address</th>
                <th className="px-2 sm:px-4 py-3">Position</th>
                <th className="px-2 sm:px-4 py-3 hidden lg:table-cell">DOB</th>
                <th className="px-2 sm:px-4 py-3 hidden lg:table-cell">DOJ</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-6 text-xs sm:text-sm text-gray-400">
                    Loading...
                  </td>
                </tr>
              ) : results.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-6 text-xs sm:text-sm text-gray-400">
                    No employees found. Try a different search.
                  </td>
                </tr>
              ) : (
                results.map((employee) => (
                  <tr
                    key={employee._id}
                    className="border-t border-gray-700 hover:bg-gray-800/60"
                  >
                    <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm font-medium text-gray-100">
                      {employee.name || "-"}
                    </td>
                    <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-300 hidden sm:table-cell truncate">
                      {employee.email || "-"}
                    </td>
                    <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-300">
                      {employee.phone || "-"}
                    </td>
                    <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-300 hidden md:table-cell truncate">
                      {employee.address || "-"}
                    </td>
                    <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-300">
                      {employee.position || "-"}
                    </td>
                    <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-300 hidden lg:table-cell">
                      {employee.dateOfBirth
                        ? new Date(employee.dateOfBirth).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })
                        : "-"}
                    </td>
                    <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-300 hidden lg:table-cell">
                      {employee.dateOfJoining
                        ? new Date(employee.dateOfJoining).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })
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

export default ContactEmployeeLeaderPage;