import User from "../models/User.js";
import bcrypt from "bcryptjs";
import Attendance from "../models/Attendance.js";
import Leave from "../models/Leave.js";
import Salary from "../models/Salary.js";
import { sendMail } from "../config/nodemailer.js";
import Team from "../models/Team.js";
import Project from "../models/Project.js";
import Holiday from "../models/Holiday.js";
import mongoose from "mongoose";
import { createNotification } from "./notificationController.js";
import { generateAndSendSalarySlip, generateSalarySlipBuffer } from "../utils/salarySlipGenerator.js";
import { startOfDay, endOfDay } from "date-fns";

// Helper: IST start/end of the given day
const getIndiaDayRange = (date = new Date()) => {
  const istOffset = 5.5 * 60; // minutes
  const local = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
  const ist = new Date(local.getTime() + istOffset * 60000);
  return { start: startOfDay(ist), end: endOfDay(ist) };
};

// Helper: Parse Date in dd/MM/yyyy format to JavaScript Date
const parseDateDMY = (dateStr) => {
  if (!dateStr) return undefined;
  if (dateStr instanceof Date) return dateStr;
  if (typeof dateStr !== 'string') return dateStr;

  const parts = dateStr.split("/");
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // 0-indexed months
    const year = parseInt(parts[2], 10);
    const date = new Date(year, month, day);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }
  return dateStr;
};

import Task from "../models/Task.js";

// ---------------- Employee CRUD for Admin ----------------
// Get all employees
export const getAllEmployeesAdmin = async (req, res) => {
  try {
    const employees = await User.find({ role: "employee" });
    res.json(employees);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch employees" });
  }
};

// Create a new employee
export const createEmployeeAdmin = async (req, res) => {
  try {
    const { name, email, password, phone, address, position, salary, dateOfBirth, reportingManager, technicalReporting, administrativeReporting } =
      req.body;

    // Check if email already exists
    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ message: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    // Build employee data object, excluding empty/undefined reporting fields
    const employeeData = {
      name,
      email,
      password: hashedPassword,
      phone,
      address,
      position,
      salary,
      role: "employee",
    };

    // Only add optional fields if they have valid values
    if (dateOfBirth) employeeData.dateOfBirth = parseDateDMY(dateOfBirth);
    // Check for valid ObjectId values (not empty, not 'abc', not placeholder values)
    if (reportingManager && reportingManager !== '' && reportingManager !== 'abc' && mongoose.Types.ObjectId.isValid(reportingManager)) {
      employeeData.reportingManager = reportingManager;
    }
    if (technicalReporting && technicalReporting !== '' && technicalReporting !== 'abc' && mongoose.Types.ObjectId.isValid(technicalReporting)) {
      employeeData.technicalReporting = technicalReporting;
    }
    if (administrativeReporting && administrativeReporting !== '' && administrativeReporting !== 'abc' && mongoose.Types.ObjectId.isValid(administrativeReporting)) {
      employeeData.administrativeReporting = administrativeReporting;
    }

    const employee = await User.create(employeeData);

    res.status(201).json(employee);
  } catch (err) {
    console.error("Error creating employee:", err);
    res.status(500).json({
      message: "Failed to create employee",
      error: err.message
    });
  }
};

// Update employee details
export const updateEmployeeAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // If password is updated, hash it
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    // Parse dateOfBirth if present
    if (updates.dateOfBirth) {
      updates.dateOfBirth = parseDateDMY(updates.dateOfBirth);
    }

    // Handle empty string values for ObjectId references - convert to null
    if (updates.reportingManager !== undefined && (updates.reportingManager === '' || updates.reportingManager === 'abc' || !mongoose.Types.ObjectId.isValid(updates.reportingManager))) {
      updates.reportingManager = null;
    }
    if (updates.technicalReporting !== undefined && (updates.technicalReporting === '' || updates.technicalReporting === 'abc' || !mongoose.Types.ObjectId.isValid(updates.technicalReporting))) {
      updates.technicalReporting = null;
    }
    if (updates.administrativeReporting !== undefined && (updates.administrativeReporting === '' || updates.administrativeReporting === 'abc' || !mongoose.Types.ObjectId.isValid(updates.administrativeReporting))) {
      updates.administrativeReporting = null;
    }

    const employee = await User.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    if (!employee)
      return res.status(404).json({ message: "Employee not found" });

    res.json(employee);
  } catch (err) {
    console.error("Error updating employee:", err);
    res.status(500).json({
      message: "Failed to update employee",
      error: err.message
    });
  }
};

// Delete employee
export const deleteEmployeeAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await User.findByIdAndDelete(id);
    if (!employee)
      return res.status(404).json({ message: "Employee not found" });

    res.json({ message: "Employee deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete employee" });
  }
};

// ---------------- Leader CRUD for Admin ----------------
// Get all leaders
export const getAllLeadersAdmin = async (req, res) => {
  try {
    const leaders = await User.find({ role: "leader" });
    res.json(leaders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch leaders" });
  }
};

// Create a new leader
export const createLeaderAdmin = async (req, res) => {
  try {
    const { name, email, password, phone, address, position, salary, dateOfBirth, reportingManager, technicalReporting, administrativeReporting } =
      req.body;

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ message: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    // Build leader data object, excluding empty/undefined reporting fields
    const leaderData = {
      name,
      email,
      password: hashedPassword,
      phone,
      address,
      position,
      salary,
      role: "leader",
    };

    // Only add optional fields if they have valid values
    if (dateOfBirth) leaderData.dateOfBirth = parseDateDMY(dateOfBirth);
    // Check for valid ObjectId values (not empty, not 'abc', not placeholder values)
    if (reportingManager && reportingManager !== '' && reportingManager !== 'abc' && mongoose.Types.ObjectId.isValid(reportingManager)) {
      leaderData.reportingManager = reportingManager;
    }
    if (technicalReporting && technicalReporting !== '' && technicalReporting !== 'abc' && mongoose.Types.ObjectId.isValid(technicalReporting)) {
      leaderData.technicalReporting = technicalReporting;
    }
    if (administrativeReporting && administrativeReporting !== '' && administrativeReporting !== 'abc' && mongoose.Types.ObjectId.isValid(administrativeReporting)) {
      leaderData.administrativeReporting = administrativeReporting;
    }

    const leader = await User.create(leaderData);

    res.status(201).json(leader);
  } catch (err) {
    console.error("Error creating leader:", err);
    res.status(500).json({
      message: "Failed to create leader",
      error: err.message
    });
  }
};

// Update leader details
export const updateLeaderAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    // Parse dateOfBirth if present
    if (updates.dateOfBirth) {
      updates.dateOfBirth = parseDateDMY(updates.dateOfBirth);
    }

    // Handle empty string values for ObjectId references - convert to null
    if (updates.reportingManager !== undefined && (updates.reportingManager === '' || updates.reportingManager === 'abc' || !mongoose.Types.ObjectId.isValid(updates.reportingManager))) {
      updates.reportingManager = null;
    }
    if (updates.technicalReporting !== undefined && (updates.technicalReporting === '' || updates.technicalReporting === 'abc' || !mongoose.Types.ObjectId.isValid(updates.technicalReporting))) {
      updates.technicalReporting = null;
    }
    if (updates.administrativeReporting !== undefined && (updates.administrativeReporting === '' || updates.administrativeReporting === 'abc' || !mongoose.Types.ObjectId.isValid(updates.administrativeReporting))) {
      updates.administrativeReporting = null;
    }

    const leader = await User.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    if (!leader) return res.status(404).json({ message: "Leader not found" });
    res.json(leader);
  } catch (err) {
    console.error("Error updating leader:", err);
    res.status(500).json({
      message: "Failed to update leader",
      error: err.message
    });
  }
};

// Delete leader
export const deleteLeaderAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const leader = await User.findByIdAndDelete(id);
    if (!leader) return res.status(404).json({ message: "Leader not found" });

    res.json({ message: "Leader deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete leader" });
  }
};

// ---------------- Leave Allowance Management ----------------
// Update user's leave allowance (admin only)
export const updateUserLeaveAllowance = async (req, res) => {
  try {
    const { id } = req.params;
    const { leaveAllowance } = req.body;

    // Validate allowance is a positive number
    if (typeof leaveAllowance !== 'number' || leaveAllowance < 0) {
      return res.status(400).json({ message: "Leave allowance must be a positive number" });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { leaveAllowance },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "Leave allowance updated successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        leaveAllowance: user.leaveAllowance
      }
    });
  } catch (err) {
    console.error("Error updating leave allowance:", err);
    res.status(500).json({
      message: "Failed to update leave allowance",
      error: err.message
    });
  }
};

// Get user's leave allowance and usage
export const getUserLeaveInfo = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select('name email role leaveAllowance');
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Calculate used leaves for current year
    const yearStart = new Date(new Date().getFullYear(), 0, 1);
    const yearEnd = new Date(new Date().getFullYear(), 11, 31, 23, 59, 59);

    const leaves = await Leave.find({
      userId: id,
      status: 'Approved',
      fromDate: { $lte: yearEnd },
      toDate: { $gte: yearStart }
    });

    let usedDays = 0;
    leaves.forEach(leave => {
      const from = new Date(Math.max(leave.fromDate, yearStart));
      const to = new Date(Math.min(leave.toDate, yearEnd));
      const days = Math.floor((to - from) / (1000 * 60 * 60 * 24)) + 1;
      usedDays += days;
    });

    res.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      leaveAllowance: user.leaveAllowance || 12,
      usedLeaves: usedDays,
      remainingLeaves: Math.max(0, (user.leaveAllowance || 12) - usedDays)
    });
  } catch (err) {
    console.error("Error fetching leave info:", err);
    res.status(500).json({
      message: "Failed to fetch leave info",
      error: err.message
    });
  }
};

// ---------------- Admin CRUD for Admin ----------------
// Get all admins
export const getAllAdminsAdmin = async (req, res) => {
  try {
    const admins = await User.find({ role: "admin" });
    res.json(admins);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch admins" });
  }
};

// Create a new admin
export const createAdminAdmin = async (req, res) => {
  try {
    const { name, email, password, phone, address, position, salary } =
      req.body;

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ message: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      address,
      position,
      salary,
      role: "admin",
    });

    res.status(201).json(admin);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create admin" });
  }
};

// Update admin details
export const updateAdminAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    const admin = await User.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    res.json(admin);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update admin" });
  }
};

// Delete admin
export const deleteAdminAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const admin = await User.findByIdAndDelete(id);
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    res.json({ message: "Admin deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete admin" });
  }
};

// ---------------- HR CRUD for Admin ----------------
// Get all HRs
export const getAllHRsAdmin = async (req, res) => {
  try {
    const hrs = await User.find({ role: "hr" });
    res.json(hrs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch HRs" });
  }
};

// Create a new HR
export const createHRAdmin = async (req, res) => {
  try {
    const { name, email, password, phone, address, position, salary, dateOfBirth } =
      req.body;

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ message: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const hrData = {
      name,
      email,
      password: hashedPassword,
      phone,
      address,
      position,
      salary,
      role: "hr",
    };

    if (dateOfBirth) hrData.dateOfBirth = parseDateDMY(dateOfBirth);

    const hr = await User.create(hrData);

    res.status(201).json(hr);
  } catch (err) {
    console.error("Error creating HR:", err);
    res.status(500).json({
      message: "Failed to create HR",
      error: err.message
    });
  }
};

// Update HR details
export const updateHRAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    // Parse dateOfBirth if present
    if (updates.dateOfBirth) {
      updates.dateOfBirth = parseDateDMY(updates.dateOfBirth);
    }

    const hr = await User.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    if (!hr) return res.status(404).json({ message: "HR not found" });

    res.json(hr);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update HR" });
  }
};

// Delete HR
export const deleteHRAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const hr = await User.findByIdAndDelete(id);
    if (!hr) return res.status(404).json({ message: "HR not found" });

    res.json({ message: "HR deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete HR" });
  }
};



// ---------------- Attendance  ----------------
// Get attendance by date
export const getAttendanceByDate = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ message: "Date is required" });

  // Use IST day boundaries for the given date
  const { start, end } = getIndiaDayRange(new Date(date));

    // Check if the date is a holiday
    const holiday = await Holiday.findOne({
      date: { $gte: start, $lte: end },
    });

    // Fetch all attendance records for that day
    const attendanceRecords = await Attendance.find({
      date: { $gte: start, $lte: end },
    }).populate("user", "name role email");

    // Fetch leave records overlapping that day
    const leaveRecords = await Leave.find({
      $or: [
        { fromDate: { $lte: end }, toDate: { $gte: start } },
        { date: { $gte: start, $lte: end } },
      ],
    }).populate("user", "name role email");

    // Fetch all users
    const allUsers = await User.find({}, "name role");

    // Create maps for quick lookup
    const attendanceMap = new Map(
      attendanceRecords.map((a) => [a.user._id.toString(), a])
    );
    const leaveMap = new Map(
      leaveRecords.map((l) => [l.user._id.toString(), l])
    );

    // Build final attendance list
    const fullList = allUsers.map((u) => {
      const uid = u._id.toString();
      const att = attendanceMap.get(uid);
      const leave = leaveMap.get(uid);

      // If it's a holiday, mark Over-time only when user actually checked in AND checked out.
      // Otherwise mark Holiday (but preserve any recorded times if present).
      if (holiday) {
        if (att && att.checkIn && att.checkOut) {
          return {
            user: u,
            date: att.date || date,
            status: "Over-time",
            checkIn: att.checkIn || null,
            checkOut: att.checkOut || null,
            holidayDescription: holiday.description,
          };
        }

        // If the user is on approved leave that overlaps this holiday day, show Leave
        if (leave) {
          return {
            user: u,
            date: date,
            status: "Leave",
            checkIn: att?.checkIn || null,
            checkOut: att?.checkOut || null,
          };
        }

        // User did not fully check-in/out -> Holiday (but include any partial times if present)
        return {
          user: u,
          date: att?.date || date,
          status: "Holiday",
          checkIn: att?.checkIn || null,
          checkOut: att?.checkOut || null,
          holidayDescription: holiday.description,
        };
      } else if (att) {
        return {
          user: u,
          date: att.date,
          status: att.status || "Present",
          checkIn: att.checkIn || null,
          checkOut: att.checkOut || null,
        };
      } else if (leave) {
        return {
          user: u,
          date: date,
          status: "Leave",
          checkIn: null,
          checkOut: null,
        };
      } else {
        return {
          user: u,
          date: date,
          status: "Absent",
          checkIn: null,
          checkOut: null,
        };
      }
    });

    // Sort alphabetically
    fullList.sort((a, b) => a.user.name.localeCompare(b.user.name));

    res.json(fullList);
  } catch (err) {
    console.error("❌ Error fetching attendance by date:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ---------------- Holiday Management ----------------
// Helper to normalize date to 00:00:00 IST
const toDateOnly = (value) => {
  const { start } = getIndiaDayRange(new Date(value));
  return start;
};

// List holidays
export const listHolidays = async (req, res) => {
  try {
    const { start, end } = req.query;
    const startDate = start ? toDateOnly(start) : null;
    const endDate = end ? toDateOnly(end) : null;

    const query = {};
    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    } else if (startDate) {
      query.date = { $gte: startDate };
    } else if (endDate) {
      query.date = { $lte: endDate };
    }

    const customHolidays = await Holiday.find(query).sort({ date: 1 }).lean();

    const weekendEntries = [];
    const targetStart = startDate || new Date();
    const targetEnd = endDate || new Date(targetStart.getFullYear(), targetStart.getMonth() + 6, 0);
    const cursor = new Date(targetStart);
    cursor.setHours(0, 0, 0, 0);

    while (cursor <= targetEnd) {
      const day = cursor.getDay(); // 0=Sun, 6=Sat
      if (day === 0 || day === 6) {
        weekendEntries.push({
          date: new Date(cursor),
          description: "Weekend Off",
          type: "WEEKEND",
        });
      }
      cursor.setDate(cursor.getDate() + 1);
    }

    const all = [...customHolidays, ...weekendEntries];
    all.sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json(all);
  } catch (err) {
    console.error("❌ Error listing holidays:", err);
    res.status(500).json({ message: "Failed to fetch holidays" });
  }
};

// Create holiday
export const createHoliday = async (req, res) => {
  try {
    const { date, description } = req.body;
    if (!date || !description) {
      return res.status(400).json({ message: "Date and description are required" });
    }

    const day = new Date(date).getDay();
    if (day === 0 || day === 6) {
      return res.status(400).json({ message: "Weekends are already holidays" });
    }

    const normalizedDate = toDateOnly(date);

    const holiday = await Holiday.create({
      date: normalizedDate,
      description,
      type: "CUSTOM",
      createdBy: req.user?._id,
    });

    // Send email notification to all users
    try {
      const allUsers = await User.find({}, "name email");
      const formattedDate = normalizedDate.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      // Send emails to all users
      const emailPromises = allUsers.map((user) => {
        const emailSubject = `🎉 Holiday Announcement - ${description}`;
        const emailText = `Dear ${user.name},\n\nA new holiday has been announced!\n\nDate: ${formattedDate}\nReason: ${description}\n\nEnjoy your day off!\n\nBest regards,\nQiroTech Innovation Pvt. Ltd.`;
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border-radius: 10px;">
            <div style="background: linear-gradient(135deg, #0EA6F0 0%, #667eea 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Holiday Announcement</h1>
            </div>
            <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Dear <strong>${user.name}</strong>,</p>
              <p style="font-size: 16px; color: #333; margin-bottom: 20px;">We are pleased to announce a new holiday!</p>

              <div style="background-color: #f0f8ff; padding: 20px; border-left: 4px solid #0EA6F0; margin: 20px 0; border-radius: 5px;">
                <p style="margin: 10px 0; font-size: 16px; color: #333;">
                  <strong style="color: #0EA6F0;">📅 Date:</strong> ${formattedDate}
                </p>
                <p style="margin: 10px 0; font-size: 16px; color: #333;">
                  <strong style="color: #0EA6F0;">🎊 Occasion:</strong> ${description}
                </p>
              </div>

              <p style="font-size: 16px; color: #333; margin-top: 20px;">Enjoy your day off!</p>

              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                <p style="font-size: 14px; color: #666; margin: 0;">Best regards,</p>
                <p style="font-size: 14px; color: #0EA6F0; font-weight: bold; margin: 5px 0 0 0;">QiroTech Innovation Pvt. Ltd.</p>
              </div>
            </div>
          </div>
        `;

        return sendMail(user.email, emailSubject, emailText, emailHtml).catch((err) => {
          console.error(`Failed to send email to ${user.email}:`, err.message);
        });
      });

      await Promise.allSettled(emailPromises);
      console.log(`✅ Holiday notification emails sent to ${allUsers.length} users`);
    } catch (emailErr) {
      console.error("❌ Error sending holiday notification emails:", emailErr);
      // Don't fail the request if emails fail
    }

    res.status(201).json(holiday);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Holiday already exists for this date" });
    }
    console.error("❌ Error creating holiday:", err);
    res.status(500).json({ message: "Failed to create holiday" });
  }
};

// Delete holiday
export const deleteHoliday = async (req, res) => {
  try {
    const { id } = req.params;
    const holiday = await Holiday.findById(id);
    if (!holiday) {
      return res.status(404).json({ message: "Holiday not found" });
    }

    if (holiday.type === "WEEKEND") {
      return res.status(400).json({ message: "Weekend holidays cannot be removed" });
    }

    await Holiday.deleteOne({ _id: id });
    res.json({ message: "Holiday removed" });
  } catch (err) {
    console.error("❌ Error deleting holiday:", err);
    res.status(500).json({ message: "Failed to delete holiday" });
  }
};

// ---------------- Team Management CRUD for Admin ----------------
// Get all teams
export const getAllTeams = async (req, res) => {
  try {
    const teams = await Team.find().populate("leader members projects");
    res.status(200).json(teams);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch teams", error: err.message });
  }
};

// Create a new team
export const createTeam = async (req, res) => {
  try {
    const { name, leader, members, projects } = req.body;
    const newTeam = new Team({ name, leader, members, projects });
    await newTeam.save();
    res.status(201).json(newTeam);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to create team", error: err.message });
  }
};

// Update a team
export const updateTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, leader, members, projects } = req.body;
    const updatedTeam = await Team.findByIdAndUpdate(
      id,
      { name, leader, members, projects },
      { new: true }
    );
    res.status(200).json(updatedTeam);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to update team", error: err.message });
  }
};

// Delete a team
export const deleteTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedTeam = await Team.findByIdAndDelete(id);
    if (!deletedTeam) {
      return res.status(404).json({ message: "Team not found" });
    }
    res.status(200).json({ message: "Team deleted successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to delete team", error: err.message });
  }
};

// ---------------- Project Management CRUD for Admin ----------------
// Get all projects
export const getAllProjects = async (req, res) => {
  try {
    const projects = await Project.find().populate("assignedTeams");
    res.status(200).json(projects);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch projects", error: err.message });
  }
};

// create project
export const createProject = async (req, res) => {
  try {
    const {
      name,
      description,
      startDate,
      endDate,
      status,
      completion,
      assignedTeams,
    } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({ message: "Project name is required" });
    }

    const project = await Project.create({
      name,
      description,
      startDate,
      endDate,
      status,
      completion,
      assignedTeams,
    });

    res.status(201).json(project);
  } catch (err) {
    console.error("Error creating project:", err);
    res.status(500).json({ message: "Failed to create project" });
  }
};

// update project
export const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Validate required fields
    if (!updates.name) {
      return res.status(400).json({ message: "Project name is required" });
    }

    const project = await Project.findByIdAndUpdate(id, updates, { new: true });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.json(project);
  } catch (err) {
    console.error("Error updating project:", err);
    res.status(500).json({ message: "Failed to update project" });
  }
};

// delete project
export const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid project ID" });
    }

    const project = await Project.findByIdAndDelete(id);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.json({ message: "Project deleted successfully" });
  } catch (err) {
    console.error("Error deleting project:", err);
    res.status(500).json({ message: "Failed to delete project" });
  }
};

// ------------------- Leave Management CRUD for Admin ------------------------
// GET all leaves (employee + leader)
export const getAllLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find()
      .populate("user", "name role")
      .sort({ appliedAt: -1 });
    res.status(200).json(leaves);
  } catch (error) {
    console.error("getAllLeaves error:", error);
    res
      .status(500)
      .json({ message: "Error fetching leaves", error: error.message });
  }
};

// PATCH /admin/leave/:id/approve
export const approveLeave = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id).populate({
      path: "user",
      select: "name email reportingManager",
      populate: {
        path: "reportingManager",
        select: "name email"
      }
    });
    if (!leave) return res.status(404).json({ message: "Leave not found" });
    if (leave.status !== "Pending")
      return res
        .status(400)
        .json({ message: "Only pending leaves can be approved" });

    leave.status = "Approved";
    await leave.save();

    // Notify the employee about leave approval
    await createNotification({
      message: `Your leave from ${new Date(leave.fromDate).toLocaleDateString()} to ${new Date(leave.toDate).toLocaleDateString()} has been approved`,
      role: leave.user.role || "employee",
      recipient: leave.user._id,
      triggeredBy: req.user._id,
    });

    // Notify reporting manager if exists
    if (leave.user.reportingManager) {
      await createNotification({
        message: `Leave application of ${leave.user.name} from ${new Date(leave.fromDate).toLocaleDateString()} to ${new Date(leave.toDate).toLocaleDateString()} has been approved`,
        role: "leader",
        recipient: leave.user.reportingManager._id,
        triggeredBy: req.user._id,
      });
    }

    // Send email notification to the applicant
    const htmlContent = `
    <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Leave Approved</title>
</head>
<body style="margin:0; padding:0; font-family: Arial, sans-serif; background-color:#f4f6fa; color:#333;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6fa; padding:20px 0;">
    <tr>
      <td align="center">
        <table width="500" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 10px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(90deg, #0EA6F0, #A756FA); text-align:center; padding:30px 20px; border-top-left-radius:12px; border-top-right-radius:12px;">
              <h1 style="margin:0; color:#fff; font-size:24px;">QiroTech Innovation Pvt. Ltd.</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:30px 25px; text-align:center;">
              <p style="font-size:16px; color:#555; margin-bottom:20px;">
                Dear <strong>${leave.user.name}</strong>,
              </p>

              <div style="background-color:#d4edda; padding:20px; border-radius:8px; margin:20px 0; text-align:left; border-left:4px solid #28a745;">
                <h3 style="margin:0 0 15px 0; color:#155724; font-size:18px;">Leave Approved</h3>
                <p style="margin:5px 0; font-size:14px; color:#155724;"><strong>From:</strong> ${new Date(leave.fromDate).toLocaleDateString()}</p>
                <p style="margin:5px 0; font-size:14px; color:#155724;"><strong>To:</strong> ${new Date(leave.toDate).toLocaleDateString()}</p>
                <p style="margin:5px 0; font-size:14px; color:#155724;"><strong>Total Days:</strong> ${leave.totalDays}</p>
                <p style="margin:5px 0; font-size:14px; color:#155724;"><strong>Reason:</strong> ${leave.reason}</p>
              </div>

              <p style="font-size:14px; color:#777; margin-top:20px;">
                Your leave application has been approved. You can enjoy your leave as scheduled.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f0f3f8; text-align:center; padding:20px 15px;">
              <p style="margin:0; font-size:12px; color:#999;">
                &copy; 2025 QiroTech Innovation Pvt. Ltd. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
    await sendMail(leave.user.email, "Leave Approved", "", htmlContent);

    // Send email notification to the reporting manager if exists
    if (leave.user.reportingManager && leave.user.reportingManager.email) {
      const managerHtmlContent = `
    <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Leave Approved - Notification</title>
</head>
<body style="margin:0; padding:0; font-family: Arial, sans-serif; background-color:#f4f6fa; color:#333;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6fa; padding:20px 0;">
    <tr>
      <td align="center">
        <table width="500" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 10px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(90deg, #0EA6F0, #A756FA); text-align:center; padding:30px 20px; border-top-left-radius:12px; border-top-right-radius:12px;">
              <h1 style="margin:0; color:#fff; font-size:24px;">QiroTech Innovation Pvt. Ltd.</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:30px 25px; text-align:center;">
              <p style="font-size:16px; color:#555; margin-bottom:20px;">
                Dear <strong>${leave.user.reportingManager.name}</strong>,
              </p>

              <div style="background-color:#d4edda; padding:20px; border-radius:8px; margin:20px 0; text-align:left; border-left:4px solid #28a745;">
                <h3 style="margin:0 0 15px 0; color:#155724; font-size:18px;">Leave Approved</h3>
                <p style="margin:5px 0; font-size:14px; color:#155724;"><strong>Employee:</strong> ${leave.user.name}</p>
                <p style="margin:5px 0; font-size:14px; color:#155724;"><strong>From:</strong> ${new Date(leave.fromDate).toLocaleDateString()}</p>
                <p style="margin:5px 0; font-size:14px; color:#155724;"><strong>To:</strong> ${new Date(leave.toDate).toLocaleDateString()}</p>
                <p style="margin:5px 0; font-size:14px; color:#155724;"><strong>Total Days:</strong> ${leave.totalDays}</p>
                <p style="margin:5px 0; font-size:14px; color:#155724;"><strong>Reason:</strong> ${leave.reason}</p>
              </div>

              <p style="font-size:14px; color:#777; margin-top:20px;">
                This is to inform you that the leave application of <strong>${leave.user.name}</strong> has been approved by the admin.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f0f3f8; text-align:center; padding:20px 15px;">
              <p style="margin:0; font-size:12px; color:#999;">
                &copy; 2025 QiroTech Innovation Pvt. Ltd. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `;
      await sendMail(leave.user.reportingManager.email, "Leave Approved - Team Member Notification", "", managerHtmlContent);
    }

    res.status(200).json(leave);
  } catch (error) {
    console.error("approveLeave error:", error);
    res
      .status(500)
      .json({ message: "Error approving leave", error: error.message });
  }
};

// PATCH /admin/leave/:id/reject
export const rejectLeave = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id).populate({
      path: "user",
      select: "name email reportingManager",
      populate: {
        path: "reportingManager",
        select: "name email"
      }
    });
    if (!leave) return res.status(404).json({ message: "Leave not found" });
    if (leave.status !== "Pending")
      return res
        .status(400)
        .json({ message: "Only pending leaves can be rejected" });

    leave.status = "Rejected";
    await leave.save();

    // Notify the employee about leave rejection
    await createNotification({
      message: `Your leave from ${new Date(leave.fromDate).toLocaleDateString()} to ${new Date(leave.toDate).toLocaleDateString()} has been rejected`,
      role: leave.user.role || "employee",
      recipient: leave.user._id,
      triggeredBy: req.user._id,
    });

    // Notify reporting manager if exists
    if (leave.user.reportingManager) {
      await createNotification({
        message: `Leave application of ${leave.user.name} from ${new Date(leave.fromDate).toLocaleDateString()} to ${new Date(leave.toDate).toLocaleDateString()} has been rejected`,
        role: "leader",
        recipient: leave.user.reportingManager._id,
        triggeredBy: req.user._id,
      });
    }

    // Send email notification to the applicant
    const htmlContent = `
    <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Leave Rejected</title>
</head>
<body style="margin:0; padding:0; font-family: Arial, sans-serif; background-color:#f4f6fa; color:#333;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6fa; padding:20px 0;">
    <tr>
      <td align="center">
        <table width="500" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 10px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(90deg, #0EA6F0, #A756FA); text-align:center; padding:30px 20px; border-top-left-radius:12px; border-top-right-radius:12px;">
              <h1 style="margin:0; color:#fff; font-size:24px;">QiroTech Innovation Pvt. Ltd.</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:30px 25px; text-align:center;">
              <p style="font-size:16px; color:#555; margin-bottom:20px;">
                Dear <strong>${leave.user.name}</strong>,
              </p>

              <div style="background-color:#f8d7da; padding:20px; border-radius:8px; margin:20px 0; text-align:left; border-left:4px solid #dc3545;">
                <h3 style="margin:0 0 15px 0; color:#721c24; font-size:18px;">Leave Rejected</h3>
                <p style="margin:5px 0; font-size:14px; color:#721c24;"><strong>From:</strong> ${new Date(leave.fromDate).toLocaleDateString()}</p>
                <p style="margin:5px 0; font-size:14px; color:#721c24;"><strong>To:</strong> ${new Date(leave.toDate).toLocaleDateString()}</p>
                <p style="margin:5px 0; font-size:14px; color:#721c24;"><strong>Total Days:</strong> ${leave.totalDays}</p>
                <p style="margin:5px 0; font-size:14px; color:#721c24;"><strong>Reason:</strong> ${leave.reason}</p>
              </div>

              <p style="font-size:14px; color:#777; margin-top:20px;">
                Unfortunately, your leave application has been rejected. Please contact your manager for more details or reapply if needed.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f0f3f8; text-align:center; padding:20px 15px;">
              <p style="margin:0; font-size:12px; color:#999;">
                &copy; 2025 QiroTech Innovation Pvt. Ltd. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
    await sendMail(leave.user.email, "Leave Rejected", "", htmlContent);

    // Send email notification to the reporting manager if exists
    if (leave.user.reportingManager && leave.user.reportingManager.email) {
      const managerHtmlContent = `
    <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Leave Rejected - Notification</title>
</head>
<body style="margin:0; padding:0; font-family: Arial, sans-serif; background-color:#f4f6fa; color:#333;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6fa; padding:20px 0;">
    <tr>
      <td align="center">
        <table width="500" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 10px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(90deg, #0EA6F0, #A756FA); text-align:center; padding:30px 20px; border-top-left-radius:12px; border-top-right-radius:12px;">
              <h1 style="margin:0; color:#fff; font-size:24px;">QiroTech Innovation Pvt. Ltd.</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:30px 25px; text-align:center;">
              <p style="font-size:16px; color:#555; margin-bottom:20px;">
                Dear <strong>${leave.user.reportingManager.name}</strong>,
              </p>

              <div style="background-color:#f8d7da; padding:20px; border-radius:8px; margin:20px 0; text-align:left; border-left:4px solid #dc3545;">
                <h3 style="margin:0 0 15px 0; color:#721c24; font-size:18px;">Leave Rejected</h3>
                <p style="margin:5px 0; font-size:14px; color:#721c24;"><strong>Employee:</strong> ${leave.user.name}</p>
                <p style="margin:5px 0; font-size:14px; color:#721c24;"><strong>From:</strong> ${new Date(leave.fromDate).toLocaleDateString()}</p>
                <p style="margin:5px 0; font-size:14px; color:#721c24;"><strong>To:</strong> ${new Date(leave.toDate).toLocaleDateString()}</p>
                <p style="margin:5px 0; font-size:14px; color:#721c24;"><strong>Total Days:</strong> ${leave.totalDays}</p>
                <p style="margin:5px 0; font-size:14px; color:#721c24;"><strong>Reason:</strong> ${leave.reason}</p>
              </div>

              <p style="font-size:14px; color:#777; margin-top:20px;">
                This is to inform you that the leave application of <strong>${leave.user.name}</strong> has been rejected by the admin.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f0f3f8; text-align:center; padding:20px 15px;">
              <p style="margin:0; font-size:12px; color:#999;">
                &copy; 2025 QiroTech Innovation Pvt. Ltd. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `;
      await sendMail(leave.user.reportingManager.email, "Leave Rejected - Team Member Notification", "", managerHtmlContent);
    }

    res.status(200).json(leave);
  } catch (error) {
    console.error("rejectLeave error:", error);
    res
      .status(500)
      .json({ message: "Error rejecting leave", error: error.message });
  }
};

// ---------------- Profile Verification ------------------



// ---------------- Task Delay Notifications ----------------
// Get tasks with delay count >= 3 for admin notifications
export const getDelayedTasksAdmin = async (req, res) => {
  try {
    const tasks = await Task.find({
      $or: [
        { status: 'Delayed' },
        { delayCount: { $gt: 0 } },
        { completedAt: { $exists: true, $ne: null }, deadline: { $exists: true, $ne: null } }
      ]
    })
      .populate('assignedTo', 'name email')
      .populate('project', 'name')
      .populate('assignedBy', 'name')
      .sort({ completedAt: -1 });

    const delayed = tasks.filter(t => (
      t.status === 'Delayed' ||
      (t.delayCount && t.delayCount > 0) ||
      (t.completedAt && t.deadline && new Date(t.completedAt) > new Date(t.deadline))
    ));

    res.json(delayed);
  } catch (err) {
    console.error("Error fetching delayed tasks:", err);
    res.status(500).json({ message: "Failed to fetch delayed tasks" });
  }
};

// ---------------- Salary Management ----------------

// Helper function to calculate salary based on attendance
const calculateSalaryDetails = async (userId, monthName, year) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
  const monthIndex = months.indexOf(monthName.toLowerCase());
  if (monthIndex === -1) throw new Error("Invalid month");
  
  const monthStart = new Date(year, monthIndex, 1);
  monthStart.setHours(0, 0, 0, 0);
  
  const monthEnd = new Date(year, monthIndex + 1, 0);
  monthEnd.setHours(23, 59, 59, 999);

  const daysInMonth = monthEnd.getDate();

  const attendances = await Attendance.find({
    user: userId,
    date: { $gte: monthStart, $lte: monthEnd }
  }).lean();

  const leaves = await Leave.find({
    user: userId,
    status: 'Approved',
    fromDate: { $lte: monthEnd },
    toDate: { $gte: monthStart }
  }).lean();

  const holidays = await Holiday.find({
    date: { $gte: monthStart, $lte: monthEnd }
  }).lean();

  const holidaySet = new Set();
  const weekendSet = new Set();
  
  let workingDays = 0;
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(year, monthIndex, i);
    const dayOfWeek = date.getDay();
    
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      weekendSet.add(i);
    } else {
      workingDays++;
    }
  }

  holidays.forEach(holiday => {
    const day = new Date(holiday.date).getDate();
    if (!weekendSet.has(day)) {
      holidaySet.add(day);
      workingDays--;
    }
  });

  let presentDays = 0;
  let absentDays = 0;
  let overtimeDays = 0;
  
  const attendanceMap = new Map(attendances.map(a => [new Date(a.date).getDate(), a]));

  for (let i = 1; i <= daysInMonth; i++) {
    if (weekendSet.has(i) || holidaySet.has(i)) {
      continue;
    }

    const att = attendanceMap.get(i);
    if (att) {
      if (att.status === 'Present') {
        presentDays++;
      } else if (att.status === 'Absent') {
        absentDays++;
      } else if (att.status === 'Over-time') {
        overtimeDays++;
        presentDays++;
      } else if (att.status === 'Leave') {
        // Handled separately
      }
    } else {
      absentDays++;
    }
  }

  let leaveDays = 0;
  leaves.forEach(leave => {
    const leaveStart = new Date(leave.fromDate);
    const leaveEnd = new Date(leave.toDate);
    
    for (let d = new Date(leaveStart); d <= leaveEnd; d.setDate(d.getDate() + 1)) {
      if (d.getMonth() === monthIndex && d.getFullYear() === year) {
        const dayOfMonth = d.getDate();
        if (!weekendSet.has(dayOfMonth) && !holidaySet.has(dayOfMonth)) {
          leaveDays++;
        }
      }
    }
  });

  const baseSalary = Number(user.salary) || 0;
  const dailyRate = baseSalary / workingDays;
  const calculatedSalary = Math.round(dailyRate * presentDays * 100) / 100;

  return {
    baseSalary,
    daysInMonth,
    workingDays,
    presentDays,
    absentDays,
    leaveDays,
    overtimeDays,
    dailyRate: Math.round(dailyRate * 100) / 100,
    calculatedSalary,
    weekends: weekendSet.size,
    holidays: holidaySet.size
  };
};

// POST /api/admin/salary/calculate
export const calculateSalary = async (req, res) => {
  try {
    const { userId, month, year } = req.body;

    if (!userId) return res.status(400).json({ message: "userId is required" });
    if (!month) return res.status(400).json({ message: "month is required" });

    const monthNormalized = String(month).trim().toLowerCase();
    const numericYear = Number(year || new Date().getFullYear());

    if (!numericYear || numericYear < 2000 || numericYear > 2100) {
      return res.status(400).json({ message: "Invalid year" });
    }

    const details = await calculateSalaryDetails(userId, monthNormalized, numericYear);
    res.json(details);
  } catch (err) {
    console.error("Error calculating salary:", err);
    res.status(500).json({ message: "Failed to calculate salary", error: err.message });
  }
};

// GET /api/admin/salary
export const getAllSalaries = async (req, res) => {
  try {
    const records = await Salary.find({})
      .populate("user", "name email")
      .sort({ creditedOn: -1 });
    res.json(records);
  } catch (err) {
    console.error("Error fetching salaries:", err);
    res.status(500).json({ message: "Failed to fetch salary history" });
  }
};

// GET /api/admin/salary/slip/:id
export const previewSalarySlip = async (req, res) => {
  try {
    const { id } = req.params;
    const record = await Salary.findById(id).populate("user");
    if (!record) return res.status(404).json({ message: "Salary record not found" });

    // Recompute salary breakdown for this record so the PDF uses the same
    // detailed calculation (present/absent, daily rate, deductions) as the
    // calculate endpoint.
    const salaryDetails = await calculateSalaryDetails(record.user._id, record.month, record.year);

    const pdfBuffer = await generateSalarySlipBuffer(record.user, salaryDetails, record);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="Salary_Slip_${record.month}_${record.year}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error("Error previewing salary slip:", err);
    res.status(500).json({ message: "Failed to generate preview", error: err.message });
  }
};

// POST /api/admin/salary/credit
export const creditSalary = async (req, res) => {
  try {
    const { userId, bonus = 0, month, year } = req.body;

    if (!userId) return res.status(400).json({ message: "userId is required" });
    if (!month) return res.status(400).json({ message: "month is required" });

    const monthNormalized = String(month).trim().toLowerCase(); // e.g., "january"
    const numericYear = Number(year || new Date().getFullYear());
    if (!numericYear || numericYear < 2000 || numericYear > 2100) {
      return res.status(400).json({ message: "Invalid year" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Prevent duplicate credit for same user-month-year
    const existing = await Salary.findOne({ user: userId, month: monthNormalized, year: numericYear });
    if (existing) {
      return res.status(400).json({ message: "Salary already credited for this month and year" });
    }

    const salaryDetails = await calculateSalaryDetails(userId, monthNormalized, numericYear);
    const baseSalary = salaryDetails.calculatedSalary;
    const bonusNum = Number(bonus) || 0;
    const totalCredited = baseSalary + bonusNum;

    const record = await Salary.create({
      user: userId,
      baseSalary,
      bonus: bonusNum,
      totalCredited,
      month: monthNormalized,   // store lowercase month string
      year: numericYear,
      creditedOn: new Date(),
      isCredited: true,
      presentDays: salaryDetails.presentDays,
      absentDays: salaryDetails.absentDays,
      dailyRate: salaryDetails.dailyRate,
      daysInMonth: salaryDetails.daysInMonth,
    });

    const populated = await record.populate("user", "name email");

    // Generate and send the PDF salary slip via email
    try {
      await generateAndSendSalarySlip(user, salaryDetails, record);
    } catch (emailErr) {
      console.error("Salary credited but failed to send email:", emailErr);
    }

    res.status(201).json(populated);
  } catch (err) {
    console.error("Error crediting salary:", err);
    res.status(500).json({ message: "Failed to credit salary", error: err.message });
  }
};

// ---------------- Report Generation ----------------

// Attendance Report
export const getAttendanceReport = async (req, res) => {
  try {
    const { userId, startDate, endDate } = req.query;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    // Fetch user to get dateOfJoining and basic info
    const user = await User.findById(userId).select('name email dateOfJoining');
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Default range: from dateOfJoining -> today (IST) if not provided
    const startBase = startDate ? new Date(startDate) : new Date(user.dateOfJoining || Date.now());
    const endBase = endDate ? new Date(endDate) : new Date();

    const { start: rStart } = getIndiaDayRange(new Date(startBase));
    const { end: rEnd } = getIndiaDayRange(new Date(endBase));

    // Fetch all relevant records in the range to avoid per-day DB queries
    const [attendances, holidays, leaves] = await Promise.all([
      Attendance.find({ user: userId, date: { $gte: rStart, $lte: rEnd } }).sort({ date: 1 }).lean(),
      Holiday.find({ date: { $gte: rStart, $lte: rEnd } }).lean(),
      Leave.find({ user: userId, status: 'Approved', fromDate: { $lte: rEnd }, toDate: { $gte: rStart } }).lean(),
    ]);

    // Build quick lookup maps
    const attMap = new Map();
    attendances.forEach(a => {
      const key = (new Date(a.date)).toISOString().split('T')[0];
      attMap.set(key, a);
    });

    const holidaySet = new Set();
    holidays.forEach(h => {
      const key = (new Date(h.date)).toISOString().split('T')[0];
      holidaySet.add(key);
    });

    const leaveSet = new Set();
    leaves.forEach(lv => {
      // mark each covered date in range as leave
      const from = new Date(Math.max(new Date(lv.fromDate).getTime(), rStart.getTime()));
      const to = new Date(Math.min(new Date(lv.toDate).getTime(), rEnd.getTime()));
      for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
        leaveSet.add(d.toISOString().split('T')[0]);
      }
    });

    // Iterate each day in order and build CSV rows
    let csv = 'Date,Name,Email,Status,CheckIn,CheckOut,Hours\n';
    for (let cursor = new Date(rStart); cursor <= rEnd; cursor.setDate(cursor.getDate() + 1)) {
      const key = cursor.toISOString().split('T')[0];
      const att = attMap.get(key);

      // Determine status precedence: Holiday > Over-time > Leave > Present > Absent
      let status = 'Absent';
      let checkIn = '';
      let checkOut = '';
      let hours = '';

      if (holidaySet.has(key)) {
        // If holiday but user checked in -> Over-time, otherwise Holiday
        if (att && att.checkIn) {
          status = 'Over-time';
          if (att.checkIn) checkIn = new Date(att.checkIn).toISOString();
          if (att.checkOut) checkOut = new Date(att.checkOut).toISOString();
        } else {
          status = 'Holiday';
        }
      } else if (leaveSet.has(key)) {
        status = 'Leave';
      } else if (att && att.checkIn && att.checkOut) {
        status = 'Present';
        checkIn = new Date(att.checkIn).toISOString();
        checkOut = new Date(att.checkOut).toISOString();
      } else {
        status = 'Absent';
        // if there's an attendance record with one-sided checkIn/checkOut, still record times
        if (att && att.checkIn) checkIn = new Date(att.checkIn).toISOString();
        if (att && att.checkOut) checkOut = new Date(att.checkOut).toISOString();
      }

      if (checkIn && checkOut) {
        try {
          const diffMs = new Date(checkOut).getTime() - new Date(checkIn).getTime();
          hours = (diffMs / 3600000).toFixed(2);
        } catch (e) {
          hours = '';
        }
      }

  // Use user info from fetched user (fallback) or attendance record
  const name = (att && att.user && att.user.name) || user.name || '';
  const email = (att && att.user && att.user.email) || user.email || '';

      csv += `${key},"${name}","${email}",${status},${checkIn},${checkOut},${hours}\n`;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="attendance_report.csv"');
    res.send(csv);
  } catch (err) {
    console.error("Error generating attendance report:", err);
    res.status(500).json({ message: "Failed to generate attendance report" });
  }
};

// Task Report
export const getTaskReport = async (req, res) => {
  try {
    const { userId, startDate, endDate } = req.query;

    if (!userId || !startDate || !endDate) {
      return res.status(400).json({ message: "userId, startDate, and endDate are required" });
    }

    const tasks = await Task.find({
      assignedTo: userId,
      assignedAt: { $gte: new Date(startDate), $lte: new Date(endDate) }
    })
    .populate('assignedTo', 'name email')
    .populate('assignedBy', 'name')
    .populate('project', 'name')
    .sort({ assignedAt: 1 });

    // Generate CSV
    let csv = 'Assigned At,Title,Description,Status,Deadline,Project,Assigned By,Delay Count\n';
    tasks.forEach(task => {
      const assignedAt = task.assignedAt.toISOString().split('T')[0];
      const deadline = task.deadline ? task.deadline.toISOString().split('T')[0] : '';
      const project = task.project ? task.project.name : '';
      const assignedBy = task.assignedBy ? task.assignedBy.name : '';
      csv += `"${assignedAt}","${task.title}","${task.description}","${task.status}","${deadline}","${project}","${assignedBy}",${task.delayCount}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="task_report.csv"');
    res.send(csv);
  } catch (err) {
    console.error("Error generating task report:", err);
    res.status(500).json({ message: "Failed to generate task report" });
  }
};

// Delay Report
export const getDelayReport = async (req, res) => {
  try {
    const { userId, startDate, endDate } = req.query;

    if (!userId || !startDate || !endDate) {
      return res.status(400).json({ message: "userId, startDate, and endDate are required" });
    }

    const tasks = await Task.find({
      assignedTo: userId,
      delayCount: { $gt: 0 },
      assignedAt: { $gte: new Date(startDate), $lte: new Date(endDate) }
    })
    .populate('assignedTo', 'name email')
    .populate('assignedBy', 'name')
    .populate('project', 'name')
    .sort({ delayCount: -1, assignedAt: 1 });

    // Generate CSV
    let csv = 'Assigned At,Title,Status,Deadline,Delay Count,Delay History,Project,Assigned By\n';
    tasks.forEach(task => {
      const assignedAt = task.assignedAt.toISOString().split('T')[0];
      const deadline = task.deadline ? task.deadline.toISOString().split('T')[0] : '';
      const project = task.project ? task.project.name : '';
      const assignedBy = task.assignedBy ? task.assignedBy.name : '';
      const delayHistory = task.delayHistory.map(h => `${h.date.toISOString().split('T')[0]}: ${h.reason}`).join('; ');
      csv += `"${assignedAt}","${task.title}","${task.status}","${deadline}",${task.delayCount},"${delayHistory}","${project}","${assignedBy}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="delay_report.csv"');
    res.send(csv);
  } catch (err) {
    console.error("Error generating delay report:", err);
    res.status(500).json({ message: "Failed to generate delay report" });
  }
};

// ---------------- User Report Data ----------------

// Get detailed report data for a user
export const getUserReportData = async (req, res) => {
  try {
    const { userId, startDate, endDate } = req.query;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    // Get user details
    const user = await User.findById(userId).select('name email role phone address position salary dateOfBirth');
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Build a full day-by-day attendance list for the requested range (or from joining -> today)
    const startBase = startDate ? new Date(startDate) : new Date(user.dateOfJoining || Date.now());
    const endBase = endDate ? new Date(endDate) : new Date();
    const { start: uStart } = getIndiaDayRange(new Date(startBase));
    const { end: uEnd } = getIndiaDayRange(new Date(endBase));

    // Fetch records in range
    const [rawAttendances, rawHolidays, rawLeaves] = await Promise.all([
      Attendance.find({ user: userId, date: { $gte: uStart, $lte: uEnd } }).sort({ date: 1 }).lean(),
      Holiday.find({ date: { $gte: uStart, $lte: uEnd } }).lean(),
      Leave.find({ user: userId, fromDate: { $lte: uEnd }, toDate: { $gte: uStart } }).sort({ fromDate: -1 }).lean(),
    ]);

    // Maps/sets
    const attMap2 = new Map();
    rawAttendances.forEach(a => {
      const key = (new Date(a.date)).toISOString().split('T')[0];
      attMap2.set(key, a);
    });
    const holidaySet2 = new Set(rawHolidays.map(h => (new Date(h.date)).toISOString().split('T')[0]));
    const leaveSet2 = new Set();
    rawLeaves.forEach(lv => {
      const from = new Date(Math.max(new Date(lv.fromDate).getTime(), uStart.getTime()));
      const to = new Date(Math.min(new Date(lv.toDate).getTime(), uEnd.getTime()));
      for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
        leaveSet2.add(d.toISOString().split('T')[0]);
      }
    });

    // Build day list
    const dayList = [];
    for (let cursor = new Date(uStart); cursor <= uEnd; cursor.setDate(cursor.getDate() + 1)) {
      const key = cursor.toISOString().split('T')[0];
      const rec = attMap2.get(key);
      let status = 'Absent';
      let checkIn = null;
      let checkOut = null;
      let hours = null;

      if (holidaySet2.has(key)) {
        if (rec && rec.checkIn) {
          status = 'Over-time';
          checkIn = rec.checkIn;
          checkOut = rec.checkOut;
        } else {
          status = 'Holiday';
        }
      } else if (leaveSet2.has(key)) {
        status = 'Leave';
      } else if (rec && rec.checkIn && rec.checkOut) {
        status = 'Present';
        checkIn = rec.checkIn;
        checkOut = rec.checkOut;
      } else {
        status = 'Absent';
        if (rec) {
          if (rec.checkIn) checkIn = rec.checkIn;
          if (rec.checkOut) checkOut = rec.checkOut;
        }
      }

      if (checkIn && checkOut) {
        try {
          const diffMs = new Date(checkOut).getTime() - new Date(checkIn).getTime();
          hours = +(diffMs / 3600000).toFixed(2);
        } catch (e) {
          hours = null;
        }
      }

      dayList.push({ date: key, status, checkIn, checkOut, hours });
    }

    // Use dayList as attendances for the response
    const attendances = dayList.reverse(); // keep same descending order as earlier API
    const leaves = rawLeaves; // keep original leave objects for history

    // Assigned projects
    let projects = [];
    if (user.role === 'leader') {
      // For leaders: projects where they are the leader of the team
      const teamsLed = await Team.find({ leader: userId }).select('_id');
      const teamIds = teamsLed.map(t => t._id);
      projects = await Project.find({ assignedTeams: { $in: teamIds } })
        .populate('assignedTeams', 'name')
        .select('name status description startDate endDate');
    } else {
      // For employees: projects via teams where they are a member
      const teamsMember = await Team.find({ members: userId }).select('_id');
      const teamIds = teamsMember.map(t => t._id);
      projects = await Project.find({ assignedTeams: { $in: teamIds } })
        .populate('assignedTeams', 'name')
        .select('name status description startDate endDate');
    }

    // Tasks
    let tasks = [];
    if (user.role === 'leader') {
      // For leaders: tasks they assigned (assignedBy)
      const taskQuery = { assignedBy: userId };
      if (startDate && endDate) {
        taskQuery.assignedAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
      }
      tasks = await Task.find(taskQuery)
        .populate('project', 'name')
        .populate('assignedBy', 'name')
        .populate('assignedTo', 'name')
        .sort({ assignedAt: -1 });
    } else {
      // For employees: tasks assigned to them
      const taskQuery = { assignedTo: userId };
      if (startDate && endDate) {
        taskQuery.assignedAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
      }
      tasks = await Task.find(taskQuery)
        .populate('project', 'name')
        .populate('assignedBy', 'name')
        .sort({ assignedAt: -1 });
    }

    // Performance summary
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'Completed').length;
    const delayedTasks = tasks.filter(t => t.delayCount > 0).length;
  const totalAttendance = attendances.length;
  const presentDays = attendances.filter(a => a.status === 'Present' || a.status === 'Over-time').length;

    const performanceSummary = {
      totalTasks,
      completedTasks,
      delayedTasks,
      completionRate: totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : 0,
      totalAttendance,
      presentDays,
      attendanceRate: totalAttendance > 0 ? ((presentDays / totalAttendance) * 100).toFixed(1) : 0,
      totalLeaves: leaves.length
    };

    res.json({
      user,
      attendances,
      leaves,
      projects,
      tasks,
      performanceSummary
    });
  } catch (err) {
    console.error("Error fetching user report data:", err);
    res.status(500).json({ message: "Failed to fetch user report data" });
  }
};

// Document Verification
export const getEmployeesForVerification = async (req, res) => {
  try {
    const users = await User.find({ role: { $in: ["employee", "leader"] } })
      .select("name email role documents profileVerified")
      .lean();

    const usersWithDocs = users.map((user) => {
      const documentFields = [
        "passportPhoto",
        "tenthMarksheet",
        "twelthDiplomaMarksheet",
        "graduationMarksheet",
        "bankPassbookPhoto",
        "aadharFront",
        "aadharBack",
        "panCard",
        "cv",
      ];

      const documents = {};
      documentFields.forEach((field) => {
        if (user.documents && user.documents[field] && user.documents[field].path) {
          documents[field] = {
            path: user.documents[field].path,
            verified: user.documents[field].verified || false,
            uploadedAt: user.documents[field].uploadedAt,
          };
        }
      });

      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileVerified: user.profileVerified,
        documents,
        hasDocuments: Object.keys(documents).length > 0,
        hasPendingDocuments: Object.values(documents).some((doc) => !doc.verified),
      };
    });

    const filteredUsers = usersWithDocs.filter((user) => user.hasDocuments);

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error fetching employees for verification:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch employees for verification" });
  }
};

export const verifyDocument = async (req, res) => {
  try {
    const { userId, documentType } = req.params;
    const { verified } = req.body;

    if (!userId || !documentType) {
      return res
        .status(400)
        .json({ message: "userId and documentType are required" });
    }

    if (verified === undefined) {
      return res.status(400).json({ message: "verified status is required" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.documents || !user.documents[documentType]) {
      return res.status(400).json({ message: "Document type not found" });
    }

    if (!user.documents[documentType].path) {
      return res
        .status(400)
        .json({ message: "No document uploaded for this type" });
    }

    user.documents[documentType].verified = verified;

    const docFields = [
      "passportPhoto",
      "tenthMarksheet",
      "twelthDiplomaMarksheet",
      "graduationMarksheet",
      "bankPassbookPhoto",
      "aadharFront",
      "aadharBack",
      "panCard",
      "cv",
    ];
    const allVerified = docFields.every(
      (field) => !user.documents || !user.documents[field] || !user.documents[field].path || user.documents[field].verified
    );
    user.profileVerified = allVerified;
    await user.save();

    // Re-fetch clean user from database to ensure no Mongoose in-memory subdocument reference issues
    const updatedUser = await User.findById(userId).lean();

    const documents = {};
    docFields.forEach((field) => {
      if (updatedUser && updatedUser.documents && updatedUser.documents[field] && updatedUser.documents[field].path) {
        documents[field] = {
          path: updatedUser.documents[field].path,
          verified: updatedUser.documents[field].verified || false,
          uploadedAt: updatedUser.documents[field].uploadedAt,
        };
      }
    });

    const statusMsg = verified ? "verified" : "unverified";

    await createNotification({
      message: `Your document "${documentType}" has been ${statusMsg} by admin.`,
      role: user.role,
      recipient: userId,
      triggeredBy: req.user._id,
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>Document ${verified ? "Verified" : "Unverified"}</title>
      </head>
      <body style="margin:0; padding:0; font-family: Arial, sans-serif; background-color:#f4f6fa; color:#333;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6fa; padding:20px 0;">
          <tr>
            <td align="center">
              <table width="500" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 10px rgba(0,0,0,0.1);">
                <tr>
                  <td style="background: linear-gradient(90deg, #0EA6F0, #A756FA); text-align:center; padding:30px 20px; border-top-left-radius:12px; border-top-right-radius:12px;">
                    <h1 style="margin:0; color:#fff; font-size:24px;">QiroTech Innovation Pvt. Ltd.</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding:30px 25px; text-align:center;">
                    <p style="font-size:16px; color:#555; margin-bottom:20px;">
                      Your document has been <strong>${statusMsg}</strong> by the admin.
                    </p>
                    <div style="background-color:#f9f9f9; padding:20px; border-radius:8px; margin:20px 0; text-align:left;">
                      <h3 style="margin:0 0 15px 0; color:#0EA6F0; font-size:18px;">Document Details:</h3>
                      <p style="margin:5px 0; font-size:14px;"><strong>Type:</strong> ${documentType}</p>
                      <p style="margin:5px 0; font-size:14px;"><strong>Status:</strong> ${statusMsg.charAt(0).toUpperCase() + statusMsg.slice(1)}</p>
                    </div>
                    ${
                      !verified
                        ? '<p style="font-size:14px; color:#d9534f; margin-top:20px;"><strong>Note:</strong> You can now update this document. Please re-upload if needed.</p>'
                        : ''
                    }
                  </td>
                </tr>
                <tr>
                  <td style="background-color:#f0f3f8; text-align:center; padding:20px 15px;">
                    <p style="margin:0; font-size:12px; color:#999;">
                      &copy; 2025 QiroTech Innovation Pvt. Ltd. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    await sendMail(
      user.email,
      `Document ${verified ? "Verified" : "Unverified"}`,
      "",
      htmlContent
    );

    res.status(200).json({
      message: `Document ${statusMsg} successfully`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileVerified: user.profileVerified,
        documents,
      },
    });
  } catch (error) {
    console.error("Error verifying document:", error);
    res.status(500).json({ message: "Failed to verify document" });
  }
};

export const unverifyDocument = async (req, res) => {
  try {
    const { userId, documentType } = req.params;

    if (!userId || !documentType) {
      return res
        .status(400)
        .json({ message: "userId and documentType are required" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.documents || !user.documents[documentType]) {
      return res.status(400).json({ message: "Document type not found" });
    }

    if (!user.documents[documentType].path) {
      return res
        .status(400)
        .json({ message: "No document uploaded for this type" });
    }

    if (!user.documents[documentType].verified) {
      return res
        .status(400)
        .json({ message: "Document is already unverified" });
    }

    user.documents[documentType].verified = false;

    const docFields = [
      "passportPhoto",
      "tenthMarksheet",
      "twelthDiplomaMarksheet",
      "graduationMarksheet",
      "bankPassbookPhoto",
      "aadharFront",
      "aadharBack",
      "panCard",
      "cv",
    ];
    const allVerified = docFields.every(
      (field) => !user.documents || !user.documents[field] || !user.documents[field].path || user.documents[field].verified
    );
    user.profileVerified = allVerified;
    await user.save();

    // Re-fetch clean user from database to ensure no Mongoose in-memory subdocument reference issues
    const updatedUser = await User.findById(userId).lean();

    const documents = {};
    docFields.forEach((field) => {
      if (updatedUser && updatedUser.documents && updatedUser.documents[field] && updatedUser.documents[field].path) {
        documents[field] = {
          path: updatedUser.documents[field].path,
          verified: updatedUser.documents[field].verified || false,
          uploadedAt: updatedUser.documents[field].uploadedAt,
        };
      }
    });

    await createNotification({
      message: `Your document "${documentType}" has been unverified by admin. You can now update it.`,
      role: user.role,
      recipient: userId,
      triggeredBy: req.user._id,
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>Document Unverified</title>
      </head>
      <body style="margin:0; padding:0; font-family: Arial, sans-serif; background-color:#f4f6fa; color:#333;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6fa; padding:20px 0;">
          <tr>
            <td align="center">
              <table width="500" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 10px rgba(0,0,0,0.1);">
                <tr>
                  <td style="background: linear-gradient(90deg, #0EA6F0, #A756FA); text-align:center; padding:30px 20px; border-top-left-radius:12px; border-top-right-radius:12px;">
                    <h1 style="margin:0; color:#fff; font-size:24px;">QiroTech Innovation Pvt. Ltd.</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding:30px 25px; text-align:center;">
                    <p style="font-size:16px; color:#555; margin-bottom:20px;">
                      Your document has been <strong>unverified</strong> by the admin.
                    </p>
                    <div style="background-color:#f9f9f9; padding:20px; border-radius:8px; margin:20px 0; text-align:left;">
                      <h3 style="margin:0 0 15px 0; color:#0EA6F0; font-size:18px;">Document Details:</h3>
                      <p style="margin:5px 0; font-size:14px;"><strong>Type:</strong> ${documentType}</p>
                      <p style="margin:5px 0; font-size:14px;"><strong>Status:</strong> Unverified</p>
                    </div>
                    <p style="font-size:14px; color:#d9534f; margin-top:20px;"><strong>Note:</strong> You can now update this document. Please re-upload if needed.</p>
                  </td>
                </tr>
                <tr>
                  <td style="background-color:#f0f3f8; text-align:center; padding:20px 15px;">
                    <p style="margin:0; font-size:12px; color:#999;">
                      &copy; 2025 QiroTech Innovation Pvt. Ltd. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    await sendMail(user.email, "Document Unverified - You Can Now Update", "", htmlContent);

    res.status(200).json({
      message: "Document unverified successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileVerified: user.profileVerified,
        documents,
      },
    });
  } catch (error) {
    console.error("Error unverifying document:", error);
    res.status(500).json({ message: "Failed to unverify document" });
  }
};

// ---------------- All Tasks (Admin View) ----------------
// GET /api/admin/all-tasks
// Returns every task in the system with full population so admin can monitor all assignments.
export const getAllTasksAdmin = async (req, res) => {
  try {
    const { status, search } = req.query;

    const filter = {};
    if (status && status !== "All") filter.status = status;

    const tasks = await Task.find(filter)
      .populate("assignedTo", "name email")
      .populate("assignedBy", "name email")
      .populate("project", "name")
      .sort({ assignedAt: -1 });

    let result = tasks;

    // Optional full-text search on description or employee name
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      result = tasks.filter(
        (t) =>
          (t.description && t.description.toLowerCase().includes(q)) ||
          (t.assignedTo?.name && t.assignedTo.name.toLowerCase().includes(q)) ||
          (t.project?.name && t.project.name.toLowerCase().includes(q)) ||
          (t.assignedBy?.name && t.assignedBy.name.toLowerCase().includes(q))
      );
    }

    res.json(result);
  } catch (err) {
    console.error("Error fetching all tasks (admin):", err);
    res.status(500).json({ message: "Failed to fetch tasks" });
  }
};

// ---------------- Contact Employee Search (Admin View) ----------------
// GET /api/admin/contact?query=...
// Admin can search ALL active users (employees, leaders, HRs) by name/email/phone.
const escapeRegexAdmin = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const searchEmployeesForAdmin = async (req, res) => {
  try {
    const { query = "" } = req.query;

    if (!query.trim()) {
      return res.status(400).json({ message: "Search query is required" });
    }

    const safeQuery = escapeRegexAdmin(query.trim());
    const regex = new RegExp(safeQuery, "i");

    const filters = { isActive: true };

    if (/^\d{10}$/.test(query.trim())) {
      filters.$or = [{ phone: query.trim() }, { email: regex }, { name: regex }];
    } else if (query.includes("@")) {
      filters.$or = [{ email: regex }, { name: regex }, { phone: regex }];
    } else {
      filters.$or = [{ name: regex }, { email: regex }, { phone: regex }];
    }

    const employees = await User.find(filters)
      .select("name email phone address position dateOfBirth dateOfJoining role")
      .sort({ name: 1 })
      .limit(50);

    return res.status(200).json(employees);
  } catch (error) {
    console.error("searchEmployeesForAdmin error:", error);
    return res.status(500).json({ message: "Failed to search employees", error: error.message });
  }
};
