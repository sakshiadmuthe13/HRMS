import express from "express";
import {
  getAttendance,
  checkIn,
  checkOut,
  startBreak,
  endBreak,
  getMyTeams,
  getProjectsForEmployee,
  getMyTasks,
  updateTaskStatus,
  applyLeave,
  getMyLeaves,
  updateMyLeave,
  getDashboard,
  getMyProfile,
  updateMyProfile,
  searchEmployeesForEmployee,
  getTodayCelebrations,
  getHolidaysForEmployee,
  addWorkLogEntry,
  getWorkLogs,
} from "../controllers/employeeController.js";
import { protectEmployee } from "../middleware/authMiddleware.js";
import { handleMultipleUploads, uploadSingleFile, uploadToImageKit, uploadAnyFiles, uploadFilesToImageKit } from "../middleware/uploadMiddleware.js";

const router = express.Router();

// Dashboard
router.get("/dashboard", protectEmployee, getDashboard);

// Attendance
router.post("/attendance/checkin", protectEmployee, checkIn);
router.post("/attendance/checkout", protectEmployee, checkOut);
router.post("/attendance/break/start", protectEmployee, startBreak);
router.post("/attendance/break/end", protectEmployee, endBreak);
router.get("/attendance", protectEmployee, getAttendance);

// Holidays visible to authenticated users
router.get("/holidays", protectEmployee, getHolidaysForEmployee);

// Teams
router.get("/teams", protectEmployee, getMyTeams);

// Projects
router.get("/projects", protectEmployee, getProjectsForEmployee);

// Tasks
router.get("/tasks", protectEmployee, getMyTasks);
router.patch("/tasks/:taskId/status", protectEmployee, updateTaskStatus);

// leave
router.post("/leave/apply", protectEmployee, applyLeave);
router.get("/leave/my", protectEmployee, getMyLeaves);
router.patch("/leave/:id", protectEmployee, updateMyLeave);

// profile
router.get("/profile", protectEmployee, getMyProfile);
router.put("/profile", protectEmployee, handleMultipleUploads, updateMyProfile);

// work logs
router.post("/work-logs", protectEmployee, uploadAnyFiles, uploadFilesToImageKit, addWorkLogEntry);
router.get("/work-logs", protectEmployee, getWorkLogs);

// contact employees
router.get("/contact", protectEmployee, searchEmployeesForEmployee);

// celebrations
router.get("/celebrations/today", protectEmployee, getTodayCelebrations);

export default router;
