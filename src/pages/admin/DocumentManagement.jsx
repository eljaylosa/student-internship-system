import React, { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";

// =========================================================
// DEMO DOCUMENT DATA
// =========================================================

const documentTemplates = [
  {
    id: 1,
    name: "Internship Application Form",
    description: "Official internship application form.",
    fileName: "internship-application-form.txt",
  },
  {
    id: 2,
    name: "Internship Agreement",
    description: "Internship agreement template.",
    fileName: "internship-agreement.txt",
  },
  {
    id: 3,
    name: "Evaluation Form",
    description: "Student internship evaluation form.",
    fileName: "evaluation-form.txt",
  },
  {
    id: 4,
    name: "Student Endorsement",
    description: "Student endorsement document.",
    fileName: "student-endorsement.txt",
  },
  {
    id: 5,
    name: "Company Evaluation",
    description: "Company evaluation template.",
    fileName: "company-evaluation.txt",
  },
  {
    id: 6,
    name: "Completion Certificate",
    description: "Internship completion certificate.",
    fileName: "completion-certificate.txt",
  },
];

// =========================================================
// COMPONENT
// =========================================================

const DocumentManagement = () => {
  const { darkMode } = useOutletContext();

  // =========================================================
  // STATE
  // =========================================================

  const [searchTerm, setSearchTerm] = useState("");

  // =========================================================
  // FILTER DOCUMENTS
  // =========================================================

  const filteredDocuments = useMemo(() => {
    const search = searchTerm.toLowerCase().trim();

    if (!search) {
      return documentTemplates;
    }

    return documentTemplates.filter(
      (document) =>
        document.name.toLowerCase().includes(search) ||
        document.description.toLowerCase().includes(search)
    );
  }, [searchTerm]);

  // =========================================================
  // DOWNLOAD TEMPLATE
  // =========================================================

  const handleDownload = (document) => {
    const content = `
SIMS DOCUMENT TEMPLATE

Document:
${document.name}

Description:
${document.description}

This is a demo document generated for the
Student Internship Management System.

No real document data is included.
`;

    const blob = new Blob([content], {
      type: "text/plain;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);

    const link = window.document.createElement("a");

    link.href = url;
    link.download = document.fileName;

    window.document.body.appendChild(link);
    link.click();

    window.document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  // =========================================================
  // UPLOAD TEMPLATE
  // =========================================================

  const handleUploadTemplate = () => {
    const input = window.document.createElement("input");

    input.type = "file";
    input.accept = ".pdf,.doc,.docx";

    input.onchange = (event) => {
      const file = event.target.files?.[0];

      if (!file) return;

      alert(
        `Demo upload successful!\n\nSelected file: ${file.name}\n\nDatabase/storage is not implemented yet.`
      );
    };

    input.click();
  };

  // =========================================================
  // RETURN
  // =========================================================

  return (
    <div
      className={`min-h-[calc(100vh-5rem)] px-4 py-5 sm:px-6 lg:px-8 transition-colors duration-300 ${
        darkMode
          ? "bg-slate-950 text-slate-100"
          : "bg-slate-50 text-slate-900"
      }`}
    >
      <div className="max-w-6xl mx-auto">

        {/* ===================================================
            DEMO NOTICE
        =================================================== */}

        <div
          className={`mb-4 p-3 rounded-lg text-[10px] leading-relaxed border ${
            darkMode
              ? "bg-red-950/40 border-red-900 text-red-300"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          <p className="font-bold mb-1">⚠️ Demo Project</p>

          <p>
            All documents displayed on this page are demo templates.
          </p>

          <p className="mt-1">
            No database or permanent file storage is implemented yet.
          </p>
        </div>

        {/* ===================================================
            PAGE HEADER
        =================================================== */}

        <div className="mb-5">
          <h1 className="text-xl sm:text-2xl font-bold">
            Document Management
          </h1>

          <p
            className={`text-xs sm:text-sm mt-1 ${
              darkMode ? "text-slate-400" : "text-slate-500"
            }`}
          >
            Manage and download official internship document templates.
          </p>
        </div>

        {/* ===================================================
            SEARCH BAR
        =================================================== */}

        <div
          className={`border rounded-lg p-3 mb-5 ${
            darkMode
              ? "bg-slate-900 border-slate-700"
              : "bg-white border-slate-300"
          }`}
        >
          <div className="flex flex-col sm:flex-row gap-2">

            {/* SEARCH */}

            <div className="flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                className={`w-full h-9 px-3 text-xs rounded-md border outline-none transition ${
                  darkMode
                    ? "bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500"
                    : "bg-slate-100 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-slate-500"
                }`}
              />
            </div>

            {/* SEARCH BUTTON */}

            <button
              type="button"
              className={`h-9 px-6 rounded-md text-xs font-semibold transition ${
                darkMode
                  ? "bg-white text-slate-900 hover:bg-slate-200"
                  : "bg-slate-700 text-white hover:bg-slate-800"
              }`}
            >
              Search
            </button>

          </div>
        </div>

        {/* ===================================================
            TEMPLATE GRID
        =================================================== */}

        {filteredDocuments.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">

            {filteredDocuments.map((document) => (
              <div
                key={document.id}
                className={`border rounded-lg overflow-hidden transition ${
                  darkMode
                    ? "bg-slate-900 border-slate-700"
                    : "bg-white border-slate-400"
                }`}
              >

                {/* =================================================
                    DOCUMENT PREVIEW
                ================================================= */}

                <div
                  className={`mx-3 mt-3 h-32 sm:h-36 border flex items-center justify-center ${
                    darkMode
                      ? "bg-slate-800 border-slate-600"
                      : "bg-slate-200 border-slate-400"
                  }`}
                >
                  <div className="w-[75%] h-[70%] relative">

                    {/* PAPER */}

                    <div
                      className={`absolute inset-0 border ${
                        darkMode
                          ? "bg-slate-700 border-slate-500"
                          : "bg-slate-100 border-slate-400"
                      }`}
                    >

                      {/* FAKE DOCUMENT LINES */}

                      <div className="absolute top-4 left-4 right-4">
                        <div
                          className={`h-1.5 w-1/2 mb-3 ${
                            darkMode
                              ? "bg-slate-500"
                              : "bg-slate-400"
                          }`}
                        />

                        <div
                          className={`h-1 w-full mb-2 ${
                            darkMode
                              ? "bg-slate-500"
                              : "bg-slate-300"
                          }`}
                        />

                        <div
                          className={`h-1 w-5/6 mb-2 ${
                            darkMode
                              ? "bg-slate-500"
                              : "bg-slate-300"
                          }`}
                        />

                        <div
                          className={`h-1 w-full mb-2 ${
                            darkMode
                              ? "bg-slate-500"
                              : "bg-slate-300"
                          }`}
                        />

                        <div
                          className={`h-1 w-2/3 ${
                            darkMode
                              ? "bg-slate-500"
                              : "bg-slate-300"
                          }`}
                        />
                      </div>

                    </div>

                  </div>
                </div>

                {/* =================================================
                    TEMPLATE NAME
                ================================================= */}

                <div className="px-4 pt-3 text-center">

                  <h2
                    className={`text-xs sm:text-sm font-bold truncate ${
                      darkMode
                        ? "text-slate-100"
                        : "text-slate-800"
                    }`}
                    title={document.name}
                  >
                    Template {document.id}
                  </h2>

                  <p
                    className={`text-[9px] mt-1 truncate ${
                      darkMode
                        ? "text-slate-500"
                        : "text-slate-400"
                    }`}
                    title={document.name}
                  >
                    {document.name}
                  </p>

                </div>

                {/* =================================================
                    DESCRIPTION LINE
                ================================================= */}

                <div className="px-4 pt-3">

                  <div
                    className={`h-1.5 rounded-sm ${
                      darkMode
                        ? "bg-slate-700"
                        : "bg-slate-300"
                    }`}
                  />

                  <p
                    className={`text-[9px] text-center mt-2 truncate ${
                      darkMode
                        ? "text-slate-500"
                        : "text-slate-400"
                    }`}
                  >
                    {document.description}
                  </p>

                </div>

                {/* =================================================
                    DOWNLOAD
                ================================================= */}

                <div className="px-4 py-3">

                  <button
                    type="button"
                    onClick={() => handleDownload(document)}
                    className={`w-full h-8 rounded-md text-[10px] font-semibold transition ${
                      darkMode
                        ? "bg-slate-700 text-white hover:bg-slate-600"
                        : "bg-slate-600 text-white hover:bg-slate-700"
                    }`}
                  >
                    Download
                  </button>

                </div>

              </div>
            ))}

          </div>
        ) : (
          /* ===================================================
             NO RESULTS
          =================================================== */

          <div
            className={`border rounded-lg py-12 text-center ${
              darkMode
                ? "bg-slate-900 border-slate-700 text-slate-500"
                : "bg-white border-slate-300 text-slate-400"
            }`}
          >
            <p className="text-sm font-semibold">
              No templates found.
            </p>

            <p className="text-xs mt-1">
              Try searching for a different document.
            </p>
          </div>
        )}

        {/* ===================================================
            UPLOAD TEMPLATE
        =================================================== */}

        <div
          className={`mt-6 border rounded-lg p-4 ${
            darkMode
              ? "bg-slate-900 border-slate-700"
              : "bg-white border-slate-300"
          }`}
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">

            <div className="text-center sm:text-left">
              <h3 className="text-sm font-bold">
                Add Document Template
              </h3>

              <p
                className={`text-xs mt-1 ${
                  darkMode
                    ? "text-slate-400"
                    : "text-slate-500"
                }`}
              >
                Upload a new PDF or Word document template.
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

