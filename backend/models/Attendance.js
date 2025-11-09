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
    enum: ["Present", "Absent", "Leave", "Holiday", "Over-time"],
    default: "Absent",
  },
});

attendanceSchema.index({ user: 1, date: 1 }, { unique: true });

const Attendance = mongoose.model("Attendance", attendanceSchema);

export default Attendance;
