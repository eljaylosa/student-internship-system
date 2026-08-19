import React, { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";

export default function ManageDeployment() {
  const { darkMode } = useOutletContext();

  // =========================================================
  // DEMO DEPLOYMENT DATA
  // Independent page data for now.
  //
  // IMPORTANT:
  // The company below is ALREADY selected by the student
  // through their internship application.
  //
  // Registrar does NOT choose the company here.
  // =========================================================

  const [deploymentStudents, setDeploymentStudents] = useState([
    {
      id: "DEP-001",

      studentId: "2024-00125",
      studentName: "Juan Dela Cruz",
      studentEmail: "juan.delacruz@student.edu.ph",
      studentProgram: "BS Information Technology",
      studentYear: "3rd Year",

      internshipId: "INT-004",
      internshipTitle: "Web Development Intern",

      companyId: "COMP-001",
      companyName: "Tech Solutions Philippines",
      companyAddress: "Angeles City, Pampanga",
      companyContact: "Maria Santos",
      companyEmail: "hr@techsolutions.ph",

      applicationId: "APP-2026-001",
      applicationDate: "2026-08-10",

      documentStatus: "Approved",

      documents: [
        {
          name: "Resume / CV",
          status: "Approved",
        },
        {
          name: "Internship Application Form",
          status: "Approved",
        },
        {
          name: "Endorsement Letter",
          status: "Approved",
        },
        {
          name: "Medical Certificate",
          status: "Approved",
        },
        {
          name: "Parent/Guardian Consent",
          status: "Approved",
        },
      ],

      deploymentStatus: "Ready for Deployment",

      deployedAt: null,

      companyDecision: null,
      companyDecisionAt: null,
      companyRemarks: null,
    },

    {
      id: "DEP-002",

      studentId: "2024-00142",
      studentName: "Maria Clara Santos",
      studentEmail: "maria.santos@student.edu.ph",
      studentProgram: "BS Information Technology",
      studentYear: "3rd Year",

      internshipId: "INT-008",
      internshipTitle: "UI/UX Design Intern",

      companyId: "COMP-004",
      companyName: "Creative Digital Studio",
      companyAddress: "Clark Freeport Zone, Pampanga",
      companyContact: "John Reyes",
      companyEmail: "careers@creativedigital.ph",

      applicationId: "APP-2026-002",
      applicationDate: "2026-08-09",

      documentStatus: "Approved",

      documents: [
        {
          name: "Resume / CV",
          status: "Approved",
        },
        {
          name: "Internship Application Form",
          status: "Approved",
        },
        {
          name: "Endorsement Letter",
          status: "Approved",
        },
        {
          name: "Medical Certificate",
          status: "Approved",
        },
        {
          name: "Parent/Guardian Consent",
          status: "Approved",
        },
      ],

      deploymentStatus: "Deployed",

      deployedAt: "2026-08-15T09:30:00",

      companyDecision: null,
      companyDecisionAt: null,
      companyRemarks: null,
    },

    {
      id: "DEP-003",

      studentId: "2024-00167",
      studentName: "Carlos Miguel Reyes",
      studentEmail: "carlos.reyes@student.edu.ph",
      studentProgram: "BS Computer Science",
      studentYear: "3rd Year",

      internshipId: "INT-012",
      internshipTitle: "Software Development Intern",

      companyId: "COMP-007",
      companyName: "Innovate Systems Inc.",
      companyAddress: "Mabalacat City, Pampanga",
      companyContact: "Angela Cruz",
      companyEmail: "hr@innovatesystems.ph",

      applicationId: "APP-2026-003",
      applicationDate: "2026-08-07",

      documentStatus: "Approved",

      documents: [
        {
          name: "Resume / CV",
          status: "Approved",
        },
        {
          name: "Internship Application Form",
          status: "Approved",
        },
        {
          name: "Endorsement Letter",
          status: "Approved",
        },
        {
          name: "Medical Certificate",
          status: "Approved",
        },
        {
          name: "Parent/Guardian Consent",
          status: "Approved",
        },
      ],

      deploymentStatus: "Rejected by Company",

      deployedAt: "2026-08-12T10:00:00",

      companyDecision: "Rejected",
      companyDecisionAt: "2026-08-13T14:20:00",
      companyRemarks:
        "The company has decided not to proceed with the student's application.",
    },
  ]);

  // =========================================================
  // UI STATE
  // =========================================================

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [showDeployModal, setShowDeployModal] = useState(false);
  const [studentToDeploy, setStudentToDeploy] = useState(null);

  // =========================================================
  // FILTERED DATA
  // =========================================================

  const filteredStudents = useMemo(() => {
    return deploymentStudents.filter((student) => {
      const search = searchTerm.toLowerCase().trim();

      const matchesSearch =
        !search ||
        student.studentName.toLowerCase().includes(search) ||
        student.studentId.toLowerCase().includes(search) ||
        student.companyName.toLowerCase().includes(search) ||
        student.internshipTitle.toLowerCase().includes(search);

      const matchesStatus =
        statusFilter === "All" || student.deploymentStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [deploymentStudents, searchTerm, statusFilter]);

  // =========================================================
  // COUNTS
  // =========================================================

  const readyCount = deploymentStudents.filter(
    (student) => student.deploymentStatus === "Ready for Deployment"
  ).length;

  const deployedCount = deploymentStudents.filter(
    (student) => student.deploymentStatus === "Deployed"
  ).length;

  const rejectedCount = deploymentStudents.filter(
    (student) => student.deploymentStatus === "Rejected by Company"
  ).length;

  // =========================================================
  // DEPLOY STUDENT
  // =========================================================

  const openDeployModal = (student) => {
    setStudentToDeploy(student);
    setShowDeployModal(true);
  };

  const closeDeployModal = () => {
    setStudentToDeploy(null);
    setShowDeployModal(false);
  };

  const confirmDeployment = () => {
    if (!studentToDeploy) return;

    setDeploymentStudents((previous) =>
      previous.map((student) =>
        student.id === studentToDeploy.id
          ? {
              ...student,
              deploymentStatus: "Deployed",
              deployedAt: new Date().toISOString(),
            }
          : student
      )
    );

    setSelectedStudent(null);
    closeDeployModal();
  };

  // =========================================================
  // STATUS STYLING
  // =========================================================

  const getStatusClasses = (status) => {
    switch (status) {
      case "Ready for Deployment":
        return darkMode
          ? "bg-amber-950 text-amber-300 border-amber-900"
          : "bg-amber-50 text-amber-700 border-amber-200";

      case "Deployed":
        return darkMode
          ? "bg-blue-950 text-blue-300 border-blue-900"
          : "bg-blue-50 text-blue-700 border-blue-200";

      case "Rejected by Company":
        return darkMode
          ? "bg-red-950 text-red-300 border-red-900"
          : "bg-red-50 text-red-700 border-red-200";

      default:
        return darkMode
          ? "bg-slate-800 text-slate-300 border-slate-700"
          : "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  // =========================================================
  // FORMAT DATE
  // =========================================================

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleString([], {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  // =========================================================
  // THEME
  // =========================================================

  const pageText = darkMode ? "text-slate-100" : "text-slate-900";

  const card = darkMode
    ? "bg-slate-900 border-slate-700"
    : "bg-white border-slate-200";

  const secondaryText = darkMode ? "text-slate-400" : "text-slate-500";

  const input = darkMode
    ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500"
    : "bg-white border-slate-200 text-slate-900 placeholder-slate-400";

  // =========================================================
  // RETURN
  // =========================================================

  return (
    <div className={`p-5 md:p-6 lg:p-8 max-w-[1400px] mx-auto ${pageText}`}>
      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <div className="mb-7">
        <p className="text-xs uppercase tracking-widest font-bold text-slate-400">
          Registrar Portal
        </p>

        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mt-1">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">
              Manage Deployment
            </h1>

            <p className={`text-sm mt-2 max-w-2xl ${secondaryText}`}>
              Deploy students whose internship documents have been fully
              approved by the registrar. The student's selected company is
              already assigned from their internship application.
            </p>
          </div>
        </div>
      </div>

      {/* =====================================================
          SUMMARY CARDS
      ===================================================== */}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {/* READY */}

        <div className={`border rounded-2xl p-5 shadow-sm ${card}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-xs font-semibold ${secondaryText}`}>
                Ready for Deployment
              </p>

              <p className="text-3xl font-black mt-1">{readyCount}</p>

              <p className={`text-xs mt-1 ${secondaryText}`}>
                Awaiting registrar deployment
              </p>
            </div>

            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${
                darkMode
                  ? "bg-amber-950 text-amber-300"
                  : "bg-amber-50 text-amber-600"
              }`}
            >
              📤
            </div>
          </div>
        </div>

        {/* DEPLOYED */}

        <div className={`border rounded-2xl p-5 shadow-sm ${card}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-xs font-semibold ${secondaryText}`}>
                Deployed
              </p>

              <p className="text-3xl font-black mt-1">{deployedCount}</p>

              <p className={`text-xs mt-1 ${secondaryText}`}>
                Sent to companies
              </p>
            </div>

            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${
                darkMode
                  ? "bg-blue-950 text-blue-300"
                  : "bg-blue-50 text-blue-600"
              }`}
            >
              🚀
            </div>
          </div>
        </div>

        {/* REJECTED */}

        <div className={`border rounded-2xl p-5 shadow-sm ${card}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-xs font-semibold ${secondaryText}`}>
                Company Rejected
              </p>

              <p className="text-3xl font-black mt-1">{rejectedCount}</p>

              <p className={`text-xs mt-1 ${secondaryText}`}>
                Students needing new application
              </p>
            </div>

            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${
                darkMode ? "bg-red-950 text-red-300" : "bg-red-50 text-red-600"
              }`}
            >
              ⚠️
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          SEARCH / FILTER
      ===================================================== */}

      <section className={`border rounded-2xl shadow-sm mb-6 ${card}`}>
        <div className="p-4 md:p-5">
          <div className="flex flex-col md:flex-row gap-3">
            {/* SEARCH */}

            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm">
                🔍
              </span>

              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search student, ID, company, or internship..."
                className={`w-full pl-9 pr-4 py-3 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-blue-500/30 ${input}`}
              />
            </div>

            {/* STATUS */}

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`md:w-56 px-4 py-3 rounded-xl border text-sm outline-none ${input}`}
            >
              <option value="All">All Statuses</option>
              <option value="Ready for Deployment">Ready for Deployment</option>
              <option value="Deployed">Deployed</option>
              <option value="Rejected by Company">Rejected by Company</option>
            </select>
          </div>
        </div>
      </section>

      {/* =====================================================
          DEPLOYMENT TABLE
      ===================================================== */}

      <section
        className={`border rounded-2xl overflow-hidden shadow-sm ${card}`}
      >
        <div
          className={`px-5 py-4 border-b ${
            darkMode ? "border-slate-700" : "border-slate-200"
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-black">Students for Deployment</h2>

              <p className={`text-xs mt-1 ${secondaryText}`}>
                Students appear here after all required documents are approved.
              </p>
            </div>

            <span
              className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                darkMode
                  ? "bg-slate-800 text-slate-300"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {filteredStudents.length} Students
            </span>
          </div>
        </div>

        {filteredStudents.length === 0 ? (
          <div className="p-12 text-center">
            <div
              className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center text-3xl mb-4 ${
                darkMode ? "bg-slate-800" : "bg-slate-100"
              }`}
            >
              📭
            </div>

            <h3 className="font-bold text-sm">No students found</h3>

            <p className={`text-xs mt-1 ${secondaryText}`}>
              No deployment records match your current search or filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px]">
              <thead className={darkMode ? "bg-slate-800/70" : "bg-slate-50"}>
                <tr>
                  <th className="px-5 py-3 text-left text-[10px] uppercase tracking-wider font-bold text-slate-400">
                    Student
                  </th>

                  <th className="px-5 py-3 text-left text-[10px] uppercase tracking-wider font-bold text-slate-400">
                    Internship
                  </th>

                  <th className="px-5 py-3 text-left text-[10px] uppercase tracking-wider font-bold text-slate-400">
                    Selected Company
                  </th>

                  <th className="px-5 py-3 text-left text-[10px] uppercase tracking-wider font-bold text-slate-400">
                    Documents
                  </th>

                  <th className="px-5 py-3 text-left text-[10px] uppercase tracking-wider font-bold text-slate-400">
                    Status
                  </th>

                  <th className="px-5 py-3 text-right text-[10px] uppercase tracking-wider font-bold text-slate-400">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody
                className={`divide-y ${
                  darkMode ? "divide-slate-700" : "divide-slate-200"
                }`}
              >
                {filteredStudents.map((student) => (
                  <tr
                    key={student.id}
                    className={
                      darkMode ? "hover:bg-slate-800/60" : "hover:bg-slate-50"
                    }
                  >
                    {/* STUDENT */}

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${
                            darkMode
                              ? "bg-slate-800 text-slate-300"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {student.studentName
                            .split(" ")
                            .map((name) => name[0])
                            .slice(0, 2)
                            .join("")}
                        </div>

                        <div>
                          <p className="text-sm font-bold">
                            {student.studentName}
                          </p>

                          <p className={`text-[10px] mt-0.5 ${secondaryText}`}>
                            {student.studentId}
                          </p>

                          <p className={`text-[10px] ${secondaryText}`}>
                            {student.studentProgram}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* INTERNSHIP */}

                    <td className="px-5 py-4">
                      <p className="text-xs font-bold">
                        {student.internshipTitle}
                      </p>

                      <p className={`text-[10px] mt-1 ${secondaryText}`}>
                        {student.internshipId}
                      </p>

                      <p className={`text-[10px] ${secondaryText}`}>
                        Application: {student.applicationId}
                      </p>
                    </td>

                    {/* COMPANY */}

                    <td className="px-5 py-4">
                      <p className="text-xs font-bold">{student.companyName}</p>

                      <p className={`text-[10px] mt-1 ${secondaryText}`}>
                        {student.companyAddress}
                      </p>

                      <p
                        className={`text-[10px] mt-0.5 ${
                          darkMode ? "text-blue-400" : "text-blue-600"
                        }`}
                      >
                        Selected by student
                      </p>
                    </td>

                    {/* DOCUMENTS */}

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-1 rounded-md text-[10px] font-bold ${
                            darkMode
                              ? "bg-emerald-950 text-emerald-300"
                              : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          ✓ Approved
                        </span>

                        <span className={`text-[10px] ${secondaryText}`}>
                          {student.documents.length} files
                        </span>
                      </div>
                    </td>

                    {/* STATUS */}

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-lg border text-[10px] font-bold whitespace-nowrap ${getStatusClasses(
                          student.deploymentStatus
                        )}`}
                      >
                        {student.deploymentStatus}
                      </span>
                    </td>

                    {/* ACTION */}

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedStudent(student)}
                          className={`px-3 py-2 rounded-lg border text-xs font-semibold transition ${
                            darkMode
                              ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                              : "border-slate-200 text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          View
                        </button>

                        {student.deploymentStatus ===
                          "Ready for Deployment" && (
                          <button
                            type="button"
                            onClick={() => openDeployModal(student)}
                            className="px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition"
                          >
                            Deploy
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* =====================================================
          STUDENT DETAILS MODAL
      ===================================================== */}

      {selectedStudent && (
        <div
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedStudent(null)}
        >
          <div
            className={`w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border shadow-2xl ${card}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* HEADER */}

            <div
              className={`px-6 py-5 border-b flex items-start justify-between ${
                darkMode ? "border-slate-700" : "border-slate-200"
              }`}
            >
              <div>
                <p className="text-xs uppercase tracking-wider font-bold text-slate-400">
                  Deployment Record
                </p>

                <h2 className="text-xl font-black mt-1">
                  {selectedStudent.studentName}
                </h2>

                <p className={`text-xs mt-1 ${secondaryText}`}>
                  {selectedStudent.studentId}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className={`w-9 h-9 rounded-lg text-xl ${
                  darkMode
                    ? "hover:bg-slate-800 text-slate-400"
                    : "hover:bg-slate-100 text-slate-500"
                }`}
              >
                ×
              </button>
            </div>

            {/* CONTENT */}

            <div className="p-6 space-y-6">
              {/* STUDENT INFO */}

              <div>
                <h3 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-3">
                  Student Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <InfoItem
                    label="Full Name"
                    value={selectedStudent.studentName}
                    darkMode={darkMode}
                  />

                  <InfoItem
                    label="Student ID"
                    value={selectedStudent.studentId}
                    darkMode={darkMode}
                  />

                  <InfoItem
                    label="Email"
                    value={selectedStudent.studentEmail}
                    darkMode={darkMode}
                  />

                  <InfoItem
                    label="Program"
                    value={selectedStudent.studentProgram}
                    darkMode={darkMode}
                  />

                  <InfoItem
                    label="Year Level"
                    value={selectedStudent.studentYear}
                    darkMode={darkMode}
                  />

                  <InfoItem
                    label="Application ID"
                    value={selectedStudent.applicationId}
                    darkMode={darkMode}
                  />
                </div>
              </div>

              {/* INTERNSHIP */}

              <div>
                <h3 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-3">
                  Internship Application
                </h3>

                <div
                  className={`p-4 rounded-xl border ${
                    darkMode
                      ? "bg-slate-800 border-slate-700"
                      : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <p className="text-sm font-black">
                    {selectedStudent.internshipTitle}
                  </p>

                  <p className={`text-xs mt-1 ${secondaryText}`}>
                    Internship ID: {selectedStudent.internshipId}
                  </p>

                  <p className={`text-xs mt-1 ${secondaryText}`}>
                    Application Date:{" "}
                    {formatDate(selectedStudent.applicationDate)}
                  </p>
                </div>
              </div>

              {/* COMPANY */}

              <div>
                <h3 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-3">
                  Student's Selected Company
                </h3>

                <div
                  className={`p-4 rounded-xl border ${
                    darkMode
                      ? "bg-blue-950/30 border-blue-900"
                      : "bg-blue-50 border-blue-200"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div>
                      <p className="text-sm font-black">
                        {selectedStudent.companyName}
                      </p>

                      <p className={`text-xs mt-1 ${secondaryText}`}>
                        {selectedStudent.companyAddress}
                      </p>

                      <p className={`text-xs mt-1 ${secondaryText}`}>
                        Contact: {selectedStudent.companyContact}
                      </p>

                      <p className={`text-xs mt-1 ${secondaryText}`}>
                        {selectedStudent.companyEmail}
                      </p>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap ${
                        darkMode
                          ? "bg-blue-900 text-blue-300"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      Student Selected
                    </span>
                  </div>
                </div>
              </div>

              {/* DOCUMENTS */}

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs uppercase tracking-wider font-bold text-slate-400">
                    Approved Documents
                  </h3>

                  <span className="text-[10px] font-bold text-emerald-500">
                    All Approved
                  </span>
                </div>

                <div
                  className={`border rounded-xl overflow-hidden ${
                    darkMode ? "border-slate-700" : "border-slate-200"
                  }`}
                >
                  {selectedStudent.documents.map((document, index) => (
                    <div
                      key={document.name}
                      className={`flex items-center justify-between px-4 py-3 ${
                        index !== selectedStudent.documents.length - 1
                          ? darkMode
                            ? "border-b border-slate-700"
                            : "border-b border-slate-200"
                          : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm">📄</span>

                        <span className="text-xs font-semibold">
                          {document.name}
                        </span>
                      </div>

                      <span
                        className={`text-[10px] font-bold ${
                          darkMode ? "text-emerald-400" : "text-emerald-600"
                        }`}
                      >
                        ✓ {document.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CURRENT STATUS */}

              <div>
                <h3 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-3">
                  Deployment Status
                </h3>

                <span
                  className={`inline-flex px-3 py-2 rounded-xl border text-xs font-bold ${getStatusClasses(
                    selectedStudent.deploymentStatus
                  )}`}
                >
                  {selectedStudent.deploymentStatus}
                </span>

                {selectedStudent.deployedAt && (
                  <p className={`text-xs mt-2 ${secondaryText}`}>
                    Deployed on: {formatDate(selectedStudent.deployedAt)}
                  </p>
                )}

                {selectedStudent.companyDecision === "Rejected" && (
                  <div
                    className={`mt-4 p-4 rounded-xl border ${
                      darkMode
                        ? "bg-red-950/30 border-red-900"
                        : "bg-red-50 border-red-200"
                    }`}
                  >
                    <p className="text-xs font-bold text-red-500">
                      Company Rejected Application
                    </p>

                    <p className={`text-xs mt-1 ${secondaryText}`}>
                      {selectedStudent.companyRemarks}
                    </p>

                    <p className={`text-[10px] mt-2 ${secondaryText}`}>
                      Decision: {formatDate(selectedStudent.companyDecisionAt)}
                    </p>
                  </div>
                )}
              </div>

              {/* ACTIONS */}

              <div
                className={`pt-4 border-t flex flex-wrap justify-end gap-2 ${
                  darkMode ? "border-slate-700" : "border-slate-200"
                }`}
              >
                {selectedStudent.deploymentStatus ===
                  "Ready for Deployment" && (
                  <button
                    type="button"
                    onClick={() => {
                      openDeployModal(selectedStudent);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition"
                  >
                    Deploy Student
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedStudent(null)}
                  className={`px-5 py-2.5 rounded-xl border text-xs font-bold ${
                    darkMode
                      ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                      : "border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          DEPLOY CONFIRMATION MODAL
      ===================================================== */}

      {showDeployModal && studentToDeploy && (
        <div
          className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={closeDeployModal}
        >
          <div
            className={`w-full max-w-lg rounded-2xl border shadow-2xl ${card}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* HEADER */}

            <div
              className={`px-6 py-5 border-b ${
                darkMode ? "border-slate-700" : "border-slate-200"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl ${
                    darkMode
                      ? "bg-blue-950 text-blue-300"
                      : "bg-blue-50 text-blue-600"
                  }`}
                >
                  🚀
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider font-bold text-slate-400">
                    Confirm Deployment
                  </p>

                  <h2 className="text-lg font-black">Deploy Student</h2>
                </div>
              </div>
            </div>

            {/* CONTENT */}

            <div className="p-6">
              <p className={`text-sm leading-relaxed ${secondaryText}`}>
                You are about to deploy this student to the company selected in
                their internship application.
              </p>

              <div
                className={`mt-5 p-4 rounded-xl border ${
                  darkMode
                    ? "bg-slate-800 border-slate-700"
                    : "bg-slate-50 border-slate-200"
                }`}
              >
                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">
                      Student
                    </p>

                    <p className="text-sm font-bold mt-1">
                      {studentToDeploy.studentName}
                    </p>

                    <p className={`text-xs ${secondaryText}`}>
                      {studentToDeploy.studentId}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">
                      Internship
                    </p>

                    <p className="text-sm font-bold mt-1">
                      {studentToDeploy.internshipTitle}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">
                      Company
                    </p>

                    <p className="text-sm font-black mt-1">
                      {studentToDeploy.companyName}
                    </p>

                    <p className={`text-xs ${secondaryText}`}>
                      {studentToDeploy.companyAddress}
                    </p>
                  </div>
                </div>
              </div>

              <div
                className={`mt-4 p-3 rounded-xl text-xs ${
                  darkMode
                    ? "bg-amber-950/30 text-amber-300"
                    : "bg-amber-50 text-amber-700"
                }`}
              >
                <strong>What happens next?</strong>

                <p className="mt-1 leading-relaxed">
                  The selected company will receive a Deployment Request. The
                  company can then review this student's information and
                  documents and decide whether to accept or decline the
                  deployment.
                </p>
              </div>

              {/* BUTTONS */}

              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={closeDeployModal}
                  className={`px-4 py-2.5 rounded-xl border text-xs font-bold ${
                    darkMode
                      ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                      : "border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={confirmDeployment}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition"
                >
                  Confirm Deployment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =========================================================
// SMALL INFO COMPONENT
// =========================================================

function InfoItem({ label, value, darkMode }) {
  return (
    <div
      className={`p-3 rounded-xl border ${
        darkMode
          ? "bg-slate-800 border-slate-700"
          : "bg-slate-50 border-slate-200"
      }`}
    >
      <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
        {label}
      </p>

      <p className="text-xs font-semibold mt-1 break-words">{value || "—"}</p>
    </div>
  );
}
