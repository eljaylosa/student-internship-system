import React, { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";

// =========================================================
// INITIAL USER DATA
// =========================================================

const initialUsers = {
  students: [
    {
      id: "STU-001",
      name: "Juan Dela Cruz",
      email: "juan.delacruz@bpsu.edu.ph",
      status: "Active",
    },
    {
      id: "STU-002",
      name: "Maria Santos",
      email: "maria.santos@bpsu.edu.ph",
      status: "Active",
    },
    {
      id: "STU-003",
      name: "John Reyes",
      email: "john.reyes@bpsu.edu.ph",
      status: "Active",
    },
    {
      id: "STU-004",
      name: "Angela Garcia",
      email: "angela.garcia@bpsu.edu.ph",
      status: "Inactive",
    },
    {
      id: "STU-005",
      name: "Mark Villanueva",
      email: "mark.villanueva@bpsu.edu.ph",
      status: "Inactive",
    },
    {
      id: "STU-006",
      name: "Sofia Mendoza",
      email: "sofia.mendoza@bpsu.edu.ph",
      status: "Active",
    },
    {
      id: "STU-007",
      name: "Daniel Flores",
      email: "daniel.flores@bpsu.edu.ph",
      status: "Active",
    },
    {
      id: "STU-008",
      name: "Carlo Bautista",
      email: "carlo.bautista@bpsu.edu.ph",
      status: "Active",
    },
  ],

  faculty: [
    {
      id: "FAC-001",
      name: "Dr. Roberto Cruz",
      email: "roberto.cruz@bpsu.edu.ph",
      status: "Active",
    },
    {
      id: "FAC-002",
      name: "Prof. Ana Reyes",
      email: "ana.reyes@bpsu.edu.ph",
      status: "Active",
    },
    {
      id: "FAC-003",
      name: "Prof. Michael Santos",
      email: "michael.santos@bpsu.edu.ph",
      status: "Inactive",
    },
    {
      id: "FAC-004",
      name: "Dr. Patricia Garcia",
      email: "patricia.garcia@bpsu.edu.ph",
      status: "Active",
    },
    {
      id: "FAC-005",
      name: "Prof. Kevin Mendoza",
      email: "kevin.mendoza@bpsu.edu.ph",
      status: "Active",
    },
  ],

  company: [
    {
      id: "COM-001",
      name: "ABC Technologies",
      email: "hr@abctech.com",
      status: "Active",
    },
    {
      id: "COM-002",
      name: "Tech Solutions Inc.",
      email: "admin@techsolutions.com",
      status: "Active",
    },
    {
      id: "COM-003",
      name: "Bataan Digital Corp.",
      email: "hr@bataandigital.com",
      status: "Inactive",
    },
    {
      id: "COM-004",
      name: "Innovate PH",
      email: "careers@innovateph.com",
      status: "Active",
    },
    {
      id: "COM-005",
      name: "NextGen Systems",
      email: "admin@nextgensystems.com",
      status: "Active",
    },
  ],
};

// =========================================================
// COMPONENT
// =========================================================

const UserManagement = () => {
  const { darkMode } = useOutletContext();

  // =========================================================
  // STATE
  // =========================================================

  const [activeTab, setActiveTab] = useState("students");

  const [users, setUsers] = useState(initialUsers);

  const [currentPage, setCurrentPage] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [modalMode, setModalMode] = useState("add");

  const [selectedUser, setSelectedUser] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    status: "Active",
  });

  const usersPerPage = 6;

  // =========================================================
  // TABS
  // =========================================================

  const tabs = [
    {
      key: "students",
      label: "Students",
    },
    {
      key: "faculty",
      label: "Faculty",
    },
    {
      key: "company",
      label: "Company",
    },
  ];

  // =========================================================
  // CURRENT USERS
  // =========================================================

  const currentUsers = users[activeTab];

  // =========================================================
  // PAGINATION
  // =========================================================

  const totalPages = Math.ceil(currentUsers.length / usersPerPage);

  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * usersPerPage;

    return currentUsers.slice(startIndex, startIndex + usersPerPage);
  }, [currentUsers, currentPage]);

  // =========================================================
  // CHANGE TAB
  // =========================================================

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  // =========================================================
  // OPEN ADD MODAL
  // =========================================================

  const handleAddUser = () => {
    setModalMode("add");

    setSelectedUser(null);

    setFormData({
      name: "",
      email: "",
      status: "Active",
    });

    setIsModalOpen(true);
  };

  // =========================================================
  // OPEN EDIT MODAL
  // =========================================================

  const handleEditUser = (user) => {
    setModalMode("edit");

    setSelectedUser(user);

    setFormData({
      name: user.name,
      email: user.email,
      status: user.status,
    });

    setIsModalOpen(true);
  };

  // =========================================================
  // CLOSE MODAL
  // =========================================================

  const handleCloseModal = () => {
    setIsModalOpen(false);

    setSelectedUser(null);

    setFormData({
      name: "",
      email: "",
      status: "Active",
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
  // SAVE USER
  // =========================================================

  const handleSaveUser = (event) => {
    event.preventDefault();

    if (!formData.name.trim() || !formData.email.trim()) {
      return;
    }

    // -------------------------------------------------------
    // EDIT USER
    // -------------------------------------------------------

    if (modalMode === "edit" && selectedUser) {
      setUsers((prev) => ({
        ...prev,

        [activeTab]: prev[activeTab].map((user) =>
          user.id === selectedUser.id
            ? {
                ...user,
                name: formData.name.trim(),
                email: formData.email.trim(),
                status: formData.status,
              }
            : user
        ),
      }));
    }

    // -------------------------------------------------------
    // ADD USER
    // -------------------------------------------------------

    else {
      const prefixes = {
        students: "STU",
        faculty: "FAC",
        company: "COM",
      };

      const prefix = prefixes[activeTab];

      const newNumber = String(currentUsers.length + 1).padStart(3, "0");

      const newUser = {
        id: `${prefix}-${newNumber}`,
        name: formData.name.trim(),
        email: formData.email.trim(),
        status: formData.status,
      };

      setUsers((prev) => ({
        ...prev,

        [activeTab]: [...prev[activeTab], newUser],
      }));
    }

    handleCloseModal();
  };

  // =========================================================
  // TABLE LABEL
  // =========================================================

  const getRoleLabel = () => {
    if (activeTab === "students") {
      return "Student";
    }

    if (activeTab === "faculty") {
      return "Faculty Adviser";
    }

    return "Company Supervisor";
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
          Manage students, faculty advisers, and company supervisors.
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
          className={`px-4 sm:px-5 py-4 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
            darkMode ? "border-slate-700" : "border-slate-200"
          }`}
        >
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

          {/* ADD USER */}

          <button
            type="button"
            onClick={handleAddUser}
            className={`w-full sm:w-auto px-4 py-2 rounded-lg text-xs font-bold transition ${
              darkMode
                ? "bg-white text-slate-900 hover:bg-slate-200"
                : "bg-slate-800 text-white hover:bg-slate-700"
            }`}
          >
            + Add User
          </button>
        </div>

        {/* ===================================================
            TABLE
        =================================================== */}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] border-collapse">
            {/* TABLE HEADER */}

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
                    darkMode
                      ? "border-slate-700"
                      : "border-slate-200"
                  }`}
                >
                  ID
                </th>

                <th
                  className={`px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide border-b ${
                    darkMode
                      ? "border-slate-700"
                      : "border-slate-200"
                  }`}
                >
                  Name
                </th>

                <th
                  className={`px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide border-b ${
                    darkMode
                      ? "border-slate-700"
                      : "border-slate-200"
                  }`}
                >
                  Email
                </th>

                <th
                  className={`px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide border-b ${
                    darkMode
                      ? "border-slate-700"
                      : "border-slate-200"
                  }`}
                >
                  Status
                </th>

                <th
                  className={`px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wide border-b ${
                    darkMode
                      ? "border-slate-700"
                      : "border-slate-200"
                  }`}
                >
                  Actions
                </th>
              </tr>
            </thead>

            {/* TABLE BODY */}

            <tbody>
              {paginatedUsers.map((user) => (
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
                    {user.id}
                  </td>

                  {/* NAME */}

                  <td
                    className={`px-4 py-3 text-xs font-semibold ${
                      darkMode ? "text-white" : "text-slate-900"
                    }`}
                  >
                    {user.name}
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
                        user.status === "Active"
                          ? darkMode
                            ? "bg-green-950 text-green-400 border border-green-800"
                            : "bg-green-100 text-green-700 border border-green-200"
                          : darkMode
                          ? "bg-red-950 text-red-400 border border-red-800"
                          : "bg-red-100 text-red-700 border border-red-200"
                      }`}
                    >
                      {user.status}
                    </span>
                  </td>

                  {/* ACTION */}

                  <td className="px-4 py-3 text-center">
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
                  </td>
                </tr>
              ))}

              {/* EMPTY STATE */}

              {paginatedUsers.length === 0 && (
                <tr>
                  <td
                    colSpan="5"
                    className={`px-4 py-12 text-center text-sm ${
                      darkMode
                        ? "text-slate-400"
                        : "text-slate-500"
                    }`}
                  >
                    No {getRoleLabel().toLowerCase()} accounts found.
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
            darkMode
              ? "bg-slate-900"
              : "bg-white"
          }`}
        >
          {/* RECORD COUNT */}

          <p
            className={`text-[10px] sm:text-xs ${
              darkMode ? "text-slate-400" : "text-slate-500"
            }`}
          >
            Showing{" "}
            {currentUsers.length === 0
              ? 0
              : (currentPage - 1) * usersPerPage + 1}{" "}
            -{" "}
            {Math.min(
              currentPage * usersPerPage,
              currentUsers.length
            )}{" "}
            of {currentUsers.length} users
          </p>

          {/* PAGE BUTTONS */}

          <div className="flex items-center justify-center sm:justify-end gap-1">
            {/* PREVIOUS */}

            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() =>
                setCurrentPage((prev) => Math.max(prev - 1, 1))
              }
              className={`w-8 h-8 rounded-md text-xs font-bold transition ${
                currentPage === 1
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
              { length: Math.max(totalPages, 1) },
              (_, index) => index + 1
            ).map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 rounded-md text-xs font-bold transition ${
                  currentPage === page
                    ? darkMode
                      ? "bg-white text-slate-900"
                      : "bg-slate-800 text-white"
                    : darkMode
                    ? "text-slate-300 hover:bg-slate-800"
                    : "text-slate-600 hover:bg-slate-100"
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
                setCurrentPage((prev) =>
                  Math.min(prev + 1, totalPages)
                )
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
          ADD / EDIT MODAL
      ===================================================== */}

      {isModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              handleCloseModal();
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
            {/* MODAL HEADER */}

            <div
              className={`px-5 py-4 border-b flex items-center justify-between ${
                darkMode
                  ? "border-slate-700"
                  : "border-slate-200"
              }`}
            >
              <div>
                <h2
                  className={`text-sm sm:text-base font-bold ${
                    darkMode
                      ? "text-white"
                      : "text-slate-900"
                  }`}
                >
                  {modalMode === "add"
                    ? "Add User"
                    : "Edit User"}
                </h2>

                <p
                  className={`text-[10px] mt-1 ${
                    darkMode
                      ? "text-slate-400"
                      : "text-slate-500"
                  }`}
                >
                  {modalMode === "add"
                    ? `Add a new ${getRoleLabel().toLowerCase()} account.`
                    : `Update ${getRoleLabel().toLowerCase()} information.`}
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseModal}
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
                {/* ROLE */}

                <div>
                  <label
                    className={`block text-xs font-semibold mb-1.5 ${
                      darkMode
                        ? "text-slate-300"
                        : "text-slate-700"
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
                    {getRoleLabel()}
                  </div>
                </div>

                {/* NAME */}

                <div>
                  <label
                    htmlFor="user-name"
                    className={`block text-xs font-semibold mb-1.5 ${
                      darkMode
                        ? "text-slate-300"
                        : "text-slate-700"
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
                      darkMode
                        ? "text-slate-300"
                        : "text-slate-700"
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

                {/* STATUS */}

                <div>
                  <label
                    htmlFor="user-status"
                    className={`block text-xs font-semibold mb-1.5 ${
                      darkMode
                        ? "text-slate-300"
                        : "text-slate-700"
                    }`}
                  >
                    Status
                  </label>

                  <select
                    id="user-status"
                    name="status"
                    value={formData.status}
                    onChange={handleFormChange}
                    className={`w-full px-3 py-2.5 rounded-lg border outline-none text-xs transition ${
                      darkMode
                        ? "bg-slate-800 border-slate-700 text-white focus:border-slate-400"
                        : "bg-white border-slate-300 text-slate-900 focus:border-slate-600"
                    }`}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* MODAL ACTIONS */}

              <div
                className={`px-5 py-4 border-t flex justify-end gap-2 ${
                  darkMode
                    ? "border-slate-700"
                    : "border-slate-200"
                }`}
              >
                <button
                  type="button"
                  onClick={handleCloseModal}
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
                  {modalMode === "add"
                    ? "Add User"
                    : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;

