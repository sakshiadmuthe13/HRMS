"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Bell, X, BellOff, Wifi, WifiOff } from "lucide-react";
import { useNotifications } from "../contexts/NotificationContext";

// Helper to read/write dismissed IDs from sessionStorage
const STORAGE_KEY = "dismissed_notification_ids";
const getDismissedIds = () => {
  try {
    return new Set(JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "[]"));
  } catch {
    return new Set();
  }
};
const addDismissedId = (id) => {
  try {
    const ids = getDismissedIds();
    ids.add(id);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    // ignore
  }
};

const NotificationDropdown = ({ showText = true, positionClasses = "md:left-64 md:bottom-24" }) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, isConnected } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [toastNotification, setToastNotification] = useState(null);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const timerRef = useRef(null);

  const recentNotifications = notifications.slice(0, 5);
  const displayNotifications = showAll ? notifications : recentNotifications;

  const dismissToast = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setToastNotification(null);
  }, []);

  // Show toast notification when new notification arrives
  useEffect(() => {
    if (notifications.length > 0) {
      const latestNotification = notifications[0];

      // If the latest notification is read, hide the toast
      if (latestNotification.readStatus) {
        dismissToast();
        return;
      }

      const dismissedIds = getDismissedIds();

      // Only show toast if unread and not yet shown/dismissed in this session
      if (!dismissedIds.has(latestNotification._id)) {
        // Mark as dismissed in sessionStorage immediately so reload doesn't re-show it
        addDismissedId(latestNotification._id);

        // Clear any existing timer before starting a new one
        if (timerRef.current) clearTimeout(timerRef.current);

        setToastNotification(latestNotification);

        // Auto-hide after 5 seconds
        timerRef.current = setTimeout(() => {
          setToastNotification(null);
          timerRef.current = null;
        }, 5000);
      }
    } else {
      dismissToast();
    }

    // Cleanup timer on unmount
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [notifications]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Positioning handled via responsive Tailwind utility classes

  // Toast notification component (auto-dismisses in 5s, does NOT mark as read)
  const toastComponent = toastNotification ? (
    <div
      className="fixed top-20 right-5 bg-white border-l-4 border-l-blue-500 rounded-lg shadow-2xl animate-slide-in-right overflow-hidden"
      style={{ zIndex: 999999, maxWidth: "350px" }}
    >
      <div className="p-4 flex items-start gap-3">
        <Bell className="text-[#1A9DC2] flex-shrink-0 mt-1" size={20} />
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-900 mb-1">
            New Notification
          </p>
          <p className="text-sm text-gray-500">{toastNotification.message}</p>
          <p className="text-xs text-gray-500 mt-2">
            {new Date(toastNotification.timestamp).toLocaleString()}
          </p>
          <p className="text-[10px] text-gray-400 mt-1 italic">
            Open notification panel to view &amp; mark as read
          </p>
        </div>
        <button
          onClick={dismissToast}
          className="text-gray-400 hover:text-gray-600 flex-shrink-0 transition-colors"
          aria-label="Dismiss notification"
        >
          <X size={18} />
        </button>
      </div>
      {/* 5-second countdown progress bar */}
      <div className="h-1 bg-blue-100">
        <div
          className="h-full bg-[#1A9DC2]"
          style={{
            animation: "toast-progress 5s linear forwards",
          }}
        />
      </div>
    </div>
  ) : null;

  // Backdrop overlay when dropdown is open (mobile only)
  const backdropOverlay = isOpen ? (
    <div
      className="fixed inset-0 bg-black/20 backdrop-blur-xs md:hidden"
      style={{ zIndex: 999998 }}
      onClick={() => setIsOpen(false)}
    />
  ) : null;

  // Dropdown content that will be rendered via portal
  const dropdownContent = isOpen ? (
    <div
      ref={dropdownRef}
      className={`fixed z-[999999] flex flex-col bg-white border border-gray-300 shadow-premium transition-all duration-300 md:w-96 w-full max-h-[500px] md:rounded-3xl rounded-t-3xl bottom-0 left-0 right-0 animate-slideUp overflow-hidden ${positionClasses}`}
    >
      <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Notifications</h3>
          {unreadCount > 0 && (
            <p className="text-xs text-[#1A9DC2] font-semibold mt-0.5">
              You have {unreadCount} unread message{unreadCount > 1 ? 's' : ''}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Live connection indicator */}
          <span
            title={isConnected ? "Live – notifications arrive instantly" : "Reconnecting…"}
            className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
              isConnected
                ? "bg-green-50 text-green-600"
                : "bg-orange-50 text-orange-500"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-green-500 animate-pulse" : "bg-orange-400"}`}
            />
            {isConnected ? "Live" : "Offline"}
          </span>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close notifications"
          >
            <X size={18} />
          </button>
        </div>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {displayNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 mb-3">
              <BellOff size={24} />
            </div>
            <p className="text-sm font-semibold text-gray-900">All caught up!</p>
            <p className="text-xs text-gray-400 mt-1">
              You don't have any notifications right now.
            </p>
          </div>
        ) : (
          displayNotifications.map((notification) => (
            <div
              key={notification._id}
              className={`px-6 py-4 border-b border-gray-50 hover:bg-gray-50/70 transition-all duration-200 cursor-pointer flex gap-4 items-start ${!notification.readStatus ? "bg-primary/5" : ""
                }`}
              onClick={() => {
                markAsRead(notification._id);
              }}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${!notification.readStatus ? "bg-primary/10 text-primary" : "bg-gray-50 text-gray-400"
                }`}>
                <Bell size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm text-gray-800 leading-normal ${!notification.readStatus ? "font-semibold" : "font-normal"}`}>
                  {notification.message}
                </p>
                <span className="text-[11px] text-gray-400 font-medium mt-1 block">
                  {new Date(notification.timestamp).toLocaleString()}
                </span>
              </div>
              {!notification.readStatus && (
                <span className="w-2 h-2 rounded-full bg-[#1A9DC2] mt-1.5 flex-shrink-0" />
              )}
            </div>
          ))
        )}
      </div>
      {notifications.length > 0 && (
        <div className="px-6 py-3 border-t border-gray-50 bg-gray-50/30 flex items-center justify-between gap-2">
          <button
            onClick={unreadCount > 0 ? markAllAsRead : undefined}
            disabled={unreadCount === 0}
            className={`text-xs font-bold transition-colors py-1.5 px-3 rounded-xl whitespace-nowrap ${
              unreadCount > 0
                ? "text-gray-400 hover:text-primary hover:bg-primary/5 cursor-pointer"
                : "text-gray-300 cursor-not-allowed"
            }`}
          >
            Mark all as read
          </button>
          {notifications.length > 5 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-xs font-bold text-primary hover:text-secondary transition-colors py-1.5 px-4 rounded-xl hover:bg-primary/5"
            >
              {showAll ? "Show Less" : `View All (${notifications.length})`}
            </button>
          )}
        </div>
      )}
    </div>
  ) : null;

  return (
    <>
      {showText ? (
        <button
          ref={buttonRef}
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-4 w-full px-5 py-2 rounded-2xl text-sm font-bold text-primary hover:bg-primary/5 transition-all duration-300 border border-transparent hover:border-primary/10 group relative"
          aria-label="Notifications"
        >
          <div className="px-2 bg-primary/5 rounded-lg group-hover:bg-primary/10 transition-colors relative">
            <Bell size={18} className="text-primary" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-secondary text-white text-[9px] rounded-full h-4.5 w-4.5 flex items-center justify-center font-bold">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
            {/* Live dot */}
            {unreadCount === 0 && (
              <span
                className={`absolute -top-1 -right-1 w-2 h-2 rounded-full border border-white ${isConnected ? "bg-green-400" : "bg-orange-400"}`}
              />
            )}
          </div>
          Notifications
        </button>
      ) : (
        <button
          ref={buttonRef}
          onClick={() => setIsOpen(!isOpen)}
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-secondary hover:bg-primary/5 hover:text-primary transition-all relative group"
          aria-label="Notifications"
        >
          <Bell size={22} />
          {unreadCount > 0 ? (
            <span className="absolute top-2 right-2 bg-secondary text-white text-[9px] rounded-full h-4.5 w-4.5 flex items-center justify-center font-bold">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          ) : (
            /* Live dot when no unread */
            <span
              className={`absolute top-2.5 right-2.5 w-2 h-2 rounded-full border border-white ${
                isConnected ? "bg-green-400 animate-pulse" : "bg-orange-400"
              }`}
            />
          )}
        </button>
      )}

      {/* Render toast notification via portal */}
      {toastComponent && createPortal(toastComponent, document.body)}

      {/* Render backdrop overlay via portal */}
      {backdropOverlay && createPortal(backdropOverlay, document.body)}

      {/* Render dropdown via portal to body - this ensures it's on top of everything */}
      {dropdownContent && createPortal(dropdownContent, document.body)}
    </>
  );
};

export default NotificationDropdown;
