import "./config/env.js";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import connectDB from "./config/db.js";
import { errorHandler } from "./middleware/errorMiddleware.js";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import leaderRoutes from "./routes/leaderRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import hrRoutes from "./routes/hrRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import vacancyRoutes from "./routes/vacancyRoutes.js";
import { startCelebrationJob } from "./utils/celebrationJob.js";

const app = express();
const configuredOrigins = (process.env.CLIENT_URLS || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);
const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  const normalizedOrigin = origin.replace(/\/$/, "");
  if (configuredOrigins.includes(normalizedOrigin)) return true;
  try {
    const parsedOrigin = new URL(normalizedOrigin);
    if (parsedOrigin.hostname === "localhost") return true;
  } catch (err) {
    return false;
  }
  return false;
};
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"), false);
    },
    credentials: true,
  },
});
app.use(express.json());
app.use(cors({
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) return callback(null, true);
    return callback(new Error("Not allowed by CORS"));
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
app.use("/api/hr", hrRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/vacancies", vacancyRoutes);

// Socket.io middleware: authenticate and assign userId/role from JWT
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      // Allow unauthenticated connections; they won't receive targeted notifications
      socket.userId = null;
      socket.userRole = null;
      return next();
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    socket.userRole = decoded.role;
    next();
  } catch (err) {
    // Invalid token: allow connection anyway (client will register via event)
    socket.userId = null;
    socket.userRole = null;
    next();
  }
});

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id} | userId: ${socket.userId} | role: ${socket.userRole}`);

  // Join user-specific and role-specific rooms
  if (socket.userId) {
    socket.join(`user:${socket.userId}`);
  }
  if (socket.userRole) {
    socket.join(`role:${socket.userRole}`);
  }

  // Allow client to explicitly register/re-register their room (e.g. after auth)
  socket.on("register", ({ userId, role }) => {
    if (userId) {
      socket.join(`user:${userId}`);
      socket.userId = userId;
    }
    if (role) {
      socket.join(`role:${role}`);
      socket.userRole = role;
    }
    console.log(`Socket ${socket.id} registered to user:${userId} role:${role}`);
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// Make io available globally for emitting notifications
global.io = io;

// Error middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    startCelebrationJob();
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (error) {
    console.error(`Server startup failed: ${error.message}`);
    process.exitCode = 1;
  }
};

startServer();
