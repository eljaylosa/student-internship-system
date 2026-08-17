import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";

const STORAGE_KEY = "sims_company_feedback";

const Feedback = () => {
  const { darkMode } = useOutletContext();

  const [form, setForm] = useState({
    internName: "",
    internId: "",
    internshipStart: "",
    internshipEnd: "",
    satisfaction: 0,
    strengths: "",
    improvements: "",
    recommendation: "",
  });

  const [submitted, setSubmitted] = useState(false);

  // =========================================
  // THEME CLASSES
  // =========================================

  const pageText = darkMode ? "text-slate-100" : "text-slate-900";

  const mutedText = darkMode ? "text-slate-400" : "text-slate-500";

  const cardClass = darkMode
    ? "bg-slate-900 border-slate-700"
    : "bg-white border-slate-200";

  const inputClass = darkMode
    ? "w-full h-10 px-3 rounded-lg border border-slate-700 bg-slate-800 text-sm text-slate-200 placeholder:text-slate-500 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-700 transition"
    : "w-full h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:bg-white focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition";

  const textareaClass = darkMode
    ? "w-full px-3 py-3 rounded-lg border border-slate-700 bg-slate-800 text-sm text-slate-200 placeholder:text-slate-500 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-700 transition resize-none"
    : "w-full px-3 py-3 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:bg-white focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition resize-none";

  // =========================================
  // FORM HANDLER
  // =========================================

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    setSubmitted(false);
  };

  // =========================================
  // SUBMIT FEEDBACK
  // =========================================

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.internName.trim()) {
      alert("Please enter the intern name.");
      return;
    }

    if (!form.internshipStart || !form.internshipEnd) {
      alert("Please provide the internship period.");
      return;
    }

    if (!form.satisfaction) {
      alert("Please provide an overall satisfaction rating.");
      return;
    }

    if (!form.recommendation) {
      alert("Please select a recommendation.");
      return;
    }

    const feedback = {
      id: Date.now(),
      internName: form.internName.trim(),
      internId: form.internId.trim(),
      internshipStart: form.internshipStart,
      internshipEnd: form.internshipEnd,
      satisfaction: form.satisfaction,
      strengths: form.strengths.trim(),
      improvements: form.improvements.trim(),
      recommendation: form.recommendation,
      submittedAt: new Date().toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
    };

    try {
      const existingFeedback = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "[]"
      );

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify([feedback, ...existingFeedback])
      );
    } catch {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([feedback]));
    }

    setSubmitted(true);

    setForm({
      internName: "",
      internId: "",
      internshipStart: "",
      internshipEnd: "",
      satisfaction: 0,
      strengths: "",
      improvements: "",
      recommendation: "",
    });
  };

  // =========================================
  // RENDER
  // =========================================

  return (
    <div className="p-5 md:p-6 lg:p-8 max-w-[1400px] mx-auto">
      <section
        className={`w-full max-w-[1000px] mx-auto xl:mx-0 border rounded-2xl p-5 md:p-6 lg:p-7 ${cardClass}`}
      >
        {/* =========================================
            PAGE HEADER
        ========================================= */}

        <div className="mb-6">
          <p
            className={`text-[10px] uppercase tracking-widest font-bold ${mutedText}`}
          >
            Company Portal
          </p>

          <h1 className={`text-xl font-black mt-1 ${pageText}`}>
            Submit Feedback
          </h1>

          <p className={`text-xs mt-1 ${mutedText}`}>
            Provide feedback about an intern's internship experience.
          </p>
        </div>

        {/* =========================================
            SUCCESS MESSAGE
        ========================================= */}

        {submitted && (
          <div
            className={`mb-5 rounded-xl border px-4 py-3 ${
              darkMode
                ? "bg-emerald-950/40 border-emerald-900 text-emerald-400"
                : "bg-emerald-50 border-emerald-200 text-emerald-700"
            }`}
          >
            <p className="text-xs font-bold">
              Feedback submitted successfully.
            </p>

            <p className="text-[10px] mt-1 opacity-80">
              The feedback has been saved locally for this frontend demo.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* =========================================
              INTERN INFORMATION
          ========================================= */}

          <div className="mb-7">
            <h2 className={`text-sm font-bold ${pageText} mb-4`}>
              Intern Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Intern Name */}

              <div>
                <label className={`block text-xs font-bold mb-1.5 ${pageText}`}>
                  Intern Name
                </label>

                <input
                  type="text"
                  value={form.internName}
                  onChange={(e) => handleChange("internName", e.target.value)}
                  placeholder="e.g. John Doe"
                  className={inputClass}
                />
              </div>

              {/* Intern ID */}

              <div>
                <label className={`block text-xs font-bold mb-1.5 ${pageText}`}>
                  Intern ID
                </label>

                <input
                  type="text"
                  value={form.internId}
                  onChange={(e) => handleChange("internId", e.target.value)}
                  placeholder="e.g. 2026-0001"
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* =========================================
              INTERNSHIP PERIOD
          ========================================= */}

          <div className="mb-7">
            <h2 className={`text-sm font-bold ${pageText} mb-4`}>
              Internship Period
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Start Date */}

              <div>
                <label className={`block text-xs font-bold mb-1.5 ${pageText}`}>
                  Start Date
                </label>

                <input
                  type="date"
                  value={form.internshipStart}
                  onChange={(e) =>
                    handleChange("internshipStart", e.target.value)
                  }
                  className={inputClass}
                />
              </div>

              {/* End Date */}

              <div>
                <label className={`block text-xs font-bold mb-1.5 ${pageText}`}>
                  End Date
                </label>

                <input
                  type="date"
                  value={form.internshipEnd}
                  onChange={(e) =>
                    handleChange("internshipEnd", e.target.value)
                  }
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* =========================================
              OVERALL SATISFACTION
          ========================================= */}

          <div className="mb-7">
            <h2 className={`text-sm font-bold ${pageText} mb-3`}>
              Overall Satisfaction
            </h2>

            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => handleChange("satisfaction", rating)}
                  aria-label={`Rate ${rating} out of 5`}
                  className={`w-10 h-10 rounded-lg border text-xs font-bold transition ${
                    form.satisfaction === rating
                      ? darkMode
                        ? "bg-white text-slate-900 border-white"
                        : "bg-slate-900 text-white border-slate-900"
                      : darkMode
                      ? "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700"
                      : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {rating}
                </button>
              ))}
            </div>

            <p className={`text-[10px] mt-2 ${mutedText}`}>
              1 = Very Unsatisfied &nbsp; • &nbsp; 5 = Very Satisfied
            </p>
          </div>

          {/* =========================================
              STRENGTHS
          ========================================= */}

          <div className="mb-5">
            <label className={`block text-xs font-bold mb-1.5 ${pageText}`}>
              Strengths
            </label>

            <textarea
              value={form.strengths}
              onChange={(e) => handleChange("strengths", e.target.value)}
              placeholder="Describe the intern's strengths and positive contributions..."
              rows={4}
              className={textareaClass}
            />
          </div>

          {/* =========================================
              AREAS FOR IMPROVEMENT
          ========================================= */}

          <div className="mb-7">
            <label className={`block text-xs font-bold mb-1.5 ${pageText}`}>
              Areas for Improvement
            </label>

            <textarea
              value={form.improvements}
              onChange={(e) => handleChange("improvements", e.target.value)}
              placeholder="Describe areas where the intern could improve..."
              rows={4}
              className={textareaClass}
            />
          </div>

          {/* =========================================
              RECOMMENDATION
          ========================================= */}

          <div className="mb-7">
            <h2 className={`text-sm font-bold ${pageText} mb-4`}>
              Recommendation
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  value: "Highly Recommend",
                  label: "Highly Recommend",
                },
                {
                  value: "Recommend",
                  label: "Recommend",
                },
                {
                  value: "Neutral",
                  label: "Neutral",
                },
                {
                  value: "Not Recommended",
                  label: "Not Recommended",
                },
              ].map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                    form.recommendation === option.value
                      ? darkMode
                        ? "border-slate-500 bg-slate-800"
                        : "border-slate-400 bg-slate-50"
                      : darkMode
                      ? "border-slate-700 hover:bg-slate-800"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="recommendation"
                    value={option.value}
                    checked={form.recommendation === option.value}
                    onChange={(e) =>
                      handleChange("recommendation", e.target.value)
                    }
                    className="w-4 h-4"
                  />

                  <span className={`text-xs ${pageText}`}>{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* =========================================
              SUBMIT
          ========================================= */}

          <div
            className={`border-t pt-5 ${
              darkMode ? "border-slate-700" : "border-slate-200"
            }`}
          >
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-lg bg-slate-800 text-white text-xs font-bold hover:bg-slate-700 transition"
              >
                Submit Feedback
              </button>
            </div>
          </div>
        </form>
      </section>
    </div>
  );
};

export default Feedback;
