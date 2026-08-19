import React, { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";

// Temporary page-local demo data. This page intentionally has no mockStore dependency.
const localState = {
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
      role: "company_supervisor",
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

export default function AuditLogs() {
  const { darkMode } = useOutletContext();
  const state = localState;

  // =========================================================
  // FILTER STATE
  // =========================================================

  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [moduleFilter, setModuleFilter] = useState("ALL");

  // =========================================================
  // HELPERS
  // =========================================================

  const getActorName = (event) => {
    const user = state.users?.find((item) => item.id === event.actorUserId);

    if (!user) {
      return event.actorUserId || "System";
    }

    const profile =
      state.students?.find((item) => item.id === user.profileId) ||
      state.registrar?.find((item) => item.id === user.profileId) ||
      state.supervisors?.find((item) => item.id === user.profileId);

    return profile?.fullName || user.email || user.id;
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case "student":
        return "Student";

      case "registrar":
        return "Registrar";

      case "company_supervisor":
        return "Company Supervisor";

      // Compatibility with older mock records.
      case "company":
        return "Company Supervisor";

      case "admin":
        return "Administrator";

      case "system":
        return "System";

      default:
        return role || "Unknown";
    }
  };

  const getActionClass = (action) => {
    switch (action) {
      case "LOGIN":
        return darkMode
          ? "bg-blue-950 text-blue-300 border-blue-800"
          : "bg-blue-50 text-blue-700 border-blue-200";

      case "LOGOUT":
        return darkMode
          ? "bg-slate-800 text-slate-300 border-slate-700"
          : "bg-slate-100 text-slate-600 border-slate-200";

      case "CREATE":
        return darkMode
          ? "bg-emerald-950 text-emerald-300 border-emerald-800"
          : "bg-emerald-50 text-emerald-700 border-emerald-200";

      case "UPDATE":
        return darkMode
          ? "bg-amber-950 text-amber-300 border-amber-800"
          : "bg-amber-50 text-amber-700 border-amber-200";

      case "DELETE":
        return darkMode
          ? "bg-red-950 text-red-300 border-red-800"
          : "bg-red-50 text-red-700 border-red-200";

      case "APPROVE":
        return darkMode
          ? "bg-emerald-950 text-emerald-300 border-emerald-800"
          : "bg-emerald-50 text-emerald-700 border-emerald-200";

      case "REJECT":
        return darkMode
          ? "bg-red-950 text-red-300 border-red-800"
          : "bg-red-50 text-red-700 border-red-200";

      case "UPLOAD":
        return darkMode
          ? "bg-purple-950 text-purple-300 border-purple-800"
          : "bg-purple-50 text-purple-700 border-purple-200";

      case "DEPLOY":
        return darkMode
          ? "bg-cyan-950 text-cyan-300 border-cyan-800"
          : "bg-cyan-50 text-cyan-700 border-cyan-200";

      case "SUBMIT":
        return darkMode
          ? "bg-indigo-950 text-indigo-300 border-indigo-800"
          : "bg-indigo-50 text-indigo-700 border-indigo-200";

      default:
        return darkMode
          ? "bg-slate-800 text-slate-300 border-slate-700"
          : "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  const formatDetailValue = (key, value) => {
    const formattedKey = key
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (char) => char.toUpperCase());

    if (typeof value === "boolean") {
      return `${formattedKey}: ${value ? "Enabled" : "Disabled"}`;
    }

    if (value === null || value === undefined || value === "") {
      return `${formattedKey}: —`;
    }

    if (Array.isArray(value)) {
      return `${formattedKey}: ${value.join(", ")}`;
    }

    if (typeof value === "object") {
      return `${formattedKey}: ${JSON.stringify(value)}`;
    }

    return `${formattedKey}: ${value}`;
  };

  const formatDetails = (details) => {
    if (!details) {
      return "No additional details.";
    }

    if (typeof details === "string") {
      return details;
    }

    if (typeof details === "object") {
      return Object.entries(details)
        .map(([key, value]) => formatDetailValue(key, value))
        .join(" • ");
    }

    return String(details);
  };

  // =========================================================
  // FILTER OPTIONS
  // =========================================================

  const actionOptions = useMemo(() => {
    return [
      "ALL",
      ...Array.from(
        new Set(state.auditEvents.map((event) => event.action))
      ).sort(),
    ];
  }, [state.auditEvents]);

  const moduleOptions = useMemo(() => {
    return [
      "ALL",
      ...Array.from(
        new Set(state.auditEvents.map((event) => event.module))
      ).sort(),
    ];
  }, [state.auditEvents]);

  // =========================================================
  // FILTERED LOGS
  // =========================================================

  const logs = useMemo(() => {
    const query = search.trim().toLowerCase();

    return state.auditEvents.filter((event) => {
      const matchesSearch =
        !query ||
        JSON.stringify(event).toLowerCase().includes(query) ||
        getActorName(event).toLowerCase().includes(query);

      const matchesAction =
        actionFilter === "ALL" || event.action === actionFilter;

      const matchesModule =
        moduleFilter === "ALL" || event.module === moduleFilter;

      return matchesSearch && matchesAction && matchesModule;
    });
  }, [state.auditEvents, search, actionFilter, moduleFilter]);

  // =========================================================
  // EXPORT CSV
  // =========================================================

  const exportCsv = () => {
    if (logs.length === 0) {
      return;
    }

    const header =
      "event_id,actor_user_id,actor_name,actor_role,action,module,target_type,target_id,timestamp,details\n";

    const rows = logs.map((event) => {
      const values = [
        event.id,
        event.actorUserId,
        getActorName(event),
        getRoleLabel(event.actorRole),
        event.action,
        event.module,
        event.targetEntityType,
        event.targetEntityId,
        event.timestamp,
        JSON.stringify(event.details ?? {}),
      ];

      return values
        .map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`)
        .join(",");
    });

    const blob = new Blob([header + rows.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "sims-audit-events.csv";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  // =========================================================
  // CLEAR FILTERS
  // =========================================================

  const clearFilters = () => {
    setSearch("");
    setActionFilter("ALL");
    setModuleFilter("ALL");
  };

  // =========================================================
  // STYLES
  // =========================================================

  const inputClass = `h-9 border rounded-sm px-3 text-xs outline-none transition ${
    darkMode
      ? "bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 focus:border-slate-400"
      : "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-slate-500"
  }`;

  // =========================================================
  // RETURN
  // =========================================================

  return (
    <div
      className={`min-h-[calc(100vh-5rem)] px-4 py-6 sm:px-6 lg:px-8 transition-colors duration-300 ${
        darkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"
      }`}
    >
      <div className="max-w-7xl mx-auto">
        {/* ===================================================
            PAGE HEADER
        =================================================== */}

        <div className="mb-6">
          <p
            className={`text-[10px] uppercase tracking-widest font-bold ${
              darkMode ? "text-slate-500" : "text-slate-400"
            }`}
          >
            Administrator Portal
          </p>

          <h1 className="text-xl sm:text-2xl font-black mt-1">Audit Logs</h1>

          <p
            className={`text-xs sm:text-sm mt-1 ${
              darkMode ? "text-slate-400" : "text-slate-500"
            }`}
          >
            Review system activity and administrative actions recorded
            throughout the portal.
          </p>
        </div>

        {/* ===================================================
            SUMMARY
        =================================================== */}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          {/* TOTAL */}

          <div
            className={`border rounded-lg p-4 ${
              darkMode
                ? "bg-slate-900 border-slate-700"
                : "bg-white border-slate-300"
            }`}
          >
            <p
              className={`text-[10px] font-bold uppercase tracking-wide ${
                darkMode ? "text-slate-500" : "text-slate-400"
              }`}
            >
              Total Events
            </p>

            <p className="text-xl font-black mt-1">
              {state.auditEvents.length}
            </p>
          </div>

          {/* FILTERED */}

          <div
            className={`border rounded-lg p-4 ${
              darkMode
                ? "bg-slate-900 border-slate-700"
                : "bg-white border-slate-300"
            }`}
          >
            <p
              className={`text-[10px] font-bold uppercase tracking-wide ${
                darkMode ? "text-slate-500" : "text-slate-400"
              }`}
            >
              Displayed
            </p>

            <p className="text-xl font-black mt-1">{logs.length}</p>
          </div>

          {/* LATEST */}

          <div
            className={`border rounded-lg p-4 ${
              darkMode
                ? "bg-slate-900 border-slate-700"
                : "bg-white border-slate-300"
            }`}
          >
            <p
              className={`text-[10px] font-bold uppercase tracking-wide ${
                darkMode ? "text-slate-500" : "text-slate-400"
              }`}
            >
              Latest Event
            </p>

            <p className="text-xs font-bold mt-2">
              {state.auditEvents.length > 0
                ? new Date(state.auditEvents[0].timestamp).toLocaleString()
                : "No events"}
            </p>
          </div>
        </div>

        {/* ===================================================
            FILTERS
        =================================================== */}

        <div
          className={`border rounded-lg p-4 mb-5 ${
            darkMode
              ? "bg-slate-900 border-slate-700"
              : "bg-white border-slate-300"
          }`}
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* SEARCH */}

            <div className="md:col-span-2">
              <label
                htmlFor="audit-search"
                className="block text-[10px] font-bold mb-1.5"
              >
                Search Events
              </label>

              <input
                id="audit-search"
                type="text"
                placeholder="Search actor, action, module, target..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className={`${inputClass} w-full`}
              />
            </div>

            {/* ACTION */}

            <div>
              <label
                htmlFor="audit-action"
                className="block text-[10px] font-bold mb-1.5"
              >
                Action
              </label>

              <select
                id="audit-action"
                value={actionFilter}
                onChange={(event) => setActionFilter(event.target.value)}
                className={`${inputClass} w-full`}
              >
                {actionOptions.map((action) => (
                  <option key={action} value={action}>
                    {action === "ALL" ? "All Actions" : action}
                  </option>
                ))}
              </select>
            </div>

            {/* MODULE */}

            <div>
              <label
                htmlFor="audit-module"
                className="block text-[10px] font-bold mb-1.5"
              >
                Module
              </label>

              <select
                id="audit-module"
                value={moduleFilter}
                onChange={(event) => setModuleFilter(event.target.value)}
                className={`${inputClass} w-full`}
              >
                {moduleOptions.map((module) => (
                  <option key={module} value={module}>
                    {module === "ALL" ? "All Modules" : module}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* FILTER ACTIONS */}

          <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
            <p
              className={`text-[10px] ${
                darkMode ? "text-slate-500" : "text-slate-400"
              }`}
            >
              Showing {logs.length} of {state.auditEvents.length} events
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={clearFilters}
                className={`h-8 px-4 border rounded-sm text-[10px] font-semibold transition ${
                  darkMode
                    ? "bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700"
                    : "bg-white border-slate-300 text-slate-600 hover:bg-slate-100"
                }`}
              >
                Clear Filters
              </button>

              <button
                type="button"
                onClick={exportCsv}
                disabled={logs.length === 0}
                className={`h-8 px-4 rounded-sm text-[10px] font-semibold transition ${
                  logs.length === 0
                    ? darkMode
                      ? "bg-slate-800 text-slate-600 cursor-not-allowed"
                      : "bg-slate-100 text-slate-400 cursor-not-allowed"
                    : darkMode
                    ? "bg-slate-700 border border-slate-500 text-white hover:bg-slate-600"
                    : "bg-slate-700 border border-slate-800 text-white hover:bg-slate-800"
                }`}
              >
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* ===================================================
            AUDIT TABLE
        =================================================== */}

        <div
          className={`border rounded-lg overflow-hidden ${
            darkMode
              ? "bg-slate-900 border-slate-700"
              : "bg-white border-slate-300"
          }`}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[1000px]">
              {/* HEADER */}

              <thead
                className={
                  darkMode
                    ? "bg-slate-800 text-slate-300"
                    : "bg-slate-100 text-slate-600"
                }
              >
                <tr>
                  <th className="px-4 py-3 font-bold whitespace-nowrap">
                    Time
                  </th>

                  <th className="px-4 py-3 font-bold">Actor</th>

                  <th className="px-4 py-3 font-bold">Action</th>

                  <th className="px-4 py-3 font-bold">Module</th>

                  <th className="px-4 py-3 font-bold">Target</th>

                  <th className="px-4 py-3 font-bold">Details</th>
                </tr>
              </thead>

              {/* BODY */}

              <tbody>
                {logs.length > 0 ? (
                  logs.map((event) => (
                    <tr
                      key={event.id}
                      className={`border-t transition ${
                        darkMode
                          ? "border-slate-800 hover:bg-slate-800/50"
                          : "border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {/* TIME */}

                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-semibold">
                          {new Date(event.timestamp).toLocaleDateString()}
                        </div>

                        <div
                          className={`text-[10px] mt-0.5 ${
                            darkMode ? "text-slate-500" : "text-slate-400"
                          }`}
                        >
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </div>
                      </td>

                      {/* ACTOR */}

                      <td className="px-4 py-3">
                        <div className="font-bold">{getActorName(event)}</div>

                        <div
                          className={`text-[10px] mt-0.5 ${
                            darkMode ? "text-slate-500" : "text-slate-400"
                          }`}
                        >
                          {getRoleLabel(event.actorRole)}
                          {" · "}
                          {event.actorUserId}
                        </div>
                      </td>

                      {/* ACTION */}

                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-sm border text-[9px] font-bold ${getActionClass(
                            event.action
                          )}`}
                        >
                          {event.action}
                        </span>
                      </td>

                      {/* MODULE */}

                      <td className="px-4 py-3">
                        <span
                          className={`text-[10px] font-semibold ${
                            darkMode ? "text-slate-300" : "text-slate-700"
                          }`}
                        >
                          {event.module}
                        </span>
                      </td>

                      {/* TARGET */}

                      <td className="px-4 py-3">
                        <div className="font-semibold">
                          {event.targetEntityType}
                        </div>

                        <div
                          className={`text-[10px] mt-0.5 ${
                            darkMode ? "text-slate-500" : "text-slate-400"
                          }`}
                        >
                          {event.targetEntityId}
                        </div>
                      </td>

                      {/* DETAILS */}

                      <td className="px-4 py-3 max-w-[350px]">
                        <div
                          className={`text-[10px] leading-relaxed break-words ${
                            darkMode ? "text-slate-400" : "text-slate-500"
                          }`}
                        >
                          {formatDetails(event.details)}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-4 py-12 text-center">
                      <div
                        className={`text-sm font-bold ${
                          darkMode ? "text-slate-300" : "text-slate-600"
                        }`}
                      >
                        No audit events found
                      </div>

                      <p
                        className={`text-[10px] mt-1 ${
                          darkMode ? "text-slate-500" : "text-slate-400"
                        }`}
                      >
                        Try changing your search or filter settings.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ===================================================
            FOOTER INFO
        =================================================== */}

        <p
          className={`text-[9px] mt-3 ${
            darkMode ? "text-slate-600" : "text-slate-400"
          }`}
        >
          Audit events are generated automatically by shared system actions such
          as authentication, application processing, document review,
          deployment, evaluations, and system settings updates.
        </p>
      </div>
    </div>
  );
}
