import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";

const ManageApplications = () => {
  const { darkMode } = useOutletContext();

  // =========================================================
  // TEMPORARY DEPLOYED STUDENT DATA
  // FRONTEND ONLY - NO MOCKSTORE / BACKEND YET
  // =========================================================

  const [applications, setApplications] = useState([
    {
      id: "DEP-001",
      studentId: "2024-00125",
      studentName: "Juan Dela Cruz",
      email: "juan.delacruz@student.edu",
      phone: "+63 912 345 6789",
      course: "BS Information Technology",
      yearLevel: "3rd Year",
      school: "Bataan Peninsula State University",

      internshipPosition: "Web Development Intern",
      department: "Information Technology",
      deploymentDate: "August 18, 2026",
      internshipDuration: "September 1, 2026 - December 15, 2026",

      status: "Pending",

      documents: [
        {
          name: "Resume",
          file: "Juan_Dela_Cruz_Resume.pdf",
          status: "Submitted",
        },
        {
          name: "Endorsement Letter",
          file: "Juan_Dela_Cruz_Endorsement.pdf",
          status: "Submitted",
        },
        {
          name: "MOA",
          file: "Juan_Dela_Cruz_MOA.pdf",
          status: "Submitted",
        },
      ],
    },

    {
      id: "DEP-002",
      studentId: "2024-00142",
      studentName: "Maria Santos",
      email: "maria.santos@student.edu",
      phone: "+63 917 456 7890",
      course: "BS Information Technology",
      yearLevel: "3rd Year",
      school: "Bataan Peninsula State University",

      internshipPosition: "Software Development Intern",
      department: "Software Engineering",
      deploymentDate: "August 17, 2026",
      internshipDuration: "September 1, 2026 - December 15, 2026",

      status: "Pending",

      documents: [
        {
          name: "Resume",
          file: "Maria_Santos_Resume.pdf",
          status: "Submitted",
        },
        {
          name: "Endorsement Letter",
          file: "Maria_Santos_Endorsement.pdf",
          status: "Submitted",
        },
        {
          name: "MOA",
          file: "Maria_Santos_MOA.pdf",
          status: "Submitted",
        },
      ],
    },

    {
      id: "DEP-003",
      studentId: "2024-00098",
      studentName: "Carlos Reyes",
      email: "carlos.reyes@student.edu",
      phone: "+63 905 234 5678",
      course: "BS Computer Science",
      yearLevel: "4th Year",
      school: "Bataan Peninsula State University",

      internshipPosition: "IT Support Intern",
      department: "IT Operations",
      deploymentDate: "August 15, 2026",
      internshipDuration: "September 1, 2026 - November 30, 2026",

      status: "Accepted",

      documents: [
        {
          name: "Resume",
          file: "Carlos_Reyes_Resume.pdf",
          status: "Submitted",
        },
        {
          name: "Endorsement Letter",
          file: "Carlos_Reyes_Endorsement.pdf",
          status: "Submitted",
        },
        {
          name: "MOA",
          file: "Carlos_Reyes_MOA.pdf",
          status: "Submitted",
        },
      ],
    },

    {
      id: "DEP-004",
      studentId: "2024-00167",
      studentName: "Angela Garcia",
      email: "angela.garcia@student.edu",
      phone: "+63 918 765 4321",
      course: "BS Information Technology",
      yearLevel: "3rd Year",
      school: "Bataan Peninsula State University",

      internshipPosition: "UI/UX Design Intern",
      department: "Product Design",
      deploymentDate: "August 14, 2026",
      internshipDuration: "September 1, 2026 - December 15, 2026",

      status: "Rejected",

      documents: [
        {
          name: "Resume",
          file: "Angela_Garcia_Resume.pdf",
          status: "Submitted",
        },
        {
          name: "Endorsement Letter",
          file: "Angela_Garcia_Endorsement.pdf",
          status: "Submitted",
        },
        {
          name: "MOA",
          file: "Angela_Garcia_MOA.pdf",
          status: "Submitted",
        },
      ],
    },
  ]);

  // =========================================================
  // STATE
  // =========================================================

  const [activeFilter, setActiveFilter] = useState("All");

  const [selectedApplication, setSelectedApplication] = useState(null);

  const [showRejectModal, setShowRejectModal] = useState(false);

  const [rejectReason, setRejectReason] = useState("");

  // =========================================================
  // COUNTS
  // =========================================================

  const pendingCount = applications.filter(
    (application) => application.status === "Pending"
  ).length;

  const acceptedCount = applications.filter(
    (application) => application.status === "Accepted"
  ).length;

  const rejectedCount = applications.filter(
    (application) => application.status === "Rejected"
  ).length;

  // =========================================================
  // FILTER
  // =========================================================

  const filteredApplications = applications.filter((application) => {
    if (activeFilter === "All") return true;

    return application.status === activeFilter;
  });

  // =========================================================
  // ACCEPT APPLICATION
  // =========================================================

  const handleAccept = (applicationId) => {
    setApplications((previous) =>
      previous.map((application) =>
        application.id === applicationId
          ? {
              ...application,
              status: "Accepted",
            }
          : application
      )
    );

    setSelectedApplication((previous) =>
      previous
        ? {
            ...previous,
            status: "Accepted",
          }
        : previous
    );
  };

  // =========================================================
  // OPEN REJECT MODAL
  // =========================================================

  const openRejectModal = (application) => {
    setSelectedApplication(application);
    setRejectReason("");
    setShowRejectModal(true);
  };

  // =========================================================
  // REJECT APPLICATION
  // =========================================================

  const handleReject = () => {
    if (!selectedApplication) return;

    setApplications((previous) =>
      previous.map((application) =>
        application.id === selectedApplication.id
          ? {
              ...application,
              status: "Rejected",
            }
          : application
      )
    );

    setSelectedApplication((previous) =>
      previous
        ? {
            ...previous,
            status: "Rejected",
          }
        : previous
    );

    setShowRejectModal(false);
    setRejectReason("");
  };

  // =========================================================
  // STATUS STYLE
  // =========================================================

  const getStatusClass = (status) => {
    if (status === "Accepted") {
      return darkMode
        ? "bg-emerald-950/50 text-emerald-300 border-emerald-800"
        : "bg-emerald-50 text-emerald-700 border-emerald-200";
    }

    if (status === "Rejected") {
      return darkMode
        ? "bg-red-950/50 text-red-300 border-red-800"
        : "bg-red-50 text-red-700 border-red-200";
    }

    return darkMode
      ? "bg-amber-950/50 text-amber-300 border-amber-800"
      : "bg-amber-50 text-amber-700 border-amber-200";
  };

  // =========================================================
  // THEME CLASSES
  // =========================================================

  const headingClass = darkMode ? "text-slate-100" : "text-slate-900";

  const bodyTextClass = darkMode ? "text-slate-400" : "text-slate-500";

  const cardClass = darkMode
    ? "bg-slate-900 border-slate-700"
    : "bg-white border-slate-200";

  const tableHeaderClass = darkMode
    ? "bg-slate-800 text-slate-400"
    : "bg-slate-50 text-slate-500";

  const borderClass = darkMode ? "border-slate-700" : "border-slate-200";

  // =========================================================
  // RETURN
  // =========================================================

  return (
    <div className="w-full min-h-full p-3 sm:p-5 md:p-6 lg:p-8">
      <div className="max-w-[1400px] mx-auto">
        {/* =====================================================
            PAGE HEADER
        ===================================================== */}

        <div className="mb-6">
          <p
            className={`text-[10px] sm:text-xs uppercase tracking-widest font-bold mb-1 ${
              darkMode ? "text-slate-500" : "text-slate-400"
            }`}
          >
            Company Portal
          </p>

          <h1 className={`text-xl sm:text-2xl font-black ${headingClass}`}>
            Manage Applications
          </h1>

          <p className={`text-xs sm:text-sm mt-1 ${bodyTextClass}`}>
            Review students deployed by the Registrar and decide whether to
            accept or reject their internship application.
          </p>
        </div>

        {/* =====================================================
            SUMMARY CARDS
        ===================================================== */}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {/* TOTAL */}

          <div className={`border rounded-xl p-4 ${cardClass}`}>
            <div className="flex items-center justify-between">
              <div>
                <p
                  className={`text-[10px] uppercase tracking-wider font-bold ${bodyTextClass}`}
                >
                  Total
                </p>

                <p className={`text-2xl font-black mt-1 ${headingClass}`}>
                  {applications.length}
                </p>
              </div>

              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  darkMode ? "bg-slate-800" : "bg-slate-100"
                }`}
              >
                📋
              </div>
            </div>
          </div>

          {/* PENDING */}

          <div className={`border rounded-xl p-4 ${cardClass}`}>
            <div className="flex items-center justify-between">
              <div>
                <p
                  className={`text-[10px] uppercase tracking-wider font-bold ${bodyTextClass}`}
                >
                  Pending
                </p>

                <p
                  className={`text-2xl font-black mt-1 ${
                    darkMode ? "text-amber-300" : "text-amber-600"
                  }`}
                >
                  {pendingCount}
                </p>
              </div>

              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                ⏳
              </div>
            </div>
          </div>

          {/* ACCEPTED */}

          <div className={`border rounded-xl p-4 ${cardClass}`}>
            <div className="flex items-center justify-between">
              <div>
                <p
                  className={`text-[10px] uppercase tracking-wider font-bold ${bodyTextClass}`}
                >
                  Accepted
                </p>

                <p
                  className={`text-2xl font-black mt-1 ${
                    darkMode ? "text-emerald-300" : "text-emerald-600"
                  }`}
                >
                  {acceptedCount}
                </p>
              </div>

              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                ✓
              </div>
            </div>
          </div>

          {/* REJECTED */}

          <div className={`border rounded-xl p-4 ${cardClass}`}>
            <div className="flex items-center justify-between">
              <div>
                <p
                  className={`text-[10px] uppercase tracking-wider font-bold ${bodyTextClass}`}
                >
                  Rejected
                </p>

                <p
                  className={`text-2xl font-black mt-1 ${
                    darkMode ? "text-red-300" : "text-red-600"
                  }`}
                >
                  {rejectedCount}
                </p>
              </div>

              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                ✕
              </div>
            </div>
          </div>
        </div>

        {/* =====================================================
            APPLICATIONS PANEL
        ===================================================== */}

        <section
          className={`border rounded-xl shadow-sm overflow-hidden ${cardClass}`}
        >
          {/* PANEL HEADER */}

          <div className={`px-4 sm:px-5 py-4 border-b ${borderClass}`}>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h2
                  className={`text-sm sm:text-base font-bold ${headingClass}`}
                >
                  Deployed Students
                </h2>

                <p className={`text-[10px] sm:text-xs mt-1 ${bodyTextClass}`}>
                  Students endorsed to your company by the Registrar.
                </p>
              </div>

              {/* FILTERS */}

              <div className="flex flex-wrap gap-2">
                {["All", "Pending", "Accepted", "Rejected"].map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setActiveFilter(filter)}
                    className={`px-3 py-2 rounded-lg text-[10px] sm:text-xs font-bold transition ${
                      activeFilter === filter
                        ? darkMode
                          ? "bg-white text-slate-900"
                          : "bg-slate-900 text-white"
                        : darkMode
                        ? "bg-slate-800 text-slate-400 hover:text-white"
                        : "bg-slate-100 text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ===================================================
              DESKTOP TABLE
          =================================================== */}

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className={tableHeaderClass}>
                  <th className="px-5 py-3 text-left text-[10px] uppercase tracking-wider font-bold">
                    Student
                  </th>

                  <th className="px-5 py-3 text-left text-[10px] uppercase tracking-wider font-bold">
                    Internship
                  </th>

                  <th className="px-5 py-3 text-left text-[10px] uppercase tracking-wider font-bold">
                    Deployment
                  </th>

                  <th className="px-5 py-3 text-left text-[10px] uppercase tracking-wider font-bold">
                    Status
                  </th>

                  <th className="px-5 py-3 text-right text-[10px] uppercase tracking-wider font-bold">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredApplications.map((application) => (
                  <tr
                    key={application.id}
                    className={`border-t ${borderClass} ${
                      darkMode ? "hover:bg-slate-800/60" : "hover:bg-slate-50"
                    }`}
                  >
                    {/* STUDENT */}

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ${
                            darkMode
                              ? "bg-slate-700 text-white"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {application.studentName
                            .split(" ")
                            .map((name) => name[0])
                            .slice(0, 2)
                            .join("")}
                        </div>

                        <div>
                          <p className={`text-sm font-bold ${headingClass}`}>
                            {application.studentName}
                          </p>

                          <p className={`text-[10px] mt-0.5 ${bodyTextClass}`}>
                            {application.studentId}
                          </p>

                          <p className={`text-[10px] ${bodyTextClass}`}>
                            {application.course}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* INTERNSHIP */}

                    <td className="px-5 py-4">
                      <p className={`text-xs font-semibold ${headingClass}`}>
                        {application.internshipPosition}
                      </p>

                      <p className={`text-[10px] mt-1 ${bodyTextClass}`}>
                        {application.department}
                      </p>
                    </td>

                    {/* DEPLOYMENT */}

                    <td className="px-5 py-4">
                      <p className={`text-xs font-semibold ${headingClass}`}>
                        {application.deploymentDate}
                      </p>

                      <p className={`text-[10px] mt-1 ${bodyTextClass}`}>
                        {application.internshipDuration}
                      </p>
                    </td>

                    {/* STATUS */}

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full border text-[10px] font-bold ${getStatusClass(
                          application.status
                        )}`}
                      >
                        {application.status}
                      </span>
                    </td>

                    {/* ACTION */}

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedApplication(application)}
                          className={`px-3 py-2 rounded-lg border text-[10px] font-bold transition ${
                            darkMode
                              ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                              : "border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          View
                        </button>

                        {application.status === "Pending" && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleAccept(application.id)}
                              className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-[10px] font-bold hover:bg-emerald-700 transition"
                            >
                              Accept
                            </button>

                            <button
                              type="button"
                              onClick={() => openRejectModal(application)}
                              className="px-3 py-2 rounded-lg bg-red-600 text-white text-[10px] font-bold hover:bg-red-700 transition"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* EMPTY */}

            {filteredApplications.length === 0 && (
              <div className="py-16 text-center">
                <div className="text-3xl mb-3">📋</div>

                <p className={`text-sm font-semibold ${headingClass}`}>
                  No applications found
                </p>

                <p className={`text-xs mt-1 ${bodyTextClass}`}>
                  There are no students under this status.
                </p>
              </div>
            )}
          </div>

          {/* ===================================================
              MOBILE CARDS
          =================================================== */}

          <div className="md:hidden">
            {filteredApplications.map((application) => (
              <div
                key={application.id}
                className={`p-4 border-b ${borderClass}`}
              >
                {/* STUDENT HEADER */}

                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${
                        darkMode
                          ? "bg-slate-700 text-white"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {application.studentName
                        .split(" ")
                        .map((name) => name[0])
                        .slice(0, 2)
                        .join("")}
                    </div>

                    <div className="min-w-0">
                      <p
                        className={`text-sm font-bold truncate ${headingClass}`}
                      >
                        {application.studentName}
                      </p>

                      <p className={`text-[10px] ${bodyTextClass}`}>
                        {application.studentId}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`flex-shrink-0 inline-flex px-2 py-1 rounded-full border text-[9px] font-bold ${getStatusClass(
                      application.status
                    )}`}
                  >
                    {application.status}
                  </span>
                </div>

                {/* DETAILS */}

                <div className="mt-4 space-y-2">
                  <div>
                    <p
                      className={`text-[9px] uppercase tracking-wider font-bold ${bodyTextClass}`}
                    >
                      Course
                    </p>

                    <p
                      className={`text-xs font-semibold mt-0.5 ${headingClass}`}
                    >
                      {application.course}
                    </p>
                  </div>

                  <div>
                    <p
                      className={`text-[9px] uppercase tracking-wider font-bold ${bodyTextClass}`}
                    >
                      Internship
                    </p>

                    <p
                      className={`text-xs font-semibold mt-0.5 ${headingClass}`}
                    >
                      {application.internshipPosition}
                    </p>

                    <p className={`text-[10px] ${bodyTextClass}`}>
                      {application.department}
                    </p>
                  </div>

                  <div>
                    <p
                      className={`text-[9px] uppercase tracking-wider font-bold ${bodyTextClass}`}
                    >
                      Deployment
                    </p>

                    <p
                      className={`text-xs font-semibold mt-0.5 ${headingClass}`}
                    >
                      {application.deploymentDate}
                    </p>
                  </div>
                </div>

                {/* ACTIONS */}

                <div className="flex flex-wrap gap-2 mt-4">
                  <button
                    type="button"
                    onClick={() => setSelectedApplication(application)}
                    className={`px-3 py-2 rounded-lg border text-[10px] font-bold ${
                      darkMode
                        ? "border-slate-700 text-slate-300"
                        : "border-slate-200 text-slate-600"
                    }`}
                  >
                    View Details
                  </button>

                  {application.status === "Pending" && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleAccept(application.id)}
                        className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-[10px] font-bold"
                      >
                        Accept
                      </button>

                      <button
                        type="button"
                        onClick={() => openRejectModal(application)}
                        className="px-3 py-2 rounded-lg bg-red-600 text-white text-[10px] font-bold"
                      >
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}

            {filteredApplications.length === 0 && (
              <div className="py-16 text-center">
                <div className="text-3xl mb-3">📋</div>

                <p className={`text-sm font-semibold ${headingClass}`}>
                  No applications found
                </p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* =======================================================
          APPLICATION DETAILS MODAL
      ======================================================= */}

      {selectedApplication && !showRejectModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setSelectedApplication(null)}
        >
          <div
            className={`w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl border ${
              darkMode
                ? "bg-slate-900 border-slate-700 text-white"
                : "bg-white border-slate-200 text-slate-900"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* HEADER */}

            <div
              className={`px-5 sm:px-6 py-5 border-b flex items-start justify-between ${borderClass}`}
            >
              <div>
                <p
                  className={`text-[10px] uppercase tracking-widest font-bold ${bodyTextClass}`}
                >
                  Deployment Application
                </p>

                <h2
                  className={`text-lg sm:text-xl font-black mt-1 ${headingClass}`}
                >
                  {selectedApplication.studentName}
                </h2>

                <p className={`text-xs mt-1 ${bodyTextClass}`}>
                  {selectedApplication.studentId}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedApplication(null)}
                className={`w-9 h-9 rounded-lg text-xl text-slate-400 ${
                  darkMode ? "hover:bg-slate-800" : "hover:bg-slate-100"
                }`}
              >
                ×
              </button>
            </div>

            {/* CONTENT */}

            <div className="p-5 sm:p-6 space-y-6">
              {/* STATUS */}

              <div className="flex items-center justify-between gap-3">
                <span
                  className={`inline-flex px-3 py-1.5 rounded-full border text-xs font-bold ${getStatusClass(
                    selectedApplication.status
                  )}`}
                >
                  {selectedApplication.status}
                </span>

                <span className={`text-[10px] ${bodyTextClass}`}>
                  Deployed {selectedApplication.deploymentDate}
                </span>
              </div>

              {/* STUDENT INFORMATION */}

              <section>
                <h3 className={`text-sm font-bold mb-3 ${headingClass}`}>
                  Student Information
                </h3>

                <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3`}>
                  <div
                    className={`p-3 rounded-xl border ${borderClass} ${
                      darkMode ? "bg-slate-800" : "bg-slate-50"
                    }`}
                  >
                    <p
                      className={`text-[9px] uppercase font-bold ${bodyTextClass}`}
                    >
                      Full Name
                    </p>

                    <p className={`text-xs font-semibold mt-1 ${headingClass}`}>
                      {selectedApplication.studentName}
                    </p>
                  </div>

                  <div
                    className={`p-3 rounded-xl border ${borderClass} ${
                      darkMode ? "bg-slate-800" : "bg-slate-50"
                    }`}
                  >
                    <p
                      className={`text-[9px] uppercase font-bold ${bodyTextClass}`}
                    >
                      Student ID
                    </p>

                    <p className={`text-xs font-semibold mt-1 ${headingClass}`}>
                      {selectedApplication.studentId}
                    </p>
                  </div>

                  <div
                    className={`p-3 rounded-xl border ${borderClass} ${
                      darkMode ? "bg-slate-800" : "bg-slate-50"
                    }`}
                  >
                    <p
                      className={`text-[9px] uppercase font-bold ${bodyTextClass}`}
                    >
                      Email
                    </p>

                    <p className={`text-xs font-semibold mt-1 ${headingClass}`}>
                      {selectedApplication.email}
                    </p>
                  </div>

                  <div
                    className={`p-3 rounded-xl border ${borderClass} ${
                      darkMode ? "bg-slate-800" : "bg-slate-50"
                    }`}
                  >
                    <p
                      className={`text-[9px] uppercase font-bold ${bodyTextClass}`}
                    >
                      Phone
                    </p>

                    <p className={`text-xs font-semibold mt-1 ${headingClass}`}>
                      {selectedApplication.phone}
                    </p>
                  </div>

                  <div
                    className={`p-3 rounded-xl border ${borderClass} ${
                      darkMode ? "bg-slate-800" : "bg-slate-50"
                    }`}
                  >
                    <p
                      className={`text-[9px] uppercase font-bold ${bodyTextClass}`}
                    >
                      Course
                    </p>

                    <p className={`text-xs font-semibold mt-1 ${headingClass}`}>
                      {selectedApplication.course}
                    </p>
                  </div>

                  <div
                    className={`p-3 rounded-xl border ${borderClass} ${
                      darkMode ? "bg-slate-800" : "bg-slate-50"
                    }`}
                  >
                    <p
                      className={`text-[9px] uppercase font-bold ${bodyTextClass}`}
                    >
                      Year Level
                    </p>

                    <p className={`text-xs font-semibold mt-1 ${headingClass}`}>
                      {selectedApplication.yearLevel}
                    </p>
                  </div>
                </div>
              </section>

              {/* INTERNSHIP INFORMATION */}

              <section>
                <h3 className={`text-sm font-bold mb-3 ${headingClass}`}>
                  Internship Information
                </h3>

                <div
                  className={`p-4 rounded-xl border ${borderClass} ${
                    darkMode ? "bg-slate-800" : "bg-slate-50"
                  }`}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p
                        className={`text-[9px] uppercase font-bold ${bodyTextClass}`}
                      >
                        Position
                      </p>

                      <p
                        className={`text-xs font-semibold mt-1 ${headingClass}`}
                      >
                        {selectedApplication.internshipPosition}
                      </p>
                    </div>

                    <div>
                      <p
                        className={`text-[9px] uppercase font-bold ${bodyTextClass}`}
                      >
                        Department
                      </p>

                      <p
                        className={`text-xs font-semibold mt-1 ${headingClass}`}
                      >
                        {selectedApplication.department}
                      </p>
                    </div>

                    <div className="sm:col-span-2">
                      <p
                        className={`text-[9px] uppercase font-bold ${bodyTextClass}`}
                      >
                        Internship Duration
                      </p>

                      <p
                        className={`text-xs font-semibold mt-1 ${headingClass}`}
                      >
                        {selectedApplication.internshipDuration}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* DOCUMENTS */}

              <section>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className={`text-sm font-bold ${headingClass}`}>
                      Submitted Documents
                    </h3>

                    <p className={`text-[10px] mt-1 ${bodyTextClass}`}>
                      Documents submitted by the student for company review.
                    </p>
                  </div>

                  <span className={`text-[10px] font-bold ${bodyTextClass}`}>
                    {selectedApplication.documents.length} files
                  </span>
                </div>

                <div className="space-y-2">
                  {selectedApplication.documents.map((document) => (
                    <div
                      key={document.name}
                      className={`flex items-center justify-between gap-3 p-3 rounded-xl border ${borderClass}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 flex-shrink-0 rounded-lg flex items-center justify-center ${
                            darkMode ? "bg-slate-800" : "bg-slate-100"
                          }`}
                        >
                          📄
                        </div>

                        <div className="min-w-0">
                          <p
                            className={`text-xs font-bold truncate ${headingClass}`}
                          >
                            {document.name}
                          </p>

                          <p
                            className={`text-[10px] mt-0.5 truncate ${bodyTextClass}`}
                          >
                            {document.file}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        className={`flex-shrink-0 px-3 py-2 rounded-lg border text-[10px] font-bold ${
                          darkMode
                            ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                            : "border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                        onClick={() => {
                          alert(
                            `Document preview/download will be connected later: ${document.file}`
                          );
                        }}
                      >
                        View
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              {/* ACTIONS */}

              {selectedApplication.status === "Pending" && (
                <div
                  className={`pt-5 border-t flex flex-wrap justify-end gap-2 ${borderClass}`}
                >
                  <button
                    type="button"
                    onClick={() => openRejectModal(selectedApplication)}
                    className="px-5 py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition"
                  >
                    Reject Application
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAccept(selectedApplication.id)}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition"
                  >
                    Accept Application
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =======================================================
          REJECT MODAL
      ======================================================= */}

      {showRejectModal && selectedApplication && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowRejectModal(false)}
        >
          <div
            className={`w-full max-w-md rounded-2xl shadow-2xl border ${
              darkMode
                ? "bg-slate-900 border-slate-700 text-white"
                : "bg-white border-slate-200 text-slate-900"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* HEADER */}

            <div className={`px-5 py-4 border-b ${borderClass}`}>
              <h2 className={`text-base font-black ${headingClass}`}>
                Reject Application
              </h2>

              <p className={`text-xs mt-1 ${bodyTextClass}`}>
                You are rejecting the internship deployment of{" "}
                <span className="font-semibold">
                  {selectedApplication.studentName}
                </span>
                .
              </p>
            </div>

            {/* CONTENT */}

            <div className="p-5">
              <label className={`block text-xs font-bold mb-2 ${headingClass}`}>
                Reason for Rejection
                <span className={`font-normal ml-1 ${bodyTextClass}`}>
                  (optional)
                </span>
              </label>

              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
                placeholder="Enter a reason for rejecting this application..."
                className={`w-full px-3 py-3 rounded-xl border text-sm outline-none resize-none ${
                  darkMode
                    ? "bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-slate-500"
                    : "bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-slate-400"
                }`}
              />

              {/* ACTIONS */}

              <div className="flex justify-end gap-2 mt-5">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className={`px-4 py-2.5 rounded-xl border text-xs font-bold ${
                    darkMode
                      ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleReject}
                  className="px-4 py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageApplications;
