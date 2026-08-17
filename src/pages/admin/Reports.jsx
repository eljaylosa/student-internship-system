import React, { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { STATUS, useMockStore } from "../../data/mockStore.jsx";

export default function Reports() {
  const { darkMode } = useOutletContext();
  const { state } = useMockStore();

  const [activeReport, setActiveReport] = useState("overview");

  // =========================================================
  // REPORT DATA
  // =========================================================

  const reportData = useMemo(() => {
    const pendingApplications = state.applications.filter((item) =>
      [
        STATUS.application.SUBMITTED,
        STATUS.application.UNDER_REVIEW,
        STATUS.application.INFO_REQUESTED,
      ].includes(item.status)
    );

    const approvedApplications = state.applications.filter(
      (item) => item.status === STATUS.application.APPROVED
    );

    const rejectedApplications = state.applications.filter(
      (item) => item.status === STATUS.application.REJECTED
    );

    const activeInternships = state.assignments.filter(
      (item) => item.status === STATUS.assignment.ACTIVE
    );

    const completedInternships = state.assignments.filter(
      (item) => item.status === STATUS.assignment.COMPLETED
    );

    const pendingAssignments = state.assignments.filter(
      (item) => item.status === STATUS.assignment.PENDING
    );

    const submittedEvaluations = state.evaluations.filter(
      (item) => item.status === STATUS.evaluation.SUBMITTED
    );

    const finalizedEvaluations = state.evaluations.filter(
      (item) => item.status === STATUS.evaluation.FINALIZED
    );

    const companyToStudentEvaluations = state.evaluations.filter(
      (item) =>
        item.evaluatorRole === "Company Supervisor" &&
        item.evaluatedRole === "Student"
    );

    const studentToCompanyEvaluations = state.evaluations.filter(
      (item) =>
        item.evaluatorRole === "Student" && item.evaluatedRole === "Company"
    );

    const pendingDocuments = state.documents.filter(
      (item) => item.status === STATUS.document.PENDING_REVIEW
    );

    const approvedDocuments = state.documents.filter(
      (item) => item.status === STATUS.document.APPROVED
    );

    const needsRevisionDocuments = state.documents.filter(
      (item) => item.status === STATUS.document.NEEDS_REVISION
    );

    return {
      pendingApplications,
      approvedApplications,
      rejectedApplications,

      activeInternships,
      completedInternships,
      pendingAssignments,

      submittedEvaluations,
      finalizedEvaluations,

      companyToStudentEvaluations,
      studentToCompanyEvaluations,

      pendingDocuments,
      approvedDocuments,
      needsRevisionDocuments,
    };
  }, [state]);

  // =========================================================
  // OVERVIEW CARDS
  // =========================================================

  const overviewCards = [
    {
      label: "Pending Applications",
      value: reportData.pendingApplications.length,
      description: "Applications requiring review",
      icon: "📋",
      accent: "blue",
    },
    {
      label: "Active Internships",
      value: reportData.activeInternships.length,
      description: "Currently deployed interns",
      icon: "💼",
      accent: "emerald",
    },
    {
      label: "Completed Internships",
      value: reportData.completedInternships.length,
      description: "Successfully completed",
      icon: "🎓",
      accent: "violet",
    },
    {
      label: "Submitted Evaluations",
      value: reportData.submittedEvaluations.length,
      description: "Evaluation records submitted",
      icon: "⭐",
      accent: "amber",
    },
  ];

  // =========================================================
  // HELPERS
  // =========================================================

  const cardClass = darkMode
    ? "bg-slate-900 border-slate-700"
    : "bg-white border-slate-200";

  const mutedText = darkMode ? "text-slate-400" : "text-slate-500";

  const secondaryText = darkMode ? "text-slate-300" : "text-slate-600";

  const getAccentClasses = (accent) => {
    const classes = {
      blue: darkMode
        ? "bg-blue-950/40 text-blue-400"
        : "bg-blue-50 text-blue-600",

      emerald: darkMode
        ? "bg-emerald-950/40 text-emerald-400"
        : "bg-emerald-50 text-emerald-600",

      violet: darkMode
        ? "bg-violet-950/40 text-violet-400"
        : "bg-violet-50 text-violet-600",

      amber: darkMode
        ? "bg-amber-950/40 text-amber-400"
        : "bg-amber-50 text-amber-600",
    };

    return classes[accent] || classes.blue;
  };

  const getPercentage = (value, total) => {
    if (!total) return 0;

    return Math.round((value / total) * 100);
  };

  // =========================================================
  // REPORT NAVIGATION
  // =========================================================

  const reportTabs = [
    {
      id: "overview",
      label: "Overview",
      icon: "📊",
    },
    {
      id: "applications",
      label: "Applications",
      icon: "📋",
    },
    {
      id: "internships",
      label: "Internships",
      icon: "💼",
    },
    {
      id: "evaluations",
      label: "Evaluations",
      icon: "⭐",
    },
    {
      id: "documents",
      label: "Documents",
      icon: "📁",
    },
  ];

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div
      className={`min-h-[calc(100vh-5rem)] px-4 py-5 sm:px-6 lg:px-8 transition-colors duration-300 ${
        darkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"
      }`}
    >
      <div className="max-w-7xl mx-auto">
        {/* ===================================================
            HEADER
        =================================================== */}

        <div className="mb-6">
          <p
            className={`text-[10px] uppercase tracking-widest font-bold ${
              darkMode ? "text-slate-500" : "text-slate-400"
            }`}
          >
            Administrator Portal
          </p>

          <h1 className="text-xl sm:text-2xl font-black mt-1">
            Reports & Analytics
          </h1>

          <p className={`text-xs sm:text-sm mt-1 ${mutedText}`}>
            Monitor internship activity, applications, evaluations, and document
            processing across the system.
          </p>
        </div>

        {/* ===================================================
            REPORT NAVIGATION
        =================================================== */}

        <div
          className={`border rounded-xl p-1.5 mb-6 flex flex-wrap gap-1 ${cardClass}`}
        >
          {reportTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveReport(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] sm:text-xs font-semibold transition ${
                activeReport === tab.id
                  ? darkMode
                    ? "bg-white text-slate-900"
                    : "bg-slate-800 text-white"
                  : darkMode
                  ? "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ===================================================
            OVERVIEW
        =================================================== */}

        {activeReport === "overview" && (
          <>
            {/* STAT CARDS */}

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
              {overviewCards.map((card) => (
                <div
                  key={card.label}
                  className={`border rounded-xl p-4 ${cardClass}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className={`text-[10px] font-medium ${mutedText}`}>
                        {card.label}
                      </p>

                      <p className="text-2xl sm:text-3xl font-black mt-2">
                        {card.value}
                      </p>
                    </div>

                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg ${getAccentClasses(
                        card.accent
                      )}`}
                    >
                      {card.icon}
                    </div>
                  </div>

                  <p className={`text-[9px] mt-3 ${mutedText}`}>
                    {card.description}
                  </p>
                </div>
              ))}
            </div>

            {/* APPLICATION + INTERNSHIP */}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
              {/* APPLICATION SUMMARY */}

              <div className={`border rounded-xl p-5 ${cardClass}`}>
                <div className="mb-5">
                  <h2 className="text-sm font-bold">Application Summary</h2>

                  <p className={`text-[10px] mt-1 ${mutedText}`}>
                    Current application distribution
                  </p>
                </div>

                <div className="space-y-4">
                  <ReportProgress
                    label="Pending Review"
                    value={reportData.pendingApplications.length}
                    total={state.applications.length}
                    darkMode={darkMode}
                    color="blue"
                  />

                  <ReportProgress
                    label="Approved"
                    value={reportData.approvedApplications.length}
                    total={state.applications.length}
                    darkMode={darkMode}
                    color="emerald"
                  />

                  <ReportProgress
                    label="Rejected"
                    value={reportData.rejectedApplications.length}
                    total={state.applications.length}
                    darkMode={darkMode}
                    color="red"
                  />
                </div>
              </div>

              {/* INTERNSHIP SUMMARY */}

              <div className={`border rounded-xl p-5 ${cardClass}`}>
                <div className="mb-5">
                  <h2 className="text-sm font-bold">Internship Summary</h2>

                  <p className={`text-[10px] mt-1 ${mutedText}`}>
                    Current assignment status
                  </p>
                </div>

                <div className="space-y-4">
                  <ReportProgress
                    label="Pending Deployment"
                    value={reportData.pendingAssignments.length}
                    total={state.assignments.length}
                    darkMode={darkMode}
                    color="amber"
                  />

                  <ReportProgress
                    label="Active"
                    value={reportData.activeInternships.length}
                    total={state.assignments.length}
                    darkMode={darkMode}
                    color="blue"
                  />

                  <ReportProgress
                    label="Completed"
                    value={reportData.completedInternships.length}
                    total={state.assignments.length}
                    darkMode={darkMode}
                    color="emerald"
                  />
                </div>
              </div>
            </div>

            {/* SYSTEM SUMMARY */}

            <div className={`border rounded-xl p-5 ${cardClass}`}>
              <div className="mb-4">
                <h2 className="text-sm font-bold">Shared System Data</h2>

                <p className={`text-[10px] mt-1 ${mutedText}`}>
                  Current record counts from the shared mock store.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <SummaryItem
                  label="Users"
                  value={state.users.length}
                  darkMode={darkMode}
                />

                <SummaryItem
                  label="Students"
                  value={state.students.length}
                  darkMode={darkMode}
                />

                <SummaryItem
                  label="Faculty"
                  value={state.faculty.length}
                  darkMode={darkMode}
                />

                <SummaryItem
                  label="Companies"
                  value={state.companies.length}
                  darkMode={darkMode}
                />

                <SummaryItem
                  label="Opportunities"
                  value={state.opportunities.length}
                  darkMode={darkMode}
                />

                <SummaryItem
                  label="Assignments"
                  value={state.assignments.length}
                  darkMode={darkMode}
                />
              </div>
            </div>
          </>
        )}

        {/* ===================================================
            APPLICATION REPORT
        =================================================== */}

        {activeReport === "applications" && (
          <ReportPanel
            title="Application Report"
            description="Overview of internship application activity."
            darkMode={darkMode}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricBox
                label="Total Applications"
                value={state.applications.length}
                darkMode={darkMode}
              />

              <MetricBox
                label="Pending"
                value={reportData.pendingApplications.length}
                darkMode={darkMode}
              />

              <MetricBox
                label="Approved"
                value={reportData.approvedApplications.length}
                darkMode={darkMode}
              />

              <MetricBox
                label="Rejected"
                value={reportData.rejectedApplications.length}
                darkMode={darkMode}
              />
            </div>

            <div className="mt-6 space-y-3">
              {state.applications.length === 0 ? (
                <EmptyState
                  message="No applications have been recorded yet."
                  darkMode={darkMode}
                />
              ) : (
                state.applications.map((application) => {
                  const student = state.students.find(
                    (item) => item.id === application.studentId
                  );

                  const opportunity = state.opportunities.find(
                    (item) => item.id === application.opportunityId
                  );

                  return (
                    <div
                      key={application.id}
                      className={`border rounded-lg p-4 ${
                        darkMode
                          ? "border-slate-700 bg-slate-950"
                          : "border-slate-200 bg-slate-50"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold">{application.id}</p>

                          <p className="text-xs mt-1">
                            {student?.fullName || "Unknown Student"}
                          </p>

                          <p className={`text-[10px] mt-1 ${mutedText}`}>
                            {opportunity?.title || "Unknown Opportunity"}
                          </p>
                        </div>

                        <StatusBadge
                          status={application.status}
                          darkMode={darkMode}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ReportPanel>
        )}

        {/* ===================================================
            INTERNSHIP REPORT
        =================================================== */}

        {activeReport === "internships" && (
          <ReportPanel
            title="Internship Report"
            description="Overview of student internship assignments."
            darkMode={darkMode}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricBox
                label="Total Assignments"
                value={state.assignments.length}
                darkMode={darkMode}
              />

              <MetricBox
                label="Pending Deployment"
                value={reportData.pendingAssignments.length}
                darkMode={darkMode}
              />

              <MetricBox
                label="Active"
                value={reportData.activeInternships.length}
                darkMode={darkMode}
              />

              <MetricBox
                label="Completed"
                value={reportData.completedInternships.length}
                darkMode={darkMode}
              />
            </div>

            <div className="mt-6 space-y-3">
              {state.assignments.length === 0 ? (
                <EmptyState
                  message="No internship assignments have been created yet."
                  darkMode={darkMode}
                />
              ) : (
                state.assignments.map((assignment) => {
                  const student = state.students.find(
                    (item) => item.id === assignment.studentId
                  );

                  const company = state.companies.find(
                    (item) => item.id === assignment.companyId
                  );

                  return (
                    <div
                      key={assignment.id}
                      className={`border rounded-lg p-4 ${
                        darkMode
                          ? "border-slate-700 bg-slate-950"
                          : "border-slate-200 bg-slate-50"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold">{assignment.id}</p>

                          <p className="text-xs mt-1">
                            {student?.fullName || "Unknown Student"}
                          </p>

                          <p className={`text-[10px] mt-1 ${mutedText}`}>
                            {company?.name || "Unknown Company"}
                          </p>
                        </div>

                        <StatusBadge
                          status={assignment.status}
                          darkMode={darkMode}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ReportPanel>
        )}

        {/* ===================================================
            EVALUATION REPORT
        =================================================== */}

        {activeReport === "evaluations" && (
          <ReportPanel
            title="Evaluation Report"
            description="Monitor evaluations submitted by students and company supervisors."
            darkMode={darkMode}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricBox
                label="Total Evaluations"
                value={state.evaluations.length}
                darkMode={darkMode}
              />

              <MetricBox
                label="Company → Student"
                value={reportData.companyToStudentEvaluations.length}
                darkMode={darkMode}
              />

              <MetricBox
                label="Student → Company"
                value={reportData.studentToCompanyEvaluations.length}
                darkMode={darkMode}
              />

              <MetricBox
                label="Submitted"
                value={reportData.submittedEvaluations.length}
                darkMode={darkMode}
              />
            </div>

            <div className="mt-6">
              <div
                className={`border rounded-lg p-4 ${
                  darkMode
                    ? "border-slate-700 bg-slate-950"
                    : "border-slate-200 bg-slate-50"
                }`}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <p className={`text-[10px] ${mutedText}`}>
                      Company Supervisor → Student
                    </p>

                    <p className="text-2xl font-black mt-1">
                      {reportData.companyToStudentEvaluations.length}
                    </p>

                    <p className={`text-[9px] mt-1 ${mutedText}`}>
                      Intern performance evaluations
                    </p>
                  </div>

                  <div>
                    <p className={`text-[10px] ${mutedText}`}>
                      Student → Company
                    </p>

                    <p className="text-2xl font-black mt-1">
                      {reportData.studentToCompanyEvaluations.length}
                    </p>

                    <p className={`text-[9px] mt-1 ${mutedText}`}>
                      Company and internship experience evaluations
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </ReportPanel>
        )}

        {/* ===================================================
            DOCUMENT REPORT
        =================================================== */}

        {activeReport === "documents" && (
          <ReportPanel
            title="Document Report"
            description="Monitor student document submissions and review activity."
            darkMode={darkMode}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricBox
                label="Total Documents"
                value={state.documents.length}
                darkMode={darkMode}
              />

              <MetricBox
                label="Pending Review"
                value={reportData.pendingDocuments.length}
                darkMode={darkMode}
              />

              <MetricBox
                label="Approved"
                value={reportData.approvedDocuments.length}
                darkMode={darkMode}
              />

              <MetricBox
                label="Needs Revision"
                value={reportData.needsRevisionDocuments.length}
                darkMode={darkMode}
              />
            </div>

            <div className="mt-6">
              {state.documents.length === 0 ? (
                <EmptyState
                  message="No student documents have been submitted yet."
                  darkMode={darkMode}
                />
              ) : (
                <div className="space-y-3">
                  {state.documents.map((document) => {
                    const student = state.students.find(
                      (item) => item.id === document.studentId
                    );

                    const documentType = state.documentTypes.find(
                      (item) => item.id === document.documentTypeId
                    );

                    return (
                      <div
                        key={document.id}
                        className={`border rounded-lg p-4 ${
                          darkMode
                            ? "border-slate-700 bg-slate-950"
                            : "border-slate-200 bg-slate-50"
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div>
                            <p className="text-xs font-bold">
                              {document.fileName}
                            </p>

                            <p className="text-[10px] mt-1">
                              {student?.fullName || "Unknown Student"}
                            </p>

                            <p className={`text-[9px] mt-1 ${mutedText}`}>
                              {documentType?.name || "Unknown Document Type"}
                            </p>
                          </div>

                          <StatusBadge
                            status={document.status}
                            darkMode={darkMode}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </ReportPanel>
        )}
      </div>
    </div>
  );
}

// =============================================================
// REPORT PANEL
// =============================================================

function ReportPanel({ title, description, darkMode, children }) {
  return (
    <div
      className={`border rounded-xl p-5 ${
        darkMode
          ? "bg-slate-900 border-slate-700 text-slate-100"
          : "bg-white border-slate-200 text-slate-900"
      }`}
    >
      <div className="mb-5">
        <h2 className="text-base font-bold">{title}</h2>

        <p
          className={`text-[10px] mt-1 ${
            darkMode ? "text-slate-400" : "text-slate-500"
          }`}
        >
          {description}
        </p>
      </div>

      {children}
    </div>
  );
}

// =============================================================
// METRIC BOX
// =============================================================

function MetricBox({ label, value, darkMode }) {
  return (
    <div
      className={`border rounded-lg p-4 ${
        darkMode
          ? "bg-slate-950 border-slate-700"
          : "bg-slate-50 border-slate-200"
      }`}
    >
      <p
        className={`text-[10px] ${
          darkMode ? "text-slate-400" : "text-slate-500"
        }`}
      >
        {label}
      </p>

      <p className="text-2xl font-black mt-1">{value}</p>
    </div>
  );
}

// =============================================================
// SUMMARY ITEM
// =============================================================

function SummaryItem({ label, value, darkMode }) {
  return (
    <div
      className={`rounded-lg p-3 ${darkMode ? "bg-slate-800" : "bg-slate-50"}`}
    >
      <p
        className={`text-[9px] ${
          darkMode ? "text-slate-400" : "text-slate-500"
        }`}
      >
        {label}
      </p>

      <p className="text-lg font-black mt-1">{value}</p>
    </div>
  );
}

// =============================================================
// PROGRESS
// =============================================================

function ReportProgress({ label, value, total, darkMode, color = "blue" }) {
  const percentage = total ? Math.round((value / total) * 100) : 0;

  const colorClasses = {
    blue: "bg-blue-500",
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    red: "bg-red-500",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span
          className={`text-[10px] font-medium ${
            darkMode ? "text-slate-300" : "text-slate-600"
          }`}
        >
          {label}
        </span>

        <span className="text-[10px] font-bold">{value}</span>
      </div>

      <div
        className={`h-2 rounded-full overflow-hidden ${
          darkMode ? "bg-slate-800" : "bg-slate-100"
        }`}
      >
        <div
          className={`h-full rounded-full transition-all ${colorClasses[color]}`}
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>

      <p
        className={`text-[8px] mt-1 ${
          darkMode ? "text-slate-500" : "text-slate-400"
        }`}
      >
        {percentage}% of total
      </p>
    </div>
  );
}

// =============================================================
// STATUS BADGE
// =============================================================

function StatusBadge({ status, darkMode }) {
  let classes = "";

  switch (status) {
    case STATUS.application.APPROVED:
    case STATUS.assignment.COMPLETED:
    case STATUS.document.APPROVED:
    case STATUS.evaluation.FINALIZED:
      classes = darkMode
        ? "bg-emerald-950/40 text-emerald-400"
        : "bg-emerald-50 text-emerald-700";
      break;

    case STATUS.assignment.ACTIVE:
    case STATUS.application.SUBMITTED:
    case STATUS.evaluation.SUBMITTED:
      classes = darkMode
        ? "bg-blue-950/40 text-blue-400"
        : "bg-blue-50 text-blue-700";
      break;

    case STATUS.document.PENDING_REVIEW:
    case STATUS.assignment.PENDING:
    case STATUS.application.UNDER_REVIEW:
    case STATUS.application.INFO_REQUESTED:
      classes = darkMode
        ? "bg-amber-950/40 text-amber-400"
        : "bg-amber-50 text-amber-700";
      break;

    case STATUS.application.REJECTED:
    case STATUS.document.NEEDS_REVISION:
      classes = darkMode
        ? "bg-red-950/40 text-red-400"
        : "bg-red-50 text-red-700";
      break;

    default:
      classes = darkMode
        ? "bg-slate-800 text-slate-300"
        : "bg-slate-100 text-slate-600";
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-bold ${classes}`}
    >
      {status}
    </span>
  );
}

// =============================================================
// EMPTY STATE
// =============================================================

function EmptyState({ message, darkMode }) {
  return (
    <div
      className={`border rounded-lg p-8 text-center ${
        darkMode
          ? "border-slate-700 bg-slate-950"
          : "border-slate-200 bg-slate-50"
      }`}
    >
      <div className="text-2xl mb-2">📊</div>

      <p
        className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}
      >
        {message}
      </p>
    </div>
  );
}
