// models/Attendance.js
import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  date: {
    type: Date,
    required: true,
    get: (val) => val?.toISOString().split("T")[0],
  },
  checkIn: { type: Date },
  checkOut: { type: Date },
  status: {
    type: String,
    enum: ["Present", "Absent", "Leave", "Holiday", "Over-time", "Half Day", "Half Day (Approved)", "Half Day (Unapproved)", "Late", "Early Checkout"],
    default: "Absent",
  },
  is_late: { type: Boolean, default: false },
  late_minutes: { type: Number, default: 0 },
  is_early_checkout: { type: Boolean, default: false },
  early_checkout_minutes: { type: Number, default: 0 },
  attendance_status: {
    type: String,
    enum: ["On Time", "Late", "Very Late", "Early Checkout", "Half Day", "Half Day (Approved)", "Half Day (Unapproved)", "Absent", "Holiday", "Over-time"],
    default: "On Time",
  },
  breaks: [
    {
      start: { type: Date },
      end: { type: Date },
    },
  ],
  total_break_minutes: { type: Number, default: 0 },
  is_on_break: { type: Boolean, default: false },
});

attendanceSchema.index({ user: 1, date: 1 }, { unique: true });

const Attendance = mongoose.model("Attendance", attendanceSchema);

export default Attendance;
