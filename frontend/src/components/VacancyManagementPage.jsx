import React, { useState, useEffect } from "react";
import axios from "axios";
import { format } from "date-fns";
import { Plus, Edit2, Trash2, X, Users, CheckCircle2, AlertCircle, FileText, Briefcase } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

export default function VacancyManagementPage() {
  const [vacancies, setVacancies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingVacancy, setEditingVacancy] = useState(null);
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    title: "",
    message: "",
    confirmText: "Delete",
    confirmColor: "bg-red-600 hover:bg-red-700",
    onConfirm: null,
  });

  const triggerConfirm = (title, message, confirmText, confirmColor, onConfirm) => {
    setConfirmModal({
      show: true,
      title,
      message,
      confirmText,
      confirmColor,
      onConfirm: () => {
        onConfirm();
        setConfirmModal((prev) => ({ ...prev, show: false }));
      }
    });
  };

  // Form state
  const [formData, setFormData] = useState({
    jobRole: "",
    department: "",
    positionTitle: "",
    requiredSkills: "",
    experienceRequired: "",
    employmentType: "Full-Time",
    numberOfEmployeesRequired: 1,
    priorityLevel: "Medium",
    salaryRange: "",
    jobDescription: "",
    lastDateToApply: "",
    status: "Active",
  });

  useEffect(() => {
    fetchVacancies();
  }, []);

  const fetchVacancies = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const res = await axios.get(`${API_BASE}/vacancies`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVacancies(res.data);
    } catch (err) {
      console.error("Error fetching vacancies:", err);
      toast.error("Failed to load vacancies");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (editingVacancy) {
        const res = await axios.put(`${API_BASE}/vacancies/${editingVacancy._id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setVacancies((prev) => prev.map((v) => (v._id === editingVacancy._id ? res.data : v)));
        toast.success("Vacancy updated successfully");
      } else {
        const res = await axios.post(`${API_BASE}/vacancies`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setVacancies([res.data, ...vacancies]);
        toast.success("Vacancy created successfully");
      }
      closeModal();
    } catch (err) {
      console.error("Error saving vacancy:", err);
      toast.error(err.response?.data?.message || "Failed to save vacancy");
    }
  };

  const handleDelete = async (id) => {
    triggerConfirm(
      "Delete Vacancy",
      "Are you sure you want to delete this vacancy? This action cannot be undone.",
      "Delete",
      "bg-red-600 hover:bg-red-700",
      async () => {
        try {
          const token = localStorage.getItem("token") || sessionStorage.getItem("token");
          await axios.delete(`${API_BASE}/vacancies/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setVacancies((prev) => prev.filter((v) => v._id !== id));
          toast.success("Vacancy deleted");
        } catch (err) {
          console.error("Error deleting vacancy:", err);
          toast.error("Failed to delete vacancy");
        }
      }
    );
  };

  const handleStatusToggle = async (vacancy) => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const newStatus = vacancy.status === "Active" ? "Inactive" : "Active";
      const res = await axios.put(`${API_BASE}/vacancies/${vacancy._id}`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVacancies((prev) => prev.map((v) => (v._id === vacancy._id ? res.data : v)));
      toast.success(`Vacancy marked as ${newStatus}`);
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const openEditModal = (vacancy) => {
    setEditingVacancy(vacancy);
    setFormData({
      jobRole: vacancy.jobRole,
      department: vacancy.department,
      positionTitle: vacancy.positionTitle,
      requiredSkills: vacancy.requiredSkills,
      experienceRequired: vacancy.experienceRequired,
      employmentType: vacancy.employmentType,
      numberOfEmployeesRequired: vacancy.numberOfEmployeesRequired,
      priorityLevel: vacancy.priorityLevel,
      salaryRange: vacancy.salaryRange,
      jobDescription: vacancy.jobDescription,
      lastDateToApply: vacancy.lastDateToApply ? new Date(vacancy.lastDateToApply).toISOString().split('T')[0] : "",
      status: vacancy.status,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingVacancy(null);
    setFormData({
      jobRole: "",
      department: "",
      positionTitle: "",
      requiredSkills: "",
      experienceRequired: "",
      employmentType: "Full-Time",
      numberOfEmployeesRequired: 1,
      priorityLevel: "Medium",
      salaryRange: "",
      jobDescription: "",
      lastDateToApply: "",
      status: "Active",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 animate-slideUp">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 shadow-inner">
            <Briefcase size={28} className="text-primary" />
          </div>
          <div>
            <h2 className="text-4xl font-black text-primary tracking-tighter mb-1">Vacancy Management</h2>
            <p className="text-lg font-semibold text-secondary/70">Create and manage hiring requirements</p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn btn-primary px-8 py-4 text-base bg-primary text-white flex items-center gap-2 rounded-xl hover:bg-secondary transition"
        >
          <Plus size={20} /> Publish Vacancy
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slideUp" style={{ animationDelay: '0.1s' }}>
        <div className="card-premium p-6 text-center border-none shadow-md hover:shadow-xl bg-white rounded-[2rem]">
          <div className="text-3xl font-black mb-2 text-primary">{vacancies.length}</div>
          <div className="text-[10px] font-black text-secondary/60 uppercase tracking-[0.2em]">Total Vacancies</div>
        </div>
        <div className="card-premium p-6 text-center border-none shadow-md hover:shadow-xl bg-white rounded-[2rem]">
          <div className="text-3xl font-black mb-2 text-green-600">{vacancies.filter(v => v.status === 'Active').length}</div>
          <div className="text-[10px] font-black text-secondary/60 uppercase tracking-[0.2em]">Active Vacancies</div>
        </div>
        <div className="card-premium p-6 text-center border-none shadow-md hover:shadow-xl bg-white rounded-[2rem]">
          <div className="text-3xl font-black mb-2 text-amber-600">
            {vacancies.reduce((acc, curr) => acc + (curr.numberOfEmployeesRequired - curr.hiredEmployeesCount), 0)}
          </div>
          <div className="text-[10px] font-black text-secondary/60 uppercase tracking-[0.2em]">Positions Open</div>
        </div>
      </div>

      {/* Vacancy List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-slideUp" style={{ animationDelay: '0.2s' }}>
        {loading ? (
          <div className="col-span-full text-center py-10 text-gray-500 font-bold">Loading vacancies...</div>
        ) : vacancies.length === 0 ? (
          <div className="col-span-full text-center py-10 text-gray-500 font-bold bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
            No vacancies found. Create a new hiring requirement to get started.
          </div>
        ) : (
          vacancies.map((v) => (
            <div key={v._id} className={`p-6 rounded-2xl border bg-white shadow-sm hover:shadow-md transition ${v.status === 'Closed' ? 'opacity-70 border-gray-200' : 'border-primary/10'}`}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-black text-primary">{v.positionTitle}</h3>
                  <div className="text-sm font-bold text-secondary mt-1">{v.department} • {v.jobRole}</div>
                </div>
                <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-full border ${
                  v.status === 'Active' ? 'bg-green-50 text-green-600 border-green-200' :
                  v.status === 'Inactive' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                  'bg-gray-50 text-gray-600 border-gray-200'
                }`}>
                  {v.status}
                </span>
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users size={16} /> 
                  <span className="font-semibold">Required: {v.numberOfEmployeesRequired}</span> 
                  <span className="text-gray-400">|</span> 
                  <span className="font-semibold text-primary">Hired: {v.hiredEmployeesCount}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <AlertCircle size={16} /> Priority: <span className="font-bold">{v.priorityLevel}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FileText size={16} /> Last Date: <span className="font-bold">{format(new Date(v.lastDateToApply), 'dd MMM, yyyy')}</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                <div className="flex gap-2">
                  <button onClick={() => handleStatusToggle(v)} className="text-xs font-bold text-secondary hover:text-primary transition" disabled={v.status === 'Closed'}>
                    {v.status === 'Active' ? 'Deactivate' : 'Activate'}
                  </button>
                  {v.status !== 'Closed' && (
                    <button onClick={() => {
                        triggerConfirm(
                          "Close Vacancy",
                          "Are you sure you want to close this vacancy? This will mark it as closed.",
                          "Close Vacancy",
                          "bg-red-600 hover:bg-red-700",
                          () => {
                            const token = localStorage.getItem("token") || sessionStorage.getItem("token");
                            axios.put(`${API_BASE}/vacancies/${v._id}`, { status: 'Closed' }, { headers: { Authorization: `Bearer ${token}` } })
                              .then(res => setVacancies(prev => prev.map(vac => vac._id === v._id ? res.data : vac)))
                              .catch(() => toast.error('Failed to close vacancy'));
                          }
                        );
                      }} className="text-xs font-bold text-red-500 hover:text-red-700 transition">
                      Close
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEditModal(v)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Edit">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(v._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition" title="Delete">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* --- VACANCY MODAL --- */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2rem] shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-200"
            >
              <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h3 className="text-2xl font-black text-primary tracking-tight">
                  {editingVacancy ? "Edit Vacancy" : "Create Hiring Requirement"}
                </h3>
                <button onClick={closeModal} className="text-gray-500 hover:text-red-500 transition">
                  <X size={24} />
                </button>
              </div>
              <div className="p-8 overflow-y-auto flex-1">
                <form id="vacancyForm" onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Job Role</label>
                      <input type="text" name="jobRole" required value={formData.jobRole} onChange={handleInputChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition" placeholder="e.g. Developer" />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Position Title</label>
                      <input type="text" name="positionTitle" required value={formData.positionTitle} onChange={handleInputChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition" placeholder="e.g. Senior Frontend Engineer" />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Department</label>
                      <input type="text" name="department" required value={formData.department} onChange={handleInputChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition" placeholder="e.g. Engineering" />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Required Skills</label>
                      <input type="text" name="requiredSkills" required value={formData.requiredSkills} onChange={handleInputChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition" placeholder="e.g. React, Node.js" />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Experience Required</label>
                      <input type="text" name="experienceRequired" required value={formData.experienceRequired} onChange={handleInputChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition" placeholder="e.g. 2-4 Years" />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Salary Range</label>
                      <input type="text" name="salaryRange" value={formData.salaryRange} onChange={handleInputChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition" placeholder="e.g. 5LPA - 8LPA" />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Employment Type</label>
                      <select name="employmentType" required value={formData.employmentType} onChange={handleInputChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition">
                        <option value="Full-Time">Full-Time</option>
                        <option value="Part-Time">Part-Time</option>
                        <option value="Contract">Contract</option>
                        <option value="Internship">Internship</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Priority Level</label>
                      <select name="priorityLevel" required value={formData.priorityLevel} onChange={handleInputChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition">
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Urgent">Urgent</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Employees Required</label>
                      <input type="number" min="1" name="numberOfEmployeesRequired" required value={formData.numberOfEmployeesRequired} onChange={handleInputChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition" />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Last Date To Apply</label>
                      <input type="date" name="lastDateToApply" required value={formData.lastDateToApply} onChange={handleInputChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Job Description</label>
                    <textarea name="jobDescription" required value={formData.jobDescription} onChange={handleInputChange} rows="4" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition" placeholder="Detailed job description..."></textarea>
                  </div>
                </form>
              </div>
              <div className="px-8 py-5 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-4">
                <button type="button" onClick={closeModal} className="px-6 py-3 font-bold text-gray-600 hover:text-gray-900 transition">Cancel</button>
                <button type="submit" form="vacancyForm" className="px-8 py-3 bg-primary text-white font-bold rounded-xl hover:bg-secondary transition shadow-md hover:shadow-lg">
                  {editingVacancy ? "Update Vacancy" : "Publish Vacancy"}
                </button>
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
              className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-gray-100 p-6 text-center"
            >
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center border border-red-100 text-red-500">
                  <AlertCircle size={32} />
                </div>
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
