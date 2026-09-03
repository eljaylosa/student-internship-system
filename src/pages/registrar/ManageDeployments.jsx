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
    APPROVED: "approved",
  },
};

export default function ManageDeployment() {
  const { darkMode } = useOutletContext();

  const [deploymentStudents, setDeploymentStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedStudent, setSelectedStudent] = useState(null);

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

      // -------------------------------------------------------
      // Registrar
      // -------------------------------------------------------

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
      // Assignments
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
          .order("created_at", { ascending: false });

      if (assignmentsError) {
        throw assignmentsError;
      }

      if (!assignments || assignments.length === 0) {
        setDeploymentStudents([]);
        return;
      }

      // -------------------------------------------------------
      // Students
      // -------------------------------------------------------

      const studentIds = [
        ...new Set(assignments.map((assignment) => assignment.student_id)),
      ];

      const { data: students, error: studentsError } = await supabaseRegistrar
        .from("students")
        .select(
          `
              id,
              student_id,
              program,
              year_level,
              department,
              school_id
            `
        )
        .in("id", studentIds);

      if (studentsError) {
        throw studentsError;
      }

      // -------------------------------------------------------
      // Users
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
        .in("id", studentIds);

      if (usersError) {
        throw usersError;
      }

      // -------------------------------------------------------
      // Applications
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
      // Opportunities
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
      // Companies
      // -------------------------------------------------------

      const companyIds = [
        ...new Set(
          assignments.map((assignment) => assignment.company_id).filter(Boolean)
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
      // Documents
      // -------------------------------------------------------

      const assignmentIds = assignments.map((assignment) => assignment.id);

      const { data: documents, error: documentsError } = await supabaseRegistrar
        .from("documents")
        .select(
          `
              id,
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

      if (documentsError) {
        throw documentsError;
      }

      // -------------------------------------------------------
      // Document Types
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
      // Maps
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
      // Format deployment records
      // -------------------------------------------------------

      const formatted = assignments
        .map((assignment) => {
          const student = studentMap.get(assignment.student_id);
          const studentUser = userMap.get(assignment.student_id);

          if (!student) {
            return null;
          }

          const application = applicationMap.get(assignment.application_id);

          const opportunity = opportunityMap.get(assignment.opportunity_id);

          const company = companyMap.get(assignment.company_id);

          const studentName =
            [
              studentUser?.first_name,
              studentUser?.middle_name,
              studentUser?.last_name,
            ]
              .filter(Boolean)
              .join(" ")
              .trim() || "Unknown Student";

          const studentDocuments = (documents || []).filter(
            (document) => document.assignment_id === assignment.id
          );

          const requiredTypes = (documentTypes || []).filter(
            (type) => type.required
          );

          const approvedRequiredDocuments = studentDocuments.filter(
            (document) => {
              const type = documentTypeMap.get(document.document_type_id);

              return (
                type?.required && document.status === STATUS.document.APPROVED
              );
            }
          );

          const allRequiredDocumentsApproved =
            requiredTypes.length > 0 &&
            approvedRequiredDocuments.length >= requiredTypes.length;

          // ---------------------------------------------------
          // Deployment Status
          // ---------------------------------------------------

          let deploymentStatus = "Ready for Deployment";

          if (
            assignment.status === STATUS.assignment.PENDING &&
            assignment.deployed_at
          ) {
            deploymentStatus = "Sent to Company";
          } else if (assignment.status === STATUS.assignment.ACTIVE) {
            deploymentStatus = "Accepted by Company";
          } else if (assignment.status === STATUS.assignment.TERMINATED) {
            deploymentStatus = "Rejected by Company";
          } else if (assignment.status === STATUS.assignment.COMPLETED) {
            deploymentStatus = "Completed";
          } else if (assignment.status === STATUS.assignment.SUSPENDED) {
            deploymentStatus = "Suspended";
          } else if (
            assignment.status === STATUS.assignment.PENDING &&
            !assignment.deployed_at
          ) {
            deploymentStatus = allRequiredDocumentsApproved
              ? "Ready for Deployment"
              : "Documents Incomplete";
          }

          return {
            id: assignment.id,

            studentId: student.student_id,
            studentName,
            studentEmail: studentUser?.email || "—",
            studentProgram: student.program || "—",
            studentYear: student.year_level || "—",
            studentDepartment: student.department || "—",

            // IMPORTANT:
            // Keep the student's school ID so deployment can
            // verify that the school's official logo exists.
            schoolId: student.school_id || null,

            internshipId: opportunity?.id || assignment.opportunity_id,
            internshipTitle: opportunity?.title || "Unknown Internship",

            companyId: company?.id || assignment.company_id,
            companyName: company?.company_name || "Unknown Company",
            companyAddress: company?.company_address || "—",
            companyContact: company?.designation || "—",
            companyEmail: company?.company_email || "—",

            applicationId: application?.id || assignment.application_id,

            applicationStatus: application?.status || "—",

            applicationDate:
              application?.submitted_at ||
              application?.created_at ||
              assignment.created_at,

            documentStatus: allRequiredDocumentsApproved
              ? "Approved"
              : "Incomplete",

            documents: studentDocuments.map((document) => ({
              id: document.id,
              name:
                documentTypeMap.get(document.document_type_id)?.name ||
                document.file_name ||
                "Document",
              status: document.status,
              version: document.version || 1,
              notes: document.notes,
            })),

            requiredDocumentsCount: requiredTypes.length,
            approvedRequiredDocumentsCount: approvedRequiredDocuments.length,

            deploymentStatus,

            assignmentStatus: assignment.status,
            deployedAt: assignment.deployed_at,

            startDate: assignment.start_date,
            endDate: assignment.end_date,

            companyDecision:
              assignment.status === STATUS.assignment.ACTIVE
                ? "Accepted"
                : assignment.status === STATUS.assignment.TERMINATED
                ? "Rejected"
                : null,

            companyDecisionAt:
              assignment.status === STATUS.assignment.ACTIVE ||
              assignment.status === STATUS.assignment.TERMINATED
                ? assignment.updated_at
                : null,

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

    // -------------------------------------------------------
    // Required documents validation
    // -------------------------------------------------------

    if (
      student.requiredDocumentsCount === 0 ||
      student.approvedRequiredDocumentsCount < student.requiredDocumentsCount
    ) {
      alert(
        "The student cannot be deployed until all required documents are approved."
      );
      return;
    }

    // -------------------------------------------------------
    // Prevent duplicate deployment
    // -------------------------------------------------------

    if (
      student.deploymentStatus !== "Ready for Deployment" ||
      student.deployedAt
    ) {
      alert("This internship has already been processed.");
      return;
    }

    // -------------------------------------------------------
    // SCHOOL LOGO VALIDATION
    // -------------------------------------------------------

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
      console.error("Error checking school logo:", schoolError);

      alert(
        schoolError.message ||
          "Unable to verify the student's school logo. Deployment was cancelled."
      );

      return;
    }

    // -------------------------------------------------------
    // Block deployment if school has no logo
    // -------------------------------------------------------

    if (!school?.logo_url) {
      const schoolName = school?.name || "the student's school";

      alert(
        `Deployment cannot continue because ${schoolName} does not have an official school logo uploaded.\n\nPlease upload the school logo in Settings → School Information before deploying students.`
      );

      return;
    }

    // -------------------------------------------------------
    // Confirmation
    // -------------------------------------------------------

    const confirmed = window.confirm(
      `Deploy ${student.studentName} to ${
        student.companyName || "the assigned company"
      }?\n\nSchool logo verified: ${school.name || "School"}`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeployingAssignmentId(student.id);

      const deployedAt = new Date().toISOString();

      // -----------------------------------------------------
      // Update assignment
      // -----------------------------------------------------

      const { data: updatedAssignment, error } = await supabaseRegistrar
        .from("assignments")
        .update({
          status: STATUS.assignment.PENDING,
          deployed_at: deployedAt,
          updated_at: deployedAt,
        })
        .eq("id", student.id)
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

      console.log("DEPLOYED ASSIGNMENT:", updatedAssignment);

      // -----------------------------------------------------
      // Update local table
      // -----------------------------------------------------

      setDeploymentStudents((current) =>
        current.map((item) =>
          item.id === updatedAssignment.id
            ? {
                ...item,
                deploymentStatus: "Sent to Company",
                assignmentStatus: updatedAssignment.status,
                deployedAt: updatedAssignment.deployed_at,
              }
            : item
        )
      );

      // -----------------------------------------------------
      // Update modal if open
      // -----------------------------------------------------

      setSelectedStudent((current) =>
        current?.id === updatedAssignment.id
          ? {
              ...current,
              deploymentStatus: "Sent to Company",
              assignmentStatus: updatedAssignment.status,
              deployedAt: updatedAssignment.deployed_at,
            }
          : current
      );

      alert(
        `${student.studentName} has been successfully sent to ${
          student.companyName || "the company"
        } for review.`
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
  // FILTER
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

  const readyCount = deploymentStudents.filter(
    (student) => student.deploymentStatus === "Ready for Deployment"
  ).length;

  const sentCount = deploymentStudents.filter(
    (student) => student.deploymentStatus === "Sent to Company"
  ).length;

  const acceptedCount = deploymentStudents.filter(
    (student) => student.deploymentStatus === "Accepted by Company"
  ).length;

  const rejectedCount = deploymentStudents.filter(
    (student) => student.deploymentStatus === "Rejected by Company"
  ).length;

  // =========================================================
  // STATUS STYLE
  // =========================================================

  const getStatusClasses = (status) => {
    switch (status) {
      case "Ready for Deployment":
        return darkMode
          ? "bg-amber-950 text-amber-300 border-amber-900"
          : "bg-amber-50 text-amber-700 border-amber-200";

      case "Sent to Company":
        return darkMode
          ? "bg-blue-950 text-blue-300 border-blue-900"
          : "bg-blue-50 text-blue-700 border-blue-200";

      case "Accepted by Company":
        return darkMode
          ? "bg-emerald-950 text-emerald-300 border-emerald-900"
          : "bg-emerald-50 text-emerald-700 border-emerald-200";

      case "Rejected by Company":
      case "Suspended":
        return darkMode
          ? "bg-red-950 text-red-300 border-red-900"
          : "bg-red-50 text-red-700 border-red-200";

      case "Completed":
        return darkMode
          ? "bg-purple-950 text-purple-300 border-purple-900"
          : "bg-purple-50 text-purple-700 border-purple-200";

      case "Documents Incomplete":
        return darkMode
          ? "bg-slate-800 text-slate-300 border-slate-700"
          : "bg-slate-100 text-slate-600 border-slate-200";

      default:
        return darkMode
          ? "bg-slate-800 text-slate-300 border-slate-700"
          : "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  // =========================================================
  // DATE
  // =========================================================

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleString([], {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

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
              Monitor students throughout the deployment process. Students are
              sent to their selected company after all required documents have
              been approved and the school's official logo is configured.
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
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search student, ID, company, or internship..."
                className={`w-full pl-9 pr-4 py-3 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-blue-500/30 ${input}`}
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`md:w-60 px-4 py-3 rounded-xl border text-sm outline-none ${input}`}
            >
              <option value="All">All Statuses</option>
              <option value="Ready for Deployment">Ready for Deployment</option>
              <option value="Sent to Company">Sent to Company</option>
              <option value="Accepted by Company">Accepted by Company</option>
              <option value="Rejected by Company">Rejected by Company</option>
              <option value="Completed">Completed</option>
              <option value="Suspended">Suspended</option>
              <option value="Documents Incomplete">Documents Incomplete</option>
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
                Deployment status is updated automatically as the company
                processes the student.
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
              No students match your current search or status filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px]">
              <thead className={darkMode ? "bg-slate-800/70" : "bg-slate-50"}>
                <tr>
                  <th className="px-5 py-3 text-left text-[10px] uppercase tracking-wider font-bold text-slate-400">
                    Student
                  </th>

                  <th className="px-5 py-3 text-left text-[10px] uppercase tracking-wider font-bold text-slate-400">
                    Internship
                  </th>

                  <th className="px-5 py-3 text-left text-[10px] uppercase tracking-wider font-bold text-slate-400">
                    Company
                  </th>

                  <th className="px-5 py-3 text-left text-[10px] uppercase tracking-wider font-bold text-slate-400">
                    Documents
                  </th>

                  <th className="px-5 py-3 text-left text-[10px] uppercase tracking-wider font-bold text-slate-400">
                    Status
                  </th>

                  <th className="px-5 py-3 text-right text-[10px] uppercase tracking-wider font-bold text-slate-400">
                    Action
                  </th>
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
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${
                            darkMode
                              ? "bg-slate-800 text-slate-300"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {student.studentName
                            .split(" ")
                            .filter(Boolean)
                            .map((name) => name[0])
                            .slice(0, 2)
                            .join("")
                            .toUpperCase()}
                        </div>

                        <div>
                          <p className="text-sm font-bold">
                            {student.studentName}
                          </p>

                          <p className={`text-[10px] mt-0.5 ${secondaryText}`}>
                            {student.studentId}
                          </p>

                          <p className={`text-[10px] ${secondaryText}`}>
                            {student.studentProgram}
                          </p>
                        </div>
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
                            ? "✓ Approved"
                            : "Incomplete"}
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

                      {student.deploymentStatus === "Ready for Deployment" &&
                        student.requiredDocumentsCount > 0 &&
                        student.approvedRequiredDocumentsCount >=
                          student.requiredDocumentsCount && (
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
            onClick={(e) => e.stopPropagation()}
          >
            {/* HEADER */}

            <div
              className={`px-6 py-5 border-b flex items-start justify-between ${
                darkMode ? "border-slate-700" : "border-slate-200"
              }`}
            >
              <div>
                <p className="text-xs uppercase tracking-wider font-bold text-slate-400">
                  Deployment Record
                </p>

                <h2 className="text-xl font-black mt-1">
                  {selectedStudent.studentName}
                </h2>

                <p className={`text-xs mt-1 ${secondaryText}`}>
                  {selectedStudent.studentId}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className={`w-9 h-9 rounded-lg text-xl ${
                  darkMode
                    ? "hover:bg-slate-800 text-slate-400"
                    : "hover:bg-slate-100 text-slate-500"
                }`}
              >
                ×
              </button>
            </div>

            {/* CONTENT */}

            <div className="p-6 space-y-6">
              {/* STUDENT */}

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

                <div
                  className={`border rounded-xl overflow-hidden ${
                    darkMode ? "border-slate-700" : "border-slate-200"
                  }`}
                >
                  {selectedStudent.documents.length === 0 ? (
                    <div className="p-5 text-center">
                      <p className={`text-xs ${secondaryText}`}>
                        No documents found.
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
                            document.status === "approved"
                              ? darkMode
                                ? "text-emerald-400"
                                : "text-emerald-600"
                              : darkMode
                              ? "text-amber-400"
                              : "text-amber-600"
                          }`}
                        >
                          {document.status === "approved"
                            ? "✓ Approved"
                            : document.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* STATUS */}

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

                {selectedStudent.deploymentStatus === "Ready for Deployment" &&
                  selectedStudent.requiredDocumentsCount > 0 &&
                  selectedStudent.approvedRequiredDocumentsCount >=
                    selectedStudent.requiredDocumentsCount && (
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
    </div>
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
