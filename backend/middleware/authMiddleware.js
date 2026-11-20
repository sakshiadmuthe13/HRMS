import jwt from "jsonwebtoken";
import User from "../models/User.js";

const getTokenFromRequest = (req) => {
  // Prefer Authorization header
  let token = req.headers.authorization?.split(" ")[1];
  if (token) return token;
  // Fallback to cookie named 'token'
  if (req.cookies && req.cookies.token) return req.cookies.token;
  return null;
};

export const protect = async (req, res, next) => {
  try {
    const token = getTokenFromRequest(req);
    if (!token) return res.status(401).json({ message: "Not authorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id)
      .select("-password")
      .populate("reportingManager", "name email position")
      .populate("technicalReporting", "name email position")
      .populate("administrativeReporting", "name email position");
    if (!req.user) return res.status(401).json({ message: "User not found" });
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token failed" });
  }
};

// role-based guards
export const protectEmployee = async (req, res, next) => {
  await protect(req, res, async () => {
    if (req.user.role !== "employee") {
      return res.status(403).json({ message: "Require employee role" });
    }
    next();
  });
};

export const protectLeader = async (req, res, next) => {
  try {
    // First, authenticate user
    const token = getTokenFromRequest(req);
    if (!token) return res.status(401).json({ message: "Not authorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id)
      .select("-password")
      .populate("reportingManager", "name email position")
      .populate("technicalReporting", "name email position")
      .populate("administrativeReporting", "name email position");
    if (!req.user) return res.status(401).json({ message: "User not found" });

    // Then, check role
    if (req.user.role !== "leader") {
      return res.status(403).json({ message: "Require leader role" });
    }

    next();
  } catch (err) {
    console.error("protectLeader error:", err);
    return res.status(401).json({ message: "Token failed" });
  }
};

export const protectLeaderOrAdmin = async (req, res, next) => {
  try {
    const token = getTokenFromRequest(req);
    if (!token) return res.status(401).json({ message: "Not authorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");
    if (!req.user) return res.status(401).json({ message: "User not found" });

    if (req.user.role !== "leader" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Require leader or admin role" });
    }

    next();
  } catch (err) {
    return res.status(401).json({ message: "Token failed" });
  }
};

export const protectAdmin = async (req, res, next) => {
  await protect(req, res, async () => {
    if (req.user.role !== "admin") return res.status(403).json({ message: "Require admin role" });
    next();
  });
};
