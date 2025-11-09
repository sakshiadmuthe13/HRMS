// routes/leaderRoutes.js
import express from "express";
import {
  getLeaderTeams,
  getLeaderProjects,
  leaderCheckIn,
  leaderCheckOut,
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
import { protectLeader } from "../middleware/authMiddleware.js";
import { handleMultipleUploads } from "../middleware/uploadMiddleware.js";

const router = express.Router();

// Leader’s teams
router.get("/teams", protectLeader, getLeaderTeams);

// Leader’s projects
router.get("/projects", protectLeader, getLeaderProjects);

// Attendance management
router.post("/attendance/checkin", protectLeader, leaderCheckIn);
router.post("/attendance/checkout", protectLeader, leaderCheckOut);
router.get("/attendance", protectLeader, getLeaderAttendance);

// Task management
router.post("/assign-task", protectLeader, assignTask);
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
