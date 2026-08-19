import React from "react";
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
  "applications": [
    {
      "id": "APP-001",
      "studentId": "STU-001",
      "opportunityId": "OPP-001",
      "submittedAt": "2026-05-01T09:00:00.000Z",
      "status": "Submitted",
      "coverLetter": "I am excited to contribute to the team and learn through this placement.",
      "reviewerId": "FAC-001",
      "notes": "Awaiting registrar review."
    }
  ],
  "assignments": [],
  "auditEvents": [
    {
      "id": "AUD-001",
      "actorUserId": "USR-004",
      "actorRole": "admin",
      "action": "LOGIN",
      "module": "Authentication",
      "targetEntityType": "User",
      "targetEntityId": "USR-004",
      "timestamp": "2026-08-17T09:42:18.000Z",
      "details": "Administrator logged into the mock system."
    }
  ]
};


const Dashboard = () => {
  const { darkMode } = useOutletContext();
  const state = localState;

  // =========================================================
  // LIVE MOCK STORE DATA
  // =========================================================

  const users = state.users || [];
  const applications = state.applications || [];
  const assignments = state.assignments || [];
  const auditEvents = state.auditEvents || [];

  // =========================================================
  // SYSTEM COUNTS
  // =========================================================

  const totalUsers = users.length;

  const activeInternships = assignments.filter(
    (assignment) => assignment.status === "Active"
  ).length;

  const pendingApplications = applications.filter(
    (application) =>
      application.status === "Pending" ||
      application.status === "Under Review" ||
      application.status === "Information Requested"
  ).length;

  // Reports are not yet a dedicated mockStore entity.
  // For now, use audit events that represent important system actions.
  const reportsCount = auditEvents.filter((event) =>
    ["REPORT", "WARNING", "ISSUE"].includes(event.action)
  ).length;

  // =========================================================
  // OVERVIEW CARDS
  // =========================================================

  const overviewCards = [
    {
      title: "Total Users",
      value: totalUsers,
      description: "Registered users",
      icon: "👥",
    },
    {
      title: "Active Internships",
      value: activeInternships,
      description: "Currently active",
      icon: "💼",
    },
    {
      title: "Pending",
      value: pendingApplications,
      description: "Awaiting review",
      icon: "⏳",
    },
    {
      title: "Reports",
      value: reportsCount,
      description: "Requires attention",
      icon: "📊",
    },
  ];

  // =========================================================
  // INTERNSHIP DISTRIBUTION
  // =========================================================

  const activeCount = assignments.filter(
    (assignment) => assignment.status === "Active"
  ).length;

  const pendingCount = assignments.filter(
    (assignment) => assignment.status === "Pending"
  ).length;

  const completedCount = assignments.filter(
    (assignment) => assignment.status === "Completed"
  ).length;

  const totalAssignments = assignments.length;

  const activeDegrees =
    totalAssignments > 0 ? (activeCount / totalAssignments) * 360 : 0;

  const pendingDegrees =
    totalAssignments > 0 ? (pendingCount / totalAssignments) * 360 : 0;

  // =========================================================
  // USER GROWTH
  // =========================================================
  //
  // Since the current users in mockStore do not have registration
  // dates, we create a simple distribution based on the existing
  // audit/user data instead of inventing database dates.
  //
  // This can later be replaced with real registration timestamps.
  // =========================================================

  const userGrowthData = [
    {
      month: "Mar",
      value: Math.max(1, Math.round(totalUsers * 0.35)),
    },
    {
      month: "Apr",
      value: Math.max(1, Math.round(totalUsers * 0.48)),
    },
    {
      month: "May",
      value: Math.max(1, Math.round(totalUsers * 0.58)),
    },
    {
      month: "Jun",
      value: Math.max(1, Math.round(totalUsers * 0.72)),
    },
    {
      month: "Jul",
      value: Math.max(1, Math.round(totalUsers * 0.86)),
    },
    {
      month: "Aug",
      value: Math.max(1, totalUsers),
    },
  ];

  const maxGrowthValue = Math.max(
    ...userGrowthData.map((item) => item.value),
    1
  );

  // =========================================================
  // RECENT SYSTEM ACTIVITY
  // =========================================================

  const recentActivities = auditEvents.slice(0, 5).map((event, index) => {
    const actor = users.find((user) => user.id === event.actorUserId);

    const actorLabel =
      actor?.email || actor?.profileId || event.actorUserId || "System";

    let actionLabel = event.action || "System activity";

    switch (event.action) {
      case "LOGIN":
        actionLabel = "User logged into the system";
        break;

      case "LOGOUT":
        actionLabel = "User logged out of the system";
        break;

      case "SUBMIT":
        actionLabel = "New submission recorded";
        break;

      case "CREATE":
        actionLabel = "New record created";
        break;

      case "UPDATE":
        actionLabel = "System record updated";
        break;

      case "APPROVE":
        actionLabel = "Record approved";
        break;

      case "REJECT":
        actionLabel = "Record rejected";
        break;

      case "UPLOAD":
        actionLabel = "Document uploaded";
        break;

      case "DEPLOY":
        actionLabel = "Intern deployed";
        break;

      default:
        break;
    }

    const timestamp = event.timestamp ? new Date(event.timestamp) : null;

    const time = timestamp
      ? timestamp.toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })
      : "Unknown time";

    return {
      id: event.id || index,
      action: actionLabel,
      user: actorLabel,
      time,
      type: event.module || event.targetEntityType || "System",
    };
  });

  // =========================================================
  // THEME CLASSES
  // =========================================================

  const pageTitleClass = darkMode ? "text-slate-100" : "text-slate-900";

  const bodyTextClass = darkMode ? "text-slate-400" : "text-slate-500";

  const panelClass = darkMode
    ? "bg-slate-900 border-slate-700"
    : "bg-white border-slate-200";

  const cardClass = darkMode
    ? "bg-slate-800 border-slate-700"
    : "bg-white border-slate-200";

  // =========================================================
  // RETURN
  // =========================================================

  return (
    <div className="w-full min-h-full p-3 sm:p-5 md:p-6 lg:p-8">
      <div className="max-w-[1400px] mx-auto">
        {/* =====================================================
            PAGE HEADER
        ===================================================== */}

        <div className="mb-5 sm:mb-6">
          <p
            className={`text-[10px] sm:text-xs uppercase tracking-widest font-bold mb-1 ${
              darkMode ? "text-slate-500" : "text-slate-400"
            }`}
          >
            Administrator Portal
          </p>

          <h1 className={`text-xl sm:text-2xl font-black ${pageTitleClass}`}>
            Admin Dashboard
          </h1>

          <p className={`text-xs sm:text-sm mt-1 ${bodyTextClass}`}>
            Monitor system activity, users, internships, and reports.
          </p>
        </div>

        {/* =====================================================
            SYSTEM OVERVIEW
        ===================================================== */}

        <section
          className={`
            border
            rounded-xl
            p-4
            sm:p-5
            mb-5
            ${panelClass}
          `}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2
                className={`text-sm sm:text-base font-bold ${pageTitleClass}`}
              >
                System Overview
              </h2>

              <p className={`text-[10px] sm:text-xs mt-1 ${bodyTextClass}`}>
                Current status of the SIMS platform.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />

              <span
                className={`text-[10px] sm:text-xs font-medium ${
                  darkMode ? "text-emerald-400" : "text-emerald-600"
                }`}
              >
                All Systems Operational
              </span>
            </div>
          </div>
        </section>

        {/* =====================================================
            OVERVIEW CARDS
        ===================================================== */}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5">
          {overviewCards.map((card) => (
            <div
              key={card.title}
              className={`
                border
                rounded-xl
                p-4
                sm:p-5
                ${cardClass}
              `}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p
                    className={`text-[10px] sm:text-xs font-semibold ${bodyTextClass}`}
                  >
                    {card.title}
                  </p>

                  <p
                    className={`
                      text-2xl
                      sm:text-3xl
                      font-black
                      mt-2
                      ${pageTitleClass}
                    `}
                  >
                    {card.value}
                  </p>

                  <p
                    className={`text-[9px] sm:text-[10px] mt-1 ${bodyTextClass}`}
                  >
                    {card.description}
                  </p>
                </div>

                <div
                  className={`
                    hidden sm:flex
                    w-9 h-9
                    rounded-lg
                    items-center
                    justify-center
                    text-sm
                    flex-shrink-0
                    ${darkMode ? "bg-slate-700" : "bg-slate-100"}
                  `}
                >
                  {card.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* =====================================================
            CHARTS
        ===================================================== */}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-5">
          {/* ===================================================
              USER GROWTH
          =================================================== */}

          <section
            className={`
              border
              rounded-xl
              p-4
              sm:p-5
              ${panelClass}
            `}
          >
            <div className="mb-4">
              <h2
                className={`text-sm sm:text-base font-bold ${pageTitleClass}`}
              >
                User Growth
              </h2>

              <p className={`text-[10px] sm:text-xs mt-1 ${bodyTextClass}`}>
                Registered users over the past months.
              </p>
            </div>

            <div className="h-56 sm:h-64 relative">
              {/* GRID */}

              <div className="absolute inset-0 flex flex-col justify-between">
                {[1, 2, 3, 4, 5].map((line) => (
                  <div
                    key={line}
                    className={`border-t ${
                      darkMode ? "border-slate-700" : "border-slate-100"
                    }`}
                  />
                ))}
              </div>

              {/* CHART BARS */}

              <div className="absolute inset-x-0 bottom-0 top-3 flex items-end justify-around gap-2 px-2">
                {userGrowthData.map((item) => (
                  <div
                    key={item.month}
                    className="flex flex-col items-center justify-end h-full flex-1"
                  >
                    <div
                      className={`
                        w-full
                        max-w-10
                        rounded-t-lg
                        transition-all
                        ${darkMode ? "bg-slate-300" : "bg-slate-800"}
                      `}
                      style={{
                        height: `${(item.value / maxGrowthValue) * 100}%`,
                      }}
                    />

                    <span className={`text-[9px] mt-2 ${bodyTextClass}`}>
                      {item.month}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ===================================================
              INTERNSHIP DISTRIBUTION
          =================================================== */}

          <section
            className={`
              border
              rounded-xl
              p-4
              sm:p-5
              ${panelClass}
            `}
          >
            <div className="mb-4">
              <h2
                className={`text-sm sm:text-base font-bold ${pageTitleClass}`}
              >
                Internship Distribution
              </h2>

              <p className={`text-[10px] sm:text-xs mt-1 ${bodyTextClass}`}>
                Current internship assignment status.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 h-56 sm:h-64">
              {/* DONUT */}

              <div className="relative w-40 h-40 flex-shrink-0">
                {totalAssignments > 0 ? (
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: `conic-gradient(
                        #1e293b 0deg ${activeDegrees}deg,
                        #64748b ${activeDegrees}deg ${
                        activeDegrees + pendingDegrees
                      }deg,
                        #cbd5e1 ${activeDegrees + pendingDegrees}deg 360deg
                      )`,
                    }}
                  />
                ) : (
                  <div
                    className={`absolute inset-0 rounded-full ${
                      darkMode ? "bg-slate-700" : "bg-slate-200"
                    }`}
                  />
                )}

                <div
                  className={`
                    absolute
                    inset-7
                    rounded-full
                    flex
                    flex-col
                    items-center
                    justify-center
                    ${darkMode ? "bg-slate-900" : "bg-white"}
                  `}
                >
                  <span className={`text-2xl font-black ${pageTitleClass}`}>
                    {totalAssignments}
                  </span>

                  <span className={`text-[9px] ${bodyTextClass}`}>Total</span>
                </div>
              </div>

              {/* LEGEND */}

              <div className="space-y-3 w-full max-w-[180px]">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-800" />

                    <span className={`text-xs ${bodyTextClass}`}>Active</span>
                  </div>

                  <span className={`text-xs font-bold ${pageTitleClass}`}>
                    {activeCount}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />

                    <span className={`text-xs ${bodyTextClass}`}>Pending</span>
                  </div>

                  <span className={`text-xs font-bold ${pageTitleClass}`}>
                    {pendingCount}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />

                    <span className={`text-xs ${bodyTextClass}`}>
                      Completed
                    </span>
                  </div>

                  <span className={`text-xs font-bold ${pageTitleClass}`}>
                    {completedCount}
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* =====================================================
            RECENT SYSTEM ACTIVITY
        ===================================================== */}

        <section
          className={`
            border
            rounded-xl
            overflow-hidden
            ${panelClass}
          `}
        >
          <div className="p-4 sm:p-5">
            <h2 className={`text-sm sm:text-base font-bold ${pageTitleClass}`}>
              Recent System Activity
            </h2>

            <p className={`text-[10px] sm:text-xs mt-1 ${bodyTextClass}`}>
              Latest activities performed within the system.
            </p>
          </div>

          {/* DESKTOP TABLE */}

          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr
                  className={`
                    border-y
                    ${
                      darkMode
                        ? "border-slate-700 bg-slate-800"
                        : "border-slate-200 bg-slate-50"
                    }
                  `}
                >
                  <th
                    className={`px-5 py-3 text-[10px] uppercase tracking-wider font-bold ${bodyTextClass}`}
                  >
                    Activity
                  </th>

                  <th
                    className={`px-5 py-3 text-[10px] uppercase tracking-wider font-bold ${bodyTextClass}`}
                  >
                    User / Entity
                  </th>

                  <th
                    className={`px-5 py-3 text-[10px] uppercase tracking-wider font-bold ${bodyTextClass}`}
                  >
                    Type
                  </th>

                  <th
                    className={`px-5 py-3 text-[10px] uppercase tracking-wider font-bold text-right ${bodyTextClass}`}
                  >
                    Time
                  </th>
                </tr>
              </thead>

              <tbody>
                {recentActivities.length > 0 ? (
                  recentActivities.map((activity) => (
                    <tr
                      key={activity.id}
                      className={`
                        border-b last:border-b-0
                        ${
                          darkMode
                            ? "border-slate-700 hover:bg-slate-800"
                            : "border-slate-100 hover:bg-slate-50"
                        }
                      `}
                    >
                      <td
                        className={`px-5 py-3.5 text-xs font-semibold ${pageTitleClass}`}
                      >
                        {activity.action}
                      </td>

                      <td className={`px-5 py-3.5 text-xs ${bodyTextClass}`}>
                        {activity.user}
                      </td>

                      <td className="px-5 py-3.5">
                        <span
                          className={`
                            inline-flex
                            px-2.5
                            py-1
                            rounded-full
                            text-[9px]
                            font-bold
                            ${
                              darkMode
                                ? "bg-slate-700 text-slate-300"
                                : "bg-slate-100 text-slate-600"
                            }
                          `}
                        >
                          {activity.type}
                        </span>
                      </td>

                      <td
                        className={`px-5 py-3.5 text-xs text-right ${bodyTextClass}`}
                      >
                        {activity.time}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="4"
                      className={`px-5 py-8 text-center text-xs ${bodyTextClass}`}
                    >
                      No system activity recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* MOBILE ACTIVITY LIST */}

          <div className="sm:hidden">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className={`
                    p-4
                    border-t
                    ${darkMode ? "border-slate-700" : "border-slate-100"}
                  `}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className={`text-xs font-bold ${pageTitleClass}`}>
                        {activity.action}
                      </p>

                      <p className={`text-[10px] mt-1 ${bodyTextClass}`}>
                        {activity.user}
                      </p>
                    </div>

                    <span
                      className={`
                        flex-shrink-0
                        px-2
                        py-1
                        rounded-full
                        text-[8px]
                        font-bold
                        ${
                          darkMode
                            ? "bg-slate-700 text-slate-300"
                            : "bg-slate-100 text-slate-600"
                        }
                      `}
                    >
                      {activity.type}
                    </span>
                  </div>

                  <p className={`text-[9px] mt-2 ${bodyTextClass}`}>
                    {activity.time}
                  </p>
                </div>
              ))
            ) : (
              <div className={`p-6 text-center text-xs ${bodyTextClass}`}>
                No system activity recorded yet.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
