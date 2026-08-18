import React, { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { STATUS, useMockStore } from "../../data/mockStore.jsx";

export default function Documents() {
  const { darkMode } = useOutletContext();

  const { state, reviewDocument, deployAssignment } = useMockStore();

  const facultyId = state.currentUser?.profileId;

  const [selectedDocument, setSelectedDocument] = useState(null);

  const card = darkMode
    ? "bg-slate-900 border-slate-700"
    : "bg-white border-slate-200";

  const mutedText = darkMode ? "text-slate-400" : "text-slate-500";

  /*
   * =========================================================
   * ONLY SHOW DOCUMENTS BELONGING TO THIS FACULTY
   * =========================================================
   */

  const documents = state.documents.filter(
    (item) => item.reviewerId === facultyId
  );

  /*
   * =========================================================
   * GROUP DOCUMENTS BY STUDENT
   * =========================================================
   */

  const studentGroups = useMemo(() => {
    const groups = {};

    documents.forEach((document) => {
      if (!groups[document.studentId]) {
        groups[document.studentId] = [];
      }

      groups[document.studentId].push(document);
    });

    return Object.entries(groups).map(([studentId, studentDocuments]) => {
      const student = state.students.find((item) => item.id === studentId);

      const assignment = state.assignments.find(
        (item) => item.id === studentDocuments[0]?.assignmentId
      );

      const requiredTypes = state.documentTypes.filter((item) => item.required);

      const approvedRequiredDocuments = studentDocuments.filter((document) => {
        const type = state.documentTypes.find(
          (item) => item.id === document.documentTypeId
        );

        return type?.required && document.status === STATUS.document.APPROVED;
      });

      const allRequiredDocumentsApproved =
        requiredTypes.length > 0 &&
        approvedRequiredDocuments.length === requiredTypes.length;

      const pendingDocuments = studentDocuments.filter(
        (document) =>
          document.status === STATUS.document.PENDING_REVIEW ||
          document.status === STATUS.document.SUBMITTED
      );

      const needsRevision = studentDocuments.filter(
        (document) => document.status === STATUS.document.NEEDS_REVISION
      );

      /*
       * =====================================================
       * ASSIGNMENT STATUS
       * =====================================================
       */

      const deployed = assignment?.status === STATUS.assignment.ACTIVE;

      const completed = assignment?.status === STATUS.assignment.COMPLETED;

      const suspended = assignment?.status === STATUS.assignment.SUSPENDED;

      const terminated = assignment?.status === STATUS.assignment.TERMINATED;

      /*
       * Deployment is finished/unavailable when the
       * assignment is already Active, Completed, Suspended,
       * or Terminated.
       */

      const deploymentFinished =
        deployed || completed || suspended || terminated;

      return {
        studentId,
        student,
        assignment,
        documents: studentDocuments,
        requiredCount: requiredTypes.length,
        approvedRequiredCount: approvedRequiredDocuments.length,
        pendingDocuments,
        needsRevision,
        allRequiredDocumentsApproved,
        deployed,
        completed,
        suspended,
        terminated,
        deploymentFinished,
      };
    });
  }, [documents, state.students, state.assignments, state.documentTypes]);

  /*
   * =========================================================
   * APPROVE DOCUMENT
   * =========================================================
   */

  const handleApprove = (document) => {
    reviewDocument(
      document.id,
      STATUS.document.APPROVED,
      "Verified by faculty adviser."
    );

    setSelectedDocument(null);
  };

  /*
   * =========================================================
   * REQUEST REVISION
   * =========================================================
   */

  const handleRevision = (document) => {
    reviewDocument(
      document.id,
      STATUS.document.NEEDS_REVISION,
      "Please upload a clearer or updated document."
    );

    setSelectedDocument(null);
  };

  /*
   * =========================================================
   * DEPLOY INTERN
   * =========================================================
   */

  const handleDeploy = (group) => {
    if (!group.assignment) {
      alert("No internship assignment found for this student.");
      return;
    }

    if (!group.allRequiredDocumentsApproved) {
      alert(
        "All required documents must be approved before this intern can be deployed."
      );
      return;
    }

    /*
     * Prevent deployment if the internship has already
     * reached a final/current state.
     */

    if (group.deploymentFinished) {
      return;
    }

    deployAssignment(group.assignment.id);
  };

  /*
   * =========================================================
   * STATUS STYLE
   * =========================================================
   */

  const getStatusClass = (status) => {
    switch (status) {
      case STATUS.document.APPROVED:
        return darkMode
          ? "bg-emerald-950 text-emerald-400 border-emerald-900"
          : "bg-emerald-50 text-emerald-700 border-emerald-200";

      case STATUS.document.NEEDS_REVISION:
        return darkMode
          ? "bg-red-950 text-red-400 border-red-900"
          : "bg-red-50 text-red-700 border-red-200";

      case STATUS.document.PENDING_REVIEW:
      case STATUS.document.SUBMITTED:
        return darkMode
          ? "bg-amber-950 text-amber-400 border-amber-900"
          : "bg-amber-50 text-amber-700 border-amber-200";

      default:
        return darkMode
          ? "bg-slate-800 text-slate-300 border-slate-700"
          : "bg-slate-50 text-slate-600 border-slate-200";
    }
  };

  /*
   * =========================================================
   * SUMMARY COUNTS
   * =========================================================
   */

  const totalDocuments = documents.length;

  const pendingDocuments = documents.filter(
    (item) =>
      item.status === STATUS.document.PENDING_REVIEW ||
      item.status === STATUS.document.SUBMITTED
  ).length;

  const approvedDocuments = documents.filter(
    (item) => item.status === STATUS.document.APPROVED
  ).length;

  const readyForDeployment = studentGroups.filter(
    (group) => group.allRequiredDocumentsApproved && !group.deploymentFinished
  ).length;

  /*
   * =========================================================
   * PAGE
   * =========================================================
   */

  return (
    <div
      className={`p-5 md:p-6 lg:p-8 max-w-[1200px] mx-auto ${
        darkMode ? "text-slate-100" : "text-slate-900"
      }`}
    >
      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <div className="mb-6">
        <p className="text-xs uppercase tracking-widest font-bold text-slate-400">
          Faculty Adviser Portal
        </p>

        <h1 className="text-2xl font-black">Document Verification</h1>

        <p className={`text-sm mt-1 ${mutedText}`}>
          Review all internship requirements before deploying students to their
          assigned companies.
        </p>
      </div>

      {/* =====================================================
          SUMMARY
      ===================================================== */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className={`border rounded-2xl p-4 ${card}`}>
          <p className={`text-xs font-semibold ${mutedText}`}>
            Submitted Documents
          </p>

          <p className="text-2xl font-black mt-1">{totalDocuments}</p>
        </div>

        <div className={`border rounded-2xl p-4 ${card}`}>
          <p className={`text-xs font-semibold ${mutedText}`}>Pending Review</p>

          <p className="text-2xl font-black mt-1">{pendingDocuments}</p>
        </div>

        <div className={`border rounded-2xl p-4 ${card}`}>
          <p className={`text-xs font-semibold ${mutedText}`}>
            Approved Documents
          </p>

          <p className="text-2xl font-black mt-1">{approvedDocuments}</p>
        </div>

        <div className={`border rounded-2xl p-4 ${card}`}>
          <p className={`text-xs font-semibold ${mutedText}`}>
            Ready for Deployment
          </p>

          <p className="text-2xl font-black mt-1">{readyForDeployment}</p>
        </div>
      </div>

      {/* =====================================================
          STUDENT DOCUMENT GROUPS
      ===================================================== */}

      <section className={`border rounded-2xl overflow-hidden ${card}`}>
        <div
          className={`px-5 py-4 border-b ${
            darkMode ? "border-slate-700" : "border-slate-200"
          }`}
        >
          <h2 className="font-bold text-sm">Student Document Verification</h2>

          <p className={`text-xs mt-1 ${mutedText}`}>
            All required documents must be approved before the student can be
            deployed to the company.
          </p>
        </div>

        {studentGroups.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-3xl mb-3">📄</div>

            <p className="font-semibold">No submitted documents</p>

            <p className={`text-sm mt-1 ${mutedText}`}>
              Students will appear here after they submit their internship
              requirements.
            </p>
          </div>
        ) : (
          <div
            className={`divide-y ${
              darkMode ? "divide-slate-700" : "divide-slate-200"
            }`}
          >
            {studentGroups.map((group) => {
              const company = state.companies.find(
                (item) => item.id === group.assignment?.companyId
              );

              return (
                <div
                  key={group.studentId}
                  className={`p-5 ${
                    darkMode ? "hover:bg-slate-800/30" : "hover:bg-slate-50"
                  }`}
                >
                  {/* =================================================
                      STUDENT HEADER
                  ================================================= */}

                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-black">
                          {group.student?.fullName || "Unknown Student"}
                        </h3>

                        {group.completed ? (
                          <span className="px-2 py-1 rounded-full border text-[10px] font-bold bg-purple-50 text-purple-700 border-purple-200">
                            COMPLETED
                          </span>
                        ) : group.deployed ? (
                          <span className="px-2 py-1 rounded-full border text-[10px] font-bold bg-emerald-50 text-emerald-700 border-emerald-200">
                            DEPLOYED
                          </span>
                        ) : group.suspended ? (
                          <span className="px-2 py-1 rounded-full border text-[10px] font-bold bg-amber-50 text-amber-700 border-amber-200">
                            SUSPENDED
                          </span>
                        ) : group.terminated ? (
                          <span className="px-2 py-1 rounded-full border text-[10px] font-bold bg-red-50 text-red-700 border-red-200">
                            TERMINATED
                          </span>
                        ) : group.allRequiredDocumentsApproved ? (
                          <span className="px-2 py-1 rounded-full border text-[10px] font-bold bg-blue-50 text-blue-700 border-blue-200">
                            READY FOR DEPLOYMENT
                          </span>
                        ) : group.needsRevision.length > 0 ? (
                          <span className="px-2 py-1 rounded-full border text-[10px] font-bold bg-red-50 text-red-700 border-red-200">
                            REVISION REQUIRED
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-full border text-[10px] font-bold bg-amber-50 text-amber-700 border-amber-200">
                            UNDER REVIEW
                          </span>
                        )}
                      </div>

                      <p className={`text-xs mt-1 ${mutedText}`}>
                        {group.student?.studentId || group.studentId}
                      </p>

                      {group.assignment && (
                        <p className={`text-xs mt-1 ${mutedText}`}>
                          Assignment: {group.assignment.id}
                          {company?.name ? ` · ${company.name}` : ""}
                        </p>
                      )}
                    </div>

                    {/* =================================================
                        DOCUMENT COMPLETION
                    ================================================= */}

                    <div
                      className={`border rounded-xl px-4 py-3 min-w-[220px] ${
                        darkMode
                          ? "bg-slate-800 border-slate-700"
                          : "bg-slate-50 border-slate-200"
                      }`}
                    >
                      <p
                        className={`text-[10px] uppercase tracking-wide font-bold ${mutedText}`}
                      >
                        Required Documents
                      </p>

                      <p className="text-sm font-black mt-1">
                        {group.approvedRequiredCount} / {group.requiredCount}{" "}
                        approved
                      </p>

                      <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 mt-2 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 transition-all"
                          style={{
                            width: `${
                              group.requiredCount
                                ? Math.min(
                                    100,
                                    (group.approvedRequiredCount /
                                      group.requiredCount) *
                                      100
                                  )
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* =================================================
                      DOCUMENTS
                  ================================================= */}

                  <div className="mt-5 space-y-3">
                    {group.documents.map((document) => {
                      const type = state.documentTypes.find(
                        (item) => item.id === document.documentTypeId
                      );

                      const isApproved =
                        document.status === STATUS.document.APPROVED;

                      return (
                        <div
                          key={document.id}
                          className={`border rounded-xl p-4 ${
                            darkMode
                              ? "border-slate-700 bg-slate-800/50"
                              : "border-slate-200 bg-slate-50"
                          }`}
                        >
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            {/* DOCUMENT INFO */}

                            <div className="flex items-start gap-3 min-w-0">
                              <div
                                className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                                  darkMode ? "bg-slate-700" : "bg-white"
                                }`}
                              >
                                📄
                              </div>

                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="font-bold text-sm">
                                    {type?.name || "Unknown Document"}
                                  </p>

                                  {type?.required && (
                                    <span className="text-[10px] font-bold text-red-500">
                                      REQUIRED
                                    </span>
                                  )}

                                  <span
                                    className={`px-2 py-1 rounded-full border text-[10px] font-bold ${getStatusClass(
                                      document.status
                                    )}`}
                                  >
                                    {document.status}
                                  </span>
                                </div>

                                <p
                                  className={`text-xs mt-1 truncate ${mutedText}`}
                                >
                                  {document.fileName}
                                </p>

                                <p className={`text-[10px] mt-1 ${mutedText}`}>
                                  Version {document.version} · {document.id}
                                </p>
                              </div>
                            </div>

                            {/* ACTIONS */}

                            <div className="flex flex-wrap items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => setSelectedDocument(document)}
                                className={`px-3 py-2 rounded-lg border text-xs font-semibold transition ${
                                  darkMode
                                    ? "border-slate-600 hover:bg-slate-700"
                                    : "border-slate-300 hover:bg-white"
                                }`}
                              >
                                👁 View Document
                              </button>

                              {!isApproved && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleApprove(document)}
                                    className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition"
                                  >
                                    ✓ Approve
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleRevision(document)}
                                    className={`px-3 py-2 rounded-lg border text-xs font-semibold transition ${
                                      darkMode
                                        ? "border-red-900 text-red-400 hover:bg-red-950"
                                        : "border-red-200 text-red-600 hover:bg-red-50"
                                    }`}
                                  >
                                    ↻ Request Revision
                                  </button>
                                </>
                              )}

                              {isApproved && (
                                <span className="text-xs font-semibold text-emerald-600">
                                  ✓ Verified
                                </span>
                              )}
                            </div>
                          </div>

                          {/* REVIEW COMMENT */}

                          {document.reviewComment && (
                            <div
                              className={`mt-3 p-3 rounded-lg text-xs ${
                                darkMode
                                  ? "bg-slate-900 text-slate-400"
                                  : "bg-white text-slate-500"
                              }`}
                            >
                              <span className="font-bold">Review comment:</span>{" "}
                              {document.reviewComment}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* =================================================
                      DEPLOYMENT ACTION
                  ================================================= */}

                  <div
                    className={`mt-5 pt-5 border-t flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${
                      darkMode ? "border-slate-700" : "border-slate-200"
                    }`}
                  >
                    <div>
                      {group.completed ? (
                        <>
                          <p className="text-sm font-bold text-purple-600">
                            ✓ Internship completed
                          </p>

                          <p className={`text-xs mt-1 ${mutedText}`}>
                            This student's internship has already been
                            completed. Deployment is no longer available.
                          </p>
                        </>
                      ) : group.deployed ? (
                        <>
                          <p className="text-sm font-bold text-emerald-600">
                            ✓ Intern deployed successfully
                          </p>

                          <p className={`text-xs mt-1 ${mutedText}`}>
                            This student is now visible to the assigned company.
                          </p>
                        </>
                      ) : group.suspended ? (
                        <>
                          <p className="text-sm font-bold text-amber-600">
                            Internship suspended
                          </p>

                          <p className={`text-xs mt-1 ${mutedText}`}>
                            Deployment is unavailable while this internship is
                            suspended.
                          </p>
                        </>
                      ) : group.terminated ? (
                        <>
                          <p className="text-sm font-bold text-red-600">
                            Internship terminated
                          </p>

                          <p className={`text-xs mt-1 ${mutedText}`}>
                            This internship has been terminated. Deployment is
                            no longer available.
                          </p>
                        </>
                      ) : group.allRequiredDocumentsApproved ? (
                        <>
                          <p className="text-sm font-bold text-blue-600">
                            All required documents approved
                          </p>

                          <p className={`text-xs mt-1 ${mutedText}`}>
                            This intern is ready to be deployed to the company.
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-semibold">
                            Deployment unavailable
                          </p>

                          <p className={`text-xs mt-1 ${mutedText}`}>
                            Approve all required documents before deploying this
                            intern.
                          </p>
                        </>
                      )}
                    </div>

                    {/* =================================================
                        DEPLOY BUTTON
                        Only appears when deployment is still possible
                    ================================================= */}

                    {!group.deploymentFinished && (
                      <button
                        type="button"
                        disabled={!group.allRequiredDocumentsApproved}
                        onClick={() => handleDeploy(group)}
                        className={`px-5 py-2.5 rounded-lg text-xs font-bold transition ${
                          group.allRequiredDocumentsApproved
                            ? "bg-blue-600 hover:bg-blue-700 text-white"
                            : darkMode
                            ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                            : "bg-slate-100 text-slate-400 cursor-not-allowed"
                        }`}
                      >
                        🚀 Deploy Intern
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* =====================================================
          DOCUMENT VIEWER MODAL
      ===================================================== */}

      {selectedDocument && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => setSelectedDocument(null)}
        >
          <div
            className={`w-full max-w-3xl max-h-[90vh] rounded-2xl border shadow-2xl overflow-hidden ${
              darkMode
                ? "bg-slate-900 border-slate-700"
                : "bg-white border-slate-200"
            }`}
            onClick={(event) => event.stopPropagation()}
          >
            {/* MODAL HEADER */}

            <div
              className={`px-5 py-4 border-b flex items-center justify-between ${
                darkMode ? "border-slate-700" : "border-slate-200"
              }`}
            >
              <div className="min-w-0">
                <h2 className="font-bold truncate">
                  {selectedDocument.fileName}
                </h2>

                <p className={`text-xs mt-1 ${mutedText}`}>Document Preview</p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedDocument(null)}
                className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg transition ${
                  darkMode ? "hover:bg-slate-800" : "hover:bg-slate-100"
                }`}
              >
                ×
              </button>
            </div>

            {/* DOCUMENT PREVIEW */}

            <div className="p-6 overflow-y-auto max-h-[65vh]">
              <div
                className={`min-h-[360px] rounded-xl border-2 border-dashed flex flex-col items-center justify-center text-center p-8 ${
                  darkMode
                    ? "border-slate-700 bg-slate-950"
                    : "border-slate-200 bg-slate-50"
                }`}
              >
                <div className="text-5xl mb-4">📄</div>

                <h3 className="font-bold text-lg">
                  {selectedDocument.fileName}
                </h3>

                <p className={`text-sm mt-2 max-w-md ${mutedText}`}>
                  The uploaded document will be displayed here for faculty
                  verification.
                </p>

                <p className={`text-xs mt-3 ${mutedText}`}>
                  Actual file preview will be enabled when document storage is
                  connected.
                </p>
              </div>

              {/* FILE DETAILS */}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
                <div
                  className={`p-3 rounded-lg ${
                    darkMode ? "bg-slate-800" : "bg-slate-50"
                  }`}
                >
                  <p className={`text-[10px] uppercase font-bold ${mutedText}`}>
                    Student
                  </p>

                  <p className="text-sm font-semibold mt-1">
                    {
                      state.students.find(
                        (student) => student.id === selectedDocument.studentId
                      )?.fullName
                    }
                  </p>
                </div>

                <div
                  className={`p-3 rounded-lg ${
                    darkMode ? "bg-slate-800" : "bg-slate-50"
                  }`}
                >
                  <p className={`text-[10px] uppercase font-bold ${mutedText}`}>
                    Document Type
                  </p>

                  <p className="text-sm font-semibold mt-1">
                    {
                      state.documentTypes.find(
                        (type) => type.id === selectedDocument.documentTypeId
                      )?.name
                    }
                  </p>
                </div>

                <div
                  className={`p-3 rounded-lg ${
                    darkMode ? "bg-slate-800" : "bg-slate-50"
                  }`}
                >
                  <p className={`text-[10px] uppercase font-bold ${mutedText}`}>
                    Version
                  </p>

                  <p className="text-sm font-semibold mt-1">
                    {selectedDocument.version}
                  </p>
                </div>

                <div
                  className={`p-3 rounded-lg ${
                    darkMode ? "bg-slate-800" : "bg-slate-50"
                  }`}
                >
                  <p className={`text-[10px] uppercase font-bold ${mutedText}`}>
                    Status
                  </p>

                  <p className="text-sm font-semibold mt-1">
                    {selectedDocument.status}
                  </p>
                </div>
              </div>
            </div>

            {/* MODAL ACTIONS */}

            {selectedDocument.status !== STATUS.document.APPROVED && (
              <div
                className={`px-5 py-4 border-t flex flex-col sm:flex-row justify-end gap-2 ${
                  darkMode ? "border-slate-700" : "border-slate-200"
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleRevision(selectedDocument)}
                  className={`px-4 py-2 rounded-lg border text-xs font-semibold ${
                    darkMode
                      ? "border-red-900 text-red-400 hover:bg-red-950"
                      : "border-red-200 text-red-600 hover:bg-red-50"
                  }`}
                >
                  Request Revision
                </button>

                <button
                  type="button"
                  onClick={() => handleApprove(selectedDocument)}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                >
                  Approve Document
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
