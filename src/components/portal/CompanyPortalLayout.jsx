import React, { useEffect, useRef, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

// =========================================================
// TEMPORARY FRONTEND NOTIFICATIONS
// This is NOT connected to mockStore.
// This will later be replaced with the real backend/database.
// =========================================================

const initialNotifications = [
  {
    id: "CNOT-001",
    title: "Internship Application Received",
    message:
      "A new student internship application has been submitted to your company and is awaiting review.",
    relatedEntityType: "InternshipApplication",
    relatedEntityId: "APP-001",
    createdAt: "2026-08-18T08:30:00.000Z",
    readAt: null,
  },
  {
    id: "CNOT-002",
    title: "Document Review Update",
    message:
      "A student's submitted internship document is ready for your review.",
    relatedEntityType: "DocumentSubmission",
    relatedEntityId: "DOC-001",
    createdAt: "2026-08-17T14:15:00.000Z",
    readAt: null,
  },
  {
    id: "CNOT-003",
    title: "Internship Information Updated",
    message:
      "New internship guidelines and information are now available in the Company Portal.",
    relatedEntityType: "InformationItem",
    relatedEntityId: "INFO-001",
    createdAt: "2026-08-16T09:00:00.000Z",
    readAt: "2026-08-16T10:00:00.000Z",
  },
];

const CompanyPortalLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // =========================================================
  // LOGOUT PLACEHOLDER
  // =========================================================

  const logout = (...args) => {
    void args;
  };

  // =========================================================
  // SIDEBAR
  // =========================================================

  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [isResizing, setIsResizing] = useState(false);

  // =========================================================
  // MOBILE SIDEBAR
  // =========================================================

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // =========================================================
  // PROFILE DROPDOWN
  // =========================================================

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileMenuRef = useRef(null);

  // =========================================================
  // NOTIFICATION DROPDOWN
  // =========================================================

  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const notificationRef = useRef(null);

  // =========================================================
  // NOTIFICATION STATE
  // =========================================================

  const [notifications, setNotifications] = useState(initialNotifications);

  const [selectedNotification, setSelectedNotification] = useState(null);

  // =========================================================
  // NOTIFICATION CONTROLS
  // =========================================================

  const unreadCount = notifications.filter(
    (notification) => !notification.readAt
  ).length;

  const markNotificationRead = (notificationId) => {
    setNotifications((previous) =>
      previous.map((notification) =>
        notification.id === notificationId
          ? {
              ...notification,
              readAt: notification.readAt || new Date().toISOString(),
            }
          : notification
      )
    );
  };

  const markAllNotificationsRead = () => {
    const now = new Date().toISOString();

    setNotifications((previous) =>
      previous.map((notification) => ({
        ...notification,
        readAt: notification.readAt || now,
      }))
    );
  };

  const deleteNotification = (notificationId) => {
    setNotifications((previous) =>
      previous.filter((notification) => notification.id !== notificationId)
    );

    setSelectedNotification((current) =>
      current?.id === notificationId ? null : current
    );
  };

  const openNotification = (notification) => {
    markNotificationRead(notification.id);

    setSelectedNotification({
      ...notification,
      readAt: notification.readAt || new Date().toISOString(),
    });

    setIsNotificationOpen(false);
  };

  const closeNotificationModal = () => {
    setSelectedNotification(null);
  };

  // =========================================================
  // DARK MODE
  // =========================================================

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("companyPortalDarkMode") === "true";
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    localStorage.setItem("companyPortalDarkMode", darkMode);
  }, [darkMode]);

  // =========================================================
  // MOBILE SIDEBAR BEHAVIOR
  // =========================================================

  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsMobileSidebarOpen(false);
        setIsNotificationOpen(false);
        setIsProfileOpen(false);
        setSelectedNotification(null);
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    if (isMobileSidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileSidebarOpen]);

  // =========================================================
  // CLOSE DROPDOWNS WHEN CLICKING OUTSIDE
  // =========================================================

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target)
      ) {
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
  // SIDEBAR ITEMS
  // =========================================================

  const sidebarItems = [
    {
      name: "Dashboard",
      icon: "▦",
      path: "/company/dashboard",
    },
    {
      name: "Manage Jobs",
      icon: "💼",
      path: "/company/jobs",
    },
    {
      name: "Manage Applications",
      icon: "📋",
      path: "/company/applications",
    },
    {
      name: "Assigned Interns",
      icon: "👥",
      path: "/company/interns",
    },
    {
      name: "Evaluate",
      icon: "📊",
      path: "/company/evaluate",
    },
    {
      name: "Feedback",
      icon: "📝",
      path: "/company/feedback",
    },
    {
      name: "Notifications",
      icon: "🔔",
      path: "/company/notifications",
    },
    {
      name: "Messages",
      icon: "💬",
      path: "/company/messages",
    },
    {
      name: "Settings",
      icon: "⚙",
      path: "/company/settings",
    },
  ];

  // =========================================================
  // EXPANDABLE MENUS
  // =========================================================

  const [expandedMenus, setExpandedMenus] = useState({
    "Internship Posts": false,
    Applications: false,
    Documents: false,
  });

  // =========================================================
  // SIDEBAR RESIZE
  // =========================================================

  const handleSidebarResizeStart = (e) => {
    e.preventDefault();

    setIsResizing(true);

    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const handleSidebarResize = (e) => {
    if (!isResizing) return;

    const minWidth = 240;
    const maxWidth = 360;

    const newWidth = Math.min(Math.max(e.clientX, minWidth), maxWidth);

    setSidebarWidth(newWidth);
  };

  const handleSidebarResizeEnd = (e) => {
    setIsResizing(false);

    try {
      e.currentTarget.releasePointerCapture?.(e.pointerId);
    } catch {
      // Pointer capture may already be released.
    }
  };

  // =========================================================
  // NAVIGATION
  // =========================================================

  const navigateTo = (path) => {
    navigate(path);

    setIsProfileOpen(false);
    setIsNotificationOpen(false);
    setIsMobileSidebarOpen(false);
  };

  const toggleSubmenu = (menuName) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [menuName]: !prev[menuName],
    }));
  };

  const isPathActive = (path) => {
    return location.pathname === path;
  };

  const isChildActive = (children) => {
    return children?.some((child) => location.pathname === child.path);
  };

  // =========================================================
  // PAGE TITLE
  // =========================================================

  const getPageTitle = () => {
    const currentItem = sidebarItems.find((item) => {
      if (item.path === location.pathname) {
        return true;
      }

      return item.children?.some((child) => child.path === location.pathname);
    });

    if (!currentItem) {
      return "Company Portal";
    }

    const child = currentItem.children?.find(
      (child) => child.path === location.pathname
    );

    return child ? child.name : currentItem.name;
  };

  // =========================================================
  // LOGOUT
  // =========================================================

  const handleLogout = () => {
    logout();

    setIsProfileOpen(false);
    setIsNotificationOpen(false);
    setSelectedNotification(null);

    navigate("/login", { replace: true });
  };

  // =========================================================
  // DARK MODE TOGGLE
  // =========================================================

  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };

  // =========================================================
  // RETURN
  // =========================================================

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        darkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"
      }`}
    >
      <div className="flex min-h-screen">
        {/* =====================================================
            DESKTOP SIDEBAR
        ===================================================== */}

        <aside
          style={{ width: `${sidebarWidth}px` }}
          className={`relative hidden lg:flex flex-col flex-shrink-0 border-r transition-colors duration-300 ${
            darkMode
              ? "bg-slate-900 border-slate-700"
              : "bg-white border-slate-200"
          } ${isResizing ? "select-none" : ""}`}
        >
          {/* SIDEBAR HEADER */}

          <div
            className={`h-20 px-6 flex items-center border-b ${
              darkMode ? "border-slate-700" : "border-slate-100"
            }`}
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${
                darkMode ? "bg-white text-slate-900" : "bg-slate-900 text-white"
              }`}
            >
              C
            </div>

            <div className="ml-3">
              <h1 className="font-bold text-lg tracking-tight">SIMS</h1>

              <p
                className={`text-xs ${
                  darkMode ? "text-slate-400" : "text-slate-400"
                }`}
              >
                Company Environment
              </p>
            </div>
          </div>

          {/* SIDEBAR NAVIGATION */}

          <div className="flex-1 overflow-y-auto px-3 py-4">
            <nav className="space-y-1">
              {sidebarItems.map((item) => {
                const hasChildren = item.children?.length > 0;
                const isExpanded = expandedMenus[item.name];

                const active =
                  isPathActive(item.path) || isChildActive(item.children);

                return (
                  <div key={item.name}>
                    <button
                      type="button"
                      onClick={() => {
                        if (hasChildren) {
                          toggleSubmenu(item.name);
                        } else if (item.path) {
                          navigateTo(item.path);
                        }
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                        active
                          ? darkMode
                            ? "bg-white text-slate-900 shadow-sm"
                            : "bg-slate-900 text-white shadow-sm"
                          : darkMode
                          ? "text-slate-300 hover:bg-slate-800 hover:text-white"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`w-7 h-7 flex items-center justify-center rounded-lg text-base ${
                            active
                              ? darkMode
                                ? "bg-slate-900/10"
                                : "bg-white/10"
                              : darkMode
                              ? "bg-slate-800"
                              : "bg-slate-100"
                          }`}
                        >
                          {item.icon}
                        </span>

                        <span className="truncate">{item.name}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {item.badge && (
                          <span
                            className={`w-2 h-2 rounded-full ${
                              active ? "bg-current" : "bg-blue-500"
                            }`}
                          />
                        )}

                        {hasChildren && (
                          <span
                            className={`text-xs transition-transform duration-200 ${
                              isExpanded ? "rotate-180" : ""
                            }`}
                          >
                            ▼
                          </span>
                        )}
                      </div>
                    </button>

                    {hasChildren && isExpanded && (
                      <div className="relative ml-7 pl-4 mt-1 mb-1 space-y-1">
                        <div
                          className={`absolute left-1 top-0 bottom-0 w-px ${
                            darkMode ? "bg-slate-700" : "bg-slate-200"
                          }`}
                        />

                        {item.children.map((child) => {
                          const childActive = isPathActive(child.path);

                          return (
                            <button
                              key={child.name}
                              type="button"
                              onClick={() => navigateTo(child.path)}
                              className={`relative w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium text-left ${
                                childActive
                                  ? darkMode
                                    ? "bg-white text-slate-900"
                                    : "bg-slate-900 text-white"
                                  : darkMode
                                  ? "text-slate-400 hover:bg-slate-800 hover:text-white"
                                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                              }`}
                            >
                              <span
                                className={`w-6 h-6 flex items-center justify-center rounded-md ${
                                  childActive
                                    ? darkMode
                                      ? "bg-slate-900/10"
                                      : "bg-white/10"
                                    : darkMode
                                    ? "bg-slate-800"
                                    : "bg-slate-50"
                                }`}
                              >
                                {child.icon}
                              </span>

                              <span className="truncate">{child.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>

          {/* LOGOUT */}

          <div
            className={`p-4 border-t ${
              darkMode ? "border-slate-700" : "border-slate-100"
            }`}
          >
            <button
              type="button"
              onClick={handleLogout}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold ${
                darkMode
                  ? "text-slate-400 hover:bg-red-950 hover:text-red-400"
                  : "text-slate-500 hover:bg-red-50 hover:text-red-600"
              }`}
            >
              <span>🚪</span>
              <span>Logout</span>
            </button>
          </div>

          {/* RESIZE HANDLE */}

          <div
            role="separator"
            aria-label="Resize sidebar"
            aria-orientation="vertical"
            onPointerDown={handleSidebarResizeStart}
            onPointerMove={handleSidebarResize}
            onPointerUp={handleSidebarResizeEnd}
            onPointerCancel={handleSidebarResizeEnd}
            className={`absolute top-0 right-0 z-30 h-full w-1.5 cursor-col-resize touch-none ${
              isResizing
                ? "bg-blue-500"
                : darkMode
                ? "hover:bg-slate-700"
                : "hover:bg-slate-300"
            }`}
          />
        </aside>

        {/* =====================================================
            MAIN AREA
        ===================================================== */}

        <div className="flex-1 min-w-0">
          {/* ===================================================
              NAVBAR
          =================================================== */}

          <header
            className={`h-20 border-b flex items-center justify-between px-4 sm:px-6 lg:px-8 relative ${
              darkMode
                ? "bg-slate-900 border-slate-700 text-white"
                : "bg-white border-slate-200 text-slate-900"
            }`}
          >
            {/* LEFT */}

            <div className="flex items-center min-w-0">
              <div className="min-w-0">
                <p
                  className={`text-sm ${
                    darkMode ? "text-slate-400" : "text-slate-400"
                  }`}
                >
                  Company Portal
                </p>

                <h2 className="font-bold text-base sm:text-lg truncate">
                  {getPageTitle()}
                </h2>
              </div>
            </div>

            {/* RIGHT SIDE CONTROLS */}

            <div className="flex items-center gap-1 sm:gap-3 ml-auto">
              {/* NOTIFICATIONS */}

              <div className="relative" ref={notificationRef}>
                <button
                  type="button"
                  onClick={() => {
                    setIsNotificationOpen((prev) => !prev);
                    setIsProfileOpen(false);
                  }}
                  className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition ${
                    darkMode ? "hover:bg-slate-800" : "hover:bg-slate-100"
                  }`}
                >
                  <span className="text-lg">🔔</span>

                  {unreadCount > 0 && (
                    <span
                      className={`absolute top-1 right-1 min-w-4 h-4 px-1 flex items-center justify-center bg-red-500 text-white text-[9px] font-bold rounded-full border-2 ${
                        darkMode ? "border-slate-900" : "border-white"
                      }`}
                    >
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                {isNotificationOpen && (
                  <div
                    className={`absolute right-0 top-12 w-[calc(100vw-2rem)] max-w-80 border rounded-xl shadow-xl z-50 overflow-hidden ${
                      darkMode
                        ? "bg-slate-800 border-slate-700"
                        : "bg-white border-slate-200"
                    }`}
                  >
                    {/* HEADER */}

                    <div
                      className={`px-4 py-3 border-b flex items-center justify-between ${
                        darkMode ? "border-slate-700" : "border-slate-200"
                      }`}
                    >
                      <div>
                        <h3 className="text-sm font-bold">Notifications</h3>

                        <p
                          className={`text-xs mt-0.5 ${
                            darkMode ? "text-slate-400" : "text-slate-500"
                          }`}
                        >
                          {unreadCount > 0
                            ? `${unreadCount} unread`
                            : "All caught up"}
                        </p>
                      </div>

                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={markAllNotificationsRead}
                          className="text-[10px] font-bold text-blue-500 hover:underline"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>

                    {/* LIST */}

                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center">
                          <div className="text-2xl mb-2">🔔</div>

                          <p
                            className={`text-xs ${
                              darkMode ? "text-slate-400" : "text-slate-500"
                            }`}
                          >
                            No notifications
                          </p>
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <button
                            key={notification.id}
                            type="button"
                            onClick={() => openNotification(notification)}
                            className={`w-full text-left px-4 py-3 border-b transition ${
                              darkMode
                                ? "border-slate-700 hover:bg-slate-700"
                                : "border-slate-100 hover:bg-slate-50"
                            }`}
                          >
                            <div className="flex gap-3">
                              <div className="pt-1.5">
                                <span
                                  className={`block w-2 h-2 rounded-full ${
                                    notification.readAt
                                      ? darkMode
                                        ? "bg-slate-600"
                                        : "bg-slate-300"
                                      : "bg-blue-500"
                                  }`}
                                />
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-xs font-bold truncate">
                                    {notification.title}
                                  </p>

                                  <span
                                    className={`text-[10px] whitespace-nowrap ${
                                      darkMode
                                        ? "text-slate-500"
                                        : "text-slate-400"
                                    }`}
                                  >
                                    {new Date(
                                      notification.createdAt
                                    ).toLocaleDateString()}
                                  </span>
                                </div>

                                <p
                                  className={`text-xs mt-1 line-clamp-2 ${
                                    darkMode
                                      ? "text-slate-400"
                                      : "text-slate-500"
                                  }`}
                                >
                                  {notification.message}
                                </p>
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>

                    {/* VIEW ALL */}

                    <button
                      type="button"
                      onClick={() => navigateTo("/company/notifications")}
                      className={`w-full py-3 text-xs font-bold ${
                        darkMode
                          ? "text-blue-400 hover:bg-slate-700"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      View All Notifications
                    </button>
                  </div>
                )}
              </div>

              {/* PROFILE */}

              <div className="relative" ref={profileMenuRef}>
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen((prev) => !prev);
                    setIsNotificationOpen(false);
                  }}
                  className={`flex items-center gap-3 px-2 py-1.5 rounded-xl ${
                    darkMode ? "hover:bg-slate-800" : "hover:bg-slate-100"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                      darkMode
                        ? "bg-white text-slate-900"
                        : "bg-slate-900 text-white"
                    }`}
                  >
                    AC
                  </div>

                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-semibold">Acme Corporation</p>

                    <p
                      className={`text-xs ${
                        darkMode ? "text-slate-400" : "text-slate-400"
                      }`}
                    >
                      Company Account
                    </p>
                  </div>

                  <span
                    className={`text-xs transition-transform ${
                      isProfileOpen ? "rotate-180" : ""
                    }`}
                  >
                    ▼
                  </span>
                </button>

                {isProfileOpen && (
                  <div
                    className={`absolute right-0 top-14 w-60 max-w-[calc(100vw-1rem)] rounded-xl border shadow-xl z-50 overflow-hidden ${
                      darkMode
                        ? "bg-slate-800 border-slate-700"
                        : "bg-white border-slate-200"
                    }`}
                  >
                    {/* PROFILE INFO */}

                    <div
                      className={`px-4 py-4 border-b ${
                        darkMode ? "border-slate-700" : "border-slate-200"
                      }`}
                    >
                      <p className="text-sm font-bold">Acme Corporation</p>

                      <p
                        className={`text-xs mt-1 ${
                          darkMode ? "text-slate-400" : "text-slate-500"
                        }`}
                      >
                        Company Account
                      </p>
                    </div>

                    {/* PROFILE */}

                    <button
                      type="button"
                      onClick={() => navigateTo("/company/profile")}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left ${
                        darkMode ? "hover:bg-slate-700" : "hover:bg-slate-50"
                      }`}
                    >
                      <span>🏢</span>
                      <span>Company Profile</span>
                    </button>

                    {/* SETTINGS */}

                    <button
                      type="button"
                      onClick={() => navigateTo("/company/settings")}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left ${
                        darkMode ? "hover:bg-slate-700" : "hover:bg-slate-50"
                      }`}
                    >
                      <span>⚙️</span>
                      <span>Settings</span>
                    </button>

                    {/* DARK MODE */}

                    <div
                      className={`border-t ${
                        darkMode ? "border-slate-700" : "border-slate-200"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={toggleDarkMode}
                        className={`w-full flex items-center justify-between px-4 py-3 text-sm text-left ${
                          darkMode ? "hover:bg-slate-700" : "hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span>{darkMode ? "☀️" : "🌙"}</span>

                          <span>{darkMode ? "Light Mode" : "Dark Mode"}</span>
                        </div>

                        <div
                          className={`w-9 h-5 rounded-full p-0.5 transition-colors ${
                            darkMode ? "bg-blue-600" : "bg-slate-300"
                          }`}
                        >
                          <div
                            className={`w-4 h-4 bg-white rounded-full transition-transform ${
                              darkMode ? "translate-x-4" : "translate-x-0"
                            }`}
                          />
                        </div>
                      </button>
                    </div>

                    {/* LOGOUT */}

                    <div
                      className={`border-t ${
                        darkMode ? "border-slate-700" : "border-slate-200"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={handleLogout}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left ${
                          darkMode
                            ? "text-red-400 hover:bg-red-950"
                            : "text-red-500 hover:bg-red-50"
                        }`}
                      >
                        <span>🚪</span>
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* ===================================================
              PAGE CONTENT
          =================================================== */}

          <main
            className={`min-w-0 min-h-[calc(100vh-5rem)] transition-colors duration-300 ${
              darkMode ? "bg-slate-950" : "bg-slate-50"
            }`}
          >
            <Outlet
              context={{
                darkMode,

                notifications,
                unreadCount,

                markNotificationRead,
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
          NOTIFICATION MODAL
      ===================================================== */}

      {selectedNotification && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={closeNotificationModal}
        >
          <div
            className={`w-full max-w-lg rounded-2xl shadow-2xl border overflow-hidden transition-colors ${
              darkMode
                ? "bg-slate-900 border-slate-700 text-white"
                : "bg-white border-slate-200 text-slate-900"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* MODAL HEADER */}

            <div
              className={`px-6 py-5 border-b flex items-start justify-between ${
                darkMode ? "border-slate-700" : "border-slate-200"
              }`}
            >
              <div className="flex gap-3">
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                    darkMode
                      ? "bg-blue-950 text-blue-400"
                      : "bg-blue-100 text-blue-600"
                  }`}
                >
                  🔔
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider font-bold text-slate-400">
                    Notification
                  </p>

                  <h2 className="text-lg font-black">
                    {selectedNotification.title}
                  </h2>
                </div>
              </div>

              <button
                type="button"
                onClick={closeNotificationModal}
                className={`w-8 h-8 rounded-lg text-xl text-slate-400 ${
                  darkMode ? "hover:bg-slate-800" : "hover:bg-slate-100"
                }`}
              >
                ×
              </button>
            </div>

            {/* MODAL CONTENT */}

            <div className="px-6 py-6">
              <p
                className={`text-sm leading-relaxed ${
                  darkMode ? "text-slate-300" : "text-slate-600"
                }`}
              >
                {selectedNotification.message}
              </p>

              {/* RELATED RECORD */}

              <div
                className={`mt-5 p-4 rounded-xl border ${
                  darkMode
                    ? "bg-slate-800 border-slate-700"
                    : "bg-slate-50 border-slate-100"
                }`}
              >
                <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  Related Record
                </p>

                <p className="text-sm font-semibold mt-1">
                  {selectedNotification.relatedEntityType}
                </p>

                <p
                  className={`text-xs mt-1 ${
                    darkMode ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  ID: {selectedNotification.relatedEntityId}
                </p>

                <p
                  className={`text-xs mt-2 ${
                    darkMode ? "text-slate-500" : "text-slate-400"
                  }`}
                >
                  {new Date(selectedNotification.createdAt).toLocaleString()}
                </p>
              </div>

              {/* CONTROLS */}

              <div className="mt-6 flex flex-wrap justify-end gap-2">
                {/* APPLICATION */}

                {selectedNotification.relatedEntityType ===
                  "InternshipApplication" && (
                  <button
                    type="button"
                    onClick={() => {
                      closeNotificationModal();
                      navigateTo("/company/applications");
                    }}
                    className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition"
                  >
                    View Application
                  </button>
                )}

                {/* DOCUMENTS */}

                {selectedNotification.relatedEntityType ===
                  "DocumentSubmission" && (
                  <button
                    type="button"
                    onClick={() => {
                      closeNotificationModal();
                      navigateTo("/company/documents");
                    }}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition"
                  >
                    View Documents
                  </button>
                )}

                {/* INFORMATION */}

                {selectedNotification.relatedEntityType ===
                  "InformationItem" && (
                  <button
                    type="button"
                    onClick={() => {
                      closeNotificationModal();
                      navigateTo("/company/info");
                    }}
                    className="px-4 py-2.5 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 transition"
                  >
                    View Information
                  </button>
                )}

                {/* MARK AS READ */}

                {!selectedNotification.readAt && (
                  <button
                    type="button"
                    onClick={() => {
                      markNotificationRead(selectedNotification.id);

                      setSelectedNotification((previous) =>
                        previous
                          ? {
                              ...previous,
                              readAt: new Date().toISOString(),
                            }
                          : previous
                      );
                    }}
                    className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition ${
                      darkMode
                        ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                        : "border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    Mark as Read
                  </button>
                )}

                {/* DELETE */}

                <button
                  type="button"
                  onClick={() => {
                    deleteNotification(selectedNotification.id);
                  }}
                  className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition ${
                    darkMode
                      ? "border-red-900 text-red-400 hover:bg-red-950"
                      : "border-red-200 text-red-500 hover:bg-red-50"
                  }`}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyPortalLayout;
