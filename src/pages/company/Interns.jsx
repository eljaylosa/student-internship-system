import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";

// Temporary page-local demo data. This page intentionally has no mockStore dependency.
const localState = {
  "companies": [
    {
      "id": "COM-001",
      "name": "ABC Technologies",
      "industry": "Information Technology",
      "status": "Verified",
      "address": "Balanga, Bataan",
      "email": "hr@abctech.com",
      "supervisorIds": [
        "SUP-001"
      ]
    }
  ],
  "assignments": [],
  "students": [
    {
      "id": "STU-001",
      "userId": "USR-001",
      "fullName": "John Doe",
      "email": "student@gmail.com",
      "studentId": "STU-001",
      "program": "BS Information Technology",
      "yearLevel": "2nd Year",
      "department": "College of Information and Communications Technology",
      "facultyId": "FAC-001",
      "phone": "+63 912 345 6789",
      "address": "Limay, Bataan",
      "gwa": "1.75"
    }
  ],
  "attendance": []
};
const STATUS = {
  "user": {
    "ACTIVE": "Active",
    "INACTIVE": "Inactive",
    "PENDING": "Pending"
  },
  "company": {
    "PENDING": "Pending",
    "VERIFIED": "Verified",
    "ACTIVE": "Active",
    "INACTIVE": "Inactive"
  },
  "opportunity": {
    "DRAFT": "Draft",
    "ACTIVE": "Active",
    "CLOSED": "Closed"
  },
  "application": {
    "DRAFT": "Draft",
    "SUBMITTED": "Submitted",
    "UNDER_REVIEW": "Under Review",
    "INFO_REQUESTED": "Information Requested",
    "APPROVED": "Approved",
    "REJECTED": "Rejected",
    "WITHDRAWN": "Withdrawn"
  },
  "assignment": {
    "PENDING": "Pending",
    "ACTIVE": "Active",
    "COMPLETED": "Completed",
    "SUSPENDED": "Suspended",
    "TERMINATED": "Terminated"
  },
  "document": {
    "NOT_SUBMITTED": "Not Submitted",
    "SUBMITTED": "Submitted",
    "PENDING_REVIEW": "Pending Review",
    "APPROVED": "Approved",
    "NEEDS_REVISION": "Needs Revision"
  },
  "evaluation": {
    "DRAFT": "Draft",
    "SUBMITTED": "Submitted",
    "RETURNED": "Returned",
    "FINALIZED": "Finalized"
  }
};

export default function Interns() {
  const { darkMode } = useOutletContext();
  const state = localState;
  const recordAttendance = (...args) => { void args; };
  const setAssignmentStatus = (...args) => { void args; };

  const company = state.companies.find((item) => item.id === "COM-001");

  /*
   * Only officially deployed assignments appear here.
   *
   * Active:
   *   Intern is currently deployed.
   *
   * Completed:
   *   Company has confirmed that the internship is finished.
   *
   * Completed assignments remain visible so the company can still
   * review the intern's attendance/progress history.
   */
  const assignments = state.assignments.filter(
    (item) =>
      item.companyId === company?.id &&
      ["Active", "Completed"].includes(item.status) &&
      item.deployedAt !== null
  );

  const activeAssignments = assignments.filter(
    (item) => item.status === "Active"
  );

  const [form, setForm] = useState({
    assignmentId: activeAssignments[0]?.id || "",
    date: "2026-06-03",
    hours: "8",
    status: "Present",
    notes: "",
  });

  const card = darkMode
    ? "bg-slate-900 border-slate-700"
    : "bg-white border-slate-200";

  const heading = darkMode ? "text-slate-100" : "text-slate-900";

  const muted = darkMode ? "text-slate-400" : "text-slate-500";

  const input = darkMode
    ? "bg-slate-800 border-slate-700 text-slate-200"
    : "bg-white border-slate-300 text-slate-800";

  const handleAssignmentChange = (event) => {
    setForm((previous) => ({
      ...previous,
      assignmentId: event.target.value,
    }));
  };

  const handleSaveAttendance = () => {
    if (!form.assignmentId) {
      alert("No active intern selected.");
      return;
    }

    recordAttendance({
      ...form,
      hours: Number(form.hours),
    });

    alert("Attendance entry saved successfully.");
  };

  const handleCompleteInternship = (assignmentId, studentName) => {
    const confirmed = window.confirm(
      `Are you sure you want to mark ${studentName}'s internship as completed?`
    );

    if (!confirmed) return;

    setAssignmentStatus(assignmentId, "Completed");

    alert("Internship marked as completed.");
  };

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
          View officially deployed interns, record their attendance, and mark
          completed internships.
        </p>
      </div>

      {assignments.length === 0 ? (
        <section className={`border rounded-2xl p-6 ${card}`}>
          <div className="text-center py-6">
            <div className="text-3xl mb-3">👥</div>

            <p className={`font-semibold ${heading}`}>
              No deployed interns yet.
            </p>

            <p className={`text-sm mt-1 max-w-md mx-auto ${muted}`}>
              Interns will appear here only after their required documents have
              been approved by the registrar and the student has been
              officially deployed.
            </p>
          </div>
        </section>
      ) : (
        <>
          {/* =====================================================
              ATTENDANCE / PROGRESS
          ===================================================== */}

          {activeAssignments.length > 0 && (
            <section className={`border rounded-2xl p-5 mb-5 ${card}`}>
              <div className="mb-4">
                <h2 className={`font-bold ${heading}`}>
                  Record Attendance / Progress
                </h2>

                <p className={`text-xs mt-1 ${muted}`}>
                  Record daily attendance and internship hours for active
                  interns.
                </p>
              </div>

              <div className="grid md:grid-cols-5 gap-3">
                {/* INTERN */}

                <select
                  className={`border rounded-lg px-3 py-2 text-sm ${input}`}
                  value={form.assignmentId}
                  onChange={handleAssignmentChange}
                >
                  {activeAssignments.map((assignment) => {
                    const student = state.students.find(
                      (item) => item.id === assignment.studentId
                    );

                    return (
                      <option key={assignment.id} value={assignment.id}>
                        {student?.fullName || "Unknown Student"}
                      </option>
                    );
                  })}
                </select>

                {/* DATE */}

                <input
                  className={`border rounded-lg px-3 py-2 text-sm ${input}`}
                  type="date"
                  value={form.date}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      date: event.target.value,
                    }))
                  }
                />

                {/* HOURS */}

                <input
                  className={`border rounded-lg px-3 py-2 text-sm ${input}`}
                  type="number"
                  min="0"
                  value={form.hours}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      hours: event.target.value,
                    }))
                  }
                />

                {/* STATUS */}

                <select
                  className={`border rounded-lg px-3 py-2 text-sm ${input}`}
                  value={form.status}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      status: event.target.value,
                    }))
                  }
                >
                  <option>Present</option>
                  <option>Absent</option>
                  <option>Excused</option>
                </select>

                {/* SAVE */}

                <button
                  className="rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition"
                  onClick={handleSaveAttendance}
                >
                  Save Entry
                </button>
              </div>
            </section>
          )}

          {/* =====================================================
              DEPLOYED INTERNS
          ===================================================== */}

          <section className={`border rounded-2xl overflow-hidden ${card}`}>
            <div
              className={`px-5 py-4 border-b ${
                darkMode ? "border-slate-700" : "border-slate-200"
              }`}
            >
              <h2 className={`font-bold ${heading}`}>Assigned Interns</h2>

              <p className={`text-xs mt-1 ${muted}`}>
                Manage currently deployed and completed internship
                assignments.
              </p>
            </div>

            <div
              className={`divide-y ${
                darkMode ? "divide-slate-700" : "divide-slate-200"
              }`}
            >
              {assignments.map((assignment) => {
                const student = state.students.find(
                  (item) => item.id === assignment.studentId
                );

                const logs = state.attendance.filter(
                  (item) => item.assignmentId === assignment.id
                );

                const totalHours = logs.reduce(
                  (sum, item) => sum + Number(item.hours || 0),
                  0
                );

                const isCompleted = assignment.status === "Completed";

                return (
                  <div
                    key={assignment.id}
                    className="p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5"
                  >
                    {/* =================================================
                        INTERN INFORMATION
                    ================================================= */}

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
                        {assignment.id} · {assignment.startDate} to{" "}
                        {assignment.endDate}
                      </p>

                      <p className={`text-xs mt-1 ${muted}`}>
                        {logs.length} progress entries · {totalHours} hours
                      </p>
                    </div>

                    {/* =================================================
                        ACTIONS
                    ================================================= */}

                    <div className="flex flex-wrap items-center gap-2">
                      {isCompleted ? (
                        <span
                          className={`px-4 py-2 rounded-lg text-xs font-semibold ${
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
                );
              })}
            </div>
          </section>
        </>
      )}
    </div>
  );
}