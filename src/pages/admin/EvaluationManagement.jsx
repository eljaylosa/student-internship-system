import React, { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { STATUS, useMockStore } from "../../data/mockStore.jsx";

// =========================================================
// DEFAULT TEMPLATES
// Used only when the mockStore template has no sections yet.
// =========================================================

const DEFAULT_TEMPLATES = {
  "Company Supervisor": {
    name: "Intern Performance Evaluation",
    description:
      "Used by company supervisors to evaluate the performance and professional development of interns.",
    sections: [
      {
        id: "SUP-SEC-001",
        name: "Technical Skills",
        fields: [
          "Knowledge of assigned tasks",
          "Quality of work",
          "Problem-solving ability",
        ],
      },
      {
        id: "SUP-SEC-002",
        name: "Professionalism",
        fields: [
          "Attendance and punctuality",
          "Work attitude",
          "Responsibility",
        ],
      },
      {
        id: "SUP-SEC-003",
        name: "Communication",
        fields: [
          "Communication skills",
          "Teamwork",
          "Ability to receive feedback",
        ],
      },
      {
        id: "SUP-SEC-004",
        name: "Overall Assessment",
        fields: [
          "Overall performance",
          "Readiness for professional work",
          "Overall recommendation",
        ],
      },
    ],
  },

  Student: {
    name: "Company & Internship Experience Evaluation",
    description:
      "Used by students to evaluate their company, supervisor, work environment, and overall internship experience.",
    sections: [
      {
        id: "STU-SEC-001",
        name: "Work Environment",
        fields: [
          "Workplace environment",
          "Availability of resources",
          "Safety and comfort",
        ],
      },
      {
        id: "STU-SEC-002",
        name: "Supervision",
        fields: [
          "Supervisor support",
          "Clarity of instructions",
          "Feedback and guidance",
        ],
      },
      {
        id: "STU-SEC-003",
        name: "Learning Experience",
        fields: [
          "Relevant learning opportunities",
          "Skill development",
          "Exposure to real-world tasks",
        ],
      },
      {
        id: "STU-SEC-004",
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
// CLONE HELPER
// =========================================================

const clone = (value) => JSON.parse(JSON.stringify(value));

// =========================================================
// COMPONENT
// =========================================================

const EvaluationManagement = () => {
  const { darkMode } = useOutletContext();

  const { state, transact } = useMockStore();

  // =========================================================
  // ACTIVE DIRECTION
  // =========================================================

  const [activeDirection, setActiveDirection] = useState("Company Supervisor");

  // =========================================================
  // LOCAL EDITOR STATE
  // =========================================================

  const [templates, setTemplates] = useState(() => {
    const stored = state.evaluationTemplates || {};

    return {
      "Company Supervisor":
        stored["Company Supervisor"] &&
        stored["Company Supervisor"].sections?.length > 0
          ? clone(stored["Company Supervisor"])
          : clone(DEFAULT_TEMPLATES["Company Supervisor"]),

      Student:
        stored.Student && stored.Student.sections?.length > 0
          ? clone(stored.Student)
          : clone(DEFAULT_TEMPLATES.Student),
    };
  });

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // =========================================================
  // CURRENT TEMPLATE
  // =========================================================

  const currentTemplate = templates[activeDirection];

  // =========================================================
  // LOAD TEMPLATE FROM STORE WHEN DIRECTION CHANGES
  // =========================================================

  useEffect(() => {
    const storedTemplate = state.evaluationTemplates?.[activeDirection];

    if (!storedTemplate) {
      return;
    }

    if (storedTemplate.sections?.length > 0) {
      setTemplates((previous) => ({
        ...previous,
        [activeDirection]: clone(storedTemplate),
      }));

      setHasUnsavedChanges(false);
    }
  }, [activeDirection]);

  // =========================================================
  // EVALUATION STATISTICS
  // =========================================================

  const evaluationStats = useMemo(() => {
    const companyToStudent = state.evaluations.filter(
      (evaluation) =>
        evaluation.evaluatorRole === "Company Supervisor" &&
        evaluation.evaluatedRole === "Student"
    );

    const studentToCompany = state.evaluations.filter(
      (evaluation) =>
        evaluation.evaluatorRole === "Student" &&
        evaluation.evaluatedRole === "Company"
    );

    const submitted = state.evaluations.filter(
      (evaluation) => evaluation.status === STATUS.evaluation.SUBMITTED
    );

    const finalized = state.evaluations.filter(
      (evaluation) => evaluation.status === STATUS.evaluation.FINALIZED
    );

    return {
      companyToStudent: companyToStudent.length,
      studentToCompany: studentToCompany.length,
      total: state.evaluations.length,
      submitted: submitted.length,
      finalized: finalized.length,
    };
  }, [state.evaluations]);

  // =========================================================
  // TEMPLATE STATUS
  // =========================================================

  const templateStatus =
    state.evaluationTemplates?.[activeDirection]?.status ||
    STATUS.evaluation.DRAFT;

  // =========================================================
  // STATUS LABEL
  // =========================================================

  const getStatusLabel = (status) => {
    if (status === STATUS.evaluation.FINALIZED) {
      return "Published";
    }

    if (status === STATUS.evaluation.SUBMITTED) {
      return "Submitted";
    }

    if (status === STATUS.evaluation.RETURNED) {
      return "Returned";
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
  // UPDATE TEMPLATE
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
  // UPDATE TEMPLATE NAME
  // =========================================================

  const handleTemplateNameChange = (value) => {
    updateCurrentTemplate({
      name: value,
    });
  };

  // =========================================================
  // UPDATE DESCRIPTION
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
    const prefix = activeDirection === "Student" ? "STU" : "SUP";

    const newSection = {
      id: `${prefix}-SEC-${Date.now()}`,
      name: `New Section ${currentTemplate.sections.length + 1}`,
      fields: ["New Criterion"],
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
      alert("An evaluation template must contain at least one section.");
      return;
    }

    const confirmed = window.confirm(
      "Remove this section and all of its criteria?"
    );

    if (!confirmed) {
      return;
    }

    updateCurrentTemplate({
      sections: currentTemplate.sections.filter(
        (section) => section.id !== sectionId
      ),
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
      sections: currentTemplate.sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              fields: [
                ...section.fields,
                `New Criterion ${section.fields.length + 1}`,
              ],
            }
          : section
      ),
    });
  };

  // =========================================================
  // REMOVE CRITERION
  // =========================================================

  const handleRemoveCriterion = (sectionId, criterionIndex) => {
    const section = currentTemplate.sections.find(
      (item) => item.id === sectionId
    );

    if (!section) {
      return;
    }

    if (section.fields.length <= 1) {
      alert("Each section must contain at least one criterion.");
      return;
    }

    updateCurrentTemplate({
      sections: currentTemplate.sections.map((item) =>
        item.id === sectionId
          ? {
              ...item,
              fields: item.fields.filter(
                (_, index) => index !== criterionIndex
              ),
            }
          : item
      ),
    });
  };

  // =========================================================
  // UPDATE CRITERION
  // =========================================================

  const handleCriterionChange = (sectionId, criterionIndex, value) => {
    updateCurrentTemplate({
      sections: currentTemplate.sections.map((section) => {
        if (section.id !== sectionId) {
          return section;
        }

        const updatedFields = [...section.fields];

        updatedFields[criterionIndex] = value;

        return {
          ...section,
          fields: updatedFields,
        };
      }),
    });
  };

  // =========================================================
  // VALIDATE TEMPLATE
  // =========================================================

  const validateTemplate = () => {
    if (!currentTemplate.name.trim()) {
      return "Please enter a template name.";
    }

    if (!currentTemplate.description.trim()) {
      return "Please enter a template description.";
    }

    if (!currentTemplate.sections.length) {
      return "The template must contain at least one section.";
    }

    for (const section of currentTemplate.sections) {
      if (!section.name.trim()) {
        return "Every section must have a name.";
      }

      if (!section.fields.length) {
        return `Section "${section.name}" must contain at least one criterion.`;
      }

      for (const field of section.fields) {
        if (!field.trim()) {
          return `Every criterion in "${section.name}" must have a name.`;
        }
      }
    }

    return null;
  };

  // =========================================================
  // SAVE TEMPLATE
  // =========================================================

  const handleSaveTemplate = () => {
    const validationError = validateTemplate();

    if (validationError) {
      alert(validationError);
      return;
    }

    const updatedAt = new Date().toISOString();

    transact((draft) => {
      if (!draft.evaluationTemplates) {
        draft.evaluationTemplates = {};
      }

      const previousTemplate = draft.evaluationTemplates[activeDirection] || {};

      draft.evaluationTemplates[activeDirection] = {
        ...clone(currentTemplate),
        status: STATUS.evaluation.DRAFT,
        publishedAt: previousTemplate.publishedAt || null,
        updatedAt,
      };
    });

    setHasUnsavedChanges(false);

    alert(
      `"${currentTemplate.name}" has been saved as a draft.\n\nDirection: ${
        activeDirection === "Company Supervisor"
          ? "Company Supervisor → Student"
          : "Student → Company"
      }`
    );
  };

  // =========================================================
  // PUBLISH TEMPLATE
  // =========================================================

  const handlePublishTemplate = () => {
    const validationError = validateTemplate();

    if (validationError) {
      alert(validationError);
      return;
    }

    const directionLabel =
      activeDirection === "Company Supervisor"
        ? "Company Supervisor → Student"
        : "Student → Company";

    const confirmed = window.confirm(
      `Publish "${currentTemplate.name}"?\n\nEvaluation direction:\n${directionLabel}\n\nThis will make this template the active form for evaluators.`
    );

    if (!confirmed) {
      return;
    }

    const publishedAt = new Date().toISOString();

    transact((draft) => {
      if (!draft.evaluationTemplates) {
        draft.evaluationTemplates = {};
      }

      draft.evaluationTemplates[activeDirection] = {
        ...clone(currentTemplate),
        status: STATUS.evaluation.FINALIZED,
        publishedAt,
        updatedAt: publishedAt,
      };

      if (draft.auditEvents) {
        draft.auditEvents.unshift({
          id: `AUD-${String(draft.auditEvents.length + 1).padStart(3, "0")}`,
          actorUserId: draft.currentUser?.id || "SYSTEM",
          actorRole: draft.currentUser?.role || "system",
          action: "PUBLISH",
          module: "Evaluation Management",
          targetEntityType: "EvaluationTemplate",
          targetEntityId: activeDirection,
          timestamp: publishedAt,
          details: {
            templateName: currentTemplate.name,
            direction: directionLabel,
          },
        });
      }
    });

    setHasUnsavedChanges(false);

    alert(
      `"${currentTemplate.name}" has been published successfully.\n\nDirection: ${directionLabel}`
    );
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

    const storedTemplate = state.evaluationTemplates?.[direction];

    setTemplates((previous) => ({
      ...previous,
      [direction]:
        storedTemplate && storedTemplate.sections?.length > 0
          ? clone(storedTemplate)
          : clone(DEFAULT_TEMPLATES[direction]),
    }));

    setHasUnsavedChanges(false);
    setActiveDirection(direction);
  };

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

  const mutedText = darkMode ? "text-slate-400" : "text-slate-500";

  const primaryButton = darkMode
    ? "bg-white text-slate-900 hover:bg-slate-200"
    : "bg-slate-700 text-white hover:bg-slate-800";

  const secondaryButton = darkMode
    ? "bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700"
    : "bg-white border-slate-300 text-slate-700 hover:bg-slate-100";

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
              darkMode ? "text-slate-500" : "text-slate-400"
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
                Configure and publish the evaluation forms used during
                internships.
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
            DIRECTIONS
        ===================================================== */}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* COMPANY → STUDENT */}

          <button
            type="button"
            onClick={() => handleDirectionChange("Company Supervisor")}
            className={`text-left border rounded-xl p-4 transition ${
              activeDirection === "Company Supervisor"
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

              {state.evaluationTemplates?.["Company Supervisor"]?.status ===
                STATUS.evaluation.FINALIZED && (
                <span className="text-[9px] font-bold text-emerald-500">
                  Published
                </span>
              )}
            </div>
          </button>

          {/* STUDENT → COMPANY */}

          <button
            type="button"
            onClick={() => handleDirectionChange("Student")}
            className={`text-left border rounded-xl p-4 transition ${
              activeDirection === "Student"
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
                  Students evaluate their company, supervisor, workplace, and
                  overall internship experience.
                </p>
              </div>

              <div className="text-2xl">🎓</div>
            </div>

            <div className="flex items-center justify-between mt-3">
              <span className="text-[10px] font-semibold">
                {evaluationStats.studentToCompany} submitted
              </span>

              {state.evaluationTemplates?.Student?.status ===
                STATUS.evaluation.FINALIZED && (
                <span className="text-[9px] font-bold text-emerald-500">
                  Published
                </span>
              )}
            </div>
          </button>
        </div>

        {/* =====================================================
            FACULTY NOTICE
        ===================================================== */}

        <div className={`mb-6 border rounded-lg p-3 ${cardClass}`}>
          <div className="flex gap-3 items-start">
            <span className="text-sm">ℹ️</span>

            <div>
              <p className="text-xs font-bold">Faculty Adviser access</p>

              <p className={`text-[10px] mt-1 ${mutedText}`}>
                Faculty Advisers can view submitted evaluations for their
                assigned interns. They cannot submit or modify evaluation
                responses.
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
                {activeDirection === "Company Supervisor"
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
                  templateStatus === STATUS.evaluation.FINALIZED
                    ? darkMode
                      ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                      : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : darkMode
                    ? "bg-amber-950 text-amber-300 border border-amber-800"
                    : "bg-amber-50 text-amber-700 border border-amber-200"
                }`}
              >
                {getStatusLabel(templateStatus)}
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
                {currentTemplate.sections.reduce(
                  (total, section) => total + section.fields.length,
                  0
                )}{" "}
                criteria
              </span>
            </div>
          </div>

          {/* DATES */}

          <div
            className={`mt-4 pt-3 border-t grid grid-cols-1 sm:grid-cols-2 gap-2 text-[9px] ${
              darkMode ? "border-slate-700" : "border-slate-200"
            }`}
          >
            <p className={mutedText}>
              Last updated:{" "}
              <span className="font-semibold">
                {formatDate(
                  state.evaluationTemplates?.[activeDirection]?.updatedAt
                )}
              </span>
            </p>

            <p className={mutedText}>
              Last published:{" "}
              <span className="font-semibold">
                {formatDate(
                  state.evaluationTemplates?.[activeDirection]?.publishedAt
                )}
              </span>
            </p>
          </div>
        </div>

        {/* =====================================================
            TEMPLATE EDITOR
        ===================================================== */}

        <div className={`border rounded-xl p-4 sm:p-5 ${cardClass}`}>
          {/* ===================================================
              TEMPLATE DETAILS
          =================================================== */}

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
              onChange={(e) => handleTemplateNameChange(e.target.value)}
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
              onChange={(e) => handleDescriptionChange(e.target.value)}
              placeholder="Describe the purpose of this evaluation."
              rows={3}
              className={`w-full px-3 py-2 text-xs border rounded-md outline-none resize-none ${inputClass}`}
            />
          </div>

          {/* ===================================================
              SECTIONS HEADER
          =================================================== */}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
            <div>
              <h3 className="text-sm font-bold">Evaluation Sections</h3>

              <p className={`text-[10px] mt-1 ${mutedText}`}>
                Each section contains the criteria that evaluators will rate.
              </p>
            </div>

            <button
              type="button"
              onClick={handleAddSection}
              className={`h-8 px-3 rounded-md text-[10px] font-bold transition ${primaryButton}`}
            >
              + Add Section
            </button>
          </div>

          {/* ===================================================
              SECTIONS
          =================================================== */}

          <div className="space-y-4">
            {currentTemplate.sections.map((section, sectionIndex) => (
              <div
                key={section.id}
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
                        handleSectionNameChange(section.id, e.target.value)
                      }
                      className={`w-full sm:max-w-md h-8 px-2 text-[10px] border rounded-md outline-none ${inputClass}`}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveSection(section.id)}
                    className="self-start sm:self-auto text-[9px] font-semibold text-red-500 hover:text-red-600"
                  >
                    Remove Section
                  </button>
                </div>

                {/* CRITERIA */}

                <div className="space-y-2">
                  {section.fields.map((criterion, criterionIndex) => (
                    <div
                      key={`${section.id}-${criterionIndex}`}
                      className="flex gap-2 items-center"
                    >
                      <span
                        className={`w-6 text-center text-[9px] font-bold ${
                          darkMode ? "text-slate-500" : "text-slate-400"
                        }`}
                      >
                        {criterionIndex + 1}
                      </span>

                      <input
                        type="text"
                        value={criterion}
                        onChange={(e) =>
                          handleCriterionChange(
                            section.id,
                            criterionIndex,
                            e.target.value
                          )
                        }
                        className={`flex-1 h-8 px-2 text-[10px] border rounded-md outline-none ${inputClass}`}
                      />

                      <button
                        type="button"
                        onClick={() =>
                          handleRemoveCriterion(section.id, criterionIndex)
                        }
                        className="text-red-500 hover:text-red-600 text-sm px-1"
                        title="Remove criterion"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>

                {/* ADD CRITERION */}

                <button
                  type="button"
                  onClick={() => handleAddCriterion(section.id)}
                  className={`mt-3 h-7 px-3 border rounded-md text-[9px] font-semibold transition ${secondaryButton}`}
                >
                  + Add Criterion
                </button>
              </div>
            ))}
          </div>

          {/* ===================================================
              EMPTY STATE
          =================================================== */}

          {currentTemplate.sections.length === 0 && (
            <div
              className={`border border-dashed rounded-lg py-10 text-center ${
                darkMode ? "border-slate-700" : "border-slate-300"
              }`}
            >
              <p className="text-sm font-bold">No evaluation sections</p>

              <p className={`text-[10px] mt-1 ${mutedText}`}>
                Add a section to begin building this evaluation.
              </p>

              <button
                type="button"
                onClick={handleAddSection}
                className={`mt-4 h-8 px-4 rounded-md text-[10px] font-bold ${primaryButton}`}
              >
                + Add First Section
              </button>
            </div>
          )}

          {/* ===================================================
              ACTIONS
          =================================================== */}

          <div
            className={`mt-6 pt-4 border-t flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 ${
              darkMode ? "border-slate-700" : "border-slate-200"
            }`}
          >
            <div>
              <p className="text-[10px] font-bold">Template Actions</p>

              <p className={`text-[9px] mt-1 ${mutedText}`}>
                Save your changes as a draft before publishing them to
                evaluators.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleSaveTemplate}
                className={`h-8 px-4 rounded-md text-[10px] font-semibold transition ${secondaryButton}`}
              >
                Save Draft
              </button>

              <button
                type="button"
                onClick={handlePublishTemplate}
                className={`h-8 px-4 rounded-md text-[10px] font-bold transition ${primaryButton}`}
              >
                Publish Template
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
              <h3 className="text-xs font-bold">Evaluation System Summary</h3>

              <p className={`text-[9px] mt-1 ${mutedText}`}>
                Overview of evaluation activity across the system.
              </p>
            </div>

            <span
              className={`text-[9px] font-semibold ${
                darkMode ? "text-slate-500" : "text-slate-400"
              }`}
            >
              Faculty: View Only
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            <div
              className={`rounded-lg p-3 ${
                darkMode ? "bg-slate-800" : "bg-slate-50"
              }`}
            >
              <p className={`text-[9px] ${mutedText}`}>Company → Student</p>

              <p className="text-lg font-black mt-1">
                {evaluationStats.companyToStudent}
              </p>
            </div>

            <div
              className={`rounded-lg p-3 ${
                darkMode ? "bg-slate-800" : "bg-slate-50"
              }`}
            >
              <p className={`text-[9px] ${mutedText}`}>Student → Company</p>

              <p className="text-lg font-black mt-1">
                {evaluationStats.studentToCompany}
              </p>
            </div>

            <div
              className={`rounded-lg p-3 ${
                darkMode ? "bg-slate-800" : "bg-slate-50"
              }`}
            >
              <p className={`text-[9px] ${mutedText}`}>Total Evaluations</p>

              <p className="text-lg font-black mt-1">{evaluationStats.total}</p>
            </div>

            <div
              className={`rounded-lg p-3 ${
                darkMode ? "bg-slate-800" : "bg-slate-50"
              }`}
            >
              <p className={`text-[9px] ${mutedText}`}>Submitted</p>

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
