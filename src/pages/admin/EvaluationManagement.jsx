import React, { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "../../supabaseClient";

// =========================================================
// CONSTANTS
// =========================================================

const DIRECTIONS = {
  COMPANY: "Company Supervisor",
  STUDENT: "Student",
};

const DB_DIRECTION = {
  [DIRECTIONS.COMPANY]: "company_to_student",
  [DIRECTIONS.STUDENT]: "student_to_company",
};

const STATUS = {
  evaluation: {
    DRAFT: "draft",
    SUBMITTED: "submitted",
    RETURNED: "returned",
    FINALIZED: "finalized",
  },

  template: {
    DRAFT: "draft",
    PUBLISHED: "published",
    ARCHIVED: "archived",
  },
};

// =========================================================
// DEFAULT TEMPLATE FALLBACK
// Used only if a template cannot be loaded.
// =========================================================

const DEFAULT_TEMPLATES = {
  [DIRECTIONS.COMPANY]: {
    name: "Intern Performance Evaluation",
    description:
      "Used by company supervisors to evaluate the performance and professional development of interns.",
    sections: [
      {
        id: null,
        name: "Technical Skills",
        fields: [
          "Knowledge of assigned tasks",
          "Quality of work",
          "Problem-solving ability",
        ],
      },
      {
        id: null,
        name: "Professionalism",
        fields: [
          "Attendance and punctuality",
          "Work attitude",
          "Responsibility",
        ],
      },
      {
        id: null,
        name: "Communication",
        fields: [
          "Communication skills",
          "Teamwork",
          "Ability to receive feedback",
        ],
      },
      {
        id: null,
        name: "Overall Assessment",
        fields: [
          "Overall performance",
          "Readiness for professional work",
          "Overall recommendation",
        ],
      },
    ],
  },

  [DIRECTIONS.STUDENT]: {
    name: "Company & Internship Experience Evaluation",
    description:
      "Used by students to evaluate their company, supervisor, work environment, and overall internship experience.",
    sections: [
      {
        id: null,
        name: "Work Environment",
        fields: [
          "Workplace environment",
          "Availability of resources",
          "Safety and comfort",
        ],
      },
      {
        id: null,
        name: "Supervision",
        fields: [
          "Supervisor support",
          "Clarity of instructions",
          "Feedback and guidance",
        ],
      },
      {
        id: null,
        name: "Learning Experience",
        fields: [
          "Relevant learning opportunities",
          "Skill development",
          "Exposure to real-world tasks",
        ],
      },
      {
        id: null,
        name: "Overall Experience",
        fields: [
          "Overall internship experience",
          "Would recommend the company",
          "Overall rating",
        ],
      },
    ],
  },
};

// =========================================================
// HELPERS
// =========================================================

const clone = (value) => JSON.parse(JSON.stringify(value));

const createFallbackTemplate = (direction) => ({
  id: null,
  direction: DB_DIRECTION[direction],
  name: DEFAULT_TEMPLATES[direction].name,
  description: DEFAULT_TEMPLATES[direction].description,
  version: 1,
  status: STATUS.template.DRAFT,
  publishedAt: null,
  updatedAt: null,
  sections: clone(DEFAULT_TEMPLATES[direction].sections),
});

const mapDatabaseTemplate = (template, sections = []) => ({
  id: template.id,
  direction: template.direction,
  name: template.name,
  description: template.description,
  version: template.version,
  status: template.status,
  publishedAt: template.published_at,
  updatedAt: template.updated_at,

  sections: sections.map((section) => ({
    id: section.id,
    name: section.name,
    displayOrder: section.display_order,

    fields: (section.evaluation_criteria || [])
      .sort((a, b) => a.display_order - b.display_order)
      .map((criterion) => ({
        id: criterion.id,
        text: criterion.criterion,
        displayOrder: criterion.display_order,
      })),
  })),
});

// =========================================================
// COMPONENT
// =========================================================

const EvaluationManagement = () => {
  const { darkMode } = useOutletContext();

  // =========================================================
  // STATE
  // =========================================================

  const [activeDirection, setActiveDirection] = useState(
    DIRECTIONS.COMPANY
  );

  const [templates, setTemplates] = useState({
    [DIRECTIONS.COMPANY]: createFallbackTemplate(DIRECTIONS.COMPANY),
    [DIRECTIONS.STUDENT]: createFallbackTemplate(DIRECTIONS.STUDENT),
  });

  const [evaluationStats, setEvaluationStats] = useState({
    companyToStudent: 0,
    studentToCompany: 0,
    total: 0,
    submitted: 0,
    finalized: 0,
  });

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");

  const currentTemplate = templates[activeDirection];

  // =========================================================
  // LOAD ALL TEMPLATES
  // =========================================================

  const loadTemplates = async () => {
    setLoading(true);
    setError("");

    try {
      const { data: templateRows, error: templateError } = await supabase
        .from("evaluation_templates")
        .select("*")
        .order("direction", { ascending: true })
        .order("version", { ascending: false });

      if (templateError) {
        throw templateError;
      }

      const loadedTemplates = {
        [DIRECTIONS.COMPANY]: null,
        [DIRECTIONS.STUDENT]: null,
      };

      // -------------------------------------------------------
      // Use the latest template version for each direction.
      // -------------------------------------------------------

      for (const template of templateRows || []) {
        const uiDirection =
          template.direction === "company_to_student"
            ? DIRECTIONS.COMPANY
            : template.direction === "student_to_company"
            ? DIRECTIONS.STUDENT
            : null;

        if (!uiDirection) {
          continue;
        }

        if (!loadedTemplates[uiDirection]) {
          loadedTemplates[uiDirection] = template;
        }
      }

      // -------------------------------------------------------
      // Load sections + criteria for selected template versions.
      // -------------------------------------------------------

      for (const direction of [
        DIRECTIONS.COMPANY,
        DIRECTIONS.STUDENT,
      ]) {
        const template = loadedTemplates[direction];

        if (!template) {
          continue;
        }

        const { data: sectionRows, error: sectionError } = await supabase
          .from("evaluation_sections")
          .select(`
            id,
            template_id,
            name,
            display_order,
            evaluation_criteria (
              id,
              section_id,
              criterion,
              display_order
            )
          `)
          .eq("template_id", template.id)
          .order("display_order", { ascending: true });

        if (sectionError) {
          throw sectionError;
        }

        loadedTemplates[direction] = mapDatabaseTemplate(
          template,
          sectionRows || []
        );
      }

      setTemplates({
        [DIRECTIONS.COMPANY]:
          loadedTemplates[DIRECTIONS.COMPANY] ||
          createFallbackTemplate(DIRECTIONS.COMPANY),

        [DIRECTIONS.STUDENT]:
          loadedTemplates[DIRECTIONS.STUDENT] ||
          createFallbackTemplate(DIRECTIONS.STUDENT),
      });

      setHasUnsavedChanges(false);
    } catch (err) {
      console.error("Failed to load evaluation templates:", err);

      setError(
        err?.message ||
          "Failed to load evaluation templates from the database."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // LOAD EVALUATION STATISTICS
  // =========================================================

  const loadEvaluationStats = async () => {
    try {
      const { data, error: evaluationError } = await supabase
        .from("evaluations")
        .select(`
          id,
          evaluator_role,
          status
        `);

      if (evaluationError) {
        throw evaluationError;
      }

      const evaluations = data || [];

      const companyToStudent = evaluations.filter(
        (evaluation) =>
          evaluation.evaluator_role === "company_supervisor"
      ).length;

      const studentToCompany = evaluations.filter(
        (evaluation) => evaluation.evaluator_role === "student"
      ).length;

      const submitted = evaluations.filter(
        (evaluation) =>
          evaluation.status === STATUS.evaluation.SUBMITTED
      ).length;

      const finalized = evaluations.filter(
        (evaluation) =>
          evaluation.status === STATUS.evaluation.FINALIZED
      ).length;

      setEvaluationStats({
        companyToStudent,
        studentToCompany,
        total: evaluations.length,
        submitted,
        finalized,
      });
    } catch (err) {
      console.error("Failed to load evaluation statistics:", err);

      // Do not break the entire page if statistics fail.
      setEvaluationStats({
        companyToStudent: 0,
        studentToCompany: 0,
        total: 0,
        submitted: 0,
        finalized: 0,
      });
    }
  };

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    const initialize = async () => {
      await Promise.all([
        loadTemplates(),
        loadEvaluationStats(),
      ]);
    };

    initialize();
  }, []);

  // =========================================================
  // UPDATE CURRENT TEMPLATE
  // =========================================================

  const updateCurrentTemplate = (patch) => {
    setTemplates((previous) => ({
      ...previous,
      [activeDirection]: {
        ...previous[activeDirection],
        ...patch,
      },
    }));

    setHasUnsavedChanges(true);
  };

  // =========================================================
  // TEMPLATE NAME
  // =========================================================

  const handleTemplateNameChange = (value) => {
    updateCurrentTemplate({
      name: value,
    });
  };

  // =========================================================
  // DESCRIPTION
  // =========================================================

  const handleDescriptionChange = (value) => {
    updateCurrentTemplate({
      description: value,
    });
  };

  // =========================================================
  // ADD SECTION
  // =========================================================

  const handleAddSection = () => {
    const newSection = {
      id: null,
      name: `New Section ${currentTemplate.sections.length + 1}`,
      fields: [
        {
          id: null,
          text: "New Criterion",
          displayOrder: 1,
        },
      ],
      displayOrder: currentTemplate.sections.length + 1,
    };

    updateCurrentTemplate({
      sections: [...currentTemplate.sections, newSection],
    });
  };

  // =========================================================
  // REMOVE SECTION
  // =========================================================

  const handleRemoveSection = (sectionId) => {
    if (currentTemplate.sections.length <= 1) {
      alert(
        "An evaluation template must contain at least one section."
      );
      return;
    }

    const confirmed = window.confirm(
      "Remove this section and all of its criteria?"
    );

    if (!confirmed) {
      return;
    }

    updateCurrentTemplate({
      sections: currentTemplate.sections
        .filter((section) => section.id !== sectionId)
        .map((section, index) => ({
          ...section,
          displayOrder: index + 1,
        })),
    });
  };

  // =========================================================
  // UPDATE SECTION NAME
  // =========================================================

  const handleSectionNameChange = (sectionId, value) => {
    updateCurrentTemplate({
      sections: currentTemplate.sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              name: value,
            }
          : section
      ),
    });
  };

  // =========================================================
  // ADD CRITERION
  // =========================================================

  const handleAddCriterion = (sectionId) => {
    updateCurrentTemplate({
      sections: currentTemplate.sections.map((section) => {
        if (section.id !== sectionId) {
          return section;
        }

        return {
          ...section,
          fields: [
            ...section.fields,
            {
              id: null,
              text: `New Criterion ${section.fields.length + 1}`,
              displayOrder: section.fields.length + 1,
            },
          ],
        };
      }),
    });
  };

  // =========================================================
  // REMOVE CRITERION
  // =========================================================

  const handleRemoveCriterion = (sectionId, criterionId) => {
    const section = currentTemplate.sections.find(
      (item) => item.id === sectionId
    );

    if (!section) {
      return;
    }

    if (section.fields.length <= 1) {
      alert(
        "Each section must contain at least one criterion."
      );
      return;
    }

    updateCurrentTemplate({
      sections: currentTemplate.sections.map((item) => {
        if (item.id !== sectionId) {
          return item;
        }

        return {
          ...item,
          fields: item.fields
            .filter((field) => field.id !== criterionId)
            .map((field, index) => ({
              ...field,
              displayOrder: index + 1,
            })),
        };
      }),
    });
  };

  // =========================================================
  // UPDATE CRITERION
  // =========================================================

  const handleCriterionChange = (
    sectionId,
    criterionId,
    value
  ) => {
    updateCurrentTemplate({
      sections: currentTemplate.sections.map((section) => {
        if (section.id !== sectionId) {
          return section;
        }

        return {
          ...section,
          fields: section.fields.map((field) =>
            field.id === criterionId
              ? {
                  ...field,
                  text: value,
                }
              : field
          ),
        };
      }),
    });
  };

  // =========================================================
  // VALIDATE TEMPLATE
  // =========================================================

  const validateTemplate = () => {
    if (!currentTemplate.name?.trim()) {
      return "Please enter a template name.";
    }

    if (!currentTemplate.description?.trim()) {
      return "Please enter a template description.";
    }

    if (!currentTemplate.sections.length) {
      return "The template must contain at least one section.";
    }

    for (const section of currentTemplate.sections) {
      if (!section.name?.trim()) {
        return "Every section must have a name.";
      }

      if (!section.fields?.length) {
        return `Section "${section.name}" must contain at least one criterion.`;
      }

      for (const field of section.fields) {
        if (!field.text?.trim()) {
          return `Every criterion in "${section.name}" must have a name.`;
        }
      }
    }

    return null;
  };

  // =========================================================
  // CREATE TEMPLATE VERSION
  // =========================================================

  const createTemplateVersion = async ({
    status,
    publishNow = false,
  }) => {
    const direction = DB_DIRECTION[activeDirection];

    // -------------------------------------------------------
    // Get the current highest version.
    // -------------------------------------------------------

    const { data: latestTemplate, error: latestError } =
      await supabase
        .from("evaluation_templates")
        .select("id, version, status")
        .eq("direction", direction)
        .order("version", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (latestError) {
      throw latestError;
    }

    const nextVersion = latestTemplate
      ? latestTemplate.version + 1
      : 1;

    // -------------------------------------------------------
    // If we're publishing, archive the previous published
    // template first.
    // -------------------------------------------------------

    if (publishNow) {
      const { error: archiveError } = await supabase
        .from("evaluation_templates")
        .update({
          status: STATUS.template.ARCHIVED,
        })
        .eq("direction", direction)
        .eq("status", STATUS.template.PUBLISHED);

      if (archiveError) {
        throw archiveError;
      }
    }

    // -------------------------------------------------------
    // Create new template version.
    // -------------------------------------------------------

    const { data: insertedTemplate, error: templateError } =
      await supabase
        .from("evaluation_templates")
        .insert({
          direction,
          name: currentTemplate.name.trim(),
          description: currentTemplate.description.trim(),
          version: nextVersion,
          status,
          published_at: publishNow
            ? new Date().toISOString()
            : null,
        })
        .select()
        .single();

    if (templateError) {
      throw templateError;
    }

    // -------------------------------------------------------
    // Insert sections.
    // -------------------------------------------------------

    for (
      let sectionIndex = 0;
      sectionIndex < currentTemplate.sections.length;
      sectionIndex++
    ) {
      const section = currentTemplate.sections[sectionIndex];

      const { data: insertedSection, error: sectionError } =
        await supabase
          .from("evaluation_sections")
          .insert({
            template_id: insertedTemplate.id,
            name: section.name.trim(),
            display_order: sectionIndex + 1,
          })
          .select()
          .single();

      if (sectionError) {
        throw sectionError;
      }

      // -----------------------------------------------------
      // Insert criteria.
      // -----------------------------------------------------

      const criteriaPayload = section.fields.map(
        (field, criterionIndex) => ({
          section_id: insertedSection.id,
          criterion: field.text.trim(),
          display_order: criterionIndex + 1,
        })
      );

      const { error: criteriaError } = await supabase
        .from("evaluation_criteria")
        .insert(criteriaPayload);

      if (criteriaError) {
        throw criteriaError;
      }
    }

    return insertedTemplate;
  };

  // =========================================================
  // SAVE DRAFT
  // =========================================================

  const handleSaveTemplate = async () => {
    const validationError = validateTemplate();

    if (validationError) {
      alert(validationError);
      return;
    }

    setSaving(true);
    setError("");

    try {
      const insertedTemplate = await createTemplateVersion({
        status: STATUS.template.DRAFT,
        publishNow: false,
      });

      // -------------------------------------------------------
      // Reload the newly created template with its sections.
      // -------------------------------------------------------

      const { data: sectionRows, error: sectionError } =
        await supabase
          .from("evaluation_sections")
          .select(`
            id,
            template_id,
            name,
            display_order,
            evaluation_criteria (
              id,
              section_id,
              criterion,
              display_order
            )
          `)
          .eq("template_id", insertedTemplate.id)
          .order("display_order", { ascending: true });

      if (sectionError) {
        throw sectionError;
      }

      const mappedTemplate = mapDatabaseTemplate(
        insertedTemplate,
        sectionRows || []
      );

      setTemplates((previous) => ({
        ...previous,
        [activeDirection]: mappedTemplate,
      }));

      setHasUnsavedChanges(false);

      alert(
        `"${mappedTemplate.name}" has been saved as Draft.\n\nVersion: ${mappedTemplate.version}`
      );

      await loadTemplates();
    } catch (err) {
      console.error("Failed to save evaluation template:", err);

      setError(
        err?.message ||
          "Failed to save the evaluation template."
      );

      alert(
        err?.message ||
          "Failed to save the evaluation template."
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // PUBLISH TEMPLATE
  // =========================================================

  const handlePublishTemplate = async () => {
    const validationError = validateTemplate();

    if (validationError) {
      alert(validationError);
      return;
    }

    const directionLabel =
      activeDirection === DIRECTIONS.COMPANY
        ? "Company Supervisor → Student"
        : "Student → Company";

    const confirmed = window.confirm(
      `Publish "${currentTemplate.name}"?\n\nEvaluation direction:\n${directionLabel}\n\nThis will create a new published template version and make it the active form for evaluators.`
    );

    if (!confirmed) {
      return;
    }

    setPublishing(true);
    setError("");

    try {
      const publishedTemplate = await createTemplateVersion({
        status: STATUS.template.PUBLISHED,
        publishNow: true,
      });

      // -------------------------------------------------------
      // Reload published template sections.
      // -------------------------------------------------------

      const { data: sectionRows, error: sectionError } =
        await supabase
          .from("evaluation_sections")
          .select(`
            id,
            template_id,
            name,
            display_order,
            evaluation_criteria (
              id,
              section_id,
              criterion,
              display_order
            )
          `)
          .eq("template_id", publishedTemplate.id)
          .order("display_order", { ascending: true });

      if (sectionError) {
        throw sectionError;
      }

      const mappedTemplate = mapDatabaseTemplate(
        publishedTemplate,
        sectionRows || []
      );

      setTemplates((previous) => ({
        ...previous,
        [activeDirection]: mappedTemplate,
      }));

      setHasUnsavedChanges(false);

      await Promise.all([
        loadTemplates(),
        loadEvaluationStats(),
      ]);

      alert(
        `"${mappedTemplate.name}" has been published successfully.\n\nDirection: ${directionLabel}\nVersion: ${mappedTemplate.version}`
      );
    } catch (err) {
      console.error(
        "Failed to publish evaluation template:",
        err
      );

      setError(
        err?.message ||
          "Failed to publish the evaluation template."
      );

      alert(
        err?.message ||
          "Failed to publish the evaluation template."
      );
    } finally {
      setPublishing(false);
    }
  };

  // =========================================================
  // SWITCH DIRECTION
  // =========================================================

  const handleDirectionChange = (direction) => {
    if (direction === activeDirection) {
      return;
    }

    if (hasUnsavedChanges) {
      const confirmed = window.confirm(
        "You have unsaved changes.\n\nSwitching evaluation direction will discard those changes.\n\nContinue?"
      );

      if (!confirmed) {
        return;
      }
    }

    setHasUnsavedChanges(false);
    setActiveDirection(direction);
  };

  // =========================================================
  // STATUS LABEL
  // =========================================================

  const getStatusLabel = (status) => {
    if (status === STATUS.template.PUBLISHED) {
      return "Published";
    }

    if (status === STATUS.template.ARCHIVED) {
      return "Archived";
    }

    return "Draft";
  };

  // =========================================================
  // DATE FORMATTER
  // =========================================================

  const formatDate = (date) => {
    if (!date) {
      return "Not available";
    }

    return new Date(date).toLocaleString("en-PH", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  // =========================================================
  // CURRENT COUNTS
  // =========================================================

  const criteriaCount = useMemo(() => {
    return currentTemplate.sections.reduce(
      (total, section) =>
        total + (section.fields?.length || 0),
      0
    );
  }, [currentTemplate.sections]);

  // =========================================================
  // STYLES
  // =========================================================

  const pageClass = darkMode
    ? "bg-slate-950 text-slate-100"
    : "bg-slate-50 text-slate-900";

  const cardClass = darkMode
    ? "bg-slate-900 border-slate-700"
    : "bg-white border-slate-300";

  const sectionClass = darkMode
    ? "bg-slate-800 border-slate-700"
    : "bg-slate-50 border-slate-300";

  const inputClass = darkMode
    ? "bg-slate-950 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-blue-500"
    : "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-slate-500";

  const mutedText = darkMode
    ? "text-slate-400"
    : "text-slate-500";

  const primaryButton = darkMode
    ? "bg-white text-slate-900 hover:bg-slate-200"
    : "bg-slate-700 text-white hover:bg-slate-800";

  const secondaryButton = darkMode
    ? "bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700"
    : "bg-white border-slate-300 text-slate-700 hover:bg-slate-100";

  // =========================================================
  // LOADING STATE
  // =========================================================

  if (loading) {
    return (
      <div
        className={`min-h-[calc(100vh-5rem)] flex items-center justify-center ${pageClass}`}
      >
        <div className="text-center">
          <div className="text-2xl mb-2">⏳</div>

          <p className="text-sm font-bold">
            Loading evaluation management...
          </p>

          <p className={`text-xs mt-1 ${mutedText}`}>
            Loading templates from Supabase.
          </p>
        </div>
      </div>
    );
  }

  // =========================================================
  // RETURN
  // =========================================================

  return (
    <div
      className={`min-h-[calc(100vh-5rem)] px-4 py-5 sm:px-6 lg:px-8 transition-colors duration-300 ${pageClass}`}
    >
      <div className="max-w-6xl mx-auto">

        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="mb-6">
          <p
            className={`text-[10px] uppercase tracking-widest font-bold ${
              darkMode
                ? "text-slate-500"
                : "text-slate-400"
            }`}
          >
            Administrator Portal
          </p>

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold mt-1">
                Evaluation Management
              </h1>

              <p className={`text-xs sm:text-sm mt-1 ${mutedText}`}>
                Configure and publish the evaluation forms used
                during internships.
              </p>
            </div>

            {hasUnsavedChanges && (
              <div
                className={`inline-flex self-start sm:self-auto px-3 py-1.5 rounded-full text-[9px] font-bold ${
                  darkMode
                    ? "bg-amber-950 text-amber-300 border border-amber-800"
                    : "bg-amber-50 text-amber-700 border border-amber-200"
                }`}
              >
                ● Unsaved changes
              </div>
            )}
          </div>
        </div>

        {/* =====================================================
            ERROR
        ===================================================== */}

        {error && (
          <div
            className={`mb-5 border rounded-lg p-3 ${
              darkMode
                ? "bg-red-950/30 border-red-800 text-red-300"
                : "bg-red-50 border-red-200 text-red-700"
            }`}
          >
            <p className="text-xs font-bold">
              Evaluation Management Error
            </p>

            <p className="text-[10px] mt-1">
              {error}
            </p>
          </div>
        )}

        {/* =====================================================
            DIRECTIONS
        ===================================================== */}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">

          {/* COMPANY → STUDENT */}

          <button
            type="button"
            onClick={() =>
              handleDirectionChange(DIRECTIONS.COMPANY)
            }
            className={`text-left border rounded-xl p-4 transition ${
              activeDirection === DIRECTIONS.COMPANY
                ? darkMode
                  ? "border-blue-500 bg-blue-950/30"
                  : "border-blue-500 bg-blue-50"
                : cardClass
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-wider font-bold text-blue-500">
                  Evaluation Direction
                </p>

                <h2 className="text-sm sm:text-base font-bold mt-1">
                  Company Supervisor → Student
                </h2>

                <p className={`text-[11px] mt-2 ${mutedText}`}>
                  Supervisors evaluate the intern's performance,
                  professionalism, communication, and development.
                </p>
              </div>

              <div className="text-2xl">🏢</div>
            </div>

            <div className="flex items-center justify-between mt-3">
              <span className="text-[10px] font-semibold">
                {evaluationStats.companyToStudent} submitted
              </span>

              {templates[DIRECTIONS.COMPANY]?.status ===
                STATUS.template.PUBLISHED && (
                <span className="text-[9px] font-bold text-emerald-500">
                  Published
                </span>
              )}
            </div>
          </button>

          {/* STUDENT → COMPANY */}

          <button
            type="button"
            onClick={() =>
              handleDirectionChange(DIRECTIONS.STUDENT)
            }
            className={`text-left border rounded-xl p-4 transition ${
              activeDirection === DIRECTIONS.STUDENT
                ? darkMode
                  ? "border-emerald-500 bg-emerald-950/30"
                  : "border-emerald-500 bg-emerald-50"
                : cardClass
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-wider font-bold text-emerald-500">
                  Evaluation Direction
                </p>

                <h2 className="text-sm sm:text-base font-bold mt-1">
                  Student → Company
                </h2>

                <p className={`text-[11px] mt-2 ${mutedText}`}>
                  Students evaluate their company, supervisor,
                  workplace, and overall internship experience.
                </p>
              </div>

              <div className="text-2xl">🎓</div>
            </div>

            <div className="flex items-center justify-between mt-3">
              <span className="text-[10px] font-semibold">
                {evaluationStats.studentToCompany} submitted
              </span>

              {templates[DIRECTIONS.STUDENT]?.status ===
                STATUS.template.PUBLISHED && (
                <span className="text-[9px] font-bold text-emerald-500">
                  Published
                </span>
              )}
            </div>
          </button>
        </div>

        {/* =====================================================
            REGISTRAR NOTICE
        ===================================================== */}

        <div className={`mb-6 border rounded-lg p-3 ${cardClass}`}>
          <div className="flex gap-3 items-start">
            <span className="text-sm">ℹ️</span>

            <div>
              <p className="text-xs font-bold">
                Registrar Adviser access
              </p>

              <p className={`text-[10px] mt-1 ${mutedText}`}>
                Registrar Advisers can view submitted evaluations
                for their assigned interns. They cannot submit or
                modify evaluation responses.
              </p>
            </div>
          </div>
        </div>

        {/* =====================================================
            TEMPLATE INFORMATION
        ===================================================== */}

        <div className={`border rounded-xl p-4 mb-5 ${cardClass}`}>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                Currently Editing
              </p>

              <h2 className="text-base sm:text-lg font-bold mt-1">
                {activeDirection === DIRECTIONS.COMPANY
                  ? "Company Supervisor → Student"
                  : "Student → Company"}
              </h2>

              <p className={`text-[10px] mt-1 ${mutedText}`}>
                {currentTemplate.name}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">

              {/* STATUS */}

              <span
                className={`px-3 py-1.5 rounded-full text-[9px] font-bold ${
                  currentTemplate.status ===
                  STATUS.template.PUBLISHED
                    ? darkMode
                      ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                      : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : currentTemplate.status ===
                      STATUS.template.ARCHIVED
                    ? darkMode
                      ? "bg-slate-800 text-slate-300 border border-slate-700"
                      : "bg-slate-100 text-slate-600 border border-slate-200"
                    : darkMode
                    ? "bg-amber-950 text-amber-300 border border-amber-800"
                    : "bg-amber-50 text-amber-700 border border-amber-200"
                }`}
              >
                {getStatusLabel(currentTemplate.status)}
              </span>

              {/* VERSION */}

              <span
                className={`px-3 py-1.5 rounded-full text-[9px] font-bold ${
                  darkMode
                    ? "bg-slate-800 text-slate-300"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                Version {currentTemplate.version}
              </span>

              {/* SECTION COUNT */}

              <span
                className={`px-3 py-1.5 rounded-full text-[9px] font-bold ${
                  darkMode
                    ? "bg-slate-800 text-slate-300"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {currentTemplate.sections.length} sections
              </span>

              {/* CRITERION COUNT */}

              <span
                className={`px-3 py-1.5 rounded-full text-[9px] font-bold ${
                  darkMode
                    ? "bg-slate-800 text-slate-300"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {criteriaCount} criteria
              </span>
            </div>
          </div>

          {/* DATES */}

          <div
            className={`mt-4 pt-3 border-t grid grid-cols-1 sm:grid-cols-2 gap-2 text-[9px] ${
              darkMode
                ? "border-slate-700"
                : "border-slate-200"
            }`}
          >
            <p className={mutedText}>
              Last updated:{" "}
              <span className="font-semibold">
                {formatDate(currentTemplate.updatedAt)}
              </span>
            </p>

            <p className={mutedText}>
              Last published:{" "}
              <span className="font-semibold">
                {formatDate(currentTemplate.publishedAt)}
              </span>
            </p>
          </div>
        </div>

        {/* =====================================================
            TEMPLATE EDITOR
        ===================================================== */}

        <div className={`border rounded-xl p-4 sm:p-5 ${cardClass}`}>

          {/* TEMPLATE DETAILS */}

          <div className="mb-5">
            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
              Template Configuration
            </p>

            <h2 className="text-base sm:text-lg font-bold mt-1">
              Evaluation Form Details
            </h2>
          </div>

          {/* NAME */}

          <div className="mb-4">
            <label className="block text-[10px] font-bold mb-1.5">
              Template Name
            </label>

            <input
              type="text"
              value={currentTemplate.name}
              onChange={(e) =>
                handleTemplateNameChange(e.target.value)
              }
              placeholder="Enter template name"
              className={`w-full h-9 px-3 text-xs border rounded-md outline-none ${inputClass}`}
            />
          </div>

          {/* DESCRIPTION */}

          <div className="mb-6">
            <label className="block text-[10px] font-bold mb-1.5">
              Description
            </label>

            <textarea
              value={currentTemplate.description}
              onChange={(e) =>
                handleDescriptionChange(e.target.value)
              }
              placeholder="Describe the purpose of this evaluation."
              rows={3}
              className={`w-full px-3 py-2 text-xs border rounded-md outline-none resize-none ${inputClass}`}
            />
          </div>

          {/* SECTIONS HEADER */}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
            <div>
              <h3 className="text-sm font-bold">
                Evaluation Sections
              </h3>

              <p className={`text-[10px] mt-1 ${mutedText}`}>
                Each section contains the criteria that
                evaluators will rate.
              </p>
            </div>

            <button
              type="button"
              onClick={handleAddSection}
              disabled={saving || publishing}
              className={`h-8 px-3 rounded-md text-[10px] font-bold transition ${primaryButton} disabled:opacity-50`}
            >
              + Add Section
            </button>
          </div>

          {/* SECTIONS */}

          <div className="space-y-4">
            {currentTemplate.sections.map(
              (section, sectionIndex) => (
                <div
                  key={
                    section.id ||
                    `new-section-${sectionIndex}`
                  }
                  className={`border rounded-lg p-3 sm:p-4 ${sectionClass}`}
                >
                  {/* SECTION HEADER */}

                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-4">
                    <div className="flex-1">
                      <label className="block text-[9px] font-bold mb-1">
                        Section {sectionIndex + 1}
                      </label>

                      <input
                        type="text"
                        value={section.name}
                        onChange={(e) =>
                          handleSectionNameChange(
                            section.id,
                            e.target.value
                          )
                        }
                        className={`w-full sm:max-w-md h-8 px-2 text-[10px] border rounded-md outline-none ${inputClass}`}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        handleRemoveSection(section.id)
                      }
                      disabled={saving || publishing}
                      className="self-start sm:self-auto text-[9px] font-semibold text-red-500 hover:text-red-600 disabled:opacity-50"
                    >
                      Remove Section
                    </button>
                  </div>

                  {/* CRITERIA */}

                  <div className="space-y-2">
                    {section.fields.map(
                      (criterion, criterionIndex) => (
                        <div
                          key={
                            criterion.id ||
                            `${section.id}-${criterionIndex}`
                          }
                          className="flex gap-2 items-center"
                        >
                          <span
                            className={`w-6 text-center text-[9px] font-bold ${
                              darkMode
                                ? "text-slate-500"
                                : "text-slate-400"
                            }`}
                          >
                            {criterionIndex + 1}
                          </span>

                          <input
                            type="text"
                            value={criterion.text}
                            onChange={(e) =>
                              handleCriterionChange(
                                section.id,
                                criterion.id,
                                e.target.value
                              )
                            }
                            className={`flex-1 h-8 px-2 text-[10px] border rounded-md outline-none ${inputClass}`}
                          />

                          <button
                            type="button"
                            onClick={() =>
                              handleRemoveCriterion(
                                section.id,
                                criterion.id
                              )
                            }
                            disabled={
                              saving || publishing
                            }
                            className="text-red-500 hover:text-red-600 text-sm px-1 disabled:opacity-50"
                            title="Remove criterion"
                          >
                            ×
                          </button>
                        </div>
                      )
                    )}
                  </div>

                  {/* ADD CRITERION */}

                  <button
                    type="button"
                    onClick={() =>
                      handleAddCriterion(section.id)
                    }
                    disabled={saving || publishing}
                    className={`mt-3 h-7 px-3 border rounded-md text-[9px] font-semibold transition ${secondaryButton} disabled:opacity-50`}
                  >
                    + Add Criterion
                  </button>
                </div>
              )
            )}
          </div>

          {/* EMPTY STATE */}

          {currentTemplate.sections.length === 0 && (
            <div
              className={`border border-dashed rounded-lg py-10 text-center ${
                darkMode
                  ? "border-slate-700"
                  : "border-slate-300"
              }`}
            >
              <p className="text-sm font-bold">
                No evaluation sections
              </p>

              <p className={`text-[10px] mt-1 ${mutedText}`}>
                Add a section to begin building this
                evaluation.
              </p>

              <button
                type="button"
                onClick={handleAddSection}
                disabled={saving || publishing}
                className={`mt-4 h-8 px-4 rounded-md text-[10px] font-bold ${primaryButton} disabled:opacity-50`}
              >
                + Add First Section
              </button>
            </div>
          )}

          {/* ACTIONS */}

          <div
            className={`mt-6 pt-4 border-t flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 ${
              darkMode
                ? "border-slate-700"
                : "border-slate-200"
            }`}
          >
            <div>
              <p className="text-[10px] font-bold">
                Template Actions
              </p>

              <p className={`text-[9px] mt-1 ${mutedText}`}>
                Save your changes as a draft before publishing
                them to evaluators.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">

              {/* SAVE DRAFT */}

              <button
                type="button"
                onClick={handleSaveTemplate}
                disabled={saving || publishing}
                className={`h-8 px-4 rounded-md text-[10px] font-semibold transition ${secondaryButton} disabled:opacity-50`}
              >
                {saving ? "Saving..." : "Save Draft"}
              </button>

              {/* PUBLISH */}

              <button
                type="button"
                onClick={handlePublishTemplate}
                disabled={saving || publishing}
                className={`h-8 px-4 rounded-md text-[10px] font-bold transition ${primaryButton} disabled:opacity-50`}
              >
                {publishing
                  ? "Publishing..."
                  : "Publish Template"}
              </button>
            </div>
          </div>
        </div>

        {/* =====================================================
            SYSTEM SUMMARY
        ===================================================== */}

        <div className={`mt-5 border rounded-xl p-4 ${cardClass}`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h3 className="text-xs font-bold">
                Evaluation System Summary
              </h3>

              <p className={`text-[9px] mt-1 ${mutedText}`}>
                Overview of evaluation activity across the
                system.
              </p>
            </div>

            <span
              className={`text-[9px] font-semibold ${
                darkMode
                  ? "text-slate-500"
                  : "text-slate-400"
              }`}
            >
              Registrar: View Only
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">

            {/* COMPANY → STUDENT */}

            <div
              className={`rounded-lg p-3 ${
                darkMode
                  ? "bg-slate-800"
                  : "bg-slate-50"
              }`}
            >
              <p className={`text-[9px] ${mutedText}`}>
                Company → Student
              </p>

              <p className="text-lg font-black mt-1">
                {evaluationStats.companyToStudent}
              </p>
            </div>

            {/* STUDENT → COMPANY */}

            <div
              className={`rounded-lg p-3 ${
                darkMode
                  ? "bg-slate-800"
                  : "bg-slate-50"
              }`}
            >
              <p className={`text-[9px] ${mutedText}`}>
                Student → Company
              </p>

              <p className="text-lg font-black mt-1">
                {evaluationStats.studentToCompany}
              </p>
            </div>

            {/* TOTAL */}

            <div
              className={`rounded-lg p-3 ${
                darkMode
                  ? "bg-slate-800"
                  : "bg-slate-50"
              }`}
            >
              <p className={`text-[9px] ${mutedText}`}>
                Total Evaluations
              </p>

              <p className="text-lg font-black mt-1">
                {evaluationStats.total}
              </p>
            </div>

            {/* SUBMITTED */}

            <div
              className={`rounded-lg p-3 ${
                darkMode
                  ? "bg-slate-800"
                  : "bg-slate-50"
              }`}
            >
              <p className={`text-[9px] ${mutedText}`}>
                Submitted
              </p>

              <p className="text-lg font-black mt-1">
                {evaluationStats.submitted}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EvaluationManagement;

