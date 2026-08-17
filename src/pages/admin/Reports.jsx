import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";

// =========================================================
// REPORT DATA
// =========================================================

const reportTypes = [
  {
    id: 1,
    title: "User Activity Report",
    description: "Generate a report containing user activity and account information.",
  },
  {
    id: 2,
    title: "Internship Placement Report",
    description:
      "Generate a report containing internship placement and assignment records.",
  },
  {
    id: 3,
    title: "Evaluation Summary",
    description:
      "Generate a summary of internship evaluations and assessment results.",
  },
  {
    id: 4,
    title: "Document Compliance Report",
    description:
      "Generate a report showing submitted and missing internship documents.",
  },
  {
    id: 5,
    title: "Company Partner Report",
    description:
      "Generate a report containing registered company partner information.",
  },
  {
    id: 6,
    title: "System Usage Analytics",
    description:
      "Generate analytics showing system usage and activity statistics.",
  },
];

// =========================================================
// COMPONENT
// =========================================================

const Reports = () => {
  const { darkMode } = useOutletContext();

  // =========================================================
  // GENERATED REPORT
  // =========================================================

  const [generatedReport, setGeneratedReport] = useState(null);

  // =========================================================
  // GENERATE REPORT
  // =========================================================

  const handleGenerateReport = (report) => {
    setGeneratedReport(report.id);

    alert(`${report.title} generated successfully!`);
  };

  // =========================================================
  // RETURN
  // =========================================================

  return (
    <div
      className={`min-h-[calc(100vh-5rem)] px-4 py-6 sm:px-6 lg:px-8 transition-colors duration-300 ${
        darkMode
          ? "bg-slate-950 text-slate-100"
          : "bg-slate-50 text-slate-900"
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
            All reports displayed on this page are sample reports.
          </p>

          <p className="mt-1">
            Report generation and data export are not connected to a database
            yet.
          </p>
        </div>

        {/* ===================================================
            SYSTEM REPORTS CONTAINER
        =================================================== */}

        <section
          className={`border rounded-lg p-4 sm:p-5 lg:p-6 min-h-[500px] ${
            darkMode
              ? "bg-slate-900 border-slate-700"
              : "bg-white border-slate-400"
          }`}
        >
          {/* =================================================
              TITLE
          ================================================= */}

          <div className="mb-5">
            <h1 className="text-lg sm:text-xl font-bold">
              System Reports & Data Export
            </h1>

            <p
              className={`text-xs mt-1 ${
                darkMode ? "text-slate-400" : "text-slate-500"
              }`}
            >
              Generate system reports and export administrative data.
            </p>
          </div>

          {/* =================================================
              REPORT GRID
          ================================================= */}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {reportTypes.map((report) => {
              const isGenerated = generatedReport === report.id;

              return (
                <div
                  key={report.id}
                  className={`border rounded-sm p-3 transition ${
                    darkMode
                      ? "bg-slate-800 border-slate-600"
                      : "bg-white border-slate-400"
                  }`}
                >
                  {/* =================================================
                      REPORT TITLE
                  ================================================= */}

                  <h2
                    className={`text-xs font-bold min-h-[32px] flex items-center ${
                      darkMode ? "text-slate-100" : "text-slate-900"
                    }`}
                  >
                    {report.title}
                  </h2>

                  {/* =================================================
                      REPORT PREVIEW
                  ================================================= */}

                  <div
                    className={`mt-2 h-28 sm:h-32 border flex items-center justify-center ${
                      darkMode
                        ? "bg-slate-700 border-slate-500"
                        : "bg-slate-200 border-slate-300"
                    }`}
                  >
                    <div className="w-[65%]">
                      <div
                        className={`h-1 mb-2 ${
                          darkMode ? "bg-slate-500" : "bg-slate-300"
                        }`}
                      />

                      <div
                        className={`h-1 mb-2 ${
                          darkMode ? "bg-slate-500" : "bg-slate-300"
                        }`}
                      />

                      <div
                        className={`h-1 mb-2 ${
                          darkMode ? "bg-slate-500" : "bg-slate-300"
                        }`}
                      />

                      <div
                        className={`h-1 w-[70%] ${
                          darkMode ? "bg-slate-500" : "bg-slate-300"
                        }`}
                      />
                    </div>
                  </div>

                  {/* =================================================
                      GENERATE BUTTON
                  ================================================= */}

                  <button
                    type="button"
                    onClick={() => handleGenerateReport(report)}
                    className={`w-full mt-2 h-8 border rounded-sm text-[10px] font-semibold transition ${
                      isGenerated
                        ? darkMode
                          ? "bg-emerald-700 border-emerald-600 text-white"
                          : "bg-emerald-600 border-emerald-700 text-white"
                        : darkMode
                        ? "bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                        : "bg-slate-600 border-slate-700 text-white hover:bg-slate-700"
                    }`}
                  >
                    {isGenerated ? "Generated" : "Generate"}
                  </button>

                  {/* =================================================
                      REPORT DESCRIPTION
                  ================================================= */}

                  <p
                    className={`text-[9px] leading-relaxed mt-2 ${
                      darkMode ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    {report.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Reports;
