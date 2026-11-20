import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import { User, Upload, CheckCircle2, XCircle, Eye, Phone, MapPin, Briefcase, Calendar as CalendarIcon, ShieldCheck, Mail, Building, Landmark, FileText, Camera, ArrowRight } from "lucide-react";
import DatePicker from "../../components/DatePicker";

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

const convertDMYToYMD = (dmy) => {
  if (!dmy) return "";
  const parts = dmy.split("/");
  if (parts.length !== 3) return "";
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
};

const formatDateDMY = (date) => {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d)) return "";
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [formData, setFormData] = useState({
    employeeId: "",
    phone: "",
    address: "",
    bankName: "",
    bankIFSC: "",
    bankAccountNumber: "",
    panNumber: "",
    pfNumber: "",
    uanNumber: "",
    isMarried: false,
    marriageAnniversary: ""
  });
  const [files, setFiles] = useState({ passportPhoto: null, tenthMarksheet: null, twelthDiplomaMarksheet: null, graduationMarksheet: null, bankPassbookPhoto: null, aadharFront: null, aadharBack: null, panCard: null, cv: null });

  const documentLabels = {
    passportPhoto: "Profile Photograph",
    tenthMarksheet: "10th Marksheet",
    twelthDiplomaMarksheet: "12th/Diploma",
    graduationMarksheet: "Graduation Cert",
    bankPassbookPhoto: "Bank Passbook",
    aadharFront: "Aadhar Front",
    aadharBack: "Aadhar Back",
    panCard: "PAN Card",
    cv: "Professional CV",
  };

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      const response = await apiGet("/employee/profile");
      setProfile(response);
      const autoEmpId = (response?.employeeId && response.employeeId.startsWith("QT-"))
        ? response.employeeId
        : (response?._id ? `QT-${response._id.toString().slice(-6).toUpperCase()}` : "QT-B66A0F");
      setFormData({
        employeeId: autoEmpId,
        phone: response.phone || "",
        address: response.address || "",
        bankName: response.bankName || response.documents?.bankName || "",
        bankIFSC: response.bankIFSC || response.documents?.bankIFSC || "",
        bankAccountNumber: response.bankAccount || response.documents?.bankAccountNumber || "",
        panNumber: response.panNumber || response.documents?.panNumber || "",
        pfNumber: response.pfNumber || "",
        uanNumber: response.uanNumber || "",
        isMarried: !!response.isMarried,
        marriageAnniversary: response.marriageAnniversary ? formatDateDMY(response.marriageAnniversary) : "",
      });
    } catch (error) { toast.error("Failed to fetch profile"); }
    finally { setLoading(false); }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (field, file) => {
    setFiles(prev => ({ ...prev, [field]: file }));
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setUploading(true);
    const data = new FormData();
    data.append("employeeId", formData.employeeId);
    data.append("phone", formData.phone);
    data.append("address", formData.address);
    data.append("bankName", formData.bankName);
    data.append("bankIFSC", formData.bankIFSC);
    data.append("bankAccount", formData.bankAccountNumber);
    data.append("bankAccountNumber", formData.bankAccountNumber);
    data.append("panNumber", formData.panNumber);
    data.append("pfNumber", formData.pfNumber);
    data.append("uanNumber", formData.uanNumber);
    data.append("isMarried", String(formData.isMarried));
    if (formData.isMarried && formData.marriageAnniversary) data.append("marriageAnniversary", convertDMYToYMD(formData.marriageAnniversary));
    Object.keys(files).forEach(f => { if (files[f]) data.append(f, files[f]); });

    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const res = await fetch(`${API_BASE}/employee/profile`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: data,
      });
      const result = await res.json();
      if (res.ok) {
        toast.success("Identity updated successfully");
        setProfile(result.user);
        setFiles(Object.keys(files).reduce((acc, k) => ({ ...acc, [k]: null }), {}));
      } else { toast.error(result.message); }
    } catch (error) { toast.error("Update failed"); }
    finally { setUploading(false); }
  };

  const getProfileImageUrl = (user) => {
    if (!user) return null;
    const path = user?.documents?.passportPhoto?.path || user?.avatar || user?.profilePhoto;
    if (!path) return null;
    if (typeof path === "string") {
      if (path.startsWith("http://") || path.startsWith("https://")) return path;
      const backendUrl = API_BASE.replace(/\/api\/?$/, "");
      return `${backendUrl}${path.startsWith("/") ? "" : "/"}${path}`;
    }
    return null;
  };

  if (loading) return (
    <div className="flex justify-center items-center h-screen">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-12 h-12 border-4 border-primary/10 border-t-primary rounded-full" />
    </div>
  );

  return (
    <div className="animate-fadeIn max-w-7xl mx-auto space-y-6 pb-20 px-4 md:px-0">
      {/* Banner / Cover & Profile Header Card */}
      <div className="relative rounded-3xl overflow-hidden bg-white border border-gray-150 shadow-md mb-8 transition-all duration-300 hover:shadow-lg">
        {/* Decorative Cover Background */}
        <div className="h-44 md:h-52 bg-gradient-to-r from-[#0c4052] via-[#12637E] to-[#1d82a1] relative overflow-hidden">
          {/* Technical Grid Pattern Overlay */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.08]" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
            <defs>
              <pattern id="emp-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="white" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#emp-grid)" />
          </svg>

          {/* Subtle Glowing Abstract Shapes */}
          <div className="absolute -top-20 -left-20 w-72 h-72 bg-cyan-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: "6s" }}></div>
          <div className="absolute top-10 right-20 w-60 h-60 bg-teal-300/10 rounded-full blur-2xl"></div>
          <div className="absolute -bottom-10 right-1/4 w-80 h-40 bg-blue-500/10 rounded-full blur-3xl"></div>

          {/* Premium diagonal decorative element */}
          <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-gradient-to-l from-white/5 to-transparent transform -skew-x-12"></div>
        </div>

        {/* Profile Card Header Info */}
        <div className="px-6 pb-6 md:px-10 md:pb-8 -mt-16 md:-mt-20 relative z-10 flex flex-col md:flex-row items-center md:items-end gap-6 text-center md:text-left">
          {/* Avatar Container */}
          <div className="relative group">
            <div className="w-32 h-32 md:w-36 md:h-36 rounded-2xl overflow-hidden border-4 border-white shadow-xl bg-white flex items-center justify-center transition-transform duration-300 group-hover:scale-[1.02]">
              {getProfileImageUrl(profile) ? (
                <img
                  src={getProfileImageUrl(profile)}
                  alt={profile?.name || "Profile"}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center text-gray-400">
                  <User size={56} className="stroke-[1.5]" />
                </div>
              )}
            </div>
            {profile?.profileVerified && (
              <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-2 rounded-xl shadow-lg border-2 border-white" title="Verified Personnel">
                <ShieldCheck size={18} />
              </div>
            )}
          </div>

          {/* Profile Name & Quick Info */}
          <div className="flex-1 min-w-0 md:mb-2">
            <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2.5 justify-center md:justify-start">
              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight truncate">
                {profile?.name}
              </h1>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tracking-wide border ${
                profile?.profileVerified
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-amber-50 text-amber-700 border-amber-200"
              }`}>
                {profile?.profileVerified ? "Verified Personnel" : "Awaiting Audit"}
              </span>
            </div>

            {/* Position and Department Badges */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-4">
              <span className="bg-gray-100 text-gray-600 text-xs font-bold px-3 py-1 rounded-lg border border-gray-200">
                {profile?.position || "Employee"}
              </span>
              <span className="bg-gray-100 text-gray-600 text-xs font-bold px-3 py-1 rounded-lg border border-gray-200">
                Department: Employee
              </span>
            </div>

            {/* Quick Contact Grid */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-y-2 gap-x-6 text-sm text-gray-600">
              <span className="flex items-center gap-1.5 hover:text-primary transition-colors cursor-pointer">
                <Mail size={16} className="text-gray-400" />
                <span>{profile?.email}</span>
              </span>
              {profile?.phone && (
                <span className="flex items-center gap-1.5 hover:text-primary transition-colors cursor-pointer">
                  <Phone size={16} className="text-gray-400" />
                  <span>{profile?.phone}</span>
                </span>
              )}
              {profile?.address && (
                <span className="flex items-center gap-1.5 max-w-xs truncate" title={profile?.address}>
                  <MapPin size={16} className="text-gray-400 shrink-0" />
                  <span className="truncate">{profile?.address}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modern Tabs */}
      <div className="flex border-b border-gray-200 gap-6 mb-8 overflow-x-auto pb-px">
        {[
          { id: "overview", label: "Overview", icon: <User size={18} /> },
          { id: "documents", label: "Documents Repository", icon: <FileText size={18} /> },
          { id: "edit", label: "Update Profile", icon: <Camera size={18} /> }
        ].map((tab) => (
          <button
            key={tab.id}
            id={`tab-btn-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 py-3 px-1 border-b-2 font-semibold text-sm transition-all whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.25 }}
        >
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Personal details info card */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2.5">
                    <User size={20} className="text-primary" /> Personal Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Full Name</span>
                      <p className="text-sm font-semibold text-gray-800">{profile?.name || "N/A"}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Email Address</span>
                      <p className="text-sm font-semibold text-gray-800">{profile?.email || "N/A"}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Mobile Phone</span>
                      <p className="text-sm font-semibold text-gray-800">{profile?.phone || "N/A"}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Current Residence</span>
                      <p className="text-sm font-semibold text-gray-800">{profile?.address || "N/A"}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Marital Status</span>
                      <p className="text-sm font-semibold text-gray-800">{profile?.isMarried ? "Married" : "Single"}</p>
                    </div>
                    {profile?.isMarried && (
                      <div className="space-y-1">
                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Anniversary Date</span>
                        <p className="text-sm font-semibold text-gray-800">
                          {profile?.marriageAnniversary ? formatDateDMY(profile?.marriageAnniversary) : "N/A"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Financial Identity card */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2.5">
                    <Landmark size={20} className="text-primary" /> Financial Profile
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                      <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1">Bank IFSC Code</span>
                      <span className="text-sm font-bold text-gray-800 tracking-wide uppercase">{profile?.documents?.bankIFSC || "Not Provided"}</span>
                    </div>
                    <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                      <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1">Bank Account Number</span>
                      <span className="text-sm font-bold text-gray-800 tracking-widest">
                        {profile?.documents?.bankAccountNumber
                          ? `•••• •••• ${profile.documents.bankAccountNumber.slice(-4)}`
                          : "Not Provided"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Administrative reporting chain card */}
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2.5">
                    <Building size={20} className="text-primary" /> Organization Hierarchy
                  </h3>
                  <div className="space-y-5">
                    {[
                      { label: "Executive Head", person: profile?.reportingManager, role: "Primary Approver" },
                      { label: "Technical Lead", person: profile?.technicalReporting, role: "Functional Lead" },
                      { label: "Compliance Admin", person: profile?.administrativeReporting, role: "Compliance Controller" }
                    ].map((chain, i) => (
                      <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {chain.person?.name ? chain.person.name.charAt(0) : <User size={16} />}
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs text-gray-400 block font-medium uppercase tracking-wider">{chain.label}</span>
                          <span className="text-sm font-bold text-gray-800 block truncate">{chain.person?.name || "Unassigned"}</span>
                          <span className="text-[11px] text-gray-400 block truncate">{chain.person?.email || chain.role}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "documents" && (
            <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm">
              <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Credential &amp; Verification Registry</h3>
                  <p className="text-sm text-gray-500">Upload, review, and monitor validation statuses for your identity documents.</p>
                </div>
                {Object.values(files).some(file => file !== null) && (
                  <button
                    onClick={handleSubmit}
                    disabled={uploading}
                    id="commit-staged-docs"
                    className="btn btn-primary text-xs py-2 px-4 shadow-sm"
                  >
                    {uploading ? "Uploading..." : "Commit Staged Files"}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(documentLabels).map(([f, label]) => {
                  const doc = profile?.documents?.[f];
                  const stagedFile = files[f];
                  return (
                    <div
                      key={f}
                      className="p-5 bg-gray-50/50 rounded-xl border border-gray-200 hover:border-primary/20 hover:bg-white transition-all flex flex-col justify-between h-[160px] relative group"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="text-xs font-bold text-gray-800 uppercase tracking-wide truncate pr-8">{label}</div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                            doc?.verified
                              ? "bg-green-500/10 text-green-700 border-green-200"
                              : doc?.rejectionReason
                              ? "bg-red-500/10 text-red-700 border-red-200"
                              : doc?.path
                              ? "bg-amber-500/10 text-amber-700 border-amber-200"
                              : "bg-gray-100 text-gray-600 border-gray-300"
                          }`}>
                            {doc?.verified ? "Verified" : doc?.rejectionReason ? "Rejected" : doc?.path ? "Pending" : "Missing"}
                          </span>
                        </div>

                        {stagedFile ? (
                          <div className="mt-3 flex items-center gap-1.5 text-xs text-secondary font-semibold">
                            <CheckCircle2 size={14} className="text-green-500" />
                            <span className="truncate max-w-[180px]" title={stagedFile.name}>{stagedFile.name}</span>
                            <button
                              onClick={() => handleFileChange(f, null)}
                              className="text-red-500 hover:text-red-700 ml-auto cursor-pointer"
                              title="Clear staging"
                            >
                              <XCircle size={14} />
                            </button>
                          </div>
                        ) : (
                          <div className="text-[11px] text-gray-400 mt-2">
                            {doc?.path ? "Document uploaded & saved." : "No document registered."}
                            {doc?.rejectionReason && (
                              <div className="mt-1.5 p-2 bg-red-50 border border-red-100 rounded-lg text-[10px] font-semibold text-red-600 leading-tight">
                                Rejected: {doc.rejectionReason}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-end gap-3 mt-4 pt-3 border-t border-gray-100">
                        {doc?.path && (
                          <a
                            href={doc.path}
                            target="_blank"
                            rel="noreferrer"
                            id={`view-${f}`}
                            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-primary transition-all shadow-sm border border-gray-100 flex items-center justify-center"
                            title="View Document"
                          >
                            <Eye size={16} />
                          </a>
                        )}
                        <label
                          className="p-2 bg-white hover:bg-gray-100 rounded-lg text-primary cursor-pointer border border-gray-100 hover:border-primary/20 transition-all shadow-sm flex items-center justify-center"
                          title="Upload new file"
                        >
                          <Upload size={16} />
                          <input
                            id={`upload-input-${f}`}
                            type="file"
                            className="hidden"
                            onChange={(e) => handleFileChange(f, e.target.files[0])}
                          />
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === "edit" && (
            <div className="max-w-3xl mx-auto">
              <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm space-y-8">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Personnel Information Update</h3>
                  <p className="text-sm text-gray-500">Update your primary contact information, residence, marital details, and bank credentials.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-500" htmlFor="phone-input">Primary Contact Number</label>
                    <input
                      id="phone-input"
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="Enter mobile phone number"
                      className="input"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-500" htmlFor="address-input">Current Residence Address</label>
                    <input
                      id="address-input"
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Enter current residential address"
                      className="input"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-500" htmlFor="married-select">Marital Status</label>
                    <select
                      id="married-select"
                      value={String(formData.isMarried)}
                      onChange={(e) => setFormData(p => ({ ...p, isMarried: e.target.value === "true" }))}
                      className="input"
                    >
                      <option value="false">Single</option>
                      <option value="true">Married</option>
                    </select>
                  </div>

                  {formData.isMarried && (
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Anniversary Date</label>
                      <DatePicker
                        value={formData.marriageAnniversary}
                        onChange={(v) => setFormData(p => ({ ...p, marriageAnniversary: v }))}
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-500" htmlFor="empid-input">Employee ID (Auto-Generated)</label>
                    <input
                      id="empid-input"
                      type="text"
                      name="employeeId"
                      disabled
                      value={(formData.employeeId && formData.employeeId.startsWith("QT-")) ? formData.employeeId : (profile?._id ? `QT-${profile._id.toString().slice(-6).toUpperCase()}` : "QT-B66A0F")}
                      className="input bg-gray-100/80 text-primary font-bold cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-500" htmlFor="bankname-input">Bank Name</label>
                    <input
                      id="bankname-input"
                      type="text"
                      name="bankName"
                      value={formData.bankName}
                      onChange={handleInputChange}
                      placeholder="e.g. Canara Bank, HDFC Bank, SBI"
                      className="input"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-500" htmlFor="account-input">Bank Account Number</label>
                    <input
                      id="account-input"
                      type="text"
                      name="bankAccountNumber"
                      value={formData.bankAccountNumber}
                      onChange={handleInputChange}
                      placeholder="Enter account number"
                      className="input"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-500" htmlFor="ifsc-input">Bank IFSC Code</label>
                    <input
                      id="ifsc-input"
                      type="text"
                      name="bankIFSC"
                      value={formData.bankIFSC}
                      onChange={handleInputChange}
                      placeholder="Enter IFSC code (e.g. SBIN0001234)"
                      className="input"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-500" htmlFor="pan-input">PAN Card Number</label>
                    <input
                      id="pan-input"
                      type="text"
                      name="panNumber"
                      value={formData.panNumber}
                      onChange={handleInputChange}
                      placeholder="e.g. BHDPH9879R"
                      className="input uppercase"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-500" htmlFor="pf-input">PF Number</label>
                    <input
                      id="pf-input"
                      type="text"
                      name="pfNumber"
                      value={formData.pfNumber}
                      onChange={handleInputChange}
                      placeholder="e.g. MH/PUN/0012345/000/000000"
                      className="input"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-500" htmlFor="uan-input">PF UAN Number</label>
                    <input
                      id="uan-input"
                      type="text"
                      name="uanNumber"
                      value={formData.uanNumber}
                      onChange={handleInputChange}
                      placeholder="Enter 12-digit UAN"
                      className="input"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-100">
                  <button
                    type="submit"
                    disabled={uploading}
                    id="submit-profile-changes"
                    className="btn btn-primary min-w-[160px] text-sm font-semibold tracking-wide disabled:opacity-50 py-3 rounded-xl flex items-center justify-center gap-2"
                  >
                    {uploading ? "Updating..." : "Save Changes"}
                    {!uploading && <ArrowRight size={18} />}
                  </button>
                </div>
              </form>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Profile;