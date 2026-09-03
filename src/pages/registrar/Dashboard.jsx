import React, { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabaseRegistrar } from "../../supabaseClient";

const Dashboard = () => {
  const { darkMode } = useOutletContext();

  const [loading, setLoading] = useState(true);
  const [registrarName, setRegistrarName] = useState("Registrar");
  const [schoolName, setSchoolName] = useState("");

  const [students, setStudents] = useState([]);
  const [applications, setApplications] = useState([]);
  const [assignments, setAssignments] = useState([]);

  // ================================================================
  // LOAD DASHBOARD DATA
  // ================================================================

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);

      // ------------------------------------------------------------
      // GET AUTHENTICATED USER
      // ------------------------------------------------------------

      const {
        data: { user },
        error: authError,
      } = await supabaseRegistrar.auth.getUser();

      if (authError) {
        throw authError;
      }

      if (!user) {
        throw new Error("Registrar session not found.");
      }

      // ------------------------------------------------------------
      // GET REGISTRAR
      // registrars.id = users.id
      // ------------------------------------------------------------

      const { data: registrarData, error: registrarError } =
        await supabaseRegistrar
          .from("registrars")
          .select(
            `
            id,
            employee_id,
            department,
            position,
            school_id,
            users (
              id,
              first_name,
              middle_name,
              last_name
            ),
            schools (
              id,
              name
            )
          `
          )
          .eq("id", user.id)
          .maybeSingle();

      if (registrarError) {
        throw registrarError;
      }

      if (!registrarData) {
        throw new Error("Registrar profile could not be found.");
      }

      const schoolId = registrarData.school_id;
      const userData = registrarData.users;

      const fullRegistrarName = [
        userData?.first_name,
        userData?.middle_name,
        userData?.last_name,
      ]
        .filter(Boolean)
        .join(" ");

      setRegistrarName(fullRegistrarName || "Registrar");
      setSchoolName(registrarData.schools?.name || "");

      if (!schoolId) {
        setStudents([]);
        setApplications([]);
        setAssignments([]);
        return;
      }

      // ------------------------------------------------------------
      // GET STUDENTS FROM REGISTRAR'S SCHOOL
      // ------------------------------------------------------------

      const { data: studentData, error: studentError } =
        await supabaseRegistrar
          .from("students")
          .select(
            `
            id,
            student_id,
            program,
            year_level,
            department,
            school_id,
            users (
              id,
              first_name,
              middle_name,
              last_name
            )
          `
          )
          .eq("school_id", schoolId)
          .order("created_at", { ascending: false });

      if (studentError) {
        throw studentError;
      }

      setStudents(studentData || []);

      // ------------------------------------------------------------
      // GET APPLICATIONS FROM STUDENTS IN REGISTRAR'S SCHOOL
      // ------------------------------------------------------------

      const { data: applicationData, error: applicationError } =
        await supabaseRegistrar
          .from("applications")
          .select(
            `
            id,
            student_id,
            opportunity_id,
            status,
            submitted_at,
            created_at,
            updated_at,
            students!inner (
              id,
              student_id,
              school_id,
              users (
                id,
                first_name,
                middle_name,
                last_name
              )
            ),
            opportunities (
              id,
              title,
              company_id,
              companies (
                id,
                company_name
              )
            )
          `
          )
          .eq("students.school_id", schoolId)
          .order("updated_at", { ascending: false });

      if (applicationError) {
        throw applicationError;
      }

      setApplications(applicationData || []);

      // ------------------------------------------------------------
      // GET ASSIGNMENTS FROM STUDENTS IN REGISTRAR'S SCHOOL
      // ------------------------------------------------------------

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
            updated_at,
            students!inner (
              id,
              student_id,
              school_id,
              users (
                id,
                first_name,
                middle_name,
                last_name
              )
            ),
            companies (
              id,
              company_name
            ),
            opportunities (
              id,
              title
            )
          `
          )
          .eq("students.school_id", schoolId)
          .order("updated_at", { ascending: false });

      if (assignmentError) {
        throw assignmentError;
      }

      console.log("========== REGISTRAR ASSIGNMENT DEBUG ==========");
      console.log("Registrar school ID:", schoolId);
      console.log("Total assignments fetched:", assignmentData?.length || 0);

      console.table(
        (assignmentData || []).map((assignment) => ({
          id: assignment.id,
          student_id: assignment.student_id,
          student_number: assignment.students?.student_id,
          student_name: getStudentName(assignment.students),
          status: assignment.status,
          start_date: assignment.start_date,
          end_date: assignment.end_date,
          deployed_at: assignment.deployed_at,
          updated_at: assignment.updated_at,
        }))
      );

      console.log(
        "Assignment status counts:",
        (assignmentData || []).reduce((acc, assignment) => {
          const status = String(assignment.status || "NULL").toLowerCase();

          acc[status] = (acc[status] || 0) + 1;

          return acc;
        }, {})
      );

      console.log("==============================================");

      setAssignments(assignmentData || []);
    } catch (error) {
      console.error("Registrar dashboard error:", error);
    } finally {
      setLoading(false);
    }
  };

  // ================================================================
  // HELPERS
  // ================================================================

  const getStudentName = (student) => {
    const user = student?.users;

    if (!user) {
      return student?.student_id || "Unknown Student";
    }

    return (
      [user.first_name, user.middle_name, user.last_name]
        .filter(Boolean)
        .join(" ") ||
      student.student_id ||
      "Unknown Student"
    );
  };

  const getApplicationStudentName = (application) => {
    return getStudentName(application?.students);
  };

  const getAssignmentStudentName = (assignment) => {
    return getStudentName(assignment?.students);
  };

  const formatTimeAgo = (dateValue) => {
    if (!dateValue) return "";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    const diff = Date.now() - date.getTime();

    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hr${hours > 1 ? "s" : ""} ago`;
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // ================================================================
  // DASHBOARD ANALYTICS
  // ================================================================

  const analytics = useMemo(() => {
    // ------------------------------------------------------------
    // PENDING APPLICATIONS
    // ------------------------------------------------------------
    // "submitted" is the actual pending/review status.
    // ------------------------------------------------------------

    const pendingApplications = applications.filter((application) => {
      const status = String(application.status || "").toLowerCase();

      return status === "submitted";
    }).length;

    // ------------------------------------------------------------
    // PENDING DEPLOYMENT
    // ------------------------------------------------------------
    // These are approved applications that already have an assignment
    // whose assignment status is still "pending".
    // ------------------------------------------------------------

    const pendingAssignments = assignments.filter(
      (assignment) =>
        String(assignment.status || "").toLowerCase() === "pending"
    ).length;

    // ------------------------------------------------------------
    // ACTIVE INTERNSHIPS
    // ------------------------------------------------------------

    const activeAssignments = assignments.filter((assignment) =>
      ["active", "suspended"].includes(
        String(assignment.status || "").toLowerCase()
      )
    ).length;

    // ------------------------------------------------------------
    // COMPLETED INTERNSHIPS
    // ------------------------------------------------------------

    const completedAssignments = assignments.filter(
      (assignment) =>
        String(assignment.status || "").toLowerCase() === "completed"
    ).length;

    // ------------------------------------------------------------
    // CURRENT STUDENT INTERNSHIP STATUS
    //
    // This is used by the Internship Summary.
    //
    // Priority:
    // 1. Active assignment
    // 2. Pending deployment assignment
    // 3. Completed assignment
    // 4. Submitted application
    // 5. Not started
    //
    // This prevents one student from being counted multiple times.
    // ------------------------------------------------------------

    const assignmentByStudent = new Map();

    assignments.forEach((assignment) => {
      const studentId = assignment.student_id;

      if (!studentId) return;

      const existing = assignmentByStudent.get(studentId);

      if (!existing) {
        assignmentByStudent.set(studentId, assignment);
        return;
      }

      const existingDate = new Date(
        existing.updated_at || existing.created_at || 0
      ).getTime();

      const currentDate = new Date(
        assignment.updated_at || assignment.created_at || 0
      ).getTime();

      if (currentDate > existingDate) {
        assignmentByStudent.set(studentId, assignment);
      }
    });

    const applicationByStudent = new Map();

    applications.forEach((application) => {
      const studentId = application.student_id;

      if (!studentId) return;

      const existing = applicationByStudent.get(studentId);

      if (!existing) {
        applicationByStudent.set(studentId, application);
        return;
      }

      const existingDate = new Date(
        existing.updated_at ||
          existing.submitted_at ||
          existing.created_at ||
          0
      ).getTime();

      const currentDate = new Date(
        application.updated_at ||
          application.submitted_at ||
          application.created_at ||
          0
      ).getTime();

      if (currentDate > existingDate) {
        applicationByStudent.set(studentId, application);
      }
    });

    let summaryActive = 0;
    let summaryPending = 0;
    let summaryCompleted = 0;

    students.forEach((student) => {
      const studentId = student.id;

      const assignment = assignmentByStudent.get(studentId);
      const application = applicationByStudent.get(studentId);

      // ----------------------------------------------------------
      // ASSIGNMENT STATUS TAKES PRIORITY
      // ----------------------------------------------------------

      if (assignment) {
        const assignmentStatus = String(
          assignment.status || ""
        ).toLowerCase();

        if (assignmentStatus === "active") {
          summaryActive++;
          return;
        }

        if (assignmentStatus === "suspended") {
          // Suspended internship is still an ongoing assignment.
          summaryActive++;
          return;
        }

        if (assignmentStatus === "pending") {
          summaryPending++;
          return;
        }

        if (assignmentStatus === "completed") {
          summaryCompleted++;
          return;
        }

        // Terminated assignment does not count as active,
        // pending, or completed.
      }

      // ----------------------------------------------------------
      // NO ASSIGNMENT
      // ----------------------------------------------------------
      // A submitted application means the student is currently
      // pending in the internship lifecycle.
      // ----------------------------------------------------------

      if (application) {
        const applicationStatus = String(
          application.status || ""
        ).toLowerCase();

        if (
          applicationStatus === "submitted" ||
          applicationStatus === "info_requested"
        ) {
          summaryPending++;
        }
      }
    });

    return {
      students: students.length,
      pendingApplications,
      pendingAssignments,
      activeAssignments,
      completedAssignments,

      // Internship Summary
      summaryActive,
      summaryPending,
      summaryCompleted,
    };
  }, [students, applications, assignments]);

  // ================================================================
  // STUDENT PROGRESS
  // ================================================================

  const progress = useMemo(() => {
    const assignmentByStudent = new Map();

    assignments.forEach((assignment) => {
      const studentId = assignment.student_id;

      if (!studentId) return;

      const existing = assignmentByStudent.get(studentId);

      if (!existing) {
        assignmentByStudent.set(studentId, assignment);
        return;
      }

      const existingDate = new Date(
        existing.updated_at || existing.created_at || 0
      ).getTime();

      const currentDate = new Date(
        assignment.updated_at || assignment.created_at || 0
      ).getTime();

      if (currentDate > existingDate) {
        assignmentByStudent.set(studentId, assignment);
      }
    });

    const applicationByStudent = new Map();

    applications.forEach((application) => {
      const studentId = application.student_id;

      if (!studentId) return;

      const existing = applicationByStudent.get(studentId);

      if (!existing) {
        applicationByStudent.set(studentId, application);
        return;
      }

      const existingDate = new Date(
        existing.updated_at ||
          existing.submitted_at ||
          existing.created_at ||
          0
      ).getTime();

      const currentDate = new Date(
        application.updated_at ||
          application.submitted_at ||
          application.created_at ||
          0
      ).getTime();

      if (currentDate > existingDate) {
        applicationByStudent.set(studentId, application);
      }
    });

    let completed = 0;
    let active = 0;
    let pending = 0;
    let needsAttention = 0;
    let notStarted = 0;

    students.forEach((student) => {
      const assignment = assignmentByStudent.get(student.id);
      const application = applicationByStudent.get(student.id);

      if (assignment) {
        const status = String(assignment.status || "").toLowerCase();

        if (status === "completed") {
          completed++;
          return;
        }

        if (status === "active") {
          active++;
          return;
        }

        if (status === "pending") {
          pending++;
          return;
        }

        if (status === "suspended" || status === "terminated") {
          needsAttention++;
          return;
        }
      }

      // No assignment yet.
      // A submitted/info-requested application is still pending.
      if (application) {
        const applicationStatus = String(
          application.status || ""
        ).toLowerCase();

        if (
          applicationStatus === "submitted" ||
          applicationStatus === "info_requested"
        ) {
          pending++;
          return;
        }
      }

      notStarted++;
    });

    return {
      completed,
      active,
      pending,
      needsAttention,
      notStarted,
      total: students.length,
    };
  }, [students, applications, assignments]);

  const progressItems = [
    {
      label: "Completed",
      value: progress.completed,
      dot: "bg-emerald-500",
    },
    {
      label: "Active",
      value: progress.active,
      dot: "bg-blue-500",
    },
    {
      label: "Pending Deployment",
      value: progress.pending,
      dot: "bg-amber-500",
    },
    {
      label: "Needs Attention",
      value: progress.needsAttention,
      dot: "bg-red-500",
    },
    {
      label: "Not Started",
      value: progress.notStarted,
      dot: darkMode ? "bg-slate-600" : "bg-slate-300",
    },
  ];

  // ================================================================
  // RECENT ACTIVITY
  // ================================================================

  const recentActivities = useMemo(() => {
    const activities = [];

    // --------------------------------------------------------------
    // APPLICATION ACTIVITIES
    // --------------------------------------------------------------

    applications.forEach((application) => {
      const studentName = getApplicationStudentName(application);

      const status = String(application.status || "").toLowerCase();

      let activity = "Updated an internship application";
      let icon = "📝";
      let color = darkMode
        ? "bg-blue-950/50 text-blue-400"
        : "bg-blue-50 text-blue-600";

      if (status === "submitted") {
        activity = "Submitted an internship application";
        icon = "📝";
        color = darkMode
          ? "bg-purple-950/50 text-purple-400"
          : "bg-purple-50 text-purple-600";
      } else if (status === "approved") {
        activity = "Application was approved";
        icon = "✓";
        color = darkMode
          ? "bg-emerald-950/50 text-emerald-400"
          : "bg-emerald-50 text-emerald-600";
      } else if (status === "rejected") {
        activity = "Application was rejected";
        icon = "!";
        color = darkMode
          ? "bg-red-950/50 text-red-400"
          : "bg-red-50 text-red-600";
      } else if (status === "info_requested") {
        activity = "Application needs additional information";
        icon = "!";
        color = darkMode
          ? "bg-amber-950/50 text-amber-400"
          : "bg-amber-50 text-amber-600";
      } else if (status === "draft") {
        activity = "Started an internship application";
        icon = "📝";
        color = darkMode
          ? "bg-slate-800 text-slate-400"
          : "bg-slate-50 text-slate-500";
      }

      activities.push({
        id: `application-${application.id}`,
        student: studentName,
        activity,
        time: formatTimeAgo(
          application.updated_at ||
            application.submitted_at ||
            application.created_at
        ),
        date:
          application.updated_at ||
          application.submitted_at ||
          application.created_at,
        icon,
        color,
      });
    });

    // --------------------------------------------------------------
    // ASSIGNMENT ACTIVITIES
    // --------------------------------------------------------------

    assignments.forEach((assignment) => {
      const studentName = getAssignmentStudentName(assignment);

      const status = String(assignment.status || "").toLowerCase();

      let activity = "Internship assignment updated";
      let icon = "📋";
      let color = darkMode
        ? "bg-blue-950/50 text-blue-400"
        : "bg-blue-50 text-blue-600";

      if (status === "pending") {
        activity = "Placement is waiting for deployment";
        icon = "📋";
        color = darkMode
          ? "bg-amber-950/50 text-amber-400"
          : "bg-amber-50 text-amber-600";
      } else if (status === "active") {
        activity = "Internship is now active";
        icon = "✓";
        color = darkMode
          ? "bg-blue-950/50 text-blue-400"
          : "bg-blue-50 text-blue-600";
      } else if (status === "completed") {
        activity = "Completed the internship";
        icon = "✓";
        color = darkMode
          ? "bg-emerald-950/50 text-emerald-400"
          : "bg-emerald-50 text-emerald-600";
      } else if (status === "suspended") {
        activity = "Internship was suspended";
        icon = "!";
        color = darkMode
          ? "bg-amber-950/50 text-amber-400"
          : "bg-amber-50 text-amber-600";
      } else if (status === "terminated") {
        activity = "Internship was terminated";
        icon = "!";
        color = darkMode
          ? "bg-red-950/50 text-red-400"
          : "bg-red-50 text-red-600";
      }

      activities.push({
        id: `assignment-${assignment.id}`,
        student: studentName,
        activity,
        time: formatTimeAgo(assignment.updated_at || assignment.created_at),
        date: assignment.updated_at || assignment.created_at,
        icon,
        color,
      });
    });

    return activities
      .sort(
        (a, b) =>
          new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
      )
      .slice(0, 6);
  }, [applications, assignments, darkMode]);

  // ================================================================
  // SHARED STYLES
  // ================================================================

  const cardClass = `rounded-2xl border p-6 transition-colors duration-300 ${
    darkMode ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"
  }`;

  const headingClass = darkMode ? "text-white" : "text-slate-900";

  const bodyTextClass = darkMode ? "text-slate-400" : "text-slate-500";

  const mutedTextClass = darkMode ? "text-slate-500" : "text-slate-400";

  // ================================================================
  // LOADING
  // ================================================================

  if (loading) {
    return (
      <div
        className={`min-h-[60vh] flex items-center justify-center ${
          darkMode ? "text-slate-100" : "text-slate-900"
        }`}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-blue-500" />

          <p className={`text-sm ${bodyTextClass}`}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // ================================================================
  // RENDER
  // ================================================================

  return (
    <div
      className={`p-5 md:p-6 lg:p-8 max-w-[1600px] mx-auto transition-colors duration-300 ${
        darkMode ? "text-slate-100" : "text-slate-900"
      }`}
    >
      {/* =========================================================
          WELCOME HEADER
      ========================================================= */}

      <section className="mb-8">
        <p className="text-sm font-medium text-blue-500 mb-2">
          Registrar Dashboard
        </p>

        <h1 className={`text-3xl font-bold tracking-tight ${headingClass}`}>
          Welcome back, {registrarName}! 👋
        </h1>

        <p className={`mt-2 ${bodyTextClass}`}>
          Here's an overview of the internship activities and students under
          your school.
        </p>

        {schoolName && (
          <p className={`mt-1 text-sm ${mutedTextClass}`}>{schoolName}</p>
        )}
      </section>

      {/* =========================================================
          ANALYTICS CARDS
      ========================================================= */}

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        {/* ASSIGNED STUDENTS */}

        <div className={`${cardClass} hover:shadow-md`}>
          <div className="flex items-start justify-between">
            <div>
              <p className={`text-sm font-medium ${bodyTextClass}`}>
                Assigned Students
              </p>

              <p className={`text-3xl font-bold mt-2 ${headingClass}`}>
                {analytics.students}
              </p>

              <p className={`text-xs mt-1 ${mutedTextClass}`}>
                Students in your school
              </p>
            </div>

            <div
              className={`w-12 h-12 rounded-xl ${
                darkMode ? "bg-blue-950/50" : "bg-blue-50"
              } flex items-center justify-center text-lg`}
            >
              👥
            </div>
          </div>
        </div>

        {/* PENDING APPLICATIONS */}

        <div className={`${cardClass} hover:shadow-md`}>
          <div className="flex items-start justify-between">
            <div>
              <p className={`text-sm font-medium ${bodyTextClass}`}>
                Pending Applications
              </p>

              <p className={`text-3xl font-bold mt-2 ${headingClass}`}>
                {analytics.pendingApplications}
              </p>

              <p className={`text-xs mt-1 ${mutedTextClass}`}>
                Waiting for review
              </p>
            </div>

            <div
              className={`w-12 h-12 rounded-xl ${
                darkMode ? "bg-amber-950/50" : "bg-amber-50"
              } flex items-center justify-center text-lg`}
            >
              📝
            </div>
          </div>
        </div>

        {/* PENDING DEPLOYMENT */}

        <div className={`${cardClass} hover:shadow-md`}>
          <div className="flex items-start justify-between">
            <div>
              <p className={`text-sm font-medium ${bodyTextClass}`}>
                Pending Deployment
              </p>

              <p className={`text-3xl font-bold mt-2 ${headingClass}`}>
                {analytics.pendingAssignments}
              </p>

              <p className={`text-xs mt-1 ${mutedTextClass}`}>
                Ready for deployment
              </p>
            </div>

            <div
              className={`w-12 h-12 rounded-xl ${
                darkMode ? "bg-purple-950/50" : "bg-purple-50"
              } flex items-center justify-center text-lg`}
            >
              📋
            </div>
          </div>
        </div>

        {/* ACTIVE INTERNSHIPS */}

        <div className={`${cardClass} hover:shadow-md`}>
          <div className="flex items-start justify-between">
            <div>
              <p className={`text-sm font-medium ${bodyTextClass}`}>
                Active Internships
              </p>

              <p className={`text-3xl font-bold mt-2 ${headingClass}`}>
                {analytics.activeAssignments}
              </p>

              <p className={`text-xs mt-1 ${mutedTextClass}`}>
                Currently deployed
              </p>
            </div>

            <div
              className={`w-12 h-12 rounded-xl ${
                darkMode ? "bg-emerald-950/50" : "bg-emerald-50"
              } flex items-center justify-center text-lg`}
            >
              💼
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          PROGRESS + INTERNSHIP SUMMARY
      ========================================================= */}

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        {/* STUDENT PROGRESS */}

        <div className={cardClass}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className={`font-bold text-lg ${headingClass}`}>
                Student Progress
              </h2>

              <p className={`text-sm mt-1 ${mutedTextClass}`}>
                Current internship status of your students
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-8">
            {/* DONUT */}

            <div className="relative w-40 h-40 flex-shrink-0">
              <div
                className="w-full h-full rounded-full"
                style={{
                  background: (() => {
                    const total = Math.max(progress.total, 1);

                    const completedDeg = (progress.completed / total) * 360;
                    const activeDeg = (progress.active / total) * 360;
                    const pendingDeg = (progress.pending / total) * 360;
                    const attentionDeg =
                      (progress.needsAttention / total) * 360;

                    const completedEnd = completedDeg;
                    const activeEnd = completedEnd + activeDeg;
                    const pendingEnd = activeEnd + pendingDeg;
                    const attentionEnd = pendingEnd + attentionDeg;

                    return `conic-gradient(
                      #10b981 0deg ${completedEnd}deg,
                      #3b82f6 ${completedEnd}deg ${activeEnd}deg,
                      #f59e0b ${activeEnd}deg ${pendingEnd}deg,
                      #ef4444 ${pendingEnd}deg ${attentionEnd}deg,
                      #94a3b8 ${attentionEnd}deg 360deg
                    )`;
                  })(),
                }}
              />

              <div
                className={`absolute inset-5 rounded-full flex flex-col items-center justify-center ${
                  darkMode ? "bg-slate-900" : "bg-white"
                }`}
              >
                <span className={`text-3xl font-bold ${headingClass}`}>
                  {progress.total}
                </span>

                <span className={`text-xs ${mutedTextClass}`}>Students</span>
              </div>
            </div>

            {/* LEGEND */}

            <div className="space-y-4 flex-1 w-full">
              {progressItems.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${item.dot}`} />

                    <span
                      className={`text-sm ${
                        darkMode ? "text-slate-300" : "text-slate-600"
                      }`}
                    >
                      {item.label}
                    </span>
                  </div>

                  <span className={`font-bold ${headingClass}`}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* INTERNSHIP SUMMARY */}

        <div className={cardClass}>
          <div className="mb-6">
            <h2 className={`font-bold text-lg ${headingClass}`}>
              Internship Summary
            </h2>

            <p className={`text-sm mt-1 ${mutedTextClass}`}>
              Current status of your students' internships
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* ACTIVE */}

            <div
              className={`rounded-xl border p-5 ${
                darkMode
                  ? "border-blue-900 bg-blue-950/30"
                  : "border-blue-100 bg-blue-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    darkMode ? "bg-blue-950" : "bg-white"
                  }`}
                >
                  💼
                </div>

                <div>
                  <p className={`text-xs ${mutedTextClass}`}>Active</p>

                  <p className={`text-2xl font-bold ${headingClass}`}>
                    {analytics.summaryActive}
                  </p>
                </div>
              </div>
            </div>

            {/* PENDING */}

            <div
              className={`rounded-xl border p-5 ${
                darkMode
                  ? "border-amber-900 bg-amber-950/30"
                  : "border-amber-100 bg-amber-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    darkMode ? "bg-amber-950" : "bg-white"
                  }`}
                >
                  📋
                </div>

                <div>
                  <p className={`text-xs ${mutedTextClass}`}>Pending</p>

                  <p className={`text-2xl font-bold ${headingClass}`}>
                    {analytics.summaryPending}
                  </p>
                </div>
              </div>
            </div>

            {/* COMPLETED */}

            <div
              className={`rounded-xl border p-5 ${
                darkMode
                  ? "border-emerald-900 bg-emerald-950/30"
                  : "border-emerald-100 bg-emerald-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    darkMode ? "bg-emerald-950" : "bg-white"
                  }`}
                >
                  ✓
                </div>

                <div>
                  <p className={`text-xs ${mutedTextClass}`}>Completed</p>

                  <p className={`text-2xl font-bold ${headingClass}`}>
                    {analytics.summaryCompleted}
                  </p>
                </div>
              </div>
            </div>

            {/* TOTAL */}

            <div
              className={`rounded-xl border p-5 ${
                darkMode
                  ? "border-slate-700 bg-slate-800/50"
                  : "border-slate-200 bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    darkMode ? "bg-slate-700" : "bg-white"
                  }`}
                >
                  👥
                </div>

                <div>
                  <p className={`text-xs ${mutedTextClass}`}>Total Students</p>

                  <p className={`text-2xl font-bold ${headingClass}`}>
                    {analytics.students}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          RECENT ACTIVITY + ACTIONS
      ========================================================= */}

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* RECENT ACTIVITY */}

        <div
          className={`xl:col-span-2 rounded-2xl border overflow-hidden transition-colors duration-300 ${
            darkMode
              ? "bg-slate-900 border-slate-700"
              : "bg-white border-slate-200"
          }`}
        >
          <div className="p-6 flex items-center justify-between">
            <div>
              <h2 className={`font-bold text-lg ${headingClass}`}>
                Recent Activity
              </h2>

              <p className={`text-sm mt-1 ${mutedTextClass}`}>
                Latest internship activities from your students
              </p>
            </div>
          </div>

          <div
            className={`divide-y ${
              darkMode ? "divide-slate-700" : "divide-slate-100"
            }`}
          >
            {recentActivities.length > 0 ? (
              recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className={`px-6 py-4 flex items-center gap-3 transition ${
                    darkMode ? "hover:bg-slate-800" : "hover:bg-slate-50"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${activity.color}`}
                  >
                    {activity.icon}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-semibold ${headingClass}`}>
                      {activity.student}
                    </p>

                    <p
                      className={`text-xs mt-1 ${
                        darkMode ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
                      {activity.activity}
                    </p>
                  </div>

                  <span
                    className={`text-[10px] whitespace-nowrap ${mutedTextClass}`}
                  >
                    {activity.time}
                  </span>
                </div>
              ))
            ) : (
              <div className="px-6 py-10 text-center">
                <div className="text-3xl mb-2">📭</div>

                <p className={`text-sm font-medium ${headingClass}`}>
                  No recent activity
                </p>

                <p className={`text-xs mt-1 ${mutedTextClass}`}>
                  Student internship activities will appear here.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* REGISTRAR ACTIONS */}

        <div className={cardClass}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className={`font-bold text-lg ${headingClass}`}>
                Registrar Actions
              </h2>

              <p className={`text-sm mt-1 ${mutedTextClass}`}>
                Tasks that need your attention
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* APPLICATIONS */}

            <div
              className={`flex items-start gap-3 p-4 rounded-xl border ${
                analytics.pendingApplications > 0
                  ? darkMode
                    ? "bg-amber-950/30 border-amber-900"
                    : "bg-amber-50 border-amber-100"
                  : darkMode
                  ? "bg-slate-800/50 border-slate-700"
                  : "bg-slate-50 border-slate-200"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  darkMode ? "bg-slate-800" : "bg-white"
                }`}
              >
                📝
              </div>

              <div>
                <p className={`font-semibold text-sm ${headingClass}`}>
                  Pending Applications
                </p>

                <p
                  className={`text-xs mt-1 ${
                    darkMode ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  {analytics.pendingApplications > 0
                    ? `${analytics.pendingApplications} application${
                        analytics.pendingApplications > 1 ? "s" : ""
                      } waiting for review.`
                    : "No applications are waiting for review."}
                </p>
              </div>
            </div>

            {/* DEPLOYMENT */}

            <div
              className={`flex items-start gap-3 p-4 rounded-xl border ${
                analytics.pendingAssignments > 0
                  ? darkMode
                    ? "bg-purple-950/30 border-purple-900"
                    : "bg-purple-50 border-purple-100"
                  : darkMode
                  ? "bg-slate-800/50 border-slate-700"
                  : "bg-slate-50 border-slate-200"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  darkMode ? "bg-slate-800" : "bg-white"
                }`}
              >
                📋
              </div>

              <div>
                <p className={`font-semibold text-sm ${headingClass}`}>
                  Pending Deployment
                </p>

                <p
                  className={`text-xs mt-1 ${
                    darkMode ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  {analytics.pendingAssignments > 0
                    ? `${analytics.pendingAssignments} student${
                        analytics.pendingAssignments > 1 ? "s" : ""
                      } waiting for deployment.`
                    : "No students are waiting for deployment."}
                </p>
              </div>
            </div>

            {/* ACTIVE */}

            <div
              className={`flex items-start gap-3 p-4 rounded-xl border ${
                darkMode
                  ? "bg-blue-950/30 border-blue-900"
                  : "bg-blue-50 border-blue-100"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  darkMode ? "bg-slate-800" : "bg-white"
                }`}
              >
                💼
              </div>

              <div>
                <p className={`font-semibold text-sm ${headingClass}`}>
                  Active Internships
                </p>

                <p
                  className={`text-xs mt-1 ${
                    darkMode ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  {analytics.activeAssignments > 0
                    ? `${analytics.activeAssignments} active internship${
                        analytics.activeAssignments > 1 ? "s" : ""
                      } currently ongoing.`
                    : "There are no active internships."}
                </p>
              </div>
            </div>

            {/* COMPLETED */}

            <div
              className={`flex items-start gap-3 p-4 rounded-xl border ${
                darkMode
                  ? "bg-emerald-950/30 border-emerald-900"
                  : "bg-emerald-50 border-emerald-100"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  darkMode ? "bg-slate-800" : "bg-white"
                }`}
              >
                🎓
              </div>

              <div>
                <p className={`font-semibold text-sm ${headingClass}`}>
                  Completed Internships
                </p>

                <p
                  className={`text-xs mt-1 ${
                    darkMode ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  {analytics.completedAssignments > 0
                    ? `${analytics.completedAssignments} internship${
                        analytics.completedAssignments > 1 ? "s" : ""
                      } completed.`
                    : "No completed internships yet."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          TIP
      ========================================================= */}

      <div
        className={`mt-6 rounded-2xl p-4 flex items-center gap-3 border ${
          darkMode
            ? "bg-blue-950/30 border-blue-900"
            : "bg-blue-50 border-blue-100"
        }`}
      >
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            darkMode ? "bg-slate-800" : "bg-white"
          }`}
        >
          💡
        </div>

        <div>
          <p
            className={`text-sm font-bold ${
              darkMode ? "text-blue-300" : "text-blue-900"
            }`}
          >
            Registrar Tip
          </p>

          <p
            className={`text-sm ${
              darkMode ? "text-blue-400" : "text-blue-700"
            }`}
          >
            Keep an eye on pending applications and deployments, then monitor
            active internships until students complete their requirements.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

