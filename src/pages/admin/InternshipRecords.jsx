import React, { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";

// =========================================================
// DEMO INTERNSHIP DATA
// =========================================================

const internshipData = [
  {
    id: 1,
    student: "Juan Dela Cruz",
    company: "Tech Solutions Inc.",
    position: "Web Developer",
    duration: "480 Hours",
    status: "Active",
  },
  {
    id: 2,
    student: "Maria Santos",
    company: "ABC Corporation",
    position: "UI/UX Designer",
    duration: "480 Hours",
    status: "Completed",
  },
  {
    id: 3,
    student: "Pedro Reyes",
    company: "Digital Works PH",
    position: "Software Developer",
    duration: "480 Hours",
    status: "Active",
  },
  {
    id: 4,
    student: "Angela Garcia",
    company: "Innovate Labs",
    position: "Database Assistant",
    duration: "480 Hours",
    status: "Pending",
  },
  {
    id: 5,
    student: "Carlos Mendoza",
    company: "NextGen Solutions",
    position: "IT Support Intern",
    duration: "480 Hours",
    status: "Active",
  },
  {
    id: 6,
    student: "Sofia Ramos",
    company: "Creative Digital PH",
    position: "Frontend Developer",
    duration: "480 Hours",
    status: "Completed",
  },
];

// =========================================================
// COMPONENT
// =========================================================

const InternshipRecords = () => {
  const { darkMode } = useOutletContext();

  // =========================================================
  // STATE
  // =========================================================

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");

  // =========================================================
  // FILTERED RECORDS
  // =========================================================

  const filteredRecords = useMemo(() => {
    return internshipData.filter((record) => {
      const search = searchTerm.toLowerCase().trim();

      const matchesSearch =
        record.student.toLowerCase().includes(search) ||
        record.company.toLowerCase().includes(search) ||
        record.position.toLowerCase().includes(search);

      const matchesStatus =
        filterStatus === "All" || record.status === filterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, filterStatus]);

  // =========================================================
  // STATUS STYLE
  // =========================================================

  const getStatusClass = (status) => {
    if (status === "Active") {
      return darkMode
        ? "bg-green-900/50 text-green-300 border-green-700"
        : "bg-green-100 text-green-700 border-green-300";
    }

    if (status === "Completed") {
      return darkMode
        ? "bg-blue-900/50 text-blue-300 border-blue-700"
        : "bg-blue-100 text-blue-700 border-blue-300";
    }

    if (status === "Pending") {
      return darkMode
        ? "bg-orange-900/50 text-orange-300 border-orange-700"
        : "bg-orange-100 text-orange-700 border-orange-300";
    }

    return darkMode
      ? "bg-slate-800 text-slate-300 border-slate-700"
      : "bg-slate-100 text-slate-600 border-slate-300";
  };

  // =========================================================
  // EXPORT CSV
  // =========================================================

  const handleExport = () => {
    const headers = ["Student", "Company", "Position", "Duration", "Status"];

    const rows = filteredRecords.map((record) => [
      record.student,
      record.company,
      record.position,
      record.duration,
      record.status,
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
    link.download = "internship-records.csv";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  // =========================================================
  // RESET FILTERS
  // =========================================================

  const handleResetFilter = () => {
    setSearchTerm("");
    setFilterStatus("All");
  };

  // =========================================================
  // RETURN
  // =========================================================

  return (
    <div
      className={`min-h-[calc(100vh-5rem)] px-4 py-5 sm:px-6 lg:px-8 transition-colors duration-300 ${
        darkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"
      }`}
    >
      <div className="max-w-7xl mx-auto">
        {/* ===================================================
            DEMO NOTICE
        =================================================== */}

        <div
          className={`mb-4 p-3 rounded-lg text-[10px] leading-relaxed border ${
            darkMode
              ? "bg-red-950/40 border-red-900 text-red-300"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          <p className="font-bold mb-1">⚠️ Demo Project</p>

          <p>All internship records displayed on this page are dummy data.</p>

          <p className="mt-1">No database is implemented yet.</p>
        </div>

        {/* ===================================================
            PAGE HEADER
        =================================================== */}

        <div className="mb-5">
          <h1 className="text-xl sm:text-2xl font-bold">Internship Records</h1>

          <p
            className={`text-xs sm:text-sm mt-1 ${
              darkMode ? "text-slate-400" : "text-slate-500"
            }`}
          >
            View and manage internship records across the system.
          </p>
        </div>

        {/* ===================================================
            SEARCH / FILTER BAR
        =================================================== */}

        <div
          className={`border rounded-lg p-3 sm:p-4 mb-4 ${
            darkMode
              ? "bg-slate-900 border-slate-700"
              : "bg-white border-slate-300"
          }`}
        >
          <div className="flex flex-col sm:flex-row gap-3">
            {/* SEARCH */}

            <div className="flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                className={`w-full h-9 px-3 text-xs rounded-md border outline-none transition ${
                  darkMode
                    ? "bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500"
                    : "bg-slate-100 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-slate-500"
                }`}
              />
            </div>

            {/* FILTER */}

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={`h-9 px-3 text-xs rounded-md border outline-none ${
                darkMode
                  ? "bg-slate-800 border-slate-600 text-white"
                  : "bg-white border-slate-300 text-slate-700"
              }`}
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Completed">Completed</option>
              <option value="Pending">Pending</option>
            </select>

            {/* FILTER BUTTON */}

            <button
              type="button"
              onClick={() => {
                // Filtering is already applied automatically.
                // This button is kept to match the wireframe.
              }}
              className={`h-9 px-5 rounded-md text-xs font-semibold transition ${
                darkMode
                  ? "bg-white text-slate-900 hover:bg-slate-200"
                  : "bg-slate-700 text-white hover:bg-slate-800"
              }`}
            >
              Filter
            </button>

            {/* EXPORT */}

            <button
              type="button"
              onClick={handleExport}
              className={`h-9 px-5 rounded-md text-xs font-semibold transition ${
                darkMode
                  ? "bg-slate-700 text-white hover:bg-slate-600"
                  : "bg-slate-600 text-white hover:bg-slate-700"
              }`}
            >
              Export
            </button>

            {/* RESET */}

            {(searchTerm || filterStatus !== "All") && (
              <button
                type="button"
                onClick={handleResetFilter}
                className={`h-9 px-4 rounded-md text-xs font-semibold border transition ${
                  darkMode
                    ? "border-slate-600 text-slate-300 hover:bg-slate-800"
                    : "border-slate-300 text-slate-600 hover:bg-slate-100"
                }`}
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* ===================================================
            RECORD COUNT
        =================================================== */}

        <div className="flex items-center justify-between mb-2">
          <p
            className={`text-xs ${
              darkMode ? "text-slate-400" : "text-slate-500"
            }`}
          >
            Showing {filteredRecords.length} of {internshipData.length} records
          </p>
        </div>

        {/* ===================================================
            TABLE
        =================================================== */}

        <div
          className={`border rounded-lg overflow-hidden ${
            darkMode
              ? "bg-slate-900 border-slate-700"
              : "bg-white border-slate-300"
          }`}
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] border-collapse text-xs">
              {/* TABLE HEADER */}

              <thead>
                <tr className={darkMode ? "bg-slate-800" : "bg-slate-50"}>
                  <th
                    className={`border-b border-r px-3 py-3 text-left font-bold ${
                      darkMode
                        ? "border-slate-700 text-slate-200"
                        : "border-slate-300 text-slate-700"
                    }`}
                  >
                    Student
                    <div
                      className={`text-[9px] font-normal mt-0.5 ${
                        darkMode ? "text-slate-500" : "text-slate-400"
                      }`}
                    >
                      C1
                    </div>
                  </th>

                  <th
                    className={`border-b border-r px-3 py-3 text-left font-bold ${
                      darkMode
                        ? "border-slate-700 text-slate-200"
                        : "border-slate-300 text-slate-700"
                    }`}
                  >
                    Company
                    <div
                      className={`text-[9px] font-normal mt-0.5 ${
                        darkMode ? "text-slate-500" : "text-slate-400"
                      }`}
                    >
                      C2
                    </div>
                  </th>

                  <th
                    className={`border-b border-r px-3 py-3 text-left font-bold ${
                      darkMode
                        ? "border-slate-700 text-slate-200"
                        : "border-slate-300 text-slate-700"
                    }`}
                  >
                    Position
                    <div
                      className={`text-[9px] font-normal mt-0.5 ${
                        darkMode ? "text-slate-500" : "text-slate-400"
                      }`}
                    >
                      C3
                    </div>
                  </th>

                  <th
                    className={`border-b border-r px-3 py-3 text-left font-bold ${
                      darkMode
                        ? "border-slate-700 text-slate-200"
                        : "border-slate-300 text-slate-700"
                    }`}
                  >
                    Duration
                    <div
                      className={`text-[9px] font-normal mt-0.5 ${
                        darkMode ? "text-slate-500" : "text-slate-400"
                      }`}
                    >
                      C4
                    </div>
                  </th>

                  <th
                    className={`border-b px-3 py-3 text-left font-bold ${
                      darkMode
                        ? "border-slate-700 text-slate-200"
                        : "border-slate-300 text-slate-700"
                    }`}
                  >
                    Status
                    <div
                      className={`text-[9px] font-normal mt-0.5 ${
                        darkMode ? "text-slate-500" : "text-slate-400"
                      }`}
                    >
                      C5
                    </div>
                  </th>
                </tr>
              </thead>

              {/* TABLE BODY */}

              <tbody>
                {filteredRecords.length > 0 ? (
                  filteredRecords.map((record) => (
                    <tr
                      key={record.id}
                      className={`transition ${
                        darkMode ? "hover:bg-slate-800" : "hover:bg-slate-50"
                      }`}
                    >
                      {/* STUDENT */}

                      <td
                        className={`border-b border-r px-3 py-4 ${
                          darkMode ? "border-slate-700" : "border-slate-300"
                        }`}
                      >
                        <div
                          className={`font-medium ${
                            darkMode ? "text-slate-200" : "text-slate-800"
                          }`}
                        >
                          {record.student}
                        </div>
                      </td>

                      {/* COMPANY */}

                      <td
                        className={`border-b border-r px-3 py-4 ${
                          darkMode ? "border-slate-700" : "border-slate-300"
                        }`}
                      >
                        <div
                          className={`font-medium ${
                            darkMode ? "text-slate-200" : "text-slate-800"
                          }`}
                        >
                          {record.company}
                        </div>
                      </td>

                      {/* POSITION */}

                      <td
                        className={`border-b border-r px-3 py-4 ${
                          darkMode ? "border-slate-700" : "border-slate-300"
                        }`}
                      >
                        <div
                          className={
                            darkMode ? "text-slate-300" : "text-slate-700"
                          }
                        >
                          {record.position}
                        </div>
                      </td>

                      {/* DURATION */}

                      <td
                        className={`border-b border-r px-3 py-4 ${
                          darkMode ? "border-slate-700" : "border-slate-300"
                        }`}
                      >
                        <div
                          className={
                            darkMode ? "text-slate-300" : "text-slate-700"
                          }
                        >
                          {record.duration}
                        </div>
                      </td>

                      {/* STATUS */}

                      <td
                        className={`border-b px-3 py-4 ${
                          darkMode ? "border-slate-700" : "border-slate-300"
                        }`}
                      >
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded text-[10px] font-semibold border ${getStatusClass(
                            record.status
                          )}`}
                        >
                          {record.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="5"
                      className={`px-4 py-10 text-center ${
                        darkMode ? "text-slate-500" : "text-slate-400"
                      }`}
                    >
                      No internship records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InternshipRecords;
