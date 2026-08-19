import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";

// Temporary page-local demo data. This page intentionally has no mockStore dependency.
const localState = {
  "assignments": [],
  "currentUser": {
    "id": "USR-002",
    "role": "registrar",
    "email": "registrar@gmail.com",
    "password": "password",
    "status": "Active",
    "profileId": "FAC-001"
  },
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
  ]
};

export default function Feedback() {
  const { darkMode } = useOutletContext();
  const state = localState;
  const submitEvaluation = (...args) => { void args; };

  // Only officially deployed interns can receive employer feedback.
  const assignments = state.assignments.filter(
    (item) =>
      item.companyId === "COM-001" &&
      item.status === "Active" &&
      item.deployedAt !== null
  );

  const [assignmentId, setAssignmentId] = useState(assignments[0]?.id || "");

  const [form, setForm] = useState({
    strengths: "",
    improvements: "",
    recommendation: "",
  });

  const [submitted, setSubmitted] = useState(false);

  const card = darkMode
    ? "bg-slate-900 border-slate-700"
    : "bg-white border-slate-200";

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!assignmentId) {
      alert("Please select an intern.");
      return;
    }

    if (!form.strengths.trim()) {
      alert("Please provide the intern's strengths.");
      return;
    }

    if (!form.improvements.trim()) {
      alert("Please provide areas for improvement.");
      return;
    }

    if (!form.recommendation) {
      alert("Please select a recommendation.");
      return;
    }

    submitEvaluation({
      assignmentId,

      evaluatorRole: "Company Supervisor",

      evaluatorId: state.currentUser?.profileId,

      type: "employer_feedback",

      ratings: {},

      comments: `Strengths: ${form.strengths.trim()}

Areas for improvement: ${form.improvements.trim()}

Recommendation: ${form.recommendation}`,
    });

    setForm({
      strengths: "",
      improvements: "",
      recommendation: "",
    });

    setSubmitted(true);
  };

  return (
    <div
      className={`p-5 md:p-6 lg:p-8 max-w-[1000px] mx-auto ${
        darkMode ? "text-slate-100" : "text-slate-900"
      }`}
    >
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="mb-6">
        <p className="text-xs uppercase tracking-widest font-bold text-slate-400">
          Company Portal
        </p>

        <h1 className="text-2xl font-black">Employer Feedback</h1>

        <p className="text-sm mt-1 text-slate-500">
          Provide qualitative feedback about an intern's performance,
          development, and overall internship experience.
        </p>
      </div>

      {/* =====================================================
          SUCCESS MESSAGE
      ===================================================== */}

      {submitted && (
        <div
          className={`mb-5 border rounded-2xl p-4 ${
            darkMode
              ? "bg-emerald-950/30 border-emerald-800"
              : "bg-emerald-50 border-emerald-200"
          }`}
        >
          <p
            className={`font-bold text-sm ${
              darkMode ? "text-emerald-300" : "text-emerald-700"
            }`}
          >
            Employer feedback submitted successfully.
          </p>

          <p
            className={`text-xs mt-1 ${
              darkMode ? "text-emerald-400" : "text-emerald-600"
            }`}
          >
            The feedback has been recorded and will be available alongside the
            intern's evaluation.
          </p>
        </div>
      )}

      {/* =====================================================
          NO DEPLOYED INTERNS
      ===================================================== */}

      {assignments.length === 0 ? (
        <section className={`border rounded-2xl p-6 ${card}`}>
          <div className="text-center py-6">
            <div className="text-3xl mb-3">💬</div>

            <p className="font-semibold">
              No interns are available for feedback.
            </p>

            <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
              Employer feedback can only be submitted for students who have been
              officially deployed to your company.
            </p>
          </div>
        </section>
      ) : (
        /* =====================================================
           FEEDBACK FORM
        ===================================================== */

        <form
          className={`border rounded-2xl p-6 space-y-5 ${card}`}
          onSubmit={handleSubmit}
        >
          {/* =====================================================
              INTERN SELECTION
          ===================================================== */}

          <div>
            <label className="block text-xs font-semibold mb-2">
              Internship Assignment
            </label>

            <select
              className={`w-full border rounded-lg px-3 py-2 text-sm ${
                darkMode
                  ? "bg-slate-800 border-slate-700 text-slate-100"
                  : "bg-white border-slate-200 text-slate-900"
              }`}
              value={assignmentId}
              onChange={(event) => {
                setAssignmentId(event.target.value);
                setSubmitted(false);
              }}
            >
              {assignments.map((assignment) => {
                const student = state.students.find(
                  (item) => item.id === assignment.studentId
                );

                return (
                  <option key={assignment.id} value={assignment.id}>
                    {assignment.id} · {student?.fullName || "Unknown Student"}
                  </option>
                );
              })}
            </select>
          </div>

          {/* =====================================================
              STRENGTHS
          ===================================================== */}

          <div>
            <label className="block text-xs font-semibold mb-2">
              Strengths
            </label>

            <textarea
              className={`w-full border rounded-lg px-3 py-2 text-sm ${
                darkMode
                  ? "bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500"
                  : "bg-white border-slate-200 text-slate-900"
              }`}
              rows="5"
              placeholder="Describe the intern's strengths, accomplishments, and positive contributions."
              value={form.strengths}
              onChange={(event) => {
                setForm((previous) => ({
                  ...previous,
                  strengths: event.target.value,
                }));

                setSubmitted(false);
              }}
            />
          </div>

          {/* =====================================================
              AREAS FOR IMPROVEMENT
          ===================================================== */}

          <div>
            <label className="block text-xs font-semibold mb-2">
              Areas for Improvement
            </label>

            <textarea
              className={`w-full border rounded-lg px-3 py-2 text-sm ${
                darkMode
                  ? "bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500"
                  : "bg-white border-slate-200 text-slate-900"
              }`}
              rows="5"
              placeholder="Describe areas where the intern can continue improving."
              value={form.improvements}
              onChange={(event) => {
                setForm((previous) => ({
                  ...previous,
                  improvements: event.target.value,
                }));

                setSubmitted(false);
              }}
            />
          </div>

          {/* =====================================================
              RECOMMENDATION
          ===================================================== */}

          <div>
            <label className="block text-xs font-semibold mb-2">
              Recommendation
            </label>

            <select
              className={`w-full border rounded-lg px-3 py-2 text-sm ${
                darkMode
                  ? "bg-slate-800 border-slate-700 text-slate-100"
                  : "bg-white border-slate-200 text-slate-900"
              }`}
              value={form.recommendation}
              onChange={(event) => {
                setForm((previous) => ({
                  ...previous,
                  recommendation: event.target.value,
                }));

                setSubmitted(false);
              }}
            >
              <option value="">Select recommendation</option>
              <option value="Recommend">Recommend</option>
              <option value="Recommend with conditions">
                Recommend with conditions
              </option>
              <option value="Do not recommend">Do not recommend</option>
            </select>
          </div>

          {/* =====================================================
              SUBMIT
          ===================================================== */}

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition"
            >
              Submit Feedback
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
