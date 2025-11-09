import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import axios from "axios";

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

// Sound notification function
const playNotificationSound = () => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = "sine";

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (error) {
    console.error("Error playing sound:", error);
  }
};

// Browser notification function
const showBrowserNotification = (message) => {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification("DW Innovation - New Notification", {
      body: message,
      icon: "/favicon.ico",
    });
  }
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Request browser notification permission
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    // Connect to socket
    const newSocket = io("http://localhost:5000");
    setSocket(newSocket);

    // Fetch initial notifications
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const userPayload = JSON.parse(atob(token.split(".")[1]));
        const userId = userPayload.id;
        const userRole = userPayload.role;

        const res = await axios.get(`http://localhost:5000/api/notifications/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setNotifications(res.data);
        setUnreadCount(res.data.filter(n => !n.readStatus).length);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };
    fetchNotifications();

    // Listen for new notifications
    newSocket.on("notification", (data) => {
      try {
        console.log("📨 Received notification:", data);

        const token = localStorage.getItem("token");
        if (!token) return;

        const userPayload = JSON.parse(atob(token.split(".")[1]));
        const userId = userPayload.id;
        const userRole = userPayload.role;

        console.log("👤 Current user:", { userId, userRole });
        console.log("📋 Notification details:", {
          role: data.role,
          recipient: data.recipient,
          notification: data.notification
        });

        // Check if notification is for this user
        // 1. Specific recipient matches this user ID
        // 2. Role matches and no specific recipient (role-based notification)
        const isForThisUser =
          (data.recipient && data.recipient === userId) ||
          (data.role && data.role === userRole && !data.recipient);

        console.log("✅ Is for this user?", isForThisUser);

        if (isForThisUser) {
          setNotifications(prev => [data.notification, ...prev]);
          setUnreadCount(prev => prev + 1);

          // Play sound and show browser notification
          playNotificationSound();
          showBrowserNotification(data.notification.message);
          console.log("🔔 Notification added to state");
        }
      } catch (error) {
        console.error("Error handling notification:", error);
      }
    });

    return () => newSocket.close();
  }, []);

  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(`http://localhost:5000/api/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, readStatus: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead }}>
      {children}
    </NotificationContext.Provider>
  );
};