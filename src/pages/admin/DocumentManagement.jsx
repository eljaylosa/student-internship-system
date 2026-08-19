import React, { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";

// Temporary page-local demo data. This page intentionally has no mockStore dependency.
const localState = {
  "documentTemplates": [
    {
      "id": "TPL-001",
      "name": "Internship Application Form",
      "description": "Official internship application form.",
      "fileName": "internship-application-form.pdf"
    },
    {
      "id": "TPL-002",
      "name": "Internship Agreement",
      "description": "Internship agreement template.",
      "fileName": "internship-agreement.pdf"
    },
    {
      "id": "TPL-003",
      "name": "Evaluation Form",
      "description": "Student internship evaluation form.",
      "fileName": "evaluation-form.pdf"
    },
    {
      "id": "TPL-004",
      "name": "Student Endorsement",
      "description": "Student endorsement document.",
      "fileName": "student-endorsement.pdf"
    },
    {
      "id": "TPL-005",
      "name": "Company Evaluation",
      "description": "Company evaluation template.",
      "fileName": "company-evaluation.pdf"
    },
    {
      "id": "TPL-006",
      "name": "Completion Certificate",
      "description": "Internship completion certificate.",
      "fileName": "completion-certificate.pdf"
    }
  ]
};

const DocumentManagement = () => {
  const { darkMode } = useOutletContext();

  const state = localState;
  const addDocumentTemplate = (...args) => { void args; };
  const deleteDocumentTemplate = (...args) => { void args; };

  const [searchTerm, setSearchTerm] = useState("");

  /* =========================================================
     FILTER TEMPLATES
  ========================================================= */

  const filteredDocuments = useMemo(() => {
    const search = searchTerm.toLowerCase().trim();

    if (!search) {
      return state.documentTemplates;
    }

    return state.documentTemplates.filter(
      (document) =>
        document.name.toLowerCase().includes(search) ||
        document.description.toLowerCase().includes(search)
    );
  }, [state.documentTemplates, searchTerm]);

  /* =========================================================
     DOWNLOAD TEMPLATE
  ========================================================= */

  const handleDownload = (document) => {
    const content = `
SIMS DOCUMENT TEMPLATE

Document:
${document.name}

Description:
${document.description}

This document is provided by the
Student Internship Management System.

Template File:
${document.fileName}
`;

    const blob = new Blob([content], {
      type: "text/plain;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);

    const link = window.document.createElement("a");

    link.href = url;
    link.download = document.fileName || `${document.name}.txt`;

    window.document.body.appendChild(link);

    link.click();

    window.document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  /* =========================================================
     UPLOAD TEMPLATE
  ========================================================= */

  const handleUploadTemplate = () => {
    const input = window.document.createElement("input");

    input.type = "file";
    input.accept = ".pdf,.doc,.docx";

    input.onchange = (event) => {
      const file = event.target.files?.[0];

      if (!file) return;

      const templateName = file.name
        .replace(/\.[^/.]+$/, "")
        .replace(/[-_]/g, " ");

      addDocumentTemplate({
        name: templateName,
        description: "Uploaded document template.",
        fileName: file.name,
      });

      alert(`Document template added successfully!\n\nFile: ${file.name}`);
    };

    input.click();
  };

  /* =========================================================
     DELETE TEMPLATE
  ========================================================= */

  const handleDeleteTemplate = (document) => {
    const confirmed = window.confirm(
      `Delete "${document.name}" from the document templates?`
    );

    if (!confirmed) return;

    deleteDocumentTemplate(document.id);
  };

  /* =========================================================
     RETURN
  ========================================================= */

  return (
    <div
      className={`min-h-[calc(100vh-5rem)] px-4 py-5 sm:px-6 lg:px-8 transition-colors duration-300 ${
        darkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"
      }`}
    >
      <div className="max-w-6xl mx-auto">
        {/* ===================================================
            HEADER
        =================================================== */}

        <div className="mb-6">
          <p className="text-xs uppercase tracking-widest font-bold text-slate-400">
            Administrator Portal
          </p>

          <h1 className="text-xl sm:text-2xl font-bold">Document Management</h1>

          <p
            className={`text-xs sm:text-sm mt-1 ${
              darkMode ? "text-slate-400" : "text-slate-500"
            }`}
          >
            Manage official internship document templates.
          </p>
        </div>

        {/* ===================================================
            SEARCH
        =================================================== */}

        <div
          className={`border rounded-lg p-3 mb-6 ${
            darkMode
              ? "bg-slate-900 border-slate-700"
              : "bg-white border-slate-300"
          }`}
        >
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search document templates..."
                className={`w-full h-9 px-3 text-xs rounded-md border outline-none ${
                  darkMode
                    ? "bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500"
                    : "bg-slate-100 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-slate-500"
                }`}
              />
            </div>

            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className={`h-9 px-6 rounded-md text-xs font-semibold transition ${
                darkMode
                  ? "bg-white text-slate-900 hover:bg-slate-200"
                  : "bg-slate-700 text-white hover:bg-slate-800"
              }`}
            >
              Clear
            </button>
          </div>
        </div>

        {/* ===================================================
            TEMPLATE COUNT
        =================================================== */}

        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-bold">Document Templates</h2>

            <p
              className={`text-xs mt-1 ${
                darkMode ? "text-slate-500" : "text-slate-400"
              }`}
            >
              {filteredDocuments.length} template
              {filteredDocuments.length !== 1 ? "s" : ""} available
            </p>
          </div>
        </div>

        {/* ===================================================
            TEMPLATE GRID
        =================================================== */}

        {filteredDocuments.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocuments.map((document) => (
              <div
                key={document.id}
                className={`border rounded-xl overflow-hidden transition ${
                  darkMode
                    ? "bg-slate-900 border-slate-700"
                    : "bg-white border-slate-300"
                }`}
              >
                {/* DOCUMENT PREVIEW */}

                <div
                  className={`mx-3 mt-3 h-32 border rounded-lg flex items-center justify-center ${
                    darkMode
                      ? "bg-slate-800 border-slate-600"
                      : "bg-slate-100 border-slate-300"
                  }`}
                >
                  <div
                    className={`w-[70%] h-[75%] border shadow-sm relative ${
                      darkMode
                        ? "bg-slate-700 border-slate-500"
                        : "bg-white border-slate-300"
                    }`}
                  >
                    <div className="absolute top-4 left-4 right-4 space-y-2">
                      <div
                        className={`h-1.5 w-1/2 ${
                          darkMode ? "bg-slate-500" : "bg-slate-400"
                        }`}
                      />

                      <div
                        className={`h-1 w-full ${
                          darkMode ? "bg-slate-500" : "bg-slate-300"
                        }`}
                      />

                      <div
                        className={`h-1 w-5/6 ${
                          darkMode ? "bg-slate-500" : "bg-slate-300"
                        }`}
                      />

                      <div
                        className={`h-1 w-full ${
                          darkMode ? "bg-slate-500" : "bg-slate-300"
                        }`}
                      />

                      <div
                        className={`h-1 w-2/3 ${
                          darkMode ? "bg-slate-500" : "bg-slate-300"
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* INFORMATION */}

                <div className="px-4 pt-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3
                      className={`text-sm font-bold truncate ${
                        darkMode ? "text-slate-100" : "text-slate-800"
                      }`}
                      title={document.name}
                    >
                      {document.name}
                    </h3>

                    <span
                      className={`shrink-0 text-[9px] px-2 py-1 rounded-full font-semibold ${
                        darkMode
                          ? "bg-slate-800 text-slate-400"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {document.id}
                    </span>
                  </div>

                  <p
                    className={`text-[10px] mt-2 leading-relaxed ${
                      darkMode ? "text-slate-500" : "text-slate-400"
                    }`}
                  >
                    {document.description}
                  </p>

                  <p
                    className={`text-[9px] mt-2 truncate ${
                      darkMode ? "text-slate-600" : "text-slate-400"
                    }`}
                  >
                    File: {document.fileName}
                  </p>
                </div>

                {/* ACTIONS */}

                <div className="px-4 py-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleDownload(document)}
                    className={`flex-1 h-8 rounded-md text-[10px] font-semibold transition ${
                      darkMode
                        ? "bg-slate-700 text-white hover:bg-slate-600"
                        : "bg-slate-700 text-white hover:bg-slate-800"
                    }`}
                  >
                    Download
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteTemplate(document)}
                    className={`h-8 px-3 rounded-md text-[10px] font-semibold transition ${
                      darkMode
                        ? "border border-red-900 text-red-400 hover:bg-red-950"
                        : "border border-red-200 text-red-600 hover:bg-red-50"
                    }`}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            className={`border rounded-xl py-12 text-center ${
              darkMode
                ? "bg-slate-900 border-slate-700"
                : "bg-white border-slate-300"
            }`}
          >
            <p className="text-sm font-semibold">No templates found.</p>

            <p
              className={`text-xs mt-1 ${
                darkMode ? "text-slate-500" : "text-slate-400"
              }`}
            >
              Try searching for a different document.
            </p>
          </div>
        )}

        {/* ===================================================
            ADD TEMPLATE
        =================================================== */}

        <div
          className={`mt-6 border rounded-xl p-4 ${
            darkMode
              ? "bg-slate-900 border-slate-700"
              : "bg-white border-slate-300"
          }`}
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <h3 className="text-sm font-bold">Add Document Template</h3>

              <p
                className={`text-xs mt-1 ${
                  darkMode ? "text-slate-400" : "text-slate-500"
                }`}
              >
                Upload a PDF or Word document to add it to the template library.
              </p>
            </div>

            <button
              type="button"
              onClick={handleUploadTemplate}
              className={`h-9 px-6 rounded-md text-xs font-semibold transition ${
                darkMode
                  ? "bg-white text-slate-900 hover:bg-slate-200"
                  : "bg-slate-700 text-white hover:bg-slate-800"
              }`}
            >
              Upload Template
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentManagement;
