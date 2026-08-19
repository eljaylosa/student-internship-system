import React, { useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";

export default function Notification() {
  const { darkMode } = useOutletContext();
  const navigate = useNavigate();

  // =========================================================
  // LOCAL DEMO NOTIFICATIONS
  // Temporary data until the real backend/database is connected.
  // =========================================================

  const [notifications, setNotifications] = useState([
    {
      id: "CNOT-001",
      title: "Internship Application Received",
      message:
        "A new student internship application has been submitted to your company and is awaiting review.",
      relatedEntityType: "InternshipApplication",
      relatedEntityId: "APP-001",
      createdAt: "2026-08-18T08:30:00.000Z",
      readAt: null,
      actionPath: "/company/applications",
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
      actionPath: "/company/documents",
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
      actionPath: "/company/info",
    },
  ]);

  // =========================================================
  // NOTIFICATION COUNTS
  // =========================================================

  const unreadCount = notifications.filter(
    (notification) => !notification.readAt
  ).length;

  // =========================================================
  // MARK AS READ / UNREAD
  // =========================================================

  const toggleReadStatus = (notificationId) => {
    setNotifications((previous) =>
      previous.map((notification) => {
        if (notification.id !== notificationId) {
          return notification;
        }

        return {
          ...notification,
          readAt: notification.readAt ? null : new Date().toISOString(),
        };
      })
    );
  };

  // =========================================================
  // MARK ALL AS READ
  // =========================================================

  const markAllAsRead = () => {
    setNotifications((previous) =>
      previous.map((notification) => ({
        ...notification,
        readAt: notification.readAt || new Date().toISOString(),
      }))
    );
  };

  // =========================================================
  // OPEN RELATED PAGE
  // =========================================================

  const openNotification = (notification) => {
    // Mark as read when opened
    setNotifications((previous) =>
      previous.map((item) =>
        item.id === notification.id
          ? {
              ...item,
              readAt: item.readAt || new Date().toISOString(),
            }
          : item
      )
    );

    if (notification.actionPath) {
      navigate(notification.actionPath);
    }
  };

  // =========================================================
  // FORMAT DATE
  // =========================================================

  const formatDate = (date) => {
    return new Date(date).toLocaleString([], {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  // =========================================================
  // GET NOTIFICATION TYPE LABEL
  // =========================================================

  const getNotificationType = (type) => {
    switch (type) {
      case "InternshipApplication":
        return "Application";

      case "DocumentSubmission":
        return "Document";

      case "InformationItem":
        return "Information";

      default:
        return "Notification";
    }
  };

  // =========================================================
  // STYLES
  // =========================================================

  const pageText = darkMode ? "text-slate-100" : "text-slate-900";

  const card = darkMode
    ? "bg-slate-900 border-slate-700"
    : "bg-white border-slate-200";

  const secondaryText = darkMode ? "text-slate-400" : "text-slate-500";

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
          Stay updated with student applications, documents, evaluations, and
          internship activities.
        </p>
      </div>

      {/* =====================================================
          NOTIFICATION LIST
      ===================================================== */}

      <section
        className={`border rounded-2xl overflow-hidden shadow-sm ${card}`}
      >
        {notifications.length === 0 ? (
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
              You will see important updates here.
            </p>
          </div>
        ) : (
          <div
            className={`divide-y ${
              darkMode ? "divide-slate-700" : "divide-slate-200"
            }`}
          >
            {notifications.map((notification) => {
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
                  {/* MAIN ROW */}

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
                            {getNotificationType(
                              notification.relatedEntityType
                            )}
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

                          <span>•</span>

                          <span>
                            {notification.relatedEntityType}:{" "}
                            {notification.relatedEntityId}
                          </span>

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

                    {/* CONTROLS */}

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
        )}
      </section>
    </div>
  );
}
