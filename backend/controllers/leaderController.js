// controllers/leaderController.js
import { startOfDay, endOfDay, format } from "date-fns";
import Team from "../models/Team.js";
import Project from "../models/Project.js";
import Attendance from "../models/Attendance.js";
import Task from "../models/Task.js";
import Leave from "../models/Leave.js";
import Holiday from "../models/Holiday.js";
import User from "../models/User.js";
import { sendMail } from "../config/nodemailer.js";
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

// GET /api/leader/celebrations/today
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

// teams
// GET /api/leader/teams
export const getLeaderTeams = async (req, res) => {
  try {
    const leaderId = req.user._id; // leader's ID from auth middleware

    // Find all teams where this user is the leader
    const teams = await Team.find({ leader: leaderId }).populate(
      "members",
      "name email"
    );

    res.status(200).json(teams);
  } catch (err) {
    console.error("Error fetching leader's teams:", err);
    res.status(500).json({ message: "Failed to fetch teams" });
  }
};

// projects
// GET /api/leader/projects
export const getLeaderProjects = async (req, res) => {
  try {
    const leaderId = req.user._id;

    // Find all teams led by this leader
    const leaderTeams = await Team.find({ leader: leaderId }).select("_id");

    const teamIds = leaderTeams.map((t) => t._id);

    // Find projects assigned to any of these teams
    const projects = await Project.find({ assignedTeams: { $in: teamIds } })
      .populate("assignedTeams", "name")
      .sort({ startDate: -1 });

    res.status(200).json(projects);
  } catch (err) {
    console.error("Error fetching leader projects:", err);
    res.status(500).json({ message: "Failed to fetch leader projects." });
  }
};

// attendance
// Helper: IST start/end of day
const getIndiaDayRange = (date = new Date()) => {
  const istOffset = 5.5 * 60;
  const local = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
  const ist = new Date(local.getTime() + istOffset * 60000);
  return { start: startOfDay(ist), end: endOfDay(ist) };
};

// Check-in
export const leaderCheckIn = async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const { start: todayStart, end: todayEnd } = getIndiaDayRange(now);

    let attendance = await Attendance.findOne({
      user: userId,
      date: { $gte: todayStart, $lte: todayEnd },
    });
    if (attendance?.checkIn)
      return res.status(400).json({ message: "Already checked in today" });

    if (!attendance)
      {
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

        // Create attendance as Present on check-in; convert to Over-time on check-out if required
        attendance = new Attendance({
          user: userId,
          date: todayStart,
          status: "Present",
        });
      }
    attendance.checkIn = now.toISOString();
    await attendance.save();
    res.status(200).json(attendance);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to check in" });
  }
};

// Check-out
export const leaderCheckOut = async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const { start: todayStart, end: todayEnd } = getIndiaDayRange(now);

    const attendance = await Attendance.findOne({
      user: userId,
      date: { $gte: todayStart, $lte: todayEnd },
    });
    if (!attendance?.checkIn)
      return res.status(400).json({ message: "Please check in first" });

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
      } else if (!attendance.status) {
        attendance.status = attendance.checkIn ? "Present" : "Absent";
      }

      await attendance.save();
    }

    res.status(200).json(attendance);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to check out" });
  }
};

// Get attendance
export const getLeaderAttendance = async (req, res) => {
  try {
    const userId = req.user._id;
    const { date, start, end } = req.query;

    let records;
    if (date) {
      const day = new Date(date);
      records = await Attendance.find({
        user: userId,
        date: { $gte: startOfDay(day), $lte: endOfDay(day) },
      });
      return res.status(200).json(records[0] || null);
    } else if (start && end) {
      const startDate = new Date(start);
      const endDate = new Date(end);
      records = await Attendance.find({
        user: userId,
        date: { $gte: startOfDay(startDate), $lte: endOfDay(endDate) },
      });
      const formatted = {};
      records.forEach((rec) => {
        formatted[format(rec.date, "yyyy-MM-dd")] = rec;
      });
      return res.status(200).json(formatted);
    }

    res.status(400).json({ message: "Invalid query" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch attendance" });
  }
};

// TASK MANAGEMENT
// ASSIGN TASK (Leader Only)
// Supports optional deadline (ISO date) passed as `deadline` in request body
export const assignTask = async (req, res) => {
  try {
    const leaderId = req.user._id;
    const { description, assignedTo, projectId, deadline } = req.body;

    // Check if project exists and leader manages it
    const project = await Project.findById(projectId).populate("assignedTeams");
    if (!project) return res.status(404).json({ message: "Project not found" });

    const leaderTeam = await Team.findOne({
      leader: leaderId,
      _id: { $in: project.assignedTeams.map((t) => t._id) },
      members: assignedTo,
    });

    if (!leaderTeam) {
      return res.status(403).json({
        message:
          "You are not managing this project or the employee is not part of your team",
      });
    }

    const taskData = {
      description,
      assignedTo,
      assignedBy: leaderId,
      project: projectId,
    };

    if (deadline) {
      const dl = new Date(deadline);
      if (isNaN(dl.getTime())) {
        return res.status(400).json({ message: "Invalid deadline" });
      }
      taskData.deadline = dl;
    }

    const task = await Task.create(taskData);

    // Notify the employee about task assignment
    await createNotification({
      message: `New task assigned: ${description}${deadline ? ` (Deadline: ${new Date(deadline).toLocaleDateString()})` : ''}`,
      role: "employee",
      recipient: assignedTo,
      triggeredBy: leaderId,
    });

    res.status(201).json({ message: "Task assigned successfully", task });
  } catch (error) {
    console.error("Error assigning task:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// GET TASKS ASSIGNED BY LEADER
export const getTasksAssignedByLeader = async (req, res) => {
  try {
    const leaderId = req.user._id;
    const tasks = await Task.find({ assignedBy: leaderId })
      .populate("assignedTo", "name email")
      .populate("project", "name");

    res.status(200).json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// GET TEAM MEMBERS FOR A PROJECT
export const getTeamMembersByProject = async (req, res) => {
  try {
    const leaderId = req.user._id;
    const { projectId } = req.query;

    if (!projectId)
      return res.status(400).json({ message: "ProjectId is required" });

    const project = await Project.findById(projectId).populate("assignedTeams");
    if (!project) return res.status(404).json({ message: "Project not found" });

    const teams = await Team.find({
      leader: leaderId,
      _id: { $in: project.assignedTeams },
    }).populate("members", "name email");

    const members = teams.flatMap((t) => t.members);
    res.status(200).json(members);
  } catch (error) {
    console.error("Error fetching team members:", error);
    res.status(500).json({ message: "Failed to fetch team members" });
  }
};

// LEAVE MANAGEMENT
// POST /api/leader/leave/apply
export const applyLeaderLeave = async (req, res) => {
  try {
    const { reason, fromDate, toDate } = req.body;
    const leaderId = req.user._id;

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
      user: leaderId,
      reason,
      fromDate: from,
      toDate: to,
      totalDays,
    });

    // Notify all admins about new leave application
    await createNotification({
      message: `${req.user.name} applied for leave from ${new Date(from).toLocaleDateString()} to ${new Date(to).toLocaleDateString()} (${totalDays} days)`,
      role: "admin",
      triggeredBy: leaderId,
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
              <h1 style="margin:0; color:#fff; font-size:24px;">DW Innovations Pvt. Ltd.</h1>
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
                &copy; 2025 DW Innovations Pvt. Ltd. All rights reserved.
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
    console.error("applyLeaderLeave error:", error);
    return res
      .status(500)
      .json({ message: "Error applying leave", error: error.message });
  }
};

// GET /api/leader/leave/my
export const getMyLeaderLeaves = async (req, res) => {
  try {
    const leaderId = req.user._id;
    const leaves = await Leave.find({ user: leaderId }).sort({ appliedAt: -1 });

    // Get user's leave allowance
    const user = await User.findById(leaderId).select('leaveAllowance');
    const leaveAllowance = user?.leaveAllowance || 12;

    return res.status(200).json({ leaves, leaveAllowance });
  } catch (error) {
    console.error("getMyLeaderLeaves error:", error);
    return res
      .status(500)
      .json({ message: "Error fetching leaves", error: error.message });
  }
};

// PATCH /api/leader/leave/:id
export const updateMyLeaderLeave = async (req, res) => {
  try {
    const leaderId = req.user._id;
    const { id } = req.params;
    const { reason, fromDate, toDate } = req.body;

    const leave = await Leave.findById(id);
    if (!leave) return res.status(404).json({ message: "Leave not found" });

    if (String(leave.user) !== String(leaderId)) {
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
    console.error("updateMyLeaderLeave error:", error);
    return res
      .status(500)
      .json({ message: "Error updating leave", error: error.message });
  }
};

const escapeRegex = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Contact employees search (leader view)
export const searchEmployeesForLeader = async (req, res) => {
  try {
    const { query = "" } = req.query;

    if (!query.trim()) {
      return res
        .status(400)
        .json({ message: "Search query is required to lookup employees" });
    }

    const safeQuery = escapeRegex(query.trim());
    const regex = new RegExp(safeQuery, "i");

    // Leaders can search for active users in their teams.
    const leaderId = req.user._id;
    const teams = await Team.find({ leader: leaderId })
      .select("members")
      .populate("members", "_id");

    const teamMemberIds = teams.flatMap((team) =>
      team.members.map((member) => member._id)
    );

    if (!teamMemberIds.length) {
      return res.status(200).json([]);
    }

    const filters = {
      _id: { $in: teamMemberIds },
      isActive: true,
    };

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
      .sort({ name: 1 })
      .limit(25);

    return res.status(200).json(employees);
  } catch (error) {
    console.error("searchEmployeesForLeader error:", error);
    return res
      .status(500)
      .json({ message: "Failed to search employees", error: error.message });
  }
};

// DASHBOARD SUMMARY
// GET /api/leader/dashboard
export const getLeaderDashboardSummary = async (req, res) => {
  try {
    const leaderId = req.user._id;

    // Total Team Members
    const teams = await Team.find({ leader: leaderId }).populate("members");
    const teamMembers = teams.reduce(
      (acc, team) => acc + team.members.length,
      0
    );

    // Tasks Assigned
    const tasksCount = await Task.countDocuments({ assignedBy: leaderId });

    // Projects under Leader
    const leaderTeams = await Team.find({ leader: leaderId }).select("_id");
    const teamIds = leaderTeams.map((t) => t._id);
    const projectsCount = await Project.countDocuments({
      assignedTeams: { $in: teamIds },
    });

    res.status(200).json({
      teamMembers,
      tasksAssigned: tasksCount,
      projectsUnderLeader: projectsCount,
      leaderName: req.user.name,
    });
  } catch (err) {
    console.error("Error fetching leader dashboard summary:", err);
    res.status(500).json({ message: "Failed to fetch dashboard summary" });
  }
};

// Get holidays for leader (authenticated endpoint)
export const getHolidaysForLeader = async (req, res) => {
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
    console.error("Error fetching holidays:", err);
    res.status(500).json({ message: "Failed to fetch holidays" });
  }
};

// TEAM ATTENDANCE
// GET /api/leader/team-attendance
export const getTeamAttendance = async (req, res) => {
  try {
    const leaderId = req.user._id;
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    const { start: todayStart, end: todayEnd } = getIndiaDayRange(targetDate);

    // Get all team members
    const teams = await Team.find({ leader: leaderId }).populate(
      "members",
      "name email"
    );
    const memberMap = new Map();
    teams.forEach((team) => {
      team.members.forEach((member) => {
        if (!memberMap.has(member._id.toString())) {
          memberMap.set(member._id.toString(), member);
        }
      });
    });
    const members = Array.from(memberMap.values());

    // Get attendance for today
    const attendances = await Attendance.find({
      user: { $in: members.map((m) => m._id) },
      date: { $gte: todayStart, $lte: todayEnd },
    }).populate("user", "name email");

    // Map to members
    const attendanceMap = {};
    attendances.forEach((att) => {
      attendanceMap[att.user._id.toString()] = att;
    });

    const result = members.map((member) => ({
      _id: member._id,
      name: member.name,
      email: member.email,
      attendance: attendanceMap[member._id.toString()] || null,
      status: attendanceMap[member._id.toString()]?.status || "Absent",
    }));

    res.status(200).json(result);
  } catch (err) {
    console.error("Error fetching team attendance:", err);
    res.status(500).json({ message: "Failed to fetch team attendance" });
  }
};

// ---------------- Profile ------------------
// GET /api/leader/profile
export const getMyLeaderProfile = async (req, res) => {
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
    console.error("getMyLeaderProfile error:", error);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
};

export const updateMyLeaderProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const updates = {};
    const allowedFields = ["phone", "address"];

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
        if (updates.isMarried === undefined && req.body.isMarried === undefined) {
          updates.isMarried = true;
        }
      }
    }

    // Handle bank details
    if (req.body.bankIFSC) updates["documents.bankIFSC"] = req.body.bankIFSC;
    if (req.body.bankAccountNumber)
      updates["documents.bankAccountNumber"] = req.body.bankAccountNumber;

    // Handle uploaded files
    if (req.uploadedUrls) {
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
      (field) => !user.documents[field].path || user.documents[field].verified
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
                      <h1 style="margin:0; color:#fff; font-size:24px;">DW Innovations Pvt. Ltd.</h1>
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
                        &copy; 2025 DW Innovations Pvt. Ltd. All rights reserved.
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
          "Profile Documents Updated",
          "",
          htmlContent
        );
      });
    }

    res.status(200).json({ message: "Profile updated successfully", user });
  } catch (error) {
    console.error("updateMyLeaderProfile error:", error);
    res.status(500).json({ message: "Failed to update profile" });
  }
};
