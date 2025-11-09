import Notification from "../models/Notification.js";

// Get notifications for a user
export const getNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    const userRole = req.user.role;
    const notifications = await Notification.find({
      $or: [
        { recipient: userId },
        { role: userRole, recipient: { $exists: false } }
      ]
    }).sort({ timestamp: -1 });
    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ message: "Error fetching notifications", error: error.message });
  }
};

// Mark notification as read
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findByIdAndUpdate(id, { readStatus: true }, { new: true });
    res.status(200).json(notification);
  } catch (error) {
    res.status(500).json({ message: "Error marking notification as read", error: error.message });
  }
};

// Create a new notification
export const createNotification = async ({ message, role, triggeredBy, recipient }) => {
  try {
    const notification = new Notification({
      message,
      role,
      triggeredBy,
      recipient,
    });
    await notification.save();

    // Emit real-time notification
    if (global.io) {
      // If recipient is specified, emit to that user
      if (recipient) {
        global.io.emit("notification", {
          notification: notification.toObject(),
          recipient: recipient.toString()
        });
      } else if (role) {
        // If role is specified, emit to all users with that role
        global.io.emit("notification", {
          notification: notification.toObject(),
          role
        });
      }
    }
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
};