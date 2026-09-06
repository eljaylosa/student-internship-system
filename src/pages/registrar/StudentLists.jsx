import React, { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabaseRegistrar } from "../../supabaseClient";

const StudentLists = () => {
  const { darkMode } = useOutletContext();

  // =========================================================
  // STATE
  // =========================================================

  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedStudent, setSelectedStudent] = useState(null);

  // =========================================================
  // THEME CLASSES
  // =========================================================

  const headingClass = darkMode ? "text-slate-100" : "text-slate-900";

  const mutedClass = darkMode ? "text-slate-400" : "text-slate-500";

  const mainContainerClass = darkMode
    ? "bg-slate-900 border-slate-700"
    : "bg-white border-slate-300";

  const filterContainerClass = darkMode
    ? "bg-slate-800 border-slate-700"
    : "bg-slate-50 border-slate-200";

  const inputClass = darkMode
    ? "bg-slate-900 border-slate-700 text-slate-200 placeholder:text-slate-500 focus:border-slate-500 focus:ring-slate-700"
    : "bg-white border-slate-300 text-slate-800 placeholder:text-slate-400 focus:border-slate-700 focus:ring-slate-100";

  const tableHeaderClass = darkMode
    ? "bg-slate-800 border-slate-700 text-slate-300"
    : "bg-slate-100 border-slate-200 text-slate-600";

  const tableRowClass = darkMode
    ? "border-slate-700 hover:bg-slate-800/70"
    : "border-slate-200 hover:bg-slate-50";

  const tableTextClass = darkMode ? "text-slate-100" : "text-slate-900";

  // =========================================================
  // LOAD STUDENTS
  // =========================================================

  useEffect(() => {
    loadStudents();
  }, []);

  const formatDate = (value) => {
    if (!value) return "Not set";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "Not set";
    }

    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const getProgress = (assignment) => {
    if (!assignment) return 0;

    const status = assignment.status?.toLowerCase();

    if (status === "completed") return 100;

    if (status !== "active" && status !== "suspended") {
      return 0;
    }

    if (!assignment.start_date || !assignment.end_date) {
      return 0;
    }

    const start = new Date(`${assignment.start_date}T00:00:00`);
    const end = new Date(`${assignment.end_date}T23:59:59`);
    const now = new Date();

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      end <= start
    ) {
      return 0;
    }

    const total = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();

    return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
  };

  const loadStudents = async () => {
    setLoading(true);

    try {
      // =======================================================
      // 1. GET AUTH USER
      // =======================================================

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

      // =======================================================
      // 2. GET REGISTRAR SCHOOL
      // =======================================================

      const { data: registrarData, error: registrarError } =
        await supabaseRegistrar
          .from("registrars")
          .select("id, school_id")
          .eq("id", user.id)
          .maybeSingle();

      if (registrarError) {
        throw registrarError;
      }

      if (!registrarData) {
        throw new Error("Registrar profile could not be found.");
      }

      if (!registrarData.school_id) {
        setStudents([]);
        return;
      }

      const schoolId = registrarData.school_id;

      // =======================================================
      // 3. LOAD ALL STUDENTS IN THIS REGISTRAR'S CAMPUS
      // =======================================================

      const { data: studentData, error: studentError } = await supabaseRegistrar
        .from("students")
        .select(
          `
            id,
            student_id,
            program,
            year_level,
            department,
            phone,
            address,
            emergency_contact,
            gwa,
            school_id,
            created_at,
            users (
              id,
              email,
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

      // =======================================================
      // 4. LOAD APPLICATIONS FOR THIS CAMPUS
      // =======================================================

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
            opportunities (
              id,
              title,
              company_id,
              companies (
                id,
                company_name
              )
            ),
            students!inner (
              id,
              school_id
            )
          `
          )
          .eq("students.school_id", schoolId)
          .order("updated_at", { ascending: false });

      if (applicationError) {
        throw applicationError;
      }

      // =======================================================
      // 5. LOAD ASSIGNMENTS FOR THIS CAMPUS
      // =======================================================

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
              school_id
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

      // =======================================================
      // 6. INDEX LATEST APPLICATION / ASSIGNMENT PER STUDENT
      // =======================================================

      const latestAssignments = new Map();

      (assignmentData || []).forEach((assignment) => {
        if (!latestAssignments.has(assignment.student_id)) {
          latestAssignments.set(assignment.student_id, assignment);
        }
      });

      const latestApplications = new Map();

      (applicationData || []).forEach((application) => {
        if (!latestApplications.has(application.student_id)) {
          latestApplications.set(application.student_id, application);
        }
      });

      // =======================================================
      // 7. BUILD STUDENT LIST
      // =======================================================

      const formattedStudents = (studentData || []).map((student) => {
        const userRecord = Array.isArray(student.users)
          ? student.users[0]
          : student.users;

        const assignment = latestAssignments.get(student.id);
        const application = latestApplications.get(student.id);

        const studentName = [
          userRecord?.first_name,
          userRecord?.middle_name,
          userRecord?.last_name,
        ]
          .filter(Boolean)
          .join(" ")
          .trim();

        const assignmentStatus = assignment?.status?.toLowerCase();
        const applicationStatus = application?.status?.toLowerCase();

        let status = "Not Started";

        if (assignmentStatus === "active" || assignmentStatus === "suspended") {
          status = "Active";
        } else if (assignmentStatus === "completed") {
          status = "Completed";
        } else if (assignmentStatus === "terminated") {
          status = "Terminated";
        } else if (assignmentStatus === "pending") {
          status = "Pending";
        } else if (
          applicationStatus === "submitted" ||
          applicationStatus === "info_requested" ||
          applicationStatus === "approved"
        ) {
          status = "Pending";
        }

        const progress = getProgress(assignment);

        const company =
          assignment?.companies?.company_name ||
          application?.opportunities?.companies?.company_name ||
          "Not assigned";

        const position =
          assignment?.opportunities?.title ||
          application?.opportunities?.title ||
          "No internship opportunity";

        const startDate = assignment?.start_date || null;

        return {
          uuid: student.id,
          id: student.student_id || "N/A",
          name: studentName || "Unknown Student",
          email: userRecord?.email || "No email",
          status,
          progress,
          program: student.program || "Not specified",
          yearLevel: student.year_level || "Not specified",
          department: student.department || "Not specified",
          company,
          position,
          startDate: startDate ? formatDate(startDate) : "Not started",
          rawStartDate: startDate,
          endDate: assignment?.end_date
            ? formatDate(assignment.end_date)
            : "Not set",
          phone: student.phone || "Not provided",
          address: student.address || "Not provided",
          emergencyContact: student.emergency_contact || "Not provided",
          gwa:
            student.gwa !== null && student.gwa !== undefined
              ? String(student.gwa)
              : "Not available",
          assignmentStatus: assignment?.status || null,
          applicationStatus: application?.status || null,
          assignmentId: assignment?.id || null,
          applicationId: application?.id || null,
        };
      });

      setStudents(formattedStudents);

      console.log("👥 Campus-scoped students loaded:", formattedStudents);
    } catch (error) {
      console.error("❌ Load student list error:", error);
      setStudents([]);
      alert(error.message || "Unable to load students.");
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // SEARCH + FILTER
  // =========================================================

  const filteredStudents = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return students.filter((student) => {
      const matchesSearch =
        !query ||
        student.id.toLowerCase().includes(query) ||
        student.name.toLowerCase().includes(query) ||
        student.email.toLowerCase().includes(query) ||
        student.program.toLowerCase().includes(query) ||
        student.yearLevel.toLowerCase().includes(query) ||
        student.department.toLowerCase().includes(query) ||
        student.company.toLowerCase().includes(query) ||
        student.position.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "All" || student.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [students, searchQuery, statusFilter]);

  // =========================================================
  // STATUS STYLE
  // =========================================================

  const getStatusClass = (status) => {
    if (darkMode) {
      if (status === "Active") {
        return "bg-emerald-900/40 text-emerald-300 border-emerald-800";
      }

      if (status === "Pending") {
        return "bg-amber-900/40 text-amber-300 border-amber-800";
      }

      if (status === "Completed") {
        return "bg-blue-900/40 text-blue-300 border-blue-800";
      }

      return "bg-slate-800 text-slate-400 border-slate-700";
    }

    if (status === "Active") {
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }

    if (status === "Pending") {
      return "bg-amber-50 text-amber-700 border-amber-200";
    }

    if (status === "Completed") {
      return "bg-blue-50 text-blue-700 border-blue-200";
    }

    return "bg-slate-100 text-slate-500 border-slate-200";
  };

  // =========================================================
  // PROGRESS STYLE
  // =========================================================

  const getProgressClass = (progress) => {
    if (progress >= 100) {
      return darkMode ? "bg-emerald-500" : "bg-emerald-600";
    }

    if (progress >= 75) {
      return darkMode ? "bg-blue-500" : "bg-blue-600";
    }

    if (progress >= 50) {
      return darkMode ? "bg-slate-400" : "bg-slate-600";
    }

    return darkMode ? "bg-amber-500" : "bg-amber-600";
  };

  // =========================================================
  // VIEW STUDENT
  // =========================================================

  const handleViewStudent = (student) => {
    setSelectedStudent(student);
  };

  const closeStudentModal = () => {
    setSelectedStudent(null);
  };

  // =========================================================
  // CLEAR FILTERS
  // =========================================================

  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("All");
  };

  // =========================================================
  // EXPORT LIST
  // =========================================================

  const handleExportList = () => {
    if (filteredStudents.length === 0) return;

    const headers = [
      "Student ID",
      "Student Name",
      "Email",
      "Status",
      "Progress",
      "Program",
      "Assigned Company",
      "Position",
      "Start Date",
      "End Date",
      "Year Level",
      "Department",
      "GWA",
    ];

    const rows = filteredStudents.map((student) => [
      student.id,
      student.name,
      student.email,
      student.status,
      `${student.progress}%`,
      student.program,
      student.company,
      student.position,
      student.startDate,
      student.endDate,
      student.yearLevel,
      student.department,
      student.gwa,
    ]);

    const csvContent = [headers, ...rows]
      .map((row) =>
        row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "student-list.csv";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  // =========================================================
  // RENDER
  // =========================================================

  if (loading) {
    return (
      <div className="w-full min-h-full p-3 sm:p-5 md:p-6 lg:p-8">
        <div
          className={`max-w-[1400px] mx-auto border rounded-xl p-10 text-center ${mainContainerClass}`}
        >
          <div className="text-2xl mb-3">⏳</div>
          <h2 className={`text-sm font-bold ${headingClass}`}>
            Loading Student List...
          </h2>
          <p className={`text-xs mt-1 ${mutedClass}`}>
            Loading students from your assigned campus.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-full p-3 sm:p-5 md:p-6 lg:p-8">
      <div className="max-w-[1400px] mx-auto">
        {/* =====================================================
            PAGE HEADER
        ===================================================== */}

        <div className="mb-5 sm:mb-6">
          <p
            className={`text-[10px] sm:text-xs uppercase tracking-widest font-bold mb-1 ${
              darkMode ? "text-slate-500" : "text-slate-400"
            }`}
          >
            Registrar Portal
          </p>

          <h1 className={`text-xl sm:text-2xl font-black ${headingClass}`}>
            Student List
          </h1>

          <p className={`text-xs sm:text-sm mt-1 ${mutedClass}`}>
            View and manage students assigned to you.
          </p>
        </div>

        {/* =====================================================
            MAIN CONTAINER
        ===================================================== */}

        <section
          className={`w-full border rounded-xl shadow-sm overflow-hidden ${mainContainerClass}`}
        >
          {/* ===================================================
              SEARCH / FILTER / EXPORT
          =================================================== */}

          <div className={`p-4 sm:p-5 border-b ${filterContainerClass}`}>
            <div className="flex flex-col lg:flex-row gap-3">
              {/* SEARCH */}

              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search students, companies, programs..."
                  className={`
                    w-full
                    h-11
                    px-4
                    pr-10
                    rounded-lg
                    border
                    text-xs
                    sm:text-sm
                    outline-none
                    transition
                    focus:ring-2
                    ${inputClass}
                  `}
                />

                <span
                  className={`absolute right-4 top-1/2 -translate-y-1/2 text-xs ${mutedClass}`}
                >
                  🔍
                </span>
              </div>

              {/* STATUS FILTER */}

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`
                  h-11
                  lg:w-44
                  px-4
                  rounded-lg
                  border
                  text-xs
                  sm:text-sm
                  outline-none
                  transition
                  focus:ring-2
                  ${inputClass}
                `}
              >
                <option
                  value="All"
                  className={
                    darkMode
                      ? "bg-slate-900 text-slate-100"
                      : "bg-white text-slate-900"
                  }
                >
                  All Status
                </option>

                <option
                  value="Active"
                  className={
                    darkMode
                      ? "bg-slate-900 text-slate-100"
                      : "bg-white text-slate-900"
                  }
                >
                  Active
                </option>

                <option
                  value="Pending"
                  className={
                    darkMode
                      ? "bg-slate-900 text-slate-100"
                      : "bg-white text-slate-900"
                  }
                >
                  Pending
                </option>

                <option
                  value="Completed"
                  className={
                    darkMode
                      ? "bg-slate-900 text-slate-100"
                      : "bg-white text-slate-900"
                  }
                >
                  Completed
                </option>
              </select>

              {/* CLEAR FILTER */}

              <button
                type="button"
                onClick={handleClearFilters}
                className={`
                  h-11
                  px-5
                  rounded-lg
                  border
                  text-xs
                  font-bold
                  transition
                  ${
                    darkMode
                      ? "border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-700 hover:text-white"
                      : "border-slate-300 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }
                `}
              >
                Clear Filter
              </button>

              {/* EXPORT */}

              <button
                type="button"
                onClick={handleExportList}
                disabled={filteredStudents.length === 0}
                className="
                  h-11
                  px-5
                  rounded-lg
                  bg-slate-800
                  text-white
                  text-xs
                  font-bold
                  transition
                  hover:bg-slate-700
                  disabled:opacity-40
                  disabled:cursor-not-allowed
                "
              >
                Export List
              </button>
            </div>
          </div>

          {/* ===================================================
              RESULT INFO
          =================================================== */}

          <div className="px-4 sm:px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <p className={`text-xs font-semibold ${mutedClass}`}>
              Showing {filteredStudents.length}{" "}
              {filteredStudents.length === 1 ? "student" : "students"}
            </p>

            {statusFilter !== "All" && (
              <span className={`text-xs font-semibold ${mutedClass}`}>
                Status: {statusFilter}
              </span>
            )}
          </div>

          {/* ===================================================
              TABLE
          =================================================== */}

          {filteredStudents.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] border-collapse">
                {/* TABLE HEADER */}

                <thead>
                  <tr className={tableHeaderClass}>
                    <th className="px-4 py-4 text-left text-[10px] font-bold uppercase tracking-wide border-b">
                      ID
                    </th>

                    <th className="px-4 py-4 text-left text-[10px] font-bold uppercase tracking-wide border-b">
                      Student Name
                    </th>

                    <th className="px-4 py-4 text-left text-[10px] font-bold uppercase tracking-wide border-b">
                      Assigned Company
                    </th>

                    <th className="px-4 py-4 text-left text-[10px] font-bold uppercase tracking-wide border-b">
                      Status
                    </th>

                    <th className="px-4 py-4 text-left text-[10px] font-bold uppercase tracking-wide border-b">
                      Progress
                    </th>

                    <th className="px-4 py-4 text-left text-[10px] font-bold uppercase tracking-wide border-b">
                      Actions
                    </th>
                  </tr>
                </thead>

                {/* TABLE BODY */}

                <tbody>
                  {filteredStudents.map((student) => (
                    <tr
                      key={student.id}
                      className={`transition ${tableRowClass}`}
                    >
                      {/* ID */}

                      <td
                        className={`px-4 py-5 text-xs font-semibold border-b ${tableTextClass}`}
                      >
                        {student.id}
                      </td>

                      {/* STUDENT NAME */}

                      <td className="px-4 py-5 border-b">
                        <div>
                          <p className={`text-xs font-bold ${tableTextClass}`}>
                            {student.name}
                          </p>

                          <p
                            className={`text-[10px] mt-1 truncate max-w-[220px] ${mutedClass}`}
                          >
                            {student.email}
                          </p>
                        </div>
                      </td>

                      {/* ASSIGNED COMPANY */}

                      <td className="px-4 py-5 border-b">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`
                              w-8
                              h-8
                              flex
                              items-center
                              justify-center
                              rounded-lg
                              text-xs
                              font-bold
                              flex-shrink-0
                              ${
                                darkMode
                                  ? "bg-slate-800 text-slate-300"
                                  : "bg-slate-100 text-slate-600"
                              }
                            `}
                          >
                            🏢
                          </div>

                          <div className="min-w-0">
                            <p
                              className={`text-xs font-bold truncate max-w-[180px] ${tableTextClass}`}
                            >
                              {student.company}
                            </p>

                            <p
                              className={`text-[10px] mt-0.5 truncate max-w-[180px] ${mutedClass}`}
                            >
                              {student.position}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* STATUS */}

                      <td className="px-4 py-5 border-b">
                        <span
                          className={`
                            inline-flex
                            items-center
                            px-2.5
                            py-1
                            rounded-md
                            border
                            text-[10px]
                            font-bold
                            ${getStatusClass(student.status)}
                          `}
                        >
                          {student.status}
                        </span>
                      </td>

                      {/* PROGRESS */}

                      <td className="px-4 py-5 border-b">
                        <div className="w-[130px]">
                          <div className="flex items-center justify-between mb-1.5">
                            <span
                              className={`text-[10px] font-semibold ${mutedClass}`}
                            >
                              Internship
                            </span>

                            <span
                              className={`text-[10px] font-bold ${tableTextClass}`}
                            >
                              {student.progress}%
                            </span>
                          </div>

                          <div
                            className={`
                              w-full
                              h-2
                              rounded-full
                              overflow-hidden
                              ${darkMode ? "bg-slate-700" : "bg-slate-200"}
                            `}
                          >
                            <div
                              className={`h-full rounded-full transition-all ${getProgressClass(
                                student.progress
                              )}`}
                              style={{
                                width: `${student.progress}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* ACTION */}

                      <td className="px-4 py-5 border-b">
                        <button
                          type="button"
                          onClick={() => handleViewStudent(student)}
                          className={`
                            px-5
                            py-2
                            rounded-lg
                            text-xs
                            font-bold
                            transition
                            ${
                              darkMode
                                ? "bg-slate-700 text-slate-100 hover:bg-slate-600"
                                : "bg-slate-800 text-white hover:bg-slate-700"
                            }
                          `}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* =================================================
               NO RESULTS
            ================================================= */

            <div
              className={`
                mx-4
                sm:mx-5
                mb-5
                border
                rounded-xl
                py-16
                text-center
                ${
                  darkMode
                    ? "border-slate-700 bg-slate-800"
                    : "border-slate-200 bg-slate-50"
                }
              `}
            >
              <div
                className={`text-3xl mb-3 ${
                  darkMode ? "text-slate-600" : "text-slate-300"
                }`}
              >
                🔍
              </div>

              <h2 className={`text-sm font-bold ${headingClass}`}>
                No students found
              </h2>

              <p className={`text-xs mt-1 ${mutedClass}`}>
                Try changing your search or status filter.
              </p>

              <button
                type="button"
                onClick={handleClearFilters}
                className="
                  mt-4
                  px-5
                  py-2.5
                  rounded-lg
                  bg-slate-800
                  text-white
                  text-xs
                  font-bold
                  hover:bg-slate-700
                  transition
                "
              >
                Reset Filters
              </button>
            </div>
          )}
        </section>
      </div>

      {/* =======================================================
          STUDENT DETAILS MODAL
      ======================================================= */}

      {selectedStudent && (
        <div
          className={`
            fixed
            inset-0
            z-50
            flex
            items-center
            justify-center
            p-4
            sm:p-5
            backdrop-blur-sm
            ${darkMode ? "bg-black/70" : "bg-slate-900/40"}
          `}
          onClick={closeStudentModal}
        >
          <div
            className={`
              w-full
              max-w-2xl
              max-h-[90vh]
              rounded-2xl
              border
              shadow-2xl
              overflow-hidden
              ${
                darkMode
                  ? "bg-slate-900 border-slate-700"
                  : "bg-white border-slate-200"
              }
            `}
            onClick={(e) => e.stopPropagation()}
          >
            {/* MODAL HEADER */}

            <div
              className={`
                px-5
                sm:px-6
                py-5
                border-b
                flex
                items-start
                justify-between
                gap-4
                ${darkMode ? "border-slate-700" : "border-slate-200"}
              `}
            >
              <div className="min-w-0">
                <p
                  className={`
                    text-[10px]
                    uppercase
                    tracking-widest
                    font-bold
                    mb-1
                    ${darkMode ? "text-slate-500" : "text-slate-400"}
                  `}
                >
                  Student Details
                </p>

                <h2 className={`text-lg sm:text-xl font-black ${headingClass}`}>
                  {selectedStudent.name}
                </h2>

                <p className={`text-xs mt-1 ${mutedClass}`}>
                  {selectedStudent.id}
                </p>
              </div>

              <button
                type="button"
                onClick={closeStudentModal}
                className={`
                  w-9
                  h-9
                  flex-shrink-0
                  rounded-lg
                  flex
                  items-center
                  justify-center
                  text-lg
                  transition
                  ${
                    darkMode
                      ? "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900"
                  }
                `}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* MODAL BODY */}

            <div className="p-5 sm:p-6 overflow-y-auto max-h-[calc(90vh-145px)]">
              {/* STATUS + PROGRESS */}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {/* STATUS */}

                <div
                  className={`
                    rounded-xl
                    border
                    p-4
                    ${
                      darkMode
                        ? "bg-slate-800 border-slate-700"
                        : "bg-slate-50 border-slate-200"
                    }
                  `}
                >
                  <p
                    className={`
                      text-[10px]
                      uppercase
                      tracking-wide
                      font-bold
                      mb-2
                      ${mutedClass}
                    `}
                  >
                    Status
                  </p>

                  <span
                    className={`
                      inline-flex
                      px-2.5
                      py-1
                      rounded-md
                      border
                      text-xs
                      font-bold
                      ${getStatusClass(selectedStudent.status)}
                    `}
                  >
                    {selectedStudent.status}
                  </span>
                </div>

                {/* PROGRESS */}

                <div
                  className={`
                    rounded-xl
                    border
                    p-4
                    ${
                      darkMode
                        ? "bg-slate-800 border-slate-700"
                        : "bg-slate-50 border-slate-200"
                    }
                  `}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p
                      className={`
                        text-[10px]
                        uppercase
                        tracking-wide
                        font-bold
                        ${mutedClass}
                      `}
                    >
                      Internship Progress
                    </p>

                    <span className={`text-xs font-bold ${headingClass}`}>
                      {selectedStudent.progress}%
                    </span>
                  </div>

                  <div
                    className={`
                      w-full
                      h-2
                      rounded-full
                      overflow-hidden
                      ${darkMode ? "bg-slate-700" : "bg-slate-200"}
                    `}
                  >
                    <div
                      className={`h-full rounded-full ${getProgressClass(
                        selectedStudent.progress
                      )}`}
                      style={{
                        width: `${selectedStudent.progress}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* ASSIGNED COMPANY CARD */}

              <div
                className={`
                  mb-6
                  rounded-xl
                  border
                  p-4
                  ${
                    darkMode
                      ? "bg-slate-800 border-slate-700"
                      : "bg-slate-50 border-slate-200"
                  }
                `}
              >
                <p
                  className={`
                    text-[10px]
                    uppercase
                    tracking-wide
                    font-bold
                    mb-3
                    ${mutedClass}
                  `}
                >
                  Internship Assignment
                </p>

                <div className="flex items-center gap-3">
                  <div
                    className={`
                      w-11
                      h-11
                      rounded-xl
                      flex
                      items-center
                      justify-center
                      text-lg
                      ${
                        darkMode
                          ? "bg-slate-700"
                          : "bg-white border border-slate-200"
                      }
                    `}
                  >
                    🏢
                  </div>

                  <div className="min-w-0">
                    <p className={`text-sm font-bold ${headingClass}`}>
                      {selectedStudent.company}
                    </p>

                    <p className={`text-xs mt-0.5 ${mutedClass}`}>
                      {selectedStudent.position}
                    </p>
                  </div>
                </div>
              </div>

              {/* DETAILS GRID */}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                {/* EMAIL */}

                <div>
                  <p
                    className={`
                      text-[10px]
                      uppercase
                      tracking-wide
                      font-bold
                      mb-1
                      ${mutedClass}
                    `}
                  >
                    Email
                  </p>

                  <p className={`text-sm font-semibold ${headingClass}`}>
                    {selectedStudent.email}
                  </p>
                </div>

                {/* PROGRAM */}

                <div>
                  <p
                    className={`
                      text-[10px]
                      uppercase
                      tracking-wide
                      font-bold
                      mb-1
                      ${mutedClass}
                    `}
                  >
                    Program
                  </p>

                  <p className={`text-sm font-semibold ${headingClass}`}>
                    {selectedStudent.program}
                  </p>
                </div>

                {/* COMPANY */}

                <div>
                  <p
                    className={`
                      text-[10px]
                      uppercase
                      tracking-wide
                      font-bold
                      mb-1
                      ${mutedClass}
                    `}
                  >
                    Assigned Company
                  </p>

                  <p className={`text-sm font-semibold ${headingClass}`}>
                    {selectedStudent.company}
                  </p>
                </div>

                {/* POSITION */}

                <div>
                  <p
                    className={`
                      text-[10px]
                      uppercase
                      tracking-wide
                      font-bold
                      mb-1
                      ${mutedClass}
                    `}
                  >
                    Internship Position
                  </p>

                  <p className={`text-sm font-semibold ${headingClass}`}>
                    {selectedStudent.position}
                  </p>
                </div>

                {/* START DATE */}

                <div>
                  <p
                    className={`
                      text-[10px]
                      uppercase
                      tracking-wide
                      font-bold
                      mb-1
                      ${mutedClass}
                    `}
                  >
                    Internship Start
                  </p>

                  <p className={`text-sm font-semibold ${headingClass}`}>
                    {selectedStudent.startDate}
                  </p>
                </div>

                {/* STUDENT ID */}

                <div>
                  <p
                    className={`
                      text-[10px]
                      uppercase
                      tracking-wide
                      font-bold
                      mb-1
                      ${mutedClass}
                    `}
                  >
                    Student ID
                  </p>

                  <p className={`text-sm font-semibold ${headingClass}`}>
                    {selectedStudent.id}
                  </p>
                </div>

                {/* YEAR LEVEL */}

                <div>
                  <p
                    className={`
                      text-[10px]
                      uppercase
                      tracking-wide
                      font-bold
                      mb-1
                      ${mutedClass}
                    `}
                  >
                    Year Level
                  </p>

                  <p className={`text-sm font-semibold ${headingClass}`}>
                    {selectedStudent.yearLevel}
                  </p>
                </div>

                {/* DEPARTMENT */}

                <div>
                  <p
                    className={`
                      text-[10px]
                      uppercase
                      tracking-wide
                      font-bold
                      mb-1
                      ${mutedClass}
                    `}
                  >
                    Department
                  </p>

                  <p className={`text-sm font-semibold ${headingClass}`}>
                    {selectedStudent.department}
                  </p>
                </div>

                {/* GWA */}

                <div>
                  <p
                    className={`
                      text-[10px]
                      uppercase
                      tracking-wide
                      font-bold
                      mb-1
                      ${mutedClass}
                    `}
                  >
                    GWA
                  </p>

                  <p className={`text-sm font-semibold ${headingClass}`}>
                    {selectedStudent.gwa}
                  </p>
                </div>

                {/* PHONE */}

                <div>
                  <p
                    className={`
                      text-[10px]
                      uppercase
                      tracking-wide
                      font-bold
                      mb-1
                      ${mutedClass}
                    `}
                  >
                    Phone
                  </p>

                  <p className={`text-sm font-semibold ${headingClass}`}>
                    {selectedStudent.phone}
                  </p>
                </div>

                {/* ADDRESS */}

                <div>
                  <p
                    className={`
                      text-[10px]
                      uppercase
                      tracking-wide
                      font-bold
                      mb-1
                      ${mutedClass}
                    `}
                  >
                    Address
                  </p>

                  <p className={`text-sm font-semibold ${headingClass}`}>
                    {selectedStudent.address}
                  </p>
                </div>

                {/* EMERGENCY CONTACT */}

                <div className="sm:col-span-2">
                  <p
                    className={`
                      text-[10px]
                      uppercase
                      tracking-wide
                      font-bold
                      mb-1
                      ${mutedClass}
                    `}
                  >
                    Emergency Contact
                  </p>

                  <p className={`text-sm font-semibold ${headingClass}`}>
                    {selectedStudent.emergencyContact}
                  </p>
                </div>

                {/* END DATE */}

                <div>
                  <p
                    className={`
                      text-[10px]
                      uppercase
                      tracking-wide
                      font-bold
                      mb-1
                      ${mutedClass}
                    `}
                  >
                    Internship End
                  </p>

                  <p className={`text-sm font-semibold ${headingClass}`}>
                    {selectedStudent.endDate}
                  </p>
                </div>
              </div>
            </div>

            {/* MODAL FOOTER */}

            <div
              className={`
                px-5
                sm:px-6
                py-4
                border-t
                flex
                justify-end
                ${darkMode ? "border-slate-700" : "border-slate-200"}
              `}
            >
              <button
                type="button"
                onClick={closeStudentModal}
                className={`
                  px-5
                  py-2.5
                  rounded-lg
                  text-xs
                  font-bold
                  text-white
                  transition
                  ${
                    darkMode
                      ? "bg-slate-700 hover:bg-slate-600"
                      : "bg-slate-800 hover:bg-slate-700"
                  }
                `}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentLists;
