import React, { useRef, useState } from "react";

const Documents = () => {
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

  // -----------------------------
  // DOCUMENT CONFIGURATION
  // -----------------------------

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

  // -----------------------------
  // FILE SELECTION
  // -----------------------------

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

    // 10MB limit
    if (file.size > 10 * 1024 * 1024) {
      alert("File size must not exceed 10MB.");
      return;
    }

    setDocuments((prev) => ({
      ...prev,
      [key]: file,
    }));
  };

  // -----------------------------
  // UPLOAD DOCUMENT
  // -----------------------------

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

  // -----------------------------
  // DOCUMENT TITLE
  // -----------------------------

  const getDocumentTitle = (key) => {
    const document = documentList.find((item) => item.key === key);

    return document?.title || "Document";
  };

  // -----------------------------
  // DOWNLOAD
  // -----------------------------

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

  // -----------------------------
  // STATUS
  // -----------------------------

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
        <p className="text-xs uppercase tracking-widest font-bold text-slate-400 mb-1">
          Student Portal
        </p>

        <h1 className="text-2xl font-black text-slate-900">
          Document Submission
        </h1>

        <p className="text-sm text-slate-500 mt-1">
          Upload, submit, and manage your internship documents.
        </p>
      </div>

      {/* =========================================
          DOCUMENT TABS
      ========================================= */}

      <div className="inline-flex p-1 bg-slate-100 border border-slate-200 rounded-xl mb-5">
        {/* UPLOAD */}

        <button
          type="button"
          onClick={() => setActiveTab("upload")}
          className={`px-6 md:px-8 py-2.5 rounded-lg text-xs font-semibold transition ${
            activeTab === "upload"
              ? "bg-white text-slate-900 shadow-sm"
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
              ? "bg-white text-slate-900 shadow-sm"
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
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          Download
        </button>
      </div>

      {/* =========================================
          MAIN DOCUMENT PANEL
      ========================================= */}

      <section className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 max-w-[1000px] shadow-sm">
        {/* =========================================
            UPLOAD TAB
        ========================================= */}

        {activeTab === "upload" && (
          <>
            <div className="mb-6">
              <h2 className="text-lg font-bold text-slate-900">
                Upload Requirements
              </h2>

              <p className="text-xs text-slate-400 mt-1">
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
                    className="border border-slate-200 rounded-xl bg-slate-50 p-4"
                  >
                    {/* DOCUMENT HEADER */}

                    <div className="mb-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-bold text-slate-800">
                            {document.title}
                          </h3>

                          <p className="text-xs text-slate-400 mt-1">
                            {document.description}
                          </p>
                        </div>

                        {uploaded && (
                          <span className="inline-flex flex-shrink-0 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-100 text-amber-700 text-[10px] font-bold">
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

                      <button
                        type="button"
                        onClick={() =>
                          fileInputRefs[document.key].current?.click()
                        }
                        className="px-4 py-2.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition"
                      >
                        Choose File
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-500 truncate">
                          {file ? file.name : "No file chosen"}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleUpload(document.key)}
                        disabled={!file}
                        className={`px-6 py-2.5 rounded-lg text-xs font-semibold transition ${
                          file
                            ? "bg-slate-900 text-white hover:bg-slate-800"
                            : "bg-slate-200 text-slate-400 cursor-not-allowed"
                        }`}
                      >
                        {uploaded ? "Replace" : "Upload"}
                      </button>
                    </div>

                    {/* FILE INFO */}

                    {file && (
                      <div className="flex items-center justify-between mt-3">
                        <p className="text-[10px] text-slate-400">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>

                        <p className="text-[10px] text-slate-400">
                          PDF, DOC, DOCX, JPG or PNG
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* UPLOAD NOTE */}

            <div className="mt-5 p-4 rounded-xl border border-slate-200 bg-white">
              <p className="text-xs text-slate-500 leading-relaxed">
                <span className="font-bold text-slate-700">
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
              <h2 className="text-lg font-bold text-slate-900">
                Submitted Documents
              </h2>

              <p className="text-xs text-slate-400 mt-1">
                View the documents you have submitted for your internship.
              </p>
            </div>

            <div className="space-y-3">
              {documentList.map((document) => {
                const uploaded = uploadedDocuments[document.key];

                return (
                  <div
                    key={document.key}
                    className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center flex-shrink-0">
                        📄
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800">
                          {document.title}
                        </p>

                        <p className="text-xs text-slate-400 mt-1 truncate">
                          {uploaded
                            ? uploaded.file.name
                            : "No document submitted"}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`inline-flex w-fit px-3 py-1.5 rounded-lg text-[10px] font-bold ${
                        uploaded
                          ? "bg-amber-50 border border-amber-100 text-amber-700"
                          : "bg-slate-100 border border-slate-200 text-slate-400"
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
              <h2 className="text-lg font-bold text-slate-900">
                Download Documents
              </h2>

              <p className="text-xs text-slate-400 mt-1">
                Download copies of your submitted internship documents.
              </p>
            </div>

            <div className="space-y-3">
              {documentList.map((document) => {
                const uploaded = uploadedDocuments[document.key];

                return (
                  <div
                    key={document.key}
                    className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center flex-shrink-0">
                        📄
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800">
                          {document.title}
                        </p>

                        <p className="text-xs text-slate-400 mt-1 truncate">
                          {uploaded
                            ? uploaded.file.name
                            : "No document available"}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={!uploaded}
                      onClick={() => handleDownload(document.key)}
                      className={`px-5 py-2.5 rounded-lg text-xs font-semibold transition ${
                        uploaded
                          ? "bg-slate-900 text-white hover:bg-slate-800"
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
