import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";

// =========================================================
// DEMO ADMIN NOTIFICATIONS
// =========================================================

const initialNotifications = [
  {
    id: 1,
    type: "account-request",
    category: "Account Requests",
    title: "New Student Account Request",
    message:
      "A new student account has been submitted and is waiting for administrator review.",
    recipient: "Administrator",
    time: "10 minutes ago",
    unread: true,
    icon: "🎓",
  },
  {
    id: 2,
    type: "account-request",
    category: "Account Requests",
    title: "New Registrar Account Request",
    message:
      "A new registrar account request is waiting for administrator review.",
    recipient: "Administrator",
    time: "35 minutes ago",
    unread: true,
    icon: "👨‍💼",
  },
  {
    id: 3,
    type: "company-registration",
    category: "Account Requests",
    title: "New Company Registration",
    message:
      "A company has submitted a registration request and is waiting for approval.",
    recipient: "Administrator",
    time: "1 hour ago",
    unread: true,
    icon: "🏢",
  },
  {
    id: 4,
    type: "system",
    category: "System",
    title: "System Update",
    message: "The internship management system has been successfully updated.",
    recipient: "Administrator",
    time: "Yesterday",
    unread: false,
    icon: "⚙️",
  },
  {
    id: 5,
    type: "system",
    category: "System",
    title: "Document Management Update",
    message:
      "The document management module is now available to administrators.",
    recipient: "Administrator",
    time: "2 days ago",
    unread: false,
    icon: "📄",
  },
];

// =========================================================
// COMPONENT
// =========================================================

const SystemNotification = () => {
  const { darkMode } = useOutletContext() || {};

  // =========================================================
  // TABS
  // =========================================================

  const [activeTab, setActiveTab] = useState("notifications");

  // =========================================================
  // NOTIFICATIONS
  // =========================================================

  const [notifications, setNotifications] = useState(initialNotifications);

  const [notificationFilter, setNotificationFilter] = useState("All");

  // =========================================================
  // SEND NOTIFICATION FORM
  // =========================================================

  const [recipient, setRecipient] = useState("all");

  const [subject, setSubject] = useState("");

  const [message, setMessage] = useState("");

  const [sentNotifications, setSentNotifications] = useState([]);

  const [sendSuccess, setSendSuccess] = useState(false);

  // =========================================================
  // FILTERED NOTIFICATIONS
  // =========================================================

  const filteredNotifications = notifications.filter((notification) => {
    if (notificationFilter === "All") {
      return true;
    }

    if (notificationFilter === "Account Requests") {
      return notification.category === "Account Requests";
    }

    if (notificationFilter === "System") {
      return notification.category === "System";
    }

    return true;
  });

  // =========================================================
  // UNREAD COUNT
  // =========================================================

  const unreadCount = notifications.filter(
    (notification) => notification.unread
  ).length;

  // =========================================================
  // MARK AS READ
  // =========================================================

  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id
          ? { ...notification, unread: false }
          : notification
      )
    );
  };

  // =========================================================
  // MARK ALL AS READ
  // =========================================================

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((notification) => ({
        ...notification,
        unread: false,
      }))
    );
  };

  // =========================================================
  // CLEAR READ NOTIFICATIONS
  // =========================================================

  const clearReadNotifications = () => {
    setNotifications((prev) =>
      prev.filter((notification) => notification.unread)
    );
  };

  // =========================================================
  // SEND NOTIFICATION
  // =========================================================

  const handleSendNotification = (event) => {
    event.preventDefault();

    if (!subject.trim() || !message.trim()) {
      return;
    }

    const recipientLabels = {
      all: "All Users",
      students: "All Students",
      registrars: "All Registrars",
      companies: "All Companies",
    };

    const newNotification = {
      id: Date.now(),
      recipient: recipientLabels[recipient],
      subject: subject.trim(),
      message: message.trim(),
      time: "Just now",
    };

    setSentNotifications((prev) => [newNotification, ...prev]);

    setSubject("");
    setMessage("");
    setRecipient("all");

    setSendSuccess(true);

    setTimeout(() => {
      setSendSuccess(false);
    }, 3500);
  };

  // =========================================================
  // RECIPIENT LABEL
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
      <div className="max-w-7xl mx-auto">
        {/* =================================================
            PAGE HEADER
        ================================================= */}

        <div className="mb-6">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
            <div>
              <p
                className={`text-xs font-semibold uppercase tracking-wider ${
                  darkMode ? "text-blue-400" : "text-blue-600"
                }`}
              >
                Administration
              </p>

              <h1 className="text-2xl sm:text-3xl font-bold mt-1">
                System Notifications
              </h1>

              <p
                className={`text-sm mt-2 max-w-2xl ${
                  darkMode ? "text-slate-400" : "text-slate-500"
                }`}
              >
                Monitor administrator alerts and send important announcements to
                system users.
              </p>
            </div>

            {/* UNREAD SUMMARY */}

            <div
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
                darkMode
                  ? "bg-slate-900 border-slate-700"
                  : "bg-white border-slate-200"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
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
                  className={`text-[11px] mt-1 ${
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
          className={`rounded-xl border p-1.5 flex flex-col sm:flex-row gap-1 mb-6 ${
            darkMode
              ? "bg-slate-900 border-slate-700"
              : "bg-white border-slate-200"
          }`}
        >
          {/* NOTIFICATIONS TAB */}

          <button
            type="button"
            onClick={() => setActiveTab("notifications")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold transition ${
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
              <span
                className={`min-w-5 h-5 px-1 rounded-full text-[10px] flex items-center justify-center ${
                  activeTab === "notifications"
                    ? "bg-red-500 text-white"
                    : "bg-red-500 text-white"
                }`}
              >
                {unreadCount}
              </span>
            )}
          </button>

          {/* SEND NOTIFICATION TAB */}

          <button
            type="button"
            onClick={() => setActiveTab("send")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold transition ${
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
            {/* FILTER + ACTIONS */}

            <div
              className={`rounded-xl border p-4 ${
                darkMode
                  ? "bg-slate-900 border-slate-700"
                  : "bg-white border-slate-200"
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                {/* FILTERS */}

                <div>
                  <p className="text-xs font-bold mb-2">Notification Type</p>

                  <div className="flex flex-wrap gap-2">
                    {["All", "Account Requests", "System"].map((filter) => (
                      <button
                        key={filter}
                        type="button"
                        onClick={() => setNotificationFilter(filter)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                          notificationFilter === filter
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

                {/* ACTIONS */}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    disabled={unreadCount === 0}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold transition ${
                      unreadCount === 0
                        ? darkMode
                          ? "bg-slate-800 text-slate-600 cursor-not-allowed"
                          : "bg-slate-100 text-slate-400 cursor-not-allowed"
                        : darkMode
                        ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    Mark All as Read
                  </button>

                  <button
                    type="button"
                    onClick={clearReadNotifications}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold transition ${
                      darkMode
                        ? "text-red-400 hover:bg-red-950"
                        : "text-red-600 hover:bg-red-50"
                    }`}
                  >
                    Clear Read
                  </button>
                </div>
              </div>
            </div>

            {/* NOTIFICATION LIST */}

            <div className="space-y-3">
              {filteredNotifications.length > 0 ? (
                filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`rounded-xl border p-4 sm:p-5 transition ${
                      notification.unread
                        ? darkMode
                          ? "bg-slate-900 border-blue-800"
                          : "bg-white border-blue-200"
                        : darkMode
                        ? "bg-slate-900 border-slate-700"
                        : "bg-white border-slate-200"
                    }`}
                  >
                    <div className="flex gap-4">
                      {/* ICON */}

                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${
                          notification.type === "account-request"
                            ? darkMode
                              ? "bg-blue-950 text-blue-300"
                              : "bg-blue-100 text-blue-700"
                            : notification.type === "company-registration"
                            ? darkMode
                              ? "bg-emerald-950 text-emerald-300"
                              : "bg-emerald-100 text-emerald-700"
                            : darkMode
                            ? "bg-slate-800"
                            : "bg-slate-100"
                        }`}
                      >
                        {notification.icon}
                      </div>

                      {/* CONTENT */}

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-bold">
                                {notification.title}
                              </h3>

                              {notification.unread && (
                                <span className="w-2 h-2 bg-blue-500 rounded-full" />
                              )}
                            </div>

                            <p
                              className={`text-[11px] mt-1 ${
                                darkMode ? "text-slate-500" : "text-slate-400"
                              }`}
                            >
                              {notification.time}
                            </p>
                          </div>

                          <span
                            className={`self-start px-2 py-1 rounded-full text-[10px] font-semibold ${
                              notification.category === "Account Requests"
                                ? darkMode
                                  ? "bg-blue-950 text-blue-300"
                                  : "bg-blue-100 text-blue-700"
                                : darkMode
                                ? "bg-slate-800 text-slate-400"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {notification.category}
                          </span>
                        </div>

                        <p
                          className={`text-sm leading-relaxed mt-3 ${
                            darkMode ? "text-slate-300" : "text-slate-600"
                          }`}
                        >
                          {notification.message}
                        </p>

                        <div className="flex flex-wrap items-center gap-3 mt-4">
                          <span
                            className={`text-[11px] ${
                              darkMode ? "text-slate-500" : "text-slate-400"
                            }`}
                          >
                            Recipient:{" "}
                            <span className="font-semibold">
                              {notification.recipient}
                            </span>
                          </span>

                          {notification.unread && (
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
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div
                  className={`rounded-xl border p-12 text-center ${
                    darkMode
                      ? "bg-slate-900 border-slate-700"
                      : "bg-white border-slate-200"
                  }`}
                >
                  <div className="text-4xl mb-3">🔕</div>

                  <h3 className="font-bold text-sm">No notifications found</h3>

                  <p
                    className={`text-xs mt-1 ${
                      darkMode ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    There are no notifications in this category.
                  </p>
                </div>
              )}
            </div>

            {/* INFORMATION BOX */}

            <div
              className={`rounded-xl border p-4 ${
                darkMode
                  ? "bg-blue-950/30 border-blue-900 text-blue-300"
                  : "bg-blue-50 border-blue-200 text-blue-700"
              }`}
            >
              <div className="flex gap-3">
                <span className="text-lg">💡</span>

                <div>
                  <p className="text-xs font-bold">
                    Administrator Notifications
                  </p>

                  <p className="text-[11px] mt-1 leading-relaxed">
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
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            {/* SEND FORM */}

            <div
              className={`xl:col-span-2 rounded-xl border p-5 sm:p-6 ${
                darkMode
                  ? "bg-slate-900 border-slate-700"
                  : "bg-white border-slate-200"
              }`}
            >
              <div className="mb-6">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      darkMode
                        ? "bg-blue-950 text-blue-300"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    📢
                  </div>

                  <div>
                    <h2 className="font-bold text-base">
                      Send System Notification
                    </h2>

                    <p
                      className={`text-xs mt-0.5 ${
                        darkMode ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
                      Send an announcement to selected users.
                    </p>
                  </div>
                </div>
              </div>

              {sendSuccess && (
                <div
                  className={`mb-5 rounded-lg border px-4 py-3 text-xs ${
                    darkMode
                      ? "bg-emerald-950/40 border-emerald-900 text-emerald-300"
                      : "bg-emerald-50 border-emerald-200 text-emerald-700"
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

              <form onSubmit={handleSendNotification} className="space-y-5">
                {/* RECIPIENT */}

                <div>
                  <label className="block text-xs font-bold mb-2">
                    Send To
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                        className={`text-left rounded-xl border p-4 transition ${
                          recipient === option.value
                            ? darkMode
                              ? "bg-blue-950/40 border-blue-600"
                              : "bg-blue-50 border-blue-500"
                            : darkMode
                            ? "bg-slate-800 border-slate-700 hover:border-slate-600"
                            : "bg-slate-50 border-slate-200 hover:border-slate-300"
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
                              className={`text-[10px] mt-1 ${
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
                    className={`text-[11px] mt-2 ${
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
                    className="block text-xs font-bold mb-2"
                  >
                    Notification Title
                  </label>

                  <input
                    id="notification-subject"
                    type="text"
                    value={subject}
                    onChange={(event) => setSubject(event.target.value)}
                    placeholder="Enter notification title"
                    maxLength={100}
                    className={`w-full px-3 py-3 rounded-lg border text-sm outline-none transition ${
                      darkMode
                        ? "bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
                        : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500"
                    }`}
                  />

                  <p
                    className={`text-[10px] text-right mt-1 ${
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
                    className="block text-xs font-bold mb-2"
                  >
                    Message
                  </label>

                  <textarea
                    id="notification-message"
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder="Write your notification message..."
                    rows={7}
                    maxLength={1000}
                    className={`w-full px-3 py-3 rounded-lg border text-sm outline-none resize-y transition ${
                      darkMode
                        ? "bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
                        : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500"
                    }`}
                  />

                  <p
                    className={`text-[10px] text-right mt-1 ${
                      darkMode ? "text-slate-500" : "text-slate-400"
                    }`}
                  >
                    {message.length}/1000
                  </p>
                </div>

                {/* SEND */}

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
                  <p
                    className={`text-[11px] ${
                      darkMode ? "text-slate-500" : "text-slate-400"
                    }`}
                  >
                    ⚠️ Demo only — no real notification will be delivered yet.
                  </p>

                  <button
                    type="submit"
                    disabled={!subject.trim() || !message.trim()}
                    className={`px-5 py-2.5 rounded-lg text-xs font-bold transition ${
                      !subject.trim() || !message.trim()
                        ? darkMode
                          ? "bg-slate-800 text-slate-600 cursor-not-allowed"
                          : "bg-slate-100 text-slate-400 cursor-not-allowed"
                        : darkMode
                        ? "bg-white text-slate-900 hover:bg-slate-200"
                        : "bg-slate-800 text-white hover:bg-slate-700"
                    }`}
                  >
                    📢 Send Notification
                  </button>
                </div>
              </form>
            </div>

            {/* SENT HISTORY */}

            <div
              className={`rounded-xl border p-5 ${
                darkMode
                  ? "bg-slate-900 border-slate-700"
                  : "bg-white border-slate-200"
              }`}
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="font-bold text-sm">Sent Notifications</h2>

                  <p
                    className={`text-[11px] mt-1 ${
                      darkMode ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    Recent announcements
                  </p>
                </div>

                <span
                  className={`text-[10px] px-2 py-1 rounded-full ${
                    darkMode
                      ? "bg-slate-800 text-slate-400"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {sentNotifications.length}
                </span>
              </div>

              {sentNotifications.length > 0 ? (
                <div className="space-y-3">
                  {sentNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`rounded-lg border p-3 ${
                        darkMode
                          ? "bg-slate-800 border-slate-700"
                          : "bg-slate-50 border-slate-200"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-bold">
                          {notification.subject}
                        </p>

                        <span
                          className={`text-[9px] whitespace-nowrap ${
                            darkMode ? "text-slate-500" : "text-slate-400"
                          }`}
                        >
                          {notification.time}
                        </span>
                      </div>

                      <p
                        className={`text-[10px] mt-1 ${
                          darkMode ? "text-blue-400" : "text-blue-600"
                        }`}
                      >
                        To: {notification.recipient}
                      </p>

                      <p
                        className={`text-[11px] mt-2 line-clamp-3 ${
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
                  <div className="text-2xl mb-2">📭</div>

                  <p className="text-xs font-semibold">No sent notifications</p>

                  <p
                    className={`text-[10px] mt-1 ${
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
