import React, { useMemo, useState } from "react";

const Notification = () => {
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "Application Approved",
      message:
        "Your internship application has been approved by your faculty adviser.",
      type: "System",
      time: "2 hrs ago",
      read: false,
    },
    {
      id: 2,
      title: "Document Reviewed",
      message:
        "Your submitted internship document has been reviewed successfully.",
      type: "Document",
      time: "1 day ago",
      read: false,
    },
    {
      id: 3,
      title: "New Message",
      message:
        "You have received a new message regarding your internship application.",
      type: "Message",
      time: "2 days ago",
      read: true,
    },
    {
      id: 4,
      title: "Deadline Reminder",
      message:
        "Your internship application requirements are approaching their deadline.",
      type: "Reminder",
      time: "3 days ago",
      read: true,
    },
    {
      id: 5,
      title: "System Update",
      message:
        "The Student Internship Management System has received a system update.",
      type: "System",
      time: "1 week ago",
      read: true,
    },
  ]);

  // -----------------------------------------
  // UNREAD COUNT
  // -----------------------------------------

  const unreadCount = notifications.filter(
    (notification) => !notification.read
  ).length;

  // -----------------------------------------
  // FILTER + SEARCH
  // -----------------------------------------

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

  // -----------------------------------------
  // MARK AS READ
  // -----------------------------------------

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

  // -----------------------------------------
  // MARK AS UNREAD
  // -----------------------------------------

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

  // -----------------------------------------
  // MARK ALL AS READ
  // -----------------------------------------

  const handleMarkAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((notification) => ({
        ...notification,
        read: true,
      }))
    );
  };

  // -----------------------------------------
  // CLEAR READ NOTIFICATIONS
  // -----------------------------------------

  const handleClearRead = () => {
    setNotifications((prev) =>
      prev.filter((notification) => !notification.read)
    );
  };

  return (
    <div className="p-5 md:p-6 lg:p-8 max-w-[1400px] mx-auto">
      {/* =========================================
          NOTIFICATION LOG
      ========================================= */}

      <section className="w-full max-w-[1000px] mx-auto xl:mx-0 bg-white border border-slate-200 rounded-2xl p-5 md:p-6">
        {/* =========================================
            HEADER
        ========================================= */}

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-slate-900">
                Notification Log
              </h2>

              {unreadCount > 0 && (
                <span className="px-2.5 py-1 rounded-full bg-red-50 text-red-600 text-[10px] font-bold">
                  {unreadCount} Unread
                </span>
              )}
            </div>

            <p className="text-xs text-slate-400 mt-1">
              View and manage your recent system notifications.
            </p>
          </div>

          {/* Mark All */}

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              className="w-fit px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-600 text-xs font-semibold hover:bg-slate-50 hover:text-slate-900 transition"
            >
              Mark all as read
            </button>
          )}
        </div>

        {/* =========================================
            SEARCH
        ========================================= */}

        <div className="mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notifications..."
            className="w-full h-10 px-3.5 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-700 outline-none transition focus:bg-white focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
          />
        </div>

        {/* =========================================
            FILTER TABS
        ========================================= */}

        <div className="flex flex-wrap gap-2 mb-5">
          <button
            type="button"
            onClick={() => setActiveFilter("all")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
              activeFilter === "all"
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("unread")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
              activeFilter === "unread"
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Unread
            {unreadCount > 0 && <span className="ml-1.5">({unreadCount})</span>}
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("read")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
              activeFilter === "read"
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Read
          </button>

          {notifications.some((notification) => notification.read) && (
            <button
              type="button"
              onClick={handleClearRead}
              className="ml-auto px-4 py-2 rounded-lg text-xs font-semibold text-red-500 hover:bg-red-50 transition"
            >
              Clear read
            </button>
          )}
        </div>

        {/* =========================================
            NOTIFICATION LIST
        ========================================= */}

        <div className="space-y-3">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`border rounded-xl p-4 transition-all duration-200 ${
                  notification.read
                    ? "bg-white border-slate-200"
                    : "bg-slate-50 border-slate-300 shadow-sm"
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* STATUS INDICATOR */}

                  <span
                    className={`mt-1.5 w-3 h-3 flex-shrink-0 rounded-sm border ${
                      notification.read
                        ? "bg-white border-slate-300"
                        : "bg-slate-800 border-slate-800"
                    }`}
                  />

                  {/* CONTENT */}

                  <div className="flex-1 min-w-0">
                    {/* TOP ROW */}

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3
                          className={`text-sm ${
                            notification.read
                              ? "font-semibold text-slate-700"
                              : "font-bold text-slate-900"
                          }`}
                        >
                          {notification.title}
                        </h3>

                        {!notification.read && (
                          <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[9px] uppercase tracking-wide font-bold">
                            New
                          </span>
                        )}

                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-400 text-[9px] font-medium">
                          {notification.type}
                        </span>
                      </div>

                      <span className="text-[10px] text-slate-400 flex-shrink-0">
                        {notification.time}
                      </span>
                    </div>

                    {/* MESSAGE */}

                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                      {notification.message}
                    </p>

                    {/* DIVIDER */}

                    <div className="h-px bg-slate-200 my-3" />

                    {/* ACTIONS */}

                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">
                        {notification.read
                          ? "Notification read"
                          : "Notification unread"}
                      </span>

                      {notification.read ? (
                        <button
                          type="button"
                          onClick={() => handleMarkAsUnread(notification.id)}
                          className="text-[10px] font-semibold text-slate-500 hover:text-slate-900 transition"
                        >
                          Mark as unread
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="text-[10px] font-semibold text-blue-600 hover:text-blue-800 transition"
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
            /* =========================================
                EMPTY STATE
            ========================================= */

            <div className="border border-dashed border-slate-200 rounded-xl p-10 text-center">
              <div className="w-12 h-12 mx-auto rounded-xl bg-slate-100 flex items-center justify-center text-xl mb-3">
                🔔
              </div>

              <h3 className="text-sm font-bold text-slate-700">
                No notifications found
              </h3>

              <p className="text-xs text-slate-400 mt-1">
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
  );
};

export default Notification;
