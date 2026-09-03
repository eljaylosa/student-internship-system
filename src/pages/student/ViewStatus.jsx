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

  /*
    All certificates belonging to the logged-in student.

    A certificate is automatically created by the database
    when an assignment is marked as completed.
  */
  const [certificates, setCertificates] = useState([]);

  /*
    Selection is based on APPLICATION ID.

    This allows applications without assignments to still
    appear in the selector.
  */
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
         
         Certificates are automatically created by the
         database trigger when an assignment becomes
         completed.
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
        /*
          Do not block the entire View Status page if the
          certificate query has an issue.
        */
        console.error("Certificate loading error:", certificateError);

        setCertificates([]);
      } else {
        setCertificates(certificateData || []);
      }

      /* ---------------------------------------------------
         DOCUMENTS
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

      /*
        PRIMARY MATCH:
        application_id
      */
      if (application.id) {
        assignment =
          assignments.find((item) => item.application_id === application.id) ||
          null;
      }

      /*
        LEGACY FALLBACK:
        Only use opportunity_id when the assignment has
        NO application_id AND there is exactly ONE
        application for that opportunity.
      */
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

      const opportunity =
        opportunities.find((item) => item.id === application.opportunity_id) ||
        null;

      const companyId =
        assignment?.company_id ||
        application.company_id ||
        opportunity?.company_id;

      const company = companies.find((item) => item.id === companyId) || null;

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
        assignmentPriority: assignmentPriorityValue,
        applicationPriority: applicationPriorityValue,
      };
    });

    return options.sort((a, b) => {
      /*
        Prefer active/current assignments first.
      */
      if (a.assignmentPriority !== b.assignmentPriority) {
        return b.assignmentPriority - a.assignmentPriority;
      }

      /*
        Then application status.
      */
      if (a.applicationPriority !== b.applicationPriority) {
        return b.applicationPriority - a.applicationPriority;
      }

      /*
        Finally newest application.
      */
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

  /* =======================================================
     SELECTED APPLICATION
  ======================================================= */

  const selectedApplication = selectedOption?.application || null;

  /* =======================================================
     SELECTED ASSIGNMENT
  ======================================================= */

  const selectedAssignment = selectedOption?.assignment || null;

  /* =======================================================
     SELECTED OPPORTUNITY
  ======================================================= */

  const selectedOpportunity = selectedOption?.opportunity || null;

  /* =======================================================
     SELECTED COMPANY
  ======================================================= */

  const selectedCompany = selectedOption?.company || null;

  /* =======================================================
     SELECTED CERTIFICATE
     
     Certificate belongs directly to assignment_id.
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
     SELECTED PLACEMENT DOCUMENTS
  ======================================================= */

  const placementDocuments = useMemo(() => {
    if (!selectedAssignment?.id) {
      return [];
    }

    return documents.filter(
      (document) => document.assignment_id === selectedAssignment.id
    );
  }, [documents, selectedAssignment]);

  /* =======================================================
     DOCUMENT PROGRESS
  ======================================================= */

  const documentProgress = useMemo(() => {
    const requiredTypes = documentTypes.filter(
      (type) => type.required === true
    );

    /* -----------------------------------------------------
       No assignment
    ----------------------------------------------------- */

    if (!selectedAssignment?.id) {
      return {
        status: "not_started",
        label: "Not Started",
        description:
          "Documents will become available after your placement is confirmed.",
        submitted: 0,
        required: requiredTypes.length,
        percentage: 0,
        hasRevision: false,
      };
    }

    /* -----------------------------------------------------
       No document types configured
    ----------------------------------------------------- */

    if (requiredTypes.length === 0) {
      if (placementDocuments.length === 0) {
        return {
          status: "not_started",
          label: "Not Submitted",
          description: "No internship documents have been submitted yet.",
          submitted: 0,
          required: 0,
          percentage: 0,
          hasRevision: false,
        };
      }

      const hasRevision = placementDocuments.some(
        (document) => document.status === STATUS.document.NEEDS_REVISION
      );

      const allApproved = placementDocuments.every(
        (document) => document.status === STATUS.document.APPROVED
      );

      if (allApproved) {
        return {
          status: "approved",
          label: "Documents Approved",
          description: "All submitted internship documents have been approved.",
          submitted: placementDocuments.length,
          required: placementDocuments.length,
          percentage: 100,
          hasRevision: false,
        };
      }

      if (hasRevision) {
        return {
          status: "needs_revision",
          label: "Needs Revision",
          description:
            "One or more documents need to be revised and resubmitted.",
          submitted: placementDocuments.length,
          required: placementDocuments.length,
          percentage: 100,
          hasRevision: true,
        };
      }

      return {
        status: "pending_review",
        label: "Pending Review",
        description: "Your submitted documents are currently being reviewed.",
        submitted: placementDocuments.length,
        required: placementDocuments.length,
        percentage: 100,
        hasRevision: false,
      };
    }

    /* -----------------------------------------------------
       Latest document for every required type
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

    const hasRevision = latestDocuments.some(
      (document) => document?.status === STATUS.document.NEEDS_REVISION
    );

    const allApproved =
      submittedCount === requiredTypes.length &&
      latestDocuments.every(
        (document) => document?.status === STATUS.document.APPROVED
      );

    const allSubmitted = submittedCount === requiredTypes.length;

    const percentage =
      requiredTypes.length > 0
        ? Math.round((submittedCount / requiredTypes.length) * 100)
        : 0;

    if (allApproved) {
      return {
        status: "approved",
        label: "Documents Approved",
        description: "All required internship documents have been approved.",
        submitted: submittedCount,
        required: requiredTypes.length,
        percentage: 100,
        hasRevision: false,
      };
    }

    if (hasRevision) {
      return {
        status: "needs_revision",
        label: "Needs Revision",
        description: "One or more required documents need revision.",
        submitted: submittedCount,
        required: requiredTypes.length,
        percentage,
        hasRevision: true,
      };
    }

    if (allSubmitted) {
      return {
        status: "pending_review",
        label: "Submitted — Pending Review",
        description:
          "All required documents have been submitted and are awaiting review.",
        submitted: submittedCount,
        required: requiredTypes.length,
        percentage: 100,
        hasRevision: false,
      };
    }

    if (submittedCount > 0) {
      return {
        status: "in_progress",
        label: "Document Submission In Progress",
        description:
          "Some required documents have been submitted. Please complete the remaining requirements.",
        submitted: submittedCount,
        required: requiredTypes.length,
        percentage,
        hasRevision: false,
      };
    }

    return {
      status: "not_started",
      label: "Documents Not Submitted",
      description: "Please submit your required internship documents.",
      submitted: 0,
      required: requiredTypes.length,
      percentage: 0,
      hasRevision: false,
    };
  }, [documentTypes, selectedAssignment, placementDocuments]);

  /* =======================================================
     APPLICATION STATUS
  ======================================================= */

  const applicationStatus = selectedApplication?.status;

  /* =======================================================
     OVERALL STATUS
  ======================================================= */

  const overallStatus = useMemo(() => {
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

    if (selectedAssignment?.status === STATUS.assignment.TERMINATED) {
      return {
        key: "terminated",
        title: "Placement Terminated",
        subtitle: "This internship placement has been terminated.",
        icon: "⚠️",
        tone: "red",
      };
    }

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

    if (applicationStatus === STATUS.application.APPROVED) {
      return {
        key: "approved",
        title: "Placement Approved",
        subtitle:
          "Your application has been approved. Please confirm your internship placement.",
        icon: "🎉",
        tone: "blue",
      };
    }

    if (applicationStatus === STATUS.application.INFO_REQUESTED) {
      return {
        key: "info_requested",
        title: "Information Requested",
        subtitle:
          "The Registrar Adviser requested additional information for your application.",
        icon: "📝",
        tone: "amber",
      };
    }

    if (
      applicationStatus === STATUS.application.UNDER_REVIEW ||
      applicationStatus === STATUS.application.SUBMITTED
    ) {
      return {
        key: "under_review",
        title: "Application Under Review",
        subtitle:
          "Your internship application has been submitted and is currently being reviewed.",
        icon: "⏳",
        tone: "amber",
      };
    }

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

    if (applicationStatus === STATUS.application.WITHDRAWN) {
      return {
        key: "withdrawn",
        title: "Application Withdrawn",
        subtitle: "This application has been withdrawn.",
        icon: "↩️",
        tone: "slate",
      };
    }

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

    return {
      key: "none",
      title: "No Internship Application",
      subtitle: "No internship application is associated with this placement.",
      icon: "📋",
      tone: "slate",
    };
  }, [selectedAssignment, applicationStatus, selectedApplication]);

  /* =======================================================
     PROGRESS STEPS
  ======================================================= */

  const progressSteps = useMemo(() => {
    const assignmentStatus = selectedAssignment?.status;

    const isApproved =
      applicationStatus === STATUS.application.APPROVED ||
      Boolean(selectedAssignment);

    const isConfirmed = Boolean(selectedAssignment);

    const documentsApproved = documentProgress.status === "approved";

    const isDeployed = Boolean(selectedAssignment?.deployed_at);

    const isActive = assignmentStatus === STATUS.assignment.ACTIVE;

    const isCompleted = assignmentStatus === STATUS.assignment.COMPLETED;

    return [
      {
        key: "approved",
        label: "Application Approved",
        description:
          "Your internship application was approved by the Registrar Adviser.",
        icon: "🎉",
        completed: isApproved,
      },

      {
        key: "confirmed",
        label: "Placement Confirmed",
        description: "You confirmed your internship placement.",
        icon: "✅",
        completed: isConfirmed,
      },

      {
        key: "documents",
        label: "Documents Approval",
        description: documentProgress.description,
        icon: "📄",
        completed: documentsApproved,
      },

      {
        key: "deployed",
        label: "Deployed to Company",
        description: isDeployed
          ? "You have been officially deployed to the company."
          : "Waiting for Registrar Adviser deployment.",
        icon: "🚀",
        completed: isDeployed,
      },

      {
        key: "active",
        label: "Internship Active",
        description: isActive
          ? "The company accepted your placement and your internship is active."
          : "Waiting for the company to accept your placement.",
        icon: "💼",
        completed: isActive || isCompleted,
      },

      {
        key: "completed",
        label: "Internship Completed",
        description: isCompleted
          ? "You successfully completed your internship."
          : "This will be completed when the company marks your internship as complete.",
        icon: "🎓",
        completed: isCompleted,
      },
    ];
  }, [selectedAssignment, applicationStatus, documentProgress]);

  /* =======================================================
     PROGRESS PERCENTAGE
  ======================================================= */

  const progressPercentage = useMemo(() => {
    const assignmentStatus = selectedAssignment?.status;

    if (assignmentStatus === STATUS.assignment.COMPLETED) {
      return 100;
    }

    if (assignmentStatus === STATUS.assignment.ACTIVE) {
      return 80;
    }

    if (selectedAssignment?.deployed_at) {
      return 65;
    }

    if (documentProgress.status === "approved") {
      return 50;
    }

    if (selectedAssignment) {
      return 35;
    }

    if (applicationStatus === STATUS.application.APPROVED) {
      return 20;
    }

    if (
      applicationStatus === STATUS.application.SUBMITTED ||
      applicationStatus === STATUS.application.UNDER_REVIEW ||
      applicationStatus === STATUS.application.INFO_REQUESTED
    ) {
      return 10;
    }

    return 0;
  }, [selectedAssignment, documentProgress, applicationStatus]);

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
      {/* ===================================================
          HEADER
      =================================================== */}

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

      {/* ===================================================
          APPLICATION / INTERNSHIP SELECTOR
      =================================================== */}

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
                  const { application, assignment, opportunity, company } =
                    option;

                  const companyName =
                    company?.company_name || "Unknown Company";

                  const position = opportunity?.title || "Internship";

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

          {/* SELECTED APPLICATION SUMMARY */}

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
                    {selectedOpportunity?.title || "Internship Position"}
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

      {/* ===================================================
          OVERALL STATUS
      =================================================== */}

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

      {/* ===================================================
          INTERNSHIP DETAILS
      =================================================== */}

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

              <p className="font-bold text-sm mt-2">
                {selectedOpportunity?.title || "Not specified"}
              </p>

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

      {/* ===================================================
          INTERNSHIP PROGRESS
      =================================================== */}

      <section className={`border rounded-2xl p-5 md:p-6 mb-6 ${cardClass}`}>
        <div className="mb-6">
          <h2 className="text-lg font-bold">Internship Progress</h2>

          <p className={`text-xs mt-1 ${mutedClass}`}>
            Follow each stage of the selected application or internship.
          </p>
        </div>

        <div className="relative">
          {progressSteps.map((step, index) => {
            const previousStep = progressSteps[index - 1];

            const isCompleted = step.completed;

            const isCurrent =
              !isCompleted && (index === 0 || previousStep?.completed);

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
                          : "text-slate-400"
                      }`}
                    >
                      {isCompleted
                        ? "Completed"
                        : isCurrent
                        ? "Current"
                        : "Pending"}
                    </span>
                  </div>

                  <p className={`text-xs mt-1 ${mutedClass}`}>
                    {step.description}
                  </p>

                  {step.key === "documents" && selectedAssignment && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`text-[10px] font-semibold ${mutedClass}`}
                        >
                          {documentProgress.submitted} of{" "}
                          {documentProgress.required} required documents
                        </span>

                        <span className="text-[10px] font-bold text-blue-600">
                          {documentProgress.percentage}%
                        </span>
                      </div>

                      <div
                        className={`h-1.5 rounded-full overflow-hidden ${
                          darkMode ? "bg-slate-800" : "bg-slate-100"
                        }`}
                      >
                        <div
                          className={`h-full rounded-full ${
                            documentProgress.status === "approved"
                              ? "bg-emerald-500"
                              : documentProgress.status === "needs_revision"
                              ? "bg-amber-500"
                              : "bg-blue-500"
                          }`}
                          style={{
                            width: `${documentProgress.percentage}%`,
                          }}
                        />
                      </div>

                      <p
                        className={`text-[10px] mt-2 ${
                          documentProgress.status === "approved"
                            ? "text-emerald-600"
                            : documentProgress.status === "needs_revision"
                            ? "text-amber-600"
                            : mutedClass
                        }`}
                      >
                        {documentProgress.label}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ===================================================
          DOCUMENT SUBMISSION
      =================================================== */}

      {selectedAssignment && (
        <section className={`border rounded-2xl p-5 md:p-6 mb-6 ${cardClass}`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
            <div>
              <h2 className="text-lg font-bold">Document Submission</h2>

              <p className={`text-xs mt-1 ${mutedClass}`}>
                Document status for the selected internship.
              </p>
            </div>

            <span
              className={`px-3 py-1.5 rounded-full text-[10px] font-bold w-fit ${
                documentProgress.status === "approved"
                  ? "bg-emerald-100 text-emerald-700"
                  : documentProgress.status === "needs_revision"
                  ? "bg-amber-100 text-amber-700"
                  : documentProgress.status === "pending_review"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {documentProgress.label}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className={`rounded-xl border p-4 ${borderClass}`}>
              <p className="text-[10px] uppercase font-bold text-slate-400">
                Submitted
              </p>

              <p className="text-2xl font-black mt-1">
                {documentProgress.submitted}
              </p>
            </div>

            <div className={`rounded-xl border p-4 ${borderClass}`}>
              <p className="text-[10px] uppercase font-bold text-slate-400">
                Required
              </p>

              <p className="text-2xl font-black mt-1">
                {documentProgress.required}
              </p>
            </div>

            <div className={`rounded-xl border p-4 ${borderClass}`}>
              <p className="text-[10px] uppercase font-bold text-slate-400">
                Completion
              </p>

              <p className="text-2xl font-black mt-1">
                {documentProgress.percentage}%
              </p>
            </div>
          </div>

          <div
            className={`mt-4 rounded-xl border p-4 ${
              documentProgress.status === "approved"
                ? darkMode
                  ? "border-emerald-800 bg-emerald-950/20"
                  : "border-emerald-200 bg-emerald-50"
                : documentProgress.status === "needs_revision"
                ? darkMode
                  ? "border-amber-800 bg-amber-950/20"
                  : "border-amber-200 bg-amber-50"
                : darkMode
                ? "border-slate-700 bg-slate-800/50"
                : "border-slate-200 bg-slate-50"
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-lg">
                {documentProgress.status === "approved"
                  ? "✅"
                  : documentProgress.status === "needs_revision"
                  ? "⚠️"
                  : "📄"}
              </span>

              <div>
                <p className="text-xs font-bold">{documentProgress.label}</p>

                <p className={`text-xs mt-1 ${mutedClass}`}>
                  {documentProgress.description}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ===================================================
          COMPLETED INTERNSHIP
      =================================================== */}

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

          {/* =================================================
              CERTIFICATE
          ================================================== */}

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
                  {/* ICON */}

                  <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-2xl flex-shrink-0">
                    📜
                  </div>

                  {/* INFO */}

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

                {/* CERTIFICATE DETAILS */}

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

                {/* BUTTON */}

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
              /* ------------------------------------------------
                 CERTIFICATE NOT YET FOUND
              ------------------------------------------------- */

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

      {/* ===================================================
          APPLICATION INFORMATION
      =================================================== */}

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

      {/* ===================================================
          EMPTY STATE
      =================================================== */}

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
