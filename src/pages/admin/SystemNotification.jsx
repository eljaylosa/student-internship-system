import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";

// =========================================================
// NOTIFICATION HISTORY
// =========================================================

const initialHistory = [
  {
    id: 1,
    target: "Student Portal",
    type: "Announcement",
    subject: "Internship Application Reminder",
    message: "Please complete your internship application requirements.",
    date: "Today, 9:30 AM",
    status: "Sent",
  },
  {
    id: 2,
    target: "Company Portal",
    type: "System Update",
    subject: "Company Verification Update",
    message: "Company verification records have been updated.",
    date: "Yesterday, 2:15 PM",
    status: "Sent",
  },
];

// =========================================================
// COMPONENT
// =========================================================

const SystemNotification = () => {
  const { darkMode } = useOutletContext();

  // =========================================================
  // FORM STATE
  // =========================================================

  const [targetPortal, setTargetPortal] = useState("Student Portal");
  const [notificationType, setNotificationType] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  // =========================================================
  // UI STATE
  // =========================================================

  const [history, setHistory] = useState(initialHistory);
  const [showPreview, setShowPreview] = useState(false);
  const [feedback, setFeedback] = useState("");

  // =========================================================
  // TARGET PORTALS
  // =========================================================

  const targetPortals = [
    "Student Portal",
    "Faculty Portal",
    "Company Portal",
    "All Portals",
  ];

  // =========================================================
  // NOTIFICATION TYPES
  // =========================================================

  const notificationTypes = [
    "Announcement",
    "Reminder",
    "System Update",
    "Internship Update",
    "Document Notice",
    "Evaluation Notice",
  ];

  // =========================================================
  // RESET FEEDBACK
  // =========================================================

  const clearFeedback = () => {
    setFeedback("");

    setTimeout(() => {
      setFeedback("");
    }, 3000);
  };

  // =========================================================
  // PREVIEW
  // =========================================================

  const handlePreview = () => {
    if (!subject.trim() || !message.trim()) {
      setFeedback("Please enter a subject and message before previewing.");

      setTimeout(() => {
        setFeedback("");
      }, 3000);

      return;
    }

    setShowPreview(true);
  };

  // =========================================================
  // SEND NOW
  // =========================================================

  const handleSendNow = () => {
    if (!subject.trim() || !message.trim()) {
      setFeedback("Please enter a subject and message before sending.");

      setTimeout(() => {
        setFeedback("");
      }, 3000);

      return;
    }

    const newNotification = {
      id: Date.now(),
      target: targetPortal,
      type: notificationType || "General",
      subject,
      message,
      date: "Just now",
      status: "Sent",
    };

    setHistory((prev) => [newNotification, ...prev]);

    setFeedback("Notification sent successfully.");

    setSubject("");
    setMessage("");
    setNotificationType("");
    setShowPreview(false);

    setTimeout(() => {
      setFeedback("");
    }, 3000);
  };

  // =========================================================
  // SCHEDULE
  // =========================================================

  const handleSchedule = () => {
    if (!subject.trim() || !message.trim()) {
      setFeedback("Please enter a subject and message before scheduling.");

      setTimeout(() => {
        setFeedback("");
      }, 3000);

      return;
    }

    const newNotification = {
      id: Date.now(),
      target: targetPortal,
      type: notificationType || "General",
      subject,
      message,
      date: "Scheduled",
      status: "Scheduled",
    };

    setHistory((prev) => [newNotification, ...prev]);

    setFeedback("Notification scheduled successfully.");

    setSubject("");
    setMessage("");
    setNotificationType("");
    setShowPreview(false);

    setTimeout(() => {
      setFeedback("");
    }, 3000);
  };

  // =========================================================
  // RETURN
  // =========================================================

  return (
    <div
      className={`min-h-[calc(100vh-5rem)] px-4 py-6 sm:px-6 lg:px-8 transition-colors duration-300 ${
        darkMode
          ? "bg-slate-950 text-slate-100"
          : "bg-slate-50 text-slate-900"
      }`}
    >
      <div className="max-w-5xl mx-auto">

        {/* ===================================================
            DEMO NOTICE
        =================================================== */}

        <div
          className={`mb-5 p-3 rounded-lg text-[10px] leading-relaxed border ${
            darkMode
              ? "bg-red-950/40 border-red-900 text-red-300"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          <p className="font-bold mb-1">⚠️ Demo Project</p>

          <p>
            Notifications displayed and sent on this page are dummy data.
          </p>

          <p className="mt-1">
            No actual users or portals will receive notifications.
          </p>
        </div>

        {/* ===================================================
            BROADCAST NOTIFICATIONS
        =================================================== */}

        <section
          className={`border rounded-lg p-4 sm:p-5 lg:p-6 ${
            darkMode
              ? "bg-slate-900 border-slate-700"
              : "bg-white border-slate-400"
          }`}
        >
          {/* =================================================
              TITLE
          ================================================= */}

          <h1 className="text-lg sm:text-xl font-bold mb-6">
            Broadcast Notifications
          </h1>

          {/* =================================================
              TARGET PORTAL
          ================================================= */}

          <div className="mb-5">
            <label className="block text-xs font-bold mb-2">
              Select Target Portal:
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {targetPortals.map((portal) => {
                const active = targetPortal === portal;

                return (
                  <button
                    key={portal}
                    type="button"
                    onClick={() => setTargetPortal(portal)}
                    className={`h-9 border rounded-sm text-[10px] font-semibold transition ${
                      active
                        ? darkMode
                          ? "bg-slate-700 border-slate-500 text-white"
                          : "bg-slate-200 border-slate-500 text-slate-900"
                        : darkMode
                        ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                        : "bg-white border-slate-300 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {portal}
                  </button>
                );
              })}
            </div>
          </div>

          {/* =================================================
              NOTIFICATION TYPE
          ================================================= */}

          <div className="mb-5">
            <label
              htmlFor="notification-type"
              className="block text-xs font-bold mb-2"
            >
              Notification Type:
            </label>

            <select
              id="notification-type"
              value={notificationType}
              onChange={(e) => setNotificationType(e.target.value)}
              className={`w-full h-10 border rounded-sm px-3 text-xs outline-none transition ${
                darkMode
                  ? "bg-slate-800 border-slate-600 text-white focus:border-slate-400"
                  : "bg-white border-slate-300 text-slate-900 focus:border-slate-500"
              }`}
            >
              <option value="">Select notification type</option>

              {notificationTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* =================================================
              SUBJECT
          ================================================= */}

          <div className="mb-5">
            <label
              htmlFor="notification-subject"
              className="block text-xs font-bold mb-2"
            >
              Subject:
            </label>

            <input
              id="notification-subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter notification subject..."
              className={`w-full h-10 border rounded-sm px-3 text-xs outline-none transition ${
                darkMode
                  ? "bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 focus:border-slate-400"
                  : "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-slate-500"
              }`}
            />
          </div>

          {/* =================================================
              MESSAGE
          ================================================= */}

          <div className="mb-5">
            <label
              htmlFor="notification-message"
              className="block text-xs font-bold mb-2"
            >
              Message:
            </label>

            <textarea
              id="notification-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter notification message..."
              rows={6}
              className={`w-full border rounded-sm px-3 py-2 text-xs outline-none resize-y transition ${
                darkMode
                  ? "bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 focus:border-slate-400"
                  : "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-slate-500"
              }`}
            />
          </div>

          {/* =================================================
              FEEDBACK
          ================================================= */}

          {feedback && (
            <div
              className={`mb-4 px-3 py-2 border rounded-sm text-[10px] ${
                feedback.includes("successfully")
                  ? darkMode
                    ? "bg-emerald-950/40 border-emerald-800 text-emerald-300"
                    : "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : darkMode
                  ? "bg-red-950/40 border-red-800 text-red-300"
                  : "bg-red-50 border-red-200 text-red-700"
              }`}
            >
              {feedback}
            </div>
          )}

          {/* =================================================
              ACTION BUTTONS
          ================================================= */}

          <div className="flex flex-wrap gap-3 mb-6">
            <button
              type="button"
              onClick={handlePreview}
              className={`h-9 px-7 border rounded-sm text-[10px] font-semibold transition ${
                darkMode
                  ? "bg-slate-700 border-slate-500 text-white hover:bg-slate-600"
                  : "bg-slate-300 border-slate-500 text-slate-900 hover:bg-slate-400"
              }`}
            >
              Preview
            </button>

            <button
              type="button"
              onClick={handleSendNow}
              className={`h-9 px-7 border rounded-sm text-[10px] font-semibold transition ${
                darkMode
                  ? "bg-slate-700 border-slate-500 text-white hover:bg-slate-600"
                  : "bg-slate-600 border-slate-700 text-white hover:bg-slate-700"
              }`}
            >
              Send Now
            </button>

            <button
              type="button"
              onClick={handleSchedule}
              className={`h-9 px-7 border rounded-sm text-[10px] font-semibold transition ${
                darkMode
                  ? "bg-slate-700 border-slate-500 text-white hover:bg-slate-600"
                  : "bg-slate-300 border-slate-500 text-slate-900 hover:bg-slate-400"
              }`}
            >
              Schedule
            </button>
          </div>

          {/* =================================================
              PREVIEW
          ================================================= */}

          {showPreview && (
            <div
              className={`mb-6 border rounded-sm p-4 ${
                darkMode
                  ? "bg-slate-800 border-slate-600"
                  : "bg-slate-50 border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-bold">
                  Notification Preview
                </h2>

                <button
                  type="button"
                  onClick={() => setShowPreview(false)}
                  className={`text-xs ${
                    darkMode
                      ? "text-slate-400 hover:text-white"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  ×
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <p>
                  <span className="font-bold">Target:</span>{" "}
                  {targetPortal}
                </p>

                <p>
                  <span className="font-bold">Type:</span>{" "}
                  {notificationType || "General"}
                </p>

                <p>
                  <span className="font-bold">Subject:</span>{" "}
                  {subject}
                </p>

                <div>
                  <p className="font-bold mb-1">Message:</p>

                  <div
                    className={`p-3 border rounded-sm whitespace-pre-wrap ${
                      darkMode
                        ? "bg-slate-900 border-slate-700 text-slate-300"
                        : "bg-white border-slate-300 text-slate-700"
                    }`}
                  >
                    {message}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =================================================
              NOTIFICATION HISTORY
          ================================================= */}

          <div>
            <h2 className="text-xs font-bold mb-2">
              Notification History
            </h2>

            <div
              className={`border rounded-sm overflow-hidden ${
                darkMode
                  ? "border-slate-600"
                  : "border-slate-300"
              }`}
            >
              {/* DESKTOP TABLE */}

              <div className="hidden md:block overflow-x-auto">
                <table className="w-full border-collapse text-[10px]">
                  <thead>
                    <tr
                      className={
                        darkMode
                          ? "bg-slate-800"
                          : "bg-slate-100"
                      }
                    >
                      <th className="border-b px-3 py-2 text-left font-bold">
                        Target
                      </th>

                      <th className="border-b px-3 py-2 text-left font-bold">
                        Type
                      </th>

                      <th className="border-b px-3 py-2 text-left font-bold">
                        Subject
                      </th>

                      <th className="border-b px-3 py-2 text-left font-bold">
                        Date
                      </th>

                      <th className="border-b px-3 py-2 text-left font-bold">
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {history.map((item) => (
                      <tr
                        key={item.id}
                        className={
                          darkMode
                            ? "hover:bg-slate-800"
                            : "hover:bg-slate-50"
                        }
                      >
                        <td className="border-b px-3 py-2">
                          {item.target}
                        </td>

                        <td className="border-b px-3 py-2">
                          {item.type}
                        </td>

                        <td className="border-b px-3 py-2">
                          {item.subject}
                        </td>

                        <td className="border-b px-3 py-2 whitespace-nowrap">
                          {item.date}
                        </td>

                        <td className="border-b px-3 py-2">
                          <span
                            className={`inline-block px-2 py-1 rounded-sm text-[9px] font-semibold ${
                              item.status === "Sent"
                                ? darkMode
                                  ? "bg-emerald-900 text-emerald-300"
                                  : "bg-emerald-100 text-emerald-700"
                                : darkMode
                                ? "bg-amber-900 text-amber-300"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* MOBILE HISTORY */}

              <div className="md:hidden">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3 border-b last:border-b-0 ${
                      darkMode
                        ? "border-slate-700"
                        : "border-slate-200"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold truncate">
                          {item.subject}
                        </p>

                        <p
                          className={`text-[9px] mt-1 ${
                            darkMode
                              ? "text-slate-400"
                              : "text-slate-500"
                          }`}
                        >
                          {item.target} • {item.type}
                        </p>
                      </div>

                      <span
                        className={`flex-shrink-0 px-2 py-1 rounded-sm text-[9px] font-semibold ${
                          item.status === "Sent"
                            ? darkMode
                              ? "bg-emerald-900 text-emerald-300"
                              : "bg-emerald-100 text-emerald-700"
                            : darkMode
                            ? "bg-amber-900 text-amber-300"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <p
                      className={`text-[9px] mt-2 leading-relaxed ${
                        darkMode
                          ? "text-slate-400"
                          : "text-slate-500"
                      }`}
                    >
                      {item.message}
                    </p>

                    <p
                      className={`text-[9px] mt-2 ${
                        darkMode
                          ? "text-slate-500"
                          : "text-slate-400"
                      }`}
                    >
                      {item.date}
                    </p>
                  </div>
                ))}
              </div>

              {/* EMPTY STATE */}

              {history.length === 0 && (
                <div
                  className={`p-6 text-center text-xs ${
                    darkMode
                      ? "text-slate-500"
                      : "text-slate-400"
                  }`}
                >
                  No notification history available.
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SystemNotification;
