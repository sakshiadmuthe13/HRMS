import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { io } from "socket.io-client";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";
const SOCKET_BASE = import.meta.env.VITE_SOCKET_BASE || API_BASE.replace(/\/api\/?$/, "");

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Decode a JWT without verifying (client-side only, for extracting claims). */
const decodeToken = (token) => {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
};

/** Get the logged-in user's token/payload from localStorage. */
const getUserPayload = () => {
  const token = localStorage.getItem("token");
  if (!token) return null;
  const payload = decodeToken(token);
  return payload ? { token, ...payload } : null;
};

// ─── Notification Sound ───────────────────────────────────────────────────────

/**
 * Plays a pleasant two-tone chime using the Web Audio API.
 * Falls back silently if the API is unavailable or user hasn't interacted.
 */
const playNotificationSound = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();

    const playTone = (frequency, startTime, duration, gainPeak = 0.35) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = "sine";
      osc.frequency.setValueAtTime(frequency, startTime);

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(gainPeak, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    // First note: D5 (587 Hz), then E5 (659 Hz) — a bright, friendly chime
    playTone(587, now, 0.35, 0.3);
    playTone(784, now + 0.18, 0.45, 0.25);
  } catch (err) {
    // Silently ignore – e.g. browser blocked autoplay
    console.debug("Notification sound blocked:", err.message);
  }
};

// ─── Browser Push Notification ────────────────────────────────────────────────

const showBrowserNotification = (message) => {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification("QiroTech Innovation – New Notification", {
      body: message,
      icon: "/favicon.ico",
      tag: "qirotech-notification", // replace previous notification of same tag
    });
  }
};

// ─── Provider ─────────────────────────────────────────────────────────────────

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  // ── Fetch notifications from API ──────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    const user = getUserPayload();
    if (!user) return;

    try {
      const res = await axios.get(`${API_BASE}/notifications/${user.id}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setNotifications(res.data);
      setUnreadCount(res.data.filter((n) => !n.readStatus).length);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  }, []);

  // ── Register socket into user/role rooms ──────────────────────────────────
  const registerSocket = useCallback((socket) => {
    const user = getUserPayload();
    if (!user || !socket) return;
    socket.emit("register", { userId: user.id, role: user.role });
    console.log(`🔌 Socket registered for user:${user.id} role:${user.role}`);
  }, []);

  // ── Handle an incoming notification ──────────────────────────────────────
  const handleNewNotification = useCallback((notification) => {
    console.log("📨 Real-time notification received:", notification);
    setNotifications((prev) => {
      // Avoid duplicate if already in state
      if (prev.some((n) => n._id === notification._id)) return prev;
      return [notification, ...prev];
    });
    setUnreadCount((prev) => prev + 1);
    playNotificationSound();
    showBrowserNotification(notification.message);
  }, []);

  // ── Initialise Socket.IO ──────────────────────────────────────────────────
  useEffect(() => {
    // Request browser notification permission once
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    const user = getUserPayload();

    // Build socket with JWT auth so the server can assign rooms immediately
    const socket = io(SOCKET_BASE, {
      auth: { token: user?.token || "" },
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    // ── Connection events ─────────────────────────────────────────────────
    socket.on("connect", () => {
      console.log(`✅ Socket connected: ${socket.id}`);
      setIsConnected(true);
      // Re-register into rooms on every (re)connect
      registerSocket(socket);
      // Re-fetch to catch any notifications missed while disconnected
      fetchNotifications();
    });

    socket.on("disconnect", (reason) => {
      console.log(`❌ Socket disconnected: ${reason}`);
      setIsConnected(false);
    });

    socket.on("connect_error", (err) => {
      console.warn("Socket connection error:", err.message);
    });

    // ── Notification event (new targeted event name) ───────────────────────
    socket.on("new-notification", handleNewNotification);

    // Fetch initial notifications
    fetchNotifications();

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Mark notification as read ─────────────────────────────────────────────
  const markAsRead = async (id) => {
    try {
      const user = getUserPayload();
      if (!user) return;
      await axios.put(
        `${API_BASE}/notifications/${id}/read`,
        {},
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, readStatus: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  // ── Mark ALL notifications as read ───────────────────────────────────────
  const markAllAsRead = async () => {
    try {
      const user = getUserPayload();
      if (!user) return;
      await axios.put(
        `${API_BASE}/notifications/${user.id}/read-all`,
        {},
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setNotifications((prev) => prev.map((n) => ({ ...n, readStatus: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
    }
  };

  // ── Re-register when the user logs in (call this after login) ────────────
  const registerUser = useCallback(() => {
    if (socketRef.current?.connected) {
      registerSocket(socketRef.current);
    }
    fetchNotifications();
  }, [registerSocket, fetchNotifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isConnected,
        markAsRead,
        markAllAsRead,
        registerUser,
        refreshNotifications: fetchNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};