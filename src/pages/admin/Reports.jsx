import React, { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "../../supabaseClient";

// =============================================================
// ADMIN REPORTS & ANALYTICS
// =============================================================
//
// Admin-level reporting only.
//
// INCLUDED:
// - Users
// - Companies
// - Applications (high-level statistics)
// - Student / Registrar Registration Requests
// - System Activity
//
// NOT INCLUDED:
// - Internship operations
// - Assignments / deployment
// - Student documents
// - Evaluations
//
// DATA SOURCES:
// - users            -> system accounts
// - companies        -> company registrations / company records
// - applications     -> application statistics
// - create_requests  -> student / registrar registration requests
//
// =============================================================

const APPLICATION_STATUS = {
  DRAFT: "draft",
  SUBMITTED: "submitted",
  UNDER_REVIEW: "under_review",
  INFO_REQUESTED: "info_requested",
  INFORMATION_REQUESTED: "information_requested",
  APPROVED: "approved",
  REJECTED: "rejected",
  WITHDRAWN: "withdrawn",
};

const USER_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  PENDING: "pending",
};

const ROLE_LABELS = {
  student: "Student",
  registrar: "Registrar Adviser",
  registrar_adviser: "Registrar Adviser",
  faculty: "Registrar Adviser",
  company: "Company Supervisor",
  company_supervisor: "Company Supervisor",
  admin: "Administrator",
};

export default function Reports() {
  const { darkMode } = useOutletContext();

  // =========================================================
  // STATE
  // =========================================================

  const [activeReport, setActiveReport] = useState("overview");

  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [applications, setApplications] = useState([]);
  const [registrationRequests, setRegistrationRequests] = useState([]);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  // =========================================================
  // LOAD DATA
  // =========================================================

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const [usersResult, companiesResult, applicationsResult, requestsResult] =
        await Promise.all([
          // -----------------------------------------------------
          // USERS
          // -----------------------------------------------------
          supabase
            .from("users")
            .select(
              "id, email, role, first_name, middle_name, last_name, status, created_at, updated_at"
            )
            .order("created_at", { ascending: false }),

          // -----------------------------------------------------
          // COMPANIES
          // Company registration/request data lives here.
          // -----------------------------------------------------
          supabase
            .from("companies")
            .select(
              "id, user_id, company_name, company_email, company_phone, company_address, website, industry, designation, status, created_at, updated_at"
            )
            .order("created_at", { ascending: false }),

          // -----------------------------------------------------
          // APPLICATIONS
          // High-level statistics only.
          // -----------------------------------------------------
          supabase
            .from("applications")
            .select(
              "id, student_id, opportunity_id, status, submitted_at, created_at, updated_at"
            )
            .order("created_at", { ascending: false }),

          // -----------------------------------------------------
          // CREATE REQUESTS
          // Student / Registrar registration requests.
          // Company requests are NOT counted here.
          // -----------------------------------------------------
          supabase
            .from("create_requests")
            .select("*")
            .order("created_at", { ascending: false }),
        ]);

      if (usersResult.error) {
        throw new Error(`Failed to load users: ${usersResult.error.message}`);
      }

      if (companiesResult.error) {
        throw new Error(
          `Failed to load companies: ${companiesResult.error.message}`
        );
      }

      if (applicationsResult.error) {
        throw new Error(
          `Failed to load applications: ${applicationsResult.error.message}`
        );
      }

      if (requestsResult.error) {
        throw new Error(
          `Failed to load registration requests: ${requestsResult.error.message}`
        );
      }

      // -------------------------------------------------------
      // Admin accounts are excluded from normal user reports.
      // -------------------------------------------------------

      const nonAdminUsers = (usersResult.data || []).filter(
        (user) => user.role?.toLowerCase() !== "admin"
      );

      setUsers(nonAdminUsers);
      setCompanies(companiesResult.data || []);
      setApplications(applicationsResult.data || []);

      // Only keep Student / Registrar requests here.
      // Company registrations are sourced from `companies`.
      const nonCompanyRequests = (requestsResult.data || []).filter(
        (request) => {
          const role = request.role?.toLowerCase();

          return !["company", "company_supervisor"].includes(role);
        }
      );

      setRegistrationRequests(nonCompanyRequests);
    } catch (error) {
      console.error("Reports loading error:", error);

      setErrorMessage(
        error instanceof Error ? error.message : "Failed to load reports."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // REPORT DATA
  // =========================================================

  const reportData = useMemo(() => {
    // ---------------------------------------------------------
    // USERS
    // ---------------------------------------------------------

    const activeUsers = users.filter(
      (user) => user.status?.toLowerCase() === USER_STATUS.ACTIVE
    );

    const inactiveUsers = users.filter(
      (user) => user.status?.toLowerCase() === USER_STATUS.INACTIVE
    );

    const pendingUsers = users.filter(
      (user) => user.status?.toLowerCase() === USER_STATUS.PENDING
    );

    const students = users.filter(
      (user) => user.role?.toLowerCase() === "student"
    );

    const registrars = users.filter((user) =>
      ["registrar", "registrar_adviser", "faculty"].includes(
        user.role?.toLowerCase()
      )
    );

    const companyUsers = users.filter((user) =>
      ["company", "company_supervisor"].includes(user.role?.toLowerCase())
    );

    // ---------------------------------------------------------
    // COMPANIES
    // ---------------------------------------------------------

    const activeCompanies = companies.filter((company) =>
      ["active", "verified"].includes(company.status?.toLowerCase())
    );

    const inactiveCompanies = companies.filter(
      (company) => company.status?.toLowerCase() === "inactive"
    );

    const pendingCompanies = companies.filter(
      (company) => company.status?.toLowerCase() === "pending"
    );

    const rejectedCompanies = companies.filter(
      (company) => company.status?.toLowerCase() === "rejected"
    );

    // ---------------------------------------------------------
    // APPLICATIONS
    // ---------------------------------------------------------

    const submittedApplications = applications.filter(
      (application) =>
        application.status?.toLowerCase() === APPLICATION_STATUS.SUBMITTED
    );

    const underReviewApplications = applications.filter(
      (application) =>
        application.status?.toLowerCase() === APPLICATION_STATUS.UNDER_REVIEW
    );

    const informationRequestedApplications = applications.filter(
      (application) =>
        [
          APPLICATION_STATUS.INFO_REQUESTED,
          APPLICATION_STATUS.INFORMATION_REQUESTED,
        ].includes(application.status?.toLowerCase())
    );

    const approvedApplications = applications.filter(
      (application) =>
        application.status?.toLowerCase() === APPLICATION_STATUS.APPROVED
    );

    const rejectedApplications = applications.filter(
      (application) =>
        application.status?.toLowerCase() === APPLICATION_STATUS.REJECTED
    );

    const withdrawnApplications = applications.filter(
      (application) =>
        application.status?.toLowerCase() === APPLICATION_STATUS.WITHDRAWN
    );

    const draftApplications = applications.filter(
      (application) =>
        application.status?.toLowerCase() === APPLICATION_STATUS.DRAFT
    );

    // ---------------------------------------------------------
    // REGISTRATION REQUESTS
    //
    // IMPORTANT:
    // Company registrations are NOT included here.
    // They come from the companies table.
    // ---------------------------------------------------------

    const pendingRequests = registrationRequests.filter(
      (request) => request.status?.toLowerCase() === "pending"
    );

    const approvedRequests = registrationRequests.filter(
      (request) => request.status?.toLowerCase() === "approved"
    );

    const rejectedRequests = registrationRequests.filter(
      (request) => request.status?.toLowerCase() === "rejected"
    );

    const requestsByRole = {
      student: registrationRequests.filter(
        (request) => request.role?.toLowerCase() === "student"
      ).length,

      registrar: registrationRequests.filter((request) =>
        ["registrar", "registrar_adviser", "faculty"].includes(
          request.role?.toLowerCase()
        )
      ).length,
    };

    // ---------------------------------------------------------
    // COMPANY INDUSTRY DISTRIBUTION
    // ---------------------------------------------------------

    const industryMap = {};

    companies.forEach((company) => {
      const industry = company.industry?.trim() || "Unspecified";

      industryMap[industry] = (industryMap[industry] || 0) + 1;
    });

    const industries = Object.entries(industryMap)
      .map(([name, count]) => ({
        name,
        count,
      }))
      .sort((a, b) => b.count - a.count);

    // ---------------------------------------------------------
    // USER ROLE DISTRIBUTION
    // ---------------------------------------------------------

    const roleDistribution = [
      {
        label: "Students",
        role: "student",
        value: students.length,
      },
      {
        label: "Registrar",
        role: "registrar",
        value: registrars.length,
      },
      {
        label: "Company Supervisors",
        role: "company",
        value: companyUsers.length,
      },
    ];

    // ---------------------------------------------------------
    // ACCOUNT STATUS
    // ---------------------------------------------------------

    const accountStatus = [
      {
        label: "Active",
        value: activeUsers.length,
        accent: "emerald",
      },
      {
        label: "Inactive",
        value: inactiveUsers.length,
        accent: "red",
      },
      {
        label: "Pending",
        value: pendingUsers.length,
        accent: "amber",
      },
    ];

    // ---------------------------------------------------------
    // APPLICATION STATUS
    // ---------------------------------------------------------

    const applicationStatus = [
      {
        label: "Draft",
        value: draftApplications.length,
        accent: "slate",
      },
      {
        label: "Submitted",
        value: submittedApplications.length,
        accent: "blue",
      },
      {
        label: "Under Review",
        value: underReviewApplications.length,
        accent: "amber",
      },
      {
        label: "Info Requested",
        value: informationRequestedApplications.length,
        accent: "violet",
      },
      {
        label: "Approved",
        value: approvedApplications.length,
        accent: "emerald",
      },
      {
        label: "Rejected",
        value: rejectedApplications.length,
        accent: "red",
      },
      {
        label: "Withdrawn",
        value: withdrawnApplications.length,
        accent: "slate",
      },
    ];

    return {
      activeUsers,
      inactiveUsers,
      pendingUsers,

      students,
      registrars,
      companyUsers,

      activeCompanies,
      inactiveCompanies,
      pendingCompanies,
      rejectedCompanies,

      submittedApplications,
      underReviewApplications,
      informationRequestedApplications,
      approvedApplications,
      rejectedApplications,
      withdrawnApplications,
      draftApplications,

      pendingRequests,
      approvedRequests,
      rejectedRequests,

      requestsByRole,
      industries,
      roleDistribution,
      accountStatus,
      applicationStatus,
    };
  }, [users, companies, applications, registrationRequests]);

  // =========================================================
  // SYSTEM ACTIVITY
  // =========================================================

  const systemActivity = useMemo(() => {
    const activities = [];

    // ---------------------------------------------------------
    // USER ACCOUNT ACTIVITY
    // ---------------------------------------------------------

    users.forEach((user) => {
      activities.push({
        id: `user-${user.id}`,
        type: "user",
        title: "New user account registered",
        description: `${getFullName(user)} registered as a ${
          ROLE_LABELS[user.role?.toLowerCase()] || formatRole(user.role)
        }.`,
        date: user.created_at,
      });
    });

    // ---------------------------------------------------------
    // COMPANY REGISTRATION ACTIVITY
    //
    // Company records are created in `companies`.
    // ---------------------------------------------------------

    companies.forEach((company) => {
      activities.push({
        id: `company-${company.id}`,
        type: "company",
        title: "Company registration recorded",
        description: `${
          company.company_name || "A company"
        } was registered in the system.`,
        date: company.created_at,
      });
    });

    // ---------------------------------------------------------
    // STUDENT / REGISTRAR REGISTRATION REQUEST ACTIVITY
    // ---------------------------------------------------------

    registrationRequests.forEach((request) => {
      const normalizedRole = request.role?.toLowerCase();

      const role = ROLE_LABELS[normalizedRole] || formatRole(request.role);

      const status = request.status?.toLowerCase();

      if (status === "approved") {
        activities.push({
          id: `request-approved-${request.id}`,
          type: "registration",
          title: "Registration request approved",
          description: `${role} registration request was approved.`,
          date: request.reviewed_at || request.updated_at || request.created_at,
        });
      } else if (status === "rejected") {
        activities.push({
          id: `request-rejected-${request.id}`,
          type: "registration",
          title: "Registration request rejected",
          description: `${role} registration request was rejected.`,
          date: request.reviewed_at || request.updated_at || request.created_at,
        });
      } else if (status === "pending") {
        activities.push({
          id: `request-pending-${request.id}`,
          type: "registration",
          title: "Registration request submitted",
          description: `A new ${role} registration request is pending review.`,
          date: request.created_at,
        });
      }
    });

    return activities
      .filter((item) => item.date)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 12);
  }, [users, companies, registrationRequests]);

  // =========================================================
  // OVERVIEW CARDS
  // =========================================================

  const overviewCards = [
    {
      label: "Total Users",
      value: users.length,
      description: "Registered non-admin accounts",
      icon: "👥",
      accent: "blue",
    },
    {
      label: "Active Accounts",
      value: reportData.activeUsers.length,
      description: "Currently active user accounts",
      icon: "✓",
      accent: "emerald",
    },
    {
      label: "Companies",
      value: companies.length,
      description: "Company records registered in the system",
      icon: "🏢",
      accent: "violet",
    },
    {
      label: "Pending Registrations",
      value: reportData.pendingRequests.length,
      description: "Student / Registrar requests awaiting review",
      icon: "📝",
      accent: "amber",
    },
  ];

  // =========================================================
  // HELPERS
  // =========================================================

  const cardClass = darkMode
    ? "bg-slate-900 border-slate-700"
    : "bg-white border-slate-200";

  const mutedText = darkMode ? "text-slate-400" : "text-slate-500";

  const secondaryText = darkMode ? "text-slate-300" : "text-slate-600";

  const getAccentClasses = (accent) => {
    const classes = {
      blue: darkMode
        ? "bg-blue-950/40 text-blue-400"
        : "bg-blue-50 text-blue-600",

      emerald: darkMode
        ? "bg-emerald-950/40 text-emerald-400"
        : "bg-emerald-50 text-emerald-600",

      violet: darkMode
        ? "bg-violet-950/40 text-violet-400"
        : "bg-violet-50 text-violet-600",

      amber: darkMode
        ? "bg-amber-950/40 text-amber-400"
        : "bg-amber-50 text-amber-600",

      red: darkMode ? "bg-red-950/40 text-red-400" : "bg-red-50 text-red-600",

      slate: darkMode
        ? "bg-slate-800 text-slate-300"
        : "bg-slate-100 text-slate-600",
    };

    return classes[accent] || classes.blue;
  };

  // =========================================================
  // REPORT NAVIGATION
  // =========================================================

  const reportTabs = [
    {
      id: "overview",
      label: "Overview",
      icon: "📊",
    },
    {
      id: "users",
      label: "Users",
      icon: "👥",
    },
    {
      id: "companies",
      label: "Companies",
      icon: "🏢",
    },
    {
      id: "applications",
      label: "Applications",
      icon: "📋",
    },
    {
      id: "registrations",
      label: "Registrations",
      icon: "📝",
    },
    {
      id: "activity",
      label: "System Activity",
      icon: "⚡",
    },
  ];

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div
        className={`min-h-[calc(100vh-5rem)] flex items-center justify-center ${
          darkMode
            ? "bg-slate-950 text-slate-100"
            : "bg-slate-50 text-slate-900"
        }`}
      >
        <div className="text-center">
          <div className="text-3xl mb-3">📊</div>

          <p className="text-sm font-bold">Loading reports...</p>

          <p className={`text-xs mt-1 ${mutedText}`}>
            Fetching system data from Supabase.
          </p>
        </div>
      </div>
    );
  }

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div
      className={`min-h-[calc(100vh-5rem)] px-4 py-5 sm:px-6 lg:px-8 transition-colors duration-300 ${
        darkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"
      }`}
    >
      <div className="max-w-7xl mx-auto">
        {/* ===================================================
            HEADER
        =================================================== */}

        <div className="mb-6">
          <p
            className={`text-[10px] uppercase tracking-widest font-bold ${
              darkMode ? "text-slate-500" : "text-slate-400"
            }`}
          >
            Administrator Portal
          </p>

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-black mt-1">
                Reports & Analytics
              </h1>

              <p className={`text-xs sm:text-sm mt-1 ${mutedText}`}>
                Monitor system users, companies, registrations, applications,
                and administrative activity.
              </p>
            </div>

            <button
              type="button"
              onClick={loadReports}
              className={`px-3 py-2 rounded-lg text-[10px] sm:text-xs font-bold border transition ${
                darkMode
                  ? "border-slate-700 bg-slate-900 hover:bg-slate-800"
                  : "border-slate-200 bg-white hover:bg-slate-50"
              }`}
            >
              ↻ Refresh
            </button>
          </div>
        </div>

        {/* ===================================================
            ERROR
        =================================================== */}

        {errorMessage && (
          <div
            className={`mb-6 border rounded-xl p-4 ${
              darkMode
                ? "bg-red-950/30 border-red-900 text-red-300"
                : "bg-red-50 border-red-200 text-red-700"
            }`}
          >
            <p className="text-xs font-bold">Unable to load reports</p>

            <p className="text-[10px] mt-1">{errorMessage}</p>

            <button
              type="button"
              onClick={loadReports}
              className="text-[10px] font-bold underline mt-2"
            >
              Try again
            </button>
          </div>
        )}

        {/* ===================================================
            REPORT NAVIGATION
        =================================================== */}

        <div
          className={`border rounded-xl p-1.5 mb-6 flex flex-wrap gap-1 ${cardClass}`}
        >
          {reportTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveReport(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] sm:text-xs font-semibold transition ${
                activeReport === tab.id
                  ? darkMode
                    ? "bg-white text-slate-900"
                    : "bg-slate-800 text-white"
                  : darkMode
                  ? "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ===================================================
            OVERVIEW
        =================================================== */}

        {activeReport === "overview" && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
              {overviewCards.map((card) => (
                <div
                  key={card.label}
                  className={`border rounded-xl p-4 ${cardClass}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className={`text-[10px] font-medium ${mutedText}`}>
                        {card.label}
                      </p>

                      <p className="text-2xl sm:text-3xl font-black mt-2">
                        {card.value}
                      </p>
                    </div>

                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg ${getAccentClasses(
                        card.accent
                      )}`}
                    >
                      {card.icon}
                    </div>
                  </div>

                  <p className={`text-[9px] mt-3 ${mutedText}`}>
                    {card.description}
                  </p>
                </div>
              ))}
            </div>

            {/* USER + ACCOUNT STATUS */}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
              <div className={`border rounded-xl p-5 ${cardClass}`}>
                <div className="mb-5">
                  <h2 className="text-sm font-bold">User Distribution</h2>

                  <p className={`text-[10px] mt-1 ${mutedText}`}>
                    Registered users by system role
                  </p>
                </div>

                <div className="space-y-4">
                  {reportData.roleDistribution.map((item) => (
                    <ReportProgress
                      key={item.role}
                      label={item.label}
                      value={item.value}
                      total={users.length}
                      darkMode={darkMode}
                      color="blue"
                    />
                  ))}
                </div>
              </div>

              <div className={`border rounded-xl p-5 ${cardClass}`}>
                <div className="mb-5">
                  <h2 className="text-sm font-bold">Account Status</h2>

                  <p className={`text-[10px] mt-1 ${mutedText}`}>
                    Current status of non-admin accounts
                  </p>
                </div>

                <div className="space-y-4">
                  {reportData.accountStatus.map((item) => (
                    <ReportProgress
                      key={item.label}
                      label={item.label}
                      value={item.value}
                      total={users.length}
                      darkMode={darkMode}
                      color={item.accent}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* REGISTRATION + APPLICATION */}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
              <div className={`border rounded-xl p-5 ${cardClass}`}>
                <div className="mb-5">
                  <h2 className="text-sm font-bold">Registration Requests</h2>

                  <p className={`text-[10px] mt-1 ${mutedText}`}>
                    Student and Registrar registration requests
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <SummaryItem
                    label="Pending"
                    value={reportData.pendingRequests.length}
                    darkMode={darkMode}
                  />

                  <SummaryItem
                    label="Approved"
                    value={reportData.approvedRequests.length}
                    darkMode={darkMode}
                  />

                  <SummaryItem
                    label="Rejected"
                    value={reportData.rejectedRequests.length}
                    darkMode={darkMode}
                  />
                </div>
              </div>

              <div className={`border rounded-xl p-5 ${cardClass}`}>
                <div className="mb-5">
                  <h2 className="text-sm font-bold">Application Summary</h2>

                  <p className={`text-[10px] mt-1 ${mutedText}`}>
                    High-level application statistics
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <SummaryItem
                    label="Total"
                    value={applications.length}
                    darkMode={darkMode}
                  />

                  <SummaryItem
                    label="Approved"
                    value={reportData.approvedApplications.length}
                    darkMode={darkMode}
                  />

                  <SummaryItem
                    label="Rejected"
                    value={reportData.rejectedApplications.length}
                    darkMode={darkMode}
                  />
                </div>
              </div>
            </div>

            {/* COMPANY SUMMARY */}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
              <div className={`border rounded-xl p-5 ${cardClass}`}>
                <div className="mb-5">
                  <h2 className="text-sm font-bold">Company Summary</h2>

                  <p className={`text-[10px] mt-1 ${mutedText}`}>
                    Company registration records from the companies table
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <SummaryItem
                    label="Total"
                    value={companies.length}
                    darkMode={darkMode}
                  />

                  <SummaryItem
                    label="Active"
                    value={reportData.activeCompanies.length}
                    darkMode={darkMode}
                  />

                  <SummaryItem
                    label="Pending"
                    value={reportData.pendingCompanies.length}
                    darkMode={darkMode}
                  />

                  <SummaryItem
                    label="Rejected"
                    value={reportData.rejectedCompanies.length}
                    darkMode={darkMode}
                  />
                </div>
              </div>

              <div className={`border rounded-xl p-5 ${cardClass}`}>
                <div className="mb-5">
                  <h2 className="text-sm font-bold">Company Industries</h2>

                  <p className={`text-[10px] mt-1 ${mutedText}`}>
                    Registered companies grouped by industry
                  </p>
                </div>

                {reportData.industries.length === 0 ? (
                  <EmptyState
                    message="No company industry data available."
                    darkMode={darkMode}
                  />
                ) : (
                  <div className="space-y-4">
                    {reportData.industries.slice(0, 6).map((industry) => (
                      <ReportProgress
                        key={industry.name}
                        label={industry.name}
                        value={industry.count}
                        total={companies.length}
                        darkMode={darkMode}
                        color="violet"
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* ===================================================
            USERS REPORT
        =================================================== */}

        {activeReport === "users" && (
          <ReportPanel
            title="User Report"
            description="System-wide account statistics excluding administrator accounts."
            darkMode={darkMode}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricBox
                label="Total Users"
                value={users.length}
                darkMode={darkMode}
              />

              <MetricBox
                label="Students"
                value={reportData.students.length}
                darkMode={darkMode}
              />

              <MetricBox
                label="Registrar"
                value={reportData.registrars.length}
                darkMode={darkMode}
              />

              <MetricBox
                label="Company Supervisors"
                value={reportData.companyUsers.length}
                darkMode={darkMode}
              />
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {reportData.accountStatus.map((item) => (
                <MetricBox
                  key={item.label}
                  label={item.label}
                  value={item.value}
                  darkMode={darkMode}
                />
              ))}
            </div>

            <div className="mt-6">
              <SectionHeading
                title="User Distribution"
                description="Breakdown of registered accounts by role."
                darkMode={darkMode}
              />

              <div className="space-y-4">
                {reportData.roleDistribution.map((item) => (
                  <ReportProgress
                    key={item.role}
                    label={item.label}
                    value={item.value}
                    total={users.length}
                    darkMode={darkMode}
                    color="blue"
                  />
                ))}
              </div>
            </div>
          </ReportPanel>
        )}

        {/* ===================================================
            COMPANY REPORT
        =================================================== */}

        {activeReport === "companies" && (
          <ReportPanel
            title="Company Report"
            description="Administrative overview of company registration records."
            darkMode={darkMode}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricBox
                label="Total Companies"
                value={companies.length}
                darkMode={darkMode}
              />

              <MetricBox
                label="Active / Verified"
                value={reportData.activeCompanies.length}
                darkMode={darkMode}
              />

              <MetricBox
                label="Pending"
                value={reportData.pendingCompanies.length}
                darkMode={darkMode}
              />

              <MetricBox
                label="Inactive"
                value={reportData.inactiveCompanies.length}
                darkMode={darkMode}
              />
            </div>

            <div className="mt-6">
              <SectionHeading
                title="Companies by Industry"
                description="Distribution of registered companies across standardized industries."
                darkMode={darkMode}
              />

              {reportData.industries.length === 0 ? (
                <EmptyState
                  message="No company industry data available."
                  darkMode={darkMode}
                />
              ) : (
                <div className="space-y-4">
                  {reportData.industries.map((industry) => (
                    <ReportProgress
                      key={industry.name}
                      label={industry.name}
                      value={industry.count}
                      total={companies.length}
                      darkMode={darkMode}
                      color="violet"
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <MetricBox
                label="Rejected"
                value={reportData.rejectedCompanies.length}
                darkMode={darkMode}
              />

              <MetricBox
                label="Unique Industries"
                value={reportData.industries.length}
                darkMode={darkMode}
              />
            </div>
          </ReportPanel>
        )}

        {/* ===================================================
            APPLICATION REPORT
        =================================================== */}

        {activeReport === "applications" && (
          <ReportPanel
            title="Application Report"
            description="High-level internship application statistics. Operational internship management remains under the Registrar portal."
            darkMode={darkMode}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricBox
                label="Total Applications"
                value={applications.length}
                darkMode={darkMode}
              />

              <MetricBox
                label="Submitted"
                value={reportData.submittedApplications.length}
                darkMode={darkMode}
              />

              <MetricBox
                label="Approved"
                value={reportData.approvedApplications.length}
                darkMode={darkMode}
              />

              <MetricBox
                label="Rejected"
                value={reportData.rejectedApplications.length}
                darkMode={darkMode}
              />
            </div>

            <div className="mt-6 space-y-4">
              {reportData.applicationStatus.map((item) => (
                <ReportProgress
                  key={item.label}
                  label={item.label}
                  value={item.value}
                  total={applications.length}
                  darkMode={darkMode}
                  color={item.accent}
                />
              ))}
            </div>
          </ReportPanel>
        )}

        {/* ===================================================
            REGISTRATION REPORT
        =================================================== */}

        {activeReport === "registrations" && (
          <ReportPanel
            title="Registration Report"
            description="Student and Registrar registration requests processed through the administrator portal."
            darkMode={darkMode}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricBox
                label="Total Requests"
                value={registrationRequests.length}
                darkMode={darkMode}
              />

              <MetricBox
                label="Pending"
                value={reportData.pendingRequests.length}
                darkMode={darkMode}
              />

              <MetricBox
                label="Approved"
                value={reportData.approvedRequests.length}
                darkMode={darkMode}
              />

              <MetricBox
                label="Rejected"
                value={reportData.rejectedRequests.length}
                darkMode={darkMode}
              />
            </div>

            <div className="mt-6">
              <SectionHeading
                title="Requests by Role"
                description="Student and Registrar registration requests."
                darkMode={darkMode}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <MetricBox
                  label="Students"
                  value={reportData.requestsByRole.student}
                  darkMode={darkMode}
                />

                <MetricBox
                  label="Registrar"
                  value={reportData.requestsByRole.registrar}
                  darkMode={darkMode}
                />
              </div>
            </div>

            <div className="mt-6">
              <SectionHeading
                title="Registration Processing"
                description="Current distribution of student and registrar registration requests."
                darkMode={darkMode}
              />

              <div className="space-y-4">
                <ReportProgress
                  label="Pending"
                  value={reportData.pendingRequests.length}
                  total={registrationRequests.length}
                  darkMode={darkMode}
                  color="amber"
                />

                <ReportProgress
                  label="Approved"
                  value={reportData.approvedRequests.length}
                  total={registrationRequests.length}
                  darkMode={darkMode}
                  color="emerald"
                />

                <ReportProgress
                  label="Rejected"
                  value={reportData.rejectedRequests.length}
                  total={registrationRequests.length}
                  darkMode={darkMode}
                  color="red"
                />
              </div>
            </div>

            {/* COMPANY REGISTRATION IS SEPARATE */}

            <div className="mt-8">
              <SectionHeading
                title="Company Registrations"
                description="Company registration records are managed through the companies table."
                darkMode={darkMode}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricBox
                  label="Total Companies"
                  value={companies.length}
                  darkMode={darkMode}
                />

                <MetricBox
                  label="Active"
                  value={reportData.activeCompanies.length}
                  darkMode={darkMode}
                />

                <MetricBox
                  label="Pending"
                  value={reportData.pendingCompanies.length}
                  darkMode={darkMode}
                />

                <MetricBox
                  label="Rejected"
                  value={reportData.rejectedCompanies.length}
                  darkMode={darkMode}
                />
              </div>
            </div>
          </ReportPanel>
        )}

        {/* ===================================================
            SYSTEM ACTIVITY
        =================================================== */}

        {activeReport === "activity" && (
          <ReportPanel
            title="System Activity"
            description="Recent account, company registration, and registration-request activity derived from system records."
            darkMode={darkMode}
          >
            {systemActivity.length === 0 ? (
              <EmptyState
                message="No system activity has been recorded yet."
                darkMode={darkMode}
              />
            ) : (
              <div className="space-y-3">
                {systemActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className={`border rounded-lg p-4 ${
                      darkMode
                        ? "border-slate-700 bg-slate-950"
                        : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <div className="flex gap-3">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${getActivityIconClass(
                          activity.type,
                          darkMode
                        )}`}
                      >
                        {activity.type === "user"
                          ? "👤"
                          : activity.type === "company"
                          ? "🏢"
                          : "📝"}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                          <p className="text-xs font-bold">{activity.title}</p>

                          <p className={`text-[9px] ${mutedText}`}>
                            {formatDate(activity.date)}
                          </p>
                        </div>

                        <p className={`text-[10px] mt-1 ${secondaryText}`}>
                          {activity.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ReportPanel>
        )}
      </div>
    </div>
  );
}

// =============================================================
// REPORT PANEL
// =============================================================

function ReportPanel({ title, description, darkMode, children }) {
  return (
    <div
      className={`border rounded-xl p-5 ${
        darkMode
          ? "bg-slate-900 border-slate-700 text-slate-100"
          : "bg-white border-slate-200 text-slate-900"
      }`}
    >
      <div className="mb-5">
        <h2 className="text-base font-bold">{title}</h2>

        <p
          className={`text-[10px] mt-1 ${
            darkMode ? "text-slate-400" : "text-slate-500"
          }`}
        >
          {description}
        </p>
      </div>

      {children}
    </div>
  );
}

// =============================================================
// SECTION HEADING
// =============================================================

function SectionHeading({ title, description, darkMode }) {
  return (
    <div className="mb-4">
      <h3 className="text-sm font-bold">{title}</h3>

      <p
        className={`text-[10px] mt-1 ${
          darkMode ? "text-slate-400" : "text-slate-500"
        }`}
      >
        {description}
      </p>
    </div>
  );
}

// =============================================================
// METRIC BOX
// =============================================================

function MetricBox({ label, value, darkMode }) {
  return (
    <div
      className={`border rounded-lg p-4 ${
        darkMode
          ? "bg-slate-950 border-slate-700"
          : "bg-slate-50 border-slate-200"
      }`}
    >
      <p
        className={`text-[10px] ${
          darkMode ? "text-slate-400" : "text-slate-500"
        }`}
      >
        {label}
      </p>

      <p className="text-2xl font-black mt-1">{value}</p>
    </div>
  );
}

// =============================================================
// SUMMARY ITEM
// =============================================================

function SummaryItem({ label, value, darkMode }) {
  return (
    <div
      className={`rounded-lg p-3 ${darkMode ? "bg-slate-800" : "bg-slate-50"}`}
    >
      <p
        className={`text-[9px] ${
          darkMode ? "text-slate-400" : "text-slate-500"
        }`}
      >
        {label}
      </p>

      <p className="text-lg font-black mt-1">{value}</p>
    </div>
  );
}

// =============================================================
// PROGRESS
// =============================================================

function ReportProgress({ label, value, total, darkMode, color = "blue" }) {
  const percentage = total ? Math.round((value / total) * 100) : 0;

  const colorClasses = {
    blue: "bg-blue-500",
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    red: "bg-red-500",
    violet: "bg-violet-500",
    slate: "bg-slate-500",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span
          className={`text-[10px] font-medium ${
            darkMode ? "text-slate-300" : "text-slate-600"
          }`}
        >
          {label}
        </span>

        <span className="text-[10px] font-bold">{value}</span>
      </div>

      <div
        className={`h-2 rounded-full overflow-hidden ${
          darkMode ? "bg-slate-800" : "bg-slate-100"
        }`}
      >
        <div
          className={`h-full rounded-full transition-all ${
            colorClasses[color] || colorClasses.blue
          }`}
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>

      <p
        className={`text-[8px] mt-1 ${
          darkMode ? "text-slate-500" : "text-slate-400"
        }`}
      >
        {percentage}% of total
      </p>
    </div>
  );
}

// =============================================================
// EMPTY STATE
// =============================================================

function EmptyState({ message, darkMode }) {
  return (
    <div
      className={`border rounded-lg p-8 text-center ${
        darkMode
          ? "border-slate-700 bg-slate-950"
          : "border-slate-200 bg-slate-50"
      }`}
    >
      <div className="text-2xl mb-2">📊</div>

      <p
        className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}
      >
        {message}
      </p>
    </div>
  );
}

// =============================================================
// ACTIVITY ICON
// =============================================================

function getActivityIconClass(type, darkMode) {
  if (type === "registration") {
    return darkMode
      ? "bg-amber-950/40 text-amber-400"
      : "bg-amber-50 text-amber-600";
  }

  if (type === "company") {
    return darkMode
      ? "bg-violet-950/40 text-violet-400"
      : "bg-violet-50 text-violet-600";
  }

  return darkMode ? "bg-blue-950/40 text-blue-400" : "bg-blue-50 text-blue-600";
}

// =============================================================
// NAME
// =============================================================

function getFullName(user) {
  return (
    [user.first_name, user.middle_name, user.last_name]
      .filter(Boolean)
      .join(" ")
      .trim() ||
    user.email ||
    "Unknown User"
  );
}

// =============================================================
// ROLE
// =============================================================

function formatRole(role) {
  if (!role) return "Unknown Role";

  return role
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

// =============================================================
// DATE
// =============================================================

function formatDate(date) {
  if (!date) return "Unknown date";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "Unknown date";
  }

  return parsed.toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
