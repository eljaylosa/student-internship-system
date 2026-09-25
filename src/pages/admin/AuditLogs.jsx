import React, { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "../../supabaseClient";

export default function AuditLogs() {
  const { darkMode } = useOutletContext();

  // =========================================================
  // DATABASE STATE
  // =========================================================

  const [auditEvents, setAuditEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================================================
  // FILTER STATE
  // =========================================================

  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [moduleFilter, setModuleFilter] = useState("ALL");

  // =========================================================
  // PAGINATION STATE
  // =========================================================

  const [currentPage, setCurrentPage] = useState(1);

  const ITEMS_PER_PAGE = 20;

  // =========================================================
  // LOAD AUDIT LOGS
  // =========================================================

  useEffect(() => {
    let mounted = true;

    const loadAuditLogs = async () => {
      setLoading(true);
      setError("");

      try {
        const { data: logs, error: logsError } = await supabase
          .from("audit_logs")
          .select(
            `
              id,
              actor_user_id,
              actor_role,
              action,
              module,
              target_entity_type,
              target_entity_id,
              details,
              created_at
            `
          )
          .order("created_at", {
            ascending: false,
          });

        if (logsError) {
          throw new Error(logsError.message);
        }

        if (!mounted) {
          return;
        }

        // -----------------------------------------------------
        // GET ACTOR USERS
        // -----------------------------------------------------

        const actorIds = [
          ...new Set(
            (logs || []).map((event) => event.actor_user_id).filter(Boolean)
          ),
        ];

        let users = [];

        if (actorIds.length > 0) {
          const { data: userData, error: usersError } = await supabase
            .from("users")
            .select("id, email, first_name, middle_name, last_name, role")
            .in("id", actorIds);

          if (usersError) {
            console.warn(
              "⚠️ Could not load audit log actors:",
              usersError.message
            );
          } else {
            users = userData || [];
          }
        }

        // -----------------------------------------------------
        // MAP DATABASE FORMAT TO EXISTING UI FORMAT
        // -----------------------------------------------------

        const mappedLogs = (logs || []).map((event) => {
          const actor = users.find((user) => user.id === event.actor_user_id);

          return {
            id: event.id,

            actorUserId: event.actor_user_id || "System",

            actorRole: event.actor_role || actor?.role || "system",

            actorName: actor
              ? [actor.first_name, actor.middle_name, actor.last_name]
                  .filter(Boolean)
                  .join(" ")
                  .trim()
              : null,

            actorEmail: actor?.email || null,

            action: event.action,

            module: event.module,

            targetEntityType: event.target_entity_type || "—",

            targetEntityId: event.target_entity_id || "—",

            timestamp: event.created_at,

            details: event.details,
          };
        });

        setAuditEvents(mappedLogs);
        setCurrentPage(1);
      } catch (err) {
        console.error("💥 Failed to load audit logs:", err);

        if (mounted) {
          setError(
            err instanceof Error ? err.message : "Failed to load audit logs."
          );

          setAuditEvents([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadAuditLogs();

    return () => {
      mounted = false;
    };
  }, []);

  // =========================================================
  // HELPERS
  // =========================================================

  const getActorName = (event) => {
    if (event.actorName) {
      return event.actorName;
    }

    if (event.actorEmail) {
      return event.actorEmail;
    }

    return event.actorUserId || "System";
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case "student":
        return "Student";

      case "registrar":
        return "Registrar";

      case "company_supervisor":
        return "Company Supervisor";

      // Compatibility with older records.
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

  const formatDetailLabel = (key) => {
    return key
      .replace(/([A-Z])/g, " $1")
      .replace(/_/g, " ")
      .replace(/^./, (char) => char.toUpperCase());
  };

  const formatValue = (value) => {
    if (value === null || value === undefined || value === "") {
      return "—";
    }

    if (typeof value === "boolean") {
      return value ? "Enabled" : "Disabled";
    }

    if (Array.isArray(value)) {
      return value.join(", ");
    }

    if (typeof value === "object") {
      return JSON.stringify(value);
    }

    return String(value);
  };

  const formatDetailValue = (key, value) => {
    const formattedKey = key
      .replace(/([A-Z])/g, " $1")
      .replace(/_/g, " ")
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

  const formatUpdateDetails = (details) => {
    if (!details || typeof details !== "object") {
      return null;
    }

    const previousValues =
      details.previous_values &&
      typeof details.previous_values === "object" &&
      !Array.isArray(details.previous_values)
        ? details.previous_values
        : {};

    const newValues =
      details.new_values &&
      typeof details.new_values === "object" &&
      !Array.isArray(details.new_values)
        ? details.new_values
        : {};

    const changedFields = Array.from(
      new Set([
        ...Object.keys(previousValues),
        ...Object.keys(newValues),
      ])
    ).filter((field) => {
      return (
        JSON.stringify(previousValues[field]) !==
        JSON.stringify(newValues[field])
      );
    });

    const parts = [];

    Object.entries(details).forEach(([key, value]) => {
      if (
        key === "previous_values" ||
        key === "new_values" ||
        key === "updated_fields"
      ) {
        return;
      }

      parts.push(formatDetailValue(key, value));
    });

    if (changedFields.length > 0) {
      const changes = changedFields
        .map((field) => {
          const label = formatDetailLabel(field);
          const previousValue = formatValue(previousValues[field]);
          const newValue = formatValue(newValues[field]);

          return `${label}: ${previousValue} → ${newValue}`;
        })
        .join(" • ");

      parts.push(`Changes: ${changes}`);
    }

    return parts.length > 0 ? parts.join(" • ") : "No additional details.";
  };

  const formatDetails = (details, action) => {
    if (!details) {
      return "No additional details.";
    }

    if (action === "UPDATE" && typeof details === "object") {
      return formatUpdateDetails(details);
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
      ...Array.from(new Set(auditEvents.map((event) => event.action))).sort(),
    ];
  }, [auditEvents]);

  const moduleOptions = useMemo(() => {
    return [
      "ALL",
      ...Array.from(new Set(auditEvents.map((event) => event.module))).sort(),
    ];
  }, [auditEvents]);

  // =========================================================
  // FILTERED LOGS
  // =========================================================

  const logs = useMemo(() => {
    const query = search.trim().toLowerCase();

    return auditEvents.filter((event) => {
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
  }, [auditEvents, search, actionFilter, moduleFilter]);

  // =========================================================
  // PAGINATED LOGS
  // =========================================================

  const totalPages = Math.max(
    1,
    Math.ceil(logs.length / ITEMS_PER_PAGE)
  );

  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

    return logs.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [logs, currentPage]);

  const startItem =
    logs.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;

  const endItem =
    logs.length === 0
      ? 0
      : Math.min(currentPage * ITEMS_PER_PAGE, logs.length);

  // =========================================================
  // PAGINATION SAFETY
  // =========================================================

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // =========================================================
  // RESET PAGE WHEN FILTERS CHANGE
  // =========================================================

  useEffect(() => {
    setCurrentPage(1);
  }, [search, actionFilter, moduleFilter]);

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
    setCurrentPage(1);
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
            ERROR
        =================================================== */}

        {error && (
          <div
            className={`border rounded-lg p-4 mb-5 ${
              darkMode
                ? "bg-red-950/40 border-red-800 text-red-300"
                : "bg-red-50 border-red-200 text-red-700"
            }`}
          >
            <p className="text-xs font-bold">Failed to load audit logs</p>

            <p className="text-[10px] mt-1">{error}</p>
          </div>
        )}

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
              {loading ? "…" : auditEvents.length}
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

            <p className="text-xl font-black mt-1">
              {loading ? "…" : logs.length}
            </p>
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
              {loading
                ? "Loading..."
                : auditEvents.length > 0
                ? new Date(auditEvents[0].timestamp).toLocaleString()
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
              {loading
                ? "Loading audit events..."
                : logs.length === 0
                ? "Showing 0 of 0 events"
                : `Showing ${startItem}–${endItem} of ${logs.length} events`}
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
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-12 text-center">
                      <div
                        className={`text-sm font-bold ${
                          darkMode ? "text-slate-300" : "text-slate-600"
                        }`}
                      >
                        Loading audit events...
                      </div>

                      <p
                        className={`text-[10px] mt-1 ${
                          darkMode ? "text-slate-500" : "text-slate-400"
                        }`}
                      >
                        Retrieving activity from the database.
                      </p>
                    </td>
                  </tr>
                ) : paginatedLogs.length > 0 ? (
                  paginatedLogs.map((event) => (
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
                          {formatDetails(event.details, event.action)}
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
            PAGINATION
        =================================================== */}

        {!loading && logs.length > 0 && (
          <div
            className={`flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 px-1`}
          >
            <p
              className={`text-[10px] ${
                darkMode ? "text-slate-500" : "text-slate-400"
              }`}
            >
              Page {currentPage} of {totalPages}
            </p>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() =>
                  setCurrentPage((page) => Math.max(1, page - 1))
                }
                disabled={currentPage === 1}
                className={`h-8 px-3 border rounded-sm text-[10px] font-semibold transition ${
                  currentPage === 1
                    ? darkMode
                      ? "bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed"
                      : "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                    : darkMode
                    ? "bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700"
                    : "bg-white border-slate-300 text-slate-600 hover:bg-slate-100"
                }`}
              >
                ← Previous
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, index) => {
                  const page = index + 1;

                  if (
                    totalPages > 7 &&
                    page !== 1 &&
                    page !== totalPages &&
                    Math.abs(page - currentPage) > 1
                  ) {
                    if (
                      page === 2 ||
                      page === totalPages - 1
                    ) {
                      return (
                        <span
                          key={page}
                          className={`px-1 text-[10px] ${
                            darkMode
                              ? "text-slate-600"
                              : "text-slate-400"
                          }`}
                        >
                          …
                        </span>
                      );
                    }

                    return null;
                  }

                  return (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={`h-8 min-w-8 px-2 border rounded-sm text-[10px] font-bold transition ${
                        currentPage === page
                          ? darkMode
                            ? "bg-slate-700 border-slate-500 text-white"
                            : "bg-slate-700 border-slate-800 text-white"
                          : darkMode
                          ? "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
                          : "bg-white border-slate-300 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() =>
                  setCurrentPage((page) =>
                    Math.min(totalPages, page + 1)
                  )
                }
                disabled={currentPage === totalPages}
                className={`h-8 px-3 border rounded-sm text-[10px] font-semibold transition ${
                  currentPage === totalPages
                    ? darkMode
                      ? "bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed"
                      : "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                    : darkMode
                    ? "bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700"
                    : "bg-white border-slate-300 text-slate-600 hover:bg-slate-100"
                }`}
              >
                Next →
              </button>
            </div>
          </div>
        )}

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

