import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";

const Reports = () => {
  const { darkMode } = useOutletContext();

  // =========================================================
  // STATE
  // =========================================================

  const [selectedReport, setSelectedReport] = useState(null);

  // =========================================================
  // REPORT DATA
  // =========================================================

  const placementData = [
    {
      label: "Placed",
      value: 18,
      total: 23,
    },
    {
      label: "Pending",
      value: 3,
      total: 23,
    },
    {
      label: "Not Placed",
      value: 2,
      total: 23,
    },
  ];

  const gradeData = [
    {
      label: "Excellent",
      value: 8,
    },
    {
      label: "Very Good",
      value: 7,
    },
    {
      label: "Good",
      value: 5,
    },
    {
      label: "Satisfactory",
      value: 2,
    },
    {
      label: "Needs Improvement",
      value: 1,
    },
  ];

  const monthlyData = [
    {
      month: "Jan",
      applications: 8,
      placements: 5,
      completed: 2,
    },
    {
      month: "Feb",
      applications: 11,
      placements: 7,
      completed: 4,
    },
    {
      month: "Mar",
      applications: 14,
      placements: 9,
      completed: 6,
    },
    {
      month: "Apr",
      applications: 18,
      placements: 13,
      completed: 8,
    },
    {
      month: "May",
      applications: 21,
      placements: 16,
      completed: 11,
    },
    {
      month: "Jun",
      applications: 23,
      placements: 18,
      completed: 15,
    },
  ];

  // =========================================================
  // THEME CLASSES
  // =========================================================

  const headingClass = darkMode ? "text-slate-100" : "text-slate-900";

  const mutedClass = darkMode ? "text-slate-400" : "text-slate-500";

  const cardClass = darkMode
    ? "bg-slate-900 border-slate-700"
    : "bg-white border-slate-300";

  const secondaryCardClass = darkMode
    ? "bg-slate-800 border-slate-700"
    : "bg-slate-50 border-slate-200";

  const chartBackgroundClass = darkMode
    ? "bg-slate-800 border-slate-700"
    : "bg-slate-100 border-slate-200";

  // =========================================================
  // OPEN REPORT
  // =========================================================

  const handleViewReport = (type) => {
    setSelectedReport(type);
  };

  const closeReport = () => {
    setSelectedReport(null);
  };

  // =========================================================
  // PRINT / EXPORT
  // =========================================================

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    window.print();
  };

  // =========================================================
  // EXPORT CSV
  // Excel can open CSV files directly.
  // =========================================================

  const handleExportExcel = () => {
    const rows = [
      ["Internship Reports & Analytics"],
      [],
      ["Placement Summary"],
      ["Status", "Count", "Total"],
      ["Placed", 18, 23],
      ["Pending", 3, 23],
      ["Not Placed", 2, 23],
      [],
      ["Grade Distribution"],
      ["Grade", "Students"],
      ["Excellent", 8],
      ["Very Good", 7],
      ["Good", 5],
      ["Satisfactory", 2],
      ["Needs Improvement", 1],
      [],
      ["Internship Metrics"],
      ["Month", "Applications", "Placements", "Completed"],
      ...monthlyData.map((item) => [
        item.month,
        item.applications,
        item.placements,
        item.completed,
      ]),
    ];

    const csv = rows
      .map((row) =>
        row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "faculty-internship-reports.csv";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  // =========================================================
  // CALCULATIONS
  // =========================================================

  const totalStudents = 23;

  const placedStudents = 18;

  const placementRate = Math.round((placedStudents / totalStudents) * 100);

  const totalApplications = 23;

  const completedInternships = 15;

  const completionRate = Math.round(
    (completedInternships / totalStudents) * 100
  );

  // =========================================================
  // RETURN
  // =========================================================

  return (
    <div className="w-full min-h-full p-3 sm:p-5 md:p-6 lg:p-8 bg-transparent">
      <div className="max-w-[1400px] mx-auto">
        {/* =====================================================
            PAGE HEADER
        ===================================================== */}

        <div className="mb-5 sm:mb-6">
          <p
            className={`text-[10px] sm:text-xs uppercase tracking-widest font-bold mb-1 ${
              darkMode ? "text-slate-500" : "text-slate-400"
            }`}
          >
            Faculty Portal
          </p>

          <h1 className={`text-xl sm:text-2xl font-black ${headingClass}`}>
            Reports & Analytics
          </h1>

          <p className={`text-xs sm:text-sm mt-1 ${mutedClass}`}>
            Monitor internship placements, student performance, and internship
            progress.
          </p>
        </div>

        {/* =====================================================
            SUMMARY REPORT CARDS
        ===================================================== */}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
          {/* ===================================================
              PLACEMENT SUMMARY
          =================================================== */}

          <section
            className={`border rounded-xl overflow-hidden shadow-sm ${cardClass}`}
          >
            <div className="p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <h2
                    className={`text-sm sm:text-base font-bold ${headingClass}`}
                  >
                    Placement Summary
                  </h2>

                  <p className={`text-[10px] mt-1 ${mutedClass}`}>
                    Current student placement status
                  </p>
                </div>

                <span
                  className={`text-lg sm:text-xl font-black ${headingClass}`}
                >
                  {placementRate}%
                </span>
              </div>

              {/* PLACEMENT BAR */}

              <div
                className={`h-3 rounded-full overflow-hidden flex ${
                  darkMode ? "bg-slate-700" : "bg-slate-200"
                }`}
              >
                <div
                  className="bg-slate-600"
                  style={{
                    width: `${(18 / 23) * 100}%`,
                  }}
                />

                <div
                  className="bg-slate-400"
                  style={{
                    width: `${(3 / 23) * 100}%`,
                  }}
                />

                <div
                  className="bg-slate-300"
                  style={{
                    width: `${(2 / 23) * 100}%`,
                  }}
                />
              </div>

              {/* LEGEND */}

              <div className="grid grid-cols-3 gap-2 mt-4">
                {placementData.map((item) => (
                  <div key={item.label}>
                    <p className={`text-[10px] ${mutedClass}`}>{item.label}</p>

                    <p className={`text-sm font-bold mt-0.5 ${headingClass}`}>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => handleViewReport("placement")}
                className="
                  mt-4
                  w-full
                  sm:w-auto
                  px-5
                  py-2.5
                  rounded-lg
                  bg-slate-800
                  text-white
                  text-xs
                  font-bold
                  hover:bg-slate-700
                  transition
                "
              >
                View
              </button>
            </div>
          </section>

          {/* ===================================================
              GRADE DISTRIBUTION
          =================================================== */}

          <section
            className={`border rounded-xl overflow-hidden shadow-sm ${cardClass}`}
          >
            <div className="p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <h2
                    className={`text-sm sm:text-base font-bold ${headingClass}`}
                  >
                    Grade Distribution
                  </h2>

                  <p className={`text-[10px] mt-1 ${mutedClass}`}>
                    Student evaluation results
                  </p>
                </div>

                <span
                  className={`text-lg sm:text-xl font-black ${headingClass}`}
                >
                  23
                </span>
              </div>

              {/* GRADE BARS */}

              <div className="space-y-2.5">
                {gradeData.map((item) => {
                  const percentage = (item.value / 23) * 100;

                  return (
                    <div key={item.label} className="flex items-center gap-3">
                      <span
                        className={`w-[105px] text-[9px] sm:text-[10px] truncate ${mutedClass}`}
                      >
                        {item.label}
                      </span>

                      <div
                        className={`flex-1 h-2 rounded-full overflow-hidden ${
                          darkMode ? "bg-slate-700" : "bg-slate-200"
                        }`}
                      >
                        <div
                          className="h-full bg-slate-600 rounded-full"
                          style={{
                            width: `${percentage}%`,
                          }}
                        />
                      </div>

                      <span
                        className={`w-5 text-right text-[10px] font-bold ${headingClass}`}
                      >
                        {item.value}
                      </span>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => handleViewReport("grades")}
                className="
                  mt-4
                  w-full
                  sm:w-auto
                  px-5
                  py-2.5
                  rounded-lg
                  bg-slate-800
                  text-white
                  text-xs
                  font-bold
                  hover:bg-slate-700
                  transition
                "
              >
                View
              </button>
            </div>
          </section>
        </div>

        {/* =====================================================
            INTERNSHIP METRICS DASHBOARD
        ===================================================== */}

        <section
          className={`border rounded-xl shadow-sm overflow-hidden ${cardClass}`}
        >
          <div className="p-4 sm:p-5 md:p-6">
            {/* HEADER */}

            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">
              <div>
                <h2
                  className={`text-sm sm:text-base font-bold ${headingClass}`}
                >
                  Internship Metrics Dashboard
                </h2>

                <p className={`text-[10px] mt-1 ${mutedClass}`}>
                  Overview of internship activity and progress.
                </p>
              </div>

              <div className="flex gap-4">
                <div>
                  <p className={`text-[9px] ${mutedClass}`}>Applications</p>

                  <p className={`text-sm font-black ${headingClass}`}>
                    {totalApplications}
                  </p>
                </div>

                <div>
                  <p className={`text-[9px] ${mutedClass}`}>Completed</p>

                  <p className={`text-sm font-black ${headingClass}`}>
                    {completedInternships}
                  </p>
                </div>
              </div>
            </div>

            {/* =================================================
                CHART
            ================================================= */}

            <div
              className={`border rounded-xl p-4 sm:p-5 ${chartBackgroundClass}`}
            >
              {/* CHART AREA */}

              <div className="h-[260px] sm:h-[320px] flex items-end gap-2 sm:gap-4">
                {monthlyData.map((item) => {
                  const maxValue = 25;

                  const applicationHeight =
                    (item.applications / maxValue) * 100;

                  const placementHeight = (item.placements / maxValue) * 100;

                  const completedHeight = (item.completed / maxValue) * 100;

                  return (
                    <div
                      key={item.month}
                      className="flex-1 h-full flex flex-col justify-end"
                    >
                      {/* BARS */}

                      <div className="flex-1 flex items-end justify-center gap-0.5 sm:gap-1">
                        <div
                          title={`${item.applications} applications`}
                          className="w-2 sm:w-4 bg-slate-500 rounded-t-sm transition-all"
                          style={{
                            height: `${applicationHeight}%`,
                          }}
                        />

                        <div
                          title={`${item.placements} placements`}
                          className="w-2 sm:w-4 bg-slate-600 rounded-t-sm transition-all"
                          style={{
                            height: `${placementHeight}%`,
                          }}
                        />

                        <div
                          title={`${item.completed} completed`}
                          className="w-2 sm:w-4 bg-slate-700 rounded-t-sm transition-all"
                          style={{
                            height: `${completedHeight}%`,
                          }}
                        />
                      </div>

                      {/* MONTH */}

                      <p
                        className={`text-[9px] text-center mt-2 ${mutedClass}`}
                      >
                        {item.month}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* CHART LEGEND */}

              <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mt-5">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-slate-500" />

                  <span className={`text-[10px] ${mutedClass}`}>
                    Applications
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-slate-600" />

                  <span className={`text-[10px] ${mutedClass}`}>
                    Placements
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-slate-700" />

                  <span className={`text-[10px] ${mutedClass}`}>Completed</span>
                </div>
              </div>
            </div>

            {/* =================================================
                METRIC CARDS
            ================================================= */}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
              <div className={`border rounded-lg p-3 ${secondaryCardClass}`}>
                <p className={`text-[10px] ${mutedClass}`}>Total Students</p>

                <p className={`text-xl font-black mt-1 ${headingClass}`}>23</p>
              </div>

              <div className={`border rounded-lg p-3 ${secondaryCardClass}`}>
                <p className={`text-[10px] ${mutedClass}`}>Placement Rate</p>

                <p className={`text-xl font-black mt-1 ${headingClass}`}>
                  {placementRate}%
                </p>
              </div>

              <div className={`border rounded-lg p-3 ${secondaryCardClass}`}>
                <p className={`text-[10px] ${mutedClass}`}>Completed</p>

                <p className={`text-xl font-black mt-1 ${headingClass}`}>
                  {completedInternships}
                </p>
              </div>

              <div className={`border rounded-lg p-3 ${secondaryCardClass}`}>
                <p className={`text-[10px] ${mutedClass}`}>Completion Rate</p>

                <p className={`text-xl font-black mt-1 ${headingClass}`}>
                  {completionRate}%
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================
            EXPORT BUTTONS
        ===================================================== */}

        <div className="flex flex-col sm:flex-row gap-2.5 mt-4">
          <button
            type="button"
            onClick={handleExportPDF}
            className="
              px-5
              py-2.5
              rounded-lg
              bg-slate-800
              text-white
              text-xs
              font-bold
              hover:bg-slate-700
              transition
            "
          >
            Export PDF
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="
              px-5
              py-2.5
              rounded-lg
              bg-slate-700
              text-white
              text-xs
              font-bold
              hover:bg-slate-600
              transition
            "
          >
            Export Excel
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className={`px-5 py-2.5 rounded-lg border text-xs font-bold transition ${
              darkMode
                ? "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700"
                : "bg-white border-slate-300 text-slate-700 hover:bg-slate-100"
            }`}
          >
            Print
          </button>
        </div>
      </div>

      {/* =======================================================
          REPORT MODAL
      ======================================================= */}

      {selectedReport && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm ${
            darkMode ? "bg-black/60" : "bg-slate-900/40"
          }`}
          onClick={closeReport}
        >
          <div
            className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border shadow-2xl ${cardClass}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* MODAL HEADER */}

            <div
              className={`px-5 sm:px-6 py-4 border-b flex items-center justify-between ${
                darkMode ? "border-slate-700" : "border-slate-200"
              }`}
            >
              <div>
                <p
                  className={`text-[10px] uppercase tracking-widest font-bold ${mutedClass}`}
                >
                  Report Details
                </p>

                <h2 className={`text-lg font-bold mt-1 ${headingClass}`}>
                  {selectedReport === "placement"
                    ? "Placement Summary"
                    : "Grade Distribution"}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeReport}
                className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg transition ${
                  darkMode
                    ? "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900"
                }`}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* MODAL BODY */}

            <div className="p-5 sm:p-6">
              {selectedReport === "placement" ? (
                <div className="space-y-4">
                  <div
                    className={`p-4 rounded-xl border ${secondaryCardClass}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-xs ${mutedClass}`}>
                          Total Students
                        </p>

                        <p
                          className={`text-2xl font-black mt-1 ${headingClass}`}
                        >
                          23
                        </p>
                      </div>

                      <div className="text-right">
                        <p className={`text-xs ${mutedClass}`}>
                          Placement Rate
                        </p>

                        <p
                          className={`text-2xl font-black mt-1 ${headingClass}`}
                        >
                          {placementRate}%
                        </p>
                      </div>
                    </div>
                  </div>

                  {placementData.map((item) => (
                    <div key={item.label}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span
                          className={`text-xs font-semibold ${headingClass}`}
                        >
                          {item.label}
                        </span>

                        <span className={`text-xs ${mutedClass}`}>
                          {item.value} / {item.total}
                        </span>
                      </div>

                      <div
                        className={`h-2.5 rounded-full overflow-hidden ${
                          darkMode ? "bg-slate-700" : "bg-slate-200"
                        }`}
                      >
                        <div
                          className="h-full bg-slate-600 rounded-full"
                          style={{
                            width: `${(item.value / item.total) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {gradeData.map((item) => (
                    <div key={item.label}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span
                          className={`text-xs font-semibold ${headingClass}`}
                        >
                          {item.label}
                        </span>

                        <span className={`text-xs ${mutedClass}`}>
                          {item.value} students
                        </span>
                      </div>

                      <div
                        className={`h-3 rounded-full overflow-hidden ${
                          darkMode ? "bg-slate-700" : "bg-slate-200"
                        }`}
                      >
                        <div
                          className="h-full bg-slate-600 rounded-full"
                          style={{
                            width: `${(item.value / 23) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* MODAL FOOTER */}

            <div
              className={`px-5 sm:px-6 py-4 border-t flex justify-end ${
                darkMode ? "border-slate-700" : "border-slate-200"
              }`}
            >
              <button
                type="button"
                onClick={closeReport}
                className="
                  px-5
                  py-2.5
                  rounded-lg
                  bg-slate-800
                  text-white
                  text-xs
                  font-bold
                  hover:bg-slate-700
                  transition
                "
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================
          PRINT STYLING
      ======================================================= */}

      <style>
        {`
          @media print {
            body {
              background: white !important;
            }

            button {
              display: none !important;
            }

            .fixed {
              display: none !important;
            }
          }
        `}
      </style>
    </div>
  );
};

export default Reports;
