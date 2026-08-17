import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useMockStore, STATUS } from "../../data/mockStore.jsx";

const INTERN_CRITERIA = [
  "Professionalism",
  "Technical Skills",
  "Communication",
  "Teamwork",
  "Initiative",
  "Attendance",
];

const COMPANY_CRITERIA = [
  "Workplace Environment",
  "Supervisor Support",
  "Learning Opportunities",
  "Communication",
  "Professionalism",
  "Overall Internship Experience",
];

export default function Evaluation() {
  const { darkMode } = useOutletContext();
  const { state, submitEvaluation } = useMockStore();

  const currentStudentId = state.currentUser?.profileId;

  // =========================================================
  // CURRENT STUDENT
  // =========================================================

  const student = state.students.find((item) => item.id === currentStudentId);

  // =========================================================
  // STUDENT'S ASSIGNMENT
  // =========================================================

  const assignment = state.assignments.find(
    (item) =>
      item.studentId === currentStudentId &&
      item.status === STATUS.assignment.ACTIVE
  );

  // =========================================================
  // COMPANY
  // =========================================================

  const company = state.companies.find(
    (item) => item.id === assignment?.companyId
  );

  // =========================================================
  // COMPANY EVALUATION OF STUDENT
  // =========================================================

  const companyEvaluation = state.evaluations.find(
    (item) =>
      item.assignmentId === assignment?.id &&
      item.evaluatorRole === "Company Supervisor" &&
      item.type === "intern_evaluation"
  );

  // =========================================================
  // EMPLOYER FEEDBACK
  // =========================================================

  const employerFeedback = state.evaluations.find(
    (item) =>
      item.assignmentId === assignment?.id &&
      item.evaluatorRole === "Company Supervisor" &&
      item.type === "employer_feedback"
  );

  // =========================================================
  // STUDENT EVALUATION OF COMPANY
  // =========================================================

  const studentCompanyEvaluation = state.evaluations.find(
    (item) =>
      item.assignmentId === assignment?.id &&
      item.evaluatorRole === "Student" &&
      item.type === "company_evaluation"
  );

  // =========================================================
  // COMPANY EVALUATION FORM
  // =========================================================

  const [companyRatings, setCompanyRatings] = useState(
    Object.fromEntries(COMPANY_CRITERIA.map((criterion) => [criterion, 3]))
  );

  const [companyComments, setCompanyComments] = useState("");

  const [companySubmitted, setCompanySubmitted] = useState(false);

  // =========================================================
  // AVERAGE COMPANY RATING OF STUDENT
  // =========================================================

  const internRatingValues = companyEvaluation
    ? INTERN_CRITERIA.map((criterion) =>
        Number(companyEvaluation.ratings?.[criterion] || 0)
      )
    : [];

  const averageInternRating =
    internRatingValues.length > 0
      ? internRatingValues.reduce((sum, rating) => sum + rating, 0) /
        internRatingValues.length
      : 0;

  // =========================================================
  // AVERAGE STUDENT RATING OF COMPANY
  // =========================================================

  const companyRatingValues = studentCompanyEvaluation
    ? COMPANY_CRITERIA.map((criterion) =>
        Number(studentCompanyEvaluation.ratings?.[criterion] || 0)
      )
    : [];

  const averageCompanyRating =
    companyRatingValues.length > 0
      ? companyRatingValues.reduce((sum, rating) => sum + rating, 0) /
        companyRatingValues.length
      : 0;

  // =========================================================
  // FEEDBACK PARSER
  // =========================================================

  const feedbackText = employerFeedback?.comments || "";

  const strengths =
    feedbackText.match(
      /Strengths:\s*([\s\S]*?)(?=\n\nAreas for improvement:|$)/
    )?.[1] || "";

  const improvements =
    feedbackText.match(
      /Areas for improvement:\s*([\s\S]*?)(?=\n\nRecommendation:|$)/
    )?.[1] || "";

  const recommendation =
    feedbackText.match(/Recommendation:\s*([\s\S]*)$/)?.[1] || "";

  // =========================================================
  // STYLES
  // =========================================================

  const pageText = darkMode ? "text-slate-100" : "text-slate-900";

  const card = darkMode
    ? "bg-slate-900 border-slate-700"
    : "bg-white border-slate-200";

  const mutedText = darkMode ? "text-slate-400" : "text-slate-500";

  const inputClass = darkMode
    ? "bg-slate-800 border-slate-700 text-slate-100"
    : "bg-white border-slate-200 text-slate-900";

  // =========================================================
  // SUBMIT STUDENT → COMPANY EVALUATION
  // =========================================================

  const submitCompanyEvaluation = (event) => {
    event.preventDefault();

    if (!assignment) {
      alert("No active internship assignment found.");
      return;
    }

    if (!companyComments.trim()) {
      alert("Please provide written feedback about the company.");
      return;
    }

    if (studentCompanyEvaluation) {
      alert("You have already submitted an evaluation for this company.");
      return;
    }

    submitEvaluation({
      assignmentId: assignment.id,

      evaluatorRole: "Student",

      evaluatorId: currentStudentId,

      type: "company_evaluation",

      ratings: companyRatings,

      comments: companyComments.trim(),
    });

    setCompanyComments("");

    setCompanyRatings(
      Object.fromEntries(COMPANY_CRITERIA.map((criterion) => [criterion, 3]))
    );

    setCompanySubmitted(true);
  };

  // =========================================================
  // NO ASSIGNMENT
  // =========================================================

  if (!assignment) {
    return (
      <div className={`p-5 md:p-6 lg:p-8 max-w-[1000px] mx-auto ${pageText}`}>
        <div className="mb-6">
          <p className="text-xs uppercase tracking-widest font-bold text-slate-400">
            Student Portal
          </p>

          <h1 className="text-2xl font-black">Internship Evaluation</h1>

          <p className={`text-sm mt-1 ${mutedText}`}>
            View your internship evaluation and provide feedback about your
            internship company.
          </p>
        </div>

        <section className={`border rounded-2xl p-6 ${card}`}>
          <div className="text-center py-8">
            <div className="text-4xl mb-3">📋</div>

            <p className="font-semibold">
              No active internship assignment found.
            </p>

            <p className={`text-sm mt-1 ${mutedText}`}>
              Your evaluation page will become available after you are
              officially deployed to an internship.
            </p>
          </div>
        </section>
      </div>
    );
  }

  // =========================================================
  // MAIN PAGE
  // =========================================================

  return (
    <div className={`p-5 md:p-6 lg:p-8 max-w-[1000px] mx-auto ${pageText}`}>
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="mb-6">
        <p className="text-xs uppercase tracking-widest font-bold text-slate-400">
          Student Portal
        </p>

        <h1 className="text-2xl font-black">Internship Evaluation</h1>

        <p className={`text-sm mt-1 ${mutedText}`}>
          View your performance evaluation and provide feedback about your
          internship company.
        </p>
      </div>

      {/* =====================================================
          SUBMISSION SUCCESS
      ===================================================== */}

      {companySubmitted && (
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
            Company evaluation submitted successfully.
          </p>

          <p
            className={`text-xs mt-1 ${
              darkMode ? "text-emerald-400" : "text-emerald-600"
            }`}
          >
            Thank you for providing feedback about your internship experience.
          </p>
        </div>
      )}

      {/* =====================================================
          INTERNSHIP SUMMARY
      ===================================================== */}

      <section className={`border rounded-2xl p-5 mb-5 ${card}`}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className={`text-xs uppercase tracking-wide ${mutedText}`}>
              Internship Assignment
            </p>

            <h2 className="font-bold text-lg mt-1">{assignment.id}</h2>

            <p className={`text-sm mt-1 ${mutedText}`}>
              {student?.fullName || "Student"} · {company?.name || "Company"}
            </p>

            <p className={`text-xs mt-1 ${mutedText}`}>
              {assignment.startDate} to {assignment.endDate}
            </p>
          </div>

          <div className="px-3 py-2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold self-start md:self-center">
            {assignment.status}
          </div>
        </div>
      </section>

      {/* =====================================================
          COMPANY EVALUATION OF STUDENT
      ===================================================== */}

      {companyEvaluation ? (
        <section className={`border rounded-2xl overflow-hidden mb-5 ${card}`}>
          <div className="px-5 py-4 border-b border-slate-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div>
                <h2 className="font-bold">Company Supervisor Evaluation</h2>

                <p className={`text-xs mt-1 ${mutedText}`}>
                  Evaluation submitted by your company supervisor.
                </p>
              </div>

              <div className="text-left md:text-right">
                <p className="text-2xl font-black">
                  {averageInternRating.toFixed(2)}
                  <span className={`text-sm font-medium ${mutedText}`}>
                    {" "}
                    / 5
                  </span>
                </p>

                <p className={`text-[10px] ${mutedText}`}>Overall Rating</p>
              </div>
            </div>
          </div>

          <div className="p-5">
            <div className="grid md:grid-cols-2 gap-3">
              {INTERN_CRITERIA.map((criterion) => {
                const rating = Number(
                  companyEvaluation.ratings?.[criterion] || 0
                );

                return (
                  <div
                    key={criterion}
                    className={`border rounded-xl p-4 ${
                      darkMode
                        ? "border-slate-700 bg-slate-800/50"
                        : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">{criterion}</p>

                      <p className="font-black">{rating}/5</p>
                    </div>

                    <div className="mt-3 flex gap-1">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <div
                          key={value}
                          className={`h-2 flex-1 rounded-full ${
                            value <= rating
                              ? "bg-emerald-500"
                              : darkMode
                              ? "bg-slate-700"
                              : "bg-slate-200"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {companyEvaluation.comments && (
              <div className="mt-5">
                <h3 className="text-sm font-bold mb-2">Supervisor Comments</h3>

                <div
                  className={`border rounded-xl p-4 text-sm leading-relaxed ${
                    darkMode
                      ? "border-slate-700 bg-slate-800/50 text-slate-300"
                      : "border-slate-200 bg-slate-50 text-slate-600"
                  }`}
                >
                  {companyEvaluation.comments}
                </div>
              </div>
            )}
          </div>
        </section>
      ) : (
        <section className={`border rounded-2xl p-6 mb-5 ${card}`}>
          <div className="text-center py-5">
            <div className="text-3xl mb-3">⏳</div>

            <p className="font-semibold">
              Company evaluation not yet available.
            </p>

            <p className={`text-sm mt-1 ${mutedText}`}>
              Your company supervisor has not submitted an evaluation for your
              internship yet.
            </p>

            <div className="mt-4 inline-flex items-center px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold">
              Pending Evaluation
            </div>
          </div>
        </section>
      )}

      {/* =====================================================
          EMPLOYER FEEDBACK
      ===================================================== */}

      {employerFeedback && (
        <section className={`border rounded-2xl overflow-hidden mb-5 ${card}`}>
          <div className="px-5 py-4 border-b border-slate-200">
            <h2 className="font-bold">Employer Feedback</h2>

            <p className={`text-xs mt-1 ${mutedText}`}>
              Additional feedback provided by your company supervisor.
            </p>
          </div>

          <div className="p-5 space-y-5">
            {/* STRENGTHS */}

            <div>
              <h3 className="text-sm font-bold mb-2">Strengths</h3>

              <div
                className={`border rounded-xl p-4 text-sm leading-relaxed ${
                  darkMode
                    ? "border-slate-700 bg-slate-800/50 text-slate-300"
                    : "border-slate-200 bg-slate-50 text-slate-600"
                }`}
              >
                {strengths || "No strengths provided."}
              </div>
            </div>

            {/* IMPROVEMENTS */}

            <div>
              <h3 className="text-sm font-bold mb-2">Areas for Improvement</h3>

              <div
                className={`border rounded-xl p-4 text-sm leading-relaxed ${
                  darkMode
                    ? "border-slate-700 bg-slate-800/50 text-slate-300"
                    : "border-slate-200 bg-slate-50 text-slate-600"
                }`}
              >
                {improvements || "No areas for improvement provided."}
              </div>
            </div>

            {/* RECOMMENDATION */}

            <div>
              <h3 className="text-sm font-bold mb-2">Recommendation</h3>

              <div className="inline-flex px-3 py-2 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold">
                {recommendation || "No recommendation provided."}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* =====================================================
          STUDENT → COMPANY EVALUATION
      ===================================================== */}

      <section className={`border rounded-2xl overflow-hidden ${card}`}>
        <div className="px-5 py-4 border-b border-slate-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div>
              <h2 className="font-bold">Evaluate Your Internship Company</h2>

              <p className={`text-xs mt-1 ${mutedText}`}>
                Share your experience working with{" "}
                {company?.name || "your internship company"}.
              </p>
            </div>

            {studentCompanyEvaluation && (
              <div className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                Submitted
              </div>
            )}
          </div>
        </div>

        <div className="p-5">
          {/* =================================================
              ALREADY SUBMITTED
          ================================================= */}

          {studentCompanyEvaluation ? (
            <div>
              <div className="mb-5">
                <p className={`text-xs uppercase tracking-wide ${mutedText}`}>
                  Your Overall Rating
                </p>

                <div className="flex items-center gap-3 mt-2">
                  <p className="text-3xl font-black">
                    {averageCompanyRating.toFixed(2)}
                  </p>

                  <div>
                    <p className="text-sm font-bold">/ 5</p>

                    <p className={`text-xs ${mutedText}`}>Overall Experience</p>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                {COMPANY_CRITERIA.map((criterion) => {
                  const rating = Number(
                    studentCompanyEvaluation.ratings?.[criterion] || 0
                  );

                  return (
                    <div
                      key={criterion}
                      className={`border rounded-xl p-4 ${
                        darkMode
                          ? "border-slate-700 bg-slate-800/50"
                          : "border-slate-200 bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold">{criterion}</p>

                        <p className="font-black">{rating}/5</p>
                      </div>

                      <div className="mt-3 flex gap-1">
                        {[1, 2, 3, 4, 5].map((value) => (
                          <div
                            key={value}
                            className={`h-2 flex-1 rounded-full ${
                              value <= rating
                                ? "bg-blue-500"
                                : darkMode
                                ? "bg-slate-700"
                                : "bg-slate-200"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {studentCompanyEvaluation.comments && (
                <div className="mt-5">
                  <h3 className="text-sm font-bold mb-2">Your Comments</h3>

                  <div
                    className={`border rounded-xl p-4 text-sm leading-relaxed ${
                      darkMode
                        ? "border-slate-700 bg-slate-800/50 text-slate-300"
                        : "border-slate-200 bg-slate-50 text-slate-600"
                    }`}
                  >
                    {studentCompanyEvaluation.comments}
                  </div>
                </div>
              )}

              <div
                className={`mt-5 p-4 rounded-xl border ${
                  darkMode
                    ? "border-slate-700 bg-slate-800/40"
                    : "border-slate-200 bg-slate-50"
                }`}
              >
                <p className="text-xs font-semibold">Evaluation submitted</p>

                <p className={`text-xs mt-1 ${mutedText}`}>
                  Your feedback has been recorded and is available to authorized
                  users of the internship management system.
                </p>
              </div>
            </div>
          ) : (
            /* =================================================
               EVALUATION FORM
            ================================================= */

            <form onSubmit={submitCompanyEvaluation}>
              <div className="mb-5">
                <h3 className="text-sm font-bold">Rate Your Experience</h3>

                <p className={`text-xs mt-1 ${mutedText}`}>
                  Rate each aspect of your internship experience from 1 to 5.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                {COMPANY_CRITERIA.map((criterion) => (
                  <label
                    key={criterion}
                    className={`border rounded-xl p-4 ${
                      darkMode
                        ? "border-slate-700 bg-slate-800/50"
                        : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-semibold">{criterion}</span>

                      <span className="text-xs font-bold text-slate-400">
                        {companyRatings[criterion]}/5
                      </span>
                    </div>

                    <select
                      className={`block w-full border rounded-lg mt-3 px-2 py-2 text-sm ${inputClass}`}
                      value={companyRatings[criterion]}
                      onChange={(event) =>
                        setCompanyRatings((previous) => ({
                          ...previous,
                          [criterion]: Number(event.target.value),
                        }))
                      }
                    >
                      <option value={1}>1 — Poor</option>
                      <option value={2}>2 — Needs Improvement</option>
                      <option value={3}>3 — Satisfactory</option>
                      <option value={4}>4 — Good</option>
                      <option value={5}>5 — Excellent</option>
                    </select>
                  </label>
                ))}
              </div>

              {/* =================================================
                  COMPANY COMMENTS
              ================================================= */}

              <div className="mt-5">
                <label className="block text-xs font-semibold mb-2">
                  Written Feedback
                </label>

                <textarea
                  className={`w-full border rounded-lg px-3 py-2 text-sm ${inputClass} ${
                    darkMode ? "placeholder:text-slate-500" : ""
                  }`}
                  rows="6"
                  value={companyComments}
                  onChange={(event) => {
                    setCompanyComments(event.target.value);
                    setCompanySubmitted(false);
                  }}
                  placeholder="Share your experience with the company, supervisor, workplace environment, learning opportunities, and overall internship."
                />
              </div>

              {/* =================================================
                  SUBMIT
              ================================================= */}

              <div className="mt-5 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition"
                >
                  Submit Company Evaluation
                </button>
              </div>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
