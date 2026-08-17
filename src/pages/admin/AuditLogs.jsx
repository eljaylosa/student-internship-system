
import React, { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";

// =========================================================
// DEMO AUDIT LOG DATA
// =========================================================

const initialAuditLogs = [
  {
    id: 1,
    timestamp: "2026-08-17 09:42:18",
    user: "System Administrator",
    action: "LOGIN",
    module: "Authentication",
    details: "Administrator logged into the system.",
  },
  {
    id: 2,
    timestamp: "2026-08-17 09:35:04",
    user: "System Administrator",
    action: "APPROVE",
    module: "User Management",
    details: "Approved a new student account.",
  },
  {
    id: 3,
    timestamp: "2026-08-17 09:21:37",
    user: "System Administrator",
    action: "VERIFY",
    module: "Company Management",
    details: "Verified company registration details.",
  },
  {
    id: 4,
    timestamp: "2026-08-17 08:54:12",
    user: "Faculty Adviser",
    action: "UPDATE",
    module: "Evaluation Management",
    details: "Updated internship evaluation criteria.",
  },
  {
    id: 5,
    timestamp: "2026-08-17 08:32:49",
    user: "System Administrator",
    action: "CREATE",
    module: "System Notifications",
    details: "Created a new system notification.",
  },
  {
    id: 6,
    timestamp: "2026-08-16 16:47:25",
    user: "Company Supervisor",
    action: "SUBMIT",
    module: "Evaluation Management",
    details: "Submitted an intern performance evaluation.",
  },
  {
    id: 7,
    timestamp: "2026-08-16 15:29:51",
    user: "System Administrator",
    action: "DOWNLOAD",
    module: "Document Management",
    details: "Downloaded internship document template.",
  },
  {
    id: 8,
    timestamp: "2026-08-16 14:18:33",
    user: "System Administrator",
    action: "UPDATE",
    module: "System Settings",
    details: "Updated system configuration settings.",
  },
  {
    id: 9,
    timestamp: "2026-08-16 13:06:17",
    user: "Faculty Adviser",
    action: "VIEW",
    module: "Internship Records",
    details: "Viewed internship placement records.",
  },
  {
    id: 10,
    timestamp: "2026-08-16 11:42:08",
    user: "System Administrator",
    action: "EXPORT",
    module: "Reports",
    details: "Exported system activity report.",
  },
  {
    id: 11,
    timestamp: "2026-08-15 17:26:41",
    user: "System Administrator",
    action: "DELETE",
    module: "User Management",
    details: "Removed an inactive user account.",
  },
  {
    id: 12,
    timestamp: "2026-08-15 15:11:26",
    user: "Student",
    action: "UPLOAD",
    module: "Document Management",
    details: "Uploaded internship requirement document.",
  },
];

// =========================================================
// COMPONENT
// =========================================================

const AuditLogs = () => {
  const { darkMode } = useOutletContext();

  // =========================================================
  // STATE
  // =========================================================

  const [auditLogs] = useState(initialAuditLogs);

  const [searchTerm, setSearchTerm] = useState("");

  const [dateFrom, setDateFrom] = useState("");

  const [dateTo, setDateTo] = useState("");

  const [actionFilter, setActionFilter] = useState("All Actions");

  const [moduleFilter, setModuleFilter] = useState("All Modules");

  const [showFilters, setShowFilters] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);

  const rowsPerPage = 8;

  // =========================================================
  // FILTER OPTIONS
  // =========================================================

  const actions = [
    "All Actions",
    "LOGIN",
    "LOGOUT",
    "CREATE",
    "UPDATE",
    "DELETE",
    "APPROVE",
    "VERIFY",
    "SUBMIT",
    "UPLOAD",
    "DOWNLOAD",
    "EXPORT",
    "VIEW",
  ];

  const modules = [
    "All Modules",
    "Authentication",
    "User Management",
    "Company Management",
    "Internship Records",
    "Document Management",
    "Evaluation Management",
    "Reports",
    "System Notifications",
    "System Settings",
  ];

  // =========================================================
  // FILTER LOGS
  // =========================================================

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const search = searchTerm.toLowerCase().trim();

      const matchesSearch =
        !search ||
        log.user.toLowerCase().includes(search) ||
        log.action.toLowerCase().includes(search) ||
        log.module.toLowerCase().includes(search) ||
        log.details.toLowerCase().includes(search) ||
        log.timestamp.toLowerCase().includes(search);

      const logDate = log.timestamp.substring(0, 10);

      const matchesDateFrom =
        !dateFrom || logDate >= dateFrom;

      const matchesDateTo =
        !dateTo || logDate <= dateTo;

      const matchesAction =
        actionFilter === "All Actions" ||
        log.action === actionFilter;

      const matchesModule =
        moduleFilter === "All Modules" ||
        log.module === moduleFilter;

      return (
        matchesSearch &&
        matchesDateFrom &&
        matchesDateTo &&
        matchesAction &&
        matchesModule
      );
    });
  }, [
    auditLogs,
    searchTerm,
    dateFrom,
    dateTo,
    actionFilter,
    moduleFilter,
  ]);

  // =========================================================
  // PAGINATION
  // =========================================================

  const totalPages = Math.max(
    1,
    Math.ceil(filteredLogs.length / rowsPerPage)
  );

  const safeCurrentPage = Math.min(currentPage, totalPages);

  const startIndex = (safeCurrentPage - 1) * rowsPerPage;

  const currentLogs = filteredLogs.slice(
    startIndex,
    startIndex + rowsPerPage
  );

  // =========================================================
  // RESET PAGE WHEN FILTERS CHANGE
  // =========================================================

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleDateFromChange = (value) => {
    setDateFrom(value);
    setCurrentPage(1);
  };

  const handleDateToChange = (value) => {
    setDateTo(value);
    setCurrentPage(1);
  };

  const handleActionChange = (value) => {
    setActionFilter(value);
    setCurrentPage(1);
  };

  const handleModuleChange = (value) => {
    setModuleFilter(value);
    setCurrentPage(1);
  };

  // =========================================================
  // CLEAR FILTERS
  // =========================================================

  const clearFilters = () => {
    setSearchTerm("");
    setDateFrom("");
    setDateTo("");
    setActionFilter("All Actions");
    setModuleFilter("All Modules");
    setCurrentPage(1);
  };

  // =========================================================
  // CSV EXPORT
  // =========================================================

  const exportCSV = () => {
    if (filteredLogs.length === 0) {
      return;
    }

    const headers = [
      "Timestamp",
      "User",
      "Action",
      "Module",
      "Details",
    ];

    const rows = filteredLogs.map((log) => [
      log.timestamp,
      log.user,
      log.action,
      log.module,
      log.details,
    ]);

    const csvContent = [
      headers,
      ...rows,
    ]
      .map((row) =>
        row
          .map((value) => {
            const text = String(value ?? "");

            return `"${text.replace(/"/g, '""')}"`;
          })
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download = `audit-logs-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  // =========================================================
  // ACTION BADGE
  // =========================================================

  const getActionClass = (action) => {
    if (darkMode) {
      switch (action) {
        case "LOGIN":
        case "APPROVE":
        case "VERIFY":
          return "bg-emerald-950 text-emerald-400 border-emerald-800";

        case "DELETE":
          return "bg-red-950 text-red-400 border-red-800";

        case "UPDATE":
        case "CREATE":
          return "bg-blue-950 text-blue-400 border-blue-800";

        case "SUBMIT":
        case "UPLOAD":
          return "bg-purple-950 text-purple-400 border-purple-800";

        case "DOWNLOAD":
        case "EXPORT":
          return "bg-amber-950 text-amber-400 border-amber-800";

        default:
          return "bg-slate-800 text-slate-300 border-slate-700";
      }
    }

    switch (action) {
      case "LOGIN":
      case "APPROVE":
      case "VERIFY":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";

      case "DELETE":
        return "bg-red-50 text-red-700 border-red-200";

      case "UPDATE":
      case "CREATE":
        return "bg-blue-50 text-blue-700 border-blue-200";

      case "SUBMIT":
      case "UPLOAD":
        return "bg-purple-50 text-purple-700 border-purple-200";

      case "DOWNLOAD":
      case "EXPORT":
        return "bg-amber-50 text-amber-700 border-amber-200";

      default:
        return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  // =========================================================
  // PAGE BUTTONS
  // =========================================================

  const pageButtons = Array.from(
    { length: totalPages },
    (_, index) => index + 1
  );

  // =========================================================
  // RETURN
  // =========================================================

  return (
    <div
      className={`min-h-[calc(100vh-5rem)] px-4 py-5 sm:px-6 lg:px-8 transition-colors duration-300 ${
        darkMode
          ? "bg-slate-950 text-slate-100"
          : "bg-slate-50 text-slate-900"
      }`}
    >
      <div className="max-w-[1400px] mx-auto">

        {/* ===================================================
            PAGE HEADER
        =================================================== */}

        <div className="mb-5">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <p
                className={`text-xs font-medium mb-1 ${
                  darkMode
                    ? "text-slate-500"
                    : "text-slate-400"
                }`}
              >
                Administration / Security
              </p>

              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                Audit Logs
              </h1>

              <p
                className={`text-xs sm:text-sm mt-1 ${
                  darkMode
                    ? "text-slate-400"
                    : "text-slate-500"
                }`}
              >
                Review and monitor system activity and administrative actions.
              </p>
            </div>

            <div
              className={`text-xs px-3 py-2 rounded-lg border ${
                darkMode
                  ? "bg-slate-900 border-slate-700 text-slate-400"
                  : "bg-white border-slate-200 text-slate-500"
              }`}
            >
              {filteredLogs.length}{" "}
              {filteredLogs.length === 1 ? "record" : "records"}
            </div>
          </div>
        </div>

        {/* ===================================================
            MAIN PANEL
        =================================================== */}

        <div
          className={`rounded-xl border shadow-sm overflow-hidden ${
            darkMode
              ? "bg-slate-900 border-slate-700"
              : "bg-white border-slate-200"
          }`}
        >

          {/* =================================================
              TOOLBAR
          ================================================= */}

          <div
            className={`p-4 border-b ${
              darkMode
                ? "border-slate-700"
                : "border-slate-200"
            }`}
          >
            <div className="flex flex-col xl:flex-row gap-3">

              {/* SEARCH */}

              <div className="relative flex-1">
                <span
                  className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm ${
                    darkMode
                      ? "text-slate-500"
                      : "text-slate-400"
                  }`}
                >
                  🔍
                </span>

                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) =>
                    handleSearchChange(e.target.value)
                  }
                  placeholder="Search audit logs..."
                  className={`w-full h-10 pl-9 pr-3 rounded-lg border text-xs outline-none transition ${
                    darkMode
                      ? "bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-blue-500"
                      : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-slate-400"
                  }`}
                />
              </div>

              {/* DATE FROM */}

              <div className="flex items-center gap-2">
                <label
                  className={`text-[10px] font-semibold whitespace-nowrap ${
                    darkMode
                      ? "text-slate-400"
                      : "text-slate-500"
                  }`}
                >
                  From
                </label>

                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) =>
                    handleDateFromChange(e.target.value)
                  }
                  className={`h-10 px-3 rounded-lg border text-xs outline-none transition ${
                    darkMode
                      ? "bg-slate-800 border-slate-700 text-slate-200 focus:border-blue-500"
                      : "bg-slate-50 border-slate-200 text-slate-700 focus:border-slate-400"
                  }`}
                />
              </div>

              {/* DATE TO */}

              <div className="flex items-center gap-2">
                <label
                  className={`text-[10px] font-semibold whitespace-nowrap ${
                    darkMode
                      ? "text-slate-400"
                      : "text-slate-500"
                  }`}
                >
                  To
                </label>

                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) =>
                    handleDateToChange(e.target.value)
                  }
                  className={`h-10 px-3 rounded-lg border text-xs outline-none transition ${
                    darkMode
                      ? "bg-slate-800 border-slate-700 text-slate-200 focus:border-blue-500"
                      : "bg-slate-50 border-slate-200 text-slate-700 focus:border-slate-400"
                  }`}
                />
              </div>

              {/* FILTER BUTTON */}

              <button
                type="button"
                onClick={() =>
                  setShowFilters((prev) => !prev)
                }
                className={`h-10 px-4 rounded-lg border text-xs font-semibold transition ${
                  showFilters
                    ? darkMode
                      ? "bg-white text-slate-900 border-white"
                      : "bg-slate-800 text-white border-slate-800"
                    : darkMode
                    ? "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                    : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                }`}
              >
                ⚙ Filter
              </button>

              {/* EXPORT */}

              <button
                type="button"
                onClick={exportCSV}
                disabled={filteredLogs.length === 0}
                className={`h-10 px-4 rounded-lg text-xs font-semibold transition ${
                  filteredLogs.length === 0
                    ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                    : darkMode
                    ? "bg-white text-slate-900 hover:bg-slate-200"
                    : "bg-slate-800 text-white hover:bg-slate-700"
                }`}
              >
                ↓ Export CSV
              </button>
            </div>

            {/* =================================================
                ADVANCED FILTERS
            ================================================= */}

            {showFilters && (
              <div
                className={`mt-4 pt-4 border-t grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 ${
                  darkMode
                    ? "border-slate-700"
                    : "border-slate-200"
                }`}
              >
                {/* ACTION */}

                <div>
                  <label
                    className={`block text-[10px] font-bold mb-1.5 ${
                      darkMode
                        ? "text-slate-400"
                        : "text-slate-500"
                    }`}
                  >
                    Action
                  </label>

                  <select
                    value={actionFilter}
                    onChange={(e) =>
                      handleActionChange(e.target.value)
                    }
                    className={`w-full h-9 px-3 rounded-lg border text-xs outline-none ${
                      darkMode
                        ? "bg-slate-800 border-slate-700 text-slate-200"
                        : "bg-white border-slate-200 text-slate-700"
                    }`}
                  >
                    {actions.map((action) => (
                      <option key={action} value={action}>
                        {action}
                      </option>
                    ))}
                  </select>
                </div>

                {/* MODULE */}

                <div>
                  <label
                    className={`block text-[10px] font-bold mb-1.5 ${
                      darkMode
                        ? "text-slate-400"
                        : "text-slate-500"
                    }`}
                  >
                    Module
                  </label>

                  <select
                    value={moduleFilter}
                    onChange={(e) =>
                      handleModuleChange(e.target.value)
                    }
                    className={`w-full h-9 px-3 rounded-lg border text-xs outline-none ${
                      darkMode
                        ? "bg-slate-800 border-slate-700 text-slate-200"
                        : "bg-white border-slate-200 text-slate-700"
                    }`}
                  >
                    {modules.map((module) => (
                      <option key={module} value={module}>
                        {module}
                      </option>
                    ))}
                  </select>
                </div>

                {/* CLEAR */}

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={clearFilters}
                    className={`h-9 px-4 rounded-lg text-xs font-semibold transition ${
                      darkMode
                        ? "text-slate-400 hover:bg-slate-800 hover:text-white"
                        : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                    }`}
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* =================================================
              TABLE
          ================================================= */}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse">

              {/* TABLE HEADER */}

              <thead>
                <tr
                  className={
                    darkMode
                      ? "bg-slate-800/70"
                      : "bg-slate-50"
                  }
                >
                  <th
                    className={`px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide border-b ${
                      darkMode
                        ? "text-slate-400 border-slate-700"
                        : "text-slate-500 border-slate-200"
                    }`}
                  >
                    Timestamp
                  </th>

                  <th
                    className={`px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide border-b ${
                      darkMode
                        ? "text-slate-400 border-slate-700"
                        : "text-slate-500 border-slate-200"
                    }`}
                  >
                    User
                  </th>

                  <th
                    className={`px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide border-b ${
                      darkMode
                        ? "text-slate-400 border-slate-700"
                        : "text-slate-500 border-slate-200"
                    }`}
                  >
                    Action
                  </th>

                  <th
                    className={`px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide border-b ${
                      darkMode
                        ? "text-slate-400 border-slate-700"
                        : "text-slate-500 border-slate-200"
                    }`}
                  >
                    Module
                  </th>

                  <th
                    className={`px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide border-b ${
                      darkMode
                        ? "text-slate-400 border-slate-700"
                        : "text-slate-500 border-slate-200"
                    }`}
                  >
                    Details
                  </th>
                </tr>
              </thead>

              {/* TABLE BODY */}

              <tbody>
                {currentLogs.length > 0 ? (
                  currentLogs.map((log) => (
                    <tr
                      key={log.id}
                      className={`transition ${
                        darkMode
                          ? "border-b border-slate-800 hover:bg-slate-800/60"
                          : "border-b border-slate-100 hover:bg-slate-50"
                      }`}
                    >
                      {/* TIMESTAMP */}

                      <td className="px-4 py-3 align-top">
                        <span
                          className={`text-[11px] font-mono whitespace-nowrap ${
                            darkMode
                              ? "text-slate-300"
                              : "text-slate-600"
                          }`}
                        >
                          {log.timestamp}
                        </span>
                      </td>

                      {/* USER */}

                      <td className="px-4 py-3 align-top">
                        <div className="flex items-center gap-2.5">

                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 ${
                              darkMode
                                ? "bg-slate-700 text-slate-200"
                                : "bg-slate-200 text-slate-600"
                            }`}
                          >
                            {log.user
                              .split(" ")
                              .map((word) => word[0])
                              .slice(0, 2)
                              .join("")}
                          </div>

                          <span
                            className={`text-xs font-semibold whitespace-nowrap ${
                              darkMode
                                ? "text-slate-200"
                                : "text-slate-700"
                            }`}
                          >
                            {log.user}
                          </span>
                        </div>
                      </td>

                      {/* ACTION */}

                      <td className="px-4 py-3 align-top">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-md border text-[9px] font-bold tracking-wide ${
                            getActionClass(log.action)
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>

                      {/* MODULE */}

                      <td className="px-4 py-3 align-top">
                        <span
                          className={`text-xs font-medium ${
                            darkMode
                              ? "text-slate-300"
                              : "text-slate-600"
                          }`}
                        >
                          {log.module}
                        </span>
                      </td>

                      {/* DETAILS */}

                      <td className="px-4 py-3 align-top">
                        <p
                          className={`text-xs leading-relaxed max-w-[420px] ${
                            darkMode
                              ? "text-slate-400"
                              : "text-slate-500"
                          }`}
                        >
                          {log.details}
                        </p>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-6 py-16 text-center"
                    >
                      <div className="flex flex-col items-center">

                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl mb-3 ${
                            darkMode
                              ? "bg-slate-800"
                              : "bg-slate-100"
                          }`}
                        >
                          🔍
                        </div>

                        <p className="text-sm font-bold">
                          No audit logs found
                        </p>

                        <p
                          className={`text-xs mt-1 ${
                            darkMode
                              ? "text-slate-500"
                              : "text-slate-400"
                          }`}
                        >
                          Try adjusting your search or filters.
                        </p>

                        <button
                          type="button"
                          onClick={clearFilters}
                          className={`mt-4 text-xs font-semibold ${
                            darkMode
                              ? "text-blue-400"
                              : "text-slate-700"
                          }`}
                        >
                          Clear all filters
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* =================================================
              FOOTER / PAGINATION
          ================================================= */}

          <div
            className={`px-4 py-3 border-t flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
              darkMode
                ? "border-slate-700"
                : "border-slate-200"
            }`}
          >
            <p
              className={`text-[10px] sm:text-xs ${
                darkMode
                  ? "text-slate-500"
                  : "text-slate-400"
              }`}
            >
              {filteredLogs.length > 0
                ? `Showing ${startIndex + 1}-${Math.min(
                    startIndex + rowsPerPage,
                    filteredLogs.length
                  )} of ${filteredLogs.length} records`
                : "Showing 0 records"}
            </p>

            {filteredLogs.length > 0 && (
              <div className="flex items-center gap-1">

                {/* PREVIOUS */}

                <button
                  type="button"
                  disabled={safeCurrentPage === 1}
                  onClick={() =>
                    setCurrentPage((page) =>
                      Math.max(1, page - 1)
                    )
                  }
                  className={`w-8 h-8 rounded-lg text-xs font-semibold transition ${
                    safeCurrentPage === 1
                      ? "opacity-40 cursor-not-allowed"
                      : darkMode
                      ? "hover:bg-slate-800"
                      : "hover:bg-slate-100"
                  }`}
                >
                  ‹
                </button>

                {/* PAGE NUMBERS */}

                {pageButtons.map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-lg text-xs font-semibold transition ${
                      safeCurrentPage === page
                        ? darkMode
                          ? "bg-white text-slate-900"
                          : "bg-slate-800 text-white"
                        : darkMode
                        ? "text-slate-400 hover:bg-slate-800"
                        : "text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    {page}
                  </button>
                ))}

                {/* NEXT */}

                <button
                  type="button"
                  disabled={safeCurrentPage === totalPages}
                  onClick={() =>
                    setCurrentPage((page) =>
                      Math.min(totalPages, page + 1)
                    )
                  }
                  className={`w-8 h-8 rounded-lg text-xs font-semibold transition ${
                    safeCurrentPage === totalPages
                      ? "opacity-40 cursor-not-allowed"
                      : darkMode
                      ? "hover:bg-slate-800"
                      : "hover:bg-slate-100"
                  }`}
                >
                  ›
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ===================================================
            DEMO NOTICE
        =================================================== */}

        <div
          className={`mt-4 px-4 py-3 rounded-lg border text-[10px] leading-relaxed ${
            darkMode
              ? "bg-red-950/30 border-red-900 text-red-300"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          <p className="font-bold mb-0.5">
            ⚠️ Demo Project
          </p>

          <p>
            Audit log entries shown here are dummy data.
            Database integration has not been implemented yet.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;

