import { startOfDay, endOfDay, format, startOfYear, endOfYear, differenceInCalendarDays } from "date-fns";
import Attendance from "../models/Attendance.js";
import Leave from "../models/Leave.js";
import User from "../models/User.js";
import Holiday from "../models/Holiday.js";
import { createNotification } from "./notificationController.js";
import { sendMail } from "../utils/sendMail.js";

const getIndiaDayRange = (date = new Date()) => {
  const istOffset = 5.5 * 60; // minutes
  const local = new Date(date.getTime() + date.getTimezoneOffset() * 60000); // convert to UTC
  const ist = new Date(local.getTime() + istOffset * 60000); // IST time
  const start = startOfDay(ist);
  const end = endOfDay(ist);
  return { start, end };
};

export const getDashboard = async (req, res) => {
  try {
    const userId = req.user._id;

    const employeesCount = await User.countDocuments({ role: "employee" });
    const leadersCount = await User.countDocuments({ role: "leader" });

    // Today's attendance status
    const now = new Date();
    const { start: todayStart, end: todayEnd } = getIndiaDayRange(now);
    const todayAttendance = await Attendance.findOne({
      user: userId,
      date: { $gte: todayStart, $lte: todayEnd },
    });
    const todayStatus = todayAttendance
      ? todayAttendance.checkIn
        ? "Checked In"
        : "Absent"
      : "Not Checked In";

    res.status(200).json({
      userName: req.user.name,
      employeesCount,
      leadersCount,
      todayStatus,
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ message: "Failed to fetch dashboard data" });
  }
};

export const getMyProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user);
  } catch (error) {
    console.error("getMyProfile error:", error);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
};

export const updateMyProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const updates = {};
    const allowedFields = ["phone", "address", "dateOfBirth", "bankIFSC", "bankAccountNumber"];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (field.startsWith("bank")) {
          updates[`documents.${field}`] = req.body[field];
        } else {
          updates[field] = req.body[field];
        }
      }
    });

    if (req.uploadedUrls) {
      Object.keys(req.uploadedUrls).forEach((key) => {
        updates[`documents.${key}.path`] = req.uploadedUrls[key];
        updates[`documents.${key}.verified`] = false;
        updates[`documents.${key}.uploadedAt`] = new Date();
      });
    }

    const user = await User.findByIdAndUpdate(userId, updates, { new: true }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ message: "Profile updated successfully", user });
  } catch (error) {
    console.error("updateMyProfile error:", error);
    res.status(500).json({ message: "Failed to update profile", error: error.message });
  }
};

export const checkIn = async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const nowIST = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    const { start: todayStart, end: todayEnd } = getIndiaDayRange(now);

    let attendance = await Attendance.findOne({
      user: userId,
      date: { $gte: todayStart, $lte: todayEnd },
    });

    if (attendance && attendance.checkIn) {
      return res.status(400).json({ message: "Already checked in today" });
    }

    if (!attendance) {
      attendance = new Attendance({
        user: userId,
        date: todayStart,
        status: "Present",
      });
    }

    attendance.checkIn = now.toISOString();

    // Check for approved half-day leave today
    const approvedHalfDayLeave = await Leave.findOne({
      user: userId,
      status: "Approved",
      halfDay: true,
      fromDate: { $lte: todayEnd },
      toDate: { $gte: todayStart },
    });

    const istHours = nowIST.getHours();
    const istMinutes = nowIST.getMinutes();
    const checkInTotalMinutes = istHours * 60 + istMinutes;

    if (approvedHalfDayLeave) {
      attendance.status = "Half Day (Approved)";
      attendance.attendance_status = "Half Day (Approved)";
      if (approvedHalfDayLeave.halfDayType === "first_half") {
        const threshold = 14 * 60 + 30; // 2:30 PM
        if (checkInTotalMinutes > threshold) {
          attendance.is_late = true;
          attendance.late_minutes = checkInTotalMinutes - threshold;
        } else {
          attendance.is_late = false;
          attendance.late_minutes = 0;
        }
      } else { // second_half
        const threshold = 10 * 60; // 10:00 AM
        if (checkInTotalMinutes > threshold) {
          attendance.is_late = true;
          attendance.late_minutes = checkInTotalMinutes - threshold;
        } else {
          attendance.is_late = false;
          attendance.late_minutes = 0;
        }
      }
    } else {
      // Normal shift
      const threshold = 10 * 60; // 10:00 AM
      if (checkInTotalMinutes <= threshold) {
        attendance.is_late = false;
        attendance.late_minutes = 0;
        attendance.status = "Present";
        attendance.attendance_status = "On Time";
      } else {
        attendance.is_late = true;
        attendance.late_minutes = checkInTotalMinutes - threshold;
        attendance.status = "Late";
        attendance.attendance_status = "Late";
      }
    }

    await attendance.save();

    res.status(200).json(attendance);
  } catch (err) {
    console.error("Check-in error:", err);
    res.status(500).json({ message: "Failed to check in" });
  }
};

export const checkOut = async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const nowIST = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    const { start: todayStart, end: todayEnd } = getIndiaDayRange(now);

    const attendance = await Attendance.findOne({
      user: userId,
      date: { $gte: todayStart, $lte: todayEnd },
    });

    if (!attendance || !attendance.checkIn) {
      return res.status(400).json({ message: "Please check in first" });
    }

    if (!attendance.checkOut) {
      attendance.checkOut = now.toISOString();

      const day = new Date(now);
      const holidayStart = new Date(day);
      holidayStart.setHours(0, 0, 0, 0);
      const holidayEnd = new Date(day);
      holidayEnd.setHours(23, 59, 59, 999);

      const isCustomHoliday = await Holiday.exists({
        date: { $gte: holidayStart, $lte: holidayEnd },
      });
      const isWeekend = [0, 6].includes(holidayStart.getDay());
      const isHoliday = !!isCustomHoliday || isWeekend;

      if (isHoliday && (attendance.checkIn || attendance.checkOut)) {
        attendance.status = "Over-time";
        attendance.attendance_status = "Over-time";
      } else if (!attendance.status || attendance.status === "Present" || attendance.status === "Absent") {
        attendance.status = "Present";
      }

      // Check for approved half-day leave today
      const approvedHalfDayLeave = await Leave.findOne({
        user: userId,
        status: "Approved",
        halfDay: true,
        fromDate: { $lte: todayEnd },
        toDate: { $gte: todayStart },
      });

      const istHours = nowIST.getHours();
      const istMinutes = nowIST.getMinutes();
      const checkOutTotalMinutes = istHours * 60 + istMinutes;

      if (!isHoliday) {
        if (approvedHalfDayLeave) {
          attendance.status = "Half Day (Approved)";
          attendance.attendance_status = "Half Day (Approved)";
          if (approvedHalfDayLeave.halfDayType === "second_half") {
            // Expected checkout: 2:00 PM (14:00)
            const threshold = 14 * 60;
            if (checkOutTotalMinutes < threshold) {
              attendance.is_early_checkout = true;
              attendance.early_checkout_minutes = threshold - checkOutTotalMinutes;
            } else {
              attendance.is_early_checkout = false;
              attendance.early_checkout_minutes = 0;
            }
          } else { // first_half
            // Expected checkout: 6:30 PM (18:30)
            const threshold = 18 * 60 + 30;
            if (checkOutTotalMinutes < threshold) {
              attendance.is_early_checkout = true;
              attendance.early_checkout_minutes = threshold - checkOutTotalMinutes;
            } else {
              attendance.is_early_checkout = false;
              attendance.early_checkout_minutes = 0;
            }
          }
        } else {
          // No approved half-day leave today
          const endOfDayMinutes = 18 * 60 + 30; // 6:30 PM
          if (checkOutTotalMinutes < endOfDayMinutes) {
            attendance.is_early_checkout = true;
            attendance.early_checkout_minutes = endOfDayMinutes - checkOutTotalMinutes;

            // Check if checkout is between 2:00 PM and 2:30 PM (14:00 and 14:30)
            if (checkOutTotalMinutes >= 14 * 60 && checkOutTotalMinutes <= 14 * 60 + 30) {
              attendance.status = "Half Day (Unapproved)";
              attendance.attendance_status = "Half Day (Unapproved)";
            } else {
              attendance.status = "Early Checkout";
              attendance.attendance_status = "Early Checkout";
            }
          } else {
            attendance.is_early_checkout = false;
            attendance.early_checkout_minutes = 0;
          }
        }
      }

      await attendance.save();
    }

    res.status(200).json(attendance);
  } catch (err) {
    console.error("Check-out error:", err);
    res.status(500).json({ message: "Failed to check out" });
  }
};

export const getAttendance = async (req, res) => {
  try {
    const userId = req.user._id;
    const { date, start, end } = req.query;

    let records;
    if (date) {
      const day = new Date(date);
      const startDay = new Date(day);
      startDay.setHours(0, 0, 0, 0);
      const endDay = new Date(day);
      endDay.setHours(23, 59, 59, 999);

      records = await Attendance.find({
        user: userId,
        date: { $gte: startDay, $lte: endDay },
      });
      return res.status(200).json(records[0] || null);
    } else if (start && end) {
      const startDate = new Date(start);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(end);
      endDate.setHours(23, 59, 59, 999);

      records = await Attendance.find({
        user: userId,
        date: { $gte: startDate, $lte: endDate },
      });
      const formattedRecords = {};
      records.forEach((rec) => {
        const recordDate = rec.date instanceof Date ? rec.date : new Date(rec.date);
        const dateStr = format(recordDate, "yyyy-MM-dd");
        formattedRecords[dateStr] = {
          checkIn: rec.checkIn || null,
          checkOut: rec.checkOut || null,
          status: rec.status || (rec.checkIn ? "Present" : "Absent"),
        };
      });
      return res.status(200).json(formattedRecords);
    }
    return res.status(400).json({ message: "Invalid query parameters" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch attendance" });
  }
};

export const applyLeave = async (req, res) => {
  try {
    const { reason, fromDate, toDate, halfDay, halfDayType } = req.body;
    const userId = req.user._id;

    if (!reason || !fromDate || !toDate) {
      return res.status(400).json({ message: "reason, fromDate and toDate are required" });
    }

    const from = new Date(fromDate);
    const to = new Date(toDate);
    if (to < from) {
      return res.status(400).json({ message: "toDate cannot be before fromDate" });
    }

    const oneDay = 1000 * 60 * 60 * 24;
    let totalDays = Math.floor((to - from) / oneDay) + 1;
    if (halfDay) {
      totalDays = 0.5;
    }

    const leave = await Leave.create({
      user: userId,
      reason,
      fromDate: from,
      toDate: to,
      totalDays,
      halfDay: !!halfDay,
      halfDayType: halfDay ? halfDayType : null,
    });

    await createNotification({
      message: `${req.user.name} applied for leave from ${new Date(from).toLocaleDateString()} to ${new Date(to).toLocaleDateString()} (${totalDays} days)`,
      role: "admin",
      triggeredBy: userId,
    });

    return res.status(201).json(leave);
  } catch (error) {
    console.error("applyLeave error:", error);
    return res.status(500).json({ message: "Error applying leave", error: error.message });
  }
};

export const getMyLeaves = async (req, res) => {
  try {
    const userId = req.user._id;
    const leaves = await Leave.find({ user: userId }).sort({ appliedAt: -1 });
    const user = await User.findById(userId).select('leaveAllowance');
    const leaveAllowance = user?.leaveAllowance || 12;

    return res.status(200).json({ leaves, leaveAllowance });
  } catch (error) {
    console.error("getMyLeaves error:", error);
    return res.status(500).json({ message: "Error fetching leaves", error: error.message });
  }
};

// HR specific: Manage all attendance for employees and leaders
export const getAllAttendance = async (req, res) => {
  try {
    const { date } = req.query;
    let targetDate = date ? new Date(date) : new Date();
    const { start: startDay, end: endDay } = getIndiaDayRange(targetDate);

    const users = await User.find({ role: { $in: ["employee", "leader"] } }).select("name email role position");
    const records = await Attendance.find({ date: { $gte: startDay, $lte: endDay } });

    const attendanceMap = {};
    records.forEach(r => { attendanceMap[r.user.toString()] = r; });

    const result = users.map(user => {
      const attendance = attendanceMap[user._id.toString()];
      return {
        user,
        status: attendance?.status || "Absent",
        checkIn: attendance?.checkIn || null,
        checkOut: attendance?.checkOut || null,
      };
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("getAllAttendance error:", error);
    res.status(500).json({ message: "Failed to fetch attendance records" });
  }
};

// HR specific: Manage all leaves for employees
export const getAllLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find()
      .populate("user", "name role")
      .sort({ appliedAt: -1 });
    
    // Filter out leaves that don't belong to employees (or leaders)
    // The user requested: "all the news schedule dead or taken by the employees"
    const employeeLeaves = leaves.filter(l => l.user && l.user.role === "employee");

    res.status(200).json(employeeLeaves);
  } catch (error) {
    console.error("getAllLeaves error:", error);
    res.status(500).json({ message: "Failed to fetch leave requests" });
  }
};

export const updateLeaveStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!["Approved", "Rejected", "Pending"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const leave = await Leave.findByIdAndUpdate(id, { status }, { new: true }).populate("user", "name role");
    if (!leave) return res.status(404).json({ message: "Leave request not found" });

    // notify the user
    await createNotification({
      message: `Your leave request has been ${status.toLowerCase()} by HR`,
      role: leave.user.role || "employee",
      recipient: leave.user._id,
      triggeredBy: req.user._id,
    });

    res.status(200).json(leave);
  } catch (error) {
    console.error("updateLeaveStatus error:", error);
    res.status(500).json({ message: "Failed to update leave status" });
  }
};

export const getAllUsersForEmails = async (req, res) => {
  try {
    const users = await User.find({ role: { $in: ["employee", "leader", "hr"] } })
      .select("name email role position")
      .sort({ name: 1 });
    res.status(200).json(users);
  } catch (error) {
    console.error("getAllUsersForEmails error:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

export const sendLetterEmail = async (req, res) => {
  try {
    const { email, subject, body } = req.body;
    const file = req.file;

    if (!email || !subject || !file) {
      return res.status(400).json({ message: "Email, subject, and file are required" });
    }

    const attachment = {
      filename: file.originalname || "Letter.pdf",
      content: file.buffer,
    };

    await sendMail(email, subject, body || "Please find the attached letter.", "", [attachment]);

    res.status(200).json({ message: "Letter sent successfully via email" });
  } catch (error) {
    console.error("sendLetterEmail error:", error);
    res.status(500).json({ message: "Failed to send email" });
  }
};

// ---------------- Contact Employee Search (HR View) ----------------
const escapeRegexHR = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const searchEmployeesForHR = async (req, res) => {
  try {
    const { query = "" } = req.query;

    if (!query.trim()) {
      return res.status(400).json({ message: "Search query is required" });
    }

    const safeQuery = escapeRegexHR(query.trim());
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
    console.error("searchEmployeesForHR error:", error);
    return res.status(500).json({ message: "Failed to search employees", error: error.message });
  }
};
