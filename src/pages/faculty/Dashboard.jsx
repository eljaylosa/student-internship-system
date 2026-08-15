import React from "react";
import { useOutletContext } from "react-router-dom";

const Dashboard = () => {
  const { darkMode } = useOutletContext();

  // -----------------------------------------
  // DASHBOARD DATA
  // -----------------------------------------

  const analyticsCards = [
    {
      title: "Assigned Students",
      count: 24,
      bg: darkMode ? "bg-blue-950/50" : "bg-blue-50",
      icon: "👥",
    },
    {
      title: "Pending Approvals",
      count: 5,
      bg: darkMode ? "bg-amber-950/50" : "bg-amber-50",
      icon: "✓",
    },
    {
      title: "Pending Evaluations",
      count: 8,
      bg: darkMode ? "bg-purple-950/50" : "bg-purple-50",
      icon: "📋",
    },
    {
      title: "Unread Messages",
      count: 3,
      bg: darkMode ? "bg-emerald-950/50" : "bg-emerald-50",
      icon: "💬",
    },
  ];

  const deadlines = [
    {
      month: "MAY",
      day: "15",
      title: "Internship Report",
      desc: "Student report submission",
      tag: "Due soon",
      tagColor: darkMode
        ? "bg-red-950/50 text-red-400 border-red-900"
        : "bg-red-50 text-red-600 border-red-100",
    },
    {
      month: "MAY",
      day: "20",
      title: "Student Evaluation",
      desc: "Internship evaluation deadline",
      tag: "5 days left",
      tagColor: darkMode
        ? "bg-amber-950/50 text-amber-400 border-amber-900"
        : "bg-amber-50 text-amber-600 border-amber-100",
    },
    {
      month: "JUN",
      day: "01",
      title: "Final Evaluation",
      desc: "Final student assessment",
      tag: "17 days left",
      tagColor: darkMode
        ? "bg-emerald-950/50 text-emerald-400 border-emerald-900"
        : "bg-emerald-50 text-emerald-600 border-emerald-100",
    },
  ];

  const recentActivities = [
    {
      student: "John Doe",
      activity: "Submitted an internship report",
      time: "2 hours ago",
      icon: "📄",
      color: darkMode
        ? "bg-blue-950/50 text-blue-400"
        : "bg-blue-50 text-blue-600",
    },
    {
      student: "Maria Santos",
      activity: "Submitted an internship application",
      time: "5 hours ago",
      icon: "📝",
      color: darkMode
        ? "bg-purple-950/50 text-purple-400"
        : "bg-purple-50 text-purple-600",
    },
    {
      student: "Mark Reyes",
      activity: "Completed an internship evaluation",
      time: "Yesterday",
      icon: "✓",
      color: darkMode
        ? "bg-emerald-950/50 text-emerald-400"
        : "bg-emerald-50 text-emerald-600",
    },
    {
      student: "Anna Cruz",
      activity: "Uploaded required documents",
      time: "Yesterday",
      icon: "📁",
      color: darkMode
        ? "bg-amber-950/50 text-amber-400"
        : "bg-amber-50 text-amber-600",
    },
    {
      student: "Kevin Garcia",
      activity: "Sent you a message",
      time: "2 days ago",
      icon: "💬",
      color: darkMode
        ? "bg-blue-950/50 text-blue-400"
        : "bg-blue-50 text-blue-600",
    },
  ];

  const progressData = [
    {
      label: "Completed",
      value: 8,
      dot: "bg-emerald-500",
    },
    {
      label: "On Track",
      value: 10,
      dot: "bg-blue-500",
    },
    {
      label: "Needs Attention",
      value: 4,
      dot: "bg-amber-500",
    },
    {
      label: "Not Started",
      value: 2,
      dot: darkMode ? "bg-slate-600" : "bg-slate-300",
    },
  ];

  // -----------------------------------------
  // SHARED STYLES
  // -----------------------------------------

  const cardClass = `rounded-2xl border p-6 transition-colors duration-300 ${
    darkMode ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"
  }`;

  const headingClass = darkMode ? "text-white" : "text-slate-900";

  const bodyTextClass = darkMode ? "text-slate-400" : "text-slate-500";

  const mutedTextClass = darkMode ? "text-slate-500" : "text-slate-400";

  // -----------------------------------------
  // RENDER
  // -----------------------------------------

  return (
    <div
      className={`p-5 md:p-6 lg:p-8 max-w-[1600px] mx-auto transition-colors duration-300 ${
        darkMode ? "text-slate-100" : "text-slate-900"
      }`}
    >
      {/* =========================================
          WELCOME HEADER
      ========================================= */}

      <section className="mb-8">
        <p className="text-sm font-medium text-blue-500 mb-2">
          Faculty Dashboard
        </p>

        <h1 className={`text-3xl font-bold tracking-tight ${headingClass}`}>
          Welcome back, Faculty! 👋
        </h1>

        <p className={`mt-2 ${bodyTextClass}`}>
          Here's an overview of your assigned students and internship
          activities.
        </p>
      </section>

      {/* =========================================
          ANALYTICS CARDS
      ========================================= */}

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        {analyticsCards.map((card) => (
          <div key={card.title} className={`${cardClass} hover:shadow-md`}>
            <div className="flex items-start justify-between">
              <div>
                <p className={`text-sm font-medium ${bodyTextClass}`}>
                  {card.title}
                </p>

                <p className={`text-3xl font-bold mt-2 ${headingClass}`}>
                  {card.count}
                </p>
              </div>

              <div
                className={`w-12 h-12 rounded-xl ${card.bg} flex items-center justify-center text-lg`}
              >
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* =========================================
          STUDENT PROGRESS + UPCOMING DEADLINES
      ========================================= */}

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        {/* STUDENT PROGRESS */}

        <div className={cardClass}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className={`font-bold text-lg ${headingClass}`}>
                Student Progress
              </h2>

              <p className={`text-sm mt-1 ${mutedTextClass}`}>
                Overview of your assigned students
              </p>
            </div>

            <button
              type="button"
              className="text-sm font-semibold text-blue-500 hover:text-blue-400 transition"
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
                    "conic-gradient(#10b981 0deg 120deg, #3b82f6 120deg 270deg, #f59e0b 270deg 330deg, #64748b 330deg 360deg)",
                }}
              />

              <div
                className={`absolute inset-5 rounded-full flex flex-col items-center justify-center ${
                  darkMode ? "bg-slate-900" : "bg-white"
                }`}
              >
                <span className={`text-3xl font-bold ${headingClass}`}>24</span>

                <span className={`text-xs ${mutedTextClass}`}>Students</span>
              </div>
            </div>

            {/* LEGEND */}

            <div className="space-y-4 flex-1 w-full">
              {progressData.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${item.dot}`} />

                    <span
                      className={`text-sm ${
                        darkMode ? "text-slate-300" : "text-slate-600"
                      }`}
                    >
                      {item.label}
                    </span>
                  </div>

                  <span className={`font-bold ${headingClass}`}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* UPCOMING DEADLINES */}

        <div className={cardClass}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className={`font-bold text-lg ${headingClass}`}>
                Upcoming Deadlines
              </h2>

              <p className={`text-sm mt-1 ${mutedTextClass}`}>
                Important internship dates
              </p>
            </div>

            <button
              type="button"
              className="text-sm font-semibold text-blue-500 hover:text-blue-400 transition"
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
                      ? "border-slate-700 bg-slate-800"
                      : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <span className={`text-[9px] font-bold ${mutedTextClass}`}>
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

                  <p className={`text-xs mt-1 ${mutedTextClass}`}>
                    {deadline.desc}
                  </p>
                </div>

                {/* TAG */}

                <span
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full border whitespace-nowrap ${deadline.tagColor}`}
                >
                  {deadline.tag}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================
          RECENT ACTIVITY + FACULTY ACTIONS
      ========================================= */}

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* RECENT ACTIVITY */}

        <div
          className={`xl:col-span-2 rounded-2xl border overflow-hidden transition-colors duration-300 ${
            darkMode
              ? "bg-slate-900 border-slate-700"
              : "bg-white border-slate-200"
          }`}
        >
          <div className="p-6 flex items-center justify-between">
            <div>
              <h2 className={`font-bold text-lg ${headingClass}`}>
                Recent Student Activity
              </h2>

              <p className={`text-sm mt-1 ${mutedTextClass}`}>
                Latest activities from your assigned students
              </p>
            </div>

            <button
              type="button"
              className="text-sm font-semibold text-blue-500 hover:text-blue-400 transition"
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
                key={`${activity.student}-${activity.activity}`}
                className={`px-6 py-4 flex items-center gap-3 transition ${
                  darkMode ? "hover:bg-slate-800" : "hover:bg-slate-50"
                }`}
              >
                {/* ICON */}

                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${activity.color}`}
                >
                  {activity.icon}
                </div>

                {/* CONTENT */}

                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-semibold ${headingClass}`}>
                    {activity.student}
                  </p>

                  <p
                    className={`text-xs mt-1 ${
                      darkMode ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    {activity.activity}
                  </p>
                </div>

                {/* TIME */}

                <span
                  className={`text-[10px] whitespace-nowrap ${mutedTextClass}`}
                >
                  {activity.time}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* FACULTY ACTIONS */}

        <div className={cardClass}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className={`font-bold text-lg ${headingClass}`}>
                Faculty Actions
              </h2>

              <p className={`text-sm mt-1 ${mutedTextClass}`}>
                Tasks that need your attention
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* APPROVALS */}

            <div
              className={`flex items-start gap-3 p-4 rounded-xl border ${
                darkMode
                  ? "bg-amber-950/30 border-amber-900"
                  : "bg-amber-50 border-amber-100"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  darkMode ? "bg-slate-800" : "bg-white"
                }`}
              >
                ✓
              </div>

              <div>
                <p className={`font-semibold text-sm ${headingClass}`}>
                  Pending Approvals
                </p>

                <p
                  className={`text-xs mt-1 ${
                    darkMode ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  5 student applications are waiting for your review.
                </p>
              </div>
            </div>

            {/* EVALUATIONS */}

            <div
              className={`flex items-start gap-3 p-4 rounded-xl border ${
                darkMode
                  ? "bg-purple-950/30 border-purple-900"
                  : "bg-purple-50 border-purple-100"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  darkMode ? "bg-slate-800" : "bg-white"
                }`}
              >
                📋
              </div>

              <div>
                <p className={`font-semibold text-sm ${headingClass}`}>
                  Evaluations Due
                </p>

                <p
                  className={`text-xs mt-1 ${
                    darkMode ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  8 students have evaluations waiting to be completed.
                </p>
              </div>
            </div>

            {/* MESSAGES */}

            <div
              className={`flex items-start gap-3 p-4 rounded-xl border ${
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
                💬
              </div>

              <div>
                <p className={`font-semibold text-sm ${headingClass}`}>
                  Unread Messages
                </p>

                <p
                  className={`text-xs mt-1 ${
                    darkMode ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  You have 3 unread messages from students.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================
          TIP
      ========================================= */}

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
            Faculty Tip
          </p>

          <p
            className={`text-sm ${
              darkMode ? "text-blue-400" : "text-blue-700"
            }`}
          >
            Review pending applications and evaluations regularly to keep your
            students' internship progress on track.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
