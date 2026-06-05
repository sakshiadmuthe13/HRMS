"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Bell, X, BellOff } from "lucide-react";
import { useNotifications } from "../contexts/NotificationContext";

const NotificationDropdown = ({ showText = true, positionClasses = "md:left-64 md:bottom-24" }) => {
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [toastNotification, setToastNotification] = useState(null);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const dismissedIdsRef = useRef(new Set());

  const recentNotifications = notifications.slice(0, 5);
  const displayNotifications = showAll ? notifications : recentNotifications;

  // Show toast notification when new notification arrives
  useEffect(() => {
    if (notifications.length > 0) {
      const latestNotification = notifications[0];
      
      // If the latest notification is read, hide the toast
      if (latestNotification.readStatus) {
        setToastNotification(null);
        return;
      }

      // Only show toast if notification is unread and has not been shown/dismissed yet
      if (!latestNotification.readStatus && !dismissedIdsRef.current.has(latestNotification._id)) {
        setToastNotification(latestNotification);
        dismissedIdsRef.current.add(latestNotification._id);

        // Auto-hide toast after 10 seconds
        const timer = setTimeout(() => {
          setToastNotification(null);
        }, 10000);

        return () => clearTimeout(timer);
      }
    } else {
      setToastNotification(null);
    }
  }, [notifications]);

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

  // Toast notification component
  const toastComponent = toastNotification ? (
    <div
      onClick={() => {
        markAsRead(toastNotification._id);
        setToastNotification(null);
      }}
      className="fixed top-20 right-5 bg-white border-l-4 border-l-blue-500 rounded-lg shadow-2xl animate-slide-in-right cursor-pointer hover:bg-gray-50 transition-colors"
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
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setToastNotification(null);
          }}
          className="text-gray-500 hover:text-gray-500 flex-shrink-0"
        >
          <X size={18} />
        </button>
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
        <button
          onClick={() => setIsOpen(false)}
          className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close notifications"
        >
          <X size={18} />
        </button>
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
      {notifications.length > 5 && (
        <div className="px-6 py-3 border-t border-gray-50 bg-gray-50/30 flex justify-center">
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-xs font-bold text-primary hover:text-secondary transition-colors py-1.5 px-4 rounded-xl hover:bg-primary/5"
          >
            {showAll ? "Show Less" : `View All (${notifications.length})`}
          </button>
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
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 bg-secondary text-white text-[9px] rounded-full h-4.5 w-4.5 flex items-center justify-center font-bold">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
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
