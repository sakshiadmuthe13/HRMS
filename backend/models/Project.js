// models/Project.js
import mongoose from "mongoose";

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  startDate: { type: Date },
  endDate: { type: Date },
  status: { type: String, enum: ["Planning", "In Progress", "Completed", "On Hold"], default: "Planning" },
  completion: { type: Number, default: 0 }, // % progress
  assignedTeams: [{ type: mongoose.Schema.Types.ObjectId, ref: "Team" }],
});

const Project = mongoose.model("Project", projectSchema);

export default Project;
