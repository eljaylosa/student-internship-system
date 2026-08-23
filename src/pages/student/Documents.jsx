import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabaseStudent } from "../../supabaseClient";

const STATUS = {
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
  const [assignment, setAssignment] = useState(null);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [documents, setDocuments] = useState([]);

  const [selectedFiles, setSelectedFiles] = useState({});

  const [loading, setLoading] = useState(true);
  const [uploadingTypeId, setUploadingTypeId] = useState(null);

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

  const loadDocumentsPage = async () => {
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
      //
      // students.id references users.id
      // -------------------------------------------------------

      const { data: studentData, error: studentError } = await supabaseStudent
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
      // GET PENDING ASSIGNMENT
      //
      // Registrar approval creates this assignment with
      // status = pending.
      //
      // It is NOT active/deployed yet.
      //
      // We also retrieve:
      // - Company information
      // - Internship opportunity information
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
          .eq("status", STATUS.assignment.PENDING)
          .order("created_at", {
            ascending: false,
          })
          .limit(1)
          .maybeSingle();

      if (assignmentError) {
        throw assignmentError;
      }

      setAssignment(assignmentData || null);

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
      // GET DOCUMENTS FOR ASSIGNMENT
      // -------------------------------------------------------

      if (assignmentData) {
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
            .eq("assignment_id", assignmentData.id)
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
    } catch (error) {
      console.error("Error loading documents page:", error);

      alert(error.message || "Unable to load internship documents.");
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // HELPERS
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

    if (!isAllowedFile(file)) {
      alert("Please choose a PDF, JPG, JPEG, or PNG file.");

      event.target.value = "";

      return;
    }

    // 10 MB maximum
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
  // UPLOAD DOCUMENT
  // =========================================================

  const handleSubmitDocument = async (documentType) => {
    if (!student) {
      alert("Student information could not be loaded.");

      return;
    }

    if (!assignment) {
      alert(
        "You cannot submit internship documents yet. Your application must first be approved by the Registrar."
      );

      return;
    }

    if (assignment.status !== STATUS.assignment.PENDING) {
      alert(
        `Documents cannot be submitted for an assignment with status "${assignment.status}".`
      );

      return;
    }

    const file = selectedFiles[documentType.id];

    if (!file) {
      alert(`Please choose your ${documentType.name} first.`);

      return;
    }

    const existingDocument = getDocumentForType(documentType.id);

    // -------------------------------------------------------
    // APPROVED DOCUMENT
    //
    // Do not allow students to overwrite an already approved
    // requirement.
    // -------------------------------------------------------

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
      //
      // student_id / assignment_id / document_type_id / filename
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
            .select()
            .single();

        if (updateError) {
          // Try to remove the uploaded file if DB update failed.
          await supabaseStudent.storage
            .from(STORAGE_BUCKET)
            .remove([storagePath]);

          throw updateError;
        }

        setDocuments((previous) =>
          previous.map((document) =>
            document.id === updatedDocument.id
              ? updatedDocument
              : document
          )
        );
      } else {
        // -----------------------------------------------------
        // FIRST SUBMISSION
        // -----------------------------------------------------

        const { data: newDocument, error: insertError } =
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
            .select()
            .single();

        if (insertError) {
          // Try to remove the uploaded file if DB insert failed.
          await supabaseStudent.storage
            .from(STORAGE_BUCKET)
            .remove([storagePath]);

          throw insertError;
        }

        setDocuments((previous) => [...previous, newDocument]);
      }

      // -------------------------------------------------------
      // CLEAR SELECTED FILE
      // -------------------------------------------------------

      setSelectedFiles((previous) => ({
        ...previous,
        [documentType.id]: null,
      }));

      const input = document.getElementById(
        `file-${documentType.id}`
      );

      if (input) {
        input.value = "";
      }

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
          Submit the required internship documents for Registrar review.
        </p>
      </div>

      {/* =====================================================
          ASSIGNMENT INFORMATION
      ===================================================== */}

      {assignment ? (
        <div
          className={`mb-6 rounded-2xl border overflow-hidden ${
            darkMode
              ? "bg-slate-900 border-slate-700"
              : "bg-white border-slate-200"
          }`}
        >
          {/* ASSIGNMENT HEADER */}

          <div
            className={`px-5 py-4 border-b ${
              darkMode
                ? "bg-amber-950/30 border-slate-700"
                : "bg-amber-50 border-amber-100"
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-amber-600">
                  Internship Assignment
                </p>

                <h2 className="text-lg font-black mt-1">
                  {assignment.opportunities?.title ||
                    "Internship Opportunity"}
                </h2>

                <p
                  className={`text-sm font-semibold mt-0.5 ${
                    darkMode ? "text-slate-300" : "text-slate-600"
                  }`}
                >
                  {assignment.companies?.company_name ||
                    "Company information unavailable"}
                </p>
              </div>

              <span
                className={`inline-flex w-fit px-3 py-1.5 rounded-full text-xs font-bold ${
                  darkMode
                    ? "bg-amber-900/50 text-amber-300"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                Pending Deployment
              </span>
            </div>
          </div>

          {/* ASSIGNMENT DETAILS */}

          <div className="p-5">
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
                  {assignment.opportunities?.location || "Not available"}
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
                  {assignment.opportunities?.position_type || "Not available"}
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

            {/* INFORMATION MESSAGE */}

            <div
              className={`mt-4 p-4 rounded-xl border ${
                darkMode
                  ? "bg-amber-950/20 border-amber-900/60"
                  : "bg-amber-50 border-amber-200"
              }`}
            >
              <p
                className={`text-xs leading-5 ${
                  darkMode ? "text-amber-200" : "text-amber-800"
                }`}
              >
                Your application has been approved by the Registrar. Complete
                the required documents before deployment to{" "}
                <strong>
                  {assignment.companies?.company_name ||
                    "your assigned company"}
                </strong>
                .
              </p>
            </div>
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
              <p className="font-bold">No internship assignment yet.</p>

              <p className={`text-sm mt-1 ${body}`}>
                Your document requirements will become available after your
                internship application is approved by the Registrar.
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
          <h2 className="font-bold text-lg">Required Documents</h2>

          <p className={`text-xs mt-1 ${body}`}>
            Upload each required document. Submitted documents will be reviewed
            before you are deployed to the company.
          </p>
        </div>

        {documentTypes.length === 0 ? (
          <div className="p-10 text-center">
            <div className="text-3xl mb-3">📄</div>

            <h3 className="font-bold">No document requirements found</h3>

            <p className={`text-sm mt-1 ${body}`}>
              Please contact the internship office.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {documentTypes.map((type) => {
              const record = getDocumentForType(type.id);

              const selectedFile = selectedFiles[type.id];

              const isUploading = uploadingTypeId === type.id;

              const isApproved =
                record?.status === STATUS.document.APPROVED;

              return (
                <div
                  key={type.id}
                  className="p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5"
                >
                  {/* =================================================
                      DOCUMENT INFORMATION
                  ================================================= */}

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
                                darkMode
                                  ? "text-slate-300"
                                  : "text-slate-600"
                              }`}
                            >
                              {record.file_name}
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
                      </div>
                    </div>
                  </div>

                  {/* =================================================
                      STATUS + UPLOAD
                  ================================================= */}

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

                    {/* FILE INPUT */}

                    {!isApproved && assignment && (
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <label
                          htmlFor={`file-${type.id}`}
                          className={`inline-flex items-center justify-center px-4 py-2 rounded-lg border text-xs font-semibold cursor-pointer transition ${
                            darkMode
                              ? "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700"
                              : "border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          Choose File
                        </label>

                        <input
                          id={`file-${type.id}`}
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                          disabled={isUploading}
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

                    {!isApproved && assignment && (
                      <button
                        type="button"
                        disabled={isUploading || !selectedFile}
                        onClick={() => handleSubmitDocument(type)}
                        className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isUploading
                          ? "Uploading..."
                          : record?.status ===
                            STATUS.document.NEEDS_REVISION
                          ? "Resubmit"
                          : "Submit"}
                      </button>
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
            Your documents will be reviewed by the Registrar. If a document
            needs correction, its status will change to "Needs Revision" and
            you can upload a new version. Once all required documents are
            approved, the internship can proceed to deployment.
          </p>
        </div>
      )}
    </div>
  );
}

