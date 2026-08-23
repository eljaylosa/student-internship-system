import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabaseRegistrar } from "../../supabaseClient";

const STATUS = {
  application: {
    SUBMITTED: "submitted",
    UNDER_REVIEW: "under_review",
    INFO_REQUESTED: "info_requested",
    APPROVED: "approved",
    REJECTED: "rejected",
  },

  assignment: {
    PENDING: "pending",
  },
};

export default function ReviewApplications() {
  const { darkMode } = useOutletContext();

  // =========================================================
  // STATE
  // =========================================================

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const [selectedApplication, setSelectedApplication] = useState(null);

  // =========================================================
  // THEME
  // =========================================================

  const card = darkMode
    ? "bg-slate-900 border-slate-700"
    : "bg-white border-slate-200";

  const border = darkMode ? "border-slate-700" : "border-slate-200";

  const heading = darkMode ? "text-slate-100" : "text-slate-900";

  const body = darkMode ? "text-slate-400" : "text-slate-500";

  // =========================================================
  // LOAD APPLICATIONS
  // =========================================================

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    setLoading(true);

    try {
      // -------------------------------------------------------
      // GET CURRENT USER
      // -------------------------------------------------------

      const {
        data: { user },
        error: authError,
      } = await supabaseRegistrar.auth.getUser();

      if (authError) {
        throw authError;
      }

      if (!user) {
        throw new Error("You are not logged in.");
      }

      // -------------------------------------------------------
      // GET SUBMITTED APPLICATIONS
      // -------------------------------------------------------

      const { data, error } = await supabaseRegistrar
        .from("applications")
        .select(
          `
            id,
            student_id,
            opportunity_id,
            cover_letter,
            status,
            reviewer_id,
            notes,
            submitted_at,
            created_at,
            students (
              id,
              student_id,
              phone,
              address,
              program,
              year_level,
              department,
              gwa,
              users (
                id,
                email,
                first_name,
                middle_name,
                last_name
              )
            ),
            opportunities (
              id,
              company_id,
              title,
              description,
              location,
              position_type,
              availability,
              requirements,
              openings,
              status,
              internship_start_date,
              internship_end_date,
              internship_start,
              internship_end,
              companies (
                id,
                company_name,
                company_email,
                company_phone,
                company_address,
                website,
                industry,
                designation,
                status
              )
            )
          `
        )
        .in("status", [
          STATUS.application.SUBMITTED,
          STATUS.application.UNDER_REVIEW,
          STATUS.application.INFO_REQUESTED,
        ])
        .order("submitted_at", {
          ascending: false,
          nullsFirst: false,
        });

      if (error) {
        throw error;
      }

      setApplications(data || []);
    } catch (error) {
      console.error("Error loading applications:", error);

      alert(error.message || "Unable to load applications.");
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // HELPERS
  // =========================================================

  const getStudentName = (student) => {
    if (!student?.users) return "Unknown Student";

    const user = student.users;

    return [user.first_name, user.middle_name, user.last_name]
      .filter(Boolean)
      .join(" ");
  };

  const getCompanyName = (application) => {
    return (
      application?.opportunities?.companies?.company_name ||
      "Unknown Company"
    );
  };

  const getOpportunityStartDate = (opportunity) => {
    return (
      opportunity?.internship_start_date ||
      opportunity?.internship_start ||
      null
    );
  };

  const getOpportunityEndDate = (opportunity) => {
    return (
      opportunity?.internship_end_date ||
      opportunity?.internship_end ||
      null
    );
  };

  const formatDate = (date) => {
    if (!date) return "Not specified";

    const parsedDate = new Date(`${date}T00:00:00`);

    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }

    return parsedDate.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusLabel = (status) => {
    const labels = {
      submitted: "Submitted",
      under_review: "Under Review",
      info_requested: "Information Requested",
      approved: "Approved",
      rejected: "Rejected",
    };

    return labels[status] || status;
  };

  const getStatusClass = (status) => {
    if (status === STATUS.application.APPROVED) {
      return darkMode
        ? "bg-emerald-950/50 text-emerald-300 border-emerald-800"
        : "bg-emerald-50 text-emerald-700 border-emerald-200";
    }

    if (status === STATUS.application.REJECTED) {
      return darkMode
        ? "bg-red-950/50 text-red-300 border-red-800"
        : "bg-red-50 text-red-700 border-red-200";
    }

    if (status === STATUS.application.INFO_REQUESTED) {
      return darkMode
        ? "bg-blue-950/50 text-blue-300 border-blue-800"
        : "bg-blue-50 text-blue-700 border-blue-200";
    }

    return darkMode
      ? "bg-amber-950/50 text-amber-300 border-amber-800"
      : "bg-amber-50 text-amber-700 border-amber-200";
  };

  // =========================================================
  // APPROVE APPLICATION
  // =========================================================

  const handleApprove = async (application) => {
    if (!application) return;

    const confirmed = window.confirm(
      `Approve the internship application of ${getStudentName(
        application.students
      )}?`
    );

    if (!confirmed) return;

    setProcessingId(application.id);

    try {
      // -------------------------------------------------------
      // GET CURRENT REGISTRAR
      // -------------------------------------------------------

      const {
        data: { user },
        error: authError,
      } = await supabaseRegistrar.auth.getUser();

      if (authError) {
        throw authError;
      }

      if (!user) {
        throw new Error("You are not logged in.");
      }

      const opportunity = application.opportunities;

      if (!opportunity) {
        throw new Error(
          "The opportunity connected to this application was not found."
        );
      }

      if (!opportunity.company_id) {
        throw new Error(
          "This opportunity does not have a company assigned."
        );
      }

      // -------------------------------------------------------
      // GET INTERNSHIP DATES
      // -------------------------------------------------------

      const internshipStartDate = getOpportunityStartDate(opportunity);
      const internshipEndDate = getOpportunityEndDate(opportunity);

      if (!internshipStartDate || !internshipEndDate) {
        throw new Error(
          "This opportunity does not have a complete internship start and end date. Please update the opportunity before approving this application."
        );
      }

      if (new Date(`${internshipEndDate}T00:00:00`) < new Date(`${internshipStartDate}T00:00:00`)) {
        throw new Error(
          "The internship end date cannot be earlier than the internship start date."
        );
      }

      // -------------------------------------------------------
      // CHECK FOR EXISTING ASSIGNMENT
      // -------------------------------------------------------

      const { data: existingAssignment, error: assignmentCheckError } =
        await supabaseRegistrar
          .from("assignments")
          .select("id, status")
          .eq("application_id", application.id)
          .maybeSingle();

      if (assignmentCheckError) {
        throw assignmentCheckError;
      }

      if (existingAssignment) {
        throw new Error(
          "An assignment already exists for this application."
        );
      }

      // -------------------------------------------------------
      // UPDATE APPLICATION
      // -------------------------------------------------------

      const { error: applicationUpdateError } = await supabaseRegistrar
        .from("applications")
        .update({
          status: STATUS.application.APPROVED,
          reviewer_id: user.id,
          notes: "Approved by registrar.",
          updated_at: new Date().toISOString(),
        })
        .eq("id", application.id);

      if (applicationUpdateError) {
        throw applicationUpdateError;
      }

      // -------------------------------------------------------
      // CREATE PENDING ASSIGNMENT
      // -------------------------------------------------------

      const { data: assignment, error: assignmentError } =
        await supabaseRegistrar
          .from("assignments")
          .insert({
            application_id: application.id,
            student_id: application.student_id,
            opportunity_id: application.opportunity_id,
            company_id: opportunity.company_id,
            start_date: internshipStartDate,
            end_date: internshipEndDate,
            status: STATUS.assignment.PENDING,
          })
          .select()
          .single();

      if (assignmentError) {
        // -----------------------------------------------------
        // ROLLBACK APPLICATION IF ASSIGNMENT CREATION FAILS
        // -----------------------------------------------------

        await supabaseRegistrar
          .from("applications")
          .update({
            status: application.status,
            reviewer_id: application.reviewer_id,
            notes: application.notes,
            updated_at: new Date().toISOString(),
          })
          .eq("id", application.id);

        throw assignmentError;
      }

      // -------------------------------------------------------
      // REMOVE FROM CURRENT LIST
      // -------------------------------------------------------

      setApplications((previous) =>
        previous.filter((item) => item.id !== application.id)
      );

      setSelectedApplication(null);

      alert(
        `Application approved successfully.\n\nAssignment ${assignment.id} was created with status "pending".\n\nInternship Period:\n${formatDate(
          internshipStartDate
        )} to ${formatDate(
          internshipEndDate
        )}\n\nThe student can now submit internship requirements.`
      );
    } catch (error) {
      console.error("Error approving application:", error);

      alert(error.message || "Unable to approve application.");
    } finally {
      setProcessingId(null);
    }
  };

  // =========================================================
  // REQUEST INFORMATION
  // =========================================================

  const handleRequestInformation = async (application) => {
    if (!application) return;

    const notes = window.prompt(
      "What additional information should the student provide?",
      "Please provide additional application information."
    );

    if (notes === null) return;

    setProcessingId(application.id);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabaseRegistrar.auth.getUser();

      if (authError) {
        throw authError;
      }

      if (!user) {
        throw new Error("You are not logged in.");
      }

      const { data, error } = await supabaseRegistrar
        .from("applications")
        .update({
          status: STATUS.application.INFO_REQUESTED,
          reviewer_id: user.id,
          notes: notes.trim() || "Additional information requested.",
          updated_at: new Date().toISOString(),
        })
        .eq("id", application.id)
        .select(
          `
            id,
            student_id,
            opportunity_id,
            cover_letter,
            status,
            reviewer_id,
            notes,
            submitted_at,
            created_at,
            students (
              id,
              student_id,
              phone,
              address,
              program,
              year_level,
              department,
              gwa,
              users (
                id,
                email,
                first_name,
                middle_name,
                last_name
              )
            ),
            opportunities (
              id,
              company_id,
              title,
              description,
              location,
              position_type,
              availability,
              requirements,
              openings,
              status,
              internship_start_date,
              internship_end_date,
              internship_start,
              internship_end,
              companies (
                id,
                company_name,
                company_email,
                company_phone,
                company_address,
                website,
                industry,
                designation,
                status
              )
            )
          `
        )
        .single();

      if (error) {
        throw error;
      }

      setApplications((previous) =>
        previous.map((item) => (item.id === data.id ? data : item))
      );

      setSelectedApplication(null);

      alert("Additional information has been requested.");
    } catch (error) {
      console.error("Error requesting information:", error);

      alert(error.message || "Unable to request information.");
    } finally {
      setProcessingId(null);
    }
  };

  // =========================================================
  // REJECT APPLICATION
  // =========================================================

  const handleReject = async (application) => {
    if (!application) return;

    const reason = window.prompt(
      "Reason for rejection:",
      "Application rejected by registrar."
    );

    if (reason === null) return;

    setProcessingId(application.id);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabaseRegistrar.auth.getUser();

      if (authError) {
        throw authError;
      }

      if (!user) {
        throw new Error("You are not logged in.");
      }

      const { error } = await supabaseRegistrar
        .from("applications")
        .update({
          status: STATUS.application.REJECTED,
          reviewer_id: user.id,
          notes: reason.trim() || "Application rejected by registrar.",
          updated_at: new Date().toISOString(),
        })
        .eq("id", application.id);

      if (error) {
        throw error;
      }

      setApplications((previous) =>
        previous.filter((item) => item.id !== application.id)
      );

      setSelectedApplication(null);

      alert("Application rejected.");
    } catch (error) {
      console.error("Error rejecting application:", error);

      alert(error.message || "Unable to reject application.");
    } finally {
      setProcessingId(null);
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

          <h3 className="font-bold">Loading applications...</h3>

          <p className={`text-sm mt-1 ${body}`}>
            Please wait while we load submitted internship applications.
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
          HEADER
      ===================================================== */}

      <div className="mb-6">
        <p className="text-xs uppercase tracking-widest font-bold text-slate-400">
          Registrar Portal
        </p>

        <h1 className="text-2xl font-black">Internship Applications</h1>

        <p className={`text-sm mt-1 ${body}`}>
          Review internship applications submitted by students.
        </p>
      </div>

      {/* =====================================================
          SUMMARY
      ===================================================== */}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className={`border rounded-xl p-4 ${card}`}>
          <p
            className={`text-[10px] uppercase tracking-wider font-bold ${body}`}
          >
            Applications to Review
          </p>

          <p className="text-2xl font-black mt-1">{applications.length}</p>
        </div>

        <div className={`border rounded-xl p-4 ${card}`}>
          <p
            className={`text-[10px] uppercase tracking-wider font-bold ${body}`}
          >
            Submitted
          </p>

          <p className="text-2xl font-black mt-1 text-amber-600">
            {
              applications.filter(
                (item) => item.status === STATUS.application.SUBMITTED
              ).length
            }
          </p>
        </div>

        <div className={`border rounded-xl p-4 ${card}`}>
          <p
            className={`text-[10px] uppercase tracking-wider font-bold ${body}`}
          >
            Information Requested
          </p>

          <p className="text-2xl font-black mt-1 text-blue-600">
            {
              applications.filter(
                (item) =>
                  item.status === STATUS.application.INFO_REQUESTED
              ).length
            }
          </p>
        </div>
      </div>

      {/* =====================================================
          APPLICATIONS
      ===================================================== */}

      <section className={`border rounded-2xl overflow-hidden ${card}`}>
        <div className={`p-5 border-b ${border}`}>
          <h2 className="font-bold text-lg">Submitted Applications</h2>

          <p className={`text-xs mt-1 ${body}`}>
            Applications remain under Registrar review until approved,
            rejected, or returned for additional information.
          </p>
        </div>

        {applications.length === 0 ? (
          <div className="p-10 text-center">
            <div className="text-3xl mb-3">📋</div>

            <h3 className="font-bold">No applications to review</h3>

            <p className={`text-sm mt-1 ${body}`}>
              New student submissions will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {applications.map((application) => {
              const student = application.students;
              const opportunity = application.opportunities;
              const company = opportunity?.companies;

              const studentName = getStudentName(student);

              return (
                <div key={application.id} className="p-5">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                    {/* =================================================
                        APPLICATION INFO
                    ================================================= */}

                    <div className="min-w-0">
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 font-bold ${
                            darkMode
                              ? "bg-slate-800 text-slate-200"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {studentName
                            .split(" ")
                            .map((name) => name[0])
                            .slice(0, 2)
                            .join("")
                            .toUpperCase()}
                        </div>

                        <div>
                          <p className="font-bold">{studentName}</p>

                          <p className={`text-xs mt-1 ${body}`}>
                            Student ID: {student?.student_id || "N/A"}
                          </p>

                          <p className={`text-xs ${body}`}>
                            {student?.users?.email || "No email"}
                          </p>
                        </div>
                      </div>

                      {/* =================================================
                          OPPORTUNITY
                      ================================================= */}

                      <div
                        className={`mt-4 p-4 rounded-xl border ${border} ${
                          darkMode ? "bg-slate-800/50" : "bg-slate-50"
                        }`}
                      >
                        <p
                          className={`text-[10px] uppercase tracking-wider font-bold ${body}`}
                        >
                          Internship Opportunity
                        </p>

                        <p className="font-bold mt-1">
                          {opportunity?.title || "Unknown Opportunity"}
                        </p>

                        <p className={`text-xs mt-1 ${body}`}>
                          {company?.company_name || "Unknown Company"}
                        </p>

                        <div className="flex flex-wrap gap-2 mt-3">
                          <span
                            className={`text-[10px] px-2 py-1 rounded-md ${
                              darkMode
                                ? "bg-slate-700 text-slate-300"
                                : "bg-white text-slate-500"
                            }`}
                          >
                            📍 {opportunity?.location || "N/A"}
                          </span>

                          <span
                            className={`text-[10px] px-2 py-1 rounded-md ${
                              darkMode
                                ? "bg-slate-700 text-slate-300"
                                : "bg-white text-slate-500"
                            }`}
                          >
                            💼 {opportunity?.position_type || "N/A"}
                          </span>

                          <span
                            className={`text-[10px] px-2 py-1 rounded-md ${
                              darkMode
                                ? "bg-slate-700 text-slate-300"
                                : "bg-white text-slate-500"
                            }`}
                          >
                            👥 {opportunity?.openings || 0} openings
                          </span>
                        </div>

                        {/* INTERNSHIP PERIOD */}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                          <div
                            className={`rounded-lg border p-3 ${
                              darkMode
                                ? "border-slate-700 bg-slate-900/50"
                                : "border-slate-200 bg-white"
                            }`}
                          >
                            <p
                              className={`text-[9px] uppercase tracking-wider font-bold ${body}`}
                            >
                              Internship Start
                            </p>

                            <p className="text-xs font-semibold mt-1">
                              {formatDate(
                                getOpportunityStartDate(opportunity)
                              )}
                            </p>
                          </div>

                          <div
                            className={`rounded-lg border p-3 ${
                              darkMode
                                ? "border-slate-700 bg-slate-900/50"
                                : "border-slate-200 bg-white"
                            }`}
                          >
                            <p
                              className={`text-[9px] uppercase tracking-wider font-bold ${body}`}
                            >
                              Internship End
                            </p>

                            <p className="text-xs font-semibold mt-1">
                              {formatDate(
                                getOpportunityEndDate(opportunity)
                              )}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* =================================================
                          SUBMITTED
                      ================================================= */}

                      <p className={`text-[10px] mt-3 ${body}`}>
                        Submitted{" "}
                        {application.submitted_at
                          ? new Date(
                              application.submitted_at
                            ).toLocaleString()
                          : "Date unavailable"}
                      </p>
                    </div>

                    {/* =================================================
                        STATUS + ACTIONS
                    ================================================= */}

                    <div className="flex flex-col items-start lg:items-end gap-3 lg:min-w-[270px]">
                      <span
                        className={`inline-flex px-3 py-1.5 rounded-full border text-xs font-bold ${getStatusClass(
                          application.status
                        )}`}
                      >
                        {getStatusLabel(application.status)}
                      </span>

                      <div className="flex flex-wrap gap-2 lg:justify-end">
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedApplication(application)
                          }
                          className={`px-3 py-2 rounded-lg border text-xs font-semibold ${
                            darkMode
                              ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                              : "border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          View Details
                        </button>

                        <button
                          type="button"
                          disabled={processingId === application.id}
                          onClick={() => handleApprove(application)}
                          className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50"
                        >
                          {processingId === application.id
                            ? "Processing..."
                            : "Approve"}
                        </button>

                        <button
                          type="button"
                          disabled={processingId === application.id}
                          onClick={() =>
                            handleRequestInformation(application)
                          }
                          className="px-3 py-2 rounded-lg border border-blue-200 text-blue-600 text-xs font-semibold hover:bg-blue-50 disabled:opacity-50"
                        >
                          Request Info
                        </button>

                        <button
                          type="button"
                          disabled={processingId === application.id}
                          onClick={() => handleReject(application)}
                          className="px-3 py-2 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* =======================================================
          DETAILS MODAL
      ======================================================= */}

      {selectedApplication && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setSelectedApplication(null)}
        >
          <div
            className={`w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl border ${
              darkMode
                ? "bg-slate-900 border-slate-700 text-white"
                : "bg-white border-slate-200 text-slate-900"
            }`}
            onClick={(event) => event.stopPropagation()}
          >
            {/* HEADER */}

            <div className={`px-5 py-5 border-b ${border}`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p
                    className={`text-[10px] uppercase tracking-widest font-bold ${body}`}
                  >
                    Application Details
                  </p>

                  <h2 className="text-xl font-black mt-1">
                    {getStudentName(selectedApplication.students)}
                  </h2>

                  <p className={`text-xs mt-1 ${body}`}>
                    {selectedApplication.students?.student_id || "N/A"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedApplication(null)}
                  className={`w-9 h-9 rounded-lg text-xl ${
                    darkMode
                      ? "hover:bg-slate-800 text-slate-400"
                      : "hover:bg-slate-100 text-slate-500"
                  }`}
                >
                  ×
                </button>
              </div>
            </div>

            {/* CONTENT */}

            <div className="p-5 space-y-6">
              {/* STATUS */}

              <div className="flex items-center justify-between gap-3">
                <span
                  className={`inline-flex px-3 py-1.5 rounded-full border text-xs font-bold ${getStatusClass(
                    selectedApplication.status
                  )}`}
                >
                  {getStatusLabel(selectedApplication.status)}
                </span>

                <span className={`text-xs ${body}`}>
                  {selectedApplication.submitted_at
                    ? new Date(
                        selectedApplication.submitted_at
                      ).toLocaleString()
                    : "Date unavailable"}
                </span>
              </div>

              {/* STUDENT */}

              <section>
                <h3 className="font-bold mb-3">Student Information</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className={`p-3 rounded-xl border ${border}`}>
                    <p className={`text-[9px] uppercase font-bold ${body}`}>
                      Full Name
                    </p>

                    <p className="text-sm font-semibold mt-1">
                      {getStudentName(selectedApplication.students)}
                    </p>
                  </div>

                  <div className={`p-3 rounded-xl border ${border}`}>
                    <p className={`text-[9px] uppercase font-bold ${body}`}>
                      Student ID
                    </p>

                    <p className="text-sm font-semibold mt-1">
                      {selectedApplication.students?.student_id || "N/A"}
                    </p>
                  </div>

                  <div className={`p-3 rounded-xl border ${border}`}>
                    <p className={`text-[9px] uppercase font-bold ${body}`}>
                      Email
                    </p>

                    <p className="text-sm font-semibold mt-1">
                      {selectedApplication.students?.users?.email || "N/A"}
                    </p>
                  </div>

                  <div className={`p-3 rounded-xl border ${border}`}>
                    <p className={`text-[9px] uppercase font-bold ${body}`}>
                      Phone
                    </p>

                    <p className="text-sm font-semibold mt-1">
                      {selectedApplication.students?.phone || "N/A"}
                    </p>
                  </div>

                  <div className={`p-3 rounded-xl border ${border}`}>
                    <p className={`text-[9px] uppercase font-bold ${body}`}>
                      Program
                    </p>

                    <p className="text-sm font-semibold mt-1">
                      {selectedApplication.students?.program || "N/A"}
                    </p>
                  </div>

                  <div className={`p-3 rounded-xl border ${border}`}>
                    <p className={`text-[9px] uppercase font-bold ${body}`}>
                      Year Level
                    </p>

                    <p className="text-sm font-semibold mt-1">
                      {selectedApplication.students?.year_level || "N/A"}
                    </p>
                  </div>

                  <div className={`p-3 rounded-xl border ${border}`}>
                    <p className={`text-[9px] uppercase font-bold ${body}`}>
                      Department
                    </p>

                    <p className="text-sm font-semibold mt-1">
                      {selectedApplication.students?.department || "N/A"}
                    </p>
                  </div>

                  <div className={`p-3 rounded-xl border ${border}`}>
                    <p className={`text-[9px] uppercase font-bold ${body}`}>
                      GWA
                    </p>

                    <p className="text-sm font-semibold mt-1">
                      {selectedApplication.students?.gwa || "N/A"}
                    </p>
                  </div>
                </div>
              </section>

              {/* OPPORTUNITY */}

              <section>
                <h3 className="font-bold mb-3">Internship Information</h3>

                <div className={`p-4 rounded-xl border ${border}`}>
                  <p className={`text-[9px] uppercase font-bold ${body}`}>
                    Position
                  </p>

                  <p className="font-bold mt-1">
                    {selectedApplication.opportunities?.title || "N/A"}
                  </p>

                  <p className={`text-xs mt-1 ${body}`}>
                    {getCompanyName(selectedApplication)}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <div>
                      <p className={`text-[9px] uppercase font-bold ${body}`}>
                        Location
                      </p>

                      <p className="text-sm font-semibold mt-1">
                        {selectedApplication.opportunities?.location || "N/A"}
                      </p>
                    </div>

                    <div>
                      <p className={`text-[9px] uppercase font-bold ${body}`}>
                        Position Type
                      </p>

                      <p className="text-sm font-semibold mt-1">
                        {selectedApplication.opportunities?.position_type ||
                          "N/A"}
                      </p>
                    </div>

                    <div>
                      <p className={`text-[9px] uppercase font-bold ${body}`}>
                        Internship Start
                      </p>

                      <p className="text-sm font-semibold mt-1">
                        {formatDate(
                          getOpportunityStartDate(
                            selectedApplication.opportunities
                          )
                        )}
                      </p>
                    </div>

                    <div>
                      <p className={`text-[9px] uppercase font-bold ${body}`}>
                        Internship End
                      </p>

                      <p className="text-sm font-semibold mt-1">
                        {formatDate(
                          getOpportunityEndDate(
                            selectedApplication.opportunities
                          )
                        )}
                      </p>
                    </div>

                    <div className="sm:col-span-2">
                      <p className={`text-[9px] uppercase font-bold ${body}`}>
                        Availability
                      </p>

                      <p className="text-sm font-semibold mt-1">
                        {selectedApplication.opportunities?.availability ||
                          "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* COVER LETTER */}

              <section>
                <h3 className="font-bold mb-3">Cover Letter</h3>

                <div
                  className={`p-4 rounded-xl border ${border} ${
                    darkMode ? "bg-slate-800/50" : "bg-slate-50"
                  }`}
                >
                  <p className={`text-sm leading-6 ${body}`}>
                    {selectedApplication.cover_letter ||
                      "No cover letter provided."}
                  </p>
                </div>
              </section>

              {/* COMPANY */}

              <section>
                <h3 className="font-bold mb-3">Company Information</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className={`p-3 rounded-xl border ${border}`}>
                    <p className={`text-[9px] uppercase font-bold ${body}`}>
                      Company
                    </p>

                    <p className="text-sm font-semibold mt-1">
                      {getCompanyName(selectedApplication)}
                    </p>
                  </div>

                  <div className={`p-3 rounded-xl border ${border}`}>
                    <p className={`text-[9px] uppercase font-bold ${body}`}>
                      Industry
                    </p>

                    <p className="text-sm font-semibold mt-1">
                      {selectedApplication.opportunities?.companies
                        ?.industry || "N/A"}
                    </p>
                  </div>

                  <div className={`p-3 rounded-xl border ${border}`}>
                    <p className={`text-[9px] uppercase font-bold ${body}`}>
                      Address
                    </p>

                    <p className="text-sm font-semibold mt-1">
                      {selectedApplication.opportunities?.companies
                        ?.company_address || "N/A"}
                    </p>
                  </div>

                  <div className={`p-3 rounded-xl border ${border}`}>
                    <p className={`text-[9px] uppercase font-bold ${body}`}>
                      Company Email
                    </p>

                    <p className="text-sm font-semibold mt-1">
                      {selectedApplication.opportunities?.companies
                        ?.company_email || "N/A"}
                    </p>
                  </div>
                </div>
              </section>

              {/* ACTIONS */}

              <div className={`pt-5 border-t ${border}`}>
                <div className="flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    disabled={
                      processingId === selectedApplication.id
                    }
                    onClick={() =>
                      handleRequestInformation(selectedApplication)
                    }
                    className="px-4 py-2.5 rounded-xl border border-blue-200 text-blue-600 text-xs font-bold hover:bg-blue-50 disabled:opacity-50"
                  >
                    Request Information
                  </button>

                  <button
                    type="button"
                    disabled={
                      processingId === selectedApplication.id
                    }
                    onClick={() => handleReject(selectedApplication)}
                    className="px-4 py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 disabled:opacity-50"
                  >
                    Reject
                  </button>

                  <button
                    type="button"
                    disabled={
                      processingId === selectedApplication.id
                    }
                    onClick={() => handleApprove(selectedApplication)}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {processingId === selectedApplication.id
                      ? "Processing..."
                      : "Approve Application"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

