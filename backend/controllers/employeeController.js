import { startOfDay, endOfDay, format, startOfYear, endOfYear, differenceInCalendarDays } from "date-fns";
import Attendance from "../models/Attendance.js";
import Team from "../models/Team.js";
import Project from "../models/Project.js";
import Task from "../models/Task.js";
import Leave from "../models/Leave.js";
import User from "../models/User.js";
import { sendMail } from "../config/nodemailer.js";
import Holiday from "../models/Holiday.js";
import { createNotification } from "./notificationController.js";

// ---------------- Celebrations ------------------
// Helpers to compute today's IST date parts and query users
const getTodayISTParts = () => {
  const istDate = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
  );
  return {
    day: istDate.getDate(),
    month: istDate.getMonth() + 1,
  };
};

const fetchCelebrationsForField = async (field, day, month) => {
  const query = {
    [field]: { $ne: null },
    isActive: true,
    $expr: {
      $and: [
        { $eq: [{ $dayOfMonth: `$${field}` }, day] },
        { $eq: [{ $month: `$${field}` }, month] },
      ],
    },
  };

  return User.find(query)
    .select("name email role dateOfBirth dateOfJoining")
    .sort({ name: 1 })
    .lean()
    .exec();
};

// GET /api/employee/celebrations/today
export const getTodayCelebrations = async (_req, res) => {
  try {
    const { day, month } = getTodayISTParts();

    const [birthdays, workAnniversaries] = await Promise.all([
      fetchCelebrationsForField("dateOfBirth", day, month),
      fetchCelebrationsForField("dateOfJoining", day, month),
    ]);

    res.status(200).json({
      birthdays: birthdays.map((person) => ({
        id: person._id,
        name: person.name,
        email: person.email,
        role: person.role,
        date: person.dateOfBirth,
      })),
      workAnniversaries: workAnniversaries.map((person) => ({
        id: person._id,
        name: person.name,
        email: person.email,
        role: person.role,
        date: person.dateOfJoining,
      })),
      marriageAnniversaries: [],
    });
  } catch (error) {
    console.error("getTodayCelebrations error:", error);
    res.status(500).json({ message: "Failed to fetch today's celebrations" });
  }
};

// ---------------- Attendance ------------------
// Helper: get IST start/end of the given day
const getIndiaDayRange = (date = new Date()) => {
  const istOffset = 5.5 * 60; // minutes
  const local = new Date(date.getTime() + date.getTimezoneOffset() * 60000); // convert to UTC
  const ist = new Date(local.getTime() + istOffset * 60000); // IST time
  const start = startOfDay(ist);
  const end = endOfDay(ist);
  return { start, end };
};

const escapeRegex = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Check-in
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
      // determine if today is a holiday (custom or weekend)
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

      // Always create attendance as Present on check-in; we'll mark Over-time on check-out if applicable
      attendance = new Attendance({
        user: userId,
        date: todayStart,
        status: "Present",
      });
    }

    attendance.checkIn = now.toISOString();
    await attendance.save();

    // Notify admins about check-in
    await createNotification({
      message: `${req.user.name} has checked in at ${format(nowIST, 'hh:mm a')}`,
      role: "admin",
      triggeredBy: userId,
    });

    // Notify reporting manager if exists
    if (req.user.reportingManager) {
      await createNotification({
        message: `${req.user.name} has checked in at ${format(nowIST, 'hh:mm a')}`,
        role: "leader",
        recipient: req.user.reportingManager,
        triggeredBy: userId,
      });
    }

    res.status(200).json(attendance);
  } catch (err) {
    console.error("Check-in error:", err);
    res.status(500).json({ message: "Failed to check in" });
  }
};

// Check-out
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

    // If already checked out, ignore
    if (!attendance.checkOut) {
      attendance.checkOut = now.toISOString();

      // If the day is a holiday and the user has both checkIn/checkOut, mark Over-time
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
      } else if (!attendance.status) {
        attendance.status = attendance.checkIn ? "Present" : "Absent";
      }

      await attendance.save();

      // Notify admins about check-out
      await createNotification({
        message: `${req.user.name} has checked out at ${format(nowIST, 'hh:mm a')}`,
        role: "admin",
        triggeredBy: userId,
      });

      // Notify reporting manager if exists
      if (req.user.reportingManager) {
        await createNotification({
          message: `${req.user.name} has checked out at ${format(nowIST, 'hh:mm a')}`,
          role: "leader",
          recipient: req.user.reportingManager,
          triggeredBy: userId,
        });
      }
    }

    res.status(200).json(attendance);
  } catch (err) {
    console.error("Check-out error:", err);
    res.status(500).json({ message: "Failed to check out" });
  }
};

// Get attendance
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
    } else if (start && end) {
      const startDate = new Date(start);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(end);
      endDate.setHours(23, 59, 59, 999);

      records = await Attendance.find({
        user: userId,
        date: { $gte: startDate, $lte: endDate },
      });
    } else {
      return res.status(400).json({ message: "Invalid query parameters" });
    }

    // Map attendance by date
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

    // If single date query, return single object
    if (date) {
      const singleRecord = records[0] || null;
      return res.status(200).json(singleRecord);
    }

    return res.status(200).json(formattedRecords);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch attendance" });
  }
};

// teams
// GET /api/employee/teams
export const getMyTeams = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find teams where this employee is a member
    const teams = await Team.find({ members: userId })
      .populate("leader", "name email")
      .populate("members", "name email");

    res.status(200).json(teams);
  } catch (err) {
    console.error("Error fetching employee teams:", err);
    res.status(500).json({ message: "Failed to fetch teams" });
  }
};

// projects
// Get projects assigned to the logged-in employee
export const getProjectsForEmployee = async (req, res) => {
  try {
    const employeeId = req.user._id; // assuming you have auth middleware setting req.user
    const projects = await Project.find({
      assignedTeams: { $in: await getEmployeeTeams(employeeId) },
    }).populate("assignedTeams", "name");
    res.status(200).json(projects);
  } catch (err) {
    console.error("Failed to fetch employee projects:", err);
    res.status(500).json({ message: "Failed to fetch projects" });
  }
};

// Helper: get teams where employee belongs
const getEmployeeTeams = async (employeeId) => {
  const teams = await Team.find({ members: employeeId }).select("_id");
  return teams.map((t) => t._id);
};

// tasks
// GET tasks assigned to logged-in employee
export const getMyTasks = async (req, res) => {
  try {
    const userId = req.user._id;
    const tasks = await Task.find({ assignedTo: userId })
      .populate("assignedBy", "name email")
      .populate("project", "name")
      .sort({ createdAt: -1 });

    res.status(200).json(tasks);
  } catch (error) {
    console.error("Error fetching employee tasks:", error);
    res.status(500).json({ message: "Failed to fetch tasks" });
  }
};

// update task status
export const updateTaskStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    const { taskId } = req.params;
    const { status } = req.body;

    // Employees cannot set "Delayed" manually; it's computed from completedAt vs deadline
    if (!["Pending", "In Progress", "Completed"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    // Ensure the employee owns this task
    const task = await Task.findOne({ _id: taskId, assignedTo: userId });
    if (!task) return res.status(404).json({ message: "Task not found" });

    // Apply status change
    task.status = status;
    if (status === "Completed") {
      task.completedAt = new Date();
      if (req.body.completionDescription) {
        task.completionDescription = req.body.completionDescription;
      }
      if (req.body.deployedLink) {
        task.deployedLink = req.body.deployedLink;
      }
    } else {
      // If reverting from Completed, clear completion time so UI shows '-' again
      task.completedAt = undefined;
      task.completionDescription = undefined;
      task.deployedLink = undefined;
    }

    await task.save();

    // Notify leader about task status update
    const taskWithAssigner = await Task.findById(taskId).populate('assignedBy', 'name role');
    if (taskWithAssigner && taskWithAssigner.assignedBy) {
      await createNotification({
        message: `${req.user.name} updated task "${task.description}" status to ${status}`,
        role: "leader",
        recipient: taskWithAssigner.assignedBy._id,
        triggeredBy: userId,
      });
    }

    res.status(200).json({ message: "Task status updated", task });
  } catch (error) {
    console.error("Error updating task status:", error);
    res.status(500).json({ message: "Failed to update task status" });
  }
};

// leaves
// POST /api/employee/leave/apply
export const applyLeave = async (req, res) => {
  try {
    const { reason, fromDate, toDate } = req.body;
    const userId = req.user._id;

    if (!reason || !fromDate || !toDate) {
      return res
        .status(400)
        .json({ message: "reason, fromDate and toDate are required" });
    }

    const from = new Date(fromDate);
    const to = new Date(toDate);
    if (isNaN(from) || isNaN(to)) {
      return res.status(400).json({ message: "Invalid date(s) provided" });
    }
    if (to < from) {
      return res
        .status(400)
        .json({ message: "toDate cannot be before fromDate" });
    }

    // calculate inclusive days
    const oneDay = 1000 * 60 * 60 * 24;
    const totalDays = Math.floor((to - from) / oneDay) + 1;

    const leave = await Leave.create({
      user: userId,
      reason,
      fromDate: from,
      toDate: to,
      totalDays,
    });

    // Notify all admins about new leave application
    await createNotification({
      message: `${req.user.name} applied for leave from ${new Date(from).toLocaleDateString()} to ${new Date(to).toLocaleDateString()} (${totalDays} days)`,
      role: "admin",
      triggeredBy: userId,
    });

    // Send email notification to all admins
    const admins = await User.find({ role: "admin" });
    const htmlContent = `
    <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>New Leave Application</title>
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
                A new leave application has been submitted by <strong>${req.user.name}</strong> (${req.user.email}).
              </p>

              <div style="background-color:#f9f9f9; padding:20px; border-radius:8px; margin:20px 0; text-align:left;">
                <h3 style="margin:0 0 15px 0; color:#0EA6F0; font-size:18px;">Leave Details:</h3>
                <p style="margin:5px 0; font-size:14px;"><strong>From:</strong> ${fromDate}</p>
                <p style="margin:5px 0; font-size:14px;"><strong>To:</strong> ${toDate}</p>
                <p style="margin:5px 0; font-size:14px;"><strong>Total Days:</strong> ${totalDays}</p>
                <p style="margin:5px 0; font-size:14px;"><strong>Reason:</strong> ${reason}</p>
              </div>

              <p style="font-size:14px; color:#777; margin-top:20px;">
                Please review the application in the admin panel.
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
    admins.forEach(async (admin) => {
      await sendMail(
        admin.email,
        "New Leave Application Submitted",
        "",
        htmlContent
      );
    });

    return res.status(201).json(leave);
  } catch (error) {
    console.error("applyLeave error:", error);
    return res
      .status(500)
      .json({ message: "Error applying leave", error: error.message });
  }
};

// GET /api/employee/leave/my
export const getMyLeaves = async (req, res) => {
  try {
    const userId = req.user._id;
    const leaves = await Leave.find({ user: userId }).sort({ appliedAt: -1 });

    // Get user's leave allowance
    const user = await User.findById(userId).select('leaveAllowance');
    const leaveAllowance = user?.leaveAllowance || 12;

    // Compute approved used days within current year only
    const yearStart = startOfYear(new Date());
    const yearEnd = endOfYear(new Date());
    let approvedUsedDays = 0;
    for (const l of leaves) {
      if (!l || (l.status || '').toString() !== 'Approved') continue;
      const from = l.fromDate instanceof Date ? l.fromDate : new Date(l.fromDate);
      const to = l.toDate instanceof Date ? l.toDate : new Date(l.toDate);
      if (isNaN(from) || isNaN(to)) continue;
      const start = from > yearStart ? from : yearStart;
      const end = to < yearEnd ? to : yearEnd;
      if (end < start) continue;
      approvedUsedDays += differenceInCalendarDays(end, start) + 1;
    }

    const paidUsedDays = Math.min(approvedUsedDays, leaveAllowance);
    const unpaidUsedDays = Math.max(0, approvedUsedDays - leaveAllowance);

    return res.status(200).json({ leaves, leaveAllowance, approvedUsedDays, paidUsedDays, unpaidUsedDays });
  } catch (error) {
    console.error("getMyLeaves error:", error);
    return res
      .status(500)
      .json({ message: "Error fetching leaves", error: error.message });
  }
};

// Public (for authenticated employee/leader) holidays listing for a range
export const getHolidaysForEmployee = async (req, res) => {
  try {
    const { start, end } = req.query;
    const toDateOnly = (value) => {
      const date = new Date(value);
      date.setHours(0, 0, 0, 0);
      return date;
    };

    const startDate = start ? toDateOnly(start) : null;
    const endDate = end ? toDateOnly(end) : null;

    const query = {};
    if (startDate && endDate) query.date = { $gte: startDate, $lte: endDate };
    else if (startDate) query.date = { $gte: startDate };
    else if (endDate) query.date = { $lte: endDate };

    const customHolidays = await Holiday.find(query).sort({ date: 1 }).lean();

    // include weekends as holidays
    const weekendEntries = [];
    const targetStart = startDate || new Date();
    const targetEnd = endDate || new Date(targetStart.getFullYear(), targetStart.getMonth() + 6, 0);
    const cursor = new Date(targetStart);
    cursor.setHours(0, 0, 0, 0);

    while (cursor <= targetEnd) {
      const day = cursor.getDay();
      if (day === 0 || day === 6) {
        weekendEntries.push({ date: new Date(cursor), description: "Weekend Off", type: "WEEKEND" });
      }
      cursor.setDate(cursor.getDate() + 1);
    }

    const all = [...customHolidays, ...weekendEntries];
    all.sort((a, b) => new Date(a.date) - new Date(b.date));

    res.status(200).json(all);
  } catch (err) {
    console.error("getHolidaysForEmployee error:", err);
    res.status(500).json({ message: "Failed to fetch holidays" });
  }
};

// Allow editing reason/from/to only when status is Pending and owned by user
export const updateMyLeave = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const { reason, fromDate, toDate } = req.body;

    const leave = await Leave.findById(id);
    if (!leave) return res.status(404).json({ message: "Leave not found" });

    if (String(leave.user) !== String(userId)) {
      return res
        .status(403)
        .json({ message: "Not allowed to edit this leave" });
    }

    if (leave.status !== "Pending") {
      return res
        .status(400)
        .json({ message: "Only pending leaves can be edited" });
    }

    if (reason) leave.reason = reason;
    if (fromDate) leave.fromDate = new Date(fromDate);
    if (toDate) leave.toDate = new Date(toDate);

    // re-calc totalDays if dates changed or set
    if (leave.fromDate && leave.toDate) {
      const oneDay = 1000 * 60 * 60 * 24;
      const totalDays =
        Math.floor(
          (new Date(leave.toDate) - new Date(leave.fromDate)) / oneDay
        ) + 1;
      leave.totalDays = totalDays > 0 ? totalDays : 0;
    }

    await leave.save();
    return res.status(200).json(leave);
  } catch (error) {
    console.error("updateMyLeave error:", error);
    return res
      .status(500)
      .json({ message: "Error updating leave", error: error.message });
  }
};

// Contact employees search
export const searchEmployeesForEmployee = async (req, res) => {
  try {
    const { query = "" } = req.query;

    if (!query.trim()) {
      return res
        .status(400)
        .json({ message: "Search query is required to lookup employees" });
    }

    const safeQuery = escapeRegex(query.trim());
    const regex = new RegExp(safeQuery, "i");
    const filters = { role: { $in: ["employee", "leader"] } };

    if (/^\d{10}$/.test(query.trim())) {
      filters.$or = [{ phone: query.trim() }, { email: regex }, { name: regex }];
    } else if (query.includes("@")) {
      filters.$or = [{ email: regex }, { name: regex }, { phone: regex }];
    } else {
      filters.$or = [{ name: regex }, { email: regex }, { phone: regex }];
    }

    const employees = await User.find(filters)
      .select(
        "name email phone address position dateOfBirth dateOfJoining"
      )
      .limit(25)
      .sort({ name: 1 });

    return res.status(200).json(employees);
  } catch (error) {
    console.error("searchEmployeesForEmployee error:", error);
    return res
      .status(500)
      .json({ message: "Failed to search employees", error: error.message });
  }
};

// dashboard summary
export const getDashboard = async (req, res) => {
  try {
    const userId = req.user._id;

    // Count tasks assigned
    const tasksAssigned = await Task.countDocuments({ assignedTo: userId });

    // Count teams where employee is member
    const teamsCount = await Team.countDocuments({ members: userId });

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
      employeeName: req.user.name,
      tasksAssigned,
      teamsCount,
      todayStatus,
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ message: "Failed to fetch dashboard data" });
  }
};

// ---------------- Profile ------------------
export const getMyProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId)
      .select("-password")
      .populate("reportingManager", "name email")
      .populate("technicalReporting", "name email")
      .populate("administrativeReporting", "name email");
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
    const existingUser = await User.findById(userId);
    if (!existingUser) return res.status(404).json({ message: "User not found" });

    const updates = {};
    const allowedFields = ["phone", "address", "dateOfBirth"];

    // Handle text fields
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // Marital fields
    if (req.body.isMarried !== undefined) {
      const isMarriedBool = String(req.body.isMarried).toLowerCase() === "true";
      updates.isMarried = isMarriedBool;
      if (!isMarriedBool) {
        // If not married, clear anniversary
        updates.marriageAnniversary = null;
      }
    }
    if (req.body.marriageAnniversary !== undefined) {
      const raw = req.body.marriageAnniversary;
      if (raw === "" || raw === null) {
        updates.marriageAnniversary = null;
      } else {
        const ann = new Date(raw);
        if (isNaN(ann)) {
          return res.status(400).json({ message: "Invalid marriageAnniversary date" });
        }
        updates.marriageAnniversary = ann;
        // Ensure isMarried defaults to true when a date is set and flag wasn't provided
        if (updates.isMarried === undefined && req.body.isMarried === undefined) {
          updates.isMarried = true;
        }
      }
    }

    // Handle bank details
    if (req.body.bankIFSC) updates["documents.bankIFSC"] = req.body.bankIFSC;
    if (req.body.bankAccountNumber)
      updates["documents.bankAccountNumber"] = req.body.bankAccountNumber;

    // Handle uploaded files - check if document is verified
    if (req.uploadedUrls) {
      const verifiedDocuments = [];

      for (const key of Object.keys(req.uploadedUrls)) {
        if (existingUser.documents && existingUser.documents[key] && existingUser.documents[key].verified) {
          verifiedDocuments.push(key);
        }
      }

      if (verifiedDocuments.length > 0) {
        return res.status(403).json({
          message: `Cannot update verified document(s): ${verifiedDocuments.join(", ")}. Please contact admin to unverify the document(s) before updating.`,
          verifiedDocuments
        });
      }

      Object.keys(req.uploadedUrls).forEach((key) => {
        updates[`documents.${key}.path`] = req.uploadedUrls[key];
        updates[`documents.${key}.verified`] = false; // Reset verification
        updates[`documents.${key}.uploadedAt`] = new Date();
      });
    }

    const user = await User.findByIdAndUpdate(userId, updates, {
      new: true,
    }).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });

    // Check if profile is verified (all document fields that have paths are verified)
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

    // If any document was updated, send email to admins
    if (req.uploadedUrls && Object.keys(req.uploadedUrls).length > 0) {
      const admins = await User.find({ role: "admin" });
      const updatedDocs = Object.keys(req.uploadedUrls).join(", ");
      const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
          <title>Profile Documents Updated</title>
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
                        Profile documents have been updated by <strong>${user.name}</strong> (${user.email}).
                      </p>
                      <div style="background-color:#f9f9f9; padding:20px; border-radius:8px; margin:20px 0; text-align:left;">
                        <h3 style="margin:0 0 15px 0; color:#0EA6F0; font-size:18px;">Updated Documents:</h3>
                        <p style="margin:5px 0; font-size:14px;">${updatedDocs}</p>
                      </div>
                      <p style="font-size:14px; color:#777; margin-top:20px;">
                        Please review and verify the documents in the admin panel.
                      </p>
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
      admins.forEach(async (admin) => {
        await sendMail(
          admin.email,
          "Profile Documents Updated - Verification Required",
          "",
          htmlContent
        );
      });
    }

    res.status(200).json({ message: "Profile updated successfully", user });
  } catch (error) {
    console.error("updateMyProfile error:", error);
    res.status(500).json({ message: "Failed to update profile" });
  }
};
