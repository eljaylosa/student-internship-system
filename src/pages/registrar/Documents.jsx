import React, { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabaseRegistrar } from "../../supabaseClient";

const STATUS = {
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

const STORAGE_BUCKET = "internship-documents";

export default function Documents() {
  const { darkMode } = useOutletContext();

  // =========================================================
  // STATE
  // =========================================================

  const [registrar, setRegistrar] = useState(null);

  const [students, setStudents] = useState([]);
  const [studentUsers, setStudentUsers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [documents, setDocuments] = useState([]);

  const [selectedDocument, setSelectedDocument] = useState(null);

  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [deployingAssignmentId, setDeployingAssignmentId] = useState(null);

  // =========================================================
  // THEME
  // =========================================================

  const card = darkMode
    ? "bg-slate-900 border-slate-700"
    : "bg-white border-slate-200";

  const mutedText = darkMode ? "text-slate-400" : "text-slate-500";

  const border = darkMode ? "border-slate-700" : "border-slate-200";

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
      // CURRENT AUTH USER
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
      // REGISTRAR USER
      // -------------------------------------------------------

      const { data: userData, error: userError } = await supabaseRegistrar
        .from("users")
        .select(
          `
            id,
            email,
            role,
            first_name,
            middle_name,
            last_name,
            status
          `
        )
        .eq("id", user.id)
        .single();

      if (userError) {
        throw userError;
      }

      setRegistrar(userData);

      // -------------------------------------------------------
      // STUDENTS
      // -------------------------------------------------------

      const { data: studentData, error: studentError } =
        await supabaseRegistrar.from("students").select(`
            id,
            student_id,
            program,
            year_level,
            department,
            phone,
            address,
            gwa
          `);

      if (studentError) {
        throw studentError;
      }

      setStudents(studentData || []);

      // -------------------------------------------------------
      // STUDENT USERS
      //
      // Gets names + email from users table.
      // students.id should match users.id.
      // -------------------------------------------------------

      const { data: studentUserData, error: studentUserError } =
        await supabaseRegistrar
          .from("users")
          .select(
            `
            id,
            email,
            first_name,
            middle_name,
            last_name,
            role,
            status
          `
          )
          .eq("role", "student");

      if (studentUserError) {
        throw studentUserError;
      }

      setStudentUsers(studentUserData || []);

      // -------------------------------------------------------
      // ASSIGNMENTS
      // -------------------------------------------------------

      const { data: assignmentData, error: assignmentError } =
        await supabaseRegistrar
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
          .order("created_at", {
            ascending: false,
          });

      if (assignmentError) {
        throw assignmentError;
      }

      setAssignments(assignmentData || []);

      // -------------------------------------------------------
      // COMPANIES
      //
      // IMPORTANT:
      // Actual company name column = company_name
      // -------------------------------------------------------

      const { data: companyData, error: companyError } =
        await supabaseRegistrar.from("companies").select(`
            id,
            company_name,
            company_email,
            company_phone,
            company_address,
            industry,
            designation,
            status
          `);

      if (companyError) {
        throw companyError;
      }

      setCompanies(companyData || []);

      // -------------------------------------------------------
      // DOCUMENT TYPES
      // -------------------------------------------------------

      const { data: documentTypeData, error: documentTypeError } =
        await supabaseRegistrar
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
      // DOCUMENTS
      // -------------------------------------------------------

      const { data: documentData, error: documentError } =
        await supabaseRegistrar
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
          .order("created_at", {
            ascending: true,
          });

      if (documentError) {
        throw documentError;
      }

      setDocuments(documentData || []);
    } catch (error) {
      console.error("Error loading Registrar Documents page:", error);

      alert(error.message || "Unable to load internship documents.");
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // HELPERS
  // =========================================================

  const getStudent = (studentId) => {
    return students.find((student) => student.id === studentId);
  };

  const getStudentUser = (studentId) => {
    return studentUsers.find((user) => user.id === studentId);
  };

  const getStudentFullName = (studentId) => {
    const user = getStudentUser(studentId);

    if (!user) {
      return "Unknown Student";
    }

    return (
      [user.first_name, user.middle_name, user.last_name]
        .filter(Boolean)
        .join(" ")
        .trim() || "Unknown Student"
    );
  };

  const getAssignment = (assignmentId) => {
    return assignments.find((assignment) => assignment.id === assignmentId);
  };

  const getCompany = (companyId) => {
    return companies.find((company) => company.id === companyId);
  };

  const getDocumentType = (typeId) => {
    return documentTypes.find((type) => type.id === typeId);
  };

  const getStatusLabel = (status) => {
    const labels = {
      [STATUS.document.SUBMITTED]: "Submitted",
      [STATUS.document.PENDING_REVIEW]: "Pending Review",
      [STATUS.document.APPROVED]: "Approved",
      [STATUS.document.NEEDS_REVISION]: "Needs Revision",
    };

    return labels[status] || status;
  };

  const getStatusClass = (status) => {
    switch (status) {
      case STATUS.document.APPROVED:
        return darkMode
          ? "bg-emerald-950 text-emerald-400 border-emerald-900"
          : "bg-emerald-50 text-emerald-700 border-emerald-200";

      case STATUS.document.NEEDS_REVISION:
        return darkMode
          ? "bg-red-950 text-red-400 border-red-900"
          : "bg-red-50 text-red-700 border-red-200";

      case STATUS.document.PENDING_REVIEW:
      case STATUS.document.SUBMITTED:
        return darkMode
          ? "bg-amber-950 text-amber-400 border-amber-900"
          : "bg-amber-50 text-amber-700 border-amber-200";

      default:
        return darkMode
          ? "bg-slate-800 text-slate-300 border-slate-700"
          : "bg-slate-50 text-slate-600 border-slate-200";
    }
  };

  // =========================================================
  // GROUP DOCUMENTS BY STUDENT
  // =========================================================

  const studentGroups = useMemo(() => {
    const groups = {};

    documents.forEach((document) => {
      if (!groups[document.student_id]) {
        groups[document.student_id] = [];
      }

      groups[document.student_id].push(document);
    });

    return Object.entries(groups).map(([studentId, studentDocuments]) => {
      const student = getStudent(studentId);
      const studentUser = getStudentUser(studentId);

      const assignment = getAssignment(studentDocuments[0]?.assignment_id);

      const company = getCompany(assignment?.company_id);

      const requiredTypes = documentTypes.filter((type) => type.required);

      const approvedRequiredDocuments = studentDocuments.filter((document) => {
        const type = getDocumentType(document.document_type_id);

        return type?.required && document.status === STATUS.document.APPROVED;
      });

      const allRequiredDocumentsApproved =
        requiredTypes.length > 0 &&
        approvedRequiredDocuments.length === requiredTypes.length;

      const pendingDocuments = studentDocuments.filter(
        (document) =>
          document.status === STATUS.document.PENDING_REVIEW ||
          document.status === STATUS.document.SUBMITTED
      );

      const needsRevision = studentDocuments.filter(
        (document) => document.status === STATUS.document.NEEDS_REVISION
      );

      const deployed = assignment?.status === STATUS.assignment.ACTIVE;

      const completed = assignment?.status === STATUS.assignment.COMPLETED;

      const suspended = assignment?.status === STATUS.assignment.SUSPENDED;

      const terminated = assignment?.status === STATUS.assignment.TERMINATED;

      const deploymentFinished =
        deployed || completed || suspended || terminated;

      return {
        studentId,
        student,
        studentUser,
        studentName: getStudentFullName(studentId),
        assignment,
        company,
        documents: studentDocuments,
        requiredCount: requiredTypes.length,
        approvedRequiredCount: approvedRequiredDocuments.length,
        pendingDocuments,
        needsRevision,
        allRequiredDocumentsApproved,
        deployed,
        completed,
        suspended,
        terminated,
        deploymentFinished,
      };
    });
  }, [
    documents,
    students,
    studentUsers,
    assignments,
    documentTypes,
    companies,
  ]);

  // =========================================================
  // APPROVE DOCUMENT
  // =========================================================

  const handleApprove = async (document) => {
    if (!registrar) {
      alert("Registrar information could not be loaded.");
      return;
    }

    const confirmed = window.confirm(`Approve "${document.file_name}"?`);

    if (!confirmed) {
      return;
    }

    setActionLoadingId(document.id);

    try {
      const { data: updatedDocument, error } = await supabaseRegistrar
        .from("documents")
        .update({
          status: STATUS.document.APPROVED,
          notes: "Verified by Registrar.",
          reviewed_by: registrar.id,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", document.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setDocuments((previous) =>
        previous.map((item) =>
          item.id === updatedDocument.id ? updatedDocument : item
        )
      );

      setSelectedDocument(null);

      alert("Document approved successfully.");
    } catch (error) {
      console.error("Error approving document:", error);

      alert(error.message || "Unable to approve document.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // =========================================================
  // REQUEST REVISION
  // =========================================================

  const handleRevision = async (document) => {
    if (!registrar) {
      alert("Registrar information could not be loaded.");
      return;
    }

    const note = window.prompt(
      "Enter the reason for requesting a revision:",
      "Please upload a clearer or updated document."
    );

    if (note === null) {
      return;
    }

    if (!note.trim()) {
      alert("Please provide a revision note.");
      return;
    }

    setActionLoadingId(document.id);

    try {
      const { data: updatedDocument, error } = await supabaseRegistrar
        .from("documents")
        .update({
          status: STATUS.document.NEEDS_REVISION,
          notes: note.trim(),
          reviewed_by: registrar.id,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", document.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setDocuments((previous) =>
        previous.map((item) =>
          item.id === updatedDocument.id ? updatedDocument : item
        )
      );

      setSelectedDocument(null);

      alert("Revision request sent successfully.");
    } catch (error) {
      console.error("Error requesting document revision:", error);

      alert(error.message || "Unable to request document revision.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // =========================================================
  // VIEW DOCUMENT
  // =========================================================

  const handleViewDocument = async (document) => {
    try {
      if (!document.storage_path) {
        throw new Error("This document does not have a storage path.");
      }

      const { data, error } = await supabaseRegistrar.storage
        .from(STORAGE_BUCKET)
        .createSignedUrl(document.storage_path, 60 * 10);

      if (error) {
        throw error;
      }

      if (!data?.signedUrl) {
        throw new Error("Unable to create document preview URL.");
      }

      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error("Error opening document:", error);

      alert(error.message || "Unable to open this document.");
    }
  };

  // =========================================================
  // DEPLOY INTERN
  // =========================================================

  const handleDeploy = async (group) => {
    if (!group.assignment) {
      alert("No internship assignment found for this student.");

      return;
    }

    if (!group.allRequiredDocumentsApproved) {
      alert(
        "All required documents must be approved before this intern can be deployed."
      );

      return;
    }

    if (group.deploymentFinished) {
      alert("This internship is no longer available for deployment.");

      return;
    }

    const company = getCompany(group.assignment.company_id);

    const confirmed = window.confirm(
      `Deploy ${group.studentName} to ${
        company?.company_name || "the assigned company"
      }?`
    );

    if (!confirmed) {
      return;
    }

    setDeployingAssignmentId(group.assignment.id);

    try {
      const { data: updatedAssignment, error } = await supabaseRegistrar
        .from("assignments")
        .update({
          status: STATUS.assignment.ACTIVE,
          deployed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", group.assignment.id)
        .eq("status", STATUS.assignment.PENDING)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setAssignments((previous) =>
        previous.map((assignment) =>
          assignment.id === updatedAssignment.id
            ? updatedAssignment
            : assignment
        )
      );

      alert("Intern deployed successfully.");
    } catch (error) {
      console.error("Error deploying intern:", error);

      alert(error.message || "Unable to deploy intern.");
    } finally {
      setDeployingAssignmentId(null);
    }
  };

  // =========================================================
  // SUMMARY
  // =========================================================

  const totalDocuments = documents.length;

  const pendingDocuments = documents.filter(
    (document) =>
      document.status === STATUS.document.PENDING_REVIEW ||
      document.status === STATUS.document.SUBMITTED
  ).length;

  const approvedDocuments = documents.filter(
    (document) => document.status === STATUS.document.APPROVED
  ).length;

  const readyForDeployment = studentGroups.filter(
    (group) => group.allRequiredDocumentsApproved && !group.deploymentFinished
  ).length;

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

          <p className={`text-sm mt-1 ${mutedText}`}>
            Please wait while we load student internship documents.
          </p>
        </div>
      </div>
    );
  }

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div
      className={`p-5 md:p-6 lg:p-8 max-w-[1200px] mx-auto ${
        darkMode ? "text-slate-100" : "text-slate-900"
      }`}
    >
      {/* HEADER */}

      <div className="mb-6">
        <p className="text-xs uppercase tracking-widest font-bold text-slate-400">
          Registrar Portal
        </p>

        <h1 className="text-2xl font-black">Document Verification</h1>

        <p className={`text-sm mt-1 ${mutedText}`}>
          Review student internship requirements before deployment.
        </p>
      </div>

      {/* SUMMARY */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className={`border rounded-2xl p-4 ${card}`}>
          <p className={`text-xs font-semibold ${mutedText}`}>
            Submitted Documents
          </p>

          <p className="text-2xl font-black mt-1">{totalDocuments}</p>
        </div>

        <div className={`border rounded-2xl p-4 ${card}`}>
          <p className={`text-xs font-semibold ${mutedText}`}>Pending Review</p>

          <p className="text-2xl font-black mt-1">{pendingDocuments}</p>
        </div>

        <div className={`border rounded-2xl p-4 ${card}`}>
          <p className={`text-xs font-semibold ${mutedText}`}>
            Approved Documents
          </p>

          <p className="text-2xl font-black mt-1">{approvedDocuments}</p>
        </div>

        <div className={`border rounded-2xl p-4 ${card}`}>
          <p className={`text-xs font-semibold ${mutedText}`}>
            Ready for Deployment
          </p>

          <p className="text-2xl font-black mt-1">{readyForDeployment}</p>
        </div>
      </div>

      {/* DOCUMENT LIST */}

      <section className={`border rounded-2xl overflow-hidden ${card}`}>
        <div className={`px-5 py-4 border-b ${border}`}>
          <h2 className="font-bold text-sm">Student Document Verification</h2>

          <p className={`text-xs mt-1 ${mutedText}`}>
            Approve all required documents before deploying the intern.
          </p>
        </div>

        {studentGroups.length === 0 ? (
          <div className="p-10 text-center">
            <div className="text-3xl mb-3">📄</div>

            <p className="font-semibold">No submitted documents</p>

            <p className={`text-sm mt-1 ${mutedText}`}>
              Students will appear here after submitting their internship
              requirements.
            </p>
          </div>
        ) : (
          <div
            className={`divide-y ${
              darkMode ? "divide-slate-700" : "divide-slate-200"
            }`}
          >
            {studentGroups.map((group) => {
              const company = getCompany(group.assignment?.company_id);

              return (
                <div
                  key={group.studentId}
                  className={`p-5 ${
                    darkMode ? "hover:bg-slate-800/30" : "hover:bg-slate-50"
                  }`}
                >
                  {/* STUDENT HEADER */}

                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-black">
                          {group.studentName}
                        </h3>

                        {group.completed ? (
                          <span className="px-2 py-1 rounded-full border text-[10px] font-bold bg-purple-50 text-purple-700 border-purple-200">
                            COMPLETED
                          </span>
                        ) : group.deployed ? (
                          <span className="px-2 py-1 rounded-full border text-[10px] font-bold bg-emerald-50 text-emerald-700 border-emerald-200">
                            DEPLOYED
                          </span>
                        ) : group.suspended ? (
                          <span className="px-2 py-1 rounded-full border text-[10px] font-bold bg-amber-50 text-amber-700 border-amber-200">
                            SUSPENDED
                          </span>
                        ) : group.terminated ? (
                          <span className="px-2 py-1 rounded-full border text-[10px] font-bold bg-red-50 text-red-700 border-red-200">
                            TERMINATED
                          </span>
                        ) : group.allRequiredDocumentsApproved ? (
                          <span className="px-2 py-1 rounded-full border text-[10px] font-bold bg-blue-50 text-blue-700 border-blue-200">
                            READY FOR DEPLOYMENT
                          </span>
                        ) : group.needsRevision.length > 0 ? (
                          <span className="px-2 py-1 rounded-full border text-[10px] font-bold bg-red-50 text-red-700 border-red-200">
                            REVISION REQUIRED
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-full border text-[10px] font-bold bg-amber-50 text-amber-700 border-amber-200">
                            UNDER REVIEW
                          </span>
                        )}
                      </div>

                      {/* STUDENT BASIC INFO */}

                      <div className="mt-2 space-y-1">
                        <p className={`text-xs ${mutedText}`}>
                          <span className="font-semibold">Student ID:</span>{" "}
                          {group.student?.student_id || group.studentId}
                        </p>

                        <p className={`text-xs ${mutedText}`}>
                          <span className="font-semibold">Program:</span>{" "}
                          {group.student?.program || "No program"}
                        </p>

                        <p className={`text-xs ${mutedText}`}>
                          <span className="font-semibold">Year Level:</span>{" "}
                          {group.student?.year_level || "No year level"}
                        </p>

                        <p className={`text-xs ${mutedText}`}>
                          <span className="font-semibold">Department:</span>{" "}
                          {group.student?.department || "No department"}
                        </p>

                        {group.studentUser?.email && (
                          <p className={`text-xs ${mutedText}`}>
                            <span className="font-semibold">Email:</span>{" "}
                            {group.studentUser.email}
                          </p>
                        )}

                        {group.student?.phone && (
                          <p className={`text-xs ${mutedText}`}>
                            <span className="font-semibold">Phone:</span>{" "}
                            {group.student.phone}
                          </p>
                        )}

                        {group.student?.address && (
                          <p className={`text-xs ${mutedText}`}>
                            <span className="font-semibold">Address:</span>{" "}
                            {group.student.address}
                          </p>
                        )}

                        {group.student?.gwa && (
                          <p className={`text-xs ${mutedText}`}>
                            <span className="font-semibold">GWA:</span>{" "}
                            {group.student.gwa}
                          </p>
                        )}
                      </div>

                      {/* ASSIGNMENT + COMPANY */}

                      {group.assignment && (
                        <div className="mt-3">
                          <p className={`text-xs ${mutedText}`}>
                            <span className="font-semibold">Assignment:</span>{" "}
                            {group.assignment.id}
                          </p>

                          <p className={`text-xs mt-1 ${mutedText}`}>
                            <span className="font-semibold">Company:</span>{" "}
                            <span className="font-semibold">
                              {company?.company_name || "Unknown Company"}
                            </span>
                          </p>

                          {company?.industry && (
                            <p className={`text-xs mt-1 ${mutedText}`}>
                              <span className="font-semibold">Industry:</span>{" "}
                              {company.industry}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* DOCUMENT PROGRESS */}

                    <div
                      className={`border rounded-xl px-4 py-3 min-w-[220px] ${
                        darkMode
                          ? "bg-slate-800 border-slate-700"
                          : "bg-slate-50 border-slate-200"
                      }`}
                    >
                      <p
                        className={`text-[10px] uppercase tracking-wide font-bold ${mutedText}`}
                      >
                        Required Documents
                      </p>

                      <p className="text-sm font-black mt-1">
                        {group.approvedRequiredCount} / {group.requiredCount}{" "}
                        approved
                      </p>

                      <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 mt-2 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 transition-all"
                          style={{
                            width: `${
                              group.requiredCount
                                ? Math.min(
                                    100,
                                    (group.approvedRequiredCount /
                                      group.requiredCount) *
                                      100
                                  )
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* DOCUMENTS */}

                  <div className="mt-5 space-y-3">
                    {group.documents.map((document) => {
                      const type = getDocumentType(document.document_type_id);

                      const isApproved =
                        document.status === STATUS.document.APPROVED;

                      const isProcessing = actionLoadingId === document.id;

                      return (
                        <div
                          key={document.id}
                          className={`border rounded-xl p-4 ${
                            darkMode
                              ? "border-slate-700 bg-slate-800/50"
                              : "border-slate-200 bg-slate-50"
                          }`}
                        >
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="flex items-start gap-3 min-w-0">
                              <div
                                className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                                  darkMode ? "bg-slate-700" : "bg-white"
                                }`}
                              >
                                📄
                              </div>

                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="font-bold text-sm">
                                    {type?.name || "Unknown Document"}
                                  </p>

                                  {type?.required && (
                                    <span className="text-[10px] font-bold text-red-500">
                                      REQUIRED
                                    </span>
                                  )}

                                  <span
                                    className={`px-2 py-1 rounded-full border text-[10px] font-bold ${getStatusClass(
                                      document.status
                                    )}`}
                                  >
                                    {getStatusLabel(document.status)}
                                  </span>
                                </div>

                                <p
                                  className={`text-xs mt-1 truncate ${mutedText}`}
                                >
                                  {document.file_name}
                                </p>

                                <p className={`text-[10px] mt-1 ${mutedText}`}>
                                  Version {document.version}
                                </p>

                                {document.notes && (
                                  <p className="text-xs mt-2 text-red-500">
                                    <span className="font-bold">
                                      Registrar note:
                                    </span>{" "}
                                    {document.notes}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* ACTIONS */}

                            <div className="flex flex-wrap items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => setSelectedDocument(document)}
                                className={`px-3 py-2 rounded-lg border text-xs font-semibold transition ${
                                  darkMode
                                    ? "border-slate-600 hover:bg-slate-700"
                                    : "border-slate-300 hover:bg-white"
                                }`}
                              >
                                👁 Details
                              </button>

                              <button
                                type="button"
                                onClick={() => handleViewDocument(document)}
                                className={`px-3 py-2 rounded-lg border text-xs font-semibold transition ${
                                  darkMode
                                    ? "border-blue-800 text-blue-400 hover:bg-blue-950"
                                    : "border-blue-200 text-blue-600 hover:bg-blue-50"
                                }`}
                              >
                                ↗ View File
                              </button>

                              {!isApproved && (
                                <>
                                  <button
                                    type="button"
                                    disabled={isProcessing}
                                    onClick={() => handleApprove(document)}
                                    className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold transition"
                                  >
                                    {isProcessing ? "Saving..." : "✓ Approve"}
                                  </button>

                                  <button
                                    type="button"
                                    disabled={isProcessing}
                                    onClick={() => handleRevision(document)}
                                    className={`px-3 py-2 rounded-lg border text-xs font-semibold transition ${
                                      darkMode
                                        ? "border-red-900 text-red-400 hover:bg-red-950"
                                        : "border-red-200 text-red-600 hover:bg-red-50"
                                    }`}
                                  >
                                    ↻ Revision
                                  </button>
                                </>
                              )}

                              {isApproved && (
                                <span className="text-xs font-semibold text-emerald-600">
                                  ✓ Verified
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* DEPLOYMENT */}

                  <div
                    className={`mt-5 pt-5 border-t flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${
                      darkMode ? "border-slate-700" : "border-slate-200"
                    }`}
                  >
                    <div>
                      {group.completed ? (
                        <>
                          <p className="text-sm font-bold text-purple-600">
                            ✓ Internship Completed
                          </p>

                          <p className={`text-xs mt-1 ${mutedText}`}>
                            This internship has already been completed.
                          </p>
                        </>
                      ) : group.deployed ? (
                        <>
                          <p className="text-sm font-bold text-emerald-600">
                            ✓ Intern Deployed
                          </p>

                          <p className={`text-xs mt-1 ${mutedText}`}>
                            The student is now active in their internship.
                          </p>
                        </>
                      ) : group.suspended ? (
                        <p className="text-sm font-bold text-amber-600">
                          Internship Suspended
                        </p>
                      ) : group.terminated ? (
                        <p className="text-sm font-bold text-red-600">
                          Internship Terminated
                        </p>
                      ) : group.allRequiredDocumentsApproved ? (
                        <>
                          <p className="text-sm font-bold text-blue-600">
                            All Required Documents Approved
                          </p>

                          <p className={`text-xs mt-1 ${mutedText}`}>
                            This student is ready for deployment.
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-semibold">
                            Deployment Unavailable
                          </p>

                          <p className={`text-xs mt-1 ${mutedText}`}>
                            Approve all required documents before deployment.
                          </p>
                        </>
                      )}
                    </div>

                    {!group.deploymentFinished && (
                      <button
                        type="button"
                        disabled={
                          !group.allRequiredDocumentsApproved ||
                          deployingAssignmentId === group.assignment?.id
                        }
                        onClick={() => handleDeploy(group)}
                        className={`px-5 py-2.5 rounded-lg text-xs font-bold transition ${
                          group.allRequiredDocumentsApproved
                            ? "bg-blue-600 hover:bg-blue-700 text-white"
                            : darkMode
                            ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                            : "bg-slate-100 text-slate-400 cursor-not-allowed"
                        }`}
                      >
                        {deployingAssignmentId === group.assignment?.id
                          ? "Deploying..."
                          : "🚀 Deploy Intern"}
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
          DOCUMENT DETAILS MODAL
      ===================================================== */}

      {selectedDocument && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => setSelectedDocument(null)}
        >
          <div
            className={`w-full max-w-2xl max-h-[90vh] rounded-2xl border shadow-2xl overflow-hidden ${
              darkMode
                ? "bg-slate-900 border-slate-700"
                : "bg-white border-slate-200"
            }`}
            onClick={(event) => event.stopPropagation()}
          >
            {/* HEADER */}

            <div
              className={`px-5 py-4 border-b flex items-center justify-between ${
                darkMode ? "border-slate-700" : "border-slate-200"
              }`}
            >
              <div className="min-w-0">
                <h2 className="font-bold truncate">
                  {selectedDocument.file_name}
                </h2>

                <p className={`text-xs mt-1 ${mutedText}`}>
                  Internship Document
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedDocument(null)}
                className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg transition ${
                  darkMode ? "hover:bg-slate-800" : "hover:bg-slate-100"
                }`}
              >
                ×
              </button>
            </div>

            {/* BODY */}

            <div className="p-6 overflow-y-auto max-h-[65vh]">
              {/* STUDENT INFORMATION */}

              {(() => {
                const student = getStudent(selectedDocument.student_id);

                const studentUser = getStudentUser(selectedDocument.student_id);

                return (
                  <div
                    className={`p-5 rounded-xl border ${
                      darkMode
                        ? "bg-slate-800 border-slate-700"
                        : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <p className={`text-xs uppercase font-bold ${mutedText}`}>
                      Student Information
                    </p>

                    <h3 className="text-lg font-black mt-1">
                      {getStudentFullName(selectedDocument.student_id)}
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-3 mt-4">
                      <div>
                        <p
                          className={`text-[10px] uppercase font-bold ${mutedText}`}
                        >
                          Student ID
                        </p>

                        <p className="text-sm font-semibold mt-1">
                          {student?.student_id || selectedDocument.student_id}
                        </p>
                      </div>

                      <div>
                        <p
                          className={`text-[10px] uppercase font-bold ${mutedText}`}
                        >
                          Email
                        </p>

                        <p className="text-sm font-semibold mt-1 break-all">
                          {studentUser?.email || "No email"}
                        </p>
                      </div>

                      <div>
                        <p
                          className={`text-[10px] uppercase font-bold ${mutedText}`}
                        >
                          Program
                        </p>

                        <p className="text-sm font-semibold mt-1">
                          {student?.program || "No program"}
                        </p>
                      </div>

                      <div>
                        <p
                          className={`text-[10px] uppercase font-bold ${mutedText}`}
                        >
                          Year Level
                        </p>

                        <p className="text-sm font-semibold mt-1">
                          {student?.year_level || "No year level"}
                        </p>
                      </div>

                      <div className="sm:col-span-2">
                        <p
                          className={`text-[10px] uppercase font-bold ${mutedText}`}
                        >
                          Department
                        </p>

                        <p className="text-sm font-semibold mt-1">
                          {student?.department || "No department"}
                        </p>
                      </div>

                      <div>
                        <p
                          className={`text-[10px] uppercase font-bold ${mutedText}`}
                        >
                          Phone
                        </p>

                        <p className="text-sm font-semibold mt-1">
                          {student?.phone || "No phone"}
                        </p>
                      </div>

                      <div>
                        <p
                          className={`text-[10px] uppercase font-bold ${mutedText}`}
                        >
                          GWA
                        </p>

                        <p className="text-sm font-semibold mt-1">
                          {student?.gwa || "Not available"}
                        </p>
                      </div>

                      <div className="sm:col-span-2">
                        <p
                          className={`text-[10px] uppercase font-bold ${mutedText}`}
                        >
                          Address
                        </p>

                        <p className="text-sm font-semibold mt-1">
                          {student?.address || "No address"}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* DOCUMENT INFORMATION */}

              <div
                className={`p-5 rounded-xl border mt-4 ${
                  darkMode
                    ? "bg-slate-800 border-slate-700"
                    : "bg-slate-50 border-slate-200"
                }`}
              >
                <p className={`text-xs uppercase font-bold ${mutedText}`}>
                  Document Information
                </p>

                <p className={`text-xs mt-4 uppercase font-bold ${mutedText}`}>
                  Document Type
                </p>

                <p className="font-bold mt-1">
                  {getDocumentType(selectedDocument.document_type_id)?.name ||
                    "Unknown Document"}
                </p>

                <p className={`text-xs mt-4 uppercase font-bold ${mutedText}`}>
                  File
                </p>

                <p className="text-sm font-semibold mt-1 break-all">
                  {selectedDocument.file_name}
                </p>

                <p className={`text-xs mt-4 uppercase font-bold ${mutedText}`}>
                  Version
                </p>

                <p className="text-sm font-semibold mt-1">
                  {selectedDocument.version}
                </p>

                <p className={`text-xs mt-4 uppercase font-bold ${mutedText}`}>
                  Status
                </p>

                <span
                  className={`inline-flex mt-2 px-3 py-1.5 rounded-full border text-xs font-bold ${getStatusClass(
                    selectedDocument.status
                  )}`}
                >
                  {getStatusLabel(selectedDocument.status)}
                </span>

                {selectedDocument.notes && (
                  <>
                    <p
                      className={`text-xs mt-4 uppercase font-bold ${mutedText}`}
                    >
                      Registrar Note
                    </p>

                    <p className="text-sm mt-1 text-red-500">
                      {selectedDocument.notes}
                    </p>
                  </>
                )}
              </div>

              {/* ASSIGNMENT / COMPANY */}

              {(() => {
                const assignment = getAssignment(
                  selectedDocument.assignment_id
                );

                const company = getCompany(assignment?.company_id);

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                    <div
                      className={`p-3 rounded-lg ${
                        darkMode ? "bg-slate-800" : "bg-slate-50"
                      }`}
                    >
                      <p
                        className={`text-[10px] uppercase font-bold ${mutedText}`}
                      >
                        Assignment
                      </p>

                      <p className="text-sm font-semibold mt-1 break-all">
                        {selectedDocument.assignment_id}
                      </p>
                    </div>

                    <div
                      className={`p-3 rounded-lg ${
                        darkMode ? "bg-slate-800" : "bg-slate-50"
                      }`}
                    >
                      <p
                        className={`text-[10px] uppercase font-bold ${mutedText}`}
                      >
                        Company
                      </p>

                      <p className="text-sm font-semibold mt-1">
                        {company?.company_name || "Unknown Company"}
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* VIEW FILE */}

              <button
                type="button"
                onClick={() => handleViewDocument(selectedDocument)}
                className="w-full mt-5 px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold"
              >
                ↗ Open Uploaded Document
              </button>
            </div>

            {/* ACTIONS */}

            {selectedDocument.status !== STATUS.document.APPROVED && (
              <div
                className={`px-5 py-4 border-t flex flex-col sm:flex-row justify-end gap-2 ${
                  darkMode ? "border-slate-700" : "border-slate-200"
                }`}
              >
                <button
                  type="button"
                  disabled={actionLoadingId === selectedDocument.id}
                  onClick={() => handleRevision(selectedDocument)}
                  className={`px-4 py-2 rounded-lg border text-xs font-semibold ${
                    darkMode
                      ? "border-red-900 text-red-400 hover:bg-red-950"
                      : "border-red-200 text-red-600 hover:bg-red-50"
                  }`}
                >
                  Request Revision
                </button>

                <button
                  type="button"
                  disabled={actionLoadingId === selectedDocument.id}
                  onClick={() => handleApprove(selectedDocument)}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                >
                  Approve Document
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
