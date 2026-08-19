import React, { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";

// =========================================================
// TEMPORARY PAGE-LOCAL DEMO DATA
// =========================================================
// This page intentionally has no mockStore dependency yet.
//
// IMPORTANT:
// Attendance tracking is NOT implemented because it is part
// of the current system limitations.
//
// This page only handles:
// - Viewing officially deployed interns
// - Searching interns
// - Filtering interns
// - Sorting interns
// - Viewing internship assignment information
// - Marking an internship as completed
// =========================================================

const localState = {
  companies: [
    {
      id: "COM-001",
      name: "ABC Technologies",
      industry: "Information Technology",
      status: "Verified",
      address: "Balanga, Bataan",
      email: "hr@abctech.com",
      supervisorIds: ["SUP-001"],
    },
  ],

  // =========================================================
  // DEMO ASSIGNMENTS
  // =========================================================
  //
  // These are added temporarily so you can see how the page
  // behaves with multiple interns.
  //
  // deployedAt !== null means officially deployed.
  // =========================================================

  assignments: [
    {
      id: "ASN-001",
      companyId: "COM-001",
      studentId: "STU-001",
      status: "Active",
      deployedAt: "2026-05-25",
      startDate: "2026-06-01",
      endDate: "2026-08-31",
    },
    {
      id: "ASN-002",
      companyId: "COM-001",
      studentId: "STU-002",
      status: "Active",
      deployedAt: "2026-06-02",
      startDate: "2026-06-03",
      endDate: "2026-09-02",
    },
    {
      id: "ASN-003",
      companyId: "COM-001",
      studentId: "STU-003",
      status: "Active",
      deployedAt: "2026-06-10",
      startDate: "2026-06-15",
      endDate: "2026-09-15",
    },
    {
      id: "ASN-004",
      companyId: "COM-001",
      studentId: "STU-004",
      status: "Completed",
      deployedAt: "2026-02-01",
      startDate: "2026-02-05",
      endDate: "2026-05-05",
    },
    {
      id: "ASN-005",
      companyId: "COM-001",
      studentId: "STU-005",
      status: "Completed",
      deployedAt: "2026-01-15",
      startDate: "2026-01-20",
      endDate: "2026-04-20",
    },
  ],

  students: [
    {
      id: "STU-001",
      userId: "USR-001",
      fullName: "John Doe",
      email: "student@gmail.com",
      studentId: "2024-00123",
      program: "BS Information Technology",
      yearLevel: "2nd Year",
      department: "College of Information and Communications Technology",
      facultyId: "FAC-001",
      phone: "+63 912 345 6789",
      address: "Limay, Bataan",
      gwa: "1.75",
    },

    {
      id: "STU-002",
      userId: "USR-002",
      fullName: "Maria Santos",
      email: "maria.santos@gmail.com",
      studentId: "2024-00124",
      program: "BS Information Technology",
      yearLevel: "2nd Year",
      department: "College of Information and Communications Technology",
      facultyId: "FAC-001",
      phone: "+63 913 456 7890",
      address: "Balanga, Bataan",
      gwa: "1.50",
    },

    {
      id: "STU-003",
      userId: "USR-003",
      fullName: "Kevin Garcia",
      email: "kevin.garcia@gmail.com",
      studentId: "2023-00456",
      program: "BS Computer Science",
      yearLevel: "3rd Year",
      department: "College of Information and Communications Technology",
      facultyId: "FAC-001",
      phone: "+63 914 567 8901",
      address: "Orion, Bataan",
      gwa: "1.80",
    },

    {
      id: "STU-004",
      userId: "USR-004",
      fullName: "Angela Cruz",
      email: "angela.cruz@gmail.com",
      studentId: "2023-00457",
      program: "BS Information Technology",
      yearLevel: "3rd Year",
      department: "College of Information and Communications Technology",
      facultyId: "FAC-001",
      phone: "+63 915 678 9012",
      address: "Pilar, Bataan",
      gwa: "1.65",
    },

    {
      id: "STU-005",
      userId: "USR-005",
      fullName: "Mark Reyes",
      email: "mark.reyes@gmail.com",
      studentId: "2022-00789",
      program: "BS Information Technology",
      yearLevel: "4th Year",
      department: "College of Information and Communications Technology",
      facultyId: "FAC-001",
      phone: "+63 916 789 0123",
      address: "Dinalupihan, Bataan",
      gwa: "1.90",
    },
  ],
};

// =========================================================
// COMPONENT
// =========================================================

export default function Interns() {
  const { darkMode } = useOutletContext();

  const state = localState;

  // =========================================================
  // SEARCH / FILTER / SORT
  // =========================================================

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortBy, setSortBy] = useState("name-asc");

  // =========================================================
  // COMPANY
  // =========================================================

  const company = state.companies.find((item) => item.id === "COM-001");

  // =========================================================
  // GET DEPLOYED ASSIGNMENTS
  // =========================================================

  const assignments = useMemo(() => {
    return state.assignments.filter(
      (item) =>
        item.companyId === company?.id &&
        ["Active", "Completed"].includes(item.status) &&
        item.deployedAt !== null
    );
  }, [company?.id]);

  // =========================================================
  // SUMMARY COUNTS
  // =========================================================

  const activeCount = assignments.filter(
    (item) => item.status === "Active"
  ).length;

  const completedCount = assignments.filter(
    (item) => item.status === "Completed"
  ).length;

  const totalCount = assignments.length;

  // =========================================================
  // FILTER + SEARCH + SORT
  // =========================================================

  const filteredAssignments = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    const filtered = assignments.filter((assignment) => {
      const student = state.students.find(
        (item) => item.id === assignment.studentId
      );

      if (!student) return false;

      const matchesSearch =
        !normalizedSearch ||
        student.fullName.toLowerCase().includes(normalizedSearch) ||
        student.studentId.toLowerCase().includes(normalizedSearch) ||
        student.program.toLowerCase().includes(normalizedSearch) ||
        student.email.toLowerCase().includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "All" || assignment.status === statusFilter;

      return matchesSearch && matchesStatus;
    });

    return [...filtered].sort((a, b) => {
      const studentA =
        state.students.find((item) => item.id === a.studentId) || {};

      const studentB =
        state.students.find((item) => item.id === b.studentId) || {};

      if (sortBy === "name-asc") {
        return (studentA.fullName || "").localeCompare(studentB.fullName || "");
      }

      if (sortBy === "name-desc") {
        return (studentB.fullName || "").localeCompare(studentA.fullName || "");
      }

      if (sortBy === "newest") {
        return new Date(b.deployedAt || 0) - new Date(a.deployedAt || 0);
      }

      if (sortBy === "oldest") {
        return new Date(a.deployedAt || 0) - new Date(b.deployedAt || 0);
      }

      if (sortBy === "start-latest") {
        return new Date(b.startDate || 0) - new Date(a.startDate || 0);
      }

      if (sortBy === "start-earliest") {
        return new Date(a.startDate || 0) - new Date(b.startDate || 0);
      }

      return 0;
    });
  }, [assignments, searchTerm, statusFilter, sortBy]);

  // =========================================================
  // THEME CLASSES
  // =========================================================

  const card = darkMode
    ? "bg-slate-900 border-slate-700"
    : "bg-white border-slate-200";

  const heading = darkMode ? "text-slate-100" : "text-slate-900";

  const muted = darkMode ? "text-slate-400" : "text-slate-500";

  const input = darkMode
    ? "bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-500"
    : "bg-white border-slate-300 text-slate-800 placeholder:text-slate-400";

  // =========================================================
  // COMPLETE INTERNSHIP
  // =========================================================

  const handleCompleteInternship = (assignmentId, studentName) => {
    const confirmed = window.confirm(
      `Are you sure you want to mark ${studentName}'s internship as completed?`
    );

    if (!confirmed) return;

    const assignment = state.assignments.find(
      (item) => item.id === assignmentId
    );

    if (assignment) {
      assignment.status = "Completed";
    }

    alert("Internship marked as completed.");

    // Force refresh so the UI immediately updates.
    window.location.reload();
  };

  // =========================================================
  // RETURN
  // =========================================================

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
          Company Portal
        </p>

        <h1 className="text-2xl font-black">Assigned Interns</h1>

        <p className={`text-sm mt-1 ${muted}`}>
          View officially deployed interns and manage their internship
          assignments.
        </p>
      </div>

      {/* =====================================================
          SUMMARY CARDS
      ===================================================== */}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {/* TOTAL */}

        <div className={`border rounded-2xl p-5 ${card}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-xs font-semibold ${muted}`}>Total Interns</p>

              <p className={`text-3xl font-black mt-1 ${heading}`}>
                {totalCount}
              </p>

              <p className={`text-xs mt-1 ${muted}`}>Officially deployed</p>
            </div>

            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl">
              👥
            </div>
          </div>
        </div>

        {/* ACTIVE */}

        <div className={`border rounded-2xl p-5 ${card}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-xs font-semibold ${muted}`}>Active Interns</p>

              <p className={`text-3xl font-black mt-1 ${heading}`}>
                {activeCount}
              </p>

              <p className={`text-xs mt-1 ${muted}`}>Currently deployed</p>
            </div>

            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl">
              ✓
            </div>
          </div>
        </div>

        {/* COMPLETED */}

        <div className={`border rounded-2xl p-5 ${card}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-xs font-semibold ${muted}`}>Completed</p>

              <p className={`text-3xl font-black mt-1 ${heading}`}>
                {completedCount}
              </p>

              <p className={`text-xs mt-1 ${muted}`}>Finished internships</p>
            </div>

            <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center text-xl">
              🏁
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          SEARCH / FILTER / SORT
      ===================================================== */}

      <section className={`border rounded-2xl p-5 mb-5 ${card}`}>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* SEARCH */}

          <div className="flex-1">
            <label className={`block text-xs font-bold mb-2 ${heading}`}>
              Search Interns
            </label>

            <div className="relative">
              <span
                className={`absolute left-3 top-1/2 -translate-y-1/2 ${muted}`}
              >
                🔎
              </span>

              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by name, student ID, program, or email..."
                className={`w-full border rounded-lg pl-10 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${input}`}
              />
            </div>
          </div>

          {/* STATUS */}

          <div className="w-full lg:w-44">
            <label className={`block text-xs font-bold mb-2 ${heading}`}>
              Status
            </label>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className={`w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${input}`}
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          {/* SORT */}

          <div className="w-full lg:w-52">
            <label className={`block text-xs font-bold mb-2 ${heading}`}>
              Sort By
            </label>

            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className={`w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${input}`}
            >
              <option value="name-asc">Name: A → Z</option>

              <option value="name-desc">Name: Z → A</option>

              <option value="newest">Recently Deployed</option>

              <option value="oldest">Oldest Deployment</option>

              <option value="start-latest">Latest Start Date</option>

              <option value="start-earliest">Earliest Start Date</option>
            </select>
          </div>
        </div>

        {/* RESULT COUNT */}

        <div
          className={`mt-4 pt-3 border-t text-xs ${
            darkMode ? "border-slate-700" : "border-slate-200"
          } ${muted}`}
        >
          Showing{" "}
          <span className={`font-bold ${heading}`}>
            {filteredAssignments.length}
          </span>{" "}
          of{" "}
          <span className={`font-bold ${heading}`}>{assignments.length}</span>{" "}
          assigned interns
        </div>
      </section>

      {/* =====================================================
          EMPTY STATE
      ===================================================== */}

      {assignments.length === 0 ? (
        <section className={`border rounded-2xl p-6 ${card}`}>
          <div className="text-center py-8">
            <div className="text-4xl mb-3">👥</div>

            <p className={`font-semibold ${heading}`}>
              No deployed interns yet.
            </p>

            <p className={`text-sm mt-1 max-w-md mx-auto ${muted}`}>
              Interns will appear here only after their required documents have
              been approved by the registrar and the student has been officially
              deployed.
            </p>
          </div>
        </section>
      ) : filteredAssignments.length === 0 ? (
        <section className={`border rounded-2xl p-6 ${card}`}>
          <div className="text-center py-8">
            <div className="text-3xl mb-3">🔎</div>

            <p className={`font-semibold ${heading}`}>No interns found.</p>

            <p className={`text-sm mt-1 ${muted}`}>
              Try changing your search or status filter.
            </p>

            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("All");
              }}
              className="mt-4 px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition"
            >
              Clear Filters
            </button>
          </div>
        </section>
      ) : (
        /* =====================================================
           ASSIGNED INTERNS
        ===================================================== */

        <section className={`border rounded-2xl overflow-hidden ${card}`}>
          <div
            className={`px-5 py-4 border-b ${
              darkMode ? "border-slate-700" : "border-slate-200"
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h2 className={`font-bold ${heading}`}>Assigned Interns</h2>

                <p className={`text-xs mt-1 ${muted}`}>
                  Officially deployed students assigned to your company.
                </p>
              </div>

              <span
                className={`text-xs font-semibold px-3 py-1.5 rounded-full ${
                  darkMode
                    ? "bg-slate-800 text-slate-300"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {filteredAssignments.length} result
                {filteredAssignments.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {/* =================================================
              INTERN LIST
          ================================================= */}

          <div
            className={`divide-y ${
              darkMode ? "divide-slate-700" : "divide-slate-200"
            }`}
          >
            {filteredAssignments.map((assignment) => {
              const student = state.students.find(
                (item) => item.id === assignment.studentId
              );

              const isCompleted = assignment.status === "Completed";

              return (
                <div
                  key={assignment.id}
                  className={`p-5 transition ${
                    darkMode ? "hover:bg-slate-800/60" : "hover:bg-slate-50"
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                    {/* =========================================
                        STUDENT INFORMATION
                    ========================================= */}

                    <div className="flex items-start gap-4 min-w-0">
                      {/* AVATAR */}

                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold flex-shrink-0 ${
                          isCompleted
                            ? "bg-blue-50 text-blue-700"
                            : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {student?.fullName
                          ?.split(" ")
                          .map((name) => name[0])
                          .slice(0, 2)
                          .join("") || "ST"}
                      </div>

                      {/* DETAILS */}

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className={`font-bold ${heading}`}>
                            {student?.fullName || "Unknown Student"}
                          </p>

                          {isCompleted ? (
                            <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">
                              COMPLETED
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                              ACTIVE
                            </span>
                          )}
                        </div>

                        <p className={`text-xs mt-1 ${muted}`}>
                          {student?.studentId || "No Student ID"}
                          {" · "}
                          {student?.program || "No Program"}
                        </p>

                        <p className={`text-xs mt-1 ${muted}`}>
                          {student?.email || "No email available"}
                        </p>

                        <div className="flex flex-wrap gap-2 mt-3">
                          <span
                            className={`text-[10px] px-2 py-1 rounded-md ${
                              darkMode
                                ? "bg-slate-800 text-slate-300"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            Assignment: {assignment.id}
                          </span>

                          <span
                            className={`text-[10px] px-2 py-1 rounded-md ${
                              darkMode
                                ? "bg-slate-800 text-slate-300"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            Deployed: {assignment.deployedAt}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* =========================================
                        INTERNSHIP PERIOD
                    ========================================= */}

                    <div className="lg:min-w-[220px]">
                      <p
                        className={`text-[10px] uppercase tracking-wide font-bold ${muted}`}
                      >
                        Internship Period
                      </p>

                      <p className={`text-sm font-semibold mt-1 ${heading}`}>
                        {assignment.startDate}
                      </p>

                      <p className={`text-xs ${muted}`}>
                        to {assignment.endDate}
                      </p>
                    </div>

                    {/* =========================================
                        ACTION
                    ========================================= */}

                    <div className="flex-shrink-0">
                      {isCompleted ? (
                        <span
                          className={`inline-flex px-4 py-2 rounded-lg text-xs font-semibold ${
                            darkMode
                              ? "bg-slate-800 text-slate-300"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          Internship Completed
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            handleCompleteInternship(
                              assignment.id,
                              student?.fullName || "this intern"
                            )
                          }
                          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition"
                        >
                          Mark as Completed
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* =====================================================
          LIMITATION NOTICE
      ===================================================== */}

      <div
        className={`mt-5 p-4 rounded-xl border text-xs ${
          darkMode
            ? "bg-amber-950/30 border-amber-900 text-amber-300"
            : "bg-amber-50 border-amber-200 text-amber-700"
        }`}
      >
        <p className="font-bold mb-1">ℹ️ Current System Limitation</p>

        <p>
          Attendance and daily internship progress are not tracked by the
          company portal in the current version of the system. This page is
          limited to viewing officially deployed interns and managing internship
          completion status.
        </p>
      </div>
    </div>
  );
}
