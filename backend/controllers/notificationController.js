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

// Mark ALL notifications as read for a user
export const markAllAsRead = async (req, res) => {
  try {
    const { userId } = req.params;
    const userRole = req.user.role;
    await Notification.updateMany(
      {
        readStatus: false,
        $or: [
          { recipient: userId },
          { role: userRole, recipient: { $exists: false } },
        ],
      },
      { readStatus: true }
    );
    res.status(200).json({ message: "All notifications marked as read" });
  } catch (error) {
    res.status(500).json({ message: "Error marking all notifications as read", error: error.message });
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

    // Emit real-time notification to targeted rooms only
    if (global.io) {
      if (recipient) {
        // Emit only to the specific user's room
        global.io.to(`user:${recipient.toString()}`).emit("new-notification", notification.toObject());
      } else if (role) {
        // Emit to all users in the role room
        global.io.to(`role:${role}`).emit("new-notification", notification.toObject());
      }
    }
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
};