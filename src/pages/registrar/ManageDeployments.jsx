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

  application: {
    APPROVED: "approved",
    ACCEPTED: "accepted",
  },

  document: {
    APPROVED: "approved",
  },
};

const DEPLOYMENT_STATUS = {
  READY: "Ready for Deployment",
  SENT: "Sent to Company",
  ACCEPTED: "Accepted by Company",
  REJECTED: "Rejected by Company",
  COMPLETED: "Completed",
  SUSPENDED: "Suspended",
};

const PROFILE_PHOTO_BUCKET = "profile-photos";
const VERIFICATION_DOCUMENTS_BUCKET = "verification-documents";

export default function ManageDeployment() {
  const { darkMode } = useOutletContext();

  const [deploymentStudents, setDeploymentStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [expandedPhoto, setExpandedPhoto] = useState(null);

  const [deployingAssignmentId, setDeployingAssignmentId] = useState(null);

  // =========================================================
  // THEME
  // =========================================================

  const pageText = darkMode ? "text-slate-100" : "text-slate-900";

  const card = darkMode
    ? "bg-slate-900 border-slate-700"
    : "bg-white border-slate-200";

  const secondaryText = darkMode ? "text-slate-400" : "text-slate-500";

  const input = darkMode
    ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500"
    : "bg-white border-slate-200 text-slate-900 placeholder-slate-400";

  // =========================================================
  // DATA HELPERS
  // =========================================================

  const getStudentName = (studentUser) => {
    return (
      [
        studentUser?.first_name,
        studentUser?.middle_name,
        studentUser?.last_name,
      ]
        .filter(Boolean)
        .join(" ")
        .trim() || "Unknown Student"
    );
  };

  const getStudentInitials = (name) => {
    return (
      name
        ?.split(" ")
        .filter(Boolean)
        .map((part) => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase() || "ST"
    );
  };

  const getRequirementIds = (requirements) => {
    if (!Array.isArray(requirements)) {
      return [];
    }

    return requirements
      .map((requirement) =>
        typeof requirement === "string" ? requirement : requirement?.id
      )
      .filter(Boolean);
  };

const getFinalRequiredDocumentTypes = ({ documentTypes, opportunity }) => {
  const requirementIds = getRequirementIds(opportunity?.requirements);

  return requirementIds
    .map((id) =>
      (documentTypes || []).find((documentType) => documentType.id === id)
    )
    .filter(Boolean);
};
  // =========================================================
  // PROFILE PHOTO
  // =========================================================

  const getProfilePhotoUrl = async (profilePhotoUrl) => {
    if (!profilePhotoUrl) {
      return null;
    }

    if (
      profilePhotoUrl.startsWith("http://") ||
      profilePhotoUrl.startsWith("https://")
    ) {
      return profilePhotoUrl;
    }

    try {
      const { data, error } = await supabaseRegistrar.storage
        .from(PROFILE_PHOTO_BUCKET)
        .createSignedUrl(profilePhotoUrl, 60 * 60);

      if (error) {
        console.error("Create profile photo signed URL error:", error);
        return null;
      }

      return data?.signedUrl || null;
    } catch (error) {
      console.error("Profile photo URL error:", error);
      return null;
    }
  };

  // =========================================================
  // STUDENT DOCUMENT URL
  // =========================================================

  const getVerificationDocumentUrl = async (documentUrl) => {
    if (!documentUrl) {
      return null;
    }

    if (
      documentUrl.startsWith("http://") ||
      documentUrl.startsWith("https://")
    ) {
      return documentUrl;
    }

    try {
      const { data, error } = await supabaseRegistrar.storage
        .from(VERIFICATION_DOCUMENTS_BUCKET)
        .createSignedUrl(documentUrl, 60 * 60);

      if (error) {
        console.error("Create verification document signed URL error:", error);
        return null;
      }

      return data?.signedUrl || null;
    } catch (error) {
      console.error("Verification document URL error:", error);
      return null;
    }
  };

  // =========================================================
  // APPLICATION REVIEW CHECK
  // =========================================================

  const isApplicationReviewed = (application) => {
    return (
      application?.status === STATUS.application.APPROVED ||
      application?.status === STATUS.application.ACCEPTED
    );
  };

  // =========================================================
  // DOCUMENT REVIEW CHECK
  // =========================================================
  //
  // An assignment that is already completed has already passed
  // the required document/deployment workflow.
  //
  // This prevents a completed internship from incorrectly showing:
  // "Pending Review — 0/5 required"
  // =========================================================

  const areDocumentsConsideredApproved = ({ assignment, application }) => {
    return (
      isApplicationReviewed(application) ||
      assignment?.status === STATUS.assignment.COMPLETED
    );
  };

  // =========================================================
  // DEPLOYMENT STATUS
  // =========================================================

  const getDeploymentStatus = ({ assignment, application }) => {
    if (
      assignment.status === STATUS.assignment.PENDING &&
      assignment.deployed_at
    ) {
      return DEPLOYMENT_STATUS.SENT;
    }

    if (assignment.status === STATUS.assignment.ACTIVE) {
      return DEPLOYMENT_STATUS.ACCEPTED;
    }

    if (assignment.status === STATUS.assignment.TERMINATED) {
      return DEPLOYMENT_STATUS.REJECTED;
    }

    if (assignment.status === STATUS.assignment.COMPLETED) {
      return DEPLOYMENT_STATUS.COMPLETED;
    }

    if (assignment.status === STATUS.assignment.SUSPENDED) {
      return DEPLOYMENT_STATUS.SUSPENDED;
    }

    if (
      assignment.status === STATUS.assignment.PENDING &&
      !assignment.deployed_at &&
      isApplicationReviewed(application)
    ) {
      return DEPLOYMENT_STATUS.READY;
    }

    return DEPLOYMENT_STATUS.SUSPENDED;
  };

  const getCompanyDecision = (assignmentStatus) => {
    if (assignmentStatus === STATUS.assignment.ACTIVE) {
      return "Accepted";
    }

    if (assignmentStatus === STATUS.assignment.TERMINATED) {
      return "Rejected";
    }

    return null;
  };

  const getCompanyDecisionDate = (assignmentStatus, updatedAt) => {
    if (
      assignmentStatus === STATUS.assignment.ACTIVE ||
      assignmentStatus === STATUS.assignment.TERMINATED
    ) {
      return updatedAt || null;
    }

    return null;
  };

  const getStatusClasses = (status) => {
    switch (status) {
      case DEPLOYMENT_STATUS.READY:
        return darkMode
          ? "bg-amber-950 text-amber-300 border-amber-900"
          : "bg-amber-50 text-amber-700 border-amber-200";

      case DEPLOYMENT_STATUS.SENT:
        return darkMode
          ? "bg-blue-950 text-blue-300 border-blue-900"
          : "bg-blue-50 text-blue-700 border-blue-200";

      case DEPLOYMENT_STATUS.ACCEPTED:
        return darkMode
          ? "bg-emerald-950 text-emerald-300 border-emerald-900"
          : "bg-emerald-50 text-emerald-700 border-emerald-200";

      case DEPLOYMENT_STATUS.REJECTED:
        return darkMode
          ? "bg-red-950 text-red-300 border-red-900"
          : "bg-red-50 text-red-700 border-red-200";

      case DEPLOYMENT_STATUS.SUSPENDED:
        return darkMode
          ? "bg-red-950 text-red-300 border-red-900"
          : "bg-red-50 text-red-700 border-red-200";

      case DEPLOYMENT_STATUS.COMPLETED:
        return darkMode
          ? "bg-purple-950 text-purple-300 border-purple-900"
          : "bg-purple-50 text-purple-700 border-purple-200";

      default:
        return darkMode
          ? "bg-slate-800 text-slate-300 border-slate-700"
          : "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleString([], {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  // =========================================================
  // LOAD DEPLOYMENTS
  // =========================================================

  const loadDeployments = async () => {
    try {
      setLoading(true);
      setError("");

      const {
        data: { user },
        error: authError,
      } = await supabaseRegistrar.auth.getUser();

      if (authError) {
        throw authError;
      }

      if (!user) {
        throw new Error("No authenticated registrar found.");
      }

      const { data: registrar, error: registrarError } = await supabaseRegistrar
        .from("registrars")
        .select("id, school_id")
        .eq("id", user.id)
        .maybeSingle();

      if (registrarError) {
        throw registrarError;
      }

      if (!registrar) {
        throw new Error("Registrar profile not found.");
      }

      if (!registrar.school_id) {
        throw new Error("Your registrar account is not assigned to a school.");
      }

      // -------------------------------------------------------
      // STUDENTS
      // -------------------------------------------------------

      const { data: students, error: studentsError } = await supabaseRegistrar
        .from("students")
        .select(
          `
            id,
            student_id,
            program,
            year_level,
            department,
            school_id,
            profile_photo_url,
            resume_url,
            resume_name,
            cor_url,
            cor_name
          `
        )
        .eq("school_id", registrar.school_id);

      if (studentsError) {
        throw studentsError;
      }

      const schoolStudentIds = (students || [])
        .map((student) => student.id)
        .filter(Boolean);

      if (!schoolStudentIds.length) {
        setDeploymentStudents([]);
        return;
      }

      // -------------------------------------------------------
      // ASSIGNMENTS
      // -------------------------------------------------------

      const { data: assignments, error: assignmentsError } =
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
          .in("student_id", schoolStudentIds)
          .order("created_at", { ascending: false });

      if (assignmentsError) {
        throw assignmentsError;
      }

      if (!assignments?.length) {
        setDeploymentStudents([]);
        return;
      }

      // -------------------------------------------------------
      // USERS
      // -------------------------------------------------------

      const { data: users, error: usersError } = await supabaseRegistrar
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
        .in("id", schoolStudentIds);

      if (usersError) {
        throw usersError;
      }

      // -------------------------------------------------------
      // APPLICATIONS
      // -------------------------------------------------------

      const applicationIds = [
        ...new Set(
          assignments
            .map((assignment) => assignment.application_id)
            .filter(Boolean)
        ),
      ];

      let applications = [];

      if (applicationIds.length > 0) {
        const { data, error } = await supabaseRegistrar
          .from("applications")
          .select(
            `
              id,
              student_id,
              opportunity_id,
              status,
              submitted_at,
              created_at,
              notes
            `
          )
          .in("id", applicationIds);

        if (error) {
          throw error;
        }

        applications = data || [];
      }

      // -------------------------------------------------------
      // OPPORTUNITIES
      // -------------------------------------------------------

      const opportunityIds = [
        ...new Set(
          assignments
            .map((assignment) => assignment.opportunity_id)
            .filter(Boolean)
        ),
      ];

      let opportunities = [];

      if (opportunityIds.length > 0) {
        const { data, error } = await supabaseRegistrar
          .from("opportunities")
          .select(
            `
              id,
              title,
              company_id,
              requirements,
              internship_start_date,
              internship_end_date
            `
          )
          .in("id", opportunityIds);

        if (error) {
          throw error;
        }

        opportunities = data || [];
      }

      // -------------------------------------------------------
      // COMPANIES
      // -------------------------------------------------------

      const companyIds = [
        ...new Set(
          [
            ...assignments.map((assignment) => assignment.company_id),
            ...opportunities.map((opportunity) => opportunity.company_id),
          ].filter(Boolean)
        ),
      ];

      let companies = [];

      if (companyIds.length > 0) {
        const { data, error } = await supabaseRegistrar
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
          .in("id", companyIds);

        if (error) {
          throw error;
        }

        companies = data || [];
      }

      // -------------------------------------------------------
      // DOCUMENTS
      // -------------------------------------------------------

      let applicationDocuments = [];
      let assignmentDocuments = [];

      if (applicationIds.length > 0) {
        const { data, error } = await supabaseRegistrar
          .from("documents")
          .select(
            `
              id,
              application_id,
              assignment_id,
              student_id,
              document_type_id,
              file_name,
              status,
              version,
              notes,
              created_at
            `
          )
          .in("application_id", applicationIds);

        if (error) {
          throw error;
        }

        applicationDocuments = data || [];
      }

      const assignmentIds = assignments
        .map((assignment) => assignment.id)
        .filter(Boolean);

      if (assignmentIds.length > 0) {
        const { data, error } = await supabaseRegistrar
          .from("documents")
          .select(
            `
              id,
              application_id,
              assignment_id,
              student_id,
              document_type_id,
              file_name,
              status,
              version,
              notes,
              created_at
            `
          )
          .in("assignment_id", assignmentIds);

        if (error) {
          throw error;
        }

        assignmentDocuments = data || [];
      }

      // -------------------------------------------------------
      // DOCUMENT TYPES
      // -------------------------------------------------------

      const { data: documentTypes, error: documentTypesError } =
        await supabaseRegistrar.from("document_types").select(
          `
            id,
            name,
            required
          `
        );

      if (documentTypesError) {
        throw documentTypesError;
      }

      // -------------------------------------------------------
      // PROFILE PHOTO + STUDENT DOCUMENT URLS
      // -------------------------------------------------------

      const studentFileEntries = await Promise.all(
        (students || []).map(async (student) => {
          const [photoUrl, resumeUrl, corUrl] = await Promise.all([
            getProfilePhotoUrl(student.profile_photo_url),
            getVerificationDocumentUrl(student.resume_url),
            getVerificationDocumentUrl(student.cor_url),
          ]);

          return [
            student.id,
            {
              photoUrl,
              resumeUrl,
              corUrl,
            },
          ];
        })
      );

      const studentFileMap = new Map(studentFileEntries);

      // -------------------------------------------------------
      // MAPS
      // -------------------------------------------------------

      const studentMap = new Map(
        (students || []).map((student) => [student.id, student])
      );

      const userMap = new Map(
        (users || []).map((studentUser) => [studentUser.id, studentUser])
      );

      const applicationMap = new Map(
        applications.map((application) => [application.id, application])
      );

      const opportunityMap = new Map(
        opportunities.map((opportunity) => [opportunity.id, opportunity])
      );

      const companyMap = new Map(
        companies.map((company) => [company.id, company])
      );

      const documentTypeMap = new Map(
        (documentTypes || []).map((type) => [type.id, type])
      );

      // -------------------------------------------------------
      // GROUP APPLICATION DOCUMENTS
      // -------------------------------------------------------

      const documentsByApplicationId = new Map();

      applicationDocuments.forEach((document) => {
        if (!document.application_id) return;

        if (!documentsByApplicationId.has(document.application_id)) {
          documentsByApplicationId.set(document.application_id, []);
        }

        documentsByApplicationId.get(document.application_id).push(document);
      });

      // -------------------------------------------------------
      // GROUP ASSIGNMENT DOCUMENTS
      // -------------------------------------------------------

      const documentsByAssignmentId = new Map();

      assignmentDocuments.forEach((document) => {
        if (!document.assignment_id) return;

        if (!documentsByAssignmentId.has(document.assignment_id)) {
          documentsByAssignmentId.set(document.assignment_id, []);
        }

        documentsByAssignmentId.get(document.assignment_id).push(document);
      });

      // -------------------------------------------------------
      // FORMAT RECORDS
      // -------------------------------------------------------

      const formatted = assignments
        .map((assignment) => {
          const student = studentMap.get(assignment.student_id);

          if (!student) {
            return null;
          }

          const studentUser = userMap.get(assignment.student_id);
          const application = applicationMap.get(assignment.application_id);
          const opportunity = opportunityMap.get(assignment.opportunity_id);

          const resolvedCompanyId =
            assignment.company_id || opportunity?.company_id || null;

          const company = companyMap.get(resolvedCompanyId);

          const studentName = getStudentName(studentUser);

          const studentFiles = studentFileMap.get(student.id) || {};

          // ---------------------------------------------------
          // DOCUMENTS
          // ---------------------------------------------------

          const applicationDocs =
            documentsByApplicationId.get(assignment.application_id) || [];

          const assignmentDocs =
            documentsByAssignmentId.get(assignment.id) || [];

          const documentMap = new Map();

          applicationDocs.forEach((document) => {
            documentMap.set(document.document_type_id, document);
          });

          assignmentDocs.forEach((document) => {
            documentMap.set(document.document_type_id, document);
          });

          const studentDocuments = [...documentMap.values()];

          // ---------------------------------------------------
          // REQUIRED DOCUMENT COUNT
          // ---------------------------------------------------

          const requiredTypes = getFinalRequiredDocumentTypes({
            documentTypes,
            opportunity,
          });

          const requiredDocumentsCount = requiredTypes.length;

          const documentsConsideredApproved = areDocumentsConsideredApproved({
            assignment,
            application,
          });

          const actualApprovedRequiredDocumentsCount = requiredTypes.filter(
            (requiredType) => {
              const document = studentDocuments.find(
                (studentDocument) =>
                  studentDocument.document_type_id === requiredType.id
              );

              return document?.status === STATUS.document.APPROVED;
            }
          ).length;

          /*
           * If the application has already been approved OR the
           * internship assignment is already completed, the required
           * documents are treated as approved in this deployment view.
           *
           * This prevents completed internships from displaying:
           * "Pending Review — 0/5 required"
           */
          const approvedRequiredDocumentsCount = documentsConsideredApproved
            ? requiredDocumentsCount
            : actualApprovedRequiredDocumentsCount;

          const documentStatus = documentsConsideredApproved
            ? "Approved"
            : "Pending Review";

          // ---------------------------------------------------
          // DEPLOYMENT STATUS
          // ---------------------------------------------------

          const deploymentStatus = getDeploymentStatus({
            assignment,
            application,
          });

          const companyDecision = getCompanyDecision(assignment.status);

          return {
            id: assignment.id,

            studentId: student.student_id,
            studentName,
            studentInitials: getStudentInitials(studentName),
            studentEmail: studentUser?.email || "—",
            studentProgram: student.program || "—",
            studentYear: student.year_level || "—",
            studentDepartment: student.department || "—",

            // Profile photo
            studentProfilePhoto: studentFiles.photoUrl || null,

            // Student verification documents
            studentResumeUrl: studentFiles.resumeUrl || null,
            studentResumeName: student.resume_name || "Resume",

            studentCorUrl: studentFiles.corUrl || null,
            studentCorName: student.cor_name || "Certificate of Registration",

            schoolId: student.school_id || null,

            internshipId: opportunity?.id || assignment.opportunity_id || null,

            internshipTitle: opportunity?.title || "Unknown Internship",

            applicationId: application?.id || assignment.application_id || null,

            applicationStatus: application?.status || "—",

            applicationDate:
              application?.submitted_at ||
              application?.created_at ||
              assignment.created_at,

            companyId: resolvedCompanyId,

            companyName: company?.company_name || "Unknown Company",

            companyAddress: company?.company_address || "—",

            companyContact: company?.designation || "—",

            companyEmail: company?.company_email || "—",

            documentStatus,

            documents: studentDocuments.map((document) => ({
              id: document.id,

              name:
                documentTypeMap.get(document.document_type_id)?.name ||
                document.file_name ||
                "Document",

              status: document.status,

              version: document.version || 1,

              notes: document.notes,

              applicationId: document.application_id || null,

              assignmentId: document.assignment_id || null,
            })),

            requiredDocumentsCount,

            approvedRequiredDocumentsCount,

            deploymentStatus,

            assignmentStatus: assignment.status,

            deployedAt: assignment.deployed_at,

            startDate:
              assignment.start_date ||
              opportunity?.internship_start_date ||
              null,

            endDate:
              assignment.end_date || opportunity?.internship_end_date || null,

            companyDecision,

            companyDecisionAt: getCompanyDecisionDate(
              assignment.status,
              assignment.updated_at
            ),

            companyRemarks:
              assignment.status === STATUS.assignment.TERMINATED
                ? application?.notes || null
                : null,
          };
        })
        .filter(Boolean);

      setDeploymentStudents(formatted);
    } catch (error) {
      console.error("Error loading deployment records:", error);

      setError(error.message || "Failed to load deployment records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeployments();
  }, []);

  // =========================================================
  // DEPLOY STUDENT
  // =========================================================

  const handleDeploy = async (student) => {
    if (!student?.id) {
      alert("No assignment was found for this student.");
      return;
    }

    const applicationReviewed =
      student.applicationStatus === STATUS.application.APPROVED ||
      student.applicationStatus === STATUS.application.ACCEPTED;

    if (!applicationReviewed) {
      alert(
        "This student cannot be deployed because the application has not yet been approved."
      );
      return;
    }

    if (student.deploymentStatus !== DEPLOYMENT_STATUS.READY) {
      alert("This internship is not currently ready for deployment.");
      return;
    }

    if (student.deployedAt) {
      alert("This internship has already been sent to the company.");
      return;
    }

    if (!student.companyId) {
      alert(
        `Deployment cannot continue because ${student.studentName}'s assignment is not linked to a company.\n\nPlease make sure the selected internship has a valid company before deploying.`
      );
      return;
    }

    if (!student.schoolId) {
      alert(
        `Deployment cannot continue because ${student.studentName}'s student profile is not assigned to a school. Please assign the student to a school first.`
      );
      return;
    }

    let school = null;

    try {
      const { data, error: schoolError } = await supabaseRegistrar
        .from("schools")
        .select(
          `
            id,
            name,
            code,
            logo_url
          `
        )
        .eq("id", student.schoolId)
        .maybeSingle();

      if (schoolError) {
        throw schoolError;
      }

      school = data;
    } catch (schoolError) {
      console.error("Error checking school information:", schoolError);

      alert(
        schoolError.message ||
          "Unable to verify the student's school information. Deployment was cancelled."
      );

      return;
    }

    if (!school?.logo_url) {
      const schoolName = school?.name || "the student's school";

      alert(
        `Deployment cannot continue because ${schoolName} does not have an official school logo uploaded.\n\nPlease upload the school logo in Settings → School Information before deploying students.`
      );

      return;
    }

    const confirmed = window.confirm(
      `Deploy ${student.studentName} to ${
        student.companyName || "the assigned company"
      }?\n\nApplication: ${student.applicationStatus}\nDocuments: Approved (${
        student.approvedRequiredDocumentsCount
      }/${student.requiredDocumentsCount})\nSchool logo: Verified\n\nThe student will be sent to the company for review after deployment.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeployingAssignmentId(student.id);

      const { data: updatedAssignment, error: deployError } =
        await supabaseRegistrar.rpc("deploy_assignment_with_documents", {
          p_assignment_id: student.id,
          p_company_id: student.companyId,
        });

      if (deployError) {
        throw deployError;
      }

      if (!updatedAssignment) {
        throw new Error(
          "The assignment was not deployed. It may have already been processed."
        );
      }

      if (updatedAssignment.company_id !== student.companyId) {
        throw new Error(
          "Deployment completed, but the assignment was not linked to the expected company."
        );
      }

      let linkedDocumentCount = 0;

      if (updatedAssignment.application_id) {
        const { count, error: documentCountError } = await supabaseRegistrar
          .from("documents")
          .select("id", {
            count: "exact",
            head: true,
          })
          .eq("application_id", updatedAssignment.application_id)
          .eq("assignment_id", updatedAssignment.id);

        if (documentCountError) {
          console.error(
            "Unable to verify linked documents:",
            documentCountError
          );
        } else {
          linkedDocumentCount = count || 0;
        }
      }

      console.log("REGISTRAR DEPLOYED ASSIGNMENT:", updatedAssignment);
      console.log("LINKED APPLICATION DOCUMENTS:", linkedDocumentCount);

      setDeploymentStudents((current) =>
        current.map((item) =>
          item.id === updatedAssignment.id
            ? {
                ...item,
                companyId: updatedAssignment.company_id,
                deploymentStatus: DEPLOYMENT_STATUS.SENT,
                assignmentStatus: updatedAssignment.status,
                deployedAt: updatedAssignment.deployed_at,
              }
            : item
        )
      );

      setSelectedStudent((current) =>
        current?.id === updatedAssignment.id
          ? {
              ...current,
              companyId: updatedAssignment.company_id,
              deploymentStatus: DEPLOYMENT_STATUS.SENT,
              assignmentStatus: updatedAssignment.status,
              deployedAt: updatedAssignment.deployed_at,
            }
          : current
      );

      alert(
        `${student.studentName} has been successfully sent to ${
          student.companyName || "the company"
        } for review.\n\n${linkedDocumentCount} application document${
          linkedDocumentCount === 1 ? "" : "s"
        } linked to the deployment.`
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

  // =========================================================
  // FILTERED DATA
  // =========================================================

  const filteredStudents = useMemo(() => {
    const search = searchTerm.toLowerCase().trim();

    return deploymentStudents.filter((student) => {
      const matchesSearch =
        !search ||
        student.studentName.toLowerCase().includes(search) ||
        student.studentId.toLowerCase().includes(search) ||
        student.companyName.toLowerCase().includes(search) ||
        student.internshipTitle.toLowerCase().includes(search);

      const matchesStatus =
        statusFilter === "All" || student.deploymentStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [deploymentStudents, searchTerm, statusFilter]);

  // =========================================================
  // COUNTS
  // =========================================================

  const readyCount = useMemo(
    () =>
      deploymentStudents.filter(
        (student) => student.deploymentStatus === DEPLOYMENT_STATUS.READY
      ).length,
    [deploymentStudents]
  );

  const sentCount = useMemo(
    () =>
      deploymentStudents.filter(
        (student) => student.deploymentStatus === DEPLOYMENT_STATUS.SENT
      ).length,
    [deploymentStudents]
  );

  const acceptedCount = useMemo(
    () =>
      deploymentStudents.filter(
        (student) => student.deploymentStatus === DEPLOYMENT_STATUS.ACCEPTED
      ).length,
    [deploymentStudents]
  );

  const rejectedCount = useMemo(
    () =>
      deploymentStudents.filter(
        (student) => student.deploymentStatus === DEPLOYMENT_STATUS.REJECTED
      ).length,
    [deploymentStudents]
  );

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className={`min-h-full p-5 md:p-6 lg:p-8 ${pageText}`}>
        <div className="flex items-center justify-center min-h-[500px]">
          <div className="text-center">
            <div
              className={`w-10 h-10 border-4 rounded-full animate-spin mx-auto mb-4 ${
                darkMode
                  ? "border-slate-700 border-t-blue-500"
                  : "border-slate-200 border-t-blue-600"
              }`}
            />

            <p className={secondaryText}>Loading deployment records...</p>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // RETURN
  // =========================================================

  return (
    <div className={`p-5 md:p-6 lg:p-8 max-w-[1400px] mx-auto ${pageText}`}>
      {/* HEADER */}

      <div className="mb-7">
        <p className="text-xs uppercase tracking-widest font-bold text-slate-400">
          Registrar Portal
        </p>

        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mt-1">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">
              Manage Deployment
            </h1>

            <p className={`text-sm mt-2 max-w-3xl ${secondaryText}`}>
              Confirmed placements awaiting or undergoing company deployment.
            </p>
          </div>

          <button
            type="button"
            onClick={loadDeployments}
            className={`px-4 py-2.5 rounded-xl border text-sm font-semibold transition ${
              darkMode
                ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                : "border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* ERROR */}

      {error && (
        <div
          className={`mb-6 rounded-xl border p-4 ${
            darkMode
              ? "bg-red-950/30 border-red-900 text-red-300"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          <p className="text-sm font-semibold">
            Unable to load deployment records
          </p>

          <p className="text-xs mt-1">{error}</p>
        </div>
      )}

      {/* SUMMARY */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <SummaryCard
          title="Ready for Deployment"
          count={readyCount}
          description="Awaiting registrar deployment"
          icon="📤"
          darkMode={darkMode}
          iconClass={
            darkMode
              ? "bg-amber-950 text-amber-300"
              : "bg-amber-50 text-amber-600"
          }
        />

        <SummaryCard
          title="Sent to Company"
          count={sentCount}
          description="Awaiting company decision"
          icon="📨"
          darkMode={darkMode}
          iconClass={
            darkMode ? "bg-blue-950 text-blue-300" : "bg-blue-50 text-blue-600"
          }
        />

        <SummaryCard
          title="Accepted"
          count={acceptedCount}
          description="Accepted by companies"
          icon="✓"
          darkMode={darkMode}
          iconClass={
            darkMode
              ? "bg-emerald-950 text-emerald-300"
              : "bg-emerald-50 text-emerald-600"
          }
        />

        <SummaryCard
          title="Company Rejected"
          count={rejectedCount}
          description="Students needing new application"
          icon="⚠️"
          darkMode={darkMode}
          iconClass={
            darkMode ? "bg-red-950 text-red-300" : "bg-red-50 text-red-600"
          }
        />
      </div>

      {/* SEARCH / FILTER */}

      <section className={`border rounded-2xl shadow-sm mb-6 ${card}`}>
        <div className="p-4 md:p-5">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm">
                🔍
              </span>

              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search student, ID, company, or internship..."
                className={`w-full pl-9 pr-4 py-3 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-blue-500/30 ${input}`}
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className={`md:w-60 px-4 py-3 rounded-xl border text-sm outline-none ${input}`}
            >
              <option value="All">All Statuses</option>

              <option value={DEPLOYMENT_STATUS.READY}>
                Ready for Deployment
              </option>

              <option value={DEPLOYMENT_STATUS.SENT}>Sent to Company</option>

              <option value={DEPLOYMENT_STATUS.ACCEPTED}>
                Accepted by Company
              </option>

              <option value={DEPLOYMENT_STATUS.REJECTED}>
                Rejected by Company
              </option>

              <option value={DEPLOYMENT_STATUS.COMPLETED}>Completed</option>

              <option value={DEPLOYMENT_STATUS.SUSPENDED}>Suspended</option>
            </select>
          </div>
        </div>
      </section>

      {/* TABLE */}

      <section
        className={`border rounded-2xl overflow-hidden shadow-sm ${card}`}
      >
        <div
          className={`px-5 py-4 border-b ${
            darkMode ? "border-slate-700" : "border-slate-200"
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-black">Deployment Records</h2>

              <p className={`text-xs mt-1 ${secondaryText}`}>
                Confirmed placements awaiting or undergoing company deployment.
              </p>
            </div>

            <span
              className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                darkMode
                  ? "bg-slate-800 text-slate-300"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {filteredStudents.length} Students
            </span>
          </div>
        </div>

        {filteredStudents.length === 0 ? (
          <div className="p-12 text-center">
            <div
              className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center text-3xl mb-4 ${
                darkMode ? "bg-slate-800" : "bg-slate-100"
              }`}
            >
              📭
            </div>

            <h3 className="font-bold text-sm">No deployment records found</h3>

            <p className={`text-xs mt-1 ${secondaryText}`}>
              No confirmed placements match your current search or status
              filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px]">
              <thead className={darkMode ? "bg-slate-800/70" : "bg-slate-50"}>
                <tr>
                  <TableHeader>Student</TableHeader>
                  <TableHeader>Internship</TableHeader>
                  <TableHeader>Company</TableHeader>
                  <TableHeader>Documents</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader align="right">Action</TableHeader>
                </tr>
              </thead>

              <tbody
                className={`divide-y ${
                  darkMode ? "divide-slate-700" : "divide-slate-200"
                }`}
              >
                {filteredStudents.map((student) => (
                  <tr
                    key={student.id}
                    className={
                      darkMode ? "hover:bg-slate-800/60" : "hover:bg-slate-50"
                    }
                  >
                    {/* STUDENT */}

                    <td className="px-5 py-4">
                      <div className="relative flex items-start min-h-[48px]">
                        <div className="min-w-0 pr-14">
                          <p className="text-sm font-bold truncate">
                            {student.studentName}
                          </p>

                          <p className={`text-[10px] mt-0.5 ${secondaryText}`}>
                            {student.studentId}
                          </p>

                          <p className={`text-[10px] ${secondaryText}`}>
                            {student.studentProgram}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            if (student.studentProfilePhoto) {
                              setExpandedPhoto({
                                url: student.studentProfilePhoto,
                                name: student.studentName,
                              });
                            }
                          }}
                          disabled={!student.studentProfilePhoto}
                          className={`absolute top-0 right-0 w-11 h-11 rounded-xl overflow-hidden flex items-center justify-center font-bold text-xs transition ${
                            student.studentProfilePhoto
                              ? "cursor-pointer hover:ring-2 hover:ring-blue-500 hover:scale-105"
                              : "cursor-default"
                          } ${
                            darkMode
                              ? "bg-slate-800 text-slate-300"
                              : "bg-slate-100 text-slate-600"
                          }`}
                          title={
                            student.studentProfilePhoto
                              ? "Click to expand profile photo"
                              : "No profile photo"
                          }
                        >
                          {student.studentProfilePhoto ? (
                            <img
                              src={student.studentProfilePhoto}
                              alt={student.studentName}
                              className="w-full h-full object-cover"
                              onError={(event) => {
                                event.currentTarget.style.display = "none";
                                event.currentTarget.parentElement.innerHTML =
                                  student.studentInitials;
                              }}
                            />
                          ) : (
                            student.studentInitials
                          )}
                        </button>
                      </div>
                    </td>

                    {/* INTERNSHIP */}

                    <td className="px-5 py-4">
                      <p className="text-xs font-bold">
                        {student.internshipTitle}
                      </p>

                      <p className={`text-[10px] mt-1 ${secondaryText}`}>
                        Application: {student.applicationId || "—"}
                      </p>

                      {student.startDate && (
                        <p className={`text-[10px] mt-1 ${secondaryText}`}>
                          {formatDate(student.startDate)} —{" "}
                          {formatDate(student.endDate)}
                        </p>
                      )}
                    </td>

                    {/* COMPANY */}

                    <td className="px-5 py-4">
                      <p className="text-xs font-bold">{student.companyName}</p>

                      <p className={`text-[10px] mt-1 ${secondaryText}`}>
                        {student.companyAddress}
                      </p>
                    </td>

                    {/* DOCUMENTS */}

                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1">
                        <span
                          className={`w-fit px-2 py-1 rounded-md text-[10px] font-bold ${
                            student.documentStatus === "Approved"
                              ? darkMode
                                ? "bg-emerald-950 text-emerald-300"
                                : "bg-emerald-50 text-emerald-700"
                              : darkMode
                              ? "bg-amber-950 text-amber-300"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {student.documentStatus === "Approved"
                            ? "✓ Documents Approved"
                            : "Pending Review"}
                        </span>

                        <span className={`text-[10px] ${secondaryText}`}>
                          {student.approvedRequiredDocumentsCount}/
                          {student.requiredDocumentsCount} required
                        </span>
                      </div>
                    </td>

                    {/* STATUS */}

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-lg border text-[10px] font-bold whitespace-nowrap ${getStatusClasses(
                          student.deploymentStatus
                        )}`}
                      >
                        {student.deploymentStatus}
                      </span>

                      {student.deployedAt && (
                        <p className={`text-[10px] mt-1 ${secondaryText}`}>
                          Sent: {formatDate(student.deployedAt)}
                        </p>
                      )}
                    </td>

                    {/* ACTION */}

                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setSelectedStudent(student)}
                        className={`px-3 py-2 rounded-lg border text-xs font-semibold transition ${
                          darkMode
                            ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                            : "border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        View
                      </button>

                      {student.deploymentStatus === DEPLOYMENT_STATUS.READY && (
                        <button
                          type="button"
                          onClick={() => handleDeploy(student)}
                          disabled={deployingAssignmentId === student.id}
                          className="ml-2 px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                          {deployingAssignmentId === student.id
                            ? "Deploying..."
                            : "Deploy"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* =====================================================
          DETAILS MODAL
          ===================================================== */}

      {selectedStudent && (
        <div
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedStudent(null)}
        >
          <div
            className={`w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border shadow-2xl ${card}`}
            onClick={(event) => event.stopPropagation()}
          >
            {/* MODAL HEADER */}

            <div
              className={`px-6 py-5 border-b flex items-start justify-between ${
                darkMode ? "border-slate-700" : "border-slate-200"
              }`}
            >
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wider font-bold text-slate-400">
                  Deployment Record
                </p>

                <h2 className="text-xl font-black mt-1 truncate pr-4">
                  {selectedStudent.studentName}
                </h2>

                <p className={`text-xs mt-1 ${secondaryText}`}>
                  {selectedStudent.studentId}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (selectedStudent.studentProfilePhoto) {
                    setExpandedPhoto({
                      url: selectedStudent.studentProfilePhoto,
                      name: selectedStudent.studentName,
                    });
                  }
                }}
                disabled={!selectedStudent.studentProfilePhoto}
                className={`w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 flex items-center justify-center font-black text-sm transition ${
                  selectedStudent.studentProfilePhoto
                    ? "cursor-pointer hover:ring-2 hover:ring-blue-500 hover:scale-105"
                    : "cursor-default"
                } ${
                  darkMode
                    ? "bg-slate-800 text-slate-300"
                    : "bg-slate-100 text-slate-600"
                }`}
                title={
                  selectedStudent.studentProfilePhoto
                    ? "Click to expand profile photo"
                    : "No profile photo"
                }
              >
                {selectedStudent.studentProfilePhoto ? (
                  <img
                    src={selectedStudent.studentProfilePhoto}
                    alt={selectedStudent.studentName}
                    className="w-full h-full object-cover"
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                      event.currentTarget.parentElement.innerHTML =
                        selectedStudent.studentInitials;
                    }}
                  />
                ) : (
                  selectedStudent.studentInitials
                )}
              </button>

              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className={`w-9 h-9 rounded-lg text-xl flex-shrink-0 ml-3 ${
                  darkMode
                    ? "hover:bg-slate-800 text-slate-400"
                    : "hover:bg-slate-100 text-slate-500"
                }`}
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* STUDENT INFORMATION */}

              <div>
                <h3 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-3">
                  Student Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <InfoItem
                    label="Full Name"
                    value={selectedStudent.studentName}
                    darkMode={darkMode}
                  />

                  <InfoItem
                    label="Student ID"
                    value={selectedStudent.studentId}
                    darkMode={darkMode}
                  />

                  <InfoItem
                    label="Email"
                    value={selectedStudent.studentEmail}
                    darkMode={darkMode}
                  />

                  <InfoItem
                    label="Program"
                    value={selectedStudent.studentProgram}
                    darkMode={darkMode}
                  />

                  <InfoItem
                    label="Year Level"
                    value={selectedStudent.studentYear}
                    darkMode={darkMode}
                  />

                  <InfoItem
                    label="Department"
                    value={selectedStudent.studentDepartment}
                    darkMode={darkMode}
                  />
                </div>
              </div>

              {/* STUDENT DOCUMENTS */}

              <div>
                <h3 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-3">
                  Student Documents
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <StudentDocumentCard
                    label="Certificate of Registration"
                    shortLabel="COR"
                    fileName={selectedStudent.studentCorName}
                    url={selectedStudent.studentCorUrl}
                    icon="📄"
                    darkMode={darkMode}
                    secondaryText={secondaryText}
                  />

                  <StudentDocumentCard
                    label="Resume"
                    shortLabel="Resume"
                    fileName={selectedStudent.studentResumeName}
                    url={selectedStudent.studentResumeUrl}
                    icon="📄"
                    darkMode={darkMode}
                    secondaryText={secondaryText}
                  />
                </div>
              </div>

              {/* INTERNSHIP */}

              <div>
                <h3 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-3">
                  Internship
                </h3>

                <div
                  className={`p-4 rounded-xl border ${
                    darkMode
                      ? "bg-slate-800 border-slate-700"
                      : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <p className="text-sm font-black">
                    {selectedStudent.internshipTitle}
                  </p>

                  <p className={`text-xs mt-1 ${secondaryText}`}>
                    Application ID: {selectedStudent.applicationId || "—"}
                  </p>

                  <p className={`text-xs mt-1 ${secondaryText}`}>
                    Application Status: {selectedStudent.applicationStatus}
                  </p>

                  <p className={`text-xs mt-1 ${secondaryText}`}>
                    Application Date:{" "}
                    {formatDate(selectedStudent.applicationDate)}
                  </p>

                  {selectedStudent.startDate && (
                    <p className={`text-xs mt-1 ${secondaryText}`}>
                      Internship Period: {formatDate(selectedStudent.startDate)}{" "}
                      — {formatDate(selectedStudent.endDate)}
                    </p>
                  )}
                </div>
              </div>

              {/* COMPANY */}

              <div>
                <h3 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-3">
                  Selected Company
                </h3>

                <div
                  className={`p-4 rounded-xl border ${
                    darkMode
                      ? "bg-blue-950/30 border-blue-900"
                      : "bg-blue-50 border-blue-200"
                  }`}
                >
                  <p className="text-sm font-black">
                    {selectedStudent.companyName}
                  </p>

                  <p className={`text-xs mt-1 ${secondaryText}`}>
                    {selectedStudent.companyAddress}
                  </p>

                  <p className={`text-xs mt-1 ${secondaryText}`}>
                    {selectedStudent.companyEmail}
                  </p>
                </div>
              </div>

              {/* DOCUMENTS */}

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs uppercase tracking-wider font-bold text-slate-400">
                    Internship Documents
                  </h3>

                  <span
                    className={`text-[10px] font-bold ${
                      selectedStudent.documentStatus === "Approved"
                        ? "text-emerald-500"
                        : "text-amber-500"
                    }`}
                  >
                    {selectedStudent.approvedRequiredDocumentsCount}/
                    {selectedStudent.requiredDocumentsCount} Required
                  </span>
                </div>

                {selectedStudent.documentStatus === "Approved" && (
                  <div
                    className={`mb-3 p-3 rounded-xl border ${
                      darkMode
                        ? "bg-emerald-950/30 border-emerald-900"
                        : "bg-emerald-50 border-emerald-200"
                    }`}
                  >
                    <p
                      className={`text-xs font-bold ${
                        darkMode ? "text-emerald-300" : "text-emerald-700"
                      }`}
                    >
                      ✓ Documents Approved
                    </p>

                    <p className={`text-[10px] mt-1 ${secondaryText}`}>
                      The application was approved by the Registrar. Required
                      internship documents were already reviewed during
                      application processing.
                    </p>
                  </div>
                )}

                <div
                  className={`border rounded-xl overflow-hidden ${
                    darkMode ? "border-slate-700" : "border-slate-200"
                  }`}
                >
                  {selectedStudent.documents.length === 0 ? (
                    <div className="p-5 text-center">
                      <p className={`text-xs ${secondaryText}`}>
                        Documents were reviewed as part of application approval.
                      </p>
                    </div>
                  ) : (
                    selectedStudent.documents.map((document, index) => (
                      <div
                        key={document.id || `${document.name}-${index}`}
                        className={`flex items-center justify-between px-4 py-3 ${
                          index !== selectedStudent.documents.length - 1
                            ? darkMode
                              ? "border-b border-slate-700"
                              : "border-b border-slate-200"
                            : ""
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-sm">📄</span>

                          <div>
                            <span className="text-xs font-semibold">
                              {document.name}
                            </span>

                            {document.version && (
                              <p className={`text-[10px] ${secondaryText}`}>
                                Version {document.version}
                              </p>
                            )}
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-bold ${
                            selectedStudent.documentStatus === "Approved"
                              ? darkMode
                                ? "text-emerald-400"
                                : "text-emerald-600"
                              : document.status === STATUS.document.APPROVED
                              ? darkMode
                                ? "text-emerald-400"
                                : "text-emerald-600"
                              : darkMode
                              ? "text-amber-400"
                              : "text-amber-600"
                          }`}
                        >
                          {selectedStudent.documentStatus === "Approved"
                            ? "✓ Approved"
                            : document.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* DEPLOYMENT STATUS */}

              <div>
                <h3 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-3">
                  Deployment Status
                </h3>

                <span
                  className={`inline-flex px-3 py-2 rounded-xl border text-xs font-bold ${getStatusClasses(
                    selectedStudent.deploymentStatus
                  )}`}
                >
                  {selectedStudent.deploymentStatus}
                </span>

                {selectedStudent.deployedAt && (
                  <p className={`text-xs mt-2 ${secondaryText}`}>
                    Sent to company: {formatDate(selectedStudent.deployedAt)}
                  </p>
                )}

                {selectedStudent.companyDecision && (
                  <div
                    className={`mt-4 p-4 rounded-xl border ${
                      selectedStudent.companyDecision === "Accepted"
                        ? darkMode
                          ? "bg-emerald-950/30 border-emerald-900"
                          : "bg-emerald-50 border-emerald-200"
                        : darkMode
                        ? "bg-red-950/30 border-red-900"
                        : "bg-red-50 border-red-200"
                    }`}
                  >
                    <p
                      className={`text-xs font-bold ${
                        selectedStudent.companyDecision === "Accepted"
                          ? "text-emerald-500"
                          : "text-red-500"
                      }`}
                    >
                      Company Decision: {selectedStudent.companyDecision}
                    </p>

                    {selectedStudent.companyDecisionAt && (
                      <p className={`text-[10px] mt-2 ${secondaryText}`}>
                        Decision date:{" "}
                        {formatDate(selectedStudent.companyDecisionAt)}
                      </p>
                    )}

                    {selectedStudent.companyRemarks && (
                      <p className={`text-xs mt-2 ${secondaryText}`}>
                        {selectedStudent.companyRemarks}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* FOOTER */}

              <div
                className={`pt-4 border-t flex justify-end gap-2 ${
                  darkMode ? "border-slate-700" : "border-slate-200"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setSelectedStudent(null)}
                  className={`px-5 py-2.5 rounded-xl border text-xs font-bold ${
                    darkMode
                      ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                      : "border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  Close
                </button>

                {selectedStudent.deploymentStatus ===
                  DEPLOYMENT_STATUS.READY && (
                  <button
                    type="button"
                    onClick={() => handleDeploy(selectedStudent)}
                    disabled={deployingAssignmentId === selectedStudent.id}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold transition"
                  >
                    {deployingAssignmentId === selectedStudent.id
                      ? "Deploying..."
                      : "✓ Deploy Student"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          EXPANDED PROFILE PHOTO
          ===================================================== */}

      {expandedPhoto && (
        <div
          className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-5"
          onClick={() => setExpandedPhoto(null)}
        >
          <div
            className="relative max-w-[90vw] max-h-[90vh] flex flex-col items-center"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setExpandedPhoto(null)}
              className="absolute -top-3 -right-3 z-10 w-10 h-10 rounded-full bg-white text-slate-800 shadow-lg flex items-center justify-center text-2xl font-bold hover:bg-slate-100 transition"
            >
              ×
            </button>

            <img
              src={expandedPhoto.url}
              alt={expandedPhoto.name}
              className="max-w-[90vw] max-h-[80vh] object-contain rounded-2xl shadow-2xl border border-white/20"
            />

            <div className="mt-4 px-4 py-2 rounded-xl bg-black/60 text-white text-sm font-semibold">
              {expandedPhoto.name}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =========================================================
// TABLE HEADER
// =========================================================

function TableHeader({ children, align = "left" }) {
  return (
    <th
      className={`px-5 py-3 text-${align} text-[10px] uppercase tracking-wider font-bold text-slate-400`}
    >
      {children}
    </th>
  );
}

// =========================================================
// SUMMARY CARD
// =========================================================

function SummaryCard({ title, count, description, icon, darkMode, iconClass }) {
  return (
    <div
      className={`border rounded-2xl p-5 shadow-sm ${
        darkMode ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p
            className={`text-xs font-semibold ${
              darkMode ? "text-slate-400" : "text-slate-500"
            }`}
          >
            {title}
          </p>

          <p className="text-3xl font-black mt-1">{count}</p>

          <p
            className={`text-xs mt-1 ${
              darkMode ? "text-slate-400" : "text-slate-500"
            }`}
          >
            {description}
          </p>
        </div>

        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${iconClass}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

// =========================================================
// INFO ITEM
// =========================================================

function InfoItem({ label, value, darkMode }) {
  return (
    <div
      className={`p-3 rounded-xl border ${
        darkMode
          ? "bg-slate-800 border-slate-700"
          : "bg-slate-50 border-slate-200"
      }`}
    >
      <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
        {label}
      </p>

      <p className="text-xs font-semibold mt-1 break-words">{value || "—"}</p>
    </div>
  );
}

// =========================================================
// STUDENT DOCUMENT CARD
// =========================================================

function StudentDocumentCard({
  label,
  shortLabel,
  fileName,
  url,
  icon,
  darkMode,
  secondaryText,
}) {
  return (
    <div
      className={`p-4 rounded-xl border ${
        darkMode
          ? "bg-slate-800 border-slate-700"
          : "bg-slate-50 border-slate-200"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            darkMode
              ? "bg-slate-700 text-slate-200"
              : "bg-white text-slate-600 border border-slate-200"
          }`}
        >
          <span>{icon}</span>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold">{label}</p>

          <p className={`text-[10px] mt-1 truncate ${secondaryText}`}>
            {url ? fileName || shortLabel : "Not uploaded"}
          </p>

          {url ? (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex mt-2 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold transition"
            >
              View {shortLabel}
            </a>
          ) : (
            <span
              className={`inline-flex mt-2 px-3 py-1.5 rounded-lg text-[10px] font-bold ${
                darkMode
                  ? "bg-slate-700 text-slate-400"
                  : "bg-slate-200 text-slate-500"
              }`}
            >
              Not Available
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

