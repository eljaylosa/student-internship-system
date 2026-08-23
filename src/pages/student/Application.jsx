import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabaseStudent } from "../../supabaseClient";

const STATUS = {
  opportunity: {
    ACTIVE: "active",
    CLOSED: "closed",
  },

  application: {
    DRAFT: "draft",
    SUBMITTED: "submitted",
    UNDER_REVIEW: "under_review",
    INFO_REQUESTED: "info_requested",
    APPROVED: "approved",
    REJECTED: "rejected",
    WITHDRAWN: "withdrawn",
  },
};

export default function Application() {
  const { darkMode } = useOutletContext();

  // =========================================================
  // STATE
  // =========================================================

  const [student, setStudent] = useState(null);
  const [opportunities, setOpportunities] = useState([]);
  const [applications, setApplications] = useState([]);
  const [assignment, setAssignment] = useState(null);

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [activeTab, setActiveTab] = useState("apply");

  const [opportunityId, setOpportunityId] = useState("");
  const [coverLetter, setCoverLetter] = useState("");

  // Used when a rejected application is being submitted again.
  const [isReapplying, setIsReapplying] = useState(false);

  // =========================================================
  // LOAD DATA
  // =========================================================

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabaseStudent.auth.getUser();

      if (authError) {
        throw authError;
      }

      if (!user) {
        throw new Error("You are not logged in.");
      }

      // -------------------------------------------------------
      // GET STUDENT PROFILE
      // -------------------------------------------------------

      const { data: studentData, error: studentError } = await supabaseStudent
        .from("students")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (studentError) {
        throw studentError;
      }

      if (!studentData) {
        throw new Error("No student profile was found for your account.");
      }

      setStudent(studentData);

      // -------------------------------------------------------
      // LOAD ACTIVE OPPORTUNITIES
      // -------------------------------------------------------

      const { data: opportunityData, error: opportunityError } =
        await supabaseStudent
          .from("opportunities")
          .select("*")
          .eq("status", STATUS.opportunity.ACTIVE)
          .order("created_at", {
            ascending: false,
          });

      if (opportunityError) {
        throw opportunityError;
      }

      const loadedOpportunities = opportunityData || [];

      // -------------------------------------------------------
      // LOAD COMPANIES
      // -------------------------------------------------------

      const companyIds = [
        ...new Set(
          loadedOpportunities
            .map((opportunity) => opportunity.company_id)
            .filter(Boolean)
        ),
      ];

      let companyMap = {};

      if (companyIds.length > 0) {
        const { data: companyData, error: companyError } = await supabaseStudent
          .from("companies")
          .select(
            `
                id,
                company_name,
                company_address,
                industry,
                status
              `
          )
          .in("id", companyIds);

        if (companyError) {
          throw companyError;
        }

        companyMap = (companyData || []).reduce((map, company) => {
          map[company.id] = company;
          return map;
        }, {});
      }

      // -------------------------------------------------------
      // ATTACH COMPANY
      // -------------------------------------------------------

      const opportunitiesWithCompanies = loadedOpportunities.map(
        (opportunity) => ({
          ...opportunity,
          companies: companyMap[opportunity.company_id] || null,
        })
      );

      setOpportunities(opportunitiesWithCompanies);

      if (opportunitiesWithCompanies.length > 0) {
        setOpportunityId(opportunitiesWithCompanies[0].id);
      } else {
        setOpportunityId("");
      }

      // -------------------------------------------------------
      // LOAD APPLICATIONS
      // -------------------------------------------------------

      const { data: applicationData, error: applicationError } =
        await supabaseStudent
          .from("applications")
          .select("*")
          .eq("student_id", user.id)
          .order("created_at", {
            ascending: false,
          });

      if (applicationError) {
        throw applicationError;
      }

      setApplications(applicationData || []);

      // -------------------------------------------------------
      // ASSIGNMENT
      // -------------------------------------------------------

      setAssignment(null);
    } catch (error) {
      console.error("Error loading student internship data:", error);

      alert(error.message || "Unable to load internship opportunities.");
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // SELECTED OPPORTUNITY
  // =========================================================

  const selectedOpportunity = opportunities.find(
    (item) => item.id === opportunityId
  );

  // =========================================================
  // APPLICATIONS FOR SELECTED OPPORTUNITY
  // =========================================================

  const opportunityApplications = applications
    .filter((application) => application.opportunity_id === opportunityId)
    .sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();

      return dateB - dateA;
    });

  // Latest application is the one that controls the current state.
  const existingApplication = applications.find(
    (application) =>
      application.opportunity_id === opportunityId &&
      application.status !== STATUS.application.REJECTED
  );

  // =========================================================
  // FORMAT DATE
  // =========================================================

  const formatDate = (date) => {
    if (!date) {
      return "Not specified";
    }

    const dateString = String(date).split("T")[0];

    const parts = dateString.split("-");

    if (parts.length === 3) {
      const [year, month, day] = parts;

      const parsedDate = new Date(Number(year), Number(month) - 1, Number(day));

      if (!Number.isNaN(parsedDate.getTime())) {
        return parsedDate.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        });
      }
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Not specified";
    }

    return parsedDate.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  // =========================================================
  // FORMAT INTERNSHIP PERIOD
  // =========================================================

  const formatInternshipPeriod = (opportunity) => {
    if (!opportunity) {
      return "Not specified";
    }

    const start = opportunity.internship_start_date;
    const end = opportunity.internship_end_date;

    if (start && end) {
      return `${formatDate(start)} – ${formatDate(end)}`;
    }

    if (start) {
      return `${formatDate(start)} – Not specified`;
    }

    if (end) {
      return `Not specified – ${formatDate(end)}`;
    }

    return opportunity.availability || "Not specified";
  };

  // =========================================================
  // STYLES
  // =========================================================

  const input = darkMode
    ? "bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500"
    : "bg-slate-50 border-slate-200 text-slate-700 placeholder-slate-400";

  const card = darkMode
    ? "bg-slate-900 border-slate-700"
    : "bg-white border-slate-200";

  // =========================================================
  // STATUS COLOR
  // =========================================================

  const statusTone = (status) => {
    switch (status) {
      case STATUS.application.APPROVED:
        return "text-emerald-600";

      case STATUS.application.REJECTED:
        return "text-red-600";

      case STATUS.application.SUBMITTED:
        return "text-blue-600";

      case STATUS.application.UNDER_REVIEW:
        return "text-amber-600";

      case STATUS.application.INFO_REQUESTED:
        return "text-orange-600";

      case STATUS.application.WITHDRAWN:
        return "text-slate-500";

      case STATUS.application.DRAFT:
        return "text-slate-500";

      default:
        return "text-amber-600";
    }
  };

  // =========================================================
  // FORMAT STATUS
  // =========================================================

  const formatStatus = (status) => {
    if (!status) {
      return "Unknown";
    }

    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  // =========================================================
  // SELECT OPPORTUNITY
  // =========================================================

  const handleSelectOpportunity = (opportunity) => {
    setOpportunityId(opportunity.id);
    setIsReapplying(false);

    const opportunityApplications = applications
      .filter((item) => item.opportunity_id === opportunity.id)
      .sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();

        return dateB - dateA;
      });

    const application = opportunityApplications[0];

    if (
      application?.status === STATUS.application.DRAFT ||
      application?.status === STATUS.application.INFO_REQUESTED
    ) {
      setCoverLetter(application.cover_letter || "");
    } else {
      setCoverLetter("");
    }
  };

  // =========================================================
  // UPDATE + RESUBMIT INFORMATION REQUEST
  // =========================================================

  const handleResubmitInformation = async () => {
    if (!student) {
      alert("Student profile could not be loaded.");
      return;
    }

    if (!selectedOpportunity) {
      alert("The selected internship opportunity could not be found.");
      return;
    }

    if (!existingApplication) {
      alert("The application could not be found.");
      return;
    }

    if (existingApplication.status !== STATUS.application.INFO_REQUESTED) {
      alert("This application is not waiting for additional information.");
      return;
    }

    if (!coverLetter.trim()) {
      alert("Please update your application before resubmitting.");
      return;
    }

    setIsSubmitting(true);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabaseStudent.auth.getUser();

      if (authError) {
        throw authError;
      }

      if (!user) {
        throw new Error("You are not logged in.");
      }

      const { data: updatedApplication, error: updateError } =
        await supabaseStudent
          .from("applications")
          .update({
            cover_letter: coverLetter.trim(),
            status: STATUS.application.SUBMITTED,
            submitted_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingApplication.id)
          .eq("student_id", user.id)
          .select()
          .single();

      if (updateError) {
        throw updateError;
      }

      setApplications((previous) =>
        previous.map((application) =>
          application.id === updatedApplication.id
            ? updatedApplication
            : application
        )
      );

      setCoverLetter("");

      alert(
        `Application resubmitted successfully for ${selectedOpportunity.title}.`
      );

      setActiveTab("status");
    } catch (error) {
      console.error("Error resubmitting application:", error);

      alert(
        error.message ||
          "Unable to resubmit your application. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // =========================================================
  // APPLY AGAIN AFTER REJECTION
  // =========================================================

  const handleApplyAgain = (opportunity) => {
    if (!opportunity) {
      return;
    }

    setOpportunityId(opportunity.id);
    setCoverLetter("");
    setIsReapplying(true);
    setActiveTab("apply");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // =========================================================
  // SUBMIT APPLICATION
  // =========================================================

  const handleSubmitApplication = async () => {
    if (!student) {
      alert("Student profile could not be loaded.");
      return;
    }

    if (!selectedOpportunity) {
      alert("Please select an internship opportunity.");
      return;
    }

    // If this is an information-requested application,
    // use the dedicated resubmission flow instead.
    if (
      existingApplication?.status === STATUS.application.INFO_REQUESTED &&
      !isReapplying
    ) {
      await handleResubmitInformation();
      return;
    }

    // Draft applications are updated instead of creating another row.
    if (
      existingApplication?.status === STATUS.application.DRAFT &&
      !isReapplying
    ) {
      await handleSubmitDraft();
      return;
    }

    // Submitted/under review/approved applications cannot be duplicated.
    if (
      existingApplication &&
      ![
        STATUS.application.REJECTED,
        STATUS.application.DRAFT,
        STATUS.application.INFO_REQUESTED,
      ].includes(existingApplication.status) &&
      !isReapplying
    ) {
      alert(
        `You already have an active application for ${selectedOpportunity.title}.`
      );
      return;
    }

    if (!coverLetter.trim()) {
      alert("Please provide a cover letter before submitting.");
      return;
    }

    setIsSubmitting(true);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabaseStudent.auth.getUser();

      if (authError) {
        throw authError;
      }

      if (!user) {
        throw new Error("You are not logged in.");
      }

      // -------------------------------------------------------
      // CREATE NEW APPLICATION
      // -------------------------------------------------------

      const { data: newApplication, error: insertError } = await supabaseStudent
        .from("applications")
        .insert({
          student_id: user.id,
          opportunity_id: selectedOpportunity.id,
          cover_letter: coverLetter.trim(),
          status: STATUS.application.SUBMITTED,
          submitted_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        if (insertError.code === "23505") {
          throw new Error(
            "Unable to create a new application because a duplicate application was detected."
          );
        }

        throw insertError;
      }

      setApplications((previous) => [newApplication, ...previous]);

      setCoverLetter("");
      setIsReapplying(false);

      alert(
        `Application submitted successfully for ${selectedOpportunity.title}.`
      );

      setActiveTab("status");
    } catch (error) {
      console.error("Error submitting application:", error);

      alert(
        error.message || "Unable to submit your application. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // =========================================================
  // SUBMIT EXISTING DRAFT
  // =========================================================

  const handleSubmitDraft = async () => {
    if (!student || !selectedOpportunity || !existingApplication) {
      return;
    }

    if (!coverLetter.trim()) {
      alert("Please provide a cover letter before submitting.");
      return;
    }

    setIsSubmitting(true);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabaseStudent.auth.getUser();

      if (authError) {
        throw authError;
      }

      if (!user) {
        throw new Error("You are not logged in.");
      }

      const { data: updatedApplication, error: updateError } =
        await supabaseStudent
          .from("applications")
          .update({
            cover_letter: coverLetter.trim(),
            status: STATUS.application.SUBMITTED,
            submitted_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingApplication.id)
          .eq("student_id", user.id)
          .select()
          .single();

      if (updateError) {
        throw updateError;
      }

      setApplications((previous) =>
        previous.map((application) =>
          application.id === updatedApplication.id
            ? updatedApplication
            : application
        )
      );

      setCoverLetter("");

      alert(
        `Application submitted successfully for ${selectedOpportunity.title}.`
      );

      setActiveTab("status");
    } catch (error) {
      console.error("Error submitting draft:", error);

      alert(error.message || "Unable to submit your application.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // =========================================================
  // SAVE DRAFT
  // =========================================================

  const handleSaveDraft = async () => {
    if (!student) {
      alert("Student profile could not be loaded.");
      return;
    }

    if (!selectedOpportunity) {
      alert("Please select an internship opportunity.");
      return;
    }

    if (!coverLetter.trim()) {
      alert("Please write something before saving the draft.");
      return;
    }

    // A rejected application must use Apply Again.
    if (existingApplication?.status === STATUS.application.REJECTED) {
      alert("Please use 'Apply Again' to create a new application.");
      return;
    }

    // Information requested must use resubmit.
    if (existingApplication?.status === STATUS.application.INFO_REQUESTED) {
      alert(
        "Please use 'Resubmit Application' after updating your application."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabaseStudent.auth.getUser();

      if (authError) {
        throw authError;
      }

      if (!user) {
        throw new Error("You are not logged in.");
      }

      // -------------------------------------------------------
      // EXISTING DRAFT
      // -------------------------------------------------------

      if (existingApplication?.status === STATUS.application.DRAFT) {
        const { data: updatedApplication, error: updateError } =
          await supabaseStudent
            .from("applications")
            .update({
              cover_letter: coverLetter.trim(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingApplication.id)
            .eq("student_id", user.id)
            .select()
            .single();

        if (updateError) {
          throw updateError;
        }

        setApplications((previous) =>
          previous.map((application) =>
            application.id === updatedApplication.id
              ? updatedApplication
              : application
          )
        );
      } else {
        // -----------------------------------------------------
        // CREATE NEW DRAFT
        // -----------------------------------------------------

        const { data: newDraft, error: insertError } = await supabaseStudent
          .from("applications")
          .insert({
            student_id: user.id,
            opportunity_id: selectedOpportunity.id,
            cover_letter: coverLetter.trim(),
            status: STATUS.application.DRAFT,
          })
          .select()
          .single();

        if (insertError) {
          if (insertError.code === "23505") {
            throw new Error(
              "An application already exists for this opportunity."
            );
          }

          throw insertError;
        }

        setApplications((previous) => [newDraft, ...previous]);
      }

      alert("Application draft saved successfully.");
    } catch (error) {
      console.error("Error saving application draft:", error);

      alert(error.message || "Unable to save your application draft.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div
        className={`p-5 md:p-6 lg:p-8 max-w-[1400px] mx-auto ${
          darkMode ? "text-slate-100" : "text-slate-900"
        }`}
      >
        <div className={`border rounded-2xl p-10 text-center ${card}`}>
          <div className="text-2xl mb-3">⏳</div>

          <h3 className="font-bold">Loading internship opportunities...</h3>

          <p className="text-sm mt-1 text-slate-500">
            Please wait while we load available opportunities.
          </p>
        </div>
      </div>
    );
  }

  // =========================================================
  // RETURN
  // =========================================================

  return (
    <div
      className={`p-5 md:p-6 lg:p-8 max-w-[1400px] mx-auto ${
        darkMode ? "text-slate-100" : "text-slate-900"
      }`}
    >
      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <div className="mb-6">
        <p className="text-xs uppercase tracking-widest font-bold text-slate-400">
          Student Portal
        </p>

        <h1 className="text-2xl font-black">Internship Application</h1>

        <p
          className={`text-sm mt-1 ${
            darkMode ? "text-slate-400" : "text-slate-500"
          }`}
        >
          Browse company internship opportunities and apply for the placement
          that matches your interests.
        </p>
      </div>

      {/* =====================================================
          TABS
      ===================================================== */}

      <div
        className={`inline-flex p-1 border rounded-xl mb-5 ${
          darkMode
            ? "bg-slate-800 border-slate-700"
            : "bg-slate-100 border-slate-200"
        }`}
      >
        {["apply", "status"].map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2.5 rounded-lg text-xs font-semibold ${
              activeTab === tab
                ? "bg-white text-slate-900 shadow-sm"
                : darkMode
                ? "text-slate-400"
                : "text-slate-500"
            }`}
          >
            {tab === "apply" ? "Apply" : "View Status"}
          </button>
        ))}
      </div>

      {/* =====================================================
          APPLY TAB
      ===================================================== */}

      {activeTab === "apply" ? (
        <section className={`border rounded-2xl p-5 md:p-6 ${card}`}>
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="font-bold text-lg">Available Opportunities</h2>

              <p
                className={`text-xs mt-1 ${
                  darkMode ? "text-slate-400" : "text-slate-500"
                }`}
              >
                These opportunities are currently published by companies.
              </p>
            </div>

            <span className="text-xs font-semibold text-slate-400">
              {opportunities.length} available
            </span>
          </div>

          {opportunities.length === 0 ? (
            <div
              className={`border rounded-xl p-8 text-center ${
                darkMode ? "border-slate-700" : "border-slate-200"
              }`}
            >
              <div className="text-3xl mb-3">📋</div>

              <h3 className="font-bold">
                No internship opportunities available
              </h3>

              <p
                className={`text-sm mt-1 ${
                  darkMode ? "text-slate-400" : "text-slate-500"
                }`}
              >
                Please check again later for new internship opportunities.
              </p>
            </div>
          ) : (
            <>
              {/* =================================================
                  OPPORTUNITY CARDS
              ================================================= */}

              <div className="grid md:grid-cols-2 gap-4 mb-6">
                {opportunities.map((opportunity) => {
                  const company = opportunity.companies;

                  const opportunityApplications = applications
                    .filter((item) => item.opportunity_id === opportunity.id)
                    .sort((a, b) => {
                      const dateA = new Date(a.created_at || 0).getTime();
                      const dateB = new Date(b.created_at || 0).getTime();

                      return dateB - dateA;
                    });

                  const application = opportunityApplications[0];

                  return (
                    <button
                      key={opportunity.id}
                      type="button"
                      onClick={() => handleSelectOpportunity(opportunity)}
                      className={`text-left border rounded-xl p-4 transition ${
                        opportunityId === opportunity.id
                          ? darkMode
                            ? "border-blue-500 ring-2 ring-blue-950"
                            : "border-blue-500 ring-2 ring-blue-100"
                          : darkMode
                          ? "border-slate-700 hover:border-slate-500"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex justify-between gap-2">
                        <strong>{opportunity.title}</strong>

                        <span className="text-[10px] text-emerald-600 font-bold">
                          Active
                        </span>
                      </div>

                      <p
                        className={`text-xs mt-1 ${
                          darkMode ? "text-slate-400" : "text-slate-500"
                        }`}
                      >
                        {company?.company_name || "Company"} ·{" "}
                        {opportunity.location}
                      </p>

                      <p
                        className={`text-xs mt-2 line-clamp-3 ${
                          darkMode ? "text-slate-400" : "text-slate-500"
                        }`}
                      >
                        {opportunity.description}
                      </p>

                      <div className="flex flex-wrap gap-2 mt-3">
                        <span
                          className={`text-[10px] px-2 py-1 rounded-md ${
                            darkMode
                              ? "bg-slate-800 text-slate-400"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          📍 {opportunity.location}
                        </span>

                        <span
                          className={`text-[10px] px-2 py-1 rounded-md ${
                            darkMode
                              ? "bg-slate-800 text-slate-400"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          👥 {opportunity.openings}{" "}
                          {opportunity.openings === 1 ? "opening" : "openings"}
                        </span>

                        <span
                          className={`text-[10px] px-2 py-1 rounded-md ${
                            darkMode
                              ? "bg-slate-800 text-slate-400"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          💼 {opportunity.position_type || "On-site"}
                        </span>
                      </div>

                      <div className="mt-3 space-y-1">
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400">
                            Internship Start
                          </p>

                          <p
                            className={`text-xs font-semibold mt-1 ${
                              darkMode ? "text-slate-300" : "text-slate-600"
                            }`}
                          >
                            {formatDate(
                              opportunity.internship_start_date ||
                                opportunity.internship_start
                            )}
                          </p>
                        </div>

                        <div className="pt-1">
                          <p className="text-[10px] uppercase font-bold text-slate-400">
                            Internship End
                          </p>

                          <p
                            className={`text-xs font-semibold mt-1 ${
                              darkMode ? "text-slate-300" : "text-slate-600"
                            }`}
                          >
                            {formatDate(
                              opportunity.internship_end_date ||
                                opportunity.internship_end
                            )}
                          </p>
                        </div>
                      </div>

                      {opportunity.availability && (
                        <p className="text-[10px] text-slate-400 mt-1">
                          Availability: {opportunity.availability}
                        </p>
                      )}

                      {application && (
                        <div
                          className={`mt-3 text-[10px] font-bold ${statusTone(
                            application.status
                          )}`}
                        >
                          Application: {formatStatus(application.status)}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* =================================================
                  SELECTED OPPORTUNITY
              ================================================= */}

              {selectedOpportunity && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      Selected Opportunity
                    </label>

                    <input
                      className={`w-full border rounded-lg px-3 py-2 text-sm ${input}`}
                      value={`${selectedOpportunity.title} — ${
                        selectedOpportunity.companies?.company_name || "Company"
                      }`}
                      readOnly
                    />
                  </div>

                  <div
                    className={`grid sm:grid-cols-2 lg:grid-cols-4 gap-3 border rounded-xl p-4 ${
                      darkMode
                        ? "border-slate-700 bg-slate-800/50"
                        : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">
                        Location
                      </p>

                      <p className="text-xs font-semibold mt-1">
                        {selectedOpportunity.location || "Not specified"}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">
                        Position Type
                      </p>

                      <p className="text-xs font-semibold mt-1">
                        {selectedOpportunity.position_type || "On-site"}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">
                        Openings
                      </p>

                      <p className="text-xs font-semibold mt-1">
                        {selectedOpportunity.openings}{" "}
                        {selectedOpportunity.openings === 1
                          ? "opening"
                          : "openings"}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] uppercase font-bold">
                        Internship Period
                      </p>

                      <p className="text-xs font-semibold mt-1">
                        {formatInternshipPeriod(selectedOpportunity)}
                      </p>
                    </div>
                  </div>

                  {/* =================================================
                      INFORMATION REQUESTED
                  ================================================= */}

                  {existingApplication?.status ===
                    STATUS.application.INFO_REQUESTED &&
                    !isReapplying && (
                      <div
                        className={`border rounded-xl p-4 ${
                          darkMode
                            ? "border-orange-800 bg-orange-950/30"
                            : "border-orange-200 bg-orange-50"
                        }`}
                      >
                        <p className="text-xs font-bold text-orange-600">
                          Additional Information Requested
                        </p>

                        <p
                          className={`text-xs mt-2 ${
                            darkMode ? "text-orange-200" : "text-orange-800"
                          }`}
                        >
                          The Registrar has requested changes or additional
                          information before your application can continue.
                        </p>

                        {existingApplication.notes && (
                          <div
                            className={`mt-3 p-3 rounded-lg border ${
                              darkMode
                                ? "border-orange-800 bg-orange-950/40"
                                : "border-orange-200 bg-white"
                            }`}
                          >
                            <p className="text-[10px] uppercase font-bold text-orange-600">
                              Registrar's Message
                            </p>

                            <p className="text-xs mt-1">
                              {existingApplication.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                  {/* =================================================
                      REJECTED
                  ================================================= */}

                  {existingApplication?.status ===
                    STATUS.application.REJECTED &&
                    !isReapplying && (
                      <div
                        className={`border rounded-xl p-4 ${
                          darkMode
                            ? "border-red-800 bg-red-950/30"
                            : "border-red-200 bg-red-50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-bold text-red-600">
                              Application Rejected
                            </p>

                            <p
                              className={`text-xs mt-2 ${
                                darkMode ? "text-red-200" : "text-red-800"
                              }`}
                            >
                              Your application was not approved by the
                              Registrar.
                            </p>
                          </div>

                          <span className="text-xs font-bold text-red-600">
                            Rejected
                          </span>
                        </div>

                        {existingApplication.notes && (
                          <div
                            className={`mt-3 p-3 rounded-lg border ${
                              darkMode
                                ? "border-red-800 bg-red-950/40"
                                : "border-red-200 bg-white"
                            }`}
                          >
                            <p className="text-[10px] uppercase font-bold text-red-600">
                              Reason for Rejection
                            </p>

                            <p className="text-xs mt-1">
                              {existingApplication.notes}
                            </p>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => handleApplyAgain(selectedOpportunity)}
                          className="mt-4 px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
                        >
                          Apply Again
                        </button>
                      </div>
                    )}

                  {/* =================================================
                      ACTIVE APPLICATION
                  ================================================= */}

                  {existingApplication &&
                    ![
                      STATUS.application.DRAFT,
                      STATUS.application.INFO_REQUESTED,
                      STATUS.application.REJECTED,
                    ].includes(existingApplication.status) && (
                      <div
                        className={`border rounded-xl p-4 ${
                          darkMode
                            ? "border-slate-700 bg-slate-800"
                            : "border-slate-200 bg-slate-50"
                        }`}
                      >
                        <p className="text-xs font-bold">
                          You already have an active application for this
                          opportunity.
                        </p>

                        <p
                          className={`text-xs mt-1 ${statusTone(
                            existingApplication.status
                          )}`}
                        >
                          Status: {formatStatus(existingApplication.status)}
                        </p>

                        {existingApplication.submitted_at && (
                          <p className="text-[10px] text-slate-400 mt-2">
                            Submitted:{" "}
                            {new Date(
                              existingApplication.submitted_at
                            ).toLocaleString()}
                          </p>
                        )}
                      </div>
                    )}

                  {/* =================================================
                      EDITABLE FORM
                  ================================================= */}

                  {(!existingApplication ||
                    existingApplication.status === STATUS.application.DRAFT ||
                    existingApplication.status ===
                      STATUS.application.INFO_REQUESTED ||
                    isReapplying) && (
                    <>
                      <div>
                        <label className="block text-xs font-semibold mb-1">
                          {isReapplying
                            ? "New Application Cover Letter"
                            : existingApplication?.status ===
                              STATUS.application.INFO_REQUESTED
                            ? "Update Cover Letter"
                            : "Cover Letter"}
                        </label>

                        <textarea
                          rows="5"
                          className={`w-full border rounded-lg px-3 py-2 text-sm ${input}`}
                          value={coverLetter}
                          onChange={(event) =>
                            setCoverLetter(event.target.value)
                          }
                          placeholder="Explain your interest in this opportunity."
                          disabled={isSubmitting}
                        />
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {!isReapplying &&
                          existingApplication?.status !==
                            STATUS.application.INFO_REQUESTED && (
                            <button
                              type="button"
                              className={`px-4 py-2 rounded-lg border text-xs font-semibold ${
                                isSubmitting
                                  ? "opacity-50 cursor-not-allowed"
                                  : ""
                              }`}
                              onClick={handleSaveDraft}
                              disabled={isSubmitting}
                            >
                              {isSubmitting ? "Saving..." : "Save Draft"}
                            </button>
                          )}

                        {existingApplication?.status ===
                          STATUS.application.INFO_REQUESTED && !isReapplying ? (
                          <button
                            type="button"
                            className={`px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold ${
                              isSubmitting
                                ? "opacity-50 cursor-not-allowed"
                                : "hover:bg-blue-700"
                            }`}
                            onClick={handleResubmitInformation}
                            disabled={isSubmitting}
                          >
                            {isSubmitting
                              ? "Resubmitting..."
                              : "Resubmit Application"}
                          </button>
                        ) : (
                          <button
                            type="button"
                            className={`px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold ${
                              isSubmitting
                                ? "opacity-50 cursor-not-allowed"
                                : "hover:bg-slate-800"
                            }`}
                            onClick={handleSubmitApplication}
                            disabled={isSubmitting}
                          >
                            {isSubmitting
                              ? "Submitting..."
                              : isReapplying
                              ? "Submit New Application"
                              : "Submit Application"}
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </section>
      ) : (
        /* =====================================================
           STATUS TAB
        ===================================================== */

        <section className={`border rounded-2xl p-5 md:p-6 ${card}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-lg">Application Status</h2>

              <p className="text-xs text-slate-500 mt-1">
                Track the status of your submitted internship applications.
              </p>
            </div>

            <span className="text-xs font-semibold text-slate-400">
              {applications.length} application
              {applications.length === 1 ? "" : "s"}
            </span>
          </div>

          {applications.length === 0 ? (
            <div
              className={`border rounded-xl p-8 text-center ${
                darkMode ? "border-slate-700" : "border-slate-200"
              }`}
            >
              <div className="text-3xl mb-3">📋</div>

              <p className="text-sm font-semibold">No applications yet.</p>

              <p className="text-xs text-slate-500 mt-1">
                Your submitted applications will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {applications.map((application) => {
                const opportunity = opportunities.find(
                  (item) => item.id === application.opportunity_id
                );

                return (
                  <div
                    key={application.id}
                    className={`border rounded-xl p-4 ${
                      darkMode ? "border-slate-700" : "border-slate-200"
                    }`}
                  >
                    <div className="flex justify-between gap-4">
                      <div>
                        <p className="font-semibold">
                          {opportunity?.title || application.opportunity_id}
                        </p>

                        <p className="text-xs text-slate-500">
                          {opportunity?.companies?.company_name || "Company"}
                        </p>

                        {opportunity && (
                          <p className="text-xs text-slate-500 mt-1">
                            📅 {formatInternshipPeriod(opportunity)}
                          </p>
                        )}

                        <p className="text-[10px] text-slate-400 mt-1">
                          Application ID: {application.id}
                        </p>
                      </div>

                      <span
                        className={`text-xs font-bold ${statusTone(
                          application.status
                        )}`}
                      >
                        {formatStatus(application.status)}
                      </span>
                    </div>

                    {application.submitted_at && (
                      <p className="text-xs text-slate-500 mt-2">
                        Submitted:{" "}
                        {new Date(application.submitted_at).toLocaleString()}
                      </p>
                    )}

                    {/* INFO REQUESTED MESSAGE */}

                    {application.status ===
                      STATUS.application.INFO_REQUESTED && (
                      <div
                        className={`mt-3 p-3 rounded-lg border ${
                          darkMode
                            ? "border-orange-800 bg-orange-950/30"
                            : "border-orange-200 bg-orange-50"
                        }`}
                      >
                        <p className="text-[10px] uppercase font-bold text-orange-600">
                          Action Required
                        </p>

                        <p className="text-xs mt-1">
                          {application.notes ||
                            "The Registrar requested additional information."}
                        </p>

                        {opportunity && (
                          <button
                            type="button"
                            onClick={() => handleSelectOpportunity(opportunity)}
                            className="mt-2 text-xs font-bold text-orange-600 hover:underline"
                          >
                            Update & Resubmit →
                          </button>
                        )}
                      </div>
                    )}

                    {/* REJECTION REASON */}

                    {application.status === STATUS.application.REJECTED && (
                      <div
                        className={`mt-3 p-3 rounded-lg border ${
                          darkMode
                            ? "border-red-800 bg-red-950/30"
                            : "border-red-200 bg-red-50"
                        }`}
                      >
                        <p className="text-[10px] uppercase font-bold text-red-600">
                          Reason for Rejection
                        </p>

                        <p className="text-xs mt-1">
                          {application.notes ||
                            "No rejection reason was provided."}
                        </p>

                        {opportunity && (
                          <button
                            type="button"
                            onClick={() => handleApplyAgain(opportunity)}
                            className="mt-2 text-xs font-bold text-red-600 hover:underline"
                          >
                            Apply Again →
                          </button>
                        )}
                      </div>
                    )}

                    {application.notes &&
                      application.status !==
                        STATUS.application.INFO_REQUESTED &&
                      application.status !== STATUS.application.REJECTED && (
                        <p className="text-xs text-slate-500 mt-2">
                          {application.notes}
                        </p>
                      )}
                  </div>
                );
              })}
            </div>
          )}

          {assignment && (
            <div className="mt-5 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800">
              <strong>Internship Assignment {assignment.id}</strong>

              <p className="mt-1">
                {assignment.startDate} to {assignment.endDate} ·{" "}
                {assignment.status}
              </p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
