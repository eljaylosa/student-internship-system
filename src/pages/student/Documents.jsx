import React, { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabaseStudent } from "../../supabaseClient";

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

const STORAGE_BUCKET = "internship-documents";

export default function Documents() {
  const { darkMode } = useOutletContext();

  // =========================================================
  // STATE
  // =========================================================

  const [student, setStudent] = useState(null);

  const [applications, setApplications] = useState([]);
  const [assignments, setAssignments] = useState([]);

  const [selectedApplicationId, setSelectedApplicationId] = useState(null);

  const [documentTypes, setDocumentTypes] = useState([]);
  const [documents, setDocuments] = useState([]);

  const [selectedFiles, setSelectedFiles] = useState({});

  const [loading, setLoading] = useState(true);
  const [uploadingTypeId, setUploadingTypeId] = useState(null);
  const [isUploadingAll, setIsUploadingAll] = useState(false);

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
  // LOAD PAGE
  // =========================================================

  useEffect(() => {
    loadDocumentsPage();
  }, []);

  const loadDocumentsPage = async (preferredApplicationId = null) => {
    setLoading(true);

    try {
      // -------------------------------------------------------
      // GET CURRENT AUTH USER
      // -------------------------------------------------------

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
      // GET STUDENT
      // -------------------------------------------------------

      const { data: studentData, error: studentError } =
        await supabaseStudent
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
              gwa
            `
          )
          .eq("id", user.id)
          .single();

      if (studentError) {
        throw studentError;
      }

      setStudent(studentData);

      // -------------------------------------------------------
      // GET ALL APPLICATIONS
      // -------------------------------------------------------

      const { data: applicationData, error: applicationError } =
        await supabaseStudent
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

              opportunities (
                id,
                title,
                location,
                position_type,
                company_id
              )
            `
          )
          .eq("student_id", studentData.id)
          .order("created_at", {
            ascending: false,
          });

      if (applicationError) {
        throw applicationError;
      }

      const loadedApplications = applicationData || [];

      // -------------------------------------------------------
      // GET ALL ASSIGNMENTS
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
              updated_at,

              companies (
                id,
                company_name,
                company_address,
                industry
              ),

              opportunities (
                id,
                title,
                location,
                position_type
              )
            `
          )
          .eq("student_id", studentData.id)
          .order("created_at", {
            ascending: false,
          });

      if (assignmentError) {
        throw assignmentError;
      }

      const loadedAssignments = assignmentData || [];

      setApplications(loadedApplications);
      setAssignments(loadedAssignments);

      // -------------------------------------------------------
      // GET DOCUMENT TYPES
      // -------------------------------------------------------

      const { data: documentTypeData, error: documentTypeError } =
        await supabaseStudent
          .from("document_types")
          .select(
            `
              id,
              name,
              description,
              required,
              created_at,
              updated_at
            `
          )
          .order("created_at", {
            ascending: true,
          });

      if (documentTypeError) {
        throw documentTypeError;
      }

      setDocumentTypes(documentTypeData || []);

      // -------------------------------------------------------
      // DETERMINE SELECTED APPLICATION
      // -------------------------------------------------------

      let nextSelectedApplicationId = null;

      if (
        preferredApplicationId &&
        loadedApplications.some(
          (application) => application.id === preferredApplicationId
        )
      ) {
        nextSelectedApplicationId = preferredApplicationId;
      }

      if (!nextSelectedApplicationId) {
        const applicationWithActiveAssignment = loadedApplications.find(
          (application) => {
            return loadedAssignments.some(
              (assignment) =>
                assignment.application_id === application.id &&
                [STATUS.assignment.PENDING, STATUS.assignment.ACTIVE].includes(
                  assignment.status
                )
            );
          }
        );

        if (applicationWithActiveAssignment) {
          nextSelectedApplicationId = applicationWithActiveAssignment.id;
        }
      }

      if (!nextSelectedApplicationId) {
        const approvedApplication = loadedApplications.find(
          (application) => application.status === STATUS.application.APPROVED
        );

        if (approvedApplication) {
          nextSelectedApplicationId = approvedApplication.id;
        }
      }

      if (!nextSelectedApplicationId && loadedApplications.length > 0) {
        nextSelectedApplicationId = loadedApplications[0].id;
      }

      setSelectedApplicationId(nextSelectedApplicationId);

      // -------------------------------------------------------
      // GET DOCUMENTS FOR SELECTED ASSIGNMENT
      // -------------------------------------------------------

      const selectedAssignment = loadedAssignments.find(
        (assignment) =>
          assignment.application_id === nextSelectedApplicationId
      );

      if (selectedAssignment) {
        const { data: documentData, error: documentError } =
          await supabaseStudent
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
                reviewed_by,
                reviewed_at,
                created_at,
                updated_at
              `
            )
            .eq("assignment_id", selectedAssignment.id)
            .eq("student_id", studentData.id)
            .order("created_at", {
              ascending: true,
            });

        if (documentError) {
          throw documentError;
        }

        setDocuments(documentData || []);
      } else {
        setDocuments([]);
      }

      // Only clear selected files during the initial/page load.
      setSelectedFiles({});
    } catch (error) {
      console.error("Error loading documents page:", error);

      alert(error.message || "Unable to load internship documents.");
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // SELECTED APPLICATION
  // =========================================================

  const selectedApplication = useMemo(() => {
    return (
      applications.find(
        (application) => application.id === selectedApplicationId
      ) || null
    );
  }, [applications, selectedApplicationId]);

  // =========================================================
  // SELECTED ASSIGNMENT
  // =========================================================

  const assignment = useMemo(() => {
    if (!selectedApplicationId) {
      return null;
    }

    return (
      assignments.find(
        (item) => item.application_id === selectedApplicationId
      ) || null
    );
  }, [assignments, selectedApplicationId]);

  // =========================================================
  // APPLICATION STATUS HELPERS
  // =========================================================

  const getApplicationStatusLabel = (status) => {
    const labels = {
      [STATUS.application.DRAFT]: "Draft",
      [STATUS.application.SUBMITTED]: "Submitted",
      [STATUS.application.UNDER_REVIEW]: "Under Review",
      [STATUS.application.INFO_REQUESTED]: "Info Requested",
      [STATUS.application.APPROVED]: "Approved",
      [STATUS.application.ACCEPTED]: "Accepted",
      [STATUS.application.REJECTED]: "Rejected",
      [STATUS.application.WITHDRAWN]: "Withdrawn",
    };

    return labels[status] || status || "Unknown";
  };

  const getApplicationStatusClass = (status) => {
    if (status === STATUS.application.APPROVED) {
      return darkMode
        ? "bg-emerald-950/50 text-emerald-300 border-emerald-800"
        : "bg-emerald-50 text-emerald-700 border-emerald-200";
    }

    if (
      status === STATUS.application.UNDER_REVIEW ||
      status === STATUS.application.SUBMITTED
    ) {
      return darkMode
        ? "bg-blue-950/50 text-blue-300 border-blue-800"
        : "bg-blue-50 text-blue-700 border-blue-200";
    }

    if (status === STATUS.application.INFO_REQUESTED) {
      return darkMode
        ? "bg-amber-950/50 text-amber-300 border-amber-800"
        : "bg-amber-50 text-amber-700 border-amber-200";
    }

    if (
      status === STATUS.application.REJECTED ||
      status === STATUS.application.WITHDRAWN
    ) {
      return darkMode
        ? "bg-red-950/50 text-red-300 border-red-800"
        : "bg-red-50 text-red-700 border-red-200";
    }

    return darkMode
      ? "bg-slate-800 text-slate-400 border-slate-700"
      : "bg-slate-50 text-slate-500 border-slate-200";
  };

  // =========================================================
  // ASSIGNMENT STATUS HELPERS
  // =========================================================

  const getAssignmentStatusLabel = (status) => {
    const labels = {
      [STATUS.assignment.PENDING]: "Pending Deployment",
      [STATUS.assignment.ACTIVE]: "Active Internship",
      [STATUS.assignment.COMPLETED]: "Internship Completed",
      [STATUS.assignment.SUSPENDED]: "Suspended",
      [STATUS.assignment.TERMINATED]: "Terminated",
    };

    return labels[status] || status || "Unknown";
  };

  const getAssignmentStatusClass = (status) => {
    if (status === STATUS.assignment.COMPLETED) {
      return darkMode
        ? "bg-emerald-950/50 text-emerald-300 border-emerald-800"
        : "bg-emerald-50 text-emerald-700 border-emerald-200";
    }

    if (status === STATUS.assignment.ACTIVE) {
      return darkMode
        ? "bg-blue-950/50 text-blue-300 border-blue-800"
        : "bg-blue-50 text-blue-700 border-blue-200";
    }

    if (status === STATUS.assignment.PENDING) {
      return darkMode
        ? "bg-amber-950/50 text-amber-300 border-amber-800"
        : "bg-amber-50 text-amber-700 border-amber-200";
    }

    if (
      status === STATUS.assignment.SUSPENDED ||
      status === STATUS.assignment.TERMINATED
    ) {
      return darkMode
        ? "bg-red-950/50 text-red-300 border-red-800"
        : "bg-red-50 text-red-700 border-red-200";
    }

    return darkMode
      ? "bg-slate-800 text-slate-400 border-slate-700"
      : "bg-slate-50 text-slate-500 border-slate-200";
  };

  // =========================================================
  // DOCUMENT HELPERS
  // =========================================================

  const getDocumentForType = (typeId) => {
    return documents.find(
      (document) => document.document_type_id === typeId
    );
  };

  const getStatusLabel = (status) => {
    const labels = {
      [STATUS.document.NOT_SUBMITTED]: "Not Submitted",
      [STATUS.document.SUBMITTED]: "Submitted",
      [STATUS.document.PENDING_REVIEW]: "Pending Review",
      [STATUS.document.APPROVED]: "Approved",
      [STATUS.document.NEEDS_REVISION]: "Needs Revision",
    };

    return labels[status] || status;
  };

  const getStatusClass = (status) => {
    if (status === STATUS.document.APPROVED) {
      return darkMode
        ? "bg-emerald-950/50 text-emerald-300 border-emerald-800"
        : "bg-emerald-50 text-emerald-700 border-emerald-200";
    }

    if (status === STATUS.document.NEEDS_REVISION) {
      return darkMode
        ? "bg-red-950/50 text-red-300 border-red-800"
        : "bg-red-50 text-red-700 border-red-200";
    }

    if (status === STATUS.document.PENDING_REVIEW) {
      return darkMode
        ? "bg-blue-950/50 text-blue-300 border-blue-800"
        : "bg-blue-50 text-blue-700 border-blue-200";
    }

    if (status === STATUS.document.SUBMITTED) {
      return darkMode
        ? "bg-amber-950/50 text-amber-300 border-amber-800"
        : "bg-amber-50 text-amber-700 border-amber-200";
    }

    return darkMode
      ? "bg-slate-800 text-slate-400 border-slate-700"
      : "bg-slate-50 text-slate-500 border-slate-200";
  };

  // =========================================================
  // GENERAL HELPERS
  // =========================================================

  const sanitizeFileName = (fileName) => {
    return fileName
      .trim()
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .replace(/_+/g, "_");
  };

  const isAllowedFile = (file) => {
    if (!file) return false;

    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/jpg",
    ];

    return allowedTypes.includes(file.type);
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 KB";

    const mb = bytes / (1024 * 1024);

    if (mb >= 1) {
      return `${mb.toFixed(2)} MB`;
    }

    return `${Math.round(bytes / 1024)} KB`;
  };

  const formatDate = (date) => {
    if (!date) return "Not set";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Not set";
    }

    return parsedDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // =========================================================
  // APPLICATION DROPDOWN
  // =========================================================

  const handleApplicationChange = async (event) => {
    const applicationId = event.target.value || null;

    setSelectedApplicationId(applicationId);

    // Clear files from the previously selected internship.
    setSelectedFiles({});

    // Clear current documents immediately.
    setDocuments([]);

    if (!applicationId || !student) {
      return;
    }

    const selectedAssignment = assignments.find(
      (item) => item.application_id === applicationId
    );

    if (!selectedAssignment) {
      return;
    }

    try {
      const { data: documentData, error: documentError } =
        await supabaseStudent
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
              reviewed_by,
              reviewed_at,
              created_at,
              updated_at
            `
          )
          .eq("assignment_id", selectedAssignment.id)
          .eq("student_id", student.id)
          .order("created_at", {
            ascending: true,
          });

      if (documentError) {
        throw documentError;
      }

      setDocuments(documentData || []);
    } catch (error) {
      console.error("Error loading selected internship documents:", error);

      alert(
        error.message || "Unable to load documents for the selected internship."
      );
    }
  };

  // =========================================================
  // FILE SELECTION
  // =========================================================

  const handleFileChange = (typeId, event) => {
    const file = event.target.files?.[0];

    if (!file) {
      setSelectedFiles((previous) => ({
        ...previous,
        [typeId]: null,
      }));

      return;
    }

    // -------------------------------------------------------
    // ASSIGNMENT MUST EXIST
    // -------------------------------------------------------

    if (!assignment) {
      alert(
        "You must confirm your internship placement before submitting documents."
      );

      event.target.value = "";

      return;
    }

    // -------------------------------------------------------
    // ONLY PENDING ASSIGNMENTS CAN RECEIVE DOCUMENTS
    // -------------------------------------------------------

    if (assignment.status !== STATUS.assignment.PENDING) {
      alert(
        `Documents cannot be submitted while the internship assignment is "${getAssignmentStatusLabel(
          assignment.status
        )}".`
      );

      event.target.value = "";

      return;
    }

    // -------------------------------------------------------
    // CHECK CURRENT DOCUMENT STATUS
    // -------------------------------------------------------

    const existingDocument = getDocumentForType(typeId);

    if (
      existingDocument?.status === STATUS.document.PENDING_REVIEW ||
      existingDocument?.status === STATUS.document.SUBMITTED
    ) {
      alert(
        "This document is already pending review. Please wait for the Registrar to review it."
      );

      event.target.value = "";

      return;
    }

    if (existingDocument?.status === STATUS.document.APPROVED) {
      alert("This document has already been approved and cannot be replaced.");

      event.target.value = "";

      return;
    }

    // -------------------------------------------------------
    // FILE TYPE
    // -------------------------------------------------------

    if (!isAllowedFile(file)) {
      alert("Please choose a PDF, JPG, JPEG, or PNG file.");

      event.target.value = "";

      return;
    }

    // -------------------------------------------------------
    // FILE SIZE
    // -------------------------------------------------------

    if (file.size > 10 * 1024 * 1024) {
      alert("File size must not exceed 10 MB.");

      event.target.value = "";

      return;
    }

    setSelectedFiles((previous) => ({
      ...previous,
      [typeId]: file,
    }));
  };

  // =========================================================
  // UPDATE DOCUMENT STATE AFTER SUCCESSFUL UPLOAD
  // =========================================================

  const updateDocumentState = (documentRecord) => {
    if (!documentRecord) {
      return;
    }

    setDocuments((previous) => {
      const existingIndex = previous.findIndex(
        (document) => document.id === documentRecord.id
      );

      if (existingIndex >= 0) {
        return previous.map((document) =>
          document.id === documentRecord.id
            ? {
                ...document,
                ...documentRecord,
              }
            : document
        );
      }

      return [...previous, documentRecord];
    });
  };

  // =========================================================
  // UPLOAD SINGLE DOCUMENT
  // =========================================================

  const uploadDocument = async (documentType, file) => {
    if (!student) {
      throw new Error("Student information could not be loaded.");
    }

    if (!selectedApplication) {
      throw new Error("Please select an internship application first.");
    }

    if (!assignment) {
      throw new Error(
        "Documents are not available yet. Your internship placement must first be confirmed."
      );
    }

    if (assignment.status !== STATUS.assignment.PENDING) {
      throw new Error(
        `Documents cannot be submitted for an assignment with status "${getAssignmentStatusLabel(
          assignment.status
        )}".`
      );
    }

    if (!file) {
      throw new Error(`Please choose your ${documentType.name} first.`);
    }

    const existingDocument = getDocumentForType(documentType.id);

    // -------------------------------------------------------
    // BLOCK PENDING REVIEW
    // -------------------------------------------------------

    if (
      existingDocument?.status === STATUS.document.PENDING_REVIEW ||
      existingDocument?.status === STATUS.document.SUBMITTED
    ) {
      throw new Error(
        `${documentType.name} is already pending review. Please wait for the Registrar.`
      );
    }

    // -------------------------------------------------------
    // BLOCK APPROVED
    // -------------------------------------------------------

    if (existingDocument?.status === STATUS.document.APPROVED) {
      throw new Error(
        `${documentType.name} has already been approved and cannot be replaced.`
      );
    }

    // -------------------------------------------------------
    // FILE VALIDATION
    // -------------------------------------------------------

    if (!isAllowedFile(file)) {
      throw new Error(
        `${documentType.name}: Please choose a PDF, JPG, JPEG, or PNG file.`
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      throw new Error(`${documentType.name}: File size must not exceed 10 MB.`);
    }

    // -------------------------------------------------------
    // GET CURRENT USER
    // -------------------------------------------------------

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
    // CREATE STORAGE PATH
    // -------------------------------------------------------

    const safeFileName = sanitizeFileName(file.name);

    const uniqueFileName = `${Date.now()}-${safeFileName}`;

    const storagePath = [
      student.id,
      assignment.id,
      documentType.id,
      uniqueFileName,
    ].join("/");

    // -------------------------------------------------------
    // UPLOAD FILE
    // -------------------------------------------------------

    const { error: uploadError } = await supabaseStudent.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      throw uploadError;
    }

    // -------------------------------------------------------
    // CREATE OR UPDATE DATABASE RECORD
    // -------------------------------------------------------

    let savedDocument = null;

    if (existingDocument) {
      // -----------------------------------------------------
      // REVISION
      // -----------------------------------------------------

      const { data: updatedDocument, error: updateError } =
        await supabaseStudent
          .from("documents")
          .update({
            file_name: file.name,
            storage_path: storagePath,
            version: existingDocument.version + 1,
            status: STATUS.document.PENDING_REVIEW,
            notes: null,
            reviewed_by: null,
            reviewed_at: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingDocument.id)
          .eq("student_id", student.id)
          .eq("assignment_id", assignment.id)
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
              reviewed_by,
              reviewed_at,
              created_at,
              updated_at
            `
          )
          .single();

      if (updateError) {
        await supabaseStudent.storage
          .from(STORAGE_BUCKET)
          .remove([storagePath]);

        throw updateError;
      }

      savedDocument = updatedDocument;
    } else {
      // -----------------------------------------------------
      // FIRST SUBMISSION
      // -----------------------------------------------------

      const { data: insertedDocument, error: insertError } =
        await supabaseStudent
          .from("documents")
          .insert({
            assignment_id: assignment.id,
            student_id: student.id,
            document_type_id: documentType.id,
            file_name: file.name,
            storage_path: storagePath,
            version: 1,
            status: STATUS.document.PENDING_REVIEW,
          })
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
              reviewed_by,
              reviewed_at,
              created_at,
              updated_at
            `
          )
          .single();

      if (insertError) {
        await supabaseStudent.storage
          .from(STORAGE_BUCKET)
          .remove([storagePath]);

        throw insertError;
      }

      savedDocument = insertedDocument;
    }

    // -------------------------------------------------------
    // UPDATE LOCAL STATE
    //
    // IMPORTANT:
    // We intentionally DO NOT call loadDocumentsPage().
    // This prevents other selected files from disappearing.
    // -------------------------------------------------------

    updateDocumentState(savedDocument);

    setSelectedFiles((previous) => ({
      ...previous,
      [documentType.id]: null,
    }));

    // Clear only this document's file input.
    const input = document.getElementById(
      `file-${selectedApplication.id}-${documentType.id}`
    );

    if (input) {
      input.value = "";
    }

    return savedDocument;
  };

  // =========================================================
  // SUBMIT SINGLE DOCUMENT
  // =========================================================

  const handleSubmitDocument = async (documentType) => {
    if (!student) {
      alert("Student information could not be loaded.");
      return;
    }

    if (!selectedApplication) {
      alert("Please select an internship application first.");
      return;
    }

    if (!assignment) {
      if (selectedApplication.status === STATUS.application.APPROVED) {
        alert(
          "Your application has been approved by the Registrar. Please go to View Status and confirm your internship placement first."
        );
      } else {
        alert(
          "Documents are not available yet. Your internship placement must first be confirmed."
        );
      }

      return;
    }

    if (assignment.status !== STATUS.assignment.PENDING) {
      alert(
        `Documents cannot be submitted for an assignment with status "${getAssignmentStatusLabel(
          assignment.status
        )}".`
      );

      return;
    }

    const file = selectedFiles[documentType.id];

    if (!file) {
      alert(`Please choose your ${documentType.name} first.`);
      return;
    }

    const existingDocument = getDocumentForType(documentType.id);

    if (
      existingDocument?.status === STATUS.document.PENDING_REVIEW ||
      existingDocument?.status === STATUS.document.SUBMITTED
    ) {
      alert(
        `${documentType.name} is already pending review. Please wait for the Registrar.`
      );

      return;
    }

    if (existingDocument?.status === STATUS.document.APPROVED) {
      alert(
        `${documentType.name} has already been approved and cannot be replaced.`
      );

      return;
    }

    const confirmed = window.confirm(
      existingDocument?.status === STATUS.document.NEEDS_REVISION
        ? `Submit a revised ${documentType.name}?`
        : `Submit ${documentType.name}?`
    );

    if (!confirmed) {
      return;
    }

    setUploadingTypeId(documentType.id);

    try {
      await uploadDocument(documentType, file);

      alert(
        `${documentType.name} submitted successfully and is now pending review.`
      );
    } catch (error) {
      console.error("Error submitting document:", error);

      alert(error.message || "Unable to submit document.");
    } finally {
      setUploadingTypeId(null);
    }
  };

  // =========================================================
  // UPLOAD ALL SELECTED DOCUMENTS
  // =========================================================

  const handleUploadAll = async () => {
    if (!student) {
      alert("Student information could not be loaded.");
      return;
    }

    if (!selectedApplication) {
      alert("Please select an internship application first.");
      return;
    }

    if (!assignment) {
      alert(
        "Documents are not available yet. Your internship placement must first be confirmed."
      );
      return;
    }

    if (assignment.status !== STATUS.assignment.PENDING) {
      alert(
        `Documents cannot be submitted for an assignment with status "${getAssignmentStatusLabel(
          assignment.status
        )}".`
      );
      return;
    }

    const uploadableTypes = documentTypes.filter((type) => {
      const file = selectedFiles[type.id];

      if (!file) {
        return false;
      }

      const existingDocument = getDocumentForType(type.id);

      if (
        existingDocument?.status === STATUS.document.APPROVED ||
        existingDocument?.status === STATUS.document.PENDING_REVIEW ||
        existingDocument?.status === STATUS.document.SUBMITTED
      ) {
        return false;
      }

      return true;
    });

    if (uploadableTypes.length === 0) {
      alert("Please choose at least one document to upload.");
      return;
    }

    const confirmed = window.confirm(
      `Upload ${uploadableTypes.length} selected document${
        uploadableTypes.length === 1 ? "" : "s"
      }?\n\nThe selected files will be submitted for Registrar review.`
    );

    if (!confirmed) {
      return;
    }

    setIsUploadingAll(true);

    let successCount = 0;
    let failedCount = 0;
    const failedDocuments = [];

    try {
      for (const documentType of uploadableTypes) {
        const file = selectedFiles[documentType.id];

        try {
          await uploadDocument(documentType, file);

          successCount += 1;
        } catch (error) {
          failedCount += 1;

          failedDocuments.push(
            `${documentType.name}: ${error.message || "Upload failed"}`
          );

          console.error(
            `Error uploading ${documentType.name}:`,
            error
          );
        }
      }

      if (successCount > 0 && failedCount === 0) {
        alert(
          `${successCount} document${
            successCount === 1 ? "" : "s"
          } uploaded successfully and ${
            successCount === 1 ? "is" : "are"
          } now pending Registrar review.`
        );
      } else if (successCount > 0 && failedCount > 0) {
        alert(
          `${successCount} document${
            successCount === 1 ? "" : "s"
          } uploaded successfully.\n\n` +
            `${failedCount} document${
              failedCount === 1 ? "" : "s"
            } failed and remain selected so you can try again.\n\n` +
            failedDocuments.join("\n")
        );
      } else {
        alert(
          `No documents were uploaded successfully.\n\n${failedDocuments.join(
            "\n"
          )}`
        );
      }
    } finally {
      setIsUploadingAll(false);
    }
  };

  // =========================================================
  // SELECTED APPLICATION INFORMATION
  // =========================================================

  const selectedOpportunity = selectedApplication?.opportunities || null;

  const selectedCompanyName =
    assignment?.companies?.company_name || "Company information unavailable";

  const canUploadDocuments =
    Boolean(assignment) && assignment.status === STATUS.assignment.PENDING;

  const selectedFileCount = documentTypes.filter((type) => {
    const file = selectedFiles[type.id];

    if (!file) {
      return false;
    }

    const existingDocument = getDocumentForType(type.id);

    return ![
      STATUS.document.APPROVED,
      STATUS.document.PENDING_REVIEW,
      STATUS.document.SUBMITTED,
    ].includes(existingDocument?.status);
  }).length;

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div
        className={`p-5 md:p-6 lg:p-8 max-w-[1200px] mx-auto ${
          darkMode ? "text-slate-100" : "text-slate-900"
        }`}
      >
        <div className={`border rounded-2xl p-10 text-center ${card}`}>
          <div className="text-2xl mb-3">⏳</div>

          <h3 className="font-bold">Loading documents...</h3>

          <p className={`text-sm mt-1 ${body}`}>
            Please wait while we load your internship requirements.
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
      className={`p-5 md:p-6 lg:p-8 max-w-[1200px] mx-auto ${
        darkMode ? "text-slate-100" : "text-slate-900"
      }`}
    >
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="mb-6">
        <p className="text-xs uppercase tracking-widest font-bold text-slate-400">
          Student Portal
        </p>

        <h1 className={`text-2xl font-black ${heading}`}>
          Document Submission
        </h1>

        <p className={`text-sm mt-1 ${body}`}>
          Submit and track the required internship documents for each
          application.
        </p>
      </div>

      {/* =====================================================
          APPLICATION DROPDOWN
      ===================================================== */}

      <div className={`mb-6 rounded-2xl border p-5 ${card}`}>
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-xs uppercase tracking-wider font-bold text-slate-400">
              Select Internship Application
            </p>

            <h2 className="text-lg font-black mt-1">
              Choose which internship you want to view
            </h2>

            <p className={`text-xs mt-1 ${body}`}>
              Your previous internships remain available here so you can review
              their submitted documents.
            </p>
          </div>

          {applications.length > 0 ? (
            <div className="relative">
              <select
                value={selectedApplicationId || ""}
                onChange={handleApplicationChange}
                disabled={isUploadingAll}
                className={`w-full appearance-none px-4 py-3 pr-10 rounded-xl border text-sm font-semibold outline-none transition ${
                  darkMode
                    ? "bg-slate-800 border-slate-700 text-slate-100 focus:border-slate-500"
                    : "bg-white border-slate-300 text-slate-800 focus:border-slate-500"
                }`}
              >
                {applications.map((application) => {
                  const applicationAssignment = assignments.find(
                    (item) => item.application_id === application.id
                  );

                  const opportunityTitle =
                    application.opportunities?.title ||
                    applicationAssignment?.opportunities?.title ||
                    "Internship Application";

                  const companyName =
                    applicationAssignment?.companies?.company_name ||
                    "Company not assigned";

                  const assignmentStatus = applicationAssignment?.status;

                  let statusText = getApplicationStatusLabel(
                    application.status
                  );

                  if (assignmentStatus) {
                    statusText = getAssignmentStatusLabel(assignmentStatus);
                  }

                  return (
                    <option key={application.id} value={application.id}>
                      {opportunityTitle} — {companyName} • {statusText}
                    </option>
                  );
                })}
              </select>

              <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                ▼
              </div>
            </div>
          ) : (
            <div
              className={`p-4 rounded-xl border ${
                darkMode
                  ? "bg-slate-800 border-slate-700"
                  : "bg-slate-50 border-slate-200"
              }`}
            >
              <p className="text-sm font-semibold">
                No internship applications found.
              </p>

              <p className={`text-xs mt-1 ${body}`}>
                Once you submit an internship application, it will appear here.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* =====================================================
          SELECTED APPLICATION / ASSIGNMENT INFORMATION
      ===================================================== */}

      {selectedApplication ? (
        <div className={`mb-6 rounded-2xl border overflow-hidden ${card}`}>
          <div
            className={`px-5 py-4 border-b ${
              darkMode
                ? "bg-slate-800/70 border-slate-700"
                : "bg-slate-50 border-slate-200"
            }`}
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Selected Application
                </p>

                <h2 className="text-lg font-black mt-1">
                  {selectedOpportunity?.title ||
                    assignment?.opportunities?.title ||
                    "Internship Opportunity"}
                </h2>

                <p
                  className={`text-sm font-semibold mt-0.5 ${
                    darkMode ? "text-slate-300" : "text-slate-600"
                  }`}
                >
                  {assignment?.companies?.company_name ||
                    "Company not assigned"}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <span
                  className={`inline-flex w-fit px-3 py-1.5 rounded-full border text-xs font-bold ${getApplicationStatusClass(
                    selectedApplication.status
                  )}`}
                >
                  Application:{" "}
                  {getApplicationStatusLabel(selectedApplication.status)}
                </span>

                {assignment && (
                  <span
                    className={`inline-flex w-fit px-3 py-1.5 rounded-full border text-xs font-bold ${getAssignmentStatusClass(
                      assignment.status
                    )}`}
                  >
                    {getAssignmentStatusLabel(assignment.status)}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="p-5">
            {assignment ? (
              <>
                {/* ASSIGNMENT DETAILS */}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* COMPANY */}

                  <div
                    className={`p-4 rounded-xl border ${
                      darkMode
                        ? "bg-slate-800/70 border-slate-700"
                        : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                      Company
                    </p>

                    <p className="text-sm font-bold mt-1">
                      {assignment.companies?.company_name || "Not available"}
                    </p>

                    {assignment.companies?.industry && (
                      <p className={`text-xs mt-1 ${body}`}>
                        {assignment.companies.industry}
                      </p>
                    )}
                  </div>

                  {/* LOCATION */}

                  <div
                    className={`p-4 rounded-xl border ${
                      darkMode
                        ? "bg-slate-800/70 border-slate-700"
                        : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                      Location
                    </p>

                    <p className="text-sm font-bold mt-1">
                      {assignment.opportunities?.location ||
                        selectedOpportunity?.location ||
                        "Not available"}
                    </p>
                  </div>

                  {/* WORK SETUP */}

                  <div
                    className={`p-4 rounded-xl border ${
                      darkMode
                        ? "bg-slate-800/70 border-slate-700"
                        : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                      Work Setup
                    </p>

                    <p className="text-sm font-bold mt-1">
                      {assignment.opportunities?.position_type ||
                        selectedOpportunity?.position_type ||
                        "Not available"}
                    </p>
                  </div>

                  {/* ASSIGNMENT ID */}

                  <div
                    className={`p-4 rounded-xl border ${
                      darkMode
                        ? "bg-slate-800/70 border-slate-700"
                        : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                      Assignment ID
                    </p>

                    <p className="text-sm font-bold mt-1">
                      #{assignment.id?.slice(0, 8) || "N/A"}
                    </p>
                  </div>
                </div>

                {/* DATES */}

                <div
                  className={`mt-4 p-4 rounded-xl border ${
                    darkMode
                      ? "bg-slate-800/70 border-slate-700"
                      : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                        Internship Start
                      </p>

                      <p className="text-sm font-bold mt-1">
                        {formatDate(assignment.start_date)}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                        Internship End
                      </p>

                      <p className="text-sm font-bold mt-1">
                        {formatDate(assignment.end_date)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* STATUS MESSAGE */}

                <div
                  className={`mt-4 p-4 rounded-xl border ${
                    assignment.status === STATUS.assignment.COMPLETED
                      ? darkMode
                        ? "bg-emerald-950/20 border-emerald-900/60"
                        : "bg-emerald-50 border-emerald-200"
                      : assignment.status === STATUS.assignment.ACTIVE
                      ? darkMode
                        ? "bg-blue-950/20 border-blue-900/60"
                        : "bg-blue-50 border-blue-200"
                      : darkMode
                      ? "bg-amber-950/20 border-amber-900/60"
                      : "bg-amber-50 border-amber-200"
                  }`}
                >
                  <p
                    className={`text-xs leading-5 ${
                      assignment.status === STATUS.assignment.COMPLETED
                        ? darkMode
                          ? "text-emerald-200"
                          : "text-emerald-800"
                        : assignment.status === STATUS.assignment.ACTIVE
                        ? darkMode
                          ? "text-blue-200"
                          : "text-blue-800"
                        : darkMode
                        ? "text-amber-200"
                        : "text-amber-800"
                    }`}
                  >
                    {assignment.status === STATUS.assignment.COMPLETED ? (
                      <>
                        This internship has been completed. Your submitted
                        documents are kept here for your records.
                      </>
                    ) : assignment.status === STATUS.assignment.ACTIVE ? (
                      <>
                        Your internship is currently active. Your submitted
                        documents are available for viewing and record keeping.
                      </>
                    ) : (
                      <>
                        Your internship placement has been confirmed. Complete
                        the required documents before deployment to{" "}
                        <strong>{selectedCompanyName}</strong>.
                      </>
                    )}
                  </p>
                </div>
              </>
            ) : (
              // NO ASSIGNMENT YET

              <div
                className={`p-4 rounded-xl border ${
                  selectedApplication.status === STATUS.application.APPROVED
                    ? darkMode
                      ? "bg-amber-950/20 border-amber-900/60"
                      : "bg-amber-50 border-amber-200"
                    : darkMode
                    ? "bg-slate-800 border-slate-700"
                    : "bg-slate-50 border-slate-200"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-xl">📋</div>

                  <div>
                    <p className="font-bold">
                      {selectedApplication.status ===
                      STATUS.application.APPROVED
                        ? "Application approved — placement confirmation required."
                        : selectedApplication.status ===
                          STATUS.application.REJECTED
                        ? "This application was rejected."
                        : selectedApplication.status ===
                          STATUS.application.WITHDRAWN
                        ? "This application was withdrawn."
                        : "No internship assignment yet."}
                    </p>

                    <p className={`text-sm mt-1 ${body}`}>
                      {selectedApplication.status ===
                      STATUS.application.APPROVED ? (
                        <>
                          The Registrar has approved this application, but an
                          internship assignment has not been created yet. Go to{" "}
                          <strong>View Status</strong> and confirm your
                          internship placement. Your document requirements will
                          become available after the assignment is created.
                        </>
                      ) : selectedApplication.status ===
                        STATUS.application.REJECTED ? (
                        <>
                          This application does not have an active internship
                          assignment, so document submission is unavailable.
                        </>
                      ) : selectedApplication.status ===
                        STATUS.application.WITHDRAWN ? (
                        <>
                          This application is no longer active and does not have
                          an internship assignment.
                        </>
                      ) : (
                        <>
                          Document requirements will become available once this
                          application has been approved and the internship
                          placement has been confirmed.
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div
          className={`mb-6 p-5 rounded-xl border ${
            darkMode
              ? "bg-slate-900 border-slate-700"
              : "bg-slate-50 border-slate-200"
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                darkMode
                  ? "bg-slate-800 text-slate-300"
                  : "bg-white text-slate-500 border border-slate-200"
              }`}
            >
              📋
            </div>

            <div>
              <p className="font-bold">No internship application selected.</p>

              <p className={`text-sm mt-1 ${body}`}>
                Submit an internship application first to view its document
                requirements.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          DOCUMENT LIST
      ===================================================== */}

      <section className={`border rounded-2xl overflow-hidden ${card}`}>
        <div className={`p-5 border-b ${border}`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="font-bold text-lg">Required Documents</h2>

              <p className={`text-xs mt-1 ${body}`}>
                {assignment
                  ? assignment.status === STATUS.assignment.PENDING
                    ? "Upload each required document. Submitted documents will be reviewed before deployment."
                    : "Documents for this internship are shown for record keeping."
                  : "Select an application with a confirmed internship placement to submit documents."}
              </p>
            </div>

            {/* UPLOAD ALL */}

            {canUploadDocuments && selectedFileCount > 0 && (
              <button
                type="button"
                onClick={handleUploadAll}
                disabled={isUploadingAll || Boolean(uploadingTypeId)}
                className={`px-5 py-2.5 rounded-lg bg-blue-600 text-white text-xs font-bold transition ${
                  isUploadingAll || uploadingTypeId
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-blue-700"
                }`}
              >
                {isUploadingAll
                  ? "Uploading All..."
                  : `Upload All (${selectedFileCount})`}
              </button>
            )}
          </div>

          {canUploadDocuments && selectedFileCount > 0 && (
            <div
              className={`mt-4 px-4 py-3 rounded-xl border ${
                darkMode
                  ? "bg-blue-950/30 border-blue-800 text-blue-300"
                  : "bg-blue-50 border-blue-200 text-blue-700"
              }`}
            >
              <p className="text-xs font-semibold">
                {selectedFileCount} document
                {selectedFileCount === 1 ? "" : "s"} selected for upload.
              </p>

              <p className="text-[11px] mt-1 opacity-80">
                You can submit them individually or upload all selected files at
                once.
              </p>
            </div>
          )}
        </div>

        {documentTypes.length === 0 ? (
          <div className="p-10 text-center">
            <div className="text-3xl mb-3">📄</div>

            <h3 className="font-bold">No document requirements found</h3>

            <p className={`text-sm mt-1 ${body}`}>
              Please contact the internship office.
            </p>
          </div>
        ) : !selectedApplication ? (
          <div className="p-10 text-center">
            <div className="text-3xl mb-3">📋</div>

            <h3 className="font-bold">Select an application</h3>

            <p className={`text-sm mt-1 ${body}`}>
              Choose an internship application above to view its document
              requirements.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {documentTypes.map((type) => {
              const record = getDocumentForType(type.id);

              const selectedFile = selectedFiles[type.id];

              const isUploading = uploadingTypeId === type.id;

              const isApproved = record?.status === STATUS.document.APPROVED;

              const isPendingReview =
                record?.status === STATUS.document.PENDING_REVIEW;

              const isSubmitted = record?.status === STATUS.document.SUBMITTED;

              const canUpload =
                canUploadDocuments &&
                !isApproved &&
                !isPendingReview &&
                !isSubmitted;

              return (
                <div
                  key={type.id}
                  className="p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5"
                >
                  {/* DOCUMENT INFORMATION */}

                  <div className="min-w-0">
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          darkMode
                            ? "bg-slate-800 text-slate-300"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        📄
                      </div>

                      <div className="min-w-0">
                        <p className="font-semibold">
                          {type.name}

                          {type.required && (
                            <span className="text-red-500 ml-1">*</span>
                          )}
                        </p>

                        {type.description && (
                          <p className={`text-xs mt-1 ${body}`}>
                            {type.description}
                          </p>
                        )}

                        {record ? (
                          <div className="mt-2">
                            <p
                              className={`text-xs font-medium ${
                                darkMode ? "text-slate-300" : "text-slate-600"
                              }`}
                            >
                              {record.file_name || "File name unavailable"}
                            </p>

                            <p className={`text-[11px] mt-0.5 ${body}`}>
                              Version {record.version}
                            </p>

                            {record.notes && (
                              <p className="text-xs mt-2 text-red-500">
                                Registrar note: {record.notes}
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className={`text-xs mt-2 ${body}`}>
                            Not submitted
                          </p>
                        )}

                        {/* SELECTED FILE PREVIEW */}

                        {selectedFile && canUpload && (
                          <div
                            className={`mt-2 inline-flex items-center gap-2 px-3 py-2 rounded-lg border ${
                              darkMode
                                ? "bg-blue-950/30 border-blue-800"
                                : "bg-blue-50 border-blue-200"
                            }`}
                          >
                            <span className="text-sm">📎</span>

                            <div className="min-w-0">
                              <p
                                className={`text-xs font-semibold truncate max-w-[280px] ${
                                  darkMode
                                    ? "text-blue-300"
                                    : "text-blue-700"
                                }`}
                                title={selectedFile.name}
                              >
                                {selectedFile.name}
                              </p>

                              <p
                                className={`text-[10px] ${
                                  darkMode
                                    ? "text-blue-400"
                                    : "text-blue-600"
                                }`}
                              >
                                Ready to upload •{" "}
                                {formatFileSize(selectedFile.size)}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* STATUS + UPLOAD */}

                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 lg:min-w-[500px] lg:justify-end">
                    {/* STATUS */}

                    <span
                      className={`inline-flex justify-center px-3 py-1.5 rounded-full border text-xs font-bold ${getStatusClass(
                        record?.status || STATUS.document.NOT_SUBMITTED
                      )}`}
                    >
                      {getStatusLabel(
                        record?.status || STATUS.document.NOT_SUBMITTED
                      )}
                    </span>

                    {/* NO ASSIGNMENT MESSAGE */}

                    {!assignment && (
                      <div
                        className={`px-4 py-2 rounded-lg border text-xs font-semibold ${
                          darkMode
                            ? "bg-slate-800 border-slate-700 text-slate-400"
                            : "bg-slate-50 border-slate-200 text-slate-500"
                        }`}
                      >
                        🔒 Placement not confirmed
                      </div>
                    )}

                    {/* NON-PENDING ASSIGNMENT MESSAGE */}

                    {assignment &&
                      assignment.status !== STATUS.assignment.PENDING &&
                      !isApproved && (
                        <div
                          className={`px-4 py-2 rounded-lg border text-xs font-semibold ${
                            darkMode
                              ? "bg-slate-800 border-slate-700 text-slate-400"
                              : "bg-slate-50 border-slate-200 text-slate-500"
                          }`}
                        >
                          {assignment.status === STATUS.assignment.COMPLETED
                            ? "✓ Completed internship"
                            : assignment.status === STATUS.assignment.ACTIVE
                            ? "📌 Internship active"
                            : "🔒 View only"}
                        </div>
                      )}

                    {/* PENDING REVIEW MESSAGE */}

                    {isPendingReview && (
                      <div
                        className={`px-4 py-2 rounded-lg border text-xs font-semibold ${
                          darkMode
                            ? "bg-blue-950/30 border-blue-800 text-blue-300"
                            : "bg-blue-50 border-blue-200 text-blue-700"
                        }`}
                      >
                        ⏳ Waiting for Registrar review
                      </div>
                    )}

                    {/* FILE INPUT */}

                    {canUpload && (
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <label
                          htmlFor={`file-${selectedApplication.id}-${type.id}`}
                          className={`inline-flex items-center justify-center px-4 py-2 rounded-lg border text-xs font-semibold cursor-pointer transition ${
                            darkMode
                              ? "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700"
                              : "border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100"
                          } ${
                            isUploadingAll || isUploading
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          }`}
                        >
                          Choose File
                        </label>

                        <input
                          id={`file-${selectedApplication.id}-${type.id}`}
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                          disabled={isUploading || isUploadingAll}
                          onChange={(event) =>
                            handleFileChange(type.id, event)
                          }
                        />

                        <div className="max-w-[190px]">
                          {selectedFile ? (
                            <>
                              <p
                                className={`text-xs truncate ${
                                  darkMode
                                    ? "text-slate-300"
                                    : "text-slate-600"
                                }`}
                                title={selectedFile.name}
                              >
                                {selectedFile.name}
                              </p>

                              <p className={`text-[10px] ${body}`}>
                                {formatFileSize(selectedFile.size)}
                              </p>
                            </>
                          ) : (
                            <p className={`text-xs ${body}`}>
                              No file chosen
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* SUBMIT */}

                    {canUpload && (
                      <button
                        type="button"
                        disabled={
                          isUploading ||
                          isUploadingAll ||
                          !selectedFile
                        }
                        onClick={() => handleSubmitDocument(type)}
                        className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isUploading
                          ? "Uploading..."
                          : record?.status === STATUS.document.NEEDS_REVISION
                          ? "Resubmit"
                          : "Submit"}
                      </button>
                    )}

                    {/* APPROVED MESSAGE */}

                    {isApproved && (
                      <div
                        className={`px-4 py-2 rounded-lg border text-xs font-semibold ${
                          darkMode
                            ? "bg-emerald-950/30 border-emerald-800 text-emerald-300"
                            : "bg-emerald-50 border-emerald-200 text-emerald-700"
                        }`}
                      >
                        ✓ Document approved
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* =====================================================
          INFORMATION
      ===================================================== */}

      {assignment && (
        <div
          className={`mt-5 p-4 rounded-xl border ${
            darkMode
              ? "bg-slate-900 border-slate-700"
              : "bg-white border-slate-200"
          }`}
        >
          <p className="text-xs font-bold">
            📌 What happens after submission?
          </p>

          <p className={`text-xs mt-2 leading-5 ${body}`}>
            {assignment.status === STATUS.assignment.PENDING ? (
              <>
                Your documents will be reviewed by the Registrar. If a document
                needs correction, its status will change to "Needs Revision"
                and you can upload a new version. Once all required documents
                are approved, the internship can proceed to deployment.
              </>
            ) : (
              <>
                These documents belong to this internship assignment and are
                preserved as part of your internship record.
              </>
            )}
          </p>
        </div>
      )}
    </div>
  );
}

