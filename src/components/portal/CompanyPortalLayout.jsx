import React, { useEffect, useRef, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { supabaseCompany } from "../../supabaseClient";

/* =========================================================
   COMPANY THEME
   ========================================================= */

const COMPANY_PRIMARY = "bg-gradient-to-r from-purple-500 to-purple-700";

const COMPANY_ACTIVE_LIGHT = "bg-purple-50 text-purple-700";

const COMPANY_ACTIVE_DARK = "bg-purple-500/15 text-purple-400";

/* =========================================================
   COMPANY LOGO
   ========================================================= */

const COMPANY_LOGO_BUCKET = "company-logos";

/* =========================================================
   NOTIFICATION HELPERS
   ========================================================= */

/*
  Convert database notification rows into the format
  already expected by the Company Portal UI.
*/
const mapNotificationRow = (row) => ({
  id: row.id,
  title: row.title,
  message: row.message,

  type: row.type,
  category: row.category,

  relatedType: row.related_entity_type,
  relatedId: row.related_entity_id,

  actionPath: row.action_path,

  createdAt: row.created_at,
  readAt: row.read_at,

  read: Boolean(row.read_at),

  time: formatNotificationTime(row.created_at),
});

/* =========================================================
   NOTIFICATION TIME FORMATTER
   ========================================================= */

function formatNotificationTime(createdAt) {
  if (!createdAt) return "";

  const created = new Date(createdAt);

  if (Number.isNaN(created.getTime())) {
    return "";
  }

  const now = new Date();

  const diffMs = now.getTime() - created.getTime();

  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return "Just now";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} ${diffMinutes === 1 ? "minute" : "minutes"} ago`;
  }

  if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
  }

  if (diffDays < 7) {
    return `${diffDays} ${diffDays === 1 ? "day" : "days"} ago`;
  }

  return created.toLocaleDateString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/* =========================================================
   FETCH COMPANY NOTIFICATIONS
   ========================================================= */

const fetchCompanyNotifications = async (userId) => {
  if (!userId) {
    return [];
  }

  const { data, error } = await supabaseCompany
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
    .eq("recipient_id", userId)
    .eq("recipient_role", "company")
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    throw error;
  }

  return (data || []).map(mapNotificationRow);
};

/* =========================================================
   COMPONENT
   ========================================================= */

export default function CompanyPortalLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  /* =========================================================
     COMPANY PROFILE
     ========================================================= */

  const [companyName, setCompanyName] = useState("Company Account");
  const [companyLogoUrl, setCompanyLogoUrl] = useState(null);
  const [companyUserId, setCompanyUserId] = useState(null);

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
  const [selectedNotification, setSelectedNotification] = useState(null);

  const unreadCount = notifications.filter(
    (notification) => !notification.readAt
  ).length;

  /* =========================================================
     DARK MODE
     ========================================================= */

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("companyPortalDarkMode") === "true";
  });

  /* =========================================================
     SUBMENUS
     ========================================================= */

  const [expandedMenus, setExpandedMenus] = useState({});

  /* =========================================================
     LOGOUT CONFIRMATION
     ========================================================= */

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  /* =========================================================
     INITIALS
     ========================================================= */

  const getInitials = (name) => {
    if (!name) return "CO";

    const parts = name.trim().split(" ").filter(Boolean);

    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }

    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  /* =========================================================
     LOAD COMPANY
     ========================================================= */

  useEffect(() => {
    loadCompanyProfile();
  }, []);

  const loadCompanyProfile = async () => {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabaseCompany.auth.getUser();

      if (authError) {
        console.error("Auth error:", authError);
        return;
      }

      if (!user) {
        return;
      }

      /* =====================================================
         STORE COMPANY USER ID
         ===================================================== */

      setCompanyUserId(user.id);

      /* =====================================================
         COMPANY NAME
         ===================================================== */

      const { data, error } = await supabaseCompany
        .from("companies")
        .select("company_name")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Company profile error:", error);
      }

      if (data?.company_name) {
        setCompanyName(data.company_name);
      }

      /* =====================================================
         COMPANY LOGO
         ===================================================== */

      const logoPath =
        user.user_metadata?.company_logo_url ||
        user.user_metadata?.companyLogoUrl ||
        null;

      if (!logoPath) {
        setCompanyLogoUrl(null);
        return;
      }

      /* =====================================================
         SUPPORT DIRECT URLS
         ===================================================== */

      if (/^https?:\/\//i.test(logoPath)) {
        setCompanyLogoUrl(logoPath);
        return;
      }

      /* =====================================================
         CREATE SIGNED URL
         ===================================================== */

      const { data: signedData, error: signedError } =
        await supabaseCompany.storage
          .from(COMPANY_LOGO_BUCKET)
          .createSignedUrl(logoPath, 60 * 60);

      if (signedError) {
        console.warn("Unable to load company logo:", signedError);

        setCompanyLogoUrl(null);
        return;
      }

      setCompanyLogoUrl(signedData?.signedUrl || null);
    } catch (error) {
      console.error("Failed to load company profile:", error);

      setCompanyLogoUrl(null);
    }
  };

  /* =========================================================
     LOAD + REALTIME COMPANY NOTIFICATIONS
     ========================================================= */

  useEffect(() => {
    if (!companyUserId) {
      return;
    }

    let isMounted = true;
    let notificationChannel = null;

    const refreshNotifications = async () => {
      try {
        const rows = await fetchCompanyNotifications(companyUserId);

        if (!isMounted) {
          return;
        }

        setNotifications(rows);

        /*
          Keep currently opened notification synchronized
          with the database.
        */
        setSelectedNotification((current) => {
          if (!current) {
            return null;
          }

          const updated = rows.find(
            (notification) => notification.id === current.id
          );

          return updated || null;
        });
      } catch (error) {
        console.error("Failed to load company notifications:", error);
      }
    };

    const setupRealtime = async () => {
      await refreshNotifications();

      if (!isMounted) {
        return;
      }

      /*
        Listen only to notifications belonging to
        the currently logged-in company user.
      */
      notificationChannel = supabaseCompany
        .channel(`company-notifications:${companyUserId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "notifications",
            filter: `recipient_id=eq.${companyUserId}`,
          },
          async (payload) => {
            /*
              INSERT / UPDATE:
              Only process company notifications.

              DELETE events do not expose the same new row,
              so simply refresh the current list.
            */
            if (
              payload.eventType !== "DELETE" &&
              payload.new?.recipient_role !== "company"
            ) {
              return;
            }

            await refreshNotifications();
          }
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            console.log("[Company Notifications] Realtime connected.");
          }

          if (status === "CHANNEL_ERROR") {
            console.error("[Company Notifications] Realtime channel error.");
          }

          if (status === "TIMED_OUT") {
            console.warn("[Company Notifications] Realtime channel timed out.");
          }
        });
    };

    setupRealtime();

    return () => {
      isMounted = false;

      if (notificationChannel) {
        supabaseCompany.removeChannel(notificationChannel);
      }
    };
  }, [companyUserId]);

  /* =========================================================
     DARK MODE
     ========================================================= */

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    localStorage.setItem("companyPortalDarkMode", darkMode.toString());
  }, [darkMode]);

  /* =========================================================
     CLOSE MOBILE SIDEBAR ON ROUTE CHANGE
     ========================================================= */

  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [location.pathname]);

  /* =========================================================
     LOCK BODY SCROLL WHEN MOBILE SIDEBAR IS OPEN
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
      if (event.key !== "Escape") {
        return;
      }

      setIsMobileSidebarOpen(false);
      setIsNotificationOpen(false);
      setIsProfileOpen(false);
      setSelectedNotification(null);
      setShowLogoutModal(false);
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
    if (!isResizing) {
      return;
    }

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
     SIDEBAR ITEMS
     ========================================================= */

  const sidebarItems = [
    {
      label: "Dashboard",
      path: "/company/dashboard",
      icon: "▦",
    },
    {
      label: "Manage Opportunities",
      path: "/company/jobs",
      icon: "💼",
    },
    {
      label: "Manage Applications",
      path: "/company/applications",
      icon: "📝",
    },
    {
      label: "Assigned Interns",
      path: "/company/interns",
      icon: "👥",
    },
    {
      label: "Evaluate",
      path: "/company/evaluate",
      icon: "⭐",
    },
    {
      label: "Notifications",
      path: "/company/notifications",
      icon: "🔔",
    },
    {
      label: "Messages",
      path: "/company/messages",
      icon: "✉️",
    },
    {
      label: "Settings",
      path: "/company/settings",
      icon: "⚙️",
    },
  ];

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

    if (currentItem) {
      return currentItem.label;
    }

    return "Company Portal";
  };

  /* =========================================================
     LOGOUT CONFIRMATION
     ========================================================= */

  const requestLogout = () => {
    setIsProfileOpen(false);
    setIsNotificationOpen(false);
    setShowLogoutModal(true);
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  const handleLogout = async () => {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabaseCompany.auth.getUser();

      if (userError) {
        console.error(
          "Failed to get current user for logout audit:",
          userError
        );
      }

      if (user) {
        const { error: auditError } = await supabaseCompany.functions.invoke(
          "create-audit-log",
          {
            body: {
              action: "LOGOUT",
              module: "Authentication",
              target_entity_type: "User",
              target_entity_id: user.id,
              details: {
                name: companyName || null,
                email: user.email || null,
                role: "company",
              },
            },
          }
        );

        if (auditError) {
          console.error("Logout audit error:", auditError);
        }
      }

      const { error } = await supabaseCompany.auth.signOut();

      if (error) {
        console.error("Logout error:", error);
        return;
      }

      setShowLogoutModal(false);
      setIsProfileOpen(false);
      setIsNotificationOpen(false);
      setIsMobileSidebarOpen(false);

      navigate("/login", {
        replace: true,
      });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  /* =========================================================
     NOTIFICATION ACTION
     ========================================================= */

  const getNotificationAction = (notification) => {
    if (!notification) {
      return null;
    }

    const type = String(notification.type || "").toLowerCase();

    const relatedType = String(notification.relatedType || "").toLowerCase();

    /* =======================================================
       INTERN DEPLOYMENT
       ======================================================= */

    if (
      type === "intern_deployment" ||
      type === "deployment_confirmed" ||
      relatedType === "internshipassignment"
    ) {
      return {
        label: "View Applications",
        path: "/company/applications",
      };
    }

    /* =======================================================
       APPLICATION
       ======================================================= */

    if (
      [
        "application",
        "application_submission",
        "application_submitted",
        "application_resubmitted",
        "application_review",
      ].includes(type) ||
      relatedType === "internshipapplication"
    ) {
      return {
        label: "View Application",
        path: "/company/applications",
      };
    }

    /* =======================================================
       DOCUMENT
       ======================================================= */

    if (
      [
        "document",
        "document_submission",
        "document_revision",
        "document_update",
      ].includes(type) ||
      relatedType === "documentsubmission"
    ) {
      return {
        label: "View Application",
        path: "/company/applications",
      };
    }

    /* =======================================================
       EVALUATION
       ======================================================= */

    if (
      type === "evaluation" ||
      type === "evaluation_submitted" ||
      type === "evaluation_update" ||
      relatedType === "evaluation"
    ) {
      return {
        label: "View Evaluation",
        path: "/company/evaluate",
      };
    }

    /* =======================================================
       MESSAGE
       ======================================================= */

    if (type === "message" || relatedType === "message") {
      return {
        label: "Open Messages",
        path: "/company/messages",
      };
    }

    /* =======================================================
       DATABASE ACTION PATH FALLBACK
       ======================================================= */

    const allowedPaths = [
      "/company/dashboard",
      "/company/jobs",
      "/company/applications",
      "/company/interns",
      "/company/evaluate",
      "/company/notifications",
      "/company/messages",
      "/company/settings",
      "/company/profile",
    ];

    if (
      notification.actionPath &&
      allowedPaths.includes(notification.actionPath)
    ) {
      return {
        label: "Open",
        path: notification.actionPath,
      };
    }

    return null;
  };

  /* =========================================================
     NOTIFICATION ICON
     ========================================================= */

  const getNotificationIcon = (notification) => {
    const type = String(notification?.type || "").toLowerCase();

    switch (type) {
      case "intern_deployment":
      case "deployment_confirmed":
        return "👥";

      case "application":
      case "application_submission":
      case "application_submitted":
      case "application_resubmitted":
      case "application_review":
        return "📝";

      case "document":
      case "document_submission":
      case "document_revision":
      case "document_update":
        return "📄";

      case "evaluation":
      case "evaluation_submitted":
      case "evaluation_update":
        return "⭐";

      case "information":
        return "ℹ️";

      case "message":
        return "✉️";

      case "system":
        return "⚙️";

      default:
        return "🔔";
    }
  };

  /* =========================================================
     HANDLE NOTIFICATION ACTION
     ========================================================= */

  const handleNotificationAction = async () => {
    if (!selectedNotification) {
      return;
    }

    const action = getNotificationAction(selectedNotification);

    if (!action?.path) {
      return;
    }

    /*
      Make sure notification is read before
      navigating away.
    */
    if (!selectedNotification.readAt) {
      await markNotificationRead(selectedNotification.id);
    }

    closeNotificationModal();

    navigateTo(action.path);
  };

  /* =========================================================
     UPDATE NOTIFICATION READ STATE
     ========================================================= */

  const updateNotificationReadState = async (id, readAt) => {
    if (!companyUserId) {
      return false;
    }

    /* =======================================================
       OPTIMISTIC UI UPDATE
       ======================================================= */

    setNotifications((previous) =>
      previous.map((notification) =>
        notification.id === id
          ? {
              ...notification,
              readAt,
              read: Boolean(readAt),
            }
          : notification
      )
    );

    setSelectedNotification((current) => {
      if (!current || current.id !== id) {
        return current;
      }

      return {
        ...current,
        readAt,
        read: Boolean(readAt),
      };
    });

    /* =======================================================
       DATABASE UPDATE
       ======================================================= */

    const { error } = await supabaseCompany
      .from("notifications")
      .update({
        read_at: readAt,
      })
      .eq("id", id)
      .eq("recipient_id", companyUserId)
      .eq("recipient_role", "company");

    if (error) {
      console.error("Failed to update notification read state:", error);

      try {
        const rows = await fetchCompanyNotifications(companyUserId);

        setNotifications(rows);

        setSelectedNotification((current) => {
          if (!current) {
            return null;
          }

          return (
            rows.find((notification) => notification.id === current.id) || null
          );
        });
      } catch (reloadError) {
        console.error(
          "Failed to reload notifications after update error:",
          reloadError
        );
      }

      return false;
    }

    return true;
  };

  /* =========================================================
     MARK NOTIFICATION READ
     ========================================================= */

  const markNotificationRead = async (id) => {
    await updateNotificationReadState(id, new Date().toISOString());
  };

  /* =========================================================
     MARK NOTIFICATION UNREAD
     ========================================================= */

  const markNotificationUnread = async (id) => {
    await updateNotificationReadState(id, null);
  };

  /* =========================================================
     MARK ALL NOTIFICATIONS READ
     ========================================================= */

  const markAllNotificationsRead = async () => {
    if (!companyUserId) {
      return;
    }

    const now = new Date().toISOString();

    /* =======================================================
       OPTIMISTIC UI UPDATE
       ======================================================= */

    setNotifications((previous) =>
      previous.map((notification) => ({
        ...notification,
        readAt: notification.readAt || now,
        read: true,
      }))
    );

    setSelectedNotification((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        readAt: current.readAt || now,
        read: true,
      };
    });

    /* =======================================================
       DATABASE UPDATE
       ======================================================= */

    const { error } = await supabaseCompany
      .from("notifications")
      .update({
        read_at: now,
      })
      .eq("recipient_id", companyUserId)
      .eq("recipient_role", "company")
      .is("read_at", null);

    if (error) {
      console.error("Failed to mark all company notifications as read:", error);

      try {
        const rows = await fetchCompanyNotifications(companyUserId);

        setNotifications(rows);

        setSelectedNotification((current) => {
          if (!current) {
            return null;
          }

          return (
            rows.find((notification) => notification.id === current.id) || null
          );
        });
      } catch (reloadError) {
        console.error("Failed to reload company notifications:", reloadError);
      }
    }
  };

  /* =========================================================
     OPEN NOTIFICATION
     ========================================================= */

  const openNotification = async (notification) => {
    /*
      Mark as read first.
    */
    await markNotificationRead(notification.id);

    /*
      Update modal immediately.
    */
    setSelectedNotification({
      ...notification,
      readAt: notification.readAt || new Date().toISOString(),
      read: true,
    });

    setIsNotificationOpen(false);
  };

  /* =========================================================
     CLOSE NOTIFICATION MODAL
     ========================================================= */

  const closeNotificationModal = () => {
    setSelectedNotification(null);
  };

  /* =========================================================
     COMPANY AVATAR
     ========================================================= */

  const renderCompanyAvatar = (sizeClass, roundedClass = "rounded-full") => {
    return (
      <div
        className={`relative flex flex-shrink-0 items-center justify-center overflow-hidden ${sizeClass} ${roundedClass} ${
          companyLogoUrl ? "bg-white" : COMPANY_PRIMARY
        } shadow-sm`}
      >
        {companyLogoUrl ? (
          <img
            src={companyLogoUrl}
            alt={`${companyName || "Company"} logo`}
            className="h-full w-full object-contain p-1"
            onError={(event) => {
              event.currentTarget.style.display = "none";

              const fallback = event.currentTarget.parentElement?.querySelector(
                "[data-company-avatar-fallback]"
              );

              if (fallback) {
                fallback.classList.remove("hidden");
              }
            }}
          />
        ) : null}

        <span
          data-company-avatar-fallback
          className={`${
            companyLogoUrl ? "hidden" : "flex"
          } h-full w-full items-center justify-center text-xs font-bold text-white`}
        >
          {getInitials(companyName)}
        </span>
      </div>
    );
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
            {renderCompanyAvatar("h-11 w-11", "rounded-xl")}

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
                Company Portal
              </p>
            </div>
          </div>

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
                          ? COMPANY_ACTIVE_DARK
                          : COMPANY_ACTIVE_LIGHT
                        : darkMode
                        ? "text-slate-300 hover:bg-slate-800 hover:text-white"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    {active && (
                      <span
                        className={`absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full ${COMPANY_PRIMARY}`}
                      />
                    )}

                    <span className="flex w-6 flex-shrink-0 items-center justify-center text-base">
                      {item.icon}
                    </span>

                    <span className="min-w-0 flex-1 truncate">
                      {item.label}
                    </span>

                    {item.label === "Notifications" && unreadCount > 0 && (
                      <span className="flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}

                    {hasChildren && (
                      <span className="text-xs">
                        {expandedMenus[item.label] ? "▲" : "▼"}
                      </span>
                    )}
                  </button>

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
                                ? COMPANY_ACTIVE_DARK
                                : COMPANY_ACTIVE_LIGHT
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
            onClick={requestLogout}
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
      {/* =====================================================
          DESKTOP LAYOUT
          ===================================================== */}

      <div className="flex min-h-screen w-full">
        {/* ===================================================
            FIXED DESKTOP SIDEBAR
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

          {/* RESIZE HANDLE */}

          <div
            onMouseDown={() => setIsResizing(true)}
            className={`absolute right-0 top-0 h-full w-1 cursor-col-resize transition ${
              isResizing
                ? "bg-purple-500"
                : darkMode
                ? "hover:bg-purple-700"
                : "hover:bg-purple-300"
            }`}
          />
        </aside>

        {/* ===================================================
            SIDEBAR SPACER
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
            className={`sticky top-0 z-50 flex h-20 flex-shrink-0 items-center justify-between border-b px-4 shadow-sm sm:px-6 ${
              darkMode
                ? "border-slate-800 bg-slate-900/95"
                : "border-slate-100 bg-white/95"
            } backdrop-blur`}
          >
            {/* LEFT */}

            <div className="flex min-w-0 items-center gap-3">
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
                  className={`hidden text-xs sm:block ${
                    darkMode ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  Company Portal
                </p>
              </div>
            </div>

            {/* RIGHT */}

            <div className="flex flex-shrink-0 items-center gap-2 sm:gap-3">
              {/* =================================================
                  DARK MODE
                  ================================================= */}

              <button
                type="button"
                onClick={() => setDarkMode((previous) => !previous)}
                className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg transition ${
                  darkMode
                    ? "text-yellow-300 hover:bg-slate-800"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
                aria-label={
                  darkMode ? "Switch to light mode" : "Switch to dark mode"
                }
                title={darkMode ? "Light mode" : "Dark mode"}
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

                {/* =================================================
                    NOTIFICATION DROPDOWN
                    ================================================= */}

                {isNotificationOpen && (
                  <div
                    className="
                      fixed left-4 right-4 top-[84px]
                      z-[100]
                      w-auto max-w-none
                      overflow-hidden rounded-2xl border shadow-xl
                      sm:absolute sm:left-auto sm:right-0 sm:top-12
                      sm:w-[340px] sm:max-w-[calc(100vw-2rem)]
                    "
                  >
                    <div
                      className={`overflow-hidden rounded-2xl border ${
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
                            className="flex-shrink-0 text-xs font-semibold text-purple-600 hover:underline dark:text-purple-400"
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
                          notifications.map((notification) => (
                            <div
                              key={notification.id}
                              className={`group relative border-b px-4 py-3 transition ${
                                darkMode
                                  ? "border-slate-800 hover:bg-slate-800/70"
                                  : "border-slate-100 hover:bg-slate-50"
                              } ${
                                !notification.readAt
                                  ? darkMode
                                    ? "bg-purple-500/5"
                                    : "bg-purple-50/50"
                                  : ""
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => openNotification(notification)}
                                className="w-full text-left"
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

                                      {!notification.readAt && (
                                        <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-purple-500" />
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
                          onClick={() => navigateTo("/company/notifications")}
                          className={`w-full rounded-lg py-2.5 text-xs font-semibold transition ${
                            darkMode
                              ? "text-purple-400 hover:bg-slate-800"
                              : "text-purple-600 hover:bg-purple-50"
                          }`}
                        >
                          View all notifications
                        </button>
                      </div>
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
                  {renderCompanyAvatar("h-9 w-9")}

                  <div className="hidden text-left sm:block">
                    <p
                      className={`max-w-[180px] truncate text-sm font-semibold ${
                        darkMode ? "text-white" : "text-slate-800"
                      }`}
                    >
                      {companyName}
                    </p>

                    <p
                      className={`max-w-[180px] truncate text-[10px] ${
                        darkMode ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
                      Company
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

                {/* PROFILE DROPDOWN */}

                {isProfileOpen && (
                  <div
                    className={`absolute right-0 top-12 z-[100] w-60 overflow-hidden rounded-2xl border shadow-xl ${
                      darkMode
                        ? "border-slate-700 bg-slate-900"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <div
                      className={`border-b px-4 py-4 ${
                        darkMode ? "border-slate-800" : "border-slate-100"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {renderCompanyAvatar("h-10 w-10")}

                        <div className="min-w-0">
                          <p
                            className={`truncate text-sm font-semibold ${
                              darkMode ? "text-white" : "text-slate-800"
                            }`}
                          >
                            {companyName}
                          </p>

                          <p
                            className={`truncate text-xs ${
                              darkMode ? "text-slate-400" : "text-slate-500"
                            }`}
                          >
                            Company
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-2">
                      <button
                        type="button"
                        onClick={() => navigateTo("/company/profile")}
                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm ${
                          darkMode
                            ? "text-slate-300 hover:bg-slate-800 hover:text-white"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                      >
                        👤
                        <span>Company Profile</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => navigateTo("/company/settings")}
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

                      <button
                        type="button"
                        onClick={requestLogout}
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

          {/* ===================================================
              PAGE CONTENT
              =================================================== */}

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
                companyName,
                companyLogoUrl,

                /* =============================================
                   REAL NOTIFICATIONS
                   ============================================= */

                notifications,
                unreadCount,

                markNotificationRead,
                markNotificationUnread,
                markAllNotificationsRead,

                selectedNotification,
                openNotification,
                closeNotificationModal,

                /*
                  Expose action resolver so the main
                  notification page can use the exact
                  same action rules as the layout.
                */
                getNotificationAction,
                handleNotificationAction,
                getNotificationIcon,
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
                aria-label="Close notification"
              >
                ✕
              </button>
            </div>

            {/* CONTENT */}

            <div className="px-5 py-6">
              <div className="mb-4 flex items-start gap-3">
                <div
                  className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-xl text-white shadow-sm ${COMPANY_PRIMARY}`}
                >
                  {getNotificationIcon(selectedNotification)}
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

              {/* RELATED RECORD */}

              {selectedNotification.relatedType && (
                <div
                  className={`mt-5 rounded-xl border p-3 ${
                    darkMode
                      ? "border-slate-700 bg-slate-800/50"
                      : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <p
                    className={`text-[10px] font-semibold uppercase tracking-wide ${
                      darkMode ? "text-slate-500" : "text-slate-400"
                    }`}
                  >
                    Related Record
                  </p>

                  <p
                    className={`mt-1 text-sm font-medium ${
                      darkMode ? "text-slate-200" : "text-slate-700"
                    }`}
                  >
                    {selectedNotification.relatedType}
                  </p>

                  {selectedNotification.relatedId && (
                    <p
                      className={`mt-1 break-all text-xs ${
                        darkMode ? "text-slate-500" : "text-slate-400"
                      }`}
                    >
                      ID: {selectedNotification.relatedId}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* FOOTER */}

            <div
              className={`flex flex-wrap items-center justify-end gap-2 border-t px-5 py-3 ${
                darkMode ? "border-slate-800" : "border-slate-100"
              }`}
            >
              {/* ACTION */}

              {getNotificationAction(selectedNotification) && (
                <button
                  type="button"
                  onClick={handleNotificationAction}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 ${COMPANY_PRIMARY}`}
                >
                  {getNotificationAction(selectedNotification).label}
                </button>
              )}

              {/* CLOSE */}

              <button
                type="button"
                onClick={closeNotificationModal}
                className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                  darkMode
                    ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          LOGOUT CONFIRMATION MODAL
          ===================================================== */}

      {showLogoutModal && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 p-4"
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
            {/* MODAL CONTENT */}

            <div className="px-6 pb-5 pt-6 text-center">
              <div
                className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${
                  darkMode ? "bg-red-500/10" : "bg-red-50"
                }`}
              >
                <span className="text-2xl">↪</span>
              </div>

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
                Are you sure you want to logout from your company account?
              </p>
            </div>

            {/* MODAL FOOTER */}

            <div
              className={`flex gap-3 border-t px-5 py-4 ${
                darkMode ? "border-slate-800" : "border-slate-100"
              }`}
            >
              <button
                type="button"
                onClick={cancelLogout}
                className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                  darkMode
                    ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
