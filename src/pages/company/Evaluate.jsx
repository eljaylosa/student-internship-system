import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";

const STORAGE_KEY = "sims_company_evaluations";

const INTERNS = [
  {
    id: 1,
    name: "John Doe",
  },
  {
    id: 2,
    name: "Jane Smith",
  },
  {
    id: 3,
    name: "Mike Wilson",
  },
];

const EVALUATION_SECTIONS = [
  {
    title: "Work Quality",
    criteria: ["Accuracy", "Thoroughness", "Problem Solving"],
  },
  {
    title: "Professionalism",
    criteria: ["Punctuality", "Attitude", "Appearance"],
  },
  {
    title: "Soft Skills",
    criteria: ["Communication", "Teamwork", "Leadership"],
  },
];

const createEmptyRatings = () => ({
  Accuracy: 0,
  Thoroughness: 0,
  "Problem Solving": 0,
  Punctuality: 0,
  Attitude: 0,
  Appearance: 0,
  Communication: 0,
  Teamwork: 0,
  Leadership: 0,
});

const Evaluate = () => {
  const { darkMode } = useOutletContext();

  // =========================================
  // FORM STATE
  // =========================================

  const [selectedIntern, setSelectedIntern] = useState("1");

  const [ratings, setRatings] = useState(createEmptyRatings());

  const [comments, setComments] = useState("");

  const [evaluations, setEvaluations] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [submitted, setSubmitted] = useState(false);

  // =========================================
  // SAVE EVALUATIONS
  // =========================================

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(evaluations));
  }, [evaluations]);

  // =========================================
  // THEME CLASSES
  // =========================================

  const pageText = darkMode ? "text-slate-100" : "text-slate-900";

  const mutedText = darkMode ? "text-slate-400" : "text-slate-500";

  const cardClass = darkMode
    ? "bg-slate-900 border-slate-700"
    : "bg-white border-slate-200";

  const inputClass = darkMode
    ? "w-full h-10 px-3 rounded-lg border border-slate-700 bg-slate-800 text-sm text-slate-200 outline-none focus:border-slate-500 transition"
    : "w-full h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-700 outline-none focus:bg-white focus:border-slate-400 transition";

  // =========================================
  // RATING HANDLER
  // =========================================

  const handleRating = (criterion, rating) => {
    setRatings((prev) => ({
      ...prev,
      [criterion]: rating,
    }));

    setSubmitted(false);
  };

  // =========================================
  // RESET FORM
  // =========================================

  const resetEvaluation = () => {
    setRatings(createEmptyRatings());
    setComments("");
    setSubmitted(false);
  };

  // =========================================
  // CHANGE INTERN
  // =========================================

  const handleInternChange = (value) => {
    setSelectedIntern(value);
    resetEvaluation();
  };

  // =========================================
  // SUBMIT EVALUATION
  // =========================================

  const handleSubmit = (e) => {
    e.preventDefault();

    const missingRatings = Object.values(ratings).some(
      (rating) => rating === 0
    );

    if (missingRatings) {
      alert("Please provide a rating for all evaluation criteria.");
      return;
    }

    const intern = INTERNS.find(
      (item) => String(item.id) === String(selectedIntern)
    );

    const newEvaluation = {
      id: Date.now(),
      internId: intern.id,
      internName: intern.name,
      ratings,
      comments: comments.trim(),
      submittedAt: new Date().toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
    };

    setEvaluations((prev) => [newEvaluation, ...prev]);

    setSubmitted(true);

    setRatings(createEmptyRatings());
    setComments("");
  };

  // =========================================
  // RATING BOX
  // =========================================

  const RatingBoxes = ({ criterion }) => {
    const selectedRating = ratings[criterion];

    return (
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((rating) => {
          const isSelected = selectedRating >= rating;

          return (
            <button
              key={rating}
              type="button"
              onClick={() => handleRating(criterion, rating)}
              aria-label={`${criterion}: ${rating} out of 5`}
              title={`${rating} / 5`}
              className={`w-6 h-6 border transition ${
                isSelected
                  ? darkMode
                    ? "bg-slate-400 border-slate-300"
                    : "bg-slate-600 border-slate-700"
                  : darkMode
                  ? "bg-slate-800 border-slate-600 hover:bg-slate-700"
                  : "bg-slate-100 border-slate-300 hover:bg-slate-200"
              }`}
            />
          );
        })}
      </div>
    );
  };

  // =========================================
  // RENDER
  // =========================================

  return (
    <div className="p-5 md:p-6 lg:p-8 max-w-[1400px] mx-auto">
      {/* =========================================
          EVALUATION CARD
      ========================================= */}

      <section
        className={`w-full max-w-[1000px] mx-auto xl:mx-0 border rounded-xl p-5 md:p-6 ${cardClass}`}
      >
        {/* HEADER */}

        <div className="mb-6">
          <h1 className={`text-lg font-bold ${pageText}`}>
            Intern Performance Evaluation
          </h1>

          <p className={`text-xs mt-1 ${mutedText}`}>
            Evaluate the selected intern's performance during the internship.
          </p>
        </div>

        {/* SUCCESS MESSAGE */}

        {submitted && (
          <div
            className={`mb-5 border rounded-lg px-4 py-3 text-xs ${
              darkMode
                ? "bg-emerald-950/40 border-emerald-900 text-emerald-400"
                : "bg-emerald-50 border-emerald-200 text-emerald-700"
            }`}
          >
            Evaluation submitted successfully.
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* =========================================
              SELECT INTERN
          ========================================= */}

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-7">
            <label htmlFor="intern" className={`text-xs font-bold ${pageText}`}>
              Select Intern:
            </label>

            <select
              id="intern"
              value={selectedIntern}
              onChange={(e) => handleInternChange(e.target.value)}
              className={`${inputClass} sm:w-40`}
            >
              {INTERNS.map((intern) => (
                <option key={intern.id} value={intern.id}>
                  {intern.name}
                </option>
              ))}
            </select>
          </div>

          {/* =========================================
              EVALUATION SECTIONS
          ========================================= */}

          <div className="space-y-7">
            {EVALUATION_SECTIONS.map((section) => (
              <div key={section.title}>
                {/* SECTION TITLE */}

                <h2 className={`text-sm font-bold mb-4 ${pageText}`}>
                  {section.title}
                </h2>

                {/* CRITERIA */}

                <div className="space-y-3">
                  {section.criteria.map((criterion) => (
                    <div
                      key={criterion}
                      className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-5"
                    >
                      <div
                        className={`w-full sm:w-28 text-[10px] ${mutedText}`}
                      >
                        {criterion}
                      </div>

                      <RatingBoxes criterion={criterion} />

                      {ratings[criterion] > 0 && (
                        <span
                          className={`text-[9px] ${
                            darkMode ? "text-slate-500" : "text-slate-400"
                          }`}
                        >
                          {ratings[criterion]}/5
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* =========================================
              OVERALL COMMENTS
          ========================================= */}

          <div className="mt-7">
            <label
              htmlFor="comments"
              className={`block text-sm font-bold mb-3 ${pageText}`}
            >
              Overall Comments
            </label>

            <textarea
              id="comments"
              value={comments}
              onChange={(e) => {
                setComments(e.target.value);
                setSubmitted(false);
              }}
              placeholder="Enter your comments about the intern's overall performance..."
              rows={5}
              className={`${inputClass} h-auto py-3 resize-none`}
            />
          </div>

          {/* =========================================
              SUBMIT
          ========================================= */}

          <div className="flex justify-end mt-6">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-lg bg-slate-800 text-white text-xs font-bold hover:bg-slate-700 transition"
            >
              Submit Evaluation
            </button>
          </div>
        </form>
      </section>

      {/* =========================================
          PREVIOUS EVALUATIONS
      ========================================= */}

      {evaluations.length > 0 && (
        <section
          className={`w-full max-w-[1000px] mx-auto xl:mx-0 border rounded-xl p-5 md:p-6 mt-5 ${cardClass}`}
        >
          <div className="mb-5">
            <h2 className={`text-sm font-bold ${pageText}`}>
              Submitted Evaluations
            </h2>

            <p className={`text-xs mt-1 ${mutedText}`}>
              Previously submitted intern evaluations.
            </p>
          </div>

          <div className="space-y-3">
            {evaluations.map((evaluation) => (
              <div
                key={evaluation.id}
                className={`border rounded-lg p-4 ${
                  darkMode
                    ? "border-slate-700 bg-slate-800"
                    : "border-slate-200 bg-slate-50"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h3 className={`text-xs font-bold ${pageText}`}>
                      {evaluation.internName}
                    </h3>

                    <p className={`text-[9px] mt-1 ${mutedText}`}>
                      Submitted {evaluation.submittedAt}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <span className={`text-[9px] ${mutedText}`}>Overall</span>

                    <span className={`text-xs font-bold ${pageText}`}>
                      {(
                        Object.values(evaluation.ratings).reduce(
                          (sum, rating) => sum + rating,
                          0
                        ) / Object.values(evaluation.ratings).length
                      ).toFixed(1)}
                      /5
                    </span>
                  </div>
                </div>

                {evaluation.comments && (
                  <p className={`text-xs mt-3 leading-relaxed ${mutedText}`}>
                    {evaluation.comments}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default Evaluate;
