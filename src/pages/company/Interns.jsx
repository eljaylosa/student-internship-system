import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { supabaseCompany } from "../../supabaseClient";

// =========================================================
// COMPANY INTERNS PAGE
// =========================================================
//
// Shows:
// - Officially deployed interns
// - Active interns
// - Completed interns
// - Search
// - Status filtering
// - Sorting
// - School
// - Position
// - Year level
// - Internship assignment information
// - Mark internship as completed
// - Evaluate completed interns
//
// Assignment lifecycle:
//
// pending + deployed_at != null
//        ↓
// Company Accept
//        ↓
// active
//        ↓
// Company Mark as Completed
//        ↓
// completed
//        ↓
// Evaluate Intern
//
// =========================================================

const ASSIGNMENT_STATUS = {
  PENDING: "pending",
  ACTIVE: "active",
  COMPLETED: "completed",
  TERMINATED: "terminated",
};

const COMPLETED_STATUS = ASSIGNMENT_STATUS.COMPLETED;

const PROFILE_PHOTO_BUCKET = "profile-photos";

export default function Interns() {
  const { darkMode } = useOutletContext();
  const navigate = useNavigate();

  // =========================================================
  // STATE
  // =========================================================

  const [assignments, setAssignments] = useState([]);
  const [students, setStudents] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [schools, setSchools] = useState([]);

  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortBy, setSortBy] = useState("name-asc");

  // =========================================================
  // PROFILE PHOTO LIGHTBOX
  // =========================================================

  const [selectedProfilePhoto, setSelectedProfilePhoto] = useState(null);

  // =========================================================
  // GET PROFILE PHOTO URL
  // =========================================================
  //
  // profile_photo_url may contain either:
  // - A complete public/signed URL
  // - A storage path inside the profile-photos bucket
  //
  // Convert storage paths into signed URLs so the company
  // portal can display private profile photos.
  //
  // =========================================================

  const getProfilePhotoUrl = async (profilePhotoUrl) => {
    if (!profilePhotoUrl) {
      return null;
    }

    // Already a complete URL
    if (
      profilePhotoUrl.startsWith("http://") ||
      profilePhotoUrl.startsWith("https://")
    ) {
      return profilePhotoUrl;
    }

    try {
      const { data, error } = await supabaseCompany.storage
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
  // LOAD ASSIGNED INTERNS
  // =========================================================

  const loadInterns = async () => {
    try {
      setLoading(true);
      setError("");

      // -------------------------------------------------------
      // GET AUTHENTICATED COMPANY USER
      // -------------------------------------------------------

      const {
        data: { user },
        error: userError,
      } = await supabaseCompany.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        throw new Error("Your company session has expired.");
      }

      // -------------------------------------------------------
      // FIND COMPANY
      // -------------------------------------------------------

      const { data: company, error: companyError } = await supabaseCompany
        .from("companies")
        .select(
          `
            id,
            company_name,
            status
          `
        )
        .eq("user_id", user.id)
        .maybeSingle();

      if (companyError) {
        throw companyError;
      }

      if (!company) {
        throw new Error(
          "Unable to find the company account associated with your login."
        );
      }

      if (company.status !== "active") {
        throw new Error("Your company account is not currently active.");
      }

      // -------------------------------------------------------
      // GET COMPANY ASSIGNMENTS
      // -------------------------------------------------------
      //
      // Only:
      // - active
      // - completed
      //
      // Pending assignments are handled in Manage Applications.
      // Terminated assignments are excluded.
      //
      // deployed_at must exist because this page is specifically
      // for officially deployed interns.
      // -------------------------------------------------------

      const { data: assignmentRows, error: assignmentError } =
        await supabaseCompany
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
          .eq("company_id", company.id)
          .in("status", [ASSIGNMENT_STATUS.ACTIVE, ASSIGNMENT_STATUS.COMPLETED])
          .not("deployed_at", "is", null)
          .order("deployed_at", {
            ascending: false,
          });

      if (assignmentError) {
        throw assignmentError;
      }

      const safeAssignments = assignmentRows || [];

      setAssignments(safeAssignments);

      // -------------------------------------------------------
      // GET STUDENTS
      // -------------------------------------------------------

      const studentIds = [
        ...new Set(
          safeAssignments
            .map((assignment) => assignment.student_id)
            .filter(Boolean)
        ),
      ];

      if (studentIds.length === 0) {
        setStudents([]);
        setOpportunities([]);
        setSchools([]);
        return;
      }

      const { data: studentRows, error: studentsError } = await supabaseCompany
        .from("students")
        .select(
          `
            id,
            student_id,
            phone,
            address,
            emergency_contact,
            program,
            year_level,
            department,
            gwa,
            school_id,
            profile_photo_url,
            users (
              id,
              email,
              first_name,
              middle_name,
              last_name
            )
          `
        )
        .in("id", studentIds);

      if (studentsError) {
        throw studentsError;
      }

      // -------------------------------------------------------
      // MAP STUDENTS + RESOLVE PROFILE PHOTOS
      // -------------------------------------------------------

      const mappedStudents = await Promise.all(
        (studentRows || []).map(async (student) => {
          const userInfo = Array.isArray(student.users)
            ? student.users[0]
            : student.users;

          const fullName = [
            userInfo?.first_name,
            userInfo?.middle_name,
            userInfo?.last_name,
          ]
            .filter(Boolean)
            .join(" ");

          const profilePhotoUrl = await getProfilePhotoUrl(
            student.profile_photo_url
          );

          return {
            id: student.id,
            studentId: student.student_id,
            phone: student.phone,
            address: student.address,
            emergencyContact: student.emergency_contact,
            program: student.program,
            yearLevel: student.year_level,
            department: student.department,
            gwa: student.gwa,
            schoolId: student.school_id,
            email: userInfo?.email || "",
            fullName: fullName || "Unknown Student",

            // Resolved public/signed profile photo URL
            profilePhotoUrl,
          };
        })
      );

      setStudents(mappedStudents);

      // -------------------------------------------------------
      // GET OPPORTUNITIES
      // -------------------------------------------------------

      const opportunityIds = [
        ...new Set(
          safeAssignments
            .map((assignment) => assignment.opportunity_id)
            .filter(Boolean)
        ),
      ];

      if (opportunityIds.length > 0) {
        const { data: opportunityRows, error: opportunitiesError } =
          await supabaseCompany
            .from("opportunities")
            .select(
              `
                id,
                title,
                description,
                location,
                position_type,
                internship_start_date,
                internship_end_date,
                internship_start,
                internship_end
              `
            )
            .in("id", opportunityIds);

        if (opportunitiesError) {
          throw opportunitiesError;
        }

        setOpportunities(opportunityRows || []);
      } else {
        setOpportunities([]);
      }

      // -------------------------------------------------------
      // GET SCHOOLS
      // -------------------------------------------------------

      const schoolIds = [
        ...new Set(
          mappedStudents.map((student) => student.schoolId).filter(Boolean)
        ),
      ];

      if (schoolIds.length > 0) {
        const { data: schoolRows, error: schoolsError } = await supabaseCompany
          .from("schools")
          .select(
            `
                id,
                name,
                code,
                status
              `
          )
          .in("id", schoolIds);

        if (schoolsError) {
          throw schoolsError;
        }

        setSchools(schoolRows || []);
      } else {
        setSchools([]);
      }
    } catch (err) {
      console.error("Error loading assigned interns:", err);

      setError(err?.message || "Unable to load assigned interns.");
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    loadInterns();
  }, []);

  // =========================================================
  // CLOSE LIGHTBOX WITH ESC
  // =========================================================

  useEffect(() => {
    if (!selectedProfilePhoto) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setSelectedProfilePhoto(null);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedProfilePhoto]);

  // =========================================================
  // FIND STUDENT
  // =========================================================

  const getStudent = (studentId) => {
    return students.find((student) => student.id === studentId);
  };

  // =========================================================
  // FIND OPPORTUNITY
  // =========================================================

  const getOpportunity = (opportunityId) => {
    return opportunities.find(
      (opportunity) => opportunity.id === opportunityId
    );
  };

  // =========================================================
  // FIND SCHOOL
  // =========================================================

  const getSchool = (schoolId) => {
    return schools.find((school) => school.id === schoolId);
  };

  // =========================================================
  // FILTER ASSIGNMENTS
  // =========================================================

  const filteredAssignments = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    const filtered = assignments.filter((assignment) => {
      const student = getStudent(assignment.student_id);
      const opportunity = getOpportunity(assignment.opportunity_id);
      const school = getSchool(student?.schoolId);

      if (!student) return false;

      const matchesSearch =
        !normalizedSearch ||
        student.fullName.toLowerCase().includes(normalizedSearch) ||
        (student.studentId || "").toLowerCase().includes(normalizedSearch) ||
        (student.program || "").toLowerCase().includes(normalizedSearch) ||
        (student.yearLevel || "").toLowerCase().includes(normalizedSearch) ||
        (student.email || "").toLowerCase().includes(normalizedSearch) ||
        (student.department || "").toLowerCase().includes(normalizedSearch) ||
        (opportunity?.title || "").toLowerCase().includes(normalizedSearch) ||
        (school?.name || "").toLowerCase().includes(normalizedSearch);

      const displayStatus =
        assignment.status === ASSIGNMENT_STATUS.ACTIVE
          ? "Active"
          : assignment.status === ASSIGNMENT_STATUS.COMPLETED
          ? "Completed"
          : assignment.status;

      const matchesStatus =
        statusFilter === "All" || displayStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });

    return [...filtered].sort((a, b) => {
      const studentA = getStudent(a.student_id) || {};
      const studentB = getStudent(b.student_id) || {};

      if (sortBy === "name-asc") {
        return (studentA.fullName || "").localeCompare(studentB.fullName || "");
      }

      if (sortBy === "name-desc") {
        return (studentB.fullName || "").localeCompare(studentA.fullName || "");
      }

      if (sortBy === "newest") {
        return new Date(b.deployed_at || 0) - new Date(a.deployed_at || 0);
      }

      if (sortBy === "oldest") {
        return new Date(a.deployed_at || 0) - new Date(b.deployed_at || 0);
      }

      if (sortBy === "start-latest") {
        return new Date(b.start_date || 0) - new Date(a.start_date || 0);
      }

      if (sortBy === "start-earliest") {
        return new Date(a.start_date || 0) - new Date(b.start_date || 0);
      }

      return 0;
    });
  }, [
    assignments,
    students,
    opportunities,
    schools,
    searchTerm,
    statusFilter,
    sortBy,
  ]);

  // =========================================================
  // SUMMARY COUNTS
  // =========================================================

  const activeCount = assignments.filter(
    (assignment) => assignment.status === ASSIGNMENT_STATUS.ACTIVE
  ).length;

  const completedCount = assignments.filter(
    (assignment) => assignment.status === ASSIGNMENT_STATUS.COMPLETED
  ).length;

  const totalCount = assignments.length;

  // =========================================================
  // SEND INTERNSHIP COMPLETION EMAIL
  // =========================================================

  const sendInternshipCompletionEmail = async ({
    student,
    opportunity,
    assignment,
    companyName,
  }) => {
    if (!student?.email) {
      console.warn(
        "Internship completion email skipped because the student email is missing."
      );

      return {
        success: false,
        skipped: true,
        error: "Student email is unavailable.",
      };
    }

    try {
      const { data, error } = await supabaseCompany.functions.invoke(
        "send-internship-completion-email",
        {
          body: {
            email: student.email,
            name: student.fullName,
            companyName: companyName || "Your Internship Company",
            opportunityName: opportunity?.title || "Internship",
            startDate: assignment?.start_date || null,
            endDate: assignment?.end_date || null,
            completionDate: new Date().toISOString(),
          },
        }
      );

      if (error) {
        throw error;
      }

      if (!data?.success) {
        throw new Error(
          data?.error || "The internship completion email could not be sent."
        );
      }

      console.log(
        `Internship completion email sent successfully to ${student.email}`
      );

      return {
        success: true,
        data,
      };
    } catch (emailError) {
      console.error("Failed to send internship completion email:", emailError);

      return {
        success: false,
        error:
          emailError?.message ||
          "The internship completion email could not be sent.",
      };
    }
  };

  // =========================================================
  // MARK INTERNSHIP AS COMPLETED
  // =========================================================

  const handleCompleteInternship = async (assignmentId, studentName) => {
    const confirmed = window.confirm(
      `Are you sure you want to mark ${studentName}'s internship as completed?`
    );

    if (!confirmed) return;

    try {
      setProcessingId(assignmentId);
      setError("");

      // -------------------------------------------------------
      // GET THE ASSIGNMENT DETAILS BEFORE UPDATING
      // -------------------------------------------------------

      const assignment = assignments.find((item) => item.id === assignmentId);

      if (!assignment) {
        throw new Error("The internship assignment could not be found.");
      }

      const student = getStudent(assignment.student_id);
      const opportunity = getOpportunity(assignment.opportunity_id);

      if (!student) {
        throw new Error("The student information could not be found.");
      }

      // -------------------------------------------------------
      // UPDATE REAL DATABASE ASSIGNMENT
      // -------------------------------------------------------

      const now = new Date().toISOString();

      const { data: updatedAssignment, error: updateError } =
        await supabaseCompany
          .from("assignments")
          .update({
            status: COMPLETED_STATUS,
            updated_at: now,
          })
          .eq("id", assignmentId)
          .eq("status", ASSIGNMENT_STATUS.ACTIVE)
          .select(
            `
            id,
            status,
            updated_at
          `
          )
          .maybeSingle();

      if (updateError) {
        throw updateError;
      }

      if (!updatedAssignment) {
        throw new Error(
          "The internship could not be marked as completed. It may have already been processed or your company account does not have permission to update it."
        );
      }

      // -------------------------------------------------------
      // SEND COMPLETION EMAIL
      // -------------------------------------------------------

      const { data: companyData, error: companyError } = await supabaseCompany
        .from("companies")
        .select("company_name")
        .eq("id", assignment.company_id)
        .maybeSingle();

      if (companyError) {
        console.warn(
          "Unable to retrieve company name for completion email:",
          companyError
        );
      }

      const emailResult = await sendInternshipCompletionEmail({
        student,
        opportunity,
        assignment,
        companyName: companyData?.company_name || "Your Internship Company",
      });

      // -------------------------------------------------------
      // RELOAD DATA
      // -------------------------------------------------------

      await loadInterns();

      // -------------------------------------------------------
      // SUCCESS MESSAGE
      // -------------------------------------------------------

      if (emailResult.success) {
        alert(
          `Internship marked as completed successfully.\n\nA completion email has been sent to ${student.email}.`
        );
      } else {
        alert(
          `Internship marked as completed successfully.\n\nHowever, the completion email could not be sent to the student.`
        );
      }
    } catch (err) {
      console.error("Error completing internship:", err);

      setError(err?.message || "Unable to mark the internship as completed.");
    } finally {
      setProcessingId(null);
    }
  };

  // =========================================================
  // GO TO EVALUATION
  // =========================================================

  const handleEvaluateIntern = (assignmentId) => {
    navigate("/company/evaluate", {
      state: {
        assignmentId,
        evaluationTab: "company_to_student",
      },
    });
  };

  // =========================================================
  // THEME CLASSES
  // =========================================================

  const card = darkMode
    ? "bg-slate-900 border-slate-700"
    : "bg-white border-slate-200";

  const heading = darkMode ? "text-slate-100" : "text-slate-900";

  const muted = darkMode ? "text-slate-400" : "text-slate-500";

  const input = darkMode
    ? "bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-500"
    : "bg-white border-slate-300 text-slate-800 placeholder:text-slate-400";

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
        <div className="mb-6">
          <p className="text-xs uppercase tracking-widest font-bold text-slate-400">
            Company Portal
          </p>

          <h1 className="text-2xl font-black">Assigned Interns</h1>

          <p className={`text-sm mt-1 ${muted}`}>
            Loading officially deployed interns...
          </p>
        </div>

        <section className={`border rounded-2xl p-8 ${card}`}>
          <div className="text-center">
            <div className="text-3xl mb-3 animate-pulse">👥</div>

            <p className={`font-semibold ${heading}`}>Loading interns...</p>

            <p className={`text-sm mt-1 ${muted}`}>
              Please wait while we load your assigned interns.
            </p>
          </div>
        </section>
      </div>
    );
  }

  // =========================================================
  // RETURN
  // =========================================================

  return (
    <>
      <div
        className={`p-5 md:p-6 lg:p-8 max-w-[1200px] mx-auto ${
          darkMode ? "text-slate-100" : "text-slate-900"
        }`}
      >
        {/* =====================================================
            PAGE HEADER
        ===================================================== */}

        <div className="mb-6">
          <p className="text-xs uppercase tracking-widest font-bold text-slate-400">
            Company Portal
          </p>

          <h1 className="text-2xl font-black">Assigned Interns</h1>

          <p className={`text-sm mt-1 ${muted}`}>
            View officially deployed interns and manage their internship
            assignments.
          </p>
        </div>

        {/* =====================================================
            ERROR
        ===================================================== */}

        {error && (
          <div
            className={`mb-5 p-4 rounded-xl border ${
              darkMode
                ? "bg-red-950/30 border-red-900 text-red-300"
                : "bg-red-50 border-red-200 text-red-700"
            }`}
          >
            <p className="text-xs font-bold mb-1">
              Unable to load or update interns
            </p>

            <p className="text-xs">{error}</p>

            <button
              type="button"
              onClick={loadInterns}
              className="mt-3 px-3 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition"
            >
              Try Again
            </button>
          </div>
        )}

        {/* =====================================================
            SUMMARY CARDS
        ===================================================== */}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {/* TOTAL */}

          <div className={`border rounded-2xl p-5 ${card}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-xs font-semibold ${muted}`}>
                  Total Interns
                </p>

                <p className={`text-3xl font-black mt-1 ${heading}`}>
                  {totalCount}
                </p>

                <p className={`text-xs mt-1 ${muted}`}>
                  Officially deployed
                </p>
              </div>

              <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl">
                👥
              </div>
            </div>
          </div>

          {/* ACTIVE */}

          <div className={`border rounded-2xl p-5 ${card}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-xs font-semibold ${muted}`}>
                  Active Interns
                </p>

                <p className={`text-3xl font-black mt-1 ${heading}`}>
                  {activeCount}
                </p>

                <p className={`text-xs mt-1 ${muted}`}>
                  Currently accepted
                </p>
              </div>

              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl">
                ✓
              </div>
            </div>
          </div>

          {/* COMPLETED */}

          <div className={`border rounded-2xl p-5 ${card}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-xs font-semibold ${muted}`}>Completed</p>

                <p className={`text-3xl font-black mt-1 ${heading}`}>
                  {completedCount}
                </p>

                <p className={`text-xs mt-1 ${muted}`}>
                  Finished internships
                </p>
              </div>

              <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center text-xl">
                🏁
              </div>
            </div>
          </div>
        </div>

        {/* =====================================================
            SEARCH / FILTER / SORT
        ===================================================== */}

        <section className={`border rounded-2xl p-5 mb-5 ${card}`}>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* SEARCH */}

            <div className="flex-1">
              <label className={`block text-xs font-bold mb-2 ${heading}`}>
                Search Interns
              </label>

              <div className="relative">
                <span
                  className={`absolute left-3 top-1/2 -translate-y-1/2 ${muted}`}
                >
                  🔎
                </span>

                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search by name, ID, school, position, year level, program, or email..."
                  className={`w-full border rounded-lg pl-10 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${input}`}
                />
              </div>
            </div>

            {/* STATUS */}

            <div className="w-full lg:w-44">
              <label className={`block text-xs font-bold mb-2 ${heading}`}>
                Status
              </label>

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className={`w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${input}`}
              >
                <option value="All">All Status</option>

                <option value="Active">Active</option>

                <option value="Completed">Completed</option>
              </select>
            </div>

            {/* SORT */}

            <div className="w-full lg:w-52">
              <label className={`block text-xs font-bold mb-2 ${heading}`}>
                Sort By
              </label>

              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                className={`w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${input}`}
              >
                <option value="name-asc">Name: A → Z</option>

                <option value="name-desc">Name: Z → A</option>

                <option value="newest">Recently Deployed</option>

                <option value="oldest">Oldest Deployment</option>

                <option value="start-latest">Latest Start Date</option>

                <option value="start-earliest">Earliest Start Date</option>
              </select>
            </div>
          </div>

          {/* RESULT COUNT */}

          <div
            className={`mt-4 pt-3 border-t text-xs ${
              darkMode ? "border-slate-700" : "border-slate-200"
            } ${muted}`}
          >
            Showing{" "}
            <span className={`font-bold ${heading}`}>
              {filteredAssignments.length}
            </span>{" "}
            of{" "}
            <span className={`font-bold ${heading}`}>
              {assignments.length}
            </span>{" "}
            assigned interns
          </div>
        </section>

        {/* =====================================================
            EMPTY STATE
        ===================================================== */}

        {assignments.length === 0 ? (
          <section className={`border rounded-2xl p-6 ${card}`}>
            <div className="text-center py-8">
              <div className="text-4xl mb-3">👥</div>

              <p className={`font-semibold ${heading}`}>
                No accepted interns yet.
              </p>

              <p className={`text-sm mt-1 max-w-md mx-auto ${muted}`}>
                Students will appear here after the registrar officially
                deploys them and your company accepts their internship
                placement.
              </p>
            </div>
          </section>
        ) : filteredAssignments.length === 0 ? (
          <section className={`border rounded-2xl p-6 ${card}`}>
            <div className="text-center py-8">
              <div className="text-3xl mb-3">🔎</div>

              <p className={`font-semibold ${heading}`}>No interns found.</p>

              <p className={`text-sm mt-1 ${muted}`}>
                Try changing your search or status filter.
              </p>

              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("All");
                }}
                className="mt-4 px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition"
              >
                Clear Filters
              </button>
            </div>
          </section>
        ) : (
          /* =====================================================
             ASSIGNED INTERNS
          ===================================================== */

          <section className={`border rounded-2xl overflow-hidden ${card}`}>
            <div
              className={`px-5 py-4 border-b ${
                darkMode ? "border-slate-700" : "border-slate-200"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h2 className={`font-bold ${heading}`}>Assigned Interns</h2>

                  <p className={`text-xs mt-1 ${muted}`}>
                    Officially deployed students assigned to your company.
                  </p>
                </div>

                <span
                  className={`text-xs font-semibold px-3 py-1.5 rounded-full ${
                    darkMode
                      ? "bg-slate-800 text-slate-300"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {filteredAssignments.length} result
                  {filteredAssignments.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>

            {/* =================================================
                INTERN LIST
            ================================================= */}

            <div
              className={`divide-y ${
                darkMode ? "divide-slate-700" : "divide-slate-200"
              }`}
            >
              {filteredAssignments.map((assignment) => {
                const student = getStudent(assignment.student_id);

                const opportunity = getOpportunity(assignment.opportunity_id);

                const school = getSchool(student?.schoolId);

                const isCompleted =
                  assignment.status === ASSIGNMENT_STATUS.COMPLETED;

                const isProcessing = processingId === assignment.id;

                return (
                  <div
                    key={assignment.id}
                    className={`p-5 transition ${
                      darkMode
                        ? "hover:bg-slate-800/60"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex flex-col xl:flex-row xl:items-center gap-6">
                      {/* =========================================
                          INTERN
                      ========================================= */}

                      <div className="flex items-start gap-4 min-w-0 xl:w-[260px]">
                        {/* AVATAR */}

                        <div
                          className={`w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center font-bold flex-shrink-0 ${
                            isCompleted
                              ? "bg-blue-50 text-blue-700"
                              : "bg-emerald-50 text-emerald-700"
                          } ${
                            student?.profilePhotoUrl
                              ? "cursor-pointer hover:ring-2 hover:ring-blue-500 hover:ring-offset-2 transition"
                              : ""
                          }`}
                          onClick={() => {
                            if (student?.profilePhotoUrl) {
                              setSelectedProfilePhoto({
                                url: student.profilePhotoUrl,
                                name: student.fullName || "Student",
                              });
                            }
                          }}
                          role={student?.profilePhotoUrl ? "button" : undefined}
                          tabIndex={student?.profilePhotoUrl ? 0 : undefined}
                          onKeyDown={(event) => {
                            if (
                              student?.profilePhotoUrl &&
                              (event.key === "Enter" || event.key === " ")
                            ) {
                              event.preventDefault();

                              setSelectedProfilePhoto({
                                url: student.profilePhotoUrl,
                                name: student.fullName || "Student",
                              });
                            }
                          }}
                          aria-label={
                            student?.profilePhotoUrl
                              ? `View ${student.fullName || "student"} profile photo`
                              : undefined
                          }
                        >
                          {student?.profilePhotoUrl ? (
                            <img
                              src={student.profilePhotoUrl}
                              alt={student.fullName || "Student"}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            student?.fullName
                              ?.split(" ")
                              .filter(Boolean)
                              .map((name) => name[0])
                              .slice(0, 2)
                              .join("") || "ST"
                          )}
                        </div>

                        {/* DETAILS */}

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className={`font-bold ${heading}`}>
                              {student?.fullName || "Unknown Student"}
                            </p>

                            {isCompleted ? (
                              <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">
                                COMPLETED
                              </span>
                            ) : (
                              <span className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                                ACTIVE
                              </span>
                            )}
                          </div>

                          <p className={`text-xs mt-1 ${muted}`}>
                            {student?.studentId || "No Student ID"}
                          </p>

                          <p className={`text-xs mt-1 ${muted}`}>
                            {student?.program || "No Program"}
                          </p>

                          <p className={`text-xs mt-1 ${muted}`}>
                            {student?.email || "No email available"}
                          </p>
                        </div>
                      </div>

                      {/* =========================================
                          SCHOOL
                      ========================================= */}

                      <div className="xl:w-[190px]">
                        <p
                          className={`text-[10px] uppercase tracking-wide font-bold ${muted}`}
                        >
                          School
                        </p>

                        <p
                          className={`text-sm font-semibold mt-1 ${heading}`}
                        >
                          {school?.name || "School not specified"}
                        </p>

                        {school?.code && (
                          <p className={`text-xs mt-1 ${muted}`}>
                            {school.code}
                          </p>
                        )}
                      </div>

                      {/* =========================================
                          POSITION
                      ========================================= */}

                      <div className="xl:w-[190px]">
                        <p
                          className={`text-[10px] uppercase tracking-wide font-bold ${muted}`}
                        >
                          Position
                        </p>

                        <p
                          className={`text-sm font-semibold mt-1 ${heading}`}
                        >
                          {opportunity?.title || "Position not specified"}
                        </p>

                        {opportunity?.position_type && (
                          <p className={`text-xs mt-1 ${muted}`}>
                            {opportunity.position_type}
                          </p>
                        )}
                      </div>

                      {/* =========================================
                          YEAR LEVEL
                      ========================================= */}

                      <div className="xl:w-[110px]">
                        <p
                          className={`text-[10px] uppercase tracking-wide font-bold ${muted}`}
                        >
                          Year Level
                        </p>

                        <p
                          className={`text-sm font-semibold mt-1 ${heading}`}
                        >
                          {student?.yearLevel || "Not specified"}
                        </p>

                        {student?.department && (
                          <p className={`text-xs mt-1 ${muted}`}>
                            {student.department}
                          </p>
                        )}
                      </div>

                      {/* =========================================
                          INTERNSHIP PERIOD
                      ========================================= */}

                      <div className="xl:flex-1 xl:min-w-[190px]">
                        <p
                          className={`text-[10px] uppercase tracking-wide font-bold ${muted}`}
                        >
                          Internship Period
                        </p>

                        <p
                          className={`text-sm font-semibold mt-1 ${heading}`}
                        >
                          {assignment.start_date
                            ? new Date(
                                assignment.start_date
                              ).toLocaleDateString()
                            : "N/A"}
                        </p>

                        <p className={`text-xs ${muted}`}>
                          to{" "}
                          {assignment.end_date
                            ? new Date(
                                assignment.end_date
                              ).toLocaleDateString()
                            : "N/A"}
                        </p>
                      </div>

                      {/* =========================================
                          ACTION
                      ========================================= */}

                      <div className="flex-shrink-0">
                        {isCompleted ? (
                          <button
                            type="button"
                            onClick={() => handleEvaluateIntern(assignment.id)}
                            className={`inline-flex items-center justify-center px-4 py-2 rounded-lg text-xs font-semibold transition ${
                              darkMode
                                ? "bg-blue-600 text-white hover:bg-blue-700"
                                : "bg-blue-600 text-white hover:bg-blue-700"
                            }`}
                          >
                            Evaluate Intern
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() =>
                              handleCompleteInternship(
                                assignment.id,
                                student?.fullName || "this intern"
                              )
                            }
                            className={`px-4 py-2 rounded-lg text-white text-xs font-semibold transition ${
                              isProcessing
                                ? "bg-blue-400 cursor-not-allowed"
                                : "bg-blue-600 hover:bg-blue-700"
                            }`}
                          >
                            {isProcessing
                              ? "Updating..."
                              : "Mark as Completed"}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* =========================================
                        ASSIGNMENT META
                    ========================================= */}

                    <div className="flex flex-wrap gap-2 mt-4 ml-0 xl:ml-[64px]">
                      <span
                        className={`text-[10px] px-2 py-1 rounded-md ${
                          darkMode
                            ? "bg-slate-800 text-slate-300"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        Assignment: {assignment.id}
                      </span>

                      <span
                        className={`text-[10px] px-2 py-1 rounded-md ${
                          darkMode
                            ? "bg-slate-800 text-slate-300"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        Deployed:{" "}
                        {assignment.deployed_at
                          ? new Date(
                              assignment.deployed_at
                            ).toLocaleDateString()
                          : "N/A"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* =====================================================
            LIMITATION NOTICE
        ===================================================== */}

        <div
          className={`mt-5 p-4 rounded-xl border text-xs ${
            darkMode
              ? "bg-amber-950/30 border-amber-900 text-amber-300"
              : "bg-amber-50 border-amber-200 text-amber-700"
          }`}
        >
          <p className="font-bold mb-1">ℹ️ Current System Limitation</p>

          <p>
            Attendance and daily internship progress are not tracked by the
            company portal in the current version of the system. This page is
            limited to viewing officially deployed interns and managing
            internship completion status.
          </p>
        </div>
      </div>

      {/* =========================================================
          PROFILE PHOTO LIGHTBOX
      ========================================================= */}

      {selectedProfilePhoto && (
        <div
          className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedProfilePhoto(null)}
          role="dialog"
          aria-modal="true"
          aria-label={`${selectedProfilePhoto.name} profile photo preview`}
        >
          {/* CLOSE BUTTON */}

          <button
            type="button"
            onClick={() => setSelectedProfilePhoto(null)}
            className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white text-2xl flex items-center justify-center transition"
            aria-label="Close profile photo preview"
          >
            ×
          </button>

          {/* IMAGE */}

          <div
            className="relative max-w-[90vw] max-h-[90vh]"
            onClick={(event) => event.stopPropagation()}
          >
            <img
              src={selectedProfilePhoto.url}
              alt={selectedProfilePhoto.name}
              className="max-w-[90vw] max-h-[85vh] w-auto h-auto object-contain rounded-2xl shadow-2xl"
            />

            <div className="absolute left-1/2 -translate-x-1/2 -bottom-10 whitespace-nowrap">
              <p className="text-white text-sm font-semibold">
                {selectedProfilePhoto.name}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

