import React from "react";
import { useOutletContext } from "react-router-dom";
import { useMockStore } from "../../data/mockStore.jsx";

const DocumentTemplate = () => {
  const { darkMode } = useOutletContext();
  const { state } = useMockStore();

  // =========================================
  // THEME CLASSES
  // =========================================

  const cardClass = darkMode
    ? "bg-slate-900 border-slate-700"
    : "bg-white border-slate-200";

  const headingClass = darkMode ? "text-slate-100" : "text-slate-900";

  const mutedClass = darkMode ? "text-slate-400" : "text-slate-500";

  // =========================================
  // DOCUMENT TEMPLATES
  // =========================================
  // Templates are managed by:
  //
  // Admin Portal
  // → Document Management
  //
  // Students only consume the templates here.
  // =========================================

  const templates = state.documentTemplates || [];

  // =========================================
  // DOWNLOAD TEMPLATE
  // =========================================
  // Temporary mock download.
  //
  // When Supabase Storage is connected,
  // this will be replaced with the actual
  // stored file URL.
  // =========================================

  const handleDownload = (template) => {
    if (!template.fileName) {
      alert("This document does not have a downloadable file yet.");
      return;
    }

    // If an actual file URL already exists,
    // open/download that file.
    if (template.fileUrl) {
      window.open(template.fileUrl, "_blank");
      return;
    }

    // Temporary mock file
    const content = `${template.name}

${template.description || ""}

File:
${template.fileName}

This is a temporary mock document.
The actual PDF will be provided through Supabase Storage.
`;

    const blob = new Blob([content], {
      type: "text/plain",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = template.fileName.replace(/\.[^/.]+$/, "") + ".txt";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  // =========================================
  // RENDER
  // =========================================

  return (
    <div
      className={`p-5 md:p-6 lg:p-8 max-w-[1400px] mx-auto ${
        darkMode ? "text-slate-100" : "text-slate-900"
      }`}
    >
      {/* =========================================
          PAGE HEADER
      ========================================= */}

      <div className="mb-6">
        <p
          className={`text-xs uppercase tracking-widest font-bold mb-1 ${
            darkMode ? "text-slate-500" : "text-slate-400"
          }`}
        >
          Student Portal
        </p>

        <h1 className={`text-2xl font-black ${headingClass}`}>
          Document Templates
        </h1>

        <p className={`text-sm mt-1 ${mutedClass}`}>
          Download official forms and documents required for your internship.
        </p>
      </div>

      {/* =========================================
          TEMPLATE COUNT
      ========================================= */}

      <div className="flex items-center justify-between mb-4">
        <p className={`text-xs font-semibold ${mutedClass}`}>
          {templates.length}{" "}
          {templates.length === 1
            ? "document template"
            : "document templates"}
        </p>
      </div>

      {/* =========================================
          TEMPLATE GRID
      ========================================= */}

      {templates.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {templates.map((template) => (
            <article
              key={template.id}
              className={`${cardClass} rounded-xl border overflow-hidden transition-all duration-200 ${
                darkMode
                  ? "hover:border-slate-500 hover:shadow-lg"
                  : "hover:border-slate-400 hover:shadow-md"
              }`}
            >
              {/* =====================================
                  DOCUMENT PREVIEW
              ===================================== */}

              <div
                className={`h-40 border-b flex items-center justify-center ${
                  darkMode
                    ? "bg-slate-800 border-slate-700"
                    : "bg-slate-100 border-slate-200"
                }`}
              >
                <div
                  className={`w-20 h-24 rounded-lg border flex flex-col items-center justify-center ${
                    darkMode
                      ? "bg-slate-700 border-slate-600"
                      : "bg-white border-slate-300"
                  }`}
                >
                  <span
                    className={`text-3xl mb-1 ${
                      darkMode ? "text-slate-500" : "text-slate-400"
                    }`}
                  >
                    ▧
                  </span>

                  <span
                    className={`text-[9px] font-bold uppercase ${
                      darkMode ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    PDF
                  </span>
                </div>
              </div>

              {/* =====================================
                  CONTENT
              ===================================== */}

              <div className="p-4">
                {/* TEMPLATE LABEL */}

                <div className="mb-2">
                  <span
                    className={`inline-flex px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide ${
                      darkMode
                        ? "bg-slate-800 text-slate-400"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    Official Template
                  </span>
                </div>

                {/* NAME */}

                <h2 className={`text-sm font-bold mb-2 ${headingClass}`}>
                  {template.name}
                </h2>

                {/* DESCRIPTION */}

                <p
                  className={`text-xs leading-relaxed min-h-[36px] ${mutedClass}`}
                >
                  {template.description ||
                    "Official internship document template."}
                </p>

                {/* FILE NAME */}

                {template.fileName && (
                  <div
                    className={`mt-4 px-3 py-2 rounded-lg border ${
                      darkMode
                        ? "bg-slate-800 border-slate-700"
                        : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <p
                      className={`text-[10px] uppercase font-bold mb-1 ${
                        darkMode ? "text-slate-500" : "text-slate-400"
                      }`}
                    >
                      File
                    </p>

                    <p
                      className={`text-xs truncate ${
                        darkMode ? "text-slate-300" : "text-slate-600"
                      }`}
                      title={template.fileName}
                    >
                      {template.fileName}
                    </p>
                  </div>
                )}

                {/* DOWNLOAD BUTTON */}

                <button
                  type="button"
                  onClick={() => handleDownload(template)}
                  className={`w-full mt-4 h-10 rounded-lg text-white text-xs font-bold transition ${
                    darkMode
                      ? "bg-slate-700 hover:bg-slate-600"
                      : "bg-slate-800 hover:bg-slate-700"
                  }`}
                >
                  Download Template
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        /* =========================================
           EMPTY STATE
        ========================================= */

        <div className={`border rounded-xl py-16 text-center ${cardClass}`}>
          <div
            className={`text-4xl mb-3 ${
              darkMode ? "text-slate-600" : "text-slate-300"
            }`}
          >
            ▧
          </div>

          <h2 className={`text-sm font-bold ${headingClass}`}>
            No document templates available
          </h2>

          <p className={`text-xs mt-1 ${mutedClass}`}>
            Official internship templates will appear here once they are
            published by the administrator.
          </p>
        </div>
      )}

      {/* =========================================
          INFORMATION NOTICE
      ========================================= */}

      {templates.length > 0 && (
        <div
          className={`mt-6 p-4 rounded-xl border ${
            darkMode
              ? "bg-slate-900 border-slate-700"
              : "bg-slate-50 border-slate-200"
          }`}
        >
          <p
            className={`text-xs font-bold mb-1 ${
              darkMode ? "text-slate-200" : "text-slate-700"
            }`}
          >
            Important
          </p>

          <p
            className={`text-xs leading-relaxed ${
              darkMode ? "text-slate-400" : "text-slate-500"
            }`}
          >
            Please use the latest version of each official template provided
            by the administrator. Make sure all required forms are completed
            and submitted according to the internship requirements.
          </p>
        </div>
      )}
    </div>
  );
};

export default DocumentTemplate;

