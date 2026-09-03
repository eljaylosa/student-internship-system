import React, { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabaseStudent } from "../../supabaseClient";

const STATUS = {
  assignment: {
    PENDING: "pending",
    ACTIVE: "active",
    COMPLETED: "completed",
    SUSPENDED: "suspended",
    TERMINATED: "terminated",
  },

  evaluation: {
    DRAFT: "draft",
    SUBMITTED: "submitted",
    RETURNED: "returned",
    FINALIZED: "finalized",
  },
};

export default function Evaluation() {
  const { darkMode } = useOutletContext();

  // =========================================================
  // STATE
  // =========================================================

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [student, setStudent] = useState(null);

  // All completed assignments
  const [assignments, setAssignments] = useState([]);

  // Currently selected completed assignment
  const [assignment, setAssignment] = useState(null);

  // Companies belonging to completed assignments
  const [companies, setCompanies] = useState([]);

  // Search / filter
  const [companySearch, setCompanySearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState("All");

  const [company, setCompany] = useState(null);

  // Company → Student evaluation
  const [companyEvaluation, setCompanyEvaluation] = useState(null);
  const [companyTemplate, setCompanyTemplate] = useState(null);
  const [companySections, setCompanySections] = useState([]);

  // Student → Company evaluation
  const [studentCompanyEvaluation, setStudentCompanyEvaluation] =
    useState(null);
  const [template, setTemplate] = useState(null);
  const [sections, setSections] = useState([]);

  const [companyRatings, setCompanyRatings] = useState({});
  const [companyComments, setCompanyComments] = useState("");

  const [companySubmitted, setCompanySubmitted] = useState(false);

  // =========================================================
  // THEME
  // =========================================================

  const pageText = darkMode ? "text-slate-100" : "text-slate-900";

  const card = darkMode
    ? "bg-slate-900 border-slate-700"
    : "bg-white border-slate-200";

  const mutedText = darkMode ? "text-slate-400" : "text-slate-500";

  const inputClass = darkMode
    ? "bg-slate-800 border-slate-700 text-slate-100"
    : "bg-white border-slate-200 text-slate-900";

  // =========================================================
  // STUDENT → COMPANY CRITERIA
  // =========================================================

  const allCriteria = useMemo(() => {
    return sections
      .flatMap((section) => section.evaluation_criteria || [])
      .sort((a, b) => a.display_order - b.display_order);
  }, [sections]);

  // =========================================================
  // COMPANY → STUDENT CRITERIA
  // =========================================================

  const allCompanyEvaluationCriteria = useMemo(() => {
    return companySections
      .flatMap((section) => section.evaluation_criteria || [])
      .sort((a, b) => a.display_order - b.display_order);
  }, [companySections]);

  // =========================================================
  // FILTERED COMPLETED ASSIGNMENTS
  // =========================================================

  const filteredAssignments = useMemo(() => {
    const normalizedSearch = companySearch.trim().toLowerCase();

    return assignments.filter((item) => {
      const itemCompany = companies.find(
        (companyItem) => companyItem.id === item.company_id
      );

      const companyName = (itemCompany?.company_name || "").toLowerCase();

      const opportunityTitle = (item.opportunity?.title || "").toLowerCase();

      const matchesSearch =
        !normalizedSearch ||
        companyName.includes(normalizedSearch) ||
        opportunityTitle.includes(normalizedSearch);

      const matchesCompany =
        companyFilter === "All" || item.company_id === companyFilter;

      return matchesSearch && matchesCompany;
    });
  }, [assignments, companies, companySearch, companyFilter]);

  // =========================================================
  // COMPANY FILTER OPTIONS
  // =========================================================

  const uniqueCompanies = useMemo(() => {
    const seen = new Set();

    return companies.filter((item) => {
      if (!item?.id || seen.has(item.id)) {
        return false;
      }

      seen.add(item.id);
      return true;
    });
  }, [companies]);

  // =========================================================
  // LOAD DATA
  // =========================================================

  useEffect(() => {
    loadEvaluationData();
  }, []);

  async function loadEvaluationData() {
    try {
      setLoading(true);
      setError("");

      // =====================================================
      // CURRENT USER
      // =====================================================

      const {
        data: { user },
        error: userError,
      } = await supabaseStudent.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        throw new Error("You are not authenticated.");
      }

      const userId = user.id;

      // =====================================================
      // STUDENT PROFILE
      // =====================================================

      const { data: studentData, error: studentError } = await supabaseStudent
        .from("students")
        .select(
          `
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
            `
        )
        .eq("id", userId)
        .maybeSingle();

      if (studentError) {
        throw studentError;
      }

      if (!studentData) {
        throw new Error("Student profile could not be found.");
      }

      setStudent(studentData);

      // =====================================================
      // ALL COMPLETED ASSIGNMENTS
      // =====================================================

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
              created_at
            `
          )
          .eq("student_id", userId)
          .eq("status", STATUS.assignment.COMPLETED)
          .not("deployed_at", "is", null)
          .order("end_date", { ascending: false });

      if (assignmentError) {
        throw assignmentError;
      }

      const completedAssignments = assignmentData || [];

      // =====================================================
      // NO COMPLETED INTERNSHIP
      // =====================================================

      if (completedAssignments.length === 0) {
        setAssignments([]);
        setAssignment(null);
        setCompanies([]);
        setCompany(null);
        setCompanyEvaluation(null);
        setStudentCompanyEvaluation(null);
        setLoading(false);
        return;
      }

      // =====================================================
      // GET COMPANIES
      // =====================================================

      const companyIds = [
        ...new Set(
          completedAssignments.map((item) => item.company_id).filter(Boolean)
        ),
      ];

      let companyRows = [];

      if (companyIds.length > 0) {
        const { data, error: companyError } = await supabaseStudent
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

        if (companyError) {
          throw companyError;
        }

        companyRows = data || [];
      }

      setCompanies(companyRows);

      // =====================================================
      // GET OPPORTUNITIES
      // =====================================================

      const opportunityIds = [
        ...new Set(
          completedAssignments
            .map((item) => item.opportunity_id)
            .filter(Boolean)
        ),
      ];

      let opportunityRows = [];

      if (opportunityIds.length > 0) {
        const { data, error: opportunityError } = await supabaseStudent
          .from("opportunities")
          .select(
            `
                id,
                title,
                description,
                location,
                position_type,
                internship_start_date,
                internship_end_date,
                internship_start,
                internship_end
              `
          )
          .in("id", opportunityIds);

        if (opportunityError) {
          throw opportunityError;
        }

        opportunityRows = data || [];
      }

      // =====================================================
      // ATTACH OPPORTUNITY TO ASSIGNMENTS
      // =====================================================

      const mappedAssignments = completedAssignments.map((item) => ({
        ...item,
        opportunity:
          opportunityRows.find(
            (opportunity) => opportunity.id === item.opportunity_id
          ) || null,
      }));

      setAssignments(mappedAssignments);

      // =====================================================
      // SELECT FIRST ASSIGNMENT
      // =====================================================

      const firstAssignment = mappedAssignments[0];

      setAssignment(firstAssignment);

      // =====================================================
      // LOAD SELECTED ASSIGNMENT DATA
      // =====================================================

      await loadSelectedAssignmentData(firstAssignment, userId, companyRows);

      // =====================================================
      // LOAD PUBLISHED STUDENT → COMPANY TEMPLATE
      //
      // This template is ONLY for the student's own evaluation.
      // =====================================================

      const { data: templateData, error: templateError } = await supabaseStudent
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
        .eq("direction", "student_to_company")
        .eq("status", "published")
        .order("version", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (templateError) {
        throw templateError;
      }

      if (!templateData) {
        throw new Error(
          "No published Student → Company evaluation template is available."
        );
      }

      setTemplate(templateData);

      // =====================================================
      // SORT STUDENT → COMPANY TEMPLATE
      // =====================================================

      const sortedSections = [...(templateData.evaluation_sections || [])]
        .sort((a, b) => a.display_order - b.display_order)
        .map((section) => ({
          ...section,
          evaluation_criteria: [...(section.evaluation_criteria || [])].sort(
            (a, b) => a.display_order - b.display_order
          ),
        }));

      setSections(sortedSections);
    } catch (err) {
      console.error("Evaluation load error:", err);

      setError(err?.message || "Failed to load evaluation data.");
    } finally {
      setLoading(false);
    }
  }

  // =========================================================
  // LOAD SELECTED ASSIGNMENT
  // =========================================================

  async function loadSelectedAssignmentData(
    selectedAssignment,
    userId,
    companyRows = companies
  ) {
    try {
      setError("");

      if (!selectedAssignment) {
        setCompany(null);
        setCompanyEvaluation(null);
        setStudentCompanyEvaluation(null);
        setCompanyTemplate(null);
        setCompanySections([]);
        setCompanyRatings({});
        setCompanyComments("");
        setCompanySubmitted(false);
        return;
      }

      // =====================================================
      // COMPANY
      // =====================================================

      const selectedCompany =
        companyRows.find((item) => item.id === selectedAssignment.company_id) ||
        null;

      setCompany(selectedCompany);

      // =====================================================
      // EVALUATIONS FOR SELECTED ASSIGNMENT
      // =====================================================

      const { data: evaluationsData, error: evaluationsError } =
        await supabaseStudent
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
              created_at
            `
          )
          .eq("assignment_id", selectedAssignment.id);

      if (evaluationsError) {
        throw evaluationsError;
      }

      // =====================================================
      // COMPANY → STUDENT EVALUATION
      // =====================================================

      const companyEval =
        evaluationsData?.find(
          (item) =>
            item.evaluator_role === "company_supervisor" &&
            ["submitted", "finalized"].includes(item.status)
        ) || null;

      setCompanyEvaluation(companyEval);

      // =====================================================
      // STUDENT → COMPANY EVALUATION
      // =====================================================

      const studentEval =
        evaluationsData?.find(
          (item) =>
            item.evaluator_role === "student" && item.evaluator_id === userId
        ) || null;

      setStudentCompanyEvaluation(studentEval);

      // =====================================================
      // LOAD COMPANY → STUDENT TEMPLATE
      //
      // IMPORTANT:
      // Uses the template that was actually used when the
      // company submitted the evaluation.
      // =====================================================

      if (companyEval?.template_id) {
        const { data: companyTemplateData, error: companyTemplateError } =
          await supabaseStudent
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
            .eq("id", companyEval.template_id)
            .maybeSingle();

        if (companyTemplateError) {
          throw companyTemplateError;
        }

        if (companyTemplateData) {
          setCompanyTemplate(companyTemplateData);

          const sortedCompanySections = [
            ...(companyTemplateData.evaluation_sections || []),
          ]
            .sort((a, b) => a.display_order - b.display_order)
            .map((section) => ({
              ...section,
              evaluation_criteria: [
                ...(section.evaluation_criteria || []),
              ].sort((a, b) => a.display_order - b.display_order),
            }));

          setCompanySections(sortedCompanySections);
        } else {
          setCompanyTemplate(null);
          setCompanySections([]);
        }
      } else {
        setCompanyTemplate(null);
        setCompanySections([]);
      }

      // =====================================================
      // INITIAL STUDENT RATINGS
      // =====================================================

      const initialRatings = {};

      sections.forEach((section) => {
        (section.evaluation_criteria || []).forEach((criterion) => {
          initialRatings[criterion.id] = Number(
            studentEval?.responses?.[criterion.id] || 3
          );
        });
      });

      setCompanyRatings(initialRatings);

      setCompanyComments(studentEval?.comments || "");

      // =====================================================
      // SUBMISSION STATE
      // =====================================================

      if (
        studentEval?.status === STATUS.evaluation.SUBMITTED ||
        studentEval?.status === STATUS.evaluation.FINALIZED
      ) {
        setCompanySubmitted(true);
      } else {
        setCompanySubmitted(false);
      }
    } catch (err) {
      console.error("Selected assignment evaluation error:", err);

      setError(
        err?.message || "Failed to load the selected internship evaluation."
      );
    }
  }

  // =========================================================
  // SELECT ASSIGNMENT
  // =========================================================

  const handleSelectAssignment = async (selectedId) => {
    const selected = assignments.find((item) => item.id === selectedId);

    if (!selected) return;

    setAssignment(selected);

    setCompany(null);
    setCompanyEvaluation(null);
    setStudentCompanyEvaluation(null);
    setCompanyTemplate(null);
    setCompanySections([]);
    setCompanyRatings({});
    setCompanyComments("");
    setCompanySubmitted(false);
    setError("");

    const {
      data: { user },
    } = await supabaseStudent.auth.getUser();

    if (!user) {
      setError("You are not authenticated.");
      return;
    }

    await loadSelectedAssignmentData(selected, user.id, companies);
  };

  // =========================================================
  // CURRENT STUDENT NAME
  // =========================================================

  const studentName = useMemo(() => {
    const user = student?.users;

    if (!user) {
      return "Student";
    }

    return [user.first_name, user.middle_name, user.last_name]
      .filter(Boolean)
      .join(" ");
  }, [student]);

  // =========================================================
  // COMPANY EVALUATION AVERAGE
  // =========================================================

  const averageInternRating = useMemo(() => {
    if (!companyEvaluation) {
      return 0;
    }

    const storedOverall = Number(companyEvaluation.overall_rating);

    if (
      Number.isFinite(storedOverall) &&
      storedOverall >= 1 &&
      storedOverall <= 5
    ) {
      return storedOverall;
    }

    const ratingValues = Object.values(companyEvaluation.responses || {})
      .map(Number)
      .filter((rating) => rating >= 1 && rating <= 5);

    if (ratingValues.length === 0) {
      return 0;
    }

    return (
      ratingValues.reduce((sum, rating) => sum + rating, 0) /
      ratingValues.length
    );
  }, [companyEvaluation]);

  // =========================================================
  // STUDENT COMPANY AVERAGE
  // =========================================================

  const averageCompanyRating = useMemo(() => {
    if (!studentCompanyEvaluation) {
      return 0;
    }

    const storedOverall = Number(studentCompanyEvaluation.overall_rating);

    if (
      Number.isFinite(storedOverall) &&
      storedOverall >= 1 &&
      storedOverall <= 5
    ) {
      return storedOverall;
    }

    const ratingValues = Object.values(studentCompanyEvaluation.responses || {})
      .map(Number)
      .filter((rating) => rating >= 1 && rating <= 5);

    if (ratingValues.length === 0) {
      return 0;
    }

    return (
      ratingValues.reduce((sum, rating) => sum + rating, 0) /
      ratingValues.length
    );
  }, [studentCompanyEvaluation]);

  // =========================================================
  // GET COMPANY EVALUATION RATING
  // =========================================================

  const getCompanyEvaluationRating = (criterionId) => {
    const value = companyEvaluation?.responses?.[criterionId];

    if (value === null || value === undefined) {
      return 0;
    }

    const rating = Number(value);

    return Number.isFinite(rating) ? rating : 0;
  };

  // =========================================================
  // GET STUDENT EVALUATION RATING
  // =========================================================

  const getStudentEvaluationRating = (criterionId) => {
    const value = studentCompanyEvaluation?.responses?.[criterionId];

    if (value === null || value === undefined) {
      return 0;
    }

    const rating = Number(value);

    return Number.isFinite(rating) ? rating : 0;
  };

  // =========================================================
  // UPDATE RATING
  // =========================================================

  const updateRating = (criterionId, value) => {
    setCompanyRatings((previous) => ({
      ...previous,
      [criterionId]: Number(value),
    }));

    setCompanySubmitted(false);
  };

  // =========================================================
  // SUBMIT STUDENT → COMPANY EVALUATION
  // =========================================================

  const submitCompanyEvaluation = async (event) => {
    event.preventDefault();

    if (!assignment) {
      alert("No completed internship assignment found.");
      return;
    }

    if (!company) {
      alert("Company information could not be found.");
      return;
    }

    if (!template) {
      alert("Evaluation template is unavailable.");
      return;
    }

    if (studentCompanyEvaluation) {
      alert("You have already submitted an evaluation for this internship.");
      return;
    }

    if (!companyComments.trim()) {
      alert("Please provide written feedback about the company.");
      return;
    }

    // =======================================================
    // MAKE SURE EVERY CRITERION HAS A RATING
    // =======================================================

    const missingCriteria = allCriteria.filter(
      (criterion) =>
        !companyRatings[criterion.id] ||
        Number(companyRatings[criterion.id]) < 1
    );

    if (missingCriteria.length > 0) {
      alert("Please rate all evaluation criteria before submitting.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      // =====================================================
      // CURRENT USER
      // =====================================================

      const {
        data: { user },
        error: userError,
      } = await supabaseStudent.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        throw new Error("You are not authenticated.");
      }

      // =====================================================
      // CALCULATE OVERALL RATING
      // =====================================================

      const ratingValues = allCriteria.map((criterion) =>
        Number(companyRatings[criterion.id])
      );

      const overallRating =
        ratingValues.length > 0
          ? Number(
              (
                ratingValues.reduce((sum, rating) => sum + rating, 0) /
                ratingValues.length
              ).toFixed(2)
            )
          : null;

      // =====================================================
      // INSERT EVALUATION
      // =====================================================

      const { data: insertedEvaluation, error: insertError } =
        await supabaseStudent
          .from("evaluations")
          .insert({
            assignment_id: assignment.id,
            template_id: template.id,
            evaluator_id: user.id,
            evaluated_student_id: assignment.student_id,
            evaluated_company_id: assignment.company_id,
            evaluator_role: "student",
            status: STATUS.evaluation.SUBMITTED,
            responses: companyRatings,
            overall_rating: overallRating,
            comments: companyComments.trim(),
            submitted_at: new Date().toISOString(),
          })
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
            created_at
          `
          )
          .single();

      if (insertError) {
        // ===================================================
        // DUPLICATE EVALUATION
        // ===================================================

        if (insertError.code === "23505") {
          alert(
            "You have already submitted an evaluation for this internship."
          );

          await loadEvaluationData();
          return;
        }

        throw insertError;
      }

      setStudentCompanyEvaluation(insertedEvaluation);
      setCompanySubmitted(true);
    } catch (err) {
      console.error("Submit evaluation error:", err);

      setError(err?.message || "Failed to submit your company evaluation.");
    } finally {
      setSubmitting(false);
    }
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className={`p-5 md:p-6 lg:p-8 max-w-[1000px] mx-auto ${pageText}`}>
        <div className="mb-6">
          <p className="text-xs uppercase tracking-widest font-bold text-slate-400">
            Student Portal
          </p>

          <h1 className="text-2xl font-black">Internship Evaluation</h1>
        </div>

        <section className={`border rounded-2xl p-8 ${card}`}>
          <div className="text-center">
            <div className="text-3xl mb-3">⏳</div>

            <p className="font-semibold">Loading evaluation...</p>

            <p className={`text-sm mt-1 ${mutedText}`}>
              Please wait while we load your internship evaluations.
            </p>
          </div>
        </section>
      </div>
    );
  }

  // =========================================================
  // ERROR WITH NO ASSIGNMENT
  // =========================================================

  if (error && assignments.length === 0) {
    return (
      <div className={`p-5 md:p-6 lg:p-8 max-w-[1000px] mx-auto ${pageText}`}>
        <div className="mb-6">
          <p className="text-xs uppercase tracking-widest font-bold text-slate-400">
            Student Portal
          </p>

          <h1 className="text-2xl font-black">Internship Evaluation</h1>

          <p className={`text-sm mt-1 ${mutedText}`}>
            View your internship evaluation and provide feedback about your
            internship company.
          </p>
        </div>

        <section
          className={`border rounded-2xl p-6 ${
            darkMode
              ? "bg-red-950/30 border-red-900"
              : "bg-red-50 border-red-200"
          }`}
        >
          <p
            className={`font-semibold ${
              darkMode ? "text-red-300" : "text-red-700"
            }`}
          >
            Unable to load evaluation
          </p>

          <p
            className={`text-sm mt-1 ${
              darkMode ? "text-red-400" : "text-red-600"
            }`}
          >
            {error}
          </p>

          <button
            type="button"
            onClick={loadEvaluationData}
            className="mt-4 px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
          >
            Try Again
          </button>
        </section>
      </div>
    );
  }

  // =========================================================
  // NO COMPLETED INTERNSHIP
  // =========================================================

  if (assignments.length === 0) {
    return (
      <div className={`p-5 md:p-6 lg:p-8 max-w-[1000px] mx-auto ${pageText}`}>
        <div className="mb-6">
          <p className="text-xs uppercase tracking-widest font-bold text-slate-400">
            Student Portal
          </p>

          <h1 className="text-2xl font-black">Internship Evaluation</h1>

          <p className={`text-sm mt-1 ${mutedText}`}>
            View your internship evaluation and provide feedback about your
            internship company.
          </p>
        </div>

        <section className={`border rounded-2xl p-6 ${card}`}>
          <div className="text-center py-8">
            <div className="text-4xl mb-3">📋</div>

            <p className="font-semibold">No completed internship found.</p>

            <p className={`text-sm mt-1 ${mutedText}`}>
              The evaluation page becomes available after your internship has
              been officially completed.
            </p>
          </div>
        </section>
      </div>
    );
  }

  // =========================================================
  // MAIN PAGE
  // =========================================================

  return (
    <div className={`p-5 md:p-6 lg:p-8 max-w-[1000px] mx-auto ${pageText}`}>
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="mb-6">
        <p className="text-xs uppercase tracking-widest font-bold text-slate-400">
          Student Portal
        </p>

        <h1 className="text-2xl font-black">Internship Evaluation</h1>

        <p className={`text-sm mt-1 ${mutedText}`}>
          View your internship evaluations and provide feedback about your
          internship companies.
        </p>
      </div>

      {/* =====================================================
          SEARCH + COMPANY FILTER
      ===================================================== */}

      <section className={`border rounded-2xl p-5 mb-5 ${card}`}>
        <div className="flex flex-col lg:flex-row gap-4">
          {/* SEARCH */}

          <div className="flex-1">
            <label className={`block text-xs font-bold mb-2 ${pageText}`}>
              Search Company
            </label>

            <div className="relative">
              <span
                className={`absolute left-3 top-1/2 -translate-y-1/2 ${mutedText}`}
              >
                🔎
              </span>

              <input
                type="text"
                value={companySearch}
                onChange={(event) => setCompanySearch(event.target.value)}
                placeholder="Search by company name or position..."
                className={`w-full border rounded-lg pl-10 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${inputClass}`}
              />
            </div>
          </div>

          {/* COMPANY FILTER */}

          <div className="w-full lg:w-64">
            <label className={`block text-xs font-bold mb-2 ${pageText}`}>
              Company
            </label>

            <select
              value={companyFilter}
              onChange={(event) => setCompanyFilter(event.target.value)}
              className={`w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${inputClass}`}
            >
              <option value="All">All Companies</option>

              {uniqueCompanies.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.company_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* RESULT COUNT */}

        <div
          className={`mt-4 pt-3 border-t text-xs ${
            darkMode ? "border-slate-700" : "border-slate-200"
          } ${mutedText}`}
        >
          Showing{" "}
          <span className={`font-bold ${pageText}`}>
            {filteredAssignments.length}
          </span>{" "}
          of{" "}
          <span className={`font-bold ${pageText}`}>{assignments.length}</span>{" "}
          completed internship
          {assignments.length !== 1 ? "s" : ""}
        </div>
      </section>

      {/* =====================================================
          COMPLETED INTERNSHIP SELECTOR
      ===================================================== */}

      {filteredAssignments.length > 0 ? (
        <section className={`border rounded-2xl p-5 mb-5 ${card}`}>
          <div className="mb-4">
            <p className="text-xs uppercase tracking-wide font-bold text-slate-400">
              Completed Internships
            </p>

            <p className={`text-xs mt-1 ${mutedText}`}>
              Select an internship to view its evaluation.
            </p>
          </div>

          <div className="space-y-3">
            {filteredAssignments.map((item) => {
              const itemCompany = companies.find(
                (companyItem) => companyItem.id === item.company_id
              );

              const isSelected = assignment?.id === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectAssignment(item.id)}
                  className={`w-full text-left border rounded-xl p-4 transition ${
                    isSelected
                      ? darkMode
                        ? "border-blue-500 bg-blue-950/30"
                        : "border-blue-500 bg-blue-50"
                      : darkMode
                      ? "border-slate-700 hover:bg-slate-800"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold">
                          {itemCompany?.company_name || "Unknown Company"}
                        </p>

                        <span className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                          COMPLETED
                        </span>
                      </div>

                      <p className={`text-xs mt-1 ${mutedText}`}>
                        {item.opportunity?.title || "Internship Position"}
                      </p>

                      <p className={`text-xs mt-1 ${mutedText}`}>
                        {item.start_date || "—"} to {item.end_date || "—"}
                      </p>
                    </div>

                    <div className="text-left md:text-right">
                      {isSelected ? (
                        <span className="text-xs font-bold text-blue-600">
                          Selected
                        </span>
                      ) : (
                        <span className={`text-xs ${mutedText}`}>
                          View Evaluation
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      ) : (
        <section className={`border rounded-2xl p-6 mb-5 ${card}`}>
          <div className="text-center py-6">
            <div className="text-3xl mb-3">🔎</div>

            <p className="font-semibold">No internships found.</p>

            <p className={`text-sm mt-1 ${mutedText}`}>
              Try changing your company search or filter.
            </p>

            <button
              type="button"
              onClick={() => {
                setCompanySearch("");
                setCompanyFilter("All");
              }}
              className="mt-4 px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
            >
              Clear Filters
            </button>
          </div>
        </section>
      )}

      {/* =====================================================
          SELECTED INTERNSHIP
      ===================================================== */}

      {assignment && (
        <>
          {/* =================================================
              ERROR FOR SELECTED ASSIGNMENT
          ================================================= */}

          {error && (
            <div
              className={`mb-5 border rounded-2xl p-4 ${
                darkMode
                  ? "bg-red-950/30 border-red-900"
                  : "bg-red-50 border-red-200"
              }`}
            >
              <p
                className={`text-sm font-semibold ${
                  darkMode ? "text-red-300" : "text-red-700"
                }`}
              >
                {error}
              </p>
            </div>
          )}

          {/* =================================================
              SUBMISSION SUCCESS
          ================================================= */}

          {companySubmitted && (
            <div
              className={`mb-5 border rounded-2xl p-4 ${
                darkMode
                  ? "bg-emerald-950/30 border-emerald-800"
                  : "bg-emerald-50 border-emerald-200"
              }`}
            >
              <p
                className={`font-bold text-sm ${
                  darkMode ? "text-emerald-300" : "text-emerald-700"
                }`}
              >
                Company evaluation submitted successfully.
              </p>

              <p
                className={`text-xs mt-1 ${
                  darkMode ? "text-emerald-400" : "text-emerald-600"
                }`}
              >
                Thank you for providing feedback about your internship
                experience.
              </p>
            </div>
          )}

          {/* =================================================
              INTERNSHIP SUMMARY
          ================================================= */}

          <section className={`border rounded-2xl p-5 mb-5 ${card}`}>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className={`text-xs uppercase tracking-wide ${mutedText}`}>
                  Internship Assignment
                </p>

                {/* FIXED:
                    Do NOT show assignment.id as the title.
                */}

                <h2 className="font-bold text-lg mt-1">
                  {company?.company_name || "Internship Company"}
                </h2>

                <p className={`text-sm mt-1 ${mutedText}`}>
                  {assignment.opportunity?.title || "Internship Position"}
                </p>

                <p className={`text-xs mt-1 ${mutedText}`}>{studentName}</p>

                <p className={`text-xs mt-1 ${mutedText}`}>
                  {assignment.start_date || "—"} to {assignment.end_date || "—"}
                </p>
              </div>

              <div className="px-3 py-2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold self-start md:self-center">
                Completed
              </div>
            </div>
          </section>

          {/* =================================================
              COMPANY → STUDENT EVALUATION
          ================================================= */}

          {companyEvaluation ? (
            <section
              className={`border rounded-2xl overflow-hidden mb-5 ${card}`}
            >
              <div className="px-5 py-4 border-b border-slate-200">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div>
                    <h2 className="font-bold">Company Supervisor Evaluation</h2>

                    <p className={`text-xs mt-1 ${mutedText}`}>
                      Evaluation submitted by{" "}
                      {company?.company_name || "your company supervisor"}.
                    </p>

                    {companyTemplate?.name && (
                      <p className={`text-[11px] mt-1 ${mutedText}`}>
                        Template: {companyTemplate.name}
                      </p>
                    )}
                  </div>

                  <div className="text-left md:text-right">
                    <p className="text-2xl font-black">
                      {averageInternRating.toFixed(2)}

                      <span className={`text-sm font-medium ${mutedText}`}>
                        {" "}
                        / 5
                      </span>
                    </p>

                    <p className={`text-[10px] ${mutedText}`}>Overall Rating</p>
                  </div>
                </div>
              </div>

              <div className="p-5">
                {companySections.length > 0 ? (
                  <div className="space-y-5">
                    {companySections.map((section) => (
                      <div key={section.id}>
                        <h3 className="text-sm font-bold mb-3">
                          {section.name}
                        </h3>

                        <div className="grid md:grid-cols-2 gap-3">
                          {(section.evaluation_criteria || []).map(
                            (criterion) => {
                              const rating = getCompanyEvaluationRating(
                                criterion.id
                              );

                              return (
                                <div
                                  key={criterion.id}
                                  className={`border rounded-xl p-4 ${
                                    darkMode
                                      ? "border-slate-700 bg-slate-800/50"
                                      : "border-slate-200 bg-slate-50"
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <p className="text-sm font-semibold">
                                      {criterion.criterion}
                                    </p>

                                    <p className="font-black">{rating}/5</p>
                                  </div>

                                  <div className="mt-3 flex gap-1">
                                    {[1, 2, 3, 4, 5].map((value) => (
                                      <div
                                        key={value}
                                        className={`h-2 flex-1 rounded-full ${
                                          value <= rating
                                            ? "bg-emerald-500"
                                            : darkMode
                                            ? "bg-slate-700"
                                            : "bg-slate-200"
                                        }`}
                                      />
                                    ))}
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
                  <div
                    className={`border rounded-xl p-4 ${
                      darkMode
                        ? "border-amber-800 bg-amber-950/20"
                        : "border-amber-200 bg-amber-50"
                    }`}
                  >
                    <p
                      className={`text-sm font-semibold ${
                        darkMode ? "text-amber-300" : "text-amber-700"
                      }`}
                    >
                      Evaluation criteria are unavailable.
                    </p>

                    <p
                      className={`text-xs mt-1 ${
                        darkMode ? "text-amber-400" : "text-amber-600"
                      }`}
                    >
                      The evaluation was submitted, but its original template
                      could not be loaded.
                    </p>
                  </div>
                )}

                {companyEvaluation.comments && (
                  <div className="mt-5">
                    <h3 className="text-sm font-bold mb-2">
                      Supervisor Comments
                    </h3>

                    <div
                      className={`border rounded-xl p-4 text-sm leading-relaxed ${
                        darkMode
                          ? "border-slate-700 bg-slate-800/50 text-slate-300"
                          : "border-slate-200 bg-slate-50 text-slate-600"
                      }`}
                    >
                      {companyEvaluation.comments}
                    </div>
                  </div>
                )}
              </div>
            </section>
          ) : (
            <section className={`border rounded-2xl p-6 mb-5 ${card}`}>
              <div className="text-center py-5">
                <div className="text-3xl mb-3">⏳</div>

                <p className="font-semibold">
                  Company evaluation not yet available.
                </p>

                <p className={`text-sm mt-1 ${mutedText}`}>
                  {company?.company_name || "Your company supervisor"} has not
                  submitted an evaluation for this internship yet.
                </p>

                <div className="mt-4 inline-flex items-center px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold">
                  Pending Evaluation
                </div>
              </div>
            </section>
          )}

          {/* =================================================
              STUDENT → COMPANY EVALUATION
          ================================================= */}

          <section className={`border rounded-2xl overflow-hidden ${card}`}>
            <div className="px-5 py-4 border-b border-slate-200">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div>
                  <h2 className="font-bold">
                    Evaluate Your Internship Company
                  </h2>

                  <p className={`text-xs mt-1 ${mutedText}`}>
                    Share your experience working with{" "}
                    {company?.company_name || "your internship company"}.
                  </p>
                </div>

                {studentCompanyEvaluation && (
                  <div className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                    {studentCompanyEvaluation.status ===
                    STATUS.evaluation.FINALIZED
                      ? "Finalized"
                      : "Submitted"}
                  </div>
                )}
              </div>
            </div>

            <div className="p-5">
              {/* =================================================
                  ALREADY SUBMITTED
              ================================================= */}

              {studentCompanyEvaluation ? (
                <div>
                  <div className="mb-5">
                    <p
                      className={`text-xs uppercase tracking-wide ${mutedText}`}
                    >
                      Your Overall Rating
                    </p>

                    <div className="flex items-center gap-3 mt-2">
                      <p className="text-3xl font-black">
                        {averageCompanyRating.toFixed(2)}
                      </p>

                      <div>
                        <p className="text-sm font-bold">/ 5</p>

                        <p className={`text-xs ${mutedText}`}>
                          Overall Experience
                        </p>
                      </div>
                    </div>
                  </div>

                  {sections.length > 0 ? (
                    <div className="space-y-5">
                      {sections.map((section) => (
                        <div key={section.id}>
                          <h3 className="text-sm font-bold mb-3">
                            {section.name}
                          </h3>

                          <div className="grid md:grid-cols-2 gap-3">
                            {(section.evaluation_criteria || []).map(
                              (criterion) => {
                                const rating = getStudentEvaluationRating(
                                  criterion.id
                                );

                                return (
                                  <div
                                    key={criterion.id}
                                    className={`border rounded-xl p-4 ${
                                      darkMode
                                        ? "border-slate-700 bg-slate-800/50"
                                        : "border-slate-200 bg-slate-50"
                                    }`}
                                  >
                                    <div className="flex items-center justify-between gap-3">
                                      <p className="text-sm font-semibold">
                                        {criterion.criterion}
                                      </p>

                                      <p className="font-black">{rating}/5</p>
                                    </div>

                                    <div className="mt-3 flex gap-1">
                                      {[1, 2, 3, 4, 5].map((value) => (
                                        <div
                                          key={value}
                                          className={`h-2 flex-1 rounded-full ${
                                            value <= rating
                                              ? "bg-blue-500"
                                              : darkMode
                                              ? "bg-slate-700"
                                              : "bg-slate-200"
                                          }`}
                                        />
                                      ))}
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
                    <p className={`text-sm ${mutedText}`}>
                      Evaluation criteria are unavailable.
                    </p>
                  )}

                  {studentCompanyEvaluation.comments && (
                    <div className="mt-5">
                      <h3 className="text-sm font-bold mb-2">Your Comments</h3>

                      <div
                        className={`border rounded-xl p-4 text-sm leading-relaxed ${
                          darkMode
                            ? "border-slate-700 bg-slate-800/50 text-slate-300"
                            : "border-slate-200 bg-slate-50 text-slate-600"
                        }`}
                      >
                        {studentCompanyEvaluation.comments}
                      </div>
                    </div>
                  )}

                  <div
                    className={`mt-5 p-4 rounded-xl border ${
                      darkMode
                        ? "border-slate-700 bg-slate-800/40"
                        : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <p className="text-xs font-semibold">
                      Evaluation submitted
                    </p>

                    <p className={`text-xs mt-1 ${mutedText}`}>
                      Your feedback has been recorded and is available to
                      authorized users of the internship management system.
                    </p>
                  </div>
                </div>
              ) : (
                /* =================================================
                   EVALUATION FORM
                ================================================= */

                <form onSubmit={submitCompanyEvaluation}>
                  {/* =================================================
                      TEMPLATE INFORMATION
                  ================================================= */}

                  {template && (
                    <div
                      className={`mb-5 p-4 rounded-xl border ${
                        darkMode
                          ? "border-slate-700 bg-slate-800/40"
                          : "border-slate-200 bg-slate-50"
                      }`}
                    >
                      <h3 className="text-sm font-bold">{template.name}</h3>

                      {template.description && (
                        <p
                          className={`text-xs mt-1 leading-relaxed ${mutedText}`}
                        >
                          {template.description}
                        </p>
                      )}
                    </div>
                  )}

                  {/* =================================================
                      RATING SECTIONS
                  ================================================= */}

                  {sections.map((section) => (
                    <div key={section.id} className="mb-6">
                      <div className="mb-3">
                        <h3 className="text-sm font-bold">{section.name}</h3>
                      </div>

                      <div className="grid md:grid-cols-2 gap-3">
                        {(section.evaluation_criteria || []).map(
                          (criterion) => (
                            <label
                              key={criterion.id}
                              className={`border rounded-xl p-4 ${
                                darkMode
                                  ? "border-slate-700 bg-slate-800/50"
                                  : "border-slate-200 bg-slate-50"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-xs font-semibold">
                                  {criterion.criterion}
                                </span>

                                <span className="text-xs font-bold text-slate-400">
                                  {companyRatings[criterion.id] || 3}
                                  /5
                                </span>
                              </div>

                              <select
                                className={`block w-full border rounded-lg mt-3 px-2 py-2 text-sm ${inputClass}`}
                                value={companyRatings[criterion.id] || 3}
                                onChange={(event) =>
                                  updateRating(criterion.id, event.target.value)
                                }
                              >
                                <option value={1}>1 — Poor</option>

                                <option value={2}>2 — Needs Improvement</option>

                                <option value={3}>3 — Satisfactory</option>

                                <option value={4}>4 — Good</option>

                                <option value={5}>5 — Excellent</option>
                              </select>
                            </label>
                          )
                        )}
                      </div>
                    </div>
                  ))}

                  {/* =================================================
                      COMMENTS
                  ================================================= */}

                  <div className="mt-5">
                    <label className="block text-xs font-semibold mb-2">
                      Written Feedback
                    </label>

                    <textarea
                      className={`w-full border rounded-lg px-3 py-2 text-sm ${inputClass} ${
                        darkMode ? "placeholder:text-slate-500" : ""
                      }`}
                      rows="6"
                      value={companyComments}
                      onChange={(event) => {
                        setCompanyComments(event.target.value);
                        setCompanySubmitted(false);
                      }}
                      placeholder="Share your experience with the company, supervisor, workplace environment, learning opportunities, and overall internship."
                    />
                  </div>

                  {/* =================================================
                      SUBMIT
                  ================================================= */}

                  <div className="mt-5 flex justify-end">
                    <button
                      type="submit"
                      disabled={submitting}
                      className={`px-5 py-2.5 rounded-lg text-white text-xs font-semibold transition ${
                        submitting
                          ? "bg-slate-500 cursor-not-allowed"
                          : "bg-slate-900 hover:bg-slate-800"
                      }`}
                    >
                      {submitting
                        ? "Submitting..."
                        : "Submit Company Evaluation"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
