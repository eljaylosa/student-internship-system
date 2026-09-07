import React, { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabaseCompany } from "../../supabaseClient";

const ManageApplications = () => {
  const { darkMode } = useOutletContext();

  // =========================================================
  // STATE
  // =========================================================

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [processingId, setProcessingId] = useState(null);
  const [viewingDocumentId, setViewingDocumentId] = useState(null);
  const [viewingResumeId, setViewingResumeId] = useState(null);

  // =========================================================
  // STATUS
  // =========================================================

  const STATUS = {
    ASSIGNMENT_PENDING: "pending",
    ASSIGNMENT_ACTIVE: "active",
    ASSIGNMENT_COMPLETED: "completed",
    ASSIGNMENT_TERMINATED: "terminated",

    APPLICATION_APPROVED: "approved",
  };

  const STORAGE_BUCKET = "internship-documents";
  const RESUME_BUCKET = "verification-documents";

  // =========================================================
  // SEND APPLICATION DECISION EMAIL
  // =========================================================

  const sendApplicationDecisionEmail = async ({
    application,
    decision,
    reason = "",
  }) => {
    if (!application?.email || application.email === "No email") {
      console.warn(
        "Application decision email was not sent because the student email is missing."
      );

      return {
        success: false,
        skipped: true,
      };
    }

    try {
      const { data, error } = await supabaseCompany.functions.invoke(
        "send-application-decision-email",
        {
          body: {
            email: application.email,
            name: application.studentName,
            decision,
            decidedBy: "company",
            opportunityName: application.internshipPosition,
            companyName: application.companyName || "Your Internship Company",
            reason: reason || "",
          },
        }
      );

      if (error) {
        throw error;
      }

      if (!data?.success) {
        throw new Error(
          data?.error || "The application decision email could not be sent."
        );
      }

      console.log(
        `Company application decision email sent successfully to ${application.email}`
      );

      return {
        success: true,
        data,
      };
    } catch (emailError) {
      console.error(
        "Failed to send company application decision email:",
        emailError
      );

      return {
        success: false,
        error:
          emailError?.message ||
          "The application decision email could not be sent.",
      };
    }
  };

  // =========================================================
  // LOAD COMPANY APPLICATIONS
  // =========================================================

  const loadApplications = async () => {
    try {
      setLoading(true);
      setError("");

      // -------------------------------------------------------
      // 1. GET CURRENT AUTH USER
      // -------------------------------------------------------

      const {
        data: { user },
        error: userError,
      } = await supabaseCompany.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        throw new Error("You are not logged in.");
      }

      // -------------------------------------------------------
      // 2. GET COMPANY CONNECTED TO AUTH USER
      // -------------------------------------------------------

      const { data: company, error: companyError } = await supabaseCompany
        .from("companies")
        .select(
          `
            id,
            company_name,
            company_email,
            status
          `
        )
        .eq("user_id", user.id)
        .maybeSingle();

      if (companyError) {
        throw companyError;
      }

      if (!company) {
        throw new Error("No company profile is connected to your account.");
      }

      if (company.status !== "active") {
        throw new Error("Your company account is not active yet.");
      }

      // -------------------------------------------------------
      // 3. GET ASSIGNMENTS FOR THIS COMPANY
      // -------------------------------------------------------

      const { data: assignments, error: assignmentsError } =
        await supabaseCompany
          .from("assignments")
          .select(
            `
              id,
              application_id,
              student_id,
              opportunity_id,
              company_id,
              status,
              start_date,
              end_date,
              deployed_at,
              created_at,
              updated_at
            `
          )
          .eq("company_id", company.id)
          .in("status", [
            STATUS.ASSIGNMENT_PENDING,
            STATUS.ASSIGNMENT_ACTIVE,
            STATUS.ASSIGNMENT_COMPLETED,
            STATUS.ASSIGNMENT_TERMINATED,
          ])
          .order("created_at", { ascending: false });

      if (assignmentsError) {
        throw assignmentsError;
      }

      if (!assignments || assignments.length === 0) {
        setApplications([]);
        return;
      }

      // -------------------------------------------------------
      // ONLY SHOW ASSIGNMENTS THAT HAVE ACTUALLY BEEN DEPLOYED
      // -------------------------------------------------------

      const deployedAssignments = assignments.filter(
        (assignment) =>
          assignment.status !== STATUS.ASSIGNMENT_PENDING ||
          !!assignment.deployed_at
      );

      // -------------------------------------------------------
      // ONLY KEEP THE LATEST ASSIGNMENT FOR EACH
      // STUDENT + OPPORTUNITY
      // -------------------------------------------------------

      const latestAssignmentMap = new Map();

      deployedAssignments.forEach((assignment) => {
        const key = `${assignment.student_id}-${assignment.opportunity_id}`;

        if (!latestAssignmentMap.has(key)) {
          latestAssignmentMap.set(key, assignment);
        }
      });

      const latestDeployedAssignments = Array.from(
        latestAssignmentMap.values()
      );

      if (latestDeployedAssignments.length === 0) {
        setApplications([]);
        return;
      }

      // -------------------------------------------------------
      // 4. GET STUDENT IDs
      // -------------------------------------------------------

      const studentIds = [
        ...new Set(
          latestDeployedAssignments
            .map((assignment) => assignment.student_id)
            .filter(Boolean)
        ),
      ];

      // -------------------------------------------------------
      // 5. GET STUDENT RECORDS
      // -------------------------------------------------------

      let students = [];

      if (studentIds.length > 0) {
        const { data, error: studentsError } = await supabaseCompany
          .from("students")
          .select(
            `
              id,
              student_id,
              phone,
              address,
              program,
              year_level,
              department,
              gwa,
              school_id,
              resume_url,
              resume_name
            `
          )
          .in("id", studentIds);

        if (studentsError) {
          throw studentsError;
        }

        students = data || [];
      }

      // -------------------------------------------------------
      // 6. GET SCHOOLS
      // -------------------------------------------------------

      const uniqueSchoolIds = [
        ...new Set(
          students.map((student) => student.school_id).filter(Boolean)
        ),
      ];

      let schools = [];

      if (uniqueSchoolIds.length > 0) {
        const { data, error: schoolsError } = await supabaseCompany
          .from("schools")
          .select(
            `
              id,
              name,
              code,
              status
            `
          )
          .in("id", uniqueSchoolIds);

        if (schoolsError) {
          throw schoolsError;
        }

        schools = data || [];
      }

      // -------------------------------------------------------
      // 7. GET USER INFORMATION
      // -------------------------------------------------------

      let users = [];

      if (studentIds.length > 0) {
        const { data, error: usersError } = await supabaseCompany
          .from("users")
          .select(
            `
              id,
              email,
              first_name,
              middle_name,
              last_name
            `
          )
          .in("id", studentIds);

        if (usersError) {
          throw usersError;
        }

        users = data || [];
      }

      // -------------------------------------------------------
      // 8. GET APPLICATIONS
      // -------------------------------------------------------

      const applicationIds = [
        ...new Set(
          latestDeployedAssignments
            .map((assignment) => assignment.application_id)
            .filter(Boolean)
        ),
      ];

      let applicationRows = [];

      if (applicationIds.length > 0) {
        const { data, error: applicationsError } = await supabaseCompany
          .from("applications")
          .select(
            `
              id,
              student_id,
              opportunity_id,
              cover_letter,
              status,
              notes,
              submitted_at,
              created_at,
              updated_at
            `
          )
          .in("id", applicationIds);

        if (applicationsError) {
          throw applicationsError;
        }

        applicationRows = data || [];
      }

      // -------------------------------------------------------
      // 9. GET OPPORTUNITIES
      // -------------------------------------------------------

      const opportunityIds = [
        ...new Set(
          latestDeployedAssignments
            .map((assignment) => assignment.opportunity_id)
            .filter(Boolean)
        ),
      ];

      let opportunities = [];

      if (opportunityIds.length > 0) {
        const { data, error: opportunitiesError } = await supabaseCompany
          .from("opportunities")
          .select("*")
          .in("id", opportunityIds);

        if (opportunitiesError) {
          throw opportunitiesError;
        }

        opportunities = data || [];
      }

      // -------------------------------------------------------
      // 10. GET DOCUMENT TYPES
      // -------------------------------------------------------

      const { data: documentTypes, error: documentTypesError } =
        await supabaseCompany.from("document_types").select(
          `
            id,
            name,
            description,
            required
          `
        );

      if (documentTypesError) {
        throw documentTypesError;
      }

      // -------------------------------------------------------
      // 11. GET DOCUMENTS
      // -------------------------------------------------------

      const assignmentIds = latestDeployedAssignments.map(
        (assignment) => assignment.id
      );

      const { data: documents, error: documentsError } = await supabaseCompany
        .from("documents")
        .select(
          `
            id,
            assignment_id,
            student_id,
            document_type_id,
            file_name,
            storage_path,
            version,
            status,
            notes,
            reviewed_at,
            created_at,
            updated_at
          `
        )
        .in("assignment_id", assignmentIds)
        .order("created_at", { ascending: false });

      if (documentsError) {
        throw documentsError;
      }

      // -------------------------------------------------------
      // 12. MAP DATA
      // -------------------------------------------------------

      const studentMap = new Map(
        students.map((student) => [student.id, student])
      );

      const schoolMap = new Map(
        schools.map((school) => [school.id, school])
      );

      const userMap = new Map(
        users.map((userRecord) => [userRecord.id, userRecord])
      );

      const applicationMap = new Map(
        applicationRows.map((application) => [application.id, application])
      );

      const opportunityMap = new Map(
        opportunities.map((opportunity) => [opportunity.id, opportunity])
      );

      const documentTypeMap = new Map(
        (documentTypes || []).map((documentType) => [
          documentType.id,
          documentType,
        ])
      );

      // -------------------------------------------------------
      // 13. BUILD COMPANY APPLICATION LIST
      // -------------------------------------------------------

      const formattedApplications = latestDeployedAssignments
        .map((assignment) => {
          const student = studentMap.get(assignment.student_id);
          const userRecord = userMap.get(assignment.student_id);
          const application = applicationMap.get(assignment.application_id);
          const opportunity = opportunityMap.get(assignment.opportunity_id);

          if (!student || !userRecord || !application || !opportunity) {
            return null;
          }

          const school = student.school_id
            ? schoolMap.get(student.school_id)
            : null;

          // -----------------------------------------------------
          // DOCUMENTS FOR THIS ASSIGNMENT
          // -----------------------------------------------------

          const assignmentDocuments = (documents || [])
            .filter((document) => document.assignment_id === assignment.id)
            .map((document) => {
              const documentType = documentTypeMap.get(
                document.document_type_id
              );

              return {
                id: document.id,
                documentTypeId: document.document_type_id,
                name: documentType?.name || "Document",
                file: document.file_name || "Unnamed file",
                status: document.status,
                storagePath: document.storage_path,
                version: document.version,
                notes: document.notes,
              };
            });

          // -----------------------------------------------------
          // REQUIRED DOCUMENT CHECK
          // -----------------------------------------------------

          const requiredDocumentTypes = (documentTypes || []).filter(
            (documentType) => documentType.required
          );

          const requiredCount = requiredDocumentTypes.length;

          const approvedRequiredCount = requiredDocumentTypes.filter(
            (requiredType) =>
              (documents || []).some(
                (document) =>
                  document.assignment_id === assignment.id &&
                  document.document_type_id === requiredType.id &&
                  document.status === "approved"
              )
          ).length;

          const allRequiredDocumentsApproved =
            requiredCount === 0 || approvedRequiredCount >= requiredCount;

          // -----------------------------------------------------
          // STUDENT NAME
          // -----------------------------------------------------

          const fullName = [
            userRecord.first_name,
            userRecord.middle_name,
            userRecord.last_name,
          ]
            .filter(Boolean)
            .join(" ")
            .trim();

          // -----------------------------------------------------
          // OPPORTUNITY FIELDS
          // -----------------------------------------------------

          const internshipPosition =
            opportunity.title ||
            opportunity.position ||
            opportunity.name ||
            "Internship Position";

          const department =
            opportunity.department || student.department || "Not specified";

          // -----------------------------------------------------
          // FORMAT DATES
          // -----------------------------------------------------

          const formatDate = (dateValue) => {
            if (!dateValue) return "Not specified";

            const date = new Date(dateValue);

            if (Number.isNaN(date.getTime())) {
              return dateValue;
            }

            return date.toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            });
          };

          const deploymentDate = assignment.deployed_at
            ? formatDate(assignment.deployed_at)
            : "Awaiting company decision";

          const internshipDuration =
            assignment.start_date || assignment.end_date
              ? `${formatDate(assignment.start_date)} - ${formatDate(
                  assignment.end_date
                )}`
              : "Not specified";

          // -----------------------------------------------------
          // STATUS
          // -----------------------------------------------------

          let displayStatus = "Pending";

          if (assignment.status === STATUS.ASSIGNMENT_ACTIVE) {
            displayStatus = "Accepted";
          } else if (assignment.status === STATUS.ASSIGNMENT_COMPLETED) {
            displayStatus = "Completed";
          } else if (assignment.status === STATUS.ASSIGNMENT_TERMINATED) {
            displayStatus = "Rejected";
          }

          return {
            id: assignment.id,
            assignmentId: assignment.id,
            applicationId: assignment.application_id,

            studentId: student.student_id || student.id,
            studentUserId: assignment.student_id,

            studentName: fullName || "Unknown Student",

            email: userRecord.email || "No email",
            phone: student.phone || "No phone",

            course: student.program || "Not specified",
            yearLevel: student.year_level || "Not specified",

            school: school?.name || "Not specified",

            // ---------------------------------------------------
            // COMPANY
            // ---------------------------------------------------

            companyName: company.company_name || "Unknown Company",

            // ---------------------------------------------------
            // RESUME / CV
            // ---------------------------------------------------

            resumeUrl: student.resume_url || "",
            resumeName: student.resume_name || "",

            internshipPosition,
            department,

            deploymentDate,
            internshipDuration,

            status: displayStatus,

            rawAssignmentStatus: assignment.status,
            deployedAt: assignment.deployed_at,

            applicationStatus: application.status,
            applicationNotes: application.notes || "",
            coverLetter: application.cover_letter || "",

            allRequiredDocumentsApproved,
            requiredDocumentCount: requiredCount,
            approvedRequiredDocumentCount: approvedRequiredCount,

            documents: assignmentDocuments,

            opportunity,
          };
        })
        .filter(Boolean)
        .filter((application) => application.allRequiredDocumentsApproved);

      setApplications(formattedApplications);
    } catch (err) {
      console.error("Error loading company applications:", err);

      setError(err?.message || "Failed to load company applications.");

      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    loadApplications();
  }, []);

  // =========================================================
  // COUNTS
  // =========================================================

  const pendingCount = applications.filter(
    (application) => application.status === "Pending"
  ).length;

  const acceptedCount = applications.filter(
    (application) => application.status === "Accepted"
  ).length;

  const completedCount = applications.filter(
    (application) => application.status === "Completed"
  ).length;

  const rejectedCount = applications.filter(
    (application) => application.status === "Rejected"
  ).length;

  // =========================================================
  // FILTER
  // =========================================================

  const filteredApplications = useMemo(() => {
    if (activeFilter === "All") {
      return applications;
    }

    return applications.filter(
      (application) => application.status === activeFilter
    );
  }, [applications, activeFilter]);

  // =========================================================
  // VIEW DOCUMENT
  // =========================================================

  const handleViewDocument = async (document) => {
    if (!document?.storagePath) {
      alert("Document file path is missing.");
      return;
    }

    try {
      setViewingDocumentId(document.id);

      const { data, error } = await supabaseCompany.storage
        .from(STORAGE_BUCKET)
        .createSignedUrl(document.storagePath, 60 * 10);

      if (error) {
        console.error("Create signed URL error:", error);
        alert(`Unable to view document: ${error.message}`);
        return;
      }

      if (!data?.signedUrl) {
        alert("Unable to generate the document viewing link.");
        return;
      }

      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error("Document viewing error:", error);
      alert("An unexpected error occurred while opening the document.");
    } finally {
      setViewingDocumentId(null);
    }
  };

  // =========================================================
  // VIEW RESUME / CV
  // =========================================================

  const handleViewResume = async (application) => {
    if (!application?.resumeUrl) {
      alert("This student has not uploaded a Resume/CV yet.");
      return;
    }

    try {
      setViewingResumeId(application.id);

      const { data, error } = await supabaseCompany.storage
        .from(RESUME_BUCKET)
        .createSignedUrl(application.resumeUrl, 60 * 10);

      if (error) {
        console.error("Create resume signed URL error:", error);
        alert(`Unable to view Resume/CV: ${error.message}`);
        return;
      }

      if (!data?.signedUrl) {
        alert("Unable to generate the Resume/CV viewing link.");
        return;
      }

      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error("Resume viewing error:", error);
      alert("An unexpected error occurred while opening the Resume/CV.");
    } finally {
      setViewingResumeId(null);
    }
  };

  // =========================================================
  // ACCEPT APPLICATION
  // =========================================================

  const handleAccept = async (applicationId) => {
    if (!applicationId) return;

    const application = applications.find((item) => item.id === applicationId);

    if (!application) return;

    const confirmed = window.confirm(
      `Accept ${application.studentName}'s internship placement?`
    );

    if (!confirmed) return;

    try {
      setProcessingId(applicationId);
      setError("");

      // -------------------------------------------------------
      // 1. ACCEPT INTERNSHIP PLACEMENT
      // -------------------------------------------------------

      const { data, error } = await supabaseCompany.rpc(
        "accept_internship_assignment",
        {
          p_assignment_id: application.assignmentId,
        }
      );

      if (error) {
        throw error;
      }

      const result = data?.[0];

      if (!result) {
        throw new Error("The internship placement could not be accepted.");
      }

      console.log("Internship placement accepted:", result);

      // -------------------------------------------------------
      // 2. SEND EMAIL TO STUDENT
      // -------------------------------------------------------

      const emailResult = await sendApplicationDecisionEmail({
        application,
        decision: "accepted",
      });

      // -------------------------------------------------------
      // 3. RELOAD APPLICATIONS
      // -------------------------------------------------------

      await loadApplications();

      setSelectedApplication(null);

      // -------------------------------------------------------
      // 4. SUCCESS MESSAGE
      // -------------------------------------------------------

      if (emailResult.success) {
        alert(
          `Internship placement accepted successfully.\n\nAn acceptance email has been sent to ${application.email}.`
        );
      } else {
        alert(
          `Internship placement accepted successfully.\n\nHowever, the email notification could not be sent to the student.`
        );
      }
    } catch (err) {
      console.error("Error accepting internship placement:", err);

      setError(err?.message || "Failed to accept the internship placement.");
    } finally {
      setProcessingId(null);
    }
  };

  // =========================================================
  // OPEN REJECT MODAL
  // =========================================================

  const openRejectModal = (application) => {
    setSelectedApplication(application);
    setRejectReason("");
    setShowRejectModal(true);
  };

  // =========================================================
  // REJECT APPLICATION
  // =========================================================

  const handleReject = async () => {
    if (!selectedApplication) return;

    try {
      setProcessingId(selectedApplication.id);
      setError("");

      const reason =
        rejectReason.trim() || "The company rejected the internship placement.";

      const now = new Date().toISOString();

      // -------------------------------------------------------
      // 1. TERMINATE ASSIGNMENT
      // -------------------------------------------------------

      const { data: updatedAssignment, error: assignmentError } =
        await supabaseCompany
          .from("assignments")
          .update({
            status: STATUS.ASSIGNMENT_TERMINATED,
            updated_at: now,
          })
          .eq("id", selectedApplication.assignmentId)
          .eq("status", STATUS.ASSIGNMENT_PENDING)
          .select(
            `
              id,
              application_id,
              student_id,
              opportunity_id,
              company_id,
              status,
              deployed_at,
              updated_at
            `
          )
          .maybeSingle();

      if (assignmentError) {
        throw new Error(
          `Failed to terminate internship assignment: ${assignmentError.message}`
        );
      }

      if (!updatedAssignment) {
        throw new Error(
          "The internship placement could not be rejected. The assignment was not found, is no longer pending, or your company account does not have permission to update it."
        );
      }

      // -------------------------------------------------------
      // 2. MARK APPLICATION AS REJECTED
      // -------------------------------------------------------

      const existingNotes = selectedApplication.applicationNotes?.trim();

      const newNotes = existingNotes
        ? `${existingNotes}\nCompany rejected the internship placement. Reason: ${reason}`
        : `Company rejected the internship placement. Reason: ${reason}`;

      const { data: updatedApplication, error: applicationError } =
        await supabaseCompany
          .from("applications")
          .update({
            status: "rejected",
            notes: newNotes,
            updated_at: now,
          })
          .eq("id", selectedApplication.applicationId)
          .eq("status", "approved")
          .select(
            `
              id,
              student_id,
              opportunity_id,
              status,
              notes,
              updated_at
            `
          )
          .maybeSingle();

      if (applicationError) {
        throw new Error(
          `Failed to mark application as rejected: ${applicationError.message}`
        );
      }

      if (!updatedApplication) {
        throw new Error(
          "The internship assignment was terminated, but the application could not be changed from approved to rejected. Please check the applications UPDATE RLS policy for company accounts."
        );
      }

      // -------------------------------------------------------
      // 3. SEND REJECTION EMAIL
      // -------------------------------------------------------

      const emailResult = await sendApplicationDecisionEmail({
        application: selectedApplication,
        decision: "rejected",
        reason,
      });

      // -------------------------------------------------------
      // 4. CLOSE MODAL
      // -------------------------------------------------------

      setShowRejectModal(false);
      setSelectedApplication(null);
      setRejectReason("");

      // -------------------------------------------------------
      // 5. RELOAD
      // -------------------------------------------------------

      await loadApplications();

      // -------------------------------------------------------
      // 6. SUCCESS MESSAGE
      // -------------------------------------------------------

      if (emailResult.success) {
        alert(
          `Internship placement rejected successfully.\n\nA rejection email has been sent to ${selectedApplication.email}.`
        );
      } else {
        alert(
          `Internship placement rejected successfully.\n\nHowever, the email notification could not be sent to the student.`
        );
      }
    } catch (err) {
      console.error("Error rejecting internship placement:", err);

      setError(err?.message || "Failed to reject the internship placement.");
    } finally {
      setProcessingId(null);
    }
  };

  // =========================================================
  // STATUS STYLE
  // =========================================================

  const getStatusClass = (status) => {
    if (status === "Accepted") {
      return darkMode
        ? "bg-emerald-950/50 text-emerald-300 border-emerald-800"
        : "bg-emerald-50 text-emerald-700 border-emerald-200";
    }

    if (status === "Completed") {
      return darkMode
        ? "bg-blue-950/50 text-blue-300 border-blue-800"
        : "bg-blue-50 text-blue-700 border-blue-200";
    }

    if (status === "Rejected") {
      return darkMode
        ? "bg-red-950/50 text-red-300 border-red-800"
        : "bg-red-50 text-red-700 border-red-200";
    }

    return darkMode
      ? "bg-amber-950/50 text-amber-300 border-amber-800"
      : "bg-amber-50 text-amber-700 border-amber-200";
  };

  // =========================================================
  // THEME CLASSES
  // =========================================================

  const headingClass = darkMode ? "text-slate-100" : "text-slate-900";
  const bodyTextClass = darkMode ? "text-slate-400" : "text-slate-500";

  const cardClass = darkMode
    ? "bg-slate-900 border-slate-700"
    : "bg-white border-slate-200";

  const tableHeaderClass = darkMode
    ? "bg-slate-800 text-slate-400"
    : "bg-slate-50 text-slate-500";

  const borderClass = darkMode ? "border-slate-700" : "border-slate-200";

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="w-full min-h-full p-3 sm:p-5 md:p-6 lg:p-8">
        <div className="max-w-[1400px] mx-auto">
          <div className={`border rounded-xl p-10 ${cardClass}`}>
            <div className="flex flex-col items-center justify-center text-center">
              <div className="text-3xl mb-3 animate-pulse">📋</div>

              <p className={`text-sm font-semibold ${headingClass}`}>
                Loading applications...
              </p>

              <p className={`text-xs mt-1 ${bodyTextClass}`}>
                Checking students endorsed to your company.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // RETURN
  // =========================================================

  return (
    <div className="w-full min-h-full p-3 sm:p-5 md:p-6 lg:p-8">
      <div className="max-w-[1400px] mx-auto">
        {/* PAGE HEADER */}

        <div className="mb-6">
          <p
            className={`text-[10px] sm:text-xs uppercase tracking-widest font-bold mb-1 ${
              darkMode ? "text-slate-500" : "text-slate-400"
            }`}
          >
            Company Portal
          </p>

          <h1 className={`text-xl sm:text-2xl font-black ${headingClass}`}>
            Manage Applications
          </h1>

          <p className={`text-xs sm:text-sm mt-1 ${bodyTextClass}`}>
            Review students endorsed to your company by the Registrar and
            decide whether to accept or reject their internship placement.
          </p>
        </div>

        {/* ERROR */}

        {error && (
          <div
            className={`mb-5 rounded-xl border px-4 py-3 ${
              darkMode
                ? "bg-red-950/40 border-red-900 text-red-300"
                : "bg-red-50 border-red-200 text-red-700"
            }`}
          >
            <div className="flex items-start gap-3">
              <span>⚠️</span>

              <div className="flex-1">
                <p className="text-xs font-bold">
                  Unable to load or update applications
                </p>

                <p className="text-xs mt-1 opacity-90">{error}</p>
              </div>

              <button
                type="button"
                onClick={loadApplications}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold ${
                  darkMode
                    ? "bg-red-900/50 hover:bg-red-900"
                    : "bg-red-100 hover:bg-red-200"
                }`}
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* SUMMARY CARDS */}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <div className={`border rounded-xl p-4 ${cardClass}`}>
            <div className="flex items-center justify-between">
              <div>
                <p
                  className={`text-[10px] uppercase tracking-wider font-bold ${bodyTextClass}`}
                >
                  Total
                </p>

                <p className={`text-2xl font-black mt-1 ${headingClass}`}>
                  {applications.length}
                </p>
              </div>

              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  darkMode ? "bg-slate-800" : "bg-slate-100"
                }`}
              >
                📋
              </div>
            </div>
          </div>

          <div className={`border rounded-xl p-4 ${cardClass}`}>
            <div className="flex items-center justify-between">
              <div>
                <p
                  className={`text-[10px] uppercase tracking-wider font-bold ${bodyTextClass}`}
                >
                  Pending
                </p>

                <p
                  className={`text-2xl font-black mt-1 ${
                    darkMode ? "text-amber-300" : "text-amber-600"
                  }`}
                >
                  {pendingCount}
                </p>
              </div>

              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                ⏳
              </div>
            </div>
          </div>

          <div className={`border rounded-xl p-4 ${cardClass}`}>
            <div className="flex items-center justify-between">
              <div>
                <p
                  className={`text-[10px] uppercase tracking-wider font-bold ${bodyTextClass}`}
                >
                  Accepted
                </p>

                <p
                  className={`text-2xl font-black mt-1 ${
                    darkMode ? "text-emerald-300" : "text-emerald-600"
                  }`}
                >
                  {acceptedCount}
                </p>
              </div>

              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                ✓
              </div>
            </div>
          </div>

          <div className={`border rounded-xl p-4 ${cardClass}`}>
            <div className="flex items-center justify-between">
              <div>
                <p
                  className={`text-[10px] uppercase tracking-wider font-bold ${bodyTextClass}`}
                >
                  Completed
                </p>

                <p
                  className={`text-2xl font-black mt-1 ${
                    darkMode ? "text-blue-300" : "text-blue-600"
                  }`}
                >
                  {completedCount}
                </p>
              </div>

              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  darkMode
                    ? "bg-blue-950/50 text-blue-300"
                    : "bg-blue-50 text-blue-600"
                }`}
              >
                ✓
              </div>
            </div>
          </div>
        </div>

        {/* APPLICATIONS PANEL */}

        <section
          className={`border rounded-xl shadow-sm overflow-hidden ${cardClass}`}
        >
          <div className={`px-4 sm:px-5 py-4 border-b ${borderClass}`}>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h2
                  className={`text-sm sm:text-base font-bold ${headingClass}`}
                >
                  Deployed Students
                </h2>

                <p className={`text-[10px] sm:text-xs mt-1 ${bodyTextClass}`}>
                  Students whose required documents have been approved by the
                  Registrar.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {["All", "Pending", "Accepted", "Completed", "Rejected"].map(
                  (filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setActiveFilter(filter)}
                      className={`px-3 py-2 rounded-lg text-[10px] sm:text-xs font-bold transition ${
                        activeFilter === filter
                          ? darkMode
                            ? "bg-white text-slate-900"
                            : "bg-slate-900 text-white"
                          : darkMode
                          ? "bg-slate-800 text-slate-400 hover:text-white"
                          : "bg-slate-100 text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      {filter}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>

          {/* DESKTOP TABLE */}

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full min-w-[1400px]">
              <thead>
                <tr className={tableHeaderClass}>
                  <th className="px-5 py-3 text-left text-[10px] uppercase tracking-wider font-bold">
                    Student
                  </th>

                  <th className="px-5 py-3 text-left text-[10px] uppercase tracking-wider font-bold">
                    School
                  </th>

                  <th className="px-5 py-3 text-left text-[10px] uppercase tracking-wider font-bold">
                    Year Level
                  </th>

                  <th className="px-5 py-3 text-left text-[10px] uppercase tracking-wider font-bold">
                    Internship
                  </th>

                  <th className="px-5 py-3 text-left text-[10px] uppercase tracking-wider font-bold">
                    Deployment
                  </th>

                  <th className="px-5 py-3 text-left text-[10px] uppercase tracking-wider font-bold">
                    Status
                  </th>

                  <th className="px-5 py-3 text-right text-[10px] uppercase tracking-wider font-bold">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredApplications.map((application) => (
                  <tr
                    key={application.id}
                    className={`border-t ${borderClass} ${
                      darkMode ? "hover:bg-slate-800/60" : "hover:bg-slate-50"
                    }`}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ${
                            darkMode
                              ? "bg-slate-700 text-white"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {application.studentName
                            .split(" ")
                            .map((name) => name[0])
                            .slice(0, 2)
                            .join("")}
                        </div>

                        <div>
                          <p className={`text-sm font-bold ${headingClass}`}>
                            {application.studentName}
                          </p>

                          <p className={`text-[10px] mt-0.5 ${bodyTextClass}`}>
                            {application.studentId}
                          </p>

                          <p className={`text-[10px] ${bodyTextClass}`}>
                            {application.course}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <p className={`text-xs font-semibold ${headingClass}`}>
                        {application.school}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <p className={`text-xs font-semibold ${headingClass}`}>
                        {application.yearLevel}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <p className={`text-xs font-semibold ${headingClass}`}>
                        {application.internshipPosition}
                      </p>

                      <p className={`text-[10px] mt-1 ${bodyTextClass}`}>
                        {application.department}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <p className={`text-xs font-semibold ${headingClass}`}>
                        {application.deploymentDate}
                      </p>

                      <p className={`text-[10px] mt-1 ${bodyTextClass}`}>
                        {application.internshipDuration}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full border text-[10px] font-bold ${getStatusClass(
                          application.status
                        )}`}
                      >
                        {application.status}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2 flex-wrap">
                        <button
                          type="button"
                          disabled={!application.resumeUrl}
                          onClick={() => handleViewResume(application)}
                          className={`px-3 py-2 rounded-lg border text-[10px] font-bold transition ${
                            application.resumeUrl
                              ? darkMode
                                ? "border-blue-800 text-blue-300 hover:bg-blue-950/40"
                                : "border-blue-200 text-blue-700 hover:bg-blue-50"
                              : darkMode
                              ? "border-slate-800 text-slate-600 cursor-not-allowed"
                              : "border-slate-200 text-slate-400 cursor-not-allowed"
                          } disabled:opacity-70`}
                        >
                          {viewingResumeId === application.id
                            ? "Opening..."
                            : "View Resume/CV"}
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedApplication(application)}
                          className={`px-3 py-2 rounded-lg border text-[10px] font-bold transition ${
                            darkMode
                              ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                              : "border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          View
                        </button>

                        {application.status === "Pending" && (
                          <>
                            <button
                              type="button"
                              disabled={processingId === application.id}
                              onClick={() => handleAccept(application.id)}
                              className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-[10px] font-bold hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {processingId === application.id
                                ? "..."
                                : "Accept"}
                            </button>

                            <button
                              type="button"
                              disabled={processingId === application.id}
                              onClick={() => openRejectModal(application)}
                              className="px-3 py-2 rounded-lg bg-red-600 text-white text-[10px] font-bold hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredApplications.length === 0 && (
              <div className="py-16 text-center">
                <div className="text-3xl mb-3">📋</div>

                <p className={`text-sm font-semibold ${headingClass}`}>
                  No applications found
                </p>

                <p className={`text-xs mt-1 ${bodyTextClass}`}>
                  There are no students under this status.
                </p>
              </div>
            )}
          </div>

          {/* MOBILE CARDS */}

          <div className="md:hidden">
            {filteredApplications.map((application) => (
              <div
                key={application.id}
                className={`p-4 border-b ${borderClass}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${
                        darkMode
                          ? "bg-slate-700 text-white"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {application.studentName
                        .split(" ")
                        .map((name) => name[0])
                        .slice(0, 2)
                        .join("")}
                    </div>

                    <div className="min-w-0">
                      <p
                        className={`text-sm font-bold truncate ${headingClass}`}
                      >
                        {application.studentName}
                      </p>

                      <p className={`text-[10px] ${bodyTextClass}`}>
                        {application.studentId}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`flex-shrink-0 inline-flex px-2 py-1 rounded-full border text-[9px] font-bold ${getStatusClass(
                      application.status
                    )}`}
                  >
                    {application.status}
                  </span>
                </div>

                <div className="mt-4 space-y-2">
                  <div>
                    <p
                      className={`text-[9px] uppercase tracking-wider font-bold ${bodyTextClass}`}
                    >
                      School
                    </p>

                    <p
                      className={`text-xs font-semibold mt-0.5 ${headingClass}`}
                    >
                      {application.school}
                    </p>
                  </div>

                  <div>
                    <p
                      className={`text-[9px] uppercase tracking-wider font-bold ${bodyTextClass}`}
                    >
                      Course
                    </p>

                    <p
                      className={`text-xs font-semibold mt-0.5 ${headingClass}`}
                    >
                      {application.course}
                    </p>
                  </div>

                  <div>
                    <p
                      className={`text-[9px] uppercase tracking-wider font-bold ${bodyTextClass}`}
                    >
                      Year Level
                    </p>

                    <p
                      className={`text-xs font-semibold mt-0.5 ${headingClass}`}
                    >
                      {application.yearLevel}
                    </p>
                  </div>

                  <div>
                    <p
                      className={`text-[9px] uppercase tracking-wider font-bold ${bodyTextClass}`}
                    >
                      Internship
                    </p>

                    <p
                      className={`text-xs font-semibold mt-0.5 ${headingClass}`}
                    >
                      {application.internshipPosition}
                    </p>

                    <p className={`text-[10px] ${bodyTextClass}`}>
                      {application.department}
                    </p>
                  </div>

                  <div>
                    <p
                      className={`text-[9px] uppercase tracking-wider font-bold ${bodyTextClass}`}
                    >
                      Internship Duration
                    </p>

                    <p
                      className={`text-xs font-semibold mt-0.5 ${headingClass}`}
                    >
                      {application.internshipDuration}
                    </p>
                  </div>

                  <div>
                    <p
                      className={`text-[9px] uppercase tracking-wider font-bold ${bodyTextClass}`}
                    >
                      Resume / CV
                    </p>

                    <p
                      className={`text-xs font-semibold mt-0.5 truncate ${
                        application.resumeUrl
                          ? headingClass
                          : darkMode
                          ? "text-slate-600"
                          : "text-slate-400"
                      }`}
                    >
                      {application.resumeUrl
                        ? application.resumeName || "Resume/CV uploaded"
                        : "Not uploaded"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                  <button
                    type="button"
                    disabled={!application.resumeUrl}
                    onClick={() => handleViewResume(application)}
                    className={`px-3 py-2 rounded-lg border text-[10px] font-bold ${
                      application.resumeUrl
                        ? darkMode
                          ? "border-blue-800 text-blue-300 hover:bg-blue-950/40"
                          : "border-blue-200 text-blue-700 hover:bg-blue-50"
                        : darkMode
                        ? "border-slate-800 text-slate-600 cursor-not-allowed"
                        : "border-slate-200 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    {viewingResumeId === application.id
                      ? "Opening..."
                      : "View Resume/CV"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedApplication(application)}
                    className={`px-3 py-2 rounded-lg border text-[10px] font-bold ${
                      darkMode
                        ? "border-slate-700 text-slate-300"
                        : "border-slate-200 text-slate-600"
                    }`}
                  >
                    View Details
                  </button>

                  {application.status === "Pending" && (
                    <>
                      <button
                        type="button"
                        disabled={processingId === application.id}
                        onClick={() => handleAccept(application.id)}
                        className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-[10px] font-bold disabled:opacity-50"
                      >
                        {processingId === application.id ? "..." : "Accept"}
                      </button>

                      <button
                        type="button"
                        disabled={processingId === application.id}
                        onClick={() => openRejectModal(application)}
                        className="px-3 py-2 rounded-lg bg-red-600 text-white text-[10px] font-bold disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}

            {filteredApplications.length === 0 && (
              <div className="py-16 text-center">
                <div className="text-3xl mb-3">📋</div>

                <p className={`text-sm font-semibold ${headingClass}`}>
                  No applications found
                </p>

                <p className={`text-xs mt-1 ${bodyTextClass}`}>
                  There are no students under this status.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* APPLICATION DETAILS MODAL */}

      {selectedApplication && !showRejectModal && (
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
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={`px-5 sm:px-6 py-5 border-b flex items-start justify-between ${borderClass}`}
            >
              <div>
                <p
                  className={`text-[10px] uppercase tracking-widest font-bold ${bodyTextClass}`}
                >
                  Internship Deployment
                </p>

                <h2
                  className={`text-lg sm:text-xl font-black mt-1 ${headingClass}`}
                >
                  {selectedApplication.studentName}
                </h2>

                <p className={`text-xs mt-1 ${bodyTextClass}`}>
                  {selectedApplication.studentId}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedApplication(null)}
                className={`w-9 h-9 rounded-lg text-xl text-slate-400 ${
                  darkMode ? "hover:bg-slate-800" : "hover:bg-slate-100"
                }`}
              >
                ×
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-6">
              {/* STATUS */}

              <div className="flex items-center justify-between gap-3">
                <span
                  className={`inline-flex px-3 py-1.5 rounded-full border text-xs font-bold ${getStatusClass(
                    selectedApplication.status
                  )}`}
                >
                  {selectedApplication.status}
                </span>

                <span className={`text-[10px] ${bodyTextClass}`}>
                  {selectedApplication.approvedRequiredDocumentCount}/
                  {selectedApplication.requiredDocumentCount} required
                  documents approved
                </span>
              </div>

              {/* STUDENT INFORMATION */}

              <section>
                <h3 className={`text-sm font-bold mb-3 ${headingClass}`}>
                  Student Information
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    ["Full Name", selectedApplication.studentName],
                    ["Student ID", selectedApplication.studentId],
                    ["Email", selectedApplication.email],
                    ["Phone", selectedApplication.phone],
                    ["School", selectedApplication.school],
                    ["Course", selectedApplication.course],
                    ["Year Level", selectedApplication.yearLevel],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className={`p-3 rounded-xl border ${borderClass} ${
                        darkMode ? "bg-slate-800" : "bg-slate-50"
                      }`}
                    >
                      <p
                        className={`text-[9px] uppercase font-bold ${bodyTextClass}`}
                      >
                        {label}
                      </p>

                      <p
                        className={`text-xs font-semibold mt-1 ${headingClass}`}
                      >
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              {/* RESUME / CV */}

              <section>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div>
                    <h3 className={`text-sm font-bold ${headingClass}`}>
                      Resume / CV
                    </h3>

                    <p className={`text-[10px] mt-1 ${bodyTextClass}`}>
                      Review the student's Resume/CV before making a placement
                      decision.
                    </p>
                  </div>
                </div>

                <div
                  className={`p-4 rounded-xl border ${borderClass} ${
                    darkMode ? "bg-slate-800" : "bg-slate-50"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 flex-shrink-0 rounded-lg flex items-center justify-center ${
                          darkMode ? "bg-slate-700" : "bg-white"
                        }`}
                      >
                        📄
                      </div>

                      <div className="min-w-0">
                        <p
                          className={`text-xs font-bold ${
                            selectedApplication.resumeUrl
                              ? headingClass
                              : bodyTextClass
                          }`}
                        >
                          {selectedApplication.resumeUrl
                            ? selectedApplication.resumeName ||
                              "Resume/CV uploaded"
                            : "Resume/CV not uploaded"}
                        </p>

                        <p className={`text-[10px] mt-1 ${bodyTextClass}`}>
                          {selectedApplication.resumeUrl
                            ? "Available from the student's profile"
                            : "The student has not uploaded a Resume/CV."}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={
                        !selectedApplication.resumeUrl ||
                        viewingResumeId === selectedApplication.id
                      }
                      onClick={() => handleViewResume(selectedApplication)}
                      className={`flex-shrink-0 px-4 py-2.5 rounded-lg border text-[10px] font-bold transition ${
                        selectedApplication.resumeUrl
                          ? darkMode
                            ? "border-blue-800 text-blue-300 hover:bg-blue-950/40"
                            : "border-blue-200 text-blue-700 hover:bg-blue-50"
                          : darkMode
                          ? "border-slate-700 text-slate-600 cursor-not-allowed"
                          : "border-slate-200 text-slate-400 cursor-not-allowed"
                      } disabled:opacity-70`}
                    >
                      {viewingResumeId === selectedApplication.id
                        ? "Opening..."
                        : "View Resume/CV"}
                    </button>
                  </div>
                </div>
              </section>

              {/* INTERNSHIP INFORMATION */}

              <section>
                <h3 className={`text-sm font-bold mb-3 ${headingClass}`}>
                  Internship Information
                </h3>

                <div
                  className={`p-4 rounded-xl border ${borderClass} ${
                    darkMode ? "bg-slate-800" : "bg-slate-50"
                  }`}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p
                        className={`text-[9px] uppercase font-bold ${bodyTextClass}`}
                      >
                        Position
                      </p>

                      <p
                        className={`text-xs font-semibold mt-1 ${headingClass}`}
                      >
                        {selectedApplication.internshipPosition}
                      </p>
                    </div>

                    <div>
                      <p
                        className={`text-[9px] uppercase font-bold ${bodyTextClass}`}
                      >
                        Department
                      </p>

                      <p
                        className={`text-xs font-semibold mt-1 ${headingClass}`}
                      >
                        {selectedApplication.department}
                      </p>
                    </div>

                    <div className="sm:col-span-2">
                      <p
                        className={`text-[9px] uppercase font-bold ${bodyTextClass}`}
                      >
                        Internship Duration
                      </p>

                      <p
                        className={`text-xs font-semibold mt-1 ${headingClass}`}
                      >
                        {selectedApplication.internshipDuration}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* DOCUMENTS */}

              <section>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className={`text-sm font-bold ${headingClass}`}>
                      Submitted Documents
                    </h3>

                    <p className={`text-[10px] mt-1 ${bodyTextClass}`}>
                      Documents approved by the Registrar and available for
                      company review.
                    </p>
                  </div>

                  <span className={`text-[10px] font-bold ${bodyTextClass}`}>
                    {selectedApplication.documents.length} files
                  </span>
                </div>

                <div className="space-y-2">
                  {selectedApplication.documents.map((document) => (
                    <div
                      key={document.id}
                      className={`flex items-center justify-between gap-3 p-3 rounded-xl border ${borderClass}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 flex-shrink-0 rounded-lg flex items-center justify-center ${
                            darkMode ? "bg-slate-800" : "bg-slate-100"
                          }`}
                        >
                          📄
                        </div>

                        <div className="min-w-0">
                          <p
                            className={`text-xs font-bold truncate ${headingClass}`}
                          >
                            {document.name}
                          </p>

                          <p
                            className={`text-[10px] mt-0.5 truncate ${bodyTextClass}`}
                          >
                            {document.file}
                          </p>

                          <span
                            className={`inline-flex mt-1 px-2 py-0.5 rounded-full text-[8px] font-bold ${
                              document.status === "approved"
                                ? darkMode
                                  ? "bg-emerald-950 text-emerald-300"
                                  : "bg-emerald-50 text-emerald-700"
                                : darkMode
                                ? "bg-amber-950 text-amber-300"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {document.status}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={viewingDocumentId === document.id}
                        onClick={() => handleViewDocument(document)}
                        className={`flex-shrink-0 px-3 py-2 rounded-lg border text-[10px] font-bold transition ${
                          darkMode
                            ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                            : "border-slate-200 text-slate-600 hover:bg-slate-50"
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {viewingDocumentId === document.id
                          ? "Opening..."
                          : "View"}
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              {/* ACTIONS */}

              {selectedApplication.status === "Pending" && (
                <div
                  className={`pt-5 border-t flex flex-wrap justify-end gap-2 ${borderClass}`}
                >
                  <button
                    type="button"
                    disabled={processingId === selectedApplication.id}
                    onClick={() => openRejectModal(selectedApplication)}
                    className="px-5 py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition disabled:opacity-50"
                  >
                    Reject Application
                  </button>

                  <button
                    type="button"
                    disabled={processingId === selectedApplication.id}
                    onClick={() => handleAccept(selectedApplication.id)}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition disabled:opacity-50"
                  >
                    {processingId === selectedApplication.id
                      ? "Processing..."
                      : "Accept Application"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}

      {showRejectModal && selectedApplication && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowRejectModal(false)}
        >
          <div
            className={`w-full max-w-md rounded-2xl shadow-2xl border ${
              darkMode
                ? "bg-slate-900 border-slate-700 text-white"
                : "bg-white border-slate-200 text-slate-900"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`px-5 py-4 border-b ${borderClass}`}>
              <h2 className={`text-base font-black ${headingClass}`}>
                Reject Internship Placement
              </h2>

              <p className={`text-xs mt-1 ${bodyTextClass}`}>
                You are rejecting the internship placement of{" "}
                <span className="font-semibold">
                  {selectedApplication.studentName}
                </span>
                .
              </p>
            </div>

            <div className="p-5">
              <div
                className={`mb-4 p-3 rounded-xl border text-[10px] ${
                  darkMode
                    ? "border-amber-800 bg-amber-950/30 text-amber-300"
                    : "border-amber-200 bg-amber-50 text-amber-700"
                }`}
              >
                The student's application will be marked as rejected, and the
                internship placement with your company will be terminated. The
                student may apply again to this opportunity.
              </div>

              <label
                className={`block text-xs font-bold mb-2 ${headingClass}`}
              >
                Reason for Rejection
                <span className={`font-normal ml-1 ${bodyTextClass}`}>
                  (optional)
                </span>
              </label>

              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
                placeholder="Enter a reason for rejecting this internship placement..."
                className={`w-full px-3 py-3 rounded-xl border text-sm outline-none resize-none ${
                  darkMode
                    ? "bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-slate-500"
                    : "bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-slate-400"
                }`}
              />

              <div className="flex justify-end gap-2 mt-5">
                <button
                  type="button"
                  disabled={processingId === selectedApplication.id}
                  onClick={() => setShowRejectModal(false)}
                  className={`px-4 py-2.5 rounded-xl border text-xs font-bold ${
                    darkMode
                      ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={processingId === selectedApplication.id}
                  onClick={handleReject}
                  className="px-4 py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition disabled:opacity-50"
                >
                  {processingId === selectedApplication.id
                    ? "Rejecting..."
                    : "Confirm Rejection"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageApplications;

