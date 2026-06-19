// routes/leaderRoutes.js
import express from "express";
import {
  getLeaderTeams,
  getLeaderProjects,
  leaderCheckIn,
  leaderCheckOut,
  leaderStartBreak,
  leaderEndBreak,
  getLeaderAttendance,
  assignTask,
  getTasksAssignedByLeader,
  getTeamMembersByProject,
  applyLeaderLeave,
  getMyLeaderLeaves,
  updateMyLeaderLeave,
  getLeaderDashboardSummary,
  getTeamAttendance,
  getMyLeaderProfile,
  updateMyLeaderProfile,
  searchEmployeesForLeader,
  getTodayCelebrations,
  getHolidaysForLeader,
} from "../controllers/leaderController.js";
import {
  getAllTeams,
  createTeam,
  updateTeam,
  deleteTeam,
  getAllProjects,
  createProject,
  updateProject,
  deleteProject,
  getAllLeadersAdmin,
  getAllEmployeesAdmin,
} from "../controllers/adminController.js";
import { protectLeader } from "../middleware/authMiddleware.js";
import { handleMultipleUploads, uploadSingleFile, uploadToImageKit } from "../middleware/uploadMiddleware.js";

const router = express.Router();

// Leader’s teams
router.get("/teams", protectLeader, getLeaderTeams);

// Leader’s projects
router.get("/projects", protectLeader, getLeaderProjects);

// Team management routes (Leader CRUD)
router.get("/all-teams", protectLeader, getAllTeams);
router.post("/teams", protectLeader, createTeam);
router.put("/teams/:id", protectLeader, updateTeam);
router.delete("/teams/:id", protectLeader, deleteTeam);

// Project management routes (Leader CRUD)
router.get("/all-projects", protectLeader, getAllProjects);
router.post("/projects", protectLeader, createProject);
router.put("/projects/:id", protectLeader, updateProject);
router.delete("/projects/:id", protectLeader, deleteProject);

// User retrieval routes for dropdowns
router.get("/all-leaders", protectLeader, getAllLeadersAdmin);
router.get("/all-employees", protectLeader, getAllEmployeesAdmin);

// Attendance management
router.post("/attendance/checkin", protectLeader, leaderCheckIn);
router.post("/attendance/checkout", protectLeader, leaderCheckOut);
router.post("/attendance/break/start", protectLeader, leaderStartBreak);
router.post("/attendance/break/end", protectLeader, leaderEndBreak);
router.get("/attendance", protectLeader, getLeaderAttendance);

// Task management
router.post("/assign-task", protectLeader, uploadSingleFile, uploadToImageKit, assignTask);
router.get("/my-assigned-tasks", protectLeader, getTasksAssignedByLeader);
router.get("/team-members", protectLeader, getTeamMembersByProject);

// leaves
router.post("/leave/apply", protectLeader, applyLeaderLeave);
router.get("/leave/my", protectLeader, getMyLeaderLeaves);
router.patch("/leave/:id", protectLeader, updateMyLeaderLeave);

// dashboard
router.get("/dashboard", protectLeader, getLeaderDashboardSummary);
router.get("/team-attendance", protectLeader, getTeamAttendance);

// profile
router.get("/profile", protectLeader, getMyLeaderProfile);
router.put("/profile", protectLeader, handleMultipleUploads, updateMyLeaderProfile);

// contact employees
router.get("/contact", protectLeader, searchEmployeesForLeader);

// celebrations
router.get("/celebrations/today", protectLeader, getTodayCelebrations);

// holidays (shared with employees)
router.get("/holidays", protectLeader, getHolidaysForLeader);

export default router;

