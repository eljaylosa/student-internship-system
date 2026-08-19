import React, { useMemo } from "react";
import { useOutletContext } from "react-router-dom";

// Temporary page-local demo data. This page intentionally has no mockStore dependency.
const localState = {
  "currentUser": {
    "id": "USR-002",
    "role": "registrar",
    "email": "registrar@gmail.com",
    "password": "password",
    "status": "Active",
    "profileId": "FAC-001"
  },
  "assignments": [],
  "evaluations": [],
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
  "supervisors": [
    {
      "id": "SUP-001",
      "userId": "USR-003",
      "companyId": "COM-001",
      "fullName": "Mark Cruz",
      "email": "company@gmail.com",
      "position": "Company Supervisor"
    }
  ]
};


export default function Evaluations() {
  const { darkMode } = useOutletContext();
  const state = localState;

  // =========================================================
  // CURRENT REGISTRAR
  // =========================================================

  const facultyId = state.currentUser?.profileId;

  // =========================================================
  // REGISTRAR'S ASSIGNMENTS
  // =========================================================

  const assignments = useMemo(
    () =>
      state.assignments.filter(
        (assignment) => assignment.facultyId === facultyId
      ),
    [state.assignments, facultyId]
  );

  // =========================================================
  // EVALUATIONS CONNECTED TO REGISTRAR ASSIGNMENTS
  // =========================================================

  const assignmentIds = useMemo(
    () => new Set(assignments.map((assignment) => assignment.id)),
    [assignments]
  );

  const evaluations = useMemo(
    () =>
      state.evaluations.filter((evaluation) =>
        assignmentIds.has(evaluation.assignmentId)
      ),
    [state.evaluations, assignmentIds]
  );

  // =========================================================
  // COMPANY → STUDENT
  // =========================================================

  const companyEvaluations = useMemo(
    () =>
      evaluations.filter(
        (evaluation) => evaluation.evaluatorRole === "Company Supervisor"
      ),
    [evaluations]
  );

  // =========================================================
  // STUDENT → COMPANY
  // =========================================================

  const studentEvaluations = useMemo(
    () =>
      evaluations.filter(
        (evaluation) => evaluation.evaluatorRole === "Student"
      ),
    [evaluations]
  );

  // =========================================================
  // HELPERS
  // =========================================================

  const getAssignment = (assignmentId) =>
    state.assignments.find((assignment) => assignment.id === assignmentId);

  const getStudent = (studentId) =>
    state.students.find((student) => student.id === studentId);

  const getCompany = (companyId) =>
    state.companies.find((company) => company.id === companyId);

  const getSupervisor = (supervisorId) =>
    state.supervisors.find((supervisor) => supervisor.id === supervisorId);

  const getStudentName = (assignment) => {
    const student = getStudent(assignment?.studentId);

    return student?.fullName || "Unknown Student";
  };

  const getCompanyName = (assignment) => {
    const company = getCompany(assignment?.companyId);

    return company?.name || "Unknown Company";
  };

  const getEvaluatorName = (evaluation) => {
    if (evaluation.evaluatorRole === "Student") {
      return getStudent(evaluation.evaluatorId)?.fullName || "Unknown Student";
    }

    if (evaluation.evaluatorRole === "Company Supervisor") {
      return (
        getSupervisor(evaluation.evaluatorId)?.fullName || "Unknown Supervisor"
      );
    }

    return "Unknown";
  };

  const formatDate = (date) => {
    if (!date) return "Unknown date";

    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // =========================================================
  // RATING STARS
  // =========================================================

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
  // SHARED STYLES
  // =========================================================

  const card = darkMode
    ? "bg-slate-900 border-slate-700"
    : "bg-white border-slate-200";

  const softCard = darkMode
    ? "bg-slate-800/50 border-slate-700"
    : "bg-slate-50 border-slate-200";

  // =========================================================
  // EVALUATION CARD
  // =========================================================

  const EvaluationCard = ({ evaluation, direction }) => {
    const assignment = getAssignment(evaluation.assignmentId);

    if (!assignment) return null;

    const studentName = getStudentName(assignment);

    const companyName = getCompanyName(assignment);

    const evaluatorName = getEvaluatorName(evaluation);

    const isCompanyEvaluation = direction === "company";

    return (
      <article className={`border rounded-2xl overflow-hidden ${card}`}>
        {/* =====================================================
            HEADER
        ===================================================== */}

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
                    isCompanyEvaluation
                      ? darkMode
                        ? "bg-emerald-950/40 text-emerald-300 border-emerald-800"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : darkMode
                      ? "bg-blue-950/40 text-blue-300 border-blue-800"
                      : "bg-blue-50 text-blue-700 border-blue-200"
                  }`}
                >
                  {isCompanyEvaluation
                    ? "COMPANY → STUDENT"
                    : "STUDENT → COMPANY"}
                </span>
              </div>

              <p className="text-xs text-slate-500 mt-1">
                {assignment.id} · {companyName}
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

        {/* =====================================================
            DETAILS
        ===================================================== */}

        <div className="p-5">
          <div className="grid md:grid-cols-3 gap-3 mb-5">
            <div className={`border rounded-xl p-4 ${softCard}`}>
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                Student
              </p>

              <p className="text-sm font-semibold mt-1">{studentName}</p>
            </div>

            <div className={`border rounded-xl p-4 ${softCard}`}>
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                Company
              </p>

              <p className="text-sm font-semibold mt-1">{companyName}</p>
            </div>

            <div className={`border rounded-xl p-4 ${softCard}`}>
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                Submitted By
              </p>

              <p className="text-sm font-semibold mt-1">{evaluatorName}</p>

              <p className="text-[11px] text-slate-500 mt-1">
                {formatDate(evaluation.submittedAt)}
              </p>
            </div>
          </div>

          {/* ===================================================
              RATINGS
          =================================================== */}

          {evaluation.ratings && Object.keys(evaluation.ratings).length > 0 ? (
            <div>
              <p className="text-xs font-semibold mb-3">Evaluation Ratings</p>

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
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              No numerical ratings were provided.
            </p>
          )}

          {/* ===================================================
              COMMENTS
          =================================================== */}

          {evaluation.comments && (
            <div className="mt-5">
              <p className="text-xs font-semibold mb-2">Written Feedback</p>

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
  };

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
          PAGE HEADER
      ===================================================== */}

      <div className="mb-7">
        <p className="text-xs uppercase tracking-widest font-bold text-slate-400">
          Registrar Adviser Portal
        </p>

        <h1 className="text-2xl font-black">Evaluations</h1>

        <p className="text-sm mt-1 text-slate-500">
          Review internship evaluations submitted by students and company
          supervisors.
        </p>
      </div>

      {/* =====================================================
          SUMMARY
      ===================================================== */}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <div className={`border rounded-2xl p-5 ${card}`}>
          <p className="text-xs font-semibold text-slate-400">
            Assigned Internships
          </p>

          <p className="text-2xl font-black mt-1">{assignments.length}</p>
        </div>

        <div className={`border rounded-2xl p-5 ${card}`}>
          <p className="text-xs font-semibold text-slate-400">
            Company Evaluations
          </p>

          <p className="text-2xl font-black mt-1">
            {companyEvaluations.length}
          </p>

          <p className="text-xs text-slate-500 mt-1">Company → Student</p>
        </div>

        <div className={`border rounded-2xl p-5 ${card}`}>
          <p className="text-xs font-semibold text-slate-400">
            Student Evaluations
          </p>

          <p className="text-2xl font-black mt-1">
            {studentEvaluations.length}
          </p>

          <p className="text-xs text-slate-500 mt-1">Student → Company</p>
        </div>
      </div>

      {/* =====================================================
          COMPANY → STUDENT
      ===================================================== */}

      <section className="mb-10">
        <div className="mb-4">
          <p className="text-xs uppercase tracking-widest font-bold text-slate-400">
            Company → Student
          </p>

          <h2 className="text-xl font-black">Company Evaluations</h2>

          <p className="text-sm mt-1 text-slate-500">
            Review performance evaluations submitted by company supervisors for
            your assigned interns.
          </p>
        </div>

        {companyEvaluations.length === 0 ? (
          <section className={`border rounded-2xl p-6 ${card}`}>
            <div className="text-center py-8">
              <div className="text-3xl mb-3">📋</div>

              <p className="font-semibold">No company evaluations yet.</p>

              <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
                Evaluations submitted by company supervisors will appear here.
              </p>
            </div>
          </section>
        ) : (
          <div className="space-y-4">
            {companyEvaluations.map((evaluation) => (
              <EvaluationCard
                key={evaluation.id}
                evaluation={evaluation}
                direction="company"
              />
            ))}
          </div>
        )}
      </section>

      {/* =====================================================
          STUDENT → COMPANY
      ===================================================== */}

      <section>
        <div className="mb-4">
          <p className="text-xs uppercase tracking-widest font-bold text-slate-400">
            Student → Company
          </p>

          <h2 className="text-xl font-black">Student Evaluations</h2>

          <p className="text-sm mt-1 text-slate-500">
            Review evaluations submitted by your assigned interns about their
            internship company and experience.
          </p>
        </div>

        {studentEvaluations.length === 0 ? (
          <section className={`border rounded-2xl p-6 ${card}`}>
            <div className="text-center py-8">
              <div className="text-3xl mb-3">📝</div>

              <p className="font-semibold">No student evaluations yet.</p>

              <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
                Evaluations submitted by your assigned interns will appear here.
              </p>
            </div>
          </section>
        ) : (
          <div className="space-y-4">
            {studentEvaluations.map((evaluation) => (
              <EvaluationCard
                key={evaluation.id}
                evaluation={evaluation}
                direction="student"
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
