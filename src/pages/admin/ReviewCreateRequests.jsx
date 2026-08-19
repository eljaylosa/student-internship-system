import React, { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "sims_create_requests";

const ReviewCreateRequests = () => {
  const [requests, setRequests] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [notification, setNotification] = useState(null);

  // --------------------------------------------------
  // LOAD REQUESTS
  // --------------------------------------------------

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = () => {
    try {
      const storedRequests = localStorage.getItem(STORAGE_KEY);

      if (!storedRequests) {
        setRequests([]);
        return;
      }

      const parsedRequests = JSON.parse(storedRequests);

      if (Array.isArray(parsedRequests)) {
        setRequests(parsedRequests);
      } else {
        setRequests([]);
      }
    } catch (error) {
      console.error("Failed to load create requests:", error);
      setRequests([]);
    }
  };

  // --------------------------------------------------
  // SAVE REQUESTS
  // --------------------------------------------------

  const saveRequests = (updatedRequests) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRequests));
    setRequests(updatedRequests);
  };

  // --------------------------------------------------
  // NOTIFICATION
  // --------------------------------------------------

  const showNotification = (message, type = "success") => {
    setNotification({
      message,
      type,
    });

    setTimeout(() => {
      setNotification(null);
    }, 3500);
  };

  // --------------------------------------------------
  // FILTER REQUESTS
  // --------------------------------------------------

  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      const role = request.role?.toLowerCase() || "";
      const status = request.status?.toLowerCase() || "";

      const matchesFilter =
        activeFilter === "all" ||
        (activeFilter === "students" && role === "student") ||
        (activeFilter === "registrar" && role === "registrar") ||
        (activeFilter === "pending" && status === "pending") ||
        (activeFilter === "approved" && status === "approved") ||
        (activeFilter === "rejected" && status === "rejected");

      const searchValue = searchTerm.toLowerCase().trim();

      if (!searchValue) {
        return matchesFilter;
      }

      const fullName = [
        request.firstName,
        request.middleInitial,
        request.lastName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const identifier =
        request.role === "student"
          ? request.studentId || ""
          : request.employeeId || "";

      const matchesSearch =
        fullName.includes(searchValue) ||
        request.email?.toLowerCase().includes(searchValue) ||
        identifier.toLowerCase().includes(searchValue);

      return matchesFilter && matchesSearch;
    });
  }, [requests, activeFilter, searchTerm]);

  // --------------------------------------------------
  // STATISTICS
  // --------------------------------------------------

  const statistics = useMemo(() => {
    const studentRequests = requests.filter(
      (request) => request.role === "student"
    );

    const registrarRequests = requests.filter(
      (request) => request.role === "registrar"
    );

    const pendingRequests = requests.filter(
      (request) => request.status === "pending"
    );

    return {
      total: requests.length,
      students: studentRequests.length,
      registrars: registrarRequests.length,
      pending: pendingRequests.length,
    };
  }, [requests]);

  // --------------------------------------------------
  // REVIEW REQUEST
  // --------------------------------------------------

  const handleReview = (request) => {
    setSelectedRequest(request);
    setShowReviewModal(true);
  };

  // --------------------------------------------------
  // APPROVE
  // --------------------------------------------------

  const handleApprove = () => {
    if (!selectedRequest) return;

    const updatedRequests = requests.map((request) =>
      request.id === selectedRequest.id
        ? {
            ...request,
            status: "approved",
            reviewedAt: new Date().toISOString(),
            rejectionReason: null,
          }
        : request
    );

    saveRequests(updatedRequests);

    setSelectedRequest({
      ...selectedRequest,
      status: "approved",
      reviewedAt: new Date().toISOString(),
      rejectionReason: null,
    });

    setShowReviewModal(false);

    showNotification(
      `${getFullName(selectedRequest)}'s registration has been approved.`
    );
  };

  // --------------------------------------------------
  // OPEN REJECT MODAL
  // --------------------------------------------------

  const handleOpenReject = () => {
    setRejectionReason("");
    setShowRejectModal(true);
  };

  // --------------------------------------------------
  // REJECT
  // --------------------------------------------------

  const handleReject = () => {
    const reason = rejectionReason.trim();

    if (!reason) {
      return;
    }

    if (!selectedRequest) return;

    const updatedRequests = requests.map((request) =>
      request.id === selectedRequest.id
        ? {
            ...request,
            status: "rejected",
            rejectionReason: reason,
            reviewedAt: new Date().toISOString(),
          }
        : request
    );

    saveRequests(updatedRequests);

    setSelectedRequest({
      ...selectedRequest,
      status: "rejected",
      rejectionReason: reason,
      reviewedAt: new Date().toISOString(),
    });

    setShowRejectModal(false);
    setShowReviewModal(false);

    showNotification(
      `${getFullName(selectedRequest)}'s registration has been rejected.`,
      "error"
    );
  };

  // --------------------------------------------------
  // HELPERS
  // --------------------------------------------------

  const getFullName = (request) => {
    return [request.firstName, request.middleInitial, request.lastName]
      .filter(Boolean)
      .join(" ");
  };

  const getIdentifier = (request) => {
    if (request.role === "student") {
      return request.studentId || "—";
    }

    return request.employeeId || "—";
  };

  const getRoleLabel = (role) => {
    if (role === "student") return "Student";
    if (role === "registrar") return "Registrar Adviser";

    return role || "Unknown";
  };

  const getStatusClasses = (status) => {
    switch (status) {
      case "pending":
        return "bg-amber-50 text-amber-700 border-amber-200";

      case "approved":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";

      case "rejected":
        return "bg-red-50 text-red-700 border-red-200";

      default:
        return "bg-slate-50 text-slate-600 border-slate-200";
    }
  };

  const getRoleClasses = (role) => {
    if (role === "student") {
      return "bg-blue-50 text-blue-700";
    }

    return "bg-emerald-50 text-emerald-700";
  };

  const formatDate = (date) => {
    if (!date) return "—";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "—";
    }

    return parsedDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDateTime = (date) => {
    if (!date) return "—";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "—";
    }

    return parsedDate.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getFileName = (file) => {
    if (!file) return null;

    if (typeof file === "string") {
      return file;
    }

    return file.name || "Uploaded Document";
  };

  const getDocumentData = (request, documentKey) => {
    const document = request.documents?.[documentKey];

    if (!document) {
      return null;
    }

    if (typeof document === "string") {
      return {
        name: document,
        url: document,
      };
    }

    return {
      name: document.name || "Uploaded Document",
      url: document.url || null,
      type: document.type || "",
    };
  };

  // --------------------------------------------------
  // DOCUMENT VIEW
  // --------------------------------------------------

  const handleViewDocument = (document) => {
    if (!document) return;

    if (document.url) {
      window.open(document.url, "_blank", "noopener,noreferrer");
      return;
    }

    showNotification(
      "This document does not have a preview URL yet. File storage will be connected when the backend is implemented.",
      "error"
    );
  };

  // --------------------------------------------------
  // EMPTY STATE
  // --------------------------------------------------

  const renderEmptyState = () => (
    <div className="py-20 text-center">
      <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-slate-100 flex items-center justify-center">
        <svg
          className="w-7 h-7 text-slate-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2z"
          />
          <path strokeLinecap="round" strokeLinejoin="round" d="M14 3v5h5" />
        </svg>
      </div>

      <h3 className="text-sm font-bold text-slate-800">
        No registration requests found
      </h3>

      <p className="text-xs text-slate-400 mt-2 max-w-sm mx-auto">
        New Student and Registrar account creation requests will appear here
        after they submit the registration form.
      </p>
    </div>
  );

  // --------------------------------------------------
  // DOCUMENT ROW
  // --------------------------------------------------

  const renderDocumentRow = (label, document) => {
    return (
      <div className="flex items-center justify-between gap-4 p-4 bg-slate-50 border border-slate-100 rounded-xl">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center flex-shrink-0">
            <svg
              className="w-5 h-5 text-slate-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7 3h7l5 5v13H7a2 2 0 01-2-2V5a2 2 0 012-2z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14 3v5h5"
              />
            </svg>
          </div>

          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-700">{label}</p>

            <p className="text-[10px] text-slate-400 mt-0.5 truncate">
              {document?.name || "No document submitted"}
            </p>
          </div>
        </div>

        {document && (
          <button
            type="button"
            onClick={() => handleViewDocument(document)}
            className="flex-shrink-0 px-3 py-2 rounded-lg bg-white border border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-600 hover:bg-slate-100 transition"
          >
            View
          </button>
        )}
      </div>
    );
  };

  // --------------------------------------------------
  // REVIEW MODAL
  // --------------------------------------------------

  const renderReviewModal = () => {
    if (!showReviewModal || !selectedRequest) {
      return null;
    }

    const isStudent = selectedRequest.role === "student";
    const isPending = selectedRequest.status === "pending";

    const studentDocuments = {
      cor: getDocumentData(selectedRequest, "cor"),
      studentIdDocument: getDocumentData(selectedRequest, "studentIdDocument"),
    };

    const registrarDocuments = {
      employeeIdDocument: getDocumentData(
        selectedRequest,
        "employeeIdDocument"
      ),
      appointmentLetter: getDocumentData(selectedRequest, "appointmentLetter"),
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
          onClick={() => setShowReviewModal(false)}
        />

        <div className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden bg-white rounded-2xl shadow-2xl">
          {/* MODAL HEADER */}
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider ${getRoleClasses(
                    selectedRequest.role
                  )}`}
                >
                  {getRoleLabel(selectedRequest.role)}
                </span>

                <span
                  className={`px-2.5 py-1 rounded-md border text-[9px] font-bold uppercase tracking-wider ${getStatusClasses(
                    selectedRequest.status
                  )}`}
                >
                  {selectedRequest.status}
                </span>
              </div>

              <h3 className="text-lg font-black text-slate-900">
                Review Account Request
              </h3>
            </div>

            <button
              type="button"
              onClick={() => setShowReviewModal(false)}
              className="w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* MODAL BODY */}
          <div className="overflow-y-auto max-h-[calc(90vh-150px)] p-6 space-y-6">
            {/* PERSONAL INFORMATION */}
            <section>
              <div className="mb-4">
                <h4 className="text-sm font-bold text-slate-800">
                  Personal Information
                </h4>

                <p className="text-[11px] text-slate-400 mt-1">
                  Information submitted during account registration.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoItem
                  label="Full Name"
                  value={getFullName(selectedRequest)}
                />

                <InfoItem label="Email Address" value={selectedRequest.email} />

                <InfoItem label="Mobile Number" value={selectedRequest.phone} />

                <InfoItem
                  label="Submitted"
                  value={formatDateTime(selectedRequest.createdAt)}
                />
              </div>
            </section>

            {/* STUDENT INFORMATION */}
            {isStudent && (
              <section className="border-t border-slate-100 pt-6">
                <div className="mb-4">
                  <h4 className="text-sm font-bold text-slate-800">
                    Student Information
                  </h4>

                  <p className="text-[11px] text-slate-400 mt-1">
                    Official university information provided by the student.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoItem
                    label="Student ID"
                    value={selectedRequest.studentId}
                  />

                  <InfoItem
                    label="Year Level"
                    value={selectedRequest.yearLevel}
                  />

                  <InfoItem label="Program" value={selectedRequest.program} />

                  <InfoItem
                    label="College / Department"
                    value={selectedRequest.department}
                  />
                </div>
              </section>
            )}

            {/* REGISTRAR INFORMATION */}
            {!isStudent && (
              <section className="border-t border-slate-100 pt-6">
                <div className="mb-4">
                  <h4 className="text-sm font-bold text-slate-800">
                    Registrar Information
                  </h4>

                  <p className="text-[11px] text-slate-400 mt-1">
                    Official university employment information provided by the
                    Registrar Adviser.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoItem
                    label="Employee ID"
                    value={selectedRequest.employeeId}
                  />

                  <InfoItem
                    label="Position / Designation"
                    value={selectedRequest.position}
                  />

                  <InfoItem
                    label="College / Department"
                    value={selectedRequest.department}
                  />
                </div>
              </section>
            )}

            {/* DOCUMENTS */}
            <section className="border-t border-slate-100 pt-6">
              <div className="mb-4">
                <h4 className="text-sm font-bold text-slate-800">
                  Verification Documents
                </h4>

                <p className="text-[11px] text-slate-400 mt-1">
                  Review the submitted documents before approving the account.
                </p>
              </div>

              <div className="space-y-3">
                {isStudent ? (
                  <>
                    {renderDocumentRow(
                      "Certificate of Registration (COR)",
                      studentDocuments.cor
                    )}

                    {renderDocumentRow(
                      "Student ID",
                      studentDocuments.studentIdDocument
                    )}
                  </>
                ) : (
                  <>
                    {renderDocumentRow(
                      "University / Employee ID",
                      registrarDocuments.employeeIdDocument
                    )}

                    {renderDocumentRow(
                      "Proof of Appointment / Authorization Letter",
                      registrarDocuments.appointmentLetter
                    )}
                  </>
                )}
              </div>
            </section>

            {/* REJECTION REASON */}
            {selectedRequest.status === "rejected" &&
              selectedRequest.rejectionReason && (
                <section className="border border-red-100 bg-red-50 rounded-xl p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-red-600">
                    Rejection Reason
                  </p>

                  <p className="text-xs text-red-800 leading-relaxed mt-2">
                    {selectedRequest.rejectionReason}
                  </p>
                </section>
              )}

            {/* REVIEWED INFO */}
            {selectedRequest.reviewedAt && (
              <div className="text-[10px] text-slate-400">
                Reviewed on {formatDateTime(selectedRequest.reviewedAt)}
              </div>
            )}
          </div>

          {/* MODAL FOOTER */}
          {isPending && (
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row gap-3 justify-end">
              <button
                type="button"
                onClick={handleOpenReject}
                className="px-5 py-2.5 rounded-xl border border-red-200 bg-white text-red-600 text-xs font-bold hover:bg-red-50 transition"
              >
                Reject Request
              </button>

              <button
                type="button"
                onClick={handleApprove}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition shadow-sm"
              >
                Approve Request
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // --------------------------------------------------
  // REJECTION MODAL
  // --------------------------------------------------

  const renderRejectModal = () => {
    if (!showRejectModal || !selectedRequest) {
      return null;
    }

    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" />

        <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
              <svg
                className="w-5 h-5 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v4m0 4h.01M10.29 3.86l-7.2 12.48A2 2 0 004.82 19h14.36a2 2 0 001.73-2.66l-7.2-12.48a2 2 0 00-3.42 0z"
                />
              </svg>
            </div>

            <div>
              <h3 className="text-base font-black text-slate-900">
                Reject Registration
              </h3>

              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Please provide a reason for rejecting{" "}
                <span className="font-bold text-slate-700">
                  {getFullName(selectedRequest)}
                </span>
                's registration.
              </p>
            </div>
          </div>

          <div className="mt-5">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              Rejection Reason
            </label>

            <textarea
              value={rejectionReason}
              onChange={(event) => setRejectionReason(event.target.value)}
              rows={5}
              placeholder="Example: Please upload a clearer copy of your Student ID."
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300 focus:bg-white transition"
            />

            <p className="text-[10px] text-slate-400 mt-2">
              This reason should clearly explain what the applicant needs to
              correct before resubmitting.
            </p>
          </div>

          <div className="flex gap-3 justify-end mt-6">
            <button
              type="button"
              onClick={() => setShowRejectModal(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={!rejectionReason.trim()}
              onClick={handleReject}
              className="px-4 py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Confirm Rejection
            </button>
          </div>
        </div>
      </div>
    );
  };

  // --------------------------------------------------
  // MAIN UI
  // --------------------------------------------------

  return (
    <div className="min-h-screen bg-slate-50">
      {/* NOTIFICATION */}
      {notification && (
        <div
          className={`fixed top-5 right-5 z-[100] max-w-sm px-4 py-3 rounded-xl shadow-xl border ${
            notification.type === "error"
              ? "bg-red-50 border-red-200 text-red-700"
              : "bg-emerald-50 border-emerald-200 text-emerald-700"
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              {notification.type === "error" ? "⚠️" : "✓"}
            </div>

            <p className="text-xs font-semibold leading-relaxed">
              {notification.message}
            </p>
          </div>
        </div>
      )}

      {/* PAGE HEADER */}
      <div className="bg-white border-b border-slate-200">
        <div className="px-6 md:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                <span>Administration</span>
                <span>/</span>
                <span className="text-slate-600">Account Requests</span>
              </div>

              <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                Review Create Requests
              </h1>

              <p className="text-xs md:text-sm text-slate-500 mt-2 max-w-2xl">
                Review and verify Student and Registrar Adviser account
                registrations before activating their SIMS accounts.
              </p>
            </div>

            <button
              type="button"
              onClick={loadRequests}
              className="self-start lg:self-center flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 4v5h5M20 20v-5h-5M5.05 9A7 7 0 0117.95 6.05L20 9M19 15a7 7 0 01-12.95 2.95L4 15"
                />
              </svg>
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <main className="p-6 md:p-8">
        {/* STATISTICS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            label="Total Requests"
            value={statistics.total}
            icon="▤"
            iconClass="bg-slate-100 text-slate-600"
          />

          <StatCard
            label="Students"
            value={statistics.students}
            icon="🎓"
            iconClass="bg-blue-50 text-blue-600"
          />

          <StatCard
            label="Registrar"
            value={statistics.registrars}
            icon="🏛️"
            iconClass="bg-emerald-50 text-emerald-600"
          />

          <StatCard
            label="Pending Review"
            value={statistics.pending}
            icon="⏳"
            iconClass="bg-amber-50 text-amber-600"
          />
        </div>

        {/* TABLE CARD */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          {/* FILTER BAR */}
          <div className="p-5 border-b border-slate-100">
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
              {/* FILTERS */}
              <div className="flex flex-wrap gap-2">
                <FilterButton
                  label="All"
                  active={activeFilter === "all"}
                  onClick={() => setActiveFilter("all")}
                />

                <FilterButton
                  label="Students"
                  active={activeFilter === "students"}
                  onClick={() => setActiveFilter("students")}
                />

                <FilterButton
                  label="Registrar"
                  active={activeFilter === "registrar"}
                  onClick={() => setActiveFilter("registrar")}
                />

                <FilterButton
                  label="Pending"
                  active={activeFilter === "pending"}
                  onClick={() => setActiveFilter("pending")}
                />

                <FilterButton
                  label="Approved"
                  active={activeFilter === "approved"}
                  onClick={() => setActiveFilter("approved")}
                />

                <FilterButton
                  label="Rejected"
                  active={activeFilter === "rejected"}
                  onClick={() => setActiveFilter("rejected")}
                />
              </div>

              {/* SEARCH */}
              <div className="relative w-full xl:w-72">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-4.35-4.35m2.1-5.4a7.5 7.5 0 11-15 0 7.5 7.5 0 0115 0z"
                  />
                </svg>

                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search name, email, or ID..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 focus:bg-white transition"
                />
              </div>
            </div>
          </div>

          {/* TABLE */}
          {filteredRequests.length === 0 ? (
            renderEmptyState()
          ) : (
            <>
              {/* DESKTOP TABLE */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="text-left px-6 py-3.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Requester
                      </th>

                      <th className="text-left px-4 py-3.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Role
                      </th>

                      <th className="text-left px-4 py-3.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        ID
                      </th>

                      <th className="text-left px-4 py-3.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Submitted
                      </th>

                      <th className="text-left px-4 py-3.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Status
                      </th>

                      <th className="text-right px-6 py-3.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredRequests.map((request) => (
                      <tr
                        key={request.id}
                        className="hover:bg-slate-50/70 transition"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-black ${getRoleClasses(
                                request.role
                              )}`}
                            >
                              {request.firstName?.charAt(0)?.toUpperCase() ||
                                "?"}
                            </div>

                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-800 truncate">
                                {getFullName(request)}
                              </p>

                              <p className="text-[10px] text-slate-400 truncate mt-0.5">
                                {request.email || "No email"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider ${getRoleClasses(
                              request.role
                            )}`}
                          >
                            {getRoleLabel(request.role)}
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          <span className="text-xs font-semibold text-slate-600">
                            {getIdentifier(request)}
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          <span className="text-xs text-slate-500">
                            {formatDate(request.createdAt)}
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex px-2.5 py-1 rounded-md border text-[9px] font-bold uppercase tracking-wider ${getStatusClasses(
                              request.status
                            )}`}
                          >
                            {request.status || "pending"}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleReview(request)}
                            className="px-3.5 py-2 rounded-lg bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider hover:bg-slate-800 transition"
                          >
                            Review
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* MOBILE CARDS */}
              <div className="md:hidden divide-y divide-slate-100">
                {filteredRequests.map((request) => (
                  <div key={request.id} className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0 ${getRoleClasses(
                            request.role
                          )}`}
                        >
                          {request.firstName?.charAt(0)?.toUpperCase() || "?"}
                        </div>

                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">
                            {getFullName(request)}
                          </p>

                          <p className="text-[10px] text-slate-400 truncate mt-0.5">
                            {request.email || "No email"}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`flex-shrink-0 px-2 py-1 rounded-md border text-[8px] font-bold uppercase tracking-wider ${getStatusClasses(
                          request.status
                        )}`}
                      >
                        {request.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                          Role
                        </p>

                        <p className="text-xs text-slate-600 font-semibold mt-1">
                          {getRoleLabel(request.role)}
                        </p>
                      </div>

                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                          ID
                        </p>

                        <p className="text-xs text-slate-600 font-semibold mt-1">
                          {getIdentifier(request)}
                        </p>
                      </div>

                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                          Submitted
                        </p>

                        <p className="text-xs text-slate-600 font-semibold mt-1">
                          {formatDate(request.createdAt)}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleReview(request)}
                      className="w-full mt-4 py-2.5 rounded-xl bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider hover:bg-slate-800 transition"
                    >
                      Review Request
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      {renderReviewModal()}
      {renderRejectModal()}
    </div>
  );
};

// --------------------------------------------------
// INFO ITEM
// --------------------------------------------------

const InfoItem = ({ label, value }) => {
  return (
    <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p className="text-xs font-semibold text-slate-700 mt-1.5 break-words">
        {value || "—"}
      </p>
    </div>
  );
};

// --------------------------------------------------
// STAT CARD
// --------------------------------------------------

const StatCard = ({ label, value, icon, iconClass }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {label}
          </p>

          <p className="text-2xl font-black text-slate-900 mt-1">{value}</p>
        </div>

        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm ${iconClass}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
};

// --------------------------------------------------
// FILTER BUTTON
// --------------------------------------------------

const FilterButton = ({ label, active, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3.5 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition ${
        active
          ? "bg-slate-900 text-white shadow-sm"
          : "bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
      }`}
    >
      {label}
    </button>
  );
};

export default ReviewCreateRequests;
