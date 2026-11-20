import React, { useState } from "react";
import { User } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

const getProfileImageUrl = (user) => {
  if (!user) return null;
  const path = user?.documents?.passportPhoto?.path || user?.avatar || user?.profilePhoto;
  if (!path) return null;
  if (typeof path === "string") {
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    const backendUrl = API_BASE.replace(/\/api\/?$/, "");
    return `${backendUrl}${path.startsWith("/") ? "" : "/"}${path}`;
  }
  return null;
};

const ProfileAvatar = ({ user, className = "w-10 h-10 text-sm" }) => {
  const [imgError, setImgError] = useState(false);
  const photoPath = getProfileImageUrl(user);
  const name = user?.name || "";
  const initial = name ? name.trim().charAt(0).toUpperCase() : "";

  if (photoPath && !imgError) {
    return (
      <img
        src={photoPath}
        alt={name}
        className={`${className} rounded-full object-cover border border-gray-150 shadow-sm shrink-0`}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div
      className={`${className} rounded-full bg-primary/10 flex items-center justify-center text-primary font-black uppercase border border-primary/20 shadow-sm shrink-0 select-none`}
    >
      {initial || <User className="w-1/2 h-1/2 text-primary/70 stroke-[1.5]" />}
    </div>
  );
};

export default ProfileAvatar;
