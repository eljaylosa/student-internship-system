import React, { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";

const ReviewApplications = () => {
  const { darkMode } = useOutletContext();

  // =========================================================
  // APPLICATION DATA
  // =========================================================

  const initialApplications = [
    {
      id: 1,
      student: "John Doe",
      studentId: "2024-001",
      company: "ABC Corporation",
      position: "Software Engineer",
      duration: "June - August 2024",
      submitted: "May 1, 2024",
      status: "Pending",
      email: "john.doe@example.com",
      documents: "Application Documents",
    },
    {
      id: 2,
      student: "Maria Santos",
      studentId: "2024-002",
      company: "XYZ Solutions",
      position: "UI/UX Designer",
      duration: "June - August 2024",
      submitted: "May 2, 2024",
      status: "Pending",
      email: "maria.santos@example.com",
      documents: "Application Documents",
    },
    {
      id: 3,
      student: "Kevin Reyes",
      studentId: "2024-003",
      company: "Tech Innovations",
      position: "Web Developer",
      duration: "June - August 2024",
      submitted: "May 3, 2024",
      status: "Pending",
      email: "kevin.reyes@example.com",
      documents: "Application Documents",
    },
    {
      id: 4,
      student: "Angela Garcia",
      studentId: "2024-004",
      company: "Digital Works",
      position: "Frontend Developer",
      duration: "June - August 2024",
      submitted: "May 4, 2024",
      status: "Pending",
      email: "angela.garcia@example.com",
      documents: "Application Documents",
    },
    {
      id: 5,
      student: "Daniel Cruz",
      studentId: "2024-005",
      company: "Creative Labs",
      position: "Backend Developer",
      duration: "June - August 2024",
      submitted: "May 5, 2024",
      status: "Pending",
      email: "daniel.cruz@example.com",
      documents: "Application Documents",
    },
  ];

  // =========================================================
  // STATE
  // =========================================================

  const [applications, setApplications] = useState(initialApplications);

  const [selectedApplicationId, setSelectedApplicationId] = useState(
    initialApplications[0].id
  );

  const [searchQuery, setSearchQuery] = useState("");

  const [statusFilter, setStatusFilter] = useState("Pending");

  const [comment, setComment] = useState("");

  const [actionMessage, setActionMessage] = useState("");

  // =========================================================
  // THEME CLASSES
  // =========================================================

  const headingClass = darkMode ? "text-slate-100" : "text-slate-900";

  const mutedClass = darkMode ? "text-slate-400" : "text-slate-500";

  const mainContainerClass = darkMode
    ? "bg-slate-900 border-slate-700"
    : "bg-white border-slate-300";

  const panelClass = darkMode
    ? "bg-slate-800 border-slate-700"
    : "bg-slate-50 border-slate-200";

  const cardClass = darkMode
    ? "bg-slate-900 border-slate-700"
    : "bg-white border-slate-200";

  const inputClass = darkMode
    ? "bg-slate-900 border-slate-700 text-slate-200 placeholder:text-slate-500 focus:border-slate-500 focus:ring-slate-700"
    : "bg-white border-slate-300 text-slate-800 placeholder:text-slate-400 focus:border-slate-700 focus:ring-slate-100";

  // =========================================================
  // FILTER APPLICATIONS
  // =========================================================

  const filteredApplications = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return applications.filter((application) => {
      const matchesSearch =
        application.student.toLowerCase().includes(query) ||
        application.studentId.toLowerCase().includes(query) ||
        application.company.toLowerCase().includes(query) ||
        application.position.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "All" || application.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [applications, searchQuery, statusFilter]);

  // =========================================================
  // SELECTED APPLICATION
  // =========================================================

  const selectedApplication =
    applications.find(
      (application) => application.id === selectedApplicationId
    ) || null;

  // =========================================================
  // SELECT APPLICATION
  // =========================================================

  const handleSelectApplication = (application) => {
    setSelectedApplicationId(application.id);
    setComment("");
    setActionMessage("");
  };

  // =========================================================
  // APPLICATION ACTION
  // =========================================================

  const handleApplicationAction = (action) => {
    if (!selectedApplication) return;

    let newStatus = "";
    let message = "";

    if (action === "approve") {
      newStatus = "Approved";
      message = `${selectedApplication.student}'s application has been approved.`;
    }

    if (action === "reject") {
      newStatus = "Rejected";
      message = `${selectedApplication.student}'s application has been rejected.`;
    }

    if (action === "request") {
      newStatus = "Info Requested";
      message = `Additional information has been requested from ${selectedApplication.student}.`;
    }

    setApplications((prev) =>
      prev.map((application) =>
        application.id === selectedApplication.id
          ? {
              ...application,
              status: newStatus,
            }
          : application
      )
    );

    setActionMessage(message);
    setComment("");
  };

  // =========================================================
  // STATUS STYLES
  // =========================================================

  const getStatusClass = (status) => {
    if (darkMode) {
      if (status === "Pending") {
        return "bg-amber-900/40 text-amber-300 border-amber-800";
      }

      if (status === "Approved") {
        return "bg-emerald-900/40 text-emerald-300 border-emerald-800";
      }

      if (status === "Rejected") {
        return "bg-red-900/40 text-red-300 border-red-800";
      }

      if (status === "Info Requested") {
        return "bg-blue-900/40 text-blue-300 border-blue-800";
      }

      return "bg-slate-800 text-slate-400 border-slate-700";
    }

    if (status === "Pending") {
      return "bg-amber-50 text-amber-700 border-amber-200";
    }

    if (status === "Approved") {
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }

    if (status === "Rejected") {
      return "bg-red-50 text-red-700 border-red-200";
    }

    if (status === "Info Requested") {
      return "bg-blue-50 text-blue-700 border-blue-200";
    }

    return "bg-slate-100 text-slate-500 border-slate-200";
  };

  // =========================================================
  // CLEAR FILTER
  // =========================================================

  const handleClearFilter = () => {
    setSearchQuery("");
    setStatusFilter("All");
  };

  // =========================================================
  // RENDER
  // =========================================================

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
            Faculty Portal
          </p>

          <h1 className={`text-xl sm:text-2xl font-black ${headingClass}`}>
            Review Applications
          </h1>

          <p className={`text-xs sm:text-sm mt-1 ${mutedClass}`}>
            Review and manage student internship applications.
          </p>
        </div>

        {/* =====================================================
            SEARCH / FILTER
        ===================================================== */}

        <div
          className={`
            mb-5
            p-4
            border
            rounded-xl
            ${panelClass}
          `}
        >
          <div className="flex flex-col sm:flex-row gap-3">
            {/* SEARCH */}

            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search applications..."
                className={`
                  w-full
                  h-10
                  px-3
                  pr-9
                  rounded-lg
                  border
                  text-xs
                  outline-none
                  transition
                  focus:ring-2
                  ${inputClass}
                `}
              />

              <span
                className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs ${mutedClass}`}
              >
                🔍
              </span>
            </div>

            {/* STATUS */}

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`
                h-10
                sm:w-44
                px-3
                rounded-lg
                border
                text-xs
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
                value="Approved"
                className={
                  darkMode
                    ? "bg-slate-900 text-slate-100"
                    : "bg-white text-slate-900"
                }
              >
                Approved
              </option>

              <option
                value="Rejected"
                className={
                  darkMode
                    ? "bg-slate-900 text-slate-100"
                    : "bg-white text-slate-900"
                }
              >
                Rejected
              </option>

              <option
                value="Info Requested"
                className={
                  darkMode
                    ? "bg-slate-900 text-slate-100"
                    : "bg-white text-slate-900"
                }
              >
                Info Requested
              </option>
            </select>

            {/* CLEAR */}

            <button
              type="button"
              onClick={handleClearFilter}
              className={`
                h-10
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
          </div>
        </div>

        {/* =====================================================
            MAIN REVIEW AREA
        ===================================================== */}

        <section
          className={`
            w-full
            border
            rounded-xl
            overflow-hidden
            shadow-sm
            ${mainContainerClass}
          `}
        >
          <div className="grid grid-cols-1 lg:grid-cols-[360px_minmax(0,1fr)] min-h-[650px]">
            {/* =================================================
                APPLICATION LIST
            ================================================= */}

            <aside
              className={`
                border-b
                lg:border-b-0
                lg:border-r
                ${panelClass}
              `}
            >
              {/* LIST HEADER */}

              <div
                className={`
                  px-4
                  py-4
                  border-b
                  ${darkMode ? "border-slate-700" : "border-slate-200"}
                `}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className={`text-sm font-bold ${headingClass}`}>
                      Pending Applications
                    </h2>

                    <p className={`text-[10px] mt-1 ${mutedClass}`}>
                      {filteredApplications.length}{" "}
                      {filteredApplications.length === 1
                        ? "application"
                        : "applications"}
                    </p>
                  </div>

                  <span
                    className={`
                      min-w-7
                      h-7
                      px-2
                      rounded-full
                      flex
                      items-center
                      justify-center
                      text-[10px]
                      font-bold
                      ${
                        darkMode
                          ? "bg-slate-700 text-slate-300"
                          : "bg-slate-200 text-slate-600"
                      }
                    `}
                  >
                    {filteredApplications.length}
                  </span>
                </div>
              </div>

              {/* APPLICATION CARDS */}

              <div className="p-3 space-y-3">
                {filteredApplications.length > 0 ? (
                  filteredApplications.map((application) => {
                    const active = selectedApplicationId === application.id;

                    return (
                      <button
                        key={application.id}
                        type="button"
                        onClick={() => handleSelectApplication(application)}
                        className={`
                          w-full
                          text-left
                          p-4
                          rounded-xl
                          border
                          transition-all
                          duration-200
                          ${
                            active
                              ? darkMode
                                ? "bg-slate-700 border-slate-500 shadow-sm"
                                : "bg-slate-100 border-slate-400 shadow-sm"
                              : cardClass
                          }
                          ${
                            !active
                              ? darkMode
                                ? "hover:bg-slate-800 hover:border-slate-600"
                                : "hover:bg-slate-50 hover:border-slate-300"
                              : ""
                          }
                        `}
                      >
                        {/* NAME + STATUS */}

                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p
                              className={`text-xs font-bold truncate ${
                                active ? headingClass : headingClass
                              }`}
                            >
                              {application.student}
                            </p>

                            <p className={`text-[10px] mt-1 ${mutedClass}`}>
                              {application.studentId}
                            </p>
                          </div>

                          <span
                            className={`
                              flex-shrink-0
                              px-2
                              py-1
                              rounded-md
                              border
                              text-[9px]
                              font-bold
                              ${getStatusClass(application.status)}
                            `}
                          >
                            {application.status}
                          </span>
                        </div>

                        {/* COMPANY */}

                        <p
                          className={`text-[10px] mt-3 truncate ${mutedClass}`}
                        >
                          {application.company}
                        </p>

                        {/* POSITION */}

                        <p
                          className={`text-[10px] mt-1 truncate ${
                            darkMode ? "text-slate-300" : "text-slate-600"
                          }`}
                        >
                          {application.position}
                        </p>

                        {/* PROGRESS-LIKE BAR */}

                        <div
                          className={`
                            mt-3
                            h-1.5
                            rounded-full
                            overflow-hidden
                            ${darkMode ? "bg-slate-700" : "bg-slate-200"}
                          `}
                        >
                          <div
                            className={`
                              h-full
                              rounded-full
                              ${
                                application.status === "Approved"
                                  ? "bg-emerald-500"
                                  : application.status === "Rejected"
                                  ? "bg-red-500"
                                  : application.status === "Info Requested"
                                  ? "bg-blue-500"
                                  : darkMode
                                  ? "bg-slate-400"
                                  : "bg-slate-600"
                              }
                            `}
                            style={{
                              width:
                                application.status === "Pending"
                                  ? "45%"
                                  : "100%",
                            }}
                          />
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="py-12 text-center">
                    <div
                      className={`text-3xl mb-3 ${
                        darkMode ? "text-slate-600" : "text-slate-300"
                      }`}
                    >
                      📄
                    </div>

                    <p className={`text-xs font-bold ${headingClass}`}>
                      No applications found
                    </p>

                    <p className={`text-[10px] mt-1 ${mutedClass}`}>
                      Try changing your search or filter.
                    </p>
                  </div>
                )}
              </div>
            </aside>

            {/* =================================================
                APPLICATION DETAILS
            ================================================= */}

            <main className={darkMode ? "bg-slate-900" : "bg-white"}>
              {selectedApplication ? (
                <div className="h-full flex flex-col">
                  {/* APPLICATION HEADER */}

                  <div
                    className={`
                      px-5
                      sm:px-7
                      py-5
                      border-b
                      flex
                      items-start
                      justify-between
                      gap-4
                      ${darkMode ? "border-slate-700" : "border-slate-200"}
                    `}
                  >
                    <div>
                      <p
                        className={`text-[10px] uppercase tracking-widest font-bold mb-1 ${
                          darkMode ? "text-slate-500" : "text-slate-400"
                        }`}
                      >
                        Application Details
                      </p>

                      <h2 className={`text-lg font-black ${headingClass}`}>
                        {selectedApplication.student}
                      </h2>

                      <p className={`text-xs mt-1 ${mutedClass}`}>
                        {selectedApplication.studentId}
                      </p>
                    </div>

                    <span
                      className={`
                        flex-shrink-0
                        px-3
                        py-1.5
                        rounded-md
                        border
                        text-[10px]
                        font-bold
                        ${getStatusClass(selectedApplication.status)}
                      `}
                    >
                      {selectedApplication.status}
                    </span>
                  </div>

                  {/* DETAILS BODY */}

                  <div className="flex-1 p-5 sm:p-7">
                    {/* STUDENT */}

                    <div className="mb-5">
                      <p
                        className={`text-[10px] uppercase tracking-wide font-bold mb-1 ${mutedClass}`}
                      >
                        Student
                      </p>

                      <p className={`text-sm font-semibold ${headingClass}`}>
                        {selectedApplication.student}
                      </p>

                      <p className={`text-xs mt-1 ${mutedClass}`}>
                        {selectedApplication.email}
                      </p>
                    </div>

                    {/* COMPANY */}

                    <div className="mb-5">
                      <p
                        className={`text-[10px] uppercase tracking-wide font-bold mb-1 ${mutedClass}`}
                      >
                        Company
                      </p>

                      <p className={`text-sm font-semibold ${headingClass}`}>
                        {selectedApplication.company}
                      </p>
                    </div>

                    {/* POSITION */}

                    <div className="mb-5">
                      <p
                        className={`text-[10px] uppercase tracking-wide font-bold mb-1 ${mutedClass}`}
                      >
                        Position
                      </p>

                      <p className={`text-sm font-semibold ${headingClass}`}>
                        {selectedApplication.position}
                      </p>
                    </div>

                    {/* DURATION */}

                    <div className="mb-5">
                      <p
                        className={`text-[10px] uppercase tracking-wide font-bold mb-1 ${mutedClass}`}
                      >
                        Duration
                      </p>

                      <p className={`text-sm font-semibold ${headingClass}`}>
                        {selectedApplication.duration}
                      </p>
                    </div>

                    {/* SUBMITTED */}

                    <div className="mb-6">
                      <p
                        className={`text-[10px] uppercase tracking-wide font-bold mb-1 ${mutedClass}`}
                      >
                        Submitted
                      </p>

                      <p className={`text-sm font-semibold ${headingClass}`}>
                        {selectedApplication.submitted}
                      </p>
                    </div>

                    {/* DOCUMENT PREVIEW */}

                    <div
                      className={`
                        w-full
                        h-40
                        sm:h-48
                        rounded-xl
                        border
                        flex
                        flex-col
                        items-center
                        justify-center
                        ${
                          darkMode
                            ? "bg-slate-800 border-slate-700"
                            : "bg-slate-100 border-slate-200"
                        }
                      `}
                    >
                      <div
                        className={`text-3xl mb-2 ${
                          darkMode ? "text-slate-500" : "text-slate-400"
                        }`}
                      >
                        📄
                      </div>

                      <p className={`text-xs font-semibold ${mutedClass}`}>
                        {selectedApplication.documents}
                      </p>

                      <button
                        type="button"
                        className={`
                          mt-3
                          px-4
                          py-2
                          rounded-lg
                          text-[10px]
                          font-bold
                          transition
                          ${
                            darkMode
                              ? "bg-slate-700 text-slate-200 hover:bg-slate-600"
                              : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
                          }
                        `}
                      >
                        View Documents
                      </button>
                    </div>

                    {/* ACTION MESSAGE */}

                    {actionMessage && (
                      <div
                        className={`
                          mt-5
                          px-4
                          py-3
                          rounded-lg
                          border
                          text-xs
                          font-medium
                          ${
                            darkMode
                              ? "bg-slate-800 border-slate-700 text-slate-300"
                              : "bg-slate-50 border-slate-200 text-slate-600"
                          }
                        `}
                      >
                        {actionMessage}
                      </div>
                    )}

                    {/* ACTION BUTTONS */}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-5">
                      <button
                        type="button"
                        onClick={() => handleApplicationAction("approve")}
                        className="
                          h-10
                          rounded-lg
                          bg-emerald-600
                          text-white
                          text-xs
                          font-bold
                          hover:bg-emerald-700
                          transition
                        "
                      >
                        Approve
                      </button>

                      <button
                        type="button"
                        onClick={() => handleApplicationAction("reject")}
                        className="
                          h-10
                          rounded-lg
                          bg-red-600
                          text-white
                          text-xs
                          font-bold
                          hover:bg-red-700
                          transition
                        "
                      >
                        Reject
                      </button>

                      <button
                        type="button"
                        onClick={() => handleApplicationAction("request")}
                        className={`
                          h-10
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
                        Request Info
                      </button>
                    </div>

                    {/* COMMENT */}

                    <div className="mt-5">
                      <label
                        className={`block text-xs font-bold mb-2 ${headingClass}`}
                      >
                        Add Comment
                      </label>

                      <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Add comment..."
                        rows={4}
                        className={`
                          w-full
                          px-3
                          py-3
                          rounded-lg
                          border
                          text-xs
                          resize-none
                          outline-none
                          transition
                          focus:ring-2
                          ${inputClass}
                        `}
                      />

                      <div className="flex justify-end mt-2">
                        <button
                          type="button"
                          disabled={!comment.trim()}
                          onClick={() => {
                            setActionMessage("Comment added successfully.");
                            setComment("");
                          }}
                          className={`
                            px-4
                            py-2
                            rounded-lg
                            text-xs
                            font-bold
                            text-white
                            transition
                            disabled:opacity-40
                            disabled:cursor-not-allowed
                            ${
                              darkMode
                                ? "bg-slate-700 hover:bg-slate-600"
                                : "bg-slate-800 hover:bg-slate-700"
                            }
                          `}
                        >
                          Add Comment
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* NO APPLICATION SELECTED */

                <div className="h-full min-h-[500px] flex items-center justify-center p-8 text-center">
                  <div>
                    <div
                      className={`text-4xl mb-3 ${
                        darkMode ? "text-slate-600" : "text-slate-300"
                      }`}
                    >
                      📄
                    </div>

                    <h2 className={`text-sm font-bold ${headingClass}`}>
                      No Application Selected
                    </h2>

                    <p className={`text-xs mt-1 ${mutedClass}`}>
                      Select an application from the list to review its details.
                    </p>
                  </div>
                </div>
              )}
            </main>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ReviewApplications;
