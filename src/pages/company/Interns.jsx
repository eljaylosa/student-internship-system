import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useMockStore } from "../../data/mockStore.jsx";

export default function Interns() {
  const { darkMode } = useOutletContext();
  const { state, recordAttendance } = useMockStore();

  const company = state.companies.find((item) => item.id === "COM-001");

  // Only officially deployed assignments should appear
  // in the company portal.
  //
  // Deployment is determined by:
  // 1. Assignment belongs to this company
  // 2. Assignment status is Active
  // 3. deployedAt has been set by deployAssignment()
  const assignments = state.assignments.filter(
    (item) =>
      item.companyId === company?.id &&
      item.status === "Active" &&
      item.deployedAt !== null
  );

  const [form, setForm] = useState({
    assignmentId: assignments[0]?.id || "",
    date: "2026-06-03",
    hours: "8",
    status: "Present",
    notes: "",
  });

  const card = darkMode
    ? "bg-slate-900 border-slate-700"
    : "bg-white border-slate-200";

  const handleAssignmentChange = (event) => {
    setForm((previous) => ({
      ...previous,
      assignmentId: event.target.value,
    }));
  };

  const handleSaveAttendance = () => {
    if (!form.assignmentId) {
      alert("No deployed intern selected.");
      return;
    }

    recordAttendance({
      ...form,
      hours: Number(form.hours),
    });
  };

  return (
    <div
      className={`p-5 md:p-6 lg:p-8 max-w-[1200px] mx-auto ${
        darkMode ? "text-slate-100" : "text-slate-900"
      }`}
    >
      <div className="mb-6">
        <p className="text-xs uppercase tracking-widest font-bold text-slate-400">
          Company Portal
        </p>

        <h1 className="text-2xl font-black">Assigned Interns</h1>

        <p className="text-sm mt-1 text-slate-500">
          View interns officially deployed to your company and record their
          attendance and progress.
        </p>
      </div>

      {assignments.length === 0 ? (
        <section className={`border rounded-2xl p-6 ${card}`}>
          <div className="text-center py-6">
            <div className="text-3xl mb-3">👥</div>

            <p className="font-semibold">No deployed interns yet.</p>

            <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
              Interns will appear here only after their required documents have
              been approved by the faculty adviser and the student has been
              officially deployed.
            </p>
          </div>
        </section>
      ) : (
        <>
          {/* =====================================================
              ATTENDANCE / PROGRESS
          ===================================================== */}

          <section className={`border rounded-2xl p-5 mb-5 ${card}`}>
            <h2 className="font-bold mb-4">Record attendance/progress</h2>

            <div className="grid md:grid-cols-5 gap-3">
              <select
                className="border rounded-lg px-3 py-2 text-sm"
                value={form.assignmentId}
                onChange={handleAssignmentChange}
              >
                {assignments.map((assignment) => (
                  <option key={assignment.id} value={assignment.id}>
                    {assignment.id} ·{" "}
                    {
                      state.students.find(
                        (item) => item.id === assignment.studentId
                      )?.fullName
                    }
                  </option>
                ))}
              </select>

              <input
                className="border rounded-lg px-3 py-2 text-sm"
                type="date"
                value={form.date}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    date: event.target.value,
                  }))
                }
              />

              <input
                className="border rounded-lg px-3 py-2 text-sm"
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

              <select
                className="border rounded-lg px-3 py-2 text-sm"
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

              <button
                className="rounded-lg bg-slate-900 text-white text-xs font-semibold"
                onClick={handleSaveAttendance}
              >
                Save Entry
              </button>
            </div>
          </section>

          {/* =====================================================
              DEPLOYED INTERNS
          ===================================================== */}

          <section className={`border rounded-2xl overflow-hidden ${card}`}>
            <div className="px-5 py-4 border-b border-slate-200">
              <h2 className="font-bold">Deployed Interns</h2>

              <p className="text-xs text-slate-500 mt-1">
                These students have completed document verification and have
                been officially deployed to your company.
              </p>
            </div>

            <div className="divide-y divide-slate-200">
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

                return (
                  <div
                    key={assignment.id}
                    className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold">
                          {student?.fullName || "Unknown Student"}
                        </p>

                        <span className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                          DEPLOYED
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 mt-1">
                        {assignment.id} · {assignment.startDate} to{" "}
                        {assignment.endDate}
                      </p>
                    </div>

                    <div className="text-xs text-slate-600">
                      {logs.length} progress entries · {totalHours} hours
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
