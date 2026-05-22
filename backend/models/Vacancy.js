import mongoose from "mongoose";

const vacancySchema = new mongoose.Schema(
  {
    jobRole: { type: String, required: true },
    department: { type: String, required: true },
    positionTitle: { type: String, required: true },
    requiredSkills: { type: String, required: true },
    experienceRequired: { type: String, required: true },
    employmentType: {
      type: String,
      required: true,
      enum: ["Full-Time", "Part-Time", "Contract", "Internship"],
    },
    numberOfEmployeesRequired: { type: Number, required: true },
    hiredEmployeesCount: { type: Number, default: 0 },
    priorityLevel: {
      type: String,
      required: true,
      enum: ["Low", "Medium", "High", "Urgent"],
    },
    salaryRange: { type: String },
    jobDescription: { type: String, required: true },
    lastDateToApply: { type: Date, required: true },
    status: {
      type: String,
      default: "Active",
      enum: ["Active", "Inactive", "Closed"],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const Vacancy = mongoose.model("Vacancy", vacancySchema);

export default Vacancy;
