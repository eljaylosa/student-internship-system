import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";

// =========================================================
// COMPONENT
// =========================================================

const EvaluationManagement = () => {
  const { darkMode } = useOutletContext();

  // =========================================================
  // TEMPLATE
  // =========================================================

  const [templateName, setTemplateName] = useState(
    "Standard Intern Evaluation v2.1"
  );

  // =========================================================
  // SECTIONS
  // =========================================================

  const [sections, setSections] = useState([
    {
      id: 1,
      name: "Section 1",
      fields: ["Criterion 1", "Criterion 2", "Criterion 3"],
    },
    {
      id: 2,
      name: "Section 2",
      fields: ["Criterion 1", "Criterion 2", "Criterion 3"],
    },
    {
      id: 3,
      name: "Section 3",
      fields: ["Criterion 1", "Criterion 2", "Criterion 3"],
    },
    {
      id: 4,
      name: "Section 4",
      fields: ["Criterion 1", "Criterion 2", "Criterion 3"],
    },
  ]);

  // =========================================================
  // ADD SECTION
  // =========================================================

  const handleAddSection = () => {
    const newSectionNumber = sections.length + 1;

    setSections((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: `Section ${newSectionNumber}`,
        fields: ["Criterion 1", "Criterion 2", "Criterion 3"],
      },
    ]);
  };

  // =========================================================
  // ADD FIELD
  // =========================================================

  const handleAddField = () => {
    setSections((prev) =>
      prev.map((section) => ({
        ...section,
        fields: [...section.fields, `Criterion ${section.fields.length + 1}`],
      }))
    );
  };

  // =========================================================
  // UPDATE SECTION NAME
  // =========================================================

  const handleSectionNameChange = (sectionId, value) => {
    setSections((prev) =>
      prev.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              name: value,
            }
          : section
      )
    );
  };

  // =========================================================
  // UPDATE FIELD
  // =========================================================

  const handleFieldChange = (sectionId, fieldIndex, value) => {
    setSections((prev) =>
      prev.map((section) => {
        if (section.id !== sectionId) {
          return section;
        }

        const updatedFields = [...section.fields];

        updatedFields[fieldIndex] = value;

        return {
          ...section,
          fields: updatedFields,
        };
      })
    );
  };

  // =========================================================
  // SAVE TEMPLATE
  // =========================================================

  const handleSaveTemplate = () => {
    alert(
      `Template saved successfully!\n\nTemplate: ${templateName}\nSections: ${sections.length}`
    );
  };

  // =========================================================
  // PUBLISH TEMPLATE
  // =========================================================

  const handlePublishTemplate = () => {
    const confirmed = window.confirm(
      `Publish "${templateName}" as the active evaluation template?`
    );

    if (!confirmed) return;

    alert(`Evaluation template published successfully!\n\n${templateName}`);
  };

  // =========================================================
  // STYLES
  // =========================================================

  const sectionBackground = darkMode
    ? "bg-slate-800 border-slate-700"
    : "bg-slate-100 border-slate-300";

  const inputStyle = darkMode
    ? "bg-slate-900 border-slate-600 text-slate-100 placeholder:text-slate-500 focus:border-blue-500"
    : "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-slate-500";

  const buttonStyle = darkMode
    ? "bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
    : "bg-slate-600 border-slate-700 text-white hover:bg-slate-700";

  // =========================================================
  // RETURN
  // =========================================================

  return (
    <div
      className={`min-h-[calc(100vh-5rem)] px-4 py-6 sm:px-6 lg:px-8 transition-colors duration-300 ${
        darkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"
      }`}
    >
      <div className="max-w-5xl mx-auto">
        {/* ===================================================
            DEMO NOTICE
        =================================================== */}

        <div
          className={`mb-5 p-3 rounded-lg text-[10px] leading-relaxed border ${
            darkMode
              ? "bg-red-950/40 border-red-900 text-red-300"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          <p className="font-bold mb-1">⚠️ Demo Project</p>

          <p>
            Evaluation templates are currently stored only in the browser state.
          </p>

          <p className="mt-1">No database is implemented yet.</p>
        </div>

        {/* ===================================================
            PAGE HEADER
        =================================================== */}

        <div className="mb-5">
          <h1 className="text-xl sm:text-2xl font-bold">
            Evaluation Management
          </h1>

          <p
            className={`text-xs sm:text-sm mt-1 ${
              darkMode ? "text-slate-400" : "text-slate-500"
            }`}
          >
            Create and manage evaluation templates used for internship
            assessments.
          </p>
        </div>

        {/* ===================================================
            TEMPLATE BUILDER
        =================================================== */}

        <div
          className={`border rounded-lg p-4 sm:p-5 lg:p-6 ${
            darkMode
              ? "bg-slate-900 border-slate-700"
              : "bg-white border-slate-400"
          }`}
        >
          {/* =================================================
              BUILDER TITLE
          ================================================= */}

          <h2 className="text-base sm:text-lg font-bold mb-4">
            Evaluation Template Builder
          </h2>

          {/* =================================================
              ACTIVE TEMPLATE
          ================================================= */}

          <div className="mb-3">
            <label
              className={`block text-[10px] sm:text-xs font-semibold mb-2 ${
                darkMode ? "text-slate-300" : "text-slate-700"
              }`}
            >
              Active Template
            </label>

            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className={`w-full h-9 px-3 text-xs border rounded-sm outline-none transition ${inputStyle}`}
            />
          </div>

          {/* =================================================
              ACTION BUTTONS
          ================================================= */}

          <div className="flex flex-wrap gap-2 mb-4">
            <button
              type="button"
              onClick={handleAddSection}
              className={`h-8 px-3 border rounded-sm text-[10px] font-semibold transition ${buttonStyle}`}
            >
              + Add Section
            </button>

            <button
              type="button"
              onClick={handleAddField}
              className={`h-8 px-3 border rounded-sm text-[10px] font-semibold transition ${buttonStyle}`}
            >
              + Add Field
            </button>

            <button
              type="button"
              onClick={handleSaveTemplate}
              className={`h-8 px-4 border rounded-sm text-[10px] font-semibold transition ${buttonStyle}`}
            >
              Save Template
            </button>
          </div>

          {/* =================================================
              SECTIONS
          ================================================= */}

          <div className="space-y-3">
            {sections.map((section, sectionIndex) => (
              <div
                key={section.id}
                className={`border rounded-sm p-3 sm:p-4 ${sectionBackground}`}
              >
                {/* SECTION HEADER */}

                <div className="mb-3">
                  <label
                    className={`block text-[10px] font-bold mb-1.5 ${
                      darkMode ? "text-slate-300" : "text-slate-700"
                    }`}
                  >
                    Section {sectionIndex + 1}
                  </label>

                  <input
                    type="text"
                    value={section.name}
                    onChange={(e) =>
                      handleSectionNameChange(section.id, e.target.value)
                    }
                    className={`w-full sm:w-52 h-8 px-2 text-[10px] border rounded-sm outline-none ${inputStyle}`}
                  />
                </div>

                {/* FIELDS */}

                <div
                  className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3`}
                >
                  {section.fields.map((field, fieldIndex) => (
                    <div key={fieldIndex}>
                      <label
                        className={`block text-[9px] mb-1 ${
                          darkMode ? "text-slate-400" : "text-slate-500"
                        }`}
                      >
                        Criterion {fieldIndex + 1}
                      </label>

                      <input
                        type="text"
                        value={field}
                        onChange={(e) =>
                          handleFieldChange(
                            section.id,
                            fieldIndex,
                            e.target.value
                          )
                        }
                        className={`w-full h-8 px-2 text-[10px] border rounded-sm outline-none ${inputStyle}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* =================================================
              PUBLISH
          ================================================= */}

          <div className="mt-4">
            <button
              type="button"
              onClick={handlePublishTemplate}
              className={`h-9 px-6 border rounded-sm text-[10px] font-bold transition ${buttonStyle}`}
            >
              Publish Template
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EvaluationManagement;
