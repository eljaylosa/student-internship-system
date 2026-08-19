import React, { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";

// =========================================================
// TEMPORARY PAGE-LOCAL DEMO DATA
// =========================================================

const initialState = {
  users: [
    {
      id: "USR-001",
      role: "student",
      email: "student@gmail.com",
      password: "password",
      status: "Active",
      profileId: "STU-001",
    },
    {
      id: "USR-002",
      role: "registrar",
      email: "registrar@gmail.com",
      password: "password",
      status: "Active",
      profileId: "FAC-001",
    },
    {
      id: "USR-003",
      role: "company",
      email: "company@gmail.com",
      password: "password",
      status: "Active",
      profileId: "SUP-001",
    },
    {
      id: "USR-004",
      role: "admin",
      email: "admin@sims.local",
      password: "password",
      status: "Active",
      profileId: "ADM-001",
    },
  ],

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

  registrar: [
    {
      id: "FAC-001",
      userId: "USR-002",
      fullName: "Maria Santos",
      email: "registrar@gmail.com",
      facultyId: "FAC-001",
      department: "College of Information and Communications Technology",
      position: "Registrar Adviser",
      phone: "+63 917 123 4567",
      address: "Balanga, Bataan",
      specialization: "Information Technology",
      employeeId: "FAC-2026-001",
    },
  ],

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

  currentUser: {
    id: "USR-004",
    role: "admin",
    email: "admin@sims.local",
    password: "password",
    status: "Active",
    profileId: "ADM-001",
  },
};

// =========================================================
// STATUS
// =========================================================

const STATUS = {
  user: {
    ACTIVE: "Active",
    INACTIVE: "Inactive",
    PENDING: "Pending",
  },
};

// =========================================================
// COMPONENT
// =========================================================

const UserManagement = () => {
  const { darkMode } = useOutletContext();

  // =======================================================
  // LOCAL REACTIVE STATE
  // =======================================================

  const [state, setState] = useState(initialState);

  // =======================================================
  // PAGE STATE
  // =======================================================

  const [activeTab, setActiveTab] = useState("students");

  const [currentPage, setCurrentPage] = useState(1);

  // =======================================================
  // SEARCH & SORT
  // =======================================================

  const [searchQuery, setSearchQuery] = useState("");

  const [sortField, setSortField] = useState("name");

  const [sortDirection, setSortDirection] = useState("asc");

  // =======================================================
  // EDIT MODAL
  // =======================================================

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [selectedUser, setSelectedUser] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
  });

  // =======================================================
  // DEACTIVATE VERIFICATION MODAL
  // =======================================================

  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);

  const [userToDeactivate, setUserToDeactivate] = useState(null);

  const [adminPassword, setAdminPassword] = useState("");

  const [deactivateError, setDeactivateError] = useState("");

  // =======================================================
  // DELETE VERIFICATION MODAL
  // =======================================================

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [userToDelete, setUserToDelete] = useState(null);

  const [deletePassword, setDeletePassword] = useState("");

  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  const [deleteError, setDeleteError] = useState("");

  const usersPerPage = 6;

  // =========================================================
  // ROLE MAP
  // =========================================================

  const roleMap = {
    students: "student",
    registrar: "registrar",
    company: "company",
  };

  const currentRole = roleMap[activeTab];

  // =========================================================
  // TABS
  // =========================================================

  const tabs = [
    {
      key: "students",
      label: "Students",
    },
    {
      key: "registrar",
      label: "Registrar",
    },
    {
      key: "company",
      label: "Company",
    },
  ];

  // =========================================================
  // GET PROFILE
  // =========================================================

  const getUserProfile = (user) => {
    if (!user) return null;

    if (user.role === "student") {
      return state.students.find((item) => item.id === user.profileId);
    }

    if (user.role === "registrar") {
      return state.registrar.find((item) => item.id === user.profileId);
    }

    if (user.role === "company") {
      return state.supervisors.find((item) => item.id === user.profileId);
    }

    return null;
  };

  // =========================================================
  // GET ROLE LABEL
  // =========================================================

  const getRoleLabel = (role = currentRole) => {
    if (role === "student") {
      return "Student";
    }

    if (role === "registrar") {
      return "Registrar Adviser";
    }

    if (role === "company") {
      return "Company Supervisor";
    }

    if (role === "admin") {
      return "Administrator";
    }

    return "User";
  };

  // =========================================================
  // CURRENT USERS
  // =========================================================

  const currentUsers = useMemo(() => {
    return state.users.filter((user) => user.role === currentRole);
  }, [state.users, currentRole]);

  // =========================================================
  // SEARCH + SORTED USERS
  // =========================================================

  const processedUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    // -------------------------------------------------------
    // SEARCH
    // -------------------------------------------------------

    let filteredUsers = currentUsers.filter((user) => {
      const profile = getUserProfile(user);

      const id = user.profileId || user.id || "";

      const name = profile?.fullName || "";

      const email = user.email || "";

      if (!query) {
        return true;
      }

      return (
        id.toLowerCase().includes(query) ||
        name.toLowerCase().includes(query) ||
        email.toLowerCase().includes(query)
      );
    });

    // -------------------------------------------------------
    // SORT
    // -------------------------------------------------------

    filteredUsers.sort((a, b) => {
      const profileA = getUserProfile(a);
      const profileB = getUserProfile(b);

      let valueA = "";
      let valueB = "";

      if (sortField === "id") {
        valueA = a.profileId || a.id || "";
        valueB = b.profileId || b.id || "";
      }

      if (sortField === "name") {
        valueA = profileA?.fullName || a.email || "";
        valueB = profileB?.fullName || b.email || "";
      }

      if (sortField === "email") {
        valueA = a.email || "";
        valueB = b.email || "";
      }

      if (sortField === "status") {
        valueA = a.status || "";
        valueB = b.status || "";
      }

      const comparison = valueA
        .toString()
        .localeCompare(valueB.toString(), undefined, {
          numeric: true,
          sensitivity: "base",
        });

      return sortDirection === "asc" ? comparison : -comparison;
    });

    return filteredUsers;
  }, [
    currentUsers,
    searchQuery,
    sortField,
    sortDirection,
    state.students,
    state.registrar,
    state.supervisors,
  ]);

  // =========================================================
  // PAGINATION
  // =========================================================

  const totalPages = Math.ceil(processedUsers.length / usersPerPage);

  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * usersPerPage;

    return processedUsers.slice(startIndex, startIndex + usersPerPage);
  }, [processedUsers, currentPage]);

  // =========================================================
  // SEARCH CHANGE
  // =========================================================

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);

    setCurrentPage(1);
  };

  // =========================================================
  // SORT CHANGE
  // =========================================================

  const handleSortChange = (event) => {
    setSortField(event.target.value);

    setCurrentPage(1);
  };

  // =========================================================
  // SORT DIRECTION
  // =========================================================

  const handleSortDirection = () => {
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));

    setCurrentPage(1);
  };

  // =========================================================
  // CLEAR SEARCH
  // =========================================================

  const handleClearSearch = () => {
    setSearchQuery("");

    setCurrentPage(1);
  };

  // =========================================================
  // CHANGE TAB
  // =========================================================

  const handleTabChange = (tab) => {
    setActiveTab(tab);

    setCurrentPage(1);

    setSearchQuery("");

    setSortField("name");

    setSortDirection("asc");
  };

  // =========================================================
  // OPEN EDIT MODAL
  // =========================================================

  const handleEditUser = (user) => {
    const profile = getUserProfile(user);

    setSelectedUser(user);

    setFormData({
      name: profile?.fullName || "",
      email: user.email || "",
    });

    setIsEditModalOpen(true);
  };

  // =========================================================
  // CLOSE EDIT MODAL
  // =========================================================

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);

    setSelectedUser(null);

    setFormData({
      name: "",
      email: "",
    });
  };

  // =========================================================
  // FORM CHANGE
  // =========================================================

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =========================================================
  // SAVE EDITED USER
  // =========================================================

  const handleSaveUser = (event) => {
    event.preventDefault();

    if (!selectedUser) {
      return;
    }

    const name = formData.name.trim();
    const email = formData.email.trim();

    if (!name || !email) {
      return;
    }

    setState((prev) => {
      const updatedUsers = prev.users.map((user) => {
        if (user.id !== selectedUser.id) {
          return user;
        }

        return {
          ...user,
          email,
        };
      });

      let updatedStudents = prev.students;
      let updatedRegistrar = prev.registrar;
      let updatedSupervisors = prev.supervisors;

      // ===================================================
      // STUDENT PROFILE
      // ===================================================

      if (selectedUser.role === "student") {
        updatedStudents = prev.students.map((student) => {
          if (student.id !== selectedUser.profileId) {
            return student;
          }

          return {
            ...student,
            fullName: name,
            email,
          };
        });
      }

      // ===================================================
      // REGISTRAR PROFILE
      // ===================================================

      if (selectedUser.role === "registrar") {
        updatedRegistrar = prev.registrar.map((registrar) => {
          if (registrar.id !== selectedUser.profileId) {
            return registrar;
          }

          return {
            ...registrar,
            fullName: name,
            email,
          };
        });
      }

      // ===================================================
      // COMPANY SUPERVISOR PROFILE
      // ===================================================

      if (selectedUser.role === "company") {
        updatedSupervisors = prev.supervisors.map((supervisor) => {
          if (supervisor.id !== selectedUser.profileId) {
            return supervisor;
          }

          return {
            ...supervisor,
            fullName: name,
            email,
          };
        });
      }

      return {
        ...prev,
        users: updatedUsers,
        students: updatedStudents,
        registrar: updatedRegistrar,
        supervisors: updatedSupervisors,
      };
    });

    handleCloseEditModal();
  };

  // =========================================================
  // OPEN DEACTIVATE VERIFICATION
  // =========================================================

  const handleDeactivateUser = (user) => {
    if (user.id === state.currentUser.id) {
      return;
    }

    setUserToDeactivate(user);

    setAdminPassword("");

    setDeactivateError("");

    setIsDeactivateModalOpen(true);
  };

  // =========================================================
  // CLOSE DEACTIVATE MODAL
  // =========================================================

  const handleCloseDeactivateModal = () => {
    setIsDeactivateModalOpen(false);

    setUserToDeactivate(null);

    setAdminPassword("");

    setDeactivateError("");
  };

  // =========================================================
  // CONFIRM DEACTIVATE
  // =========================================================

  const handleConfirmDeactivate = () => {
    if (!userToDeactivate) {
      return;
    }

    if (state.currentUser.role !== "admin") {
      setDeactivateError("Only an administrator can deactivate user accounts.");

      return;
    }

    if (adminPassword !== state.currentUser.password) {
      setDeactivateError("Incorrect administrator password.");

      return;
    }

    setState((prev) => ({
      ...prev,
      users: prev.users.map((user) => {
        if (user.id !== userToDeactivate.id) {
          return user;
        }

        return {
          ...user,
          status: STATUS.user.INACTIVE,
        };
      }),
    }));

    handleCloseDeactivateModal();
  };

  // =========================================================
  // ACTIVATE USER
  // =========================================================

  const handleActivateUser = (user) => {
    if (user.id === state.currentUser.id) {
      return;
    }

    setState((prev) => ({
      ...prev,
      users: prev.users.map((item) => {
        if (item.id !== user.id) {
          return item;
        }

        return {
          ...item,
          status: STATUS.user.ACTIVE,
        };
      }),
    }));
  };

  // =========================================================
  // OPEN DELETE VERIFICATION
  // =========================================================

  const handleDeleteUser = (user) => {
    if (user.id === state.currentUser.id) {
      return;
    }

    setUserToDelete(user);

    setDeletePassword("");

    setDeleteConfirmation("");

    setDeleteError("");

    setIsDeleteModalOpen(true);
  };

  // =========================================================
  // CLOSE DELETE MODAL
  // =========================================================

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);

    setUserToDelete(null);

    setDeletePassword("");

    setDeleteConfirmation("");

    setDeleteError("");
  };

  // =========================================================
  // CONFIRM DELETE
  // =========================================================

  const handleConfirmDelete = () => {
    if (!userToDelete) {
      return;
    }

    if (state.currentUser.role !== "admin") {
      setDeleteError(
        "Only an administrator can permanently delete user accounts."
      );

      return;
    }

    if (deletePassword !== state.currentUser.password) {
      setDeleteError("Incorrect administrator password.");

      return;
    }

    if (deleteConfirmation.trim() !== userToDelete.email) {
      setDeleteError("The user's email does not match.");

      return;
    }

    setState((prev) => {
      const deletedUser = userToDelete;

      const updatedUsers = prev.users.filter(
        (user) => user.id !== deletedUser.id
      );

      let updatedStudents = prev.students;

      let updatedRegistrar = prev.registrar;

      let updatedSupervisors = prev.supervisors;

      // ===================================================
      // DELETE STUDENT PROFILE
      // ===================================================

      if (deletedUser.role === "student") {
        updatedStudents = prev.students.filter(
          (student) => student.id !== deletedUser.profileId
        );
      }

      // ===================================================
      // DELETE REGISTRAR PROFILE
      // ===================================================

      if (deletedUser.role === "registrar") {
        updatedRegistrar = prev.registrar.filter(
          (registrar) => registrar.id !== deletedUser.profileId
        );
      }

      // ===================================================
      // DELETE COMPANY SUPERVISOR PROFILE
      // ===================================================

      if (deletedUser.role === "company") {
        updatedSupervisors = prev.supervisors.filter(
          (supervisor) => supervisor.id !== deletedUser.profileId
        );
      }

      return {
        ...prev,
        users: updatedUsers,
        students: updatedStudents,
        registrar: updatedRegistrar,
        supervisors: updatedSupervisors,
      };
    });

    setCurrentPage((prev) => {
      const remainingUsers = Math.max(currentUsers.length - 1, 0);

      const newTotalPages = Math.ceil(remainingUsers / usersPerPage);

      return Math.min(prev, Math.max(newTotalPages, 1));
    });

    handleCloseDeleteModal();
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <div className="mb-5">
        <h1
          className={`text-xl sm:text-2xl font-bold ${
            darkMode ? "text-white" : "text-slate-900"
          }`}
        >
          User Management
        </h1>

        <p
          className={`text-xs sm:text-sm mt-1 ${
            darkMode ? "text-slate-400" : "text-slate-500"
          }`}
        >
          Manage registered students, registrars, and company supervisors.
        </p>
      </div>

      {/* =====================================================
          MAIN CARD
      ===================================================== */}

      <div
        className={`rounded-xl border shadow-sm overflow-hidden ${
          darkMode
            ? "bg-slate-900 border-slate-700"
            : "bg-white border-slate-200"
        }`}
      >
        {/* ===================================================
            TOP BAR
        =================================================== */}

        <div
          className={`px-4 sm:px-5 py-4 border-b ${
            darkMode ? "border-slate-700" : "border-slate-200"
          }`}
        >
          {/* =================================================
              TABS + INFO
          ================================================= */}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {/* TABS */}

            <div
              className={`flex items-center rounded-lg border overflow-hidden w-full sm:w-auto ${
                darkMode
                  ? "border-slate-700 bg-slate-800"
                  : "border-slate-200 bg-slate-50"
              }`}
            >
              {tabs.map((tab) => {
                const active = activeTab === tab.key;

                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => handleTabChange(tab.key)}
                    className={`flex-1 sm:flex-none px-5 py-2 text-xs font-semibold transition ${
                      active
                        ? darkMode
                          ? "bg-white text-slate-900"
                          : "bg-slate-800 text-white"
                        : darkMode
                        ? "text-slate-300 hover:bg-slate-700"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* INFO */}

            <div
              className={`text-[10px] ${
                darkMode ? "text-slate-500" : "text-slate-400"
              }`}
            >
              Account creation is handled through registration requests.
            </div>
          </div>

          {/* =================================================
              SEARCH + SORT BAR
          ================================================= */}

          <div className="mt-4 flex flex-col lg:flex-row gap-2">
            {/* SEARCH */}

            <div className="relative flex-1">
              <span
                className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none ${
                  darkMode ? "text-slate-500" : "text-slate-400"
                }`}
              >
                🔍
              </span>

              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder={`Search ${getRoleLabel()
                  .toLowerCase()
                  .replace(" adviser", "")} by ID, name, or email...`}
                className={`w-full pl-9 pr-10 py-2.5 rounded-lg border outline-none text-xs transition ${
                  darkMode
                    ? "bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-slate-500"
                    : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-slate-400"
                }`}
              />

              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-md text-sm transition ${
                    darkMode
                      ? "text-slate-400 hover:bg-slate-700 hover:text-white"
                      : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  }`}
                  title="Clear search"
                >
                  ×
                </button>
              )}
            </div>

            {/* SORT */}

            <div className="flex gap-2">
              <select
                value={sortField}
                onChange={handleSortChange}
                className={`flex-1 lg:w-40 px-3 py-2.5 rounded-lg border outline-none text-xs font-medium transition ${
                  darkMode
                    ? "bg-slate-800 border-slate-700 text-slate-200 focus:border-slate-500"
                    : "bg-white border-slate-200 text-slate-700 focus:border-slate-400"
                }`}
              >
                <option value="name">Sort by Name</option>
                <option value="id">Sort by ID</option>
                <option value="email">Sort by Email</option>
                <option value="status">Sort by Status</option>
              </select>

              <button
                type="button"
                onClick={handleSortDirection}
                title={
                  sortDirection === "asc"
                    ? "Currently ascending. Click for descending."
                    : "Currently descending. Click for ascending."
                }
                className={`w-11 rounded-lg border text-sm font-bold transition ${
                  darkMode
                    ? "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                {sortDirection === "asc" ? "↑" : "↓"}
              </button>
            </div>
          </div>

          {/* SEARCH RESULT INFO */}

          {(searchQuery || processedUsers.length !== currentUsers.length) && (
            <div
              className={`mt-3 text-[10px] ${
                darkMode ? "text-slate-500" : "text-slate-400"
              }`}
            >
              Showing {processedUsers.length} of {currentUsers.length}{" "}
              {getRoleLabel().toLowerCase()} accounts
              {searchQuery && (
                <>
                  {" "}
                  matching <strong>"{searchQuery}"</strong>
                </>
              )}
            </div>
          )}
        </div>

        {/* ===================================================
            TABLE
        =================================================== */}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse">
            <thead>
              <tr
                className={
                  darkMode
                    ? "bg-slate-800 text-slate-300"
                    : "bg-slate-50 text-slate-700"
                }
              >
                <th
                  className={`px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide border-b ${
                    darkMode ? "border-slate-700" : "border-slate-200"
                  }`}
                >
                  ID
                </th>

                <th
                  className={`px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide border-b ${
                    darkMode ? "border-slate-700" : "border-slate-200"
                  }`}
                >
                  Name
                </th>

                <th
                  className={`px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide border-b ${
                    darkMode ? "border-slate-700" : "border-slate-200"
                  }`}
                >
                  Email
                </th>

                <th
                  className={`px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide border-b ${
                    darkMode ? "border-slate-700" : "border-slate-200"
                  }`}
                >
                  Status
                </th>

                <th
                  className={`px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wide border-b ${
                    darkMode ? "border-slate-700" : "border-slate-200"
                  }`}
                >
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {paginatedUsers.map((user) => {
                const profile = getUserProfile(user);

                const displayName = profile?.fullName || user.email;

                const isCurrentAdmin = user.id === state.currentUser.id;

                return (
                  <tr
                    key={user.id}
                    className={`transition ${
                      darkMode
                        ? "border-b border-slate-700 hover:bg-slate-800/60"
                        : "border-b border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {/* ID */}

                    <td
                      className={`px-4 py-3 text-xs font-semibold ${
                        darkMode ? "text-slate-300" : "text-slate-700"
                      }`}
                    >
                      {user.profileId}
                    </td>

                    {/* NAME */}

                    <td
                      className={`px-4 py-3 text-xs font-semibold ${
                        darkMode ? "text-white" : "text-slate-900"
                      }`}
                    >
                      {displayName}
                    </td>

                    {/* EMAIL */}

                    <td
                      className={`px-4 py-3 text-xs ${
                        darkMode ? "text-slate-400" : "text-slate-600"
                      }`}
                    >
                      {user.email}
                    </td>

                    {/* STATUS */}

                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold ${
                          user.status === STATUS.user.ACTIVE
                            ? darkMode
                              ? "bg-green-950 text-green-400 border border-green-800"
                              : "bg-green-100 text-green-700 border border-green-200"
                            : user.status === STATUS.user.PENDING
                            ? darkMode
                              ? "bg-yellow-950 text-yellow-400 border border-yellow-800"
                              : "bg-yellow-100 text-yellow-700 border border-yellow-200"
                            : darkMode
                            ? "bg-red-950 text-red-400 border border-red-800"
                            : "bg-red-100 text-red-700 border border-red-200"
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>

                    {/* ACTIONS */}

                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        {/* EDIT */}

                        <button
                          type="button"
                          onClick={() => handleEditUser(user)}
                          className={`px-4 py-1.5 rounded-md text-[10px] font-bold transition ${
                            darkMode
                              ? "bg-slate-700 text-white hover:bg-slate-600"
                              : "bg-slate-700 text-white hover:bg-slate-800"
                          }`}
                        >
                          Edit
                        </button>

                        {/* ACTIVATE */}

                        {user.status === STATUS.user.INACTIVE && (
                          <button
                            type="button"
                            disabled={isCurrentAdmin}
                            onClick={() => handleActivateUser(user)}
                            className={`px-4 py-1.5 rounded-md text-[10px] font-bold border transition ${
                              isCurrentAdmin
                                ? darkMode
                                  ? "text-slate-600 border-slate-700 cursor-not-allowed"
                                  : "text-slate-300 border-slate-200 cursor-not-allowed"
                                : darkMode
                                ? "text-green-400 border-green-800 hover:bg-green-950"
                                : "text-green-700 border-green-200 hover:bg-green-50"
                            }`}
                          >
                            Activate
                          </button>
                        )}

                        {/* DEACTIVATE */}

                        {user.status !== STATUS.user.INACTIVE && (
                          <button
                            type="button"
                            disabled={isCurrentAdmin}
                            onClick={() => handleDeactivateUser(user)}
                            className={`px-4 py-1.5 rounded-md text-[10px] font-bold border transition ${
                              isCurrentAdmin
                                ? darkMode
                                  ? "text-slate-600 border-slate-700 cursor-not-allowed"
                                  : "text-slate-300 border-slate-200 cursor-not-allowed"
                                : darkMode
                                ? "text-orange-400 border-orange-800 hover:bg-orange-950"
                                : "text-orange-600 border-orange-200 hover:bg-orange-50"
                            }`}
                          >
                            Deactivate
                          </button>
                        )}

                        {/* DELETE */}

                        <button
                          type="button"
                          disabled={isCurrentAdmin}
                          onClick={() => handleDeleteUser(user)}
                          className={`px-4 py-1.5 rounded-md text-[10px] font-bold border transition ${
                            isCurrentAdmin
                              ? darkMode
                                ? "text-slate-600 border-slate-700 cursor-not-allowed"
                                : "text-slate-300 border-slate-200 cursor-not-allowed"
                              : darkMode
                              ? "text-red-400 border-red-800 hover:bg-red-950"
                              : "text-red-600 border-red-200 hover:bg-red-50"
                          }`}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {/* EMPTY STATE */}

              {paginatedUsers.length === 0 && (
                <tr>
                  <td
                    colSpan="5"
                    className={`px-4 py-12 text-center text-sm ${
                      darkMode ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    {searchQuery
                      ? `No ${getRoleLabel()
                          .toLowerCase()
                          .replace(" adviser", "")} accounts match your search.`
                      : `No ${getRoleLabel().toLowerCase()} accounts found.`}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ===================================================
            PAGINATION
        =================================================== */}

        <div
          className={`px-4 sm:px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
            darkMode ? "bg-slate-900" : "bg-white"
          }`}
        >
          <p
            className={`text-[10px] sm:text-xs ${
              darkMode ? "text-slate-400" : "text-slate-500"
            }`}
          >
            Showing{" "}
            {processedUsers.length === 0
              ? 0
              : (currentPage - 1) * usersPerPage + 1}{" "}
            - {Math.min(currentPage * usersPerPage, processedUsers.length)} of{" "}
            {processedUsers.length} users
          </p>

          <div className="flex items-center justify-center sm:justify-end gap-1">
            {/* PREVIOUS */}

            <button
              type="button"
              disabled={currentPage === 1 || totalPages === 0}
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              className={`w-8 h-8 rounded-md text-xs font-bold transition ${
                currentPage === 1 || totalPages === 0
                  ? darkMode
                    ? "text-slate-600 cursor-not-allowed"
                    : "text-slate-300 cursor-not-allowed"
                  : darkMode
                  ? "text-slate-300 hover:bg-slate-800"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              ‹
            </button>

            {/* PAGE NUMBERS */}

            {Array.from(
              {
                length: Math.max(totalPages, 1),
              },
              (_, index) => index + 1
            ).map((page) => (
              <button
                key={page}
                type="button"
                disabled={totalPages === 0}
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 rounded-md text-xs font-bold transition ${
                  currentPage === page
                    ? darkMode
                      ? "bg-white text-slate-900"
                      : "bg-slate-800 text-white"
                    : darkMode
                    ? "text-slate-300 hover:bg-slate-800"
                    : "text-slate-600 hover:bg-slate-100"
                } ${
                  totalPages === 0 ? "text-slate-300 cursor-not-allowed" : ""
                }`}
              >
                {page}
              </button>
            ))}

            {/* NEXT */}

            <button
              type="button"
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              className={`w-8 h-8 rounded-md text-xs font-bold transition ${
                currentPage === totalPages || totalPages === 0
                  ? darkMode
                    ? "text-slate-600 cursor-not-allowed"
                    : "text-slate-300 cursor-not-allowed"
                  : darkMode
                  ? "text-slate-300 hover:bg-slate-800"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              ›
            </button>
          </div>
        </div>
      </div>

      {/* =====================================================
          EDIT USER MODAL
      ===================================================== */}

      {isEditModalOpen && selectedUser && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              handleCloseEditModal();
            }
          }}
        >
          <div
            className={`w-full max-w-md rounded-xl shadow-2xl border overflow-hidden ${
              darkMode
                ? "bg-slate-900 border-slate-700"
                : "bg-white border-slate-200"
            }`}
          >
            {/* HEADER */}

            <div
              className={`px-5 py-4 border-b flex items-center justify-between ${
                darkMode ? "border-slate-700" : "border-slate-200"
              }`}
            >
              <div>
                <h2
                  className={`text-sm sm:text-base font-bold ${
                    darkMode ? "text-white" : "text-slate-900"
                  }`}
                >
                  Edit User
                </h2>

                <p
                  className={`text-[10px] mt-1 ${
                    darkMode ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  Update account information and status.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseEditModal}
                className={`w-8 h-8 rounded-lg text-lg transition ${
                  darkMode
                    ? "text-slate-400 hover:bg-slate-800 hover:text-white"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                ×
              </button>
            </div>

            {/* FORM */}

            <form onSubmit={handleSaveUser}>
              <div className="px-5 py-5 space-y-4">
                {/* USER TYPE */}

                <div>
                  <label
                    className={`block text-xs font-semibold mb-1.5 ${
                      darkMode ? "text-slate-300" : "text-slate-700"
                    }`}
                  >
                    User Type
                  </label>

                  <div
                    className={`w-full px-3 py-2.5 rounded-lg border text-xs ${
                      darkMode
                        ? "bg-slate-800 border-slate-700 text-slate-300"
                        : "bg-slate-50 border-slate-200 text-slate-600"
                    }`}
                  >
                    {getRoleLabel(selectedUser.role)}
                  </div>
                </div>

                {/* ACCOUNT ID */}

                <div>
                  <label
                    className={`block text-xs font-semibold mb-1.5 ${
                      darkMode ? "text-slate-300" : "text-slate-700"
                    }`}
                  >
                    Account ID
                  </label>

                  <div
                    className={`w-full px-3 py-2.5 rounded-lg border text-xs ${
                      darkMode
                        ? "bg-slate-800 border-slate-700 text-slate-400"
                        : "bg-slate-50 border-slate-200 text-slate-500"
                    }`}
                  >
                    {selectedUser.id}
                  </div>
                </div>

                {/* NAME */}

                <div>
                  <label
                    htmlFor="user-name"
                    className={`block text-xs font-semibold mb-1.5 ${
                      darkMode ? "text-slate-300" : "text-slate-700"
                    }`}
                  >
                    Name
                  </label>

                  <input
                    id="user-name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleFormChange}
                    placeholder="Enter full name"
                    required
                    className={`w-full px-3 py-2.5 rounded-lg border outline-none text-xs transition ${
                      darkMode
                        ? "bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-slate-400"
                        : "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-slate-600"
                    }`}
                  />
                </div>

                {/* EMAIL */}

                <div>
                  <label
                    htmlFor="user-email"
                    className={`block text-xs font-semibold mb-1.5 ${
                      darkMode ? "text-slate-300" : "text-slate-700"
                    }`}
                  >
                    Email
                  </label>

                  <input
                    id="user-email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleFormChange}
                    placeholder="Enter email address"
                    required
                    className={`w-full px-3 py-2.5 rounded-lg border outline-none text-xs transition ${
                      darkMode
                        ? "bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-slate-400"
                        : "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-slate-600"
                    }`}
                  />
                </div>
              </div>

              {/* ACTIONS */}

              <div
                className={`px-5 py-4 border-t flex justify-end gap-2 ${
                  darkMode ? "border-slate-700" : "border-slate-200"
                }`}
              >
                <button
                  type="button"
                  onClick={handleCloseEditModal}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
                    darkMode
                      ? "text-slate-300 hover:bg-slate-800"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                    darkMode
                      ? "bg-white text-slate-900 hover:bg-slate-200"
                      : "bg-slate-800 text-white hover:bg-slate-700"
                  }`}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================
          DEACTIVATE VERIFICATION MODAL
      ===================================================== */}

      {isDeactivateModalOpen && userToDeactivate && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              handleCloseDeactivateModal();
            }
          }}
        >
          <div
            className={`w-full max-w-md rounded-xl shadow-2xl border overflow-hidden ${
              darkMode
                ? "bg-slate-900 border-slate-700"
                : "bg-white border-slate-200"
            }`}
          >
            {/* HEADER */}

            <div
              className={`px-5 py-4 border-b ${
                darkMode ? "border-slate-700" : "border-slate-200"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                    darkMode
                      ? "bg-orange-950 text-orange-400"
                      : "bg-orange-100 text-orange-600"
                  }`}
                >
                  !
                </div>

                <div>
                  <h2
                    className={`text-sm sm:text-base font-bold ${
                      darkMode ? "text-white" : "text-slate-900"
                    }`}
                  >
                    Deactivate User
                  </h2>

                  <p
                    className={`text-[10px] mt-1 ${
                      darkMode ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    Administrator verification required.
                  </p>
                </div>
              </div>
            </div>

            {/* CONTENT */}

            <div className="px-5 py-5 space-y-4">
              {/* USER INFO */}

              <div
                className={`rounded-lg border p-4 ${
                  darkMode
                    ? "bg-slate-800 border-slate-700"
                    : "bg-slate-50 border-slate-200"
                }`}
              >
                <p
                  className={`text-[10px] uppercase font-bold tracking-wide mb-2 ${
                    darkMode ? "text-slate-500" : "text-slate-400"
                  }`}
                >
                  Account to be deactivated
                </p>

                <p
                  className={`text-sm font-bold ${
                    darkMode ? "text-white" : "text-slate-900"
                  }`}
                >
                  {getUserProfile(userToDeactivate)?.fullName ||
                    userToDeactivate.email}
                </p>

                <p
                  className={`text-xs mt-1 ${
                    darkMode ? "text-slate-400" : "text-slate-600"
                  }`}
                >
                  {userToDeactivate.email}
                </p>

                <p
                  className={`text-[10px] mt-2 ${
                    darkMode ? "text-slate-500" : "text-slate-400"
                  }`}
                >
                  {getRoleLabel(userToDeactivate.role)} • {userToDeactivate.id}
                </p>
              </div>

              {/* WARNING */}

              <div
                className={`text-xs leading-relaxed ${
                  darkMode ? "text-slate-400" : "text-slate-600"
                }`}
              >
                <strong
                  className={darkMode ? "text-orange-400" : "text-orange-600"}
                >
                  Note:
                </strong>{" "}
                Deactivating this account will prevent the user from accessing
                the system. The account will not be deleted and can be activated
                again later.
              </div>

              {/* ADMIN PASSWORD */}

              <div>
                <label
                  htmlFor="admin-deactivate-password"
                  className={`block text-xs font-semibold mb-1.5 ${
                    darkMode ? "text-slate-300" : "text-slate-700"
                  }`}
                >
                  Administrator Password
                </label>

                <input
                  id="admin-deactivate-password"
                  type="password"
                  value={adminPassword}
                  onChange={(event) => {
                    setAdminPassword(event.target.value);
                    setDeactivateError("");
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      handleConfirmDeactivate();
                    }
                  }}
                  placeholder="Enter your administrator password"
                  autoFocus
                  className={`w-full px-3 py-2.5 rounded-lg border outline-none text-xs transition ${
                    darkMode
                      ? "bg-slate-800 border-slate-700 text-white placeholder:text-slate-600 focus:border-orange-500"
                      : "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-orange-500"
                  }`}
                />

                {deactivateError && (
                  <p
                    className={`text-[10px] mt-1.5 ${
                      darkMode ? "text-red-400" : "text-red-600"
                    }`}
                  >
                    {deactivateError}
                  </p>
                )}
              </div>
            </div>

            {/* ACTIONS */}

            <div
              className={`px-5 py-4 border-t flex justify-end gap-2 ${
                darkMode ? "border-slate-700" : "border-slate-200"
              }`}
            >
              <button
                type="button"
                onClick={handleCloseDeactivateModal}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
                  darkMode
                    ? "text-slate-300 hover:bg-slate-800"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmDeactivate}
                disabled={!adminPassword}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                  adminPassword
                    ? "bg-orange-600 text-white hover:bg-orange-700"
                    : darkMode
                    ? "bg-slate-800 text-slate-600 cursor-not-allowed"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                }`}
              >
                Deactivate User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          DELETE VERIFICATION MODAL
      ===================================================== */}

      {isDeleteModalOpen && userToDelete && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              handleCloseDeleteModal();
            }
          }}
        >
          <div
            className={`w-full max-w-md rounded-xl shadow-2xl border overflow-hidden ${
              darkMode
                ? "bg-slate-900 border-slate-700"
                : "bg-white border-slate-200"
            }`}
          >
            {/* DELETE HEADER */}

            <div
              className={`px-5 py-4 border-b ${
                darkMode ? "border-slate-700" : "border-slate-200"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                    darkMode
                      ? "bg-red-950 text-red-400"
                      : "bg-red-100 text-red-600"
                  }`}
                >
                  !
                </div>

                <div>
                  <h2
                    className={`text-sm sm:text-base font-bold ${
                      darkMode ? "text-white" : "text-slate-900"
                    }`}
                  >
                    Permanently Delete User
                  </h2>

                  <p
                    className={`text-[10px] mt-1 ${
                      darkMode ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>

            {/* DELETE CONTENT */}

            <div className="px-5 py-5 space-y-4">
              {/* USER INFO */}

              <div
                className={`rounded-lg border p-4 ${
                  darkMode
                    ? "bg-slate-800 border-slate-700"
                    : "bg-slate-50 border-slate-200"
                }`}
              >
                <p
                  className={`text-[10px] uppercase font-bold tracking-wide mb-2 ${
                    darkMode ? "text-slate-500" : "text-slate-400"
                  }`}
                >
                  Account to be deleted
                </p>

                <p
                  className={`text-sm font-bold ${
                    darkMode ? "text-white" : "text-slate-900"
                  }`}
                >
                  {getUserProfile(userToDelete)?.fullName || userToDelete.email}
                </p>

                <p
                  className={`text-xs mt-1 ${
                    darkMode ? "text-slate-400" : "text-slate-600"
                  }`}
                >
                  {userToDelete.email}
                </p>

                <p
                  className={`text-[10px] mt-2 ${
                    darkMode ? "text-slate-500" : "text-slate-400"
                  }`}
                >
                  {getRoleLabel(userToDelete.role)} • {userToDelete.id}
                </p>
              </div>

              {/* WARNING */}

              <div
                className={`text-xs leading-relaxed ${
                  darkMode ? "text-slate-400" : "text-slate-600"
                }`}
              >
                <strong className={darkMode ? "text-red-400" : "text-red-600"}>
                  Warning:
                </strong>{" "}
                This permanently removes the user's account and associated
                profile from the current system data.
              </div>

              {/* ADMIN PASSWORD */}

              <div>
                <label
                  htmlFor="admin-delete-password"
                  className={`block text-xs font-semibold mb-1.5 ${
                    darkMode ? "text-slate-300" : "text-slate-700"
                  }`}
                >
                  Administrator Password
                </label>

                <input
                  id="admin-delete-password"
                  type="password"
                  value={deletePassword}
                  onChange={(event) => {
                    setDeletePassword(event.target.value);
                    setDeleteError("");
                  }}
                  placeholder="Enter your administrator password"
                  className={`w-full px-3 py-2.5 rounded-lg border outline-none text-xs transition ${
                    darkMode
                      ? "bg-slate-800 border-slate-700 text-white placeholder:text-slate-600 focus:border-red-500"
                      : "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-red-500"
                  }`}
                />
              </div>

              {/* EMAIL CONFIRMATION */}

              <div>
                <label
                  htmlFor="delete-confirmation"
                  className={`block text-xs font-semibold mb-1.5 ${
                    darkMode ? "text-slate-300" : "text-slate-700"
                  }`}
                >
                  Type the user's email to confirm
                </label>

                <input
                  id="delete-confirmation"
                  type="email"
                  value={deleteConfirmation}
                  onChange={(event) => {
                    setDeleteConfirmation(event.target.value);
                    setDeleteError("");
                  }}
                  placeholder={userToDelete.email}
                  className={`w-full px-3 py-2.5 rounded-lg border outline-none text-xs transition ${
                    darkMode
                      ? "bg-slate-800 border-slate-700 text-white placeholder:text-slate-600 focus:border-red-500"
                      : "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-red-500"
                  }`}
                />
              </div>

              {/* ERROR */}

              {deleteError && (
                <p
                  className={`text-[10px] ${
                    darkMode ? "text-red-400" : "text-red-600"
                  }`}
                >
                  {deleteError}
                </p>
              )}
            </div>

            {/* DELETE ACTIONS */}

            <div
              className={`px-5 py-4 border-t flex justify-end gap-2 ${
                darkMode ? "border-slate-700" : "border-slate-200"
              }`}
            >
              <button
                type="button"
                onClick={handleCloseDeleteModal}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
                  darkMode
                    ? "text-slate-300 hover:bg-slate-800"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={
                  !deletePassword ||
                  deleteConfirmation.trim() !== userToDelete.email
                }
                onClick={handleConfirmDelete}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                  deletePassword &&
                  deleteConfirmation.trim() === userToDelete.email
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : darkMode
                    ? "bg-slate-800 text-slate-600 cursor-not-allowed"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                }`}
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
