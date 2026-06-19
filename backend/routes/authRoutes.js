import express from "express";
import { login, forgotPassword, resetPassword, logout, getProfile } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
const router = express.Router();

router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/logout", logout);
router.get("/profile", protect, getProfile);

export default router;
