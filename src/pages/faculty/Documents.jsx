import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";

const Documents = () => {
  const { darkMode } = useOutletContext();

  // =========================================================
  // DOCUMENT DATA
  // =========================================================

  const documents = [
    {
      id: 1,
      title: "Acceptance Letter",
      student: "John Doe",
      type: "PDF",
      status: "Pending Review",
      submitted: "May 1, 2024",
    },
    {
      id: 2,
      title: "Resume / CV",
      student: "John Doe",
      type: "PDF",
      status: "Pending Review",
      submitted: "May 1, 2024",
    },
    {
      id: 3,
      title: "Internship Agreement",
      student: "John Doe",
      type: "PDF",
      status: "Pending Review",
      submitted: "May 2, 2024",
    },
    {
      id: 4,
      title: "Medical Certificate",
      student: "John Doe",
      type: "PDF",
      status: "Pending Review",
      submitted: "May 2, 2024",
    },
    {
      id: 5,
      title: "Parent Consent Form",
      student: "John Doe",
      type: "PDF",
      status: "Pending Review",
      submitted: "May 3, 2024",
    },
  ];

  // =========================================================
  // STATE
  // =========================================================

  const [selectedDocument, setSelectedDocument] = useState(documents[0]);
  const [documentStatuses, setDocumentStatuses] = useState(
    documents.reduce((acc, document) => {
      acc[document.id] = document.status;
      return acc;
    }, {})
  );

  const [actionMessage, setActionMessage] = useState("");

  // =========================================================
  // THEME CLASSES
  // =========================================================

  const pageHeadingClass = darkMode ? "text-slate-100" : "text-slate-900";

  const mutedClass = darkMode ? "text-slate-400" : "text-slate-500";

  const mainContainerClass = darkMode
    ? "bg-slate-900 border-slate-700"
    : "bg-white border-slate-300";

  const panelClass = darkMode
    ? "bg-slate-800 border-slate-700"
    : "bg-slate-50 border-slate-200";

  const cardClass = darkMode
    ? "bg-slate-800 border-slate-700"
    : "bg-white border-slate-200";

  const viewerClass = darkMode
    ? "bg-slate-900 border-slate-700"
    : "bg-white border-slate-200";

  // =========================================================
  // SELECT DOCUMENT
  // =========================================================

  const handleSelectDocument = (document) => {
    setSelectedDocument(document);
    setActionMessage("");
  };

  // =========================================================
  // UPDATE STATUS
  // =========================================================

  const updateDocumentStatus = (status, message) => {
    setDocumentStatuses((prev) => ({
      ...prev,
      [selectedDocument.id]: status,
    }));

    setActionMessage(message);
  };

  // =========================================================
  // APPROVE DOCUMENT
  // =========================================================

  const handleApprove = () => {
    updateDocumentStatus(
      "Approved",
      `${selectedDocument.title} has been approved.`
    );
  };

  // =========================================================
  // REQUEST FIX
  // =========================================================

  const handleRequestFix = () => {
    updateDocumentStatus(
      "Needs Revision",
      `A revision has been requested for ${selectedDocument.title}.`
    );
  };

  // =========================================================
  // DOWNLOAD
  // =========================================================

  const handleDownload = () => {
    const fileContent = `
Document: ${selectedDocument.title}
Student: ${selectedDocument.student}
Type: ${selectedDocument.type}
Submitted: ${selectedDocument.submitted}
Status: ${documentStatuses[selectedDocument.id]}
    `.trim();

    const blob = new Blob([fileContent], {
      type: "text/plain",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${selectedDocument.title
      .replace(/\s+/g, "-")
      .toLowerCase()}.txt`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  // =========================================================
  // GET STATUS
  // =========================================================

  const getStatus = (documentId) => {
    return documentStatuses[documentId] || "Pending Review";
  };

  // =========================================================
  // STATUS STYLE
  // =========================================================

  const getStatusClass = (status) => {
    if (status === "Approved") {
      return darkMode
        ? "bg-emerald-900/40 text-emerald-300 border-emerald-800"
        : "bg-emerald-50 text-emerald-700 border-emerald-200";
    }

    if (status === "Needs Revision") {
      return darkMode
        ? "bg-red-900/40 text-red-300 border-red-800"
        : "bg-red-50 text-red-700 border-red-200";
    }

    return darkMode
      ? "bg-amber-900/40 text-amber-300 border-amber-800"
      : "bg-amber-50 text-amber-700 border-amber-200";
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

          <h1 className={`text-xl sm:text-2xl font-black ${pageHeadingClass}`}>
            Submitted Documents
          </h1>

          <p className={`text-xs sm:text-sm mt-1 ${mutedClass}`}>
            Review, approve, and request revisions for submitted student
            documents.
          </p>
        </div>

        {/* =====================================================
            MAIN DOCUMENT CONTAINER
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
          <div
            className="
              grid
              grid-cols-1
              lg:grid-cols-[280px_minmax(0,1fr)]
              min-h-[650px]
            "
          >
            {/* =================================================
                DOCUMENT LIST
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
                  p-4
                  border-b
                  ${darkMode ? "border-slate-700" : "border-slate-200"}
                `}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2
                      className={`text-sm font-bold ${
                        darkMode ? "text-slate-100" : "text-slate-900"
                      }`}
                    >
                      Documents
                    </h2>

                    <p className={`text-[10px] mt-1 ${mutedClass}`}>
                      Submitted by students
                    </p>
                  </div>

                  <span
                    className={`
                      min-w-7
                      h-7
                      px-2
                      rounded-lg
                      flex
                      items-center
                      justify-center
                      text-[10px]
                      font-bold
                      border
                      ${
                        darkMode
                          ? "bg-slate-900 border-slate-700 text-slate-400"
                          : "bg-white border-slate-200 text-slate-500"
                      }
                    `}
                  >
                    {documents.length}
                  </span>
                </div>
              </div>

              {/* DOCUMENT LIST */}

              <div
                className="
                  p-3
                  space-y-2
                  max-h-[420px]
                  lg:max-h-none
                  overflow-y-auto
                "
              >
                {documents.map((document) => {
                  const active = selectedDocument.id === document.id;
                  const status = getStatus(document.id);

                  return (
                    <button
                      key={document.id}
                      type="button"
                      onClick={() => handleSelectDocument(document)}
                      className={`
                        w-full
                        text-left
                        p-3
                        rounded-lg
                        border
                        transition-all
                        duration-200
                        ${
                          active
                            ? darkMode
                              ? "bg-slate-700 border-slate-500 shadow-sm"
                              : "bg-slate-100 border-slate-400 shadow-sm"
                            : darkMode
                            ? "bg-slate-900 border-slate-700 hover:bg-slate-700 hover:border-slate-600"
                            : "bg-white border-slate-200 hover:bg-slate-100 hover:border-slate-300"
                        }
                      `}
                    >
                      <div className="flex items-start gap-3">
                        {/* DOCUMENT ICON */}

                        <div
                          className={`
                            w-9
                            h-9
                            flex-shrink-0
                            rounded-lg
                            flex
                            items-center
                            justify-center
                            text-[10px]
                            font-bold
                            border
                            ${
                              active
                                ? darkMode
                                  ? "bg-slate-800 border-slate-600 text-slate-200"
                                  : "bg-white border-slate-300 text-slate-700"
                                : darkMode
                                ? "bg-slate-800 border-slate-700 text-slate-400"
                                : "bg-slate-100 border-slate-200 text-slate-500"
                            }
                          `}
                        >
                          PDF
                        </div>

                        {/* DOCUMENT INFO */}

                        <div className="min-w-0 flex-1">
                          <p
                            className={`
                              text-xs
                              font-bold
                              truncate
                              ${darkMode ? "text-slate-100" : "text-slate-900"}
                            `}
                          >
                            {document.title}
                          </p>

                          <p
                            className={`
                              text-[10px]
                              mt-1
                              truncate
                              ${mutedClass}
                            `}
                          >
                            {document.student}
                          </p>

                          <span
                            className={`
                              inline-flex
                              mt-2
                              px-2
                              py-0.5
                              rounded-md
                              border
                              text-[8px]
                              font-bold
                              ${getStatusClass(status)}
                            `}
                          >
                            {status}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </aside>

            {/* =================================================
                DOCUMENT VIEWER
            ================================================= */}

            <main
              className={`
                min-w-0
                flex
                flex-col
                ${viewerClass}
              `}
            >
              {/* VIEWER HEADER */}

              <div
                className={`
                  px-4
                  sm:px-5
                  py-4
                  border-b
                  flex
                  flex-col
                  sm:flex-row
                  sm:items-center
                  sm:justify-between
                  gap-3
                  ${
                    darkMode
                      ? "border-slate-700 bg-slate-900"
                      : "border-slate-200 bg-white"
                  }
                `}
              >
                <div className="min-w-0">
                  <h2
                    className={`
                      text-sm
                      font-bold
                      truncate
                      ${darkMode ? "text-slate-100" : "text-slate-900"}
                    `}
                  >
                    Document Viewer
                  </h2>

                  <p className={`text-[10px] mt-1 ${mutedClass}`}>
                    Review the selected submitted document.
                  </p>
                </div>

                <span
                  className={`
                    self-start
                    sm:self-auto
                    inline-flex
                    px-2.5
                    py-1
                    rounded-md
                    border
                    text-[9px]
                    font-bold
                    ${getStatusClass(getStatus(selectedDocument.id))}
                  `}
                >
                  {getStatus(selectedDocument.id)}
                </span>
              </div>

              {/* VIEWER CONTENT */}

              <div className="flex-1 p-4 sm:p-6">
                {/* DOCUMENT INFO */}

                <div className="mb-5">
                  <p
                    className={`text-sm font-bold ${
                      darkMode ? "text-slate-100" : "text-slate-900"
                    }`}
                  >
                    {selectedDocument.title} - {selectedDocument.student}
                  </p>

                  <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2">
                    <p className={`text-[10px] ${mutedClass}`}>
                      Type: {selectedDocument.type}
                    </p>

                    <p className={`text-[10px] ${mutedClass}`}>
                      Submitted: {selectedDocument.submitted}
                    </p>
                  </div>
                </div>

                {/* DOCUMENT PREVIEW */}

                <div
                  className={`
                    w-full
                    min-h-[380px]
                    sm:min-h-[440px]
                    rounded-xl
                    border
                    flex
                    items-center
                    justify-center
                    overflow-hidden
                    ${
                      darkMode
                        ? "bg-slate-800 border-slate-700"
                        : "bg-slate-100 border-slate-200"
                    }
                  `}
                >
                  <div
                    className={`
                      w-[90%]
                      max-w-[650px]
                      h-[320px]
                      sm:h-[390px]
                      rounded-lg
                      border
                      flex
                      flex-col
                      items-center
                      justify-center
                      ${
                        darkMode
                          ? "bg-slate-900 border-slate-600"
                          : "bg-white border-slate-300"
                      }
                    `}
                  >
                    <div
                      className={`
                        w-16
                        h-20
                        rounded-lg
                        border-2
                        flex
                        items-center
                        justify-center
                        text-xs
                        font-bold
                        mb-4
                        ${
                          darkMode
                            ? "border-slate-600 text-slate-500"
                            : "border-slate-300 text-slate-400"
                        }
                      `}
                    >
                      PDF
                    </div>

                    <p
                      className={`
                        text-sm
                        font-semibold
                        text-center
                        px-4
                        ${darkMode ? "text-slate-300" : "text-slate-600"}
                      `}
                    >
                      {selectedDocument.title}
                    </p>

                    <p
                      className={`
                        text-[10px]
                        mt-1
                        ${mutedClass}
                      `}
                    >
                      Document preview
                    </p>
                  </div>
                </div>

                {/* ACTION MESSAGE */}

                {actionMessage && (
                  <div
                    className={`
                      mt-4
                      px-4
                      py-3
                      rounded-lg
                      border
                      text-xs
                      font-medium
                      ${
                        getStatus(selectedDocument.id) === "Approved"
                          ? darkMode
                            ? "bg-emerald-900/30 border-emerald-800 text-emerald-300"
                            : "bg-emerald-50 border-emerald-200 text-emerald-700"
                          : darkMode
                          ? "bg-red-900/30 border-red-800 text-red-300"
                          : "bg-red-50 border-red-200 text-red-700"
                      }
                    `}
                  >
                    {actionMessage}
                  </div>
                )}
              </div>

              {/* =================================================
                  ACTION FOOTER
              ================================================= */}

              <div
                className={`
                  px-4
                  sm:px-6
                  py-4
                  border-t
                  ${
                    darkMode
                      ? "border-slate-700 bg-slate-900"
                      : "border-slate-200 bg-white"
                  }
                `}
              >
                <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                  {/* DOWNLOAD */}

                  <button
                    type="button"
                    onClick={handleDownload}
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
                          ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
                          : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"
                      }
                    `}
                  >
                    Download
                  </button>

                  {/* APPROVE */}

                  <button
                    type="button"
                    onClick={handleApprove}
                    className="
                      h-10
                      px-5
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

                  {/* REQUEST FIX */}

                  <button
                    type="button"
                    onClick={handleRequestFix}
                    className="
                      h-10
                      px-5
                      rounded-lg
                      bg-red-600
                      text-white
                      text-xs
                      font-bold
                      hover:bg-red-700
                      transition
                    "
                  >
                    Request Fix
                  </button>
                </div>
              </div>
            </main>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Documents;
