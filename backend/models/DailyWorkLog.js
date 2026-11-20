// models/DailyWorkLog.js
import mongoose from "mongoose";

const logEntrySchema = new mongoose.Schema({
  timeSlot: { type: String, required: true }, // e.g. "09:30 AM - 10:00 AM", "10:00 AM - 10:30 AM"
  activity: { type: String, required: true }, // Work done in this half-hour
  project: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
  task: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
  linkUrl: { type: String, default: "" }, // Vercel / Deployed Link / Live Link
  attachmentUrl: { type: String, default: "" }, // Image / Screenshot URL
  attachments: [{ type: String }], // Array of Multiple Image URLs
  status: { type: String, enum: ["In Progress", "Completed", "On Hold"], default: "Completed" },
  createdAt: { type: Date, default: Date.now }
}, { _id: true });

const dailyWorkLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: String, required: true }, // YYYY-MM-DD format
  entries: [logEntrySchema]
}, { timestamps: true });

// Ensure one document per user per date
dailyWorkLogSchema.index({ user: 1, date: 1 }, { unique: true });

const DailyWorkLog = mongoose.model("DailyWorkLog", dailyWorkLogSchema);

export default DailyWorkLog;
