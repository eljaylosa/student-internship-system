import React, { useEffect, useRef, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

// =========================================================
// NOTIFICATIONS DATA
// =========================================================

const notifications = [
  {
    id: 1,
    title: "Application Approved",
    message: "Your internship application has been approved.",
    time: "2 hrs ago",
    unread: true,
  },
  {
    id: 2,
    title: "Document Reviewed",
    message: "Your submitted document has been reviewed.",
    time: "1 day ago",
    unread: true,
  },
  {
    id: 3,
    title: "New Message",
    message: "You have received a new message.",
    time: "2 days ago",
    unread: false,
  },
];

// =========================================================
// COMPONENT
// =========================================================

const StudentPortalLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // =========================================================
  // SIDEBAR
  // =========================================================

  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [isResizing, setIsResizing] = useState(false);

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
  // =========================================================

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("studentPortalDarkMode") === "true";
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    localStorage.setItem("studentPortalDarkMode", darkMode);
  }, [darkMode]);

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
      path: "/student/dashboard",
    },
    {
      name: "My Profile",
      icon: "👤",
      path: "/student/profile",
    },
    {
      name: "Application",
      icon: "📋",
      path: "/student/application",
    },
    {
      name: "Documents",
      icon: "📁",
      path: "/student/documents",
    },
    {
      name: "Notifications",
      icon: "🔔",
      path: "/student/notifications",
    },
    {
      name: "Info",
      icon: "ⓘ",
      path: "/student/info",
    },
    {
      name: "Messages",
      icon: "💬",
      path: "/student/messages",
    },
    {
      name: "Settings",
      icon: "⚙",
      path: "/student/settings",
    },
  ];

  // =========================================================
  // EXPANDABLE MENUS
  // =========================================================

  const [expandedMenus, setExpandedMenus] = useState({
    "Internship Application": false,
    "Document Submission": false,
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
      return "Student Portal";
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
    setIsProfileOpen(false);
    setIsNotificationOpen(false);

    navigate("/", { replace: true });
  };

  // =========================================================
  // DARK MODE
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
            SIDEBAR
        ===================================================== */}

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
            className={`h-20 px-6 flex items-center border-b transition-colors ${
              darkMode ? "border-slate-700" : "border-slate-100"
            }`}
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${
                darkMode ? "bg-white text-slate-900" : "bg-slate-900 text-white"
              }`}
            >
              S
            </div>

            <div className="ml-3">
              <h1 className="font-bold text-lg tracking-tight">SIMS</h1>

              <p className="text-xs text-slate-400">Student Environment</p>
            </div>
          </div>

          {/* NAVIGATION */}

          <div className="flex-1 overflow-y-auto px-3 py-4">
            <h3 className="mb-4 p-2 bg-red-500">
              Note: All data on this page are all dummy data's*
              <br /> 
              No real data's are used in this project.
              No Database is implemented yet
            </h3>
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

                    {/* SUBMENU */}

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
                              className={`relative w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium text-left transition-all duration-200 ${
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
                                className={`absolute -left-3 top-1/2 w-3 h-px ${
                                  darkMode ? "bg-slate-700" : "bg-slate-200"
                                }`}
                              />

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
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${
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
                ? "bg-transparent hover:bg-slate-700"
                : "bg-transparent hover:bg-slate-300"
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
            className={`h-20 border-b flex items-center justify-between px-6 lg:px-8 relative transition-colors duration-300 ${
              darkMode
                ? "bg-slate-900 border-slate-700 text-white"
                : "bg-white border-slate-200 text-slate-900"
            }`}
          >
            {/* PAGE TITLE */}

            <div>
              <p
                className={`text-sm ${
                  darkMode ? "text-slate-400" : "text-slate-400"
                }`}
              >
                Student Portal
              </p>

              <h2 className="font-bold text-lg">{getPageTitle()}</h2>
            </div>

            {/* RIGHT SIDE */}

            <div className="flex items-center gap-3">
              {/* =================================================
                  NOTIFICATION BELL
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
                >
                  <span className="text-lg">🔔</span>

                  {/* RED NOTIFICATION DOT */}

                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
                </button>

                {/* =================================================
                    NOTIFICATION CARD
                ================================================= */}

                {isNotificationOpen && (
                  <div
                    className={`absolute right-0 top-12 w-80 border rounded-xl shadow-xl z-50 overflow-hidden ${
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
                          Recent updates
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
                            navigate("/student/notifications");
                          }}
                          className={`w-full text-left px-4 py-3 border-b transition ${
                            darkMode
                              ? "border-slate-700 hover:bg-slate-700"
                              : "border-slate-100 hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex gap-3">
                            {/* UNREAD DOT */}

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
                        navigate("/student/notifications");
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
                  className={`flex items-center gap-3 px-2 py-1.5 rounded-xl transition ${
                    darkMode ? "hover:bg-slate-800" : "hover:bg-slate-100"
                  }`}
                >
                  {/* AVATAR */}

                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                      darkMode
                        ? "bg-white text-slate-900"
                        : "bg-slate-900 text-white"
                    }`}
                  >
                    JD
                  </div>

                  {/* USER INFO */}

                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-semibold">John Doe</p>

                    <p
                      className={`text-xs ${
                        darkMode ? "text-slate-400" : "text-slate-400"
                      }`}
                    >
                      BS Information Technology
                    </p>
                  </div>

                  {/* ARROW */}

                  <span
                    className={`text-xs transition-transform ${
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
                    className={`absolute right-0 top-14 w-60 rounded-xl border shadow-xl z-50 overflow-hidden ${
                      darkMode
                        ? "bg-slate-800 border-slate-700"
                        : "bg-white border-slate-200"
                    }`}
                  >
                    {/* USER HEADER */}

                    <div
                      className={`px-4 py-4 border-b ${
                        darkMode ? "border-slate-700" : "border-slate-200"
                      }`}
                    >
                      <p className="text-sm font-bold">John Doe</p>

                      <p
                        className={`text-xs mt-1 ${
                          darkMode ? "text-slate-400" : "text-slate-500"
                        }`}
                      >
                        Student Account
                      </p>
                    </div>

                    {/* MY PROFILE */}

                    <button
                      type="button"
                      onClick={() => navigateTo("/student/profile")}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition ${
                        darkMode ? "hover:bg-slate-700" : "hover:bg-slate-50"
                      }`}
                    >
                      <span>👤</span>
                      <span>My Profile</span>
                    </button>

                    {/* SETTINGS */}

                    <button
                      type="button"
                      onClick={() => navigateTo("/student/settings")}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition ${
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
                        className={`w-full flex items-center justify-between px-4 py-3 text-sm text-left transition ${
                          darkMode ? "hover:bg-slate-700" : "hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span>{darkMode ? "☀️" : "🌙"}</span>

                          <span>{darkMode ? "Light Mode" : "Dark Mode"}</span>
                        </div>

                        {/* TOGGLE */}

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

          {/* ===================================================
              PAGE CONTENT
          =================================================== */}

          <main
            className={`min-w-0 min-h-[calc(100vh-5rem)] transition-colors duration-300 ${
              darkMode ? "bg-slate-950" : "bg-slate-50"
            }`}
          >
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default StudentPortalLayout;
