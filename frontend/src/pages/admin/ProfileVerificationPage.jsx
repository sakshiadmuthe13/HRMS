import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import {
  CheckCircle,
  XCircle,
  Eye,
  User,
  FileText,
  Search,
  ChevronRight,
  ShieldCheck,
  Clock,
  ExternalLink,
  UserCircle,
  ArrowRight,
  Filter
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";


const ProfileVerificationPage = () => {
  const role = localStorage.getItem("role") || "admin";
  const prefix = role === "hr" ? "/hr" : "/admin";

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectDocType, setRejectDocType] = useState("");
  const [rejectReasonText, setRejectReasonText] = useState("");

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
      const response = await fetch(`${API_BASE}${prefix}/verification/employees`, {
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

  const verifyDocument = async (userId, documentType, verified, rejectionReason = "") => {
    setVerifying(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_BASE}${prefix}/verification/${userId}/document/${documentType}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ verified, rejectionReason }),
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
      toast.error(error.message || "Failed to update verification");
    } finally {
      setVerifying(false);
    }
  };

  const handleRejectClick = (docType) => {
    setRejectDocType(docType);
    setRejectReasonText("");
    setShowRejectModal(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectReasonText.trim()) {
      toast.error("Please enter a reason for rejection");
      return;
    }
    setShowRejectModal(false);
    await verifyDocument(selectedUser._id, rejectDocType, false, rejectReasonText);
  };

  const getVerificationStatus = (doc) => {
    if (!doc || !doc.path) return "Not Uploaded";
    if (doc.verified) return "Verified";
    if (doc.rejectionReason) return "Rejected";
    return "Pending";
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "Verified":
        return "bg-green-100 text-green-600 border-green-200";
      case "Pending":
        return "bg-amber-100 text-amber-600 border-amber-200";
      case "Rejected":
        return "bg-red-100 text-red-600 border-red-200";
      default:
        return "bg-gray-50 text-gray-900 border-gray-200";
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role.toLowerCase().includes(searchQuery.toLowerCase());

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
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <p className="mt-4 text-secondary font-bold tracking-widest animate-pulse uppercase text-xs">Accessing Encrypted Records...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-primary animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
        <div>
          <h2 className="text-4xl font-black text-primary tracking-tight mb-2 flex items-center gap-3">
            <ShieldCheck size={32} className="text-primary" />
            Identity Verification
          </h2>
          <p className="text-secondary font-medium opacity-80">Audit and authorize personnel documentation and credentials.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* User List Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-[2.5rem] shadow-xl shadow-primary/5 border border-gray-200 overflow-hidden flex flex-col h-[calc(100vh-250px)]">
            <div className="p-6 border-b border-gray-200 space-y-4">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary group-focus-within:text-primary transition-colors" size={18} />
                <input
                  type="text"
                  placeholder="Filter personnel..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-primary font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                />
              </div>

              <div className="flex p-1 bg-gray-50 rounded-xl">
                {["all", "pending", "verified"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`flex-1 py-2 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                      filterStatus === status
                        ? "bg-white text-primary shadow-sm"
                        : "text-secondary hover:text-primary"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
              {filteredUsers.map((user) => (
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  key={user._id}
                  onClick={() => setSelectedUser(user)}
                  className={`p-4 rounded-2xl cursor-pointer border transition-all relative ${
                    selectedUser?._id === user._id
                      ? "bg-primary text-white border-primary shadow-xl shadow-primary/20"
                      : "bg-white border-gray-200 hover:border-primary/30"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${
                      selectedUser?._id === user._id ? "bg-white/20" : "bg-primary/10 text-primary"
                    }`}>
                      {user.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold truncate text-sm">{user.name}</div>
                      <div className={`text-[10px] uppercase font-black tracking-widest opacity-60 ${
                        selectedUser?._id === user._id ? "text-white" : "text-secondary"
                      }`}>
                        {user.role}
                      </div>
                    </div>
                    {!user.profileVerified && (
                      <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shadow-lg shadow-amber-500/50"></div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Audit Details */}
        <div className="lg:col-span-8 overflow-y-auto max-h-[calc(100vh-250px)] no-scrollbar">
          <AnimatePresence mode="wait">
            {selectedUser ? (
              <motion.div
                key={selectedUser._id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                {/* Profile Banner */}
                <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-200 flex flex-col md:flex-row items-center gap-8">
                  <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center text-primary text-4xl font-black">
                    {selectedUser.name.charAt(0)}
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-3xl font-black text-primary tracking-tight mb-1">{selectedUser.name}</h3>
                    <div className="flex flex-wrap justify-center md:justify-start gap-4 text-secondary font-bold text-sm">
                      <span className="flex items-center gap-1.5"><UserCircle size={16} /> {selectedUser.email}</span>
                      <span className="flex items-center gap-1.5"><Clock size={16} /> Joined {new Date(selectedUser.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className={`px-6 py-3 rounded-2xl border-2 font-black uppercase tracking-[0.2em] text-[10px] ${
                    selectedUser.profileVerified 
                      ? "bg-green-50 border-green-200 text-green-600" 
                      : "bg-amber-50 border-amber-200 text-amber-600"
                  }`}>
                    {selectedUser.profileVerified ? "Authorized" : "Awaiting Authorization"}
                  </div>
                </div>

                {/* Document Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(documentLabels).map(([field, label]) => {
                    const doc = selectedUser.documents?.[field];
                    const status = getVerificationStatus(doc);
                    return (
                      <div key={field} className="bg-white p-6 rounded-[2rem] border border-gray-200 shadow-xl shadow-primary/5 group hover:border-primary transition-all">
                        <div className="flex items-start justify-between mb-4">
                          <div className="space-y-1">
                            <h4 className="text-[10px] font-black text-secondary uppercase tracking-widest">{label}</h4>
                            <div className={`inline-block px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-tighter border ${getStatusStyle(status)}`}>
                              {status}
                            </div>
                          </div>
                          {doc?.path && (
                            <a 
                              href={doc.path} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="p-3 bg-gray-50 text-secondary rounded-xl hover:bg-primary hover:text-white transition-all shadow-sm"
                            >
                              <ExternalLink size={18} />
                            </a>
                          )}
                        </div>

                         {doc?.path ? (
                          <div className="space-y-3">
                            {status === "Rejected" && doc.rejectionReason && (
                              <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 font-semibold">
                                <strong>Reason:</strong> {doc.rejectionReason}
                              </div>
                            )}
                            <div className="flex gap-3">
                              <button
                                onClick={() => verifyDocument(selectedUser._id, field, true)}
                                disabled={verifying || doc.verified}
                                className="flex-1 py-3 bg-green-50 text-green-600 rounded-xl font-bold text-xs hover:bg-green-500 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleRejectClick(field)}
                                disabled={verifying || status === "Rejected"}
                                className="flex-1 py-3 bg-red-50 text-red-500 rounded-xl font-bold text-xs hover:bg-red-500 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="py-4 text-center border-2 border-dashed border-gray-200 rounded-2xl text-[10px] font-black text-secondary/40 uppercase tracking-widest">
                            No Transmission Received
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Supplementary Data */}
                {selectedUser.documents?.bankIFSC && (
                  <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-200">
                    <h3 className="text-xl font-black mb-6 text-primary flex items-center gap-2">
                      <FileText size={20} className="text-secondary" />
                      Financial & Civil Data
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                      <div>
                        <div className="text-[10px] font-black text-secondary uppercase tracking-widest mb-1">Bank Account</div>
                        <div className="font-bold text-primary">{selectedUser.documents.bankAccountNumber}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-black text-secondary uppercase tracking-widest mb-1">IFSC Routing</div>
                        <div className="font-bold text-primary">{selectedUser.documents.bankIFSC}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-black text-secondary uppercase tracking-widest mb-1">Civil Status</div>
                        <div className="font-bold text-primary">{selectedUser.isMarried ? "Married" : "Single"}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-black text-secondary uppercase tracking-widest mb-1">Union Anniversary</div>
                        <div className="font-bold text-primary">
                          {selectedUser.isMarried && selectedUser.marriageAnniversary ? new Date(selectedUser.marriageAnniversary).toLocaleDateString() : "—"}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="bg-white rounded-[2.5rem] border border-dashed border-gray-200 h-[calc(100vh-250px)] flex flex-col items-center justify-center text-center p-12">
                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                  <User size={48} className="text-secondary opacity-30" />
                </div>
                <h3 className="text-2xl font-black text-primary tracking-tight mb-2">Awaiting Selection</h3>
                <p className="text-secondary font-medium max-w-sm">Select a member from the personnel directory to initiate the credential audit process.</p>
                <div className="mt-8 flex items-center gap-2 text-xs font-black text-primary animate-bounce">
                  Select Member <ArrowRight size={16} />
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <AnimatePresence>
        {showRejectModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-primary/30 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 cursor-default"
              onClick={() => setShowRejectModal(false)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-md p-6 rounded-[2rem] shadow-2xl border border-gray-150 flex flex-col z-[120]"
            >
              <h3 className="text-xl font-black text-primary mb-2">Reject Document</h3>
              <p className="text-xs text-secondary mb-4 font-bold">
                Please specify the reason why you are rejecting the document: <span className="text-primary">{documentLabels[rejectDocType]}</span>.
              </p>
              <textarea
                value={rejectReasonText}
                onChange={(e) => setRejectReasonText(e.target.value)}
                placeholder="Type rejection reason here (e.g. blurry image, missing pages, wrong document)..."
                rows={4}
                className="w-full p-4 border border-gray-200 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all resize-none mb-6"
              />
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="px-5 py-3 bg-gray-50 text-secondary hover:bg-gray-100 rounded-xl font-bold text-xs transition-all border border-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmReject}
                  className="px-5 py-3 bg-red-500 text-white hover:bg-red-600 rounded-xl font-bold text-xs transition-all shadow-md shadow-red-500/20"
                >
                  Reject Document
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfileVerificationPage;
