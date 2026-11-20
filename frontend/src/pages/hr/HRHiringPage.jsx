import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import axios from "axios";
import {
  Search,
  Plus,
  Mail,
  CheckCircle2,
  Clock,
  FileText,
  Activity,
  X,
  Upload,
  UserPlus,
  AlertCircle,
  Briefcase,
  CalendarDays
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

// --- MAIN COMPONENT ---
export default function HRHiringPage() {
  const role = localStorage.getItem("role") || "hr";
  const prefix = role === "hr" ? "/hr" : "/admin";

  const [candidates, setCandidates] = useState([]);
  const [vacancies, setVacancies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVacancyForHiring, setSelectedVacancyForHiring] = useState(null);

  // Filters for Candidates
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterSource, setFilterSource] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Filters for Vacancies
  const [vacSearchTerm, setVacSearchTerm] = useState("");
  const [vacFilterDept, setVacFilterDept] = useState("");
  const [vacFilterPriority, setVacFilterPriority] = useState("");

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState(null); // candidateId

  // Email Modal State
  const [emailModal, setEmailModal] = useState(null);
  // { type, candidateId, subject, body, extraFields: {} }
  const [isSending, setIsSending] = useState(false);
  const [isParsingResume, setIsParsingResume] = useState(false);

  const handleAutoParseResume = async (file) => {
    if (!file) return;
    setIsParsingResume(true);
    const toastId = toast.loading("🤖 AI Parsing Resume PDF...");
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("file", file);

      const res = await axios.post(`${API_BASE}${prefix}/hiring/parse-resume`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      const { name, email, phone, notes } = res.data;

      if (name && document.getElementById('add-name')) document.getElementById('add-name').value = name;
      if (email && document.getElementById('add-email')) document.getElementById('add-email').value = email;
      if (phone && document.getElementById('add-phone')) document.getElementById('add-phone').value = phone;
      if (notes && document.getElementById('add-notes')) document.getElementById('add-notes').value = notes;

      toast.success("✨ Resume Parsed! Candidate details auto-filled.", { id: toastId });
    } catch (err) {
      console.error("Resume parsing error:", err);
      toast.error("Could not parse resume automatically", { id: toastId });
    } finally {
      setIsParsingResume(false);
    }
  };

  // Confirmation Modal
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    title: "",
    message: "",
    confirmText: "Confirm",
    confirmColor: "bg-primary hover:bg-primary/90",
    iconType: "info",
    onConfirm: null,
  });

  const triggerConfirm = (title, message, confirmText, confirmColor, iconType, onConfirm) => {
    setConfirmModal({
      show: true,
      title,
      message,
      confirmText,
      confirmColor,
      iconType,
      onConfirm: () => {
        onConfirm();
        setConfirmModal((prev) => ({ ...prev, show: false }));
      }
    });
  };

  useEffect(() => {
    fetchCandidatesAndVacancies();
  }, []);

  const fetchCandidatesAndVacancies = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const [candRes, vacRes] = await Promise.all([
        axios.get(`${API_BASE}${prefix}/hiring/candidates`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE}/vacancies`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setCandidates(candRes.data);
      setVacancies(vacRes.data.filter(v => v.status === "Active"));
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch hiring data");
    } finally {
      setLoading(false);
    }
  };

  // --- DERIVED DATA ---
  const filteredCandidates = candidates.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole ? c.role === filterRole : true;
    const matchesSource = filterSource ? c.source === filterSource : true;
    const matchesStatus = filterStatus ? c.status === filterStatus : true;
    return matchesSearch && matchesRole && matchesSource && matchesStatus;
  });

  const filteredVacancies = vacancies.filter(v => {
    const matchesSearch = v.positionTitle.toLowerCase().includes(vacSearchTerm.toLowerCase()) || v.jobRole.toLowerCase().includes(vacSearchTerm.toLowerCase());
    const matchesDept = vacFilterDept ? v.department === vacFilterDept : true;
    const matchesPriority = vacFilterPriority ? v.priorityLevel === vacFilterPriority : true;
    return matchesSearch && matchesDept && matchesPriority;
  });

  const summary = {
    total: candidates.length,
    interviewScheduled: candidates.filter(c => c.interviewScheduledDate && c.interviewResult === "Pending").length,
    taskSent: candidates.filter(c => c.taskSentDate && c.taskReviewed === "Pending").length,
    taskReviewed: candidates.filter(c => c.taskReviewed === "Reviewed" && c.taskResult === "Pending").length,
    offerSent: candidates.filter(c => c.offerLetterStatus === "Sent").length,
    joined: candidates.filter(c => c.finalMailSent === "Yes" && c.status === "Offer Sent").length, // approximation
  };

  const updateCandidate = async (id, updates, logText) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(`${API_BASE}${prefix}/hiring/candidates/${id}`, {
        updates,
        logMsg: logText
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCandidates(prev => prev.map(c => c._id === id ? res.data : c));
      toast.success("Candidate updated");
    } catch (error) {
      console.error("Error updating candidate:", error);
      toast.error("Failed to update candidate");
    }
  };

  // --- ACTIONS ---

  const handleMarkReviewed = (c) => {
    triggerConfirm(
      "Mark Task Reviewed",
      `Are you sure you want to mark the task for ${c.name} as reviewed? This will move them to the next stage in the hiring pipeline.`,
      "Mark Reviewed",
      "bg-primary hover:bg-secondary text-white",
      "info",
      () => {
        updateCandidate(c._id, {
          taskReviewed: "Reviewed",
          status: "Task Reviewed"
        }, "Task marked as Reviewed");
      }
    );
  };

  const handleExtraFieldChange = (field, placeholder, val) => {
    const oldVal = emailModal.extraFields[field] || placeholder;
    const newVal = val || placeholder;
    const newBody = emailModal.body.replace(oldVal, newVal);
    setEmailModal({
      ...emailModal,
      body: newBody,
      extraFields: { ...emailModal.extraFields, [field]: val }
    });
  };

  const openEmailModal = (type, candidate, extraData = {}) => {
    let subject = "";
    let body = "";
    const fields = { ...extraData };

    switch (type) {
      case "SCHEDULE_INTERVIEW":
        subject = `Interview Invitation – ${candidate.role} at QiroTech`;
        body = `Dear ${candidate.name},\n\nWe are pleased to invite you for an interview for the position of ${candidate.role} at QiroTech.\n\nInterview Details:\nDate: [Date]\nTime: [Time]\nMode: Virtual Meet\nGoogle Meet Link: [Link]\n\nPlease confirm your availability by replying to this email.\n\nLooking forward to talk with you.\n\nBest Regards,\nHR Team\nQirotech Innovation Pvt. Ltd.`;
        fields.date = "";
        fields.time = "";
        fields.link = "";
        break;
      case "TASK_SENT":
        subject = `Congratulations! You've been shortlisted – ${candidate.role} at QiroTech`;
        body = `Dear ${candidate.name},\n\nCongratulations! We are pleased to inform you that you have been shortlisted after your interview for the role of ${candidate.role}.\n\nAs the next step, we'd like you to complete the following assignment:\n\nTask: [Task Description]\nDeadline: [Deadline Date]\n\nPlease submit your completed task to this email address by the deadline.\n\nWe look forward to reviewing your work.\n\nBest Regards,\nHR Team\nQirotech Innovation Pvt. Ltd.`;
        fields.taskDesc = "";
        fields.deadline = "";
        fields.taskPdf = null;
        break;
      case "INTERVIEW_REJECT":
        subject = `Update on Your Application – ${candidate.role} at QiroTech`;
        body = `Dear ${candidate.name},\n\nThank you for taking the time to interview with us for the position of ${candidate.role}.\n\nAfter careful consideration, we regret to inform you that we will not be moving forward with your application at this time, as we have filled the position.\n\nWe appreciate your interest in QiroTech and encourage you to apply for future openings.\n\nWe wish you all the best in your career journey.\n\nBest Regards,\nHR Team\nQirotech Innovation Pvt. Ltd.`;
        break;
      case "HR_ROUND_SCHEDULE":
        subject = `HR Round Invitation – ${candidate.role} at QiroTech`;
        body = `Dear ${candidate.name},\n\nWe are happy to inform you that your task submission has been reviewed and you have been shortlisted for the next round.\n\nYou are invited for an HR Round Interview:\n\nDate: [Date]\nTime: [Time]\nMode: Virtual Meet\nGoogle Meet Link: [Link]\n\nPlease confirm your availability by replying to this email.\n\nLooking forward to speaking with you.\n\nBest Regards,\nHR Team\nQirotech Innovation Pvt. Ltd.`;
        fields.date = "";
        fields.time = "";
        fields.link = "";
        break;
      case "TASK_REJECT":
        subject = `Update on Your Application – ${candidate.role} at QiroTech`;
        body = `Dear ${candidate.name},\n\nThank you for submitting your task for the ${candidate.role} position at QiroTech.\n\nAfter reviewing your submission, we regret to inform you that we will not be moving forward with your application at this stage.\n\nWe appreciate the effort you put in and wish you the very best in your future endeavours.\n\nBest Regards,\nHR Team\nQirotech Innovation Pvt. Ltd.`;
        break;
      case "OFFER_LETTER":
        subject = `Offer of Employment – ${candidate.role} at QiroTech`;
        body = `Dear ${candidate.name},\n\nWe are delighted to inform you that after a successful HR round, we would like to extend an offer of employment for the position of ${candidate.role} at QiroTech.\n\nPlease find attached your:\n1. Offer Letter\n2. Joining Letter\n\nYour joining date is confirmed as: [Joining Date] at [Joining Time]\n\nKindly review the attached documents and reply to confirm your acceptance.\n\nWe look forward to welcoming you to the team!\n\nBest Regards,\nHR Team\nQirotech Innovation Pvt. Ltd.`;
        fields.joiningDate = "";
        fields.joiningTime = "";
        fields.offerPdf = null;
        fields.joiningPdf = null;
        break;
      case "HR_REJECT":
        subject = `Update on Your Application – ${candidate.role} at QiroTech`;
        body = `Dear ${candidate.name},\n\nThank you for your time and effort throughout our hiring process for the ${candidate.role} position.\n\nAfter careful consideration, we regret to inform you that we will not be proceeding further with your application.\n\nWe truly appreciate your interest in QiroTech and wish you the very best in your career ahead.\n\nBest Regards,\nHR Team\nQirotech Innovation Pvt. Ltd.`;
        break;
      default:
        break;
    }

    setEmailModal({ type, candidateId: candidate._id || candidate.id, subject, body, extraFields: fields });
  };

  const handleSendEmailSubmit = async () => {
    const { type, candidateId, extraFields } = emailModal;
    const c = candidates.find(can => can._id === candidateId || can.id === candidateId);
    if (!c) return;

    let updates = {};
    let logMsg = "";

    if (type === "SCHEDULE_INTERVIEW") {
      updates = {
        interviewScheduledDate: extraFields.date,
        interviewScheduledTime: extraFields.time,
        status: "Interview Scheduled"
      };
      logMsg = `Interview Scheduled for ${extraFields.date} ${extraFields.time}. Mail sent to ${c.email}`;
    } else if (type === "TASK_SENT") {
      updates = {
        interviewResult: "Shortlisted",
        taskSentDate: new Date().toISOString(),
        status: "Task Sent"
      };
      logMsg = `Interview Result marked: Shortlisted. Task Sent. Mail sent to ${c.email}`;
    } else if (type === "INTERVIEW_REJECT") {
      updates = {
        interviewResult: "Not Shortlisted",
        status: "Closed - Not Shortlisted"
      };
      logMsg = `Interview Result marked: Not Shortlisted. Rejection mail sent.`;
    } else if (type === "HR_ROUND_SCHEDULE") {
      updates = {
        taskResult: "Shortlisted",
        hrRoundScheduledDate: extraFields.date,
        hrRoundScheduledTime: extraFields.time,
        status: "HR Round Scheduled"
      };
      logMsg = `Task Result: Shortlisted. HR Round Scheduled for ${extraFields.date} ${extraFields.time}. Mail sent.`;
    } else if (type === "TASK_REJECT") {
      updates = {
        taskResult: "Not Shortlisted",
        status: "Closed - Not Shortlisted"
      };
      logMsg = `Task Result: Not Shortlisted. Rejection mail sent.`;
    } else if (type === "OFFER_LETTER") {
      updates = {
        hrRoundResult: "Selected",
        offerLetterStatus: "Sent",
        joiningLetterStatus: "Sent",
        finalMailSent: "Yes",
        status: "Offer Sent"
      };
      logMsg = `HR Round Result: Selected. Offer Letter and Joining Letter uploaded. Final mail sent.`;
    } else if (type === "HR_REJECT") {
      updates = {
        hrRoundResult: "Rejected",
        status: "Closed - Rejected"
      };
      logMsg = `HR Round Result: Rejected. Rejection mail sent.`;
    }

    try {
      setIsSending(true);
      const token = localStorage.getItem("token");
      let textBody = emailModal.body
        .replace(/\[Date\]/g, extraFields.date || "[Date]")
        .replace(/\[Time\]/g, extraFields.time || "[Time]")
        .replace(/\[Task Description\]/g, extraFields.taskDesc || "[Task Description]")
        .replace(/\[Deadline Date\]/g, extraFields.deadline || "[Deadline Date]")
        .replace(/\[Joining Date\]/g, extraFields.joiningDate || "[Joining Date]")
        .replace(/\[Joining Time\]/g, extraFields.joiningTime || "[Joining Time]");

      const htmlContent = textBody.replace(/\n/g, "<br/>");

      const finalBody = `
<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
  <div style="background: linear-gradient(135deg, #12637E 0%, #1A9DC2 100%); padding: 24px; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold; letter-spacing: 0.5px;">Qirotech Innovation Pvt. Ltd.</h1>
  </div>
  <div style="padding: 32px; background-color: #ffffff; color: #374151; font-size: 15px; line-height: 1.6;">
    ${htmlContent}
  </div>
  <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #334155;">
    <p style="margin: 0; color: #6b7280; font-size: 12px; line-height: 1.5;">
      <strong>Qirotech Innovation Pvt. Ltd.</strong><br/>
      This is an official communication regarding your application.<br/>
      &copy; ${new Date().getFullYear()} All rights reserved.
    </p>
  </div>
</div>
`;

      const formData = new FormData();
      formData.append("subject", emailModal.subject);
      formData.append("body", finalBody);
      formData.append("updates", JSON.stringify(updates));
      formData.append("logMsg", logMsg);

      if (emailModal.extraFields.taskPdf) formData.append("files", emailModal.extraFields.taskPdf);
      if (emailModal.extraFields.offerPdf) formData.append("files", emailModal.extraFields.offerPdf);
      if (emailModal.extraFields.joiningPdf) formData.append("files", emailModal.extraFields.joiningPdf);

      const res = await axios.post(`${API_BASE}${prefix}/hiring/candidates/${candidateId}/email`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setCandidates(prev => prev.map(can => can._id === candidateId ? res.data.candidate : can));
      toast.success("Email sent successfully!");
      setEmailModal(null);
    } catch (error) {
      console.error("Error sending email:", error);
      toast.error("Failed to send email");
    } finally {
      setIsSending(false);
    }
  };

  // --- RENDER HELPERS ---
  const getStatusColor = (status) => {
    if (status.includes("Closed")) return "bg-gray-50 text-gray-500 border-gray-200";
    if (status === "Offer Sent" || status === "Joined") return "bg-green-50 text-green-600 border-green-200";
    if (status === "Added") return "bg-cyan-50 text-[#1A9DC2] border-cyan-200";
    return "bg-amber-50 text-amber-600 border-amber-200";
  };

  return (
    <div className="max-w-[1600px] mx-auto pb-10 space-y-6">

      {/* Header & Summary */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8 animate-slideUp">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-cyan-50 rounded-2xl flex items-center justify-center text-[#1A9DC2] shrink-0">
            <UserPlus size={28} />
          </div>
          <div>
            <h2 className="text-5xl font-black text-primary tracking-tighter mb-2">Hiring Pipeline</h2>
            <p className="text-lg font-semibold text-secondary/70">Manage candidates and track recruitment stages</p>
          </div>
        </div>
        <button
          onClick={() => {
            setSelectedVacancyForHiring(null);
            setShowAddModal(true);
          }}
          className="btn bg-primary text-white hover:bg-secondary flex items-center gap-2 h-12 px-6 rounded-xl font-bold shadow-md hover:shadow-lg transition-all"
        >
          <Plus size={20} /> Add Candidate
        </button>
      </div>

      {/* Active Vacancies Section */}
      <div className="mb-8 animate-slideUp">
        <h3 className="text-2xl font-black text-primary tracking-tight mb-4 flex items-center gap-2">
          <Briefcase size={24} /> Active Hiring Requirements
        </h3>

        {/* Vacancy Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <input
            type="text"
            placeholder="Search role..."
            className="input !mb-0 h-12 bg-white/80 border-gray-100 w-full"
            value={vacSearchTerm}
            onChange={(e) => setVacSearchTerm(e.target.value)}
          />
          <select className="input !mb-0 h-12 bg-white/80 border-gray-100 w-full md:w-48" value={vacFilterDept} onChange={e => setVacFilterDept(e.target.value)}>
            <option value="">All Departments</option>
            {[...new Set(vacancies.map(v => v.department))].map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <select className="input !mb-0 h-12 bg-white/80 border-gray-100 w-full md:w-48" value={vacFilterPriority} onChange={e => setVacFilterPriority(e.target.value)}>
            <option value="">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Urgent">Urgent</option>
          </select>
        </div>
        
        {loading ? (
          <div className="text-gray-500 font-bold p-6 bg-white rounded-2xl">Loading requirements...</div>
        ) : vacancies.length === 0 ? (
          <div className="card-premium p-8 text-center border border-amber-100 bg-amber-50">
            <AlertCircle size={40} className="mx-auto text-amber-500 mb-3" />
            <div className="text-lg font-black text-amber-700">Currently no hiring requirements available.</div>
            <p className="text-amber-600/80 text-sm font-medium mt-1">Check back later or contact administration.</p>
          </div>
        ) : filteredVacancies.length === 0 ? (
          <div className="card-premium p-8 text-center border border-gray-100 bg-white">
            <div className="text-gray-500 font-bold">No active vacancies match your filters.</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVacancies.map(v => (
              <div key={v._id} className="card-premium p-6 flex flex-col justify-between bg-white border border-primary/10 shadow-sm hover:shadow-md transition">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-lg font-black text-primary leading-tight">{v.positionTitle}</h4>
                    <span className="px-2 py-1 text-[10px] font-black uppercase tracking-widest bg-cyan-50 text-[#1A9DC2] rounded-full">
                      {v.priorityLevel}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-secondary mb-4">{v.department} • {v.jobRole}</div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-xs border-b border-gray-50 pb-2">
                      <span className="text-gray-500 font-medium">Openings</span>
                      <span className="font-bold text-primary">{v.numberOfEmployeesRequired - v.hiredEmployeesCount} Remaining (Total: {v.numberOfEmployeesRequired})</span>
                    </div>
                    <div className="flex justify-between text-xs border-b border-gray-50 pb-2">
                      <span className="text-gray-500 font-medium">Experience</span>
                      <span className="font-bold text-primary">{v.experienceRequired}</span>
                    </div>
                    <div className="text-xs mt-2">
                      <span className="text-gray-500 font-medium block mb-1">Required Skills:</span>
                      <div className="flex flex-wrap gap-1">
                        {v.requiredSkills.split(',').map((s, i) => (
                          <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-[10px] font-medium">{s.trim()}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    setSelectedVacancyForHiring(v);
                    setShowAddModal(true);
                  }}
                  className="w-full py-2.5 bg-primary/10 hover:bg-primary/20 text-primary text-sm font-bold rounded-xl transition flex items-center justify-center gap-2 mt-2"
                >
                  <UserPlus size={16} /> Hire for this Role
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-6 animate-slideUp" style={{ animationDelay: '0.1s' }}>
        {[
          { label: "Total", val: summary.total, color: "bg-cyan-50 text-[#12637E]" },
          { label: "Interviewed", val: summary.interviewScheduled, color: "bg-amber-50 text-amber-600" },
          { label: "Task Sent", val: summary.taskSent, color: "bg-blue-50 text-[#1A9DC2]" },
          { label: "Task Reviewed", val: summary.taskReviewed, color: "bg-emerald-50 text-emerald-600" },
          { label: "Offer Sent", val: summary.offerSent, color: "bg-indigo-50 text-[#12637E]" },
          { label: "Joined", val: summary.joined, color: "bg-green-50 text-green-600" },
        ].map((s, i) => (
          <div key={i} className="card-premium p-6 text-center border-none shadow-md hover:shadow-xl">
            <div className={`text-3xl font-black mb-2 ${s.color.split(' ')[1]}`}>{s.val}</div>
            <div className="text-[10px] font-black text-secondary/60 uppercase tracking-[0.2em]">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card-premium p-8 flex flex-col gap-6 animate-slideUp" style={{ animationDelay: '0.2s' }}>
        <div className="w-full relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={20} />
          <input
            type="text"
            placeholder="Search candidates by name or email address..."
            className="input !mb-0 pl-12 h-14 bg-gray-50/50 border-gray-100 hover:border-gray-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <select className="input !mb-0 h-12 bg-gray-50/50 border-gray-100" value={filterRole} onChange={e => setFilterRole(e.target.value)}>
            <option value="">All Applied Roles</option>
            <option value="Frontend Developer">Frontend Developer</option>
            <option value="Backend Engineer">Backend Engineer</option>
          </select>
          <select className="input !mb-0 h-12 bg-gray-50/50 border-gray-100" value={filterSource} onChange={e => setFilterSource(e.target.value)}>
            <option value="">All Traffic Sources</option>
            <option value="Naukri">Naukri</option>
            <option value="LinkedIn">LinkedIn</option>
            <option value="Apna">Apna</option>
            <option value="Other">Other</option>
          </select>
          <select className="input !mb-0 h-12 bg-gray-50/50 border-gray-100" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Pipeline Statuses</option>
            <option value="Added">Added</option>
            <option value="Interview Scheduled">Interview Scheduled</option>
            <option value="Task Sent">Task Sent</option>
            <option value="HR Round Scheduled">HR Round Scheduled</option>
            <option value="Offer Sent">Offer Sent</option>
            <option value="Closed - Not Shortlisted">Closed - Not Shortlisted</option>
            <option value="Closed - Rejected">Closed - Rejected</option>
          </select>
        </div>
      </div>

      {/* Table Section */}
      <div className="card-premium overflow-hidden animate-slideUp" style={{ animationDelay: '0.3s' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50/80 border-b border-gray-100">
              <tr>
                <th className="pl-4 py-4 font-bold whitespace-nowrap min-w-[200px]">Candidate Details</th>
                <th className="px-4 py-4 font-bold whitespace-nowrap">Source & Role</th>
                <th className="px-4 py-4 font-bold whitespace-nowrap">Status</th>
                <th className="px-4 py-4 font-bold whitespace-nowrap">Interview</th>
                <th className="px-4 py-4 font-bold whitespace-nowrap">Task Stage</th>
                <th className="px-4 py-4 font-bold whitespace-nowrap">HR Round</th>
                <th className="px-4 py-4 font-bold whitespace-nowrap">Offer & Onboard</th>
                <th className="px-4 py-4 font-bold text-center">Log</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-gray-500">Loading candidates...</td>
                </tr>
              ) : filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-gray-500">No candidates found</td>
                </tr>
              ) : (
                filteredCandidates.map(c => {
                  const isClosed = c.status.includes("Closed");
                  return (
                    <tr key={c._id || c.id} className={`transition-colors ${isClosed ? 'opacity-60 bg-gray-50' : ''}`}>
                      {/* Cand Details */}
                      <td className="pl-4 py-3">
                        <div className="font-bold text-primary">{c.name}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{c.email}</div>
                        <div className="text-xs text-gray-500">{c.phone}</div>
                        <div className="text-[10px] text-gray-500 mt-1">Added: {format(new Date(c.dateAdded), "dd MMM, yy")}</div>
                      </td>

                      {/* Source & Role */}
                      <td className="px-4 py-3">
                        <div className="font-semibold text-primary">{c.role}</div>
                        <span className="inline-flex mt-1 items-center px-2 py-0.5 rounded text-[10px] font-medium bg-gray-50 text-gray-900">
                          {c.source}
                        </span>
                        <div className="mt-2">
                          <a href={c.resumeUrl} className="text-[#1A9DC2] hover:underline text-xs flex items-center gap-1">
                            <FileText size={12} /> Resume
                          </a>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(c.status)}`}>
                          {c.status}
                        </span>
                      </td>

                      {/* Interview */}
                      <td className="px-4 py-3 min-w-[160px]">
                        {!c.interviewScheduledDate ? (
                          <button
                            onClick={() => openEmailModal("SCHEDULE_INTERVIEW", c)}
                            disabled={isClosed}
                            className="text-xs font-semibold bg-cyan-50 text-[#1A9DC2] px-3 py-1.5 rounded-lg hover:bg-cyan-100 flex items-center gap-1 disabled:opacity-50"
                          >
                            <CalendarDays size={14} /> Schedule
                          </button>
                        ) : (
                          <div className="space-y-2">
                            <div className="text-xs font-medium text-gray-900 flex items-center gap-1">
                              <CheckCircle2 size={12} className="text-green-600" />
                              {format(new Date(c.interviewScheduledDate), "dd MMM")} {c.interviewScheduledTime}
                            </div>
                            {c.interviewResult === "Pending" && !isClosed ? (
                              <select
                                className="text-xs p-1 border rounded w-full bg-white"
                                onChange={(e) => {
                                  if (e.target.value === "Shortlisted") openEmailModal("TASK_SENT", c);
                                  if (e.target.value === "Not Shortlisted") openEmailModal("INTERVIEW_REJECT", c);
                                }}
                                value=""
                              >
                                <option value="" disabled>Result...</option>
                                <option value="Shortlisted">Shortlist (Send Task)</option>
                                <option value="Not Shortlisted">Reject</option>
                              </select>
                            ) : (
                              <div className={`text-xs font-bold ${c.interviewResult === 'Shortlisted' ? 'text-green-600' : 'text-red-500'}`}>
                                {c.interviewResult}
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Task */}
                      <td className="px-4 py-3 min-w-[160px]">
                        {!c.taskSentDate ? (
                          <span className="text-xs text-gray-500">Not Sent</span>
                        ) : (
                          <div className="space-y-2">
                            <div className="text-xs font-medium text-gray-900 flex items-center gap-1">
                              <CheckCircle2 size={12} className="text-green-600" /> Sent {format(new Date(c.taskSentDate), "dd MMM")}
                            </div>

                            {c.taskReviewed === "Pending" && !isClosed ? (
                              <button
                                onClick={() => handleMarkReviewed(c)}
                                className="text-[10px] font-semibold bg-primary/10 text-[#1A9DC2] px-2 py-1 rounded hover:bg-primary/15"
                              >
                                Mark Reviewed
                              </button>
                            ) : (
                              <div className="text-xs text-gray-500">Reviewed</div>
                            )}

                            {c.taskReviewed === "Reviewed" && c.taskResult === "Pending" && !isClosed ? (
                              <select
                                className="text-xs p-1 border rounded w-full bg-white mt-1"
                                onChange={(e) => {
                                  if (e.target.value === "Shortlisted") openEmailModal("HR_ROUND_SCHEDULE", c);
                                  if (e.target.value === "Not Shortlisted") openEmailModal("TASK_REJECT", c);
                                }}
                                value=""
                              >
                                <option value="" disabled>Result...</option>
                                <option value="Shortlisted">Shortlist (HR Round)</option>
                                <option value="Not Shortlisted">Reject</option>
                              </select>
                            ) : c.taskResult !== "Pending" && (
                              <div className={`text-xs font-bold ${c.taskResult === 'Shortlisted' ? 'text-green-600' : 'text-red-500'}`}>
                                {c.taskResult}
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* HR Round */}
                      <td className="px-4 py-3 min-w-[160px]">
                        {!c.hrRoundScheduledDate ? (
                          <span className="text-xs text-gray-500">Not Scheduled</span>
                        ) : (
                          <div className="space-y-2">
                            <div className="text-xs font-medium text-gray-900 flex items-center gap-1">
                              <CheckCircle2 size={12} className="text-green-600" />
                              {format(new Date(c.hrRoundScheduledDate), "dd MMM")} {c.hrRoundScheduledTime}
                            </div>

                            {c.hrRoundResult === "Pending" && !isClosed ? (
                              <select
                                className="text-xs p-1 border rounded w-full bg-white"
                                onChange={(e) => {
                                  if (e.target.value === "Selected") openEmailModal("OFFER_LETTER", c);
                                  if (e.target.value === "Rejected") openEmailModal("HR_REJECT", c);
                                }}
                                value=""
                              >
                                <option value="" disabled>Result...</option>
                                <option value="Selected">Select (Offer)</option>
                                <option value="Rejected">Reject</option>
                              </select>
                            ) : (
                              <div className={`text-xs font-bold ${c.hrRoundResult === 'Selected' ? 'text-green-600' : 'text-red-500'}`}>
                                {c.hrRoundResult}
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Offer & Onboard */}
                      <td className="px-4 py-3 min-w-[150px]">
                        {c.offerLetterStatus === "Sent" ? (
                          <div className="text-xs text-green-600 font-bold flex items-center gap-1">
                            <CheckCircle2 size={14} /> Docs Sent
                          </div>
                        ) : (
                          <span className="text-xs text-gray-500">Pending</span>
                        )}
                      </td>

                      {/* Log */}
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setShowLogModal(c._id || c.id)}
                          className="p-1.5 text-secondary hover:bg-gray-50 rounded-lg transition"
                          title="View Activity Log"
                        >
                          <Activity size={18} />
                        </button>
                      </td>
                    </tr>
                  )
                }))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- ADD CANDIDATE MODAL --- */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden border border-gray-200"
            >
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
                <h3 className="text-xl font-black text-primary">Add Candidate</h3>
                <button onClick={() => { setShowAddModal(false); setSelectedVacancyForHiring(null); }} className="text-gray-500 hover:text-red-500 transition">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-indigo-500/10 p-4 rounded-2xl border border-blue-500/20 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center font-bold text-lg shrink-0 shadow-md shadow-blue-500/20">
                      ⚡
                    </div>
                    <div>
                      <div className="text-xs font-black text-primary uppercase tracking-wider">AI Resume Auto-Parser</div>
                      <div className="text-xs text-gray-500 font-medium">Upload candidate PDF below to auto-fill Name, Email, Phone & Skills!</div>
                    </div>
                  </div>
                  {isParsingResume && (
                    <span className="text-xs font-bold text-blue-600 animate-pulse flex items-center gap-1">
                      Parsing...
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Full Name</label>
                    <input type="text" className="input" placeholder="John Doe" id="add-name" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Phone Number</label>
                    <input type="text" className="input" placeholder="1234567890" id="add-phone" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Email ID</label>
                  <input type="email" className="input" placeholder="john@example.com" id="add-email" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Source</label>
                    <select className="input" id="add-source">
                      <option value="Naukri">Naukri</option>
                      <option value="LinkedIn">LinkedIn</option>
                      <option value="Apna">Apna</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Applied Role (Vacancy)</label>
                    {selectedVacancyForHiring ? (
                      <input type="text" className="input bg-gray-100" readOnly value={selectedVacancyForHiring.positionTitle} id="add-role" />
                    ) : (
                      <select
                        className="input"
                        id="add-role-select"
                        onChange={(e) => {
                          const vacId = e.target.value;
                          const vac = vacancies.find(v => v._id === vacId);
                          setSelectedVacancyForHiring(vac || null);
                        }}
                      >
                        <option value="">Select a vacancy...</option>
                        {vacancies.map(v => (
                          <option key={v._id} value={v._id}>
                            {v.positionTitle} ({v.department})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Resume Upload (PDF Auto-Parses)</label>
                  <label className="border-2 border-dashed border-blue-200 rounded-xl p-4 text-center hover:bg-blue-50/50 transition cursor-pointer block">
                    <Upload size={20} className="mx-auto text-blue-500 mb-2" />
                    <span className="text-xs text-gray-600 font-medium" id="resume-upload-text">
                      {isParsingResume ? "Parsing PDF contents..." : "Click to upload Resume PDF"}
                    </span>
                    <input
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      id="add-resume"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          document.getElementById('resume-upload-text').innerText = file.name;
                          handleAutoParseResume(file);
                        }
                      }}
                    />
                  </label>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Notes (Optional)</label>
                  <textarea className="input min-h-[80px]" placeholder="Any additional notes..." id="add-notes"></textarea>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50/50 flex justify-end gap-3">
                <button onClick={() => { setShowAddModal(false); setSelectedVacancyForHiring(null); }} className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-900">Cancel</button>
                <button
                  className="btn bg-primary text-white hover:bg-secondary"
                  disabled={loading}
                  onClick={async () => {
                    try {
                      setLoading(true);
                      const token = localStorage.getItem("token");
                      const formData = new FormData();
 
                      const name = document.getElementById('add-name').value;
                      const phone = document.getElementById('add-phone').value;
                      const email = document.getElementById('add-email').value;
                      const source = document.getElementById('add-source').value;
                      const role = selectedVacancyForHiring ? selectedVacancyForHiring.positionTitle : "";
                      const notes = document.getElementById('add-notes')?.value || "";
 
                      if (!name || !phone || !email || !role) {
                        toast.error("Please fill in all required fields.");
                        setLoading(false);
                        return;
                      }
 
                      formData.append("name", name);
                      formData.append("phone", phone);
                      formData.append("email", email);
                      formData.append("source", source);
                      formData.append("role", role);
                      formData.append("notes", notes);
                      if (selectedVacancyForHiring) {
                        formData.append("vacancy", selectedVacancyForHiring._id);
                      }
 
                      const fileInput = document.getElementById('add-resume');
                      if (fileInput.files[0]) {
                        formData.append("file", fileInput.files[0]);
                      }
 
                      const res = await axios.post(`${API_BASE}${prefix}/hiring/candidates`, formData, {
                        headers: {
                          Authorization: `Bearer ${token}`,
                          'Content-Type': 'multipart/form-data'
                        }
                      });
 
                      setCandidates([res.data, ...candidates]);
                      setShowAddModal(false);
                      setSelectedVacancyForHiring(null);
                      toast.success("Candidate added successfully");
                    } catch (error) {
                      console.error("Error adding candidate:", error);
                      toast.error("Failed to add candidate");
                    } finally {
                      setLoading(false);
                    }
                  }}
                >
                  {loading ? "Submitting..." : "Submit"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- EMAIL MODAL --- */}
      <AnimatePresence>
        {emailModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-200 flex flex-col max-h-[90vh]"
            >
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
                <div className="flex items-center gap-2 text-primary font-black text-lg">
                  <Mail size={20} /> Compose Email
                </div>
                <button onClick={() => setEmailModal(null)} className="text-gray-500 hover:text-red-500 transition">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-4 flex-1">
                {/* Extra Fields based on type */}
                {(emailModal.type === "SCHEDULE_INTERVIEW" || emailModal.type === "HR_ROUND_SCHEDULE") && (
                  <div className="grid grid-cols-2 gap-4 p-4 bg-cyan-50/50 rounded-xl border border-cyan-200 mb-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">Date</label>
                      <input
                        type="date"
                        className="input"
                        value={emailModal.extraFields.date}
                        onChange={(e) => handleExtraFieldChange('date', '[Date]', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">Time</label>
                      <input
                        type="time"
                        className="input"
                        value={emailModal.extraFields.time}
                        onChange={(e) => handleExtraFieldChange('time', '[Time]', e.target.value)}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-gray-500 mb-1">Google Meet Link</label>
                      <input
                        type="url"
                        className="input"
                        placeholder="https://meet.google.com/..."
                        value={emailModal.extraFields.link || ""}
                        onChange={(e) => handleExtraFieldChange('link', '[Link]', e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {emailModal.type === "TASK_SENT" && (
                  <div className="p-4 bg-primary/10/50 rounded-xl border border-primary/20 mb-4 space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">Task Description</label>
                      <textarea
                        className="input min-h-[60px]"
                        placeholder="Briefly describe the task..."
                        value={emailModal.extraFields.taskDesc}
                        onChange={(e) => handleExtraFieldChange('taskDesc', '[Task Description]', e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Deadline Date</label>
                        <input
                          type="date"
                          className="input"
                          value={emailModal.extraFields.deadline}
                          onChange={(e) => handleExtraFieldChange('deadline', '[Deadline Date]', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Attach File</label>
                        <input 
                          type="file" 
                          className="input text-sm p-1.5" 
                          onChange={(e) => setEmailModal(prev => ({ ...prev, extraFields: { ...prev.extraFields, taskPdf: e.target.files[0] } }))}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {emailModal.type === "OFFER_LETTER" && (
                  <div className="p-4 bg-primary/10/50 rounded-xl border border-primary/20 mb-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Offer Letter PDF</label>
                        <input 
                          type="file" 
                          className="input text-sm p-1.5" 
                          onChange={(e) => setEmailModal(prev => ({ ...prev, extraFields: { ...prev.extraFields, offerPdf: e.target.files[0] } }))}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Joining Letter PDF</label>
                        <input 
                          type="file" 
                          className="input text-sm p-1.5" 
                          onChange={(e) => setEmailModal(prev => ({ ...prev, extraFields: { ...prev.extraFields, joiningPdf: e.target.files[0] } }))}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Joining Date</label>
                        <input
                          type="date"
                          className="input"
                          value={emailModal.extraFields.joiningDate}
                          onChange={(e) => handleExtraFieldChange('joiningDate', '[Joining Date]', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Joining Time</label>
                        <input
                          type="time"
                          className="input"
                          value={emailModal.extraFields.joiningTime}
                          onChange={(e) => handleExtraFieldChange('joiningTime', '[Joining Time]', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Subject</label>
                  <input
                    type="text"
                    className="input font-semibold"
                    value={emailModal.subject}
                    onChange={e => setEmailModal({ ...emailModal, subject: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Email Body</label>
                  <textarea
                    className="input min-h-[250px] font-mono text-sm leading-relaxed whitespace-pre-wrap"
                    value={emailModal.body}
                    onChange={e => setEmailModal({ ...emailModal, body: e.target.value })}
                  />
                </div>
                <div className="bg-amber-50 p-3 rounded-lg flex gap-2 items-start text-xs text-yellow-800">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <p>Review the email content carefully. Placeholders like [Date] should be replaced before sending or will be auto-filled if provided.</p>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50/50 flex justify-end gap-3 shrink-0">
                <button onClick={() => setEmailModal(null)} className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-900">Cancel</button>
                <button
                  className="btn bg-primary text-white hover:bg-secondary flex items-center gap-2"
                  onClick={handleSendEmailSubmit}
                  disabled={isSending}
                >
                  {isSending ? <Clock size={16} className="animate-spin" /> : <Mail size={16} />}
                  {isSending ? "Sending..." : "Send Email & Update"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- ACTIVITY LOG MODAL --- */}
      <AnimatePresence>
        {showLogModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden border border-gray-200 max-h-[80vh] flex flex-col"
            >
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
                <h3 className="text-xl font-black text-primary flex items-center gap-2">
                  <Activity size={20} /> Activity Log
                </h3>
                <button onClick={() => setShowLogModal(null)} className="text-gray-500 hover:text-red-500 transition">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 overflow-y-auto flex-1">
                {candidates.find(c => c._id === showLogModal || c.id === showLogModal)?.logs.map((log, i, arr) => (
                  <div key={i} className="flex gap-4 mb-6 relative">
                    {/* Line */}
                    {i !== arr.length - 1 && (
                      <div className="absolute left-[11px] top-6 bottom-[-24px] w-0.5 bg-gray-200"></div>
                    )}
                    <div className="w-6 h-6 rounded-full bg-cyan-100 border-2 border-gray-200 shadow-sm flex items-center justify-center shrink-0 z-10 text-[#1A9DC2]">
                      <div className="w-2 h-2 rounded-full bg-[#12637E]"></div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{log.text}</div>
                      <div className="text-xs font-medium text-gray-500 mt-0.5">
                        {format(new Date(log.timestamp), "dd MMM yyyy, hh:mm a")}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- CONFIRMATION MODAL --- */}
      <AnimatePresence>
        {confirmModal.show && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-gray-200 p-6 text-center"
            >
              <div className="flex justify-center mb-4">
                {(() => {
                  switch (confirmModal.iconType) {
                    case "success":
                      return (
                        <div className="w-16 h-16 bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400 rounded-full flex items-center justify-center border border-green-100 dark:border-green-800 shadow-sm">
                          <CheckCircle2 size={32} />
                        </div>
                      );
                    case "danger":
                      return (
                        <div className="w-16 h-16 bg-red-50 text-red-500 dark:bg-red-950/30 dark:text-red-400 rounded-full flex items-center justify-center border border-red-100 dark:border-red-800 shadow-sm">
                          <AlertCircle size={32} />
                        </div>
                      );
                    case "warning":
                      return (
                        <div className="w-16 h-16 bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400 rounded-full flex items-center justify-center border border-amber-100 dark:border-amber-800 shadow-sm">
                          <AlertCircle size={32} />
                        </div>
                      );
                    case "info":
                    default:
                      return (
                        <div className="w-16 h-16 bg-cyan-50 text-[#1A9DC2] dark:bg-cyan-950/30 dark:text-cyan-400 rounded-full flex items-center justify-center border border-cyan-100 dark:border-cyan-800 shadow-sm">
                          <CheckCircle2 size={32} />
                        </div>
                      );
                  }
                })()}
              </div>
              
              <h3 className="text-2xl font-black text-primary tracking-tight mb-2">
                {confirmModal.title}
              </h3>
              <p className="text-gray-500 font-semibold mb-6">
                {confirmModal.message}
              </p>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setConfirmModal((prev) => ({ ...prev, show: false }))}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmModal.onConfirm}
                  className={`flex-1 py-3 text-white font-bold rounded-xl transition shadow-md hover:shadow-lg ${confirmModal.confirmColor}`}
                >
                  {confirmModal.confirmText}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
