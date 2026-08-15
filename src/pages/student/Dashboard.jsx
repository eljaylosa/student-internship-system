import React from "react";
import { useOutletContext } from "react-router-dom";

const Dashboard = () => {
  const { darkMode } = useOutletContext();

  // =========================================================
  // DASHBOARD DATA
  // =========================================================

  const analyticsCards = [
    {
      title: "Active Internship",
      count: 1,
      icon: "💼",
      lightBg: "bg-blue-50",
      darkBg: "bg-blue-950/40",
    },
    {
      title: "Applications",
      count: 5,
      icon: "📋",
      lightBg: "bg-emerald-50",
      darkBg: "bg-emerald-950/40",
    },
    {
      title: "Documents",
      count: 8,
      icon: "📁",
      lightBg: "bg-purple-50",
      darkBg: "bg-purple-950/40",
    },
    {
      title: "Notifications",
      count: 3,
      icon: "🔔",
      lightBg: "bg-amber-50",
      darkBg: "bg-amber-950/40",
    },
  ];

  const deadlines = [
    {
      month: "MAY",
      day: "15",
      title: "Internship Report",
      description: "Submit your internship report",
      tag: "Due soon",
      tagClass: darkMode
        ? "bg-red-950/40 text-red-400 border-red-900"
        : "bg-red-50 text-red-600 border-red-100",
    },
    {
      month: "MAY",
      day: "20",
      title: "Weekly Time Record",
      description: "Submit your latest time record",
      tag: "5 days left",
      tagClass: darkMode
        ? "bg-amber-950/40 text-amber-400 border-amber-900"
        : "bg-amber-50 text-amber-600 border-amber-100",
    },
    {
      month: "JUN",
      day: "01",
      title: "Final Evaluation",
      description: "Final internship evaluation",
      tag: "17 days left",
      tagClass: darkMode
        ? "bg-emerald-950/40 text-emerald-400 border-emerald-900"
        : "bg-emerald-50 text-emerald-600 border-emerald-100",
    },
  ];

  const recentActivities = [
    {
      title: "Application Approved",
      description: "Your internship application has been approved.",
      time: "2 hours ago",
      icon: "✓",
      iconClass: darkMode
        ? "bg-emerald-950/40 text-emerald-400"
        : "bg-emerald-50 text-emerald-600",
    },
    {
      title: "Document Reviewed",
      description: "Your submitted document has been reviewed.",
      time: "5 hours ago",
      icon: "📄",
      iconClass: darkMode
        ? "bg-blue-950/40 text-blue-400"
        : "bg-blue-50 text-blue-600",
    },
    {
      title: "New Message",
      description: "You received a message from your faculty.",
      time: "Yesterday",
      icon: "💬",
      iconClass: darkMode
        ? "bg-purple-950/40 text-purple-400"
        : "bg-purple-50 text-purple-600",
    },
    {
      title: "Application Submitted",
      description: "Your internship application was submitted.",
      time: "Yesterday",
      icon: "📝",
      iconClass: darkMode
        ? "bg-amber-950/40 text-amber-400"
        : "bg-amber-50 text-amber-600",
    },
  ];

  // =========================================================
  // COMMON CLASSES
  // =========================================================

  const cardClass = darkMode
    ? "bg-slate-900 border-slate-700"
    : "bg-white border-slate-200";

  const headingClass = darkMode ? "text-slate-100" : "text-slate-900";

  const mutedClass = darkMode ? "text-slate-400" : "text-slate-500";

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="p-5 md:p-6 lg:p-8 max-w-[1600px] mx-auto">
      {/* =====================================================
          WELCOME
      ===================================================== */}

      <section className="mb-8">
        <p className="text-sm font-medium text-blue-500 mb-2">
          Student Dashboard
        </p>

        <h1 className={`text-3xl font-bold tracking-tight ${headingClass}`}>
          Welcome back, John! 👋
        </h1>

        <p className={`mt-2 ${mutedClass}`}>
          Here's an overview of your internship progress and activities.
        </p>
      </section>

      {/* =====================================================
          ANALYTICS
      ===================================================== */}

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        {analyticsCards.map((card) => (
          <div
            key={card.title}
            className={`${cardClass} rounded-2xl border p-5 transition-shadow hover:shadow-md`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className={`text-sm font-medium ${mutedClass}`}>
                  {card.title}
                </p>

                <p className={`text-3xl font-bold mt-2 ${headingClass}`}>
                  {card.count}
                </p>
              </div>

              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg ${
                  darkMode ? card.darkBg : card.lightBg
                }`}
              >
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* =====================================================
          INTERNSHIP PROGRESS + DEADLINES
      ===================================================== */}

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        {/* INTERNSHIP PROGRESS */}

        <div className={`${cardClass} rounded-2xl border p-6`}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className={`font-bold text-lg ${headingClass}`}>
                Internship Progress
              </h2>

              <p className={`text-sm mt-1 ${mutedClass}`}>
                Your current internship progress
              </p>
            </div>

            <button
              type="button"
              className="text-sm font-semibold text-blue-500 hover:text-blue-400"
            >
              View Details
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-8">
            {/* DONUT */}

            <div className="relative w-40 h-40 flex-shrink-0">
              <div
                className="w-full h-full rounded-full"
                style={{
                  background:
                    "conic-gradient(#10b981 0deg 245deg, #3b82f6 245deg 310deg, #f59e0b 310deg 345deg, #64748b 345deg 360deg)",
                }}
              />

              <div
                className={`absolute inset-5 rounded-full flex flex-col items-center justify-center ${
                  darkMode ? "bg-slate-900" : "bg-white"
                }`}
              >
                <span className={`text-3xl font-bold ${headingClass}`}>
                  68%
                </span>

                <span className={`text-xs ${mutedClass}`}>Complete</span>
              </div>
            </div>

            {/* PROGRESS DETAILS */}

            <div className="flex-1 w-full space-y-5">
              <div>
                <div className="flex justify-between mb-2">
                  <span className={`text-sm ${mutedClass}`}>
                    Overall Progress
                  </span>

                  <span className={`text-sm font-bold ${headingClass}`}>
                    68%
                  </span>
                </div>

                <div
                  className={`h-2 rounded-full ${
                    darkMode ? "bg-slate-700" : "bg-slate-100"
                  }`}
                >
                  <div className="h-2 w-[68%] rounded-full bg-blue-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div
                  className={`p-3 rounded-xl ${
                    darkMode ? "bg-emerald-950/30" : "bg-emerald-50"
                  }`}
                >
                  <p
                    className={`text-xs ${
                      darkMode ? "text-emerald-400" : "text-emerald-600"
                    }`}
                  >
                    Completed
                  </p>

                  <p className={`text-xl font-bold mt-1 ${headingClass}`}>8</p>
                </div>

                <div
                  className={`p-3 rounded-xl ${
                    darkMode ? "bg-blue-950/30" : "bg-blue-50"
                  }`}
                >
                  <p
                    className={`text-xs ${
                      darkMode ? "text-blue-400" : "text-blue-600"
                    }`}
                  >
                    Remaining
                  </p>

                  <p className={`text-xl font-bold mt-1 ${headingClass}`}>4</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* DEADLINES */}

        <div className={`${cardClass} rounded-2xl border p-6`}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className={`font-bold text-lg ${headingClass}`}>
                Upcoming Deadlines
              </h2>

              <p className={`text-sm mt-1 ${mutedClass}`}>
                Important internship dates
              </p>
            </div>

            <button
              type="button"
              className="text-sm font-semibold text-blue-500 hover:text-blue-400"
            >
              View All
            </button>
          </div>

          <div className="space-y-4">
            {deadlines.map((deadline) => (
              <div
                key={deadline.title}
                className={`flex items-center gap-4 p-3 rounded-xl transition ${
                  darkMode ? "hover:bg-slate-800" : "hover:bg-slate-50"
                }`}
              >
                {/* DATE */}

                <div
                  className={`w-14 h-14 rounded-xl border flex flex-col items-center justify-center flex-shrink-0 ${
                    darkMode
                      ? "bg-slate-800 border-slate-700"
                      : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <span
                    className={`text-[9px] font-bold ${
                      darkMode ? "text-slate-500" : "text-slate-400"
                    }`}
                  >
                    {deadline.month}
                  </span>

                  <span className={`text-xl font-bold ${headingClass}`}>
                    {deadline.day}
                  </span>
                </div>

                {/* CONTENT */}

                <div className="flex-1 min-w-0">
                  <p
                    className={`font-semibold text-sm truncate ${headingClass}`}
                  >
                    {deadline.title}
                  </p>

                  <p className={`text-xs mt-1 ${mutedClass}`}>
                    {deadline.description}
                  </p>
                </div>

                {/* TAG */}

                <span
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full border whitespace-nowrap ${deadline.tagClass}`}
                >
                  {deadline.tag}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================
          RECENT ACTIVITY + INTERNSHIP INFO
      ===================================================== */}

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* RECENT ACTIVITY */}

        <div
          className={`xl:col-span-2 ${cardClass} rounded-2xl border overflow-hidden`}
        >
          <div className="p-6 flex items-center justify-between">
            <div>
              <h2 className={`font-bold text-lg ${headingClass}`}>
                Recent Activity
              </h2>

              <p className={`text-sm mt-1 ${mutedClass}`}>
                Your latest internship activities
              </p>
            </div>

            <button
              type="button"
              className="text-sm font-semibold text-blue-500 hover:text-blue-400"
            >
              View All
            </button>
          </div>

          <div
            className={`divide-y ${
              darkMode ? "divide-slate-700" : "divide-slate-100"
            }`}
          >
            {recentActivities.map((activity) => (
              <div
                key={`${activity.title}-${activity.time}`}
                className={`px-6 py-4 flex items-center gap-3 transition ${
                  darkMode ? "hover:bg-slate-800" : "hover:bg-slate-50"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${activity.iconClass}`}
                >
                  {activity.icon}
                </div>

                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-semibold ${headingClass}`}>
                    {activity.title}
                  </p>

                  <p className={`text-xs mt-1 ${mutedClass}`}>
                    {activity.description}
                  </p>
                </div>

                <span
                  className={`text-[10px] whitespace-nowrap ${
                    darkMode ? "text-slate-500" : "text-slate-400"
                  }`}
                >
                  {activity.time}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* INTERNSHIP INFORMATION */}

        <div className={`${cardClass} rounded-2xl border p-6`}>
          <div className="mb-6">
            <h2 className={`font-bold text-lg ${headingClass}`}>
              Internship Information
            </h2>

            <p className={`text-sm mt-1 ${mutedClass}`}>
              Your current internship
            </p>
          </div>

          <div className="space-y-4">
            {/* COMPANY */}

            <div
              className={`p-4 rounded-xl border ${
                darkMode
                  ? "bg-slate-800 border-slate-700"
                  : "bg-slate-50 border-slate-100"
              }`}
            >
              <p className={`text-xs ${mutedClass}`}>Company</p>

              <p className={`font-semibold text-sm mt-1 ${headingClass}`}>
                Tech Solutions Inc.
              </p>
            </div>

            {/* POSITION */}

            <div
              className={`p-4 rounded-xl border ${
                darkMode
                  ? "bg-slate-800 border-slate-700"
                  : "bg-slate-50 border-slate-100"
              }`}
            >
              <p className={`text-xs ${mutedClass}`}>Position</p>

              <p className={`font-semibold text-sm mt-1 ${headingClass}`}>
                IT Intern
              </p>
            </div>

            {/* STATUS */}

            <div
              className={`p-4 rounded-xl border ${
                darkMode
                  ? "bg-emerald-950/30 border-emerald-900"
                  : "bg-emerald-50 border-emerald-100"
              }`}
            >
              <p
                className={`text-xs ${
                  darkMode ? "text-emerald-400" : "text-emerald-600"
                }`}
              >
                Status
              </p>

              <div className="flex items-center gap-2 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />

                <p
                  className={`font-semibold text-sm ${
                    darkMode ? "text-emerald-300" : "text-emerald-700"
                  }`}
                >
                  Active
                </p>
              </div>
            </div>

            {/* FACULTY */}

            <div
              className={`p-4 rounded-xl border ${
                darkMode
                  ? "bg-slate-800 border-slate-700"
                  : "bg-slate-50 border-slate-100"
              }`}
            >
              <p className={`text-xs ${mutedClass}`}>Faculty Adviser</p>

              <p className={`font-semibold text-sm mt-1 ${headingClass}`}>
                Prof. Maria Santos
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          TIP
      ===================================================== */}

      <div
        className={`mt-6 rounded-2xl p-4 flex items-center gap-3 border ${
          darkMode
            ? "bg-blue-950/30 border-blue-900"
            : "bg-blue-50 border-blue-100"
        }`}
      >
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            darkMode ? "bg-slate-800" : "bg-white"
          }`}
        >
          💡
        </div>

        <div>
          <p
            className={`text-sm font-bold ${
              darkMode ? "text-blue-300" : "text-blue-900"
            }`}
          >
            Student Tip
          </p>

          <p
            className={`text-sm ${
              darkMode ? "text-blue-400" : "text-blue-700"
            }`}
          >
            Keep your documents updated and check your upcoming deadlines
            regularly to stay on track with your internship.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
