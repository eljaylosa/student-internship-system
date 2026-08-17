import React, { useEffect, useRef, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

// =========================================================
// NOTIFICATIONS DATA
// =========================================================

const notifications = [
  {
    id: 1,
    title: "New Student Account",
    message: "A new student account has been registered.",
    time: "1 hr ago",
    unread: true,
  },
  {
    id: 2,
    title: "New Company Registration",
    message: "A company is waiting for account approval.",
    time: "3 hrs ago",
    unread: true,
  },
  {
    id: 3,
    title: "System Update",
    message: "The internship management system was updated.",
    time: "1 day ago",
    unread: false,
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
  // DARK MODE
  // LIGHT MODE IS DEFAULT
  // =========================================================

  const [darkMode, setDarkMode] = useState(false);

  // =========================================================
  // SIDEBAR ITEMS
  // =========================================================

  const sidebarItems = [
    {
      name: "Dashboard",
      number: "1.",
      icon: "▦",
      path: "/admin/dashboard",
    },
    {
      name: "User Management",
      number: "2.",
      icon: "👥",
      path: "/admin/users",
    },
    {
      name: "Company Management",
      number: "3.",
      icon: "▦",
      path: "/admin/companies",
    },
    {
      name: "Internship Records",
      number: "4.",
      icon: "▣",
      path: "/admin/internships",
    },
    {
      name: "Document Management",
      number: "5.",
      icon: "▰",
      path: "/admin/documents",
    },
    {
      name: "Evaluation Management",
      number: "6.",
      icon: "★",
      path: "/admin/evaluations",
    },
    {
      name: "Reports",
      number: "7.",
      icon: "▥",
      path: "/admin/reports",
    },
    {
      name: "System Notifications",
      number: "8.",
      icon: "♟",
      path: "/admin/notifications",
      badge: true,
    },
    {
      name: "System Settings",
      number: "9.",
      icon: "⚙",
      path: "/admin/settings",
    },
    {
      name: "Audit Logs",
      number: "10.",
      icon: "▤",
      path: "/admin/audit-logs",
    },
  ];

  // =========================================================
  // APPLY DARK MODE
  // =========================================================

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    return () => {
      document.documentElement.classList.remove("dark");
    };
  }, [darkMode]);

  // =========================================================
  // MOBILE SIDEBAR BEHAVIOR
  // =========================================================

  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [location.pathname]);

  // =========================================================
  // ESCAPE KEY
  // =========================================================

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsMobileSidebarOpen(false);
        setIsProfileOpen(false);
        setIsNotificationOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  // =========================================================
  // PREVENT BACKGROUND SCROLLING ON MOBILE
  // =========================================================

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
  // SIDEBAR RESIZE
  // =========================================================

  const handleSidebarResizeStart = (e) => {
    e.preventDefault();

    setIsResizing(true);

    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const handleSidebarResize = (e) => {
    if (!isResizing) return;

    const minWidth = 230;
    const maxWidth = 340;

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
    setIsProfileOpen(false);
    setIsNotificationOpen(false);
    setIsMobileSidebarOpen(false);

    navigate(path);
  };

  // =========================================================
  // ACTIVE PATH
  // =========================================================

  const isPathActive = (path) => {
    return location.pathname === path;
  };

  // =========================================================
  // CURRENT SIDEBAR ITEM
  // =========================================================

  const currentItem = sidebarItems.find(
    (item) => item.path === location.pathname
  );

  // =========================================================
  // PAGE TITLE
  // =========================================================

  const getPageTitle = () => {
    if (currentItem) {
      return currentItem.name;
    }

    if (location.pathname === "/admin/profile") {
      return "Administrator Profile";
    }

    return "Administrator Portal";
  };

  const pageTitle = getPageTitle();

  // =========================================================
  // LOGOUT
  // =========================================================

  const handleLogout = () => {
    setIsProfileOpen(false);
    setIsNotificationOpen(false);
    setIsMobileSidebarOpen(false);

    navigate("/admin/login", { replace: true });
  };

  // =========================================================
  // DARK MODE
  // =========================================================

  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };

  // =========================================================
  // DEMO NOTICE
  // =========================================================

  const renderDemoNotice = () => {
    return (
      <div
        className={`mb-3 p-3 rounded-lg text-[10px] leading-relaxed border ${
          darkMode
            ? "bg-red-950/40 border-red-900 text-red-300"
            : "bg-red-50 border-red-200 text-red-700"
        }`}
      >
        <p className="font-bold mb-1">⚠️ Demo Project</p>

        <p>All data on this page are dummy data. No real data are used.</p>

        <p className="mt-1">No database is implemented yet.</p>
      </div>
    );
  };

  // =========================================================
  // SIDEBAR NAVIGATION
  // =========================================================

  const renderNavigation = () => {
    return (
      <nav className="space-y-1">
        {sidebarItems.map((item) => {
          const active = isPathActive(item.path);

          return (
            <button
              key={item.name}
              type="button"
              onClick={() => navigateTo(item.path)}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-[11px] font-semibold transition ${
                active
                  ? darkMode
                    ? "bg-white text-slate-900"
                    : "bg-slate-800 text-white"
                  : darkMode
                  ? "text-slate-300 hover:bg-slate-800 hover:text-white"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-5 text-center flex-shrink-0">
                  {item.icon}
                </span>

                <span className="truncate">
                  {item.number} {item.name}
                </span>
              </div>

              {item.badge && (
                <span
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    active ? "bg-current" : "bg-red-500"
                  }`}
                />
              )}
            </button>
          );
        })}
      </nav>
    );
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
        {/* ===================================================
            DESKTOP SIDEBAR
        =================================================== */}

        <aside
          style={{ width: `${sidebarWidth}px` }}
          className={`relative hidden lg:flex flex-col flex-shrink-0 border-r transition-colors duration-300 ${
            darkMode
              ? "bg-slate-900 border-slate-700"
              : "bg-white border-slate-200"
          } ${isResizing ? "select-none" : ""}`}
        >
          {/* LOGO */}

          <div
            className={`min-h-[72px] px-4 flex items-center border-b ${
              darkMode ? "border-slate-700" : "border-slate-100"
            }`}
          >
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg ${
                darkMode ? "bg-white text-slate-900" : "bg-slate-800 text-white"
              }`}
            >
              🛡
            </div>

            <div className="ml-3 min-w-0">
              <h1 className="font-bold text-sm tracking-tight truncate">
                ADMINISTRATOR PORTAL
              </h1>

              <p className="text-[10px] text-slate-400 mt-0.5">
                SIMS Administration
              </p>
            </div>
          </div>

          {/* NAVIGATION */}

          <div className="flex-1 overflow-y-auto px-3 py-3">
            {renderDemoNotice()}

            {renderNavigation()}
          </div>

          {/* LOGOUT */}

          <div
            className={`p-3 border-t ${
              darkMode ? "border-slate-700" : "border-slate-100"
            }`}
          >
            <button
              type="button"
              onClick={handleLogout}
              className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-[11px] font-semibold transition ${
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

        {/* ===================================================
            MOBILE OVERLAY
        =================================================== */}

        {isMobileSidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}

        {/* ===================================================
            MOBILE SIDEBAR
        =================================================== */}

        <aside
          className={`fixed top-0 left-0 z-50 h-full w-[280px] max-w-[85vw] flex flex-col border-r transition-transform duration-300 lg:hidden ${
            isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
          } ${
            darkMode
              ? "bg-slate-900 border-slate-700"
              : "bg-white border-slate-200"
          }`}
        >
          {/* MOBILE HEADER */}

          <div
            className={`min-h-[72px] px-4 flex items-center justify-between border-b ${
              darkMode ? "border-slate-700" : "border-slate-100"
            }`}
          >
            <div className="flex items-center">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg ${
                  darkMode
                    ? "bg-white text-slate-900"
                    : "bg-slate-800 text-white"
                }`}
              >
                🛡
              </div>

              <div className="ml-3">
                <h1 className="font-bold text-sm">ADMINISTRATOR PORTAL</h1>

                <p className="text-[10px] text-slate-400">
                  SIMS Administration
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(false)}
              aria-label="Close navigation menu"
              className={`w-9 h-9 rounded-lg flex items-center justify-center text-xl transition ${
                darkMode
                  ? "text-slate-300 hover:bg-slate-800"
                  : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              ×
            </button>
          </div>

          {/* MOBILE NAVIGATION */}

          <div className="flex-1 overflow-y-auto px-3 py-3">
            {renderDemoNotice()}

            {renderNavigation()}
          </div>

          {/* MOBILE LOGOUT */}

          <div
            className={`p-3 border-t ${
              darkMode ? "border-slate-700" : "border-slate-100"
            }`}
          >
            <button
              type="button"
              onClick={handleLogout}
              className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-[11px] font-semibold transition ${
                darkMode
                  ? "text-slate-400 hover:bg-red-950 hover:text-red-400"
                  : "text-slate-500 hover:bg-red-50 hover:text-red-600"
              }`}
            >
              <span>🚪</span>
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* ===================================================
            MAIN AREA
        =================================================== */}

        <div className="flex-1 min-w-0">
          {/* =================================================
              NAVBAR
          ================================================= */}

          <header
            className={`h-16 sm:h-20 border-b flex items-center justify-between px-4 sm:px-6 lg:px-8 relative transition-colors duration-300 ${
              darkMode
                ? "bg-slate-900 border-slate-700 text-white"
                : "bg-white border-slate-200 text-slate-900"
            }`}
          >
            {/* LEFT */}

            <div className="flex items-center min-w-0">
              {/* MOBILE MENU */}

              <button
                type="button"
                onClick={() => {
                  setIsMobileSidebarOpen(true);
                  setIsProfileOpen(false);
                  setIsNotificationOpen(false);
                }}
                aria-label="Open navigation menu"
                className={`lg:hidden w-10 h-10 mr-3 rounded-xl flex items-center justify-center text-xl flex-shrink-0 transition ${
                  darkMode ? "hover:bg-slate-800" : "hover:bg-slate-100"
                }`}
              >
                ☰
              </button>

              {/* PAGE TITLE */}

              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-slate-400">
                  Administrator Portal
                </p>

                <h2 className="font-bold text-sm sm:text-lg truncate">
                  {pageTitle}
                </h2>
              </div>
            </div>

            {/* RIGHT */}

            <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
              {/* =================================================
                  NOTIFICATIONS
              ================================================= */}

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
                  aria-label="Notifications"
                >
                  <span className="text-lg">🔔</span>

                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
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
                          Recent system updates
                        </p>
                      </div>

                      <span className="text-xs bg-red-500 text-white px-2 py-1 rounded-full">
                        2 New
                      </span>
                    </div>

                    {/* NOTIFICATION LIST */}

                    <div className="max-h-80 overflow-y-auto">
                      {notifications.map((notification) => (
                        <button
                          key={notification.id}
                          type="button"
                          onClick={() => {
                            setIsNotificationOpen(false);

                            navigateTo("/admin/notifications");
                          }}
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
                                  notification.unread
                                    ? "bg-blue-500"
                                    : "bg-slate-300"
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
                                  {notification.time}
                                </span>
                              </div>

                              <p
                                className={`text-xs mt-1 line-clamp-2 ${
                                  darkMode ? "text-slate-400" : "text-slate-500"
                                }`}
                              >
                                {notification.message}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* VIEW ALL */}

                    <button
                      type="button"
                      onClick={() => {
                        setIsNotificationOpen(false);

                        navigateTo("/admin/notifications");
                      }}
                      className={`w-full py-3 text-xs font-bold transition ${
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

              {/* =================================================
                  PROFILE DROPDOWN
              ================================================= */}

              <div className="relative" ref={profileMenuRef}>
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen((prev) => !prev);
                    setIsNotificationOpen(false);
                  }}
                  className={`flex items-center gap-2 sm:gap-3 px-2 py-1.5 rounded-xl transition ${
                    darkMode ? "hover:bg-slate-800" : "hover:bg-slate-100"
                  }`}
                >
                  {/* AVATAR */}

                  <div
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm ${
                      darkMode
                        ? "bg-white text-slate-900"
                        : "bg-slate-800 text-white"
                    }`}
                  >
                    AD
                  </div>

                  {/* ADMIN INFO */}

                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-semibold">
                      System Administrator
                    </p>

                    <p className="text-xs text-slate-400">Administrator</p>
                  </div>

                  <span
                    className={`hidden sm:block text-xs transition-transform ${
                      isProfileOpen ? "rotate-180" : ""
                    }`}
                  >
                    ▼
                  </span>
                </button>

                {/* =================================================
                    PROFILE MENU
                ================================================= */}

                {isProfileOpen && (
                  <div
                    className={`absolute right-0 top-14 w-60 max-w-[calc(100vw-1rem)] rounded-xl border shadow-xl z-50 overflow-hidden ${
                      darkMode
                        ? "bg-slate-800 border-slate-700"
                        : "bg-white border-slate-200"
                    }`}
                  >
                    {/* HEADER */}

                    <div
                      className={`px-4 py-4 border-b ${
                        darkMode ? "border-slate-700" : "border-slate-200"
                      }`}
                    >
                      <p className="text-sm font-bold">System Administrator</p>

                      <p
                        className={`text-xs mt-1 ${
                          darkMode ? "text-slate-400" : "text-slate-500"
                        }`}
                      >
                        Administrator Account
                      </p>
                    </div>

                    {/* PROFILE */}

                    <button
                      type="button"
                      onClick={() => navigateTo("/admin/profile")}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition ${
                        darkMode ? "hover:bg-slate-700" : "hover:bg-slate-50"
                      }`}
                    >
                      <span>👤</span>
                      <span>My Profile</span>
                    </button>

                    {/* SYSTEM SETTINGS */}

                    <button
                      type="button"
                      onClick={() => navigateTo("/admin/settings")}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition ${
                        darkMode ? "hover:bg-slate-700" : "hover:bg-slate-50"
                      }`}
                    >
                      <span>⚙️</span>
                      <span>System Settings</span>
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
                        className={`w-full flex items-center justify-between px-4 py-3 text-sm text-left transition ${
                          darkMode ? "hover:bg-slate-700" : "hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span>{darkMode ? "☀️" : "🌙"}</span>

                          <span>{darkMode ? "Light Mode" : "Dark Mode"}</span>
                        </div>

                        <div
                          className={`w-9 h-5 rounded-full p-0.5 transition ${
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
                        className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition ${
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

          {/* =================================================
              PAGE CONTENT
          ================================================= */}

          <main
            className={`min-w-0 min-h-[calc(100vh-5rem)] transition-colors duration-300 ${
              darkMode ? "bg-slate-950" : "bg-slate-50"
            }`}
          >
            <Outlet context={{ darkMode }} />
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminPortalLayout;
