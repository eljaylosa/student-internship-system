import React, { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "../../supabaseClient";

// =========================================================
// USER MANAGEMENT
// =========================================================
//
// Connected to Supabase.
//
// Sources:
// - users
// - students
// - registrars
// - companies
//
// Notes:
// - Admin accounts are excluded from the management tabs.
// - Student ID comes from students.student_id.
// - Registrar ID comes from registrars.employee_id.
// - Company account ID uses the user's UUID because there is
//   no separate supervisor/profile ID in the current schema.
// - Email is displayed as the Login / Personal Email.
// - Auth email changes are intentionally read-only here because
//   changing public.users.email alone does NOT change Supabase Auth.
//
// Account actions:
// - Activate: changes users.status to "active"
// - Deactivate: SOFT DELETE.
//   Requires the current administrator's password.
// - Deactivation does NOT delete any database records.
// - Internship history, applications, assignments, documents,
//   evaluations, certificates, and company records are preserved.
// =========================================================

const STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  PENDING: "pending",
};

const PAGE_SIZE = 6;

const roleMap = {
  students: "student",
  registrar: "registrar",
  company: "company",
};

const getRoleLabel = (role) => {
  switch (role) {
    case "student":
      return "Student";
    case "registrar":
      return "Registrar";
    case "company":
      return "Company Representative";
    case "admin":
      return "Administrator";
    default:
      return role || "Unknown";
  }
};

const getStatusLabel = (status) => {
  switch (String(status || "").toLowerCase()) {
    case "active":
      return "Active";
    case "inactive":
      return "Inactive";
    case "pending":
      return "Pending";
    default:
      return status || "Unknown";
  }
};

const getStatusClass = (status, darkMode) => {
  switch (String(status || "").toLowerCase()) {
    case "active":
      return darkMode
        ? "bg-green-900/30 text-green-300 border-green-800"
        : "bg-green-50 text-green-700 border-green-200";

    case "inactive":
      return darkMode
        ? "bg-red-900/30 text-red-300 border-red-800"
        : "bg-red-50 text-red-700 border-red-200";

    case "pending":
      return darkMode
        ? "bg-yellow-900/30 text-yellow-300 border-yellow-800"
        : "bg-yellow-50 text-yellow-700 border-yellow-200";

    default:
      return darkMode
        ? "bg-gray-800 text-gray-300 border-gray-700"
        : "bg-gray-100 text-gray-600 border-gray-200";
  }
};

const getFullName = (user) => {
  return [user?.first_name, user?.middle_name, user?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
};

const getInitials = (user) => {
  const first = user?.first_name?.charAt(0) || "";
  const last = user?.last_name?.charAt(0) || "";

  const initials = `${first}${last}`.toUpperCase();

  return initials || "U";
};

export default function UserManagement() {
  const { darkMode } = useOutletContext();

  // =========================================================
  // DATA
  // =========================================================

  const [users, setUsers] = useState([]);
  const [students, setStudents] = useState([]);
  const [registrars, setRegistrars] = useState([]);
  const [companies, setCompanies] = useState([]);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  // =========================================================
  // AUTHENTICATED ADMIN
  // =========================================================

  const [currentAdmin, setCurrentAdmin] = useState(null);

  // =========================================================
  // UI STATE
  // =========================================================

  const [activeTab, setActiveTab] = useState("students");

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");

  const [currentPage, setCurrentPage] = useState(1);

  // =========================================================
  // MODALS
  // =========================================================

  const [selectedUser, setSelectedUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const [userToDeactivate, setUserToDeactivate] = useState(null);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);

  const [adminPassword, setAdminPassword] = useState("");
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  const [actionLoading, setActionLoading] = useState(false);

  // =========================================================
  // EDIT FORM
  // =========================================================

  const [editForm, setEditForm] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
  });

  // =========================================================
  // LOAD DATA
  // =========================================================

  const loadData = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      // -------------------------------------------------------
      // Check currently authenticated user
      // -------------------------------------------------------

      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        throw authError;
      }

      if (!authUser) {
        throw new Error("No authenticated administrator session found.");
      }

      // -------------------------------------------------------
      // Load current user's public profile
      // -------------------------------------------------------

      const { data: adminProfile, error: adminError } = await supabase
        .from("users")
        .select("id, email, role, status, first_name, last_name")
        .eq("id", authUser.id)
        .maybeSingle();

      if (adminError) {
        throw adminError;
      }

      if (!adminProfile || adminProfile.role !== "admin") {
        throw new Error("You are not authorized to access User Management.");
      }

      setCurrentAdmin(adminProfile);

      // -------------------------------------------------------
      // Load all users
      // -------------------------------------------------------

      const { data: userRows, error: usersError } = await supabase
        .from("users")
        .select(
          `
            id,
            email,
            role,
            first_name,
            middle_name,
            last_name,
            status,
            created_at,
            updated_at
          `
        )
        .order("created_at", { ascending: false });

      if (usersError) {
        throw usersError;
      }

      // -------------------------------------------------------
      // Load student profiles
      // -------------------------------------------------------

      const { data: studentRows, error: studentsError } = await supabase
        .from("students")
        .select("id, student_id");

      if (studentsError) {
        throw studentsError;
      }

      // -------------------------------------------------------
      // Load registrar profiles
      // -------------------------------------------------------

      const { data: registrarRows, error: registrarsError } = await supabase
        .from("registrars")
        .select("id, employee_id");

      if (registrarsError) {
        throw registrarsError;
      }

      // -------------------------------------------------------
      // Load company profiles
      // -------------------------------------------------------

      const { data: companyRows, error: companiesError } = await supabase
        .from("companies")
        .select("user_id, company_name, company_email");

      if (companiesError) {
        throw companiesError;
      }

      setUsers(userRows || []);
      setStudents(studentRows || []);
      setRegistrars(registrarRows || []);
      setCompanies(companyRows || []);
    } catch (error) {
      console.error("UserManagement load error:", error);

      setErrorMessage(
        error?.message ||
          "Unable to load users. Please check your database connection and RLS policies."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // =========================================================
  // MAP DATABASE USERS TO DISPLAY USERS
  // =========================================================

  const displayUsers = useMemo(() => {
    return users
      .filter((user) => user.role !== "admin")
      .map((user) => {
        const studentProfile =
          user.role === "student"
            ? students.find((item) => item.id === user.id)
            : null;

        const registrarProfile =
          user.role === "registrar"
            ? registrars.find((item) => item.id === user.id)
            : null;

        const companyProfile =
          user.role === "company"
            ? companies.find((item) => item.user_id === user.id)
            : null;

        let accountId = user.id;

        if (user.role === "student") {
          accountId = studentProfile?.student_id || user.id;
        }

        if (user.role === "registrar") {
          accountId = registrarProfile?.employee_id || user.id;
        }

        return {
          ...user,

          displayName:
            getFullName(user) || companyProfile?.company_name || "Unnamed User",

          accountId,

          companyName: companyProfile?.company_name || "",

          companyEmail: companyProfile?.company_email || "",

          roleLabel: getRoleLabel(user.role),

          statusLabel: getStatusLabel(user.status),
        };
      });
  }, [users, students, registrars, companies]);

  // =========================================================
  // CURRENT TAB
  // =========================================================

  const currentRole = roleMap[activeTab];

  const currentUsers = useMemo(() => {
    return displayUsers.filter((user) => user.role === currentRole);
  }, [displayUsers, currentRole]);

  // =========================================================
  // SEARCH + SORT
  // =========================================================

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    let result = [...currentUsers];

    if (query) {
      result = result.filter((user) => {
        const searchableText = [
          user.accountId,
          user.id,
          user.displayName,
          user.email,
          user.statusLabel,
          user.companyName,
          user.companyEmail,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchableText.includes(query);
      });
    }

    result.sort((a, b) => {
      let valueA = "";
      let valueB = "";

      switch (sortBy) {
        case "id":
          valueA = a.accountId || "";
          valueB = b.accountId || "";
          break;

        case "email":
          valueA = a.email || "";
          valueB = b.email || "";
          break;

        case "status":
          valueA = a.statusLabel || "";
          valueB = b.statusLabel || "";
          break;

        case "name":
        default:
          valueA = a.displayName || "";
          valueB = b.displayName || "";
          break;
      }

      valueA = String(valueA).toLowerCase();
      valueB = String(valueB).toLowerCase();

      if (valueA < valueB) {
        return sortDirection === "asc" ? -1 : 1;
      }

      if (valueA > valueB) {
        return sortDirection === "asc" ? 1 : -1;
      }

      return 0;
    });

    return result;
  }, [currentUsers, search, sortBy, sortDirection]);

  // =========================================================
  // PAGINATION
  // =========================================================

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));

  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;

    return filteredUsers.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredUsers, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, search, sortBy, sortDirection]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // =========================================================
  // TAB COUNTS
  // =========================================================

  const studentCount = displayUsers.filter(
    (user) => user.role === "student"
  ).length;

  const registrarCount = displayUsers.filter(
    (user) => user.role === "registrar"
  ).length;

  const companyCount = displayUsers.filter(
    (user) => user.role === "company"
  ).length;

  // =========================================================
  // SORT
  // =========================================================

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortDirection("asc");
    }
  };

  // =========================================================
  // EDIT
  // =========================================================

  const openEditModal = (user) => {
    setSelectedUser(user);

    setEditForm({
      firstName: user.first_name || "",
      middleName: user.middle_name || "",
      lastName: user.last_name || "",
      email: user.email || "",
    });

    setShowEditModal(true);
  };

  const closeEditModal = () => {
    if (actionLoading) return;

    setShowEditModal(false);
    setSelectedUser(null);

    setEditForm({
      firstName: "",
      middleName: "",
      lastName: "",
      email: "",
    });
  };

  const handleEditFormChange = (field, value) => {
    setEditForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSaveEdit = async () => {
    if (!selectedUser) return;

    const firstName = editForm.firstName.trim();
    const middleName = editForm.middleName.trim();
    const lastName = editForm.lastName.trim();

    if (!firstName || !lastName) {
      alert("First Name and Last Name are required.");
      return;
    }

    try {
      setActionLoading(true);

      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser || authUser.id !== currentAdmin?.id) {
        throw new Error("Your administrator session is no longer valid.");
      }

      // -------------------------------------------------------
      // Save updated user information
      // -------------------------------------------------------

      const { error } = await supabase
        .from("users")
        .update({
          first_name: firstName,
          middle_name: middleName || null,
          last_name: lastName,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedUser.id);

      if (error) {
        throw error;
      }

      // -------------------------------------------------------
      // Get the updated database record
      // -------------------------------------------------------

      const { data: updatedUser, error: updatedUserError } = await supabase
        .from("users")
        .select(`
          id,
          email,
          role,
          first_name,
          middle_name,
          last_name
        `)
        .eq("id", selectedUser.id)
        .maybeSingle();

      if (updatedUserError) {
        throw updatedUserError;
      }

      if (!updatedUser) {
        throw new Error("Unable to retrieve the updated user information.");
      }

      // -------------------------------------------------------
      // Create audit log after successful update
      // -------------------------------------------------------

      const { error: auditError } = await supabase.functions.invoke(
        "create-audit-log",
        {
          body: {
            action: "UPDATE",
            module: "User Management",
            target_entity_type: "User",
            target_entity_id: selectedUser.id,
            details: {
              name:
                [
                  updatedUser.first_name,
                  updatedUser.middle_name,
                  updatedUser.last_name,
                ]
                  .filter(Boolean)
                  .join(" ")
                  .trim() || "Unnamed User",

              role: updatedUser.role || selectedUser.role,

              email: updatedUser.email || selectedUser.email || null,

              updated_fields: [
                "first_name",
                "middle_name",
                "last_name",
              ],

              previous_values: {
                first_name: selectedUser.first_name || null,
                middle_name: selectedUser.middle_name || null,
                last_name: selectedUser.last_name || null,
              },

              new_values: {
                first_name: updatedUser.first_name || null,
                middle_name: updatedUser.middle_name || null,
                last_name: updatedUser.last_name || null,
              },
            },
          },
        }
      );

      if (auditError) {
        console.error("Update audit log error:", auditError);
      }

      await loadData();

      closeEditModal();

      alert("User information updated successfully.");
    } catch (error) {
      console.error("Update user error:", error);

      alert(error?.message || "Failed to update user information.");
    } finally {
      setActionLoading(false);
    }
  };


  // =========================================================
  // DEACTIVATE / SOFT DELETE
  // =========================================================

  const openDeactivateModal = (user) => {
    if (!user) return;

    setUserToDeactivate(user);
    setAdminPassword("");
    setShowAdminPassword(false);
    setShowDeactivateModal(true);
  };

  const closeDeactivateModal = () => {
    if (actionLoading) return;

    setShowDeactivateModal(false);
    setUserToDeactivate(null);
    setAdminPassword("");
    setShowAdminPassword(false);
  };

  const handleConfirmDeactivate = async () => {
    if (!userToDeactivate) return;

    const password = adminPassword;

    if (!password) {
      alert("Please enter your administrator password.");
      return;
    }

    try {
      setActionLoading(true);

      // -------------------------------------------------------
      // Verify current admin session before calling Edge Function
      // -------------------------------------------------------

      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        throw authError;
      }

      if (!authUser || authUser.id !== currentAdmin?.id) {
        throw new Error("Your administrator session is no longer valid.");
      }

      // -------------------------------------------------------
      // Call secure server-side Edge Function
      // -------------------------------------------------------

      const { data, error } = await supabase.functions.invoke(
        "deactivate-user",
        {
          body: {
            targetUserId: userToDeactivate.id,
            password,
          },
        }
      );

      if (error) {
        console.error("Deactivate-user function error:", error);

        let message = error.message || "Failed to deactivate the user.";

        if (error.context) {
          try {
            const responseBody = await error.context.json();

            if (responseBody?.error) {
              message = responseBody.error;
            }
          } catch {
            // Keep the original error message.
          }
        }

        throw new Error(message);
      }

      if (!data?.success) {
        throw new Error(data?.error || "Failed to deactivate the user.");
      }

      await loadData();

      closeDeactivateModal();

      alert(
        `${userToDeactivate.displayName} has been deactivated successfully.`
      );
    } catch (error) {
      console.error("Deactivate user error:", error);

      alert(error?.message || "Failed to deactivate the user.");
    } finally {
      setActionLoading(false);
    }
  };

  // =========================================================
  // ACTIVATE
  // =========================================================

  const handleActivate = async (user) => {
    if (!user) return;

    try {
      setActionLoading(true);

      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser || authUser.id !== currentAdmin?.id) {
        throw new Error("Your administrator session is no longer valid.");
      }

      const { data: adminProfile, error: adminError } = await supabase
        .from("users")
        .select("id, role")
        .eq("id", authUser.id)
        .maybeSingle();

      if (adminError) {
        throw adminError;
      }

      if (!adminProfile || adminProfile.role !== "admin") {
        throw new Error("Only administrators can activate users.");
      }

      const previousStatus = user.status;

      const { error } = await supabase
        .from("users")
        .update({
          status: STATUS.ACTIVE,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) {
        throw error;
      }

      // -------------------------------------------------------
      // Create audit log after successful activation
      // -------------------------------------------------------

      const { error: auditError } = await supabase.functions.invoke(
        "create-audit-log",
        {
          body: {
            action: "ACTIVATE",
            module: "User Management",
            target_entity_type: "User",
            target_entity_id: user.id,
            details: {
              name: user.displayName,
              role: user.role,
              email: user.email || null,
              previous_status: previousStatus,
              new_status: STATUS.ACTIVE,
            },
          },
        }
      );

      if (auditError) {
        console.error("Activate audit log error:", auditError);
      }

      await loadData();

      alert(`${user.displayName} has been activated.`);
    } catch (error) {
      console.error("Activate user error:", error);

      alert(error?.message || "Failed to activate the user.");
    } finally {
      setActionLoading(false);
    }
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div
      className={`min-h-screen p-4 sm:p-6 lg:p-8 ${
        darkMode ? "bg-gray-950 text-white" : "bg-gray-50 text-gray-900"
      }`}
    >
      <div className="max-w-7xl mx-auto">
        {/* =====================================================
            HEADER
        ====================================================== */}

        <div className="mb-6">
          <h1
            className={`text-2xl sm:text-3xl font-bold ${
              darkMode ? "text-white" : "text-gray-900"
            }`}
          >
            User Management
          </h1>

          <p
            className={`mt-1 text-sm ${
              darkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            Manage registered Student, Registrar Adviser, and Company Supervisor
            accounts.
          </p>
        </div>

        {/* =====================================================
            ERROR
        ====================================================== */}

        {errorMessage && (
          <div
            className={`mb-6 rounded-xl border p-4 ${
              darkMode
                ? "border-red-800 bg-red-950/40 text-red-300"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold">Unable to load users</p>

                <p className="text-sm mt-1">{errorMessage}</p>
              </div>

              <button
                type="button"
                onClick={loadData}
                className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium ${
                  darkMode
                    ? "bg-red-900/60 hover:bg-red-900"
                    : "bg-red-100 hover:bg-red-200"
                }`}
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* =====================================================
            TABS
        ====================================================== */}

        <div
          className={`rounded-2xl border p-2 mb-6 ${
            darkMode
              ? "bg-gray-900 border-gray-800"
              : "bg-white border-gray-200"
          }`}
        >
          <div className="grid grid-cols-3 gap-2">
            {/* STUDENTS */}

            <button
              type="button"
              onClick={() => setActiveTab("students")}
              className={`rounded-xl px-3 py-3 text-sm sm:text-base font-semibold transition ${
                activeTab === "students"
                  ? "bg-blue-600 text-white"
                  : darkMode
                  ? "text-gray-400 hover:bg-gray-800 hover:text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span className="block">Students</span>

              <span
                className={`text-xs mt-0.5 block ${
                  activeTab === "students"
                    ? "text-white/80"
                    : darkMode
                    ? "text-gray-500"
                    : "text-gray-400"
                }`}
              >
                {studentCount}
              </span>
            </button>

            {/* REGISTRAR */}

            <button
              type="button"
              onClick={() => setActiveTab("registrar")}
              className={`rounded-xl px-3 py-3 text-sm sm:text-base font-semibold transition ${
                activeTab === "registrar"
                  ? "bg-blue-600 text-white"
                  : darkMode
                  ? "text-gray-400 hover:bg-gray-800 hover:text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span className="block">Registrar</span>

              <span
                className={`text-xs mt-0.5 block ${
                  activeTab === "registrar"
                    ? "text-white/80"
                    : darkMode
                    ? "text-gray-500"
                    : "text-gray-400"
                }`}
              >
                {registrarCount}
              </span>
            </button>

            {/* COMPANY */}

            <button
              type="button"
              onClick={() => setActiveTab("company")}
              className={`rounded-xl px-3 py-3 text-sm sm:text-base font-semibold transition ${
                activeTab === "company"
                  ? "bg-purple-600 text-white"
                  : darkMode
                  ? "text-gray-400 hover:bg-gray-800 hover:text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span className="block">Companies</span>

              <span
                className={`text-xs mt-0.5 block ${
                  activeTab === "company"
                    ? "text-white/80"
                    : darkMode
                    ? "text-gray-500"
                    : "text-gray-400"
                }`}
              >
                {companyCount}
              </span>
            </button>
          </div>
        </div>

        {/* =====================================================
            CONTROLS
        ====================================================== */}

        <div
          className={`rounded-2xl border p-4 mb-6 ${
            darkMode
              ? "bg-gray-900 border-gray-800"
              : "bg-white border-gray-200"
          }`}
        >
          <div className="flex flex-col lg:flex-row gap-4">
            {/* SEARCH */}

            <div className="flex-1">
              <label
                className={`block text-xs font-semibold uppercase tracking-wide mb-2 ${
                  darkMode ? "text-gray-500" : "text-gray-400"
                }`}
              >
                Search
              </label>

              <div className="relative">
                <span
                  className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                    darkMode ? "text-gray-500" : "text-gray-400"
                  }`}
                >
                  🔍
                </span>

                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={
                    activeTab === "company"
                      ? "Search company, name, email..."
                      : "Search ID, name, email..."
                  }
                  className={`w-full rounded-xl border pl-10 pr-4 py-3 text-sm outline-none transition ${
                    darkMode
                      ? "bg-gray-950 border-gray-700 text-white placeholder:text-gray-600 focus:border-blue-500"
                      : "bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-500"
                  }`}
                />
              </div>
            </div>

            {/* SORT */}

            <div className="w-full lg:w-56">
              <label
                className={`block text-xs font-semibold uppercase tracking-wide mb-2 ${
                  darkMode ? "text-gray-500" : "text-gray-400"
                }`}
              >
                Sort By
              </label>

              <select
                value={sortBy}
                onChange={(event) => {
                  setSortBy(event.target.value);
                  setSortDirection("asc");
                }}
                className={`w-full rounded-xl border px-4 py-3 text-sm outline-none ${
                  darkMode
                    ? "bg-gray-950 border-gray-700 text-white"
                    : "bg-gray-50 border-gray-200 text-gray-900"
                }`}
              >
                <option value="name">Name</option>
                <option value="id">Account ID</option>
                <option value="email">Email</option>
                <option value="status">Status</option>
              </select>
            </div>

            {/* SORT DIRECTION */}

            <div className="w-full lg:w-40">
              <label
                className={`block text-xs font-semibold uppercase tracking-wide mb-2 ${
                  darkMode ? "text-gray-500" : "text-gray-400"
                }`}
              >
                Order
              </label>

              <button
                type="button"
                onClick={() =>
                  setSortDirection((current) =>
                    current === "asc" ? "desc" : "asc"
                  )
                }
                className={`w-full rounded-xl border px-4 py-3 text-sm font-medium ${
                  darkMode
                    ? "bg-gray-950 border-gray-700 text-gray-200 hover:bg-gray-800"
                    : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                }`}
              >
                {sortDirection === "asc" ? "↑ Ascending" : "↓ Descending"}
              </button>
            </div>
          </div>
        </div>

        {/* =====================================================
            TABLE
        ====================================================== */}

        <div
          className={`rounded-2xl border overflow-hidden ${
            darkMode
              ? "bg-gray-900 border-gray-800"
              : "bg-white border-gray-200"
          }`}
        >
          {/* TABLE HEADER */}

          <div
            className={`px-5 py-4 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 ${
              darkMode ? "border-gray-800" : "border-gray-200"
            }`}
          >
            <div>
              <h2
                className={`font-semibold ${
                  darkMode ? "text-white" : "text-gray-900"
                }`}
              >
                {getRoleLabel(currentRole)} Accounts
              </h2>

              <p
                className={`text-xs mt-1 ${
                  darkMode ? "text-gray-500" : "text-gray-400"
                }`}
              >
                Showing {filteredUsers.length} account
                {filteredUsers.length !== 1 ? "s" : ""}
              </p>
            </div>

            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                darkMode
                  ? "bg-gray-800 text-gray-200 hover:bg-gray-700"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              ↻ Refresh
            </button>
          </div>

          {/* LOADING */}

          {loading ? (
            <div className="px-6 py-16 text-center">
              <div
                className={`inline-block w-8 h-8 rounded-full border-2 border-t-transparent animate-spin ${
                  darkMode ? "border-gray-500" : "border-gray-400"
                }`}
              />

              <p
                className={`mt-4 text-sm ${
                  darkMode ? "text-gray-400" : "text-gray-500"
                }`}
              >
                Loading users...
              </p>
            </div>
          ) : paginatedUsers.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="text-4xl mb-3">👤</div>

              <p
                className={`font-semibold ${
                  darkMode ? "text-white" : "text-gray-900"
                }`}
              >
                No users found
              </p>

              <p
                className={`text-sm mt-1 ${
                  darkMode ? "text-gray-500" : "text-gray-400"
                }`}
              >
                {search
                  ? "Try changing your search."
                  : "There are no accounts in this category yet."}
              </p>
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE */}

              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr
                      className={`text-left text-xs uppercase tracking-wide ${
                        darkMode
                          ? "bg-gray-950/70 text-gray-500"
                          : "bg-gray-50 text-gray-400"
                      }`}
                    >
                      <th className="px-5 py-4">Account ID</th>
                      <th className="px-5 py-4">Name</th>
                      <th className="px-5 py-4">Login Email</th>
                      <th className="px-5 py-4">Status</th>
                      <th className="px-5 py-4 text-right">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {paginatedUsers.map((user) => (
                      <tr
                        key={user.id}
                        className={`border-t transition ${
                          darkMode
                            ? "border-gray-800 hover:bg-gray-800/40"
                            : "border-gray-100 hover:bg-gray-50"
                        }`}
                      >
                        {/* ID */}

                        <td className="px-5 py-4">
                          <div
                            className={`font-mono text-sm ${
                              darkMode ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            {user.accountId}
                          </div>

                          {user.role === "company" && user.companyName && (
                            <div
                              className={`text-xs mt-1 ${
                                darkMode ? "text-gray-500" : "text-gray-400"
                              }`}
                            >
                              {user.companyName}
                            </div>
                          )}
                        </td>

                        {/* NAME */}

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${
                                user.role === "company"
                                  ? darkMode
                                    ? "bg-purple-900/50 text-purple-300"
                                    : "bg-purple-100 text-purple-700"
                                  : darkMode
                                  ? "bg-blue-900/50 text-blue-300"
                                  : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              {getInitials(user)}
                            </div>

                            <div>
                              <div
                                className={`font-medium ${
                                  darkMode ? "text-white" : "text-gray-900"
                                }`}
                              >
                                {user.displayName}
                              </div>

                              <div
                                className={`text-xs mt-0.5 ${
                                  darkMode ? "text-gray-500" : "text-gray-400"
                                }`}
                              >
                                {user.roleLabel}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* EMAIL */}

                        <td className="px-5 py-4">
                          <div
                            className={`text-sm ${
                              darkMode ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            {user.email || "—"}
                          </div>

                          {user.role === "company" && user.companyEmail && (
                            <div
                              className={`text-xs mt-1 ${
                                darkMode ? "text-purple-400" : "text-purple-600"
                              }`}
                            >
                              Company: {user.companyEmail}
                            </div>
                          )}
                        </td>

                        {/* STATUS */}

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-semibold ${getStatusClass(
                              user.status,
                              darkMode
                            )}`}
                          >
                            {user.statusLabel}
                          </span>
                        </td>

                        {/* ACTIONS */}

                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEditModal(user)}
                              disabled={actionLoading}
                              className={`rounded-lg px-3 py-2 text-xs font-medium ${
                                darkMode
                                  ? "bg-gray-800 text-gray-200 hover:bg-gray-700"
                                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                              }`}
                            >
                              Edit
                            </button>

                            {String(user.status).toLowerCase() ===
                            STATUS.ACTIVE ? (
                              <button
                                type="button"
                                onClick={() => openDeactivateModal(user)}
                                disabled={actionLoading}
                                className={`rounded-lg px-3 py-2 text-xs font-medium ${
                                  darkMode
                                    ? "bg-red-900/30 text-red-300 hover:bg-red-900/50"
                                    : "bg-red-50 text-red-600 hover:bg-red-100"
                                }`}
                              >
                                Deactivate
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleActivate(user)}
                                disabled={actionLoading}
                                className={`rounded-lg px-3 py-2 text-xs font-medium ${
                                  darkMode
                                    ? "bg-green-900/30 text-green-300 hover:bg-green-900/50"
                                    : "bg-green-50 text-green-700 hover:bg-green-100"
                                }`}
                              >
                                Activate
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* =================================================
                  MOBILE CARDS
              ================================================== */}

              <div className="md:hidden divide-y">
                {paginatedUsers.map((user) => (
                  <div
                    key={user.id}
                    className={`p-4 ${
                      darkMode ? "divide-gray-800" : "divide-gray-100"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* AVATAR */}

                      <div
                        className={`w-11 h-11 shrink-0 rounded-full flex items-center justify-center text-sm font-bold ${
                          user.role === "company"
                            ? darkMode
                              ? "bg-purple-900/50 text-purple-300"
                              : "bg-purple-100 text-purple-700"
                            : darkMode
                            ? "bg-blue-900/50 text-blue-300"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {getInitials(user)}
                      </div>

                      {/* INFO */}

                      <div className="flex-1 min-w-0">
                        <div
                          className={`font-semibold truncate ${
                            darkMode ? "text-white" : "text-gray-900"
                          }`}
                        >
                          {user.displayName}
                        </div>

                        <div
                          className={`text-xs mt-0.5 ${
                            darkMode ? "text-gray-500" : "text-gray-400"
                          }`}
                        >
                          {user.roleLabel}
                        </div>

                        <div
                          className={`text-xs mt-2 break-all ${
                            darkMode ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          {user.email}
                        </div>
                      </div>

                      {/* STATUS */}

                      <span
                        className={`shrink-0 inline-flex items-center px-2 py-1 rounded-full border text-[11px] font-semibold ${getStatusClass(
                          user.status,
                          darkMode
                        )}`}
                      >
                        {user.statusLabel}
                      </span>
                    </div>

                    {/* COMPANY EMAIL */}

                    {user.role === "company" && user.companyEmail && (
                      <div
                        className={`mt-3 rounded-lg px-3 py-2 text-xs ${
                          darkMode
                            ? "bg-gray-950 text-purple-400"
                            : "bg-gray-50 text-purple-600"
                        }`}
                      >
                        <span className="font-semibold">Company Email:</span>{" "}
                        {user.companyEmail}
                      </div>
                    )}

                    {/* ID */}

                    <div
                      className={`mt-3 text-xs ${
                        darkMode ? "text-gray-500" : "text-gray-400"
                      }`}
                    >
                      Account ID:{" "}
                      <span className="font-mono">{user.accountId}</span>
                    </div>

                    {/* ACTIONS */}

                    <div className="grid grid-cols-2 gap-2 mt-4">
                      <button
                        type="button"
                        onClick={() => openEditModal(user)}
                        disabled={actionLoading}
                        className={`rounded-lg px-2 py-2 text-xs font-medium ${
                          darkMode
                            ? "bg-gray-800 text-gray-200"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        Edit
                      </button>

                      {String(user.status).toLowerCase() === STATUS.ACTIVE ? (
                        <button
                          type="button"
                          onClick={() => openDeactivateModal(user)}
                          disabled={actionLoading}
                          className={`rounded-lg px-2 py-2 text-xs font-medium ${
                            darkMode
                              ? "bg-red-900/30 text-red-300"
                              : "bg-red-50 text-red-600"
                          }`}
                        >
                          Deactivate
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleActivate(user)}
                          disabled={actionLoading}
                          className={`rounded-lg px-2 py-2 text-xs font-medium ${
                            darkMode
                              ? "bg-green-900/30 text-green-300"
                              : "bg-green-50 text-green-700"
                          }`}
                        >
                          Activate
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* =====================================================
              PAGINATION
          ====================================================== */}

          {!loading && filteredUsers.length > 0 && (
            <div
              className={`px-5 py-4 border-t flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
                darkMode ? "border-gray-800" : "border-gray-200"
              }`}
            >
              <p
                className={`text-xs ${
                  darkMode ? "text-gray-500" : "text-gray-400"
                }`}
              >
                Page {currentPage} of {totalPages}
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() =>
                    setCurrentPage((page) => Math.max(1, page - 1))
                  }
                  className={`rounded-lg px-3 py-2 text-sm font-medium ${
                    darkMode
                      ? "bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:text-gray-600"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:text-gray-300"
                  } disabled:cursor-not-allowed`}
                >
                  Previous
                </button>

                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() =>
                    setCurrentPage((page) => Math.min(totalPages, page + 1))
                  }
                  className={`rounded-lg px-3 py-2 text-sm font-medium ${
                    darkMode
                      ? "bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:text-gray-600"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:text-gray-300"
                  } disabled:cursor-not-allowed`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* =======================================================
          EDIT MODAL
      ======================================================== */}

      {showEditModal && selectedUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeEditModal();
            }
          }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          <div
            className={`relative w-full max-w-lg rounded-2xl shadow-2xl ${
              darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900"
            }`}
          >
            {/* HEADER */}

            <div
              className={`px-6 py-5 border-b ${
                darkMode ? "border-gray-800" : "border-gray-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold">Edit User</h2>

                  <p
                    className={`text-xs mt-1 ${
                      darkMode ? "text-gray-500" : "text-gray-400"
                    }`}
                  >
                    Update the user's account information.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeEditModal}
                  disabled={actionLoading}
                  className={`w-9 h-9 rounded-lg ${
                    darkMode
                      ? "hover:bg-gray-800 text-gray-400"
                      : "hover:bg-gray-100 text-gray-500"
                  }`}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* BODY */}

            <div className="p-6 space-y-4">
              {/* USER TYPE */}

              <div>
                <label
                  className={`block text-xs font-semibold mb-2 ${
                    darkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  User Type
                </label>

                <input
                  type="text"
                  value={selectedUser.roleLabel}
                  disabled
                  className={`w-full rounded-xl border px-4 py-3 text-sm ${
                    darkMode
                      ? "bg-gray-950 border-gray-800 text-gray-500"
                      : "bg-gray-100 border-gray-200 text-gray-500"
                  }`}
                />
              </div>

              {/* ACCOUNT ID */}

              <div>
                <label
                  className={`block text-xs font-semibold mb-2 ${
                    darkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Account ID
                </label>

                <input
                  type="text"
                  value={selectedUser.accountId}
                  disabled
                  className={`w-full rounded-xl border px-4 py-3 text-sm font-mono ${
                    darkMode
                      ? "bg-gray-950 border-gray-800 text-gray-500"
                      : "bg-gray-100 border-gray-200 text-gray-500"
                  }`}
                />
              </div>

              {/* FIRST NAME */}

              <div>
                <label
                  className={`block text-xs font-semibold mb-2 ${
                    darkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  First Name
                </label>

                <input
                  type="text"
                  value={editForm.firstName}
                  onChange={(event) =>
                    handleEditFormChange("firstName", event.target.value)
                  }
                  className={`w-full rounded-xl border px-4 py-3 text-sm outline-none ${
                    darkMode
                      ? "bg-gray-950 border-gray-700 text-white focus:border-blue-500"
                      : "bg-white border-gray-200 text-gray-900 focus:border-blue-500"
                  }`}
                />
              </div>

              {/* MIDDLE NAME */}

              <div>
                <label
                  className={`block text-xs font-semibold mb-2 ${
                    darkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Middle Name
                </label>

                <input
                  type="text"
                  value={editForm.middleName}
                  onChange={(event) =>
                    handleEditFormChange("middleName", event.target.value)
                  }
                  className={`w-full rounded-xl border px-4 py-3 text-sm outline-none ${
                    darkMode
                      ? "bg-gray-950 border-gray-700 text-white focus:border-blue-500"
                      : "bg-white border-gray-200 text-gray-900 focus:border-blue-500"
                  }`}
                />
              </div>

              {/* LAST NAME */}

              <div>
                <label
                  className={`block text-xs font-semibold mb-2 ${
                    darkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Last Name
                </label>

                <input
                  type="text"
                  value={editForm.lastName}
                  onChange={(event) =>
                    handleEditFormChange("lastName", event.target.value)
                  }
                  className={`w-full rounded-xl border px-4 py-3 text-sm outline-none ${
                    darkMode
                      ? "bg-gray-950 border-gray-700 text-white focus:border-blue-500"
                      : "bg-white border-gray-200 text-gray-900 focus:border-blue-500"
                  }`}
                />
              </div>

              {/* EMAIL */}

              <div>
                <label
                  className={`block text-xs font-semibold mb-2 ${
                    darkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Login / Personal Email
                </label>

                <input
                  type="email"
                  value={editForm.email}
                  disabled
                  className={`w-full rounded-xl border px-4 py-3 text-sm ${
                    darkMode
                      ? "bg-gray-950 border-gray-800 text-gray-500"
                      : "bg-gray-100 border-gray-200 text-gray-500"
                  }`}
                />

                <p
                  className={`text-xs mt-2 ${
                    darkMode ? "text-gray-500" : "text-gray-400"
                  }`}
                >
                  Login email changes are handled separately because the
                  Supabase Auth email must also be updated.
                </p>
              </div>
            </div>

            {/* FOOTER */}

            <div
              className={`px-6 py-4 border-t flex justify-end gap-3 ${
                darkMode ? "border-gray-800" : "border-gray-200"
              }`}
            >
              <button
                type="button"
                onClick={closeEditModal}
                disabled={actionLoading}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium ${
                  darkMode
                    ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={actionLoading}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {actionLoading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================
          DEACTIVATE / SOFT DELETE MODAL
      ======================================================== */}

      {showDeactivateModal && userToDeactivate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeDeactivateModal();
            }
          }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          <div
            className={`relative w-full max-w-md rounded-2xl shadow-2xl ${
              darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900"
            }`}
          >
            <div className="p-6">
              {/* ICON */}

              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xl mb-4">
                !
              </div>

              {/* TITLE */}

              <h2 className="text-lg font-bold">Deactivate User?</h2>

              <p
                className={`text-sm mt-2 ${
                  darkMode ? "text-gray-400" : "text-gray-500"
                }`}
              >
                You are about to deactivate{" "}
                <span className="font-semibold">
                  {userToDeactivate.displayName}
                </span>
                .
              </p>

              {/* USER INFO */}

              <div
                className={`mt-4 rounded-xl p-4 ${
                  darkMode ? "bg-gray-950" : "bg-gray-50"
                }`}
              >
                <div
                  className={`text-xs ${
                    darkMode ? "text-gray-500" : "text-gray-400"
                  }`}
                >
                  Account
                </div>

                <div className="font-mono text-sm mt-1 break-all">
                  {userToDeactivate.accountId}
                </div>

                <div
                  className={`text-xs mt-3 ${
                    darkMode ? "text-gray-500" : "text-gray-400"
                  }`}
                >
                  Login / Personal Email
                </div>

                <div className="text-sm mt-1 break-all">
                  {userToDeactivate.email}
                </div>
              </div>

              {/* SOFT DELETE NOTICE */}

              <div
                className={`mt-4 rounded-xl border p-4 ${
                  darkMode
                    ? "bg-yellow-950/20 border-yellow-900 text-yellow-300"
                    : "bg-yellow-50 border-yellow-200 text-yellow-800"
                }`}
              >
                <p className="text-sm font-semibold">This is a soft delete.</p>

                <p className="text-xs mt-2 leading-relaxed">
                  The user's account and all related records will be preserved.
                  Only the account status will be changed to{" "}
                  <strong>Inactive</strong>.
                </p>
              </div>

              {/* PASSWORD */}

              <div className="mt-5">
                <label
                  className={`block text-xs font-semibold mb-2 ${
                    darkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Administrator Password
                </label>

                <div className="relative">
                  <input
                    type={showAdminPassword ? "text" : "password"}
                    value={adminPassword}
                    onChange={(event) => setAdminPassword(event.target.value)}
                    placeholder="Enter your administrator password"
                    autoComplete="current-password"
                    disabled={actionLoading}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !actionLoading) {
                        handleConfirmDeactivate();
                      }
                    }}
                    className={`w-full rounded-xl border px-4 py-3 pr-12 text-sm outline-none ${
                      darkMode
                        ? "bg-gray-950 border-gray-700 text-white placeholder:text-gray-600 focus:border-red-500"
                        : "bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-red-500"
                    }`}
                  />

                  <button
                    type="button"
                    onClick={() => setShowAdminPassword((current) => !current)}
                    disabled={actionLoading}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg text-sm ${
                      darkMode
                        ? "text-gray-400 hover:bg-gray-800"
                        : "text-gray-500 hover:bg-gray-100"
                    }`}
                    aria-label={
                      showAdminPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showAdminPassword ? "🙈" : "👁"}
                  </button>
                </div>

                <p
                  className={`text-xs mt-2 ${
                    darkMode ? "text-gray-500" : "text-gray-400"
                  }`}
                >
                  For security, your password is verified on the server and is
                  never stored.
                </p>
              </div>

              {/* FOOTER */}

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={closeDeactivateModal}
                  disabled={actionLoading}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium ${
                    darkMode
                      ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleConfirmDeactivate}
                  disabled={actionLoading || !adminPassword}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading ? "Deactivating..." : "Confirm Deactivation"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
