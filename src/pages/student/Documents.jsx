import React, { useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";

const Documents = () => {
  const { darkMode } = useOutletContext();

  const [activeTab, setActiveTab] = useState("upload");

  const [documents, setDocuments] = useState({
    acceptanceLetter: null,
    medicalCertificate: null,
    parentConsent: null,
    insuranceForm: null,
  });

  const [uploadedDocuments, setUploadedDocuments] = useState({});

  const fileInputRefs = {
    acceptanceLetter: useRef(null),
    medicalCertificate: useRef(null),
    parentConsent: useRef(null),
    insuranceForm: useRef(null),
  };

  // =========================================
  // DOCUMENT CONFIGURATION
  // =========================================

  const documentList = [
    {
      key: "acceptanceLetter",
      title: "Acceptance Letter",
      description: "Upload your internship acceptance letter.",
    },
    {
      key: "medicalCertificate",
      title: "Medical Certificate",
      description: "Upload your latest medical certificate.",
    },
    {
      key: "parentConsent",
      title: "Parent Consent",
      description: "Upload the required parent consent form.",
    },
    {
      key: "insuranceForm",
      title: "Insurance Form",
      description: "Upload your internship insurance form.",
    },
  ];

  // =========================================
  // COMMON CLASSES
  // =========================================

  const headingClass = darkMode ? "text-slate-100" : "text-slate-900";

  const mutedClass = darkMode ? "text-slate-400" : "text-slate-500";

  const cardClass = darkMode
    ? "bg-slate-900 border-slate-700"
    : "bg-white border-slate-200";

  const innerBoxClass = darkMode
    ? "bg-slate-800 border-slate-700"
    : "bg-slate-50 border-slate-200";

  const inputBoxClass = darkMode
    ? "bg-slate-900 border-slate-700 text-slate-400"
    : "bg-white border-slate-200 text-slate-500";

  // =========================================
  // FILE SELECTION
  // =========================================

  const handleFileChange = (key, e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg",
      "image/png",
    ];

    if (!allowedTypes.includes(file.type)) {
      alert("Please upload a PDF, DOC, DOCX, JPG, or PNG file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert("File size must not exceed 10MB.");
      return;
    }

    setDocuments((prev) => ({
      ...prev,
      [key]: file,
    }));
  };

  // =========================================
  // UPLOAD DOCUMENT
  // =========================================

  const handleUpload = (key) => {
    const file = documents[key];

    if (!file) {
      alert("Please choose a file first.");
      return;
    }

    setUploadedDocuments((prev) => ({
      ...prev,
      [key]: {
        file,
        status: "Pending",
        uploadedAt: new Date(),
      },
    }));

    alert(`${getDocumentTitle(key)} uploaded successfully.`);
  };

  // =========================================
  // DOCUMENT TITLE
  // =========================================

  const getDocumentTitle = (key) => {
    const document = documentList.find((item) => item.key === key);

    return document?.title || "Document";
  };

  // =========================================
  // DOWNLOAD
  // =========================================

  const handleDownload = (key) => {
    const uploaded = uploadedDocuments[key];

    if (!uploaded?.file) {
      alert("No uploaded document available.");
      return;
    }

    const url = URL.createObjectURL(uploaded.file);

    const link = document.createElement("a");

    link.href = url;
    link.download = uploaded.file.name;

    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  // =========================================
  // STATUS
  // =========================================

  const getDocumentStatus = (key) => {
    if (!uploadedDocuments[key]) {
      return "Not Submitted";
    }

    return uploadedDocuments[key].status;
  };

  return (
    <div className="p-5 md:p-6 lg:p-8 max-w-[1400px] mx-auto">
      {/* =========================================
          PAGE HEADER
      ========================================= */}

      <div className="mb-6">
        <p
          className={`text-xs uppercase tracking-widest font-bold mb-1 ${
            darkMode ? "text-slate-500" : "text-slate-400"
          }`}
        >
          Student Portal
        </p>

        <h1 className={`text-2xl font-black ${headingClass}`}>
          Document Submission
        </h1>

        <p className={`text-sm mt-1 ${mutedClass}`}>
          Upload, submit, and manage your internship documents.
        </p>
      </div>

      {/* =========================================
          DOCUMENT TABS
      ========================================= */}

      <div
        className={`inline-flex p-1 rounded-xl mb-5 border ${
          darkMode
            ? "bg-slate-800 border-slate-700"
            : "bg-slate-100 border-slate-200"
        }`}
      >
        {/* UPLOAD */}

        <button
          type="button"
          onClick={() => setActiveTab("upload")}
          className={`px-6 md:px-8 py-2.5 rounded-lg text-xs font-semibold transition ${
            activeTab === "upload"
              ? darkMode
                ? "bg-slate-700 text-white shadow-sm"
                : "bg-white text-slate-900 shadow-sm"
              : darkMode
              ? "text-slate-400 hover:text-white"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          Upload
        </button>

        {/* SUBMITTED */}

        <button
          type="button"
          onClick={() => setActiveTab("submitted")}
          className={`px-6 md:px-8 py-2.5 rounded-lg text-xs font-semibold transition ${
            activeTab === "submitted"
              ? darkMode
                ? "bg-slate-700 text-white shadow-sm"
                : "bg-white text-slate-900 shadow-sm"
              : darkMode
              ? "text-slate-400 hover:text-white"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          Submitted
        </button>

        {/* DOWNLOAD */}

        <button
          type="button"
          onClick={() => setActiveTab("download")}
          className={`px-6 md:px-8 py-2.5 rounded-lg text-xs font-semibold transition ${
            activeTab === "download"
              ? darkMode
                ? "bg-slate-700 text-white shadow-sm"
                : "bg-white text-slate-900 shadow-sm"
              : darkMode
              ? "text-slate-400 hover:text-white"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          Download
        </button>
      </div>

      {/* =========================================
          MAIN DOCUMENT PANEL
      ========================================= */}

      <section
        className={`${cardClass} border rounded-2xl p-5 md:p-6 max-w-[1000px] shadow-sm`}
      >
        {/* =========================================
            UPLOAD TAB
        ========================================= */}

        {activeTab === "upload" && (
          <>
            <div className="mb-6">
              <h2 className={`text-lg font-bold ${headingClass}`}>
                Upload Requirements
              </h2>

              <p className={`text-xs mt-1 ${mutedClass}`}>
                Upload the required documents for your internship application.
              </p>
            </div>

            <div className="space-y-4">
              {documentList.map((document) => {
                const file = documents[document.key];
                const uploaded = uploadedDocuments[document.key];

                return (
                  <div
                    key={document.key}
                    className={`${innerBoxClass} border rounded-xl p-4`}
                  >
                    {/* DOCUMENT HEADER */}

                    <div className="mb-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h3
                            className={`text-sm font-bold ${
                              darkMode ? "text-slate-100" : "text-slate-800"
                            }`}
                          >
                            {document.title}
                          </h3>

                          <p className={`text-xs mt-1 ${mutedClass}`}>
                            {document.description}
                          </p>
                        </div>

                        {uploaded && (
                          <span
                            className={`inline-flex flex-shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-bold border ${
                              darkMode
                                ? "bg-amber-950/40 border-amber-900/50 text-amber-400"
                                : "bg-amber-50 border-amber-100 text-amber-700"
                            }`}
                          >
                            {uploaded.status}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* FILE CONTROLS */}

                    <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                      <input
                        ref={fileInputRefs[document.key]}
                        type="file"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileChange(document.key, e)}
                        className="hidden"
                      />

                      {/* CHOOSE FILE */}

                      <button
                        type="button"
                        onClick={() =>
                          fileInputRefs[document.key].current?.click()
                        }
                        className={`px-4 py-2.5 rounded-lg text-xs font-semibold transition ${
                          darkMode
                            ? "bg-white text-slate-900 hover:bg-slate-200"
                            : "bg-slate-900 text-white hover:bg-slate-800"
                        }`}
                      >
                        Choose File
                      </button>

                      {/* FILE NAME */}

                      <div className="flex-1 min-w-0">
                        <div
                          className={`w-full px-4 py-2.5 rounded-lg border text-xs truncate ${inputBoxClass}`}
                        >
                          {file ? file.name : "No file chosen"}
                        </div>
                      </div>

                      {/* UPLOAD */}

                      <button
                        type="button"
                        onClick={() => handleUpload(document.key)}
                        disabled={!file}
                        className={`px-6 py-2.5 rounded-lg text-xs font-semibold transition ${
                          file
                            ? darkMode
                              ? "bg-white text-slate-900 hover:bg-slate-200"
                              : "bg-slate-900 text-white hover:bg-slate-800"
                            : darkMode
                            ? "bg-slate-700 text-slate-500 cursor-not-allowed"
                            : "bg-slate-200 text-slate-400 cursor-not-allowed"
                        }`}
                      >
                        {uploaded ? "Replace" : "Upload"}
                      </button>
                    </div>

                    {/* FILE INFO */}

                    {file && (
                      <div className="flex items-center justify-between mt-3">
                        <p className={`text-[10px] ${mutedClass}`}>
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>

                        <p className={`text-[10px] ${mutedClass}`}>
                          PDF, DOC, DOCX, JPG or PNG
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* UPLOAD NOTE */}

            <div
              className={`mt-5 p-4 rounded-xl border ${
                darkMode
                  ? "bg-slate-800 border-slate-700"
                  : "bg-white border-slate-200"
              }`}
            >
              <p className={`text-xs leading-relaxed ${mutedClass}`}>
                <span
                  className={`font-bold ${
                    darkMode ? "text-slate-200" : "text-slate-700"
                  }`}
                >
                  Upload Guidelines:
                </span>{" "}
                Make sure all files are clear and readable. Each file must not
                exceed 10MB.
              </p>
            </div>
          </>
        )}

        {/* =========================================
            SUBMITTED TAB
        ========================================= */}

        {activeTab === "submitted" && (
          <>
            <div className="mb-6">
              <h2 className={`text-lg font-bold ${headingClass}`}>
                Submitted Documents
              </h2>

              <p className={`text-xs mt-1 ${mutedClass}`}>
                View the documents you have submitted for your internship.
              </p>
            </div>

            <div className="space-y-3">
              {documentList.map((document) => {
                const uploaded = uploadedDocuments[document.key];

                return (
                  <div
                    key={document.key}
                    className={`flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 rounded-xl border ${innerBoxClass}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* FILE ICON */}

                      <div
                        className={`w-10 h-10 rounded-lg border flex items-center justify-center flex-shrink-0 ${
                          darkMode
                            ? "bg-slate-900 border-slate-700"
                            : "bg-white border-slate-200"
                        }`}
                      >
                        📄
                      </div>

                      <div className="min-w-0">
                        <p
                          className={`text-sm font-semibold ${
                            darkMode ? "text-slate-100" : "text-slate-800"
                          }`}
                        >
                          {document.title}
                        </p>

                        <p className={`text-xs mt-1 truncate ${mutedClass}`}>
                          {uploaded
                            ? uploaded.file.name
                            : "No document submitted"}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`inline-flex w-fit px-3 py-1.5 rounded-lg text-[10px] font-bold border ${
                        uploaded
                          ? darkMode
                            ? "bg-amber-950/40 border-amber-900/50 text-amber-400"
                            : "bg-amber-50 border-amber-100 text-amber-700"
                          : darkMode
                          ? "bg-slate-700 border-slate-600 text-slate-500"
                          : "bg-slate-100 border-slate-200 text-slate-400"
                      }`}
                    >
                      {getDocumentStatus(document.key)}
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* =========================================
            DOWNLOAD TAB
        ========================================= */}

        {activeTab === "download" && (
          <>
            <div className="mb-6">
              <h2 className={`text-lg font-bold ${headingClass}`}>
                Download Documents
              </h2>

              <p className={`text-xs mt-1 ${mutedClass}`}>
                Download copies of your submitted internship documents.
              </p>
            </div>

            <div className="space-y-3">
              {documentList.map((document) => {
                const uploaded = uploadedDocuments[document.key];

                return (
                  <div
                    key={document.key}
                    className={`flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 rounded-xl border ${innerBoxClass}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* FILE ICON */}

                      <div
                        className={`w-10 h-10 rounded-lg border flex items-center justify-center flex-shrink-0 ${
                          darkMode
                            ? "bg-slate-900 border-slate-700"
                            : "bg-white border-slate-200"
                        }`}
                      >
                        📄
                      </div>

                      <div className="min-w-0">
                        <p
                          className={`text-sm font-semibold ${
                            darkMode ? "text-slate-100" : "text-slate-800"
                          }`}
                        >
                          {document.title}
                        </p>

                        <p className={`text-xs mt-1 truncate ${mutedClass}`}>
                          {uploaded
                            ? uploaded.file.name
                            : "No document available"}
                        </p>
                      </div>
                    </div>

                    {/* DOWNLOAD BUTTON */}

                    <button
                      type="button"
                      disabled={!uploaded}
                      onClick={() => handleDownload(document.key)}
                      className={`px-5 py-2.5 rounded-lg text-xs font-semibold transition ${
                        uploaded
                          ? darkMode
                            ? "bg-white text-slate-900 hover:bg-slate-200"
                            : "bg-slate-900 text-white hover:bg-slate-800"
                          : darkMode
                          ? "bg-slate-700 text-slate-500 cursor-not-allowed"
                          : "bg-slate-200 text-slate-400 cursor-not-allowed"
                      }`}
                    >
                      Download
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>
    </div>
  );
};

export default Documents;
