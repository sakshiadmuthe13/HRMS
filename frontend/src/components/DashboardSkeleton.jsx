import React from "react";

/* ─── Reusable skeleton block ───────────────────────────────── */
const Bone = ({ className = "" }) => (
  <div
    className={`bg-gray-200 animate-pulse rounded-xl ${className}`}
  />
);

/* ─── Sidebar skeleton ──────────────────────────────────────── */
const SidebarSkeleton = ({ isCollapsed = false }) => (
  <div
    className={`fixed left-0 top-0 h-screen flex flex-col bg-white border-r border-gray-100 z-40 transition-all duration-300 ${
      isCollapsed ? "w-20" : "w-60"
    } hidden md:flex`}
  >
    {/* Logo area */}
    <div className={`pt-6 pb-6 ${isCollapsed ? "px-5" : "px-8"}`}>
      <div className="flex items-center gap-4 mb-3">
        <Bone className="w-10 h-10 rounded-2xl flex-shrink-0" />
        {!isCollapsed && <Bone className="h-5 w-28 rounded-lg" />}
      </div>
      {!isCollapsed && (
        <div className="space-y-2 mt-2">
          <Bone className="h-1 w-12 rounded-full" />
          <Bone className="h-2 w-20 rounded-md" />
        </div>
      )}
    </div>

    {/* Nav items */}
    <nav className="flex-1 px-4 space-y-2 overflow-hidden">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className={`flex items-center gap-4 py-3 px-3 rounded-2xl ${isCollapsed ? "justify-center" : ""}`}
        >
          <Bone className="w-6 h-6 rounded-lg flex-shrink-0" />
          {!isCollapsed && (
            <Bone className={`h-3 rounded-md ${i % 3 === 0 ? "w-20" : i % 3 === 1 ? "w-28" : "w-16"}`} />
          )}
        </div>
      ))}
    </nav>

    {/* Logout */}
    <div className="mt-auto px-4 pb-4 pt-2 border-t border-gray-100">
      <div className={`flex items-center gap-4 py-2 px-3 ${isCollapsed ? "justify-center" : ""}`}>
        <Bone className="w-8 h-8 rounded-lg flex-shrink-0" />
        {!isCollapsed && <Bone className="h-3 w-16 rounded-md" />}
      </div>
    </div>
  </div>
);

/* ─── Navbar skeleton ───────────────────────────────────────── */
const NavbarSkeleton = ({ isCollapsed = false }) => (
  <div
    className={`sticky top-0 z-30 flex items-center justify-between px-6 md:px-10 h-16 bg-white/80 backdrop-blur border-b border-gray-100 transition-all duration-300 ${
      isCollapsed ? "md:ml-20" : "md:ml-60"
    }`}
  >
    <div className="flex items-center gap-4">
      <Bone className="w-36 h-4 rounded-lg" />
    </div>
    <div className="flex items-center gap-3">
      <Bone className="w-8 h-8 rounded-full" />
      <Bone className="w-8 h-8 rounded-full" />
      <Bone className="w-24 h-8 rounded-xl" />
    </div>
  </div>
);

/* ─── Stat card skeleton ────────────────────────────────────── */
const StatCardSkeleton = () => (
  <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm overflow-hidden relative">
    <div className="flex items-center justify-between mb-6">
      <Bone className="w-12 h-12 rounded-2xl" />
    </div>
    <div className="space-y-2">
      <Bone className="h-8 w-16 rounded-lg" />
      <Bone className="h-3 w-24 rounded-md" />
    </div>
    {/* ghost icon */}
    <div className="absolute top-4 right-4 w-14 h-14 bg-gray-100 rounded-full animate-pulse opacity-30" />
  </div>
);

/* ─── Chart panel skeleton ──────────────────────────────────── */
const ChartPanelSkeleton = () => (
  <div className="bg-white border border-gray-100 rounded-[2rem] p-8 shadow-sm">
    <div className="flex items-center justify-between mb-8">
      <Bone className="h-5 w-36 rounded-lg" />
      <Bone className="h-8 w-24 rounded-xl" />
    </div>
    {/* fake chart bars */}
    <div className="h-[220px] flex items-end justify-around gap-3 px-4">
      {[65, 85, 45, 75, 55, 90, 40].map((h, i) => (
        <div
          key={i}
          className="flex-1 bg-gray-200 rounded-t-xl animate-pulse"
          style={{ height: `${h}%`, animationDelay: `${i * 0.08}s` }}
        />
      ))}
    </div>
  </div>
);

/* ─── Table panel skeleton ──────────────────────────────────── */
const TablePanelSkeleton = () => (
  <div className="bg-white border border-gray-100 rounded-[2rem] p-8 shadow-sm">
    <div className="flex items-center justify-between mb-8">
      <Bone className="h-5 w-40 rounded-lg" />
      <Bone className="h-8 w-20 rounded-xl" />
    </div>
    <div className="space-y-3">
      {/* header */}
      <div className="flex gap-4 pb-3 border-b border-gray-100">
        {[40, 25, 20].map((w, i) => (
          <Bone key={i} className={`h-3 rounded-md`} style={{ width: `${w}%` }} />
        ))}
      </div>
      {/* rows */}
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-4 py-2 items-center" style={{ animationDelay: `${i * 0.07}s` }}>
          <Bone className="h-3 rounded-md" style={{ width: "40%" }} />
          <Bone className="h-3 rounded-md" style={{ width: "25%" }} />
          <Bone className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  </div>
);

/* ─── Main Dashboard Skeleton ───────────────────────────────── */
const DashboardSkeleton = ({ role = "employee" }) => {
  const isCollapsed = (() => {
    try { return localStorage.getItem("sidebar-collapsed") === "true"; } catch { return false; }
  })();

  return (
    <div className="flex min-h-screen bg-gray-50/50">
      {/* Sidebar */}
      <SidebarSkeleton isCollapsed={isCollapsed} />

      {/* Main content area */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${isCollapsed ? "md:ml-20" : "md:ml-60"}`}>
        {/* Navbar */}
        <div className="sticky top-0 z-30 flex items-center justify-between px-6 md:px-10 h-16 bg-white/80 backdrop-blur border-b border-gray-100">
          <div className="flex items-center gap-4">
            <Bone className="w-8 h-8 rounded-lg md:hidden" />
            <Bone className="w-32 h-4 rounded-lg hidden md:block" />
          </div>
          <div className="flex items-center gap-3">
            <Bone className="w-8 h-8 rounded-full" />
            <Bone className="w-8 h-8 rounded-full" />
            <Bone className="w-24 h-8 rounded-xl hidden sm:block" />
          </div>
        </div>

        {/* Page body */}
        <div className="flex-1 px-6 sm:px-10 py-10 space-y-10 max-w-7xl mx-auto w-full">
          {/* Header */}
          <div className="space-y-3 animate-pulse">
            <Bone className="h-10 w-72 rounded-xl" />
            <Bone className="h-4 w-48 rounded-lg" />
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            {Array.from({ length: role === "admin" ? 6 : 4 }).map((_, i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>

          {/* Bottom panels */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ChartPanelSkeleton />
            <TablePanelSkeleton />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardSkeleton;
