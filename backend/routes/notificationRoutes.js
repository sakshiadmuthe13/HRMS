import express from "express";
import { getNotifications, markAsRead, markAllAsRead } from "../controllers/notificationController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/:userId", protect, getNotifications);
router.put("/:id/read", protect, markAsRead);
router.put("/:userId/read-all", protect, markAllAsRead);

export default router;