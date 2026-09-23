import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
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
    SUBMITTED: "submitted",
    PENDING_REVIEW: "pending_review",
    APPROVED: "approved",
    NEEDS_REVISION: "needs_revision",
  },
};

const DOCUMENT_BUCKET = "internship-documents";

const DOCUMENT_STATUS = {
  [STATUS.document.SUBMITTED]: {
    label: "Uploaded",
    tone: "text-blue-700",
    bg: "bg-blue-100",
  },

  [STATUS.document.PENDING_REVIEW]: {
    label: "Pending Review",
    tone: "text-orange-700",
    bg: "bg-orange-100",
  },

  [STATUS.document.APPROVED]: {
    label: "Approved",
    tone: "text-emerald-700",
    bg: "bg-emerald-100",
  },

  [STATUS.document.NEEDS_REVISION]: {
    label: "Needs Revision",
    tone: "text-red-700",
    bg: "bg-red-100",
  },
};

const getRequirementIds = (requirements) => {
  if (!Array.isArray(requirements)) {
    return [];
  }

  return requirements
    .map((requirement) => {
      if (typeof requirement === "string") {
        return requirement;
      }

      return requirement?.id || null;
    })
    .filter(Boolean);
};

const getSafeFileName = (fileName) => {
  return String(fileName || "document")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_");
};

const getDocumentStatusInfo = (document) => {
  if (!document) {
    return {
      label: "Not uploaded",
      tone: "text-slate-500",
      bg: "bg-slate-100",
    };
  }

  return (
    DOCUMENT_STATUS[document.status] || {
      label: formatStatus(document.status),
      tone: "text-slate-700",
      bg: "bg-slate-100",
    }
  );
};

function formatStatus(value) {
  if (!value) {
    return "Unknown";
  }

  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value) {
  if (!value) {
    return "Not specified";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not specified";
  }

  return date.toLocaleDateString();
}

function formatDateTime(value) {
  if (!value) {
    return "Not submitted";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not submitted";
  }

  return date.toLocaleString();
}

function formatInternshipPeriod(opportunity) {
  if (!opportunity) {
    return "Not specified";
  }

  const start =
    opportunity.internship_start ||
    opportunity.internshipStart ||
    opportunity.start_date ||
    opportunity.startDate;

  const end =
    opportunity.internship_end ||
    opportunity.internshipEnd ||
    opportunity.end_date ||
    opportunity.endDate;

  if (start && end) {
    return `${formatDate(start)} – ${formatDate(end)}`;
  }

  if (start) {
    return `Starts ${formatDate(start)}`;
  }

  if (end) {
    return `Until ${formatDate(end)}`;
  }

  return "Not specified";
}

export default function Application() {
  const navigate = useNavigate();
  const { darkMode } = useOutletContext() || {};

  // =========================================================
  // STATE
  // =========================================================

  const [student, setStudent] = useState(null);
  const [opportunities, setOpportunities] = useState([]);
  const [applications, setApplications] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [capacityByOpportunityId, setCapacityByOpportunityId] = useState({});

  const [documentTypes, setDocumentTypes] = useState([]);
  const [applicationDocuments, setApplicationDocuments] = useState([]);
  const [selectedDocumentFiles, setSelectedDocumentFiles] = useState({});
  const [uploadingDocumentTypeIds, setUploadingDocumentTypeIds] = useState({});

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmingPlacement, setIsConfirmingPlacement] = useState(false);

  const [activeTab, setActiveTab] = useState("apply");

  const [opportunityId, setOpportunityId] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [isReapplying, setIsReapplying] = useState(false);

  // ---------------------------------------------------------
  // NEW OPPORTUNITY BROWSING STATE
  // ---------------------------------------------------------

  const [searchQuery, setSearchQuery] = useState("");
  const [industryFilter, setIndustryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const [opportunityView, setOpportunityView] = useState("browse");
  const [detailsOpportunityId, setDetailsOpportunityId] = useState("");

  // =========================================================
  // LOAD OPPORTUNITY CAPACITIES
  // =========================================================

  const loadOpportunityCapacities = async (items = []) => {
    const activeItems = items.filter(
      (item) => item.status === STATUS.opportunity.ACTIVE
    );

    const capacityEntries = await Promise.all(
      activeItems.map(async (opportunity) => {
        const { data, error } = await supabaseStudent.rpc(
          "get_opportunity_capacity",
          {
            p_opportunity_id: opportunity.id,
          }
        );

        if (error) {
          console.error(`Error loading capacity for ${opportunity.id}:`, error);

          return [opportunity.id, null];
        }

        const capacity = Array.isArray(data) ? data[0] : data;

        return [opportunity.id, capacity || null];
      })
    );

    setCapacityByOpportunityId(
      Object.fromEntries(capacityEntries.filter(([id]) => Boolean(id)))
    );
  };

  // =========================================================
  // LOAD APPLICATION DOCUMENTS
  // =========================================================

  const loadApplicationDocuments = async (userId) => {
    if (!userId) {
      setApplicationDocuments([]);
      return [];
    }

    const { data, error } = await supabaseStudent
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
      .eq("student_id", userId)
      .not("application_id", "is", null)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    setApplicationDocuments(data || []);

    return data || [];
  };

  // =========================================================
  // LOAD DATA
  // =========================================================

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
      // STUDENT
      // -------------------------------------------------------

      const { data: studentData, error: studentError } = await supabaseStudent
        .from("students")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (studentError) {
        throw studentError;
      }

      setStudent(studentData);

      // -------------------------------------------------------
      // APPLICATIONS
      // -------------------------------------------------------

      const { data: applicationData, error: applicationError } =
        await supabaseStudent
          .from("applications")
          .select("*")
          .eq("student_id", user.id)
          .order("created_at", { ascending: false });

      if (applicationError) {
        throw applicationError;
      }

      setApplications(applicationData || []);

      // -------------------------------------------------------
      // ASSIGNMENTS
      // -------------------------------------------------------

      const { data: assignmentData, error: assignmentError } =
        await supabaseStudent
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
          .eq("student_id", user.id)
          .order("created_at", { ascending: false });

      if (assignmentError) {
        throw assignmentError;
      }

      setAssignments(assignmentData || []);

      // -------------------------------------------------------
      // ACTIVE OPPORTUNITIES
      // -------------------------------------------------------

      const { data: activeOpportunities, error: activeError } =
        await supabaseStudent
          .from("opportunities")
          .select("*")
          .eq("status", STATUS.opportunity.ACTIVE)
          .order("created_at", { ascending: false });

      if (activeError) {
        throw activeError;
      }

      // -------------------------------------------------------
      // EXISTING OPPORTUNITIES FROM APPLICATIONS
      // -------------------------------------------------------

      const applicationOpportunityIds = [
        ...new Set(
          (applicationData || [])
            .map((application) => application.opportunity_id)
            .filter(Boolean)
        ),
      ];

      const assignmentOpportunityIds = [
        ...new Set(
          (assignmentData || [])
            .map((assignment) => assignment.opportunity_id)
            .filter(Boolean)
        ),
      ];

      const existingOpportunityIds = [
        ...new Set([...applicationOpportunityIds, ...assignmentOpportunityIds]),
      ];

      let existingOpportunities = [];

      if (existingOpportunityIds.length > 0) {
        const { data, error } = await supabaseStudent
          .from("opportunities")
          .select("*")
          .in("id", existingOpportunityIds);

        if (error) {
          throw error;
        }

        existingOpportunities = data || [];
      }

      // -------------------------------------------------------
      // MERGE OPPORTUNITIES
      // -------------------------------------------------------

      const opportunityMap = new Map();

      [...(activeOpportunities || []), ...existingOpportunities].forEach(
        (opportunity) => {
          opportunityMap.set(opportunity.id, opportunity);
        }
      );

      const mergedOpportunities = Array.from(opportunityMap.values()).sort(
        (a, b) => {
          const dateA = new Date(a.created_at || 0).getTime();
          const dateB = new Date(b.created_at || 0).getTime();

          return dateB - dateA;
        }
      );

      // -------------------------------------------------------
      // COMPANIES
      // -------------------------------------------------------

      const companyIds = [
        ...new Set(
          mergedOpportunities
            .map((opportunity) => opportunity.company_id)
            .filter(Boolean)
        ),
      ];

      let companyMap = new Map();

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

        companyMap = new Map(
          (companyData || []).map((company) => [company.id, company])
        );
      }

      const opportunitiesWithCompanies = mergedOpportunities.map(
        (opportunity) => ({
          ...opportunity,
          companies: companyMap.get(opportunity.company_id) || null,
        })
      );

      setOpportunities(opportunitiesWithCompanies);

      // -------------------------------------------------------
      // DOCUMENT TYPES
      // -------------------------------------------------------

      const { data: documentTypeData, error: documentTypeError } =
        await supabaseStudent
          .from("document_types")
          .select("id, name, description, required, created_at, updated_at")
          .order("created_at", { ascending: true });

      if (documentTypeError) {
        throw documentTypeError;
      }

      setDocumentTypes(documentTypeData || []);

      // -------------------------------------------------------
      // APPLICATION DOCUMENTS
      // -------------------------------------------------------

      await loadApplicationDocuments(user.id);

      // -------------------------------------------------------
      // CAPACITY
      // -------------------------------------------------------

      await loadOpportunityCapacities(opportunitiesWithCompanies);

      // -------------------------------------------------------
      // DEFAULT OPPORTUNITY
      // -------------------------------------------------------

      const firstActiveOpportunity = opportunitiesWithCompanies.find(
        (opportunity) => opportunity.status === STATUS.opportunity.ACTIVE
      );

      const firstExistingOpportunity = opportunitiesWithCompanies.find(
        (opportunity) => existingOpportunityIds.includes(opportunity.id)
      );

      const defaultOpportunity =
        firstActiveOpportunity || firstExistingOpportunity;

      if (defaultOpportunity) {
        setOpportunityId(defaultOpportunity.id);
      }
    } catch (error) {
      console.error("Error loading internship application:", error);

      alert(
        error.message ||
          "Unable to load internship opportunities. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // =========================================================
  // CAPACITY HELPERS
  // =========================================================

  const getOpportunityCapacity = (id) => {
    return capacityByOpportunityId[id] || null;
  };

  // =========================================================
  // ASSIGNMENT HELPERS
  // =========================================================

  const latestAssignment = assignments[0] || null;

  const assignmentByApplicationId = useMemo(() => {
    return assignments.reduce((map, assignment) => {
      if (assignment.application_id) {
        map[assignment.application_id] = assignment;
      }

      return map;
    }, {});
  }, [assignments]);

  const activePlacementAssignment =
    assignments.find((assignment) =>
      [STATUS.assignment.PENDING, STATUS.assignment.ACTIVE].includes(
        assignment.status
      )
    ) || null;

  const hasActiveAssignment = Boolean(activePlacementAssignment);

  const completedPlacement =
    assignments.find(
      (assignment) => assignment.status === STATUS.assignment.COMPLETED
    ) || null;

  const hasCompletedPlacement = Boolean(completedPlacement);

  const hasAnyAssignment = assignments.length > 0;

  const hasCompletedPlacementForOpportunity = (id) =>
    assignments.some(
      (assignment) =>
        assignment.opportunity_id === id &&
        assignment.status === STATUS.assignment.COMPLETED
    );

  // =========================================================
  // SELECTED OPPORTUNITY
  // =========================================================

  const selectedOpportunity = opportunities.find(
    (item) => item.id === opportunityId
  );

  const detailsOpportunity = opportunities.find(
    (item) => item.id === detailsOpportunityId
  );

  const selectedOpportunityIsActive =
    selectedOpportunity?.status === STATUS.opportunity.ACTIVE;

  const selectedOpportunityCapacity = getOpportunityCapacity(opportunityId);

  const selectedOpportunityIsFull =
    selectedOpportunityIsActive &&
    selectedOpportunityCapacity &&
    Number(selectedOpportunityCapacity.available_slots) <= 0;

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

  const existingApplication =
    opportunityApplications.find(
      (application) =>
        application.status !== STATUS.application.WITHDRAWN &&
        application.status !== STATUS.application.REJECTED
    ) || opportunityApplications[0];

  // =========================================================
  // GLOBAL APPLICATION STATUS
  // =========================================================

  const approvedApplication =
    applications.find(
      (application) =>
        application.status === STATUS.application.APPROVED &&
        !assignmentByApplicationId[application.id]
    ) || null;

  const hasPlacementOffer = Boolean(approvedApplication);

  const hasResume = Boolean(student?.resume_url);

  const legacyAcceptedApplication =
    applications.find(
      (application) => application.status === STATUS.application.ACCEPTED
    ) || null;

  const hasFinalPlacement =
    Boolean(activePlacementAssignment) ||
    Boolean(completedPlacement) ||
    Boolean(
      assignments.find(
        (assignment) => assignment.status === STATUS.assignment.TERMINATED
      )
    ) ||
    Boolean(legacyAcceptedApplication && hasAnyAssignment);

  // =========================================================
  // REQUIRED DOCUMENT TYPES
  // =========================================================

  const requiredDocumentTypes = useMemo(() => {
    const systemRequired = documentTypes.filter(
      (documentType) => documentType.required
    );

    const optional = getRequirementIds(selectedOpportunity?.requirements)
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
  }, [documentTypes, selectedOpportunity]);

  // =========================================================
  // DOCUMENT HELPERS
  // =========================================================

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

  const selectedDocumentSummary = useMemo(() => {
    if (!selectedOpportunity) {
      return {
        uploaded: 0,
        total: requiredDocumentTypes.length,
        ready: 0,
      };
    }

    let uploaded = 0;

    requiredDocumentTypes.forEach((documentType) => {
      const document = getApplicationDocument(
        existingApplication?.id,
        documentType.id
      );

      const selectedFile = selectedDocumentFiles[documentType.id];

      if (
        selectedFile ||
        (document && document.status !== STATUS.document.NEEDS_REVISION)
      ) {
        uploaded += 1;
      }
    });

    return {
      uploaded,
      total: requiredDocumentTypes.length,
      ready: Object.keys(selectedDocumentFiles).length,
    };
  }, [
    selectedOpportunity,
    requiredDocumentTypes,
    existingApplication?.id,
    applicationDocuments,
    selectedDocumentFiles,
  ]);

  const handleDocumentFileSelect = (documentTypeId, file) => {
    if (!file) {
      return;
    }

    const allowedExtensions = [
      ".pdf",
      ".doc",
      ".docx",
      ".jpg",
      ".jpeg",
      ".png",
    ];

    const lowerName = file.name.toLowerCase();

    const valid = allowedExtensions.some((extension) =>
      lowerName.endsWith(extension)
    );

    if (!valid) {
      alert("Please select a PDF, DOC, DOCX, JPG, JPEG, or PNG file.");
      return;
    }

    setSelectedDocumentFiles((previous) => ({
      ...previous,
      [documentTypeId]: file,
    }));
  };

  const handleRemoveSelectedDocumentFile = (documentTypeId) => {
    setSelectedDocumentFiles((previous) => {
      const next = { ...previous };

      delete next[documentTypeId];

      return next;
    });
  };

  // =========================================================
  // UPLOAD ONE DOCUMENT
  // =========================================================

  const uploadDocumentFile = async (
    applicationId,
    documentTypeId,
    file,
    userId
  ) => {
    if (!applicationId) {
      throw new Error("Application ID is required before uploading.");
    }

    if (!documentTypeId) {
      throw new Error("Document type is required.");
    }

    if (!file) {
      throw new Error("Please choose a file.");
    }

    if (!userId) {
      throw new Error("You are not logged in.");
    }

    const safeFileName = getSafeFileName(file.name);

    const storagePath =
      `${userId}/applications/${applicationId}/` +
      `${documentTypeId}/${Date.now()}_${safeFileName}`;

    const { error: uploadError } = await supabaseStudent.storage
      .from(DOCUMENT_BUCKET)
      .upload(storagePath, file, {
        upsert: false,
        contentType: file.type || undefined,
      });

    if (uploadError) {
      throw uploadError;
    }

    try {
      const { data: existingDocument, error: existingError } =
        await supabaseStudent
          .from("documents")
          .select("*")
          .eq("student_id", userId)
          .eq("application_id", applicationId)
          .eq("document_type_id", documentTypeId)
          .maybeSingle();

      if (existingError) {
        throw existingError;
      }

      let savedDocument;

      if (existingDocument) {
        const nextVersion = Number(existingDocument.version || 1) + 1;

        const { data, error: updateError } = await supabaseStudent
          .from("documents")
          .update({
            file_name: file.name,
            storage_path: storagePath,
            version: nextVersion,
            status: STATUS.document.SUBMITTED,
            notes: null,
            reviewed_by: null,
            reviewed_at: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingDocument.id)
          .eq("student_id", userId)
          .select()
          .single();

        if (updateError) {
          throw updateError;
        }

        savedDocument = data;

        if (
          existingDocument.storage_path &&
          existingDocument.storage_path !== storagePath
        ) {
          const { error: removeOldError } = await supabaseStudent.storage
            .from(DOCUMENT_BUCKET)
            .remove([existingDocument.storage_path]);

          if (removeOldError) {
            console.warn(
              "Unable to remove previous document file:",
              removeOldError
            );
          }
        }
      } else {
        const { data, error: insertError } = await supabaseStudent
          .from("documents")
          .insert({
            application_id: applicationId,
            assignment_id: null,
            student_id: userId,
            document_type_id: documentTypeId,
            file_name: file.name,
            storage_path: storagePath,
            version: 1,
            status: STATUS.document.SUBMITTED,
          })
          .select()
          .single();

        if (insertError) {
          throw insertError;
        }

        savedDocument = data;
      }

      return savedDocument;
    } catch (error) {
      const { error: cleanupError } = await supabaseStudent.storage
        .from(DOCUMENT_BUCKET)
        .remove([storagePath]);

      if (cleanupError) {
        console.warn(
          "Unable to clean up failed document upload:",
          cleanupError
        );
      }

      throw error;
    }
  };

  // =========================================================
  // UPLOAD ALL SELECTED DOCUMENTS
  // =========================================================

  const uploadPendingDocuments = async (applicationId, userId) => {
    const entries = Object.entries(selectedDocumentFiles);

    const uploaded = [];
    const failed = [];

    if (entries.length === 0) {
      return {
        uploaded,
        failed,
      };
    }

    for (const [documentTypeId, file] of entries) {
      setUploadingDocumentTypeIds((previous) => ({
        ...previous,
        [documentTypeId]: true,
      }));

      try {
        const savedDocument = await uploadDocumentFile(
          applicationId,
          documentTypeId,
          file,
          userId
        );

        uploaded.push(savedDocument);

        setApplicationDocuments((previous) => {
          const filtered = previous.filter(
            (item) =>
              !(
                item.application_id === applicationId &&
                item.document_type_id === documentTypeId
              )
          );

          return [savedDocument, ...filtered];
        });

        setSelectedDocumentFiles((previous) => {
          const next = { ...previous };

          delete next[documentTypeId];

          return next;
        });
      } catch (error) {
        console.error(`Unable to upload document ${documentTypeId}:`, error);

        failed.push({
          documentTypeId,
          error,
        });
      } finally {
        setUploadingDocumentTypeIds((previous) => {
          const next = { ...previous };

          delete next[documentTypeId];

          return next;
        });
      }
    }

    return {
      uploaded,
      failed,
    };
  };

  // =========================================================
  // VALIDATE REQUIRED DOCUMENTS
  // =========================================================

  const validateRequiredDocuments = async (applicationId, userId) => {
    if (!applicationId || !userId) {
      return {
        valid: false,
        missing: requiredDocumentTypes,
        documents: [],
      };
    }

    const { data, error } = await supabaseStudent
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
      .eq("student_id", userId)
      .eq("application_id", applicationId);

    if (error) {
      throw error;
    }

    const documents = data || [];

    setApplicationDocuments((previous) => {
      const withoutCurrent = previous.filter(
        (document) => document.application_id !== applicationId
      );

      return [...documents, ...withoutCurrent];
    });

    const missing = requiredDocumentTypes.filter((documentType) => {
      const document = documents.find(
        (item) => item.document_type_id === documentType.id
      );

      if (!document) {
        return true;
      }

      return document.status === STATUS.document.NEEDS_REVISION;
    });

    return {
      valid: missing.length === 0,
      missing,
      documents,
    };
  };

  // =========================================================
  // CREATE APPLICATION DRAFT
  // =========================================================

  const createApplicationDraft = async (user) => {
    if (!user) {
      throw new Error("You are not logged in.");
    }

    if (!selectedOpportunity) {
      throw new Error("Please select an internship opportunity.");
    }

    if (selectedOpportunity.status !== STATUS.opportunity.ACTIVE) {
      throw new Error(
        "This internship opportunity is closed and is no longer accepting new applications."
      );
    }

    const { data: latestAssignment, error: assignmentError } =
      await supabaseStudent
        .from("assignments")
        .select("id, status")
        .eq("student_id", user.id)
        .in("status", [STATUS.assignment.PENDING, STATUS.assignment.ACTIVE])
        .limit(1)
        .maybeSingle();

    if (assignmentError) {
      throw assignmentError;
    }

    if (latestAssignment) {
      throw new Error("You already have a confirmed internship placement.");
    }

    const { data: latestApplications, error: applicationsError } =
      await supabaseStudent
        .from("applications")
        .select("id, opportunity_id, status")
        .eq("student_id", user.id);

    if (applicationsError) {
      throw applicationsError;
    }

    const hasActiveApplication = (latestApplications || []).some(
      (application) =>
        application.opportunity_id === selectedOpportunity.id &&
        ![STATUS.application.REJECTED, STATUS.application.WITHDRAWN].includes(
          application.status
        )
    );

    if (hasActiveApplication && !isReapplying) {
      throw new Error(
        "You already have an active application for this internship opportunity."
      );
    }

    const { data: latestAssignments, error: latestAssignmentsError } =
      await supabaseStudent
        .from("assignments")
        .select("id, application_id, status")
        .eq("student_id", user.id);

    if (latestAssignmentsError) {
      throw latestAssignmentsError;
    }

    const hasApprovedOffer = (latestApplications || []).some(
      (application) =>
        application.status === STATUS.application.APPROVED &&
        !(latestAssignments || []).some(
          (assignment) => assignment.application_id === application.id
        )
    );

    if (hasApprovedOffer) {
      throw new Error(
        "You have an internship placement offer waiting for confirmation. Please confirm or decline that offer first."
      );
    }

    const { data: capacityData, error: capacityError } =
      await supabaseStudent.rpc("get_opportunity_capacity", {
        p_opportunity_id: selectedOpportunity.id,
      });

    if (capacityError) {
      throw capacityError;
    }

    const finalCapacity = Array.isArray(capacityData)
      ? capacityData[0]
      : capacityData;

    if (finalCapacity && Number(finalCapacity.available_slots) <= 0) {
      throw new Error("This internship opportunity is currently full.");
    }

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
      throw insertError;
    }

    setApplications((previous) => [newDraft, ...previous]);

    setOpportunityId(selectedOpportunity.id);

    return newDraft;
  };

  // =========================================================
  // FORMATTING HELPERS
  // =========================================================

  const getRejectionInfo = (application) => {
    if (!application) {
      return {
        source: "Registrar",
        reason: "No reason provided.",
      };
    }

    return {
      source: application.reviewer_id ? "Registrar" : "Reviewer",
      reason: application.notes || "No rejection reason was provided.",
    };
  };

  const statusTone = (status) => {
    switch (status) {
      case STATUS.application.APPROVED:
      case STATUS.application.ACCEPTED:
        return "text-emerald-600";

      case STATUS.application.REJECTED:
        return "text-red-600";

      case STATUS.application.INFO_REQUESTED:
        return "text-orange-600";

      case STATUS.application.SUBMITTED:
      case STATUS.application.UNDER_REVIEW:
        return "text-blue-600";

      case STATUS.application.DRAFT:
        return "text-slate-500";

      case STATUS.application.WITHDRAWN:
        return "text-slate-500";

      default:
        return "text-slate-600";
    }
  };

  const getAssignmentStatusInfo = (assignment) => {
    if (!assignment) {
      return null;
    }

    switch (assignment.status) {
      case STATUS.assignment.PENDING:
        return {
          icon: "⏳",
          title: "Placement Pending",
          description:
            "Your internship placement has been confirmed and is waiting for deployment.",
        };

      case STATUS.assignment.ACTIVE:
        return {
          icon: "🟢",
          title: "Internship Active",
          description:
            "You are currently deployed to this internship placement.",
        };

      case STATUS.assignment.COMPLETED:
        return {
          icon: "✅",
          title: "Internship Completed",
          description: "Your internship placement has been completed.",
        };

      case STATUS.assignment.SUSPENDED:
        return {
          icon: "⏸️",
          title: "Internship Suspended",
          description: "Your internship placement is currently suspended.",
        };

      case STATUS.assignment.TERMINATED:
        return {
          icon: "⚠️",
          title: "Internship Terminated",
          description: "Your internship placement has been terminated.",
        };

      default:
        return {
          icon: "📋",
          title: formatStatus(assignment.status),
          description: "Your internship assignment has been recorded.",
        };
    }
  };

  // =========================================================
  // CAN APPLY AGAIN
  // =========================================================

  const canApplyAgain = (targetOpportunityId) => {
    const targetOpportunity = opportunities.find(
      (opportunity) => opportunity.id === targetOpportunityId
    );

    if (
      !targetOpportunity ||
      targetOpportunity.status !== STATUS.opportunity.ACTIVE
    ) {
      return false;
    }

    if (hasActiveAssignment || hasPlacementOffer) {
      return false;
    }

    if (hasCompletedPlacementForOpportunity(targetOpportunityId)) {
      return false;
    }

    const capacity = getOpportunityCapacity(targetOpportunityId);

    if (capacity && Number(capacity.available_slots) <= 0) {
      return false;
    }

    return true;
  };

  // =========================================================
  // PREPARE OPPORTUNITY FORM
  // =========================================================

  const prepareOpportunityForm = (opportunity, forceReapply = false) => {
    if (!opportunity) {
      return;
    }

    setOpportunityId(opportunity.id);
    setDetailsOpportunityId(opportunity.id);
    setIsReapplying(forceReapply);

    const matchingApplications = applications
      .filter((application) => application.opportunity_id === opportunity.id)
      .sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();

        return dateB - dateA;
      });

    const matchingApplication =
      matchingApplications.find(
        (application) =>
          application.status !== STATUS.application.WITHDRAWN &&
          application.status !== STATUS.application.REJECTED
      ) || matchingApplications[0];

    if (
      matchingApplication &&
      [STATUS.application.DRAFT, STATUS.application.INFO_REQUESTED].includes(
        matchingApplication.status
      ) &&
      !forceReapply
    ) {
      setCoverLetter(matchingApplication.cover_letter || "");
    } else {
      setCoverLetter("");
    }

    setSelectedDocumentFiles({});
    setOpportunityView("form");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // =========================================================
  // VIEW DETAILS
  // =========================================================

  const handleViewOpportunityDetails = (opportunity) => {
    if (!opportunity) {
      return;
    }

    setDetailsOpportunityId(opportunity.id);
    setOpportunityView("details");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // =========================================================
  // APPLY NOW
  // =========================================================

  const handleApplyNow = (opportunity) => {
    if (!opportunity) {
      return;
    }

    if (opportunity.status !== STATUS.opportunity.ACTIVE) {
      alert(
        "This internship opportunity is closed and is no longer accepting new applications."
      );
      return;
    }

    if (hasActiveAssignment) {
      alert("You already have a confirmed internship placement.");
      return;
    }

    if (hasPlacementOffer) {
      alert(
        "You have an internship placement offer waiting for confirmation. Please decide on that offer first."
      );
      return;
    }

    if (hasCompletedPlacementForOpportunity(opportunity.id)) {
      // redirect to view status tab
    }

    const capacity = getOpportunityCapacity(opportunity.id);

    if (capacity && Number(capacity.available_slots) <= 0) {
      alert("This internship opportunity is currently full.");
      return;
    }

    const matchingApplications = applications
      .filter((application) => application.opportunity_id === opportunity.id)
      .sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();

        return dateB - dateA;
      });

    const activeApplication = matchingApplications.find(
      (application) =>
        ![STATUS.application.REJECTED, STATUS.application.WITHDRAWN].includes(
          application.status
        )
    );

    if (
      activeApplication &&
      [
        STATUS.application.SUBMITTED,
        STATUS.application.UNDER_REVIEW,
        STATUS.application.APPROVED,
        STATUS.application.ACCEPTED,
      ].includes(activeApplication.status)
    ) {
      setOpportunityId(opportunity.id);
      setDetailsOpportunityId(opportunity.id);
      setOpportunityView("details");

      alert(
        `You already have an active application for ${
          opportunity.title || "this opportunity"
        }.`
      );

      return;
    }

    prepareOpportunityForm(opportunity, false);
  };

  // =========================================================
  // SELECT OPPORTUNITY
  // =========================================================

  const handleSelectOpportunity = (opportunity) => {
    if (!opportunity) {
      return;
    }

    setOpportunityId(opportunity.id);
    setDetailsOpportunityId(opportunity.id);
  };

  // =========================================================
  // BACK TO OPPORTUNITIES
  // =========================================================

  const handleBackToOpportunities = () => {
    setOpportunityView("browse");
    setDetailsOpportunityId("");
    setSelectedDocumentFiles({});
  };

  // =========================================================
  // CONFIRM PLACEMENT
  // =========================================================

  const handleConfirmPlacement = async (application) => {
    if (!application) {
      return;
    }

    if (application.status !== STATUS.application.APPROVED) {
      return;
    }

    if (assignmentByApplicationId[application.id]) {
      alert("This application already has an assignment.");
      return;
    }

    if (hasActiveAssignment) {
      alert("You already have an active or pending internship placement.");
      return;
    }

    const opportunity = opportunities.find(
      (item) => item.id === application.opportunity_id
    );

    if (!opportunity) {
      alert("The internship opportunity could not be found.");
      return;
    }

    const confirmed = window.confirm(
      `Confirm your internship placement with ${
        opportunity.companies?.company_name || "this company"
      }?`
    );

    if (!confirmed) {
      return;
    }

    setIsConfirmingPlacement(true);

    try {
      const { data, error } = await supabaseStudent.rpc(
        "confirm_internship_application",
        {
          p_application_id: application.id,
        }
      );

      if (error) {
        throw error;
      }

      await loadData();

      setActiveTab("status");

      alert("Internship placement confirmed successfully.");

      return data;
    } catch (error) {
      console.error("Error confirming placement:", error);

      alert(error.message || "Unable to confirm the internship placement.");
    } finally {
      setIsConfirmingPlacement(false);
    }
  };

  // =========================================================
  // DECLINE PLACEMENT
  // =========================================================

  const handleDeclinePlacement = async (application) => {
    if (!application) {
      return;
    }

    if (application.status !== STATUS.application.APPROVED) {
      return;
    }

    if (assignmentByApplicationId[application.id]) {
      alert("This application already has an assignment.");
      return;
    }

    const opportunity = opportunities.find(
      (item) => item.id === application.opportunity_id
    );

    if (!opportunity) {
      alert("The internship opportunity could not be found.");
      return;
    }

    const confirmed = window.confirm(
      `Decline the internship placement offer from ${
        opportunity.companies?.company_name || "this company"
      }?`
    );

    if (!confirmed) {
      return;
    }

    setIsConfirmingPlacement(true);

    try {
      const { error } = await supabaseStudent.rpc(
        "decline_internship_placement",
        {
          p_application_id: application.id,
        }
      );

      if (error) {
        throw error;
      }

      setApplications((previous) =>
        previous.map((item) =>
          item.id === application.id
            ? {
                ...item,
                status: STATUS.application.WITHDRAWN,
              }
            : item
        )
      );

      setActiveTab("status");

      alert("Internship placement offer declined.");
    } catch (error) {
      console.error("Error declining placement:", error);

      alert(error.message || "Unable to decline the internship placement.");
    } finally {
      setIsConfirmingPlacement(false);
    }
  };

  // =========================================================
  // RESUBMIT INFORMATION REQUEST
  // =========================================================

  const handleResubmitInformation = async () => {
    if (!student || !selectedOpportunity || !existingApplication) {
      return;
    }

    if (!hasResume) {
      alert(
        "Please upload your Resume/CV in your Student Profile before submitting an internship application."
      );
      return;
    }

    if (existingApplication.status !== STATUS.application.INFO_REQUESTED) {
      return;
    }

    if (!coverLetter.trim()) {
      alert("Please provide a cover letter before resubmitting.");
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

      const uploadResult = await uploadPendingDocuments(
        existingApplication.id,
        user.id
      );

      if (uploadResult.failed.length > 0) {
        const failedNames = uploadResult.failed
          .map((item) => {
            const type = documentTypes.find(
              (documentType) => documentType.id === item.documentTypeId
            );

            return type?.name || "Document";
          })
          .join(", ");

        alert(
          `Some documents could not be uploaded: ${failedNames}.\n\nPlease upload or replace them and try again.`
        );

        return;
      }

      const validation = await validateRequiredDocuments(
        existingApplication.id,
        user.id
      );

      if (!validation.valid) {
        const missingNames = validation.missing
          .map((documentType) => documentType.name)
          .join(", ");

        alert(
          `Please upload or replace the following required document(s) before resubmitting:\n\n${missingNames}`
        );

        return;
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
      setSelectedDocumentFiles({});
      setIsReapplying(false);
      setOpportunityView("browse");

      alert(
        `Application resubmitted successfully for ${selectedOpportunity.title}.`
      );

      setActiveTab("status");
    } catch (error) {
      console.error("Error resubmitting application:", error);

      alert(error.message || "Unable to resubmit your application.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // =========================================================
  // APPLY AGAIN
  // =========================================================

  const handleApplyAgain = (opportunity) => {
    if (!opportunity || opportunity.status !== STATUS.opportunity.ACTIVE) {
      alert(
        "This internship opportunity is closed and is no longer accepting new applications."
      );
      return;
    }

    if (hasCompletedPlacementForOpportunity(opportunity.id)) {
      alert(
        "You already completed an internship placement for this opportunity."
      );
      return;
    }

    if (hasActiveAssignment) {
      alert("You already have a confirmed internship placement.");
      return;
    }

    if (hasPlacementOffer) {
      alert(
        "You have an internship placement offer waiting for confirmation. Please decide on that offer first."
      );
      return;
    }

    const capacity = getOpportunityCapacity(opportunity.id);

    if (capacity && Number(capacity.available_slots) <= 0) {
      alert("This internship opportunity is currently full.");
      return;
    }

    // Go back to the Apply tab
    setActiveTab("apply");
    setOpportunityView("browse");
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

    if (!hasResume) {
      alert(
        "Please upload your Resume/CV in your Student Profile before submitting an internship application."
      );
      return;
    }

    if (!coverLetter.trim()) {
      alert("Please provide a cover letter before submitting.");
      return;
    }

    if (
      existingApplication?.status === STATUS.application.INFO_REQUESTED &&
      !isReapplying
    ) {
      await handleResubmitInformation();
      return;
    }

    if (
      existingApplication?.status === STATUS.application.DRAFT &&
      !isReapplying
    ) {
      await handleSubmitDraft();
      return;
    }

    if (
      !isReapplying &&
      selectedOpportunity.status !== STATUS.opportunity.ACTIVE
    ) {
      alert(
        "This internship opportunity is closed and is no longer accepting new applications."
      );
      return;
    }

    if (hasActiveAssignment) {
      alert(
        "You already have a confirmed internship placement. You cannot create another application."
      );
      return;
    }

    if (hasPlacementOffer) {
      alert(
        "You have an internship placement offer waiting for confirmation. Please confirm or decline that offer first."
      );
      return;
    }

    if (
      existingApplication &&
      ![STATUS.application.REJECTED, STATUS.application.WITHDRAWN].includes(
        existingApplication.status
      ) &&
      !isReapplying
    ) {
      alert(
        "You already have an active application for this internship opportunity."
      );
      return;
    }

    if (selectedOpportunityIsActive && selectedOpportunityIsFull) {
      alert("This internship opportunity is currently full.");
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

      const application = await createApplicationDraft(user);

      const uploadResult = await uploadPendingDocuments(
        application.id,
        user.id
      );

      if (uploadResult.failed.length > 0) {
        const failedNames = uploadResult.failed
          .map((item) => {
            const type = documentTypes.find(
              (documentType) => documentType.id === item.documentTypeId
            );

            return type?.name || "Document";
          })
          .join(", ");

        alert(
          `Your application draft was created, but these documents could not be uploaded:\n\n${failedNames}\n\nPlease upload them and submit again.`
        );

        return;
      }

      const validation = await validateRequiredDocuments(
        application.id,
        user.id
      );

      if (!validation.valid) {
        const missingNames = validation.missing
          .map((documentType) => documentType.name)
          .join(", ");

        alert(
          `Your application draft has been saved. Please upload the following required document(s) before submitting:\n\n${missingNames}`
        );

        return;
      }

      const { data: submittedApplication, error: updateError } =
        await supabaseStudent
          .from("applications")
          .update({
            cover_letter: coverLetter.trim(),
            status: STATUS.application.SUBMITTED,
            submitted_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", application.id)
          .eq("student_id", user.id)
          .select()
          .single();

      if (updateError) {
        throw updateError;
      }

      setApplications((previous) =>
        previous.map((item) =>
          item.id === submittedApplication.id ? submittedApplication : item
        )
      );

      setCoverLetter("");
      setSelectedDocumentFiles({});
      setIsReapplying(false);
      setOpportunityView("browse");

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

    if (!hasResume) {
      alert(
        "Please upload your Resume/CV in your Student Profile before submitting an internship application."
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

      const { data: latestAssignment, error: latestAssignmentError } =
        await supabaseStudent
          .from("assignments")
          .select("id, status")
          .eq("student_id", user.id)
          .in("status", [STATUS.assignment.PENDING, STATUS.assignment.ACTIVE])
          .limit(1)
          .maybeSingle();

      if (latestAssignmentError) {
        throw latestAssignmentError;
      }

      if (latestAssignment) {
        throw new Error("You already have a confirmed internship placement.");
      }

      const { data: latestApplications, error: latestApplicationsError } =
        await supabaseStudent
          .from("applications")
          .select("id, status")
          .eq("student_id", user.id);

      if (latestApplicationsError) {
        throw latestApplicationsError;
      }

      const { data: latestAssignments, error: latestAssignmentsError } =
        await supabaseStudent
          .from("assignments")
          .select("id, application_id, status")
          .eq("student_id", user.id);

      if (latestAssignmentsError) {
        throw latestAssignmentsError;
      }

      const hasApprovedOffer = (latestApplications || []).some(
        (application) =>
          application.status === STATUS.application.APPROVED &&
          !(latestAssignments || []).some(
            (assignment) => assignment.application_id === application.id
          )
      );

      if (
        hasApprovedOffer &&
        existingApplication.status !== STATUS.application.APPROVED
      ) {
        throw new Error(
          "You have an internship placement offer waiting for confirmation. Please confirm or decline that offer first."
        );
      }

      const uploadResult = await uploadPendingDocuments(
        existingApplication.id,
        user.id
      );

      if (uploadResult.failed.length > 0) {
        const failedNames = uploadResult.failed
          .map((item) => {
            const type = documentTypes.find(
              (documentType) => documentType.id === item.documentTypeId
            );

            return type?.name || "Document";
          })
          .join(", ");

        alert(
          `Some documents could not be uploaded: ${failedNames}. Please try again.`
        );

        return;
      }

      const validation = await validateRequiredDocuments(
        existingApplication.id,
        user.id
      );

      if (!validation.valid) {
        const missingNames = validation.missing
          .map((documentType) => documentType.name)
          .join(", ");

        alert(
          `Please upload or replace the following required document(s) before submitting:\n\n${missingNames}`
        );

        return;
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
      setSelectedDocumentFiles({});
      setOpportunityView("browse");

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

        const uploadResult = await uploadPendingDocuments(
          existingApplication.id,
          user.id
        );

        if (uploadResult.failed.length > 0) {
          const failedNames = uploadResult.failed
            .map((item) => {
              const type = documentTypes.find(
                (documentType) => documentType.id === item.documentTypeId
              );

              return type?.name || "Document";
            })
            .join(", ");

          alert(
            `Draft updated, but these documents could not be uploaded: ${failedNames}`
          );

          return;
        }

        alert("Application draft updated successfully.");
        return;
      }

      if (
        existingApplication?.status === STATUS.application.REJECTED ||
        existingApplication?.status === STATUS.application.WITHDRAWN
      ) {
        if (hasActiveAssignment) {
          alert(
            "You already have a confirmed internship placement. You cannot create another application."
          );
          return;
        }

        if (hasPlacementOffer) {
          alert(
            "You have an internship placement offer waiting for confirmation. Please decide on that offer first."
          );
          return;
        }

        if (selectedOpportunity.status !== STATUS.opportunity.ACTIVE) {
          alert(
            "This internship opportunity is closed and is no longer accepting new applications."
          );
          return;
        }

        alert("Please use 'Apply Again' to create a new application.");
        return;
      }

      if (existingApplication?.status === STATUS.application.INFO_REQUESTED) {
        alert(
          "Please use 'Resubmit Application' after updating your application."
        );
        return;
      }

      if (selectedOpportunity.status !== STATUS.opportunity.ACTIVE) {
        alert(
          "This internship opportunity is closed and is no longer accepting new applications."
        );
        return;
      }

      if (hasActiveAssignment) {
        alert(
          "You already have a confirmed internship placement. You cannot create another application."
        );
        return;
      }

      if (hasPlacementOffer) {
        alert(
          "You have an internship placement offer waiting for confirmation. Please confirm or decline that offer first."
        );
        return;
      }

      const newDraft = await createApplicationDraft(user);

      const uploadResult = await uploadPendingDocuments(newDraft.id, user.id);

      if (uploadResult.failed.length > 0) {
        const failedNames = uploadResult.failed
          .map((item) => {
            const type = documentTypes.find(
              (documentType) => documentType.id === item.documentTypeId
            );

            return type?.name || "Document";
          })
          .join(", ");

        alert(
          `Application draft saved, but these documents could not be uploaded: ${failedNames}`
        );

        return;
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
  // OPPORTUNITY SEARCH + SORT
  // =========================================================

  // =========================================================
  // OPPORTUNITY SEARCH + INDUSTRY FILTER + SORT
  // =========================================================

  const industryOptions = useMemo(() => {
    return Array.from(
      new Set(
        opportunities
          .filter(
            (opportunity) => opportunity.status === STATUS.opportunity.ACTIVE
          )
          .map((opportunity) => opportunity.companies?.industry)
          .filter(Boolean)
          .map((industry) => String(industry).trim())
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b));
  }, [opportunities]);

  const filteredActiveOpportunities = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const active = opportunities.filter(
      (opportunity) => opportunity.status === STATUS.opportunity.ACTIVE
    );

    const filtered = active.filter((opportunity) => {
      // INDUSTRY FILTER
      const selectedIndustry = String(
        opportunity.companies?.industry || ""
      ).trim();

      if (
        industryFilter !== "all" &&
        selectedIndustry.toLowerCase() !== industryFilter.toLowerCase()
      ) {
        return false;
      }

      // SEARCH FILTER
      if (!query) {
        return true;
      }

      const searchableText = [
        opportunity.title,
        opportunity.description,
        opportunity.location,
        opportunity.companies?.company_name,
        opportunity.companies?.company_address,
        opportunity.companies?.industry,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    });

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "oldest": {
          const dateA = new Date(a.created_at || 0).getTime();
          const dateB = new Date(b.created_at || 0).getTime();

          return dateA - dateB;
        }

        case "title_asc":
          return String(a.title || "").localeCompare(String(b.title || ""));

        case "title_desc":
          return String(b.title || "").localeCompare(String(a.title || ""));

        case "most_openings": {
          const capacityA = getOpportunityCapacity(a.id);
          const capacityB = getOpportunityCapacity(b.id);

          return (
            Number(capacityB?.available_slots || 0) -
            Number(capacityA?.available_slots || 0)
          );
        }

        case "least_openings": {
          const capacityA = getOpportunityCapacity(a.id);
          const capacityB = getOpportunityCapacity(b.id);

          return (
            Number(capacityA?.available_slots || 0) -
            Number(capacityB?.available_slots || 0)
          );
        }

        case "newest":
        default: {
          const dateA = new Date(a.created_at || 0).getTime();
          const dateB = new Date(b.created_at || 0).getTime();

          return dateB - dateA;
        }
      }
    });
  }, [
    opportunities,
    searchQuery,
    industryFilter,
    sortBy,
    capacityByOpportunityId,
  ]);

  // Reset stale industry filter if the selected industry
  // no longer exists in the currently loaded opportunities.
  useEffect(() => {
    if (industryFilter !== "all" && !industryOptions.includes(industryFilter)) {
      setIndustryFilter("all");
    }
  }, [industryFilter, industryOptions]);

  const hasOpportunityFilters =
    searchQuery.trim().length > 0 || industryFilter !== "all";

  // =========================================================
  // OPEN STATUS PAGE
  // =========================================================

  const handleViewStatusPage = () => {
    navigate("/student/status");
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          darkMode ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900"
        }`}
      >
        <div className="text-center">
          <div className="text-4xl mb-3 animate-pulse">📋</div>

          <p className="font-semibold">Loading internship opportunities...</p>
        </div>
      </div>
    );
  }

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div
      className={`min-h-screen ${
        darkMode ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* ===================================================
            HEADER
        =================================================== */}

        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p
                className={`text-xs font-bold uppercase tracking-wider ${
                  darkMode ? "text-blue-400" : "text-blue-600"
                }`}
              >
                Student Internship
              </p>

              <h1 className="text-2xl sm:text-3xl font-black mt-1">
                Internship Application
              </h1>

              <p
                className={`text-sm mt-1 ${
                  darkMode ? "text-slate-400" : "text-slate-500"
                }`}
              >
                Find an internship opportunity, submit your application, and
                track your progress.
              </p>
            </div>

            <button
              type="button"
              onClick={handleViewStatusPage}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition"
            >
              View Full Status
            </button>
          </div>
        </div>

        {/* ===================================================
            TABS
        =================================================== */}

        <div
          className={`flex gap-2 p-1 rounded-xl mb-6 ${
            darkMode ? "bg-slate-900" : "bg-white border border-slate-200"
          }`}
        >
          <button
            type="button"
            onClick={() => {
              setActiveTab("apply");
              setOpportunityView("browse");
            }}
            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-bold transition ${
              activeTab === "apply"
                ? "bg-blue-600 text-white shadow"
                : darkMode
                ? "text-slate-400 hover:text-white"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Apply
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("status")}
            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-bold transition ${
              activeTab === "status"
                ? "bg-blue-600 text-white shadow"
                : darkMode
                ? "text-slate-400 hover:text-white"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            View Application Status
          </button>
        </div>

        {/* ===================================================
            APPLY TAB
        =================================================== */}

        {activeTab === "apply" && (
          <div className="space-y-6">
            {/* CURRENT PLACEMENT */}

            {hasFinalPlacement && latestAssignment && (
              <div
                className={`rounded-2xl border p-5 ${
                  darkMode
                    ? "bg-slate-900 border-slate-800"
                    : "bg-white border-slate-200"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl">
                    {getAssignmentStatusInfo(latestAssignment)?.icon}
                  </div>

                  <div>
                    <h2 className="font-black">
                      {getAssignmentStatusInfo(latestAssignment)?.title}
                    </h2>

                    <p
                      className={`text-sm mt-1 ${
                        darkMode ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
                      {getAssignmentStatusInfo(latestAssignment)?.description}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* PLACEMENT OFFER */}

            {hasPlacementOffer && approvedApplication && (
              <div
                className={`rounded-2xl border p-5 ${
                  darkMode
                    ? "bg-blue-950/30 border-blue-900"
                    : "bg-blue-50 border-blue-200"
                }`}
              >
                <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                  Internship Placement Offer
                </p>

                <h2 className="text-lg font-black mt-1">
                  Your application has been approved
                </h2>

                <p
                  className={`text-sm mt-2 ${
                    darkMode ? "text-slate-300" : "text-slate-600"
                  }`}
                >
                  Please review the placement and confirm or decline it from the
                  View Status section.
                </p>

                <button
                  type="button"
                  onClick={() => setActiveTab("status")}
                  className="mt-4 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700"
                >
                  Review Placement
                </button>
              </div>
            )}

            {/* =================================================
                BROWSE OPPORTUNITIES
            ================================================= */}

            {opportunityView === "browse" && (
              <div className="space-y-5">
                {/* SEARCH + FILTER + SORT */}

                <div
                  className={`rounded-2xl border p-4 ${
                    darkMode
                      ? "bg-slate-900 border-slate-800"
                      : "bg-white border-slate-200"
                  }`}
                >
                  <div className="flex flex-col lg:flex-row gap-3">
                    {/* SEARCH */}

                    <div className="relative flex-1 min-w-0">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        🔍
                      </span>

                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        placeholder="Search internships, companies, locations..."
                        className={`w-full rounded-xl border pl-11 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${
                          darkMode
                            ? "bg-slate-950 border-slate-700 text-white placeholder:text-slate-600"
                            : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400"
                        }`}
                      />
                    </div>

                    {/* INDUSTRY + SORT */}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* INDUSTRY */}

                      <div className="flex items-center gap-2">
                        <label
                          className={`text-xs font-bold whitespace-nowrap ${
                            darkMode ? "text-slate-400" : "text-slate-500"
                          }`}
                        >
                          Industry
                        </label>

                        <select
                          value={industryFilter}
                          onChange={(event) =>
                            setIndustryFilter(event.target.value)
                          }
                          className={`w-full rounded-xl border px-3 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500 ${
                            darkMode
                              ? "bg-slate-950 border-slate-700 text-white"
                              : "bg-slate-50 border-slate-200 text-slate-900"
                          }`}
                        >
                          <option value="all">All Industries</option>

                          {industryOptions.map((industry) => (
                            <option key={industry} value={industry}>
                              {industry}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* SORT */}

                      <div className="flex items-center gap-2">
                        <label
                          className={`text-xs font-bold whitespace-nowrap ${
                            darkMode ? "text-slate-400" : "text-slate-500"
                          }`}
                        >
                          Sort by
                        </label>

                        <select
                          value={sortBy}
                          onChange={(event) => setSortBy(event.target.value)}
                          className={`w-full rounded-xl border px-3 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500 ${
                            darkMode
                              ? "bg-slate-950 border-slate-700 text-white"
                              : "bg-slate-50 border-slate-200 text-slate-900"
                          }`}
                        >
                          <option value="newest">Newest</option>
                          <option value="oldest">Oldest</option>
                          <option value="title_asc">Title A–Z</option>
                          <option value="title_desc">Title Z–A</option>
                          <option value="most_openings">Most Openings</option>
                          <option value="least_openings">Least Openings</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* OPPORTUNITY HEADER */}

                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-black">
                      Available Internship Opportunities
                    </h2>

                    <p
                      className={`text-sm mt-1 ${
                        darkMode ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
                      Browse available internships and choose an opportunity to
                      learn more.
                    </p>
                  </div>

                  <p className="text-xs font-bold text-slate-500">
                    {filteredActiveOpportunities.length}{" "}
                    {filteredActiveOpportunities.length === 1
                      ? "opportunity"
                      : "opportunities"}
                  </p>
                </div>

                {/* OPPORTUNITY LIST */}

                {filteredActiveOpportunities.length === 0 ? (
                  <div
                    className={`rounded-2xl border p-10 text-center ${
                      darkMode
                        ? "bg-slate-900 border-slate-800"
                        : "bg-white border-slate-200"
                    }`}
                  >
                    <div className="text-4xl mb-3">
                      {hasOpportunityFilters ? "🔎" : "📭"}
                    </div>

                    <p className="font-bold">
                      {hasOpportunityFilters
                        ? "No internships found."
                        : "No internship opportunities are currently available."}
                    </p>

                    <p
                      className={`text-sm mt-1 ${
                        darkMode ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
                      {hasOpportunityFilters
                        ? "Try a different search term or industry filter."
                        : "Please check again later."}
                    </p>

                    {hasOpportunityFilters && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery("");
                          setIndustryFilter("all");
                        }}
                        className="mt-4 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700"
                      >
                        Clear Filters
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredActiveOpportunities.map((opportunity) => {
                      const capacity = getOpportunityCapacity(opportunity.id);

                      const full =
                        capacity && Number(capacity.available_slots) <= 0;

                      const applicationForOpportunity = applications.find(
                        (application) =>
                          application.opportunity_id === opportunity.id &&
                          ![
                            STATUS.application.REJECTED,
                            STATUS.application.WITHDRAWN,
                          ].includes(application.status)
                      );

                      const canApply =
                        !full &&
                        !hasActiveAssignment &&
                        !hasPlacementOffer &&
                        !hasCompletedPlacementForOpportunity(opportunity.id);

                      return (
                        <div
                          key={opportunity.id}
                          className={`rounded-2xl border p-5 transition hover:-translate-y-0.5 ${
                            darkMode
                              ? "bg-slate-900 border-slate-800 hover:border-slate-700"
                              : "bg-white border-slate-200 hover:border-slate-300 shadow-sm"
                          }`}
                        >
                          {/* CARD HEADER */}

                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h3 className="font-black text-base truncate">
                                {opportunity.title || "Internship Opportunity"}
                              </h3>

                              <p
                                className={`text-xs mt-1 truncate ${
                                  darkMode ? "text-slate-400" : "text-slate-500"
                                }`}
                              >
                                {opportunity.companies?.company_name ||
                                  "Company"}
                              </p>
                            </div>

                            <span
                              className={`flex-shrink-0 text-[10px] font-black px-2 py-1 rounded-full ${
                                full
                                  ? "bg-red-100 text-red-700"
                                  : "bg-emerald-100 text-emerald-700"
                              }`}
                            >
                              {full ? "FULL" : "OPEN"}
                            </span>
                          </div>

                          {/* CARD INFO */}

                          <div
                            className={`mt-5 space-y-2 text-xs ${
                              darkMode ? "text-slate-400" : "text-slate-500"
                            }`}
                          >
                            <p className="flex gap-2">
                              <span>📍</span>

                              <span className="truncate">
                                {opportunity.location ||
                                  opportunity.companies?.company_address ||
                                  "Location not specified"}
                              </span>
                            </p>

                            {opportunity.companies?.industry && (
                              <p className="flex gap-2">
                                <span>🏢</span>
                                <span className="truncate">
                                  {opportunity.companies.industry}
                                </span>
                              </p>
                            )}

                            <p className="flex gap-2">
                              <span>📅</span>

                              <span>{formatInternshipPeriod(opportunity)}</span>
                            </p>

                            {capacity && (
                              <p className="flex gap-2">
                                <span>👥</span>

                                <span>
                                  {capacity.available_slots} slot
                                  {Number(capacity.available_slots) === 1
                                    ? ""
                                    : "s"}{" "}
                                  available
                                </span>
                              </p>
                            )}
                          </div>

                          {/* APPLICATION STATUS */}

                          {applicationForOpportunity && (
                            <div className="mt-4">
                              <span
                                className={`text-xs font-bold ${statusTone(
                                  applicationForOpportunity.status
                                )}`}
                              >
                                Application:{" "}
                                {formatStatus(applicationForOpportunity.status)}
                              </span>
                            </div>
                          )}

                          {/* CARD ACTIONS */}

                          <div className="flex gap-2 mt-5 pt-4 border-t border-slate-200 dark:border-slate-800">
                            <button
                              type="button"
                              onClick={() =>
                                handleViewOpportunityDetails(opportunity)
                              }
                              className={`flex-1 px-3 py-2.5 rounded-lg border text-xs font-bold transition ${
                                darkMode
                                  ? "border-slate-700 text-slate-200 hover:bg-slate-800"
                                  : "border-slate-200 text-slate-700 hover:bg-slate-50"
                              }`}
                            >
                              View Details
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                if (applicationForOpportunity) {
                                  setActiveTab("status");
                                  setOpportunityView("browse");
                                  return;
                                }

                                handleApplyNow(opportunity);
                              }}
                              disabled={!applicationForOpportunity && !canApply}
                              className="flex-1 px-3 py-2.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {applicationForOpportunity
                                ? "View Status"
                                : "Apply Now"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* =================================================
                OPPORTUNITY DETAILS
            ================================================= */}

            {opportunityView === "details" && detailsOpportunity && (
              <div
                className={`rounded-2xl border overflow-hidden ${
                  darkMode
                    ? "bg-slate-900 border-slate-800"
                    : "bg-white border-slate-200"
                }`}
              >
                {/* BACK */}

                <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={handleBackToOpportunities}
                    className={`text-sm font-bold ${
                      darkMode
                        ? "text-slate-300 hover:text-white"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    ← Back to Opportunities
                  </button>
                </div>

                {/* DETAILS HEADER */}

                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                        Internship Opportunity
                      </p>

                      <h2 className="text-2xl sm:text-3xl font-black mt-1">
                        {detailsOpportunity.title || "Internship Opportunity"}
                      </h2>

                      <p
                        className={`mt-2 ${
                          darkMode ? "text-slate-400" : "text-slate-500"
                        }`}
                      >
                        {detailsOpportunity.companies?.company_name ||
                          "Company"}
                      </p>
                    </div>

                    <span className="self-start px-3 py-1.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-700">
                      OPEN
                    </span>
                  </div>

                  {/* DETAILS GRID */}

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-7">
                    <div
                      className={`rounded-xl p-4 ${
                        darkMode ? "bg-slate-800" : "bg-slate-50"
                      }`}
                    >
                      <p className="text-[10px] font-bold uppercase text-slate-500">
                        Company
                      </p>

                      <p className="text-sm font-bold mt-1">
                        {detailsOpportunity.companies?.company_name ||
                          "Not specified"}
                      </p>
                    </div>

                    <div
                      className={`rounded-xl p-4 ${
                        darkMode ? "bg-slate-800" : "bg-slate-50"
                      }`}
                    >
                      <p className="text-[10px] font-bold uppercase text-slate-500">
                        Location
                      </p>

                      <p className="text-sm font-bold mt-1">
                        {detailsOpportunity.location ||
                          detailsOpportunity.companies?.company_address ||
                          "Not specified"}
                      </p>
                    </div>

                    <div
                      className={`rounded-xl p-4 ${
                        darkMode ? "bg-slate-800" : "bg-slate-50"
                      }`}
                    >
                      <p className="text-[10px] font-bold uppercase text-slate-500">
                        Internship Period
                      </p>

                      <p className="text-sm font-bold mt-1">
                        {formatInternshipPeriod(detailsOpportunity)}
                      </p>
                    </div>

                    <div
                      className={`rounded-xl p-4 ${
                        darkMode ? "bg-slate-800" : "bg-slate-50"
                      }`}
                    >
                      <p className="text-[10px] font-bold uppercase text-slate-500">
                        Available Slots
                      </p>

                      <p className="text-sm font-bold mt-1">
                        {getOpportunityCapacity(detailsOpportunity.id)
                          ? getOpportunityCapacity(detailsOpportunity.id)
                              .available_slots
                          : "Checking..."}
                      </p>
                    </div>
                  </div>

                  {/* DESCRIPTION */}

                  {detailsOpportunity.description && (
                    <div className="mt-7">
                      <h3 className="font-black text-base mb-2">Description</h3>

                      <p
                        className={`text-sm leading-6 whitespace-pre-wrap ${
                          darkMode ? "text-slate-300" : "text-slate-600"
                        }`}
                      >
                        {detailsOpportunity.description}
                      </p>
                    </div>
                  )}

                  {/* REQUIREMENTS */}

                  {(() => {
                    const systemRequirements = documentTypes.filter(
                      (documentType) => documentType.required
                    );

                    const optionalRequirements = getRequirementIds(
                      detailsOpportunity.requirements
                    )
                      .map((id) =>
                        documentTypes.find(
                          (documentType) => documentType.id === id
                        )
                      )
                      .filter(Boolean)
                      .filter(
                        (documentType) =>
                          !systemRequirements.some(
                            (systemDocument) =>
                              systemDocument.id === documentType.id
                          )
                      );

                    const allRequirements = [
                      ...systemRequirements,
                      ...optionalRequirements,
                    ];

                    return (
                      allRequirements.length > 0 && (
                        <div className="mt-7">
                          <h3 className="font-black text-base mb-3">
                            Required Documents
                          </h3>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {allRequirements.map((documentType) => (
                              <div
                                key={documentType.id}
                                className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs ${
                                  darkMode
                                    ? "bg-slate-800 text-slate-300"
                                    : "bg-slate-50 text-slate-600"
                                }`}
                              >
                                <span>📄</span>

                                <span className="font-semibold">
                                  {documentType.name}
                                </span>

                                {!documentType.required && (
                                  <span className="ml-auto text-[9px] font-black text-purple-600">
                                    ADDITIONAL
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    );
                  })()}

                  {/* DETAILS ACTIONS */}

                  <div className="flex flex-wrap gap-3 mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={handleBackToOpportunities}
                      className={`px-5 py-2.5 rounded-lg border text-sm font-bold ${
                        darkMode
                          ? "border-slate-700 hover:bg-slate-800"
                          : "border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      Back
                    </button>

                    <button
                      type="button"
                      disabled={
                        !getOpportunityCapacity(detailsOpportunity.id) ||
                        Number(
                          getOpportunityCapacity(detailsOpportunity.id)
                            ?.available_slots || 0
                        ) <= 0 ||
                        hasActiveAssignment ||
                        hasPlacementOffer ||
                        hasCompletedPlacementForOpportunity(
                          detailsOpportunity.id
                        )
                      }
                      onClick={() => handleApplyNow(detailsOpportunity)}
                      className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Apply Now
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* =================================================
                APPLICATION FORM
            ================================================= */}

            {opportunityView === "form" && selectedOpportunity && (
              <div
                className={`rounded-2xl border overflow-hidden ${
                  darkMode
                    ? "bg-slate-900 border-slate-800"
                    : "bg-white border-slate-200"
                }`}
              >
                {/* FORM HEADER */}

                <div className="p-5 border-b border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setOpportunityView("browse")}
                    className={`text-sm font-bold ${
                      darkMode
                        ? "text-slate-300 hover:text-white"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    ← Back to Opportunities
                  </button>

                  <div className="mt-5">
                    <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                      Internship Application
                    </p>

                    <h2 className="text-2xl font-black mt-1">
                      {selectedOpportunity.title || "Internship Opportunity"}
                    </h2>

                    <p
                      className={`mt-1 ${
                        darkMode ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
                      {selectedOpportunity.companies?.company_name || "Company"}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
                    <div>
                      <p className="text-[10px] font-bold uppercase text-slate-500">
                        Location
                      </p>

                      <p className="text-sm font-bold mt-1">
                        {selectedOpportunity.location ||
                          selectedOpportunity.companies?.company_address ||
                          "Not specified"}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold uppercase text-slate-500">
                        Internship Period
                      </p>

                      <p className="text-sm font-bold mt-1">
                        {formatInternshipPeriod(selectedOpportunity)}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold uppercase text-slate-500">
                        Available Slots
                      </p>

                      <p className="text-sm font-bold mt-1">
                        {selectedOpportunityCapacity
                          ? selectedOpportunityCapacity.available_slots
                          : "Checking..."}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  {/* CLOSED */}

                  {!selectedOpportunityIsActive && (
                    <div
                      className={`rounded-xl p-4 border ${
                        darkMode
                          ? "bg-slate-800/50 border-slate-700"
                          : "bg-slate-50 border-slate-200"
                      }`}
                    >
                      <p className="font-bold text-sm">
                        This opportunity is closed.
                      </p>

                      <p
                        className={`text-xs mt-1 ${
                          darkMode ? "text-slate-400" : "text-slate-500"
                        }`}
                      >
                        New applications are no longer accepted for this
                        opportunity.
                      </p>
                    </div>
                  )}

                  {/* FULL */}

                  {selectedOpportunityIsActive && selectedOpportunityIsFull && (
                    <div
                      className={`rounded-xl p-4 border ${
                        darkMode
                          ? "bg-red-950/30 border-red-900"
                          : "bg-red-50 border-red-200"
                      }`}
                    >
                      <p className="font-bold text-sm text-red-600">
                        This opportunity is currently full.
                      </p>

                      <p className="text-xs text-red-600/80 mt-1">
                        No available slot remains for a new application.
                      </p>
                    </div>
                  )}

                  {/* INFO REQUESTED */}

                  {existingApplication?.status ===
                    STATUS.application.INFO_REQUESTED && (
                    <div
                      className={`rounded-xl p-4 border mb-5 ${
                        darkMode
                          ? "bg-orange-950/30 border-orange-900"
                          : "bg-orange-50 border-orange-200"
                      }`}
                    >
                      <p className="font-bold text-sm text-orange-600">
                        Additional information requested
                      </p>

                      <p className="text-xs mt-1 text-orange-600/80">
                        The Registrar requested changes or additional
                        information. Update your application and any documents
                        marked for revision, then resubmit it.
                      </p>

                      {existingApplication.notes && (
                        <div className="mt-3">
                          <p className="text-[10px] font-bold uppercase text-orange-600">
                            Registrar Notes
                          </p>

                          <p className="text-sm mt-1 whitespace-pre-wrap text-orange-700">
                            {existingApplication.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* REJECTED / WITHDRAWN

                  {!isReapplying &&
                    (existingApplication?.status ===
                      STATUS.application.REJECTED ||
                      existingApplication?.status ===
                        STATUS.application.WITHDRAWN) && (
                      <div
                        className={`rounded-xl p-4 border mb-5 ${
                          darkMode
                            ? "bg-slate-800/50 border-slate-700"
                            : "bg-slate-50 border-slate-200"
                        }`}
                      >
                        <p
                          className={`font-bold text-sm ${
                            existingApplication.status ===
                            STATUS.application.REJECTED
                              ? "text-red-600"
                              : "text-slate-600"
                          }`}
                        >
                          {formatStatus(existingApplication.status)}
                        </p>

                        {existingApplication.status ===
                          STATUS.application.REJECTED && (
                          <p className="text-xs mt-2">
                            Rejected by{" "}
                            {getRejectionInfo(existingApplication).source}.
                          </p>
                        )}

                        {existingApplication.notes && (
                          <p className="text-xs mt-2 whitespace-pre-wrap">
                            {getRejectionInfo(existingApplication).reason}
                          </p>
                        )}

                        {canApplyAgain(selectedOpportunity.id) && (
                          <button
                            type="button"
                            onClick={() =>
                              handleApplyAgain(selectedOpportunity)
                            }
                            className="mt-4 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700"
                          >
                            Apply Again
                          </button>
                        )}
                      </div>
                    )} */}

                  {/* ACTIVE APPLICATION */}

                  {existingApplication &&
                    ![
                      STATUS.application.DRAFT,
                      STATUS.application.INFO_REQUESTED,
                      STATUS.application.REJECTED,
                      STATUS.application.WITHDRAWN,
                    ].includes(existingApplication.status) && (
                      <div
                        className={`rounded-xl p-4 mb-5 ${
                          darkMode ? "bg-slate-800" : "bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-bold uppercase text-slate-500">
                              Application Status
                            </p>

                            <p
                              className={`font-black mt-1 ${statusTone(
                                existingApplication.status
                              )}`}
                            >
                              {formatStatus(existingApplication.status)}
                            </p>
                          </div>

                          <span className="text-xs text-slate-500">
                            {formatDateTime(existingApplication.created_at)}
                          </span>
                        </div>
                      </div>
                    )}

                  {/* EDITABLE FORM */}

                  {!hasActiveAssignment &&
                    !hasPlacementOffer &&
                    (!existingApplication ||
                      existingApplication.status === STATUS.application.DRAFT ||
                      existingApplication.status ===
                        STATUS.application.INFO_REQUESTED ||
                      existingApplication.status ===
                        STATUS.application.REJECTED ||
                      existingApplication.status ===
                        STATUS.application.WITHDRAWN ||
                      isReapplying) && (
                      <div className="space-y-5">
                        {/* RESUME */}

                        {!hasResume && (
                          <div
                            className={`rounded-xl p-4 border ${
                              darkMode
                                ? "bg-orange-950/30 border-orange-900"
                                : "bg-orange-50 border-orange-200"
                            }`}
                          >
                            <p className="font-bold text-sm text-orange-600">
                              Resume/CV required
                            </p>

                            <p className="text-xs mt-1 text-orange-600/80">
                              Please upload your Resume/CV in your Student
                              Profile before submitting an internship
                              application.
                            </p>

                            <button
                              type="button"
                              onClick={() => navigate("/student/profile")}
                              className="mt-3 px-4 py-2 rounded-lg bg-orange-600 text-white text-xs font-bold hover:bg-orange-700"
                            >
                              Go to Profile
                            </button>
                          </div>
                        )}

                        {/* COVER LETTER */}

                        <div>
                          <label className="block text-sm font-black mb-2">
                            Cover Letter
                            <span className="text-red-500 ml-1">*</span>
                          </label>

                          <textarea
                            value={coverLetter}
                            onChange={(event) =>
                              setCoverLetter(event.target.value)
                            }
                            rows={7}
                            placeholder="Explain why you are interested in this internship and why you would be a good fit."
                            className={`w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${
                              darkMode
                                ? "bg-slate-950 border-slate-700 text-white placeholder:text-slate-600"
                                : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400"
                            }`}
                          />
                        </div>

                        {/* REQUIRED DOCUMENTS */}

                        <div
                          className={`rounded-2xl border p-5 ${
                            darkMode
                              ? "border-slate-700 bg-slate-800/50"
                              : "border-slate-200 bg-slate-50"
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-sm font-black">
                                  Required Internship Documents
                                </h3>

                                <span
                                  className={`text-[10px] font-black px-2 py-1 rounded-full ${
                                    selectedDocumentSummary.uploaded ===
                                    selectedDocumentSummary.total
                                      ? "bg-emerald-100 text-emerald-700"
                                      : "bg-orange-100 text-orange-700"
                                  }`}
                                >
                                  {selectedDocumentSummary.uploaded}/
                                  {selectedDocumentSummary.total}
                                </span>
                              </div>

                              <p
                                className={`text-xs mt-1 ${
                                  darkMode ? "text-slate-400" : "text-slate-500"
                                }`}
                              >
                                Upload the required internship documents before
                                submitting your application. You may save a
                                draft while some documents are still missing.
                              </p>
                            </div>

                            {selectedDocumentSummary.ready > 0 && (
                              <span className="text-xs font-bold text-blue-600">
                                {selectedDocumentSummary.ready} ready to upload
                              </span>
                            )}
                          </div>

                          {requiredDocumentTypes.length === 0 ? (
                            <div
                              className={`mt-4 rounded-xl p-4 text-sm ${
                                darkMode
                                  ? "bg-slate-900 text-slate-400"
                                  : "bg-white text-slate-500"
                              }`}
                            >
                              No document requirements are currently configured.
                            </div>
                          ) : (
                            <div className="mt-5 space-y-3">
                              {requiredDocumentTypes.map((documentType) => {
                                const document = getApplicationDocument(
                                  existingApplication?.id,
                                  documentType.id
                                );

                                const selectedFile =
                                  selectedDocumentFiles[documentType.id];

                                const isUploading = Boolean(
                                  uploadingDocumentTypeIds[documentType.id]
                                );

                                const statusInfo =
                                  getDocumentStatusInfo(document);

                                return (
                                  <div
                                    key={documentType.id}
                                    className={`rounded-xl border p-4 ${
                                      darkMode
                                        ? "border-slate-700 bg-slate-900"
                                        : "border-slate-200 bg-white"
                                    }`}
                                  >
                                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                                      <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                          <h4 className="text-sm font-black">
                                            {documentType.name}
                                          </h4>

                                          <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                                            REQUIRED
                                          </span>

                                          {!documentType.required && (
                                            <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                                              ADDITIONAL
                                            </span>
                                          )}
                                        </div>

                                        {documentType.description && (
                                          <p
                                            className={`text-xs mt-1 ${
                                              darkMode
                                                ? "text-slate-400"
                                                : "text-slate-500"
                                            }`}
                                          >
                                            {documentType.description}
                                          </p>
                                        )}

                                        {document && (
                                          <div className="mt-3">
                                            <span
                                              className={`inline-flex items-center text-[10px] font-black px-2 py-1 rounded-full ${statusInfo.bg} ${statusInfo.tone}`}
                                            >
                                              {statusInfo.label}
                                            </span>

                                            <p
                                              className={`text-xs mt-2 break-all ${
                                                darkMode
                                                  ? "text-slate-300"
                                                  : "text-slate-600"
                                              }`}
                                            >
                                              📎 {document.file_name}
                                              {Number(document.version) > 1 &&
                                                ` • Version ${document.version}`}
                                            </p>

                                            {document.status ===
                                              STATUS.document.NEEDS_REVISION &&
                                              document.notes && (
                                                <div
                                                  className={`mt-2 rounded-lg p-3 text-xs ${
                                                    darkMode
                                                      ? "bg-orange-950/30 text-orange-300"
                                                      : "bg-orange-50 text-orange-700"
                                                  }`}
                                                >
                                                  <p className="font-bold">
                                                    Revision Note
                                                  </p>

                                                  <p className="mt-1 whitespace-pre-wrap">
                                                    {document.notes}
                                                  </p>
                                                </div>
                                              )}
                                          </div>
                                        )}

                                        {!document && !selectedFile && (
                                          <p className="text-xs mt-3 text-slate-500">
                                            No file uploaded yet.
                                          </p>
                                        )}

                                        {selectedFile && (
                                          <div
                                            className={`mt-3 rounded-lg px-3 py-2 text-xs ${
                                              darkMode
                                                ? "bg-blue-950/40 text-blue-300"
                                                : "bg-blue-50 text-blue-700"
                                            }`}
                                          >
                                            <span className="font-bold">
                                              Ready to upload:
                                            </span>{" "}
                                            {selectedFile.name}
                                          </div>
                                        )}
                                      </div>

                                      <div className="flex flex-wrap gap-2 lg:justify-end">
                                        <input
                                          id={`document-${documentType.id}`}
                                          type="file"
                                          className="hidden"
                                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                          disabled={isUploading || isSubmitting}
                                          onChange={(event) => {
                                            const file =
                                              event.target.files?.[0] || null;

                                            handleDocumentFileSelect(
                                              documentType.id,
                                              file
                                            );

                                            event.target.value = "";
                                          }}
                                        />

                                        <label
                                          htmlFor={`document-${documentType.id}`}
                                          className={`inline-flex items-center justify-center px-3 py-2 rounded-lg text-xs font-bold cursor-pointer transition ${
                                            isUploading || isSubmitting
                                              ? "opacity-50 cursor-not-allowed bg-slate-200 text-slate-500"
                                              : "bg-slate-700 text-white hover:bg-slate-800"
                                          }`}
                                        >
                                          {document
                                            ? "Choose Replacement"
                                            : "Choose File"}
                                        </label>

                                        {selectedFile && (
                                          <>
                                            <button
                                              type="button"
                                              disabled={
                                                isUploading || isSubmitting
                                              }
                                              onClick={async () => {
                                                if (!existingApplication) {
                                                  alert(
                                                    "Please save the application as a draft first before manually uploading this document."
                                                  );

                                                  return;
                                                }

                                                try {
                                                  setUploadingDocumentTypeIds(
                                                    (previous) => ({
                                                      ...previous,
                                                      [documentType.id]: true,
                                                    })
                                                  );

                                                  const {
                                                    data: { user },
                                                  } =
                                                    await supabaseStudent.auth.getUser();

                                                  if (!user) {
                                                    throw new Error(
                                                      "You are not logged in."
                                                    );
                                                  }

                                                  const savedDocument =
                                                    await uploadDocumentFile(
                                                      existingApplication.id,
                                                      documentType.id,
                                                      selectedFile,
                                                      user.id
                                                    );

                                                  setApplicationDocuments(
                                                    (previous) => {
                                                      const filtered =
                                                        previous.filter(
                                                          (item) =>
                                                            !(
                                                              item.application_id ===
                                                                existingApplication.id &&
                                                              item.document_type_id ===
                                                                documentType.id
                                                            )
                                                        );

                                                      return [
                                                        savedDocument,
                                                        ...filtered,
                                                      ];
                                                    }
                                                  );

                                                  setSelectedDocumentFiles(
                                                    (previous) => {
                                                      const next = {
                                                        ...previous,
                                                      };

                                                      delete next[
                                                        documentType.id
                                                      ];

                                                      return next;
                                                    }
                                                  );

                                                  alert(
                                                    `${documentType.name} uploaded successfully.`
                                                  );
                                                } catch (error) {
                                                  console.error(
                                                    "Error uploading document:",
                                                    error
                                                  );

                                                  alert(
                                                    error.message ||
                                                      "Unable to upload the document."
                                                  );
                                                } finally {
                                                  setUploadingDocumentTypeIds(
                                                    (previous) => {
                                                      const next = {
                                                        ...previous,
                                                      };

                                                      delete next[
                                                        documentType.id
                                                      ];

                                                      return next;
                                                    }
                                                  );
                                                }
                                              }}
                                              className="px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 disabled:opacity-50"
                                            >
                                              {isUploading
                                                ? "Uploading..."
                                                : "Upload"}
                                            </button>

                                            <button
                                              type="button"
                                              disabled={isUploading}
                                              onClick={() =>
                                                handleRemoveSelectedDocumentFile(
                                                  documentType.id
                                                )
                                              }
                                              className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
                                            >
                                              Remove
                                            </button>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          <div
                            className={`mt-4 text-[11px] ${
                              darkMode ? "text-slate-500" : "text-slate-400"
                            }`}
                          >
                            Accepted file types: PDF, DOC, DOCX, JPG, JPEG, PNG.
                          </div>
                        </div>

                        {/* FULL WARNING */}

                        {selectedOpportunityIsFull && (
                          <div
                            className={`rounded-xl p-4 border ${
                              darkMode
                                ? "bg-red-950/30 border-red-900"
                                : "bg-red-50 border-red-200"
                            }`}
                          >
                            <p className="font-bold text-sm text-red-600">
                              This opportunity is currently full.
                            </p>

                            <p className="text-xs mt-1 text-red-600/80">
                              You can save your application as a draft, but
                              submission will remain unavailable until a slot
                              becomes available.
                            </p>
                          </div>
                        )}

                        {/* ACTIONS */}

                        <div className="flex flex-wrap gap-2 pt-2">
                          {(!existingApplication ||
                            existingApplication.status ===
                              STATUS.application.DRAFT ||
                            isReapplying) && (
                            <button
                              type="button"
                              onClick={handleSaveDraft}
                              disabled={isSubmitting}
                              className="px-5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-sm font-bold hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
                            >
                              {isSubmitting ? "Saving..." : "Save Draft"}
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={handleSubmitApplication}
                            disabled={
                              isSubmitting ||
                              !hasResume ||
                              (selectedOpportunityIsActive &&
                                selectedOpportunityIsFull)
                            }
                            className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isSubmitting
                              ? "Processing..."
                              : existingApplication?.status ===
                                STATUS.application.INFO_REQUESTED
                              ? "Resubmit Application"
                              : "Submit Application"}
                          </button>
                        </div>

                        <p
                          className={`text-[11px] ${
                            darkMode ? "text-slate-500" : "text-slate-400"
                          }`}
                        >
                          Submission requires your Resume/CV and all required
                          internship documents. Selected files that have not
                          been uploaded yet will be uploaded automatically when
                          you submit.
                        </p>
                      </div>
                    )}

                  {/* COMPLETED / TERMINATED PLACEMENT */}

                  {hasAnyAssignment &&
                    selectedOpportunity &&
                    assignments.some(
                      (assignment) =>
                        assignment.opportunity_id === selectedOpportunity.id &&
                        [
                          STATUS.assignment.COMPLETED,
                          STATUS.assignment.TERMINATED,
                        ].includes(assignment.status)
                    ) && (
                      <div
                        className={`rounded-xl p-4 mt-5 ${
                          darkMode ? "bg-slate-800" : "bg-slate-50"
                        }`}
                      >
                        <p className="font-bold text-sm">
                          Previous placement record
                        </p>

                        <p
                          className={`text-xs mt-1 ${
                            darkMode ? "text-slate-400" : "text-slate-500"
                          }`}
                        >
                          This opportunity has an existing internship placement
                          history.
                        </p>
                      </div>
                    )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===================================================
            STATUS TAB
        =================================================== */}

        {activeTab === "status" && (
          <div className="space-y-6">
            {/* PLACEMENT OFFER */}

            {hasPlacementOffer && approvedApplication && (
              <div
                className={`rounded-2xl border p-5 ${
                  darkMode
                    ? "bg-blue-950/30 border-blue-900"
                    : "bg-blue-50 border-blue-200"
                }`}
              >
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-blue-600">
                    Placement Offer
                  </p>

                  <h2 className="text-xl font-black mt-1">
                    Your internship application has been approved
                  </h2>

                  <p
                    className={`text-sm mt-2 ${
                      darkMode ? "text-slate-300" : "text-slate-600"
                    }`}
                  >
                    Review the internship opportunity and choose whether to
                    confirm or decline the placement.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 mt-5">
                  <button
                    type="button"
                    disabled={isConfirmingPlacement}
                    onClick={() => handleConfirmPlacement(approvedApplication)}
                    className="px-4 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {isConfirmingPlacement
                      ? "Processing..."
                      : "Confirm Placement"}
                  </button>

                  <button
                    type="button"
                    disabled={isConfirmingPlacement}
                    onClick={() => handleDeclinePlacement(approvedApplication)}
                    className="px-4 py-2.5 rounded-lg bg-red-600 text-white text-sm font-bold hover:bg-red-700 disabled:opacity-50"
                  >
                    Decline Placement
                  </button>
                </div>
              </div>
            )}

            {/* CURRENT ASSIGNMENT */}

            {activePlacementAssignment && (
              <div
                className={`rounded-2xl border p-5 ${
                  darkMode
                    ? "bg-slate-900 border-slate-800"
                    : "bg-white border-slate-200"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-3xl">
                    {getAssignmentStatusInfo(activePlacementAssignment)?.icon}
                  </div>

                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-blue-600">
                      Current Placement
                    </p>

                    <h2 className="text-xl font-black mt-1">
                      {
                        getAssignmentStatusInfo(activePlacementAssignment)
                          ?.title
                      }
                    </h2>

                    <p
                      className={`text-sm mt-1 ${
                        darkMode ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
                      {
                        getAssignmentStatusInfo(activePlacementAssignment)
                          ?.description
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* APPLICATION HISTORY */}

            <div
              className={`rounded-2xl border overflow-hidden ${
                darkMode
                  ? "bg-slate-900 border-slate-800"
                  : "bg-white border-slate-200"
              }`}
            >
              <div className="p-5 border-b border-slate-200 dark:border-slate-800">
                <h2 className="text-lg font-black">Application History</h2>

                <p
                  className={`text-sm mt-1 ${
                    darkMode ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  All of your internship applications are shown here.
                </p>
              </div>

              {applications.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-4xl mb-3">📄</div>

                  <p className="font-bold">No applications yet.</p>

                  <p
                    className={`text-sm mt-1 ${
                      darkMode ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    Select an internship opportunity and start your application.
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("apply");
                      setOpportunityView("browse");
                    }}
                    className="mt-4 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700"
                  >
                    Find an Internship
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-slate-200 dark:divide-slate-800">
                  {applications.map((application) => {
                    const opportunity = opportunities.find(
                      (item) => item.id === application.opportunity_id
                    );

                    const assignment =
                      assignmentByApplicationId[application.id];

                    const applicationDocumentCount =
                      applicationDocuments.filter(
                        (document) => document.application_id === application.id
                      ).length;

                    return (
                      <div key={application.id} className="p-5">
                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                          <div className="min-w-0">
                            <h3 className="font-black">
                              {opportunity?.title || "Internship Opportunity"}
                            </h3>

                            <p
                              className={`text-xs mt-1 ${
                                darkMode ? "text-slate-400" : "text-slate-500"
                              }`}
                            >
                              {opportunity?.companies?.company_name ||
                                "Company"}
                            </p>

                            <p className="text-xs text-slate-500 mt-2">
                              Applied {formatDateTime(application.created_at)}
                            </p>
                          </div>

                          <span
                            className={`text-sm font-black ${statusTone(
                              application.status
                            )}`}
                          >
                            {formatStatus(application.status)}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                          <div
                            className={`rounded-lg p-3 ${
                              darkMode ? "bg-slate-800" : "bg-slate-50"
                            }`}
                          >
                            <p className="text-[10px] uppercase font-bold text-slate-500">
                              Documents
                            </p>

                            <p className="text-sm font-bold mt-1">
                              {applicationDocumentCount} uploaded
                            </p>
                          </div>

                          <div
                            className={`rounded-lg p-3 ${
                              darkMode ? "bg-slate-800" : "bg-slate-50"
                            }`}
                          >
                            <p className="text-[10px] uppercase font-bold text-slate-500">
                              Submitted
                            </p>

                            <p className="text-sm font-bold mt-1">
                              {formatDateTime(application.submitted_at)}
                            </p>
                          </div>

                          <div
                            className={`rounded-lg p-3 ${
                              darkMode ? "bg-slate-800" : "bg-slate-50"
                            }`}
                          >
                            <p className="text-[10px] uppercase font-bold text-slate-500">
                              Placement
                            </p>

                            <p className="text-sm font-bold mt-1">
                              {assignment
                                ? formatStatus(assignment.status)
                                : "No assignment"}
                            </p>
                          </div>
                        </div>

                        {/* DOCUMENT SUMMARY */}

                        {applicationDocumentCount > 0 && (
                          <div
                            className={`mt-4 rounded-xl p-4 ${
                              darkMode ? "bg-slate-800" : "bg-slate-50"
                            }`}
                          >
                            <p className="text-xs font-black uppercase text-slate-500">
                              Submitted Documents
                            </p>

                            <div className="mt-3 space-y-2">
                              {applicationDocuments
                                .filter(
                                  (document) =>
                                    document.application_id === application.id
                                )
                                .map((document) => {
                                  const type = documentTypes.find(
                                    (documentType) =>
                                      documentType.id ===
                                      document.document_type_id
                                  );

                                  const statusInfo =
                                    getDocumentStatusInfo(document);

                                  return (
                                    <div
                                      key={document.id}
                                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                                    >
                                      <div className="min-w-0">
                                        <p className="text-xs font-bold">
                                          {type?.name || "Document"}
                                        </p>

                                        <p className="text-[11px] text-slate-500 break-all">
                                          {document.file_name}

                                          {Number(document.version) > 1 &&
                                            ` • Version ${document.version}`}
                                        </p>
                                      </div>

                                      <span
                                        className={`self-start sm:self-auto inline-flex text-[10px] font-black px-2 py-1 rounded-full ${statusInfo.bg} ${statusInfo.tone}`}
                                      >
                                        {statusInfo.label}
                                      </span>
                                    </div>
                                  );
                                })}
                            </div>
                          </div>
                        )}

                        {/* INFO REQUESTED */}

                        {application.status ===
                          STATUS.application.INFO_REQUESTED && (
                          <div
                            className={`mt-4 rounded-xl p-4 ${
                              darkMode ? "bg-orange-950/30" : "bg-orange-50"
                            }`}
                          >
                            <p className="text-sm font-bold text-orange-600">
                              Additional information requested
                            </p>

                            {application.notes && (
                              <p className="text-xs mt-1 whitespace-pre-wrap text-orange-700">
                                {application.notes}
                              </p>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                if (opportunity) {
                                  prepareOpportunityForm(opportunity, false);
                                }

                                setActiveTab("apply");
                              }}
                              className="mt-3 px-4 py-2 rounded-lg bg-orange-600 text-white text-xs font-bold hover:bg-orange-700"
                            >
                              Update & Resubmit
                            </button>
                          </div>
                        )}

                        {/* REJECTION */}

                        {application.status === STATUS.application.REJECTED && (
                          <div
                            className={`mt-4 rounded-xl p-4 ${
                              darkMode ? "bg-red-950/30" : "bg-red-50"
                            }`}
                          >
                            <p className="text-sm font-bold text-red-600">
                              Application Rejected
                            </p>

                            <p className="text-xs mt-1">
                              Source: {getRejectionInfo(application).source}
                            </p>

                            <p className="text-xs mt-1 whitespace-pre-wrap">
                              {getRejectionInfo(application).reason}
                            </p>

                            {opportunity && canApplyAgain(opportunity.id) && (
                              <button
                                type="button"
                                onClick={() => handleApplyAgain(opportunity)}
                                className="mt-3 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700"
                              >
                                Apply Again
                              </button>
                            )}
                          </div>
                        )}

                        {/* WITHDRAWN */}

                        {application.status ===
                          STATUS.application.WITHDRAWN && (
                          <div
                            className={`mt-4 rounded-xl p-4 ${
                              darkMode ? "bg-slate-800" : "bg-slate-50"
                            }`}
                          >
                            <p className="text-sm font-bold">
                              Application Withdrawn
                            </p>

                            {application.notes && (
                              <p className="text-xs mt-1 whitespace-pre-wrap">
                                {application.notes}
                              </p>
                            )}

                            {opportunity && canApplyAgain(opportunity.id) && (
                              <button
                                type="button"
                                onClick={() => handleApplyAgain(opportunity)}
                                className="mt-3 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700"
                              >
                                Apply Again
                              </button>
                            )}
                          </div>
                        )}

                        {/* ASSIGNMENT */}

                        {assignment && (
                          <div
                            className={`mt-4 rounded-xl p-4 ${
                              darkMode ? "bg-slate-800" : "bg-slate-50"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <span className="text-xl">
                                {getAssignmentStatusInfo(assignment)?.icon}
                              </span>

                              <div>
                                <p className="text-sm font-bold">
                                  {getAssignmentStatusInfo(assignment)?.title}
                                </p>

                                <p
                                  className={`text-xs mt-1 ${
                                    darkMode
                                      ? "text-slate-400"
                                      : "text-slate-500"
                                  }`}
                                >
                                  {
                                    getAssignmentStatusInfo(assignment)
                                      ?.description
                                  }
                                </p>

                                {(assignment.start_date ||
                                  assignment.end_date) && (
                                  <p className="text-xs mt-2 font-bold">
                                    {formatDate(assignment.start_date)} –{" "}
                                    {formatDate(assignment.end_date)}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
