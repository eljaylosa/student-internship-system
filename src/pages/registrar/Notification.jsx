import React, { useEffect, useMemo, useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { supabaseRegistrar } from "../../supabaseClient";

export default function Notification() {
  const { darkMode } = useOutletContext();
  const navigate = useNavigate();

  // =========================================================
  // NOTIFICATIONS
  // =========================================================

  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  // =========================================================
  // FILTER / DISPLAY STATE
  // =========================================================

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [readFilter, setReadFilter] = useState("all");
  const [displayLimit, setDisplayLimit] = useState(10);

  // =========================================================
  // NOTIFICATION COUNTS
  // =========================================================

  const unreadCount = notifications.filter(
    (notification) => !notification.readAt
  ).length;

  // =========================================================
  // LOAD NOTIFICATIONS
  // =========================================================

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      // =====================================================
      // GET CURRENT AUTHENTICATED USER
      // =====================================================

      const {
        data: { user },
        error: authError,
      } = await supabaseRegistrar.auth.getUser();

      if (authError) {
        console.error("Notification auth error:", authError);
        setErrorMessage("Unable to verify your account.");
        return;
      }

      if (!user) {
        setNotifications([]);
        return;
      }

      // =====================================================
      // LOAD USER'S NOTIFICATIONS
      // =====================================================

      const { data, error } = await supabaseRegistrar
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
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading notifications:", error);
        setErrorMessage("Unable to load notifications.");
        return;
      }

      // =====================================================
      // MAP DATABASE FIELDS TO UI FIELDS
      // =====================================================

      const mappedNotifications = (data || []).map((notification) => ({
        id: notification.id,
        recipientId: notification.recipient_id,
        recipientRole: notification.recipient_role,
        type: notification.type,
        category: notification.category,
        title: notification.title,
        message: notification.message,
        relatedEntityType: notification.related_entity_type,
        relatedEntityId: notification.related_entity_id,
        actionPath: notification.action_path,
        createdBy: notification.created_by,
        readAt: notification.read_at,
        createdAt: notification.created_at,
      }));

      setNotifications(mappedNotifications);
    } catch (error) {
      console.error("Unexpected notification loading error:", error);
      setErrorMessage("Something went wrong while loading notifications.");
    } finally {
      setIsLoading(false);
    }
  };

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
  // MARK AS READ / UNREAD
  // =========================================================

  const toggleReadStatus = async (notificationId) => {
    const notification = notifications.find(
      (item) => item.id === notificationId
    );

    if (!notification) return;

    const newReadAt = notification.readAt ? null : new Date().toISOString();

    // =====================================================
    // OPTIMISTIC UI UPDATE
    // =====================================================

    setNotifications((previous) =>
      previous.map((item) =>
        item.id === notificationId
          ? {
              ...item,
              readAt: newReadAt,
            }
          : item
      )
    );

    // =====================================================
    // UPDATE DATABASE
    // =====================================================

    const { error } = await supabaseRegistrar
      .from("notifications")
      .update({
        read_at: newReadAt,
      })
      .eq("id", notificationId);

    if (error) {
      console.error("Error updating notification:", error);

      // Revert optimistic update
      setNotifications((previous) =>
        previous.map((item) =>
          item.id === notificationId
            ? {
                ...item,
                readAt: notification.readAt,
              }
            : item
        )
      );
    }
  };

  // =========================================================
  // MARK ALL AS READ
  // =========================================================

  const markAllAsRead = async () => {
    if (unreadCount === 0) return;

    const now = new Date().toISOString();

    // =====================================================
    // OPTIMISTIC UI UPDATE
    // =====================================================

    setNotifications((previous) =>
      previous.map((notification) => ({
        ...notification,
        readAt: notification.readAt || now,
      }))
    );

    // =====================================================
    // GET CURRENT USER
    // =====================================================

    const {
      data: { user },
      error: authError,
    } = await supabaseRegistrar.auth.getUser();

    if (authError || !user) {
      console.error(
        "Unable to verify user while marking notifications as read:",
        authError
      );

      loadNotifications();
      return;
    }

    // =====================================================
    // UPDATE DATABASE
    // =====================================================

    const { error } = await supabaseRegistrar
      .from("notifications")
      .update({
        read_at: now,
      })
      .eq("recipient_id", user.id)
      .is("read_at", null);

    if (error) {
      console.error("Error marking all notifications as read:", error);

      // Restore actual database state
      loadNotifications();
    }
  };

  // =========================================================
  // OPEN RELATED PAGE
  // =========================================================

  const openNotification = async (notification) => {
    // =====================================================
    // MARK AS READ
    // =====================================================

    if (!notification.readAt) {
      const now = new Date().toISOString();

      // Optimistic update
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

      // Database update
      const { error } = await supabaseRegistrar
        .from("notifications")
        .update({
          read_at: now,
        })
        .eq("id", notification.id);

      if (error) {
        console.error("Error marking notification as read:", error);

        // Revert if update failed
        setNotifications((previous) =>
          previous.map((item) =>
            item.id === notification.id
              ? {
                  ...item,
                  readAt: null,
                }
              : item
          )
        );
      }
    }

    // =====================================================
    // NAVIGATE
    // =====================================================

    if (notification.actionPath) {
      navigate(notification.actionPath);
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
    if (notification.category) {
      const category = notification.category.replace(/[_-]+/g, " ").trim();

      if (category) {
        return category;
      }
    }

    switch (notification.relatedEntityType) {
      case "InternshipApplication":
        return "Application";

      case "DocumentSubmission":
        return "Document";

      case "StudentRecord":
        return "Student Record";

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
          Registrar Portal
        </p>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black">Notifications</h1>

            {unreadCount > 0 && (
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                  darkMode
                    ? "bg-blue-950 text-blue-300"
                    : "bg-blue-100 text-blue-700"
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
              className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                darkMode
                  ? "bg-slate-800 text-blue-300 hover:bg-slate-700"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Mark All as Read
            </button>
          )}
        </div>

        <p className={`text-sm mt-2 ${secondaryText}`}>
          Stay updated with student applications, document submissions, records,
          and registrar activities.
        </p>
      </div>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {errorMessage && (
        <div
          className={`mb-5 rounded-xl border px-4 py-3 text-sm ${
            darkMode
              ? "bg-red-950/30 border-red-900 text-red-300"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          {errorMessage}
        </div>
      )}

      {/* =====================================================
          FILTERS
      ===================================================== */}

      {!isLoading && notifications.length > 0 && (
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
                    ? "bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-blue-500"
                    : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500"
                }`}
              />
            </div>

            {/* FILTER SELECTS */}

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
                      ? "text-blue-400 hover:text-blue-300"
                      : "text-blue-600 hover:text-blue-700"
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
        {/* ===================================================
            LOADING
        =================================================== */}

        {isLoading ? (
          <div className="p-10 text-center">
            <div className="mb-3 text-3xl animate-pulse">🔔</div>

            <p
              className={`text-sm font-semibold ${
                darkMode ? "text-slate-200" : "text-slate-700"
              }`}
            >
              Loading notifications...
            </p>

            <p className={`text-xs mt-1 ${secondaryText}`}>
              Please wait while we load your latest updates.
            </p>
          </div>
        ) : errorMessage ? (
          /* =================================================
             ERROR STATE
          ================================================= */

          <div className="p-10 text-center">
            <div
              className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center text-3xl mb-4 ${
                darkMode ? "bg-red-500/10" : "bg-red-50"
              }`}
            >
              ⚠️
            </div>

            <p
              className={`text-sm font-semibold ${
                darkMode ? "text-slate-200" : "text-slate-700"
              }`}
            >
              Unable to load notifications.
            </p>

            <p className={`text-xs mt-1 ${secondaryText}`}>{errorMessage}</p>

            <button
              type="button"
              onClick={loadNotifications}
              className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        ) : notifications.length === 0 ? (
          /* =================================================
             EMPTY STATE
          ================================================= */

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
              You will see important registrar updates here.
            </p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          /* =================================================
             NO FILTER RESULTS
          ================================================= */

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
                  ? "text-blue-400 hover:text-blue-300"
                  : "text-blue-600 hover:text-blue-700"
              }`}
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            <div
              className={`divide-y ${
                darkMode ? "divide-slate-700" : "divide-slate-200"
              }`}
            >
              {displayedNotifications.map((notification) => {
                const isUnread = !notification.readAt;

                return (
                  <div
                    key={notification.id}
                    className={`p-5 transition-colors ${
                      isUnread
                        ? darkMode
                          ? "bg-blue-950/20"
                          : "bg-blue-50/40"
                        : darkMode
                        ? "bg-slate-900"
                        : "bg-white"
                    }`}
                  >
                    {/* =================================================
                        MAIN ROW
                    ================================================= */}

                    <div className="flex items-start gap-4">
                      {/* UNREAD INDICATOR */}

                      <div className="pt-1.5 flex-shrink-0">
                        <span
                          className={`block w-2.5 h-2.5 rounded-full ${
                            isUnread
                              ? "bg-blue-500"
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
                                isUnread ? "text-blue-500 font-semibold" : ""
                              }
                            >
                              {isUnread ? "Unread" : "Read"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* =================================================
                          CONTROLS
                      ================================================= */}

                      <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 flex-shrink-0">
                        {/* OPEN */}

                        {notification.actionPath && (
                          <button
                            type="button"
                            onClick={() => openNotification(notification)}
                            className={`px-3 py-2 rounded-lg text-xs font-bold transition ${
                              darkMode
                                ? "bg-white text-slate-900 hover:bg-slate-200"
                                : "bg-slate-900 text-white hover:bg-slate-700"
                            }`}
                          >
                            Open
                          </button>
                        )}

                        {/* READ / UNREAD */}

                        <button
                          type="button"
                          onClick={() => toggleReadStatus(notification.id)}
                          className={`px-3 py-2 rounded-lg text-xs font-semibold border transition ${
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
