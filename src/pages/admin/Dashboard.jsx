import React, { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "../../supabaseClient";

// =========================================================
// ADMIN DASHBOARD
// =========================================================
//
// Admin focuses on:
// - System users
// - Pending system items
// - Reports / system monitoring
// - Recent system activity
//
// Internship operational monitoring is intentionally excluded.
// Active internships, assignments, and deployment are handled
// by the Registrar portal.
// =========================================================

const Dashboard = () => {
  const { darkMode } = useOutletContext();

  // =========================================================
  // STATE
  // =========================================================

  const [users, setUsers] = useState([]);
  const [applications, setApplications] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================================================
  // LOAD DASHBOARD DATA
  // =========================================================

  useEffect(() => {
    let mounted = true;

    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError("");

        // ---------------------------------------------------
        // USERS
        // ---------------------------------------------------

        const usersPromise = supabase
          .from("users")
          .select(
            "id, role, email, first_name, middle_name, last_name, status, created_at"
          )
          .order("created_at", { ascending: false });

        // ---------------------------------------------------
        // APPLICATIONS
        // ---------------------------------------------------
        //
        // Applications are currently used only to determine
        // pending items shown on the dashboard.
        //
        // Internship deployment/assignment data is intentionally
        // NOT loaded here because that belongs to Registrar.
        // ---------------------------------------------------

        const applicationsPromise = supabase
          .from("applications")
          .select(
            "id, status, submitted_at, created_at, student_id, opportunity_id"
          )
          .order("submitted_at", { ascending: false });

        const [usersResult, applicationsResult] =
          await Promise.all([
            usersPromise,
            applicationsPromise,
          ]);

        if (usersResult.error) {
          throw new Error(
            `Unable to load users: ${usersResult.error.message}`
          );
        }

        if (applicationsResult.error) {
          throw new Error(
            `Unable to load applications: ${applicationsResult.error.message}`
          );
        }

        if (!mounted) return;

        setUsers(usersResult.data || []);
        setApplications(applicationsResult.data || []);
      } catch (err) {
        console.error("Admin Dashboard loading error:", err);

        if (!mounted) return;

        setError(
          err?.message ||
            "Unable to load dashboard data. Please try again."
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadDashboardData();

    return () => {
      mounted = false;
    };
  }, []);

  // =========================================================
  // SYSTEM COUNTS
  // =========================================================

  // ---------------------------------------------------------
  // TOTAL USERS
  // ---------------------------------------------------------
  //
  // Admin accounts are excluded because they are system
  // administrator accounts rather than regular SIMS users.
  //
  // Included:
  // - Student
  // - Registrar
  // - Company
  //
  // Excluded:
  // - Admin
  // ---------------------------------------------------------

  const totalUsers = users.filter(
    (user) => user.role !== "admin"
  ).length;

  // ---------------------------------------------------------
  // PENDING
  // ---------------------------------------------------------
  //
  // Current application-related items awaiting processing.
  //
  // These statuses match the current SIMS application workflow.
  // ---------------------------------------------------------

  const pendingApplications = applications.filter(
    (application) => {
      const status = String(
        application.status || ""
      ).toLowerCase();

      return [
        "pending",
        "submitted",
        "under_review",
        "information_requested",
        "info_requested",
      ].includes(status);
    }
  ).length;

  // ---------------------------------------------------------
  // REPORTS
  // ---------------------------------------------------------
  //
  // audit_logs does not exist yet.
  // Keep this at 0 until a proper reporting/audit system
  // is implemented.
  // ---------------------------------------------------------

  const reportsCount = 0;

  // =========================================================
  // OVERVIEW CARDS
  // =========================================================

  const overviewCards = [
    {
      title: "Total Users",
      value: totalUsers,
      description: "Students, registrars, and companies",
      icon: "👥",
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
  // USER GROWTH
  // =========================================================
  //
  // Uses the real users.created_at values.
  //
  // Admin accounts are excluded from the chart, just like the
  // Total Users count.
  //
  // The chart shows cumulative registered regular users at
  // the end of each of the last six calendar months.
  // =========================================================

  const userGrowthData = useMemo(() => {
    const regularUsers = users.filter(
      (user) => user.role !== "admin"
    );

    const now = new Date();

    const months = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(
        now.getFullYear(),
        now.getMonth() - i,
        1
      );

      months.push({
        year: date.getFullYear(),
        monthIndex: date.getMonth(),
        month: date.toLocaleString("en-US", {
          month: "short",
        }),
      });
    }

    return months.map((month) => {
      const endOfMonth = new Date(
        month.year,
        month.monthIndex + 1,
        0,
        23,
        59,
        59,
        999
      );

      const value = regularUsers.filter((user) => {
        if (!user.created_at) return false;

        const createdAt = new Date(user.created_at);

        return createdAt <= endOfMonth;
      }).length;

      return {
        month: month.month,
        value,
      };
    });
  }, [users]);

  const maxGrowthValue = Math.max(
    ...userGrowthData.map((item) => item.value),
    1
  );

  // =========================================================
  // RECENT SYSTEM ACTIVITY
  // =========================================================
  //
  // audit_logs does not exist yet.
  //
  // For now, recent activity is derived from actual records:
  // - User registrations
  // - Application submissions/status changes
  //
  // Once audit_logs is created, this section can be replaced
  // with the real audit trail.
  // =========================================================

  const recentActivities = useMemo(() => {
    const activities = [];

    // -------------------------------------------------------
    // USER REGISTRATIONS
    // -------------------------------------------------------

    users.forEach((user) => {
      // Admin registrations are not included in regular user
      // activity because Admin is treated as a system account.
      if (user.role === "admin") return;

      if (!user.created_at) return;

      const fullName = [
        user.first_name,
        user.middle_name,
        user.last_name,
      ]
        .filter(Boolean)
        .join(" ")
        .trim();

      activities.push({
        id: `user-${user.id}`,
        action: "New user registered",
        user:
          fullName ||
          user.email ||
          "Unknown user",
        timeValue: new Date(user.created_at),
        type: "User",
      });
    });

    // -------------------------------------------------------
    // APPLICATIONS
    // -------------------------------------------------------

    applications.forEach((application) => {
      const dateValue =
        application.submitted_at ||
        application.created_at;

      if (!dateValue) return;

      const status = String(
        application.status || ""
      ).toLowerCase();

      let action = "Application updated";

      switch (status) {
        case "pending":
          action = "Application pending";
          break;

        case "submitted":
          action = "Application submitted";
          break;

        case "under_review":
          action = "Application under review";
          break;

        case "information_requested":
        case "info_requested":
          action = "Additional information requested";
          break;

        case "approved":
          action = "Application approved";
          break;

        case "rejected":
          action = "Application rejected";
          break;

        case "withdrawn":
          action = "Application withdrawn";
          break;

        default:
          break;
      }

      activities.push({
        id: `application-${application.id}`,
        action,
        user: "Student application",
        timeValue: new Date(dateValue),
        type: "Application",
      });
    });

    // -------------------------------------------------------
    // SORT + LIMIT
    // -------------------------------------------------------

    return activities
      .filter(
        (activity) =>
          activity.timeValue &&
          !Number.isNaN(activity.timeValue.getTime())
      )
      .sort(
        (a, b) =>
          b.timeValue.getTime() -
          a.timeValue.getTime()
      )
      .slice(0, 5)
      .map((activity) => ({
        ...activity,
        time: activity.timeValue.toLocaleString(
          "en-US",
          {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          }
        ),
      }));
  }, [users, applications]);

  // =========================================================
  // THEME CLASSES
  // =========================================================

  const pageTitleClass = darkMode
    ? "text-slate-100"
    : "text-slate-900";

  const bodyTextClass = darkMode
    ? "text-slate-400"
    : "text-slate-500";

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
              darkMode
                ? "text-slate-500"
                : "text-slate-400"
            }`}
          >
            Administrator Portal
          </p>

          <h1
            className={`text-xl sm:text-2xl font-black ${pageTitleClass}`}
          >
            Admin Dashboard
          </h1>

          <p
            className={`text-xs sm:text-sm mt-1 ${bodyTextClass}`}
          >
            Monitor system users, pending items, and system
            activity.
          </p>
        </div>

        {/* =====================================================
            ERROR
        ===================================================== */}

        {error && (
          <div
            className={`border rounded-xl p-4 mb-5 ${
              darkMode
                ? "bg-red-950/30 border-red-900 text-red-300"
                : "bg-red-50 border-red-200 text-red-600"
            }`}
          >
            <p className="text-xs font-semibold">
              Unable to load dashboard data
            </p>

            <p className="text-[10px] mt-1 opacity-80">
              {error}
            </p>
          </div>
        )}

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

              <p
                className={`text-[10px] sm:text-xs mt-1 ${bodyTextClass}`}
              >
                Current status of the SIMS platform.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />

              <span
                className={`text-[10px] sm:text-xs font-medium ${
                  darkMode
                    ? "text-emerald-400"
                    : "text-emerald-600"
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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-5">
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
                    {loading ? "—" : card.value}
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
                    ${
                      darkMode
                        ? "bg-slate-700"
                        : "bg-slate-100"
                    }
                  `}
                >
                  {card.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* =====================================================
            USER GROWTH
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
          <div className="mb-4">
            <h2
              className={`text-sm sm:text-base font-bold ${pageTitleClass}`}
            >
              User Growth
            </h2>

            <p
              className={`text-[10px] sm:text-xs mt-1 ${bodyTextClass}`}
            >
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
                    darkMode
                      ? "border-slate-700"
                      : "border-slate-100"
                  }`}
                />
              ))}
            </div>

            {/* CHART BARS */}

            <div className="absolute inset-x-0 bottom-0 top-3 flex items-end justify-around gap-2 px-2">
              {userGrowthData.map((item) => (
                <div
                  key={`${item.month}-${item.value}`}
                  className="flex flex-col items-center justify-end h-full flex-1"
                >
                  <div
                    className={`
                      w-full
                      max-w-10
                      rounded-t-lg
                      transition-all
                      ${
                        darkMode
                          ? "bg-slate-300"
                          : "bg-slate-800"
                      }
                    `}
                    style={{
                      height:
                        item.value > 0
                          ? `${(item.value / maxGrowthValue) * 100}%`
                          : "0%",
                    }}
                  />

                  <span
                    className={`text-[9px] mt-2 ${bodyTextClass}`}
                  >
                    {item.month}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

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
            <h2
              className={`text-sm sm:text-base font-bold ${pageTitleClass}`}
            >
              Recent System Activity
            </h2>

            <p
              className={`text-[10px] sm:text-xs mt-1 ${bodyTextClass}`}
            >
              Latest activities recorded within the system.
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
                {loading ? (
                  <tr>
                    <td
                      colSpan="4"
                      className={`px-5 py-8 text-center text-xs ${bodyTextClass}`}
                    >
                      Loading system activity...
                    </td>
                  </tr>
                ) : recentActivities.length > 0 ? (
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

                      <td
                        className={`px-5 py-3.5 text-xs ${bodyTextClass}`}
                      >
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
            {loading ? (
              <div
                className={`p-6 text-center text-xs ${bodyTextClass}`}
              >
                Loading system activity...
              </div>
            ) : recentActivities.length > 0 ? (
              recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className={`
                    p-4
                    border-t
                    ${
                      darkMode
                        ? "border-slate-700"
                        : "border-slate-100"
                    }
                  `}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p
                        className={`text-xs font-bold ${pageTitleClass}`}
                      >
                        {activity.action}
                      </p>

                      <p
                        className={`text-[10px] mt-1 ${bodyTextClass}`}
                      >
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

                  <p
                    className={`text-[9px] mt-2 ${bodyTextClass}`}
                  >
                    {activity.time}
                  </p>
                </div>
              ))
            ) : (
              <div
                className={`p-6 text-center text-xs ${bodyTextClass}`}
              >
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

