import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { supabase } from "../../supabaseClient";

// =========================================================
// HELPERS
// =========================================================

const NOTIFICATION_SELECT = `
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
`;

// =========================================================
// NOTIFICATION ACTION RESOLVER
// =========================================================

const resolveNotificationAction = (notification) => {
  const type = notification?.type?.toLowerCase() || "";

  const relatedEntityType =
    notification?.relatedEntityType?.toLowerCase() || "";

  const title = notification?.title?.toLowerCase() || "";

  // =======================================================
  // COMPANY REGISTRATION
  // =======================================================

  if (
    (type === "registration_request" &&
      relatedEntityType === "companyregistration") ||
    type === "company-registration" ||
    type === "company_registration" ||
    type === "companies" ||
    relatedEntityType === "companyregistration" ||
    title.includes("company registration")
  ) {
    return {
      label: "Review Company",
      path: "/admin/companies",
      icon: "🏢",
    };
  }

  // =======================================================
  // STUDENT / REGISTRAR REGISTRATION
  // =======================================================

  if (
    type === "registration_request" &&
    relatedEntityType === "registrationrequest"
  ) {
    return {
      label: "Review Request",
      path: "/admin/requests",
      icon: "📋",
    };
  }

  // =======================================================
  // FALLBACK
  // =======================================================

  if (
    notification?.actionPath &&
    !["/admin/users", "/admin/notifications"].includes(notification.actionPath)
  ) {
    return {
      label: "View Details",
      path: notification.actionPath,
      icon: "🔗",
    };
  }

  return null;
};
// =========================================================
// NOTIFICATION ICON
// =========================================================

const getNotificationIcon = (notification) => {
  const type = String(notification?.type || "").toLowerCase();

  if (
    type === "account-request" ||
    type === "account_request" ||
    type === "registration_request" ||
    type === "registration-request"
  ) {
    return "🎓";
  }

  if (type === "company-registration" || type === "company_registration") {
    return "🏢";
  }

  if (type === "system") {
    return "⚙️";
  }

  if (type === "document") {
    return "📄";
  }

  if (type === "application") {
    return "📝";
  }

  if (type === "announcement") {
    return "📢";
  }

  return "🔔";
};

// =========================================================
// DATE FORMATTER
// =========================================================

const formatRelativeTime = (dateValue) => {
  if (!dateValue) {
    return "Unknown time";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Unknown time";
  }

  const now = new Date();
  const difference = now.getTime() - date.getTime();

  const seconds = Math.floor(difference / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);

  if (seconds < 30) {
    return "Just now";
  }

  if (minutes < 1) {
    return `${seconds} seconds ago`;
  }

  if (minutes === 1) {
    return "1 minute ago";
  }

  if (minutes < 60) {
    return `${minutes} minutes ago`;
  }

  if (hours === 1) {
    return "1 hour ago";
  }

  if (hours < 24) {
    return `${hours} hours ago`;
  }

  if (days === 1) {
    return "Yesterday";
  }

  if (days < 7) {
    return `${days} days ago`;
  }

  if (weeks === 1) {
    return "1 week ago";
  }

  if (days < 30) {
    return `${weeks} weeks ago`;
  }

  if (months === 1) {
    return "1 month ago";
  }

  return `${months} months ago`;
};

// =========================================================
// DATABASE ROW -> UI OBJECT
// =========================================================

const mapNotification = (row) => {
  if (!row) {
    return null;
  }

  const notification = {
    id: row.id,
    recipientId: row.recipient_id,
    recipientRole: row.recipient_role,
    type: row.type,
    category: row.category,
    title: row.title,
    message: row.message,
    relatedEntityType: row.related_entity_type,
    relatedEntityId: row.related_entity_id,
    actionPath: row.action_path,
    createdBy: row.created_by,
    createdAt: row.created_at,
    readAt: row.read_at,

    recipient:
      row.recipient_role === "student"
        ? "Student"
        : row.recipient_role === "registrar"
        ? "Registrar"
        : row.recipient_role === "company"
        ? "Company"
        : row.recipient_role === "admin"
        ? "Administrator"
        : "User",

    time: formatRelativeTime(row.created_at),

    unread: !row.read_at,

    icon: getNotificationIcon(row),
  };

  notification.action = resolveNotificationAction(notification);

  return notification;
};

// =========================================================
// RECIPIENT LABEL
// =========================================================

const getRecipientLabel = (recipient) => {
  switch (recipient) {
    case "all":
      return "All Students, Registrars, and Companies";

    case "students":
      return "All Students";

    case "registrars":
      return "All Registrars";

    case "companies":
      return "All Companies";

    default:
      return "Selected Users";
  }
};

// =========================================================
// RECIPIENT ROLE LIST
// =========================================================

const getRecipientRoles = (recipient) => {
  switch (recipient) {
    case "all":
      return ["student", "registrar", "company"];

    case "students":
      return ["student"];

    case "registrars":
      return ["registrar"];

    case "companies":
      return ["company"];

    default:
      return [];
  }
};

// =========================================================
// ADMIN NOTIFICATION TYPE
// =========================================================

const getAdminNotificationType = (notification) => {
  const type = String(notification?.type || "").toLowerCase();

  const title = String(notification?.title || "").toLowerCase();

  if (
    type === "account-request" ||
    type === "account_request" ||
    type === "registration_request" ||
    type === "registration-request" ||
    title.includes("student account request") ||
    title.includes("registrar account request") ||
    title.includes("registration request")
  ) {
    return "Account Requests";
  }

  if (
    type === "company-registration" ||
    type === "company_registration" ||
    title.includes("company registration")
  ) {
    return "Company Registration";
  }

  if (type === "announcement") {
    return "Announcement";
  }

  if (type === "system") {
    return "System";
  }

  return notification?.category || "Other";
};

// =========================================================
// COMPONENT
// =========================================================

const SystemNotification = () => {
  const { darkMode } = useOutletContext() || {};

  const navigate = useNavigate();

  // =========================================================
  // CURRENT ADMIN
  // =========================================================

  const [adminUserId, setAdminUserId] = useState(null);

  // =========================================================
  // TABS
  // =========================================================

  const [activeTab, setActiveTab] = useState("notifications");

  // =========================================================
  // NOTIFICATIONS
  // =========================================================

  const [notifications, setNotifications] = useState([]);

  const [readFilter, setReadFilter] = useState("All");

  const [notificationTypeFilter, setNotificationTypeFilter] =
    useState("All Types");

  const [pageSize, setPageSize] = useState(10);

  const [currentPage, setCurrentPage] = useState(1);

  const [loadingNotifications, setLoadingNotifications] = useState(true);

  const [notificationError, setNotificationError] = useState("");

  // =========================================================
  // SEND NOTIFICATION FORM
  // =========================================================

  const [recipient, setRecipient] = useState("all");

  const [subject, setSubject] = useState("");

  const [message, setMessage] = useState("");

  // =========================================================
  // SENT HISTORY
  // =========================================================

  const [sentNotifications, setSentNotifications] = useState([]);

  const [loadingSentNotifications, setLoadingSentNotifications] =
    useState(false);

  // =========================================================
  // SEND STATUS
  // =========================================================

  const [sendSuccess, setSendSuccess] = useState(false);

  const [sendError, setSendError] = useState("");

  const [sending, setSending] = useState(false);

  // =========================================================
  // GENERAL ACTION STATE
  // =========================================================

  const [actionLoading, setActionLoading] = useState(false);

  // =========================================================
  // LOAD CURRENT ADMIN
  // =========================================================

  useEffect(() => {
    let mounted = true;

    const loadCurrentAdmin = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error) {
          console.error("Failed to get current admin:", error);

          if (mounted) {
            setNotificationError("Unable to identify the current admin.");
            setLoadingNotifications(false);
          }

          return;
        }

        if (!user) {
          if (mounted) {
            setNotificationError("No authenticated admin user found.");
            setLoadingNotifications(false);
          }

          return;
        }

        if (mounted) {
          setAdminUserId(user.id);
        }
      } catch (error) {
        console.error("Unexpected admin auth error:", error);

        if (mounted) {
          setNotificationError("Unable to load the admin account.");
          setLoadingNotifications(false);
        }
      }
    };

    loadCurrentAdmin();

    return () => {
      mounted = false;
    };
  }, []);

  // =========================================================
  // LOAD RECEIVED ADMIN NOTIFICATIONS
  // =========================================================

  const loadNotifications = async (userId = adminUserId) => {
    if (!userId) {
      return;
    }

    try {
      setLoadingNotifications(true);
      setNotificationError("");

      const { data, error } = await supabase
        .from("notifications")
        .select(NOTIFICATION_SELECT)
        .eq("recipient_id", userId)
        .eq("recipient_role", "admin")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Failed to load admin notifications:", error);

        setNotificationError("Unable to load notifications. Please try again.");

        return;
      }

      setNotifications((data || []).map(mapNotification).filter(Boolean));
    } catch (error) {
      console.error("Unexpected notification loading error:", error);

      setNotificationError(
        "An unexpected error occurred while loading notifications."
      );
    } finally {
      setLoadingNotifications(false);
    }
  };

  // =========================================================
  // LOAD SENT NOTIFICATION HISTORY
  // =========================================================

  const loadSentNotifications = async (userId = adminUserId) => {
    if (!userId) {
      return;
    }

    try {
      setLoadingSentNotifications(true);

      const { data, error } = await supabase
        .from("notifications")
        .select(NOTIFICATION_SELECT)
        .eq("created_by", userId)
        .neq("recipient_role", "admin")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Failed to load sent notifications:", error);
        return;
      }

      const grouped = [];
      const groupMap = new Map();

      for (const row of data || []) {
        const groupKey = [row.title, row.message, row.created_at].join("|");

        if (!groupMap.has(groupKey)) {
          const entry = {
            id: row.id,
            subject: row.title,
            message: row.message,
            createdAt: row.created_at,
            time: formatRelativeTime(row.created_at),
            recipientRoles: new Set(),
          };

          entry.recipientRoles.add(row.recipient_role);

          groupMap.set(groupKey, entry);

          grouped.push(entry);
        } else {
          groupMap.get(groupKey).recipientRoles.add(row.recipient_role);
        }
      }

      const normalized = grouped.map((item) => {
        const roles = Array.from(item.recipientRoles);

        let recipientLabel = "Selected Users";

        const hasStudent = roles.includes("student");
        const hasRegistrar = roles.includes("registrar");
        const hasCompany = roles.includes("company");

        if (hasStudent && hasRegistrar && hasCompany) {
          recipientLabel = "All Students, Registrars, and Companies";
        } else if (hasStudent && hasRegistrar) {
          recipientLabel = "Students and Registrars";
        } else if (hasStudent && hasCompany) {
          recipientLabel = "Students and Companies";
        } else if (hasRegistrar && hasCompany) {
          recipientLabel = "Registrars and Companies";
        } else if (hasStudent) {
          recipientLabel = "All Students";
        } else if (hasRegistrar) {
          recipientLabel = "All Registrars";
        } else if (hasCompany) {
          recipientLabel = "All Companies";
        }

        return {
          ...item,
          recipient: recipientLabel,
        };
      });

      setSentNotifications(normalized);
    } catch (error) {
      console.error("Unexpected sent notification loading error:", error);
    } finally {
      setLoadingSentNotifications(false);
    }
  };

  // =========================================================
  // INITIAL NOTIFICATION LOAD
  // =========================================================

  useEffect(() => {
    if (!adminUserId) {
      return;
    }

    loadNotifications(adminUserId);
    loadSentNotifications(adminUserId);
  }, [adminUserId]);

  // =========================================================
  // REALTIME NOTIFICATIONS
  // =========================================================

  useEffect(() => {
    if (!adminUserId) {
      return;
    }

    let mounted = true;

    const refreshNotifications = async () => {
      if (!mounted) {
        return;
      }

      await loadNotifications(adminUserId);
      await loadSentNotifications(adminUserId);
    };

    const channel = supabase
      .channel(`admin-notifications:${adminUserId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${adminUserId}`,
        },
        async () => {
          await refreshNotifications();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `created_by=eq.${adminUserId}`,
        },
        async () => {
          await refreshNotifications();
        }
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR") {
          console.error("Admin notification realtime channel error.");
        }

        if (status === "TIMED_OUT") {
          console.warn("Admin notification realtime subscription timed out.");
        }
      });

    return () => {
      mounted = false;

      supabase.removeChannel(channel);
    };
  }, [adminUserId]);

  // =========================================================
  // FILTERED NOTIFICATIONS
  // =========================================================

  const filteredNotifications = useMemo(() => {
    return notifications.filter((notification) => {
      // -----------------------------------------------------
      // READ FILTER
      // -----------------------------------------------------

      if (readFilter === "Unread" && !notification.unread) {
        return false;
      }

      if (readFilter === "Read" && notification.unread) {
        return false;
      }

      // -----------------------------------------------------
      // TYPE FILTER
      // -----------------------------------------------------

      if (notificationTypeFilter !== "All Types") {
        const notificationType = getAdminNotificationType(notification);

        if (notificationType !== notificationTypeFilter) {
          return false;
        }
      }

      return true;
    });
  }, [notifications, readFilter, notificationTypeFilter]);

  // =========================================================
  // PAGINATION
  // =========================================================

  const totalNotifications = filteredNotifications.length;

  const totalPages = Math.max(1, Math.ceil(totalNotifications / pageSize));

  const paginatedNotifications = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;

    return filteredNotifications.slice(startIndex, startIndex + pageSize);
  }, [filteredNotifications, currentPage, pageSize]);

  const showingStart =
    totalNotifications === 0 ? 0 : (currentPage - 1) * pageSize + 1;

  const showingEnd =
    totalNotifications === 0
      ? 0
      : Math.min(currentPage * pageSize, totalNotifications);

  // =========================================================
  // RESET PAGE WHEN FILTER CHANGES
  // =========================================================

  useEffect(() => {
    setCurrentPage(1);
  }, [readFilter, notificationTypeFilter, pageSize]);

  // =========================================================
  // KEEP PAGE VALID
  // =========================================================

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // =========================================================
  // UNREAD COUNT
  // =========================================================

  const unreadCount = notifications.filter(
    (notification) => notification.unread
  ).length;

  // =========================================================
  // MARK AS READ
  // =========================================================

  const markAsRead = async (id) => {
    if (!adminUserId || !id) {
      return;
    }

    const readAt = new Date().toISOString();

    setNotifications((previous) =>
      previous.map((notification) =>
        notification.id === id
          ? {
              ...notification,
              unread: false,
              readAt,
            }
          : notification
      )
    );

    try {
      const { error } = await supabase
        .from("notifications")
        .update({
          read_at: readAt,
        })
        .eq("id", id)
        .eq("recipient_id", adminUserId);

      if (error) {
        console.error("Failed to mark notification as read:", error);

        await loadNotifications(adminUserId);
      }
    } catch (error) {
      console.error("Unexpected mark-as-read error:", error);

      await loadNotifications(adminUserId);
    }
  };

  // =========================================================
  // MARK ALL AS READ
  // =========================================================

  const markAllAsRead = async () => {
    if (!adminUserId || unreadCount === 0) {
      return;
    }

    const readAt = new Date().toISOString();

    setActionLoading(true);

    setNotifications((previous) =>
      previous.map((notification) => ({
        ...notification,
        unread: false,
        readAt: notification.readAt || readAt,
      }))
    );

    try {
      const { error } = await supabase
        .from("notifications")
        .update({
          read_at: readAt,
        })
        .eq("recipient_id", adminUserId)
        .eq("recipient_role", "admin")
        .is("read_at", null);

      if (error) {
        console.error("Failed to mark all notifications as read:", error);

        await loadNotifications(adminUserId);
      }
    } catch (error) {
      console.error("Unexpected mark-all-read error:", error);

      await loadNotifications(adminUserId);
    } finally {
      setActionLoading(false);
    }
  };

  // =========================================================
  // CLEAR READ NOTIFICATIONS
  // =========================================================

  const clearReadNotifications = async () => {
    if (!adminUserId) {
      return;
    }

    const readNotifications = notifications.filter(
      (notification) => !notification.unread
    );

    if (readNotifications.length === 0) {
      return;
    }

    setActionLoading(true);

    try {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("recipient_id", adminUserId)
        .eq("recipient_role", "admin")
        .not("read_at", "is", null);

      if (error) {
        console.error("Failed to clear read notifications:", error);

        return;
      }

      setNotifications((previous) =>
        previous.filter((notification) => notification.unread)
      );
    } catch (error) {
      console.error("Unexpected clear-read error:", error);
    } finally {
      setActionLoading(false);
    }
  };

  // =========================================================
  // HANDLE NOTIFICATION ACTION
  // =========================================================

  const handleNotificationAction = async (notification) => {
    if (!notification) {
      return;
    }

    const action = resolveNotificationAction(notification);

    if (!action?.path) {
      return;
    }

    if (notification.unread) {
      await markAsRead(notification.id);
    }

    navigate(action.path);
  };

  // =========================================================
  // SEND NOTIFICATION
  // =========================================================

  const handleSendNotification = async (event) => {
    event.preventDefault();

    setSendError("");
    setSendSuccess(false);

    if (!adminUserId) {
      setSendError("Unable to identify the administrator account.");
      return;
    }

    const trimmedSubject = subject.trim();
    const trimmedMessage = message.trim();

    if (!trimmedSubject || !trimmedMessage) {
      setSendError("Please enter both a notification title and message.");
      return;
    }

    const recipientRoles = getRecipientRoles(recipient);

    if (recipientRoles.length === 0) {
      setSendError("Please select at least one recipient group.");
      return;
    }

    setSending(true);

    try {
      const { data: recipients, error: recipientsError } = await supabase
        .from("users")
        .select("id, role")
        .in("role", recipientRoles)
        .eq("status", "active");

      if (recipientsError) {
        console.error(
          "Failed to load notification recipients:",
          recipientsError
        );

        setSendError(
          "Unable to load the selected recipients. Please try again."
        );

        return;
      }

      if (!recipients || recipients.length === 0) {
        setSendError(
          "No active users were found for the selected recipient group."
        );

        return;
      }

      const notificationRows = recipients.map((user) => ({
        recipient_id: user.id,
        recipient_role: user.role,
        type: "announcement",
        category: "System",
        title: trimmedSubject,
        message: trimmedMessage,
        related_entity_type: null,
        related_entity_id: null,
        action_path: null,
        created_by: adminUserId,
        read_at: null,
      }));

      const { error: insertError } = await supabase
        .from("notifications")
        .insert(notificationRows);

      if (insertError) {
        console.error("Failed to send notification:", insertError);

        setSendError("The notification could not be sent. Please try again.");

        return;
      }

      setSubject("");
      setMessage("");
      setRecipient("all");

      setSendSuccess(true);

      await loadSentNotifications(adminUserId);

      setTimeout(() => {
        setSendSuccess(false);
      }, 3500);
    } catch (error) {
      console.error("Unexpected send notification error:", error);

      setSendError(
        "An unexpected error occurred while sending the notification."
      );
    } finally {
      setSending(false);
    }
  };

  // =========================================================
  // RECIPIENT DESCRIPTION
  // =========================================================

  const recipientDescription = {
    all: "Students, registrars, and company users",
    students: "All registered student users",
    registrars: "All registered registrar users",
    companies: "All registered company users",
  };

  // =========================================================
  // RETURN
  // =========================================================

  return (
    <div
      className={`min-h-screen p-4 sm:p-6 lg:p-8 ${
        darkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"
      }`}
    >
      <div className="mx-auto max-w-7xl">
        {/* =================================================
            PAGE HEADER
        ================================================= */}

        <div className="mb-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p
                className={`text-xs font-semibold uppercase tracking-wider ${
                  darkMode ? "text-blue-400" : "text-blue-600"
                }`}
              >
                Administration
              </p>

              <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
                System Notifications
              </h1>

              <p
                className={`mt-2 max-w-2xl text-sm ${
                  darkMode ? "text-slate-400" : "text-slate-500"
                }`}
              >
                Monitor administrator alerts and send important announcements to
                system users.
              </p>
            </div>

            <div
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
                darkMode
                  ? "border-slate-700 bg-slate-900"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                  unreadCount > 0
                    ? darkMode
                      ? "bg-red-950 text-red-300"
                      : "bg-red-100 text-red-600"
                    : darkMode
                    ? "bg-slate-800 text-slate-400"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                🔔
              </div>

              <div>
                <p className="text-lg font-bold leading-none">{unreadCount}</p>

                <p
                  className={`mt-1 text-[11px] ${
                    darkMode ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  Unread notifications
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* =================================================
            TABS
        ================================================= */}

        <div
          className={`mb-6 flex flex-col gap-1 rounded-xl border p-1.5 sm:flex-row ${
            darkMode
              ? "border-slate-700 bg-slate-900"
              : "border-slate-200 bg-white"
          }`}
        >
          <button
            type="button"
            onClick={() => setActiveTab("notifications")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition ${
              activeTab === "notifications"
                ? darkMode
                  ? "bg-white text-slate-900"
                  : "bg-slate-800 text-white"
                : darkMode
                ? "text-slate-400 hover:bg-slate-800 hover:text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span>🔔</span>

            <span>Notifications</span>

            {unreadCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("send")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition ${
              activeTab === "send"
                ? darkMode
                  ? "bg-white text-slate-900"
                  : "bg-slate-800 text-white"
                : darkMode
                ? "text-slate-400 hover:bg-slate-800 hover:text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span>📢</span>

            <span>Send Notification</span>
          </button>
        </div>

        {/* =================================================
            NOTIFICATIONS TAB
        ================================================= */}

        {activeTab === "notifications" && (
          <div className="space-y-5">
            {/* =================================================
                FILTER / ACTION BAR
            ================================================= */}

            <div
              className={`rounded-xl border p-4 ${
                darkMode
                  ? "border-slate-700 bg-slate-900"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex flex-col gap-4">
                {/* TOP FILTERS */}

                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  {/* READ FILTER */}

                  <div>
                    <p className="mb-2 text-xs font-bold">
                      Notification Status
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {["All", "Unread", "Read"].map((filter) => (
                        <button
                          key={filter}
                          type="button"
                          onClick={() => setReadFilter(filter)}
                          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                            readFilter === filter
                              ? darkMode
                                ? "bg-white text-slate-900"
                                : "bg-slate-800 text-white"
                              : darkMode
                              ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          {filter}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* PAGE SIZE */}

                  <div className="flex items-center gap-2">
                    <label
                      htmlFor="admin-page-size"
                      className={`text-xs font-semibold ${
                        darkMode ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
                      Show
                    </label>

                    <select
                      id="admin-page-size"
                      value={pageSize}
                      onChange={(event) =>
                        setPageSize(Number(event.target.value))
                      }
                      className={`rounded-lg border px-3 py-2 text-xs font-semibold outline-none ${
                        darkMode
                          ? "border-slate-700 bg-slate-800 text-slate-200"
                          : "border-slate-200 bg-white text-slate-700"
                      }`}
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </select>

                    <span
                      className={`text-xs ${
                        darkMode ? "text-slate-500" : "text-slate-400"
                      }`}
                    >
                      per page
                    </span>
                  </div>
                </div>

                {/* TYPE FILTER */}

                {/* <div>
                  <p className="mb-2 text-xs font-bold">Notification Type</p>

                  <div className="flex flex-wrap gap-2">
                    {[
                      "All Types",
                      "Account Requests",
                      "Company Registration",
                      "Announcement",
                      "System",
                    ].map((filter) => (
                      <button
                        key={filter}
                        type="button"
                        onClick={() => setNotificationTypeFilter(filter)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                          notificationTypeFilter === filter
                            ? darkMode
                              ? "bg-white text-slate-900"
                              : "bg-slate-800 text-white"
                            : darkMode
                            ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>
                </div> */}

                {/* ACTIONS */}

                <div className="flex flex-wrap items-center gap-2 border-t pt-3 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    disabled={unreadCount === 0 || actionLoading}
                    className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                      unreadCount === 0 || actionLoading
                        ? darkMode
                          ? "cursor-not-allowed bg-slate-800 text-slate-600"
                          : "cursor-not-allowed bg-slate-100 text-slate-400"
                        : darkMode
                        ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {actionLoading ? "Working..." : "Mark All as Read"}
                  </button>

                  <button
                    type="button"
                    onClick={clearReadNotifications}
                    disabled={actionLoading}
                    className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                      actionLoading
                        ? "cursor-not-allowed opacity-50"
                        : darkMode
                        ? "text-red-400 hover:bg-red-950"
                        : "text-red-600 hover:bg-red-50"
                    }`}
                  >
                    Clear Read
                  </button>

                  <div className="ml-auto text-[11px]">
                    <span
                      className={darkMode ? "text-slate-500" : "text-slate-400"}
                    >
                      Showing{" "}
                    </span>

                    <span className="font-semibold">
                      {showingStart}–{showingEnd}
                    </span>

                    <span
                      className={darkMode ? "text-slate-500" : "text-slate-400"}
                    >
                      {" "}
                      of{" "}
                    </span>

                    <span className="font-semibold">{totalNotifications}</span>

                    <span
                      className={darkMode ? "text-slate-500" : "text-slate-400"}
                    >
                      {" "}
                      notifications
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* =================================================
                ERROR
            ================================================= */}

            {notificationError && (
              <div
                className={`rounded-xl border px-4 py-3 text-xs ${
                  darkMode
                    ? "border-red-900 bg-red-950/30 text-red-300"
                    : "border-red-200 bg-red-50 text-red-700"
                }`}
              >
                <div className="flex items-start gap-2">
                  <span>⚠️</span>

                  <div className="flex-1">
                    <p className="font-semibold">{notificationError}</p>

                    <button
                      type="button"
                      onClick={() => loadNotifications(adminUserId)}
                      className="mt-1 font-semibold underline"
                    >
                      Try again
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* =================================================
                LOADING
            ================================================= */}

            {loadingNotifications ? (
              <div
                className={`rounded-xl border p-12 text-center ${
                  darkMode
                    ? "border-slate-700 bg-slate-900"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-blue-500" />

                <p
                  className={`text-xs ${
                    darkMode ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  Loading notifications...
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* =================================================
                    NOTIFICATION LIST
                ================================================= */}

                {paginatedNotifications.length > 0 ? (
                  paginatedNotifications.map((notification) => {
                    const action = notification.action;

                    const adminType = getAdminNotificationType(notification);

                    return (
                      <div
                        key={notification.id}
                        className={`rounded-xl border p-4 transition sm:p-5 ${
                          notification.unread
                            ? darkMode
                              ? "border-blue-800 bg-slate-900"
                              : "border-blue-200 bg-white"
                            : darkMode
                            ? "border-slate-700 bg-slate-900"
                            : "border-slate-200 bg-white"
                        }`}
                      >
                        <div className="flex gap-4">
                          {/* ICON */}

                          <div
                            className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-lg ${
                              adminType === "Account Requests"
                                ? darkMode
                                  ? "bg-blue-950 text-blue-300"
                                  : "bg-blue-100 text-blue-700"
                                : adminType === "Company Registration"
                                ? darkMode
                                  ? "bg-emerald-950 text-emerald-300"
                                  : "bg-emerald-100 text-emerald-700"
                                : adminType === "Announcement"
                                ? darkMode
                                  ? "bg-purple-950 text-purple-300"
                                  : "bg-purple-100 text-purple-700"
                                : darkMode
                                ? "bg-slate-800"
                                : "bg-slate-100"
                            }`}
                          >
                            {notification.icon}
                          </div>

                          {/* CONTENT */}

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="text-sm font-bold">
                                    {notification.title}
                                  </h3>

                                  {notification.unread && (
                                    <span className="h-2 w-2 rounded-full bg-blue-500" />
                                  )}
                                </div>

                                <p
                                  className={`mt-1 text-[11px] ${
                                    darkMode
                                      ? "text-slate-500"
                                      : "text-slate-400"
                                  }`}
                                >
                                  {notification.time}
                                </p>
                              </div>

                              <span
                                className={`self-start rounded-full px-2 py-1 text-[10px] font-semibold ${
                                  adminType === "Account Requests"
                                    ? darkMode
                                      ? "bg-blue-950 text-blue-300"
                                      : "bg-blue-100 text-blue-700"
                                    : adminType === "Company Registration"
                                    ? darkMode
                                      ? "bg-emerald-950 text-emerald-300"
                                      : "bg-emerald-100 text-emerald-700"
                                    : adminType === "Announcement"
                                    ? darkMode
                                      ? "bg-purple-950 text-purple-300"
                                      : "bg-purple-100 text-purple-700"
                                    : darkMode
                                    ? "bg-slate-800 text-slate-400"
                                    : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {adminType}
                              </span>
                            </div>

                            <p
                              className={`mt-3 text-sm leading-relaxed ${
                                darkMode ? "text-slate-300" : "text-slate-600"
                              }`}
                            >
                              {notification.message}
                            </p>

                            <div className="mt-4 flex flex-wrap items-center gap-3">
                              {/* READ STATUS */}

                              {notification.unread ? (
                                <button
                                  type="button"
                                  onClick={() => markAsRead(notification.id)}
                                  className={`text-[11px] font-semibold ${
                                    darkMode
                                      ? "text-blue-400 hover:text-blue-300"
                                      : "text-blue-600 hover:text-blue-700"
                                  }`}
                                >
                                  Mark as read
                                </button>
                              ) : (
                                <span
                                  className={`text-[11px] ${
                                    darkMode
                                      ? "text-slate-600"
                                      : "text-slate-400"
                                  }`}
                                >
                                  Read
                                </span>
                              )}

                              {/* ACTION */}

                              {action && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleNotificationAction(notification)
                                  }
                                  className={`ml-auto inline-flex items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-bold transition ${
                                    darkMode
                                      ? "bg-white text-slate-900 hover:bg-slate-200"
                                      : "bg-slate-800 text-white hover:bg-slate-700"
                                  }`}
                                >
                                  <span>{action.icon}</span>

                                  <span>{action.label}</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div
                    className={`rounded-xl border p-12 text-center ${
                      darkMode
                        ? "border-slate-700 bg-slate-900"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="mb-3 text-4xl">🔕</div>

                    <h3 className="text-sm font-bold">
                      No notifications found
                    </h3>

                    <p
                      className={`mt-1 text-xs ${
                        darkMode ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
                      {notifications.length === 0
                        ? "You currently have no administrator notifications."
                        : "No notifications match the selected filters."}
                    </p>
                  </div>
                )}

                {/* =================================================
                    PAGINATION
                ================================================= */}

                {totalNotifications > 0 && (
                  <div
                    className={`flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between ${
                      darkMode
                        ? "border-slate-700 bg-slate-900"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <p
                      className={`text-xs ${
                        darkMode ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
                      Showing{" "}
                      <span className="font-semibold">{showingStart}</span>–
                      <span className="font-semibold">{showingEnd}</span> of{" "}
                      <span className="font-semibold">
                        {totalNotifications}
                      </span>{" "}
                      notifications
                    </p>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setCurrentPage((previous) =>
                            Math.max(previous - 1, 1)
                          )
                        }
                        disabled={currentPage === 1}
                        className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                          currentPage === 1
                            ? darkMode
                              ? "cursor-not-allowed bg-slate-800 text-slate-600"
                              : "cursor-not-allowed bg-slate-100 text-slate-400"
                            : darkMode
                            ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        ← Previous
                      </button>

                      <span
                        className={`rounded-lg px-3 py-2 text-xs font-semibold ${
                          darkMode
                            ? "bg-slate-800 text-slate-300"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        Page {currentPage} of {totalPages}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          setCurrentPage((previous) =>
                            Math.min(previous + 1, totalPages)
                          )
                        }
                        disabled={currentPage === totalPages}
                        className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                          currentPage === totalPages
                            ? darkMode
                              ? "cursor-not-allowed bg-slate-800 text-slate-600"
                              : "cursor-not-allowed bg-slate-100 text-slate-400"
                            : darkMode
                            ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        Next →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* =================================================
                INFORMATION BOX
            ================================================= */}

            <div
              className={`rounded-xl border p-4 ${
                darkMode
                  ? "border-blue-900 bg-blue-950/30 text-blue-300"
                  : "border-blue-200 bg-blue-50 text-blue-700"
              }`}
            >
              <div className="flex gap-3">
                <span className="text-lg">💡</span>

                <div>
                  <p className="text-xs font-bold">
                    Administrator Notifications
                  </p>

                  <p className="mt-1 text-[11px] leading-relaxed">
                    These notifications are intended for the administrator and
                    include account registration requests, company
                    registrations, and important system events.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =================================================
            SEND NOTIFICATION TAB
        ================================================= */}

        {activeTab === "send" && (
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
            {/* =================================================
                SEND FORM
            ================================================= */}

            <div
              className={`rounded-xl border p-5 sm:p-6 xl:col-span-2 ${
                darkMode
                  ? "border-slate-700 bg-slate-900"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="mb-6">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                      darkMode
                        ? "bg-blue-950 text-blue-300"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    📢
                  </div>

                  <div>
                    <h2 className="text-base font-bold">
                      Send System Notification
                    </h2>

                    <p
                      className={`mt-0.5 text-xs ${
                        darkMode ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
                      Send an announcement to selected users.
                    </p>
                  </div>
                </div>
              </div>

              {/* SUCCESS */}

              {sendSuccess && (
                <div
                  className={`mb-5 rounded-lg border px-4 py-3 text-xs ${
                    darkMode
                      ? "border-emerald-900 bg-emerald-950/40 text-emerald-300"
                      : "border-emerald-200 bg-emerald-50 text-emerald-700"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span>✓</span>

                    <span className="font-semibold">
                      Notification sent successfully.
                    </span>
                  </div>
                </div>
              )}

              {/* ERROR */}

              {sendError && (
                <div
                  className={`mb-5 rounded-lg border px-4 py-3 text-xs ${
                    darkMode
                      ? "border-red-900 bg-red-950/40 text-red-300"
                      : "border-red-200 bg-red-50 text-red-700"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span>⚠️</span>

                    <span className="font-semibold">{sendError}</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleSendNotification} className="space-y-5">
                {/* RECIPIENT */}

                <div>
                  <label className="mb-2 block text-xs font-bold">
                    Send To
                  </label>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {[
                      {
                        value: "all",
                        label: "All Users",
                        icon: "👥",
                        description: "Students, registrars, and companies",
                      },
                      {
                        value: "students",
                        label: "Students",
                        icon: "🎓",
                        description: "All registered students",
                      },
                      {
                        value: "registrars",
                        label: "Registrars",
                        icon: "👨‍💼",
                        description: "All registered registrars",
                      },
                      {
                        value: "companies",
                        label: "Companies",
                        icon: "🏢",
                        description: "All registered companies",
                      },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setRecipient(option.value)}
                        className={`rounded-xl border p-4 text-left transition ${
                          recipient === option.value
                            ? darkMode
                              ? "border-blue-600 bg-blue-950/40"
                              : "border-blue-500 bg-blue-50"
                            : darkMode
                            ? "border-slate-700 bg-slate-800 hover:border-slate-600"
                            : "border-slate-200 bg-slate-50 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="text-xl">{option.icon}</div>

                          <div className="flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs font-bold">
                                {option.label}
                              </p>

                              {recipient === option.value && (
                                <span className="text-blue-500">✓</span>
                              )}
                            </div>

                            <p
                              className={`mt-1 text-[10px] ${
                                darkMode ? "text-slate-400" : "text-slate-500"
                              }`}
                            >
                              {option.description}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  <p
                    className={`mt-2 text-[11px] ${
                      darkMode ? "text-slate-500" : "text-slate-400"
                    }`}
                  >
                    Selected recipients:{" "}
                    <span className="font-semibold">
                      {recipientDescription[recipient]}
                    </span>
                  </p>
                </div>

                {/* SUBJECT */}

                <div>
                  <label
                    htmlFor="notification-subject"
                    className="mb-2 block text-xs font-bold"
                  >
                    Notification Title
                  </label>

                  <input
                    id="notification-subject"
                    type="text"
                    value={subject}
                    onChange={(event) => {
                      setSubject(event.target.value);
                      setSendError("");
                    }}
                    placeholder="Enter notification title"
                    maxLength={100}
                    className={`w-full rounded-lg border px-3 py-3 text-sm outline-none transition ${
                      darkMode
                        ? "border-slate-700 bg-slate-800 text-white placeholder:text-slate-500 focus:border-blue-500"
                        : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-blue-500"
                    }`}
                  />

                  <p
                    className={`mt-1 text-right text-[10px] ${
                      darkMode ? "text-slate-500" : "text-slate-400"
                    }`}
                  >
                    {subject.length}/100
                  </p>
                </div>

                {/* MESSAGE */}

                <div>
                  <label
                    htmlFor="notification-message"
                    className="mb-2 block text-xs font-bold"
                  >
                    Message
                  </label>

                  <textarea
                    id="notification-message"
                    value={message}
                    onChange={(event) => {
                      setMessage(event.target.value);
                      setSendError("");
                    }}
                    placeholder="Write your notification message..."
                    rows={7}
                    maxLength={1000}
                    className={`w-full resize-y rounded-lg border px-3 py-3 text-sm outline-none transition ${
                      darkMode
                        ? "border-slate-700 bg-slate-800 text-white placeholder:text-slate-500 focus:border-blue-500"
                        : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-blue-500"
                    }`}
                  />

                  <p
                    className={`mt-1 text-right text-[10px] ${
                      darkMode ? "text-slate-500" : "text-slate-400"
                    }`}
                  >
                    {message.length}/1000
                  </p>
                </div>

                {/* SEND */}

                <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
                  <p
                    className={`text-[11px] ${
                      darkMode ? "text-slate-500" : "text-slate-400"
                    }`}
                  >
                    📢 This notification will be delivered to all active users
                    in the selected group.
                  </p>

                  <button
                    type="submit"
                    disabled={sending || !subject.trim() || !message.trim()}
                    className={`rounded-lg px-5 py-2.5 text-xs font-bold transition ${
                      sending || !subject.trim() || !message.trim()
                        ? darkMode
                          ? "cursor-not-allowed bg-slate-800 text-slate-600"
                          : "cursor-not-allowed bg-slate-100 text-slate-400"
                        : darkMode
                        ? "bg-white text-slate-900 hover:bg-slate-200"
                        : "bg-slate-800 text-white hover:bg-slate-700"
                    }`}
                  >
                    {sending ? "Sending..." : "📢 Send Notification"}
                  </button>
                </div>
              </form>
            </div>

            {/* =================================================
                SENT HISTORY
            ================================================= */}

            <div
              className={`rounded-xl border p-5 ${
                darkMode
                  ? "border-slate-700 bg-slate-900"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold">Sent Notifications</h2>

                  <p
                    className={`mt-1 text-[11px] ${
                      darkMode ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    Recent announcements
                  </p>
                </div>

                <span
                  className={`rounded-full px-2 py-1 text-[10px] ${
                    darkMode
                      ? "bg-slate-800 text-slate-400"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {sentNotifications.length}
                </span>
              </div>

              {loadingSentNotifications ? (
                <div className="py-8 text-center">
                  <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-blue-500" />

                  <p
                    className={`text-[10px] ${
                      darkMode ? "text-slate-500" : "text-slate-400"
                    }`}
                  >
                    Loading sent notifications...
                  </p>
                </div>
              ) : sentNotifications.length > 0 ? (
                <div className="space-y-3">
                  {sentNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`rounded-lg border p-3 ${
                        darkMode
                          ? "border-slate-700 bg-slate-800"
                          : "border-slate-200 bg-slate-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-bold">
                          {notification.subject}
                        </p>

                        <span
                          className={`whitespace-nowrap text-[9px] ${
                            darkMode ? "text-slate-500" : "text-slate-400"
                          }`}
                        >
                          {notification.time}
                        </span>
                      </div>

                      <p
                        className={`mt-1 text-[10px] ${
                          darkMode ? "text-blue-400" : "text-blue-600"
                        }`}
                      >
                        To: {notification.recipient}
                      </p>

                      <p
                        className={`mt-2 line-clamp-3 text-[11px] ${
                          darkMode ? "text-slate-400" : "text-slate-500"
                        }`}
                      >
                        {notification.message}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  className={`rounded-lg border border-dashed p-8 text-center ${
                    darkMode ? "border-slate-700" : "border-slate-200"
                  }`}
                >
                  <div className="mb-2 text-2xl">📭</div>

                  <p className="text-xs font-semibold">No sent notifications</p>

                  <p
                    className={`mt-1 text-[10px] ${
                      darkMode ? "text-slate-500" : "text-slate-400"
                    }`}
                  >
                    Notifications you send will appear here.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemNotification;
