import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  CheckCircle,
  XCircle,
  Eye,
  User,
  FileText,
  Search,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

const ProfileVerificationPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // all, pending, verified

  const documentLabels = {
    passportPhoto: "Passport Size Photograph",
    tenthMarksheet: "10th Marksheet",
    twelthDiplomaMarksheet: "12th/Diploma Marksheet",
    graduationMarksheet: "Graduation Marksheet",
    bankPassbookPhoto: "Bank Passbook Photo",
    aadharFront: "Aadhar Card (Front)",
    aadharBack: "Aadhar Card (Back)",
    panCard: "Pan Card",
    cv: "Updated CV",
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/admin/verification/employees`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setUsers(data);
      } else {
        toast.error(data.message || "Failed to fetch users");
      }
    } catch (error) {
      console.error("Fetch users error:", error);
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const verifyDocument = async (userId, documentType, verified) => {
    setVerifying(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_BASE}/admin/verification/${userId}/document/${documentType}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ verified }),
        }
      );
      const data = await response.json();
      if (response.ok) {
        toast.success(
          `Document ${verified ? "verified" : "unverified"} successfully`
        );
        setUsers((prev) =>
          prev.map((user) =>
            user._id === userId
              ? {
                  ...user,
                  documents: data.user.documents,
                  profileVerified: data.user.profileVerified,
                }
              : user
          )
        );
        if (selectedUser && selectedUser._id === userId) {
          setSelectedUser((prev) => ({
            ...prev,
            documents: data.user.documents,
            profileVerified: data.user.profileVerified,
          }));
        }
      } else {
        toast.error(data.message || "Failed to update verification");
      }
    } catch (error) {
      console.error("Verify document error:", error);
      toast.error("Failed to update verification");
    } finally {
      setVerifying(false);
    }
  };

  const getVerificationStatus = (doc) => {
    if (!doc || !doc.path) return "Not Uploaded";
    if (doc.verified) return "Verified";
    return "Pending";
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Verified":
        return "text-green-600 bg-green-100";
      case "Pending":
        return "text-yellow-600 bg-yellow-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Verified":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "Pending":
        return <XCircle className="w-4 h-4 text-yellow-600" />;
      default:
        return <XCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  // Filter and search users
  const filteredUsers = users.filter((user) => {
    // Search filter
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role.toLowerCase().includes(searchQuery.toLowerCase());

    // Status filter
    const matchesStatus =
      filterStatus === "all"
        ? true
        : filterStatus === "verified"
        ? user.profileVerified
        : filterStatus === "pending"
        ? !user.profileVerified
        : true;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <section className="min-h-[calc(100vh-48px)] bg-[#111828] text-[var(--color-text-primary)] p-3 sm:p-4 md:p-6 overflow-x-hidden">
      <div className="max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3 mb-6 sm:mb-8">
          <CheckCircle className="w-6 sm:w-8 h-6 sm:h-8 text-[var(--color-primary)]" />
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] bg-clip-text text-transparent">
            Profile Verification
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
          {/* All Users List */}
          <div className="lg:col-span-1">
            <div className="card-glow p-4 md:p-6">
              <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-4">
                Employees & Leaders
              </h2>

              {/* Search Bar */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--color-text-secondary)]" />
                  <input
                    type="text"
                    placeholder="Search by name, email, or role..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                  />
                </div>
              </div>

              {/* Filter Buttons */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setFilterStatus("all")}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    filterStatus === "all"
                      ? "bg-[var(--color-primary)] text-white"
                      : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]/80"
                  }`}
                >
                  All ({users.length})
                </button>
                <button
                  onClick={() => setFilterStatus("pending")}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    filterStatus === "pending"
                      ? "bg-yellow-600 text-white"
                      : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]/80"
                  }`}
                >
                  Pending ({users.filter((u) => !u.profileVerified).length})
                </button>
                <button
                  onClick={() => setFilterStatus("verified")}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    filterStatus === "verified"
                      ? "bg-green-600 text-white"
                      : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]/80"
                  }`}
                >
                  Verified ({users.filter((u) => u.profileVerified).length})
                </button>
              </div>

              {/* Users List */}
              <div className="space-y-3 max-h-[28rem] overflow-y-auto">
                {filteredUsers.length === 0 ? (
                  <div className="text-center py-8 text-[var(--color-text-secondary)]">
                    <User className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No users found</p>
                  </div>
                ) : (
                  filteredUsers.map((user) => (
                    <div
                      key={user._id}
                      onClick={() => setSelectedUser(user)}
                      className={`p-4 rounded-lg cursor-pointer transition-all card-glow ${
                        selectedUser?._id === user._id
                          ? "ring-2 ring-[var(--color-primary)] bg-[var(--color-primary)]/10"
                          : "hover:bg-[var(--color-surface)]/80"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-[var(--color-text-primary)]">
                              {user.name}
                            </h3>
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-medium ${
                                user.role === "admin"
                                  ? "bg-purple-900/30 text-purple-400 border border-purple-800"
                                  : user.role === "leader"
                                  ? "bg-blue-900/30 text-blue-400 border border-blue-800"
                                  : "bg-gray-900/30 text-gray-400 border border-gray-800"
                              }`}
                            >
                              {user.role}
                            </span>
                          </div>
                          <p className="text-sm text-[var(--color-text-secondary)]">
                            {user.email}
                          </p>
                        </div>
                        <div
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.profileVerified
                              ? "bg-green-900/30 text-green-400 border border-green-800"
                              : "bg-yellow-900/30 text-yellow-400 border border-yellow-800"
                          }`}
                        >
                          {user.profileVerified ? "Verified" : "Pending"}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Document Verification */}
          <div className="lg:col-span-2">
            {selectedUser ? (
              <div className="card-glow p-4 md:p-6">
                <div className="flex items-center gap-3 mb-6">
                  <User className="w-6 h-6 text-[var(--color-primary)]" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
                        {selectedUser.name}
                      </h2>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          selectedUser.role === "admin"
                            ? "bg-purple-900/30 text-purple-400 border border-purple-800"
                            : selectedUser.role === "leader"
                            ? "bg-blue-900/30 text-blue-400 border border-blue-800"
                            : "bg-gray-900/30 text-gray-400 border border-gray-800"
                        }`}
                      >
                        {selectedUser.role}
                      </span>
                    </div>
                    <p className="text-[var(--color-text-secondary)]">
                      {selectedUser.email}
                    </p>
                  </div>
                  <div
                    className={`ml-auto px-4 py-2 rounded-full text-sm font-medium ${
                      selectedUser.profileVerified
                        ? "bg-green-900/30 text-green-400 border border-green-800"
                        : "bg-yellow-900/30 text-yellow-400 border border-yellow-800"
                    }`}
                  >
                    Profile{" "}
                    {selectedUser.profileVerified ? "Verified" : "Unverified"}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(documentLabels).map(([field, label]) => {
                    const doc = selectedUser.documents?.[field];
                    const status = getVerificationStatus(doc);
                    return (
                      <div key={field} className="card-glow p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-medium text-[var(--color-text-primary)]">
                            {label}
                          </h3>
                          <div
                            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                              status
                            )}`}
                          >
                            {getStatusIcon(status)}
                            {status}
                          </div>
                        </div>

                        {doc?.path && (
                          <div className="flex items-center gap-2 mb-3">
                            <a
                              href={doc.path}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[var(--color-primary)] hover:text-[var(--color-primary)]/80 text-sm"
                            >
                              <Eye className="w-3 h-3" />
                              View Document
                            </a>
                            {doc.uploadedAt && (
                              <span className="text-xs text-[var(--color-text-secondary)]">
                                Uploaded:{" "}
                                {new Date(doc.uploadedAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        )}

                        {doc?.path && (
                          <div className="flex gap-2">
                            <button
                              onClick={() =>
                                verifyDocument(selectedUser._id, field, true)
                              }
                              disabled={verifying || doc.verified}
                              className="flex-1 bg-green-600 text-white py-1 px-3 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-1"
                            >
                              <CheckCircle className="w-3 h-3" />
                              Verify
                            </button>
                            <button
                              onClick={() =>
                                verifyDocument(selectedUser._id, field, false)
                              }
                              disabled={verifying || !doc.verified}
                              className="flex-1 bg-red-600 text-white py-1 px-3 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-1"
                            >
                              <XCircle className="w-3 h-3" />
                              Unverify
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {selectedUser.documents?.bankIFSC && (
                  <div className="mt-4 card-glow p-4">
                    <h3 className="text-sm font-medium text-[var(--color-text-primary)] mb-2">
                      Bank Details
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-[var(--color-text-primary)]">
                          IFSC:
                        </span>{" "}
                        <span className="text-[var(--color-text-secondary)]">
                          {selectedUser.documents.bankIFSC}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-[var(--color-text-primary)]">
                          Account:
                        </span>{" "}
                        <span className="text-[var(--color-text-secondary)]">
                          {selectedUser.documents.bankAccountNumber}
                        </span>
                      </div>
                    </div>
                    <h3 className="text-sm font-medium text-[var(--color-text-primary)] mb-2 mt-4">Personal Details</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-[var(--color-text-primary)]">Marital Status:</span>{" "}
                        <span className="text-[var(--color-text-secondary)]">{selectedUser.isMarried ? "Married" : "Single"}</span>
                      </div>
                      <div>
                        <span className="font-medium text-[var(--color-text-primary)]">Marriage Anniversary:</span>{" "}
                        <span className="text-[var(--color-text-secondary)]">{selectedUser.isMarried && selectedUser.marriageAnniversary ? new Date(selectedUser.marriageAnniversary).toLocaleDateString() : "-"}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="card-glow p-12 text-center">
                <FileText className="w-16 h-16 text-[var(--color-text-secondary)] mx-auto mb-4" />
                <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">
                  Select a User
                </h3>
                <p className="text-[var(--color-text-secondary)]">
                  Choose a user from the list to view and verify their
                  documents.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProfileVerificationPage;
