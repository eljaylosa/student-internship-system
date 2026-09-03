import React, { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabaseRegistrar } from "../../supabaseClient";

// =========================================================
// REGISTRAR EVALUATIONS PAGE
// =========================================================
//
// VIEW ONLY
//
// 1. Company → Student
// 2. Student → Company
//
// IMPORTANT:
// Registrar can ONLY see evaluations belonging to students
// from the Registrar's own school.
//
// Registrar school:
// registrars.id = auth.uid()
// registrars.school_id = students.school_id
//
// =========================================================

const EVALUATION_STATUS = {
  SUBMITTED: "submitted",
  FINALIZED: "finalized",
};

const EVALUATOR_ROLE = {
  COMPANY: "company_supervisor",
  STUDENT: "student",
};

export default function Evaluations() {
  const { darkMode } = useOutletContext();

  // =========================================================
  // STATE
  // =========================================================

  const [registrarSchoolId, setRegistrarSchoolId] = useState(null);

  const [assignments, setAssignments] = useState([]);
  const [students, setStudents] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [users, setUsers] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [templates, setTemplates] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [evaluationTab, setEvaluationTab] = useState("company_to_student");

  const [companySearch, setCompanySearch] = useState("");
  const [companyStatusFilter, setCompanyStatusFilter] = useState("all");

  const [studentSearch, setStudentSearch] = useState("");
  const [studentStatusFilter, setStudentStatusFilter] = useState("all");

  const [selectedEvaluation, setSelectedEvaluation] = useState(null);

  // =========================================================
  // SHARED STYLES
  // =========================================================

  const card = darkMode
    ? "bg-slate-900 border-slate-700"
    : "bg-white border-slate-200";

  const softCard = darkMode
    ? "bg-slate-800/50 border-slate-700"
    : "bg-slate-50 border-slate-200";

  const heading = darkMode ? "text-slate-100" : "text-slate-900";

  const muted = darkMode ? "text-slate-400" : "text-slate-500";

  const input = darkMode
    ? "bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500"
    : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400";

  // =========================================================
  // LOAD DATA
  // =========================================================

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      setSelectedEvaluation(null);

      // =======================================================
      // CURRENT AUTHENTICATED REGISTRAR
      // =======================================================

      const {
        data: { user },
        error: authError,
      } = await supabaseRegistrar.auth.getUser();

      if (authError) throw authError;

      if (!user?.id) {
        throw new Error("Unable to identify the current Registrar.");
      }

      // =======================================================
      // REGISTRAR PROFILE / SCHOOL
      // =======================================================

      const { data: registrarData, error: registrarError } =
        await supabaseRegistrar
          .from("registrars")
          .select(
            `
            id,
            school_id
          `
          )
          .eq("id", user.id)
          .maybeSingle();

      if (registrarError) throw registrarError;

      if (!registrarData) {
        throw new Error(
          "Registrar profile was not found. Please contact the administrator."
        );
      }

      if (!registrarData.school_id) {
        throw new Error("No school is assigned to this Registrar account.");
      }

      const schoolId = registrarData.school_id;

      setRegistrarSchoolId(schoolId);

      // =======================================================
      // STUDENTS FROM THIS REGISTRAR'S SCHOOL ONLY
      // =======================================================

      const { data: studentData, error: studentError } = await supabaseRegistrar
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
        .eq("school_id", schoolId);

      if (studentError) throw studentError;

      const studentRows = studentData || [];

      setStudents(studentRows);

      // =======================================================
      // ASSIGNMENTS FOR THIS SCHOOL'S STUDENTS ONLY
      // =======================================================

      const studentIds = studentRows
        .map((student) => student.id)
        .filter(Boolean);

      let assignmentRows = [];

      if (studentIds.length > 0) {
        const { data: assignmentData, error: assignmentError } =
          await supabaseRegistrar
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
            .in("student_id", studentIds)
            .order("created_at", { ascending: false });

        if (assignmentError) throw assignmentError;

        assignmentRows = assignmentData || [];
      }

      setAssignments(assignmentRows);

      // =======================================================
      // COMPANIES
      // =======================================================

      const companyIds = [
        ...new Set(
          assignmentRows
            .map((assignment) => assignment.company_id)
            .filter(Boolean)
        ),
      ];

      let companyRows = [];

      if (companyIds.length > 0) {
        const { data, error: companyError } = await supabaseRegistrar
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

        companyRows = data || [];
      }

      setCompanies(companyRows);

      // =======================================================
      // OPPORTUNITIES
      // =======================================================

      const opportunityIds = [
        ...new Set(
          assignmentRows
            .map((assignment) => assignment.opportunity_id)
            .filter(Boolean)
        ),
      ];

      let opportunityRows = [];

      if (opportunityIds.length > 0) {
        const { data, error: opportunityError } = await supabaseRegistrar
          .from("opportunities")
          .select(
            `
              id,
              title,
              position_type
            `
          )
          .in("id", opportunityIds);

        if (opportunityError) throw opportunityError;

        opportunityRows = data || [];
      }

      setOpportunities(opportunityRows);

      // =======================================================
      // EVALUATIONS
      // =======================================================
      //
      // Only evaluations connected to assignments belonging
      // to students from this Registrar's school.
      //
      // =======================================================

      const assignmentIds = assignmentRows
        .map((assignment) => assignment.id)
        .filter(Boolean);

      let evaluationRows = [];

      if (assignmentIds.length > 0) {
        const { data: evaluationData, error: evaluationError } =
          await supabaseRegistrar
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
            responses,
            overall_rating,
            comments,
            submitted_at,
            finalized_at,
            created_at,
            updated_at
          `
            )
            .in("assignment_id", assignmentIds)
            .in("status", [
              EVALUATION_STATUS.SUBMITTED,
              EVALUATION_STATUS.FINALIZED,
            ])
            .order("submitted_at", { ascending: false });

        if (evaluationError) throw evaluationError;

        evaluationRows = evaluationData || [];
      }

      setEvaluations(evaluationRows);

      // =======================================================
      // EVALUATOR USERS
      // =======================================================

      const evaluatorIds = [
        ...new Set(
          evaluationRows
            .map((evaluation) => evaluation.evaluator_id)
            .filter(Boolean)
        ),
      ];

      let userRows = [];

      if (evaluatorIds.length > 0) {
        const { data, error: userError } = await supabaseRegistrar
          .from("users")
          .select(
            `
              id,
              email,
              first_name,
              middle_name,
              last_name
            `
          )
          .in("id", evaluatorIds);

        if (userError) throw userError;

        userRows = data || [];
      }

      setUsers(userRows);

      // =======================================================
      // EVALUATION TEMPLATES
      // =======================================================
      //
      // Load all published templates and their sections/criteria.
      //
      // We later match evaluation.template_id to the exact
      // template used when that evaluation was submitted.
      //
      // =======================================================

      const { data: templateData, error: templateError } =
        await supabaseRegistrar
          .from("evaluation_templates")
          .select(
            `
            id,
            direction,
            name,
            description,
            version,
            status,
            published_at,
            evaluation_sections (
              id,
              name,
              display_order,
              evaluation_criteria (
                id,
                criterion,
                display_order
              )
            )
          `
          )
          .eq("status", "published");

      if (templateError) throw templateError;

      setTemplates(templateData || []);
    } catch (err) {
      console.error("Registrar evaluations load error:", err);

      setError(err?.message || "Unable to load evaluations. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // =========================================================
  // HELPERS
  // =========================================================

  const getAssignment = (assignmentId) =>
    assignments.find((assignment) => assignment.id === assignmentId);

  const getStudent = (studentId) =>
    students.find((student) => student.id === studentId);

  const getCompany = (companyId) =>
    companies.find((company) => company.id === companyId);

  const getOpportunity = (opportunityId) =>
    opportunities.find((opportunity) => opportunity.id === opportunityId);

  const getUser = (userId) => users.find((user) => user.id === userId);

  // =========================================================
  // TEMPLATE HELPERS
  // =========================================================

  const getTemplate = (templateId) =>
    templates.find((template) => template.id === templateId);

  const getTemplateSections = (template) => {
    if (!template?.evaluation_sections) return [];

    return [...template.evaluation_sections]
      .sort(
        (a, b) => Number(a.display_order || 0) - Number(b.display_order || 0)
      )
      .map((section) => ({
        ...section,
        evaluation_criteria: [...(section.evaluation_criteria || [])].sort(
          (a, b) => Number(a.display_order || 0) - Number(b.display_order || 0)
        ),
      }));
  };

  const getCriterionMap = (template) => {
    const map = {};

    getTemplateSections(template).forEach((section) => {
      (section.evaluation_criteria || []).forEach((criterion) => {
        map[criterion.id] = {
          criterion: criterion.criterion,
          sectionName: section.name,
          sectionId: section.id,
          displayOrder: criterion.display_order,
        };
      });
    });

    return map;
  };

  // =========================================================
  // NAME HELPERS
  // =========================================================

  const getStudentName = (studentId) => {
    const student = getStudent(studentId);

    if (!student) return "Unknown Student";

    const userInfo = Array.isArray(student.users)
      ? student.users[0]
      : student.users;

    const fullName = [
      userInfo?.first_name,
      userInfo?.middle_name,
      userInfo?.last_name,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    return fullName || "Unknown Student";
  };

  const getStudentNumber = (studentId) => {
    const student = getStudent(studentId);

    return student?.student_id || "N/A";
  };

  const getStudentEmail = (studentId) => {
    const student = getStudent(studentId);

    if (!student) return "";

    const userInfo = Array.isArray(student.users)
      ? student.users[0]
      : student.users;

    return userInfo?.email || "";
  };

  const getCompanyName = (companyId) => {
    const company = getCompany(companyId);

    return company?.company_name || "Unknown Company";
  };

  const getCompanyEmail = (companyId) => {
    const company = getCompany(companyId);

    return company?.company_email || "";
  };

  const getEvaluatorName = (evaluation) => {
    const evaluator = getUser(evaluation?.evaluator_id);

    if (!evaluator) {
      return evaluation?.evaluator_role === EVALUATOR_ROLE.STUDENT
        ? "Unknown Student"
        : "Unknown Company Supervisor";
    }

    const fullName = [
      evaluator.first_name,
      evaluator.middle_name,
      evaluator.last_name,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    return fullName || evaluator.email || "Unknown Evaluator";
  };

  const getEvaluatorEmail = (evaluation) => {
    const evaluator = getUser(evaluation?.evaluator_id);

    return evaluator?.email || "";
  };

  // =========================================================
  // DATE
  // =========================================================

  const formatDate = (date) => {
    if (!date) return "N/A";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "N/A";
    }

    return parsed.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatShortDate = (date) => {
    if (!date) return "N/A";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "N/A";
    }

    return parsed.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // =========================================================
  // RATING
  // =========================================================

  const renderStars = (value) => {
    const rating = Number(value) || 0;

    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={
              star <= rating
                ? "text-amber-400"
                : darkMode
                ? "text-slate-600"
                : "text-slate-300"
            }
          >
            ★
          </span>
        ))}

        <span
          className={`ml-2 text-xs font-bold ${
            darkMode ? "text-slate-300" : "text-slate-600"
          }`}
        >
          {rating > 0 ? `${rating}/5` : "N/A"}
        </span>
      </div>
    );
  };

  // =========================================================
  // RESPONSE HELPERS
  // =========================================================

  const getResponseEntries = (evaluation) => {
    const responses = evaluation?.responses;

    if (
      !responses ||
      typeof responses !== "object" ||
      Array.isArray(responses)
    ) {
      return [];
    }

    return Object.entries(responses);
  };

  const getResponseRating = (value) => {
    if (typeof value === "number") {
      return value;
    }

    if (typeof value === "string") {
      const parsed = Number(value);

      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }

    if (value && typeof value === "object" && "rating" in value) {
      const parsed = Number(value.rating);

      return Number.isNaN(parsed) ? null : parsed;
    }

    return null;
  };

  // =========================================================
  // STATUS
  // =========================================================

  const getStatusLabel = (status) => {
    if (status === EVALUATION_STATUS.FINALIZED) {
      return "FINALIZED";
    }

    if (status === EVALUATION_STATUS.SUBMITTED) {
      return "SUBMITTED";
    }

    return String(status || "UNKNOWN").toUpperCase();
  };

  const getStatusClass = (status) => {
    if (status === EVALUATION_STATUS.FINALIZED) {
      return darkMode
        ? "bg-blue-950/40 text-blue-300 border-blue-800"
        : "bg-blue-50 text-blue-700 border-blue-200";
    }

    return darkMode
      ? "bg-emerald-950/40 text-emerald-300 border-emerald-800"
      : "bg-emerald-50 text-emerald-700 border-emerald-200";
  };

  // =========================================================
  // COMPANY → STUDENT
  // =========================================================

  const companyEvaluations = useMemo(
    () =>
      evaluations.filter(
        (evaluation) => evaluation.evaluator_role === EVALUATOR_ROLE.COMPANY
      ),
    [evaluations]
  );

  const filteredCompanyEvaluations = useMemo(() => {
    const search = companySearch.trim().toLowerCase();

    return companyEvaluations.filter((evaluation) => {
      const assignment = getAssignment(evaluation.assignment_id);

      if (!assignment) return false;

      const studentId =
        evaluation.evaluated_student_id || assignment.student_id;

      const studentName = getStudentName(studentId);

      const studentNumber = getStudentNumber(studentId);

      const studentEmail = getStudentEmail(studentId);

      const companyName = getCompanyName(assignment.company_id);

      const companyEmail = getCompanyEmail(assignment.company_id);

      const opportunity = getOpportunity(assignment.opportunity_id);

      const evaluatorName = getEvaluatorName(evaluation);

      const evaluatorEmail = getEvaluatorEmail(evaluation);

      const matchesSearch =
        !search ||
        [
          studentName,
          studentNumber,
          studentEmail,
          companyName,
          companyEmail,
          opportunity?.title,
          opportunity?.position_type,
          evaluatorName,
          evaluatorEmail,
          evaluation.status,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(search));

      const matchesStatus =
        companyStatusFilter === "all" ||
        evaluation.status === companyStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [
    companyEvaluations,
    companySearch,
    companyStatusFilter,
    assignments,
    students,
    companies,
    opportunities,
    users,
  ]);

  // =========================================================
  // STUDENT → COMPANY
  // =========================================================

  const studentEvaluations = useMemo(
    () =>
      evaluations.filter(
        (evaluation) => evaluation.evaluator_role === EVALUATOR_ROLE.STUDENT
      ),
    [evaluations]
  );

  const filteredStudentEvaluations = useMemo(() => {
    const search = studentSearch.trim().toLowerCase();

    return studentEvaluations.filter((evaluation) => {
      const assignment = getAssignment(evaluation.assignment_id);

      if (!assignment) return false;

      const studentId =
        evaluation.evaluator_id ||
        evaluation.evaluated_student_id ||
        assignment.student_id;

      const studentName = getStudentName(studentId);

      const studentNumber = getStudentNumber(studentId);

      const studentEmail = getStudentEmail(studentId);

      const companyId =
        evaluation.evaluated_company_id || assignment.company_id;

      const companyName = getCompanyName(companyId);

      const companyEmail = getCompanyEmail(companyId);

      const opportunity = getOpportunity(assignment.opportunity_id);

      const matchesSearch =
        !search ||
        [
          studentName,
          studentNumber,
          studentEmail,
          companyName,
          companyEmail,
          opportunity?.title,
          opportunity?.position_type,
          evaluation.status,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(search));

      const matchesStatus =
        studentStatusFilter === "all" ||
        evaluation.status === studentStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [
    studentEvaluations,
    studentSearch,
    studentStatusFilter,
    assignments,
    students,
    companies,
    opportunities,
  ]);

  // =========================================================
  // COUNTS
  // =========================================================

  const companyCounts = useMemo(
    () => ({
      all: companyEvaluations.length,
      submitted: companyEvaluations.filter(
        (evaluation) => evaluation.status === EVALUATION_STATUS.SUBMITTED
      ).length,
      finalized: companyEvaluations.filter(
        (evaluation) => evaluation.status === EVALUATION_STATUS.FINALIZED
      ).length,
    }),
    [companyEvaluations]
  );

  const studentCounts = useMemo(
    () => ({
      all: studentEvaluations.length,
      submitted: studentEvaluations.filter(
        (evaluation) => evaluation.status === EVALUATION_STATUS.SUBMITTED
      ).length,
      finalized: studentEvaluations.filter(
        (evaluation) => evaluation.status === EVALUATION_STATUS.FINALIZED
      ).length,
    }),
    [studentEvaluations]
  );

  // =========================================================
  // SELECTED EVALUATION
  // =========================================================

  const selectedEvaluationData = useMemo(() => {
    if (!selectedEvaluation) return null;

    return (
      evaluations.find(
        (evaluation) => evaluation.id === selectedEvaluation.id
      ) || null
    );
  }, [selectedEvaluation, evaluations]);

  const selectedAssignment = selectedEvaluationData
    ? getAssignment(selectedEvaluationData.assignment_id)
    : null;

  const selectedStudent = selectedEvaluationData
    ? getStudent(
        selectedEvaluationData.evaluated_student_id ||
          selectedAssignment?.student_id
      )
    : null;

  const selectedCompany = selectedEvaluationData
    ? getCompany(
        selectedEvaluationData.evaluated_company_id ||
          selectedAssignment?.company_id
      )
    : null;

  const selectedOpportunity = selectedAssignment
    ? getOpportunity(selectedAssignment.opportunity_id)
    : null;

  // =========================================================
  // TAB CHANGE
  // =========================================================

  const handleEvaluationTabChange = (tab) => {
    setEvaluationTab(tab);
    setSelectedEvaluation(null);
  };

  // =========================================================
  // CLEAR FILTERS
  // =========================================================

  const clearCompanyFilters = () => {
    setCompanySearch("");
    setCompanyStatusFilter("all");
  };

  const clearStudentFilters = () => {
    setStudentSearch("");
    setStudentStatusFilter("all");
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div
        className={`p-5 md:p-6 lg:p-8 max-w-[1100px] mx-auto ${
          darkMode ? "text-slate-100" : "text-slate-900"
        }`}
      >
        <div className="mb-6">
          <p className="text-xs uppercase tracking-widest font-bold text-slate-400">
            Registrar Adviser Portal
          </p>

          <h1 className="text-2xl font-black">Evaluations</h1>

          <p className={`text-sm mt-1 ${muted}`}>
            Loading internship evaluations...
          </p>
        </div>

        <section className={`border rounded-2xl p-8 ${card}`}>
          <div className="text-center">
            <div className="text-3xl mb-3 animate-pulse">📋</div>

            <p className="font-semibold">Loading evaluations...</p>

            <p className={`text-sm mt-1 ${muted}`}>
              Please wait while we retrieve the submitted evaluations.
            </p>
          </div>
        </section>
      </div>
    );
  }

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div
      className={`p-5 md:p-6 lg:p-8 max-w-[1100px] mx-auto ${
        darkMode ? "text-slate-100" : "text-slate-900"
      }`}
    >
      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <div className="mb-6">
        <p className="text-xs uppercase tracking-widest font-bold text-slate-400">
          Registrar Adviser Portal
        </p>

        <h1 className="text-2xl font-black">Evaluations</h1>

        <p className={`text-sm mt-1 ${muted}`}>
          Review internship evaluations submitted by students and company
          supervisors.
        </p>

        {registrarSchoolId && (
          <div
            className={`inline-flex items-center gap-2 mt-3 px-3 py-1.5 rounded-full text-xs font-semibold ${
              darkMode
                ? "bg-blue-950/40 text-blue-300"
                : "bg-blue-50 text-blue-700"
            }`}
          >
            <span>🔒</span>
            Showing evaluations from your assigned school
          </div>
        )}
      </div>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div
          className={`mb-6 border rounded-2xl p-4 ${
            darkMode
              ? "bg-red-950/30 border-red-900 text-red-300"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="font-bold text-sm">Unable to load evaluations</p>

              <p className="text-sm mt-1 opacity-90">{error}</p>
            </div>

            <button
              type="button"
              onClick={loadData}
              className="px-4 py-2 rounded-xl border border-current text-sm font-bold hover:opacity-80 transition"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* =====================================================
          SUMMARY
      ===================================================== */}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-7">
        <div className={`border rounded-2xl p-5 ${card}`}>
          <p className="text-xs font-semibold text-slate-400">
            Total Evaluations
          </p>

          <p className="text-2xl font-black mt-1">{evaluations.length}</p>

          <p className={`text-xs mt-1 ${muted}`}>From your assigned school</p>
        </div>

        <div className={`border rounded-2xl p-5 ${card}`}>
          <p className="text-xs font-semibold text-slate-400">
            Company Evaluations
          </p>

          <p className="text-2xl font-black mt-1">{companyCounts.all}</p>

          <p className={`text-xs mt-1 ${muted}`}>Company → Student</p>
        </div>

        <div className={`border rounded-2xl p-5 ${card}`}>
          <p className="text-xs font-semibold text-slate-400">
            Student Evaluations
          </p>

          <p className="text-2xl font-black mt-1">{studentCounts.all}</p>

          <p className={`text-xs mt-1 ${muted}`}>Student → Company</p>
        </div>
      </div>

      {/* =====================================================
          TABS
      ===================================================== */}

      <div
        className={`border rounded-2xl p-1.5 mb-7 ${
          darkMode
            ? "bg-slate-900 border-slate-700"
            : "bg-slate-50 border-slate-200"
        }`}
      >
        <div className="grid sm:grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => handleEvaluationTabChange("company_to_student")}
            className={`rounded-xl px-4 py-3 text-sm font-bold transition ${
              evaluationTab === "company_to_student"
                ? "bg-blue-600 text-white shadow-sm"
                : darkMode
                ? "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                : "text-slate-600 hover:bg-white hover:text-slate-900"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <span>Company → Student</span>

              <span
                className={`px-2 py-0.5 rounded-full text-[10px] ${
                  evaluationTab === "company_to_student"
                    ? "bg-white/20 text-white"
                    : darkMode
                    ? "bg-slate-800 text-slate-300"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {companyCounts.all}
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleEvaluationTabChange("student_to_company")}
            className={`rounded-xl px-4 py-3 text-sm font-bold transition ${
              evaluationTab === "student_to_company"
                ? "bg-blue-600 text-white shadow-sm"
                : darkMode
                ? "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                : "text-slate-600 hover:bg-white hover:text-slate-900"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <span>Student → Company</span>

              <span
                className={`px-2 py-0.5 rounded-full text-[10px] ${
                  evaluationTab === "student_to_company"
                    ? "bg-white/20 text-white"
                    : darkMode
                    ? "bg-slate-800 text-slate-300"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {studentCounts.all}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* =====================================================
          COMPANY → STUDENT
      ===================================================== */}

      {evaluationTab === "company_to_student" && (
        <section>
          <div className="mb-5">
            <p className="text-xs uppercase tracking-widest font-bold text-slate-400">
              Company → Student
            </p>

            <h2 className="text-xl font-black">Company Evaluations</h2>

            <p className={`text-sm mt-1 ${muted}`}>
              Review performance evaluations submitted by company supervisors
              for interns from your school.
            </p>
          </div>

          {/* FILTERS */}

          <section className={`border rounded-2xl p-4 mb-5 ${card}`}>
            <div className="flex flex-col lg:flex-row gap-3">
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-400 mb-1.5">
                  Search
                </label>

                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    🔎
                  </span>

                  <input
                    type="text"
                    value={companySearch}
                    onChange={(event) => setCompanySearch(event.target.value)}
                    placeholder="Search student, company, opportunity..."
                    className={`w-full border rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/30 ${input}`}
                  />
                </div>
              </div>

              <div className="w-full lg:w-48">
                <label className="block text-xs font-bold text-slate-400 mb-1.5">
                  Status
                </label>

                <select
                  value={companyStatusFilter}
                  onChange={(event) =>
                    setCompanyStatusFilter(event.target.value)
                  }
                  className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/30 ${input}`}
                >
                  <option value="all">All Statuses</option>

                  <option value="submitted">Submitted</option>

                  <option value="finalized">Finalized</option>
                </select>
              </div>

              {(companySearch || companyStatusFilter !== "all") && (
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={clearCompanyFilters}
                    className={`px-4 py-2.5 rounded-xl text-sm font-bold border transition ${
                      darkMode
                        ? "border-slate-700 hover:bg-slate-800"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>

            <div className="mt-3 text-xs text-slate-400">
              Showing{" "}
              <span className="font-bold">
                {filteredCompanyEvaluations.length}
              </span>{" "}
              of <span className="font-bold">{companyEvaluations.length}</span>{" "}
              company evaluations
            </div>
          </section>

          {/* EMPTY */}

          {filteredCompanyEvaluations.length === 0 ? (
            <section className={`border rounded-2xl p-8 ${card}`}>
              <div className="text-center py-8">
                <div className="text-3xl mb-3">📋</div>

                <p className="font-semibold">No company evaluations found.</p>

                <p className={`text-sm mt-1 max-w-md mx-auto ${muted}`}>
                  Submitted evaluations from company supervisors will appear
                  here.
                </p>
              </div>
            </section>
          ) : (
            <div className="space-y-3">
              {filteredCompanyEvaluations.map((evaluation) => {
                const assignment = getAssignment(evaluation.assignment_id);

                if (!assignment) return null;

                const studentId =
                  evaluation.evaluated_student_id || assignment.student_id;

                const studentName = getStudentName(studentId);

                const companyName = getCompanyName(assignment.company_id);

                const opportunity = getOpportunity(assignment.opportunity_id);

                const isSelected = selectedEvaluation?.id === evaluation.id;

                return (
                  <article
                    key={evaluation.id}
                    className={`border rounded-2xl overflow-hidden ${card}`}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedEvaluation(isSelected ? null : evaluation)
                      }
                      className="w-full text-left p-5 hover:bg-slate-500/5 transition"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <div
                              className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm ${
                                darkMode
                                  ? "bg-blue-950/50 text-blue-300"
                                  : "bg-blue-50 text-blue-700"
                              }`}
                            >
                              {studentName.charAt(0).toUpperCase()}
                            </div>

                            <h3 className="font-bold">{studentName}</h3>

                            <span
                              className={`px-2 py-1 rounded-full text-[10px] font-bold border ${getStatusClass(
                                evaluation.status
                              )}`}
                            >
                              {getStatusLabel(evaluation.status)}
                            </span>
                          </div>

                          <div className={`text-xs mt-2 ${muted}`}>
                            {companyName}
                            {" · "}
                            {opportunity?.title || "Unknown Opportunity"}
                          </div>

                          <div className={`text-xs mt-1 ${muted}`}>
                            Evaluated by {getEvaluatorName(evaluation)}
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 lg:text-right">
                          <div>
                            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                              Overall Rating
                            </p>

                            <div className="mt-1">
                              {renderStars(evaluation.overall_rating)}
                            </div>
                          </div>

                          <div className={`text-xs ${muted}`}>
                            {formatShortDate(
                              evaluation.submitted_at || evaluation.created_at
                            )}
                          </div>

                          <span className="text-slate-400">
                            {isSelected ? "⌃" : "⌄"}
                          </span>
                        </div>
                      </div>
                    </button>

                    {isSelected && (
                      <EvaluationDetails
                        evaluation={evaluation}
                        assignment={assignment}
                        studentName={studentName}
                        companyName={companyName}
                        opportunity={opportunity}
                        selectedStudent={getStudent(studentId)}
                        selectedCompany={getCompany(assignment.company_id)}
                        selectedOpportunity={opportunity}
                        template={getTemplate(evaluation.template_id)}
                        getEvaluatorName={getEvaluatorName}
                        getEvaluatorEmail={getEvaluatorEmail}
                        getStudentNumber={getStudentNumber}
                        getStudentEmail={getStudentEmail}
                        getCompanyEmail={getCompanyEmail}
                        formatDate={formatDate}
                        renderStars={renderStars}
                        getResponseEntries={getResponseEntries}
                        getResponseRating={getResponseRating}
                        darkMode={darkMode}
                        softCard={softCard}
                        muted={muted}
                      />
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* =====================================================
          STUDENT → COMPANY
      ===================================================== */}

      {evaluationTab === "student_to_company" && (
        <section>
          <div className="mb-5">
            <p className="text-xs uppercase tracking-widest font-bold text-slate-400">
              Student → Company
            </p>

            <h2 className="text-xl font-black">Student Evaluations</h2>

            <p className={`text-sm mt-1 ${muted}`}>
              Review evaluations submitted by interns from your school about
              their internship company and experience.
            </p>
          </div>

          {/* FILTERS */}

          <section className={`border rounded-2xl p-4 mb-5 ${card}`}>
            <div className="flex flex-col lg:flex-row gap-3">
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-400 mb-1.5">
                  Search
                </label>

                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    🔎
                  </span>

                  <input
                    type="text"
                    value={studentSearch}
                    onChange={(event) => setStudentSearch(event.target.value)}
                    placeholder="Search student, company, opportunity..."
                    className={`w-full border rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/30 ${input}`}
                  />
                </div>
              </div>

              <div className="w-full lg:w-48">
                <label className="block text-xs font-bold text-slate-400 mb-1.5">
                  Status
                </label>

                <select
                  value={studentStatusFilter}
                  onChange={(event) =>
                    setStudentStatusFilter(event.target.value)
                  }
                  className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/30 ${input}`}
                >
                  <option value="all">All Statuses</option>

                  <option value="submitted">Submitted</option>

                  <option value="finalized">Finalized</option>
                </select>
              </div>

              {(studentSearch || studentStatusFilter !== "all") && (
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={clearStudentFilters}
                    className={`px-4 py-2.5 rounded-xl text-sm font-bold border transition ${
                      darkMode
                        ? "border-slate-700 hover:bg-slate-800"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>

            <div className="mt-3 text-xs text-slate-400">
              Showing{" "}
              <span className="font-bold">
                {filteredStudentEvaluations.length}
              </span>{" "}
              of <span className="font-bold">{studentEvaluations.length}</span>{" "}
              student evaluations
            </div>
          </section>

          {/* EMPTY */}

          {filteredStudentEvaluations.length === 0 ? (
            <section className={`border rounded-2xl p-8 ${card}`}>
              <div className="text-center py-8">
                <div className="text-3xl mb-3">📝</div>

                <p className="font-semibold">No student evaluations found.</p>

                <p className={`text-sm mt-1 max-w-md mx-auto ${muted}`}>
                  Submitted evaluations from students will appear here.
                </p>
              </div>
            </section>
          ) : (
            <div className="space-y-3">
              {filteredStudentEvaluations.map((evaluation) => {
                const assignment = getAssignment(evaluation.assignment_id);

                if (!assignment) return null;

                const studentId =
                  evaluation.evaluator_id ||
                  evaluation.evaluated_student_id ||
                  assignment.student_id;

                const studentName = getStudentName(studentId);

                const companyId =
                  evaluation.evaluated_company_id || assignment.company_id;

                const companyName = getCompanyName(companyId);

                const opportunity = getOpportunity(assignment.opportunity_id);

                const isSelected = selectedEvaluation?.id === evaluation.id;

                return (
                  <article
                    key={evaluation.id}
                    className={`border rounded-2xl overflow-hidden ${card}`}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedEvaluation(isSelected ? null : evaluation)
                      }
                      className="w-full text-left p-5 hover:bg-slate-500/5 transition"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <div
                              className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm ${
                                darkMode
                                  ? "bg-blue-950/50 text-blue-300"
                                  : "bg-blue-50 text-blue-700"
                              }`}
                            >
                              {studentName.charAt(0).toUpperCase()}
                            </div>

                            <h3 className="font-bold">{studentName}</h3>

                            <span
                              className={`px-2 py-1 rounded-full text-[10px] font-bold border ${getStatusClass(
                                evaluation.status
                              )}`}
                            >
                              {getStatusLabel(evaluation.status)}
                            </span>
                          </div>

                          <div className={`text-xs mt-2 ${muted}`}>
                            {companyName}
                            {" · "}
                            {opportunity?.title || "Unknown Opportunity"}
                          </div>

                          <div className={`text-xs mt-1 ${muted}`}>
                            Submitted by {getEvaluatorName(evaluation)}
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 lg:text-right">
                          <div>
                            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                              Overall Rating
                            </p>

                            <div className="mt-1">
                              {renderStars(evaluation.overall_rating)}
                            </div>
                          </div>

                          <div className={`text-xs ${muted}`}>
                            {formatShortDate(
                              evaluation.submitted_at || evaluation.created_at
                            )}
                          </div>

                          <span className="text-slate-400">
                            {isSelected ? "⌃" : "⌄"}
                          </span>
                        </div>
                      </div>
                    </button>

                    {isSelected && (
                      <EvaluationDetails
                        evaluation={evaluation}
                        assignment={assignment}
                        studentName={studentName}
                        companyName={companyName}
                        opportunity={opportunity}
                        selectedStudent={getStudent(studentId)}
                        selectedCompany={getCompany(companyId)}
                        selectedOpportunity={opportunity}
                        template={getTemplate(evaluation.template_id)}
                        getEvaluatorName={getEvaluatorName}
                        getEvaluatorEmail={getEvaluatorEmail}
                        getStudentNumber={getStudentNumber}
                        getStudentEmail={getStudentEmail}
                        getCompanyEmail={getCompanyEmail}
                        formatDate={formatDate}
                        renderStars={renderStars}
                        getResponseEntries={getResponseEntries}
                        getResponseRating={getResponseRating}
                        darkMode={darkMode}
                        softCard={softCard}
                        muted={muted}
                      />
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* =====================================================
          VIEW ONLY NOTICE
      ===================================================== */}

      <div
        className={`mt-8 border rounded-2xl p-4 ${
          darkMode
            ? "bg-slate-900/50 border-slate-700"
            : "bg-slate-50 border-slate-200"
        }`}
      >
        <div className="flex items-start gap-3">
          <span className="text-lg">👁️</span>

          <div>
            <p className="text-sm font-bold">Registrar view-only access</p>

            <p className={`text-xs mt-1 leading-relaxed ${muted}`}>
              Evaluations displayed here are read-only. Registrar advisers can
              review submitted and finalized evaluations from students within
              their assigned school, but cannot modify evaluator responses or
              evaluation status.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// =========================================================
// EVALUATION DETAILS COMPONENT
// =========================================================

function EvaluationDetails({
  evaluation,
  assignment,
  studentName,
  companyName,
  opportunity,
  selectedStudent,
  selectedCompany,
  selectedOpportunity,
  template,
  getEvaluatorName,
  getEvaluatorEmail,
  getStudentNumber,
  getStudentEmail,
  getCompanyEmail,
  formatDate,
  renderStars,
  getResponseEntries,
  getResponseRating,
  darkMode,
  softCard,
  muted,
}) {
  const studentId = evaluation.evaluated_student_id || assignment?.student_id;

  const companyId = evaluation.evaluated_company_id || assignment?.company_id;

  const responses = evaluation.responses || {};

  const responseEntries = getResponseEntries(evaluation);

  // =========================================================
  // BUILD CRITERION MAP
  // =========================================================

  const criterionMap = {};

  const sections = template?.evaluation_sections
    ? [...template.evaluation_sections]
        .sort(
          (a, b) => Number(a.display_order || 0) - Number(b.display_order || 0)
        )
        .map((section) => ({
          ...section,
          evaluation_criteria: [...(section.evaluation_criteria || [])].sort(
            (a, b) =>
              Number(a.display_order || 0) - Number(b.display_order || 0)
          ),
        }))
    : [];

  sections.forEach((section) => {
    (section.evaluation_criteria || []).forEach((criterion) => {
      criterionMap[criterion.id] = {
        criterion: criterion.criterion,
        sectionName: section.name,
        sectionId: section.id,
      };
    });
  });

  // =========================================================
  // GROUP RESPONSES BY SECTION
  // =========================================================

  const groupedResponses = {};

  responseEntries.forEach(([criterionId, response]) => {
    const criterionInfo = criterionMap[criterionId];

    const sectionName = criterionInfo?.sectionName || "Other Criteria";

    if (!groupedResponses[sectionName]) {
      groupedResponses[sectionName] = [];
    }

    groupedResponses[sectionName].push({
      criterionId,
      criterionName: criterionInfo?.criterion || "Unknown Criterion",
      response,
    });
  });

  const groupedSectionEntries = Object.entries(groupedResponses);

  return (
    <div
      className={`border-t ${
        darkMode ? "border-slate-700" : "border-slate-200"
      }`}
    >
      <div className="p-5">
        {/* ===================================================
            VIEW ONLY LABEL
        =================================================== */}

        <div
          className={`mb-5 rounded-xl border p-3 ${
            darkMode
              ? "bg-blue-950/20 border-blue-900/50"
              : "bg-blue-50 border-blue-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <span>👁️</span>

            <div>
              <p className="text-xs font-bold">View-only evaluation</p>

              <p className={`text-[11px] mt-0.5 ${muted}`}>
                This evaluation cannot be modified from the Registrar portal.
              </p>
            </div>
          </div>
        </div>

        {/* ===================================================
            BASIC INFORMATION
        =================================================== */}

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <div className={`border rounded-xl p-4 ${softCard}`}>
            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
              Student
            </p>

            <p className="text-sm font-semibold mt-1">{studentName}</p>

            <p className={`text-[11px] mt-1 ${muted}`}>
              {getStudentNumber(studentId)}
            </p>

            {getStudentEmail(studentId) && (
              <p className={`text-[11px] mt-1 break-all ${muted}`}>
                {getStudentEmail(studentId)}
              </p>
            )}
          </div>

          <div className={`border rounded-xl p-4 ${softCard}`}>
            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
              Company
            </p>

            <p className="text-sm font-semibold mt-1">{companyName}</p>

            {getCompanyEmail(companyId) && (
              <p className={`text-[11px] mt-1 break-all ${muted}`}>
                {getCompanyEmail(companyId)}
              </p>
            )}
          </div>

          <div className={`border rounded-xl p-4 ${softCard}`}>
            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
              Internship
            </p>

            <p className="text-sm font-semibold mt-1">
              {selectedOpportunity?.title ||
                opportunity?.title ||
                "Unknown Opportunity"}
            </p>

            <p className={`text-[11px] mt-1 ${muted}`}>
              {selectedOpportunity?.position_type ||
                opportunity?.position_type ||
                "Internship"}
            </p>
          </div>

          <div className={`border rounded-xl p-4 ${softCard}`}>
            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
              Internship Period
            </p>

            <p className="text-sm font-semibold mt-1">
              {assignment?.start_date
                ? formatDate(assignment.start_date)
                : "N/A"}
            </p>

            <p className={`text-[11px] mt-1 ${muted}`}>
              to{" "}
              {assignment?.end_date ? formatDate(assignment.end_date) : "N/A"}
            </p>
          </div>
        </div>

        {/* ===================================================
            EVALUATOR INFORMATION
        =================================================== */}

        <div className={`border rounded-xl p-4 mb-6 ${softCard}`}>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                Evaluation Direction
              </p>

              <p className="text-sm font-bold mt-1">
                {evaluation.evaluator_role === "student"
                  ? "Student → Company"
                  : "Company → Student"}
              </p>
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                Submitted By
              </p>

              <p className="text-sm font-bold mt-1">
                {getEvaluatorName(evaluation)}
              </p>

              {getEvaluatorEmail(evaluation) && (
                <p className={`text-xs mt-1 break-all ${muted}`}>
                  {getEvaluatorEmail(evaluation)}
                </p>
              )}
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                Evaluation Status
              </p>

              <span
                className={`inline-block mt-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                  evaluation.status === "finalized"
                    ? darkMode
                      ? "bg-blue-950/40 text-blue-300"
                      : "bg-blue-50 text-blue-700"
                    : darkMode
                    ? "bg-emerald-950/40 text-emerald-300"
                    : "bg-emerald-50 text-emerald-700"
                }`}
              >
                {String(evaluation.status || "").toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* ===================================================
            TEMPLATE INFORMATION
        =================================================== */}

        {template && (
          <div className={`border rounded-xl p-4 mb-6 ${softCard}`}>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                  Evaluation Template
                </p>

                <p className="text-sm font-bold mt-1">{template.name}</p>

                {template.description && (
                  <p className={`text-xs mt-1 ${muted}`}>
                    {template.description}
                  </p>
                )}
              </div>

              <span
                className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                  darkMode
                    ? "bg-slate-800 text-slate-300"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                Version {template.version}
              </span>
            </div>
          </div>
        )}

        {/* ===================================================
            OVERALL RATING
        =================================================== */}

        <div className={`border rounded-xl p-5 mb-6 ${softCard}`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                Overall Rating
              </p>

              <p className="text-sm font-semibold mt-1">
                Overall evaluation assessment
              </p>
            </div>

            <div>{renderStars(evaluation.overall_rating)}</div>
          </div>
        </div>

        {/* ===================================================
            CRITERIA RATINGS
        =================================================== */}

        <div className="mb-6">
          <div className="mb-3">
            <p className="text-sm font-bold">Evaluation Ratings</p>

            <p className={`text-xs mt-1 ${muted}`}>
              Ratings submitted by the evaluator for each evaluation criterion.
            </p>
          </div>

          {responseEntries.length === 0 ? (
            <div className={`border rounded-xl p-5 ${softCard}`}>
              <p className={`text-sm ${muted}`}>
                No individual criterion ratings were provided.
              </p>
            </div>
          ) : template && groupedSectionEntries.length > 0 ? (
            <div className="space-y-5">
              {groupedSectionEntries.map(([sectionName, sectionResponses]) => (
                <div key={sectionName}>
                  <div className="mb-2">
                    <p className="text-sm font-black">{sectionName}</p>
                  </div>

                  <div className="space-y-3">
                    {sectionResponses.map(
                      ({ criterionId, criterionName, response }) => {
                        const rating = getResponseRating(response);

                        let displayValue = response;

                        if (response && typeof response === "object") {
                          displayValue =
                            response.rating ??
                            response.value ??
                            response.answer ??
                            "";
                        }

                        return (
                          <div
                            key={criterionId}
                            className={`border rounded-xl p-4 ${softCard}`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-xs font-semibold">
                                  {criterionName}
                                </p>

                                {typeof displayValue === "string" &&
                                  displayValue &&
                                  rating === null && (
                                    <p className={`text-sm mt-1 ${muted}`}>
                                      {displayValue}
                                    </p>
                                  )}
                              </div>

                              {rating !== null && (
                                <div className="shrink-0">
                                  {renderStars(rating)}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {responseEntries.map(([criterionId, response]) => {
                const rating = getResponseRating(response);

                let displayValue = response;

                if (response && typeof response === "object") {
                  displayValue =
                    response.rating ?? response.value ?? response.answer ?? "";
                }

                return (
                  <div
                    key={criterionId}
                    className={`border rounded-xl p-4 ${softCard}`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold">
                          Unknown Criterion
                        </p>

                        <p className={`text-[10px] mt-1 break-all ${muted}`}>
                          Criterion ID: {criterionId}
                        </p>

                        {typeof displayValue === "string" &&
                          displayValue &&
                          rating === null && (
                            <p className={`text-sm mt-1 ${muted}`}>
                              {displayValue}
                            </p>
                          )}
                      </div>

                      {rating !== null && (
                        <div className="shrink-0">{renderStars(rating)}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ===================================================
            COMMENTS
        =================================================== */}

        <div className="mb-6">
          <p className="text-sm font-bold mb-3">Written Feedback</p>

          {evaluation.comments ? (
            <div
              className={`border rounded-xl p-4 text-sm leading-relaxed whitespace-pre-line ${
                darkMode
                  ? "border-slate-700 bg-slate-800/50 text-slate-300"
                  : "border-slate-200 bg-slate-50 text-slate-600"
              }`}
            >
              {evaluation.comments}
            </div>
          ) : (
            <div className={`border rounded-xl p-4 ${softCard}`}>
              <p className={`text-sm ${muted}`}>
                No written feedback was provided.
              </p>
            </div>
          )}
        </div>

        {/* ===================================================
            DATES
        =================================================== */}

        <div
          className={`pt-4 border-t grid sm:grid-cols-2 gap-3 ${
            darkMode ? "border-slate-700" : "border-slate-200"
          }`}
        >
          <div>
            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
              Submitted
            </p>

            <p className="text-xs font-semibold mt-1">
              {formatDate(evaluation.submitted_at)}
            </p>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
              Finalized
            </p>

            <p className="text-xs font-semibold mt-1">
              {evaluation.finalized_at
                ? formatDate(evaluation.finalized_at)
                : "Not finalized"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
