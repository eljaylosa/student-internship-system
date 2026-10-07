import React, { useEffect, useRef, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { supabaseStudent } from "../../supabaseClient";

const STORAGE_BUCKET = "profile-photos";

/* =========================================================
   COMPONENT
   ========================================================= */
export default function StudentPortalLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  /* =========================================================
     STUDENT PROFILE
     ========================================================= */
  const [fullName, setFullName] = useState("Student");
  const [program, setProgram] = useState("Student");
  const [profilePhoto, setProfilePhoto] = useState(null);

  /* =========================================================
     SIDEBAR
     ========================================================= */
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [isResizing, setIsResizing] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  /* =========================================================
     DROPDOWNS
     ========================================================= */
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const profileRef = useRef(null);
  const notificationRef = useRef(null);

  /* =========================================================
     NOTIFICATIONS
     ========================================================= */
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [notificationActionLoading, setNotificationActionLoading] =
    useState(false);

  /* =========================================================
     DARK MODE
     ========================================================= */
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("studentPortalDarkMode") === "true";
  });

  /* =========================================================
     SUBMENUS
     ========================================================= */
  const [expandedMenus, setExpandedMenus] = useState({});

  /* =========================================================
     LOGOUT CONFIRMATION
     ========================================================= */
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  /* =========================================================
     SIDEBAR ITEMS
     ========================================================= */
  const sidebarItems = [
    {
      label: "Dashboard",
      path: "/student/dashboard",
      icon: "▦",
    },
    {
      label: "My Profile",
      path: "/student/profile",
      icon: "👤",
    },
    {
      label: "View Opportunities",
      path: "/student/application",
      icon: "📝",
    },
    // {
    //   label: "Upload Documents",
    //   path: "/student/documents",
    //   icon: "📁",
    // },
    {
      label: "View Full Status",
      path: "/student/status",
      icon: "📊",
    },
    {
      label: "Evaluations",
      path: "/student/evaluation",
      icon: "⭐",
    },
    // {
    //   label: "Document Template",
    //   path: "/student/templates",
    //   icon: "📄",
    // },
    {
      label: "Notifications",
      path: "/student/notifications",
      icon: "🔔",
    },
    // {
    //   label: "Information",
    //   path: "/student/info",
    //   icon: "ℹ️",
    // },
    {
      label: "Messages",
      path: "/student/messages",
      icon: "💬",
    },
    {
      label: "Settings",
      path: "/student/settings",
      icon: "⚙️",
    },
  ];

  /* =========================================================
     LOAD STUDENT PROFILE
     ========================================================= */
  useEffect(() => {
    loadStudentProfile();
  }, []);

  /* =========================================================
     LOAD NOTIFICATIONS
     ========================================================= */
  useEffect(() => {
    loadNotifications();
  }, []);

  /* =========================================================
   LOAD NOTIFICATIONS + REALTIME
   ========================================================= */
  useEffect(() => {
    let channel = null;
    let isMounted = true;

    const initializeNotifications = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabaseStudent.auth.getUser();

      if (userError) {
        console.error(
          "[Student Notifications] Unable to get authenticated student:",
          userError
        );
        return;
      }

      if (!user || !isMounted) {
        return;
      }

      // Initial notification load
      await loadNotifications();

      // =====================================================
      // REALTIME SUBSCRIPTION
      // =====================================================

      channel = supabaseStudent
        .channel(`student-notifications-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "notifications",
            filter: `recipient_id=eq.${user.id}`,
          },
          (payload) => {
            if (!isMounted) return;

            console.log(
              "[Student Notifications] Realtime event:",
              payload.eventType,
              payload
            );

            // =================================================
            // INSERT
            // =================================================

            if (payload.eventType === "INSERT") {
              const notification = payload.new;

              const normalizedNotification = {
                id: notification.id,
                title: notification.title,
                message: notification.message,

                type: notification.type,
                category: notification.category,

                relatedEntityType: notification.related_entity_type,
                relatedEntityId: notification.related_entity_id,

                actionPath:
                  notification.action_path === "/student/view-status"
                    ? "/student/status"
                    : notification.action_path || "/student/notifications",

                createdAt: notification.created_at,
                readAt: notification.read_at,
              };

              setNotifications((previous) => {
                // Prevent duplicate notifications
                if (
                  previous.some((item) => item.id === normalizedNotification.id)
                ) {
                  return previous;
                }

                return [normalizedNotification, ...previous].slice(0, 10);
              });

              return;
            }

            // =================================================
            // UPDATE
            // =================================================

            if (payload.eventType === "UPDATE") {
              const notification = payload.new;

              setNotifications((previous) =>
                previous.map((item) =>
                  item.id === notification.id
                    ? {
                        ...item,
                        title: notification.title,
                        message: notification.message,
                        type: notification.type,
                        category: notification.category,
                        relatedEntityType: notification.related_entity_type,
                        relatedEntityId: notification.related_entity_id,
                        actionPath:
                          notification.action_path === "/student/view-status"
                            ? "/student/status"
                            : notification.action_path ||
                              item.actionPath ||
                              "/student/notifications",
                        createdAt: notification.created_at,
                        readAt: notification.read_at,
                      }
                    : item
                )
              );

              return;
            }

            // =================================================
            // DELETE
            // =================================================

            if (payload.eventType === "DELETE") {
              const notification = payload.old;

              setNotifications((previous) =>
                previous.filter((item) => item.id !== notification.id)
              );
            }
          }
        )
        .subscribe((status) => {
          console.log("[Student Notifications] Realtime status:", status);
        });
    };

    initializeNotifications();

    return () => {
      isMounted = false;

      if (channel) {
        supabaseStudent.removeChannel(channel);
      }
    };
  }, []);

  const getProfilePhotoUrl = async (photoPath) => {
    if (!photoPath) return null;

    try {
      let cleanPath = String(photoPath).trim();

      /*
       * If profile_photo_url is already a full URL,
       * use it directly.
       */
      if (/^https?:\/\//i.test(cleanPath)) {
        return cleanPath;
      }

      /*
       * Remove only a leading slash.
       */
      cleanPath = cleanPath.replace(/^\/+/, "");

      /*
       * The SIMS database currently stores the profile photo
       * path including the bucket name:
       *
       * profile-photos/user-id/profile-photo.jpg
       *
       * Since the actual Storage object uses that exact path
       * inside the profile-photos bucket, KEEP the prefix here.
       */
      const { data, error } = supabaseStudent.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(cleanPath);

      if (error) {
        console.error("Error creating profile photo URL:", error);
        return null;
      }

      return data?.publicUrl || null;
    } catch (error) {
      console.error("Profile photo URL error:", error);
      return null;
    }
  };
  const loadStudentProfile = async () => {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabaseStudent.auth.getUser();

      if (authError) {
        console.error("Auth error:", authError);
        return;
      }

      if (!user) return;

      /* =====================================================
         USERS
         ===================================================== */
      const { data: userData, error: userError } = await supabaseStudent
        .from("users")
        .select(
          `
              id,
              first_name,
              middle_name,
              last_name
            `
        )
        .eq("id", user.id)
        .maybeSingle();

      if (userError) {
        console.error("User profile error:", userError);
      }

      if (userData) {
        const nameParts = [
          userData.first_name,
          userData.middle_name,
          userData.last_name,
        ].filter(Boolean);

        if (nameParts.length > 0) {
          setFullName(nameParts.join(" "));
        }
      }

      /* =====================================================
         STUDENTS
         ===================================================== */
      const { data: studentData, error: studentError } = await supabaseStudent
        .from("students")
        .select(
          `
              program,
              profile_photo_url
            `
        )
        .eq("id", user.id)
        .maybeSingle();

      if (studentError) {
        console.error("Student profile error:", studentError);
      }

      if (studentData) {
        if (studentData.program) {
          setProgram(studentData.program);
        }

        if (studentData.profile_photo_url) {
          const signedUrl = await getProfilePhotoUrl(
            studentData.profile_photo_url
          );

          setProfilePhoto(signedUrl);
        } else {
          setProfilePhoto(null);
        }
      }
    } catch (error) {
      console.error("Failed to load student profile:", error);
    }
  };

  /* =========================================================
     LOAD NOTIFICATIONS
     ========================================================= */
  const loadNotifications = async () => {
    try {
      setNotificationsLoading(true);

      const {
        data: { user },
        error: userError,
      } = await supabaseStudent.auth.getUser();

      if (userError) {
        console.error("Unable to get authenticated student:", userError);

        setNotifications([]);
        return;
      }

      if (!user) {
        setNotifications([]);
        return;
      }

      const { data, error } = await supabaseStudent
        .from("notifications")
        .select(
          `
            id,
            recipient_id,
            recipient_role,
            type,
            category,
            title,
            message,
            related_entity_type,
            related_entity_id,
            action_path,
            created_by,
            read_at,
            created_at
          `
        )
        .eq("recipient_id", user.id)
        .order("created_at", {
          ascending: false,
        })
        .limit(10);

      if (error) {
        console.error("Error loading student notifications:", error);

        setNotifications([]);
        return;
      }

      const getStudentNotificationActionPath = (notification) => {
        if (!notification) {
          return "/student/notifications";
        }

        const type = String(notification.type || "").toLowerCase();
        const category = String(notification.category || "").toLowerCase();
        const relatedEntityType = String(
          notification.related_entity_type || ""
        ).toLowerCase();

        /*
         * =========================================================
         * APPLICATION NOTIFICATIONS
         * =========================================================
         *
         * All application-related notifications should open
         * the Student Full Status page.
         *
         * This also fixes older notifications that may still contain
         * /student/view-status in the database.
         */
        if (
          relatedEntityType === "internshipapplication" ||
          type.includes("application") ||
          category.includes("application")
        ) {
          return "/student/status";
        }

        /*
         * =========================================================
         * DOCUMENT NOTIFICATIONS
         * =========================================================
         */
        if (
          relatedEntityType === "documentsubmission" ||
          type.includes("document") ||
          category.includes("document")
        ) {
          return "/student/status";
        }

        /*
         * =========================================================
         * DEPLOYMENT / ASSIGNMENT NOTIFICATIONS
         * =========================================================
         */
        if (
          relatedEntityType === "internshipassignment" ||
          relatedEntityType === "assignment" ||
          type.includes("deployment") ||
          type.includes("assignment") ||
          category.includes("internship")
        ) {
          return "/student/status";
        }

        /*
         * =========================================================
         * FALLBACK
         * =========================================================
         *
         * Keep the database action_path for other notification
         * types, but never use the old incorrect View Status route.
         */
        const databasePath = notification.action_path;

        if (databasePath === "/student/view-status") {
          return "/student/status";
        }

        return databasePath || "/student/notifications";
      };

      const normalizedNotifications = (data || []).map((notification) => ({
        id: notification.id,
        title: notification.title,
        message: notification.message,

        type: notification.type,
        category: notification.category,

        relatedEntityType: notification.related_entity_type,

        relatedEntityId: notification.related_entity_id,

        actionPath: getStudentNotificationActionPath(notification),

        createdAt: notification.created_at,
        readAt: notification.read_at,
      }));

      setNotifications(normalizedNotifications);
    } catch (error) {
      console.error("Unexpected error loading notifications:", error);

      setNotifications([]);
    } finally {
      setNotificationsLoading(false);
    }
  };

  /* =========================================================
     NOTIFICATION COUNTS
     ========================================================= */
  const unreadCount = notifications.filter(
    (notification) => !notification.readAt
  ).length;

  /* =========================================================
     DARK MODE
     ========================================================= */
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    localStorage.setItem("studentPortalDarkMode", darkMode.toString());
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode((previous) => !previous);
  };

  /* =========================================================
     CLOSE MOBILE SIDEBAR ON ROUTE CHANGE
     ========================================================= */
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [location.pathname]);

  /* =========================================================
     MOBILE BODY SCROLL LOCK
     ========================================================= */
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

  /* =========================================================
     ESCAPE KEY
     ========================================================= */
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key !== "Escape") return;

      setIsMobileSidebarOpen(false);
      setIsNotificationOpen(false);
      setIsProfileOpen(false);
      setShowLogoutConfirm(false);
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  /* =========================================================
     CLICK OUTSIDE DROPDOWNS
     ========================================================= */
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

  /* =========================================================
     SIDEBAR RESIZE
     ========================================================= */
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (event) => {
      const newWidth = Math.min(Math.max(event.clientX, 240), 360);

      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener("mousemove", handleMouseMove);

    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);

      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  /* =========================================================
     NAVIGATION
     ========================================================= */
  const navigateTo = (path) => {
    navigate(path);
    setIsMobileSidebarOpen(false);
    setIsProfileOpen(false);
    setIsNotificationOpen(false);
  };

  /* =========================================================
     SUBMENU
     ========================================================= */
  const toggleSubmenu = (label) => {
    setExpandedMenus((previous) => ({
      ...previous,
      [label]: !previous[label],
    }));
  };

  /* =========================================================
     ACTIVE PATH
     ========================================================= */
  const isPathActive = (path) => {
    return location.pathname === path;
  };

  const isChildActive = (children = []) => {
    return children.some((child) => location.pathname === child.path);
  };

  /* =========================================================
     PAGE TITLE
     ========================================================= */
  const getPageTitle = () => {
    const currentItem = sidebarItems.find(
      (item) => item.path === location.pathname
    );

    if (currentItem) return currentItem.label;

    return "Student Portal";
  };

  /* =========================================================
     AUDIT LOG
     ========================================================= */
  const createAuditLog = async ({
    action,
    module,
    targetEntityType = null,
    targetEntityId = null,
    details = null,
  }) => {
    try {
      const { data, error } = await supabaseStudent.functions.invoke(
        "create-audit-log",
        {
          body: {
            action,
            module,
            target_entity_type: targetEntityType,
            target_entity_id: targetEntityId,
            details,
          },
        }
      );

      if (error) {
        console.error("Create audit log function error:", error);

        return null;
      }

      if (!data?.success) {
        console.error("Create audit log failed:", data?.error);

        return null;
      }

      console.log("Audit log created successfully:", data.auditLog);

      return data.auditLog;
    } catch (error) {
      console.error("Unexpected audit log error:", error);

      return null;
    }
  };

  /* =========================================================
     LOGOUT
     ========================================================= */
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

      // =====================================================
      // GET CURRENT AUTHENTICATED USER
      // =====================================================

      const {
        data: { user },
        error: userError,
      } = await supabaseStudent.auth.getUser();

      if (userError) {
        console.error("Unable to get current user before logout:", userError);
      }

      // =====================================================
      // CREATE LOGOUT AUDIT LOG
      // =====================================================

      if (user) {
        await createAuditLog({
          action: "LOGOUT",
          module: "Authentication",

          targetEntityType: "User",
          targetEntityId: user.id,

          details: {
            name: fullName || null,
            email: user.email || null,
            role: "student",
            portal: "student",
          },
        });
      }

      // =====================================================
      // SIGN OUT
      // =====================================================

      const { error } = await supabaseStudent.auth.signOut();

      if (error) {
        console.error("Logout error:", error);

        setIsLoggingOut(false);
        return;
      }

      setShowLogoutConfirm(false);
      setIsMobileSidebarOpen(false);

      navigate("/login", {
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

  /* =========================================================
     INITIALS
     ========================================================= */
  const getInitials = (name) => {
    if (!name) return "ST";

    const parts = name.trim().split(" ").filter(Boolean);

    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }

    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  /* =========================================================
     NOTIFICATION HELPERS
     ========================================================= */
  const getNotificationIcon = (notification) => {
    const type = String(notification?.type || "").toLowerCase();

    const category = String(notification?.category || "").toLowerCase();

    const relatedEntity = String(
      notification?.relatedEntityType || ""
    ).toLowerCase();

    if (
      type.includes("application") ||
      category.includes("application") ||
      relatedEntity.includes("application")
    ) {
      return "📝";
    }

    if (
      type.includes("document") ||
      category.includes("document") ||
      relatedEntity.includes("document")
    ) {
      return "📄";
    }

    if (
      type.includes("evaluation") ||
      category.includes("evaluation") ||
      relatedEntity.includes("evaluation")
    ) {
      return "⭐";
    }

    if (
      type.includes("message") ||
      category.includes("message") ||
      relatedEntity.includes("message")
    ) {
      return "💬";
    }

    if (
      type.includes("internship") ||
      category.includes("internship") ||
      relatedEntity.includes("assignment")
    ) {
      return "💼";
    }

    return "🔔";
  };

  const formatNotificationTime = (date) => {
    if (!date) return "";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "";
    }

    const now = new Date();
    const diffMs = now.getTime() - parsedDate.getTime();

    const diffSeconds = Math.floor(diffMs / 1000);

    const diffMinutes = Math.floor(diffSeconds / 60);

    const diffHours = Math.floor(diffMinutes / 60);

    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 60) {
      return "Just now";
    }

    if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    }

    if (diffHours < 24) {
      return `${diffHours}h ago`;
    }

    if (diffDays < 7) {
      return `${diffDays}d ago`;
    }

    return parsedDate.toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year:
        parsedDate.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  /* =========================================================
     MARK ONE NOTIFICATION AS READ
     ========================================================= */
  const markNotificationRead = async (id) => {
    const notification = notifications.find((item) => item.id === id);

    if (!notification || notification.readAt) {
      return;
    }

    const now = new Date().toISOString();

    try {
      setNotificationActionLoading(true);

      const { error } = await supabaseStudent
        .from("notifications")
        .update({
          read_at: now,
        })
        .eq("id", id)
        .eq(
          "recipient_id",
          (
            await supabaseStudent.auth.getUser()
          ).data?.user?.id
        );

      if (error) {
        console.error("Error marking notification as read:", error);

        return;
      }

      setNotifications((previous) =>
        previous.map((item) =>
          item.id === id
            ? {
                ...item,
                readAt: now,
              }
            : item
        )
      );
    } catch (error) {
      console.error("Unexpected error marking notification as read:", error);
    } finally {
      setNotificationActionLoading(false);
    }
  };

  /* =========================================================
     MARK ALL NOTIFICATIONS AS READ
     ========================================================= */
  const markAllNotificationsRead = async () => {
    if (unreadCount === 0) return;

    try {
      setNotificationActionLoading(true);

      const {
        data: { user },
        error: userError,
      } = await supabaseStudent.auth.getUser();

      if (userError || !user) {
        console.error("Unable to identify current student:", userError);

        return;
      }

      const now = new Date().toISOString();

      const { error } = await supabaseStudent
        .from("notifications")
        .update({
          read_at: now,
        })
        .eq("recipient_id", user.id)
        .is("read_at", null);

      if (error) {
        console.error("Error marking all notifications as read:", error);

        return;
      }

      setNotifications((previous) =>
        previous.map((notification) => ({
          ...notification,
          readAt: notification.readAt || now,
        }))
      );
    } catch (error) {
      console.error(
        "Unexpected error marking all notifications as read:",
        error
      );
    } finally {
      setNotificationActionLoading(false);
    }
  };

  /* =========================================================
     OPEN NOTIFICATION
     ========================================================= */
  const openNotification = async (notification) => {
    if (!notification) return;

    // -------------------------------------------------------
    // MARK READ
    // -------------------------------------------------------

    if (!notification.readAt) {
      await markNotificationRead(notification.id);
    }

    // -------------------------------------------------------
    // CLOSE DROPDOWN
    // -------------------------------------------------------

    setIsNotificationOpen(false);

    // -------------------------------------------------------
    // NAVIGATE TO RELATED PAGE
    // -------------------------------------------------------

    if (notification.actionPath) {
      navigate(notification.actionPath);
    } else {
      navigate("/student/notifications");
    }
  };

  /* =========================================================
     SIDEBAR CONTENT
     ========================================================= */
  const renderSidebarContent = (mobile = false) => {
    return (
      <div className="relative flex h-full min-h-0 flex-col overflow-hidden">
        {/* ===================================================
            BRAND
            =================================================== */}
        <div
          className={`flex h-20 flex-shrink-0 items-center border-b px-5 ${
            darkMode ? "border-slate-800" : "border-slate-100"
          }`}
        >
          <div className="flex min-w-0 items-center gap-3">
            {/* =================================================
                STUDENT PROFILE PHOTO
                ================================================= */}
            {profilePhoto ? (
              <img
                src={profilePhoto}
                alt={fullName}
                className="h-11 w-11 flex-shrink-0 rounded-xl object-cover shadow-md"
                onError={(event) => {
                  event.currentTarget.style.display = "none";

                  const fallback =
                    event.currentTarget.parentElement?.querySelector(
                      "[data-student-brand-fallback]"
                    );

                  if (fallback) {
                    fallback.classList.remove("hidden");
                  }
                }}
              />
            ) : null}

            {/* =================================================
                FALLBACK BRAND ICON
                ================================================= */}
            <div
              data-student-brand-fallback
              className={`${
                profilePhoto ? "hidden" : "flex"
              } h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-blue-700 text-xl font-bold text-white shadow-md`}
            >
              S
            </div>

            <div className="min-w-0">
              <h1
                className={`truncate text-lg font-bold ${
                  darkMode ? "text-white" : "text-slate-900"
                }`}
              >
                SIMS
              </h1>

              <p
                className={`truncate text-xs ${
                  darkMode ? "text-slate-400" : "text-slate-500"
                }`}
              >
                Student Portal
              </p>
            </div>
          </div>

          {/* Mobile close button */}
          {mobile && (
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(false)}
              className={`ml-auto flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg transition ${
                darkMode
                  ? "text-slate-300 hover:bg-slate-800"
                  : "text-slate-500 hover:bg-slate-100"
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
              const hasChildren =
                Array.isArray(item.children) && item.children.length > 0;

              const active =
                isPathActive(item.path) || isChildActive(item.children);

              return (
                <div key={item.label}>
                  <button
                    type="button"
                    onClick={() => {
                      if (hasChildren) {
                        toggleSubmenu(item.label);
                      } else {
                        navigateTo(item.path);
                      }
                    }}
                    aria-current={isPathActive(item.path) ? "page" : undefined}
                    className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition-all ${
                      active
                        ? darkMode
                          ? "bg-blue-500/10 text-blue-400"
                          : "bg-blue-50 text-blue-700"
                        : darkMode
                        ? "text-slate-300 hover:bg-slate-800 hover:text-white"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    {active && (
                      <span
                        className={`absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full ${
                          darkMode ? "bg-blue-400" : "bg-blue-600"
                        }`}
                      />
                    )}

                    <span className="flex w-6 flex-shrink-0 items-center justify-center text-base">
                      {item.icon}
                    </span>

                    <span className="min-w-0 flex-1 truncate">
                      {item.label}
                    </span>

                    {hasChildren && (
                      <span className="text-xs">
                        {expandedMenus[item.label] ? "▲" : "▼"}
                      </span>
                    )}
                  </button>

                  {/* =================================================
                      SUBMENU
                      ================================================= */}
                  {hasChildren && expandedMenus[item.label] && (
                    <div
                      className={`ml-9 mt-1 space-y-1 border-l pl-2 ${
                        darkMode ? "border-slate-700" : "border-slate-200"
                      }`}
                    >
                      {item.children.map((child) => (
                        <button
                          key={child.path}
                          type="button"
                          onClick={() => navigateTo(child.path)}
                          className={`flex w-full items-center rounded-lg px-3 py-2 text-left text-sm transition ${
                            isPathActive(child.path)
                              ? darkMode
                                ? "bg-blue-500/10 text-blue-400"
                                : "bg-blue-50 text-blue-700"
                              : darkMode
                              ? "text-slate-400 hover:bg-slate-800 hover:text-white"
                              : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                          }`}
                        >
                          {child.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
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
              ? "border-slate-800 bg-slate-900/95"
              : "border-slate-100 bg-white/95"
          }`}
        >
          <button
            type="button"
            onClick={handleLogoutClick}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${
              darkMode
                ? "text-red-400 hover:bg-red-500/10"
                : "text-red-600 hover:bg-red-50"
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

  /* =========================================================
     RENDER
     ========================================================= */
  return (
    <div
      className={`min-h-screen w-full ${
        darkMode ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900"
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
              ? "border-slate-800 bg-slate-900"
              : "border-slate-100 bg-white"
          }`}
        >
          {renderSidebarContent(false)}

          {/* Resize Handle */}
          <div
            onMouseDown={() => setIsResizing(true)}
            className={`absolute right-0 top-0 h-full w-1 cursor-col-resize transition ${
              isResizing
                ? darkMode
                  ? "bg-blue-500"
                  : "bg-blue-400"
                : "hover:bg-blue-300"
            }`}
          />
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
              HEADER
              ================================================= */}
          <header
            className={`sticky top-0 z-50 flex h-20 flex-shrink-0 items-center justify-between border-b px-3 shadow-sm sm:px-6 ${
              darkMode
                ? "border-slate-800 bg-slate-900/95"
                : "border-slate-100 bg-white/95"
            } backdrop-blur`}
          >
            {/* LEFT SIDE */}
            <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
              {/* Mobile Menu */}
              <button
                type="button"
                onClick={() => setIsMobileSidebarOpen(true)}
                className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl lg:hidden ${
                  darkMode
                    ? "text-slate-300 hover:bg-slate-800"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
                aria-label="Open sidebar"
              >
                ☰
              </button>

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

            {/* RIGHT SIDE */}
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
                  aria-label="Notifications"
                >
                  🔔
                  {unreadCount > 0 && (
                    <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {isNotificationOpen && (
                  <div
                    className={`
                      fixed left-3 right-3 top-[84px]
                      z-[100]
                      w-auto max-w-none
                      overflow-hidden rounded-2xl border shadow-xl
                      sm:absolute sm:left-auto sm:right-0 sm:top-12
                      sm:w-[340px] sm:max-w-[calc(100vw-2rem)]
                      ${
                        darkMode
                          ? "border-slate-700 bg-slate-900"
                          : "border-slate-200 bg-white"
                      }
                    `}
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
                          Notifications
                        </h3>

                        <p
                          className={`text-xs ${
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
                          disabled={notificationActionLoading}
                          className={`flex-shrink-0 text-xs font-semibold ${
                            notificationActionLoading
                              ? "cursor-not-allowed opacity-50"
                              : ""
                          } ${
                            darkMode ? "text-blue-400" : "text-blue-600"
                          } hover:underline`}
                        >
                          {notificationActionLoading
                            ? "Updating..."
                            : "Mark all read"}
                        </button>
                      )}
                    </div>

                    {/* LIST */}
                    <div
                      className="
                        max-h-[calc(100vh-210px)]
                        overflow-y-auto
                        overscroll-y-auto
                        sm:max-h-[380px]
                      "
                      style={{
                        WebkitOverflowScrolling: "touch",
                        touchAction: "pan-y",
                      }}
                    >
                      {notificationsLoading ? (
                        <div className="px-5 py-8 text-center">
                          <div
                            className={`mx-auto h-7 w-7 animate-spin rounded-full border-3 ${
                              darkMode
                                ? "border-slate-700 border-t-blue-400"
                                : "border-slate-200 border-t-blue-500"
                            }`}
                          />

                          <p
                            className={`mt-3 text-xs ${
                              darkMode ? "text-slate-400" : "text-slate-500"
                            }`}
                          >
                            Loading notifications...
                          </p>
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="px-5 py-8 text-center">
                          <div className="mb-2 text-3xl">🔔</div>

                          <p
                            className={`text-sm ${
                              darkMode ? "text-slate-400" : "text-slate-500"
                            }`}
                          >
                            No notifications
                          </p>
                        </div>
                      ) : (
                        notifications.map((notification) => {
                          const isUnread = !notification.readAt;

                          return (
                            <button
                              key={notification.id}
                              type="button"
                              onClick={() => openNotification(notification)}
                              className={`group relative w-full border-b px-4 py-3 text-left transition ${
                                darkMode
                                  ? "border-slate-800 hover:bg-slate-800/70"
                                  : "border-slate-100 hover:bg-slate-50"
                              } ${
                                isUnread
                                  ? darkMode
                                    ? "bg-blue-500/5"
                                    : "bg-blue-50/50"
                                  : ""
                              }`}
                            >
                              <div className="flex gap-3">
                                <div className="mt-0.5 flex-shrink-0">
                                  <span className="text-lg">
                                    {getNotificationIcon(notification)}
                                  </span>
                                </div>

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

                                    {isUnread && (
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
                                    {formatNotificationTime(
                                      notification.createdAt
                                    )}
                                  </p>
                                </div>
                              </div>
                            </button>
                          );
                        })
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
                        onClick={() => navigateTo("/student/notifications")}
                        className={`w-full rounded-lg py-2.5 text-xs font-semibold transition ${
                          darkMode
                            ? "text-blue-400 hover:bg-slate-800"
                            : "text-blue-600 hover:bg-blue-50"
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
                  {profilePhoto ? (
                    <img
                      src={profilePhoto}
                      alt={fullName}
                      className="h-9 w-9 rounded-full object-cover"
                      onError={(event) => {
                        event.currentTarget.style.display = "none";

                        const fallback =
                          event.currentTarget.parentElement?.querySelector(
                            "[data-header-profile-fallback]"
                          );

                        if (fallback) {
                          fallback.classList.remove("hidden");
                        }
                      }}
                    />
                  ) : null}

                  <div
                    data-header-profile-fallback
                    className={`${
                      profilePhoto ? "hidden" : "flex"
                    } h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white`}
                  >
                    {getInitials(fullName)}
                  </div>

                  <div className="hidden text-left sm:block">
                    <p
                      className={`max-w-[140px] truncate text-sm font-semibold ${
                        darkMode ? "text-white" : "text-slate-800"
                      }`}
                    >
                      {fullName}
                    </p>

                    <p
                      className={`max-w-[140px] truncate text-[10px] ${
                        darkMode ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
                      {program}
                    </p>
                  </div>

                  <span
                    className={`hidden text-xs sm:block ${
                      darkMode ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    ▼
                  </span>
                </button>

                {/* =================================================
                    PROFILE DROPDOWN
                    ================================================= */}
                {isProfileOpen && (
                  <div
                    className={`absolute right-0 top-12 z-[100] w-56 overflow-hidden rounded-2xl border shadow-xl ${
                      darkMode
                        ? "border-slate-700 bg-slate-900"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    {/* PROFILE HEADER */}
                    <div
                      className={`border-b px-4 py-4 ${
                        darkMode ? "border-slate-800" : "border-slate-100"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {profilePhoto ? (
                          <img
                            src={profilePhoto}
                            alt={fullName}
                            className="h-10 w-10 rounded-full object-cover"
                            onError={(event) => {
                              event.currentTarget.style.display = "none";

                              const fallback =
                                event.currentTarget.parentElement?.querySelector(
                                  "[data-dropdown-profile-fallback]"
                                );

                              if (fallback) {
                                fallback.classList.remove("hidden");
                              }
                            }}
                          />
                        ) : null}

                        <div
                          data-dropdown-profile-fallback
                          className={`${
                            profilePhoto ? "hidden" : "flex"
                          } h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white`}
                        >
                          {getInitials(fullName)}
                        </div>

                        <div className="min-w-0">
                          <p
                            className={`truncate text-sm font-semibold ${
                              darkMode ? "text-white" : "text-slate-800"
                            }`}
                          >
                            {fullName}
                          </p>

                          <p
                            className={`truncate text-xs ${
                              darkMode ? "text-slate-400" : "text-slate-500"
                            }`}
                          >
                            {program}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-2">
                      {/* MY PROFILE */}
                      <button
                        type="button"
                        onClick={() => navigateTo("/student/profile")}
                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm ${
                          darkMode
                            ? "text-slate-300 hover:bg-slate-800 hover:text-white"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                      >
                        👤
                        <span>My Profile</span>
                      </button>

                      {/* SETTINGS */}
                      <button
                        type="button"
                        onClick={() => navigateTo("/student/settings")}
                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm ${
                          darkMode
                            ? "text-slate-300 hover:bg-slate-800 hover:text-white"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                      >
                        ⚙️
                        <span>Settings</span>
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
            className={`min-h-[calc(100vh-5rem)] min-w-0 flex-1 ${
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
                markNotificationRead,
                markAllNotificationsRead,

                openNotification,
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
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } ${darkMode ? "bg-slate-900" : "bg-white"}`}
      >
        {renderSidebarContent(true)}
      </aside>

      {/* =====================================================
          LOGOUT CONFIRMATION MODAL
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
                Are you sure you want to log out of your student account?
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
}
