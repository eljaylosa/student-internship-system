import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";

const Evaluations = () => {
  const { darkMode } = useOutletContext();

  // =========================================================
  // EVALUATION DATA
  // =========================================================

  const evaluationCriteria = [
    "Professionalism",
    "Technical Skills",
    "Communication",
    "Teamwork",
    "Initiative",
    "Attendance",
  ];

  const students = [
    {
      id: 1,
      name: "John Doe",
      company: "ABC Corp",
      period: "May-Jun 2024",
    },
    {
      id: 2,
      name: "Jane Smith",
      company: "XYZ Corporation",
      period: "May-Jun 2024",
    },
    {
      id: 3,
      name: "Michael Santos",
      company: "Tech Solutions",
      period: "May-Jun 2024",
    },
  ];

  // =========================================================
  // STATE
  // =========================================================

  const [selectedStudentId, setSelectedStudentId] = useState(1);

  const [ratings, setRatings] = useState({
    Professionalism: 3,
    "Technical Skills": 3,
    Communication: 3,
    Teamwork: 3,
    Initiative: 3,
    Attendance: 3,
  });

  const [feedback, setFeedback] = useState("");

  const [submitMessage, setSubmitMessage] = useState({
    type: "",
    text: "",
  });

  // =========================================================
  // THEME CLASSES
  // =========================================================

  const headingClass = darkMode ? "text-slate-100" : "text-slate-900";

  const mutedClass = darkMode ? "text-slate-400" : "text-slate-500";

  const cardClass = darkMode
    ? "bg-slate-900 border-slate-700"
    : "bg-white border-slate-300";

  const secondaryCardClass = darkMode
    ? "bg-slate-800 border-slate-700"
    : "bg-slate-50 border-slate-200";

  const inputClass = darkMode
    ? "bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-500 focus:bg-slate-900 focus:border-slate-500"
    : "bg-slate-50 border-slate-300 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-slate-700";

  // =========================================================
  // SELECTED STUDENT
  // =========================================================

  const selectedStudent =
    students.find((student) => student.id === selectedStudentId) || students[0];

  // =========================================================
  // RATING HANDLER
  // =========================================================

  const handleRatingChange = (criterion, rating) => {
    setRatings((prev) => ({
      ...prev,
      [criterion]: rating,
    }));

    setSubmitMessage({
      type: "",
      text: "",
    });
  };

  // =========================================================
  // STUDENT HANDLER
  // =========================================================

  const handleStudentChange = (e) => {
    setSelectedStudentId(Number(e.target.value));

    setSubmitMessage({
      type: "",
      text: "",
    });
  };

  // =========================================================
  // SUBMIT EVALUATION
  // =========================================================

  const handleSubmitEvaluation = (e) => {
    e.preventDefault();

    if (Object.values(ratings).some((rating) => rating < 1)) {
      setSubmitMessage({
        type: "error",
        text: "Please provide a rating for every evaluation criterion.",
      });

      return;
    }

    if (!feedback.trim()) {
      setSubmitMessage({
        type: "error",
        text: "Please provide written feedback before submitting.",
      });

      return;
    }

    // Frontend placeholder.
    // This will later connect to Supabase.

    setSubmitMessage({
      type: "success",
      text: `Evaluation for ${selectedStudent.name} has been submitted successfully.`,
    });
  };

  // =========================================================
  // RATING LABEL
  // =========================================================

  const getRatingLabel = (rating) => {
    const labels = {
      1: "Poor",
      2: "Needs Improvement",
      3: "Satisfactory",
      4: "Good",
      5: "Excellent",
    };

    return labels[rating] || "";
  };

  // =========================================================
  // RETURN
  // =========================================================

  return (
    <div className="w-full min-h-full p-3 sm:p-5 md:p-6 lg:p-8 bg-transparent">
      <div className="max-w-[1400px] mx-auto">
        {/* =====================================================
            PAGE HEADER
        ===================================================== */}

        <div className="mb-5 sm:mb-6">
          <p
            className={`text-[10px] sm:text-xs uppercase tracking-widest font-bold mb-1 ${
              darkMode ? "text-slate-500" : "text-slate-400"
            }`}
          >
            Faculty Portal
          </p>

          <h1 className={`text-xl sm:text-2xl font-black ${headingClass}`}>
            Student Evaluations
          </h1>

          <p className={`text-xs sm:text-sm mt-1 ${mutedClass}`}>
            Evaluate student performance and provide feedback for their
            internship.
          </p>
        </div>

        {/* =====================================================
            EVALUATION CONTAINER
        ===================================================== */}

        <section
          className={`max-w-[1000px] border rounded-xl shadow-sm overflow-hidden ${cardClass}`}
        >
          <form onSubmit={handleSubmitEvaluation}>
            <div className="p-4 sm:p-5 md:p-7 lg:p-8">
              {/* =================================================
                  SECTION HEADER
              ================================================= */}

              <div className="mb-5">
                <h2
                  className={`text-base sm:text-lg font-bold ${headingClass}`}
                >
                  Performance Evaluation
                </h2>

                <p className={`text-xs mt-1 ${mutedClass}`}>
                  Rate the student's performance based on the following
                  criteria.
                </p>
              </div>

              {/* =================================================
                  STUDENT SELECTOR
              ================================================= */}

              <div
                className={`border rounded-lg p-3 sm:p-4 mb-7 ${secondaryCardClass}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5">
                  <div className="flex-1 min-w-0">
                    <label
                      htmlFor="student"
                      className={`block text-[10px] font-bold uppercase tracking-wide mb-1.5 ${mutedClass}`}
                    >
                      Student
                    </label>

                    <select
                      id="student"
                      value={selectedStudentId}
                      onChange={handleStudentChange}
                      className={`w-full h-10 px-3 rounded-lg border text-xs outline-none transition ${inputClass}`}
                    >
                      {students.map((student) => (
                        <option
                          key={student.id}
                          value={student.id}
                          className={
                            darkMode
                              ? "bg-slate-800 text-slate-100"
                              : "bg-white text-slate-900"
                          }
                        >
                          {student.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:text-right">
                    <p className={`text-xs font-semibold ${headingClass}`}>
                      {selectedStudent.company}
                    </p>

                    <p className={`text-[10px] mt-1 ${mutedClass}`}>
                      Period: {selectedStudent.period}
                    </p>
                  </div>
                </div>
              </div>

              {/* =================================================
                  RATING CRITERIA
              ================================================= */}

              <div className="space-y-1">
                {evaluationCriteria.map((criterion) => {
                  const currentRating = ratings[criterion];

                  return (
                    <div
                      key={criterion}
                      className={`py-4 sm:py-5 border-b ${
                        darkMode ? "border-slate-700" : "border-slate-200"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        {/* CRITERION */}

                        <div className="min-w-[150px]">
                          <p
                            className={`text-xs sm:text-sm font-semibold ${headingClass}`}
                          >
                            {criterion}
                          </p>

                          <p className={`text-[10px] mt-1 ${mutedClass}`}>
                            {getRatingLabel(currentRating)}
                          </p>
                        </div>

                        {/* RATING OPTIONS */}

                        <div className="flex items-center gap-2 sm:gap-3">
                          {[1, 2, 3, 4, 5].map((rating) => {
                            const active = currentRating === rating;

                            return (
                              <button
                                key={rating}
                                type="button"
                                onClick={() =>
                                  handleRatingChange(criterion, rating)
                                }
                                aria-label={`${criterion}: ${rating} out of 5`}
                                className={`
                                  w-9
                                  h-9
                                  sm:w-10
                                  sm:h-10
                                  rounded-md
                                  border
                                  text-xs
                                  font-bold
                                  transition-all
                                  duration-150
                                  ${
                                    active
                                      ? darkMode
                                        ? "bg-slate-600 border-slate-500 text-white shadow-sm"
                                        : "bg-slate-800 border-slate-800 text-white shadow-sm"
                                      : darkMode
                                      ? "bg-slate-800 border-slate-600 text-slate-400 hover:bg-slate-700 hover:border-slate-500 hover:text-slate-200"
                                      : "bg-slate-50 border-slate-300 text-slate-500 hover:bg-slate-200 hover:border-slate-400 hover:text-slate-800"
                                  }
                                `}
                              >
                                {rating}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* =================================================
                  RATING GUIDE
              ================================================= */}

              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1">
                <span className={`text-[10px] ${mutedClass}`}>1 — Poor</span>

                <span className={`text-[10px] ${mutedClass}`}>
                  2 — Needs Improvement
                </span>

                <span className={`text-[10px] ${mutedClass}`}>
                  3 — Satisfactory
                </span>

                <span className={`text-[10px] ${mutedClass}`}>4 — Good</span>

                <span className={`text-[10px] ${mutedClass}`}>
                  5 — Excellent
                </span>
              </div>

              {/* =================================================
                  WRITTEN FEEDBACK
              ================================================= */}

              <div className="mt-7">
                <label
                  htmlFor="feedback"
                  className={`block text-xs font-bold mb-2 ${headingClass}`}
                >
                  Written Feedback
                </label>

                <textarea
                  id="feedback"
                  value={feedback}
                  onChange={(e) => {
                    setFeedback(e.target.value);

                    setSubmitMessage({
                      type: "",
                      text: "",
                    });
                  }}
                  placeholder="Write your evaluation feedback..."
                  rows={5}
                  className={`
                    w-full
                    resize-none
                    px-3
                    py-3
                    rounded-lg
                    border
                    text-xs
                    sm:text-sm
                    outline-none
                    transition
                    ${inputClass}
                  `}
                />

                <p className={`text-[10px] mt-1.5 ${mutedClass}`}>
                  Provide constructive feedback about the student's performance.
                </p>
              </div>

              {/* =================================================
                  SUBMIT MESSAGE
              ================================================= */}

              {submitMessage.text && (
                <div
                  className={`
                    mt-5
                    px-4
                    py-3
                    rounded-lg
                    border
                    text-xs
                    font-medium
                    ${
                      submitMessage.type === "success"
                        ? darkMode
                          ? "bg-emerald-950/40 border-emerald-800 text-emerald-300"
                          : "bg-emerald-50 border-emerald-200 text-emerald-700"
                        : darkMode
                        ? "bg-red-950/40 border-red-800 text-red-300"
                        : "bg-red-50 border-red-200 text-red-700"
                    }
                  `}
                >
                  {submitMessage.text}
                </div>
              )}

              {/* =================================================
                  SUBMIT BUTTON
              ================================================= */}

              <div className="mt-6 flex justify-end">
                <button
                  type="submit"
                  className="
                    w-full
                    sm:w-auto
                    px-6
                    py-3
                    rounded-lg
                    bg-slate-800
                    text-white
                    text-xs
                    font-bold
                    hover:bg-slate-700
                    active:bg-slate-900
                    transition
                  "
                >
                  Submit Evaluation
                </button>
              </div>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
};

export default Evaluations;
