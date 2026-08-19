import React, { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";

// Temporary page-local demo data. This page intentionally has no mockStore dependency.
const localState = {
  "users": [
    {
      "id": "USR-001",
      "role": "student",
      "email": "student@gmail.com",
      "password": "password",
      "status": "Active",
      "profileId": "STU-001"
    },
    {
      "id": "USR-002",
      "role": "registrar",
      "email": "registrar@gmail.com",
      "password": "password",
      "status": "Active",
      "profileId": "FAC-001"
    },
    {
      "id": "USR-003",
      "role": "company",
      "email": "company@gmail.com",
      "password": "password",
      "status": "Active",
      "profileId": "SUP-001"
    },
    {
      "id": "USR-004",
      "role": "admin",
      "email": "admin@sims.local",
      "password": "password",
      "status": "Active",
      "profileId": "ADM-001"
    }
  ],
  "notifications": []
};
const STATUS = {
  "user": {
    "ACTIVE": "Active",
    "INACTIVE": "Inactive",
    "PENDING": "Pending"
  },
  "company": {
    "PENDING": "Pending",
    "VERIFIED": "Verified",
    "ACTIVE": "Active",
    "INACTIVE": "Inactive"
  },
  "opportunity": {
    "DRAFT": "Draft",
    "ACTIVE": "Active",
    "CLOSED": "Closed"
  },
  "application": {
    "DRAFT": "Draft",
    "SUBMITTED": "Submitted",
    "UNDER_REVIEW": "Under Review",
    "INFO_REQUESTED": "Information Requested",
    "APPROVED": "Approved",
    "REJECTED": "Rejected",
    "WITHDRAWN": "Withdrawn"
  },
  "assignment": {
    "PENDING": "Pending",
    "ACTIVE": "Active",
    "COMPLETED": "Completed",
    "SUSPENDED": "Suspended",
    "TERMINATED": "Terminated"
  },
  "document": {
    "NOT_SUBMITTED": "Not Submitted",
    "SUBMITTED": "Submitted",
    "PENDING_REVIEW": "Pending Review",
    "APPROVED": "Approved",
    "NEEDS_REVISION": "Needs Revision"
  },
  "evaluation": {
    "DRAFT": "Draft",
    "SUBMITTED": "Submitted",
    "RETURNED": "Returned",
    "FINALIZED": "Finalized"
  }
};

const TARGET_PORTALS = [
  {
    value: "Student Portal",
    label: "Student Portal",
    description: "All active students",
    role: "student",
  },
  {
    value: "Registrar Portal",
    label: "Registrar Portal",
    description: "All active registrars",
    role: "registrar",
  },
  {
    value: "Company Portal",
    label: "Company Portal",
    description: "All active company supervisors",
    role: "company",
  },
  {
    value: "All Portals",
    label: "All Portals",
    description: "Students, registrar, and companies",
    role: "all",
  },
];

const NOTIFICATION_TYPES = [
  {
    value: "announcement",
    label: "Announcement",
  },
  {
    value: "reminder",
    label: "Reminder",
  },
  {
    value: "system_update",
    label: "System Update",
  },
  {
    value: "internship_update",
    label: "Internship Update",
  },
  {
    value: "document_notice",
    label: "Document Notice",
  },
  {
    value: "evaluation_notice",
    label: "Evaluation Notice",
  },
];

const SystemNotification = () => {
  const { darkMode } = useOutletContext();

  const state = localState;
  const broadcastNotification = (...args) => { void args; };

  /* =========================================================
     FORM STATE
  ========================================================= */

  const [targetPortal, setTargetPortal] = useState("Student Portal");

  const [notificationType, setNotificationType] = useState("announcement");

  const [subject, setSubject] = useState("");

  const [message, setMessage] = useState("");

  /* =========================================================
     UI STATE
  ========================================================= */

  const [showPreview, setShowPreview] = useState(false);

  const [feedback, setFeedback] = useState(null);

  /* =========================================================
     TARGET COUNTS
  ========================================================= */

  const recipientCount = useMemo(() => {
    const activeUsers = state.users.filter(
      (user) => user.status === STATUS.user.ACTIVE
    );

    switch (targetPortal) {
      case "Student Portal":
        return activeUsers.filter((user) => user.role === "student").length;

      case "Registrar Portal":
        return activeUsers.filter((user) => user.role === "registrar").length;

      case "Company Portal":
        return activeUsers.filter((user) => user.role === "company").length;

      case "All Portals":
        return activeUsers.filter((user) =>
          ["student", "registrar", "company"].includes(user.role)
        ).length;

      default:
        return 0;
    }
  }, [state.users, targetPortal]);

  /* =========================================================
     SYSTEM NOTIFICATION HISTORY
  ========================================================= */

  const notificationHistory = useMemo(() => {
    const systemNotifications = state.notifications.filter(
      (notification) => notification.relatedEntityType === "SystemNotification"
    );

    /*
      A broadcast creates one notification per recipient.

      Group them together so the Admin sees one broadcast
      instead of seeing the same message 50 times.
    */

    const grouped = {};

    systemNotifications.forEach((notification) => {
      const key = notification.relatedEntityId || notification.id;

      if (!grouped[key]) {
        grouped[key] = {
          id: key,
          type: notification.type,
          subject: notification.title,
          message: notification.message,
          createdAt: notification.createdAt,
          recipientCount: 0,
          readCount: 0,
        };
      }

      grouped[key].recipientCount += 1;

      if (notification.readAt) {
        grouped[key].readCount += 1;
      }
    });

    return Object.values(grouped).sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
  }, [state.notifications]);

  /* =========================================================
     HELPERS
  ========================================================= */

  const getTypeLabel = (type) => {
    const found = NOTIFICATION_TYPES.find((item) => item.value === type);

    return (
      found?.label ||
      type
        ?.replaceAll("_", " ")
        .replace(/\b\w/g, (char) => char.toUpperCase()) ||
      "Announcement"
    );
  };

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleString("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const showFeedback = (type, message) => {
    setFeedback({
      type,
      message,
    });

    window.setTimeout(() => {
      setFeedback(null);
    }, 3500);
  };

  /* =========================================================
     VALIDATION
  ========================================================= */

  const validateForm = () => {
    if (!subject.trim()) {
      showFeedback("error", "Please enter a notification subject.");

      return false;
    }

    if (!message.trim()) {
      showFeedback("error", "Please enter a notification message.");

      return false;
    }

    if (recipientCount === 0) {
      showFeedback(
        "error",
        "There are no active users in the selected portal."
      );

      return false;
    }

    return true;
  };

  /* =========================================================
     PREVIEW
  ========================================================= */

  const handlePreview = () => {
    if (!subject.trim() || !message.trim()) {
      showFeedback("error", "Enter a subject and message before previewing.");

      return;
    }

    setShowPreview(true);
  };

  /* =========================================================
     SEND
  ========================================================= */

  const handleSend = () => {
    if (!validateForm()) return;

    const result = broadcastNotification({
      targetPortal,
      notificationType,
      subject,
      message,
    });

    if (!result?.ok) {
      showFeedback("error", result?.message || "Unable to send notification.");

      return;
    }

    showFeedback("success", result.message);

    setSubject("");
    setMessage("");
    setShowPreview(false);
  };

  /* =========================================================
     CLEAR FORM
  ========================================================= */

  const handleClear = () => {
    setSubject("");
    setMessage("");
    setNotificationType("announcement");
    setTargetPortal("Student Portal");
    setShowPreview(false);
    setFeedback(null);
  };

  /* =========================================================
     STYLES
  ========================================================= */

  const cardClass = darkMode
    ? "bg-slate-900 border-slate-700"
    : "bg-white border-slate-200";

  const inputClass = darkMode
    ? "bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-slate-500"
    : "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-slate-500";

  /* =========================================================
     RETURN
  ========================================================= */

  return (
    <div
      className={`min-h-[calc(100vh-5rem)] px-4 py-6 sm:px-6 lg:px-8 transition-colors duration-300 ${
        darkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"
      }`}
    >
      <div className="max-w-[1200px] mx-auto">
        {/* ===================================================
            HEADER
        =================================================== */}

        <div className="mb-6">
          <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-slate-400">
            Administrator Portal
          </p>

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mt-1">
            <div>
              <h1 className="text-2xl font-black tracking-tight">
                System Notifications
              </h1>

              <p
                className={`text-xs mt-1 ${
                  darkMode ? "text-slate-400" : "text-slate-500"
                }`}
              >
                Send announcements and important system updates across the
                internship management portals.
              </p>
            </div>

            {/* ACTIVE USERS */}

            <div
              className={`border rounded-xl px-4 py-3 ${
                darkMode
                  ? "bg-slate-900 border-slate-700"
                  : "bg-white border-slate-200"
              }`}
            >
              <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">
                Active Users
              </p>

              <p className="text-xl font-black mt-0.5">
                {
                  state.users.filter(
                    (user) =>
                      user.status === STATUS.user.ACTIVE &&
                      user.role !== "admin"
                  ).length
                }
              </p>
            </div>
          </div>
        </div>

        {/* ===================================================
            DEMO NOTICE
        =================================================== */}

        <div
          className={`mb-5 border rounded-xl px-4 py-3 ${
            darkMode
              ? "bg-amber-950/30 border-amber-900/60 text-amber-300"
              : "bg-amber-50 border-amber-200 text-amber-800"
          }`}
        >
          <div className="flex items-start gap-3">
            <span className="text-sm">⚠️</span>

            <div>
              <p className="text-[10px] font-bold">Demo Project</p>

              <p className="text-[10px] mt-0.5 leading-relaxed opacity-80">
                Notifications are stored in the shared frontend mock store. No
                real email, SMS, or external notification service is connected.
              </p>
            </div>
          </div>
        </div>

        {/* ===================================================
            BROADCAST CARD
        =================================================== */}

        <section className={`border rounded-2xl overflow-hidden ${cardClass}`}>
          {/* SECTION HEADER */}

          <div
            className={`px-5 py-4 border-b ${
              darkMode ? "border-slate-700" : "border-slate-200"
            }`}
          >
            <h2 className="text-sm font-bold">Broadcast Notification</h2>

            <p
              className={`text-[10px] mt-1 ${
                darkMode ? "text-slate-400" : "text-slate-500"
              }`}
            >
              Compose a message and select which portal should receive it.
            </p>
          </div>

          <div className="p-5">
            {/* =================================================
                TARGET PORTAL
            ================================================= */}

            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] font-bold uppercase tracking-wide">
                  Target Portal
                </label>

                <span
                  className={`text-[9px] ${
                    darkMode ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  {recipientCount} active{" "}
                  {recipientCount === 1 ? "recipient" : "recipients"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {TARGET_PORTALS.map((portal) => {
                  const active = targetPortal === portal.value;

                  return (
                    <button
                      key={portal.value}
                      type="button"
                      onClick={() => setTargetPortal(portal.value)}
                      className={`text-left border rounded-xl p-3 transition ${
                        active
                          ? darkMode
                            ? "bg-slate-700 border-slate-400"
                            : "bg-slate-100 border-slate-500"
                          : darkMode
                          ? "bg-slate-800/50 border-slate-700 hover:bg-slate-800"
                          : "bg-white border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold">
                          {portal.label}
                        </span>

                        <span
                          className={`w-2 h-2 rounded-full ${
                            active
                              ? "bg-emerald-500"
                              : darkMode
                              ? "bg-slate-600"
                              : "bg-slate-300"
                          }`}
                        />
                      </div>

                      <p
                        className={`text-[9px] mt-1 ${
                          darkMode ? "text-slate-400" : "text-slate-500"
                        }`}
                      >
                        {portal.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* =================================================
                FORM
            ================================================= */}

            <div className="grid lg:grid-cols-2 gap-5">
              {/* LEFT */}

              <div>
                {/* TYPE */}

                <div className="mb-5">
                  <label
                    htmlFor="notification-type"
                    className="block text-[10px] font-bold mb-2"
                  >
                    Notification Type
                  </label>

                  <select
                    id="notification-type"
                    value={notificationType}
                    onChange={(event) =>
                      setNotificationType(event.target.value)
                    }
                    className={`w-full h-10 border rounded-lg px-3 text-[11px] outline-none transition ${inputClass}`}
                  >
                    {NOTIFICATION_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* SUBJECT */}

                <div className="mb-5">
                  <label
                    htmlFor="notification-subject"
                    className="block text-[10px] font-bold mb-2"
                  >
                    Subject
                  </label>

                  <input
                    id="notification-subject"
                    type="text"
                    value={subject}
                    onChange={(event) => setSubject(event.target.value)}
                    placeholder="Enter notification subject..."
                    maxLength={120}
                    className={`w-full h-10 border rounded-lg px-3 text-[11px] outline-none transition ${inputClass}`}
                  />

                  <p
                    className={`text-[9px] mt-1 text-right ${
                      darkMode ? "text-slate-500" : "text-slate-400"
                    }`}
                  >
                    {subject.length}/120
                  </p>
                </div>

                {/* MESSAGE */}

                <div>
                  <label
                    htmlFor="notification-message"
                    className="block text-[10px] font-bold mb-2"
                  >
                    Message
                  </label>

                  <textarea
                    id="notification-message"
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder="Write your notification message..."
                    rows={8}
                    maxLength={1000}
                    className={`w-full border rounded-lg px-3 py-2.5 text-[11px] outline-none resize-y transition ${inputClass}`}
                  />

                  <p
                    className={`text-[9px] mt-1 text-right ${
                      darkMode ? "text-slate-500" : "text-slate-400"
                    }`}
                  >
                    {message.length}/1000
                  </p>
                </div>
              </div>

              {/* RIGHT — PREVIEW */}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] font-bold">Preview</label>

                  <span
                    className={`text-[9px] ${
                      darkMode ? "text-slate-500" : "text-slate-400"
                    }`}
                  >
                    Recipient view
                  </span>
                </div>

                <div
                  className={`border rounded-xl min-h-[260px] overflow-hidden ${
                    darkMode
                      ? "bg-slate-800 border-slate-700"
                      : "bg-slate-50 border-slate-200"
                  }`}
                >
                  {/* PREVIEW HEADER */}

                  <div
                    className={`px-4 py-3 border-b ${
                      darkMode ? "border-slate-700" : "border-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
                        {getTypeLabel(notificationType)}
                      </span>

                      <span className="text-[9px] text-slate-400">Now</span>
                    </div>
                  </div>

                  {/* PREVIEW BODY */}

                  <div className="p-4">
                    <p className="text-sm font-bold">
                      {subject.trim() || "Notification subject"}
                    </p>

                    <p
                      className={`text-[10px] mt-3 leading-relaxed whitespace-pre-wrap ${
                        darkMode ? "text-slate-300" : "text-slate-600"
                      }`}
                    >
                      {message.trim() ||
                        "Your notification message will appear here."}
                    </p>
                  </div>

                  {/* PREVIEW FOOTER */}

                  <div
                    className={`px-4 py-3 border-t ${
                      darkMode ? "border-slate-700" : "border-slate-200"
                    }`}
                  >
                    <p
                      className={`text-[9px] ${
                        darkMode ? "text-slate-500" : "text-slate-400"
                      }`}
                    >
                      Sent to:{" "}
                      <span className="font-semibold">{targetPortal}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* =================================================
                FEEDBACK
            ================================================= */}

            {feedback && (
              <div
                className={`mt-5 border rounded-lg px-4 py-3 text-[10px] ${
                  feedback.type === "success"
                    ? darkMode
                      ? "bg-emerald-950/40 border-emerald-800 text-emerald-300"
                      : "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : darkMode
                    ? "bg-red-950/40 border-red-800 text-red-300"
                    : "bg-red-50 border-red-200 text-red-700"
                }`}
              >
                {feedback.message}
              </div>
            )}

            {/* =================================================
                ACTIONS
            ================================================= */}

            <div
              className={`flex flex-wrap items-center justify-between gap-3 mt-5 pt-5 border-t ${
                darkMode ? "border-slate-700" : "border-slate-200"
              }`}
            >
              <button
                type="button"
                onClick={handleClear}
                className={`h-9 px-4 border rounded-lg text-[10px] font-semibold transition ${
                  darkMode
                    ? "border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                    : "border-slate-300 text-slate-600 hover:bg-slate-50"
                }`}
              >
                Clear
              </button>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handlePreview}
                  className={`h-9 px-5 border rounded-lg text-[10px] font-semibold transition ${
                    darkMode
                      ? "bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700"
                      : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  Preview
                </button>

                <button
                  type="button"
                  onClick={handleSend}
                  className="h-9 px-6 rounded-lg text-[10px] font-bold bg-slate-900 text-white hover:bg-slate-800 transition"
                >
                  Send Notification
                </button>
              </div>
            </div>

            {/* =================================================
                PREVIEW DETAILS
            ================================================= */}

            {showPreview && (
              <div
                className={`mt-5 border rounded-xl p-4 ${
                  darkMode
                    ? "bg-slate-800/60 border-slate-700"
                    : "bg-slate-50 border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[10px] font-bold">
                    Notification Details
                  </h3>

                  <button
                    type="button"
                    onClick={() => setShowPreview(false)}
                    className={`text-lg leading-none ${
                      darkMode
                        ? "text-slate-500 hover:text-slate-200"
                        : "text-slate-400 hover:text-slate-800"
                    }`}
                  >
                    ×
                  </button>
                </div>

                <div className="grid sm:grid-cols-3 gap-3 text-[10px]">
                  <div>
                    <p className="text-slate-400">Target</p>

                    <p className="font-semibold mt-1">{targetPortal}</p>
                  </div>

                  <div>
                    <p className="text-slate-400">Type</p>

                    <p className="font-semibold mt-1">
                      {getTypeLabel(notificationType)}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-400">Recipients</p>

                    <p className="font-semibold mt-1">{recipientCount}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ===================================================
            HISTORY
        =================================================== */}

        <section
          className={`mt-6 border rounded-2xl overflow-hidden ${cardClass}`}
        >
          <div
            className={`px-5 py-4 border-b ${
              darkMode ? "border-slate-700" : "border-slate-200"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold">Notification History</h2>

                <p
                  className={`text-[10px] mt-1 ${
                    darkMode ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  Previously broadcast system notifications.
                </p>
              </div>

              <span
                className={`px-2 py-1 rounded-md text-[9px] font-bold ${
                  darkMode
                    ? "bg-slate-800 text-slate-300"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {notificationHistory.length}{" "}
                {notificationHistory.length === 1 ? "broadcast" : "broadcasts"}
              </span>
            </div>
          </div>

          {/* DESKTOP */}

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-[10px]">
              <thead>
                <tr className={darkMode ? "bg-slate-800/70" : "bg-slate-50"}>
                  <th className="px-5 py-3 text-left font-bold">Subject</th>

                  <th className="px-4 py-3 text-left font-bold">Type</th>

                  <th className="px-4 py-3 text-left font-bold">Recipients</th>

                  <th className="px-4 py-3 text-left font-bold">Read</th>

                  <th className="px-4 py-3 text-left font-bold">Date</th>
                </tr>
              </thead>

              <tbody>
                {notificationHistory.map((item) => (
                  <tr
                    key={item.id}
                    className={`border-t ${
                      darkMode
                        ? "border-slate-800 hover:bg-slate-800/50"
                        : "border-slate-100 hover:bg-slate-50"
                    }`}
                  >
                    <td className="px-5 py-3">
                      <p className="font-semibold">{item.subject}</p>

                      <p
                        className={`text-[9px] mt-1 max-w-md truncate ${
                          darkMode ? "text-slate-500" : "text-slate-400"
                        }`}
                      >
                        {item.message}
                      </p>
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-1 rounded-md text-[9px] font-semibold ${
                          darkMode
                            ? "bg-slate-800 text-slate-300"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {getTypeLabel(item.type)}
                      </span>
                    </td>

                    <td className="px-4 py-3 font-semibold">
                      {item.recipientCount}
                    </td>

                    <td className="px-4 py-3">
                      {item.readCount}/{item.recipientCount}
                    </td>

                    <td
                      className={`px-4 py-3 whitespace-nowrap ${
                        darkMode ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
                      {formatDate(item.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* MOBILE */}

          <div className="md:hidden">
            {notificationHistory.map((item) => (
              <div
                key={item.id}
                className={`p-4 border-b last:border-b-0 ${
                  darkMode ? "border-slate-800" : "border-slate-100"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold">{item.subject}</p>

                    <p
                      className={`text-[9px] mt-1 leading-relaxed ${
                        darkMode ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
                      {item.message}
                    </p>
                  </div>

                  <span
                    className={`flex-shrink-0 px-2 py-1 rounded-md text-[9px] font-semibold ${
                      darkMode
                        ? "bg-slate-800 text-slate-300"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {getTypeLabel(item.type)}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-3 text-[9px]">
                  <div>
                    <p className="text-slate-400">Recipients</p>

                    <p className="font-semibold mt-0.5">
                      {item.recipientCount}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-400">Read</p>

                    <p className="font-semibold mt-0.5">
                      {item.readCount}/{item.recipientCount}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-400">Sent</p>

                    <p className="font-semibold mt-0.5">
                      {formatDate(item.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {notificationHistory.length === 0 && (
              <div
                className={`p-8 text-center text-[10px] ${
                  darkMode ? "text-slate-500" : "text-slate-400"
                }`}
              >
                No system notifications have been sent yet.
              </div>
            )}
          </div>

          {/* EMPTY DESKTOP */}

          {notificationHistory.length === 0 && (
            <div
              className={`hidden md:block p-10 text-center text-[10px] ${
                darkMode ? "text-slate-500" : "text-slate-400"
              }`}
            >
              No system notifications have been sent yet.
            </div>
          )}
        </section>

        {/* ===================================================
            FOOTER INFO
        =================================================== */}

        <div
          className={`mt-4 text-[9px] ${
            darkMode ? "text-slate-600" : "text-slate-400"
          }`}
        >
          System broadcasts are recorded in the shared mock store and included
          in the administrator audit trail.
        </div>
      </div>
    </div>
  );
};

export default SystemNotification;
