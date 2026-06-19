import mongoose from "mongoose";

const logSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  text: { type: String, required: true },
});

const hiringCandidateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    source: { type: String, required: true },
    role: { type: String, required: true },
    vacancy: { type: mongoose.Schema.Types.ObjectId, ref: "Vacancy" },
    resumeUrl: { type: String, default: "#" },
    notes: { type: String, default: "" },
    dateAdded: { type: Date, default: Date.now },

    // Interview Stage
    interviewScheduledDate: { type: String, default: null },
    interviewScheduledTime: { type: String, default: null },
    interviewResult: {
      type: String,
      enum: ["Pending", "Shortlisted", "Not Shortlisted"],
      default: "Pending",
    },

    // Task Stage
    taskSentDate: { type: Date, default: null },
    taskReviewed: {
      type: String,
      enum: ["Pending", "Reviewed"],
      default: "Pending",
    },
    taskResult: {
      type: String,
      enum: ["Pending", "Shortlisted", "Not Shortlisted"],
      default: "Pending",
    },

    // HR Round Stage
    hrRoundScheduledDate: { type: String, default: null },
    hrRoundScheduledTime: { type: String, default: null },
    hrRoundResult: {
      type: String,
      enum: ["Pending", "Selected", "Rejected"],
      default: "Pending",
    },

    // Offer & Joining
    offerLetterStatus: {
      type: String,
      enum: ["Pending", "Sent"],
      default: "Pending",
    },
    joiningLetterStatus: {
      type: String,
      enum: ["Pending", "Sent"],
      default: "Pending",
    },
    finalMailSent: {
      type: String,
      enum: ["No", "Yes"],
      default: "No",
    },

    // Overall Status
    status: {
      type: String,
      default: "Added",
    },

    // Activity Logs
    logs: [logSchema],
  },
  { timestamps: true }
);

const HiringCandidate = mongoose.model("HiringCandidate", hiringCandidateSchema);

export default HiringCandidate;
