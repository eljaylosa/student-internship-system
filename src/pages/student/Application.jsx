import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";

const Application = () => {
  const { darkMode } = useOutletContext();

  const [activeTab, setActiveTab] = useState("apply");

  const [formData, setFormData] = useState({
    company: "",
    companyLocation: "",
    position: "",
    positionType: "",
    availability: "",
    availabilityDetails: "",
    coverLetter: "",
  });

  const [applicationStatus, setApplicationStatus] = useState("Pending");

  // =========================================================
  // FORM HANDLERS
  // =========================================================

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // =========================================================
  // APPLICATION ACTIONS
  // =========================================================

  const handleSubmit = (e) => {
    e.preventDefault();

    alert("Application submitted successfully.");

    setApplicationStatus("Pending");
  };

  const handleSaveDraft = () => {
    alert("Application saved as draft.");
  };

  const handleCancelApplication = () => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel your internship application?"
    );

    if (!confirmed) return;

    setApplicationStatus("Withdrawn");

    alert("Application has been cancelled.");
  };

  // =========================================================
  // COMMON CLASSES
  // =========================================================

  const pageText = darkMode ? "text-slate-100" : "text-slate-900";

  const heading = darkMode ? "text-slate-100" : "text-slate-900";

  const subheading = darkMode ? "text-slate-400" : "text-slate-500";

  const muted = darkMode ? "text-slate-500" : "text-slate-400";

  const sectionHeading = darkMode ? "text-slate-200" : "text-slate-800";

  const cardClass = darkMode
    ? "bg-slate-900 border-slate-700"
    : "bg-white border-slate-200";

  const inputClass = darkMode
    ? "bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-500 focus:bg-slate-800 focus:border-slate-600 focus:ring-slate-700"
    : "bg-slate-50 border-slate-200 text-slate-700 placeholder:text-slate-400 focus:bg-white focus:border-slate-400 focus:ring-slate-100";

  const textareaClass = darkMode
    ? "bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-500 focus:bg-slate-800 focus:border-slate-600 focus:ring-slate-700"
    : "bg-white border-slate-200 text-slate-700 placeholder:text-slate-400 focus:bg-white focus:border-slate-400 focus:ring-slate-100";

  const tabContainerClass = darkMode
    ? "bg-slate-800 border-slate-700"
    : "bg-slate-100 border-slate-200";

  const activeTabClass = darkMode
    ? "bg-slate-700 text-white"
    : "bg-white text-slate-900";

  const inactiveTabClass = darkMode
    ? "text-slate-400 hover:text-white"
    : "text-slate-500 hover:text-slate-900";

  const innerBoxClass = darkMode
    ? "bg-slate-800 border-slate-700"
    : "bg-slate-50 border-slate-200";

  const progressCardClass = darkMode
    ? "bg-slate-900 border-slate-700"
    : "bg-white border-slate-200";

  const secondaryButtonClass = darkMode
    ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50";

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className={`p-5 md:p-6 lg:p-8 max-w-[1400px] mx-auto ${pageText}`}>
      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <div className="mb-6">
        <p
          className={`text-xs uppercase tracking-widest font-bold ${muted} mb-1`}
        >
          Student Portal
        </p>

        <h1 className={`text-2xl font-black ${heading}`}>
          Internship Application
        </h1>

        <p className={`text-sm mt-1 ${subheading}`}>
          Apply for an internship and manage your application.
        </p>
      </div>

      {/* =====================================================
          APPLICATION TABS
      ===================================================== */}

      <div
        className={`inline-flex p-1 border rounded-xl mb-5 ${tabContainerClass}`}
      >
        <button
          type="button"
          onClick={() => setActiveTab("apply")}
          className={`px-6 md:px-8 py-2.5 rounded-lg text-xs font-semibold transition ${
            activeTab === "apply"
              ? `${activeTabClass} shadow-sm`
              : inactiveTabClass
          }`}
        >
          Apply
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("status")}
          className={`px-6 md:px-8 py-2.5 rounded-lg text-xs font-semibold transition ${
            activeTab === "status"
              ? `${activeTabClass} shadow-sm`
              : inactiveTabClass
          }`}
        >
          View Status
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("cancel")}
          className={`px-6 md:px-8 py-2.5 rounded-lg text-xs font-semibold transition ${
            activeTab === "cancel"
              ? `${activeTabClass} shadow-sm`
              : inactiveTabClass
          }`}
        >
          Cancel
        </button>
      </div>

      {/* =====================================================
          MAIN APPLICATION PANEL
      ===================================================== */}

      <section
        className={`border rounded-2xl p-5 md:p-6 max-w-[1000px] shadow-sm ${cardClass}`}
      >
        {/* ===================================================
            APPLY TAB
        =================================================== */}

        {activeTab === "apply" && (
          <>
            <div className="mb-7">
              <h2 className={`text-lg font-bold ${heading}`}>
                Apply for Internship
              </h2>

              <p className={`text-xs mt-1 ${muted}`}>
                Complete the information below to submit your internship
                application.
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              {/* COMPANY SELECTION */}

              <div className="mb-7">
                <div className="mb-3">
                  <h3 className={`text-sm font-bold ${sectionHeading}`}>
                    Company Selection
                  </h3>

                  <p className={`text-xs mt-1 ${muted}`}>
                    Select your preferred internship company.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <select
                    value={formData.company}
                    onChange={(e) => handleChange("company", e.target.value)}
                    className={`w-full h-11 px-4 rounded-xl border text-sm outline-none transition focus:ring-2 ${inputClass}`}
                  >
                    <option value="">Select Company</option>
                    <option value="DataWorks">DataWorks</option>
                    <option value="TechSolutions Inc.">
                      TechSolutions Inc.
                    </option>
                    <option value="Creative Minds">Creative Minds</option>
                    <option value="WriteWay Agency">WriteWay Agency</option>
                  </select>

                  <input
                    type="text"
                    value={formData.companyLocation}
                    onChange={(e) =>
                      handleChange("companyLocation", e.target.value)
                    }
                    placeholder="Company Location"
                    className={`w-full h-11 px-4 rounded-xl border text-sm outline-none transition focus:ring-2 ${inputClass}`}
                  />
                </div>
              </div>

              {/* POSITION PREFERENCES */}

              <div className="mb-7">
                <div className="mb-3">
                  <h3 className={`text-sm font-bold ${sectionHeading}`}>
                    Position Preferences
                  </h3>

                  <p className={`text-xs mt-1 ${muted}`}>
                    Specify the position you would like to apply for.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <select
                    value={formData.position}
                    onChange={(e) => handleChange("position", e.target.value)}
                    className={`w-full h-11 px-4 rounded-xl border text-sm outline-none transition focus:ring-2 ${inputClass}`}
                  >
                    <option value="">Preferred Position</option>

                    <option value="Web Developer Intern">
                      Web Developer Intern
                    </option>

                    <option value="Software Developer Intern">
                      Software Developer Intern
                    </option>

                    <option value="Data Analyst Intern">
                      Data Analyst Intern
                    </option>

                    <option value="UI/UX Design Intern">
                      UI/UX Design Intern
                    </option>
                  </select>

                  <input
                    type="text"
                    value={formData.positionType}
                    onChange={(e) =>
                      handleChange("positionType", e.target.value)
                    }
                    placeholder="Other Position Preference"
                    className={`w-full h-11 px-4 rounded-xl border text-sm outline-none transition focus:ring-2 ${inputClass}`}
                  />
                </div>
              </div>

              {/* AVAILABILITY */}

              <div className="mb-7">
                <div className="mb-3">
                  <h3 className={`text-sm font-bold ${sectionHeading}`}>
                    Availability
                  </h3>

                  <p className={`text-xs mt-1 ${muted}`}>
                    Provide your expected internship availability.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="date"
                    value={formData.availability}
                    onChange={(e) =>
                      handleChange("availability", e.target.value)
                    }
                    className={`w-full h-11 px-4 rounded-xl border text-sm outline-none transition focus:ring-2 ${inputClass}`}
                  />

                  <input
                    type="text"
                    value={formData.availabilityDetails}
                    onChange={(e) =>
                      handleChange("availabilityDetails", e.target.value)
                    }
                    placeholder="Availability Details"
                    className={`w-full h-11 px-4 rounded-xl border text-sm outline-none transition focus:ring-2 ${inputClass}`}
                  />
                </div>
              </div>

              {/* COVER LETTER */}

              <div className="mb-7">
                <div className="mb-3">
                  <h3 className={`text-sm font-bold ${sectionHeading}`}>
                    Cover Letter
                  </h3>

                  <p className={`text-xs mt-1 ${muted}`}>
                    Introduce yourself and explain why you are interested in the
                    internship.
                  </p>
                </div>

                <textarea
                  value={formData.coverLetter}
                  onChange={(e) => handleChange("coverLetter", e.target.value)}
                  rows={7}
                  placeholder="Write your cover letter here..."
                  className={`w-full px-4 py-3 rounded-xl border text-sm outline-none resize-y transition focus:ring-2 ${textareaClass}`}
                />
              </div>

              {/* BUTTONS */}

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="submit"
                  className={`px-6 py-3 rounded-xl text-xs font-bold transition ${
                    darkMode
                      ? "bg-white text-slate-900 hover:bg-slate-100"
                      : "bg-slate-900 text-white hover:bg-slate-800"
                  }`}
                >
                  Submit Application
                </button>

                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className={`px-6 py-3 rounded-xl border text-xs font-bold transition ${secondaryButtonClass}`}
                >
                  Save Draft
                </button>
              </div>
            </form>
          </>
        )}

        {/* ===================================================
            STATUS TAB
        =================================================== */}

        {activeTab === "status" && (
          <>
            <div className="mb-7">
              <h2 className={`text-lg font-bold ${heading}`}>
                Application Status
              </h2>

              <p className={`text-xs mt-1 ${muted}`}>
                Track the progress of your internship application.
              </p>
            </div>

            {/* APPLICATION SUMMARY */}

            <div className={`border rounded-xl p-5 ${innerBoxClass}`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p
                    className={`text-[10px] uppercase tracking-wider font-bold ${muted} mb-2`}
                  >
                    Company
                  </p>

                  <p className={`text-sm font-semibold ${sectionHeading}`}>
                    {formData.company || "No company selected"}
                  </p>
                </div>

                <div>
                  <p
                    className={`text-[10px] uppercase tracking-wider font-bold ${muted} mb-2`}
                  >
                    Position
                  </p>

                  <p className={`text-sm font-semibold ${sectionHeading}`}>
                    {formData.position || "No position selected"}
                  </p>
                </div>

                <div>
                  <p
                    className={`text-[10px] uppercase tracking-wider font-bold ${muted} mb-2`}
                  >
                    Application Date
                  </p>

                  <p className={`text-sm font-semibold ${sectionHeading}`}>
                    Not submitted yet
                  </p>
                </div>

                <div>
                  <p
                    className={`text-[10px] uppercase tracking-wider font-bold ${muted} mb-2`}
                  >
                    Status
                  </p>

                  <span className="inline-flex px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-100 text-amber-700 text-xs font-bold dark:bg-amber-950/40 dark:border-amber-900/50 dark:text-amber-400">
                    {applicationStatus}
                  </span>
                </div>
              </div>
            </div>

            {/* APPLICATION PROGRESS */}

            <div className={`mt-6 border rounded-xl p-5 ${progressCardClass}`}>
              <div className="mb-5">
                <h3 className={`text-sm font-bold ${sectionHeading}`}>
                  Application Progress
                </h3>

                <p className={`text-xs mt-1 ${muted}`}>
                  Follow the current stage of your application.
                </p>
              </div>

              <div className="space-y-5">
                {/* STEP 1 */}

                <div className="flex items-start gap-4">
                  <span
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      darkMode
                        ? "bg-white text-slate-900"
                        : "bg-slate-900 text-white"
                    }`}
                  >
                    1
                  </span>

                  <div>
                    <p className={`text-sm font-semibold ${sectionHeading}`}>
                      Application Submitted
                    </p>

                    <p className={`text-xs mt-1 ${muted}`}>
                      Your application has been received.
                    </p>
                  </div>
                </div>

                {/* STEP 2 */}

                <div className="flex items-start gap-4">
                  <span
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      darkMode
                        ? "bg-slate-800 text-slate-500"
                        : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    2
                  </span>

                  <div>
                    <p
                      className={`text-sm font-semibold ${
                        darkMode ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
                      Faculty Review
                    </p>

                    <p className={`text-xs mt-1 ${muted}`}>
                      Waiting for faculty adviser review.
                    </p>
                  </div>
                </div>

                {/* STEP 3 */}

                <div className="flex items-start gap-4">
                  <span
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      darkMode
                        ? "bg-slate-800 text-slate-500"
                        : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    3
                  </span>

                  <div>
                    <p
                      className={`text-sm font-semibold ${
                        darkMode ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
                      Application Decision
                    </p>

                    <p className={`text-xs mt-1 ${muted}`}>
                      Final application decision.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ===================================================
            CANCEL TAB
        =================================================== */}

        {activeTab === "cancel" && (
          <>
            <div className="mb-7">
              <h2 className={`text-lg font-bold ${heading}`}>
                Cancel Application
              </h2>

              <p className={`text-xs mt-1 ${muted}`}>
                Review your current application before cancelling it.
              </p>
            </div>

            {/* CURRENT APPLICATION */}

            <div className={`border rounded-xl p-5 mb-6 ${innerBoxClass}`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p
                    className={`text-[10px] uppercase tracking-wider font-bold ${muted} mb-2`}
                  >
                    Company
                  </p>

                  <p className={`text-sm font-semibold ${sectionHeading}`}>
                    {formData.company || "No active application"}
                  </p>
                </div>

                <div>
                  <p
                    className={`text-[10px] uppercase tracking-wider font-bold ${muted} mb-2`}
                  >
                    Position
                  </p>

                  <p className={`text-sm font-semibold ${sectionHeading}`}>
                    {formData.position || "No active application"}
                  </p>
                </div>

                <div>
                  <p
                    className={`text-[10px] uppercase tracking-wider font-bold ${muted} mb-2`}
                  >
                    Current Status
                  </p>

                  <span
                    className={`inline-flex px-3 py-1.5 rounded-lg border text-xs font-bold ${
                      darkMode
                        ? "bg-slate-700 border-slate-600 text-slate-300"
                        : "bg-slate-100 border-slate-200 text-slate-600"
                    }`}
                  >
                    {applicationStatus}
                  </span>
                </div>
              </div>
            </div>

            {/* WARNING */}

            <div
              className={`border rounded-xl p-5 ${
                darkMode
                  ? "bg-red-950/30 border-red-900/50"
                  : "bg-red-50 border-red-200"
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    darkMode
                      ? "bg-red-900/50 text-red-400"
                      : "bg-red-100 text-red-600"
                  }`}
                >
                  !
                </div>

                <div>
                  <h3
                    className={`text-sm font-bold ${
                      darkMode ? "text-red-300" : "text-red-800"
                    }`}
                  >
                    Cancel Internship Application
                  </h3>

                  <p
                    className={`text-xs mt-2 leading-relaxed ${
                      darkMode ? "text-red-400" : "text-red-700"
                    }`}
                  >
                    Cancelling your application will withdraw it from the
                    internship application process. This action should only be
                    performed if you no longer wish to continue with the
                    application.
                  </p>

                  <button
                    type="button"
                    onClick={handleCancelApplication}
                    className="mt-4 px-6 py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition"
                  >
                    Cancel Application
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
};

export default Application;
