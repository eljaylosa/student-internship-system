import React, { createContext, useContext, useMemo, useState } from "react";

export const STATUS = {
  user: {
    ACTIVE: "Active",
    INACTIVE: "Inactive",
    PENDING: "Pending",
  },

  company: {
    PENDING: "Pending",
    VERIFIED: "Verified",
    ACTIVE: "Active",
    INACTIVE: "Inactive",
  },

  opportunity: {
    DRAFT: "Draft",
    ACTIVE: "Active",
    CLOSED: "Closed",
  },

  application: {
    DRAFT: "Draft",
    SUBMITTED: "Submitted",
    UNDER_REVIEW: "Under Review",
    INFO_REQUESTED: "Information Requested",
    APPROVED: "Approved",
    REJECTED: "Rejected",
    WITHDRAWN: "Withdrawn",
  },

  assignment: {
    PENDING: "Pending",
    ACTIVE: "Active",
    COMPLETED: "Completed",
    SUSPENDED: "Suspended",
    TERMINATED: "Terminated",
  },

  document: {
    NOT_SUBMITTED: "Not Submitted",
    SUBMITTED: "Submitted",
    PENDING_REVIEW: "Pending Review",
    APPROVED: "Approved",
    NEEDS_REVISION: "Needs Revision",
  },

  evaluation: {
    DRAFT: "Draft",
    SUBMITTED: "Submitted",
    RETURNED: "Returned",
    FINALIZED: "Finalized",
  },
};

const now = () => new Date().toISOString();

const clone = (value) => JSON.parse(JSON.stringify(value));

export const initialState = {
  currentUser: null,

  /* =========================================================
     USERS
  ========================================================= */

  users: [
    {
      id: "USR-001",
      role: "student",
      email: "student@gmail.com",
      password: "password",
      status: STATUS.user.ACTIVE,
      profileId: "STU-001",
    },

    {
      id: "USR-002",
      role: "faculty",
      email: "faculty@gmail.com",
      password: "password",
      status: STATUS.user.ACTIVE,
      profileId: "FAC-001",
    },

    {
      id: "USR-003",
      role: "company",
      email: "company@gmail.com",
      password: "password",
      status: STATUS.user.ACTIVE,
      profileId: "SUP-001",
    },

    {
      id: "USR-004",
      role: "admin",
      email: "admin@sims.local",
      password: "password",
      status: STATUS.user.ACTIVE,
      profileId: "ADM-001",
    },
  ],

  /* =========================================================
     STUDENTS
  ========================================================= */

  students: [
    {
      id: "STU-001",
      userId: "USR-001",
      fullName: "John Doe",
      email: "student@gmail.com",
      studentId: "STU-001",
      program: "BS Information Technology",
      yearLevel: "2nd Year",
      department: "College of Information and Communications Technology",
      facultyId: "FAC-001",
      phone: "+63 912 345 6789",
      address: "Limay, Bataan",
      gwa: "1.75",
    },
  ],

  /* =========================================================
     FACULTY
  ========================================================= */

  faculty: [
    {
      id: "FAC-001",
      userId: "USR-002",
      fullName: "Maria Santos",
      email: "faculty@gmail.com",
      facultyId: "FAC-001",
      department: "College of Information and Communications Technology",
      position: "Faculty Adviser",
      phone: "+63 917 123 4567",
      address: "Balanga, Bataan",
      specialization: "Information Technology",
      employeeId: "FAC-2026-001",
    },
  ],

  /* =========================================================
     COMPANIES
  ========================================================= */

  companies: [
    {
      id: "COM-001",
      name: "ABC Technologies",
      industry: "Information Technology",
      status: STATUS.company.VERIFIED,
      address: "Balanga, Bataan",
      email: "hr@abctech.com",
      supervisorIds: ["SUP-001"],
    },
  ],

  /* =========================================================
     COMPANY SUPERVISORS
  ========================================================= */

  supervisors: [
    {
      id: "SUP-001",
      userId: "USR-003",
      companyId: "COM-001",
      fullName: "Mark Cruz",
      email: "company@gmail.com",
      position: "Company Supervisor",
    },
  ],

  /* =========================================================
     INTERNSHIP OPPORTUNITIES
  ========================================================= */

  opportunities: [
    {
      id: "OPP-001",
      companyId: "COM-001",
      supervisorId: "SUP-001",
      title: "Web Developer Intern",
      description:
        "Build and improve internal web experiences with the engineering team.",
      location: "Balanga, Bataan",
      positionType: "On-site",
      availability: "June - August 2026",
      requirements: ["HTML/CSS", "JavaScript", "Git"],
      status: STATUS.opportunity.ACTIVE,
      openings: 3,
    },
  ],

  /* =========================================================
     APPLICATIONS
  ========================================================= */

  applications: [
    {
      id: "APP-001",
      studentId: "STU-001",
      opportunityId: "OPP-001",
      submittedAt: "2026-05-01T09:00:00.000Z",
      status: STATUS.application.SUBMITTED,
      coverLetter:
        "I am excited to contribute to the team and learn through this placement.",
      reviewerId: "FAC-001",
      notes: "Awaiting faculty review.",
    },
  ],

  /* =========================================================
     INTERNSHIP ASSIGNMENTS
  ========================================================= */

  assignments: [],

  /* =========================================================
     DOCUMENT TYPES
  ========================================================= */

  documentTypes: [
    {
      id: "DT-001",
      name: "Resume/CV",
      required: true,
    },

    {
      id: "DT-002",
      name: "Acceptance Letter",
      required: true,
    },

    {
      id: "DT-003",
      name: "Internship Agreement",
      required: true,
    },

    {
      id: "DT-004",
      name: "Medical Certificate",
      required: true,
    },

    {
      id: "DT-005",
      name: "Parent Consent",
      required: true,
    },

    {
      id: "DT-006",
      name: "Insurance Form",
      required: false,
    },
  ],

  /* =========================================================
     DOCUMENT TEMPLATES
     
     ADMIN MANAGED TEMPLATE LIBRARY
  ========================================================= */

  documentTemplates: [
    {
      id: "TPL-001",
      name: "Internship Application Form",
      description: "Official internship application form.",
      fileName: "internship-application-form.pdf",
    },

    {
      id: "TPL-002",
      name: "Internship Agreement",
      description: "Internship agreement template.",
      fileName: "internship-agreement.pdf",
    },

    {
      id: "TPL-003",
      name: "Evaluation Form",
      description: "Student internship evaluation form.",
      fileName: "evaluation-form.pdf",
    },

    {
      id: "TPL-004",
      name: "Student Endorsement",
      description: "Student endorsement document.",
      fileName: "student-endorsement.pdf",
    },

    {
      id: "TPL-005",
      name: "Company Evaluation",
      description: "Company evaluation template.",
      fileName: "company-evaluation.pdf",
    },

    {
      id: "TPL-006",
      name: "Completion Certificate",
      description: "Internship completion certificate.",
      fileName: "completion-certificate.pdf",
    },
  ],

  /* =========================================================
     INFORMATION MANAGEMENT
     
     ADMIN MANAGED INFORMATION
     DISPLAYED IN STUDENT PORTAL
  ========================================================= */

  informationItems: [
    {
      id: "INFO-001",
      title: "Internship Guidelines",
      category: "Guidelines",
      description:
        "Important guidelines and requirements that students should follow during their internship.",
      content:
        "Review the internship guidelines before beginning your internship. This includes requirements, responsibilities, and important procedures.",
      status: "Published",
      createdAt: "2026-08-01T09:00:00.000Z",
      updatedAt: "2026-08-01T09:00:00.000Z",
    },

    {
      id: "INFO-002",
      title: "Internship Requirements",
      category: "Requirements",
      description:
        "Complete list of requirements that must be submitted before starting your internship.",
      content:
        "Students are required to complete and submit all necessary documents before their internship can officially begin.",
      status: "Published",
      createdAt: "2026-08-01T09:00:00.000Z",
      updatedAt: "2026-08-01T09:00:00.000Z",
    },

    {
      id: "INFO-003",
      title: "Application Process",
      category: "Application",
      description:
        "Learn how to apply for an internship and track your application status.",
      content:
        "Choose a company, select your preferred position, provide your availability, and submit your internship application.",
      status: "Published",
      createdAt: "2026-08-01T09:00:00.000Z",
      updatedAt: "2026-08-01T09:00:00.000Z",
    },

    {
      id: "INFO-004",
      title: "Document Submission",
      category: "Documents",
      description:
        "Information about the documents required for your internship application.",
      content:
        "Students must submit the required internship documents through the Document Submission section of the portal.",
      status: "Published",
      createdAt: "2026-08-01T09:00:00.000Z",
      updatedAt: "2026-08-01T09:00:00.000Z",
    },

    {
      id: "INFO-005",
      title: "Internship Policies",
      category: "Policies",
      description:
        "Important policies and rules that students must observe during their internship.",
      content:
        "Students are expected to follow the policies of both the institution and their assigned internship company.",
      status: "Published",
      createdAt: "2026-08-01T09:00:00.000Z",
      updatedAt: "2026-08-01T09:00:00.000Z",
    },

    {
      id: "INFO-006",
      title: "Frequently Asked Questions",
      category: "FAQ",
      description:
        "Answers to common questions about the internship process and requirements.",
      content:
        "Find answers to commonly asked questions regarding applications, documents, internship requirements, and other procedures.",
      status: "Published",
      createdAt: "2026-08-01T09:00:00.000Z",
      updatedAt: "2026-08-01T09:00:00.000Z",
    },
  ],

  /* =========================================================
     ACTUAL STUDENT DOCUMENT SUBMISSIONS
  ========================================================= */

  documents: [],

  /* =========================================================
     EVALUATIONS
     
     ONLY TWO DIRECTIONS:
     
     Company Supervisor -> Student
     Student -> Company
     
     Faculty Adviser = VIEW ONLY
  ========================================================= */

  evaluations: [],

  /* =========================================================
     ATTENDANCE
  ========================================================= */

  attendance: [],

  evaluationTemplates: {
    "Company Supervisor": {
      name: "Intern Performance Evaluation",
      description:
        "Used by company supervisors to evaluate intern performance.",
      status: STATUS.evaluation.FINALIZED,
      sections: [],
      publishedAt: null,
      updatedAt: null,
    },

    Student: {
      name: "Company & Internship Experience Evaluation",
      description:
        "Used by students to evaluate their internship company and experience.",
      status: STATUS.evaluation.FINALIZED,
      sections: [],
      publishedAt: null,
      updatedAt: null,
    },
  },

  /* =========================================================
     NOTIFICATIONS
  ========================================================= */

  notifications: [],

  /* =========================================================
     MESSAGES
  ========================================================= */

  messages: [],

  /* =========================================================
     SYSTEM SETTINGS
  ========================================================= */

  settings: {
    systemName: "Student Internship Management System",
    academicYear: "2026 - 2027",
    internshipDuration: "480",
    maintenanceMode: false,
    emailNotifications: true,
    systemNotifications: true,
    applicationNotifications: true,
  },

  preferences: {},

  /* =========================================================
     AUDIT EVENTS
  ========================================================= */

  auditEvents: [
    {
      id: "AUD-001",
      actorUserId: "USR-004",
      actorRole: "admin",
      action: "LOGIN",
      module: "Authentication",
      targetEntityType: "User",
      targetEntityId: "USR-004",
      timestamp: "2026-08-17T09:42:18.000Z",
      details: "Administrator logged into the mock system.",
    },
  ],
};

const MockStoreContext = createContext(null);

export function MockStoreProvider({ children }) {
  const [state, setState] = useState(() => clone(initialState));

  /* =========================================================
     AUDIT
  ========================================================= */

  const appendAudit = (
    draft,
    actor,
    action,
    module,
    targetEntityType,
    targetEntityId,
    details = {}
  ) => {
    draft.auditEvents.unshift({
      id: `AUD-${String(draft.auditEvents.length + 1).padStart(3, "0")}`,
      actorUserId: actor?.id || "SYSTEM",
      actorRole: actor?.role || "system",
      action,
      module,
      targetEntityType,
      targetEntityId,
      timestamp: now(),
      details,
    });
  };

  /* =========================================================
     NOTIFICATIONS
  ========================================================= */

  const notify = (
    draft,
    recipientUserId,
    type,
    title,
    message,
    relatedEntityType,
    relatedEntityId
  ) => {
    draft.notifications.unshift({
      id: `NOT-${String(draft.notifications.length + 1).padStart(3, "0")}`,
      recipientUserId,
      type,
      title,
      message,
      relatedEntityType,
      relatedEntityId,
      createdAt: now(),
      readAt: null,
    });
  };

  /* =========================================================
     TRANSACTION
  ========================================================= */

  const transact = (mutator) =>
    setState((previous) => {
      const draft = clone(previous);

      mutator(draft);

      return draft;
    });

  const actions = useMemo(
    () => ({
      /* =========================================================
         AUTHENTICATION
      ========================================================= */

      login: (role, identifier, password) => {
        const user = state.users.find(
          (item) =>
            item.role === role &&
            item.status === STATUS.user.ACTIVE &&
            (item.email.toLowerCase() === identifier.toLowerCase() ||
              item.profileId === identifier)
        );

        if (!user || user.password !== password) {
          return {
            ok: false,
            message: "Invalid account ID or password.",
          };
        }

        transact((draft) => {
          draft.currentUser = user;

          appendAudit(draft, user, "LOGIN", "Authentication", "User", user.id);
        });

        return {
          ok: true,
          user,
        };
      },

      logout: () =>
        transact((draft) => {
          if (draft.currentUser) {
            appendAudit(
              draft,
              draft.currentUser,
              "LOGOUT",
              "Authentication",
              "User",
              draft.currentUser.id
            );
          }

          draft.currentUser = null;
        }),

      /* =========================================================
         GETTERS
      ========================================================= */

      getStudent: (id = state.currentUser?.profileId) =>
        state.students.find((item) => item.id === id),

      getFaculty: (id = state.currentUser?.profileId) =>
        state.faculty.find((item) => item.id === id),

      getSupervisor: (id = state.currentUser?.profileId) =>
        state.supervisors.find((item) => item.id === id),

      getCompany: (id = state.currentUser?.profileId) =>
        state.companies.find((item) => item.id === id) ||
        state.companies.find((company) => company.supervisorIds?.includes(id)),

      getOpportunity: (id) =>
        state.opportunities.find((item) => item.id === id),

      getApplication: (id) => state.applications.find((item) => item.id === id),

      getAssignmentForStudent: (studentId = state.currentUser?.profileId) =>
        state.assignments.find((item) => item.studentId === studentId),

      getApplicationsForFaculty: (facultyId = state.currentUser?.profileId) =>
        state.applications.filter((item) => item.reviewerId === facultyId),

      getDocumentsForStudent: (studentId = state.currentUser?.profileId) =>
        state.documents.filter((item) => item.studentId === studentId),

      getDocumentsForAssignment: (assignmentId) =>
        state.documents.filter((item) => item.assignmentId === assignmentId),

      /* =========================================================
         INFORMATION GETTERS
      ========================================================= */

      getInformationItems: () =>
        state.informationItems.filter((item) => item.status === "Published"),

      getInformationItem: (id) =>
        state.informationItems.find((item) => item.id === id),

      /* =========================================================
         EVALUATION GETTERS
      ========================================================= */

      getEvaluationsForAssignment: (assignmentId) =>
        state.evaluations.filter((item) => item.assignmentId === assignmentId),

      getEvaluationsByEvaluator: (evaluatorId = state.currentUser?.profileId) =>
        state.evaluations.filter((item) => item.evaluatorId === evaluatorId),

      /* ---------------------------------------------------------
         Company Supervisor -> Student
      --------------------------------------------------------- */

      getStudentEvaluations: (studentId = state.currentUser?.profileId) =>
        state.evaluations.filter(
          (evaluation) =>
            evaluation.evaluatorRole === "Company Supervisor" &&
            evaluation.evaluatedRole === "Student" &&
            evaluation.evaluatedId === studentId
        ),

      /* ---------------------------------------------------------
         Student -> Company
      --------------------------------------------------------- */

      getCompanyEvaluations: (companyId = "COM-001") =>
        state.evaluations.filter(
          (evaluation) =>
            evaluation.evaluatorRole === "Student" &&
            evaluation.evaluatedRole === "Company" &&
            evaluation.evaluatedId === companyId
        ),

      /* ---------------------------------------------------------
         Faculty Evaluation View
      --------------------------------------------------------- */

      getEvaluationsForFaculty: (facultyId = state.currentUser?.profileId) =>
        state.evaluations.filter((evaluation) => {
          const assignment = state.assignments.find(
            (item) => item.id === evaluation.assignmentId
          );

          return assignment?.facultyId === facultyId;
        }),

      getCompanyEvaluationsForFaculty: (
        facultyId = state.currentUser?.profileId
      ) =>
        state.evaluations.filter((evaluation) => {
          if (
            evaluation.evaluatorRole !== "Company Supervisor" ||
            evaluation.evaluatedRole !== "Student"
          ) {
            return false;
          }

          const assignment = state.assignments.find(
            (item) => item.id === evaluation.assignmentId
          );

          return assignment?.facultyId === facultyId;
        }),

      getStudentCompanyEvaluationsForFaculty: (
        facultyId = state.currentUser?.profileId
      ) =>
        state.evaluations.filter((evaluation) => {
          if (
            evaluation.evaluatorRole !== "Student" ||
            evaluation.evaluatedRole !== "Company"
          ) {
            return false;
          }

          const assignment = state.assignments.find(
            (item) => item.id === evaluation.assignmentId
          );

          return assignment?.facultyId === facultyId;
        }),

      /* =========================================================
         DOCUMENT STATUS
      ========================================================= */

      getAssignmentDocumentStatus: (assignmentId) => {
        const assignment = state.assignments.find(
          (item) => item.id === assignmentId
        );

        if (!assignment) {
          return {
            ready: false,
            requiredCount: 0,
            approvedCount: 0,
            missingCount: 0,
          };
        }

        const requiredTypes = state.documentTypes.filter(
          (item) => item.required
        );

        const documents = state.documents.filter(
          (item) => item.assignmentId === assignmentId
        );

        const approvedCount = requiredTypes.filter((type) => {
          const document = documents.find(
            (item) => item.documentTypeId === type.id
          );

          return document?.status === STATUS.document.APPROVED;
        }).length;

        const missingCount = requiredTypes.length - approvedCount;

        return {
          ready:
            requiredTypes.length > 0 && approvedCount === requiredTypes.length,

          requiredCount: requiredTypes.length,

          approvedCount,

          missingCount,
        };
      },

      getNotificationsForCurrentUser: () => {
        const user = state.currentUser;

        return user
          ? state.notifications.filter(
              (item) => item.recipientUserId === user.id
            )
          : [];
      },

      /* =========================================================
         STUDENT PROFILE
      ========================================================= */

      updateStudentProfile: (studentId, patch) =>
        transact((draft) => {
          const student = draft.students.find((item) => item.id === studentId);

          if (student) {
            Object.assign(student, patch);

            appendAudit(
              draft,
              draft.currentUser,
              "UPDATE",
              "Student Profile",
              "Student",
              studentId,
              patch
            );
          }
        }),

      /* =========================================================
   FACULTY PROFILE
========================================================= */

      updateFacultyProfile: (facultyId, patch) =>
        transact((draft) => {
          const faculty = draft.faculty.find((item) => item.id === facultyId);

          if (!faculty) return;

          Object.assign(faculty, patch);

          appendAudit(
            draft,
            draft.currentUser,
            "UPDATE",
            "Faculty Profile",
            "Faculty",
            facultyId,
            patch
          );
        }),

      /* =========================================================
         OPPORTUNITIES
      ========================================================= */

      createOpportunity: (payload) =>
        transact((draft) => {
          const id = `OPP-${String(draft.opportunities.length + 1).padStart(
            3,
            "0"
          )}`;

          const record = {
            id,
            status: STATUS.opportunity.DRAFT,
            openings: 1,
            requirements: [],
            ...payload,
          };

          draft.opportunities.unshift(record);

          appendAudit(
            draft,
            draft.currentUser,
            "CREATE",
            "Opportunities",
            "InternshipOpportunity",
            id,
            record
          );
        }),

      updateOpportunity: (id, patch) =>
        transact((draft) => {
          const record = draft.opportunities.find((item) => item.id === id);

          if (record) {
            Object.assign(record, patch);

            appendAudit(
              draft,
              draft.currentUser,
              "UPDATE",
              "Opportunities",
              "InternshipOpportunity",
              id,
              patch
            );
          }
        }),

      deleteOpportunity: (id) =>
        transact((draft) => {
          const record = draft.opportunities.find((item) => item.id === id);

          if (!record) return;

          if (record.status !== STATUS.opportunity.DRAFT) {
            return;
          }

          draft.opportunities = draft.opportunities.filter(
            (item) => item.id !== id
          );

          appendAudit(
            draft,
            draft.currentUser,
            "DELETE",
            "Opportunities",
            "InternshipOpportunity",
            id,
            {
              title: record.title,
            }
          );
        }),

      /* =========================================================
         APPLICATIONS
      ========================================================= */

      submitApplication: ({ studentId, opportunityId, coverLetter = "" }) =>
        transact((draft) => {
          const existing = draft.applications.find(
            (item) =>
              item.studentId === studentId &&
              item.opportunityId === opportunityId &&
              item.status !== STATUS.application.WITHDRAWN
          );

          if (existing) return;

          const id = `APP-${String(draft.applications.length + 1).padStart(
            3,
            "0"
          )}`;

          const record = {
            id,
            studentId,
            opportunityId,
            submittedAt: now(),
            status: STATUS.application.SUBMITTED,
            coverLetter,
            reviewerId:
              draft.students.find((item) => item.id === studentId)?.facultyId ||
              "FAC-001",
            notes: "Awaiting faculty review.",
          };

          draft.applications.unshift(record);

          appendAudit(
            draft,
            draft.currentUser,
            "SUBMIT",
            "Applications",
            "InternshipApplication",
            id,
            record
          );

          const faculty = draft.users.find(
            (item) => item.profileId === record.reviewerId
          );

          if (faculty) {
            notify(
              draft,
              faculty.id,
              "application_submitted",
              "New internship application",
              `A student submitted an application for ${
                draft.opportunities.find((item) => item.id === opportunityId)
                  ?.title || "an opportunity"
              }.`,
              "InternshipApplication",
              id
            );
          }
        }),

      saveApplicationDraft: ({ studentId, opportunityId, coverLetter = "" }) =>
        transact((draft) => {
          const id = `APP-${String(draft.applications.length + 1).padStart(
            3,
            "0"
          )}`;

          draft.applications.unshift({
            id,
            studentId,
            opportunityId,
            submittedAt: null,
            status: STATUS.application.DRAFT,
            coverLetter,
            reviewerId:
              draft.students.find((item) => item.id === studentId)?.facultyId ||
              "FAC-001",
            notes: "Draft application.",
          });

          appendAudit(
            draft,
            draft.currentUser,
            "CREATE",
            "Applications",
            "InternshipApplication",
            id
          );
        }),

      updateApplicationStatus: (applicationId, status, notes = "") =>
        transact((draft) => {
          const application = draft.applications.find(
            (item) => item.id === applicationId
          );

          if (!application) return;

          application.status = status;
          application.notes = notes;

          appendAudit(
            draft,
            draft.currentUser,
            status === STATUS.application.APPROVED
              ? "APPROVE"
              : status === STATUS.application.REJECTED
              ? "REJECT"
              : "UPDATE",
            "Applications",
            "InternshipApplication",
            applicationId,
            {
              status,
              notes,
            }
          );

          const student = draft.students.find(
            (item) => item.id === application.studentId
          );

          const studentUser = draft.users.find(
            (item) => item.profileId === student?.id
          );

          if (studentUser) {
            notify(
              draft,
              studentUser.id,
              "application_update",
              "Application status updated",
              `Your application is now ${status}.`,
              "InternshipApplication",
              applicationId
            );
          }

          /* =====================================================
             APPROVED APPLICATION -> ASSIGNMENT
          ===================================================== */

          if (
            status === STATUS.application.APPROVED &&
            !draft.assignments.some(
              (item) => item.applicationId === applicationId
            )
          ) {
            const opportunity = draft.opportunities.find(
              (item) => item.id === application.opportunityId
            );

            const supervisor = draft.supervisors.find(
              (item) => item.id === opportunity?.supervisorId
            );

            const assignmentId = `INT-${String(
              draft.assignments.length + 1
            ).padStart(3, "0")}`;

            draft.assignments.unshift({
              id: assignmentId,
              applicationId,
              studentId: application.studentId,
              opportunityId: application.opportunityId,
              companyId: opportunity?.companyId,
              companySupervisorId: opportunity?.supervisorId,
              facultyId: application.reviewerId,
              startDate: "2026-06-01",
              endDate: "2026-08-31",
              status: STATUS.assignment.PENDING,
              deployedAt: null,
              deployedBy: null,
            });

            application.assignmentId = assignmentId;

            if (supervisor) {
              const supervisorUser = draft.users.find(
                (item) => item.profileId === supervisor.id
              );

              if (supervisorUser) {
                notify(
                  draft,
                  supervisorUser.id,
                  "assignment_created",
                  "Internship assignment created",
                  `${
                    student?.fullName || "A student"
                  } has an approved internship application. The student will become available after document verification and deployment.`,
                  "InternshipAssignment",
                  assignmentId
                );
              }
            }

            appendAudit(
              draft,
              draft.currentUser,
              "CREATE",
              "Assignments",
              "InternshipAssignment",
              assignmentId,
              {
                applicationId,
                status: STATUS.assignment.PENDING,
              }
            );
          }
        }),

      /* =========================================================
         DOCUMENT SUBMISSION
      ========================================================= */

      submitDocument: ({ studentId, assignmentId, documentTypeId, fileName }) =>
        transact((draft) => {
          const assignment = draft.assignments.find(
            (item) => item.id === assignmentId
          );

          if (!assignment) return;

          const existing = draft.documents.find(
            (item) =>
              item.studentId === studentId &&
              item.assignmentId === assignmentId &&
              item.documentTypeId === documentTypeId
          );

          const id =
            existing?.id ||
            `DOC-${String(draft.documents.length + 1).padStart(3, "0")}`;

          const record = {
            id,
            studentId,
            assignmentId,
            documentTypeId,
            fileName,
            version: existing ? existing.version + 1 : 1,
            submittedAt: now(),
            status: STATUS.document.PENDING_REVIEW,
            reviewerId: assignment.facultyId || "FAC-001",
            reviewComment: "",
            reviewedAt: null,
          };

          if (existing) {
            Object.assign(existing, record);
          } else {
            draft.documents.unshift(record);
          }

          appendAudit(
            draft,
            draft.currentUser,
            "UPLOAD",
            "Documents",
            "DocumentSubmission",
            id,
            record
          );

          const faculty = draft.faculty.find(
            (item) => item.id === record.reviewerId
          );

          const facultyUser = draft.users.find(
            (item) => item.profileId === faculty?.id
          );

          if (facultyUser) {
            notify(
              draft,
              facultyUser.id,
              "document_submitted",
              "Document ready for review",
              `${fileName} was submitted for review.`,
              "DocumentSubmission",
              id
            );
          }
        }),

      /* =========================================================
         FACULTY DOCUMENT REVIEW
      ========================================================= */

      reviewDocument: (documentId, status, reviewComment = "") =>
        transact((draft) => {
          const record = draft.documents.find((item) => item.id === documentId);

          if (!record) return;

          record.status = status;
          record.reviewComment = reviewComment;
          record.reviewedAt = now();

          appendAudit(
            draft,
            draft.currentUser,
            status === STATUS.document.APPROVED ? "APPROVE" : "UPDATE",
            "Documents",
            "DocumentSubmission",
            documentId,
            {
              status,
              reviewComment,
            }
          );

          const studentUser = draft.users.find(
            (item) => item.profileId === record.studentId
          );

          if (studentUser) {
            notify(
              draft,
              studentUser.id,
              "document_review",
              "Document review updated",
              `${
                draft.documentTypes.find(
                  (item) => item.id === record.documentTypeId
                )?.name || "Document"
              }: ${status}.`,
              "DocumentSubmission",
              documentId
            );
          }
        }),

      /* =========================================================
         ADMIN DOCUMENT TEMPLATES
      ========================================================= */

      addDocumentTemplate: ({ name, description, fileName }) =>
        transact((draft) => {
          const id = `TPL-${String(draft.documentTemplates.length + 1).padStart(
            3,
            "0"
          )}`;

          const record = {
            id,
            name,
            description,
            fileName,
          };

          draft.documentTemplates.unshift(record);

          appendAudit(
            draft,
            draft.currentUser,
            "CREATE",
            "Document Management",
            "DocumentTemplate",
            id,
            record
          );
        }),

      deleteDocumentTemplate: (templateId) =>
        transact((draft) => {
          const template = draft.documentTemplates.find(
            (item) => item.id === templateId
          );

          if (!template) return;

          draft.documentTemplates = draft.documentTemplates.filter(
            (item) => item.id !== templateId
          );

          appendAudit(
            draft,
            draft.currentUser,
            "DELETE",
            "Document Management",
            "DocumentTemplate",
            templateId,
            {
              name: template.name,
            }
          );
        }),

      /* =========================================================
         INFORMATION MANAGEMENT
         
         ADMIN -> MANAGES
         STUDENT -> READS PUBLISHED INFORMATION
      ========================================================= */

      createInformationItem: ({
        title,
        category,
        description,
        content,
        status = "Published",
      }) =>
        transact((draft) => {
          const id = `INFO-${String(draft.informationItems.length + 1).padStart(
            3,
            "0"
          )}`;

          const timestamp = now();

          const record = {
            id,
            title: title.trim(),
            category,
            description: description.trim(),
            content: content.trim(),
            status,
            createdAt: timestamp,
            updatedAt: timestamp,
          };

          draft.informationItems.unshift(record);

          appendAudit(
            draft,
            draft.currentUser,
            "CREATE",
            "Information Management",
            "InformationItem",
            id,
            record
          );
        }),

      updateInformationItem: (id, patch) =>
        transact((draft) => {
          const item = draft.informationItems.find(
            (information) => information.id === id
          );

          if (!item) return;

          Object.assign(item, {
            ...patch,
            updatedAt: now(),
          });

          appendAudit(
            draft,
            draft.currentUser,
            "UPDATE",
            "Information Management",
            "InformationItem",
            id,
            patch
          );
        }),

      deleteInformationItem: (id) =>
        transact((draft) => {
          const item = draft.informationItems.find(
            (information) => information.id === id
          );

          if (!item) return;

          draft.informationItems = draft.informationItems.filter(
            (information) => information.id !== id
          );

          appendAudit(
            draft,
            draft.currentUser,
            "DELETE",
            "Information Management",
            "InformationItem",
            id,
            {
              title: item.title,
              category: item.category,
            }
          );
        }),

      /* =========================================================
         DEPLOY INTERN
      ========================================================= */

      deployAssignment: (assignmentId) => {
        const assignment = state.assignments.find(
          (item) => item.id === assignmentId
        );

        if (!assignment) {
          return {
            ok: false,
            message: "Internship assignment not found.",
          };
        }

        const requiredTypes = state.documentTypes.filter(
          (item) => item.required
        );

        const assignmentDocuments = state.documents.filter(
          (item) => item.assignmentId === assignmentId
        );

        const missingDocuments = requiredTypes.filter((type) => {
          const document = assignmentDocuments.find(
            (item) => item.documentTypeId === type.id
          );

          return !document || document.status !== STATUS.document.APPROVED;
        });

        if (missingDocuments.length > 0) {
          return {
            ok: false,
            message:
              "The student cannot be deployed yet. All required documents must be approved first.",
            missingDocuments: missingDocuments.map((item) => item.name),
          };
        }

        transact((draft) => {
          const draftAssignment = draft.assignments.find(
            (item) => item.id === assignmentId
          );

          if (!draftAssignment) return;

          draftAssignment.status = STATUS.assignment.ACTIVE;

          draftAssignment.deployedAt = now();

          draftAssignment.deployedBy = draft.currentUser?.profileId || null;

          appendAudit(
            draft,
            draft.currentUser,
            "DEPLOY",
            "Assignments",
            "InternshipAssignment",
            assignmentId,
            {
              status: STATUS.assignment.ACTIVE,
              deployedAt: draftAssignment.deployedAt,
            }
          );

          const supervisor = draft.supervisors.find(
            (item) => item.id === draftAssignment.companySupervisorId
          );

          const supervisorUser = draft.users.find(
            (item) => item.profileId === supervisor?.id
          );

          const student = draft.students.find(
            (item) => item.id === draftAssignment.studentId
          );

          if (supervisorUser) {
            notify(
              draft,
              supervisorUser.id,
              "intern_deployed",
              "New intern deployed",
              `${
                student?.fullName || "A student"
              } has completed document verification and has been deployed to your company.`,
              "InternshipAssignment",
              assignmentId
            );
          }

          const studentUser = draft.users.find(
            (item) => item.profileId === draftAssignment.studentId
          );

          if (studentUser) {
            notify(
              draft,
              studentUser.id,
              "intern_deployed",
              "Internship deployment completed",
              "Your required documents have been approved and you have been deployed to your assigned company.",
              "InternshipAssignment",
              assignmentId
            );
          }
        });

        return {
          ok: true,
          message: "Student successfully deployed to the company.",
        };
      },

      /* =========================================================
         ATTENDANCE
      ========================================================= */

      recordAttendance: ({ assignmentId, date, hours, status, notes }) =>
        transact((draft) => {
          const id = `ATT-${String(draft.attendance.length + 1).padStart(
            3,
            "0"
          )}`;

          draft.attendance.unshift({
            id,
            assignmentId,
            date,
            hours,
            status,
            notes,
            recordedBy: draft.currentUser?.profileId,
          });

          appendAudit(
            draft,
            draft.currentUser,
            "CREATE",
            "Attendance",
            "AttendanceProgress",
            id
          );
        }),

      /* =========================================================
         EVALUATIONS
         
         ONLY:
         
         Company Supervisor -> Student
         Student -> Company
         
         Faculty Adviser = VIEW ONLY
      ========================================================= */

      submitEvaluation: ({
        assignmentId,
        evaluatorRole,
        evaluatorId,
        ratings = {},
        comments = "",
        type = "structured",
      }) =>
        transact((draft) => {
          const assignment = draft.assignments.find(
            (item) => item.id === assignmentId
          );

          if (!assignment) return;

          /* -----------------------------------------------------
             FACULTY CANNOT SUBMIT
          ----------------------------------------------------- */

          if (
            evaluatorRole !== "Company Supervisor" &&
            evaluatorRole !== "Student"
          ) {
            return;
          }

          /* -----------------------------------------------------
             DETERMINE EVALUATED PARTY
          ----------------------------------------------------- */

          let evaluatedRole = "";
          let evaluatedId = "";

          if (evaluatorRole === "Company Supervisor") {
            evaluatedRole = "Student";
            evaluatedId = assignment.studentId;
          }

          if (evaluatorRole === "Student") {
            evaluatedRole = "Company";
            evaluatedId = assignment.companyId;
          }

          /* -----------------------------------------------------
             FIND EXISTING
          ----------------------------------------------------- */

          const existing = draft.evaluations.find(
            (item) =>
              item.assignmentId === assignmentId &&
              item.evaluatorId === evaluatorId &&
              item.type === type
          );

          /* -----------------------------------------------------
             UPDATE EXISTING
          ----------------------------------------------------- */

          if (existing) {
            existing.evaluatorRole = evaluatorRole;
            existing.evaluatorId = evaluatorId;
            existing.evaluatedRole = evaluatedRole;
            existing.evaluatedId = evaluatedId;
            existing.type = type;
            existing.ratings = ratings;
            existing.comments = comments;
            existing.status = STATUS.evaluation.SUBMITTED;
            existing.submittedAt = now();

            appendAudit(
              draft,
              draft.currentUser,
              "UPDATE",
              "Evaluations",
              "EvaluationSubmission",
              existing.id,
              existing
            );

            /* Company -> Student */

            if (evaluatorRole === "Company Supervisor") {
              const studentUser = draft.users.find(
                (item) => item.profileId === assignment.studentId
              );

              if (studentUser && studentUser.id !== draft.currentUser?.id) {
                notify(
                  draft,
                  studentUser.id,
                  "evaluation_submitted",
                  "Company evaluation updated",
                  "Your company supervisor updated your internship evaluation.",
                  "EvaluationSubmission",
                  existing.id
                );
              }

              const facultyUser = draft.users.find(
                (item) => item.profileId === assignment.facultyId
              );

              if (facultyUser && facultyUser.id !== draft.currentUser?.id) {
                notify(
                  draft,
                  facultyUser.id,
                  "evaluation_submitted",
                  "Company evaluation updated",
                  "The company supervisor updated an evaluation for an assigned intern.",
                  "EvaluationSubmission",
                  existing.id
                );
              }
            }

            /* Student -> Company */

            if (evaluatorRole === "Student") {
              const supervisorUser = draft.users.find(
                (item) => item.profileId === assignment.companySupervisorId
              );

              if (
                supervisorUser &&
                supervisorUser.id !== draft.currentUser?.id
              ) {
                notify(
                  draft,
                  supervisorUser.id,
                  "student_company_evaluation",
                  "Student evaluation updated",
                  "An intern updated their evaluation of your company.",
                  "EvaluationSubmission",
                  existing.id
                );
              }

              const facultyUser = draft.users.find(
                (item) => item.profileId === assignment.facultyId
              );

              if (facultyUser && facultyUser.id !== draft.currentUser?.id) {
                notify(
                  draft,
                  facultyUser.id,
                  "student_company_evaluation",
                  "Student company evaluation updated",
                  "A student updated their evaluation of their internship company.",
                  "EvaluationSubmission",
                  existing.id
                );
              }
            }

            return;
          }

          /* -----------------------------------------------------
             CREATE NEW
          ----------------------------------------------------- */

          const id = `EVAL-${String(draft.evaluations.length + 1).padStart(
            3,
            "0"
          )}`;

          const record = {
            id,
            assignmentId,

            evaluatorRole,
            evaluatorId,

            evaluatedRole,
            evaluatedId,

            type,

            ratings,
            comments,

            status: STATUS.evaluation.SUBMITTED,

            submittedAt: now(),
          };

          draft.evaluations.unshift(record);

          appendAudit(
            draft,
            draft.currentUser,
            "SUBMIT",
            "Evaluations",
            "EvaluationSubmission",
            id,
            record
          );

          /* -----------------------------------------------------
             COMPANY SUPERVISOR -> STUDENT
          ----------------------------------------------------- */

          if (evaluatorRole === "Company Supervisor") {
            const studentUser = draft.users.find(
              (item) => item.profileId === assignment.studentId
            );

            if (studentUser && studentUser.id !== draft.currentUser?.id) {
              notify(
                draft,
                studentUser.id,
                "evaluation_submitted",
                "Company evaluation submitted",
                "Your company supervisor has submitted an evaluation for your internship.",
                "EvaluationSubmission",
                id
              );
            }

            const facultyUser = draft.users.find(
              (item) => item.profileId === assignment.facultyId
            );

            if (facultyUser && facultyUser.id !== draft.currentUser?.id) {
              notify(
                draft,
                facultyUser.id,
                "evaluation_submitted",
                "Company evaluation submitted",
                "The company supervisor submitted an evaluation for an assigned intern.",
                "EvaluationSubmission",
                id
              );
            }
          }

          /* -----------------------------------------------------
             STUDENT -> COMPANY
          ----------------------------------------------------- */

          if (evaluatorRole === "Student") {
            const supervisorUser = draft.users.find(
              (item) => item.profileId === assignment.companySupervisorId
            );

            if (supervisorUser && supervisorUser.id !== draft.currentUser?.id) {
              notify(
                draft,
                supervisorUser.id,
                "student_company_evaluation",
                "Student submitted company evaluation",
                "An intern has submitted an evaluation of your company and internship experience.",
                "EvaluationSubmission",
                id
              );
            }

            const facultyUser = draft.users.find(
              (item) => item.profileId === assignment.facultyId
            );

            if (facultyUser && facultyUser.id !== draft.currentUser?.id) {
              notify(
                draft,
                facultyUser.id,
                "student_company_evaluation",
                "Student submitted company evaluation",
                "A student has submitted an evaluation of their internship company.",
                "EvaluationSubmission",
                id
              );
            }
          }
        }),

      /* =========================================================
         NOTIFICATIONS
      ========================================================= */

      /* =========================================================
         ADMIN SYSTEM NOTIFICATIONS
      ========================================================= */

      broadcastNotification: ({
        targetPortal,
        notificationType,
        subject,
        message,
      }) => {
        let result = {
          ok: false,
          message: "",
          recipientCount: 0,
        };

        transact((draft) => {
          /* -------------------------------------------------------
             FIND TARGET USERS
          ------------------------------------------------------- */

          const activeUsers = draft.users.filter(
            (user) => user.status === STATUS.user.ACTIVE
          );

          let recipients = [];

          if (targetPortal === "Student Portal") {
            recipients = activeUsers.filter((user) => user.role === "student");
          }

          if (targetPortal === "Faculty Portal") {
            recipients = activeUsers.filter((user) => user.role === "faculty");
          }

          if (targetPortal === "Company Portal") {
            recipients = activeUsers.filter((user) => user.role === "company");
          }

          if (targetPortal === "All Portals") {
            recipients = activeUsers.filter((user) =>
              ["student", "faculty", "company"].includes(user.role)
            );
          }

          /* -------------------------------------------------------
             GENERATE SYSTEM NOTIFICATION ID
          ------------------------------------------------------- */

          const broadcastId = `SYS-${Date.now()}`;

          /* -------------------------------------------------------
             SEND TO EVERY TARGET USER
          ------------------------------------------------------- */

          recipients.forEach((user) => {
            notify(
              draft,
              user.id,
              notificationType || "announcement",
              subject.trim(),
              message.trim(),
              "SystemNotification",
              broadcastId
            );
          });

          /* -------------------------------------------------------
             AUDIT EVENT
          ------------------------------------------------------- */

          appendAudit(
            draft,
            draft.currentUser,
            "BROADCAST",
            "System Notifications",
            "SystemNotification",
            broadcastId,
            {
              targetPortal,
              notificationType: notificationType || "announcement",
              subject: subject.trim(),
              message: message.trim(),
              recipientCount: recipients.length,
            }
          );

          result = {
            ok: true,
            message:
              recipients.length > 0
                ? `Notification sent successfully to ${recipients.length} ${
                    recipients.length === 1 ? "user" : "users"
                  }.`
                : "Notification created, but no active users matched the selected portal.",
            recipientCount: recipients.length,
          };
        });

        return result;
      },

      markNotificationRead: (id) =>
        transact((draft) => {
          const item = draft.notifications.find(
            (notification) => notification.id === id
          );

          if (item) {
            item.readAt = now();
          }
        }),

      /* =========================================================
         ASSIGNMENT STATUS
      ========================================================= */

      setAssignmentStatus: (id, status) =>
        transact((draft) => {
          const assignment = draft.assignments.find((item) => item.id === id);

          if (assignment) {
            assignment.status = status;

            appendAudit(
              draft,
              draft.currentUser,
              "UPDATE",
              "Assignments",
              "InternshipAssignment",
              id,
              {
                status,
              }
            );
          }
        }),

      /* =========================================================
         COMPANY
      ========================================================= */

      updateCompany: (id, patch) =>
        transact((draft) => {
          const company = draft.companies.find((item) => item.id === id);

          if (company) {
            Object.assign(company, patch);

            appendAudit(
              draft,
              draft.currentUser,
              "UPDATE",
              "Companies",
              "Company",
              id,
              patch
            );
          }
        }),

      /* =========================================================
         SYSTEM SETTINGS
      ========================================================= */

      updateSystemSettings: (patch) =>
        transact((draft) => {
          Object.assign(draft.settings, patch);

          appendAudit(
            draft,
            draft.currentUser,
            "UPDATE",
            "System Settings",
            "SystemSetting",
            "SYSTEM",
            patch
          );
        }),
    }),
    [state]
  );

  /* =========================================================
     PROVIDER VALUE
  ========================================================= */

  const value = useMemo(
    () => ({
      state,
      transact,
      ...actions,
    }),
    [state, actions]
  );

  return (
    <MockStoreContext.Provider value={value}>
      {children}
    </MockStoreContext.Provider>
  );
}

/* =========================================================
   HOOK
========================================================= */

export function useMockStore() {
  const value = useContext(MockStoreContext);

  if (!value) {
    throw new Error("useMockStore must be used inside MockStoreProvider");
  }

  return value;
}

/* =========================================================
   ROLE ROUTES
========================================================= */

export const getUserHome = (role) =>
  ({
    student: "/student/dashboard",
    faculty: "/faculty/dashboard",
    company: "/company/dashboard",
    admin: "/admin/dashboard",
  }[role] || "/");

/* =========================================================
   ROLE LABELS
========================================================= */

export const getRoleLabel = (role) =>
  ({
    student: "Student",
    faculty: "Faculty Adviser",
    company: "Company Supervisor",
    admin: "Administrator",
  }[role] || role);
