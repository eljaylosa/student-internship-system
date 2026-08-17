import React, { useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { useMockStore } from "../../data/mockStore.jsx";

export default function InternshipRecords() {
  const { darkMode } = useOutletContext();
  const { state, setAssignmentStatus } = useMockStore();

  // =========================================================
  // STYLES
  // =========================================================

  const card = darkMode
    ? "bg-slate-900 border-slate-700"
    : "bg-white border-slate-200";

  const heading = darkMode ? "text-white" : "text-slate-900";

  const muted = darkMode ? "text-slate-400" : "text-slate-500";

  const border = darkMode ? "border-slate-700" : "border-slate-200";

  // =========================================================
  // RESOLVE ASSIGNMENT DATA
  // =========================================================

  const records = useMemo(() => {
    return (state.assignments || []).map((assignment) => {
      const student =
        state.students?.find(
          (item) =>
            item.id === assignment.studentId ||
            item.id === assignment.student?.id
        ) || assignment.student;

      const company =
        state.companies?.find(
          (item) =>
            item.id === assignment.companyId ||
            item.id === assignment.company?.id
        ) || assignment.company;

      const opportunity =
        state.opportunities?.find(
          (item) =>
            item.id === assignment.opportunityId ||
            item.id === assignment.opportunity?.id
        ) || assignment.opportunity;

      const faculty =
        state.faculty?.find(
          (item) =>
            item.id === assignment.facultyId ||
            item.id === assignment.adviserId ||
            item.id === assignment.faculty?.id ||
            item.id === assignment.adviser?.id
        ) ||
        assignment.faculty ||
        assignment.adviser;

      return {
        ...assignment,
        student,
        company,
        opportunity,
        faculty,
      };
    });
  }, [
    state.assignments,
    state.students,
    state.companies,
    state.opportunities,
    state.faculty,
  ]);

  // =========================================================
  // HELPERS
  // =========================================================

  const getStudentName = (record) => {
    return (
      record.student?.fullName ||
      record.student?.name ||
      record.studentName ||
      record.fullName ||
      "Unknown Student"
    );
  };

  const getCompanyName = (record) => {
    return (
      record.company?.name ||
      record.company?.companyName ||
      record.companyName ||
      "Unknown Company"
    );
  };

  const getOpportunityTitle = (record) => {
    return (
      record.opportunity?.title ||
      record.opportunity?.position ||
      record.opportunityTitle ||
      record.position ||
      "Internship Assignment"
    );
  };

  const getFacultyName = (record) => {
    return (
      record.faculty?.fullName ||
      record.faculty?.name ||
      record.adviser?.fullName ||
      record.adviser?.name ||
      record.facultyName ||
      record.adviserName ||
      "Not Assigned"
    );
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "Active":
        return darkMode
          ? "bg-emerald-900/40 text-emerald-300 border-emerald-700"
          : "bg-emerald-50 text-emerald-700 border-emerald-200";

      case "Completed":
        return darkMode
          ? "bg-blue-900/40 text-blue-300 border-blue-700"
          : "bg-blue-50 text-blue-700 border-blue-200";

      case "Suspended":
        return darkMode
          ? "bg-amber-900/40 text-amber-300 border-amber-700"
          : "bg-amber-50 text-amber-700 border-amber-200";

      case "Terminated":
        return darkMode
          ? "bg-red-900/40 text-red-300 border-red-700"
          : "bg-red-50 text-red-700 border-red-200";

      default:
        return darkMode
          ? "bg-slate-800 text-slate-300 border-slate-600"
          : "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  // =========================================================
  // COUNTS
  // =========================================================

  const totalRecords = records.length;

  const activeRecords = records.filter(
    (record) => record.status === "Active"
  ).length;

  const pendingRecords = records.filter(
    (record) => record.status === "Pending"
  ).length;

  const completedRecords = records.filter(
    (record) => record.status === "Completed"
  ).length;

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div
      className={`p-4 sm:p-5 md:p-6 lg:p-8 max-w-[1400px] mx-auto ${
        darkMode ? "text-slate-100" : "text-slate-900"
      }`}
    >
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="mb-6">
        <p
          className={`text-[10px] uppercase tracking-widest font-bold ${
            darkMode ? "text-slate-500" : "text-slate-400"
          }`}
        >
          Administrator Portal
        </p>

        <h1 className={`text-2xl sm:text-3xl font-black mt-1 ${heading}`}>
          Internship Records
        </h1>

        <p className={`text-sm mt-1 ${muted}`}>
          Management view over the shared internship assignment records.
        </p>
      </div>

      {/* =====================================================
          SUMMARY
      ===================================================== */}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className={`border rounded-xl p-4 ${card}`}>
          <p className={`text-[10px] uppercase font-bold ${muted}`}>
            Total Records
          </p>

          <p className={`text-2xl font-black mt-1 ${heading}`}>
            {totalRecords}
          </p>
        </div>

        <div className={`border rounded-xl p-4 ${card}`}>
          <p className={`text-[10px] uppercase font-bold ${muted}`}>Active</p>

          <p className="text-2xl font-black text-emerald-500 mt-1">
            {activeRecords}
          </p>
        </div>

        <div className={`border rounded-xl p-4 ${card}`}>
          <p className={`text-[10px] uppercase font-bold ${muted}`}>Pending</p>

          <p className="text-2xl font-black text-amber-500 mt-1">
            {pendingRecords}
          </p>
        </div>

        <div className={`border rounded-xl p-4 ${card}`}>
          <p className={`text-[10px] uppercase font-bold ${muted}`}>
            Completed
          </p>

          <p className="text-2xl font-black text-blue-500 mt-1">
            {completedRecords}
          </p>
        </div>
      </div>

      {/* =====================================================
          RECORDS
      ===================================================== */}

      <section className={`border rounded-2xl overflow-hidden ${card}`}>
        {/* HEADER */}

        <div
          className={`px-5 py-4 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 ${border}`}
        >
          <div>
            <h2 className={`text-sm font-bold ${heading}`}>
              Internship Assignments
            </h2>

            <p className={`text-[10px] mt-1 ${muted}`}>
              Assignments created and managed through the Faculty Portal.
            </p>
          </div>

          <span
            className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${
              darkMode
                ? "bg-blue-900/40 text-blue-300"
                : "bg-blue-50 text-blue-600"
            }`}
          >
            {totalRecords} record{totalRecords !== 1 ? "s" : ""}
          </span>
        </div>

        {/* RECORD LIST */}

        {records.length > 0 ? (
          <div className={`divide-y ${border}`}>
            {records.map((assignment) => {
              const studentName = getStudentName(assignment);
              const companyName = getCompanyName(assignment);
              const opportunityTitle = getOpportunityTitle(assignment);
              const facultyName = getFacultyName(assignment);

              return (
                <div
                  key={assignment.id}
                  className={`p-5 transition ${
                    darkMode ? "hover:bg-slate-800/60" : "hover:bg-slate-50"
                  }`}
                >
                  <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
                    {/* LEFT */}

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p
                          className={`font-bold text-sm sm:text-base ${heading}`}
                        >
                          {assignment.id}
                        </p>

                        <span
                          className={`px-2.5 py-1 rounded-full border text-[10px] font-bold ${getStatusStyle(
                            assignment.status
                          )}`}
                        >
                          {assignment.status || "Pending"}
                        </span>
                      </div>

                      {/* STUDENT */}

                      <div className="mt-4">
                        <p
                          className={`text-[10px] uppercase tracking-wide font-bold ${muted}`}
                        >
                          Student
                        </p>

                        <p className={`text-sm font-semibold mt-1 ${heading}`}>
                          {studentName}
                        </p>
                      </div>

                      {/* ASSIGNMENT */}

                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                        <div>
                          <p
                            className={`text-[10px] uppercase tracking-wide font-bold ${muted}`}
                          >
                            Internship
                          </p>

                          <p className={`text-xs font-medium mt-1 ${heading}`}>
                            {opportunityTitle}
                          </p>
                        </div>

                        <div>
                          <p
                            className={`text-[10px] uppercase tracking-wide font-bold ${muted}`}
                          >
                            Company
                          </p>

                          <p className={`text-xs font-medium mt-1 ${heading}`}>
                            {companyName}
                          </p>
                        </div>

                        <div>
                          <p
                            className={`text-[10px] uppercase tracking-wide font-bold ${muted}`}
                          >
                            Faculty Adviser
                          </p>

                          <p className={`text-xs font-medium mt-1 ${heading}`}>
                            {facultyName}
                          </p>
                        </div>
                      </div>

                      {/* DATES */}

                      <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4">
                        <div>
                          <p
                            className={`text-[10px] uppercase tracking-wide font-bold ${muted}`}
                          >
                            Start Date
                          </p>

                          <p className={`text-xs font-medium mt-1 ${heading}`}>
                            {assignment.startDate || "—"}
                          </p>
                        </div>

                        <div>
                          <p
                            className={`text-[10px] uppercase tracking-wide font-bold ${muted}`}
                          >
                            End Date
                          </p>

                          <p className={`text-xs font-medium mt-1 ${heading}`}>
                            {assignment.endDate || "—"}
                          </p>
                        </div>

                        {assignment.createdAt && (
                          <div>
                            <p
                              className={`text-[10px] uppercase tracking-wide font-bold ${muted}`}
                            >
                              Created
                            </p>

                            <p
                              className={`text-xs font-medium mt-1 ${heading}`}
                            >
                              {assignment.createdAt}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* RIGHT */}

                    <div className="w-full xl:w-auto">
                      <label
                        className={`block text-[10px] uppercase font-bold mb-1.5 ${muted}`}
                      >
                        Assignment Status
                      </label>

                      <select
                        value={assignment.status || "Pending"}
                        onChange={(event) =>
                          setAssignmentStatus(assignment.id, event.target.value)
                        }
                        className={`w-full xl:w-40 border rounded-lg px-3 py-2 text-xs outline-none cursor-pointer ${
                          darkMode
                            ? "bg-slate-800 border-slate-700 text-white focus:border-blue-500"
                            : "bg-white border-slate-300 text-slate-700 focus:border-blue-500"
                        }`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Active">Active</option>
                        <option value="Completed">Completed</option>
                        <option value="Suspended">Suspended</option>
                        <option value="Terminated">Terminated</option>
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* EMPTY STATE */

          <div className="p-10 text-center">
            <div className="text-3xl mb-3">📋</div>

            <p className={`text-sm font-semibold ${heading}`}>
              No internship assignments yet
            </p>

            <p className={`text-xs mt-1 ${muted}`}>
              Approve an internship application in the Faculty Portal to create
              an assignment.
            </p>
          </div>
        )}
      </section>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <p className={`text-[10px] mt-3 ${muted}`}>
        Showing {records.length} shared internship assignment
        {records.length !== 1 ? "s" : ""}.
      </p>
    </div>
  );
}
