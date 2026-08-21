import React, { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "../../supabaseClient";

const ReviewCreateRequests = () => {
  const { darkMode } = useOutletContext();

  const [requests, setRequests] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedRequest, setSelectedRequest] = useState(null);

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  const [rejectionReason, setRejectionReason] = useState("");

  const [notification, setNotification] = useState(null);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // =========================================================
  // NORMALIZE SUPABASE REQUEST
  // =========================================================
  // Supabase uses snake_case.
  // React UI uses camelCase.
  //
  // Every request entering React state passes through this
  // function so the rest of the component always works with
  // one consistent data structure.
  // =========================================================

  const formatRequest = (request) => {
    if (!request) return null;

    return {
      id: request.id,

      userId: request.user_id ?? request.userId ?? null,

      role: request.role ?? "",

      status: (request.status ?? "pending").toLowerCase(),

      firstName: request.first_name ?? request.firstName ?? "",
      middleInitial: request.middle_initial ?? request.middleInitial ?? "",
      lastName: request.last_name ?? request.lastName ?? "",

      email: request.email ?? "",
      phone: request.phone ?? "",

      studentId: request.student_id ?? request.studentId ?? "",
      employeeId: request.employee_id ?? request.employeeId ?? "",

      department: request.department ?? "",
      program: request.program ?? "",
      yearLevel: request.year_level ?? request.yearLevel ?? "",
      position: request.position ?? "",

      corUrl: request.cor_url ?? request.corUrl ?? null,

      studentIdDocumentUrl:
        request.student_id_document_url ?? request.studentIdDocumentUrl ?? null,

      employeeIdDocumentUrl:
        request.employee_id_document_url ??
        request.employeeIdDocumentUrl ??
        null,

      appointmentLetterUrl:
        request.appointment_letter_url ?? request.appointmentLetterUrl ?? null,

      rejectionReason:
        request.rejection_reason ?? request.rejectionReason ?? null,

      reviewedBy: request.reviewed_by ?? request.reviewedBy ?? null,

      reviewedAt: request.reviewed_at ?? request.reviewedAt ?? null,

      createdAt: request.created_at ?? request.createdAt ?? null,

      updatedAt: request.updated_at ?? request.updatedAt ?? null,
    };
  };

  // =========================================================
  // LOAD REQUESTS
  // =========================================================

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);

    try {
      console.log("🔍 Loading create_requests...");

      const { data, error } = await supabase
        .from("create_requests")
        .select("*")
        .order("created_at", { ascending: false });

      console.log("📦 SUPABASE RAW DATA:", data);
      console.log("❌ SUPABASE ERROR:", error);

      if (error) {
        showNotification(
          `Failed to load registration requests: ${error.message}`,
          "error"
        );

        setRequests([]);
        return;
      }

      console.log("📊 Number of requests:", data?.length || 0);

      // =====================================================
      // IMPORTANT:
      // Normalize every Supabase row before storing it.
      //
      // BEFORE:
      // request.first_name
      // request.last_name
      // request.student_id
      // request.created_at
      //
      // AFTER:
      // request.firstName
      // request.lastName
      // request.studentId
      // request.createdAt
      // =====================================================

      const formattedRequests = (data || []).map(formatRequest).filter(Boolean);

      console.log("✅ FORMATTED REQUESTS:", formattedRequests);

      setRequests(formattedRequests);
    } catch (error) {
      console.error("💥 LOAD ERROR:", error);

      showNotification(
        "Something went wrong while loading registration requests.",
        "error"
      );

      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // NOTIFICATION
  // =========================================================

  const showNotification = (message, type = "success") => {
    setNotification({
      message,
      type,
    });

    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // =========================================================
  // FILTER REQUESTS
  // =========================================================

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

      if (!matchesFilter) {
        return false;
      }

      const searchValue = searchTerm.toLowerCase().trim();

      if (!searchValue) {
        return true;
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
        role === "student" ? request.studentId || "" : request.employeeId || "";

      const email = request.email?.toLowerCase() || "";

      return (
        fullName.includes(searchValue) ||
        email.includes(searchValue) ||
        identifier.toLowerCase().includes(searchValue)
      );
    });
  }, [requests, activeFilter, searchTerm]);

  // =========================================================
  // STATISTICS
  // =========================================================

  const statistics = useMemo(() => {
    const studentRequests = requests.filter(
      (request) => request.role?.toLowerCase() === "student"
    );

    const registrarRequests = requests.filter(
      (request) => request.role?.toLowerCase() === "registrar"
    );

    const pendingRequests = requests.filter(
      (request) => request.status?.toLowerCase() === "pending"
    );

    return {
      total: requests.length,
      students: studentRequests.length,
      registrars: registrarRequests.length,
      pending: pendingRequests.length,
    };
  }, [requests]);

  // =========================================================
  // REVIEW REQUEST
  // =========================================================

  const handleReview = (request) => {
    setSelectedRequest(request);
    setShowReviewModal(true);
  };

  // =========================================================
  // APPROVE REQUEST
  // =========================================================

  const handleApprove = async () => {
    if (!selectedRequest || actionLoading) return;

    try {
      setActionLoading(true);

      console.log("🚀 Approving registration request:", selectedRequest.id);

      // =====================================================
      // CALL APPROVE REGISTRATION EDGE FUNCTION
      // =====================================================

      const { data, error } = await supabase.functions.invoke(
        "approve-registration",
        {
          body: {
            requestId: selectedRequest.id,
          },
        }
      );

      console.log("📦 APPROVE FUNCTION RESPONSE:", data);
      console.log("❌ APPROVE FUNCTION ERROR:", error);

      if (error) {
        console.error("Approval Edge Function error:", error);

        showNotification(
          `Failed to approve request: ${error.message}`,
          "error"
        );

        return;
      }

      // =====================================================
      // HANDLE EDGE FUNCTION ERROR RESPONSE
      // =====================================================

      if (!data?.success) {
        showNotification(
          data?.error || "Failed to approve registration request.",
          "error"
        );

        return;
      }

      // =====================================================
      // FORMAT UPDATED REQUEST
      // =====================================================

      const formattedRequest = data.request
        ? formatRequest(data.request)
        : {
            ...selectedRequest,
            status: "approved",
            rejectionReason: null,
            reviewedAt: new Date().toISOString(),
          };

      // =====================================================
      // SEND APPROVAL EMAIL
      // =====================================================

      const { data: emailData, error: emailError } =
        await supabase.functions.invoke("send-registration-email", {
          body: {
            email: formattedRequest.email,
            name: getFullName(formattedRequest),
            type: "approved",
          },
        });

      if (emailError) {
        console.error("📧 Approval email error:", emailError);

        showNotification(
          `Registration approved, but the approval email could not be sent: ${emailError.message}`,
          "error"
        );
      } else {
        console.log("📧 Approval email sent:", emailData);
      }

      // =====================================================
      // UPDATE LOCAL REQUEST STATE
      // =====================================================

      setRequests((currentRequests) =>
        currentRequests.map((request) =>
          request.id === formattedRequest.id ? formattedRequest : request
        )
      );

      setSelectedRequest(formattedRequest);

      setShowReviewModal(false);

      // =====================================================
      // SUCCESS
      // =====================================================

      showNotification(
        `${getFullName(
          formattedRequest
        )}'s registration has been approved and their account has been activated.`
      );

      console.log("✅ Registration approval completed successfully.");
      console.log("👤 Auth/User ID:", data.userId);
    } catch (error) {
      console.error("💥 Unexpected approval error:", error);

      showNotification(
        "An unexpected error occurred while approving the request.",
        "error"
      );
    } finally {
      setActionLoading(false);
    }
  };

  // =========================================================
  // OPEN REJECT MODAL
  // =========================================================

  const handleOpenReject = () => {
    setRejectionReason("");
    setShowRejectModal(true);
  };

  // =========================================================
  // REJECT REQUEST
  // =========================================================

  const handleReject = async () => {
    const reason = rejectionReason.trim();

    if (!reason || !selectedRequest || actionLoading) {
      return;
    }

    try {
      setActionLoading(true);

      console.log("🚫 Rejecting registration request:", selectedRequest.id);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const reviewedAt = new Date().toISOString();

      const updateData = {
        status: "rejected",
        rejection_reason: reason,
        reviewed_at: reviewedAt,
      };

      if (user?.id) {
        updateData.reviewed_by = user.id;
      }

      // =====================================================
      // UPDATE REQUEST
      // =====================================================

      const { error } = await supabase
        .from("create_requests")
        .update(updateData)
        .eq("id", selectedRequest.id);

      if (error) {
        console.error("❌ Rejection update error:", error);

        showNotification(`Failed to reject request: ${error.message}`, "error");

        return;
      }

      console.log("✅ Registration request rejected in database.");

      // =====================================================
      // CREATE UPDATED LOCAL REQUEST
      // =====================================================

      const formattedRequest = formatRequest({
        ...selectedRequest,
        status: "rejected",
        rejection_reason: reason,
        reviewed_by: user?.id ?? selectedRequest.reviewedBy ?? null,
        reviewed_at: reviewedAt,
        updated_at: reviewedAt,
      });

      console.log("📦 UPDATED REQUEST:", formattedRequest);

      // =====================================================
      // SEND REJECTION EMAIL
      // =====================================================

      const { data: emailData, error: emailError } =
        await supabase.functions.invoke("send-registration-email", {
          body: {
            email: formattedRequest.email,
            name: getFullName(formattedRequest),
            type: "rejected",
            reason: reason,
          },
        });

      if (emailError) {
        console.error("📧 Rejection email error:", emailError);

        showNotification(
          `Request rejected, but the rejection email could not be sent: ${emailError.message}`,
          "error"
        );
      } else {
        console.log("📧 Rejection email sent:", emailData);
      }

      // =====================================================
      // UPDATE LOCAL STATE
      // =====================================================

      setRequests((currentRequests) =>
        currentRequests.map((request) =>
          request.id === formattedRequest.id ? formattedRequest : request
        )
      );

      setSelectedRequest(formattedRequest);

      // =====================================================
      // CLOSE MODALS
      // =====================================================

      setShowRejectModal(false);
      setShowReviewModal(false);

      // =====================================================
      // SUCCESS
      // =====================================================

      showNotification(
        `${getFullName(formattedRequest)}'s registration has been rejected.`,
        "error"
      );

      console.log("✅ Registration rejection completed successfully.");
    } catch (error) {
      console.error("💥 Unexpected rejection error:", error);

      showNotification(
        "An unexpected error occurred while rejecting the request.",
        "error"
      );
    } finally {
      setActionLoading(false);
    }
  };

  // =========================================================
  // HELPERS
  // =========================================================

  const getFullName = (request) => {
    if (!request) return "Unknown User";

    const name = [request.firstName, request.middleInitial, request.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();

    return name || "Unknown User";
  };

  const getIdentifier = (request) => {
    if (!request) return "—";

    if (request.role?.toLowerCase() === "student") {
      return request.studentId || "—";
    }

    return request.employeeId || "—";
  };

  const getRoleLabel = (role) => {
    const normalizedRole = role?.toLowerCase();

    if (normalizedRole === "student") {
      return "Student";
    }

    if (normalizedRole === "registrar") {
      return "Registrar Adviser";
    }

    return role || "Unknown";
  };

  const getStatusClasses = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return darkMode
          ? "bg-amber-950/50 text-amber-300 border-amber-800"
          : "bg-amber-50 text-amber-700 border-amber-200";

      case "approved":
        return darkMode
          ? "bg-emerald-950/50 text-emerald-300 border-emerald-800"
          : "bg-emerald-50 text-emerald-700 border-emerald-200";

      case "rejected":
        return darkMode
          ? "bg-red-950/50 text-red-300 border-red-800"
          : "bg-red-50 text-red-700 border-red-200";

      default:
        return darkMode
          ? "bg-slate-800 text-slate-300 border-slate-700"
          : "bg-slate-50 text-slate-600 border-slate-200";
    }
  };

  const getRoleClasses = (role) => {
    if (role?.toLowerCase() === "student") {
      return darkMode
        ? "bg-blue-950/50 text-blue-300"
        : "bg-blue-50 text-blue-700";
    }

    return darkMode
      ? "bg-emerald-950/50 text-emerald-300"
      : "bg-emerald-50 text-emerald-700";
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

  // =========================================================
  // DOCUMENT HELPERS
  // =========================================================

  const getDocumentData = (request, documentKey) => {
    if (!request) return null;

    const documentMap = {
      cor: {
        name: "Certificate of Registration",
        url: request.corUrl,
      },

      studentIdDocument: {
        name: "Student ID",
        url: request.studentIdDocumentUrl,
      },

      employeeIdDocument: {
        name: "University / Employee ID",
        url: request.employeeIdDocumentUrl,
      },

      appointmentLetter: {
        name: "Proof of Appointment / Authorization Letter",
        url: request.appointmentLetterUrl,
      },
    };

    const document = documentMap[documentKey];

    if (!document?.url) {
      return null;
    }

    return document;
  };

  // =========================================================
  // DOCUMENT VIEW
  // =========================================================

  const handleViewDocument = async (document) => {
    if (!document?.url) {
      showNotification(
        "This document does not have a valid storage path.",
        "error"
      );

      return;
    }

    console.log("📄 DOCUMENT DATA:", document);
    console.log("📁 STORAGE PATH:", document.url);

    try {
      const { data, error } = await supabase.storage
        .from("verification-documents")
        .createSignedUrl(document.url, 300);

      console.log("🔗 SIGNED URL DATA:", data);
      console.log("❌ SIGNED URL ERROR:", error);

      if (error) {
        showNotification(`Unable to open document: ${error.message}`, "error");

        return;
      }

      if (!data?.signedUrl) {
        showNotification("Unable to generate a document preview URL.", "error");

        return;
      }

      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error("💥 Document preview error:", error);

      showNotification(
        "Something went wrong while opening the document.",
        "error"
      );
    }
  };

  // =========================================================
  // DOCUMENT ROW
  // =========================================================

  const renderDocumentRow = (label, document) => {
    return (
      <div
        className={`flex items-center justify-between gap-4 p-4 rounded-xl border ${
          darkMode
            ? "bg-slate-800 border-slate-700"
            : "bg-slate-50 border-slate-100"
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-10 h-10 rounded-lg border flex items-center justify-center flex-shrink-0 ${
              darkMode
                ? "bg-slate-900 border-slate-700"
                : "bg-white border-slate-200"
            }`}
          >
            <svg
              className={`w-5 h-5 ${
                darkMode ? "text-slate-400" : "text-slate-500"
              }`}
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
            <p
              className={`text-xs font-bold ${
                darkMode ? "text-slate-200" : "text-slate-700"
              }`}
            >
              {label}
            </p>

            <p
              className={`text-[10px] mt-0.5 truncate ${
                darkMode ? "text-slate-500" : "text-slate-400"
              }`}
            >
              {document?.name || "No document submitted"}
            </p>
          </div>
        </div>

        {document && (
          <button
            type="button"
            onClick={() => handleViewDocument(document)}
            className={`flex-shrink-0 px-3 py-2 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition ${
              darkMode
                ? "bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-700"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
            }`}
          >
            View
          </button>
        )}
      </div>
    );
  };

  // =========================================================
  // EMPTY STATE
  // =========================================================

  const renderEmptyState = () => (
    <div className="py-20 text-center">
      <div
        className={`w-16 h-16 mx-auto mb-5 rounded-2xl flex items-center justify-center ${
          darkMode ? "bg-slate-800" : "bg-slate-100"
        }`}
      >
        <svg
          className={`w-7 h-7 ${
            darkMode ? "text-slate-500" : "text-slate-400"
          }`}
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

      <h3
        className={`text-sm font-bold ${
          darkMode ? "text-slate-200" : "text-slate-800"
        }`}
      >
        No registration requests found
      </h3>

      <p
        className={`text-xs mt-2 max-w-sm mx-auto ${
          darkMode ? "text-slate-500" : "text-slate-400"
        }`}
      >
        New Student and Registrar account creation requests will appear here
        after they submit the registration form.
      </p>
    </div>
  );

  // =========================================================
  // REVIEW MODAL
  // =========================================================

  const renderReviewModal = () => {
    if (!showReviewModal || !selectedRequest) {
      return null;
    }

    const isStudent = selectedRequest.role?.toLowerCase() === "student";

    const isPending = selectedRequest.status?.toLowerCase() === "pending";

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
          className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
          onClick={() => {
            if (!actionLoading) {
              setShowReviewModal(false);
            }
          }}
        />

        <div
          className={`relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl transition-colors ${
            darkMode ? "bg-slate-900 text-slate-100" : "bg-white text-slate-900"
          }`}
        >
          {/* HEADER */}

          <div
            className={`px-6 py-5 border-b flex items-center justify-between ${
              darkMode ? "border-slate-700" : "border-slate-100"
            }`}
          >
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

              <h3
                className={`text-lg font-black ${
                  darkMode ? "text-white" : "text-slate-900"
                }`}
              >
                Review Account Request
              </h3>
            </div>

            <button
              type="button"
              disabled={actionLoading}
              onClick={() => setShowReviewModal(false)}
              className={`w-9 h-9 rounded-lg flex items-center justify-center transition ${
                darkMode
                  ? "text-slate-400 hover:bg-slate-800 hover:text-white"
                  : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              } disabled:opacity-40`}
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

          {/* BODY */}

          <div
            className={`overflow-y-auto max-h-[calc(90vh-150px)] p-6 space-y-6 ${
              darkMode ? "bg-slate-900" : "bg-white"
            }`}
          >
            {/* PERSONAL INFORMATION */}

            <section>
              <div className="mb-4">
                <h4
                  className={`text-sm font-bold ${
                    darkMode ? "text-slate-200" : "text-slate-800"
                  }`}
                >
                  Personal Information
                </h4>

                <p
                  className={`text-[11px] mt-1 ${
                    darkMode ? "text-slate-500" : "text-slate-400"
                  }`}
                >
                  Information submitted during account registration.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoItem
                  label="Full Name"
                  value={getFullName(selectedRequest)}
                  darkMode={darkMode}
                />

                <InfoItem
                  label="Email Address"
                  value={selectedRequest.email}
                  darkMode={darkMode}
                />

                <InfoItem
                  label="Mobile Number"
                  value={selectedRequest.phone}
                  darkMode={darkMode}
                />

                <InfoItem
                  label="Submitted"
                  value={formatDateTime(selectedRequest.createdAt)}
                  darkMode={darkMode}
                />
              </div>
            </section>

            {/* STUDENT INFORMATION */}

            {isStudent && (
              <section
                className={`border-t pt-6 ${
                  darkMode ? "border-slate-700" : "border-slate-100"
                }`}
              >
                <div className="mb-4">
                  <h4
                    className={`text-sm font-bold ${
                      darkMode ? "text-slate-200" : "text-slate-800"
                    }`}
                  >
                    Student Information
                  </h4>

                  <p
                    className={`text-[11px] mt-1 ${
                      darkMode ? "text-slate-500" : "text-slate-400"
                    }`}
                  >
                    Official university information provided by the student.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoItem
                    label="Student ID"
                    value={selectedRequest.studentId}
                    darkMode={darkMode}
                  />

                  <InfoItem
                    label="Year Level"
                    value={selectedRequest.yearLevel}
                    darkMode={darkMode}
                  />

                  <InfoItem
                    label="Program"
                    value={selectedRequest.program}
                    darkMode={darkMode}
                  />

                  <InfoItem
                    label="College / Department"
                    value={selectedRequest.department}
                    darkMode={darkMode}
                  />
                </div>
              </section>
            )}

            {/* REGISTRAR INFORMATION */}

            {!isStudent && (
              <section
                className={`border-t pt-6 ${
                  darkMode ? "border-slate-700" : "border-slate-100"
                }`}
              >
                <div className="mb-4">
                  <h4
                    className={`text-sm font-bold ${
                      darkMode ? "text-slate-200" : "text-slate-800"
                    }`}
                  >
                    Registrar Information
                  </h4>

                  <p
                    className={`text-[11px] mt-1 ${
                      darkMode ? "text-slate-500" : "text-slate-400"
                    }`}
                  >
                    Official university employment information provided by the
                    Registrar Adviser.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoItem
                    label="Employee ID"
                    value={selectedRequest.employeeId}
                    darkMode={darkMode}
                  />

                  <InfoItem
                    label="Position / Designation"
                    value={selectedRequest.position}
                    darkMode={darkMode}
                  />

                  <InfoItem
                    label="College / Department"
                    value={selectedRequest.department}
                    darkMode={darkMode}
                  />
                </div>
              </section>
            )}

            {/* DOCUMENTS */}

            <section
              className={`border-t pt-6 ${
                darkMode ? "border-slate-700" : "border-slate-100"
              }`}
            >
              <div className="mb-4">
                <h4
                  className={`text-sm font-bold ${
                    darkMode ? "text-slate-200" : "text-slate-800"
                  }`}
                >
                  Verification Documents
                </h4>

                <p
                  className={`text-[11px] mt-1 ${
                    darkMode ? "text-slate-500" : "text-slate-400"
                  }`}
                >
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

            {selectedRequest.status?.toLowerCase() === "rejected" &&
              selectedRequest.rejectionReason && (
                <section
                  className={`border rounded-xl p-4 ${
                    darkMode
                      ? "border-red-900 bg-red-950/40"
                      : "border-red-100 bg-red-50"
                  }`}
                >
                  <p
                    className={`text-[10px] font-bold uppercase tracking-wider ${
                      darkMode ? "text-red-400" : "text-red-600"
                    }`}
                  >
                    Rejection Reason
                  </p>

                  <p
                    className={`text-xs leading-relaxed mt-2 ${
                      darkMode ? "text-red-300" : "text-red-800"
                    }`}
                  >
                    {selectedRequest.rejectionReason}
                  </p>
                </section>
              )}

            {/* REVIEWED INFO */}

            {selectedRequest.reviewedAt && (
              <div
                className={`text-[10px] ${
                  darkMode ? "text-slate-500" : "text-slate-400"
                }`}
              >
                Reviewed on {formatDateTime(selectedRequest.reviewedAt)}
              </div>
            )}
          </div>

          {/* FOOTER */}

          {isPending && (
            <div
              className={`px-6 py-4 border-t flex flex-col sm:flex-row gap-3 justify-end ${
                darkMode
                  ? "border-slate-700 bg-slate-800"
                  : "border-slate-100 bg-slate-50"
              }`}
            >
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleOpenReject}
                className={`px-5 py-2.5 rounded-xl border text-xs font-bold transition ${
                  darkMode
                    ? "border-red-900 bg-slate-900 text-red-400 hover:bg-red-950"
                    : "border-red-200 bg-white text-red-600 hover:bg-red-50"
                } disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                {actionLoading ? "Processing..." : "Reject Request"}
              </button>

              <button
                type="button"
                disabled={actionLoading}
                onClick={handleApprove}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
              >
                {actionLoading ? "Approving..." : "Approve Request"}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // =========================================================
  // REJECTION MODAL
  // =========================================================

  const renderRejectModal = () => {
    if (!showRejectModal || !selectedRequest) {
      return null;
    }

    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
          onClick={() => {
            if (!actionLoading) {
              setShowRejectModal(false);
            }
          }}
        />

        <div
          className={`relative w-full max-w-md rounded-2xl shadow-2xl p-6 transition-colors ${
            darkMode ? "bg-slate-900 text-slate-100" : "bg-white text-slate-900"
          }`}
        >
          <div className="flex items-start gap-4">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                darkMode ? "bg-red-950/60" : "bg-red-50"
              }`}
            >
              <svg
                className="w-5 h-5 text-red-500"
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
              <h3
                className={`text-base font-black ${
                  darkMode ? "text-white" : "text-slate-900"
                }`}
              >
                Reject Registration
              </h3>

              <p
                className={`text-xs mt-1 leading-relaxed ${
                  darkMode ? "text-slate-400" : "text-slate-500"
                }`}
              >
                Please provide a reason for rejecting{" "}
                <span
                  className={`font-bold ${
                    darkMode ? "text-slate-200" : "text-slate-700"
                  }`}
                >
                  {getFullName(selectedRequest)}
                </span>
                's registration.
              </p>
            </div>
          </div>

          <div className="mt-5">
            <label
              className={`block text-[10px] font-bold uppercase tracking-wider mb-2 ${
                darkMode ? "text-slate-400" : "text-slate-500"
              }`}
            >
              Rejection Reason
            </label>

            <textarea
              value={rejectionReason}
              onChange={(event) => setRejectionReason(event.target.value)}
              rows={5}
              disabled={actionLoading}
              placeholder="Example: Please upload a clearer copy of your Student ID."
              className={`w-full resize-none rounded-xl border px-4 py-3 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300 transition ${
                darkMode
                  ? "bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-500"
                  : "bg-slate-50 border-slate-200 text-slate-700"
              }`}
            />

            <p
              className={`text-[10px] mt-2 ${
                darkMode ? "text-slate-500" : "text-slate-400"
              }`}
            >
              This reason should clearly explain what the applicant needs to
              correct before resubmitting.
            </p>
          </div>

          <div className="flex gap-3 justify-end mt-6">
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => setShowRejectModal(false)}
              className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition ${
                darkMode
                  ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              } disabled:opacity-40`}
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={!rejectionReason.trim() || actionLoading}
              onClick={handleReject}
              className="px-4 py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              {actionLoading ? "Rejecting..." : "Confirm Rejection"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // =========================================================
  // MAIN UI
  // =========================================================

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        darkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"
      }`}
    >
      {/* NOTIFICATION */}

      {notification && (
        <div
          className={`fixed top-5 right-5 z-[100] max-w-sm px-4 py-3 rounded-xl shadow-xl border ${
            notification.type === "error"
              ? darkMode
                ? "bg-red-950 border-red-900 text-red-300"
                : "bg-red-50 border-red-200 text-red-700"
              : darkMode
              ? "bg-emerald-950 border-emerald-900 text-emerald-300"
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

      <div
        className={`border-b transition-colors duration-300 ${
          darkMode
            ? "bg-slate-900 border-slate-700"
            : "bg-white border-slate-200"
        }`}
      >
        <div className="px-6 md:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div>
              <div
                className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest mb-2 ${
                  darkMode ? "text-slate-500" : "text-slate-400"
                }`}
              >
                <span>Administration</span>
                <span>/</span>

                <span
                  className={darkMode ? "text-slate-300" : "text-slate-600"}
                >
                  Account Requests
                </span>
              </div>

              <h1
                className={`text-2xl md:text-3xl font-black tracking-tight ${
                  darkMode ? "text-white" : "text-slate-900"
                }`}
              >
                Review Create Requests
              </h1>

              <p
                className={`text-xs md:text-sm mt-2 max-w-2xl ${
                  darkMode ? "text-slate-400" : "text-slate-500"
                }`}
              >
                Review and verify Student and Registrar Adviser account
                registrations before activating their SIMS accounts.
              </p>
            </div>

            <button
              type="button"
              onClick={loadRequests}
              disabled={loading}
              className={`self-start lg:self-center flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition ${
                darkMode
                  ? "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              } disabled:opacity-50`}
            >
              <svg
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
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

              {loading ? "Loading..." : "Refresh"}
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
            iconClass={
              darkMode
                ? "bg-slate-800 text-slate-300"
                : "bg-slate-100 text-slate-600"
            }
            darkMode={darkMode}
          />

          <StatCard
            label="Students"
            value={statistics.students}
            icon="🎓"
            iconClass={
              darkMode
                ? "bg-blue-950/50 text-blue-300"
                : "bg-blue-50 text-blue-600"
            }
            darkMode={darkMode}
          />

          <StatCard
            label="Registrar"
            value={statistics.registrars}
            icon="🏛️"
            iconClass={
              darkMode
                ? "bg-emerald-950/50 text-emerald-300"
                : "bg-emerald-50 text-emerald-600"
            }
            darkMode={darkMode}
          />

          <StatCard
            label="Pending Review"
            value={statistics.pending}
            icon="⏳"
            iconClass={
              darkMode
                ? "bg-amber-950/50 text-amber-300"
                : "bg-amber-50 text-amber-600"
            }
            darkMode={darkMode}
          />
        </div>

        {/* TABLE CARD */}

        <div
          className={`rounded-2xl shadow-sm overflow-hidden border transition-colors ${
            darkMode
              ? "bg-slate-900 border-slate-700"
              : "bg-white border-slate-200"
          }`}
        >
          {/* FILTER BAR */}

          <div
            className={`p-5 border-b ${
              darkMode ? "border-slate-700" : "border-slate-100"
            }`}
          >
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
              <div className="flex flex-wrap gap-2">
                <FilterButton
                  label="All"
                  active={activeFilter === "all"}
                  onClick={() => setActiveFilter("all")}
                  darkMode={darkMode}
                />

                <FilterButton
                  label="Students"
                  active={activeFilter === "students"}
                  onClick={() => setActiveFilter("students")}
                  darkMode={darkMode}
                />

                <FilterButton
                  label="Registrar"
                  active={activeFilter === "registrar"}
                  onClick={() => setActiveFilter("registrar")}
                  darkMode={darkMode}
                />

                <FilterButton
                  label="Pending"
                  active={activeFilter === "pending"}
                  onClick={() => setActiveFilter("pending")}
                  darkMode={darkMode}
                />

                <FilterButton
                  label="Approved"
                  active={activeFilter === "approved"}
                  onClick={() => setActiveFilter("approved")}
                  darkMode={darkMode}
                />

                <FilterButton
                  label="Rejected"
                  active={activeFilter === "rejected"}
                  onClick={() => setActiveFilter("rejected")}
                  darkMode={darkMode}
                />
              </div>

              <div className="relative w-full xl:w-72">
                <svg
                  className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                    darkMode ? "text-slate-500" : "text-slate-400"
                  }`}
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
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs transition ${
                    darkMode
                      ? "bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-500"
                      : "bg-slate-50 border-slate-200 text-slate-700 placeholder-slate-400"
                  } focus:outline-none focus:ring-2 ${
                    darkMode ? "focus:ring-slate-600" : "focus:ring-slate-200"
                  }`}
                />
              </div>
            </div>
          </div>

          {/* LOADING */}

          {loading ? (
            <div className="py-20 text-center">
              <div
                className={`w-10 h-10 mx-auto rounded-full border-4 animate-spin ${
                  darkMode
                    ? "border-slate-700 border-t-slate-300"
                    : "border-slate-200 border-t-slate-700"
                }`}
              />

              <p
                className={`text-xs font-semibold mt-4 ${
                  darkMode ? "text-slate-400" : "text-slate-500"
                }`}
              >
                Loading registration requests...
              </p>
            </div>
          ) : filteredRequests.length === 0 ? (
            renderEmptyState()
          ) : (
            <>
              {/* DESKTOP TABLE */}

              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr
                      className={`border-b ${
                        darkMode
                          ? "bg-slate-800 border-slate-700"
                          : "bg-slate-50 border-slate-100"
                      }`}
                    >
                      <th
                        className={`text-left px-6 py-3.5 text-[10px] font-bold uppercase tracking-wider ${
                          darkMode ? "text-slate-500" : "text-slate-400"
                        }`}
                      >
                        Requester
                      </th>

                      <th
                        className={`text-left px-4 py-3.5 text-[10px] font-bold uppercase tracking-wider ${
                          darkMode ? "text-slate-500" : "text-slate-400"
                        }`}
                      >
                        Role
                      </th>

                      <th
                        className={`text-left px-4 py-3.5 text-[10px] font-bold uppercase tracking-wider ${
                          darkMode ? "text-slate-500" : "text-slate-400"
                        }`}
                      >
                        ID
                      </th>

                      <th
                        className={`text-left px-4 py-3.5 text-[10px] font-bold uppercase tracking-wider ${
                          darkMode ? "text-slate-500" : "text-slate-400"
                        }`}
                      >
                        Submitted
                      </th>

                      <th
                        className={`text-left px-4 py-3.5 text-[10px] font-bold uppercase tracking-wider ${
                          darkMode ? "text-slate-500" : "text-slate-400"
                        }`}
                      >
                        Status
                      </th>

                      <th
                        className={`text-right px-6 py-3.5 text-[10px] font-bold uppercase tracking-wider ${
                          darkMode ? "text-slate-500" : "text-slate-400"
                        }`}
                      >
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody
                    className={
                      darkMode
                        ? "divide-y divide-slate-700"
                        : "divide-y divide-slate-100"
                    }
                  >
                    {filteredRequests.map((request) => (
                      <tr
                        key={request.id}
                        className={`transition ${
                          darkMode
                            ? "hover:bg-slate-800/70"
                            : "hover:bg-slate-50/70"
                        }`}
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
                              <p
                                className={`text-xs font-bold truncate ${
                                  darkMode ? "text-slate-200" : "text-slate-800"
                                }`}
                              >
                                {getFullName(request)}
                              </p>

                              <p
                                className={`text-[10px] truncate mt-0.5 ${
                                  darkMode ? "text-slate-500" : "text-slate-400"
                                }`}
                              >
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
                          <span
                            className={`text-xs font-semibold ${
                              darkMode ? "text-slate-300" : "text-slate-600"
                            }`}
                          >
                            {getIdentifier(request)}
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`text-xs ${
                              darkMode ? "text-slate-400" : "text-slate-500"
                            }`}
                          >
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
                            className={`px-3.5 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition ${
                              darkMode
                                ? "bg-white text-slate-900 hover:bg-slate-200"
                                : "bg-slate-900 text-white hover:bg-slate-800"
                            }`}
                          >
                            Review
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* MOBILE */}

              <div
                className={`md:hidden ${
                  darkMode
                    ? "divide-y divide-slate-700"
                    : "divide-y divide-slate-100"
                }`}
              >
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
                          <p
                            className={`text-xs font-bold truncate ${
                              darkMode ? "text-slate-200" : "text-slate-800"
                            }`}
                          >
                            {getFullName(request)}
                          </p>

                          <p
                            className={`text-[10px] truncate mt-0.5 ${
                              darkMode ? "text-slate-500" : "text-slate-400"
                            }`}
                          >
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
                      <MobileInfo
                        label="Role"
                        value={getRoleLabel(request.role)}
                        darkMode={darkMode}
                      />

                      <MobileInfo
                        label="ID"
                        value={getIdentifier(request)}
                        darkMode={darkMode}
                      />

                      <MobileInfo
                        label="Submitted"
                        value={formatDate(request.createdAt)}
                        darkMode={darkMode}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleReview(request)}
                      className={`w-full mt-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition ${
                        darkMode
                          ? "bg-white text-slate-900 hover:bg-slate-200"
                          : "bg-slate-900 text-white hover:bg-slate-800"
                      }`}
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

// =========================================================
// INFO ITEM
// =========================================================

const InfoItem = ({ label, value, darkMode }) => {
  return (
    <div
      className={`rounded-xl px-4 py-3 border ${
        darkMode
          ? "bg-slate-800 border-slate-700"
          : "bg-slate-50 border-slate-100"
      }`}
    >
      <p
        className={`text-[9px] font-bold uppercase tracking-wider ${
          darkMode ? "text-slate-500" : "text-slate-400"
        }`}
      >
        {label}
      </p>

      <p
        className={`text-xs font-semibold mt-1.5 break-words ${
          darkMode ? "text-slate-200" : "text-slate-700"
        }`}
      >
        {value || "—"}
      </p>
    </div>
  );
};

// =========================================================
// MOBILE INFO
// =========================================================

const MobileInfo = ({ label, value, darkMode }) => {
  return (
    <div>
      <p
        className={`text-[9px] font-bold uppercase tracking-wider ${
          darkMode ? "text-slate-500" : "text-slate-400"
        }`}
      >
        {label}
      </p>

      <p
        className={`text-xs font-semibold mt-1 ${
          darkMode ? "text-slate-300" : "text-slate-600"
        }`}
      >
        {value || "—"}
      </p>
    </div>
  );
};

// =========================================================
// STAT CARD
// =========================================================

const StatCard = ({ label, value, icon, iconClass, darkMode }) => {
  return (
    <div
      className={`rounded-2xl p-5 shadow-sm border transition-colors ${
        darkMode ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p
            className={`text-[10px] font-bold uppercase tracking-wider ${
              darkMode ? "text-slate-500" : "text-slate-400"
            }`}
          >
            {label}
          </p>

          <p
            className={`text-2xl font-black mt-1 ${
              darkMode ? "text-white" : "text-slate-900"
            }`}
          >
            {value}
          </p>
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

// =========================================================
// FILTER BUTTON
// =========================================================

const FilterButton = ({ label, active, onClick, darkMode }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3.5 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition ${
        active
          ? darkMode
            ? "bg-white text-slate-900 shadow-sm"
            : "bg-slate-900 text-white shadow-sm"
          : darkMode
          ? "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
          : "bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
      }`}
    >
      {label}
    </button>
  );
};

export default ReviewCreateRequests;
