import React, { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";

// Temporary page-local demo data. This page intentionally has no mockStore dependency.
const localState = {
  "supervisors": [
    {
      "id": "SUP-001",
      "userId": "USR-003",
      "companyId": "COM-001",
      "fullName": "Mark Cruz",
      "email": "company@gmail.com",
      "position": "Company Supervisor"
    }
  ],
  "currentUser": {
    "id": "USR-002",
    "role": "registrar",
    "email": "registrar@gmail.com",
    "password": "password",
    "status": "Active",
    "profileId": "FAC-001"
  },
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
  "evaluations": []
};

const CRITERIA = [
  "Professionalism",
  "Technical Skills",
  "Communication",
  "Teamwork",
  "Initiative",
  "Attendance",
];

export default function Evaluate() {
  const { darkMode } = useOutletContext();
  const state = localState;
  const submitEvaluation = (...args) => { void args; };

  // =========================================================
  // CURRENT COMPANY / SUPERVISOR
  // =========================================================

  const currentSupervisor = state.supervisors.find(
    (item) => item.id === state.currentUser?.profileId
  );

  const companyId = currentSupervisor?.companyId;

  const company = state.companies.find((item) => item.id === companyId);

  // =========================================================
  // DEPLOYED INTERNS
  // =========================================================

  const assignments = useMemo(
    () =>
      state.assignments.filter(
        (item) =>
          item.companyId === companyId &&
          item.status === "Active" &&
          item.deployedAt !== null
      ),
    [state.assignments, companyId]
  );

  // =========================================================
  // EVALUATION FORM STATE
  // =========================================================

  const [assignmentId, setAssignmentId] = useState(assignments[0]?.id || "");

  const [ratings, setRatings] = useState(
    Object.fromEntries(CRITERIA.map((criterion) => [criterion, 3]))
  );

  const [comments, setComments] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // =========================================================
  // CARD STYLING
  // =========================================================

  const card = darkMode
    ? "bg-slate-900 border-slate-700"
    : "bg-white border-slate-200";

  const softCard = darkMode
    ? "bg-slate-800/50 border-slate-700"
    : "bg-slate-50 border-slate-200";

  const input = darkMode
    ? "bg-slate-800 border-slate-700 text-slate-100"
    : "bg-white border-slate-200 text-slate-900";

  // =========================================================
  // HELPERS
  // =========================================================

  const getAssignment = (id) =>
    state.assignments.find((item) => item.id === id);

  const getStudentName = (id) => {
    const assignment = getAssignment(id);

    const student = state.students.find(
      (item) => item.id === assignment?.studentId
    );

    return student?.fullName || "Unknown Student";
  };

  const getStudentId = (id) => {
    const assignment = getAssignment(id);

    return assignment?.studentId || null;
  };

  const renderStars = (value) => {
    const rating = Number(value) || 0;

    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={
              star <= rating
                ? "text-amber-400"
                : darkMode
                ? "text-slate-600"
                : "text-slate-300"
            }
          >
            ★
          </span>
        ))}

        <span className="ml-2 text-xs font-semibold text-slate-500">
          {rating}/5
        </span>
      </div>
    );
  };

  // =========================================================
  // RATING CHANGE
  // =========================================================

  const handleRatingChange = (criterion, value) => {
    setRatings((previous) => ({
      ...previous,
      [criterion]: Number(value),
    }));

    setSubmitted(false);
  };

  // =========================================================
  // COMPANY → STUDENT EVALUATION
  // =========================================================

  const submit = (event) => {
    event.preventDefault();

    if (!assignmentId) {
      alert("Please select an intern.");
      return;
    }

    if (!comments.trim()) {
      alert("Please provide written feedback.");
      return;
    }

    submitEvaluation({
      assignmentId,
      evaluatorRole: "Company Supervisor",
      evaluatorId: state.currentUser?.profileId,
      evaluatedRole: "Student",
      evaluatedId: getStudentId(assignmentId),
      type: "intern_evaluation",
      ratings,
      comments: comments.trim(),
    });

    setComments("");

    setRatings(Object.fromEntries(CRITERIA.map((criterion) => [criterion, 3])));

    setSubmitted(true);
  };

  // =========================================================
  // STUDENT → COMPANY EVALUATIONS
  // =========================================================

  const studentCompanyEvaluations = useMemo(
    () =>
      state.evaluations.filter(
        (evaluation) =>
          evaluation.evaluatorRole === "Student" &&
          evaluation.evaluatedRole === "Company" &&
          evaluation.evaluatedId === companyId
      ),
    [state.evaluations, companyId]
  );

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div
      className={`p-5 md:p-6 lg:p-8 max-w-[1100px] mx-auto ${
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

        <h1 className="text-2xl font-black">Evaluations</h1>

        <p className="text-sm mt-1 text-slate-500">
          Evaluate your assigned interns and review evaluations submitted by
          interns about your company.
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
            Evaluation submitted successfully.
          </p>

          <p
            className={`text-xs mt-1 ${
              darkMode ? "text-emerald-400" : "text-emerald-600"
            }`}
          >
            The evaluation has been recorded and will be available to the
            student through the Student Portal.
          </p>
        </div>
      )}

      {/* =====================================================
          SECTION 1
          COMPANY → STUDENT
      ===================================================== */}

      <section className="mb-8">
        <div className="mb-4">
          <p className="text-xs uppercase tracking-widest font-bold text-slate-400">
            Company → Student
          </p>

          <h2 className="text-xl font-black">Evaluate Intern</h2>

          <p className="text-sm mt-1 text-slate-500">
            Evaluate the performance of an intern officially deployed to{" "}
            {company?.name || "your company"}.
          </p>
        </div>

        {/* ===================================================
            NO DEPLOYED INTERNS
        =================================================== */}

        {assignments.length === 0 ? (
          <section className={`border rounded-2xl p-6 ${card}`}>
            <div className="text-center py-6">
              <div className="text-3xl mb-3">📋</div>

              <p className="font-semibold">
                No interns are available for evaluation.
              </p>

              <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
                Only students who have been officially deployed to your company
                can be evaluated.
              </p>
            </div>
          </section>
        ) : (
          /* ===================================================
             EVALUATION FORM
          =================================================== */

          <form className={`border rounded-2xl p-6 ${card}`} onSubmit={submit}>
            {/* =================================================
                INTERN SELECTION
            ================================================= */}

            <div className="mb-6">
              <label className="block text-xs font-semibold mb-2">
                Internship Assignment
              </label>

              <select
                className={`w-full border rounded-lg px-3 py-2 text-sm ${input}`}
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

            {/* =================================================
                RATING CRITERIA
            ================================================= */}

            <div className="mb-6">
              <div className="mb-3">
                <h3 className="font-bold">Performance Evaluation</h3>

                <p className="text-xs text-slate-500 mt-1">
                  Rate the intern from 1 to 5 for each criterion.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                {CRITERIA.map((criterion) => (
                  <label
                    key={criterion}
                    className={`border rounded-xl p-4 ${softCard}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-semibold">{criterion}</span>

                      <span className="text-xs font-bold text-slate-400">
                        {ratings[criterion]}/5
                      </span>
                    </div>

                    <select
                      className={`block w-full border rounded-lg mt-3 px-2 py-2 text-sm ${input}`}
                      value={ratings[criterion]}
                      onChange={(event) =>
                        handleRatingChange(criterion, event.target.value)
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
            </div>

            {/* =================================================
                COMMENTS
            ================================================= */}

            <div className="mb-6">
              <label className="block text-xs font-semibold mb-2">
                Written Feedback
              </label>

              <textarea
                className={`w-full border rounded-lg px-3 py-2 text-sm ${input} ${
                  darkMode ? "placeholder:text-slate-500" : ""
                }`}
                rows="6"
                value={comments}
                onChange={(event) => {
                  setComments(event.target.value);
                  setSubmitted(false);
                }}
                placeholder="Provide feedback about the intern's overall performance, strengths, and areas for improvement."
              />
            </div>

            {/* =================================================
                SUBMIT
            ================================================= */}

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition"
              >
                Submit Evaluation
              </button>
            </div>
          </form>
        )}
      </section>

      {/* =====================================================
          SECTION 2
          STUDENT → COMPANY
      ===================================================== */}

      <section>
        <div className="mb-4">
          <p className="text-xs uppercase tracking-widest font-bold text-slate-400">
            Student → Company
          </p>

          <h2 className="text-xl font-black">Student Evaluations</h2>

          <p className="text-sm mt-1 text-slate-500">
            Review evaluations submitted by interns about their experience at{" "}
            {company?.name || "your company"}.
          </p>
        </div>

        {/* ===================================================
            NO STUDENT EVALUATIONS
        =================================================== */}

        {studentCompanyEvaluations.length === 0 ? (
          <section className={`border rounded-2xl p-6 ${card}`}>
            <div className="text-center py-8">
              <div className="text-3xl mb-3">📝</div>

              <p className="font-semibold">No student evaluations yet.</p>

              <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
                Intern evaluations of your company will appear here after a
                student submits one through the Student Portal.
              </p>
            </div>
          </section>
        ) : (
          /* ===================================================
             STUDENT EVALUATION LIST
          =================================================== */

          <div className="space-y-4">
            {studentCompanyEvaluations.map((evaluation) => {
              const assignment = getAssignment(evaluation.assignmentId);

              const studentName = getStudentName(evaluation.assignmentId);

              const submittedDate = evaluation.submittedAt
                ? new Date(evaluation.submittedAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "Unknown date";

              return (
                <article
                  key={evaluation.id}
                  className={`border rounded-2xl overflow-hidden ${card}`}
                >
                  {/* =================================================
                      EVALUATION HEADER
                  ================================================= */}

                  <div
                    className={`px-5 py-4 border-b ${
                      darkMode ? "border-slate-700" : "border-slate-200"
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold">{studentName}</h3>

                          <span
                            className={`px-2 py-1 rounded-full text-[10px] font-bold border ${
                              darkMode
                                ? "bg-blue-950/40 text-blue-300 border-blue-800"
                                : "bg-blue-50 text-blue-700 border-blue-200"
                            }`}
                          >
                            STUDENT
                          </span>
                        </div>

                        <p className="text-xs text-slate-500 mt-1">
                          {assignment?.id || evaluation.assignmentId}
                          {" · "}
                          Submitted {submittedDate}
                        </p>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          darkMode
                            ? "bg-emerald-950/40 text-emerald-300"
                            : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        SUBMITTED
                      </span>
                    </div>
                  </div>

                  {/* =================================================
                      RATINGS
                  ================================================= */}

                  <div className="p-5">
                    {evaluation.ratings &&
                    Object.keys(evaluation.ratings).length > 0 ? (
                      <div className="grid md:grid-cols-2 gap-3">
                        {Object.entries(evaluation.ratings).map(
                          ([criterion, rating]) => (
                            <div
                              key={criterion}
                              className={`border rounded-xl p-4 ${softCard}`}
                            >
                              <div className="flex items-center justify-between gap-3 mb-2">
                                <span className="text-xs font-semibold">
                                  {criterion}
                                </span>

                                <span className="text-xs font-bold text-slate-400">
                                  {rating}/5
                                </span>
                              </div>

                              {renderStars(rating)}
                            </div>
                          )
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">
                        No numerical ratings were provided.
                      </p>
                    )}

                    {/* =================================================
                        COMMENTS
                    ================================================= */}

                    {evaluation.comments && (
                      <div className="mt-5">
                        <p className="text-xs font-semibold mb-2">
                          Written Feedback
                        </p>

                        <div
                          className={`border rounded-xl p-4 text-sm leading-relaxed whitespace-pre-line ${
                            darkMode
                              ? "border-slate-700 bg-slate-800/50 text-slate-300"
                              : "border-slate-200 bg-slate-50 text-slate-600"
                          }`}
                        >
                          {evaluation.comments}
                        </div>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
