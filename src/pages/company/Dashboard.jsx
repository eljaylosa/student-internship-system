import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { supabaseCompany } from "../../supabaseClient";

const Dashboard = () => {
  const { darkMode } = useOutletContext();
  const navigate = useNavigate();

  // =========================================================
  // STATE
  // =========================================================

  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState(null);

  const [activeInterns, setActiveInterns] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [applications, setApplications] = useState([]);

  const [error, setError] = useState("");

  // =========================================================
  // LOAD DASHBOARD DATA
  // =========================================================

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      // -------------------------------------------------------
      // GET AUTHENTICATED USER
      // -------------------------------------------------------

      const {
        data: { user },
        error: authError,
      } = await supabaseCompany.auth.getUser();

      if (authError) throw authError;

      if (!user) {
        throw new Error("No authenticated user found.");
      }

      // -------------------------------------------------------
      // GET COMPANY
      // -------------------------------------------------------

      const { data: companyData, error: companyError } =
        await supabaseCompany
          .from("companies")
          .select(`
            id,
            user_id,
            company_name,
            company_email,
            company_phone,
            company_address,
            website,
            industry,
            designation,
            status
          `)
          .eq("user_id", user.id)
          .maybeSingle();

      if (companyError) throw companyError;

      if (!companyData) {
        throw new Error(
          "Your company profile could not be found."
        );
      }

      setCompany(companyData);

      // =======================================================
      // LOAD ACTIVE INTERNS
      // =======================================================

      const {
        data: assignmentData,
        error: assignmentError,
      } = await supabaseCompany
        .from("assignments")
        .select(`
          id,
          student_id,
          opportunity_id,
          company_id,
          status,
          start_date,
          end_date,
          deployed_at,
          created_at,
          updated_at,
          students (
            id,
            student_id,
            program,
            year_level,
            department,
            users (
              id,
              email,
              first_name,
              middle_name,
              last_name
            )
          ),
          opportunities (
            id,
            title,
            position_type,
            location,
            status
          )
        `)
        .eq("company_id", companyData.id)
        .eq("status", "active")
        .order("updated_at", { ascending: false });

      if (assignmentError) throw assignmentError;

      // -------------------------------------------------------
      // FORMAT ACTIVE INTERNS
      // -------------------------------------------------------

      const formattedInterns = (assignmentData || []).map(
        (assignment) => {
          const student = assignment.students;
          const userRecord = student?.users;
          const opportunity = assignment.opportunities;

          const fullName = [
            userRecord?.first_name,
            userRecord?.middle_name,
            userRecord?.last_name,
          ]
            .filter(Boolean)
            .join(" ");

          return {
            id: assignment.id,
            studentId: student?.student_id || "N/A",
            name: fullName || "Unknown Student",
            email: userRecord?.email || "No email",
            position:
              opportunity?.title ||
              "No internship opportunity",
            positionType:
              opportunity?.position_type || "N/A",
            location:
              opportunity?.location || "N/A",
            status: assignment.status,
            startDate: assignment.start_date,
            endDate: assignment.end_date,
            deployedAt: assignment.deployed_at,
            studentUuid: assignment.student_id,
            opportunityId: assignment.opportunity_id,
          };
        }
      );

      setActiveInterns(formattedInterns);

      // =======================================================
      // LOAD COMPANY EVALUATIONS
      // =======================================================

      const {
        data: evaluationData,
        error: evaluationError,
      } = await supabaseCompany
        .from("evaluations")
        .select(`
          id,
          assignment_id,
          evaluator_id,
          evaluated_student_id,
          evaluated_company_id,
          evaluator_role,
          status,
          overall_rating,
          comments,
          submitted_at,
          finalized_at,
          created_at,
          updated_at
        `)
        .eq("evaluator_id", user.id)
        .eq("evaluator_role", "company_supervisor")
        .order("updated_at", { ascending: false });

      if (evaluationError) throw evaluationError;

      const companyEvaluations = (evaluationData || []).filter(
        (evaluation) =>
          !evaluation.evaluated_company_id ||
          evaluation.evaluated_company_id === companyData.id
      );

      setEvaluations(companyEvaluations);

      // =======================================================
      // LOAD COMPANY APPLICATIONS
      // =======================================================
      //
      // applications
      //      ↓
      // opportunity_id
      //      ↓
      // opportunities.company_id
      //
      // We load applications through the company's opportunities.
      // =======================================================

      const {
        data: applicationData,
        error: applicationError,
      } = await supabaseCompany
        .from("applications")
        .select(`
          id,
          student_id,
          opportunity_id,
          status,
          cover_letter,
          submitted_at,
          created_at,
          updated_at,
          opportunities!inner (
            id,
            company_id,
            title
          ),
          students (
            id,
            student_id,
            users (
              id,
              first_name,
              middle_name,
              last_name,
              email
            )
          )
        `)
        .eq(
          "opportunities.company_id",
          companyData.id
        )
        .order("updated_at", { ascending: false });

      if (applicationError) throw applicationError;

      setApplications(applicationData || []);
    } catch (err) {
      console.error("Company Dashboard Error:", err);

      setError(
        err?.message ||
          "Something went wrong while loading the dashboard."
      );

      setCompany(null);
      setActiveInterns([]);
      setEvaluations([]);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // =========================================================
  // PENDING APPLICATIONS
  // =========================================================

  const pendingApplications = useMemo(() => {
    return applications.filter((application) => {
      const status = application.status?.toLowerCase();

      return (
        status === "submitted" ||
        status === "info_requested"
      );
    });
  }, [applications]);

  // =========================================================
  // PENDING EVALUATIONS
  // =========================================================

  const pendingEvaluations = useMemo(() => {
    return evaluations.filter((evaluation) => {
      const status = evaluation.status?.toLowerCase();

      return (
        status === "draft" ||
        status === "returned"
      );
    });
  }, [evaluations]);

  // =========================================================
  // INTERNSHIPS ENDING SOON
  // =========================================================
  //
  // "Ending Soon" = active assignment whose end date is
  // within the next 30 days.
  //
  // Already-ended assignments are not included.
  // =========================================================

  const internshipsEndingSoon = useMemo(() => {
    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setDate(
      thirtyDaysFromNow.getDate() + 30
    );

    return activeInterns.filter((intern) => {
      if (!intern.endDate) return false;

      const endDate = new Date(
        `${intern.endDate}T00:00:00`
      );

      if (Number.isNaN(endDate.getTime())) {
        return false;
      }

      return (
        endDate >= today &&
        endDate <= thirtyDaysFromNow
      );
    });
  }, [activeInterns]);

  // =========================================================
  // DASHBOARD ANALYTICS
  // =========================================================

  const analyticsCards = [
    {
      title: "Active Interns",
      count: activeInterns.length,
    },
    {
      title: "Pending Applications",
      count: pendingApplications.length,
    },
    {
      title: "Ending Soon",
      count: internshipsEndingSoon.length,
    },
  ];

  // =========================================================
  // STATUS HELPERS
  // =========================================================

  const getInternStatusClass = (status) => {
    const normalizedStatus = status?.toLowerCase();

    if (darkMode) {
      if (normalizedStatus === "active") {
        return "bg-emerald-900/40 text-emerald-300 border-emerald-800";
      }

      if (normalizedStatus === "completed") {
        return "bg-blue-900/40 text-blue-300 border-blue-800";
      }

      if (normalizedStatus === "suspended") {
        return "bg-amber-900/40 text-amber-300 border-amber-800";
      }

      if (normalizedStatus === "terminated") {
        return "bg-red-900/40 text-red-300 border-red-800";
      }

      return "bg-slate-800 text-slate-400 border-slate-700";
    }

    if (normalizedStatus === "active") {
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }

    if (normalizedStatus === "completed") {
      return "bg-blue-50 text-blue-700 border-blue-200";
    }

    if (normalizedStatus === "suspended") {
      return "bg-amber-50 text-amber-700 border-amber-200";
    }

    if (normalizedStatus === "terminated") {
      return "bg-red-50 text-red-700 border-red-200";
    }

    return "bg-slate-100 text-slate-500 border-slate-200";
  };

  // =========================================================
  // DATE FORMATTER
  // =========================================================

  const formatDate = (date) => {
    if (!date) return "Not set";

    const parsed = new Date(`${date}T00:00:00`);

    if (Number.isNaN(parsed.getTime())) {
      return "Not set";
    }

    return parsed.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // =========================================================
  // THEME CLASSES
  // =========================================================

  const headingClass = darkMode
    ? "text-slate-100"
    : "text-slate-900";

  const mutedClass = darkMode
    ? "text-slate-400"
    : "text-slate-500";

  const cardClass = darkMode
    ? "bg-slate-900 border-slate-700"
    : "bg-white border-slate-200";

  const tableHeaderClass = darkMode
    ? "bg-slate-800 text-slate-300 border-slate-700"
    : "bg-slate-50 text-slate-600 border-slate-200";

  const tableRowClass = darkMode
    ? "border-slate-700"
    : "border-slate-200";

  const tableTextClass = darkMode
    ? "text-slate-200"
    : "text-slate-700";

  // =========================================================
  // QUICK ACTIONS
  // =========================================================

  const handleEvaluateIntern = () => {
    navigate("/company/evaluate");
  };

  const handleSubmitFeedback = () => {
    navigate("/company/feedback");
  };

  const handlePostPosition = () => {
    navigate("/company/jobs");
  };

  const handleViewInterns = () => {
    navigate("/company/interns");
  };

  const handleViewApplications = () => {
    navigate("/company/applications");
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="w-full min-h-full p-4 sm:p-5 md:p-6 lg:p-8">
        <div className="max-w-[1400px] mx-auto">
          <div className="mb-6">
            <div
              className={`h-3 w-24 rounded ${
                darkMode
                  ? "bg-slate-800"
                  : "bg-slate-200"
              }`}
            />

            <div
              className={`h-8 w-64 rounded mt-3 ${
                darkMode
                  ? "bg-slate-800"
                  : "bg-slate-200"
              }`}
            />

            <div
              className={`h-4 w-96 max-w-full rounded mt-2 ${
                darkMode
                  ? "bg-slate-800"
                  : "bg-slate-200"
              }`}
            />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className={`border rounded-xl p-5 min-h-[120px] animate-pulse ${cardClass}`}
              >
                <div
                  className={`h-8 w-12 mx-auto rounded ${
                    darkMode
                      ? "bg-slate-800"
                      : "bg-slate-200"
                  }`}
                />

                <div
                  className={`h-3 w-24 mx-auto rounded mt-4 ${
                    darkMode
                      ? "bg-slate-800"
                      : "bg-slate-200"
                  }`}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // ERROR
  // =========================================================

  if (error) {
    return (
      <div className="w-full min-h-full p-4 sm:p-5 md:p-6 lg:p-8">
        <div className="max-w-[1400px] mx-auto">
          <div
            className={`border rounded-xl p-5 ${
              darkMode
                ? "bg-red-950/20 border-red-900/60"
                : "bg-red-50 border-red-200"
            }`}
          >
            <h2
              className={`text-base font-bold ${
                darkMode
                  ? "text-red-300"
                  : "text-red-700"
              }`}
            >
              Unable to load dashboard
            </h2>

            <p
              className={`text-xs mt-2 ${
                darkMode
                  ? "text-red-400"
                  : "text-red-600"
              }`}
            >
              {error}
            </p>

            <button
              type="button"
              onClick={loadDashboard}
              className={`mt-4 px-4 h-9 rounded-lg text-xs font-bold ${
                darkMode
                  ? "bg-slate-700 text-slate-100 hover:bg-slate-600"
                  : "bg-slate-800 text-white hover:bg-slate-700"
              }`}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="w-full min-h-full p-4 sm:p-5 md:p-6 lg:p-8">
      <div className="max-w-[1400px] mx-auto">

        {/* =====================================================
            PAGE INTRO
        ===================================================== */}

        <div className="mb-6">
          <p
            className={`text-xs uppercase tracking-widest font-bold ${mutedClass}`}
          >
            Company Portal
          </p>

          <h1
            className={`text-2xl md:text-3xl font-black mt-1 ${headingClass}`}
          >
            Company Dashboard
          </h1>

          <p className={`text-sm mt-1 ${mutedClass}`}>
            Welcome back
            {company?.company_name
              ? `, ${company.company_name}.`
              : "."}{" "}
            Monitor your interns, applications, evaluations,
            and internship activities.
          </p>
        </div>

        {/* =====================================================
            ANALYTICS CARDS
        ===================================================== */}

        <div
          className="
            grid
            grid-cols-2
            lg:grid-cols-3
            gap-3
            md:gap-4
            mb-5
          "
        >
          {analyticsCards.map((card) => (
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
              <div className="flex flex-col items-center justify-center text-center min-h-[90px]">
                <span
                  className={`
                    text-2xl
                    sm:text-3xl
                    font-black
                    ${headingClass}
                  `}
                >
                  {card.count}
                </span>

                <span
                  className={`
                    text-[10px]
                    sm:text-xs
                    mt-2
                    font-medium
                    ${mutedClass}
                  `}
                >
                  {card.title}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* =====================================================
            ACTIVE INTERNS OVERVIEW
        ===================================================== */}

        <section
          className={`
            border
            rounded-xl
            overflow-hidden
            ${cardClass}
          `}
        >
          <div className="p-4 sm:p-5">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2
                  className={`text-base sm:text-lg font-bold ${headingClass}`}
                >
                  Active Interns Overview
                </h2>

                <p className={`text-xs mt-1 ${mutedClass}`}>
                  Students currently deployed and completing
                  their internship at your company.
                </p>
              </div>

              <button
                type="button"
                onClick={handleViewInterns}
                className={`
                  hidden
                  sm:block
                  text-xs
                  font-bold
                  whitespace-nowrap
                  ${
                    darkMode
                      ? "text-slate-300 hover:text-white"
                      : "text-slate-600 hover:text-slate-900"
                  }
                `}
              >
                View All →
              </button>
            </div>

            {/* =================================================
                EMPTY STATE
            ================================================= */}

            {activeInterns.length === 0 ? (
              <div
                className={`
                  border
                  rounded-lg
                  p-8
                  text-center
                  ${
                    darkMode
                      ? "border-slate-700 bg-slate-800/40"
                      : "border-slate-200 bg-slate-50"
                  }
                `}
              >
                <p
                  className={`text-sm font-semibold ${headingClass}`}
                >
                  No active interns
                </p>

                <p className={`text-xs mt-1 ${mutedClass}`}>
                  Students assigned to your company will appear
                  here once they are deployed.
                </p>
              </div>
            ) : (
              <>
                {/* =================================================
                    DESKTOP TABLE
                ================================================= */}

                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th
                          className={`
                            text-left
                            px-4
                            py-3
                            text-[10px]
                            uppercase
                            tracking-wide
                            font-bold
                            border
                            ${tableHeaderClass}
                          `}
                        >
                          Student ID
                        </th>

                        <th
                          className={`
                            text-left
                            px-4
                            py-3
                            text-[10px]
                            uppercase
                            tracking-wide
                            font-bold
                            border
                            ${tableHeaderClass}
                          `}
                        >
                          Student Name
                        </th>

                        <th
                          className={`
                            text-left
                            px-4
                            py-3
                            text-[10px]
                            uppercase
                            tracking-wide
                            font-bold
                            border
                            ${tableHeaderClass}
                          `}
                        >
                          Position
                        </th>

                        <th
                          className={`
                            text-left
                            px-4
                            py-3
                            text-[10px]
                            uppercase
                            tracking-wide
                            font-bold
                            border
                            ${tableHeaderClass}
                          `}
                        >
                          Internship Period
                        </th>

                        <th
                          className={`
                            text-left
                            px-4
                            py-3
                            text-[10px]
                            uppercase
                            tracking-wide
                            font-bold
                            border
                            ${tableHeaderClass}
                          `}
                        >
                          Status
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {activeInterns.map((intern) => (
                        <tr
                          key={intern.id}
                          className={`border ${tableRowClass}`}
                        >
                          <td
                            className={`
                              px-4
                              py-4
                              text-xs
                              border
                              ${tableRowClass}
                              ${tableTextClass}
                            `}
                          >
                            {intern.studentId}
                          </td>

                          <td
                            className={`
                              px-4
                              py-4
                              text-xs
                              font-semibold
                              border
                              ${tableRowClass}
                              ${tableTextClass}
                            `}
                          >
                            {intern.name}
                          </td>

                          <td
                            className={`
                              px-4
                              py-4
                              text-xs
                              border
                              ${tableRowClass}
                              ${mutedClass}
                            `}
                          >
                            {intern.position}
                          </td>

                          <td
                            className={`
                              px-4
                              py-4
                              text-xs
                              border
                              ${tableRowClass}
                              ${mutedClass}
                            `}
                          >
                            <div>
                              {formatDate(intern.startDate)}
                            </div>

                            <div className="mt-1">
                              → {formatDate(intern.endDate)}
                            </div>
                          </td>

                          <td
                            className={`
                              px-4
                              py-4
                              text-xs
                              border
                              ${tableRowClass}
                            `}
                          >
                            <span
                              className={`
                                inline-flex
                                px-2.5
                                py-1
                                rounded-full
                                border
                                text-[9px]
                                font-bold
                                ${getInternStatusClass(
                                  intern.status
                                )}
                              `}
                            >
                              Active
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* =================================================
                    MOBILE CARDS
                ================================================= */}

                <div className="md:hidden space-y-3">
                  {activeInterns.map((intern) => (
                    <div
                      key={intern.id}
                      className={`
                        border
                        rounded-lg
                        p-4
                        ${tableRowClass}
                        ${
                          darkMode
                            ? "bg-slate-800"
                            : "bg-slate-50"
                        }
                      `}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p
                            className={`text-sm font-bold ${headingClass}`}
                          >
                            {intern.name}
                          </p>

                          <p
                            className={`text-[10px] mt-1 ${mutedClass}`}
                          >
                            {intern.studentId}
                          </p>
                        </div>

                        <span
                          className={`
                            flex-shrink-0
                            px-2.5
                            py-1
                            rounded-full
                            border
                            text-[9px]
                            font-bold
                            ${getInternStatusClass(
                              intern.status
                            )}
                          `}
                        >
                          Active
                        </span>
                      </div>

                      <div
                        className={`
                          h-px
                          my-3
                          ${
                            darkMode
                              ? "bg-slate-700"
                              : "bg-slate-200"
                          }
                        `}
                      />

                      <p
                        className={`text-xs font-semibold ${headingClass}`}
                      >
                        {intern.position}
                      </p>

                      <p
                        className={`text-[10px] mt-2 ${mutedClass}`}
                      >
                        {formatDate(intern.startDate)}
                        {" → "}
                        {formatDate(intern.endDate)}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* MOBILE VIEW ALL */}

          {activeInterns.length > 0 && (
            <div
              className={`
                sm:hidden
                border-t
                px-4
                py-3
                ${tableRowClass}
              `}
            >
              <button
                type="button"
                onClick={handleViewInterns}
                className={`
                  w-full
                  text-xs
                  font-bold
                  ${
                    darkMode
                      ? "text-slate-300"
                      : "text-slate-600"
                  }
                `}
              >
                View All Interns →
              </button>
            </div>
          )}
        </section>

        {/* =====================================================
            ALERTS + QUICK ACTIONS
        ===================================================== */}

        <div
          className="
            grid
            grid-cols-1
            lg:grid-cols-2
            gap-4
            mt-4
          "
        >
          {/* ===================================================
              ALERTS
          =================================================== */}

          <section
            className={`
              border
              rounded-xl
              p-4
              sm:p-5
              ${cardClass}
            `}
          >
            <div className="mb-4">
              <h2
                className={`text-base font-bold ${headingClass}`}
              >
                Alerts
              </h2>

              <p className={`text-xs mt-1 ${mutedClass}`}>
                Important items that may require your attention.
              </p>
            </div>

            <div className="space-y-3">
              {/* PENDING APPLICATIONS */}

              {pendingApplications.length > 0 && (
                <button
                  type="button"
                  onClick={handleViewApplications}
                  className={`
                    w-full
                    text-left
                    border
                    rounded-lg
                    px-4
                    py-3
                    transition
                    ${
                      darkMode
                        ? "border-amber-900/60 bg-amber-950/20 hover:bg-amber-950/40"
                        : "border-amber-200 bg-amber-50 hover:bg-amber-100"
                    }
                  `}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`
                        mt-1
                        w-2
                        h-2
                        flex-shrink-0
                        rounded-full
                        ${
                          darkMode
                            ? "bg-amber-400"
                            : "bg-amber-500"
                        }
                      `}
                    />

                    <div>
                      <p
                        className={`
                          text-xs
                          font-semibold
                          ${
                            darkMode
                              ? "text-amber-300"
                              : "text-amber-700"
                          }
                        `}
                      >
                        {pendingApplications.length}{" "}
                        pending application
                        {pendingApplications.length !== 1
                          ? "s"
                          : ""}
                      </p>

                      <p
                        className={`
                          text-[10px]
                          mt-1
                          ${
                            darkMode
                              ? "text-amber-400"
                              : "text-amber-600"
                          }
                        `}
                      >
                        Applications are waiting for your
                        review.
                      </p>
                    </div>
                  </div>
                </button>
              )}

              {/* INTERNSHIPS ENDING SOON */}

              {internshipsEndingSoon.length > 0 && (
                <div
                  className={`
                    border
                    rounded-lg
                    px-4
                    py-3
                    ${
                      darkMode
                        ? "border-red-900/60 bg-red-950/20"
                        : "border-red-200 bg-red-50"
                    }
                  `}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`
                        mt-1
                        w-2
                        h-2
                        flex-shrink-0
                        rounded-full
                        ${
                          darkMode
                            ? "bg-red-400"
                            : "bg-red-500"
                        }
                      `}
                    />

                    <div>
                      <p
                        className={`
                          text-xs
                          font-semibold
                          ${
                            darkMode
                              ? "text-red-300"
                              : "text-red-700"
                          }
                        `}
                      >
                        {internshipsEndingSoon.length}{" "}
                        internship
                        {internshipsEndingSoon.length !== 1
                          ? "s are"
                          : " is"}{" "}
                        ending soon
                      </p>

                      <p
                        className={`
                          text-[10px]
                          mt-1
                          ${
                            darkMode
                              ? "text-red-400"
                              : "text-red-600"
                          }
                        `}
                      >
                        Review upcoming completion and
                        evaluation requirements.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* PENDING EVALUATIONS */}

              {pendingEvaluations.length > 0 && (
                <button
                  type="button"
                  onClick={handleEvaluateIntern}
                  className={`
                    w-full
                    text-left
                    border
                    rounded-lg
                    px-4
                    py-3
                    transition
                    ${
                      darkMode
                        ? "border-blue-900/60 bg-blue-950/20 hover:bg-blue-950/40"
                        : "border-blue-200 bg-blue-50 hover:bg-blue-100"
                    }
                  `}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`
                        mt-1
                        w-2
                        h-2
                        flex-shrink-0
                        rounded-full
                        ${
                          darkMode
                            ? "bg-blue-400"
                            : "bg-blue-500"
                        }
                      `}
                    />

                    <div>
                      <p
                        className={`
                          text-xs
                          font-semibold
                          ${
                            darkMode
                              ? "text-blue-300"
                              : "text-blue-700"
                          }
                        `}
                      >
                        {pendingEvaluations.length}{" "}
                        evaluation
                        {pendingEvaluations.length !== 1
                          ? "s"
                          : ""}{" "}
                        need attention
                      </p>

                      <p
                        className={`
                          text-[10px]
                          mt-1
                          ${
                            darkMode
                              ? "text-blue-400"
                              : "text-blue-600"
                          }
                        `}
                      >
                        Continue or update your pending
                        evaluations.
                      </p>
                    </div>
                  </div>
                </button>
              )}

              {/* NO ALERTS */}

              {pendingApplications.length === 0 &&
                internshipsEndingSoon.length === 0 &&
                pendingEvaluations.length === 0 && (
                  <div
                    className={`
                      border
                      rounded-lg
                      px-4
                      py-4
                      text-center
                      ${
                        darkMode
                          ? "border-slate-700 bg-slate-800/40"
                          : "border-slate-200 bg-slate-50"
                      }
                    `}
                  >
                    <p
                      className={`text-xs ${mutedClass}`}
                    >
                      No important alerts right now.
                    </p>
                  </div>
                )}
            </div>
          </section>

          {/* ===================================================
              QUICK ACTIONS
          =================================================== */}

          <section
            className={`
              border
              rounded-xl
              p-4
              sm:p-5
              ${cardClass}
            `}
          >
            <div className="mb-4">
              <h2
                className={`text-base font-bold ${headingClass}`}
              >
                Quick Actions
              </h2>

              <p className={`text-xs mt-1 ${mutedClass}`}>
                Quickly access common company tasks.
              </p>
            </div>

            <div className="space-y-2.5">
              {/* REVIEW APPLICATIONS */}

              <button
                type="button"
                onClick={handleViewApplications}
                className={`
                  w-full
                  h-10
                  px-4
                  rounded-lg
                  text-xs
                  font-bold
                  transition
                  ${
                    darkMode
                      ? "bg-slate-700 text-slate-100 hover:bg-slate-600"
                      : "bg-slate-800 text-white hover:bg-slate-700"
                  }
                `}
              >
                Review Applications
              </button>

              {/* EVALUATE INTERN */}

              <button
                type="button"
                onClick={handleEvaluateIntern}
                className={`
                  w-full
                  h-10
                  px-4
                  rounded-lg
                  text-xs
                  font-bold
                  transition
                  ${
                    darkMode
                      ? "bg-slate-700 text-slate-100 hover:bg-slate-600"
                      : "bg-slate-800 text-white hover:bg-slate-700"
                  }
                `}
              >
                Evaluate Intern
              </button>

              {/* POST POSITION */}

              <button
                type="button"
                onClick={handlePostPosition}
                className={`
                  w-full
                  h-10
                  px-4
                  rounded-lg
                  text-xs
                  font-bold
                  transition
                  ${
                    darkMode
                      ? "bg-slate-700 text-slate-100 hover:bg-slate-600"
                      : "bg-slate-800 text-white hover:bg-slate-700"
                  }
                `}
              >
                Post Position
              </button>
            </div>
          </section>
        </div>

        {/* =====================================================
            INTERNSHIP SUMMARY
        ===================================================== */}

        <section
          className={`
            border
            rounded-xl
            p-4
            sm:p-5
            mt-4
            ${cardClass}
          `}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2
                className={`text-base font-bold ${headingClass}`}
              >
                Internship Summary
              </h2>

              <p className={`text-xs mt-1 ${mutedClass}`}>
                Current internship activity for your company.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span
                className={`
                  px-3
                  py-1.5
                  rounded-lg
                  text-[10px]
                  font-bold
                  border
                  ${
                    darkMode
                      ? "bg-slate-800 border-slate-700 text-slate-300"
                      : "bg-slate-50 border-slate-200 text-slate-600"
                  }
                `}
              >
                {activeInterns.length} Active Intern
                {activeInterns.length !== 1 ? "s" : ""}
              </span>

              <span
                className={`
                  px-3
                  py-1.5
                  rounded-lg
                  text-[10px]
                  font-bold
                  border
                  ${
                    darkMode
                      ? "bg-slate-800 border-slate-700 text-slate-300"
                      : "bg-slate-50 border-slate-200 text-slate-600"
                  }
                `}
              >
                {pendingApplications.length} Pending
                Application
                {pendingApplications.length !== 1
                  ? "s"
                  : ""}
              </span>

              <span
                className={`
                  px-3
                  py-1.5
                  rounded-lg
                  text-[10px]
                  font-bold
                  border
                  ${
                    darkMode
                      ? "bg-slate-800 border-slate-700 text-slate-300"
                      : "bg-slate-50 border-slate-200 text-slate-600"
                  }
                `}
              >
                {internshipsEndingSoon.length} Ending Soon
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
