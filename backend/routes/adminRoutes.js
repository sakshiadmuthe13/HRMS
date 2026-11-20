import express from "express";
import { getAllUsersForEmails, sendLetterEmail } from "../controllers/hrController.js";
import {
  addCandidate,
  getCandidates,
  updateCandidate,
  sendCandidateEmail,
  parseResume
} from "../controllers/hiringCandidateController.js";
import { uploadSingleFile, uploadToImageKit, uploadArray } from "../middleware/uploadMiddleware.js";
import {
  getAllEmployeesAdmin,
  createEmployeeAdmin,
  updateEmployeeAdmin,
  deleteEmployeeAdmin,
  listHolidays,
  createHoliday,
  deleteHoliday,
  getDelayedTasksAdmin,
  getAttendanceReport,
  getTaskReport,
  getDelayReport,
  getUserReportData,
  getDailyWorkLogsAdmin,
  getAllTasksAdmin,
  searchEmployeesForAdmin,
  getUserFullView,
} from "../controllers/adminController.js";
import { protectAdmin } from "../middleware/authMiddleware.js";
import {
  getAllLeadersAdmin,
  createLeaderAdmin,
  updateLeaderAdmin,
  deleteLeaderAdmin,
} from "../controllers/adminController.js";
import {
  getAllAdminsAdmin,
  createAdminAdmin,
  updateAdminAdmin,
  deleteAdminAdmin,
} from "../controllers/adminController.js";
import {
  getAllHRsAdmin,
  createHRAdmin,
  updateHRAdmin,
  deleteHRAdmin,
} from "../controllers/adminController.js";
import { getAttendanceByDate, getPresenceReport } from "../controllers/adminController.js";
import { getAllSalaries, creditSalary, calculateSalary, previewSalarySlip } from "../controllers/adminController.js";
import { getAllTeams, createTeam, updateTeam, deleteTeam } from "../controllers/adminController.js";
import { getAllProjects, createProject, updateProject, deleteProject } from "../controllers/adminController.js";
import {
  getAllLeaves,
  approveLeave,
  rejectLeave,
  updateUserLeaveAllowance,
  getUserLeaveInfo,
} from "../controllers/adminController.js";
import { getEmployeesForVerification, verifyDocument, unverifyDocument } from "../controllers/adminController.js";

const router = express.Router();

// Protect all admin routes
router.use(protectAdmin);

// Employee CRUD routes
router.get("/employees", getAllEmployeesAdmin);
router.post("/employees", createEmployeeAdmin);
router.put("/employees/:id", updateEmployeeAdmin);
router.delete("/employees/:id", deleteEmployeeAdmin);

// Leader CRUD routes
router.get("/leaders", getAllLeadersAdmin);
router.post("/leaders", createLeaderAdmin);
router.put("/leaders/:id", updateLeaderAdmin);
router.delete("/leaders/:id", deleteLeaderAdmin);

// Admin CRUD routes
router.get("/admins", getAllAdminsAdmin);
router.post("/admins", createAdminAdmin);
router.put("/admins/:id", updateAdminAdmin);
router.delete("/admins/:id", deleteAdminAdmin);

// HR CRUD routes
router.get("/hrs", getAllHRsAdmin);
router.post("/hrs", createHRAdmin);
router.put("/hrs/:id", updateHRAdmin);
router.delete("/hrs/:id", deleteHRAdmin);

// attendance management routes
router.get("/attendance/by-date", getAttendanceByDate);
router.get("/attendance/presence-report", getPresenceReport);

// holiday management routes
router.get("/holidays", listHolidays);
router.post("/holidays", createHoliday);
router.delete("/holidays/:id", deleteHoliday);

// Salary routes
router.get("/salary", getAllSalaries);
router.post("/salary/calculate", calculateSalary);
router.post("/salary/credit", creditSalary);
router.get("/salary/slip/:id", previewSalarySlip);

// Team management routes
router.get("/teams", getAllTeams);
router.post("/teams", createTeam);
router.put("/teams/:id", updateTeam);
router.delete("/teams/:id", deleteTeam);

// Project management routes
router.get("/projects", getAllProjects);
router.post("/projects", createProject);
router.put("/projects/:id", updateProject);
router.delete("/projects/:id", deleteProject);

// leave management routes
router.get("/leave/all", getAllLeaves);
router.patch("/leave/:id/approve", approveLeave);
router.patch("/leave/:id/reject", rejectLeave);

// leave allowance management routes
router.put("/users/:id/leave-allowance", updateUserLeaveAllowance);
router.get("/users/:id/leave-info", getUserLeaveInfo);
router.get("/users/:id/view", getUserFullView);

// profile verification routes
router.get("/verification/employees", getEmployeesForVerification);
router.patch("/verification/:userId/document/:documentType", verifyDocument);
router.patch("/verification/:userId/document/:documentType/unverify", unverifyDocument);

// task delay notifications
router.get("/delayed-tasks", getDelayedTasksAdmin);

// all tasks (admin overview)
router.get("/all-tasks", getAllTasksAdmin);

// contact employee search
router.get("/contact", searchEmployeesForAdmin);

// report generation routes
router.get("/reports/attendance", getAttendanceReport);
router.get("/reports/tasks", getTaskReport);
router.get("/reports/delays", getDelayReport);
router.get("/reports/user-data", getUserReportData);
router.get("/work-logs", getDailyWorkLogsAdmin);

// Letters and Emails
router.get("/users", getAllUsersForEmails);
router.post("/send-letter", uploadSingleFile, sendLetterEmail);

// Hiring Pipeline
router.post("/hiring/candidates", uploadSingleFile, uploadToImageKit, addCandidate);
router.get("/hiring/candidates", getCandidates);
router.put("/hiring/candidates/:id", updateCandidate);
router.post("/hiring/candidates/:id/email", uploadArray, sendCandidateEmail);
router.post("/hiring/parse-resume", uploadSingleFile, parseResume);

export default router;