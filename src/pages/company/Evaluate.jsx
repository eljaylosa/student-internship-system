import React, { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabaseCompany } from "../../supabaseClient";

// =========================================================
// COMPANY EVALUATION PAGE
// =========================================================
//
// Two evaluation directions:
//
// 1. Company → Student
//    - Company evaluates completed intern
//    - evaluator_role = "company_supervisor"
//
// 2. Student → Company
//    - Student evaluates the company
//    - evaluator_role = "student"
//    - Company can VIEW submitted/finalized evaluations
//
// =========================================================

const EVALUATION_DIRECTION = "company_to_student";
const EVALUATOR_ROLE = "company_supervisor";

const ASSIGNMENT_STATUS = {
  COMPLETED: "completed",
};

const EVALUATION_STATUS = {
  DRAFT: "draft",
  SUBMITTED: "submitted",
  RETURNED: "returned",
  FINALIZED: "finalized",
};

const RATING_OPTIONS = [
  { value: 1, label: "1 — Poor" },
  { value: 2, label: "2 — Needs Improvement" },
  { value: 3, label: "3 — Satisfactory" },
  { value: 4, label: "4 — Good" },
  { value: 5, label: "5 — Excellent" },
];

export default function Evaluate() {
  const { darkMode } = useOutletContext();

  // =========================================================
  // STATE
  // =========================================================

  const [company, setCompany] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [students, setStudents] = useState([]);
  const [opportunities, setOpportunities] = useState([]);

  const [templates, setTemplates] = useState([]);
  const [companyTemplate, setCompanyTemplate] = useState(null);

  // Contains:
  // - Company's own evaluations
  // - Student → Company evaluations
  const [evaluations, setEvaluations] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // =========================================================
  // EVALUATION TABS
  // =========================================================

  const [evaluationTab, setEvaluationTab] = useState("company_to_student");

  // This is also the accordion's selected assignment.
  const [assignmentId, setAssignmentId] = useState("");

  const [responses, setResponses] = useState({});
  const [overallRating, setOverallRating] = useState(0);
  const [comments, setComments] = useState("");

  // =========================================================
  // COMPANY → STUDENT LIST STATE
  // =========================================================

  const [companyEvaluationSearch, setCompanyEvaluationSearch] = useState("");

  const [companyEvaluationFilter, setCompanyEvaluationFilter] = useState("all");

  // =========================================================
  // STUDENT → COMPANY VIEW STATE
  // =========================================================

  const [selectedEvaluation, setSelectedEvaluation] = useState(null);

  const [studentEvaluationSearch, setStudentEvaluationSearch] = useState("");

  const [studentEvaluationFilter, setStudentEvaluationFilter] = useState("all");

  // =========================================================
  // THEME CLASSES
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
    ? "bg-slate-800 border-slate-700 text-slate-100"
    : "bg-white border-slate-200 text-slate-900";

  // =========================================================
  // TAB SWITCH
  // =========================================================

  const handleEvaluationTabChange = (tab) => {
    setEvaluationTab(tab);

    // Close currently expanded content when switching tabs.
    setAssignmentId("");
    setSelectedEvaluation(null);

    setResponses({});
    setOverallRating(0);
    setComments("");

    setError("");
    setSuccessMessage("");
  };

  // =========================================================
  // LOAD EVERYTHING
  // =========================================================

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccessMessage("");

      // -------------------------------------------------------
      // CURRENT AUTH USER
      // -------------------------------------------------------

      const {
        data: { user },
        error: userError,
      } = await supabaseCompany.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        throw new Error("Your company session has expired.");
      }

      // -------------------------------------------------------
      // COMPANY
      // -------------------------------------------------------

      const { data: companyRow, error: companyError } = await supabaseCompany
        .from("companies")
        .select(
          `
            id,
            company_name,
            status,
            user_id
          `
        )
        .eq("user_id", user.id)
        .maybeSingle();

      if (companyError) {
        throw companyError;
      }

      if (!companyRow) {
        throw new Error(
          "Unable to find the company account associated with your login."
        );
      }

      if (companyRow.status !== "active") {
        throw new Error("Your company account is not currently active.");
      }

      setCompany(companyRow);

      // -------------------------------------------------------
      // COMPLETED ASSIGNMENTS
      // -------------------------------------------------------

      const { data: assignmentRows, error: assignmentError } =
        await supabaseCompany
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
          .eq("company_id", companyRow.id)
          .eq("status", ASSIGNMENT_STATUS.COMPLETED)
          .not("deployed_at", "is", null)
          .order("updated_at", {
            ascending: false,
          });

      if (assignmentError) {
        throw assignmentError;
      }

      const safeAssignments = assignmentRows || [];

      setAssignments(safeAssignments);

      // -------------------------------------------------------
      // STUDENTS
      // -------------------------------------------------------

      const studentIds = [
        ...new Set(
          safeAssignments
            .map((assignment) => assignment.student_id)
            .filter(Boolean)
        ),
      ];

      if (studentIds.length > 0) {
        const { data: studentRows, error: studentsError } =
          await supabaseCompany
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
            .in("id", studentIds);

        if (studentsError) {
          throw studentsError;
        }

        const mappedStudents = (studentRows || []).map((student) => {
          const userInfo = Array.isArray(student.users)
            ? student.users[0]
            : student.users;

          const fullName = [
            userInfo?.first_name,
            userInfo?.middle_name,
            userInfo?.last_name,
          ]
            .filter(Boolean)
            .join(" ");

          return {
            id: student.id,
            studentId: student.student_id,
            program: student.program,
            yearLevel: student.year_level,
            department: student.department,
            schoolId: student.school_id,
            email: userInfo?.email || "",
            fullName: fullName || "Unknown Student",
          };
        });

        setStudents(mappedStudents);
      } else {
        setStudents([]);
      }

      // -------------------------------------------------------
      // OPPORTUNITIES
      // -------------------------------------------------------

      const opportunityIds = [
        ...new Set(
          safeAssignments
            .map((assignment) => assignment.opportunity_id)
            .filter(Boolean)
        ),
      ];

      if (opportunityIds.length > 0) {
        const { data: opportunityRows, error: opportunitiesError } =
          await supabaseCompany
            .from("opportunities")
            .select(
              `
                id,
                title,
                position_type
              `
            )
            .in("id", opportunityIds);

        if (opportunitiesError) {
          throw opportunitiesError;
        }

        setOpportunities(opportunityRows || []);
      } else {
        setOpportunities([]);
      }

      // -------------------------------------------------------
      // PUBLISHED EVALUATION TEMPLATES
      // -------------------------------------------------------

      const { data: templateRows, error: templatesError } =
        await supabaseCompany
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
              created_at,
              updated_at,
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
          .eq("status", "published")
          .order("version", {
            ascending: false,
          });

      if (templatesError) {
        throw templatesError;
      }

      const safeTemplates = templateRows || [];

      setTemplates(safeTemplates);

      // -------------------------------------------------------
      // FIND LATEST PUBLISHED COMPANY TEMPLATE
      // -------------------------------------------------------

      const publishedCompanyTemplates = safeTemplates
        .filter((template) => template.direction === EVALUATION_DIRECTION)
        .sort((a, b) => Number(b.version) - Number(a.version));

      const latestCompanyTemplate = publishedCompanyTemplates[0] || null;

      setCompanyTemplate(latestCompanyTemplate);

      // -------------------------------------------------------
      // COMPANY'S OWN EVALUATIONS
      // -------------------------------------------------------

      const { data: companyEvaluationRows, error: companyEvaluationsError } =
        await supabaseCompany
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
          .eq("evaluator_id", user.id)
          .eq("evaluator_role", EVALUATOR_ROLE)
          .order("created_at", {
            ascending: false,
          });

      if (companyEvaluationsError) {
        throw companyEvaluationsError;
      }

      // -------------------------------------------------------
      // STUDENT → COMPANY EVALUATIONS
      // -------------------------------------------------------

      const { data: studentEvaluationRows, error: studentEvaluationsError } =
        await supabaseCompany
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
          .eq("evaluated_company_id", companyRow.id)
          .eq("evaluator_role", "student")
          .in("status", [
            EVALUATION_STATUS.SUBMITTED,
            EVALUATION_STATUS.FINALIZED,
          ])
          .order("created_at", {
            ascending: false,
          });

      if (studentEvaluationsError) {
        throw studentEvaluationsError;
      }

      // -------------------------------------------------------
      // COMBINE BOTH EVALUATION TYPES
      // -------------------------------------------------------

      setEvaluations([
        ...(companyEvaluationRows || []),
        ...(studentEvaluationRows || []),
      ]);

      // -------------------------------------------------------
      // DO NOT AUTO-OPEN AN ASSIGNMENT
      // -------------------------------------------------------

      if (safeAssignments.length > 0) {
        setAssignmentId((previous) => {
          if (
            previous &&
            safeAssignments.some((assignment) => assignment.id === previous)
          ) {
            return previous;
          }

          return "";
        });
      } else {
        setAssignmentId("");
      }
    } catch (err) {
      console.error("Error loading company evaluations:", err);

      setError(
        err?.message || "Unable to load company evaluation information."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    loadData();
  }, []);

  // =========================================================
  // HELPERS
  // =========================================================

  const getStudent = (studentId) => {
    return students.find((student) => student.id === studentId);
  };

  const getOpportunity = (opportunityId) => {
    return opportunities.find(
      (opportunity) => opportunity.id === opportunityId
    );
  };

  const getAssignment = (id) => {
    return assignments.find((assignment) => assignment.id === id);
  };

  const getEvaluationForAssignment = (id) => {
    return evaluations.find(
      (evaluation) =>
        evaluation.assignment_id === id &&
        evaluation.evaluator_role === EVALUATOR_ROLE
    );
  };

  const getStudentEvaluationForAssignment = (id) => {
    return evaluations.find(
      (evaluation) =>
        evaluation.assignment_id === id &&
        evaluation.evaluator_role === "student" &&
        [EVALUATION_STATUS.SUBMITTED, EVALUATION_STATUS.FINALIZED].includes(
          evaluation.status
        )
    );
  };

  const getTemplateById = (templateId) => {
    return templates.find((template) => template.id === templateId);
  };

  const getTemplateCriteria = (template) => {
    if (!template?.evaluation_sections) {
      return [];
    }

    return [...template.evaluation_sections]
      .sort(
        (a, b) => Number(a.display_order || 0) - Number(b.display_order || 0)
      )
      .flatMap((section) =>
        [...(section.evaluation_criteria || [])]
          .sort(
            (a, b) =>
              Number(a.display_order || 0) - Number(b.display_order || 0)
          )
          .map((criterion) => ({
            ...criterion,
            sectionId: section.id,
            sectionName: section.name,
          }))
      );
  };

  // =========================================================
  // CURRENT ASSIGNMENT
  // =========================================================

  const currentAssignment = getAssignment(assignmentId);

  const currentStudent = currentAssignment
    ? getStudent(currentAssignment.student_id)
    : null;

  const currentOpportunity = currentAssignment
    ? getOpportunity(currentAssignment.opportunity_id)
    : null;

  const currentEvaluation = assignmentId
    ? getEvaluationForAssignment(assignmentId)
    : null;

  const isEvaluationLocked =
    currentEvaluation &&
    [EVALUATION_STATUS.SUBMITTED, EVALUATION_STATUS.FINALIZED].includes(
      currentEvaluation.status
    );

  // =========================================================
  // CURRENT TEMPLATE CRITERIA
  // =========================================================

  const companyCriteria = useMemo(() => {
    return getTemplateCriteria(companyTemplate);
  }, [companyTemplate]);

  // =========================================================
  // COMPANY → STUDENT COUNTS
  // =========================================================

  const companyEvaluationCounts = useMemo(() => {
    const all = assignments.length;

    const ready = assignments.filter((assignment) => {
      const evaluation = getEvaluationForAssignment(assignment.id);
      return !evaluation;
    }).length;

    const draft = assignments.filter((assignment) => {
      const evaluation = getEvaluationForAssignment(assignment.id);
      return evaluation?.status === EVALUATION_STATUS.DRAFT;
    }).length;

    const submitted = assignments.filter((assignment) => {
      const evaluation = getEvaluationForAssignment(assignment.id);
      return evaluation?.status === EVALUATION_STATUS.SUBMITTED;
    }).length;

    const finalized = assignments.filter((assignment) => {
      const evaluation = getEvaluationForAssignment(assignment.id);
      return evaluation?.status === EVALUATION_STATUS.FINALIZED;
    }).length;

    return {
      all,
      ready,
      draft,
      submitted,
      finalized,
    };
  }, [assignments, evaluations, students]);

  // =========================================================
  // FILTERED COMPANY → STUDENT ASSIGNMENTS
  // =========================================================

  const filteredCompanyAssignments = useMemo(() => {
    const search = companyEvaluationSearch.trim().toLowerCase();

    return assignments
      .filter((assignment) => {
        const evaluation = getEvaluationForAssignment(assignment.id);

        if (companyEvaluationFilter === "all") {
          return true;
        }

        if (companyEvaluationFilter === "ready") {
          return !evaluation;
        }

        if (companyEvaluationFilter === "draft") {
          return evaluation?.status === EVALUATION_STATUS.DRAFT;
        }

        if (companyEvaluationFilter === "submitted") {
          return evaluation?.status === EVALUATION_STATUS.SUBMITTED;
        }

        if (companyEvaluationFilter === "finalized") {
          return evaluation?.status === EVALUATION_STATUS.FINALIZED;
        }

        return true;
      })
      .filter((assignment) => {
        if (!search) {
          return true;
        }

        const student = getStudent(assignment.student_id);
        const opportunity = getOpportunity(assignment.opportunity_id);
        const evaluation = getEvaluationForAssignment(assignment.id);

        const searchableText = [
          student?.fullName,
          student?.studentId,
          student?.email,
          student?.program,
          student?.department,
          opportunity?.title,
          opportunity?.position_type,
          evaluation?.status,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchableText.includes(search);
      });
  }, [
    assignments,
    evaluations,
    students,
    opportunities,
    companyEvaluationSearch,
    companyEvaluationFilter,
  ]);

  // =========================================================
  // CLOSE COMPANY → STUDENT ACCORDION IF FILTERED OUT
  // =========================================================

  useEffect(() => {
    if (!assignmentId) {
      return;
    }

    const stillVisible = filteredCompanyAssignments.some(
      (assignment) => assignment.id === assignmentId
    );

    if (!stillVisible) {
      setAssignmentId("");
    }
  }, [filteredCompanyAssignments, assignmentId]);

  // =========================================================
  // STUDENT → COMPANY EVALUATIONS
  // =========================================================

  const studentCompanyEvaluations = useMemo(() => {
    const search = studentEvaluationSearch.trim().toLowerCase();

    return evaluations
      .filter(
        (evaluation) =>
          evaluation.evaluated_company_id === company?.id &&
          evaluation.evaluator_role === "student" &&
          [EVALUATION_STATUS.SUBMITTED, EVALUATION_STATUS.FINALIZED].includes(
            evaluation.status
          )
      )
      .filter((evaluation) => {
        if (studentEvaluationFilter === "all") {
          return true;
        }

        return evaluation.status === studentEvaluationFilter;
      })
      .filter((evaluation) => {
        if (!search) {
          return true;
        }

        const student = getStudent(evaluation.evaluated_student_id);

        const assignment = getAssignment(evaluation.assignment_id);

        const opportunity = assignment
          ? getOpportunity(assignment.opportunity_id)
          : null;

        const searchableText = [
          student?.fullName,
          student?.studentId,
          student?.email,
          student?.program,
          student?.department,
          opportunity?.title,
          evaluation.status,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchableText.includes(search);
      })
      .sort((a, b) => {
        const dateA = new Date(a.submitted_at || a.created_at || 0).getTime();
        const dateB = new Date(b.submitted_at || b.created_at || 0).getTime();

        return dateB - dateA;
      });
  }, [
    evaluations,
    company,
    studentEvaluationSearch,
    studentEvaluationFilter,
    students,
    assignments,
    opportunities,
  ]);

  // =========================================================
  // STUDENT EVALUATION COUNTS
  // =========================================================

  const studentEvaluationCounts = useMemo(() => {
    const all = evaluations.filter(
      (evaluation) =>
        evaluation.evaluated_company_id === company?.id &&
        evaluation.evaluator_role === "student" &&
        [EVALUATION_STATUS.SUBMITTED, EVALUATION_STATUS.FINALIZED].includes(
          evaluation.status
        )
    );

    return {
      all: all.length,
      submitted: all.filter(
        (evaluation) => evaluation.status === EVALUATION_STATUS.SUBMITTED
      ).length,
      finalized: all.filter(
        (evaluation) => evaluation.status === EVALUATION_STATUS.FINALIZED
      ).length,
    };
  }, [evaluations, company]);

  // =========================================================
  // KEEP SELECTED STUDENT EVALUATION VALID
  // =========================================================

  useEffect(() => {
    if (!selectedEvaluation) {
      return;
    }

    const stillVisible = studentCompanyEvaluations.some(
      (evaluation) => evaluation.id === selectedEvaluation.id
    );

    if (!stillVisible) {
      setSelectedEvaluation(null);
    }
  }, [studentCompanyEvaluations, selectedEvaluation]);

  // =========================================================
  // SELECTED STUDENT EVALUATION
  // =========================================================

  const selectedStudentEvaluation = selectedEvaluation
    ? evaluations.find(
        (evaluation) => evaluation.id === selectedEvaluation.id
      ) || null
    : null;

  const selectedStudentAssignment = selectedStudentEvaluation
    ? getAssignment(selectedStudentEvaluation.assignment_id)
    : null;

  const selectedStudent = selectedStudentEvaluation
    ? getStudent(selectedStudentEvaluation.evaluated_student_id)
    : null;

  const selectedStudentOpportunity = selectedStudentAssignment
    ? getOpportunity(selectedStudentAssignment.opportunity_id)
    : null;

  // =========================================================
  // LOAD SELECTED COMPANY EVALUATION INTO FORM
  // =========================================================

  useEffect(() => {
    if (!assignmentId || !companyTemplate) {
      setResponses({});
      setOverallRating(0);
      setComments("");
      return;
    }

    const existingEvaluation = getEvaluationForAssignment(assignmentId);

    if (existingEvaluation) {
      setResponses(existingEvaluation.responses || {});

      setOverallRating(
        existingEvaluation.overall_rating
          ? Number(existingEvaluation.overall_rating)
          : 0
      );

      setComments(existingEvaluation.comments || "");

      return;
    }

    const defaultResponses = {};

    companyCriteria.forEach((criterion) => {
      defaultResponses[criterion.id] = 0;
    });

    setResponses(defaultResponses);
    setOverallRating(0);
    setComments("");
  }, [assignmentId, companyTemplate, evaluations, companyCriteria]);

  // =========================================================
  // RATING CHANGE
  // =========================================================

  const handleRatingChange = (criterionId, value) => {
    if (isEvaluationLocked) return;

    setResponses((previous) => ({
      ...previous,
      [criterionId]: Number(value),
    }));

    setSuccessMessage("");
  };

  // =========================================================
  // CALCULATE OVERALL RATING
  // =========================================================

  const calculatedOverallRating = useMemo(() => {
    const values = companyCriteria
      .map((criterion) => Number(responses[criterion.id]))
      .filter((value) => value >= 1 && value <= 5);

    if (values.length === 0) {
      return 0;
    }

    const average =
      values.reduce((sum, value) => sum + value, 0) / values.length;

    return Number(average.toFixed(2));
  }, [companyCriteria, responses]);

  // =========================================================
  // OPEN / CLOSE ASSIGNMENT ACCORDION
  // =========================================================

  const handleSelectAssignment = (id) => {
    if (assignmentId === id) {
      setAssignmentId("");
      setResponses({});
      setOverallRating(0);
      setComments("");
      setSuccessMessage("");
      setError("");
      return;
    }

    setAssignmentId(id);
    setSuccessMessage("");
    setError("");
  };

  // =========================================================
  // OPEN STUDENT EVALUATION
  // =========================================================

  const handleOpenStudentEvaluation = (evaluation) => {
    if (selectedEvaluation?.id === evaluation.id) {
      setSelectedEvaluation(null);
      return;
    }

    setSelectedEvaluation(evaluation);
  };

  // =========================================================
  // CLEAR COMPANY FILTERS
  // =========================================================

  const clearCompanyEvaluationFilters = () => {
    setCompanyEvaluationSearch("");
    setCompanyEvaluationFilter("all");
  };

  // =========================================================
  // CLEAR STUDENT FILTERS
  // =========================================================

  const clearStudentEvaluationFilters = () => {
    setStudentEvaluationSearch("");
    setStudentEvaluationFilter("all");
    setSelectedEvaluation(null);
  };

  // =========================================================
  // VALIDATE FORM
  // =========================================================

  const validateEvaluation = () => {
    if (!assignmentId) {
      return "Please select an intern.";
    }

    if (!companyTemplate) {
      return "No published company evaluation template is currently available.";
    }

    if (companyCriteria.length === 0) {
      return "The published evaluation template does not contain any criteria.";
    }

    const missingCriteria = companyCriteria.filter((criterion) => {
      const value = Number(responses[criterion.id]);

      return !(value >= 1 && value <= 5);
    });

    if (missingCriteria.length > 0) {
      return `Please rate all criteria before submitting. ${missingCriteria.length} criterion(s) still need a rating.`;
    }

    if (!comments.trim()) {
      return "Please provide written feedback before submitting.";
    }

    return "";
  };

  // =========================================================
  // SAVE EVALUATION
  // =========================================================

  const saveEvaluation = async ({ submit = false }) => {
    try {
      setSaving(true);
      setError("");
      setSuccessMessage("");

      const {
        data: { user },
        error: userError,
      } = await supabaseCompany.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        throw new Error("Your company session has expired.");
      }

      if (!assignmentId) {
        throw new Error("Please select an intern.");
      }

      if (!company) {
        throw new Error("Company information could not be loaded.");
      }

      if (!companyTemplate) {
        throw new Error(
          "No published company evaluation template is currently available."
        );
      }

      const assignment = getAssignment(assignmentId);

      if (!assignment) {
        throw new Error("The selected internship assignment was not found.");
      }

      if (assignment.status !== ASSIGNMENT_STATUS.COMPLETED) {
        throw new Error("Only completed internships can be evaluated.");
      }

      const existingEvaluation = getEvaluationForAssignment(assignmentId);

      if (
        existingEvaluation &&
        [EVALUATION_STATUS.SUBMITTED, EVALUATION_STATUS.FINALIZED].includes(
          existingEvaluation.status
        )
      ) {
        throw new Error(
          "This evaluation has already been submitted and can no longer be edited."
        );
      }

      if (submit) {
        const validationError = validateEvaluation();

        if (validationError) {
          throw new Error(validationError);
        }
      }

      const numericRatings = companyCriteria
        .map((criterion) => Number(responses[criterion.id]))
        .filter((value) => value >= 1 && value <= 5);

      const averageRating =
        numericRatings.length > 0
          ? Number(
              (
                numericRatings.reduce((sum, value) => sum + value, 0) /
                numericRatings.length
              ).toFixed(2)
            )
          : null;

      const payload = {
        assignment_id: assignment.id,
        template_id: companyTemplate.id,
        evaluator_id: user.id,
        evaluated_student_id: assignment.student_id,
        evaluated_company_id: assignment.company_id,
        evaluator_role: EVALUATOR_ROLE,
        status: submit ? EVALUATION_STATUS.SUBMITTED : EVALUATION_STATUS.DRAFT,
        responses,
        overall_rating: submit ? averageRating : averageRating || null,
        comments: comments.trim() || null,
        submitted_at: submit ? new Date().toISOString() : null,
      };

      if (existingEvaluation) {
        const { data: updatedEvaluation, error: updateError } =
          await supabaseCompany
            .from("evaluations")
            .update(payload)
            .eq("id", existingEvaluation.id)
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
            .single();

        if (updateError) {
          throw updateError;
        }

        setEvaluations((previous) => [
          updatedEvaluation,
          ...previous.filter(
            (evaluation) => evaluation.id !== updatedEvaluation.id
          ),
        ]);
      } else {
        const { data: newEvaluation, error: insertError } =
          await supabaseCompany
            .from("evaluations")
            .insert(payload)
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
            .single();

        if (insertError) {
          throw insertError;
        }

        setEvaluations((previous) => [newEvaluation, ...previous]);
      }

      if (submit) {
        setSuccessMessage(
          "Evaluation submitted successfully. The evaluation is now recorded."
        );
      } else {
        setSuccessMessage(
          "Evaluation draft saved successfully. You can continue editing it later."
        );
      }
    } catch (err) {
      console.error("Error saving company evaluation:", err);

      setError(err?.message || "Unable to save the evaluation.");
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // SAVE DRAFT
  // =========================================================

  const handleSaveDraft = async () => {
    await saveEvaluation({
      submit: false,
    });
  };

  // =========================================================
  // SUBMIT
  // =========================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    const confirmed = window.confirm(
      "Are you sure you want to submit this evaluation? Once submitted, it can no longer be edited."
    );

    if (!confirmed) return;

    await saveEvaluation({
      submit: true,
    });
  };

  // =========================================================
  // STAR DISPLAY
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

        <span className={`ml-2 text-xs font-semibold ${muted}`}>
          {rating}/5
        </span>
      </div>
    );
  };

  // =========================================================
  // FORMAT DATE
  // =========================================================

  const formatDate = (date) => {
    if (!date) return "N/A";

    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // =========================================================
  // COMPANY EVALUATION STATUS
  // =========================================================

  const getCompanyEvaluationStatus = (assignment) => {
    const evaluation = getEvaluationForAssignment(assignment.id);

    if (!evaluation) {
      return {
        key: "ready",
        label: "READY",
        className: darkMode
          ? "bg-blue-950/40 text-blue-300"
          : "bg-blue-50 text-blue-700",
      };
    }

    if (evaluation.status === EVALUATION_STATUS.DRAFT) {
      return {
        key: "draft",
        label: "DRAFT",
        className: darkMode
          ? "bg-amber-950/40 text-amber-300"
          : "bg-amber-50 text-amber-700",
      };
    }

    if (evaluation.status === EVALUATION_STATUS.FINALIZED) {
      return {
        key: "finalized",
        label: "FINALIZED",
        className: darkMode
          ? "bg-purple-950/40 text-purple-300"
          : "bg-purple-50 text-purple-700",
      };
    }

    return {
      key: "submitted",
      label: "EVALUATED",
      className: darkMode
        ? "bg-emerald-950/40 text-emerald-300"
        : "bg-emerald-50 text-emerald-700",
    };
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
            Company Portal
          </p>

          <h1 className="text-2xl font-black">Evaluations</h1>

          <p className={`text-sm mt-1 ${muted}`}>
            Loading completed internships and evaluations...
          </p>
        </div>

        <section className={`border rounded-2xl p-8 ${card}`}>
          <div className="text-center">
            <div className="text-3xl mb-3 animate-pulse">📋</div>

            <p className={`font-semibold ${heading}`}>Loading evaluations...</p>

            <p className={`text-sm mt-1 ${muted}`}>
              Please wait while we load your evaluation data.
            </p>
          </div>
        </section>
      </div>
    );
  }

  // =========================================================
  // RETURN
  // =========================================================

  return (
    <div
      className={`p-5 md:p-6 lg:p-8 max-w-[1100px] mx-auto ${
        darkMode ? "text-slate-100" : "text-slate-900"
      }`}
    >
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="mb-6">
        <p className="text-xs uppercase tracking-widest font-bold text-slate-400">
          Company Portal
        </p>

        <h1 className="text-2xl font-black">Evaluations</h1>

        <p className={`text-sm mt-1 ${muted}`}>
          Evaluate completed interns and review evaluations submitted by
          students about your company.
        </p>
      </div>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div
          className={`mb-5 border rounded-2xl p-4 ${
            darkMode
              ? "bg-red-950/30 border-red-800"
              : "bg-red-50 border-red-200"
          }`}
        >
          <p
            className={`font-bold text-sm ${
              darkMode ? "text-red-300" : "text-red-700"
            }`}
          >
            Unable to process evaluation
          </p>

          <p
            className={`text-xs mt-1 ${
              darkMode ? "text-red-400" : "text-red-600"
            }`}
          >
            {error}
          </p>

          <button
            type="button"
            onClick={() => {
              setError("");
              loadData();
            }}
            className="mt-3 px-3 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition"
          >
            Try Again
          </button>
        </div>
      )}

      {/* =====================================================
          SUCCESS
      ===================================================== */}

      {successMessage && (
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
            ✓ Success
          </p>

          <p
            className={`text-xs mt-1 ${
              darkMode ? "text-emerald-400" : "text-emerald-600"
            }`}
          >
            {successMessage}
          </p>
        </div>
      )}

      {/* =====================================================
          EVALUATION TABS
      ===================================================== */}

      <div
        className={`mb-7 p-1 rounded-xl border flex flex-col sm:flex-row gap-1 ${card}`}
      >
        <button
          type="button"
          onClick={() => handleEvaluationTabChange("company_to_student")}
          className={`flex-1 px-4 py-3 rounded-lg text-sm font-bold transition ${
            evaluationTab === "company_to_student"
              ? darkMode
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-blue-600 text-white shadow-sm"
              : darkMode
              ? "text-slate-400 hover:text-slate-100 hover:bg-slate-800"
              : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <span className="block">Company → Student</span>

          <span
            className={`block text-[10px] mt-0.5 ${
              evaluationTab === "company_to_student" ? "text-blue-100" : muted
            }`}
          >
            Evaluate completed interns
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleEvaluationTabChange("student_to_company")}
          className={`flex-1 px-4 py-3 rounded-lg text-sm font-bold transition ${
            evaluationTab === "student_to_company"
              ? darkMode
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-blue-600 text-white shadow-sm"
              : darkMode
              ? "text-slate-400 hover:text-slate-100 hover:bg-slate-800"
              : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <span className="block">Student → Company</span>

          <span
            className={`block text-[10px] mt-0.5 ${
              evaluationTab === "student_to_company" ? "text-blue-100" : muted
            }`}
          >
            Review intern feedback
          </span>
        </button>
      </div>

      {/* =====================================================
          COMPANY → STUDENT TAB
      ===================================================== */}

      {evaluationTab === "company_to_student" && (
        <section className="mb-10">
          <div className="mb-4">
            <p className="text-xs uppercase tracking-widest font-bold text-slate-400">
              Company → Student
            </p>

            <h2 className={`text-xl font-black ${heading}`}>Evaluate Intern</h2>

            <p className={`text-sm mt-1 ${muted}`}>
              Evaluate students whose internships have been officially completed
              at {company?.company_name || "your company"}.
            </p>
          </div>

          {/* ===================================================
              NO COMPLETED INTERNS
          =================================================== */}

          {assignments.length === 0 ? (
            <section className={`border rounded-2xl p-6 ${card}`}>
              <div className="text-center py-8">
                <div className="text-4xl mb-3">📋</div>

                <p className={`font-semibold ${heading}`}>
                  No interns are available for evaluation.
                </p>

                <p className={`text-sm mt-1 max-w-md mx-auto ${muted}`}>
                  An intern will appear here after your company marks their
                  internship as completed.
                </p>
              </div>
            </section>
          ) : !companyTemplate ? (
            <section className={`border rounded-2xl p-6 ${card}`}>
              <div className="text-center py-8">
                <div className="text-4xl mb-3">⚠️</div>

                <p className={`font-semibold ${heading}`}>
                  Evaluation template unavailable
                </p>

                <p className={`text-sm mt-1 max-w-md mx-auto ${muted}`}>
                  There is currently no published Company → Student evaluation
                  template. Please contact the administrator.
                </p>
              </div>
            </section>
          ) : (
            <div className="space-y-5">
              {/* =================================================
                  COMPLETED INTERNS LIST
              ================================================= */}

              <section className={`border rounded-2xl overflow-hidden ${card}`}>
                {/* HEADER */}

                <div
                  className={`px-5 py-4 border-b ${
                    darkMode ? "border-slate-700" : "border-slate-200"
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                      <h3 className={`text-sm font-bold ${heading}`}>
                        Completed Internships
                      </h3>

                      <p className={`text-[11px] mt-0.5 ${muted}`}>
                        Search for an intern and select one to create or view
                        their evaluation.
                      </p>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        darkMode
                          ? "bg-slate-800 text-slate-300"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {filteredCompanyAssignments.length} of{" "}
                      {companyEvaluationCounts.all}
                    </span>
                  </div>
                </div>

                {/* SEARCH + FILTER */}

                <div
                  className={`p-4 border-b ${
                    darkMode ? "border-slate-700" : "border-slate-200"
                  }`}
                >
                  <div className="flex flex-col lg:flex-row gap-3">
                    <div className="flex-1">
                      <label
                        className={`block text-[11px] font-bold uppercase tracking-wide mb-2 ${muted}`}
                      >
                        Search Intern
                      </label>

                      <div className="relative">
                        <span
                          className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm ${muted}`}
                        >
                          🔎
                        </span>

                        <input
                          type="text"
                          value={companyEvaluationSearch}
                          onChange={(event) =>
                            setCompanyEvaluationSearch(event.target.value)
                          }
                          placeholder="Search name, Student ID, program, position..."
                          className={`w-full border rounded-lg pl-9 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${input}`}
                        />
                      </div>
                    </div>

                    <div className="w-full lg:w-56">
                      <label
                        className={`block text-[11px] font-bold uppercase tracking-wide mb-2 ${muted}`}
                      >
                        Evaluation Status
                      </label>

                      <select
                        value={companyEvaluationFilter}
                        onChange={(event) =>
                          setCompanyEvaluationFilter(event.target.value)
                        }
                        className={`w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${input}`}
                      >
                        <option value="all">
                          All ({companyEvaluationCounts.all})
                        </option>

                        <option value="ready">
                          Ready ({companyEvaluationCounts.ready})
                        </option>

                        <option value="draft">
                          Draft ({companyEvaluationCounts.draft})
                        </option>

                        <option value="submitted">
                          Evaluated ({companyEvaluationCounts.submitted})
                        </option>

                        <option value="finalized">
                          Finalized ({companyEvaluationCounts.finalized})
                        </option>
                      </select>
                    </div>
                  </div>

                  {(companyEvaluationSearch ||
                    companyEvaluationFilter !== "all") && (
                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        onClick={clearCompanyEvaluationFilters}
                        className={`text-xs font-semibold ${
                          darkMode
                            ? "text-blue-400 hover:text-blue-300"
                            : "text-blue-600 hover:text-blue-700"
                        }`}
                      >
                        Clear Filters
                      </button>
                    </div>
                  )}
                </div>

                {/* NO RESULTS */}

                {filteredCompanyAssignments.length === 0 ? (
                  <div className="text-center py-10 px-5">
                    <div className="text-3xl mb-3">🔎</div>

                    <p className={`font-semibold ${heading}`}>
                      No matching interns found.
                    </p>

                    <p className={`text-sm mt-1 max-w-md mx-auto ${muted}`}>
                      Try changing your search or selecting another evaluation
                      status.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px]">
                      <thead
                        className={darkMode ? "bg-slate-800/70" : "bg-slate-50"}
                      >
                        <tr
                          className={`text-left border-b ${
                            darkMode ? "border-slate-700" : "border-slate-200"
                          }`}
                        >
                          <th
                            className={`px-4 py-3 text-[10px] uppercase tracking-wide font-bold ${muted}`}
                          >
                            Student
                          </th>

                          <th
                            className={`px-4 py-3 text-[10px] uppercase tracking-wide font-bold ${muted}`}
                          >
                            Position
                          </th>

                          <th
                            className={`px-4 py-3 text-[10px] uppercase tracking-wide font-bold ${muted}`}
                          >
                            Internship Period
                          </th>

                          <th
                            className={`px-4 py-3 text-[10px] uppercase tracking-wide font-bold ${muted}`}
                          >
                            Status
                          </th>

                          <th
                            className={`px-4 py-3 text-[10px] uppercase tracking-wide font-bold ${muted}`}
                          >
                            Rating
                          </th>

                          <th
                            className={`px-4 py-3 text-[10px] uppercase tracking-wide font-bold ${muted} text-right`}
                          >
                            Action
                          </th>
                        </tr>
                      </thead>

                      <tbody
                        className={
                          darkMode
                            ? "divide-y divide-slate-700"
                            : "divide-y divide-slate-200"
                        }
                      >
                        {filteredCompanyAssignments.map((assignment) => {
                          const student = getStudent(assignment.student_id);

                          const opportunity = getOpportunity(
                            assignment.opportunity_id
                          );

                          const evaluation = getEvaluationForAssignment(
                            assignment.id
                          );

                          const status = getCompanyEvaluationStatus(assignment);

                          const isSelected = assignment.id === assignmentId;

                          return (
                            <React.Fragment key={assignment.id}>
                              {/* =================================================
                                  TABLE ROW
                              ================================================= */}

                              <tr
                                className={`transition ${
                                  isSelected
                                    ? darkMode
                                      ? "bg-blue-950/30"
                                      : "bg-blue-50/70"
                                    : darkMode
                                    ? "hover:bg-slate-800/50"
                                    : "hover:bg-slate-50"
                                }`}
                              >
                                {/* STUDENT */}

                                <td className="px-4 py-4">
                                  <div className="flex items-center gap-3 min-w-[220px]">
                                    <div
                                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0 ${
                                        isSelected
                                          ? darkMode
                                            ? "bg-blue-900 text-blue-200"
                                            : "bg-blue-100 text-blue-700"
                                          : darkMode
                                          ? "bg-slate-800 text-slate-300"
                                          : "bg-slate-100 text-slate-600"
                                      }`}
                                    >
                                      {(student?.fullName || "S")
                                        .charAt(0)
                                        .toUpperCase()}
                                    </div>

                                    <div className="min-w-0">
                                      <p
                                        className={`text-sm font-bold truncate ${heading}`}
                                      >
                                        {student?.fullName || "Unknown Student"}
                                      </p>

                                      <p
                                        className={`text-[11px] mt-0.5 truncate ${muted}`}
                                      >
                                        {student?.studentId ||
                                          "Student ID unavailable"}
                                      </p>
                                    </div>
                                  </div>
                                </td>

                                {/* POSITION */}

                                <td className="px-4 py-4">
                                  <div className="min-w-[160px]">
                                    <p
                                      className={`text-sm font-semibold ${heading}`}
                                    >
                                      {opportunity?.title ||
                                        "Position unavailable"}
                                    </p>

                                    {opportunity?.position_type && (
                                      <p
                                        className={`text-[11px] mt-1 ${muted}`}
                                      >
                                        {opportunity.position_type}
                                      </p>
                                    )}
                                  </div>
                                </td>

                                {/* INTERNSHIP PERIOD */}

                                <td className="px-4 py-4">
                                  <div className="min-w-[150px]">
                                    <p
                                      className={`text-xs font-semibold ${heading}`}
                                    >
                                      {formatDate(assignment.start_date)}
                                    </p>

                                    <p className={`text-[11px] mt-1 ${muted}`}>
                                      to {formatDate(assignment.end_date)}
                                    </p>
                                  </div>
                                </td>

                                {/* STATUS */}

                                <td className="px-4 py-4">
                                  <span
                                    className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold ${status.className}`}
                                  >
                                    {status.label}
                                  </span>
                                </td>

                                {/* RATING */}

                                <td className="px-4 py-4">
                                  {evaluation?.overall_rating ? (
                                    renderStars(
                                      Number(evaluation.overall_rating)
                                    )
                                  ) : (
                                    <span className={`text-xs ${muted}`}>
                                      Not rated
                                    </span>
                                  )}
                                </td>

                                {/* ACTION */}

                                <td className="px-4 py-4 text-right">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleSelectAssignment(assignment.id)
                                    }
                                    className={`inline-flex items-center justify-center min-w-[90px] px-3 py-2 rounded-lg text-xs font-bold transition ${
                                      isSelected
                                        ? darkMode
                                          ? "bg-slate-700 text-slate-100 hover:bg-slate-600"
                                          : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                                        : evaluation
                                        ? darkMode
                                          ? "bg-blue-950/50 text-blue-300 hover:bg-blue-900/60"
                                          : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                                        : "bg-blue-600 text-white hover:bg-blue-700"
                                    }`}
                                  >
                                    {isSelected
                                      ? "Close"
                                      : !evaluation
                                      ? "Evaluate"
                                      : evaluation.status ===
                                        EVALUATION_STATUS.DRAFT
                                      ? "Continue"
                                      : "View"}
                                  </button>
                                </td>
                              </tr>

                              {/* =================================================
                                  EXPANDED DETAILS
                              ================================================= */}

                              {isSelected && (
                                <tr>
                                  <td
                                    colSpan={6}
                                    className={`p-0 ${
                                      darkMode
                                        ? "bg-slate-950/40"
                                        : "bg-slate-50/70"
                                    }`}
                                  >
                                    <div
                                      className={`border-t p-5 ${
                                        darkMode
                                          ? "border-slate-700"
                                          : "border-slate-200"
                                      }`}
                                    >
                                      {/* SELECTED STUDENT INFORMATION */}

                                      {currentAssignment && currentStudent && (
                                        <div
                                          className={`border rounded-xl p-5 ${softCard}`}
                                        >
                                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                            <div>
                                              <div className="flex flex-wrap items-center gap-2">
                                                <h3
                                                  className={`font-bold ${heading}`}
                                                >
                                                  {currentStudent.fullName}
                                                </h3>

                                                <span
                                                  className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                                                    darkMode
                                                      ? "bg-blue-950/40 text-blue-300"
                                                      : "bg-blue-50 text-blue-700"
                                                  }`}
                                                >
                                                  COMPLETED
                                                </span>

                                                {currentEvaluation?.status ===
                                                  EVALUATION_STATUS.DRAFT && (
                                                  <span
                                                    className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                                                      darkMode
                                                        ? "bg-amber-950/40 text-amber-300"
                                                        : "bg-amber-50 text-amber-700"
                                                    }`}
                                                  >
                                                    DRAFT
                                                  </span>
                                                )}

                                                {currentEvaluation?.status ===
                                                  EVALUATION_STATUS.SUBMITTED && (
                                                  <span
                                                    className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                                                      darkMode
                                                        ? "bg-emerald-950/40 text-emerald-300"
                                                        : "bg-emerald-50 text-emerald-700"
                                                    }`}
                                                  >
                                                    EVALUATED
                                                  </span>
                                                )}

                                                {currentEvaluation?.status ===
                                                  EVALUATION_STATUS.FINALIZED && (
                                                  <span
                                                    className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                                                      darkMode
                                                        ? "bg-purple-950/40 text-purple-300"
                                                        : "bg-purple-50 text-purple-700"
                                                    }`}
                                                  >
                                                    FINALIZED
                                                  </span>
                                                )}
                                              </div>

                                              <p
                                                className={`text-xs mt-1 ${muted}`}
                                              >
                                                {currentStudent.studentId ||
                                                  "Student ID unavailable"}
                                              </p>
                                            </div>

                                            <div className="text-left md:text-right">
                                              <p
                                                className={`text-[10px] uppercase tracking-wide font-bold ${muted}`}
                                              >
                                                Internship Period
                                              </p>

                                              <p
                                                className={`text-xs font-semibold mt-1 ${heading}`}
                                              >
                                                {formatDate(
                                                  currentAssignment.start_date
                                                )}{" "}
                                                –{" "}
                                                {formatDate(
                                                  currentAssignment.end_date
                                                )}
                                              </p>
                                            </div>
                                          </div>

                                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
                                            <div>
                                              <p
                                                className={`text-[10px] uppercase tracking-wide font-bold ${muted}`}
                                              >
                                                Student ID
                                              </p>

                                              <p
                                                className={`text-sm font-semibold mt-1 ${heading}`}
                                              >
                                                {currentStudent.studentId ||
                                                  "N/A"}
                                              </p>
                                            </div>

                                            <div>
                                              <p
                                                className={`text-[10px] uppercase tracking-wide font-bold ${muted}`}
                                              >
                                                Program
                                              </p>

                                              <p
                                                className={`text-sm font-semibold mt-1 ${heading}`}
                                              >
                                                {currentStudent.program ||
                                                  "N/A"}
                                              </p>
                                            </div>

                                            <div>
                                              <p
                                                className={`text-[10px] uppercase tracking-wide font-bold ${muted}`}
                                              >
                                                Email
                                              </p>

                                              <p
                                                className={`text-sm font-semibold mt-1 break-all ${heading}`}
                                              >
                                                {currentStudent.email || "N/A"}
                                              </p>
                                            </div>

                                            <div>
                                              <p
                                                className={`text-[10px] uppercase tracking-wide font-bold ${muted}`}
                                              >
                                                Position
                                              </p>

                                              <p
                                                className={`text-sm font-semibold mt-1 ${heading}`}
                                              >
                                                {currentOpportunity?.title ||
                                                  "N/A"}
                                              </p>
                                            </div>
                                          </div>
                                        </div>
                                      )}

                                      {/* SUBMITTED / FINALIZED NOTICE */}

                                      {isEvaluationLocked && (
                                        <div
                                          className={`mt-5 border rounded-xl p-4 ${
                                            darkMode
                                              ? "bg-emerald-950/20 border-emerald-800"
                                              : "bg-emerald-50 border-emerald-200"
                                          }`}
                                        >
                                          <p
                                            className={`text-sm font-bold ${
                                              darkMode
                                                ? "text-emerald-300"
                                                : "text-emerald-700"
                                            }`}
                                          >
                                            Evaluation Submitted
                                          </p>

                                          <p
                                            className={`text-xs mt-1 ${
                                              darkMode
                                                ? "text-emerald-400"
                                                : "text-emerald-600"
                                            }`}
                                          >
                                            This evaluation has already been
                                            submitted and can no longer be
                                            edited.
                                          </p>
                                        </div>
                                      )}

                                      {/* EVALUATION FORM */}

                                      {!isEvaluationLocked && (
                                        <form
                                          onSubmit={handleSubmit}
                                          className={`mt-5 border rounded-xl overflow-hidden ${card}`}
                                        >
                                          <div
                                            className={`p-5 border-b ${
                                              darkMode
                                                ? "border-slate-700"
                                                : "border-slate-200"
                                            }`}
                                          >
                                            <p className="text-[10px] uppercase tracking-widest font-bold text-blue-500">
                                              Evaluation Form
                                            </p>

                                            <h3
                                              className={`text-lg font-black mt-1 ${heading}`}
                                            >
                                              {companyTemplate.name}
                                            </h3>

                                            {companyTemplate.description && (
                                              <p
                                                className={`text-sm mt-2 ${muted}`}
                                              >
                                                {companyTemplate.description}
                                              </p>
                                            )}

                                            <div
                                              className={`mt-3 inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                                darkMode
                                                  ? "bg-slate-800 text-slate-300"
                                                  : "bg-slate-100 text-slate-600"
                                              }`}
                                            >
                                              Template Version{" "}
                                              {companyTemplate.version}
                                            </div>
                                          </div>

                                          <div className="p-5 space-y-6">
                                            {companyTemplate.evaluation_sections
                                              ?.slice()
                                              .sort(
                                                (a, b) =>
                                                  Number(a.display_order || 0) -
                                                  Number(b.display_order || 0)
                                              )
                                              .map((section) => {
                                                const criteria = [
                                                  ...(section.evaluation_criteria ||
                                                    []),
                                                ].sort(
                                                  (a, b) =>
                                                    Number(
                                                      a.display_order || 0
                                                    ) -
                                                    Number(b.display_order || 0)
                                                );

                                                return (
                                                  <div
                                                    key={section.id}
                                                    className={`border rounded-xl overflow-hidden ${softCard}`}
                                                  >
                                                    <div
                                                      className={`px-4 py-3 border-b ${
                                                        darkMode
                                                          ? "border-slate-700"
                                                          : "border-slate-200"
                                                      }`}
                                                    >
                                                      <h4
                                                        className={`text-sm font-bold ${heading}`}
                                                      >
                                                        {section.name}
                                                      </h4>
                                                    </div>

                                                    <div
                                                      className={`divide-y ${
                                                        darkMode
                                                          ? "divide-slate-700"
                                                          : "divide-slate-200"
                                                      }`}
                                                    >
                                                      {criteria.map(
                                                        (criterion) => (
                                                          <div
                                                            key={criterion.id}
                                                            className="p-4"
                                                          >
                                                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                                              <div className="flex-1">
                                                                <p
                                                                  className={`text-sm font-semibold ${heading}`}
                                                                >
                                                                  {
                                                                    criterion.criterion
                                                                  }
                                                                </p>
                                                              </div>

                                                              <div className="w-full md:w-64">
                                                                <select
                                                                  value={
                                                                    responses[
                                                                      criterion
                                                                        .id
                                                                    ] || 0
                                                                  }
                                                                  onChange={(
                                                                    event
                                                                  ) =>
                                                                    handleRatingChange(
                                                                      criterion.id,
                                                                      event
                                                                        .target
                                                                        .value
                                                                    )
                                                                  }
                                                                  className={`w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${input}`}
                                                                >
                                                                  <option
                                                                    value={0}
                                                                  >
                                                                    Select
                                                                    Rating
                                                                  </option>

                                                                  {RATING_OPTIONS.map(
                                                                    (
                                                                      option
                                                                    ) => (
                                                                      <option
                                                                        key={
                                                                          option.value
                                                                        }
                                                                        value={
                                                                          option.value
                                                                        }
                                                                      >
                                                                        {
                                                                          option.label
                                                                        }
                                                                      </option>
                                                                    )
                                                                  )}
                                                                </select>
                                                              </div>
                                                            </div>
                                                          </div>
                                                        )
                                                      )}
                                                    </div>
                                                  </div>
                                                );
                                              })}

                                            {/* OVERALL */}

                                            <div
                                              className={`border rounded-xl p-5 ${softCard}`}
                                            >
                                              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                                <div>
                                                  <p
                                                    className={`text-sm font-bold ${heading}`}
                                                  >
                                                    Calculated Overall Rating
                                                  </p>

                                                  <p
                                                    className={`text-xs mt-1 ${muted}`}
                                                  >
                                                    Based on all rated criteria.
                                                  </p>
                                                </div>

                                                <div>
                                                  {renderStars(
                                                    calculatedOverallRating
                                                  )}
                                                </div>
                                              </div>
                                            </div>

                                            {/* COMMENTS */}

                                            <div>
                                              <label
                                                className={`block text-xs font-bold uppercase tracking-wide mb-2 ${heading}`}
                                              >
                                                Written Feedback
                                              </label>

                                              <textarea
                                                value={comments}
                                                onChange={(event) =>
                                                  setComments(
                                                    event.target.value
                                                  )
                                                }
                                                rows={5}
                                                placeholder="Provide feedback about the intern's overall performance..."
                                                className={`w-full border rounded-xl px-3 py-3 text-sm outline-none resize-y focus:ring-2 focus:ring-blue-500 ${input}`}
                                              />

                                              <p
                                                className={`text-[11px] mt-1 ${muted}`}
                                              >
                                                Written feedback is required
                                                when submitting the evaluation.
                                              </p>
                                            </div>

                                            {/* ACTIONS */}

                                            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
                                              <button
                                                type="button"
                                                onClick={handleSaveDraft}
                                                disabled={saving}
                                                className={`px-4 py-2.5 rounded-lg border text-sm font-bold transition ${
                                                  saving
                                                    ? "opacity-50 cursor-not-allowed"
                                                    : ""
                                                } ${
                                                  darkMode
                                                    ? "border-slate-700 text-slate-200 hover:bg-slate-800"
                                                    : "border-slate-200 text-slate-700 hover:bg-slate-50"
                                                }`}
                                              >
                                                {saving
                                                  ? "Saving..."
                                                  : "Save Draft"}
                                              </button>

                                              <button
                                                type="submit"
                                                disabled={saving}
                                                className={`px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition ${
                                                  saving
                                                    ? "opacity-50 cursor-not-allowed"
                                                    : ""
                                                }`}
                                              >
                                                {saving
                                                  ? "Submitting..."
                                                  : "Submit Evaluation"}
                                              </button>
                                            </div>
                                          </div>
                                        </form>
                                      )}

                                      {/* VIEW SUBMITTED EVALUATION */}

                                      {isEvaluationLocked &&
                                        currentEvaluation && (
                                          <div
                                            className={`mt-5 border rounded-xl overflow-hidden ${card}`}
                                          >
                                            <div
                                              className={`p-5 border-b ${
                                                darkMode
                                                  ? "border-slate-700"
                                                  : "border-slate-200"
                                              }`}
                                            >
                                              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                                <div>
                                                  <p className="text-[10px] uppercase tracking-widest font-bold text-emerald-500">
                                                    Submitted Evaluation
                                                  </p>

                                                  <h3
                                                    className={`text-lg font-black mt-1 ${heading}`}
                                                  >
                                                    {getTemplateById(
                                                      currentEvaluation.template_id
                                                    )?.name ||
                                                      companyTemplate.name}
                                                  </h3>
                                                </div>

                                                {currentEvaluation.overall_rating && (
                                                  <div>
                                                    {renderStars(
                                                      Number(
                                                        currentEvaluation.overall_rating
                                                      )
                                                    )}
                                                  </div>
                                                )}
                                              </div>
                                            </div>

                                            <div className="p-5 space-y-6">
                                              {getTemplateCriteria(
                                                getTemplateById(
                                                  currentEvaluation.template_id
                                                ) || companyTemplate
                                              ).map((criterion) => (
                                                <div
                                                  key={criterion.id}
                                                  className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b last:border-b-0 ${
                                                    darkMode
                                                      ? "border-slate-800"
                                                      : "border-slate-100"
                                                  }`}
                                                >
                                                  <div>
                                                    <p
                                                      className={`text-[10px] uppercase tracking-wide font-bold ${muted}`}
                                                    >
                                                      {criterion.sectionName}
                                                    </p>

                                                    <p
                                                      className={`text-sm font-semibold mt-1 ${heading}`}
                                                    >
                                                      {criterion.criterion}
                                                    </p>
                                                  </div>

                                                  <div>
                                                    {renderStars(
                                                      Number(
                                                        currentEvaluation
                                                          .responses?.[
                                                          criterion.id
                                                        ] || 0
                                                      )
                                                    )}
                                                  </div>
                                                </div>
                                              ))}

                                              <div
                                                className={`border rounded-xl p-4 ${softCard}`}
                                              >
                                                <p
                                                  className={`text-[10px] uppercase tracking-wide font-bold ${muted}`}
                                                >
                                                  Overall Rating
                                                </p>

                                                <div className="mt-2">
                                                  {renderStars(
                                                    Number(
                                                      currentEvaluation.overall_rating ||
                                                        0
                                                    )
                                                  )}
                                                </div>
                                              </div>

                                              <div>
                                                <p
                                                  className={`text-[10px] uppercase tracking-wide font-bold ${muted}`}
                                                >
                                                  Written Feedback
                                                </p>

                                                <p
                                                  className={`text-sm mt-2 whitespace-pre-wrap ${heading}`}
                                                >
                                                  {currentEvaluation.comments ||
                                                    "No written feedback provided."}
                                                </p>
                                              </div>

                                              <div
                                                className={`text-xs ${muted}`}
                                              >
                                                Submitted on{" "}
                                                {formatDate(
                                                  currentEvaluation.submitted_at
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        )}

                                      {/* CLOSE */}

                                      <div className="flex justify-end mt-4">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleSelectAssignment(
                                              assignment.id
                                            )
                                          }
                                          className={`px-3 py-2 rounded-lg text-xs font-bold transition ${
                                            darkMode
                                              ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                          }`}
                                        >
                                          Hide Evaluation
                                        </button>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>
          )}
        </section>
      )}

      {/* =====================================================
          STUDENT → COMPANY TAB
      ===================================================== */}

      {evaluationTab === "student_to_company" && (
        <section>
          <div className="mb-4">
            <p className="text-xs uppercase tracking-widest font-bold text-slate-400">
              Student → Company
            </p>

            <h2 className={`text-xl font-black ${heading}`}>
              Student Evaluations
            </h2>

            <p className={`text-sm mt-1 ${muted}`}>
              Review evaluations submitted by interns about their experience at{" "}
              {company?.company_name || "your company"}.
            </p>
          </div>

          {/* =====================================================
              NO STUDENT EVALUATIONS
          ===================================================== */}

          {studentEvaluationCounts.all === 0 ? (
            <section className={`border rounded-2xl p-6 ${card}`}>
              <div className="text-center py-8">
                <div className="text-3xl mb-3">📝</div>

                <p className={`font-semibold ${heading}`}>
                  No student evaluations yet.
                </p>

                <p className={`text-sm mt-1 max-w-md mx-auto ${muted}`}>
                  Intern evaluations of your company will appear here after a
                  student submits one through the Student Portal.
                </p>
              </div>
            </section>
          ) : (
            <div className="space-y-4">
              {/* SEARCH + FILTER */}

              <section className={`border rounded-2xl p-4 ${card}`}>
                <div className="flex flex-col lg:flex-row gap-3">
                  {/* SEARCH */}

                  <div className="flex-1">
                    <label
                      className={`block text-[11px] font-bold uppercase tracking-wide mb-2 ${muted}`}
                    >
                      Search Evaluations
                    </label>

                    <div className="relative">
                      <span
                        className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm ${muted}`}
                      >
                        🔎
                      </span>

                      <input
                        type="text"
                        value={studentEvaluationSearch}
                        onChange={(event) =>
                          setStudentEvaluationSearch(event.target.value)
                        }
                        placeholder="Search student name, Student ID, program..."
                        className={`w-full border rounded-lg pl-9 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${input}`}
                      />
                    </div>
                  </div>

                  {/* FILTER */}

                  <div className="w-full lg:w-56">
                    <label
                      className={`block text-[11px] font-bold uppercase tracking-wide mb-2 ${muted}`}
                    >
                      Status
                    </label>

                    <select
                      value={studentEvaluationFilter}
                      onChange={(event) =>
                        setStudentEvaluationFilter(event.target.value)
                      }
                      className={`w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${input}`}
                    >
                      <option value="all">
                        All ({studentEvaluationCounts.all})
                      </option>

                      <option value={EVALUATION_STATUS.SUBMITTED}>
                        Submitted ({studentEvaluationCounts.submitted})
                      </option>

                      <option value={EVALUATION_STATUS.FINALIZED}>
                        Finalized ({studentEvaluationCounts.finalized})
                      </option>
                    </select>
                  </div>
                </div>

                {/* SEARCH RESULT COUNT */}

                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className={`text-xs ${muted}`}>
                    Showing{" "}
                    <span className={`font-bold ${heading}`}>
                      {studentCompanyEvaluations.length}
                    </span>{" "}
                    of{" "}
                    <span className={`font-bold ${heading}`}>
                      {studentEvaluationCounts.all}
                    </span>{" "}
                    student evaluation
                    {studentEvaluationCounts.all !== 1 ? "s" : ""}
                  </p>

                  {(studentEvaluationSearch ||
                    studentEvaluationFilter !== "all") && (
                    <button
                      type="button"
                      onClick={clearStudentEvaluationFilters}
                      className={`text-xs font-semibold ${
                        darkMode
                          ? "text-blue-400 hover:text-blue-300"
                          : "text-blue-600 hover:text-blue-700"
                      }`}
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              </section>

              {/* NO SEARCH RESULTS */}

              {studentCompanyEvaluations.length === 0 ? (
                <section className={`border rounded-2xl p-6 ${card}`}>
                  <div className="text-center py-8">
                    <div className="text-3xl mb-3">🔎</div>

                    <p className={`font-semibold ${heading}`}>
                      No matching evaluations found.
                    </p>

                    <p className={`text-sm mt-1 max-w-md mx-auto ${muted}`}>
                      Try changing your search or selecting a different
                      evaluation status.
                    </p>
                  </div>
                </section>
              ) : (
                <section
                  className={`border rounded-2xl overflow-hidden ${card}`}
                >
                  {/* TABLE HEADER */}

                  <div
                    className={`px-4 py-3 border-b ${
                      darkMode ? "border-slate-700" : "border-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className={`text-sm font-bold ${heading}`}>
                          Submitted Student Evaluations
                        </h3>

                        <p className={`text-[11px] mt-0.5 ${muted}`}>
                          Select an evaluation to view its full details.
                        </p>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          darkMode
                            ? "bg-slate-800 text-slate-300"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {studentCompanyEvaluations.length} result
                        {studentCompanyEvaluations.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>

                  {/* TABLE */}

                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px]">
                      <thead>
                        <tr
                          className={
                            darkMode ? "bg-slate-800/60" : "bg-slate-50"
                          }
                        >
                          <th
                            className={`px-4 py-3 text-left text-[10px] uppercase tracking-wider font-bold ${muted}`}
                          >
                            Student
                          </th>

                          <th
                            className={`px-4 py-3 text-left text-[10px] uppercase tracking-wider font-bold ${muted}`}
                          >
                            Position
                          </th>

                          <th
                            className={`px-4 py-3 text-left text-[10px] uppercase tracking-wider font-bold ${muted}`}
                          >
                            Submitted
                          </th>

                          <th
                            className={`px-4 py-3 text-left text-[10px] uppercase tracking-wider font-bold ${muted}`}
                          >
                            Status
                          </th>

                          <th
                            className={`px-4 py-3 text-left text-[10px] uppercase tracking-wider font-bold ${muted}`}
                          >
                            Overall Rating
                          </th>

                          <th
                            className={`px-4 py-3 text-right text-[10px] uppercase tracking-wider font-bold ${muted}`}
                          >
                            Action
                          </th>
                        </tr>
                      </thead>

                      <tbody
                        className={`divide-y ${
                          darkMode ? "divide-slate-700" : "divide-slate-200"
                        }`}
                      >
                        {studentCompanyEvaluations.map((evaluation) => {
                          const assignment = getAssignment(
                            evaluation.assignment_id
                          );

                          const student = getStudent(
                            evaluation.evaluated_student_id
                          );

                          const opportunity = assignment
                            ? getOpportunity(assignment.opportunity_id)
                            : null;

                          const isSelected =
                            selectedEvaluation?.id === evaluation.id;

                          return (
                            <React.Fragment key={evaluation.id}>
                              {/* TABLE ROW */}

                              <tr
                                className={`transition ${
                                  isSelected
                                    ? darkMode
                                      ? "bg-blue-950/30"
                                      : "bg-blue-50/70"
                                    : darkMode
                                    ? "hover:bg-slate-800/50"
                                    : "hover:bg-slate-50"
                                }`}
                              >
                                {/* STUDENT */}

                                <td className="px-4 py-4">
                                  <div className="flex items-center gap-3">
                                    <div
                                      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${
                                        darkMode
                                          ? "bg-slate-800 text-slate-300"
                                          : "bg-slate-100 text-slate-600"
                                      }`}
                                    >
                                      {(student?.fullName || "S")
                                        .charAt(0)
                                        .toUpperCase()}
                                    </div>

                                    <div className="min-w-0">
                                      <p
                                        className={`text-sm font-bold truncate max-w-[200px] ${heading}`}
                                      >
                                        {student?.fullName || "Student"}
                                      </p>

                                      <p
                                        className={`text-[11px] mt-0.5 truncate max-w-[200px] ${muted}`}
                                      >
                                        {student?.studentId ||
                                          "Student ID unavailable"}
                                      </p>
                                    </div>
                                  </div>
                                </td>

                                {/* POSITION */}

                                <td className="px-4 py-4">
                                  <div className="max-w-[180px]">
                                    <p
                                      className={`text-xs font-semibold truncate ${heading}`}
                                    >
                                      {opportunity?.title ||
                                        "Position not specified"}
                                    </p>

                                    {student?.program && (
                                      <p
                                        className={`text-[11px] mt-0.5 truncate ${muted}`}
                                      >
                                        {student.program}
                                      </p>
                                    )}
                                  </div>
                                </td>

                                {/* SUBMITTED */}

                                <td className="px-4 py-4">
                                  <p
                                    className={`text-xs font-semibold whitespace-nowrap ${heading}`}
                                  >
                                    {formatDate(
                                      evaluation.submitted_at ||
                                        evaluation.created_at
                                    )}
                                  </p>
                                </td>

                                {/* STATUS */}

                                <td className="px-4 py-4">
                                  <span
                                    className={`inline-flex px-2.5 py-1 rounded-full text-[9px] font-bold ${
                                      evaluation.status ===
                                      EVALUATION_STATUS.FINALIZED
                                        ? darkMode
                                          ? "bg-purple-950/40 text-purple-300"
                                          : "bg-purple-50 text-purple-700"
                                        : darkMode
                                        ? "bg-emerald-950/40 text-emerald-300"
                                        : "bg-emerald-50 text-emerald-700"
                                    }`}
                                  >
                                    {evaluation.status.toUpperCase()}
                                  </span>
                                </td>

                                {/* OVERALL RATING */}

                                <td className="px-4 py-4">
                                  {evaluation.overall_rating ? (
                                    renderStars(
                                      Number(evaluation.overall_rating)
                                    )
                                  ) : (
                                    <span className={`text-xs ${muted}`}>
                                      —
                                    </span>
                                  )}
                                </td>

                                {/* ACTION */}

                                <td className="px-4 py-4 text-right">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleOpenStudentEvaluation(evaluation)
                                    }
                                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                                      isSelected
                                        ? darkMode
                                          ? "bg-slate-700 text-slate-100 hover:bg-slate-600"
                                          : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                                        : darkMode
                                        ? "bg-blue-900/50 text-blue-300 hover:bg-blue-900"
                                        : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                                    }`}
                                  >
                                    {isSelected ? "Close" : "View"}

                                    <span
                                      className={`transition-transform ${
                                        isSelected ? "rotate-180" : ""
                                      }`}
                                    >
                                      ⌄
                                    </span>
                                  </button>
                                </td>
                              </tr>

                              {/* EXPANDED DETAIL ROW */}

                              {isSelected && (
                                <tr>
                                  <td
                                    colSpan={6}
                                    className={`p-0 border-t ${
                                      darkMode
                                        ? "border-slate-700"
                                        : "border-slate-200"
                                    }`}
                                  >
                                    <div
                                      className={`${
                                        darkMode
                                          ? "bg-slate-950/40"
                                          : "bg-slate-50/70"
                                      }`}
                                    >
                                      {(() => {
                                        const template = getTemplateById(
                                          evaluation.template_id
                                        );

                                        const criteria =
                                          getTemplateCriteria(template);

                                        const selectedAssignment =
                                          getAssignment(
                                            evaluation.assignment_id
                                          );

                                        const selectedStudentData = getStudent(
                                          evaluation.evaluated_student_id
                                        );

                                        const selectedOpportunity =
                                          selectedAssignment
                                            ? getOpportunity(
                                                selectedAssignment.opportunity_id
                                              )
                                            : null;

                                        return (
                                          <div className="p-5">
                                            {/* DETAIL HEADER */}

                                            <div
                                              className={`rounded-xl border p-4 ${softCard}`}
                                            >
                                              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                                <div>
                                                  <div className="flex flex-wrap items-center gap-2">
                                                    <h3
                                                      className={`font-bold ${heading}`}
                                                    >
                                                      {selectedStudentData?.fullName ||
                                                        "Student"}
                                                    </h3>

                                                    <span
                                                      className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                                                        evaluation.status ===
                                                        EVALUATION_STATUS.FINALIZED
                                                          ? darkMode
                                                            ? "bg-purple-950/40 text-purple-300"
                                                            : "bg-purple-50 text-purple-700"
                                                          : darkMode
                                                          ? "bg-emerald-950/40 text-emerald-300"
                                                          : "bg-emerald-50 text-emerald-700"
                                                      }`}
                                                    >
                                                      {evaluation.status.toUpperCase()}
                                                    </span>
                                                  </div>

                                                  <p
                                                    className={`text-xs mt-1 ${muted}`}
                                                  >
                                                    {selectedStudentData?.studentId
                                                      ? `Student ID: ${selectedStudentData.studentId}`
                                                      : "Student ID unavailable"}
                                                  </p>

                                                  {selectedStudentData?.program && (
                                                    <p
                                                      className={`text-xs mt-1 ${muted}`}
                                                    >
                                                      Program:{" "}
                                                      {
                                                        selectedStudentData.program
                                                      }
                                                    </p>
                                                  )}

                                                  {selectedStudentData?.email && (
                                                    <p
                                                      className={`text-xs mt-1 ${muted}`}
                                                    >
                                                      {
                                                        selectedStudentData.email
                                                      }
                                                    </p>
                                                  )}
                                                </div>

                                                <div className="md:text-right">
                                                  <p
                                                    className={`text-[10px] uppercase tracking-wide font-bold ${muted}`}
                                                  >
                                                    Internship
                                                  </p>

                                                  <p
                                                    className={`text-sm font-semibold mt-1 ${heading}`}
                                                  >
                                                    {selectedOpportunity?.title ||
                                                      "Position not specified"}
                                                  </p>

                                                  {selectedAssignment && (
                                                    <p
                                                      className={`text-xs mt-1 ${muted}`}
                                                    >
                                                      {formatDate(
                                                        selectedAssignment.start_date
                                                      )}{" "}
                                                      –{" "}
                                                      {formatDate(
                                                        selectedAssignment.end_date
                                                      )}
                                                    </p>
                                                  )}

                                                  {evaluation.submitted_at && (
                                                    <p
                                                      className={`text-xs mt-1 ${muted}`}
                                                    >
                                                      Submitted{" "}
                                                      {formatDate(
                                                        evaluation.submitted_at
                                                      )}
                                                    </p>
                                                  )}
                                                </div>
                                              </div>
                                            </div>

                                            {/* TEMPLATE INFORMATION */}

                                            {template && (
                                              <div className="mt-5">
                                                <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">
                                                  Evaluation Template
                                                </p>

                                                <h4
                                                  className={`font-bold mt-1 ${heading}`}
                                                >
                                                  {template.name}
                                                </h4>

                                                <p
                                                  className={`text-xs mt-1 ${muted}`}
                                                >
                                                  Version {template.version}
                                                </p>

                                                {template.description && (
                                                  <p
                                                    className={`text-xs mt-2 leading-relaxed ${muted}`}
                                                  >
                                                    {template.description}
                                                  </p>
                                                )}
                                              </div>
                                            )}

                                            {/* CRITERIA */}

                                            {criteria.length > 0 ? (
                                              <div className="mt-5 space-y-6">
                                                {[
                                                  ...(template?.evaluation_sections ||
                                                    []),
                                                ]
                                                  .sort(
                                                    (a, b) =>
                                                      Number(
                                                        a.display_order || 0
                                                      ) -
                                                      Number(
                                                        b.display_order || 0
                                                      )
                                                  )
                                                  .map((section) => {
                                                    const sectionCriteria = [
                                                      ...(section.evaluation_criteria ||
                                                        []),
                                                    ].sort(
                                                      (a, b) =>
                                                        Number(
                                                          a.display_order || 0
                                                        ) -
                                                        Number(
                                                          b.display_order || 0
                                                        )
                                                    );

                                                    return (
                                                      <div key={section.id}>
                                                        <div className="mb-3">
                                                          <h4
                                                            className={`font-bold text-sm ${heading}`}
                                                          >
                                                            {section.name}
                                                          </h4>
                                                        </div>

                                                        <div className="grid md:grid-cols-2 gap-3">
                                                          {sectionCriteria.map(
                                                            (criterion) => {
                                                              const rating =
                                                                Number(
                                                                  evaluation
                                                                    .responses?.[
                                                                    criterion.id
                                                                  ]
                                                                );

                                                              return (
                                                                <div
                                                                  key={
                                                                    criterion.id
                                                                  }
                                                                  className={`border rounded-xl p-4 ${softCard}`}
                                                                >
                                                                  <div className="flex items-center justify-between gap-3 mb-2">
                                                                    <span
                                                                      className={`text-xs font-semibold ${heading}`}
                                                                    >
                                                                      {
                                                                        criterion.criterion
                                                                      }
                                                                    </span>

                                                                    <span className="text-xs font-bold text-slate-400">
                                                                      {rating ||
                                                                        "—"}
                                                                      /5
                                                                    </span>
                                                                  </div>

                                                                  {renderStars(
                                                                    rating
                                                                  )}
                                                                </div>
                                                              );
                                                            }
                                                          )}
                                                        </div>
                                                      </div>
                                                    );
                                                  })}
                                              </div>
                                            ) : (
                                              <div className="mt-5">
                                                <p
                                                  className={`text-sm ${muted}`}
                                                >
                                                  No evaluation criteria were
                                                  found for this evaluation
                                                  template.
                                                </p>
                                              </div>
                                            )}

                                            {/* OVERALL RATING */}

                                            <div className="mt-6">
                                              <div
                                                className={`border rounded-xl p-4 ${softCard}`}
                                              >
                                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                                  <div>
                                                    <p
                                                      className={`text-xs font-semibold ${heading}`}
                                                    >
                                                      Overall Rating
                                                    </p>

                                                    <p
                                                      className={`text-2xl font-black mt-1 ${heading}`}
                                                    >
                                                      {Number(
                                                        evaluation.overall_rating
                                                      )
                                                        ? `${Number(
                                                            evaluation.overall_rating
                                                          ).toFixed(2)}/5`
                                                        : "—"}
                                                    </p>
                                                  </div>

                                                  {renderStars(
                                                    Number(
                                                      evaluation.overall_rating
                                                    )
                                                  )}
                                                </div>
                                              </div>
                                            </div>

                                            {/* COMMENTS */}

                                            {evaluation.comments && (
                                              <div className="mt-5">
                                                <p
                                                  className={`text-xs font-semibold ${heading}`}
                                                >
                                                  Written Feedback
                                                </p>

                                                <div
                                                  className={`border rounded-xl p-4 mt-2 text-sm leading-relaxed whitespace-pre-line ${
                                                    darkMode
                                                      ? "border-slate-700 bg-slate-800/50 text-slate-300"
                                                      : "border-slate-200 bg-white text-slate-600"
                                                  }`}
                                                >
                                                  {evaluation.comments}
                                                </div>
                                              </div>
                                            )}

                                            {/* CLOSE */}

                                            <div className="mt-5 flex justify-end">
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  setSelectedEvaluation(null)
                                                }
                                                className={`px-4 py-2 rounded-lg text-xs font-semibold border transition ${
                                                  darkMode
                                                    ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                                                    : "border-slate-300 text-slate-700 hover:bg-white"
                                                }`}
                                              >
                                                Hide Evaluation
                                              </button>
                                            </div>
                                          </div>
                                        );
                                      })()}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
            </div>
          )}
        </section>
      )}

      {/* =====================================================
          LIMITATION NOTICE
      ===================================================== */}

      <div
        className={`mt-6 p-4 rounded-xl border text-xs ${
          darkMode
            ? "bg-slate-900 border-slate-700 text-slate-400"
            : "bg-slate-50 border-slate-200 text-slate-500"
        }`}
      >
        <p className={`font-bold mb-1 ${heading}`}>ℹ️ Evaluation Policy</p>

        {evaluationTab === "company_to_student" ? (
          <>
            <p>
              Company evaluations become available only after an internship has
              been marked as completed. Once an evaluation is submitted, it is
              locked and cannot be edited by the company.
            </p>

            <p className="mt-2">
              Student evaluations of the company become visible to the company
              only after the student submits the evaluation.
            </p>
          </>
        ) : (
          <>
            <p>
              Student evaluations are visible to the company only after the
              student submits the evaluation.
            </p>

            <p className="mt-2">
              Submitted and finalized student evaluations are view-only from the
              Company Portal.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
