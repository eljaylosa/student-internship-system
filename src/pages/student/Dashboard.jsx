import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { supabaseStudent } from "../../supabaseClient";

const Dashboard = () => {
  const { darkMode } = useOutletContext();
  const navigate = useNavigate();

  // =========================================================
  // STATE
  // =========================================================

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [student, setStudent] = useState(null);
  const [applications, setApplications] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [companies, setCompanies] = useState({});
  const [opportunities, setOpportunities] = useState({});
  const [evaluations, setEvaluations] = useState([]);

  // =========================================================
  // COMMON CLASSES
  // =========================================================

  const cardClass = darkMode
    ? "bg-slate-900 border-slate-700"
    : "bg-white border-slate-200";

  const headingClass = darkMode ? "text-slate-100" : "text-slate-900";

  const mutedClass = darkMode ? "text-slate-400" : "text-slate-500";

  const innerCardClass = darkMode
    ? "bg-slate-800 border-slate-700"
    : "bg-slate-50 border-slate-200";

  // =========================================================
  // HELPERS
  // =========================================================

  const formatStatus = (status) => {
    if (!status) return "Unknown";

    return status
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const formatDate = (date) => {
    if (!date) return "—";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "—";
    }

    return parsed.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusClasses = (status) => {
    const normalized = String(status || "").toLowerCase();

    if (["approved", "active", "completed", "finalized"].includes(normalized)) {
      return darkMode
        ? "bg-emerald-950/40 text-emerald-400 border-emerald-900"
        : "bg-emerald-50 text-emerald-700 border-emerald-100";
    }

    if (
      [
        "pending",
        "submitted",
        "under_review",
        "under review",
        "draft",
        "returned",
      ].includes(normalized)
    ) {
      return darkMode
        ? "bg-amber-950/40 text-amber-400 border-amber-900"
        : "bg-amber-50 text-amber-700 border-amber-100";
    }

    if (["rejected", "terminated"].includes(normalized)) {
      return darkMode
        ? "bg-red-950/40 text-red-400 border-red-900"
        : "bg-red-50 text-red-700 border-red-100";
    }

    if (normalized === "suspended") {
      return darkMode
        ? "bg-orange-950/40 text-orange-400 border-orange-900"
        : "bg-orange-50 text-orange-700 border-orange-100";
    }

    return darkMode
      ? "bg-slate-800 text-slate-400 border-slate-700"
      : "bg-slate-100 text-slate-600 border-slate-200";
  };

  const getApplicationStatusGroup = (status) => {
    const normalized = String(status || "").toLowerCase();

    if (normalized === "draft") return "draft";

    if (
      [
        "submitted",
        "under_review",
        "under review",
        "pending",
        "info_requested",
        "info requested",
      ].includes(normalized)
    ) {
      return "review";
    }

    if (normalized === "approved") return "approved";

    if (normalized === "rejected") return "rejected";

    return "other";
  };

  // =========================================================
  // LOAD DASHBOARD
  // =========================================================

  useEffect(() => {
    let mounted = true;

    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        // -----------------------------------------------------
        // AUTH
        // -----------------------------------------------------

        const {
          data: { user },
          error: authError,
        } = await supabaseStudent.auth.getUser();

        if (authError) throw authError;

        if (!user) {
          throw new Error("Student session not found.");
        }

        // -----------------------------------------------------
        // STUDENT
        // -----------------------------------------------------

        const { data: studentData, error: studentError } = await supabaseStudent
          .from("students")
          .select(
            `
              id,
              student_id,
              program,
              year_level,
              department,
              school_id,
              users (
                id,
                email,
                first_name,
                middle_name,
                last_name
              )
            `
          )
          .eq("id", user.id)
          .maybeSingle();

        if (studentError) throw studentError;

        if (!studentData) {
          throw new Error("Student profile could not be found.");
        }

        // -----------------------------------------------------
        // APPLICATIONS
        // -----------------------------------------------------

        const { data: applicationData, error: applicationError } =
          await supabaseStudent
            .from("applications")
            .select(
              `
              id,
              student_id,
              opportunity_id,
              status,
              submitted_at,
              created_at,
              updated_at
            `
            )
            .eq("student_id", user.id)
            .order("updated_at", { ascending: false });

        if (applicationError) throw applicationError;

        const studentApplications = applicationData || [];

        // -----------------------------------------------------
        // ALL ASSIGNMENTS
        //
        // We intentionally load completed assignments too.
        // This allows the dashboard to show the student's most
        // recent completed internship and count completed
        // internships.
        // -----------------------------------------------------

        const { data: assignmentData, error: assignmentError } =
          await supabaseStudent
            .from("assignments")
            .select(
              `
              id,
              application_id,
              student_id,
              opportunity_id,
              company_id,
              status,
              start_date,
              end_date,
              deployed_at,
              created_at,
              updated_at
            `
            )
            .eq("student_id", user.id)
            .order("updated_at", { ascending: false });

        if (assignmentError) throw assignmentError;

        const studentAssignments = assignmentData || [];

        // -----------------------------------------------------
        // COMPANY DATA
        // -----------------------------------------------------

        const companyIds = [
          ...new Set(
            studentAssignments
              .map((assignment) => assignment.company_id)
              .filter(Boolean)
          ),
        ];

        let companyMap = {};

        if (companyIds.length > 0) {
          const { data: companyData, error: companyError } =
            await supabaseStudent
              .from("companies")
              .select(
                `
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
              `
              )
              .in("id", companyIds);

          if (companyError) throw companyError;

          companyMap = (companyData || []).reduce((map, company) => {
            map[company.id] = company;
            return map;
          }, {});
        }

        // -----------------------------------------------------
        // OPPORTUNITY DATA
        // -----------------------------------------------------

        const opportunityIds = [
          ...new Set(
            [
              ...studentApplications.map(
                (application) => application.opportunity_id
              ),
              ...studentAssignments.map(
                (assignment) => assignment.opportunity_id
              ),
            ].filter(Boolean)
          ),
        ];

        let opportunityMap = {};

        if (opportunityIds.length > 0) {
          const { data: opportunityData, error: opportunityError } =
            await supabaseStudent
              .from("opportunities")
              .select("*")
              .in("id", opportunityIds);

          if (opportunityError) throw opportunityError;

          opportunityMap = (opportunityData || []).reduce(
            (map, opportunity) => {
              map[opportunity.id] = opportunity;
              return map;
            },
            {}
          );
        }

        // -----------------------------------------------------
        // EVALUATIONS
        //
        // We check evaluations for all of the student's
        // assignments so completed internships can still show
        // their evaluation state.
        // -----------------------------------------------------

        const assignmentIds = studentAssignments
          .map((assignment) => assignment.id)
          .filter(Boolean);

        let evaluationData = [];

        if (assignmentIds.length > 0) {
          const { data, error: evaluationError } = await supabaseStudent
            .from("evaluations")
            .select(
              `
                id,
                assignment_id,
                template_id,
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
              `
            )
            .in("assignment_id", assignmentIds);

          if (evaluationError) throw evaluationError;

          evaluationData = data || [];
        }

        if (!mounted) return;

        setStudent(studentData);
        setApplications(studentApplications);
        setAssignments(studentAssignments);
        setCompanies(companyMap);
        setOpportunities(opportunityMap);
        setEvaluations(evaluationData);
      } catch (err) {
        console.error("Student dashboard error:", err);

        if (!mounted) return;

        setError(
          err?.message || "Something went wrong while loading your dashboard."
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, []);

  // =========================================================
  // STUDENT NAME
  // =========================================================

  const studentName = useMemo(() => {
    const user = student?.users;

    if (!user) return "Student";

    return (
      [user.first_name, user.middle_name, user.last_name]
        .filter(Boolean)
        .join(" ")
        .trim() || "Student"
    );
  }, [student]);

  // =========================================================
  // APPLICATION COUNTS
  // =========================================================

  const applicationCounts = useMemo(() => {
    const counts = {
      total: applications.length,
      draft: 0,
      review: 0,
      approved: 0,
      rejected: 0,
    };

    applications.forEach((application) => {
      const group = getApplicationStatusGroup(application.status);

      if (group === "draft") counts.draft += 1;
      if (group === "review") counts.review += 1;
      if (group === "approved") counts.approved += 1;
      if (group === "rejected") counts.rejected += 1;
    });

    return counts;
  }, [applications]);

  // =========================================================
  // COMPLETED INTERNSHIP COUNT
  // =========================================================

  const completedInternshipCount = useMemo(() => {
    return assignments.filter((assignment) => assignment.status === "completed")
      .length;
  }, [assignments]);

  // =========================================================
  // CURRENT / LATEST ASSIGNMENT
  //
  // Priority:
  // 1. Active
  // 2. Pending
  // 3. Most recent completed
  // 4. Most recent assignment
  // =========================================================

  const currentAssignment = useMemo(() => {
    if (!assignments.length) return null;

    const active = assignments.find(
      (assignment) => assignment.status === "active"
    );

    if (active) return active;

    const pending = assignments.find(
      (assignment) => assignment.status === "pending"
    );

    if (pending) return pending;

    return assignments[0];
  }, [assignments]);

  const currentCompany = currentAssignment
    ? companies[currentAssignment.company_id]
    : null;

  const currentOpportunity = currentAssignment
    ? opportunities[currentAssignment.opportunity_id]
    : null;

  // =========================================================
  // CURRENT ASSIGNMENT EVALUATIONS
  // =========================================================

  const currentEvaluations = useMemo(() => {
    if (!currentAssignment) return [];

    return evaluations.filter(
      (evaluation) => evaluation.assignment_id === currentAssignment.id
    );
  }, [evaluations, currentAssignment]);

  const studentEvaluation = currentEvaluations.find(
    (evaluation) => evaluation.evaluator_role === "student"
  );

  const companyEvaluation = currentEvaluations.find(
    (evaluation) => evaluation.evaluator_role === "company_supervisor"
  );

  // =========================================================
  // EVALUATION LABEL
  // =========================================================

  const getEvaluationStatus = () => {
    if (!currentAssignment) {
      return {
        label: "Not Available",
        status: "pending",
        description:
          "Evaluation information will appear once you have an internship placement.",
      };
    }

    if (currentAssignment.status !== "completed") {
      return {
        label: "Available After Completion",
        status: "pending",
        description:
          "Your evaluation becomes available after your internship is completed.",
      };
    }

    if (!studentEvaluation) {
      return {
        label: "Not Started",
        status: "pending",
        description:
          "Your internship is complete. Your company evaluation can now be completed.",
      };
    }

    if (studentEvaluation.status === "finalized") {
      return {
        label: "Finalized",
        status: "finalized",
        description: "Your evaluation has been finalized.",
      };
    }

    if (studentEvaluation.status === "submitted") {
      return {
        label: "Submitted",
        status: "submitted",
        description: "Your evaluation has been submitted.",
      };
    }

    if (studentEvaluation.status === "returned") {
      return {
        label: "Returned",
        status: "returned",
        description: "Your evaluation was returned for review.",
      };
    }

    return {
      label: "Draft",
      status: "draft",
      description: "Your evaluation has been saved as a draft.",
    };
  };

  const evaluationStatus = getEvaluationStatus();

  // =========================================================
  // NEXT ACTION
  // =========================================================

  const nextAction = useMemo(() => {
    // -------------------------------------------------------
    // NO INTERNSHIP
    // -------------------------------------------------------

    if (!currentAssignment) {
      if (applicationCounts.review > 0) {
        return {
          eyebrow: "Application",
          title: "Your application is under review",
          description:
            "Your internship application is currently being reviewed. Check your application status for updates.",
          button: "View Applications",
          action: () => navigate("/student/application"),
          icon: "🔎",
        };
      }

      if (applicationCounts.approved > 0) {
        return {
          eyebrow: "Placement",
          title: "Your placement is approved",
          description:
            "You have an approved internship application. Check your internship status for the next placement steps.",
          button: "View Status",
          action: () => navigate("/student/status"),
          icon: "✓",
        };
      }

      return {
        eyebrow: "Get Started",
        title: "Find your internship",
        description:
          "Browse available internship opportunities and apply to a position that matches your program.",
        button: "Browse Opportunities",
        action: () => navigate("/student/application"),
        icon: "💼",
      };
    }

    // -------------------------------------------------------
    // PENDING
    // -------------------------------------------------------

    if (currentAssignment.status === "pending") {
      return {
        eyebrow: "Placement",
        title: "Your placement is pending",
        description:
          "Your internship placement has been approved and is waiting for deployment.",
        button: "View Internship Status",
        action: () => navigate("/student/status"),
        icon: "⏳",
      };
    }

    // -------------------------------------------------------
    // ACTIVE
    // -------------------------------------------------------

    if (currentAssignment.status === "active") {
      return {
        eyebrow: "Internship",
        title: "Your internship is in progress",
        description:
          "Continue your internship and keep checking your internship status for important updates and requirements.",
        button: "View Internship Status",
        action: () => navigate("/student/status"),
        icon: "🚀",
      };
    }

    // -------------------------------------------------------
    // COMPLETED
    // -------------------------------------------------------

    if (currentAssignment.status === "completed") {
      if (!studentEvaluation) {
        return {
          eyebrow: "Evaluation",
          title: "Complete your internship evaluation",
          description:
            "Your internship has been completed. Share your experience by submitting your evaluation of the company.",
          button: "View Evaluation",
          action: () => navigate("/student/evaluation"),
          icon: "⭐",
        };
      }

      if (
        studentEvaluation.status === "draft" ||
        studentEvaluation.status === "returned"
      ) {
        return {
          eyebrow: "Evaluation",
          title: "Finish your evaluation",
          description:
            studentEvaluation.status === "returned"
              ? "Your evaluation was returned. Review it and submit it again."
              : "You started your company evaluation but have not submitted it yet.",
          button: "Continue Evaluation",
          action: () => navigate("/student/evaluation"),
          icon: "📝",
        };
      }

      return {
        eyebrow: "Internship",
        title: "Internship completed",
        description:
          "Congratulations! Your internship has been completed. You can review your internship status and evaluation.",
        button: "View Status",
        action: () => navigate("/student/status"),
        icon: "🎓",
      };
    }

    // -------------------------------------------------------
    // SUSPENDED / TERMINATED
    // -------------------------------------------------------

    if (currentAssignment.status === "suspended") {
      return {
        eyebrow: "Internship",
        title: "Internship suspended",
        description:
          "Your internship assignment is currently suspended. Check your internship status for more information.",
        button: "View Status",
        action: () => navigate("/student/status"),
        icon: "⚠",
      };
    }

    if (currentAssignment.status === "terminated") {
      return {
        eyebrow: "Internship",
        title: "Internship terminated",
        description:
          "Your previous internship assignment has been terminated. You can review the assignment history or explore new opportunities.",
        button: "View Status",
        action: () => navigate("/student/status"),
        icon: "!",
      };
    }

    return {
      eyebrow: "Next Step",
      title: "Check your internship status",
      description:
        "Review your latest internship information and available actions.",
      button: "View Status",
      action: () => navigate("/student/status"),
      icon: "→",
    };
  }, [currentAssignment, applicationCounts, studentEvaluation, navigate]);

  // =========================================================
  // LIFECYCLE
  // =========================================================

  const lifecycle = useMemo(() => {
    const hasApplications = applications.length > 0;

    if (!currentAssignment) {
      return [
        {
          label: "Application",
          state: hasApplications ? "complete" : "current",
        },
        {
          label: "Review",
          state:
            hasApplications && applicationCounts.review === 0
              ? "complete"
              : "upcoming",
        },
        {
          label: "Placement",
          state: "upcoming",
        },
        {
          label: "Deployment",
          state: "upcoming",
        },
        {
          label: "Internship",
          state: "upcoming",
        },
        {
          label: "Evaluation",
          state: "upcoming",
        },
      ];
    }

    const status = currentAssignment.status;

    if (status === "pending") {
      return [
        { label: "Application", state: "complete" },
        { label: "Review", state: "complete" },
        { label: "Placement", state: "current" },
        { label: "Deployment", state: "upcoming" },
        { label: "Internship", state: "upcoming" },
        { label: "Evaluation", state: "upcoming" },
      ];
    }

    if (status === "active") {
      return [
        { label: "Application", state: "complete" },
        { label: "Review", state: "complete" },
        { label: "Placement", state: "complete" },
        { label: "Deployment", state: "complete" },
        { label: "Internship", state: "current" },
        { label: "Evaluation", state: "upcoming" },
      ];
    }

    if (status === "completed") {
      return [
        { label: "Application", state: "complete" },
        { label: "Review", state: "complete" },
        { label: "Placement", state: "complete" },
        { label: "Deployment", state: "complete" },
        { label: "Internship", state: "complete" },
        {
          label: "Evaluation",
          state: studentEvaluation ? "complete" : "current",
        },
      ];
    }

    return [
      { label: "Application", state: "complete" },
      { label: "Review", state: "complete" },
      { label: "Placement", state: "complete" },
      { label: "Deployment", state: "complete" },
      {
        label: "Internship",
        state: status === "suspended" ? "current" : "complete",
      },
      { label: "Evaluation", state: "upcoming" },
    ];
  }, [
    applications.length,
    applicationCounts.review,
    currentAssignment,
    studentEvaluation,
  ]);

  // =========================================================
  // RECENT APPLICATIONS
  // =========================================================

  const recentApplications = useMemo(() => {
    return applications.slice(0, 5);
  }, [applications]);

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="p-5 md:p-6 lg:p-8 max-w-[1600px] mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="space-y-3">
            <div
              className={`h-4 w-32 rounded ${
                darkMode ? "bg-slate-800" : "bg-slate-200"
              }`}
            />

            <div
              className={`h-9 w-72 rounded ${
                darkMode ? "bg-slate-800" : "bg-slate-200"
              }`}
            />

            <div
              className={`h-4 w-96 max-w-full rounded ${
                darkMode ? "bg-slate-800" : "bg-slate-200"
              }`}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-5">
            {[1, 2, 3, 4, 5].map((item) => (
              <div
                key={item}
                className={`h-28 rounded-2xl ${
                  darkMode ? "bg-slate-900" : "bg-slate-100"
                }`}
              />
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div
              className={`xl:col-span-2 h-96 rounded-2xl ${
                darkMode ? "bg-slate-900" : "bg-slate-100"
              }`}
            />

            <div
              className={`h-96 rounded-2xl ${
                darkMode ? "bg-slate-900" : "bg-slate-100"
              }`}
            />
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
      <div className="p-5 md:p-6 lg:p-8 max-w-[1600px] mx-auto">
        <div
          className={`rounded-2xl border p-6 ${
            darkMode
              ? "bg-red-950/30 border-red-900"
              : "bg-red-50 border-red-100"
          }`}
        >
          <h2
            className={`font-bold text-lg ${
              darkMode ? "text-red-300" : "text-red-700"
            }`}
          >
            Unable to load dashboard
          </h2>

          <p
            className={`text-sm mt-2 ${
              darkMode ? "text-red-400" : "text-red-600"
            }`}
          >
            {error}
          </p>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

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

        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <h1 className={`text-3xl font-bold tracking-tight ${headingClass}`}>
              Welcome back, {studentName.split(" ")[0]}!
            </h1>

            <p className={`mt-2 ${mutedClass}`}>
              Here's where you are in your internship journey.
            </p>
          </div>

          {student && (
            <div
              className={`flex flex-wrap items-center gap-x-5 gap-y-2 text-sm ${mutedClass}`}
            >
              <span>
                <strong className={headingClass}>Student ID:</strong>{" "}
                {student.student_id || "—"}
              </span>

              <span>
                <strong className={headingClass}>Program:</strong>{" "}
                {student.program || "—"}
              </span>

              <span>
                <strong className={headingClass}>Year:</strong>{" "}
                {student.year_level || "—"}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* =====================================================
          SUMMARY CARDS
      ===================================================== */}

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-5 mb-8">
        {/* ACTIVE INTERNSHIP */}

        <div
          className={`${cardClass} rounded-2xl border p-5 transition-shadow hover:shadow-md`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className={`text-sm font-medium ${mutedClass}`}>
                Active Internship
              </p>

              <p className={`text-3xl font-bold mt-2 ${headingClass}`}>
                {currentAssignment?.status === "active" ? "1" : "0"}
              </p>

              <p className={`text-xs mt-2 ${mutedClass}`}>
                {currentAssignment?.status === "active"
                  ? "Currently in progress"
                  : "No active placement"}
              </p>
            </div>

            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg ${
                darkMode ? "bg-blue-950/40" : "bg-blue-50"
              }`}
            >
              💼
            </div>
          </div>
        </div>

        {/* APPLICATIONS */}

        <div
          className={`${cardClass} rounded-2xl border p-5 transition-shadow hover:shadow-md`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className={`text-sm font-medium ${mutedClass}`}>
                Applications
              </p>

              <p className={`text-3xl font-bold mt-2 ${headingClass}`}>
                {applicationCounts.total}
              </p>

              <p className={`text-xs mt-2 ${mutedClass}`}>
                {applicationCounts.review} currently under review
              </p>
            </div>

            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg ${
                darkMode ? "bg-emerald-950/40" : "bg-emerald-50"
              }`}
            >
              📋
            </div>
          </div>
        </div>

        {/* APPROVED */}

        <div
          className={`${cardClass} rounded-2xl border p-5 transition-shadow hover:shadow-md`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className={`text-sm font-medium ${mutedClass}`}>Approved</p>

              <p className={`text-3xl font-bold mt-2 ${headingClass}`}>
                {applicationCounts.approved}
              </p>

              <p className={`text-xs mt-2 ${mutedClass}`}>
                Approved applications
              </p>
            </div>

            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg ${
                darkMode ? "bg-amber-950/40" : "bg-amber-50"
              }`}
            >
              ✓
            </div>
          </div>
        </div>

        {/* COMPLETED INTERNSHIPS */}

        <div
          className={`${cardClass} rounded-2xl border p-5 transition-shadow hover:shadow-md`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className={`text-sm font-medium ${mutedClass}`}>
                Completed Internships
              </p>

              <p className={`text-3xl font-bold mt-2 ${headingClass}`}>
                {completedInternshipCount}
              </p>

              <p className={`text-xs mt-2 ${mutedClass}`}>
                {completedInternshipCount === 0
                  ? "No completed internships"
                  : completedInternshipCount === 1
                  ? "Internship completed"
                  : "Internships completed"}
              </p>
            </div>

            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg ${
                darkMode ? "bg-emerald-950/40" : "bg-emerald-50"
              }`}
            >
              🎓
            </div>
          </div>
        </div>

        {/* EVALUATION */}

        <div
          className={`${cardClass} rounded-2xl border p-5 transition-shadow hover:shadow-md`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className={`text-sm font-medium ${mutedClass}`}>Evaluation</p>

              <p
                className={`text-lg font-bold mt-3 ${
                  evaluationStatus.status === "finalized" ||
                  evaluationStatus.status === "submitted"
                    ? darkMode
                      ? "text-emerald-400"
                      : "text-emerald-600"
                    : headingClass
                }`}
              >
                {evaluationStatus.label}
              </p>
            </div>

            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg ${
                darkMode ? "bg-purple-950/40" : "bg-purple-50"
              }`}
            >
              ⭐
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          MAIN FOCUS
      ===================================================== */}

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        {/* CURRENT INTERNSHIP */}

        <div className={`xl:col-span-2 ${cardClass} rounded-2xl border p-6`}>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-500 mb-1">
                {currentAssignment
                  ? currentAssignment.status === "completed"
                    ? "Latest Internship"
                    : "Current Internship"
                  : "Internship"}
              </p>

              <h2 className={`font-bold text-xl ${headingClass}`}>
                {currentCompany?.company_name || "No current internship"}
              </h2>

              {currentCompany?.industry && (
                <p className={`text-sm mt-1 ${mutedClass}`}>
                  {currentCompany.industry}
                </p>
              )}
            </div>

            {currentAssignment && (
              <span
                className={`inline-flex w-fit items-center px-3 py-1.5 rounded-full border text-xs font-semibold ${getStatusClasses(
                  currentAssignment.status
                )}`}
              >
                {formatStatus(currentAssignment.status)}
              </span>
            )}
          </div>

          {!currentAssignment ? (
            <div
              className={`rounded-2xl border border-dashed p-10 text-center ${innerCardClass}`}
            >
              <div className="text-4xl mb-4">💼</div>

              <h3 className={`font-bold text-lg ${headingClass}`}>
                No internship placement yet
              </h3>

              <p className={`text-sm mt-2 max-w-lg mx-auto ${mutedClass}`}>
                You currently don't have a pending or active internship
                assignment. Start by exploring the available opportunities.
              </p>

              <button
                type="button"
                onClick={() => navigate("/student/application")}
                className="mt-6 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition"
              >
                Browse Opportunities
              </button>
            </div>
          ) : (
            <>
              {/* POSITION */}

              <div className={`rounded-xl border p-4 mb-4 ${innerCardClass}`}>
                <p className={`text-xs ${mutedClass}`}>Position</p>

                <p className={`font-bold text-base mt-1 ${headingClass}`}>
                  {currentOpportunity?.title ||
                    currentOpportunity?.position ||
                    currentCompany?.designation ||
                    "Internship Position"}
                </p>
              </div>

              {/* DETAILS */}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className={`rounded-xl border p-4 ${innerCardClass}`}>
                  <p className={`text-xs ${mutedClass}`}>Start Date</p>

                  <p className={`font-semibold text-sm mt-1 ${headingClass}`}>
                    {formatDate(currentAssignment.start_date)}
                  </p>
                </div>

                <div className={`rounded-xl border p-4 ${innerCardClass}`}>
                  <p className={`text-xs ${mutedClass}`}>End Date</p>

                  <p className={`font-semibold text-sm mt-1 ${headingClass}`}>
                    {formatDate(currentAssignment.end_date)}
                  </p>
                </div>

                <div className={`rounded-xl border p-4 ${innerCardClass}`}>
                  <p className={`text-xs ${mutedClass}`}>Deployment</p>

                  <p className={`font-semibold text-sm mt-1 ${headingClass}`}>
                    {currentAssignment.deployed_at
                      ? formatDate(currentAssignment.deployed_at)
                      : "Not deployed"}
                  </p>
                </div>
              </div>

              {/* COMPANY CONTACT */}

              {currentCompany?.company_address && (
                <div className={`mt-4 text-sm ${mutedClass}`}>
                  <span className="mr-2">📍</span>
                  {currentCompany.company_address}
                </div>
              )}

              <button
                type="button"
                onClick={() => navigate("/student/status")}
                className="mt-5 w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition"
              >
                View Internship Status
              </button>
            </>
          )}
        </div>

        {/* NEXT ACTION */}

        <div className={`${cardClass} rounded-2xl border p-6`}>
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-500 mb-1">
              Recommended
            </p>

            <h2 className={`font-bold text-xl ${headingClass}`}>
              What's Next?
            </h2>

            <p className={`text-sm mt-1 ${mutedClass}`}>
              Your most important next step
            </p>
          </div>

          <div
            className={`rounded-2xl border p-5 ${
              darkMode
                ? "bg-blue-950/30 border-blue-900"
                : "bg-blue-50 border-blue-100"
            }`}
          >
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${
                darkMode ? "bg-slate-800" : "bg-white"
              }`}
            >
              {nextAction.icon}
            </div>

            <p
              className={`text-xs font-semibold uppercase tracking-wider mt-5 ${
                darkMode ? "text-blue-400" : "text-blue-600"
              }`}
            >
              {nextAction.eyebrow}
            </p>

            <h3
              className={`font-bold text-lg mt-1 ${
                darkMode ? "text-blue-200" : "text-blue-950"
              }`}
            >
              {nextAction.title}
            </h3>

            <p
              className={`text-sm mt-3 leading-relaxed ${
                darkMode ? "text-blue-400" : "text-blue-700"
              }`}
            >
              {nextAction.description}
            </p>

            <button
              type="button"
              onClick={nextAction.action}
              className="mt-5 text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline"
            >
              {nextAction.button} →
            </button>
          </div>
        </div>
      </section>

      {/* =====================================================
          INTERNSHIP LIFECYCLE
      ===================================================== */}

      <section className={`${cardClass} rounded-2xl border p-6 mb-8`}>
        <div className="mb-7">
          <h2 className={`font-bold text-lg ${headingClass}`}>
            Internship Journey
          </h2>

          <p className={`text-sm mt-1 ${mutedClass}`}>
            Track where you are in the internship process.
          </p>
        </div>

        <div className="overflow-x-auto pb-2">
          <div className="min-w-[760px] flex items-start">
            {lifecycle.map((step, index) => {
              const isLast = index === lifecycle.length - 1;

              return (
                <React.Fragment key={step.label}>
                  <div className="flex-1">
                    <div className="flex flex-col items-center text-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center border-2 text-sm font-bold ${
                          step.state === "complete"
                            ? "bg-emerald-500 border-emerald-500 text-white"
                            : step.state === "current"
                            ? "bg-blue-600 border-blue-600 text-white"
                            : darkMode
                            ? "bg-slate-800 border-slate-700 text-slate-500"
                            : "bg-slate-50 border-slate-200 text-slate-400"
                        }`}
                      >
                        {step.state === "complete" ? "✓" : index + 1}
                      </div>

                      <p
                        className={`text-xs font-semibold mt-3 ${
                          step.state === "current"
                            ? "text-blue-500"
                            : step.state === "complete"
                            ? darkMode
                              ? "text-emerald-400"
                              : "text-emerald-600"
                            : mutedClass
                        }`}
                      >
                        {step.label}
                      </p>
                    </div>
                  </div>

                  {!isLast && (
                    <div className="w-10 sm:w-16 pt-5">
                      <div
                        className={`h-0.5 ${
                          step.state === "complete"
                            ? "bg-emerald-500"
                            : darkMode
                            ? "bg-slate-700"
                            : "bg-slate-200"
                        }`}
                      />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </section>

      {/* =====================================================
          APPLICATION OVERVIEW + EVALUATION
      ===================================================== */}

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        {/* APPLICATION OVERVIEW */}

        <div className={`${cardClass} rounded-2xl border p-6`}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className={`font-bold text-lg ${headingClass}`}>
                Application Overview
              </h2>

              <p className={`text-sm mt-1 ${mutedClass}`}>
                Your internship application activity
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/student/application")}
              className="text-sm font-semibold text-blue-500 hover:text-blue-400"
            >
              View All
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className={`rounded-xl border p-4 ${innerCardClass}`}>
              <p className={`text-xs ${mutedClass}`}>Total</p>

              <p className={`text-2xl font-bold mt-1 ${headingClass}`}>
                {applicationCounts.total}
              </p>
            </div>

            <div
              className={`rounded-xl border p-4 ${
                darkMode
                  ? "bg-amber-950/20 border-amber-900"
                  : "bg-amber-50 border-amber-100"
              }`}
            >
              <p
                className={`text-xs ${
                  darkMode ? "text-amber-400" : "text-amber-600"
                }`}
              >
                Under Review
              </p>

              <p
                className={`text-2xl font-bold mt-1 ${
                  darkMode ? "text-amber-300" : "text-amber-700"
                }`}
              >
                {applicationCounts.review}
              </p>
            </div>

            <div
              className={`rounded-xl border p-4 ${
                darkMode
                  ? "bg-emerald-950/20 border-emerald-900"
                  : "bg-emerald-50 border-emerald-100"
              }`}
            >
              <p
                className={`text-xs ${
                  darkMode ? "text-emerald-400" : "text-emerald-600"
                }`}
              >
                Approved
              </p>

              <p
                className={`text-2xl font-bold mt-1 ${
                  darkMode ? "text-emerald-300" : "text-emerald-700"
                }`}
              >
                {applicationCounts.approved}
              </p>
            </div>

            <div
              className={`rounded-xl border p-4 ${
                darkMode
                  ? "bg-red-950/20 border-red-900"
                  : "bg-red-50 border-red-100"
              }`}
            >
              <p
                className={`text-xs ${
                  darkMode ? "text-red-400" : "text-red-600"
                }`}
              >
                Rejected
              </p>

              <p
                className={`text-2xl font-bold mt-1 ${
                  darkMode ? "text-red-300" : "text-red-700"
                }`}
              >
                {applicationCounts.rejected}
              </p>
            </div>
          </div>
        </div>

        {/* EVALUATION */}

        <div className={`${cardClass} rounded-2xl border p-6`}>
          <div className="mb-6">
            <h2 className={`font-bold text-lg ${headingClass}`}>Evaluation</h2>

            <p className={`text-sm mt-1 ${mutedClass}`}>
              Your evaluation status for the latest internship
            </p>
          </div>

          {!currentAssignment ? (
            <div
              className={`rounded-xl border border-dashed p-7 text-center ${innerCardClass}`}
            >
              <div className="text-3xl mb-3">⭐</div>

              <p className={`font-semibold ${headingClass}`}>
                Evaluation not available
              </p>

              <p className={`text-sm mt-1 ${mutedClass}`}>
                Evaluation information will appear after you have completed an
                internship.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* YOUR EVALUATION */}

              <div className={`rounded-xl border p-4 ${innerCardClass}`}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className={`text-xs ${mutedClass}`}>Your Evaluation</p>

                    <p className={`font-semibold text-sm mt-1 ${headingClass}`}>
                      Student → Company
                    </p>
                  </div>

                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full border whitespace-nowrap ${getStatusClasses(
                      studentEvaluation?.status || "pending"
                    )}`}
                  >
                    {studentEvaluation
                      ? formatStatus(studentEvaluation.status)
                      : currentAssignment.status === "completed"
                      ? "Not Started"
                      : "Not Available"}
                  </span>
                </div>
              </div>

              {/* COMPANY EVALUATION */}

              <div className={`rounded-xl border p-4 ${innerCardClass}`}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className={`text-xs ${mutedClass}`}>
                      Company Evaluation
                    </p>

                    <p className={`font-semibold text-sm mt-1 ${headingClass}`}>
                      Company → Student
                    </p>
                  </div>

                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full border whitespace-nowrap ${getStatusClasses(
                      companyEvaluation?.status || "pending"
                    )}`}
                  >
                    {companyEvaluation
                      ? formatStatus(companyEvaluation.status)
                      : currentAssignment.status === "completed"
                      ? "Not Submitted"
                      : "Not Available"}
                  </span>
                </div>
              </div>

              {currentAssignment.status === "completed" && (
                <button
                  type="button"
                  onClick={() => navigate("/student/evaluation")}
                  className="mt-2 text-sm font-semibold text-blue-500 hover:text-blue-400"
                >
                  {studentEvaluation
                    ? "Open Evaluation →"
                    : "Complete Evaluation →"}
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* =====================================================
          RECENT APPLICATIONS
      ===================================================== */}

      <section className={`${cardClass} rounded-2xl border overflow-hidden`}>
        <div className="p-6 flex items-center justify-between">
          <div>
            <h2 className={`font-bold text-lg ${headingClass}`}>
              Recent Applications
            </h2>

            <p className={`text-sm mt-1 ${mutedClass}`}>
              Your latest internship applications
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/student/application")}
            className="text-sm font-semibold text-blue-500 hover:text-blue-400"
          >
            View All
          </button>
        </div>

        {recentApplications.length === 0 ? (
          <div
            className={`mx-6 mb-6 rounded-xl border border-dashed p-8 text-center ${innerCardClass}`}
          >
            <div className="text-3xl mb-3">📋</div>

            <p className={`font-semibold ${headingClass}`}>
              No applications yet
            </p>

            <p className={`text-sm mt-1 max-w-md mx-auto ${mutedClass}`}>
              Your internship applications will appear here once you apply to an
              opportunity.
            </p>

            <button
              type="button"
              onClick={() => navigate("/student/application")}
              className="mt-4 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition"
            >
              Browse Opportunities
            </button>
          </div>
        ) : (
          <div
            className={`divide-y ${
              darkMode ? "divide-slate-700" : "divide-slate-100"
            }`}
          >
            {recentApplications.map((application) => {
              const opportunity = opportunities[application.opportunity_id];

              const companyName =
                opportunity?.company_name ||
                opportunity?.company?.company_name ||
                opportunity?.company_name_text ||
                "Internship Opportunity";

              const opportunityTitle =
                opportunity?.title ||
                opportunity?.position ||
                opportunity?.job_title ||
                "Internship Application";

              return (
                <div
                  key={application.id}
                  className={`px-6 py-4 flex items-center gap-4 transition ${
                    darkMode ? "hover:bg-slate-800" : "hover:bg-slate-50"
                  }`}
                >
                  {/* ICON */}

                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      darkMode ? "bg-blue-950/40" : "bg-blue-50"
                    }`}
                  >
                    📋
                  </div>

                  {/* CONTENT */}

                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm font-semibold truncate ${headingClass}`}
                    >
                      {opportunityTitle}
                    </p>

                    <p className={`text-xs mt-1 truncate ${mutedClass}`}>
                      {companyName}
                    </p>

                    <p className={`text-[11px] mt-1 ${mutedClass}`}>
                      {application.submitted_at
                        ? `Submitted ${formatDate(application.submitted_at)}`
                        : `Created ${formatDate(application.created_at)}`}
                    </p>
                  </div>

                  {/* STATUS */}

                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full border whitespace-nowrap ${getStatusClasses(
                      application.status
                    )}`}
                  >
                    {formatStatus(application.status)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* =====================================================
          FOOTER TIP
      ===================================================== */}

      <div
        className={`mt-6 rounded-2xl p-4 flex items-start gap-3 border ${
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
            Keep your internship journey on track
          </p>

          <p
            className={`text-sm mt-1 ${
              darkMode ? "text-blue-400" : "text-blue-700"
            }`}
          >
            Check your application and internship status regularly so you always
            know what step comes next.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
