"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Bell, X } from "lucide-react";
import { useNotifications } from "../contexts/NotificationContext";

const NotificationDropdown = () => {
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [toastNotification, setToastNotification] = useState(null);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  const recentNotifications = notifications.slice(0, 5);
  const displayNotifications = showAll ? notifications : recentNotifications;

  // Show toast notification when new notification arrives
  useEffect(() => {
    if (notifications.length > 0) {
      const latestNotification = notifications[0];
      // Only show toast if notification is unread and not already shown
      if (!latestNotification.readStatus && !toastNotification) {
        setToastNotification(latestNotification);

        // Auto-hide toast after 10 seconds
        const timer = setTimeout(() => {
          setToastNotification(null);
        }, 10000);

        return () => clearTimeout(timer);
      }
    }
  }, [notifications, toastNotification]);

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

  // Calculate dropdown position
  const getDropdownStyle = () => {
    return {
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      width: "400px",
      maxHeight: "600px",
      zIndex: 999999,
    };
  };

  // Toast notification component
  const toastComponent = toastNotification ? (
    <div
      className="fixed top-20 right-5 bg-white border-l-4 border-l-blue-500 rounded-lg shadow-2xl animate-slide-in-right"
      style={{ zIndex: 999999, maxWidth: "350px" }}
    >
      <div className="p-4 flex items-start gap-3">
        <Bell className="text-blue-500 flex-shrink-0 mt-1" size={20} />
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-800 mb-1">
            New Notification
          </p>
          <p className="text-sm text-gray-600">{toastNotification.message}</p>
          <p className="text-xs text-gray-400 mt-2">
            {new Date(toastNotification.timestamp).toLocaleString()}
          </p>
        </div>
        <button
          onClick={() => setToastNotification(null)}
          className="text-gray-400 hover:text-gray-600 flex-shrink-0"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  ) : null;

  // Backdrop overlay when dropdown is open
  const backdropOverlay = isOpen ? (
    <div
      className="fixed inset-0 bg-black bg-opacity-50"
      style={{ zIndex: 999998 }}
      onClick={() => setIsOpen(false)}
    />
  ) : null;

  // Dropdown content that will be rendered via portal
  const dropdownContent = isOpen ? (
    <div
      ref={dropdownRef}
      className="bg-white border border-gray-200 rounded-lg shadow-2xl"
      style={getDropdownStyle()}
    >
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-purple-500 to-blue-500">
        <h3 className="text-lg font-semibold text-white">Notifications</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-white hover:text-gray-200 transition-colors"
          aria-label="Close notifications"
        >
          <X size={20} />
        </button>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {displayNotifications.length === 0 ? (
          <p className="p-4 text-gray-500 text-center">No notifications</p>
        ) : (
          displayNotifications.map((notification) => (
            <div
              key={notification._id}
              className={`p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                !notification.readStatus
                  ? "bg-blue-50 border-l-4 border-l-blue-500"
                  : ""
              }`}
              onClick={() => {
                markAsRead(notification._id);
              }}
            >
              <p className="text-sm text-gray-800">{notification.message}</p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(notification.timestamp).toLocaleString()}
              </p>
            </div>
          ))
        )}
      </div>
      {notifications.length > 5 && (
        <div className="p-3 border-t border-gray-200">
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            {showAll ? "Show Less" : "Show All"}
          </button>
        </div>
      )}
    </div>
  ) : null;

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center gap-2 p-2 text-gray-300 hover:text-white transition-colors"
        aria-label="Notifications"
      >
        <Bell size={20} />
        <h3 className="text-md">Notifications</h3>

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

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
