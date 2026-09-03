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

const Documents = () => {
  const { darkMode } = useOutletContext();

  const [registrar, setRegistrar] = useState(null);
  const [students, setStudents] = useState([]);
  const [studentUsers, setStudentUsers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [documents, setDocuments] = useState([]);

  // School information used for certificate/deployment validation
  const [schools, setSchools] = useState([]);

  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);

  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [deployingAssignmentId, setDeployingAssignmentId] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // ---------------------------------------------------------
  // Theme
  // ---------------------------------------------------------

  const pageBg = darkMode ? "bg-slate-950" : "bg-slate-50";

  const card = darkMode
    ? "bg-slate-900 border-slate-700"
    : "bg-white border-slate-200";

  const border = darkMode ? "border-slate-700" : "border-slate-200";

  const text = darkMode ? "text-white" : "text-slate-900";

  const mutedText = darkMode ? "text-slate-400" : "text-slate-500";

  const inputClass = darkMode
    ? "bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
    : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400";

  // ---------------------------------------------------------
  // Load Data
  // ---------------------------------------------------------

  const loadData = async () => {
    try {
      setLoading(true);

      const {
        data: { user },
        error: authError,
      } = await supabaseRegistrar.auth.getUser();

      if (authError) {
        throw authError;
      }

      if (!user) {
        throw new Error("No authenticated user found.");
      }

      // Current registrar
      const { data: registrarData, error: registrarError } =
        await supabaseRegistrar
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

      if (registrarError) {
        throw registrarError;
      }

      setRegistrar(registrarData);

      // Students
      // Added school_id because deployment now needs to verify
      // that the student's school has an official logo.
      const { data: studentsData, error: studentsError } =
        await supabaseRegistrar
          .from("students")
          .select(
            `
              id,
              student_id,
              school_id,
              program,
              year_level,
              department,
              phone,
              address,
              gwa
            `
          )
          .order("student_id", { ascending: true });

      if (studentsError) {
        throw studentsError;
      }

      setStudents(studentsData || []);

      // Student users
      const { data: studentUsersData, error: studentUsersError } =
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

      if (studentUsersError) {
        throw studentUsersError;
      }

      setStudentUsers(studentUsersData || []);

      // Schools
      // Used to determine whether the student's school has
      // an official logo configured.
      const { data: schoolsData, error: schoolsError } = await supabaseRegistrar
        .from("schools")
        .select(
          `
              id,
              name,
              code,
              logo_url
            `
        )
        .order("name", { ascending: true });

      if (schoolsError) {
        throw schoolsError;
      }

      setSchools(schoolsData || []);

      // Assignments
      const { data: assignmentsData, error: assignmentsError } =
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
          .order("created_at", { ascending: false });

      if (assignmentsError) {
        throw assignmentsError;
      }

      setAssignments(assignmentsData || []);

      // Companies
      const { data: companiesData, error: companiesError } =
        await supabaseRegistrar
          .from("companies")
          .select(
            `
              id,
              company_name,
              company_email,
              company_phone,
              company_address,
              industry,
              designation,
              status
            `
          )
          .order("company_name", { ascending: true });

      if (companiesError) {
        throw companiesError;
      }

      setCompanies(companiesData || []);

      // Opportunities
      const { data: opportunitiesData, error: opportunitiesError } =
        await supabaseRegistrar
          .from("opportunities")
          .select(
            `
              id,
              title
            `
          )
          .order("title", { ascending: true });

      if (opportunitiesError) {
        throw opportunitiesError;
      }

      setOpportunities(opportunitiesData || []);

      // Document types
      const { data: documentTypesData, error: documentTypesError } =
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
          .order("name", { ascending: true });

      if (documentTypesError) {
        throw documentTypesError;
      }

      setDocumentTypes(documentTypesData || []);

      // Documents
      const { data: documentsData, error: documentsError } =
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
          .order("created_at", { ascending: false });

      if (documentsError) {
        throw documentsError;
      }

      setDocuments(documentsData || []);
    } catch (error) {
      console.error("Error loading documents:", error);
      alert(error.message || "Failed to load document verification data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ---------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------

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

  const getOpportunity = (opportunityId) => {
    return opportunities.find(
      (opportunity) => opportunity.id === opportunityId
    );
  };

  const getDocumentType = (typeId) => {
    return documentTypes.find((type) => type.id === typeId);
  };

  // ---------------------------------------------------------
  // School Helpers
  // ---------------------------------------------------------

  const getSchool = (schoolId) => {
    if (!schoolId) {
      return null;
    }

    return schools.find((school) => school.id === schoolId) || null;
  };

  const getStudentSchool = (studentId) => {
    const student = getStudent(studentId);

    if (!student?.school_id) {
      return null;
    }

    return getSchool(student.school_id);
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case STATUS.document.SUBMITTED:
        return "Submitted";

      case STATUS.document.PENDING_REVIEW:
        return "Under Review";

      case STATUS.document.APPROVED:
        return "Approved";

      case STATUS.document.NEEDS_REVISION:
        return "Revision Required";

      default:
        return status
          ? status
              .replaceAll("_", " ")
              .replace(/\b\w/g, (char) => char.toUpperCase())
          : "Unknown";
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case STATUS.document.APPROVED:
        return darkMode
          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
          : "bg-emerald-50 text-emerald-700 border-emerald-200";

      case STATUS.document.PENDING_REVIEW:
      case STATUS.document.SUBMITTED:
        return darkMode
          ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
          : "bg-amber-50 text-amber-700 border-amber-200";

      case STATUS.document.NEEDS_REVISION:
        return darkMode
          ? "bg-red-500/10 text-red-400 border-red-500/20"
          : "bg-red-50 text-red-700 border-red-200";

      default:
        return darkMode
          ? "bg-slate-800 text-slate-300 border-slate-700"
          : "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  const getAssignmentStatusLabel = (status, deployedAt = null) => {
    switch (status) {
      case STATUS.assignment.PENDING:
        return deployedAt ? "Sent to Company" : "Pending Deployment";

      case STATUS.assignment.ACTIVE:
        return "Accepted by Company";

      case STATUS.assignment.COMPLETED:
        return "Completed";

      case STATUS.assignment.SUSPENDED:
        return "Suspended";

      case STATUS.assignment.TERMINATED:
        return "Rejected by Company";

      default:
        return "No Assignment";
    }
  };

  const getAssignmentStatusClass = (status, deployedAt = null) => {
    if (status === STATUS.assignment.PENDING && deployedAt) {
      return darkMode
        ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
        : "bg-blue-50 text-blue-700 border-blue-200";
    }

    switch (status) {
      case STATUS.assignment.ACTIVE:
      case STATUS.assignment.COMPLETED:
        return darkMode
          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
          : "bg-emerald-50 text-emerald-700 border-emerald-200";

      case STATUS.assignment.SUSPENDED:
      case STATUS.assignment.TERMINATED:
        return darkMode
          ? "bg-red-500/10 text-red-400 border-red-500/20"
          : "bg-red-50 text-red-700 border-red-200";

      default:
        return darkMode
          ? "bg-slate-800 text-slate-300 border-slate-700"
          : "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  // ---------------------------------------------------------
  // Documents By Assignment
  // ---------------------------------------------------------

  const documentsByAssignment = useMemo(() => {
    const map = {};

    documents.forEach((document) => {
      if (!document.assignment_id) {
        return;
      }

      if (!map[document.assignment_id]) {
        map[document.assignment_id] = [];
      }

      map[document.assignment_id].push(document);
    });

    return map;
  }, [documents]);

  // ---------------------------------------------------------
  // Internship Groups
  // ---------------------------------------------------------

  const studentGroups = useMemo(() => {
    const requiredTypes = documentTypes.filter((type) => type.required);

    return assignments
      .map((assignment) => {
        const assignmentDocuments = documentsByAssignment[assignment.id] || [];

        const studentId = assignment.student_id;

        const student = getStudent(studentId);
        const studentUser = getStudentUser(studentId);
        const company = getCompany(assignment.company_id);
        const opportunity = getOpportunity(assignment.opportunity_id);

        const approvedRequiredDocuments = assignmentDocuments.filter(
          (document) => {
            const type = getDocumentType(document.document_type_id);

            return (
              type?.required && document.status === STATUS.document.APPROVED
            );
          }
        );

        const pendingDocuments = assignmentDocuments.filter(
          (document) =>
            document.status === STATUS.document.PENDING_REVIEW ||
            document.status === STATUS.document.SUBMITTED
        );

        const needsRevision = assignmentDocuments.filter(
          (document) => document.status === STATUS.document.NEEDS_REVISION
        );

        const approvedDocuments = assignmentDocuments.filter(
          (document) => document.status === STATUS.document.APPROVED
        );

        const allRequiredDocumentsApproved =
          requiredTypes.length > 0 &&
          approvedRequiredDocuments.length >= requiredTypes.length;

        const deployed = assignment.status === STATUS.assignment.ACTIVE;

        const sentToCompany =
          assignment.status === STATUS.assignment.PENDING &&
          !!assignment.deployed_at;

        const completed = assignment.status === STATUS.assignment.COMPLETED;

        const suspended = assignment.status === STATUS.assignment.SUSPENDED;

        const terminated = assignment.status === STATUS.assignment.TERMINATED;

        const deploymentFinished =
          sentToCompany || deployed || completed || suspended || terminated;

        let overallStatus = "Under Review";

        if (deployed) {
          overallStatus = "Deployed";
        } else if (sentToCompany) {
          overallStatus = "Sent to Company";
        } else if (completed) {
          overallStatus = "Completed";
        } else if (suspended) {
          overallStatus = "Suspended";
        } else if (terminated) {
          overallStatus = "Terminated";
        } else if (needsRevision.length > 0) {
          overallStatus = "Revision Required";
        } else if (allRequiredDocumentsApproved) {
          overallStatus = "Ready for Deployment";
        } else if (pendingDocuments.length > 0) {
          overallStatus = "Under Review";
        } else if (assignmentDocuments.length === 0) {
          overallStatus = "No Documents";
        }

        return {
          // Assignment is the unique internship group.
          groupId: assignment.id,

          studentId,
          student,
          studentUser,
          studentName: getStudentFullName(studentId),

          assignment,
          applicationId: assignment.application_id,

          // Internship information
          opportunity,
          internshipTitle: opportunity?.title || "Unknown Internship",

          company,

          // School information
          school: student?.school_id ? getSchool(student.school_id) : null,

          documents: assignmentDocuments,

          requiredCount: requiredTypes.length,
          approvedRequiredCount: approvedRequiredDocuments.length,

          pendingDocuments,
          approvedDocuments,
          needsRevision,

          allRequiredDocumentsApproved,

          deployed,
          completed,
          suspended,
          terminated,
          deploymentFinished,

          overallStatus,
        };
      })
      .sort((a, b) => {
        const studentCompare = a.studentName.localeCompare(b.studentName);

        if (studentCompare !== 0) {
          return studentCompare;
        }

        return (
          new Date(b.assignment?.created_at || 0) -
          new Date(a.assignment?.created_at || 0)
        );
      });
  }, [
    assignments,
    documentsByAssignment,
    students,
    studentUsers,
    documentTypes,
    companies,
    opportunities,
    documents,
    schools,
  ]);

  // ---------------------------------------------------------
  // Selected Internship
  // ---------------------------------------------------------

  const selectedStudentGroup = useMemo(() => {
    if (!selectedGroupId) {
      return null;
    }

    return (
      studentGroups.find((group) => group.groupId === selectedGroupId) || null
    );
  }, [studentGroups, selectedGroupId]);

  // ---------------------------------------------------------
  // Filtering
  // ---------------------------------------------------------

  const filteredStudentGroups = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return studentGroups.filter((group) => {
      const matchesSearch =
        !search ||
        group.studentName.toLowerCase().includes(search) ||
        group.student?.student_id?.toLowerCase().includes(search) ||
        group.student?.program?.toLowerCase().includes(search) ||
        group.company?.company_name?.toLowerCase().includes(search) ||
        group.internshipTitle?.toLowerCase().includes(search);

      let matchesStatus = true;

      if (statusFilter === "under_review") {
        matchesStatus = group.overallStatus === "Under Review";
      }

      if (statusFilter === "revision") {
        matchesStatus = group.overallStatus === "Revision Required";
      }

      if (statusFilter === "ready") {
        matchesStatus = group.overallStatus === "Ready for Deployment";
      }

      if (statusFilter === "deployed") {
        matchesStatus = group.overallStatus === "Deployed";
      }

      return matchesSearch && matchesStatus;
    });
  }, [studentGroups, searchTerm, statusFilter]);

  // ---------------------------------------------------------
  // Summary
  // ---------------------------------------------------------

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

  // ---------------------------------------------------------
  // Document Actions
  // ---------------------------------------------------------

  const handleApprove = async (document) => {
    if (!registrar?.id) {
      alert("Registrar information is unavailable.");
      return;
    }

    try {
      setActionLoadingId(document.id);

      const reviewedAt = new Date().toISOString();

      const { error } = await supabaseRegistrar
        .from("documents")
        .update({
          status: STATUS.document.APPROVED,
          notes: "Verified by Registrar.",
          reviewed_by: registrar.id,
          reviewed_at: reviewedAt,
          updated_at: reviewedAt,
        })
        .eq("id", document.id);

      if (error) {
        throw error;
      }

      setDocuments((current) =>
        current.map((item) =>
          item.id === document.id
            ? {
                ...item,
                status: STATUS.document.APPROVED,
                notes: "Verified by Registrar.",
                reviewed_by: registrar.id,
                reviewed_at: reviewedAt,
                updated_at: reviewedAt,
              }
            : item
        )
      );

      setSelectedDocument((current) =>
        current?.id === document.id
          ? {
              ...current,
              status: STATUS.document.APPROVED,
              notes: "Verified by Registrar.",
              reviewed_by: registrar.id,
              reviewed_at: reviewedAt,
              updated_at: reviewedAt,
            }
          : current
      );
    } catch (error) {
      console.error("Error approving document:", error);
      alert(error.message || "Failed to approve document.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRevision = async (document) => {
    if (!registrar?.id) {
      alert("Registrar information is unavailable.");
      return;
    }

    const note = window.prompt(
      "Enter the reason why this document needs revision:"
    );

    if (note === null) {
      return;
    }

    if (!note.trim()) {
      alert("Please provide a revision note.");
      return;
    }

    try {
      setActionLoadingId(document.id);

      const reviewedAt = new Date().toISOString();

      const { error } = await supabaseRegistrar
        .from("documents")
        .update({
          status: STATUS.document.NEEDS_REVISION,
          notes: note.trim(),
          reviewed_by: registrar.id,
          reviewed_at: reviewedAt,
          updated_at: reviewedAt,
        })
        .eq("id", document.id);

      if (error) {
        throw error;
      }

      setDocuments((current) =>
        current.map((item) =>
          item.id === document.id
            ? {
                ...item,
                status: STATUS.document.NEEDS_REVISION,
                notes: note.trim(),
                reviewed_by: registrar.id,
                reviewed_at: reviewedAt,
                updated_at: reviewedAt,
              }
            : item
        )
      );

      setSelectedDocument((current) =>
        current?.id === document.id
          ? {
              ...current,
              status: STATUS.document.NEEDS_REVISION,
              notes: note.trim(),
              reviewed_by: registrar.id,
              reviewed_at: reviewedAt,
            }
          : current
      );
    } catch (error) {
      console.error("Error requesting revision:", error);
      alert(error.message || "Failed to request document revision.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // ---------------------------------------------------------
  // View Document
  // ---------------------------------------------------------

  const handleViewDocument = async (document) => {
    if (!document?.storage_path) {
      alert("No file is attached to this document.");
      return;
    }

    try {
      setActionLoadingId(document.id);

      const { data, error } = await supabaseRegistrar.storage
        .from(STORAGE_BUCKET)
        .createSignedUrl(document.storage_path, 60 * 10);

      if (error) {
        throw error;
      }

      if (!data?.signedUrl) {
        throw new Error("Unable to generate document URL.");
      }

      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error("Error viewing document:", error);
      alert(error.message || "Failed to open document.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // ---------------------------------------------------------
  // Deployment
  // ---------------------------------------------------------

  const handleDeploy = async (group) => {
    if (!group?.assignment) {
      alert("No assignment was found for this internship.");
      return;
    }

    if (!group.allRequiredDocumentsApproved) {
      alert(
        "The student cannot be deployed until all required documents are approved."
      );
      return;
    }

    if (group.deploymentFinished) {
      alert("This internship has already been processed.");
      return;
    }

    // -------------------------------------------------------
    // SCHOOL LOGO VALIDATION
    // -------------------------------------------------------
    // The school logo is required before deployment because
    // the student's school logo will be used when generating
    // the internship completion certificate.
    // -------------------------------------------------------

    const student = getStudent(group.assignment.student_id);

    if (!student) {
      alert(
        "Student information could not be found. Deployment cannot continue."
      );
      return;
    }

    if (!student.school_id) {
      alert(
        "This student is not assigned to a school. Please assign the student to a school before deployment."
      );
      return;
    }

    const school = getSchool(student.school_id);

    if (!school) {
      alert(
        "The student's school information could not be found. Please verify the student's school assignment before deployment."
      );
      return;
    }

    if (!school.logo_url) {
      alert(
        `Deployment blocked.\n\n${
          school.name || "This student's school"
        } does not have an official school logo uploaded yet.\n\nPlease go to:\nRegistrar Settings → School Information\n\nand upload the school's official logo before deploying this student.`
      );
      return;
    }

    // -------------------------------------------------------
    // Confirmation
    // -------------------------------------------------------

    const confirmed = window.confirm(
      `Deploy ${group.studentName} to ${
        group.company?.company_name || "the assigned company"
      }?\n\nSchool: ${
        school.name || "Unknown School"
      }\n\nThe student's school logo is configured and ready for certificate generation.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeployingAssignmentId(group.assignment.id);

      const deployedAt = new Date().toISOString();

      const { data: updatedAssignment, error } = await supabaseRegistrar
        .from("assignments")
        .update({
          status: STATUS.assignment.PENDING,
          deployed_at: deployedAt,
          updated_at: deployedAt,
        })
        .eq("id", group.assignment.id)
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
        .single();

      if (error) {
        throw error;
      }

      if (!updatedAssignment) {
        throw new Error(
          "The assignment was not updated. Please check the Registrar assignment permissions."
        );
      }

      setAssignments((current) =>
        current.map((assignment) =>
          assignment.id === updatedAssignment.id
            ? updatedAssignment
            : assignment
        )
      );

      alert(
        `${group.studentName} has been successfully sent to the company for review.`
      );
    } catch (error) {
      console.error("Error deploying student:", error);

      alert(
        error.message ||
          "Failed to deploy student. Please check the assignment permissions."
      );
    } finally {
      setDeployingAssignmentId(null);
    }
  };

  // ---------------------------------------------------------
  // UI Helpers
  // ---------------------------------------------------------

  const getInitials = (name) => {
    if (!name || name === "Unknown Student") {
      return "?";
    }

    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  };

  const getOverallStatusClass = (status) => {
    switch (status) {
      case "Ready for Deployment":
        return darkMode
          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
          : "bg-emerald-50 text-emerald-700 border-emerald-200";

      case "Deployed":
      case "Completed":
        return darkMode
          ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
          : "bg-blue-50 text-blue-700 border-blue-200";

      case "Revision Required":
        return darkMode
          ? "bg-red-500/10 text-red-400 border-red-500/20"
          : "bg-red-50 text-red-700 border-red-200";

      case "Suspended":
      case "Terminated":
        return darkMode
          ? "bg-red-500/10 text-red-400 border-red-500/20"
          : "bg-red-50 text-red-700 border-red-200";

      case "No Documents":
        return darkMode
          ? "bg-slate-800 text-slate-400 border-slate-700"
          : "bg-slate-100 text-slate-500 border-slate-200";

      default:
        return darkMode
          ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
          : "bg-amber-50 text-amber-700 border-amber-200";
    }
  };

  // ---------------------------------------------------------
  // Loading
  // ---------------------------------------------------------

  if (loading) {
    return (
      <div className={`min-h-full ${pageBg} p-6 md:p-8`}>
        <div className="flex items-center justify-center min-h-[500px]">
          <div className="text-center">
            <div
              className={`w-10 h-10 border-4 rounded-full animate-spin mx-auto mb-4 ${
                darkMode
                  ? "border-slate-700 border-t-blue-500"
                  : "border-slate-200 border-t-blue-600"
              }`}
            />

            <p className={mutedText}>Loading document verification...</p>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // Main UI
  // ---------------------------------------------------------

  return (
    <div className={`min-h-full ${pageBg} p-5 md:p-7 lg:p-8`}>
      {/* Header */}
      <div className="mb-7">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className={`text-2xl md:text-3xl font-bold ${text}`}>
              Document Verification
            </h1>

            <p className={`mt-1 ${mutedText}`}>
              Review internship documents and manage student deployment.
            </p>
          </div>

          <button
            onClick={loadData}
            className={`px-4 py-2.5 rounded-xl border text-sm font-medium transition ${
              darkMode
                ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                : "border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        <div className={`rounded-2xl border ${card} p-5`}>
          <div className="flex items-start justify-between">
            <div>
              <p className={`text-sm ${mutedText}`}>Total Documents</p>

              <p className={`text-2xl font-bold ${text} mt-2`}>
                {totalDocuments}
              </p>
            </div>

            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
              📄
            </div>
          </div>
        </div>

        <div className={`rounded-2xl border ${card} p-5`}>
          <div className="flex items-start justify-between">
            <div>
              <p className={`text-sm ${mutedText}`}>Under Review</p>

              <p className={`text-2xl font-bold ${text} mt-2`}>
                {pendingDocuments}
              </p>
            </div>

            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              ⏳
            </div>
          </div>
        </div>

        <div className={`rounded-2xl border ${card} p-5`}>
          <div className="flex items-start justify-between">
            <div>
              <p className={`text-sm ${mutedText}`}>Approved</p>

              <p className={`text-2xl font-bold ${text} mt-2`}>
                {approvedDocuments}
              </p>
            </div>

            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              ✓
            </div>
          </div>
        </div>

        <div className={`rounded-2xl border ${card} p-5`}>
          <div className="flex items-start justify-between">
            <div>
              <p className={`text-sm ${mutedText}`}>Ready to Deploy</p>

              <p className={`text-2xl font-bold ${text} mt-2`}>
                {readyForDeployment}
              </p>
            </div>

            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
              🚀
            </div>
          </div>
        </div>
      </div>

      {/* Main List */}
      <div className={`rounded-2xl border ${card} overflow-hidden`}>
        {/* List Header */}
        <div className={`p-5 border-b ${border}`}>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h2 className={`text-lg font-semibold ${text}`}>
                Internship Submissions
              </h2>

              <p className={`text-sm mt-1 ${mutedText}`}>
                Each internship assignment has its own document set.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative">
                <span
                  className={`absolute left-3 top-1/2 -translate-y-1/2 ${mutedText}`}
                >
                  🔍
                </span>

                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search student or internship..."
                  className={`w-full sm:w-64 pl-9 pr-3 py-2.5 rounded-xl border outline-none text-sm ${inputClass} focus:ring-2 focus:ring-blue-500/30`}
                />
              </div>

              {/* Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`px-3 py-2.5 rounded-xl border outline-none text-sm ${inputClass} focus:ring-2 focus:ring-blue-500/30`}
              >
                <option value="all">All Status</option>
                <option value="under_review">Under Review</option>
                <option value="revision">Revision Required</option>
                <option value="ready">Ready for Deployment</option>
                <option value="deployed">Deployed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Count */}
        <div className={`px-5 py-3 border-b ${border} text-sm ${mutedText}`}>
          Showing{" "}
          <span className={`font-semibold ${text}`}>
            {filteredStudentGroups.length}
          </span>{" "}
          internship
          {filteredStudentGroups.length !== 1 ? "s" : ""}
        </div>

        {/* Empty */}
        {filteredStudentGroups.length === 0 ? (
          <div className="py-20 text-center px-6">
            <div
              className={`w-14 h-14 mx-auto rounded-2xl flex items-center justify-center text-2xl mb-4 ${
                darkMode ? "bg-slate-800" : "bg-slate-100"
              }`}
            >
              📄
            </div>

            <h3 className={`font-semibold ${text}`}>No internships found</h3>

            <p className={`text-sm mt-1 ${mutedText}`}>
              Try changing your search or filter.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden xl:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr
                    className={`text-left text-xs uppercase tracking-wider ${mutedText} ${
                      darkMode ? "bg-slate-950/50" : "bg-slate-50"
                    }`}
                  >
                    <th className="px-5 py-3 font-semibold">Student</th>

                    <th className="px-5 py-3 font-semibold">Internship</th>

                    <th className="px-5 py-3 font-semibold">Company</th>

                    <th className="px-5 py-3 font-semibold">Documents</th>

                    <th className="px-5 py-3 font-semibold">Status</th>

                    <th className="px-5 py-3 font-semibold text-right">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredStudentGroups.map((group) => (
                    <tr
                      key={group.groupId}
                      className={`border-t ${border} transition ${
                        darkMode ? "hover:bg-slate-800/40" : "hover:bg-slate-50"
                      }`}
                    >
                      {/* Student */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm ${
                              darkMode
                                ? "bg-blue-500/10 text-blue-400"
                                : "bg-blue-50 text-blue-700"
                            }`}
                          >
                            {getInitials(group.studentName)}
                          </div>

                          <div className="min-w-0">
                            <p className={`font-semibold ${text}`}>
                              {group.studentName}
                            </p>

                            <p className={`text-xs mt-0.5 ${mutedText}`}>
                              {group.student?.student_id || "No Student ID"}
                              {" • "}
                              {group.student?.program || "No Program"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Internship */}
                      <td className="px-5 py-4">
                        <p
                          className={`text-sm font-semibold ${text}`}
                          title={group.internshipTitle}
                        >
                          {group.internshipTitle}
                        </p>

                        {group.applicationId && (
                          <p className={`text-xs mt-1 ${mutedText}`}>
                            Application linked
                          </p>
                        )}
                      </td>

                      {/* Company */}
                      <td className="px-5 py-4">
                        <p className={`text-sm font-medium ${text}`}>
                          {group.company?.company_name || "No Company"}
                        </p>

                        {group.company?.designation && (
                          <p className={`text-xs mt-1 ${mutedText}`}>
                            {group.company.designation}
                          </p>
                        )}
                      </td>

                      {/* Documents */}
                      <td className="px-5 py-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`font-semibold text-sm ${text}`}>
                              {group.approvedRequiredCount}/
                              {group.requiredCount}
                            </span>

                            <span className={`text-xs ${mutedText}`}>
                              required approved
                            </span>
                          </div>

                          <div
                            className={`w-32 h-1.5 rounded-full mt-2 ${
                              darkMode ? "bg-slate-700" : "bg-slate-200"
                            }`}
                          >
                            <div
                              className="h-full rounded-full bg-emerald-500 transition-all"
                              style={{
                                width: `${
                                  group.requiredCount > 0
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

                          <div
                            className={`flex gap-3 text-xs mt-2 ${mutedText}`}
                          >
                            <span>{group.pendingDocuments.length} pending</span>

                            <span>{group.needsRevision.length} revision</span>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-medium ${getOverallStatusClass(
                            group.overallStatus
                          )}`}
                        >
                          {group.overallStatus}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setSelectedGroupId(group.groupId)}
                            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition"
                          >
                            See Documents
                          </button>

                          {group.allRequiredDocumentsApproved &&
                            !group.deploymentFinished &&
                            group.assignment && (
                              <button
                                onClick={() => handleDeploy(group)}
                                disabled={
                                  deployingAssignmentId === group.assignment.id
                                }
                                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium transition"
                              >
                                {deployingAssignmentId === group.assignment.id
                                  ? "Deploying..."
                                  : "Deploy"}
                              </button>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Tablet / Mobile Cards */}
            <div className="xl:hidden divide-y">
              {filteredStudentGroups.map((group) => (
                <div key={group.groupId} className={`p-4 md:p-5 ${border}`}>
                  <div className="flex gap-3">
                    <div
                      className={`w-11 h-11 shrink-0 rounded-full flex items-center justify-center font-semibold text-sm ${
                        darkMode
                          ? "bg-blue-500/10 text-blue-400"
                          : "bg-blue-50 text-blue-700"
                      }`}
                    >
                      {getInitials(group.studentName)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                        <div>
                          <h3 className={`font-semibold ${text}`}>
                            {group.studentName}
                          </h3>

                          <p className={`text-xs mt-1 ${mutedText}`}>
                            {group.student?.student_id || "No Student ID"}
                            {" • "}
                            {group.student?.program || "No Program"}
                            {group.student?.year_level
                              ? ` • ${group.student.year_level}`
                              : ""}
                          </p>
                        </div>

                        <span
                          className={`self-start inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-medium ${getOverallStatusClass(
                            group.overallStatus
                          )}`}
                        >
                          {group.overallStatus}
                        </span>
                      </div>

                      {/* Internship */}
                      <div
                        className={`mt-4 rounded-xl p-3 ${
                          darkMode ? "bg-blue-500/5" : "bg-blue-50/70"
                        }`}
                      >
                        <p className={`text-xs ${mutedText}`}>Internship</p>

                        <p
                          className={`text-sm font-semibold ${text} mt-1 truncate`}
                        >
                          {group.internshipTitle}
                        </p>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <div
                          className={`rounded-xl p-3 ${
                            darkMode ? "bg-slate-800/70" : "bg-slate-50"
                          }`}
                        >
                          <p className={`text-xs ${mutedText}`}>Company</p>

                          <p
                            className={`text-sm font-medium ${text} mt-1 truncate`}
                          >
                            {group.company?.company_name || "No Company"}
                          </p>
                        </div>

                        <div
                          className={`rounded-xl p-3 ${
                            darkMode ? "bg-slate-800/70" : "bg-slate-50"
                          }`}
                        >
                          <p className={`text-xs ${mutedText}`}>Documents</p>

                          <p className={`text-sm font-semibold ${text} mt-1`}>
                            {group.approvedRequiredCount}/{group.requiredCount}{" "}
                            approved
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mt-4">
                        {group.pendingDocuments.length > 0 && (
                          <span
                            className={`text-xs px-2.5 py-1 rounded-lg ${
                              darkMode
                                ? "bg-amber-500/10 text-amber-400"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {group.pendingDocuments.length} pending
                          </span>
                        )}

                        {group.needsRevision.length > 0 && (
                          <span
                            className={`text-xs px-2.5 py-1 rounded-lg ${
                              darkMode
                                ? "bg-red-500/10 text-red-400"
                                : "bg-red-50 text-red-700"
                            }`}
                          >
                            {group.needsRevision.length} revision
                          </span>
                        )}

                        {group.approvedDocuments.length > 0 && (
                          <span
                            className={`text-xs px-2.5 py-1 rounded-lg ${
                              darkMode
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-emerald-50 text-emerald-700"
                            }`}
                          >
                            {group.approvedDocuments.length} approved
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2 mt-4">
                        <button
                          onClick={() => setSelectedGroupId(group.groupId)}
                          className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition"
                        >
                          See Documents
                        </button>

                        {group.allRequiredDocumentsApproved &&
                          !group.deploymentFinished &&
                          group.assignment && (
                            <button
                              onClick={() => handleDeploy(group)}
                              disabled={
                                deployingAssignmentId === group.assignment.id
                              }
                              className="sm:w-32 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium transition"
                            >
                              {deployingAssignmentId === group.assignment.id
                                ? "Deploying..."
                                : "Deploy"}
                            </button>
                          )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* =====================================================
          INTERNSHIP DOCUMENT DRAWER
          ===================================================== */}

      {selectedStudentGroup && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <button
            aria-label="Close documents"
            onClick={() => setSelectedGroupId(null)}
            className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
          />

          {/* Drawer */}
          <div
            className={`absolute top-0 right-0 h-full w-full sm:max-w-xl lg:max-w-2xl shadow-2xl ${
              darkMode ? "bg-slate-950" : "bg-white"
            }`}
          >
            <div className="h-full flex flex-col">
              {/* Drawer Header */}
              <div className={`px-5 py-5 border-b ${border}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-12 h-12 shrink-0 rounded-full flex items-center justify-center font-bold ${
                        darkMode
                          ? "bg-blue-500/10 text-blue-400"
                          : "bg-blue-50 text-blue-700"
                      }`}
                    >
                      {getInitials(selectedStudentGroup.studentName)}
                    </div>

                    <div className="min-w-0">
                      <h2 className={`text-lg font-bold ${text} truncate`}>
                        {selectedStudentGroup.studentName}
                      </h2>

                      <p className={`text-sm mt-0.5 ${mutedText}`}>
                        {selectedStudentGroup.student?.student_id ||
                          "No Student ID"}
                        {" • "}
                        {selectedStudentGroup.student?.program || "No Program"}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedGroupId(null)}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      darkMode
                        ? "hover:bg-slate-800 text-slate-400"
                        : "hover:bg-slate-100 text-slate-500"
                    }`}
                  >
                    ✕
                  </button>
                </div>

                {/* Internship */}
                <div
                  className={`mt-4 rounded-xl p-3 ${
                    darkMode
                      ? "bg-blue-500/5 border border-blue-500/10"
                      : "bg-blue-50 border border-blue-100"
                  }`}
                >
                  <p className={`text-xs ${mutedText}`}>Internship</p>

                  <p className={`text-sm font-semibold ${text} mt-1`}>
                    {selectedStudentGroup.internshipTitle}
                  </p>
                </div>

                {/* Company */}
                <div
                  className={`mt-3 rounded-xl p-3 ${
                    darkMode
                      ? "bg-slate-900 border border-slate-800"
                      : "bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className={`text-xs ${mutedText}`}>
                        Internship Company
                      </p>

                      <p
                        className={`text-sm font-semibold ${text} mt-1 truncate`}
                      >
                        {selectedStudentGroup.company?.company_name ||
                          "No Company"}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-medium ${getOverallStatusClass(
                        selectedStudentGroup.overallStatus
                      )}`}
                    >
                      {selectedStudentGroup.overallStatus}
                    </span>
                  </div>
                </div>

                {/* School */}
                {selectedStudentGroup.student?.school_id && (
                  <div
                    className={`mt-3 rounded-xl p-3 ${
                      darkMode
                        ? "bg-slate-900 border border-slate-800"
                        : "bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className={`text-xs ${mutedText}`}>Student School</p>

                        <p
                          className={`text-sm font-semibold ${text} mt-1 truncate`}
                        >
                          {selectedStudentGroup.school?.name ||
                            "School Not Found"}
                        </p>

                        {selectedStudentGroup.school?.code && (
                          <p className={`text-xs mt-1 ${mutedText}`}>
                            {selectedStudentGroup.school.code}
                          </p>
                        )}
                      </div>

                      <div
                        className={`shrink-0 px-2.5 py-1 rounded-full border text-[11px] font-medium ${
                          selectedStudentGroup.school?.logo_url
                            ? darkMode
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : darkMode
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {selectedStudentGroup.school?.logo_url
                          ? "Logo Ready"
                          : "Logo Required"}
                      </div>
                    </div>
                  </div>
                )}

                {/* Internship Status */}
                {selectedStudentGroup.assignment && (
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div
                      className={`rounded-xl p-3 ${
                        darkMode
                          ? "bg-slate-900 border border-slate-800"
                          : "bg-slate-50"
                      }`}
                    >
                      <p className={`text-xs ${mutedText}`}>
                        Assignment Status
                      </p>

                      <p className={`text-sm font-semibold ${text} mt-1`}>
                        {getAssignmentStatusLabel(
                          selectedStudentGroup.assignment.status,
                          selectedStudentGroup.assignment.deployed_at
                        )}
                      </p>
                    </div>

                    <div
                      className={`rounded-xl p-3 ${
                        darkMode
                          ? "bg-slate-900 border border-slate-800"
                          : "bg-slate-50"
                      }`}
                    >
                      <p className={`text-xs ${mutedText}`}>Documents</p>

                      <p className={`text-sm font-semibold ${text} mt-1`}>
                        {selectedStudentGroup.documents.length} submitted
                      </p>
                    </div>
                  </div>
                )}

                {/* Progress */}
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className={`text-sm font-medium ${text}`}>
                      Required Documents
                    </span>

                    <span className={`text-sm font-semibold ${text}`}>
                      {selectedStudentGroup.approvedRequiredCount}/
                      {selectedStudentGroup.requiredCount}
                    </span>
                  </div>

                  <div
                    className={`w-full h-2 rounded-full ${
                      darkMode ? "bg-slate-800" : "bg-slate-200"
                    }`}
                  >
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all"
                      style={{
                        width: `${
                          selectedStudentGroup.requiredCount > 0
                            ? Math.min(
                                100,
                                (selectedStudentGroup.approvedRequiredCount /
                                  selectedStudentGroup.requiredCount) *
                                  100
                              )
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Drawer Body */}
              <div className="flex-1 overflow-y-auto p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className={`font-semibold ${text}`}>
                      Submitted Documents
                    </h3>

                    <p className={`text-xs mt-1 ${mutedText}`}>
                      Review each document before approving or requesting
                      revisions.
                    </p>
                  </div>

                  <span
                    className={`text-xs px-2.5 py-1 rounded-lg ${
                      darkMode
                        ? "bg-slate-800 text-slate-300"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {selectedStudentGroup.documents.length} file
                    {selectedStudentGroup.documents.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {selectedStudentGroup.documents.length === 0 ? (
                  <div className="text-center py-16">
                    <div
                      className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center text-2xl ${
                        darkMode ? "bg-slate-900" : "bg-slate-100"
                      }`}
                    >
                      📂
                    </div>

                    <p className={`font-medium ${text} mt-4`}>
                      No documents submitted
                    </p>

                    <p className={`text-sm mt-1 ${mutedText}`}>
                      No documents have been submitted for this internship yet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedStudentGroup.documents.map((document) => {
                      const documentType = getDocumentType(
                        document.document_type_id
                      );

                      const isLoading = actionLoadingId === document.id;

                      return (
                        <div
                          key={document.id}
                          className={`rounded-2xl border ${border} p-4`}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center ${
                                darkMode ? "bg-slate-800" : "bg-slate-100"
                              }`}
                            >
                              📄
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4
                                      className={`font-semibold text-sm ${text}`}
                                    >
                                      {documentType?.name || "Unknown Document"}
                                    </h4>

                                    {documentType?.required && (
                                      <span
                                        className={`text-[10px] px-1.5 py-0.5 rounded ${
                                          darkMode
                                            ? "bg-blue-500/10 text-blue-400"
                                            : "bg-blue-50 text-blue-700"
                                        }`}
                                      >
                                        REQUIRED
                                      </span>
                                    )}
                                  </div>

                                  <p
                                    className={`text-xs mt-1 truncate ${mutedText}`}
                                  >
                                    {document.file_name || "Unnamed file"}
                                  </p>
                                </div>

                                <span
                                  className={`self-start inline-flex items-center px-2.5 py-1 rounded-full border text-[11px] font-medium ${getStatusClass(
                                    document.status
                                  )}`}
                                >
                                  {getStatusLabel(document.status)}
                                </span>
                              </div>

                              {/* File Info */}
                              <div
                                className={`flex flex-wrap gap-x-4 gap-y-1 text-xs mt-3 ${mutedText}`}
                              >
                                <span>Version {document.version || 1}</span>

                                {document.reviewed_at && (
                                  <span>
                                    Reviewed{" "}
                                    {new Date(
                                      document.reviewed_at
                                    ).toLocaleDateString()}
                                  </span>
                                )}
                              </div>

                              {/* Notes */}
                              {document.notes && (
                                <div
                                  className={`mt-3 rounded-xl p-3 text-xs ${
                                    darkMode
                                      ? "bg-slate-800/70 text-slate-300"
                                      : "bg-slate-50 text-slate-600"
                                  }`}
                                >
                                  <span className="font-semibold">Note:</span>{" "}
                                  {document.notes}
                                </div>
                              )}

                              {/* Actions */}
                              <div className="flex flex-wrap gap-2 mt-4">
                                <button
                                  onClick={() => handleViewDocument(document)}
                                  disabled={isLoading}
                                  className={`px-3 py-2 rounded-xl border text-xs font-medium transition ${
                                    darkMode
                                      ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                                      : "border-slate-200 text-slate-700 hover:bg-slate-50"
                                  } disabled:opacity-50`}
                                >
                                  {isLoading ? "Opening..." : "View File"}
                                </button>

                                <button
                                  onClick={() => setSelectedDocument(document)}
                                  className={`px-3 py-2 rounded-xl border text-xs font-medium transition ${
                                    darkMode
                                      ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                                      : "border-slate-200 text-slate-700 hover:bg-slate-50"
                                  }`}
                                >
                                  Details
                                </button>

                                {document.status !==
                                  STATUS.document.APPROVED && (
                                  <>
                                    <button
                                      onClick={() => handleApprove(document)}
                                      disabled={isLoading}
                                      className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition disabled:opacity-50"
                                    >
                                      Approve
                                    </button>

                                    <button
                                      onClick={() => handleRevision(document)}
                                      disabled={isLoading}
                                      className="px-3 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-medium transition disabled:opacity-50"
                                    >
                                      Request Revision
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Drawer Footer */}
              <div className={`border-t ${border} p-5`}>
                {selectedStudentGroup.allRequiredDocumentsApproved &&
                !selectedStudentGroup.deploymentFinished &&
                selectedStudentGroup.assignment ? (
                  <button
                    onClick={() => handleDeploy(selectedStudentGroup)}
                    disabled={
                      deployingAssignmentId ===
                      selectedStudentGroup.assignment.id
                    }
                    className="w-full px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-sm transition"
                  >
                    {deployingAssignmentId ===
                    selectedStudentGroup.assignment.id
                      ? "Deploying Intern..."
                      : "✓ All Required Documents Approved — Deploy Intern"}
                  </button>
                ) : selectedStudentGroup.deploymentFinished ? (
                  <div
                    className={`w-full px-4 py-3 rounded-xl text-center text-sm font-medium ${
                      darkMode
                        ? "bg-blue-500/10 text-blue-400"
                        : "bg-blue-50 text-blue-700"
                    }`}
                  >
                    Internship Status:{" "}
                    {getAssignmentStatusLabel(
                      selectedStudentGroup.assignment?.status,
                      selectedStudentGroup.assignment?.deployed_at
                    )}
                  </div>
                ) : (
                  <div
                    className={`w-full px-4 py-3 rounded-xl text-center text-sm ${
                      darkMode
                        ? "bg-slate-900 text-slate-400"
                        : "bg-slate-50 text-slate-500"
                    }`}
                  >
                    Approve all required documents to enable deployment.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          DOCUMENT DETAILS MODAL
          ===================================================== */}

      {selectedDocument && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <button
            aria-label="Close document details"
            onClick={() => setSelectedDocument(null)}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          <div
            className={`relative w-full max-w-lg rounded-2xl border ${card} shadow-2xl overflow-hidden`}
          >
            {/* Modal Header */}
            <div
              className={`px-5 py-4 border-b ${border} flex items-center justify-between`}
            >
              <div>
                <h3 className={`font-semibold ${text}`}>Document Details</h3>

                <p className={`text-xs mt-1 ${mutedText}`}>
                  Review information about this submission.
                </p>
              </div>

              <button
                onClick={() => setSelectedDocument(null)}
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  darkMode
                    ? "hover:bg-slate-800 text-slate-400"
                    : "hover:bg-slate-100 text-slate-500"
                }`}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              <div>
                <p className={`text-xs ${mutedText}`}>Document Type</p>

                <p className={`font-semibold ${text} mt-1`}>
                  {getDocumentType(selectedDocument.document_type_id)?.name ||
                    "Unknown Document"}
                </p>
              </div>

              <div>
                <p className={`text-xs ${mutedText}`}>File Name</p>

                <p className={`text-sm ${text} mt-1 break-all`}>
                  {selectedDocument.file_name || "Unnamed file"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className={`text-xs ${mutedText}`}>Version</p>

                  <p className={`text-sm font-medium ${text} mt-1`}>
                    {selectedDocument.version || 1}
                  </p>
                </div>

                <div>
                  <p className={`text-xs ${mutedText}`}>Status</p>

                  <span
                    className={`inline-flex mt-1 px-2.5 py-1 rounded-full border text-xs font-medium ${getStatusClass(
                      selectedDocument.status
                    )}`}
                  >
                    {getStatusLabel(selectedDocument.status)}
                  </span>
                </div>
              </div>

              <div>
                <p className={`text-xs ${mutedText}`}>Submitted</p>

                <p className={`text-sm ${text} mt-1`}>
                  {selectedDocument.created_at
                    ? new Date(selectedDocument.created_at).toLocaleString()
                    : "Unknown"}
                </p>
              </div>

              {selectedDocument.reviewed_at && (
                <div>
                  <p className={`text-xs ${mutedText}`}>Last Reviewed</p>

                  <p className={`text-sm ${text} mt-1`}>
                    {new Date(selectedDocument.reviewed_at).toLocaleString()}
                  </p>
                </div>
              )}

              {selectedDocument.notes && (
                <div
                  className={`rounded-xl p-4 ${
                    darkMode ? "bg-slate-800" : "bg-slate-50"
                  }`}
                >
                  <p className={`text-xs font-semibold ${mutedText} mb-1`}>
                    Registrar Note
                  </p>

                  <p className={`text-sm ${text}`}>{selectedDocument.notes}</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div
              className={`px-5 py-4 border-t ${border} flex flex-wrap justify-end gap-2`}
            >
              <button
                onClick={() => handleViewDocument(selectedDocument)}
                disabled={actionLoadingId === selectedDocument.id}
                className={`px-4 py-2.5 rounded-xl border text-sm font-medium ${
                  darkMode
                    ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                    : "border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                View File
              </button>

              {selectedDocument.status !== STATUS.document.APPROVED && (
                <>
                  <button
                    onClick={() => handleRevision(selectedDocument)}
                    disabled={actionLoadingId === selectedDocument.id}
                    className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium disabled:opacity-50"
                  >
                    Request Revision
                  </button>

                  <button
                    onClick={() => handleApprove(selectedDocument)}
                    disabled={actionLoadingId === selectedDocument.id}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium disabled:opacity-50"
                  >
                    Approve
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Documents;
