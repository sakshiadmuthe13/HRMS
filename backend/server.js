import "./config/env.js";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import connectDB from "./config/db.js";
import { errorHandler } from "./middleware/errorMiddleware.js";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import leaderRoutes from "./routes/leaderRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import { startCelebrationJob } from "./utils/celebrationJob.js";

connectDB();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: (process.env.CLIENT_URLS || "http://localhost:5173").split(","),
    credentials: true,
  },
});
app.use(express.json());
const allowedOrigins = (process.env.CLIENT_URLS || "http://localhost:5173").split(",");
app.use(cors({
  origin: (origin, cb) => {
    // Allow server-to-server or tools with no origin
    if (!origin) return cb(null, true);
    // Allow explicit configured origins
    if (allowedOrigins.includes(origin)) return cb(null, true);
    // For local development allow any localhost port (e.g. Vite sometimes uses 5173/5174/5175)
    try {
      const u = new URL(origin);
      if (u.hostname === 'localhost') return cb(null, true);
    } catch (err) {
      // ignore invalid origin
    }
    return cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// Routes
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", message: "Server is running", timestamp: new Date().toISOString() });
});
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/leader", leaderRoutes);
app.use("/api/employee", employeeRoutes);
app.use("/api/notifications", notificationRoutes);

// Socket.io connection
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Make io available globally for emitting notifications
global.io = io;

// Error middleware
app.use(errorHandler);

// Start cron jobs
startCelebrationJob();

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
