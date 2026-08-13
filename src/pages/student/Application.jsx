import React, { useState } from "react";

const Application = () => {
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

  // -----------------------------
  // FORM HANDLERS
  // -----------------------------

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // -----------------------------
  // APPLICATION ACTIONS
  // -----------------------------

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

  // -----------------------------
  // SHARED INPUT STYLE
  // -----------------------------

  const inputClass =
    "w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 outline-none transition focus:bg-white focus:border-slate-400 focus:ring-2 focus:ring-slate-100";

  return (
    <div className="p-5 md:p-6 lg:p-8 max-w-[1400px] mx-auto">
      {/* =========================================
          PAGE HEADER
      ========================================= */}

      <div className="mb-6">
        <p className="text-xs uppercase tracking-widest font-bold text-slate-400 mb-1">
          Student Portal
        </p>

        <h1 className="text-2xl font-black text-slate-900">
          Internship Application
        </h1>

        <p className="text-sm text-slate-500 mt-1">
          Apply for an internship and manage your application.
        </p>
      </div>

      {/* =========================================
          APPLICATION TABS
      ========================================= */}

      <div className="inline-flex p-1 bg-slate-100 border border-slate-200 rounded-xl mb-5">
        {/* APPLY */}

        <button
          type="button"
          onClick={() => setActiveTab("apply")}
          className={`px-6 md:px-8 py-2.5 rounded-lg text-xs font-semibold transition ${
            activeTab === "apply"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          Apply
        </button>

        {/* STATUS */}

        <button
          type="button"
          onClick={() => setActiveTab("status")}
          className={`px-6 md:px-8 py-2.5 rounded-lg text-xs font-semibold transition ${
            activeTab === "status"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          View Status
        </button>

        {/* CANCEL */}

        <button
          type="button"
          onClick={() => setActiveTab("cancel")}
          className={`px-6 md:px-8 py-2.5 rounded-lg text-xs font-semibold transition ${
            activeTab === "cancel"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          Cancel
        </button>
      </div>

      {/* =========================================
          MAIN APPLICATION PANEL
      ========================================= */}

      <section className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 max-w-[1000px] shadow-sm">
        {/* =========================================
            APPLY TAB
        ========================================= */}

        {activeTab === "apply" && (
          <>
            <div className="mb-7">
              <h2 className="text-lg font-bold text-slate-900">
                Apply for Internship
              </h2>

              <p className="text-xs text-slate-400 mt-1">
                Complete the information below to submit your internship
                application.
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              {/* =====================================
                  COMPANY SELECTION
              ===================================== */}

              <div className="mb-7">
                <div className="mb-3">
                  <h3 className="text-sm font-bold text-slate-800">
                    Company Selection
                  </h3>

                  <p className="text-xs text-slate-400 mt-1">
                    Select your preferred internship company.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <select
                    value={formData.company}
                    onChange={(e) => handleChange("company", e.target.value)}
                    className={inputClass}
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
                    className={inputClass}
                  />
                </div>
              </div>

              {/* =====================================
                  POSITION PREFERENCES
              ===================================== */}

              <div className="mb-7">
                <div className="mb-3">
                  <h3 className="text-sm font-bold text-slate-800">
                    Position Preferences
                  </h3>

                  <p className="text-xs text-slate-400 mt-1">
                    Specify the position you would like to apply for.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <select
                    value={formData.position}
                    onChange={(e) => handleChange("position", e.target.value)}
                    className={inputClass}
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
                    className={inputClass}
                  />
                </div>
              </div>

              {/* =====================================
                  AVAILABILITY
              ===================================== */}

              <div className="mb-7">
                <div className="mb-3">
                  <h3 className="text-sm font-bold text-slate-800">
                    Availability
                  </h3>

                  <p className="text-xs text-slate-400 mt-1">
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
                    className={inputClass}
                  />

                  <input
                    type="text"
                    value={formData.availabilityDetails}
                    onChange={(e) =>
                      handleChange("availabilityDetails", e.target.value)
                    }
                    placeholder="Availability Details"
                    className={inputClass}
                  />
                </div>
              </div>

              {/* =====================================
                  COVER LETTER
              ===================================== */}

              <div className="mb-7">
                <div className="mb-3">
                  <h3 className="text-sm font-bold text-slate-800">
                    Cover Letter
                  </h3>

                  <p className="text-xs text-slate-400 mt-1">
                    Introduce yourself and explain why you are interested in the
                    internship.
                  </p>
                </div>

                <textarea
                  value={formData.coverLetter}
                  onChange={(e) => handleChange("coverLetter", e.target.value)}
                  rows={7}
                  placeholder="Write your cover letter here..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 outline-none resize-y transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
              </div>

              {/* =====================================
                  BUTTONS
              ===================================== */}

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition"
                >
                  Submit Application
                </button>

                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="px-6 py-3 rounded-xl border border-slate-200 bg-white text-slate-600 text-xs font-bold hover:bg-slate-50 transition"
                >
                  Save Draft
                </button>
              </div>
            </form>
          </>
        )}

        {/* =========================================
            STATUS TAB
        ========================================= */}

        {activeTab === "status" && (
          <>
            <div className="mb-7">
              <h2 className="text-lg font-bold text-slate-900">
                Application Status
              </h2>

              <p className="text-xs text-slate-400 mt-1">
                Track the progress of your internship application.
              </p>
            </div>

            {/* APPLICATION SUMMARY */}

            <div className="border border-slate-200 rounded-xl bg-slate-50 p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-2">
                    Company
                  </p>

                  <p className="text-sm font-semibold text-slate-800">
                    {formData.company || "No company selected"}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-2">
                    Position
                  </p>

                  <p className="text-sm font-semibold text-slate-800">
                    {formData.position || "No position selected"}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-2">
                    Application Date
                  </p>

                  <p className="text-sm font-semibold text-slate-800">
                    Not submitted yet
                  </p>
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-2">
                    Status
                  </p>

                  <span className="inline-flex px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-100 text-amber-700 text-xs font-bold">
                    {applicationStatus}
                  </span>
                </div>
              </div>
            </div>

            {/* APPLICATION PROGRESS */}

            <div className="mt-6 border border-slate-200 rounded-xl p-5">
              <div className="mb-5">
                <h3 className="text-sm font-bold text-slate-800">
                  Application Progress
                </h3>

                <p className="text-xs text-slate-400 mt-1">
                  Follow the current stage of your application.
                </p>
              </div>

              <div className="space-y-5">
                {/* STEP 1 */}

                <div className="flex items-start gap-4">
                  <span className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                    1
                  </span>

                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      Application Submitted
                    </p>

                    <p className="text-xs text-slate-400 mt-1">
                      Your application has been received.
                    </p>
                  </div>
                </div>

                {/* STEP 2 */}

                <div className="flex items-start gap-4">
                  <span className="w-8 h-8 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    2
                  </span>

                  <div>
                    <p className="text-sm font-semibold text-slate-500">
                      Faculty Review
                    </p>

                    <p className="text-xs text-slate-400 mt-1">
                      Waiting for faculty adviser review.
                    </p>
                  </div>
                </div>

                {/* STEP 3 */}

                <div className="flex items-start gap-4">
                  <span className="w-8 h-8 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    3
                  </span>

                  <div>
                    <p className="text-sm font-semibold text-slate-500">
                      Application Decision
                    </p>

                    <p className="text-xs text-slate-400 mt-1">
                      Final application decision.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* =========================================
            CANCEL TAB
        ========================================= */}

        {activeTab === "cancel" && (
          <>
            <div className="mb-7">
              <h2 className="text-lg font-bold text-slate-900">
                Cancel Application
              </h2>

              <p className="text-xs text-slate-400 mt-1">
                Review your current application before cancelling it.
              </p>
            </div>

            {/* CURRENT APPLICATION */}

            <div className="border border-slate-200 rounded-xl bg-slate-50 p-5 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-2">
                    Company
                  </p>

                  <p className="text-sm font-semibold text-slate-800">
                    {formData.company || "No active application"}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-2">
                    Position
                  </p>

                  <p className="text-sm font-semibold text-slate-800">
                    {formData.position || "No active application"}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-2">
                    Current Status
                  </p>

                  <span className="inline-flex px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold">
                    {applicationStatus}
                  </span>
                </div>
              </div>
            </div>

            {/* WARNING */}

            <div className="border border-red-200 rounded-xl bg-red-50 p-5">
              <div className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-lg bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
                  !
                </div>

                <div>
                  <h3 className="text-sm font-bold text-red-800">
                    Cancel Internship Application
                  </h3>

                  <p className="text-xs text-red-700 mt-2 leading-relaxed">
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
