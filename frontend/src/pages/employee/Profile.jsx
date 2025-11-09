import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { User, Upload, CheckCircle, XCircle, Eye, Download } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

// Helper to format dates as DD/MM/YYYY without timezone issues
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

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    phone: "",
    address: "",
    bankIFSC: "",
    bankAccountNumber: "",
    isMarried: false,
    marriageAnniversary: "",
  });
  const [files, setFiles] = useState({
    passportPhoto: null,
    tenthMarksheet: null,
    twelthDiplomaMarksheet: null,
    graduationMarksheet: null,
    bankPassbookPhoto: null,
    aadharFront: null,
    aadharBack: null,
    panCard: null,
    cv: null,
  });

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
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/employee/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setProfile(data);
        setFormData({
          phone: data.phone || "",
          address: data.address || "",
          bankIFSC: data.documents?.bankIFSC || "",
          bankAccountNumber: data.documents?.bankAccountNumber || "",
          isMarried: !!data.isMarried,
          marriageAnniversary: data.marriageAnniversary ? data.marriageAnniversary.split("T")[0] : "",
        });
      } else {
        toast.error(data.message || "Failed to fetch profile");
      }
    } catch (error) {
      console.error("Fetch profile error:", error);
      toast.error("Failed to fetch profile");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (field, file) => {
    setFiles(prev => ({ ...prev, [field]: file }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    const data = new FormData();
    data.append("phone", formData.phone);
    data.append("address", formData.address);
    data.append("bankIFSC", formData.bankIFSC);
    data.append("bankAccountNumber", formData.bankAccountNumber);
    data.append("isMarried", String(formData.isMarried));
    if (formData.isMarried && formData.marriageAnniversary) {
      data.append("marriageAnniversary", formData.marriageAnniversary);
    }

    Object.keys(files).forEach(field => {
      if (files[field]) {
        data.append(field, files[field]);
      }
    });

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/employee/profile`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: data,
      });
      const result = await response.json();
      if (response.ok) {
        toast.success("Profile updated successfully");
        setProfile(result.user);
        setFiles({
          passportPhoto: null,
          tenthMarksheet: null,
          twelthDiplomaMarksheet: null,
          graduationMarksheet: null,
          bankPassbookPhoto: null,
          aadharFront: null,
          aadharBack: null,
          panCard: null,
          cv: null,
        });
      } else {
        toast.error(result.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Update profile error:", error);
      toast.error("Failed to update profile");
    } finally {
      setUploading(false);
    }
  };

  const getVerificationStatus = (doc) => {
    if (!doc || !doc.path) return "Not Uploaded";
    if (doc.verified) return "Verified";
    return "Pending Verification";
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Verified": return "text-green-600";
      case "Pending Verification": return "text-yellow-600";
      default: return "text-gray-600";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Verified": return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "Pending Verification": return <XCircle className="w-4 h-4 text-yellow-600" />;
      default: return <XCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <section className="p-6 bg-[var(--color-surface)] min-h-screen text-[var(--color-text-primary)]">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <User className="w-8 h-8 text-[var(--color-primary)]" />
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">My Profile</h1>
        </div>

        {/* Profile Status */}
        <div className="card-glow p-6 mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <img
                src={profile?.documents?.passportPhoto?.path || "/default-avatar.png"}
                alt="Profile"
                className="mr-6 w-35 h-35 rounded-full object-cover border-2 border-[var(--color-primary)]"
              />
              <div className="text-left">
                <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">{profile?.name}</h2>
                <p className="text-[var(--color-text-secondary)]">Emailid: {profile?.email}</p>
                <p className="text-sm text-[var(--color-text-secondary)]">Position: {profile?.position}</p>
                <p className="text-sm text-[var(--color-text-secondary)]">Date of Joining: {formatDateDMY(profile?.dateOfJoining)}</p>
                <p className="text-sm text-[var(--color-text-secondary)]">Phone: {profile?.phone}</p>
                <p className="text-sm text-[var(--color-text-secondary)]">Date of Birth: {formatDateDMY(profile?.dateOfBirth)}</p>
                {profile?.isMarried && profile?.marriageAnniversary && (
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    Marriage Anniversary: {formatDateDMY(profile?.marriageAnniversary)}
                  </p>
                )}
                <p className="text-sm text-[var(--color-text-secondary)]">Base Salary: {profile?.salary}</p>
              </div>
            </div>
            <div className="text-right">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
                profile?.profileVerified
                  ? "bg-green-900/30 text-green-400 border border-green-800"
                  : "bg-yellow-900/30 text-yellow-400 border border-yellow-800"
              }`}>
                {profile?.profileVerified ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Profile Verified
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4" />
                    Profile Unverified
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Reporting Information */}
        <div className="card-glow p-6 mb-8">
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-6">Reporting Structure</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border border-[var(--color-border)] rounded-lg p-4 bg-[var(--color-surface)]">
              <h3 className="text-sm font-medium text-[var(--color-text-primary)] mb-2">Reporting Manager</h3>
              <p className="text-[var(--color-text-secondary)]">
                {profile?.reportingManager?.name || "Not assigned"}
              </p>
              {profile?.reportingManager?.email && (
                <p className="text-xs text-[var(--color-text-secondary)]">{profile.reportingManager.email}</p>
              )}
            </div>
            <div className="border border-[var(--color-border)] rounded-lg p-4 bg-[var(--color-surface)]">
              <h3 className="text-sm font-medium text-[var(--color-text-primary)] mb-2">Technical Reporting</h3>
              <p className="text-[var(--color-text-secondary)]">
                {profile?.technicalReporting?.name || "Not assigned"}
              </p>
              {profile?.technicalReporting?.email && (
                <p className="text-xs text-[var(--color-text-secondary)]">{profile.technicalReporting.email}</p>
              )}
            </div>
            <div className="border border-[var(--color-border)] rounded-lg p-4 bg-[var(--color-surface)]">
              <h3 className="text-sm font-medium text-[var(--color-text-primary)] mb-2">Administrative Reporting</h3>
              <p className="text-[var(--color-text-secondary)]">
                {profile?.administrativeReporting?.name || "Not assigned"}
              </p>
              {profile?.administrativeReporting?.email && (
                <p className="text-xs text-[var(--color-text-secondary)]">{profile.administrativeReporting.email}</p>
              )}
            </div>
          </div>
        </div>

        {/* Update Profile Form */}
        <form onSubmit={handleSubmit} className="card-glow p-6 mb-8">
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-6">Update Profile Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">Phone</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-md bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                placeholder="Enter phone number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">Address</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                rows={1}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-md bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                placeholder="Enter address"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">Bank IFSC Code</label>
              <input
                type="text"
                name="bankIFSC"
                value={formData.bankIFSC}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-md bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                placeholder="Enter IFSC code"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">Bank Account Number</label>
              <input
                type="text"
                name="bankAccountNumber"
                value={formData.bankAccountNumber}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-md bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                placeholder="Enter account number"
              />
            </div>
          </div>

          {/* Marital Information */}
          <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-4">Marital Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">Married?</label>
              <select
                name="isMarried"
                value={formData.isMarried ? "true" : "false"}
                onChange={(e) => setFormData(prev => ({ ...prev, isMarried: e.target.value === "true" }))}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-md bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              >
                <option value="false">No</option>
                <option value="true">Yes</option>
              </select>
            </div>
            {formData.isMarried && (
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">Marriage Anniversary</label>
                <input
                  type="date"
                  name="marriageAnniversary"
                  value={formData.marriageAnniversary}
                  onChange={(e) => setFormData(prev => ({ ...prev, marriageAnniversary: e.target.value }))}
                  className="w-full px-3 py-2 border border-[var(--color-border)] rounded-md bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
                {formData.marriageAnniversary && (
                  <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                    Selected: {formatDateDMY(formData.marriageAnniversary)}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Document Uploads */}
          <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-4">Upload Documents</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {Object.entries(documentLabels).map(([field, label]) => (
              <div key={field} className="border border-[var(--color-border)] rounded-lg p-4 bg-[var(--color-surface)]">
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">{label}</label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileChange(field, e.target.files[0])}
                  className="w-full text-sm text-[var(--color-text-secondary)] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[var(--color-primary)]/20 file:text-[var(--color-primary)] hover:file:bg-[var(--color-primary)]/30"
                />
                {files[field] && (
                  <p className="text-xs text-[var(--color-text-secondary)] mt-1">Selected: {files[field].name}</p>
                )}
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={uploading}
            className="w-full bg-[var(--color-primary)] text-white py-2 px-4 rounded-md hover:bg-[var(--color-primary)]/80 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Updating...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Update Profile
              </>
            )}
          </button>
        </form>

        {/* Document Status */}
        <div className="card-glow p-6">
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-6">Document Verification Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(documentLabels).map(([field, label]) => {
              const doc = profile?.documents?.[field];
              const status = getVerificationStatus(doc);
              return (
                <div key={field} className="border border-[var(--color-border)] rounded-lg p-4 bg-[var(--color-surface)]">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-[var(--color-text-primary)]">{label}</h3>
                    {getStatusIcon(status)}
                  </div>
                  <p className={`text-sm font-medium ${getStatusColor(status)}`}>{status}</p>
                  {doc?.path && (
                    <div className="mt-2">
                      <a
                        href={doc.path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[var(--color-primary)] hover:text-[var(--color-primary)]/80 text-sm"
                      >
                        <Eye className="w-3 h-3" />
                        View Document
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Profile;