import React, { useEffect, useMemo, useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { supabaseCompany } from "../../supabaseClient";

export default function Notification() {
  const outletContext = useOutletContext();
  const darkMode = outletContext?.darkMode ?? false;

  const navigate = useNavigate();

  // =========================================================
  // STATE
  // =========================================================

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  // =========================================================
  // FILTER / DISPLAY STATE
  // =========================================================

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [readFilter, setReadFilter] = useState("all");
  const [displayLimit, setDisplayLimit] = useState(10);

  // =========================================================
  // COMPANY ROUTES
  // =========================================================

  const COMPANY_NOTIFICATION_ROUTES = useMemo(
    () => [
      "/company/dashboard",
      "/company/jobs",
      "/company/applications",
      "/company/interns",
      "/company/evaluate",
      "/company/notifications",
      "/company/messages",
      "/company/settings",
    ],
    []
  );

  // =========================================================
  // NOTIFICATION ACTION MAPPING
  // =========================================================

  const getCompanyNotificationAction = (notification) => {
    if (!notification) {
      return {
        path: "/company/notifications",
        label: "Open",
      };
    }

    const type = String(notification.type || "").toLowerCase();
    const category = String(notification.category || "").toLowerCase();
    const relatedEntityType = String(
      notification.relatedEntityType || ""
    ).toLowerCase();

    // =====================================================
    // INTERNSHIP DEPLOYMENT / ASSIGNMENT
    // =====================================================

    if (
      relatedEntityType === "internshipassignment" ||
      relatedEntityType === "assignment" ||
      type.includes("deployment") ||
      type.includes("assignment") ||
      category.includes("internship")
    ) {
      return {
        path: "/company/interns",
        label: "Open",
      };
    }

    // =====================================================
    // APPLICATION
    // =====================================================

    if (
      relatedEntityType === "internshipapplication" ||
      type.includes("application") ||
      category.includes("application")
    ) {
      return {
        path: "/company/applications",
        label: "Open",
      };
    }

    // =====================================================
    // DOCUMENT
    // =====================================================

    if (
      relatedEntityType === "documentsubmission" ||
      type.includes("document") ||
      category.includes("document")
    ) {
      return {
        path: "/company/applications",
        label: "Open",
      };
    }

    // =====================================================
    // EVALUATION
    // =====================================================

    if (
      relatedEntityType === "internshipevaluation" ||
      relatedEntityType === "evaluation" ||
      type.includes("evaluation") ||
      category.includes("evaluation")
    ) {
      return {
        path: "/company/evaluate",
        label: "Open",
      };
    }

    // =====================================================
    // MESSAGES
    // =====================================================

    if (
      relatedEntityType === "message" ||
      type.includes("message") ||
      category.includes("message")
    ) {
      return {
        path: "/company/messages",
        label: "Open",
      };
    }

    // =====================================================
    // FALLBACK DATABASE ROUTE
    // =====================================================

    const databasePath = notification.actionPath;

    if (databasePath && COMPANY_NOTIFICATION_ROUTES.includes(databasePath)) {
      return {
        path: databasePath,
        label: "Open",
      };
    }

    return {
      path: "/company/notifications",
      label: "Open",
    };
  };

  // =========================================================
  // LOAD NOTIFICATIONS
  // =========================================================

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError("");

      // -----------------------------------------------------
      // GET CURRENT USER
      // -----------------------------------------------------

      const {
        data: { user },
        error: userError,
      } = await supabaseCompany.auth.getUser();

      if (userError) {
        console.error("Error getting authenticated company user:", userError);

        setError("Unable to load your account.");
        return;
      }

      if (!user) {
        setError("You are not currently signed in.");
        return;
      }

      // -----------------------------------------------------
      // LOAD COMPANY NOTIFICATIONS
      // -----------------------------------------------------

      const { data, error: notificationsError } = await supabaseCompany
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
        .eq("recipient_role", "company")
        .order("created_at", {
          ascending: false,
        });

      if (notificationsError) {
        console.error(
          "Error loading company notifications:",
          notificationsError
        );

        setError("Unable to load your notifications.");
        return;
      }

      // -----------------------------------------------------
      // NORMALIZE DATABASE FIELDS
      // -----------------------------------------------------

      const normalizedNotifications = (data || []).map((notification) => {
        const normalized = {
          id: notification.id,
          recipientId: notification.recipient_id,

          title: notification.title,
          message: notification.message,

          relatedEntityType: notification.related_entity_type,
          relatedEntityId: notification.related_entity_id,

          createdAt: notification.created_at,
          readAt: notification.read_at,

          actionPath: notification.action_path,

          type: notification.type,
          category: notification.category,
        };

        const action = getCompanyNotificationAction(normalized);

        return {
          ...normalized,
          actionPath: action.path,
          actionLabel: action.label,
        };
      });

      setNotifications(normalizedNotifications);
    } catch (err) {
      console.error("Unexpected error loading company notifications:", err);

      setError("Something went wrong while loading notifications.");
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    loadNotifications();
  }, []);

  // =========================================================
  // NOTIFICATION COUNTS
  // =========================================================

  const unreadCount = notifications.filter(
    (notification) => !notification.readAt
  ).length;

  // =========================================================
  // AVAILABLE CATEGORIES
  // =========================================================

  const notificationCategories = useMemo(() => {
    const categories = notifications
      .map((notification) => notification.category)
      .filter(Boolean)
      .map((category) => String(category).trim());

    return [...new Set(categories)].sort((a, b) => a.localeCompare(b));
  }, [notifications]);

  // =========================================================
  // FILTERED NOTIFICATIONS
  // =========================================================

  const filteredNotifications = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return notifications.filter((notification) => {
      // -----------------------------------------------------
      // SEARCH
      // -----------------------------------------------------

      if (search) {
        const searchableText = [
          notification.title,
          notification.message,
          notification.category,
          notification.type,
          notification.relatedEntityType,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!searchableText.includes(search)) {
          return false;
        }
      }

      // -----------------------------------------------------
      // CATEGORY
      // -----------------------------------------------------

      if (categoryFilter !== "all") {
        if (
          String(notification.category || "").toLowerCase() !==
          categoryFilter.toLowerCase()
        ) {
          return false;
        }
      }

      // -----------------------------------------------------
      // READ STATUS
      // -----------------------------------------------------

      if (readFilter === "unread" && notification.readAt) {
        return false;
      }

      if (readFilter === "read" && !notification.readAt) {
        return false;
      }

      return true;
    });
  }, [notifications, searchTerm, categoryFilter, readFilter]);

  // =========================================================
  // DISPLAYED NOTIFICATIONS
  // =========================================================

  const displayedNotifications = useMemo(() => {
    if (displayLimit === "all") {
      return filteredNotifications;
    }

    return filteredNotifications.slice(0, Number(displayLimit));
  }, [filteredNotifications, displayLimit]);

  // =========================================================
  // MARK SINGLE NOTIFICATION AS READ / UNREAD
  // =========================================================

  const toggleReadStatus = async (notification) => {
    if (!notification?.id) return;

    setActionLoading(notification.id);

    try {
      const nextReadAt = notification.readAt ? null : new Date().toISOString();

      const { data, error: updateError } = await supabaseCompany
        .from("notifications")
        .update({
          read_at: nextReadAt,
        })
        .eq("id", notification.id)
        .eq("recipient_id", notification.recipientId)
        .eq("recipient_role", "company")
        .select()
        .single();

      if (updateError) {
        console.error("Error updating company notification:", updateError);

        throw updateError;
      }

      if (!data) {
        throw new Error("Notification could not be updated.");
      }

      setNotifications((previous) =>
        previous.map((item) =>
          item.id === notification.id
            ? {
                ...item,
                readAt: data.read_at,
              }
            : item
        )
      );
    } catch (err) {
      console.error("Unable to update company notification:", err);

      alert(err.message || "Unable to update the notification.");
    } finally {
      setActionLoading(null);
    }
  };

  // =========================================================
  // MARK ALL AS READ
  // =========================================================

  const markAllAsRead = async () => {
    if (unreadCount === 0) return;

    try {
      setActionLoading(true);
      setError("");

      const {
        data: { user },
        error: userError,
      } = await supabaseCompany.auth.getUser();

      if (userError || !user) {
        console.error("Unable to get current company user:", userError);

        setError("Unable to identify your account.");
        return;
      }

      const now = new Date().toISOString();

      const { error: updateError } = await supabaseCompany
        .from("notifications")
        .update({
          read_at: now,
        })
        .eq("recipient_id", user.id)
        .eq("recipient_role", "company")
        .is("read_at", null);

      if (updateError) {
        console.error(
          "Error marking all company notifications as read:",
          updateError
        );

        setError("Unable to mark all notifications as read.");
        return;
      }

      setNotifications((previous) =>
        previous.map((notification) => ({
          ...notification,
          readAt: notification.readAt || now,
        }))
      );
    } catch (err) {
      console.error(
        "Unexpected error marking company notifications as read:",
        err
      );

      setError("Something went wrong while marking notifications as read.");
    } finally {
      setActionLoading(false);
    }
  };

  // =========================================================
  // OPEN RELATED PAGE
  // =========================================================

  const openNotification = async (notification) => {
    try {
      if (!notification) return;

      // -----------------------------------------------------
      // MARK AS READ FIRST
      // -----------------------------------------------------

      if (!notification.readAt) {
        const now = new Date().toISOString();

        const { error: updateError } = await supabaseCompany
          .from("notifications")
          .update({
            read_at: now,
          })
          .eq("id", notification.id)
          .eq("recipient_id", notification.recipientId)
          .eq("recipient_role", "company");

        if (updateError) {
          console.error(
            "Error marking company notification as read:",
            updateError
          );
        } else {
          setNotifications((previous) =>
            previous.map((item) =>
              item.id === notification.id
                ? {
                    ...item,
                    readAt: now,
                  }
                : item
            )
          );
        }
      }

      // -----------------------------------------------------
      // ALWAYS RECALCULATE ACTION
      // -----------------------------------------------------

      const action = getCompanyNotificationAction(notification);

      // -----------------------------------------------------
      // NAVIGATE
      // -----------------------------------------------------

      if (action.path) {
        navigate(action.path);
      }
    } catch (err) {
      console.error("Unexpected error opening company notification:", err);

      // Even if marking read fails,
      // still allow navigation.

      const action = getCompanyNotificationAction(notification);

      if (action.path) {
        navigate(action.path);
      }
    }
  };

  // =========================================================
  // FORMAT DATE
  // =========================================================

  const formatDate = (date) => {
    if (!date) return "Unknown date";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Unknown date";
    }

    return parsedDate.toLocaleString([], {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  // =========================================================
  // GET NOTIFICATION TYPE LABEL
  // =========================================================

  const getNotificationType = (notification) => {
    if (notification?.category) {
      const category = notification.category.replace(/[_-]+/g, " ").trim();

      if (category) {
        return category;
      }
    }

    switch (notification?.relatedEntityType) {
      case "InternshipApplication":
        return "Application";

      case "DocumentSubmission":
        return "Document";

      case "InformationItem":
        return "Information";

      case "InternshipAssignment":
        return "Internship";

      case "InternshipEvaluation":
      case "Evaluation":
        return "Evaluation";

      case "Message":
        return "Message";

      default:
        return "Notification";
    }
  };

  // =========================================================
  // CLEAR FILTERS
  // =========================================================

  const clearFilters = () => {
    setSearchTerm("");
    setCategoryFilter("all");
    setReadFilter("all");
    setDisplayLimit(10);
  };

  const hasActiveFilters =
    searchTerm.trim() !== "" ||
    categoryFilter !== "all" ||
    readFilter !== "all";

  // =========================================================
  // STYLES
  // =========================================================

  const pageText = darkMode ? "text-slate-100" : "text-slate-900";

  const card = darkMode
    ? "bg-slate-900 border-slate-700"
    : "bg-white border-slate-200";

  const secondaryText = darkMode ? "text-slate-400" : "text-slate-500";

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className={`p-5 md:p-6 lg:p-8 max-w-[1100px] mx-auto ${pageText}`}>
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="mb-6">
        <p className="text-xs uppercase tracking-widest font-bold text-slate-400">
          Company Portal
        </p>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black">Notifications</h1>

            {unreadCount > 0 && (
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                  darkMode
                    ? "bg-purple-950 text-purple-300"
                    : "bg-purple-100 text-purple-700"
                }`}
              >
                {unreadCount} Unread
              </span>
            )}
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              disabled={actionLoading}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                actionLoading ? "opacity-50 cursor-not-allowed" : ""
              } ${
                darkMode
                  ? "bg-slate-800 text-purple-300 hover:bg-slate-700"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {actionLoading ? "Updating..." : "Mark All as Read"}
            </button>
          )}
        </div>

        <p className={`text-sm mt-2 ${secondaryText}`}>
          Stay updated with internship deployments, applications, documents,
          evaluations, and other company activities.
        </p>
      </div>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div
          className={`mb-5 rounded-xl border px-4 py-3 text-sm ${
            darkMode
              ? "bg-red-950/30 border-red-900 text-red-300"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          {error}
        </div>
      )}

      {/* =====================================================
          FILTERS
      ===================================================== */}

      {!loading && notifications.length > 0 && (
        <div className={`mb-5 border rounded-2xl p-4 ${card}`}>
          <div className="flex flex-col gap-3">
            {/* SEARCH */}

            <div className="w-full">
              <label
                className={`block text-[10px] uppercase tracking-widest font-bold mb-1.5 ${secondaryText}`}
              >
                Search
              </label>

              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search notifications..."
                className={`w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition ${
                  darkMode
                    ? "bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-purple-500"
                    : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-purple-500"
                }`}
              />
            </div>

            {/* SELECT FILTERS */}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* CATEGORY */}

              <div>
                <label
                  className={`block text-[10px] uppercase tracking-widest font-bold mb-1.5 ${secondaryText}`}
                >
                  Category
                </label>

                <select
                  value={categoryFilter}
                  onChange={(event) => setCategoryFilter(event.target.value)}
                  className={`w-full px-3 py-2.5 rounded-lg border text-sm outline-none ${
                    darkMode
                      ? "bg-slate-800 border-slate-700 text-slate-100"
                      : "bg-white border-slate-200 text-slate-900"
                  }`}
                >
                  <option value="all">All Categories</option>

                  {notificationCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* READ STATUS */}

              <div>
                <label
                  className={`block text-[10px] uppercase tracking-widest font-bold mb-1.5 ${secondaryText}`}
                >
                  Status
                </label>

                <select
                  value={readFilter}
                  onChange={(event) => setReadFilter(event.target.value)}
                  className={`w-full px-3 py-2.5 rounded-lg border text-sm outline-none ${
                    darkMode
                      ? "bg-slate-800 border-slate-700 text-slate-100"
                      : "bg-white border-slate-200 text-slate-900"
                  }`}
                >
                  <option value="all">All Notifications</option>

                  <option value="unread">Unread</option>

                  <option value="read">Read</option>
                </select>
              </div>

              {/* DISPLAY LIMIT */}

              <div>
                <label
                  className={`block text-[10px] uppercase tracking-widest font-bold mb-1.5 ${secondaryText}`}
                >
                  Show
                </label>

                <select
                  value={displayLimit}
                  onChange={(event) => {
                    const value = event.target.value;

                    setDisplayLimit(value === "all" ? "all" : Number(value));
                  }}
                  className={`w-full px-3 py-2.5 rounded-lg border text-sm outline-none ${
                    darkMode
                      ? "bg-slate-800 border-slate-700 text-slate-100"
                      : "bg-white border-slate-200 text-slate-900"
                  }`}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value="all">All</option>
                </select>
              </div>
            </div>

            {/* FILTER SUMMARY */}

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-1">
              <p className={`text-xs ${secondaryText}`}>
                Showing{" "}
                <span className="font-bold">
                  {displayedNotifications.length}
                </span>{" "}
                of{" "}
                <span className="font-bold">
                  {filteredNotifications.length}
                </span>{" "}
                matching notifications
                {filteredNotifications.length !== notifications.length &&
                  ` (${notifications.length} total)`}
              </p>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className={`text-xs font-bold transition ${
                    darkMode
                      ? "text-purple-400 hover:text-purple-300"
                      : "text-purple-600 hover:text-purple-700"
                  }`}
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          NOTIFICATION LIST
      ===================================================== */}

      <section
        className={`border rounded-2xl overflow-hidden shadow-sm ${card}`}
      >
        {loading ? (
          <div className="p-10 text-center">
            <div
              className={`w-10 h-10 mx-auto rounded-full border-4 animate-spin ${
                darkMode
                  ? "border-slate-700 border-t-purple-400"
                  : "border-slate-200 border-t-purple-500"
              }`}
            />

            <p
              className={`text-sm font-semibold mt-4 ${
                darkMode ? "text-slate-300" : "text-slate-600"
              }`}
            >
              Loading notifications...
            </p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-10 text-center">
            <div
              className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center text-3xl mb-4 ${
                darkMode ? "bg-slate-800" : "bg-slate-100"
              }`}
            >
              🔔
            </div>

            <p
              className={`text-sm font-semibold ${
                darkMode ? "text-slate-200" : "text-slate-700"
              }`}
            >
              No notifications yet.
            </p>

            <p className={`text-xs mt-1 ${secondaryText}`}>
              You will see important company updates here.
            </p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-10 text-center">
            <div
              className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center text-3xl mb-4 ${
                darkMode ? "bg-slate-800" : "bg-slate-100"
              }`}
            >
              🔎
            </div>

            <p
              className={`text-sm font-semibold ${
                darkMode ? "text-slate-200" : "text-slate-700"
              }`}
            >
              No matching notifications.
            </p>

            <p className={`text-xs mt-1 ${secondaryText}`}>
              Try changing your search or filters.
            </p>

            <button
              type="button"
              onClick={clearFilters}
              className={`mt-4 text-xs font-bold ${
                darkMode
                  ? "text-purple-400 hover:text-purple-300"
                  : "text-purple-600 hover:text-purple-700"
              }`}
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            {/* =================================================
                NOTIFICATION ITEMS
            ================================================= */}

            <div
              className={`divide-y ${
                darkMode ? "divide-slate-700" : "divide-slate-200"
              }`}
            >
              {displayedNotifications.map((notification) => {
                const isUnread = !notification.readAt;

                const action = getCompanyNotificationAction(notification);

                return (
                  <div
                    key={notification.id}
                    className={`p-5 transition-colors ${
                      isUnread
                        ? darkMode
                          ? "bg-purple-950/20"
                          : "bg-purple-50/40"
                        : darkMode
                        ? "bg-slate-900"
                        : "bg-white"
                    }`}
                  >
                    {/* =======================================
                          MAIN ROW
                      ======================================= */}

                    <div className="flex items-start gap-4">
                      {/* UNREAD INDICATOR */}

                      <div className="pt-1.5 flex-shrink-0">
                        <span
                          className={`block w-2.5 h-2.5 rounded-full ${
                            isUnread
                              ? "bg-purple-500"
                              : darkMode
                              ? "bg-slate-600"
                              : "bg-slate-300"
                          }`}
                        />
                      </div>

                      {/* NOTIFICATION CONTENT */}

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col gap-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2
                              className={`text-sm font-bold ${
                                isUnread
                                  ? darkMode
                                    ? "text-white"
                                    : "text-slate-900"
                                  : darkMode
                                  ? "text-slate-300"
                                  : "text-slate-600"
                              }`}
                            >
                              {notification.title}
                            </h2>

                            {/* TYPE BADGE */}

                            <span
                              className={`px-2 py-0.5 rounded-md text-[9px] uppercase tracking-wide font-bold ${
                                darkMode
                                  ? "bg-slate-800 text-slate-400"
                                  : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {getNotificationType(notification)}
                            </span>
                          </div>

                          {/* MESSAGE */}

                          <p
                            className={`text-xs leading-relaxed mt-1 ${
                              darkMode ? "text-slate-400" : "text-slate-500"
                            }`}
                          >
                            {notification.message}
                          </p>

                          {/* METADATA */}

                          <div
                            className={`flex flex-wrap items-center gap-x-3 gap-y-1 mt-3 text-[10px] ${
                              darkMode ? "text-slate-500" : "text-slate-400"
                            }`}
                          >
                            <span>{formatDate(notification.createdAt)}</span>

                            {notification.relatedEntityType && (
                              <>
                                <span>•</span>

                                <span>
                                  {notification.relatedEntityType}

                                  {notification.relatedEntityId
                                    ? `: ${notification.relatedEntityId}`
                                    : ""}
                                </span>
                              </>
                            )}

                            <span>•</span>

                            <span
                              className={
                                isUnread ? "text-purple-500 font-semibold" : ""
                              }
                            >
                              {isUnread ? "Unread" : "Read"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* =======================================
                            CONTROLS — RIGHT SIDE
                        ======================================= */}

                      <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 flex-shrink-0">
                        {/* OPEN */}

                        {action.path && (
                          <button
                            type="button"
                            onClick={() => openNotification(notification)}
                            className={`px-3 py-2 rounded-lg text-xs font-bold transition ${
                              darkMode
                                ? "bg-white text-slate-900 hover:bg-slate-200"
                                : "bg-slate-900 text-white hover:bg-slate-700"
                            }`}
                          >
                            {action.label}
                          </button>
                        )}

                        {/* READ / UNREAD */}

                        <button
                          type="button"
                          onClick={() => toggleReadStatus(notification)}
                          disabled={actionLoading}
                          className={`px-3 py-2 rounded-lg text-xs font-semibold border transition ${
                            actionLoading ? "opacity-50 cursor-not-allowed" : ""
                          } ${
                            darkMode
                              ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                              : "border-slate-200 text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          {isUnread ? "Mark Read" : "Mark Unread"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* =================================================
                DISPLAY FOOTER
            ================================================= */}

            <div
              className={`px-5 py-3 border-t text-xs ${
                darkMode
                  ? "border-slate-700 text-slate-500"
                  : "border-slate-200 text-slate-400"
              }`}
            >
              Showing{" "}
              <span className="font-semibold">
                {displayedNotifications.length}
              </span>{" "}
              notification
              {displayedNotifications.length !== 1 ? "s" : ""}{" "}
              {filteredNotifications.length > displayedNotifications.length
                ? `of ${filteredNotifications.length}`
                : ""}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
