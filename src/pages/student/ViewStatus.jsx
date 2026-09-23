import React, { useEffect, useMemo, useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { supabaseStudent } from "../../supabaseClient";

/* =========================================================
   STATUS
========================================================= */

const STATUS = {
  application: {
    DRAFT: "draft",
    SUBMITTED: "submitted",
    UNDER_REVIEW: "under_review",
    INFO_REQUESTED: "info_requested",
    APPROVED: "approved",
    ACCEPTED: "accepted",
    REJECTED: "rejected",
    WITHDRAWN: "withdrawn",
  },

  assignment: {
    PENDING: "pending",
    ACTIVE: "active",
    COMPLETED: "completed",
    SUSPENDED: "suspended",
    TERMINATED: "terminated",
  },

  document: {
    NOT_SUBMITTED: "not_submitted",
    SUBMITTED: "submitted",
    PENDING_REVIEW: "pending_review",
    APPROVED: "approved",
    NEEDS_REVISION: "needs_revision",
  },
};

/* =========================================================
   HELPERS
========================================================= */

const formatStatus = (status) => {
  if (!status) return "Unknown";

  return String(status)
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

/* =========================================================
   INTERNSHIP POSITION RESOLVER
========================================================= */

const getInternshipPosition = (assignment, application, opportunity) => {
  const candidates = [
    assignment?.position,
    assignment?.internship_position,
    assignment?.job_title,
    assignment?.position_title,
    assignment?.title,

    application?.position,
    application?.internship_position,
    application?.job_title,
    application?.position_title,

    opportunity?.title,
    opportunity?.position,
    opportunity?.internship_position,
    opportunity?.job_title,
    opportunity?.position_title,
  ];

  const position = candidates.find(
    (value) =>
      value !== null && value !== undefined && String(value).trim() !== ""
  );

  return position ? String(position).trim() : "Not specified";
};

/* =========================================================
   COMPANY RESOLVER
========================================================= */

const getCompanyId = (assignment, application, opportunity) => {
  return (
    assignment?.company_id ||
    application?.company_id ||
    opportunity?.company_id ||
    null
  );
};

/* =========================================================
   REJECTION INFO
========================================================= */

const getRejectionInfo = (application) => {
  const notes = application?.notes?.trim() || "";

  if (notes.includes("Company rejected the internship placement.")) {
    const reasonIndex = notes.lastIndexOf("Reason:");

    return {
      source: "Company",
      reason:
        reasonIndex !== -1
          ? notes.substring(reasonIndex + "Reason:".length).trim()
          : notes,
    };
  }

  return {
    source: "Registrar",
    reason: notes || "No rejection reason was provided.",
  };
};

/* =========================================================
   DATE HELPERS
========================================================= */

const formatDate = (date) => {
  if (!date) return "Not specified";

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

const formatPeriod = (assignment, opportunity) => {
  const start =
    assignment?.start_date ||
    opportunity?.internship_start_date ||
    opportunity?.internship_start;

  const end =
    assignment?.end_date ||
    opportunity?.internship_end_date ||
    opportunity?.internship_end;

  if (start && end) {
    return `${formatDate(start)} – ${formatDate(end)}`;
  }

  if (start) {
    return `${formatDate(start)} – Not specified`;
  }

  if (end) {
    return `Not specified – ${formatDate(end)}`;
  }

  return "Not specified";
};

/* =========================================================
   INTERNSHIP PROGRESS CALCULATOR
========================================================= */

const getInternshipProgress = (assignment) => {
  if (!assignment) {
    return 0;
  }

  const assignmentStatus = assignment.status;

  if (assignmentStatus === STATUS.assignment.COMPLETED) {
    return 100;
  }

  if (assignmentStatus === STATUS.assignment.TERMINATED) {
    return 0;
  }

  const isDeployed =
    Boolean(assignment.deployed_at) ||
    assignmentStatus === STATUS.assignment.ACTIVE ||
    assignmentStatus === STATUS.assignment.SUSPENDED;

  if (!isDeployed) {
    return 0;
  }

  const startDate = assignment.start_date;
  const endDate = assignment.end_date;

  if (!startDate || !endDate) {
    return 0;
  }

  const start = new Date(`${String(startDate).split("T")[0]}T00:00:00`);

  const end = new Date(`${String(endDate).split("T")[0]}T23:59:59`);

  const now = new Date();

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 0;
  }

  if (end.getTime() <= start.getTime()) {
    return 0;
  }

  if (now.getTime() < start.getTime()) {
    return 0;
  }

  if (now.getTime() >= end.getTime()) {
    return 100;
  }

  const totalDuration = end.getTime() - start.getTime();
  const elapsedDuration = now.getTime() - start.getTime();

  const percentage = (elapsedDuration / totalDuration) * 100;

  return Math.min(100, Math.max(0, Math.round(percentage)));
};

/* =========================================================
   COMPONENT
========================================================= */

export default function ViewStatus() {
  const { darkMode } = useOutletContext();
  const navigate = useNavigate();

  /* =======================================================
     STATE
  ======================================================= */

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [student, setStudent] = useState(null);
  const [applications, setApplications] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [certificates, setCertificates] = useState([]);

  const [selectedApplicationId, setSelectedApplicationId] = useState("");

  /* =======================================================
     LOAD DATA
  ======================================================= */

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      /* ---------------------------------------------------
         AUTH USER
      --------------------------------------------------- */

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

      /* ---------------------------------------------------
         STUDENT
      --------------------------------------------------- */

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

      /* ---------------------------------------------------
         APPLICATIONS
      --------------------------------------------------- */

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

      /* ---------------------------------------------------
         ASSIGNMENTS
      --------------------------------------------------- */

      const { data: assignmentData, error: assignmentError } =
        await supabaseStudent
          .from("assignments")
          .select("*")
          .eq("student_id", user.id)
          .in("status", [
            STATUS.assignment.PENDING,
            STATUS.assignment.ACTIVE,
            STATUS.assignment.COMPLETED,
            STATUS.assignment.SUSPENDED,
            STATUS.assignment.TERMINATED,
          ])
          .order("created_at", {
            ascending: false,
          });

      if (assignmentError) {
        throw assignmentError;
      }

      setAssignments(assignmentData || []);

      /* ---------------------------------------------------
         CERTIFICATES
      --------------------------------------------------- */

      const { data: certificateData, error: certificateError } =
        await supabaseStudent
          .from("certificates")
          .select(
            `
          id,
          assignment_id,
          student_id,
          company_id,
          certificate_number,
          issued_at,
          certificate_url,
          school_id,
          school_logo_url
        `
          )
          .eq("student_id", user.id)
          .order("issued_at", {
            ascending: false,
          });

      if (certificateError) {
        console.error("Certificate loading error:", certificateError);

        setCertificates([]);
      } else {
        setCertificates(certificateData || []);
      }

      /* ---------------------------------------------------
         DOCUMENTS

         Documents now belong to the APPLICATION.

         assignment_id remains supported for older records.
      --------------------------------------------------- */

      const { data: documentData, error: documentError } = await supabaseStudent
        .from("documents")
        .select("*")
        .eq("student_id", user.id)
        .order("created_at", {
          ascending: false,
        });

      if (documentError) {
        throw documentError;
      }

      setDocuments(documentData || []);

      /* ---------------------------------------------------
         DOCUMENT TYPES
      --------------------------------------------------- */

      const { data: documentTypeData, error: documentTypeError } =
        await supabaseStudent
          .from("document_types")
          .select("*")
          .order("created_at", {
            ascending: true,
          });

      if (documentTypeError) {
        throw documentTypeError;
      }

      setDocumentTypes(documentTypeData || []);

      /* ---------------------------------------------------
         OPPORTUNITIES
      --------------------------------------------------- */

      const opportunityIds = [
        ...new Set([
          ...(applicationData || [])
            .map((item) => item.opportunity_id)
            .filter(Boolean),

          ...(assignmentData || [])
            .map((item) => item.opportunity_id)
            .filter(Boolean),
        ]),
      ];

      let loadedOpportunities = [];

      if (opportunityIds.length > 0) {
        const { data: opportunityData, error: opportunityError } =
          await supabaseStudent
            .from("opportunities")
            .select("*")
            .in("id", opportunityIds);

        if (opportunityError) {
          throw opportunityError;
        }

        loadedOpportunities = opportunityData || [];
      }

      setOpportunities(loadedOpportunities);

      /* ---------------------------------------------------
         COMPANIES
      --------------------------------------------------- */

      const companyIds = [
        ...new Set([
          ...(loadedOpportunities || [])
            .map((item) => item.company_id)
            .filter(Boolean),

          ...(assignmentData || [])
            .map((item) => item.company_id)
            .filter(Boolean),

          ...(applicationData || [])
            .map((item) => item.company_id)
            .filter(Boolean),
        ]),
      ];

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

        setCompanies(companyData || []);
      } else {
        setCompanies([]);
      }
    } catch (error) {
      console.error("Error loading internship status:", error);

      alert(error.message || "Unable to load your internship status.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /* =======================================================
     APPLICATION OPTIONS
  ======================================================= */

  const applicationOptions = useMemo(() => {
    const assignmentPriority = {
      [STATUS.assignment.ACTIVE]: 5,
      [STATUS.assignment.PENDING]: 4,
      [STATUS.assignment.SUSPENDED]: 3,
      [STATUS.assignment.COMPLETED]: 2,
      [STATUS.assignment.TERMINATED]: 1,
    };

    const applicationPriority = {
      [STATUS.application.APPROVED]: 5,
      [STATUS.application.ACCEPTED]: 5,
      [STATUS.application.UNDER_REVIEW]: 4,
      [STATUS.application.SUBMITTED]: 4,
      [STATUS.application.INFO_REQUESTED]: 4,
      [STATUS.application.DRAFT]: 3,
      [STATUS.application.REJECTED]: 1,
      [STATUS.application.WITHDRAWN]: 0,
    };

    const options = applications.map((application) => {
      let assignment = null;

      if (application.id) {
        assignment =
          assignments.find((item) => item.application_id === application.id) ||
          null;
      }

      if (!assignment && application.opportunity_id) {
        const legacyMatches = assignments.filter(
          (item) =>
            !item.application_id &&
            item.opportunity_id === application.opportunity_id
        );

        if (legacyMatches.length === 1) {
          assignment = legacyMatches[0];
        }
      }

      const opportunityId =
        assignment?.opportunity_id || application.opportunity_id || null;

      const opportunity =
        opportunities.find((item) => item.id === opportunityId) || null;

      const companyId = getCompanyId(assignment, application, opportunity);

      const company = companies.find((item) => item.id === companyId) || null;

      const position = getInternshipPosition(
        assignment,
        application,
        opportunity
      );

      const assignmentPriorityValue = assignment
        ? assignmentPriority[assignment.status] || 0
        : 0;

      const applicationPriorityValue =
        applicationPriority[application.status] || 0;

      return {
        application,
        assignment,
        opportunity,
        company,
        position,
        assignmentPriority: assignmentPriorityValue,
        applicationPriority: applicationPriorityValue,
      };
    });

    return options.sort((a, b) => {
      if (a.assignmentPriority !== b.assignmentPriority) {
        return b.assignmentPriority - a.assignmentPriority;
      }

      if (a.applicationPriority !== b.applicationPriority) {
        return b.applicationPriority - a.applicationPriority;
      }

      return (
        new Date(b.application.created_at || 0).getTime() -
        new Date(a.application.created_at || 0).getTime()
      );
    });
  }, [applications, assignments, opportunities, companies]);

  /* =======================================================
     DEFAULT SELECTED APPLICATION
  ======================================================= */

  useEffect(() => {
    if (!applicationOptions.length) {
      setSelectedApplicationId("");
      return;
    }

    const selectedStillExists =
      selectedApplicationId &&
      applicationOptions.some(
        (option) => option.application.id === selectedApplicationId
      );

    if (!selectedStillExists) {
      setSelectedApplicationId(applicationOptions[0].application.id);
    }
  }, [applicationOptions, selectedApplicationId]);

  /* =======================================================
     SELECTED OPTION
  ======================================================= */

  const selectedOption = useMemo(() => {
    if (!selectedApplicationId) {
      return null;
    }

    return (
      applicationOptions.find(
        (option) => option.application.id === selectedApplicationId
      ) || null
    );
  }, [applicationOptions, selectedApplicationId]);

  const selectedApplication = selectedOption?.application || null;

  const selectedAssignment = selectedOption?.assignment || null;

  const selectedOpportunity = selectedOption?.opportunity || null;

  const selectedCompany = selectedOption?.company || null;

  const selectedPosition = useMemo(() => {
    return getInternshipPosition(
      selectedAssignment,
      selectedApplication,
      selectedOpportunity
    );
  }, [selectedAssignment, selectedApplication, selectedOpportunity]);

  /* =======================================================
     SELECTED CERTIFICATE
  ======================================================= */

  const selectedCertificate = useMemo(() => {
    if (!selectedAssignment?.id) {
      return null;
    }

    return (
      certificates.find(
        (certificate) => certificate.assignment_id === selectedAssignment.id
      ) || null
    );
  }, [certificates, selectedAssignment]);

  /* =======================================================
     SELECTED DOCUMENTS

     NEW WORKFLOW:

       Application + Documents
              ↓
          Submit
              ↓
       Registrar Review
              ↓
          Approval
              ↓
         Assignment

     application_id is the primary relationship.

     assignment_id is only a legacy fallback.
  ======================================================= */

  const placementDocuments = useMemo(() => {
    if (!selectedApplication?.id) {
      return [];
    }

    const applicationDocuments = documents.filter(
      (document) => document.application_id === selectedApplication.id
    );

    if (applicationDocuments.length > 0) {
      return applicationDocuments;
    }

    if (selectedAssignment?.id) {
      return documents.filter(
        (document) => document.assignment_id === selectedAssignment.id
      );
    }

    return [];
  }, [documents, selectedApplication, selectedAssignment]);

  /* =======================================================
     DOCUMENT PROGRESS

     Documents are NOT a separate workflow stage.

     They are part of the application.
  ======================================================= */

  const documentProgress = useMemo(() => {
    const requiredTypes = documentTypes.filter(
      (type) => type.required === true
    );

    if (!selectedApplication?.id) {
      return {
        status: "not_started",
        label: "Not Started",
        description:
          "Submit an internship application with the required documents.",
        submitted: 0,
        approved: 0,
        required: requiredTypes.length,
        percentage: 0,
        hasRevision: false,
      };
    }

    /* -----------------------------------------------------
       NO REQUIRED DOCUMENT TYPES
    ----------------------------------------------------- */

    if (requiredTypes.length === 0) {
      if (placementDocuments.length === 0) {
        return {
          status: "not_started",
          label: "No Documents Required",
          description:
            "There are currently no required internship documents for this application.",
          submitted: 0,
          approved: 0,
          required: 0,
          percentage: 100,
          hasRevision: false,
        };
      }

      const approvedCount = placementDocuments.filter(
        (document) => document.status === STATUS.document.APPROVED
      ).length;

      const hasRevision = placementDocuments.some(
        (document) => document.status === STATUS.document.NEEDS_REVISION
      );

      const allApproved =
        placementDocuments.length > 0 &&
        approvedCount === placementDocuments.length;

      const percentage =
        placementDocuments.length > 0
          ? Math.round((approvedCount / placementDocuments.length) * 100)
          : 0;

      if (allApproved) {
        return {
          status: "approved",
          label: "Documents Approved",
          description: "All submitted internship documents have been approved.",
          submitted: placementDocuments.length,
          approved: approvedCount,
          required: placementDocuments.length,
          percentage: 100,
          hasRevision: false,
        };
      }

      if (hasRevision) {
        return {
          status: "needs_revision",
          label: "Revision Required",
          description:
            "One or more documents need to be revised and resubmitted.",
          submitted: placementDocuments.length,
          approved: approvedCount,
          required: placementDocuments.length,
          percentage,
          hasRevision: true,
        };
      }

      return {
        status: "pending_review",
        label: "Pending Review",
        description: "Your submitted documents are currently being reviewed.",
        submitted: placementDocuments.length,
        approved: approvedCount,
        required: placementDocuments.length,
        percentage,
        hasRevision: false,
      };
    }

    /* -----------------------------------------------------
       LATEST DOCUMENT PER REQUIRED TYPE
    ----------------------------------------------------- */

    const latestDocuments = requiredTypes.map((type) => {
      const matches = placementDocuments
        .filter((document) => document.document_type_id === type.id)
        .sort(
          (a, b) =>
            new Date(b.created_at || 0).getTime() -
            new Date(a.created_at || 0).getTime()
        );

      return matches[0] || null;
    });

    const submittedCount = latestDocuments.filter(Boolean).length;

    const approvedCount = latestDocuments.filter(
      (document) => document?.status === STATUS.document.APPROVED
    ).length;

    const hasRevision = latestDocuments.some(
      (document) => document?.status === STATUS.document.NEEDS_REVISION
    );

    const allSubmitted = submittedCount === requiredTypes.length;

    const allApproved =
      submittedCount === requiredTypes.length &&
      approvedCount === requiredTypes.length;

    const percentage =
      requiredTypes.length > 0
        ? Math.round((approvedCount / requiredTypes.length) * 100)
        : 0;

    if (allApproved) {
      return {
        status: "approved",
        label: "Application & Documents Approved",
        description:
          "Your application and all required internship documents have been approved by the Registrar Adviser.",
        submitted: submittedCount,
        approved: approvedCount,
        required: requiredTypes.length,
        percentage: 100,
        hasRevision: false,
      };
    }

    if (hasRevision) {
      return {
        status: "needs_revision",
        label: "Document Revision Required",
        description:
          "One or more required documents need revision and must be resubmitted.",
        submitted: submittedCount,
        approved: approvedCount,
        required: requiredTypes.length,
        percentage,
        hasRevision: true,
      };
    }

    if (allSubmitted) {
      return {
        status: "pending_review",
        label: "Application & Documents Under Review",
        description:
          "Your application and all required documents have been submitted and are awaiting Registrar review.",
        submitted: submittedCount,
        approved: approvedCount,
        required: requiredTypes.length,
        percentage,
        hasRevision: false,
      };
    }

    if (submittedCount > 0) {
      return {
        status: "in_progress",
        label: "Documents Incomplete",
        description:
          "Some required documents are still missing from your application.",
        submitted: submittedCount,
        approved: approvedCount,
        required: requiredTypes.length,
        percentage,
        hasRevision: false,
      };
    }

    return {
      status: "not_started",
      label: "Documents Not Submitted",
      description:
        "Required internship documents must be submitted together with your application.",
      submitted: 0,
      approved: 0,
      required: requiredTypes.length,
      percentage: 0,
      hasRevision: false,
    };
  }, [documentTypes, selectedApplication, placementDocuments]);

  /* =======================================================
     APPLICATION STATUS
  ======================================================= */

  const applicationStatus = selectedApplication?.status;

  /* =======================================================
     OVERALL STATUS
  ======================================================= */

  const overallStatus = useMemo(() => {
    /* COMPLETED */

    if (selectedAssignment?.status === STATUS.assignment.COMPLETED) {
      return {
        key: "completed",
        title: "Internship Completed",
        subtitle:
          "Congratulations! You have successfully completed your internship.",
        icon: "🎓",
        tone: "emerald",
      };
    }

    /* SUSPENDED */

    if (selectedAssignment?.status === STATUS.assignment.SUSPENDED) {
      return {
        key: "suspended",
        title: "Internship Suspended",
        subtitle:
          "Your internship placement is currently suspended. Please contact your Registrar Adviser for assistance.",
        icon: "⏸️",
        tone: "amber",
      };
    }

    /* TERMINATED */

    if (selectedAssignment?.status === STATUS.assignment.TERMINATED) {
      return {
        key: "terminated",
        title: "Placement Terminated",
        subtitle: "This internship placement has been terminated.",
        icon: "⚠️",
        tone: "red",
      };
    }

    /* ACTIVE */

    if (selectedAssignment?.status === STATUS.assignment.ACTIVE) {
      return {
        key: "active",
        title: "Internship Active",
        subtitle:
          "You are currently completing your internship at your assigned company.",
        icon: "💼",
        tone: "blue",
      };
    }

    /* DEPLOYED BUT COMPANY HAS NOT ACCEPTED */

    if (
      selectedAssignment?.status === STATUS.assignment.PENDING &&
      selectedAssignment?.deployed_at
    ) {
      return {
        key: "deployed",
        title: "Deployed — Waiting for Company",
        subtitle:
          "You have been deployed to the company. Please wait for the company to accept your placement.",
        icon: "🚀",
        tone: "blue",
      };
    }

    /* ASSIGNMENT EXISTS */

    if (selectedAssignment?.status === STATUS.assignment.PENDING) {
      return {
        key: "confirmed",
        title: "Placement Confirmed",
        subtitle:
          "Your internship placement has been confirmed. Your Registrar Adviser will deploy you to the company.",
        icon: "✅",
        tone: "emerald",
      };
    }

    /* APPLICATION APPROVED */

    if (
      applicationStatus === STATUS.application.APPROVED ||
      applicationStatus === STATUS.application.ACCEPTED
    ) {
      return {
        key: "approved",
        title: "Application Approved",
        subtitle:
          "Your application and required documents have been approved. Your internship placement is awaiting assignment.",
        icon: "🎉",
        tone: "blue",
      };
    }

    /* INFORMATION REQUESTED */

    if (applicationStatus === STATUS.application.INFO_REQUESTED) {
      return {
        key: "info_requested",
        title: "Information Requested",
        subtitle:
          "The Registrar Adviser requested additional information or corrections for your application.",
        icon: "📝",
        tone: "amber",
      };
    }

    /* UNDER REVIEW */

    if (
      applicationStatus === STATUS.application.UNDER_REVIEW ||
      applicationStatus === STATUS.application.SUBMITTED
    ) {
      if (documentProgress.status === "needs_revision") {
        return {
          key: "documents_revision",
          title: "Document Revision Required",
          subtitle: documentProgress.description,
          icon: "⚠️",
          tone: "amber",
        };
      }

      if (
        documentProgress.required > 0 &&
        documentProgress.submitted < documentProgress.required
      ) {
        return {
          key: "under_review",
          title: "Application Incomplete",
          subtitle:
            "Your application has been saved or submitted, but some required internship documents are still missing.",
          icon: "📄",
          tone: "amber",
        };
      }

      return {
        key: "under_review",
        title: "Application & Documents Under Review",
        subtitle:
          "Your application and submitted internship documents are being reviewed by the Registrar Adviser.",
        icon: "⏳",
        tone: "amber",
      };
    }

    /* REJECTED */

    if (applicationStatus === STATUS.application.REJECTED) {
      const rejectionInfo = getRejectionInfo(selectedApplication);

      return {
        key: "rejected",
        title: `Application Rejected by ${rejectionInfo.source}`,
        subtitle: rejectionInfo.reason,
        icon: "❌",
        tone: "red",
      };
    }

    /* WITHDRAWN */

    if (applicationStatus === STATUS.application.WITHDRAWN) {
      return {
        key: "withdrawn",
        title: "Application Withdrawn",
        subtitle: "This application has been withdrawn.",
        icon: "↩️",
        tone: "slate",
      };
    }

    /* DRAFT */

    if (applicationStatus === STATUS.application.DRAFT) {
      return {
        key: "draft",
        title: "Draft Application",
        subtitle:
          "Your application has been saved as a draft and has not yet been submitted.",
        icon: "📄",
        tone: "slate",
      };
    }

    /* NO APPLICATION */

    return {
      key: "none",
      title: "No Internship Application",
      subtitle: "You have not submitted an internship application yet.",
      icon: "📋",
      tone: "slate",
    };
  }, [
    selectedAssignment,
    applicationStatus,
    selectedApplication,
    documentProgress,
  ]);

  /* =======================================================
     PROGRESS STEPS
  ======================================================= */

  const progressSteps = useMemo(() => {
    const assignmentStatus = selectedAssignment?.status;

    const hasApplication = Boolean(selectedApplication);

    const isDraft = applicationStatus === STATUS.application.DRAFT;

    const isSubmitted =
      applicationStatus === STATUS.application.SUBMITTED ||
      applicationStatus === STATUS.application.UNDER_REVIEW;

    const isInfoRequested =
      applicationStatus === STATUS.application.INFO_REQUESTED;

    const isRejected = applicationStatus === STATUS.application.REJECTED;

    const isWithdrawn = applicationStatus === STATUS.application.WITHDRAWN;

    const isApplicationApproved =
      applicationStatus === STATUS.application.APPROVED ||
      applicationStatus === STATUS.application.ACCEPTED;

    const hasAssignment = Boolean(selectedAssignment);

    const isPlacementConfirmed =
      hasAssignment && assignmentStatus !== STATUS.assignment.TERMINATED;

    const isDeployed = Boolean(selectedAssignment?.deployed_at);

    const isActive = assignmentStatus === STATUS.assignment.ACTIVE;

    const isSuspended = assignmentStatus === STATUS.assignment.SUSPENDED;

    const isCompleted = assignmentStatus === STATUS.assignment.COMPLETED;

    const isTerminated = assignmentStatus === STATUS.assignment.TERMINATED;

    const applicationCompleted = isApplicationApproved || hasAssignment;

    let currentStage = null;

    /* -----------------------------------------------------
       DETERMINE CURRENT STAGE
    ----------------------------------------------------- */

    if (!hasApplication) {
      currentStage = null;
    } else if (
      isDraft ||
      isSubmitted ||
      isInfoRequested ||
      isRejected ||
      isWithdrawn
    ) {
      currentStage = "application";
    } else if (isTerminated) {
      currentStage = null;
    } else if (!applicationCompleted) {
      currentStage = "application";
    } else if (!hasAssignment) {
      currentStage = "confirmed";
    } else if (!isDeployed) {
      currentStage = "deployed";
    } else if (isSuspended || (!isActive && !isCompleted)) {
      currentStage = "active";
    } else if (isActive) {
      currentStage = "active";
    }

    const getStepStatus = (stepKey, completed) => {
      if (completed) {
        return "Completed";
      }

      if (currentStage === stepKey) {
        if (stepKey === "application") {
          if (isDraft) {
            return "Draft";
          }

          if (isInfoRequested) {
            return "Action Required";
          }

          if (isRejected) {
            return "Rejected";
          }

          if (isWithdrawn) {
            return "Withdrawn";
          }

          return "Under Review";
        }

        if (stepKey === "confirmed") {
          return "Awaiting Placement";
        }

        if (stepKey === "deployed") {
          return "Ready for Deployment";
        }

        if (stepKey === "active") {
          if (isSuspended) {
            return "Suspended";
          }

          return "Waiting for Company";
        }
      }

      if (!hasApplication) {
        return "Not Started";
      }

      if (isRejected || isWithdrawn) {
        return "Not Applicable";
      }

      if (isTerminated) {
        return "Terminated";
      }

      return "Not Started";
    };

    return [
      /* ===================================================
         APPLICATION + DOCUMENTS
      =================================================== */

      {
        key: "application",
        label: "Application",
        description: !hasApplication
          ? "Submit an internship application with the required documents to begin the internship process."
          : isDraft
          ? "Your internship application and required documents are saved as a draft and have not been submitted."
          : isSubmitted
          ? "Your internship application and required documents have been submitted and are currently being reviewed."
          : isInfoRequested
          ? "The Registrar Adviser requested additional information or corrections for your application."
          : isRejected
          ? "Your internship application was rejected."
          : isWithdrawn
          ? "This internship application has been withdrawn."
          : "Your internship application and required documents have been approved.",
        icon: "📝",
        completed: applicationCompleted,
        current: currentStage === "application",
        statusLabel: getStepStatus("application", applicationCompleted),
      },

      /* ===================================================
         PLACEMENT
      =================================================== */

      {
        key: "confirmed",
        label: "Placement Confirmed",
        description: !hasApplication
          ? "This stage becomes available after you submit an application and it is approved."
          : !isApplicationApproved && !hasAssignment
          ? "Your application and required documents must be approved before an internship placement can be confirmed."
          : !hasAssignment
          ? "Your application is approved. Confirm the internship placement on View Opportunities/View Application Status to proceed."
          : "Your internship placement has been confirmed.",
        icon: "✅",
        completed: isPlacementConfirmed,
        current: currentStage === "confirmed",
        statusLabel: getStepStatus("confirmed", isPlacementConfirmed),
      },

      /* ===================================================
         DEPLOYMENT
      =================================================== */

      {
        key: "deployed",
        label: "Deployed to Company",
        description: !hasApplication
          ? "Deployment will happen after your application and placement requirements are completed."
          : !hasAssignment
          ? "Waiting for your internship placement to be confirmed."
          : isDeployed
          ? "You have been officially deployed to the company."
          : "Your placement is ready for deployment by the Registrar Adviser.",
        icon: "🚀",
        completed: isDeployed,
        current: currentStage === "deployed",
        statusLabel: getStepStatus("deployed", isDeployed),
      },

      /* ===================================================
         ACTIVE
      =================================================== */

      {
        key: "active",
        label: "Internship Active",
        description: !hasApplication
          ? "Your internship becomes active after you complete the application and deployment process."
          : !isDeployed
          ? "Your internship will become active after you are deployed to the company."
          : isSuspended
          ? "Your internship is currently suspended. Please contact your Registrar Adviser."
          : isActive
          ? "The company accepted your placement and your internship is currently active."
          : isCompleted
          ? "Your internship was completed successfully."
          : "Waiting for the company to accept your placement.",
        icon: "💼",
        completed: isActive || isCompleted,
        current: currentStage === "active",
        statusLabel: getStepStatus("active", isActive || isCompleted),
      },

      /* ===================================================
         COMPLETED
      =================================================== */

      {
        key: "completed",
        label: "Internship Completed",
        description: isCompleted
          ? "You successfully completed your internship."
          : isTerminated
          ? "This internship placement was terminated before completion."
          : isSuspended
          ? "Your internship must resume and be completed before this stage can be finished."
          : !hasApplication
          ? "Complete the internship process to reach this stage."
          : "This stage will be completed when the company marks your internship as complete.",
        icon: "🎓",
        completed: isCompleted,
        current: false,
        statusLabel: isCompleted
          ? "Completed"
          : isTerminated
          ? "Terminated"
          : !hasApplication
          ? "Not Started"
          : "Not Started",
      },
    ];
  }, [selectedApplication, selectedAssignment, applicationStatus]);

  /* =======================================================
     INTERNSHIP PROGRESS PERCENTAGE
  ======================================================= */

  const progressPercentage = useMemo(() => {
    return getInternshipProgress(selectedAssignment);
  }, [selectedAssignment]);

  /* =======================================================
     STATUS TONE CLASSES
  ======================================================= */

  const toneClasses = useMemo(() => {
    const tones = {
      emerald: {
        wrapper: darkMode
          ? "border-emerald-800 bg-emerald-950/30"
          : "border-emerald-200 bg-emerald-50",

        icon: darkMode
          ? "bg-emerald-900/60 text-emerald-300"
          : "bg-emerald-100 text-emerald-700",

        title: darkMode ? "text-emerald-300" : "text-emerald-700",

        text: darkMode ? "text-emerald-200" : "text-emerald-800",
      },

      blue: {
        wrapper: darkMode
          ? "border-blue-800 bg-blue-950/30"
          : "border-blue-200 bg-blue-50",

        icon: darkMode
          ? "bg-blue-900/60 text-blue-300"
          : "bg-blue-100 text-blue-700",

        title: darkMode ? "text-blue-300" : "text-blue-700",

        text: darkMode ? "text-blue-200" : "text-blue-800",
      },

      amber: {
        wrapper: darkMode
          ? "border-amber-800 bg-amber-950/30"
          : "border-amber-200 bg-amber-50",

        icon: darkMode
          ? "bg-amber-900/60 text-amber-300"
          : "bg-amber-100 text-amber-700",

        title: darkMode ? "text-amber-300" : "text-amber-700",

        text: darkMode ? "text-amber-200" : "text-amber-800",
      },

      red: {
        wrapper: darkMode
          ? "border-red-800 bg-red-950/30"
          : "border-red-200 bg-red-50",

        icon: darkMode
          ? "bg-red-900/60 text-red-300"
          : "bg-red-100 text-red-700",

        title: darkMode ? "text-red-300" : "text-red-700",

        text: darkMode ? "text-red-200" : "text-red-800",
      },

      slate: {
        wrapper: darkMode
          ? "border-slate-700 bg-slate-900"
          : "border-slate-200 bg-slate-50",

        icon: darkMode
          ? "bg-slate-800 text-slate-300"
          : "bg-slate-200 text-slate-700",

        title: darkMode ? "text-slate-200" : "text-slate-700",

        text: darkMode ? "text-slate-400" : "text-slate-600",
      },
    };

    return tones[overallStatus.tone] || tones.slate;
  }, [darkMode, overallStatus.tone]);

  /* =======================================================
     CARD STYLE
  ======================================================= */

  const cardClass = darkMode
    ? "bg-slate-900 border-slate-700"
    : "bg-white border-slate-200";

  const headingClass = darkMode ? "text-slate-100" : "text-slate-900";

  const mutedClass = darkMode ? "text-slate-400" : "text-slate-500";

  const borderClass = darkMode ? "border-slate-700" : "border-slate-200";

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div
        className={`p-5 md:p-6 lg:p-8 max-w-[1600px] mx-auto ${
          darkMode ? "text-slate-100" : "text-slate-900"
        }`}
      >
        <div className={`border rounded-2xl p-10 text-center ${cardClass}`}>
          <div className="text-3xl mb-3">⏳</div>

          <h2 className="text-lg font-bold">
            Loading your internship status...
          </h2>

          <p className={`text-sm mt-2 ${mutedClass}`}>
            Please wait while we retrieve your application and internship
            progress.
          </p>
        </div>
      </div>
    );
  }

  /* =======================================================
     RETURN
  ======================================================= */

  return (
    <div className={`p-5 md:p-6 lg:p-8 max-w-[1600px] mx-auto ${headingClass}`}>
      {/* =================================================
          HEADER
      ================================================= */}

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <p className="text-xs uppercase tracking-widest font-bold text-slate-400">
            Student Portal
          </p>

          <h1 className="text-2xl md:text-3xl font-black mt-1">
            Internship Status
          </h1>

          <p className={`text-sm mt-1 ${mutedClass}`}>
            Track your application, placement, documents, deployment, and
            internship completion.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadData(true)}
          disabled={refreshing}
          className={`px-4 py-2.5 rounded-lg border text-xs font-bold transition ${
            refreshing
              ? "opacity-50 cursor-not-allowed"
              : darkMode
              ? "border-slate-600 text-slate-300 hover:bg-slate-800"
              : "border-slate-300 text-slate-700 hover:bg-slate-50"
          }`}
        >
          {refreshing ? "Refreshing..." : "↻ Refresh Status"}
        </button>
      </div>

      {/* =================================================
          APPLICATION / INTERNSHIP SELECTOR
      ================================================= */}

      {applicationOptions.length > 0 && (
        <section className={`border rounded-2xl p-5 md:p-6 mb-6 ${cardClass}`}>
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="flex-1">
              <p className="text-[10px] uppercase tracking-widest font-black text-slate-400">
                Applications & Internship History
              </p>

              <h2 className="text-lg font-bold mt-1">Select Application</h2>

              <p className={`text-xs mt-1 ${mutedClass}`}>
                Select an application to view its specific application,
                placement, documents, and internship status.
              </p>
            </div>

            <div className="w-full lg:w-[480px]">
              <select
                value={selectedApplicationId}
                onChange={(event) =>
                  setSelectedApplicationId(event.target.value)
                }
                className={`w-full px-4 py-3 rounded-xl border text-sm font-semibold outline-none transition ${
                  darkMode
                    ? "bg-slate-800 border-slate-600 text-slate-100 focus:border-blue-500"
                    : "bg-white border-slate-300 text-slate-900 focus:border-blue-500"
                }`}
              >
                {applicationOptions.map((option) => {
                  const { application, assignment, company, position } = option;

                  const companyName =
                    company?.company_name || "Unknown Company";

                  const statusLabel = assignment
                    ? formatStatus(assignment.status)
                    : formatStatus(application.status);

                  return (
                    <option key={application.id} value={application.id}>
                      {companyName} — {position} [{statusLabel}]
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {selectedApplication && (
            <div className={`mt-4 rounded-xl border p-4 ${borderClass}`}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                    Selected Application
                  </p>

                  <p className="font-bold text-sm mt-1">
                    {selectedCompany?.company_name || "Unknown Company"}
                  </p>

                  <p className={`text-xs mt-1 ${mutedClass}`}>
                    {selectedPosition}
                  </p>

                  {!selectedAssignment && (
                    <p className={`text-[11px] mt-2 ${mutedClass}`}>
                      This application has no internship assignment yet.
                    </p>
                  )}
                </div>

                <span
                  className={`px-3 py-1.5 rounded-full text-[10px] font-bold w-fit ${
                    selectedAssignment?.status === STATUS.assignment.COMPLETED
                      ? "bg-emerald-100 text-emerald-700"
                      : selectedAssignment?.status === STATUS.assignment.ACTIVE
                      ? "bg-blue-100 text-blue-700"
                      : selectedAssignment?.status ===
                        STATUS.assignment.TERMINATED
                      ? "bg-red-100 text-red-700"
                      : selectedAssignment?.status ===
                        STATUS.assignment.SUSPENDED
                      ? "bg-amber-100 text-amber-700"
                      : selectedAssignment
                      ? "bg-slate-100 text-slate-700"
                      : applicationStatus === STATUS.application.APPROVED
                      ? "bg-blue-100 text-blue-700"
                      : applicationStatus === STATUS.application.REJECTED
                      ? "bg-red-100 text-red-700"
                      : applicationStatus === STATUS.application.INFO_REQUESTED
                      ? "bg-amber-100 text-amber-700"
                      : applicationStatus === STATUS.application.DRAFT
                      ? "bg-slate-100 text-slate-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {selectedAssignment
                    ? formatStatus(selectedAssignment.status)
                    : formatStatus(selectedApplication.status)}
                </span>
              </div>
            </div>
          )}
        </section>
      )}

      {/* =================================================
          OVERALL STATUS
      ================================================= */}

      <section
        className={`border rounded-2xl p-5 md:p-6 mb-6 ${toneClasses.wrapper}`}
      >
        <div className="flex flex-col md:flex-row md:items-center gap-5">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 ${toneClasses.icon}`}
          >
            {overallStatus.icon}
          </div>

          <div className="flex-1 min-w-0">
            <p
              className={`text-[10px] uppercase tracking-widest font-black ${toneClasses.title}`}
            >
              Current Status
            </p>

            <h2
              className={`text-xl md:text-2xl font-black mt-1 ${toneClasses.title}`}
            >
              {overallStatus.title}
            </h2>

            <p className={`text-sm mt-1 ${toneClasses.text}`}>
              {overallStatus.subtitle}
            </p>
          </div>

          <div className="md:text-right">
            <p
              className={`text-[10px] uppercase tracking-widest font-bold ${mutedClass}`}
            >
              Internship Progress
            </p>

            <p className={`text-3xl font-black mt-1 ${toneClasses.title}`}>
              {progressPercentage}%
            </p>

            {selectedAssignment &&
              progressPercentage === 0 &&
              selectedAssignment.status !== STATUS.assignment.COMPLETED && (
                <p className={`text-[10px] mt-1 ${mutedClass}`}>
                  Internship not yet started
                </p>
              )}
          </div>
        </div>

        <div className="mt-6">
          <div
            className={`h-2 rounded-full overflow-hidden ${
              darkMode ? "bg-slate-800" : "bg-white/70"
            }`}
          >
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{
                width: `${progressPercentage}%`,
              }}
            />
          </div>
        </div>
      </section>

      {/* =================================================
          INTERNSHIP DETAILS
      ================================================= */}

      {(selectedAssignment || selectedApplication) && (
        <section className={`border rounded-2xl p-5 md:p-6 mb-6 ${cardClass}`}>
          <div className="flex items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="text-lg font-bold">Internship Details</h2>

              <p className={`text-xs mt-1 ${mutedClass}`}>
                Details for the selected application.
              </p>
            </div>

            {selectedAssignment && (
              <span
                className={`px-3 py-1.5 rounded-full text-[10px] font-bold ${
                  selectedAssignment.status === STATUS.assignment.COMPLETED
                    ? "bg-emerald-100 text-emerald-700"
                    : selectedAssignment.status === STATUS.assignment.ACTIVE
                    ? "bg-blue-100 text-blue-700"
                    : selectedAssignment.status === STATUS.assignment.TERMINATED
                    ? "bg-red-100 text-red-700"
                    : selectedAssignment.status === STATUS.assignment.SUSPENDED
                    ? "bg-amber-100 text-amber-700"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                {formatStatus(selectedAssignment.status)}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {/* COMPANY */}

            <div className={`rounded-xl border p-4 ${borderClass}`}>
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                Company
              </p>

              <p className="font-bold text-sm mt-2">
                {selectedCompany?.company_name || "Not assigned"}
              </p>

              {selectedCompany?.industry && (
                <p className={`text-xs mt-1 ${mutedClass}`}>
                  {selectedCompany.industry}
                </p>
              )}
            </div>

            {/* POSITION */}

            <div className={`rounded-xl border p-4 ${borderClass}`}>
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                Internship Position
              </p>

              <p className="font-bold text-sm mt-2">{selectedPosition}</p>

              {selectedOpportunity?.location && (
                <p className={`text-xs mt-1 ${mutedClass}`}>
                  📍 {selectedOpportunity.location}
                </p>
              )}
            </div>

            {/* PERIOD */}

            <div className={`rounded-xl border p-4 ${borderClass}`}>
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                Internship Period
              </p>

              <p className="font-bold text-sm mt-2">
                {formatPeriod(selectedAssignment, selectedOpportunity)}
              </p>
            </div>

            {/* APPLICATION */}

            <div className={`rounded-xl border p-4 ${borderClass}`}>
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                Application
              </p>

              <p className="font-bold text-sm mt-2">
                {formatStatus(selectedApplication?.status)}
              </p>

              {selectedApplication?.submitted_at && (
                <p className={`text-xs mt-1 ${mutedClass}`}>
                  Submitted {formatDate(selectedApplication.submitted_at)}
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* =================================================
          INTERNSHIP PROGRESS
      ================================================= */}

      <section className={`border rounded-2xl p-5 md:p-6 mb-6 ${cardClass}`}>
        <div className="mb-6">
          <h2 className="text-lg font-bold">Internship Progress</h2>

          <p className={`text-xs mt-1 ${mutedClass}`}>
            Follow each stage of the selected application or internship.
          </p>
        </div>

        <div className="relative">
          {progressSteps.map((step, index) => {
            const isCompleted = step.completed;

            const isCurrent = step.current;

            return (
              <div
                key={step.key}
                className="relative flex gap-4 pb-7 last:pb-0"
              >
                {index < progressSteps.length - 1 && (
                  <div
                    className={`absolute left-[15px] top-8 w-[2px] h-[calc(100%-8px)] ${
                      isCompleted
                        ? "bg-emerald-500"
                        : darkMode
                        ? "bg-slate-700"
                        : "bg-slate-200"
                    }`}
                  />
                )}

                <div
                  className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${
                    isCompleted
                      ? "bg-emerald-500 text-white"
                      : isCurrent
                      ? "bg-blue-600 text-white"
                      : darkMode
                      ? "bg-slate-800 text-slate-500 border border-slate-700"
                      : "bg-slate-100 text-slate-400 border border-slate-200"
                  }`}
                >
                  {isCompleted ? "✓" : step.icon}
                </div>

                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <h3
                      className={`text-sm font-bold ${
                        isCompleted
                          ? darkMode
                            ? "text-emerald-300"
                            : "text-emerald-700"
                          : isCurrent
                          ? darkMode
                            ? "text-blue-300"
                            : "text-blue-700"
                          : mutedClass
                      }`}
                    >
                      {step.label}
                    </h3>

                    <span
                      className={`text-[10px] font-bold ${
                        isCompleted
                          ? "text-emerald-600"
                          : isCurrent
                          ? "text-blue-600"
                          : step.statusLabel === "Revision Required"
                          ? "text-amber-600"
                          : step.statusLabel === "Rejected"
                          ? "text-red-600"
                          : step.statusLabel === "Withdrawn"
                          ? "text-slate-500"
                          : "text-slate-400"
                      }`}
                    >
                      {step.statusLabel}
                    </span>
                  </div>

                  <p className={`text-xs mt-1 ${mutedClass}`}>
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* =================================================
          COMPLETED INTERNSHIP
      ================================================= */}

      {selectedAssignment?.status === STATUS.assignment.COMPLETED && (
        <section
          className={`border rounded-2xl p-5 md:p-6 mb-6 ${
            darkMode
              ? "border-emerald-800 bg-emerald-950/30"
              : "border-emerald-200 bg-emerald-50"
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500 text-white flex items-center justify-center text-2xl flex-shrink-0">
              🎓
            </div>

            <div className="flex-1">
              <p className="text-[10px] uppercase tracking-widest font-black text-emerald-600">
                Internship Complete
              </p>

              <h2
                className={`text-xl font-black mt-1 ${
                  darkMode ? "text-emerald-300" : "text-emerald-800"
                }`}
              >
                Congratulations on completing your internship!
              </h2>

              <p
                className={`text-sm mt-1 ${
                  darkMode ? "text-emerald-200" : "text-emerald-700"
                }`}
              >
                You successfully completed your internship at{" "}
                <strong>
                  {selectedCompany?.company_name || "your assigned company"}
                </strong>
                .
              </p>
            </div>
          </div>

          {/* CERTIFICATE */}

          <div
            className={`mt-5 rounded-xl border p-5 ${
              darkMode
                ? "border-emerald-800 bg-slate-900/50"
                : "border-emerald-200 bg-white"
            }`}
          >
            {selectedCertificate ? (
              <div>
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-2xl flex-shrink-0">
                    📜
                  </div>

                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <p
                        className={`text-base font-black ${
                          darkMode ? "text-slate-100" : "text-slate-900"
                        }`}
                      >
                        Certificate of Completion
                      </p>

                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold w-fit">
                        Available
                      </span>
                    </div>

                    <p className={`text-xs mt-1 ${mutedClass}`}>
                      Your internship completion certificate has been officially
                      issued.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
                  <div className={`rounded-xl border p-4 ${borderClass}`}>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                      Certificate Number
                    </p>

                    <p className="font-mono font-bold text-sm mt-1">
                      {selectedCertificate.certificate_number}
                    </p>
                  </div>

                  <div className={`rounded-xl border p-4 ${borderClass}`}>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                      Date Issued
                    </p>

                    <p className="font-bold text-sm mt-1">
                      {formatDate(selectedCertificate.issued_at)}
                    </p>
                  </div>
                </div>

                <div className="mt-5">
                  <button
                    type="button"
                    onClick={() => {
                      if (!selectedCertificate?.id) {
                        alert(
                          "Certificate ID is missing. Please refresh the page and try again."
                        );
                        return;
                      }

                      navigate(
                        `/student/certificate/${selectedCertificate.id}`
                      );
                    }}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-gray-800 transition shadow-sm"
                  >
                    📜 See Your Certificate →
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <div className="text-xl">📜</div>

                <div className="flex-1">
                  <p
                    className={`text-sm font-bold ${
                      darkMode ? "text-slate-100" : "text-slate-900"
                    }`}
                  >
                    Certificate Processing
                  </p>

                  <p className={`text-xs mt-1 ${mutedClass}`}>
                    Your internship is completed. The certificate record is
                    being prepared. Please refresh the page shortly.
                  </p>

                  <button
                    type="button"
                    onClick={() => loadData(true)}
                    disabled={refreshing}
                    className="mt-3 px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition disabled:opacity-50"
                  >
                    {refreshing ? "Refreshing..." : "↻ Check Certificate"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* =================================================
          APPLICATION INFORMATION
      ================================================= */}

      {selectedApplication && (
        <section className={`border rounded-2xl p-5 md:p-6 ${cardClass}`}>
          <div className="mb-5">
            <h2 className="text-lg font-bold">Application Information</h2>

            <p className={`text-xs mt-1 ${mutedClass}`}>
              Details about the selected internship application.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`rounded-xl border p-4 ${borderClass}`}>
              <p className="text-[10px] uppercase font-bold text-slate-400">
                Application Status
              </p>

              <p className="text-sm font-bold mt-2">
                {formatStatus(selectedApplication.status)}
              </p>
            </div>

            <div className={`rounded-xl border p-4 ${borderClass}`}>
              <p className="text-[10px] uppercase font-bold text-slate-400">
                Application Date
              </p>

              <p className="text-sm font-bold mt-2">
                {formatDate(selectedApplication.created_at)}
              </p>
            </div>

            {selectedApplication.submitted_at && (
              <div className={`rounded-xl border p-4 ${borderClass}`}>
                <p className="text-[10px] uppercase font-bold text-slate-400">
                  Submitted Date
                </p>

                <p className="text-sm font-bold mt-2">
                  {formatDate(selectedApplication.submitted_at)}
                </p>
              </div>
            )}

            {selectedAssignment?.deployed_at && (
              <div className={`rounded-xl border p-4 ${borderClass}`}>
                <p className="text-[10px] uppercase font-bold text-slate-400">
                  Deployment Date
                </p>

                <p className="text-sm font-bold mt-2">
                  {formatDate(selectedAssignment.deployed_at)}
                </p>
              </div>
            )}
          </div>

          {selectedApplication.notes &&
            (selectedApplication.status === STATUS.application.REJECTED ? (
              (() => {
                const rejectionInfo = getRejectionInfo(selectedApplication);

                return (
                  <div
                    className={`mt-5 rounded-xl border p-4 ${
                      darkMode
                        ? "border-red-800 bg-red-950/20"
                        : "border-red-200 bg-red-50"
                    }`}
                  >
                    <p className="text-[10px] uppercase font-black text-red-600">
                      Rejection Reason
                    </p>

                    <p
                      className={`text-xs font-bold mt-2 ${
                        darkMode ? "text-red-300" : "text-red-700"
                      }`}
                    >
                      Rejected by {rejectionInfo.source}
                    </p>

                    <p
                      className={`text-sm mt-2 whitespace-pre-line ${
                        darkMode ? "text-red-200" : "text-red-800"
                      }`}
                    >
                      {rejectionInfo.reason}
                    </p>
                  </div>
                );
              })()
            ) : (
              <div className={`mt-5 rounded-xl border p-4 ${borderClass}`}>
                <p className="text-[10px] uppercase font-bold text-slate-400">
                  Notes
                </p>

                <p className={`text-sm mt-2 whitespace-pre-line ${mutedClass}`}>
                  {selectedApplication.notes}
                </p>
              </div>
            ))}
        </section>
      )}

      {/* =================================================
          EMPTY STATE
      ================================================= */}

      {!selectedApplication && !selectedAssignment && (
        <section className={`border rounded-2xl p-10 text-center ${cardClass}`}>
          <div className="text-4xl mb-4">📋</div>

          <h2 className="text-lg font-bold">No Internship Status Yet</h2>

          <p className={`text-sm mt-2 max-w-lg mx-auto ${mutedClass}`}>
            Once you submit an internship application, you will be able to track
            its progress here.
          </p>
        </section>
      )}
    </div>
  );
}
