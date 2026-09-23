import React, { useEffect, useRef, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

// =========================================================
// ADMIN NOTIFICATIONS
// =========================================================

const adminNotifications = [
  {
    id: 1,
    type: "account-request",
    category: "Student Account",
    title: "New Student Account Request",
    message:
      "A new student account is waiting for administrator review and approval.",
    time: "10 mins ago",
    unread: true,
    icon: "🎓",
    path: "/admin/requests",
  },
  {
    id: 2,
    type: "account-request",
    category: "Registrar Account",
    title: "New Registrar Account Request",
    message:
      "A new registrar account has been submitted and is waiting for review.",
    time: "35 mins ago",
    unread: true,
    icon: "👨‍💼",
    path: "/admin/requests",
  },
  {
    id: 3,
    type: "company-registration",
    category: "Company Registration",
    title: "New Company Registration",
    message:
      "A company registration request is waiting for administrator approval.",
    time: "1 hr ago",
    unread: true,
    icon: "🏢",
    path: "/admin/companies",
  },
  {
    id: 4,
    type: "system",
    category: "System",
    title: "System Update",
    message: "The internship management system was successfully updated.",
    time: "Yesterday",
    unread: false,
    icon: "⚙️",
    path: "/admin/notifications",
  },
];

// =========================================================
// COMPONENT
// =========================================================

const AdminPortalLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // =========================================================
  // SIDEBAR
  // =========================================================

  const [sidebarWidth, setSidebarWidth] = useState(250);
  const [isResizing, setIsResizing] = useState(false);

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // =========================================================
  // DROPDOWNS
  // =========================================================

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const profileRef = useRef(null);
  const notificationRef = useRef(null);

  // =========================================================
  // NOTIFICATIONS
  // =========================================================

  const [notifications, setNotifications] = useState(adminNotifications);

  const [selectedNotification, setSelectedNotification] = useState(null);

  const unreadCount = notifications.filter(
    (notification) => notification.unread
  ).length;

  // =========================================================
  // DARK MODE
  // =========================================================

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("sims_admin_dark_mode") === "true";
  });

  // =========================================================
  // LOGOUT CONFIRMATION
  // =========================================================

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // =========================================================
  // SIDEBAR ITEMS
  // =========================================================

  const sidebarItems = [
    {
      label: "Dashboard",
      path: "/admin/dashboard",
      icon: "▦",
    },
    {
      label: "Account Requests",
      path: "/admin/requests",
      icon: "📩",
    },
    {
      label: "Company Management",
      path: "/admin/companies",
      icon: "▦",
    },
    {
      label: "User Management",
      path: "/admin/users",
      icon: "👥",
    },
    {
      label: "School Management",
      path: "/admin/schools",
      icon: "🏫",
    },
    // {
    //   label: "Internship Records",
    //   path: "/admin/internships",
    //   icon: "▣",
    // },
    {
      label: "Document Management",
      path: "/admin/documents",
      icon: "▰",
    },
    {
      label: "Information Management",
      path: "/admin/information",
      icon: "ⓘ",
    },
    {
      label: "Evaluation Management",
      path: "/admin/evaluations",
      icon: "★",
    },
    {
      label: "Reports",
      path: "/admin/reports",
      icon: "▥",
    },
    {
      label: "System Notifications",
      path: "/admin/notifications",
      icon: "🔔",
      badge: true,
    },
    {
      label: "System Settings",
      path: "/admin/settings",
      icon: "⚙",
    },
    {
      label: "Audit Logs",
      path: "/admin/audit-logs",
      icon: "▤",
    },
  ];

  // =========================================================
  // NOTIFICATION HANDLERS
  // =========================================================

  const markNotificationAsRead = (id) => {
    setNotifications((previous) =>
      previous.map((notification) =>
        notification.id === id
          ? {
              ...notification,
              unread: false,
            }
          : notification
      )
    );
  };

  const markAllNotificationsRead = () => {
    setNotifications((previous) =>
      previous.map((notification) => ({
        ...notification,
        unread: false,
      }))
    );
  };

  const deleteNotification = (id) => {
    setNotifications((previous) =>
      previous.filter((notification) => notification.id !== id)
    );

    if (selectedNotification?.id === id) {
      setSelectedNotification(null);
    }
  };

  const openNotification = (notification) => {
    markNotificationAsRead(notification.id);
    setSelectedNotification(notification);
    setIsNotificationOpen(false);
  };

  const closeNotificationModal = () => {
    setSelectedNotification(null);
  };

  const handleNotificationClick = (notification) => {
    markNotificationAsRead(notification.id);

    setIsNotificationOpen(false);
    setIsProfileOpen(false);

    navigate(notification.path || "/admin/notifications");
  };

  // =========================================================
  // DARK MODE
  // =========================================================

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    localStorage.setItem("sims_admin_dark_mode", darkMode.toString());

    return () => {
      document.documentElement.classList.remove("dark");
    };
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode((previous) => !previous);
  };

  // =========================================================
  // MOBILE SIDEBAR
  // =========================================================

  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [location.pathname]);

  // =========================================================
  // MOBILE BODY SCROLL LOCK
  // =========================================================

  useEffect(() => {
    if (!isMobileSidebarOpen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileSidebarOpen]);

  // =========================================================
  // ESCAPE KEY
  // =========================================================

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key !== "Escape") return;

      setIsMobileSidebarOpen(false);
      setIsProfileOpen(false);
      setIsNotificationOpen(false);
      setSelectedNotification(null);
      setShowLogoutConfirm(false);

      if (isResizing) {
        setIsResizing(false);
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isResizing]);

  // =========================================================
  // CLICK OUTSIDE DROPDOWNS
  // =========================================================

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }

      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setIsNotificationOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // =========================================================
  // SIDEBAR RESIZE
  // =========================================================

  const handleResizeStart = (event) => {
    // Only allow primary mouse button / normal touch pointer
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    setIsResizing(true);

    // Capture the pointer so dragging remains active
    // even when the cursor moves away from the handle.
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch (error) {
      console.warn("Pointer capture unavailable:", error);
    }

    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";
  };

  const handleResizeMove = (event) => {
    if (!isResizing) return;

    event.preventDefault();

    const MIN_WIDTH = 230;
    const MAX_WIDTH = 340;

    const newWidth = Math.min(Math.max(event.clientX, MIN_WIDTH), MAX_WIDTH);

    setSidebarWidth(newWidth);
  };

  const handleResizeEnd = (event) => {
    if (!isResizing) return;

    try {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    } catch (error) {
      console.warn("Pointer release unavailable:", error);
    }

    setIsResizing(false);

    document.body.style.userSelect = "";
    document.body.style.cursor = "";
  };

  // Safety cleanup if component unmounts while resizing
  useEffect(() => {
    return () => {
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
  }, []);

  // =========================================================
  // NAVIGATION
  // =========================================================

  const navigateTo = (path) => {
    navigate(path);

    setIsMobileSidebarOpen(false);
    setIsProfileOpen(false);
    setIsNotificationOpen(false);
  };

  // =========================================================
  // ACTIVE PATH
  // =========================================================

  const isPathActive = (path) => {
    return location.pathname === path;
  };

  // =========================================================
  // PAGE TITLE
  // =========================================================

  const getPageTitle = () => {
    const currentItem = sidebarItems.find(
      (item) => item.path === location.pathname
    );

    if (currentItem) {
      return currentItem.label;
    }

    if (location.pathname === "/admin/profile") {
      return "Administrator Profile";
    }

    return "Administrator Portal";
  };

  // =========================================================
  // LOGOUT
  // =========================================================

  const handleLogoutClick = () => {
    setIsProfileOpen(false);
    setIsNotificationOpen(false);
    setIsMobileSidebarOpen(false);
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    if (isLoggingOut) return;

    try {
      setIsLoggingOut(true);

      // Admin currently has no Supabase logout here.
      // Keep this as navigation until Admin auth is connected.

      setShowLogoutConfirm(false);
      setIsMobileSidebarOpen(false);

      navigate("/admin/login", {
        replace: true,
      });
    } catch (error) {
      console.error("Logout failed:", error);
      setIsLoggingOut(false);
    }
  };

  const cancelLogout = () => {
    if (isLoggingOut) return;

    setShowLogoutConfirm(false);
  };

  // =========================================================
  // SIDEBAR CONTENT
  // =========================================================

  const renderSidebarContent = (mobile = false) => {
    return (
      <div
        className={`relative flex h-full min-h-0 flex-col overflow-hidden ${
          darkMode ? "bg-slate-900 text-white" : "bg-white text-slate-900"
        }`}
      >
        {/* ===================================================
            BRAND
        =================================================== */}

        <div
          className={`flex h-20 flex-shrink-0 items-center border-b px-5 ${
            darkMode ? "border-slate-700" : "border-slate-200"
          }`}
        >
          <div className="flex min-w-0 items-center gap-3">
            <div
              className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-xl font-bold shadow-md ${
                darkMode ? "bg-white text-slate-900" : "bg-slate-900 text-white"
              }`}
            >
              🛡
            </div>

            <div className="min-w-0">
              <h1
                className={`truncate text-sm font-bold tracking-tight ${
                  darkMode ? "text-white" : "text-slate-900"
                }`}
              >
                ADMINISTRATOR PORTAL
              </h1>

              <p
                className={`truncate text-[10px] ${
                  darkMode ? "text-slate-400" : "text-slate-500"
                }`}
              >
                SIMS Administration
              </p>
            </div>
          </div>

          {/* MOBILE CLOSE */}

          {mobile && (
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(false)}
              className={`ml-auto flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg transition ${
                darkMode
                  ? "text-slate-300 hover:bg-slate-800 hover:text-white"
                  : "text-slate-500 hover:bg-slate-800 hover:text-white"
              }`}
              aria-label="Close sidebar"
            >
              ✕
            </button>
          )}
        </div>

        {/* ===================================================
            NAVIGATION
        =================================================== */}

        <div
          className={`flex-1 min-h-0 overflow-y-auto overscroll-y-auto px-3 py-4 pb-28 scrollbar-thin ${
            darkMode ? "scrollbar-thumb-slate-700" : "scrollbar-thumb-slate-300"
          }`}
          style={{
            WebkitOverflowScrolling: "touch",
            touchAction: "pan-y",
          }}
        >
          <div className="space-y-1">
            {sidebarItems.map((item) => {
              const active = isPathActive(item.path);

              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => navigateTo(item.path)}
                  aria-current={active ? "page" : undefined}
                  className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[11px] font-semibold transition-all ${
                    active
                      ? darkMode
                        ? "bg-white text-slate-900 shadow-sm"
                        : "bg-slate-800 text-white shadow-sm"
                      : darkMode
                      ? "text-slate-300 hover:bg-slate-800 hover:text-white"
                      : "text-slate-600 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  {/* ACTIVE INDICATOR */}

                  {active && (
                    <span
                      className={`absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full ${
                        darkMode ? "bg-white" : "bg-slate-900"
                      }`}
                    />
                  )}

                  {/* ICON */}

                  <span className="flex w-6 flex-shrink-0 items-center justify-center text-base">
                    {item.icon}
                  </span>

                  {/* LABEL */}

                  <span className="min-w-0 flex-1 truncate">{item.label}</span>

                  {/* BADGE */}

                  {item.badge && unreadCount > 0 && (
                    <span className="flex h-2 w-2 flex-shrink-0 rounded-full bg-red-500" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ===================================================
            FIXED LOGOUT FOOTER
        =================================================== */}

        <div
          className={`absolute bottom-0 left-0 right-0 z-20 border-t p-3 backdrop-blur-md ${
            darkMode
              ? "border-slate-700 bg-slate-900/95"
              : "border-slate-200 bg-white/95"
          }`}
        >
          <button
            type="button"
            onClick={handleLogoutClick}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-[11px] font-semibold transition ${
              darkMode
                ? "text-slate-300 hover:bg-red-950/70 hover:text-red-400"
                : "text-slate-600 hover:bg-red-50 hover:text-red-600"
            }`}
          >
            <span className="flex w-6 items-center justify-center text-base">
              ↪
            </span>

            <span>Logout</span>
          </button>
        </div>
      </div>
    );
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div
      className={`min-h-screen w-full transition-colors duration-300 ${
        darkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"
      }`}
      style={{
        touchAction: "pan-y",
      }}
    >
      <div className="flex min-h-screen w-full">
        {/* ===================================================
            DESKTOP SIDEBAR
        =================================================== */}

        <aside
          style={{
            width: `${sidebarWidth}px`,
          }}
          className={`fixed inset-y-0 left-0 z-[70] hidden h-screen flex-shrink-0 overflow-hidden border-r lg:flex ${
            darkMode
              ? "border-slate-700 bg-slate-900"
              : "border-slate-200 bg-white"
          } ${isResizing ? "select-none" : ""}`}
        >
          {renderSidebarContent(false)}

          {/* =================================================
              RESIZE HANDLE
          ================================================= */}

          <div
            role="separator"
            aria-label="Resize sidebar"
            aria-orientation="vertical"
            aria-valuemin={230}
            aria-valuemax={340}
            aria-valuenow={sidebarWidth}
            onPointerDown={handleResizeStart}
            onPointerMove={handleResizeMove}
            onPointerUp={handleResizeEnd}
            onPointerCancel={handleResizeEnd}
            className={`absolute right-0 top-0 z-[100] h-full w-2 cursor-col-resize touch-none select-none transition-colors ${
              isResizing
                ? "bg-blue-500"
                : darkMode
                ? "hover:bg-slate-700"
                : "hover:bg-slate-300"
            }`}
          >
            {/* SMALL VISUAL GRIP */}

            <div
              className={`absolute left-1/2 top-1/2 h-12 w-[2px] -translate-x-1/2 -translate-y-1/2 rounded-full transition ${
                isResizing
                  ? "bg-white"
                  : darkMode
                  ? "bg-slate-600"
                  : "bg-slate-300"
              }`}
            />
          </div>
        </aside>

        {/* ===================================================
            DESKTOP SIDEBAR SPACER
        =================================================== */}

        <div
          className="hidden flex-shrink-0 lg:block"
          style={{
            width: `${sidebarWidth}px`,
          }}
          aria-hidden="true"
        />

        {/* ===================================================
            MAIN AREA
        =================================================== */}

        <div className="flex min-w-0 flex-1 flex-col">
          {/* =================================================
              NAVBAR
          ================================================= */}

          <header
            className={`sticky top-0 z-50 flex h-20 flex-shrink-0 items-center justify-between border-b px-3 shadow-sm backdrop-blur sm:px-6 lg:px-8 ${
              darkMode
                ? "border-slate-800 bg-slate-900/95"
                : "border-slate-200 bg-white/95"
            }`}
          >
            {/* =================================================
                LEFT
            ================================================= */}

            <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
              {/* MOBILE MENU */}

              <button
                type="button"
                onClick={() => {
                  setIsMobileSidebarOpen(true);
                  setIsProfileOpen(false);
                  setIsNotificationOpen(false);
                }}
                aria-label="Open sidebar"
                className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-lg transition lg:hidden ${
                  darkMode
                    ? "text-slate-300 hover:bg-slate-800"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                ☰
              </button>

              {/* PAGE TITLE */}

              <div className="min-w-0">
                <h2
                  className={`truncate text-lg font-bold sm:text-xl ${
                    darkMode ? "text-white" : "text-slate-900"
                  }`}
                >
                  {getPageTitle()}
                </h2>

                <p
                  className={`hidden truncate text-xs sm:block ${
                    darkMode ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  Student Internship Management System
                </p>
              </div>
            </div>

            {/* =================================================
                RIGHT
            ================================================= */}

            <div className="flex flex-shrink-0 items-center gap-1.5 sm:gap-3">
              {/* =================================================
                  DARK MODE
              ================================================= */}

              <button
                type="button"
                onClick={toggleDarkMode}
                aria-label={
                  darkMode ? "Switch to light mode" : "Switch to dark mode"
                }
                title={
                  darkMode ? "Switch to light mode" : "Switch to dark mode"
                }
                className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-lg transition ${
                  darkMode
                    ? "text-yellow-300 hover:bg-slate-800"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {darkMode ? "☀️" : "🌙"}
              </button>

              {/* =================================================
                  NOTIFICATIONS
              ================================================= */}

              <div ref={notificationRef} className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsNotificationOpen((previous) => !previous);
                    setIsProfileOpen(false);
                  }}
                  className={`relative flex h-10 w-10 items-center justify-center rounded-xl text-lg transition ${
                    darkMode
                      ? "text-slate-300 hover:bg-slate-800"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                  aria-label="Administrator notifications"
                >
                  🔔
                  {unreadCount > 0 && (
                    <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                {/* NOTIFICATION DROPDOWN */}

                {isNotificationOpen && (
                  <div
                    className={`fixed left-3 right-3 top-[84px] z-[100] w-auto max-w-none overflow-hidden rounded-2xl border shadow-xl sm:absolute sm:left-auto sm:right-0 sm:top-12 sm:w-[360px] sm:max-w-[calc(100vw-2rem)] ${
                      darkMode
                        ? "border-slate-700 bg-slate-900"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    {/* HEADER */}

                    <div
                      className={`flex items-center justify-between gap-3 border-b px-4 py-3 ${
                        darkMode ? "border-slate-800" : "border-slate-100"
                      }`}
                    >
                      <div className="min-w-0">
                        <h3
                          className={`font-bold ${
                            darkMode ? "text-white" : "text-slate-900"
                          }`}
                        >
                          Administrator Notifications
                        </h3>

                        <p
                          className={`mt-0.5 text-xs ${
                            darkMode ? "text-slate-400" : "text-slate-500"
                          }`}
                        >
                          {unreadCount} unread
                        </p>
                      </div>

                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={markAllNotificationsRead}
                          className={`flex-shrink-0 text-xs font-semibold hover:underline ${
                            darkMode ? "text-blue-400" : "text-blue-600"
                          }`}
                        >
                          Mark all read
                        </button>
                      )}
                    </div>

                    {/* LIST */}

                    <div
                      className="max-h-[calc(100vh-210px)] overflow-y-auto overscroll-y-auto sm:max-h-[380px]"
                      style={{
                        WebkitOverflowScrolling: "touch",
                        touchAction: "pan-y",
                      }}
                    >
                      {notifications.length === 0 ? (
                        <div className="px-5 py-8 text-center">
                          <div className="mb-2 text-3xl">✓</div>

                          <p
                            className={`text-sm ${
                              darkMode ? "text-slate-400" : "text-slate-500"
                            }`}
                          >
                            No notifications
                          </p>
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`group relative border-b px-4 py-3 transition ${
                              darkMode
                                ? "border-slate-800 hover:bg-slate-800/70"
                                : "border-slate-100 hover:bg-slate-50"
                            } ${
                              notification.unread
                                ? darkMode
                                  ? "bg-slate-800/60"
                                  : "bg-slate-50"
                                : ""
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => openNotification(notification)}
                              className="w-full pr-8 text-left"
                            >
                              <div className="flex gap-3">
                                {/* ICON */}

                                <div
                                  className={`mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${
                                    notification.type === "account-request"
                                      ? darkMode
                                        ? "bg-blue-950 text-blue-300"
                                        : "bg-blue-100 text-blue-700"
                                      : notification.type ===
                                        "company-registration"
                                      ? darkMode
                                        ? "bg-emerald-950 text-emerald-300"
                                        : "bg-emerald-100 text-emerald-700"
                                      : darkMode
                                      ? "bg-slate-700"
                                      : "bg-slate-100"
                                  }`}
                                >
                                  {notification.icon}
                                </div>

                                {/* CONTENT */}

                                <div className="min-w-0 flex-1">
                                  <div className="flex items-start gap-2">
                                    <h4
                                      className={`min-w-0 flex-1 break-words text-sm font-semibold ${
                                        darkMode
                                          ? "text-white"
                                          : "text-slate-800"
                                      }`}
                                    >
                                      {notification.title}
                                    </h4>

                                    {notification.unread && (
                                      <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />
                                    )}
                                  </div>

                                  <p
                                    className={`mt-1 break-words text-xs leading-5 ${
                                      darkMode
                                        ? "text-slate-400"
                                        : "text-slate-500"
                                    }`}
                                  >
                                    {notification.message}
                                  </p>

                                  <p
                                    className={`mt-1.5 text-[10px] ${
                                      darkMode
                                        ? "text-slate-500"
                                        : "text-slate-400"
                                    }`}
                                  >
                                    {notification.time}
                                  </p>
                                </div>
                              </div>
                            </button>

                            {/* DELETE */}

                            <button
                              type="button"
                              onClick={() =>
                                deleteNotification(notification.id)
                              }
                              className={`absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-lg text-xs opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100 ${
                                darkMode
                                  ? "text-slate-400 hover:bg-red-500/10 hover:text-red-400"
                                  : "text-slate-400 hover:bg-red-50 hover:text-red-600"
                              }`}
                              aria-label="Delete notification"
                            >
                              ✕
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    {/* VIEW ALL */}

                    <div
                      className={`border-t p-2 ${
                        darkMode ? "border-slate-800" : "border-slate-100"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => navigateTo("/admin/notifications")}
                        className={`w-full rounded-lg py-2.5 text-xs font-semibold transition ${
                          darkMode
                            ? "text-blue-400 hover:bg-slate-800"
                            : "text-blue-600 hover:bg-slate-50"
                        }`}
                      >
                        View all notifications
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* =================================================
                  PROFILE
              ================================================= */}

              <div ref={profileRef} className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen((previous) => !previous);
                    setIsNotificationOpen(false);
                  }}
                  className={`flex items-center gap-2 rounded-xl p-1.5 transition ${
                    darkMode ? "hover:bg-slate-800" : "hover:bg-slate-100"
                  }`}
                >
                  {/* AVATAR */}

                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold sm:h-10 sm:w-10 ${
                      darkMode
                        ? "bg-white text-slate-900"
                        : "bg-slate-800 text-white"
                    }`}
                  >
                    AD
                  </div>

                  {/* INFO */}

                  <div className="hidden text-left sm:block">
                    <p
                      className={`max-w-[150px] truncate text-sm font-semibold ${
                        darkMode ? "text-white" : "text-slate-800"
                      }`}
                    >
                      System Administrator
                    </p>

                    <p
                      className={`max-w-[150px] truncate text-[10px] ${
                        darkMode ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
                      Administrator
                    </p>
                  </div>

                  <span
                    className={`hidden text-xs transition-transform sm:block ${
                      darkMode ? "text-slate-400" : "text-slate-500"
                    } ${isProfileOpen ? "rotate-180" : ""}`}
                  >
                    ▼
                  </span>
                </button>

                {/* PROFILE DROPDOWN */}

                {isProfileOpen && (
                  <div
                    className={`absolute right-0 top-12 z-[100] w-60 overflow-hidden rounded-2xl border shadow-xl ${
                      darkMode
                        ? "border-slate-700 bg-slate-900"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    {/* HEADER */}

                    <div
                      className={`border-b px-4 py-4 ${
                        darkMode ? "border-slate-800" : "border-slate-100"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold ${
                            darkMode
                              ? "bg-white text-slate-900"
                              : "bg-slate-800 text-white"
                          }`}
                        >
                          AD
                        </div>

                        <div className="min-w-0">
                          <p
                            className={`truncate text-sm font-semibold ${
                              darkMode ? "text-white" : "text-slate-800"
                            }`}
                          >
                            System Administrator
                          </p>

                          <p
                            className={`truncate text-xs ${
                              darkMode ? "text-slate-400" : "text-slate-500"
                            }`}
                          >
                            Administrator Account
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-2">
                      {/* MY PROFILE */}

                      <button
                        type="button"
                        onClick={() => navigateTo("/admin/profile")}
                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${
                          darkMode
                            ? "text-slate-300 hover:bg-slate-800 hover:text-white"
                            : "text-slate-600 hover:bg-slate-800 hover:text-white"
                        }`}
                      >
                        👤
                        <span>My Profile</span>
                      </button>

                      {/* SETTINGS */}

                      <button
                        type="button"
                        onClick={() => navigateTo("/admin/settings")}
                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${
                          darkMode
                            ? "text-slate-300 hover:bg-slate-800 hover:text-white"
                            : "text-slate-600 hover:bg-slate-800 hover:text-white"
                        }`}
                      >
                        ⚙️
                        <span>System Settings</span>
                      </button>

                      <div
                        className={`my-1 border-t ${
                          darkMode ? "border-slate-800" : "border-slate-100"
                        }`}
                      />

                      {/* LOGOUT */}

                      <button
                        type="button"
                        onClick={handleLogoutClick}
                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold ${
                          darkMode
                            ? "text-red-400 hover:bg-red-500/10"
                            : "text-red-600 hover:bg-red-50"
                        }`}
                      >
                        ↪<span>Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* =================================================
              PAGE CONTENT
          ================================================= */}

          <main
            className={`min-h-[calc(100vh-5rem)] min-w-0 flex-1 transition-colors duration-300 ${
              darkMode ? "bg-slate-950" : "bg-slate-50"
            }`}
            style={{
              touchAction: "pan-y",
            }}
          >
            <Outlet
              context={{
                darkMode,
                notifications,
                unreadCount,
                markNotificationAsRead,
                markAllNotificationsRead,
                deleteNotification,
                selectedNotification,
                openNotification,
                closeNotificationModal,
              }}
            />
          </main>
        </div>
      </div>

      {/* =====================================================
          MOBILE OVERLAY
      ===================================================== */}

      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-[80] bg-black/50 lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* =====================================================
          MOBILE SIDEBAR
      ===================================================== */}

      <aside
        className={`fixed inset-y-0 left-0 z-[90] flex w-[290px] max-w-[85vw] flex-col overflow-hidden shadow-2xl transition-transform duration-300 lg:hidden ${
          darkMode ? "bg-slate-900" : "bg-white"
        } ${isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {renderSidebarContent(true)}
      </aside>

      {/* =====================================================
          NOTIFICATION MODAL
      ===================================================== */}

      {selectedNotification && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4"
          onClick={closeNotificationModal}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            className={`w-full max-w-md overflow-hidden rounded-2xl border shadow-2xl ${
              darkMode
                ? "border-slate-700 bg-slate-900"
                : "border-slate-200 bg-white"
            }`}
          >
            {/* HEADER */}

            <div
              className={`flex items-center justify-between border-b px-5 py-4 ${
                darkMode ? "border-slate-800" : "border-slate-100"
              }`}
            >
              <h3
                className={`font-bold ${
                  darkMode ? "text-white" : "text-slate-900"
                }`}
              >
                Notification
              </h3>

              <button
                type="button"
                onClick={closeNotificationModal}
                className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                  darkMode
                    ? "text-slate-400 hover:bg-slate-800"
                    : "text-slate-500 hover:bg-slate-100"
                }`}
              >
                ✕
              </button>
            </div>

            {/* CONTENT */}

            <div className="px-5 py-6">
              <div className="mb-4 flex items-start gap-3">
                <div
                  className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-xl ${
                    selectedNotification.type === "account-request"
                      ? darkMode
                        ? "bg-blue-950 text-blue-300"
                        : "bg-blue-100 text-blue-700"
                      : selectedNotification.type === "company-registration"
                      ? darkMode
                        ? "bg-emerald-950 text-emerald-300"
                        : "bg-emerald-100 text-emerald-700"
                      : darkMode
                      ? "bg-slate-800"
                      : "bg-slate-100"
                  }`}
                >
                  {selectedNotification.icon}
                </div>

                <div className="min-w-0">
                  <h4
                    className={`font-bold ${
                      darkMode ? "text-white" : "text-slate-900"
                    }`}
                  >
                    {selectedNotification.title}
                  </h4>

                  <p
                    className={`mt-1 text-xs ${
                      darkMode ? "text-slate-500" : "text-slate-400"
                    }`}
                  >
                    {selectedNotification.time}
                  </p>
                </div>
              </div>

              <p
                className={`text-sm leading-6 ${
                  darkMode ? "text-slate-300" : "text-slate-600"
                }`}
              >
                {selectedNotification.message}
              </p>
            </div>

            {/* FOOTER */}

            <div
              className={`border-t px-5 py-3 text-right ${
                darkMode ? "border-slate-800" : "border-slate-100"
              }`}
            >
              <button
                type="button"
                onClick={closeNotificationModal}
                className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          LOGOUT CONFIRMATION
      ===================================================== */}

      {showLogoutConfirm && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]"
          onClick={cancelLogout}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            className={`w-full max-w-sm overflow-hidden rounded-2xl border shadow-2xl ${
              darkMode
                ? "border-slate-700 bg-slate-900"
                : "border-slate-200 bg-white"
            }`}
          >
            {/* ICON */}

            <div className="flex justify-center pt-7">
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-full text-2xl ${
                  darkMode ? "bg-red-500/10" : "bg-red-50"
                }`}
              >
                ↪
              </div>
            </div>

            {/* CONTENT */}

            <div className="px-6 pb-5 pt-4 text-center">
              <h3
                className={`text-lg font-bold ${
                  darkMode ? "text-white" : "text-slate-900"
                }`}
              >
                Are you sure?
              </h3>

              <p
                className={`mt-2 text-sm leading-6 ${
                  darkMode ? "text-slate-400" : "text-slate-500"
                }`}
              >
                Are you sure you want to log out of your administrator account?
              </p>
            </div>

            {/* BUTTONS */}

            <div
              className={`flex gap-3 border-t p-4 ${
                darkMode ? "border-slate-800" : "border-slate-100"
              }`}
            >
              <button
                type="button"
                onClick={cancelLogout}
                disabled={isLoggingOut}
                className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                  darkMode
                    ? "bg-slate-800 text-slate-200 hover:bg-slate-700"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmLogout}
                disabled={isLoggingOut}
                className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoggingOut ? "Logging out..." : "Logout"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPortalLayout;
