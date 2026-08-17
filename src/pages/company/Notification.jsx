import React, { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";

const Notification = () => {
  const { darkMode } = useOutletContext();

  // =========================================================
  // STATE
  // =========================================================

  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "New Internship Application",
      message:
        "John Doe has submitted an internship application for the Software Engineering Intern position.",
      type: "Application",
      time: "2 hrs ago",
      read: false,
    },
    {
      id: 2,
      title: "Intern Document Submitted",
      message:
        "John Doe has submitted a new internship document that requires your review.",
      type: "Document",
      time: "5 hrs ago",
      read: false,
    },
    {
      id: 3,
      title: "New Message",
      message:
        "You have received a new message from John Doe regarding his internship.",
      type: "Message",
      time: "1 day ago",
      read: true,
    },
    {
      id: 4,
      title: "Evaluation Reminder",
      message:
        "An intern evaluation is due soon. Please complete the evaluation for the current internship period.",
      type: "Evaluation",
      time: "2 days ago",
      read: true,
    },
    {
      id: 5,
      title: "Internship Position Update",
      message:
        "Your Software Engineering Intern position has been successfully updated.",
      type: "Job Posting",
      time: "3 days ago",
      read: true,
    },
    {
      id: 6,
      title: "System Update",
      message:
        "The Student Internship Management System has received a system update.",
      type: "System",
      time: "1 week ago",
      read: true,
    },
  ]);

  // =========================================================
  // THEME CLASSES
  // =========================================================

  const cardClass = darkMode
    ? "bg-slate-900 border-slate-700"
    : "bg-white border-slate-200";

  const headingClass = darkMode ? "text-slate-100" : "text-slate-900";

  const mutedClass = darkMode ? "text-slate-400" : "text-slate-500";

  const searchClass = darkMode
    ? `
      w-full
      h-10
      px-3.5
      rounded-lg
      border
      border-slate-700
      bg-slate-800
      text-sm
      text-slate-200
      placeholder:text-slate-500
      outline-none
      transition
      focus:border-slate-600
      focus:ring-2
      focus:ring-slate-700
    `
    : `
      w-full
      h-10
      px-3.5
      rounded-lg
      border
      border-slate-200
      bg-slate-50
      text-sm
      text-slate-700
      placeholder:text-slate-400
      outline-none
      transition
      focus:bg-white
      focus:border-slate-400
      focus:ring-2
      focus:ring-slate-100
    `;

  // =========================================================
  // UNREAD COUNT
  // =========================================================

  const unreadCount = notifications.filter(
    (notification) => !notification.read
  ).length;

  // =========================================================
  // FILTER + SEARCH
  // =========================================================

  const filteredNotifications = useMemo(() => {
    return notifications.filter((notification) => {
      const matchesFilter =
        activeFilter === "all" ||
        (activeFilter === "unread" && !notification.read) ||
        (activeFilter === "read" && notification.read);

      const query = searchQuery.toLowerCase().trim();

      const matchesSearch =
        !query ||
        notification.title.toLowerCase().includes(query) ||
        notification.message.toLowerCase().includes(query) ||
        notification.type.toLowerCase().includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [notifications, activeFilter, searchQuery]);

  // =========================================================
  // MARK AS READ
  // =========================================================

  const handleMarkAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id
          ? {
              ...notification,
              read: true,
            }
          : notification
      )
    );
  };

  // =========================================================
  // MARK AS UNREAD
  // =========================================================

  const handleMarkAsUnread = (id) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id
          ? {
              ...notification,
              read: false,
            }
          : notification
      )
    );
  };

  // =========================================================
  // MARK ALL AS READ
  // =========================================================

  const handleMarkAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((notification) => ({
        ...notification,
        read: true,
      }))
    );
  };

  // =========================================================
  // CLEAR READ
  // =========================================================

  const handleClearRead = () => {
    setNotifications((prev) =>
      prev.filter((notification) => !notification.read)
    );
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="w-full min-h-full p-3 sm:p-5 md:p-6 lg:p-8 bg-transparent">
      <div className="max-w-[1400px] mx-auto">
        <section
          className={`
            w-full
            max-w-[1000px]
            mx-auto
            xl:mx-0
            border
            rounded-2xl
            p-4
            sm:p-5
            md:p-6
            ${cardClass}
          `}
        >
          {/* =====================================================
              HEADER
          ===================================================== */}

          <div
            className="
              flex
              flex-col
              lg:flex-row
              lg:items-center
              lg:justify-between
              gap-4
              mb-6
            "
          >
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className={`text-lg font-bold ${headingClass}`}>
                  Notification Log
                </h2>

                {unreadCount > 0 && (
                  <span
                    className="
                      px-2.5
                      py-1
                      rounded-full
                      bg-red-50
                      text-red-600
                      text-[10px]
                      font-bold
                    "
                  >
                    {unreadCount} Unread
                  </span>
                )}
              </div>

              <p className={`text-xs mt-1 ${mutedClass}`}>
                View and manage your recent company notifications.
              </p>
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className={`
                  w-fit
                  px-4
                  py-2
                  rounded-lg
                  border
                  text-xs
                  font-semibold
                  transition
                  ${
                    darkMode
                      ? "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }
                `}
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* =====================================================
              SEARCH
          ===================================================== */}

          <div className="mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notifications..."
              className={searchClass}
            />
          </div>

          {/* =====================================================
              FILTER TABS
          ===================================================== */}

          <div className="flex flex-wrap items-center gap-2 mb-5">
            {/* ALL */}

            <button
              type="button"
              onClick={() => setActiveFilter("all")}
              className={`
                px-4
                py-2
                rounded-lg
                text-xs
                font-semibold
                transition
                ${
                  activeFilter === "all"
                    ? darkMode
                      ? "bg-white text-slate-900"
                      : "bg-slate-900 text-white"
                    : darkMode
                    ? "bg-slate-800 text-slate-400 hover:bg-slate-700"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }
              `}
            >
              All
            </button>

            {/* UNREAD */}

            <button
              type="button"
              onClick={() => setActiveFilter("unread")}
              className={`
                px-4
                py-2
                rounded-lg
                text-xs
                font-semibold
                transition
                ${
                  activeFilter === "unread"
                    ? darkMode
                      ? "bg-white text-slate-900"
                      : "bg-slate-900 text-white"
                    : darkMode
                    ? "bg-slate-800 text-slate-400 hover:bg-slate-700"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }
              `}
            >
              Unread
              {unreadCount > 0 && (
                <span className="ml-1.5">({unreadCount})</span>
              )}
            </button>

            {/* READ */}

            <button
              type="button"
              onClick={() => setActiveFilter("read")}
              className={`
                px-4
                py-2
                rounded-lg
                text-xs
                font-semibold
                transition
                ${
                  activeFilter === "read"
                    ? darkMode
                      ? "bg-white text-slate-900"
                      : "bg-slate-900 text-white"
                    : darkMode
                    ? "bg-slate-800 text-slate-400 hover:bg-slate-700"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }
              `}
            >
              Read
            </button>

            {/* CLEAR READ */}

            {notifications.some((notification) => notification.read) && (
              <button
                type="button"
                onClick={handleClearRead}
                className={`
                  ml-auto
                  px-4
                  py-2
                  rounded-lg
                  text-xs
                  font-semibold
                  transition
                  ${
                    darkMode
                      ? "text-red-400 hover:bg-red-950/30"
                      : "text-red-500 hover:bg-red-50"
                  }
                `}
              >
                Clear read
              </button>
            )}
          </div>

          {/* =====================================================
              NOTIFICATION LIST
          ===================================================== */}

          <div className="space-y-3">
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`
                    border
                    rounded-xl
                    p-4
                    transition-all
                    duration-200
                    ${
                      notification.read
                        ? darkMode
                          ? "bg-slate-900 border-slate-700"
                          : "bg-white border-slate-200"
                        : darkMode
                        ? "bg-slate-800 border-slate-600 shadow-sm"
                        : "bg-slate-50 border-slate-300 shadow-sm"
                    }
                  `}
                >
                  <div className="flex items-start gap-3">
                    {/* STATUS */}

                    <span
                      className={`
                        mt-1.5
                        w-3
                        h-3
                        flex-shrink-0
                        rounded-sm
                        border
                        ${
                          notification.read
                            ? darkMode
                              ? "bg-slate-900 border-slate-600"
                              : "bg-white border-slate-300"
                            : darkMode
                            ? "bg-white border-white"
                            : "bg-slate-800 border-slate-800"
                        }
                      `}
                    />

                    {/* CONTENT */}

                    <div className="flex-1 min-w-0">
                      <div
                        className="
                          flex
                          flex-col
                          sm:flex-row
                          sm:items-center
                          sm:justify-between
                          gap-2
                        "
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <h3
                            className={`
                              text-sm
                              ${
                                notification.read
                                  ? darkMode
                                    ? "font-semibold text-slate-300"
                                    : "font-semibold text-slate-700"
                                  : darkMode
                                  ? "font-bold text-slate-100"
                                  : "font-bold text-slate-900"
                              }
                            `}
                          >
                            {notification.title}
                          </h3>

                          {/* NEW */}

                          {!notification.read && (
                            <span
                              className="
                                px-2
                                py-0.5
                                rounded-full
                                bg-blue-50
                                text-blue-600
                                text-[9px]
                                uppercase
                                tracking-wide
                                font-bold
                              "
                            >
                              New
                            </span>
                          )}

                          {/* TYPE */}

                          <span
                            className={`
                              px-2
                              py-0.5
                              rounded-md
                              text-[9px]
                              font-medium
                              ${
                                darkMode
                                  ? "bg-slate-700 text-slate-400"
                                  : "bg-slate-100 text-slate-400"
                              }
                            `}
                          >
                            {notification.type}
                          </span>
                        </div>

                        {/* TIME */}

                        <span
                          className={`
                            text-[10px]
                            flex-shrink-0
                            ${mutedClass}
                          `}
                        >
                          {notification.time}
                        </span>
                      </div>

                      {/* MESSAGE */}

                      <p
                        className={`
                          text-xs
                          mt-2
                          leading-relaxed
                          ${mutedClass}
                        `}
                      >
                        {notification.message}
                      </p>

                      {/* DIVIDER */}

                      <div
                        className={`
                          h-px
                          my-3
                          ${darkMode ? "bg-slate-700" : "bg-slate-200"}
                        `}
                      />

                      {/* ACTION */}

                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] ${mutedClass}`}>
                          {notification.read
                            ? "Notification read"
                            : "Notification unread"}
                        </span>

                        {notification.read ? (
                          <button
                            type="button"
                            onClick={() => handleMarkAsUnread(notification.id)}
                            className={`
                              text-[10px]
                              font-semibold
                              transition
                              ${
                                darkMode
                                  ? "text-slate-400 hover:text-white"
                                  : "text-slate-500 hover:text-slate-900"
                              }
                            `}
                          >
                            Mark as unread
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleMarkAsRead(notification.id)}
                            className={`
                              text-[10px]
                              font-semibold
                              transition
                              ${
                                darkMode
                                  ? "text-blue-400 hover:text-blue-300"
                                  : "text-blue-600 hover:text-blue-800"
                              }
                            `}
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
              /* =================================================
                 EMPTY STATE
              ================================================= */

              <div
                className={`
                  border
                  border-dashed
                  rounded-xl
                  p-10
                  text-center
                  ${darkMode ? "border-slate-700" : "border-slate-200"}
                `}
              >
                <div
                  className={`
                    w-12
                    h-12
                    mx-auto
                    rounded-xl
                    flex
                    items-center
                    justify-center
                    text-xl
                    mb-3
                    ${darkMode ? "bg-slate-800" : "bg-slate-100"}
                  `}
                >
                  🔔
                </div>

                <h3 className={`text-sm font-bold ${headingClass}`}>
                  No notifications found
                </h3>

                <p className={`text-xs mt-1 ${mutedClass}`}>
                  {activeFilter === "unread"
                    ? "You don't have any unread notifications."
                    : searchQuery
                    ? "No notifications match your search."
                    : "Your notification log is currently empty."}
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Notification;
