import React, { useEffect, useMemo, useState } from "react";
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

  document: {
    SUBMITTED: "submitted",
    PENDING_REVIEW: "pending_review",
    APPROVED: "approved",
    NEEDS_REVISION: "needs_revision",
  },
};

const DOCUMENT_BUCKET = "internship-documents";
const PROFILE_PHOTO_BUCKET = "profile-photos";
const VERIFICATION_DOCUMENTS_BUCKET = "verification-documents";

export default function ReviewApplications() {
  const { darkMode } = useOutletContext();

  // =========================================================
  // STATE
  // =========================================================

  const [applications, setApplications] = useState([]);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [applicationDocuments, setApplicationDocuments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [openingDocumentId, setOpeningDocumentId] = useState(null);

  const [isResumeOpening, setIsResumeOpening] = useState(false);
  const [isCorOpening, setIsCorOpening] = useState(false);

  const [selectedApplication, setSelectedApplication] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Profile photo signed URLs
  const [profilePhotoUrls, setProfilePhotoUrls] = useState({});
  const [loadingProfilePhoto, setLoadingProfilePhoto] = useState(false);
  const [isProfilePhotoExpanded, setIsProfilePhotoExpanded] = useState(false);

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
  // EFFECT
  // =========================================================

  useEffect(() => {
    loadApplications();
  }, []);

  // =========================================================
  // LOAD APPLICATIONS
  // =========================================================

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
      // GET DOCUMENT TYPES
      // -------------------------------------------------------

      const { data: documentTypeData, error: documentTypeError } =
        await supabaseRegistrar
          .from("document_types")
          .select("id, name, description, required")
          .order("created_at", {
            ascending: true,
          });

      if (documentTypeError) {
        throw documentTypeError;
      }

      setDocumentTypes(documentTypeData || []);

      // -------------------------------------------------------
      // GET APPLICATIONS
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
            updated_at,
            students (
              id,
              student_id,
              phone,
              address,
              program,
              year_level,
              department,
              profile_photo_url,
              resume_url,
              resume_name,
              cor_url,
              cor_name,
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

      const loadedApplications = data || [];

      setApplications(loadedApplications);

      // -------------------------------------------------------
      // GET APPLICATION DOCUMENTS
      // -------------------------------------------------------

      if (loadedApplications.length > 0) {
        const applicationIds = loadedApplications.map(
          (application) => application.id
        );

        const { data: documentData, error: documentError } =
          await supabaseRegistrar
            .from("documents")
            .select(
              `
              id,
              application_id,
              assignment_id,
              student_id,
              document_type_id,
              file_name,
              storage_path,
              version,
              status,
              notes,
              reviewed_by,
              reviewed_at,
              created_at,
              updated_at
            `
            )
            .in("application_id", applicationIds)
            .order("created_at", {
              ascending: false,
            });

        if (documentError) {
          throw documentError;
        }

        setApplicationDocuments(documentData || []);
      } else {
        setApplicationDocuments([]);
      }
    } catch (error) {
      console.error("Error loading applications:", error);

      alert(error.message || "Unable to load applications.");
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // LOAD SELECTED STUDENT PROFILE PHOTO
  // =========================================================

  const getProfilePhotoStoragePath = (path) => {
    if (!path) return null;

    let storagePath = path;

    if (path.startsWith("http")) {
      const publicMarker = `/storage/v1/object/public/${PROFILE_PHOTO_BUCKET}/`;

      if (path.includes(publicMarker)) {
        storagePath = path.split(publicMarker)[1];
      } else {
        const signedMarker = `/storage/v1/object/sign/${PROFILE_PHOTO_BUCKET}/`;

        if (path.includes(signedMarker)) {
          storagePath = path.split(signedMarker)[1].split("?")[0];
        }
      }
    }

    return decodeURIComponent(storagePath);
  };

  const loadStudentProfilePhoto = async (student) => {
    if (!student?.id) {
      return;
    }

    const photoPath = student?.profile_photo_url;

    if (!photoPath) {
      return;
    }

    // Already loaded
    if (profilePhotoUrls[student.id]) {
      return;
    }

    setLoadingProfilePhoto(true);

    try {
      const storagePath = getProfilePhotoStoragePath(photoPath);

      if (!storagePath) {
        return;
      }

      const { data, error } = await supabaseRegistrar.storage
        .from(PROFILE_PHOTO_BUCKET)
        .createSignedUrl(storagePath, 60 * 60);

      if (error) {
        throw error;
      }

      if (data?.signedUrl) {
        setProfilePhotoUrls((previous) => ({
          ...previous,
          [student.id]: data.signedUrl,
        }));
      }
    } catch (error) {
      console.error("Error loading student profile photo:", error);
    } finally {
      setLoadingProfilePhoto(false);
    }
  };

  // =========================================================
  // VERIFICATION DOCUMENT STORAGE HELPERS
  // =========================================================

  const getVerificationDocumentStoragePath = (path) => {
    if (!path) return null;

    let storagePath = path;

    if (path.startsWith("http")) {
      const publicMarker = `/storage/v1/object/public/${VERIFICATION_DOCUMENTS_BUCKET}/`;

      if (path.includes(publicMarker)) {
        storagePath = path.split(publicMarker)[1];
      } else {
        const signedMarker = `/storage/v1/object/sign/${VERIFICATION_DOCUMENTS_BUCKET}/`;

        if (path.includes(signedMarker)) {
          storagePath = path.split(signedMarker)[1].split("?")[0];
        }
      }
    }

    return decodeURIComponent(storagePath);
  };

  // =========================================================
  // OPEN RESUME / CV
  // =========================================================

  const handleOpenResume = async (student) => {
    if (!student?.resume_url) {
      alert("This student has not uploaded a Resume/CV.");
      return;
    }

    setIsResumeOpening(true);

    try {
      const storagePath = getVerificationDocumentStoragePath(
        student.resume_url
      );

      if (!storagePath) {
        throw new Error("Invalid Resume/CV storage path.");
      }

      const { data, error } = await supabaseRegistrar.storage
        .from(VERIFICATION_DOCUMENTS_BUCKET)
        .createSignedUrl(storagePath, 60 * 60);

      if (error) {
        throw error;
      }

      if (!data?.signedUrl) {
        throw new Error("Unable to generate a secure Resume/CV URL.");
      }

      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error("Error opening student Resume/CV:", error);

      alert(error?.message || "Unable to open the student's Resume/CV.");
    } finally {
      setIsResumeOpening(false);
    }
  };

  // =========================================================
  // OPEN COR
  // =========================================================

  const handleOpenCOR = async (student) => {
    if (!student?.cor_url) {
      alert("This student has not uploaded a Certificate of Registration.");
      return;
    }

    setIsCorOpening(true);

    try {
      const storagePath = getVerificationDocumentStoragePath(student.cor_url);

      if (!storagePath) {
        throw new Error("Invalid COR storage path.");
      }

      const { data, error } = await supabaseRegistrar.storage
        .from(VERIFICATION_DOCUMENTS_BUCKET)
        .createSignedUrl(storagePath, 60 * 60);

      if (error) {
        throw error;
      }

      if (!data?.signedUrl) {
        throw new Error("Unable to generate a secure COR URL.");
      }

      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error("Error opening student COR:", error);

      alert(
        error?.message ||
          "Unable to open the student's Certificate of Registration."
      );
    } finally {
      setIsCorOpening(false);
    }
  };

  // =========================================================
  // HELPERS
  // =========================================================

  const getStudentName = (student) => {
    if (!student?.users) return "Unknown Student";

    const user = student.users;

    const name = [user.first_name, user.middle_name, user.last_name]
      .filter(Boolean)
      .join(" ")
      .trim();

    return name || "Unknown Student";
  };

  const getStudentInitials = (student) => {
    const name = getStudentName(student);

    if (name === "Unknown Student") {
      return "US";
    }

    return name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const getStudentProfilePhoto = (student) => {
    if (!student?.id) {
      return null;
    }

    return profilePhotoUrls[student.id] || null;
  };

  const getCompanyName = (application) => {
    return (
      application?.opportunities?.companies?.company_name || "Unknown Company"
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
      opportunity?.internship_end_date || opportunity?.internship_end || null
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

  const formatShortDate = (date) => {
    if (!date) return "Not specified";

    const parsedDate = new Date(`${date}T00:00:00`);

    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }

    return parsedDate.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
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

    if (status === STATUS.application.UNDER_REVIEW) {
      return darkMode
        ? "bg-violet-950/50 text-violet-300 border-violet-800"
        : "bg-violet-50 text-violet-700 border-violet-200";
    }

    return darkMode
      ? "bg-amber-950/50 text-amber-300 border-amber-800"
      : "bg-amber-50 text-amber-700 border-amber-200";
  };

  // =========================================================
  // DOCUMENT HELPERS
  // =========================================================

  const getRequirementIds = (requirements) => {
    if (!Array.isArray(requirements)) {
      return [];
    }

    return requirements
      .map((requirement) => {
        if (typeof requirement === "string") {
          return requirement;
        }

        return requirement?.id;
      })
      .filter(Boolean);
  };

  const getRequiredDocumentTypes = (application) => {
    const systemRequired = documentTypes.filter(
      (documentType) => documentType.required
    );

    const optionalRequirementIds = getRequirementIds(
      application?.opportunities?.requirements
    );

    const optional = optionalRequirementIds
      .map((id) => documentTypes.find((documentType) => documentType.id === id))
      .filter(Boolean);

    return [
      ...systemRequired,
      ...optional.filter(
        (documentType) =>
          !systemRequired.some(
            (systemDocument) => systemDocument.id === documentType.id
          )
      ),
    ];
  };

  const getApplicationDocuments = (applicationId) => {
    if (!applicationId) return [];

    return applicationDocuments.filter(
      (document) => document.application_id === applicationId
    );
  };

  const getApplicationDocument = (applicationId, documentTypeId) => {
    if (!applicationId || !documentTypeId) {
      return null;
    }

    return (
      applicationDocuments.find(
        (document) =>
          document.application_id === applicationId &&
          document.document_type_id === documentTypeId
      ) || null
    );
  };

  const getDocumentStatusLabel = (document) => {
    if (!document) {
      return "Missing";
    }

    const labels = {
      [STATUS.document.SUBMITTED]: "Submitted",
      [STATUS.document.PENDING_REVIEW]: "Pending Review",
      [STATUS.document.APPROVED]: "Approved",
      [STATUS.document.NEEDS_REVISION]: "Needs Revision",
    };

    return labels[document.status] || document.status || "Unknown";
  };

  const getDocumentStatusClass = (document) => {
    if (!document) {
      return darkMode
        ? "bg-red-950/40 text-red-300 border-red-800"
        : "bg-red-50 text-red-700 border-red-200";
    }

    if (document.status === STATUS.document.APPROVED) {
      return darkMode
        ? "bg-emerald-950/40 text-emerald-300 border-emerald-800"
        : "bg-emerald-50 text-emerald-700 border-emerald-200";
    }

    if (document.status === STATUS.document.NEEDS_REVISION) {
      return darkMode
        ? "bg-red-950/40 text-red-300 border-red-800"
        : "bg-red-50 text-red-700 border-red-200";
    }

    if (document.status === STATUS.document.PENDING_REVIEW) {
      return darkMode
        ? "bg-blue-950/40 text-blue-300 border-blue-800"
        : "bg-blue-50 text-blue-700 border-blue-200";
    }

    return darkMode
      ? "bg-amber-950/40 text-amber-300 border-amber-800"
      : "bg-amber-50 text-amber-700 border-amber-200";
  };

  const getDocumentIcon = (fileName) => {
    const extension = String(fileName || "")
      .split(".")
      .pop()
      .toLowerCase();

    if (extension === "pdf") {
      return "📕";
    }

    if (extension === "jpg" || extension === "jpeg" || extension === "png") {
      return "🖼️";
    }

    if (extension === "doc" || extension === "docx") {
      return "📄";
    }

    return "📎";
  };

  const formatDocumentDate = (date) => {
    if (!date) return "Date unavailable";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Date unavailable";
    }

    return parsedDate.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const selectedApplicationDocuments = useMemo(() => {
    if (!selectedApplication?.id) {
      return [];
    }

    return getApplicationDocuments(selectedApplication.id);
  }, [selectedApplication, applicationDocuments]);

  const selectedRequiredDocumentTypes = useMemo(() => {
    if (!selectedApplication) {
      return [];
    }

    return getRequiredDocumentTypes(selectedApplication);
  }, [selectedApplication, documentTypes]);

  const selectedDocumentSummary = useMemo(() => {
    const total = selectedRequiredDocumentTypes.length;

    const uploaded = selectedRequiredDocumentTypes.filter((documentType) => {
      const document = getApplicationDocument(
        selectedApplication?.id,
        documentType.id
      );

      return Boolean(document);
    }).length;

    const approved = selectedRequiredDocumentTypes.filter((documentType) => {
      const document = getApplicationDocument(
        selectedApplication?.id,
        documentType.id
      );

      return document?.status === STATUS.document.APPROVED;
    }).length;

    const needsRevision = selectedRequiredDocumentTypes.filter(
      (documentType) => {
        const document = getApplicationDocument(
          selectedApplication?.id,
          documentType.id
        );

        return document?.status === STATUS.document.NEEDS_REVISION;
      }
    ).length;

    return {
      total,
      uploaded,
      approved,
      needsRevision,
      missing: Math.max(total - uploaded, 0),
    };
  }, [
    selectedApplication,
    selectedRequiredDocumentTypes,
    applicationDocuments,
  ]);

  // =========================================================
  // OPEN DOCUMENT
  // =========================================================

  const handleOpenDocument = async (document) => {
    if (!document?.storage_path) {
      alert("This document does not have a valid storage path.");
      return;
    }

    setOpeningDocumentId(document.id);

    try {
      const { data, error } = await supabaseRegistrar.storage
        .from(DOCUMENT_BUCKET)
        .createSignedUrl(document.storage_path, 300);

      if (error) {
        throw error;
      }

      if (!data?.signedUrl) {
        throw new Error("Unable to generate a secure document URL.");
      }

      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error("Error opening document:", error);

      alert(
        error?.message || "Unable to open this document. Please try again."
      );
    } finally {
      setOpeningDocumentId(null);
    }
  };

  // =========================================================
  // SEND APPLICATION DECISION EMAIL
  // =========================================================

  const sendApplicationDecisionEmail = async ({
    application,
    decision,
    reason = "",
  }) => {
    const student = application?.students;
    const user = student?.users;
    const opportunity = application?.opportunities;

    const email = user?.email;
    const name = getStudentName(student);
    const opportunityName = opportunity?.title || "Internship Opportunity";
    const companyName = getCompanyName(application);

    if (!email) {
      console.warn(
        "Application decision saved, but student email was not found."
      );

      return {
        success: false,
        error: "Student email address was not found.",
      };
    }

    try {
      const { data, error } = await supabaseRegistrar.functions.invoke(
        "send-application-decision-email",
        {
          body: {
            email,
            name,
            decision,
            decidedBy: "registrar",
            opportunityName,
            companyName,
            reason,
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

      console.log("Application decision email sent successfully:", data);

      return {
        success: true,
      };
    } catch (error) {
      console.error("Application decision email failed:", error);

      return {
        success: false,
        error:
          error?.message || "Unable to send the application decision email.",
      };
    }
  };

  // =========================================================
  // GROUP APPLICATIONS BY STUDENT
  // =========================================================

  const studentGroups = useMemo(() => {
    const groups = {};

    applications.forEach((application) => {
      const student = application.students;

      const studentKey =
        student?.id || application.student_id || `unknown-${application.id}`;

      if (!groups[studentKey]) {
        groups[studentKey] = {
          studentId: studentKey,
          student,
          applications: [],
        };
      }

      groups[studentKey].applications.push(application);
    });

    return Object.values(groups);
  }, [applications]);

  // =========================================================
  // FILTER GROUPS
  // =========================================================

  const filteredStudentGroups = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return studentGroups
      .map((group) => {
        const student = group.student;

        const studentName = getStudentName(student).toLowerCase();

        const studentId = String(student?.student_id || "").toLowerCase();

        const email = String(student?.users?.email || "").toLowerCase();

        const program = String(student?.program || "").toLowerCase();

        const matchingApplications = group.applications.filter(
          (application) => {
            const opportunity = application.opportunities;
            const company = opportunity?.companies;

            const matchesStatus =
              statusFilter === "all" || application.status === statusFilter;

            const applicationText = [
              opportunity?.title,
              company?.company_name,
              opportunity?.location,
              opportunity?.position_type,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();

            const matchesSearch =
              !query ||
              studentName.includes(query) ||
              studentId.includes(query) ||
              email.includes(query) ||
              program.includes(query) ||
              applicationText.includes(query);

            return matchesStatus && matchesSearch;
          }
        );

        return {
          ...group,
          applications: matchingApplications,
        };
      })
      .filter((group) => group.applications.length > 0);
  }, [studentGroups, searchTerm, statusFilter]);

  // =========================================================
  // SUMMARY COUNTS
  // =========================================================

  const submittedCount = applications.filter(
    (item) => item.status === STATUS.application.SUBMITTED
  ).length;

  const underReviewCount = applications.filter(
    (item) => item.status === STATUS.application.UNDER_REVIEW
  ).length;

  const informationRequestedCount = applications.filter(
    (item) => item.status === STATUS.application.INFO_REQUESTED
  ).length;

  // =========================================================
  // APPROVE APPLICATION
  // =========================================================

  const handleApprove = async (application) => {
    if (!application) return;

    const studentName = getStudentName(application.students);

    const confirmed = window.confirm(
      `Approve the internship application of ${studentName}?\n\n` +
        `The application will be approved and sent to the student for confirmation.\n\n` +
        `No internship assignment will be created yet.`
    );

    if (!confirmed) return;

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

      const { data, error: applicationUpdateError } = await supabaseRegistrar
        .from("applications")
        .update({
          status: STATUS.application.APPROVED,
          reviewer_id: user.id,
          notes: "Approved by registrar. Awaiting student confirmation.",
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
              updated_at,
              students (
                id,
                student_id,
                phone,
                address,
                program,
                year_level,
                department,
                profile_photo_url,
                resume_url,
                resume_name,
                cor_url,
                cor_name,
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

      if (applicationUpdateError) {
        throw applicationUpdateError;
      }

      setApplications((previous) =>
        previous.filter((item) => item.id !== application.id)
      );

      setSelectedApplication(null);
      setIsProfilePhotoExpanded(false);

      const emailResult = await sendApplicationDecisionEmail({
        application: data || application,
        decision: "approved",
      });

      if (emailResult.success) {
        alert(
          `Application approved successfully.\n\n` +
            `Student: ${studentName}\n` +
            `Application Status: Approved\n` +
            `Email Notification: Sent\n\n` +
            `The student must now go to View Status and confirm this internship placement.\n\n` +
            `No assignment was created yet.`
        );
      } else {
        alert(
          `Application approved successfully.\n\n` +
            `Student: ${studentName}\n` +
            `Application Status: Approved\n` +
            `Email Notification: Failed to send\n\n` +
            `The student can still see the updated status in the Student Portal.\n\n` +
            `Email error: ${emailResult.error || "Unknown error"}\n\n` +
            `No assignment was created yet.`
        );
      }
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
            updated_at,
            students (
              id,
              student_id,
              phone,
              address,
              program,
              year_level,
              department,
              profile_photo_url,
              resume_url,
              resume_name,
              cor_url,
              cor_name,
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
      setIsProfilePhotoExpanded(false);

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

      const rejectionReason =
        reason.trim() || "Application rejected by registrar.";

      const { data, error } = await supabaseRegistrar
        .from("applications")
        .update({
          status: STATUS.application.REJECTED,
          reviewer_id: user.id,
          notes: rejectionReason,
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
            updated_at,
            students (
              id,
              student_id,
              phone,
              address,
              program,
              year_level,
              department,
              profile_photo_url,
              resume_url,
              resume_name,
              cor_url,
              cor_name,
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
        previous.filter((item) => item.id !== application.id)
      );

      setSelectedApplication(null);
      setIsProfilePhotoExpanded(false);

      const emailResult = await sendApplicationDecisionEmail({
        application: data || application,
        decision: "rejected",
        reason: rejectionReason,
      });

      if (emailResult.success) {
        alert(
          `Application rejected successfully.\n\n` +
            `Student: ${getStudentName(application.students)}\n` +
            `Application Status: Rejected\n` +
            `Email Notification: Sent`
        );
      } else {
        alert(
          `Application rejected successfully.\n\n` +
            `Student: ${getStudentName(application.students)}\n` +
            `Application Status: Rejected\n` +
            `Email Notification: Failed to send\n\n` +
            `The student can still see the updated status in the Student Portal.\n\n` +
            `Email error: ${emailResult.error || "Unknown error"}`
        );
      }
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

        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-black">
              Internship Applications
            </h1>

            <p className={`text-sm mt-1 ${body}`}>
              Review student applications and submitted internship documents.
            </p>
          </div>

          <button
            type="button"
            onClick={loadApplications}
            className={`self-start lg:self-auto px-4 py-2.5 rounded-xl border text-xs font-bold transition ${
              darkMode
                ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                : "border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* =====================================================
          SUMMARY
      ===================================================== */}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        <div className={`border rounded-2xl p-4 ${card}`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p
                className={`text-[10px] uppercase tracking-wider font-bold ${body}`}
              >
                Applications
              </p>

              <p className="text-2xl font-black mt-1">{applications.length}</p>
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

        <div className={`border rounded-2xl p-4 ${card}`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p
                className={`text-[10px] uppercase tracking-wider font-bold ${body}`}
              >
                Submitted
              </p>

              <p className="text-2xl font-black mt-1 text-amber-600">
                {submittedCount}
              </p>
            </div>

            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                darkMode ? "bg-amber-950/40" : "bg-amber-50"
              }`}
            >
              📨
            </div>
          </div>
        </div>

        <div className={`border rounded-2xl p-4 ${card}`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p
                className={`text-[10px] uppercase tracking-wider font-bold ${body}`}
              >
                Under Review
              </p>

              <p className="text-2xl font-black mt-1 text-violet-600">
                {underReviewCount}
              </p>
            </div>

            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                darkMode ? "bg-violet-950/40" : "bg-violet-50"
              }`}
            >
              🔎
            </div>
          </div>
        </div>

        <div className={`border rounded-2xl p-4 ${card}`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p
                className={`text-[10px] uppercase tracking-wider font-bold ${body}`}
              >
                Info Requested
              </p>

              <p className="text-2xl font-black mt-1 text-blue-600">
                {informationRequestedCount}
              </p>
            </div>

            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                darkMode ? "bg-blue-950/40" : "bg-blue-50"
              }`}
            >
              💬
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          FILTERS
      ===================================================== */}

      <div className={`border rounded-2xl p-4 mb-5 ${card}`}>
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <span
              className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm ${body}`}
            >
              🔍
            </span>

            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search student, ID, program, company, or position..."
              className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none transition ${
                darkMode
                  ? "bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-slate-500"
                  : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-slate-400"
              }`}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className={`md:w-52 px-3 py-2.5 rounded-xl border text-sm outline-none ${
              darkMode
                ? "bg-slate-800 border-slate-700 text-white"
                : "bg-white border-slate-200 text-slate-700"
            }`}
          >
            <option value="all">All Statuses</option>

            <option value={STATUS.application.SUBMITTED}>Submitted</option>

            <option value={STATUS.application.UNDER_REVIEW}>
              Under Review
            </option>

            <option value={STATUS.application.INFO_REQUESTED}>
              Information Requested
            </option>
          </select>
        </div>

        <div className="flex items-center justify-between mt-3">
          <p className={`text-xs ${body}`}>
            Showing{" "}
            <span className={`font-bold ${heading}`}>
              {filteredStudentGroups.length}
            </span>{" "}
            student
            {filteredStudentGroups.length !== 1 ? "s" : ""}
          </p>

          {(searchTerm || statusFilter !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
              }}
              className="text-xs font-bold text-blue-600 hover:text-blue-700"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* =====================================================
          STUDENT LIST
      ===================================================== */}

      <section className={`border rounded-2xl overflow-hidden ${card}`}>
        <div
          className={`px-5 py-4 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 ${border}`}
        >
          <div>
            <h2 className="font-bold text-lg">Students</h2>

            <p className={`text-xs mt-1 ${body}`}>
              Each student contains all of their applications currently awaiting
              Registrar action.
            </p>
          </div>

          <span
            className={`text-xs font-bold px-3 py-1.5 rounded-full ${
              darkMode
                ? "bg-slate-800 text-slate-300"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {filteredStudentGroups.length} Student
            {filteredStudentGroups.length !== 1 ? "s" : ""}
          </span>
        </div>

        {filteredStudentGroups.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-3">📋</div>

            <h3 className="font-bold">
              {applications.length === 0
                ? "No applications to review"
                : "No matching applications"}
            </h3>

            <p className={`text-sm mt-1 ${body}`}>
              {applications.length === 0
                ? "New student submissions will appear here."
                : "Try changing your search or status filter."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {filteredStudentGroups.map((group) => {
              const student = group.student;
              const studentName = getStudentName(student);

              const submittedApplications = group.applications.filter(
                (item) => item.status === STATUS.application.SUBMITTED
              ).length;

              const underReviewApplications = group.applications.filter(
                (item) => item.status === STATUS.application.UNDER_REVIEW
              ).length;

              const infoRequestedApplications = group.applications.filter(
                (item) => item.status === STATUS.application.INFO_REQUESTED
              ).length;

              return (
                <div key={group.studentId} className="p-4 md:p-5">
                  {/* STUDENT HEADER */}

                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 font-black ${
                          darkMode
                            ? "bg-slate-800 text-slate-200"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {getStudentInitials(student)}
                      </div>

                      <div className="min-w-0">
                        <h3 className="font-bold text-base truncate">
                          {studentName}
                        </h3>

                        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                          <span className={`text-xs ${body}`}>
                            ID: {student?.student_id || "N/A"}
                          </span>

                          <span className={`text-xs ${body}`}>
                            {student?.program || "Program not specified"}
                          </span>

                          <span className={`text-xs ${body}`}>
                            Year {student?.year_level || "N/A"}
                          </span>
                        </div>

                        <p className={`text-xs mt-1 ${body}`}>
                          {student?.users?.email || "No email"}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <div className={`px-3 py-2 rounded-lg border ${border}`}>
                        <p className={`text-[9px] uppercase font-bold ${body}`}>
                          Applications
                        </p>

                        <p className="text-sm font-black mt-0.5">
                          {group.applications.length}
                        </p>
                      </div>

                      {submittedApplications > 0 && (
                        <div
                          className={`px-3 py-2 rounded-lg ${
                            darkMode ? "bg-amber-950/30" : "bg-amber-50"
                          }`}
                        >
                          <p className="text-[9px] uppercase font-bold text-amber-600">
                            Submitted
                          </p>

                          <p className="text-sm font-black mt-0.5 text-amber-600">
                            {submittedApplications}
                          </p>
                        </div>
                      )}

                      {underReviewApplications > 0 && (
                        <div
                          className={`px-3 py-2 rounded-lg ${
                            darkMode ? "bg-violet-950/30" : "bg-violet-50"
                          }`}
                        >
                          <p className="text-[9px] uppercase font-bold text-violet-600">
                            Reviewing
                          </p>

                          <p className="text-sm font-black mt-0.5 text-violet-600">
                            {underReviewApplications}
                          </p>
                        </div>
                      )}

                      {infoRequestedApplications > 0 && (
                        <div
                          className={`px-3 py-2 rounded-lg ${
                            darkMode ? "bg-blue-950/30" : "bg-blue-50"
                          }`}
                        >
                          <p className="text-[9px] uppercase font-bold text-blue-600">
                            Info Needed
                          </p>

                          <p className="text-sm font-black mt-0.5 text-blue-600">
                            {infoRequestedApplications}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* APPLICATIONS */}

                  <div className="space-y-2">
                    {group.applications.map((application, index) => {
                      const opportunity = application.opportunities;

                      const company = opportunity?.companies;

                      const requiredTypes =
                        getRequiredDocumentTypes(application);

                      const applicationDocs = getApplicationDocuments(
                        application.id
                      );

                      const uploadedRequiredCount = requiredTypes.filter(
                        (documentType) =>
                          applicationDocs.some(
                            (document) =>
                              document.document_type_id === documentType.id
                          )
                      ).length;

                      return (
                        <div
                          key={application.id}
                          className={`border rounded-xl p-3 md:p-4 transition ${
                            darkMode
                              ? "border-slate-700 bg-slate-800/40 hover:bg-slate-800/70"
                              : "border-slate-200 bg-slate-50/70 hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex flex-col xl:flex-row xl:items-center gap-4">
                            <div
                              className={`hidden sm:flex w-9 h-9 rounded-lg items-center justify-center flex-shrink-0 text-xs font-black ${
                                darkMode
                                  ? "bg-slate-700 text-slate-300"
                                  : "bg-white text-slate-500 border border-slate-200"
                              }`}
                            >
                              {String(index + 1).padStart(2, "0")}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="font-bold text-sm md:text-base truncate">
                                  {opportunity?.title || "Unknown Opportunity"}
                                </h4>

                                <span
                                  className={`inline-flex px-2 py-1 rounded-full border text-[9px] font-bold ${getStatusClass(
                                    application.status
                                  )}`}
                                >
                                  {getStatusLabel(application.status)}
                                </span>
                              </div>

                              <p className="text-xs font-semibold mt-1">
                                {company?.company_name || "Unknown Company"}
                              </p>

                              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                                <span className={`text-[10px] ${body}`}>
                                  📍 {opportunity?.location || "N/A"}
                                </span>

                                <span className={`text-[10px] ${body}`}>
                                  💼 {opportunity?.position_type || "N/A"}
                                </span>

                                <span className={`text-[10px] ${body}`}>
                                  📅{" "}
                                  {formatShortDate(
                                    getOpportunityStartDate(opportunity)
                                  )}
                                </span>
                              </div>
                            </div>

                            <div className="xl:w-40 flex-shrink-0">
                              <p
                                className={`text-[9px] uppercase tracking-wider font-bold ${body}`}
                              >
                                Documents
                              </p>

                              <p className="text-xs font-semibold mt-1">
                                {uploadedRequiredCount}/
                                {requiredTypes.length || 0} uploaded
                              </p>
                            </div>

                            <div className="xl:w-40 flex-shrink-0">
                              <p
                                className={`text-[9px] uppercase tracking-wider font-bold ${body}`}
                              >
                                Submitted
                              </p>

                              <p className="text-xs font-semibold mt-1">
                                {application.submitted_at
                                  ? new Date(
                                      application.submitted_at
                                    ).toLocaleDateString()
                                  : "Date unavailable"}
                              </p>
                            </div>

                            <div className="flex flex-wrap gap-2 xl:justify-end flex-shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedApplication(application);
                                  setIsProfilePhotoExpanded(false);
                                  loadStudentProfilePhoto(application.students);
                                }}
                                className={`px-3 py-2 rounded-lg border text-xs font-bold ${
                                  darkMode
                                    ? "border-slate-700 text-slate-300 hover:bg-slate-700"
                                    : "border-slate-200 text-slate-600 hover:bg-white"
                                }`}
                              >
                                View Details
                              </button>

                              <button
                                type="button"
                                disabled={processingId === application.id}
                                onClick={() => handleApprove(application)}
                                className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 disabled:opacity-50"
                              >
                                {processingId === application.id
                                  ? "..."
                                  : "Approve"}
                              </button>

                              <button
                                type="button"
                                disabled={processingId === application.id}
                                onClick={() =>
                                  handleRequestInformation(application)
                                }
                                className="px-3 py-2 rounded-lg border border-blue-200 text-blue-600 text-xs font-bold hover:bg-blue-50 disabled:opacity-50"
                              >
                                Request Info
                              </button>

                              <button
                                type="button"
                                disabled={processingId === application.id}
                                onClick={() => handleReject(application)}
                                className="px-3 py-2 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700 disabled:opacity-50"
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* =======================================================
          APPLICATION DETAILS MODAL
      ======================================================= */}

      {selectedApplication && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => {
            setSelectedApplication(null);
            setIsProfilePhotoExpanded(false);
          }}
        >
          <div
            className={`w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl border ${
              darkMode
                ? "bg-slate-900 border-slate-700 text-white"
                : "bg-white border-slate-200 text-slate-900"
            }`}
            onClick={(event) => event.stopPropagation()}
          >
            {/* =================================================
                MODAL HEADER
            ================================================= */}

            <div className={`px-5 py-5 border-b ${border}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p
                    className={`text-[10px] uppercase tracking-widest font-bold ${body}`}
                  >
                    Application Details
                  </p>

                  <h2 className="text-xl font-black mt-1 truncate">
                    {getStudentName(selectedApplication.students)}
                  </h2>

                  <p className={`text-xs mt-1 ${body}`}>
                    Student ID:{" "}
                    {selectedApplication.students?.student_id || "N/A"}
                  </p>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        getStudentProfilePhoto(selectedApplication.students)
                      ) {
                        setIsProfilePhotoExpanded(true);
                      }
                    }}
                    disabled={
                      !getStudentProfilePhoto(selectedApplication.students)
                    }
                    title={
                      getStudentProfilePhoto(selectedApplication.students)
                        ? "Click to view profile photo"
                        : "No profile photo"
                    }
                    className={`w-14 h-14 rounded-xl overflow-hidden border flex items-center justify-center transition ${
                      getStudentProfilePhoto(selectedApplication.students)
                        ? "cursor-zoom-in hover:scale-105"
                        : "cursor-default"
                    } ${
                      darkMode
                        ? "border-slate-700 bg-slate-800"
                        : "border-slate-200 bg-slate-100"
                    }`}
                  >
                    {getStudentProfilePhoto(selectedApplication.students) ? (
                      <img
                        src={getStudentProfilePhoto(
                          selectedApplication.students
                        )}
                        alt={`${getStudentName(
                          selectedApplication.students
                        )} profile`}
                        className="w-full h-full object-cover"
                      />
                    ) : loadingProfilePhoto &&
                      selectedApplication.students?.profile_photo_url ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-xs animate-pulse">⏳</span>
                      </div>
                    ) : (
                      <span className="font-black text-sm">
                        {getStudentInitials(selectedApplication.students)}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedApplication(null);
                      setIsProfilePhotoExpanded(false);
                    }}
                    className={`w-9 h-9 rounded-lg text-xl flex-shrink-0 ${
                      darkMode
                        ? "hover:bg-slate-800 text-slate-400"
                        : "hover:bg-slate-100 text-slate-500"
                    }`}
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>

            {/* =================================================
                MODAL CONTENT
            ================================================= */}

            <div className="p-5 space-y-6">
              {/* STATUS */}

              <div
                className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${border}`}
              >
                <div>
                  <p
                    className={`text-[9px] uppercase tracking-wider font-bold ${body}`}
                  >
                    Application Status
                  </p>

                  <span
                    className={`inline-flex mt-2 px-3 py-1.5 rounded-full border text-xs font-bold ${getStatusClass(
                      selectedApplication.status
                    )}`}
                  >
                    {getStatusLabel(selectedApplication.status)}
                  </span>
                </div>

                <div className="sm:text-right">
                  <p
                    className={`text-[9px] uppercase tracking-wider font-bold ${body}`}
                  >
                    Submitted
                  </p>

                  <p className="text-xs font-semibold mt-1">
                    {selectedApplication.submitted_at
                      ? new Date(
                          selectedApplication.submitted_at
                        ).toLocaleString()
                      : "Date unavailable"}
                  </p>
                </div>
              </div>

              {/* =================================================
                  STUDENT INFORMATION
              ================================================= */}

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

                    <p className="text-sm font-semibold mt-1 break-all">
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

                  <div
                    className={`p-3 rounded-xl border sm:col-span-2 ${border}`}
                  >
                    <p className={`text-[9px] uppercase font-bold ${body}`}>
                      Address
                    </p>

                    <p className="text-sm font-semibold mt-1">
                      {selectedApplication.students?.address || "N/A"}
                    </p>
                  </div>
                </div>
              </section>

              {/* =================================================
    STUDENT ADDITIONAL DOCUMENTS
================================================= */}

              <section>
                <h3 className="font-bold mb-3">Student Additional Documents</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* =================================================
        RESUME / CV
    ================================================= */}

                  <div className={`p-4 rounded-xl border ${border}`}>
                    <div className="flex flex-col gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              darkMode ? "bg-slate-800" : "bg-slate-100"
                            }`}
                          >
                            📄
                          </div>

                          <div className="min-w-0">
                            <p className="text-sm font-bold">Resume / CV</p>

                            <p className={`text-[10px] ${body}`}>
                              Student-uploaded document
                            </p>
                          </div>
                        </div>

                        {selectedApplication.students?.resume_url ? (
                          <p
                            className="text-xs font-semibold mt-3 truncate"
                            title={
                              selectedApplication.students?.resume_name ||
                              "Resume.pdf"
                            }
                          >
                            {selectedApplication.students?.resume_name ||
                              "Resume.pdf"}
                          </p>
                        ) : (
                          <p className="text-xs font-semibold mt-3 text-red-600 dark:text-red-300">
                            No Resume/CV uploaded
                          </p>
                        )}
                      </div>

                      <div>
                        {selectedApplication.students?.resume_url ? (
                          <button
                            type="button"
                            disabled={isResumeOpening}
                            onClick={() =>
                              handleOpenResume(selectedApplication.students)
                            }
                            className={`w-full px-4 py-2.5 rounded-xl border text-xs font-bold transition ${
                              darkMode
                                ? "border-slate-700 text-slate-300 hover:bg-slate-700"
                                : "border-slate-200 text-slate-600 hover:bg-slate-50"
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            {isResumeOpening ? "Opening..." : "View Resume"}
                          </button>
                        ) : (
                          <span
                            className={`inline-flex px-3 py-2 rounded-lg text-[10px] font-bold ${
                              darkMode
                                ? "bg-red-950/30 text-red-300"
                                : "bg-red-50 text-red-600"
                            }`}
                          >
                            Missing
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* =================================================
        CERTIFICATE OF REGISTRATION
    ================================================= */}

                  <div className={`p-4 rounded-xl border ${border}`}>
                    <div className="flex flex-col gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              darkMode ? "bg-slate-800" : "bg-slate-100"
                            }`}
                          >
                            📜
                          </div>

                          <div className="min-w-0">
                            <p className="text-sm font-bold">
                              Certificate of Registration
                            </p>

                            <p className={`text-[10px] ${body}`}>
                              Student-uploaded document
                            </p>
                          </div>
                        </div>

                        {selectedApplication.students?.cor_url ? (
                          <p
                            className="text-xs font-semibold mt-3 truncate"
                            title={
                              selectedApplication.students?.cor_name ||
                              "Certificate of Registration.pdf"
                            }
                          >
                            {selectedApplication.students?.cor_name ||
                              "Certificate of Registration.pdf"}
                          </p>
                        ) : (
                          <p className="text-xs font-semibold mt-3 text-red-600 dark:text-red-300">
                            No Certificate of Registration uploaded
                          </p>
                        )}
                      </div>

                      <div>
                        {selectedApplication.students?.cor_url ? (
                          <button
                            type="button"
                            disabled={isCorOpening}
                            onClick={() =>
                              handleOpenCOR(selectedApplication.students)
                            }
                            className={`w-full px-4 py-2.5 rounded-xl border text-xs font-bold transition ${
                              darkMode
                                ? "border-slate-700 text-slate-300 hover:bg-slate-700"
                                : "border-slate-200 text-slate-600 hover:bg-slate-50"
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            {isCorOpening ? "Opening..." : "View COR"}
                          </button>
                        ) : (
                          <span
                            className={`inline-flex px-3 py-2 rounded-lg text-[10px] font-bold ${
                              darkMode
                                ? "bg-red-950/30 text-red-300"
                                : "bg-red-50 text-red-600"
                            }`}
                          >
                            Missing
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* =================================================
                  INTERNSHIP INFORMATION
              ================================================= */}

              <section>
                <h3 className="font-bold mb-3">Internship Information</h3>

                <div className={`rounded-xl border overflow-hidden ${border}`}>
                  <div
                    className={`p-4 ${
                      darkMode ? "bg-slate-800/50" : "bg-slate-50"
                    }`}
                  >
                    <p
                      className={`text-[9px] uppercase tracking-wider font-bold ${body}`}
                    >
                      Position
                    </p>

                    <p className="font-black text-lg mt-1">
                      {selectedApplication.opportunities?.title || "N/A"}
                    </p>

                    <p className={`text-xs mt-1 ${body}`}>
                      {getCompanyName(selectedApplication)}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
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

              {/* =================================================
                  COVER LETTER
              ================================================= */}

              <section>
                <h3 className="font-bold mb-3">Cover Letter</h3>

                <div
                  className={`p-4 rounded-xl border ${
                    darkMode
                      ? "border-slate-700 bg-slate-800/50"
                      : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <p className="text-sm leading-6 whitespace-pre-wrap">
                    {selectedApplication.cover_letter ||
                      "No cover letter provided."}
                  </p>
                </div>
              </section>

              {/* =================================================
                  REQUIRED DOCUMENTS
              ================================================= */}

              <section>
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-3">
                  <div>
                    <h3 className="font-bold">Required Documents</h3>

                    <p className={`text-xs mt-1 ${body}`}>
                      Documents submitted with this application are reviewed
                      here before Registrar approval.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold ${
                        darkMode
                          ? "bg-slate-800 text-slate-300"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {selectedDocumentSummary.uploaded}/
                      {selectedDocumentSummary.total} Uploaded
                    </span>

                    {selectedDocumentSummary.approved > 0 && (
                      <span className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                        {selectedDocumentSummary.approved} Approved
                      </span>
                    )}

                    {selectedDocumentSummary.needsRevision > 0 && (
                      <span className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300">
                        {selectedDocumentSummary.needsRevision} Need Revision
                      </span>
                    )}
                  </div>
                </div>

                {selectedRequiredDocumentTypes.length === 0 ? (
                  <div
                    className={`p-5 rounded-xl border text-center ${border}`}
                  >
                    <div className="text-3xl mb-2">📄</div>

                    <p className="font-semibold text-sm">
                      No document requirements found.
                    </p>

                    <p className={`text-xs mt-1 ${body}`}>
                      Check the configured document types and opportunity
                      requirements.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedRequiredDocumentTypes.map((documentType) => {
                      const document = getApplicationDocument(
                        selectedApplication.id,
                        documentType.id
                      );

                      return (
                        <div
                          key={documentType.id}
                          className={`rounded-xl border p-4 ${
                            darkMode
                              ? "border-slate-700 bg-slate-800/40"
                              : "border-slate-200 bg-slate-50/60"
                          }`}
                        >
                          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                            <div
                              className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                document
                                  ? darkMode
                                    ? "bg-emerald-950/40"
                                    : "bg-emerald-50"
                                  : darkMode
                                  ? "bg-red-950/40"
                                  : "bg-red-50"
                              }`}
                            >
                              {document
                                ? getDocumentIcon(document.file_name)
                                : "⚠️"}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="font-bold text-sm">
                                  {documentType.name}
                                </h4>

                                {documentType.required && (
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300">
                                    Required
                                  </span>
                                )}

                                <span
                                  className={`px-2 py-1 rounded-full border text-[9px] font-bold ${getDocumentStatusClass(
                                    document
                                  )}`}
                                >
                                  {getDocumentStatusLabel(document)}
                                </span>
                              </div>

                              {documentType.description && (
                                <p className={`text-xs mt-1 ${body}`}>
                                  {documentType.description}
                                </p>
                              )}

                              {document ? (
                                <div className="mt-2 space-y-1">
                                  <p
                                    className={`text-xs font-semibold truncate ${heading}`}
                                    title={document.file_name}
                                  >
                                    {document.file_name}
                                  </p>

                                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                                    <span className={`text-[10px] ${body}`}>
                                      Version {document.version || 1}
                                    </span>

                                    <span className={`text-[10px] ${body}`}>
                                      Uploaded{" "}
                                      {formatDocumentDate(document.created_at)}
                                    </span>

                                    {document.reviewed_at && (
                                      <span className={`text-[10px] ${body}`}>
                                        Reviewed{" "}
                                        {formatDocumentDate(
                                          document.reviewed_at
                                        )}
                                      </span>
                                    )}
                                  </div>

                                  {document.notes && (
                                    <p
                                      className={`text-xs mt-2 ${
                                        document.status ===
                                        STATUS.document.NEEDS_REVISION
                                          ? "text-red-600 dark:text-red-300"
                                          : body
                                      }`}
                                    >
                                      Note: {document.notes}
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <p className="text-xs mt-2 text-red-600 dark:text-red-300 font-semibold">
                                  Student has not uploaded this document yet.
                                </p>
                              )}
                            </div>

                            <div className="flex-shrink-0">
                              {document ? (
                                <button
                                  type="button"
                                  disabled={openingDocumentId === document.id}
                                  onClick={() => handleOpenDocument(document)}
                                  className={`w-full lg:w-auto px-4 py-2.5 rounded-xl border text-xs font-bold transition ${
                                    darkMode
                                      ? "border-slate-700 text-slate-300 hover:bg-slate-700"
                                      : "border-slate-200 text-slate-600 hover:bg-white"
                                  } disabled:opacity-50`}
                                >
                                  {openingDocumentId === document.id
                                    ? "Opening..."
                                    : "View Document"}
                                </button>
                              ) : (
                                <span
                                  className={`inline-flex px-3 py-2 rounded-lg text-[10px] font-bold ${
                                    darkMode
                                      ? "bg-red-950/30 text-red-300"
                                      : "bg-red-50 text-red-600"
                                  }`}
                                >
                                  Missing
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* ADDITIONAL UPLOADED DOCUMENTS */}

                {selectedApplicationDocuments.filter(
                  (document) =>
                    !selectedRequiredDocumentTypes.some(
                      (documentType) =>
                        documentType.id === document.document_type_id
                    )
                ).length > 0 && (
                  <div className="mt-5">
                    <h4 className="font-bold text-sm mb-3">
                      Additional Uploaded Documents
                    </h4>

                    <div className="space-y-2">
                      {selectedApplicationDocuments
                        .filter(
                          (document) =>
                            !selectedRequiredDocumentTypes.some(
                              (documentType) =>
                                documentType.id === document.document_type_id
                            )
                        )
                        .map((document) => {
                          const documentType = documentTypes.find(
                            (type) => type.id === document.document_type_id
                          );

                          return (
                            <div
                              key={document.id}
                              className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${border}`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                                  {getDocumentIcon(document.file_name)}
                                </div>

                                <div className="min-w-0">
                                  <p className="text-xs font-bold">
                                    {documentType?.name ||
                                      "Additional Document"}
                                  </p>

                                  <p className={`text-[10px] truncate ${body}`}>
                                    {document.file_name}
                                  </p>
                                </div>
                              </div>

                              <button
                                type="button"
                                disabled={openingDocumentId === document.id}
                                onClick={() => handleOpenDocument(document)}
                                className={`px-3 py-2 rounded-lg border text-xs font-bold flex-shrink-0 ${
                                  darkMode
                                    ? "border-slate-700 text-slate-300 hover:bg-slate-700"
                                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                                } disabled:opacity-50`}
                              >
                                {openingDocumentId === document.id
                                  ? "Opening..."
                                  : "View"}
                              </button>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </section>

              {/* =================================================
                  COMPANY INFORMATION
              ================================================= */}

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
                      {selectedApplication.opportunities?.companies?.industry ||
                        "N/A"}
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

                    <p className="text-sm font-semibold mt-1 break-all">
                      {selectedApplication.opportunities?.companies
                        ?.company_email || "N/A"}
                    </p>
                  </div>

                  <div
                    className={`p-3 rounded-xl border sm:col-span-2 ${border}`}
                  >
                    <p className={`text-[9px] uppercase font-bold ${body}`}>
                      Website
                    </p>

                    <p className="text-sm font-semibold mt-1 break-all">
                      {selectedApplication.opportunities?.companies?.website ||
                        "N/A"}
                    </p>
                  </div>
                </div>
              </section>

              {/* =================================================
                  REVIEW NOTES
              ================================================= */}

              {selectedApplication.notes && (
                <section>
                  <h3 className="font-bold mb-3">Registrar Notes</h3>

                  <div
                    className={`p-4 rounded-xl border ${
                      darkMode
                        ? "border-blue-900 bg-blue-950/20"
                        : "border-blue-200 bg-blue-50"
                    }`}
                  >
                    <p className="text-sm leading-6 whitespace-pre-wrap">
                      {selectedApplication.notes}
                    </p>
                  </div>
                </section>
              )}

              {/* =================================================
                  ACTIONS
              ================================================= */}

              <div className={`pt-5 border-t ${border}`}>
                <div className="flex flex-col-reverse sm:flex-row sm:flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedApplication(null);
                      setIsProfilePhotoExpanded(false);
                    }}
                    className={`px-4 py-2.5 rounded-xl border text-xs font-bold ${
                      darkMode
                        ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    Close
                  </button>

                  <button
                    type="button"
                    disabled={processingId === selectedApplication.id}
                    onClick={() =>
                      handleRequestInformation(selectedApplication)
                    }
                    className="px-4 py-2.5 rounded-xl border border-blue-200 text-blue-600 text-xs font-bold hover:bg-blue-50 disabled:opacity-50"
                  >
                    Request Information
                  </button>

                  <button
                    type="button"
                    disabled={processingId === selectedApplication.id}
                    onClick={() => handleReject(selectedApplication)}
                    className="px-4 py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 disabled:opacity-50"
                  >
                    Reject
                  </button>

                  <button
                    type="button"
                    disabled={processingId === selectedApplication.id}
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

      {/* =======================================================
          EXPANDED PROFILE PHOTO
      ======================================================= */}

      {isProfilePhotoExpanded &&
        selectedApplication &&
        getStudentProfilePhoto(selectedApplication.students) && (
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-5 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsProfilePhotoExpanded(false)}
          >
            <div
              className="relative max-w-[90vw] max-h-[90vh]"
              onClick={(event) => event.stopPropagation()}
            >
              <img
                src={getStudentProfilePhoto(selectedApplication.students)}
                alt={`${getStudentName(selectedApplication.students)} profile`}
                className="max-w-[90vw] max-h-[85vh] object-contain rounded-2xl shadow-2xl"
              />

              <button
                type="button"
                onClick={() => setIsProfilePhotoExpanded(false)}
                className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-white text-slate-900 text-xl font-bold shadow-lg hover:bg-slate-100"
              >
                ×
              </button>
            </div>
          </div>
        )}
    </div>
  );
}
