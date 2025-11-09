import express from "express";
import { login, forgotPassword, resetPassword, logout } from "../controllers/authController.js";
const router = express.Router();

router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/logout", logout);

export default router;
