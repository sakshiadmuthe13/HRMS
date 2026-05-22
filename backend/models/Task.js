// models/Task.js
import mongoose from "mongoose";

const taskSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  description: { type: String, required: true },
  // Added Delayed status and deadline/delay tracking
  status: {
    type: String,
    enum: ["Pending", "In Progress", "Completed"],
    default: "Pending",
  },
  assignedAt: { type: Date, default: Date.now },
  deadline: { type: Date, default: function () {
    const assigned = this.assignedAt instanceof Date ? this.assignedAt : new Date(this.assignedAt || Date.now());
    return new Date(assigned.getTime() + 24 * 60 * 60 * 1000); // assignedAt + 1 day
  } },
  completedAt: { type: Date },
  // number of times employee marked as delayed
  delayCount: { type: Number, default: 0 },
  // history of delays: { date, reason }
  delayHistory: [
    {
      date: { type: Date },
      reason: { type: String },
    },
  ],
  completionDescription: { type: String },
  deployedLink: { type: String },
});

const Task = mongoose.model("Task", taskSchema);

export default Task;
