import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  role: {
    type: String,
    enum: ["employee", "leader", "admin", "hr"],
    required: true,
  },
  readStatus: {
    type: Boolean,
    default: false,
  },
  triggeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false, // Optional for role-based notifications
  },
});

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;