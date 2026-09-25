import React, { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "../../supabaseClient";

// =========================================================
// COMPANY MANAGEMENT
// =========================================================
//
// Personal Email = users.email
//   → SIMS/Auth login email
//
// Company Email = companies.company_email
//   → Official company / HR contact email
//
// =========================================================

const CompanyManagement = () => {
  const { darkMode } = useOutletContext();

  // =========================================================
  // STATES
  // =========================================================

  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");

  const [selectedCompany, setSelectedCompany] = useState(null);

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  // =========================================================
  // STATUS HELPERS
  // =========================================================

  const databaseStatusToUi = (status) => {
    switch (status) {
      case "active":
        return "Approved";

      case "rejected":
        return "Rejected";

      case "suspended":
        return "Suspended";

      case "pending":
      default:
        return "Pending Review";
    }
  };

  const uiStatusToDatabase = (status) => {
    switch (status) {
      case "Approved":
        return "active";

      case "Rejected":
        return "rejected";

      case "Suspended":
        return "suspended";

      case "Pending Review":
      default:
        return "pending";
    }
  };

  // =========================================================
  // DATE FORMATTERS
  // =========================================================

  const formatDate = (date) => {
    if (!date) return "Unknown";

    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatShortDate = (date) => {
    if (!date) return "Unknown";

    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // =========================================================
  // STORAGE URL
  // =========================================================

  const getDocumentUrl = async (filePath) => {
    if (!filePath) {
      return null;
    }

    try {
      const { data, error } = await supabase.storage
        .from("verification-documents")
        .createSignedUrl(filePath, 60 * 10);

      if (error) {
        console.error("Unable to create signed document URL:", error);

        return null;
      }

      return data?.signedUrl || null;
    } catch (error) {
      console.error("Document URL error:", error);
      return null;
    }
  };

  // =========================================================
  // FETCH COMPANIES
  // =========================================================

  const fetchCompanies = async () => {
    try {
      setLoading(true);

      // =====================================================
      // 1. LOAD COMPANY RECORDS
      // =====================================================

      const { data: companyData, error: companyError } = await supabase
        .from("companies")
        .select("*")
        .order("created_at", {
          ascending: false,
        });

      if (companyError) {
        throw companyError;
      }

      if (!companyData || companyData.length === 0) {
        setCompanies([]);
        return;
      }

      // =====================================================
      // 2. LOAD LINKED USER RECORDS
      // =====================================================
      //
      // users.email = Personal Email / SIMS Login Email
      //
      // companies.company_email = Company Email
      //
      // =====================================================

      const userIds = companyData
        .map((company) => company.user_id)
        .filter(Boolean);

      let userData = [];

      if (userIds.length > 0) {
        const { data, error: userError } = await supabase
          .from("users")
          .select("id, email, role, status, created_at, updated_at")
          .in("id", userIds);

        if (userError) {
          console.warn("Unable to load linked user information:", userError);
        } else {
          userData = data || [];
        }
      }

      // =====================================================
      // 3. LOAD CREATE REQUEST INFORMATION
      // =====================================================

      let requestData = [];

      if (userIds.length > 0) {
        const { data, error: requestError } = await supabase
          .from("create_requests")
          .select("*")
          .in("user_id", userIds);

        if (requestError) {
          console.warn(
            "Unable to load create request information:",
            requestError
          );
        } else {
          requestData = data || [];
        }
      }

      // =====================================================
      // 4. FORMAT COMPANY DATA
      // =====================================================

      const formattedCompanies = companyData.map((company) => {
        const request = requestData.find(
          (item) => item.user_id === company.user_id
        );

        const user = userData.find((item) => item.id === company.user_id);

        const firstName = request?.first_name || "";

        const middleInitial = request?.middle_initial || "";

        const lastName = request?.last_name || "";

        const contactName =
          `${firstName} ${
            middleInitial ? `${middleInitial} ` : ""
          }${lastName}`.trim() || "Company Representative";

        // ===================================================
        // DOCUMENTS
        // ===================================================

        const documents = [];

        if (company.business_registration_url) {
          documents.push({
            type: "Business Registration",
            fileName:
              company.business_registration_url.split("/").pop() ||
              "business-registration",
            filePath: company.business_registration_url,
          });
        }

        if (company.bir_registration_url) {
          documents.push({
            type: "BIR Registration",
            fileName:
              company.bir_registration_url.split("/").pop() ||
              "bir-registration",
            filePath: company.bir_registration_url,
          });
        }

        if (company.supporting_document_url) {
          documents.push({
            type: "Supporting Document",
            fileName:
              company.supporting_document_url.split("/").pop() ||
              "supporting-document",
            filePath: company.supporting_document_url,
          });
        }

        return {
          id: company.id,

          userId: company.user_id,

          // Company information
          company: company.company_name,
          companyEmail: company.company_email || "",
          phone: company.company_phone || "",
          address: company.company_address || "",
          website: company.website || "",
          industry: company.industry || "",
          designation: company.designation || "",

          // Representative
          contact: contactName,

          // Account information
          personalEmail: user?.email || "",
          userStatus: user?.status || "",
          userRole: user?.role || "",

          // Registration information
          status: databaseStatusToUi(company.status),
          submittedAt: formatDate(company.created_at),
          registeredAt: company.created_at,

          createdAt: company.created_at,
          updatedAt: company.updated_at,

          rejectionReason: "",
          rejectionEmailSent: false,
          rejectionEmailSentAt: null,

          reopenEmailSent: false,
          reopenEmailSentAt: null,

          rejectionHistory: [],

          documents,
        };
      });

      setCompanies(formattedCompanies);
    } catch (error) {
      console.error("Failed to load companies:", error);

      alert(
        `Unable to load companies.\n\n${error?.message || "Unknown error."}`
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    fetchCompanies();
  }, []);

  // =========================================================
  // FILTERED COMPANIES
  // =========================================================

  const filteredCompanies = useMemo(() => {
    const search = searchTerm.toLowerCase().trim();

    return companies.filter((company) => {
      const matchesSearch =
        !search ||
        company.company?.toLowerCase().includes(search) ||
        company.contact?.toLowerCase().includes(search) ||
        company.personalEmail?.toLowerCase().includes(search) ||
        company.companyEmail?.toLowerCase().includes(search) ||
        company.industry?.toLowerCase().includes(search) ||
        company.designation?.toLowerCase().includes(search);

      const matchesStatus =
        filterStatus === "All" || company.status === filterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [companies, searchTerm, filterStatus]);

  // =========================================================
  // STATUS COUNTS
  // =========================================================

  const pendingCount = companies.filter(
    (company) => company.status === "Pending Review"
  ).length;

  const approvedCount = companies.filter(
    (company) => company.status === "Approved"
  ).length;

  const rejectedCount = companies.filter(
    (company) => company.status === "Rejected"
  ).length;

  const suspendedCount = companies.filter(
    (company) => company.status === "Suspended"
  ).length;

  // =========================================================
  // UPDATE COMPANY STATUS
  // =========================================================

  const updateCompanyStatus = async (id, newStatus) => {
    const databaseStatus = uiStatusToDatabase(newStatus);

    const { error } = await supabase
      .from("companies")
      .update({
        status: databaseStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      throw error;
    }
  };

  // =========================================================
  // APPROVE COMPANY
  // =========================================================

  const approveCompany = async (id) => {
    const company = companies.find((item) => item.id === id);

    if (!company) {
      alert("Company not found.");
      return;
    }

    if (company.status !== "Pending Review") {
      alert("Only companies with Pending Review status can be approved.");
      return;
    }

    try {
      setActionLoading(true);

      // =====================================================
      // 1. ACTIVATE COMPANY RECORD
      // =====================================================

      const { error: companyUpdateError } = await supabase
        .from("companies")
        .update({
          status: "active",
          updated_at: new Date().toISOString(),
        })
        .eq("id", company.id);

      if (companyUpdateError) {
        throw companyUpdateError;
      }

      // =====================================================
      // 2. ACTIVATE SIMS USER RECORD
      // =====================================================

      if (!company.userId) {
        throw new Error(
          "This company does not have a linked SIMS user account."
        );
      }

      const { data: activatedUser, error: userUpdateError } = await supabase
        .from("users")
        .update({
          status: "active",
          updated_at: new Date().toISOString(),
        })
        .eq("id", company.userId)
        .select("id, email, role, status")
        .maybeSingle();

      if (userUpdateError) {
        console.error("SIMS user activation failed:", userUpdateError);

        await supabase
          .from("companies")
          .update({
            status: "pending",
            updated_at: new Date().toISOString(),
          })
          .eq("id", company.id);

        throw new Error(
          `Company was not activated because the SIMS user account could not be activated: ${userUpdateError.message}`
        );
      }

      if (!activatedUser) {
        await supabase
          .from("companies")
          .update({
            status: "pending",
            updated_at: new Date().toISOString(),
          })
          .eq("id", company.id);

        throw new Error(
          "The company has no matching SIMS user account. The registration cannot be activated yet."
        );
      }

      // =====================================================
      // 3. VERIFY USER ROLE
      // =====================================================

      if (activatedUser.role?.toLowerCase() !== "company") {
        await supabase
          .from("users")
          .update({
            status: "pending",
            updated_at: new Date().toISOString(),
          })
          .eq("id", company.userId);

        await supabase
          .from("companies")
          .update({
            status: "pending",
            updated_at: new Date().toISOString(),
          })
          .eq("id", company.id);

        throw new Error(
          "The linked SIMS user account does not have the company role."
        );
      }

      // =====================================================
      // 4. SEND APPROVAL EMAIL
      // =====================================================

      const { data: emailData, error: emailError } =
        await supabase.functions.invoke("send-registration-email", {
          body: {
            email: company.personalEmail || company.companyEmail,
            name: company.contact,
            type: "approved",
            role: "company",
            companyName: company.company,
          },
        });

      if (emailError) {
        console.error("Approval email failed:", emailError);
      } else if (emailData?.success === false) {
        console.error("Approval email was not sent:", emailData);
      }

      // =====================================================
      // 5. UPDATE FRONTEND STATE
      // =====================================================

      const updatedCompany = {
        ...company,
        status: "Approved",
        personalEmail: activatedUser.email || company.personalEmail,
        userStatus: "active",
        rejectionReason: "",
      };

      setCompanies((prev) =>
        prev.map((item) => (item.id === id ? updatedCompany : item))
      );

      setSelectedCompany((current) =>
        current?.id === id ? updatedCompany : current
      );

      // =====================================================
      // 6. SUCCESS MESSAGE
      // =====================================================

      const notificationEmail = company.personalEmail || company.companyEmail;

      if (emailError || emailData?.success === false) {
        alert(
          `Company approved successfully.\n\n` +
            `The company account has been activated in SIMS.\n\n` +
            `However, the approval notification email could not be sent to ${notificationEmail}.`
        );
      } else {
        alert(
          `Company approved successfully.\n\n` +
            `The company account has been activated and can now log in.\n\n` +
            `An approval notification has been sent to ${notificationEmail}.`
        );
      }
    } catch (error) {
      console.error("Company approval failed:", error);

      alert(
        error?.message || "The company could not be approved. Please try again."
      );
    } finally {
      setActionLoading(false);
    }
  };

  // =========================================================
  // OPEN REJECT MODAL
  // =========================================================

  const openRejectModal = (company) => {
    if (!company) return;

    if (company.status !== "Pending Review") {
      alert("Only companies with Pending Review status can be rejected.");

      return;
    }

    setSelectedCompany(company);
    setRejectReason("");
    setShowRejectModal(true);
  };

  // =========================================================
  // REJECT COMPANY
  // =========================================================

  const rejectCompany = async () => {
    if (!selectedCompany) return;

    const reason = rejectReason.trim();

    if (!reason) {
      alert("Please provide a reason for rejecting this registration.");
      return;
    }

    if (selectedCompany.status !== "Pending Review") {
      alert("Only companies with Pending Review status can be rejected.");

      return;
    }

    try {
      setActionLoading(true);

      // =====================================================
      // 1. UPDATE COMPANY STATUS
      // =====================================================

      const { error: updateError } = await supabase
        .from("companies")
        .update({
          status: "rejected",
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedCompany.id);

      if (updateError) {
        throw updateError;
      }

      // =====================================================
      // 2. UPDATE USER STATUS
      // =====================================================

      if (selectedCompany.userId) {
        const { error: userUpdateError } = await supabase
          .from("users")
          .update({
            status: "inactive",
            updated_at: new Date().toISOString(),
          })
          .eq("id", selectedCompany.userId);

        if (userUpdateError) {
          console.error("Unable to synchronize user status:", userUpdateError);
        }
      }

      // =====================================================
      // 3. SEND REJECTION EMAIL
      // =====================================================

      const notificationEmail =
        selectedCompany.personalEmail || selectedCompany.companyEmail;

      const { data: emailData, error: emailError } =
        await supabase.functions.invoke("send-registration-email", {
          body: {
            email: notificationEmail,
            name: selectedCompany.contact,
            type: "rejected",
            role: "company",
            companyName: selectedCompany.company,
            reason,
          },
        });

      if (emailError) {
        console.error("Rejection email failed:", emailError);
      } else if (emailData?.success === false) {
        console.error("Rejection email was not sent:", emailData);
      } else {
        console.log(
          `Rejection email successfully sent to ${notificationEmail}`
        );
      }

      // =====================================================
      // 4. CREATE REJECTION HISTORY
      // =====================================================

      const rejectedAt = formatDate(new Date().toISOString());

      const historyEntry = {
        reason,
        rejectedAt,
      };

      // =====================================================
      // 5. UPDATE FRONTEND STATE
      // =====================================================

      const emailWasSent = !emailError && emailData?.success !== false;

      const updatedCompany = {
        ...selectedCompany,

        status: "Rejected",

        userStatus: "inactive",

        rejectionReason: reason,

        rejectionEmailSent: emailWasSent,

        rejectionEmailSentAt: emailWasSent ? new Date().toISOString() : null,

        rejectionHistory: [
          ...(selectedCompany.rejectionHistory || []),
          historyEntry,
        ],
      };

      setCompanies((prev) =>
        prev.map((company) =>
          company.id === selectedCompany.id ? updatedCompany : company
        )
      );

      setSelectedCompany(updatedCompany);

      setShowRejectModal(false);
      setRejectReason("");

      // =====================================================
      // 6. RESULT MESSAGE
      // =====================================================

      if (!emailWasSent) {
        alert(
          `Registration for ${selectedCompany.company} was rejected successfully.\n\n` +
            `However, the rejection notification email could not be sent to ${notificationEmail}.`
        );
      } else {
        alert(
          `Registration for ${selectedCompany.company} was rejected successfully.\n\n` +
            `A rejection notification with the reason has been sent to ${notificationEmail}.`
        );
      }
    } catch (error) {
      console.error("Rejection failed:", error);

      alert(
        `The company could not be rejected.\n\n${
          error?.message || "Please try again."
        }`
      );
    } finally {
      setActionLoading(false);
    }
  };

  // =========================================================
  // REOPEN COMPANY
  // =========================================================

  const reopenCompany = async (id) => {
    const company = companies.find((item) => item.id === id);

    if (!company) {
      alert("Company not found.");
      return;
    }

    if (company.status !== "Rejected") {
      alert("Only rejected company registrations can be reopened.");

      return;
    }

    try {
      setActionLoading(true);

      // =====================================================
      // 1. GENERATE SECURE VERIFICATION UPLOAD LINK
      // =====================================================

      const { data: linkData, error: linkError } =
        await supabase.functions.invoke("create-company-verification-link", {
          body: {
            company_id: company.id,
          },
        });

      if (linkError) {
        console.error("Verification link generation failed:", linkError);

        throw new Error(
          linkError.message ||
            "Unable to create the company verification upload link."
        );
      }

      if (!linkData?.success || !linkData?.uploadUrl) {
        console.error("Invalid verification link response:", linkData);

        throw new Error(
          linkData?.error ||
            "The company verification upload link could not be created."
        );
      }

      const uploadUrl = linkData.uploadUrl;

      console.log("Company verification upload URL generated:", uploadUrl);

      // =====================================================
      // 2. SEND REOPENED EMAIL
      // =====================================================

      const notificationEmail = company.personalEmail || company.companyEmail;

      const { data: emailData, error: emailError } =
        await supabase.functions.invoke("send-registration-email", {
          body: {
            email: notificationEmail,
            name: company.contact,
            type: "reopened",
            role: "company",
            companyName: company.company,
            uploadUrl,
          },
        });

      if (emailError) {
        console.error("Reopened email failed:", emailError);
      } else if (emailData?.success === false) {
        console.error("Reopened email was not sent:", emailData);
      } else {
        console.log(`Reopened email successfully sent to ${notificationEmail}`);
      }

      // =====================================================
      // 3. KEEP COMPANY REJECTED
      // =====================================================

      const emailWasSent = !emailError && emailData?.success !== false;

      const updatedCompany = {
        ...company,

        status: "Rejected",

        reopenEmailSent: emailWasSent,

        reopenEmailSentAt: emailWasSent ? new Date().toISOString() : null,
      };

      setCompanies((prev) =>
        prev.map((item) => (item.id === id ? updatedCompany : item))
      );

      setSelectedCompany((current) =>
        current?.id === id ? updatedCompany : current
      );

      // =====================================================
      // 4. SUCCESS MESSAGE
      // =====================================================

      if (!emailWasSent) {
        alert(
          `Registration for ${company.company} has been reopened for resubmission.\n\n` +
            `The secure document upload link was successfully generated, but the notification email could not be sent.`
        );
      } else {
        alert(
          `Registration for ${company.company} has been reopened for resubmission.\n\n` +
            `A secure document upload link has been generated and sent to ${notificationEmail}.\n\n` +
            `The company will remain Rejected until the new documents are successfully submitted.`
        );
      }
    } catch (error) {
      console.error("Reopen company failed:", error);

      alert(
        `The company could not be reopened.\n\n${
          error?.message || "Please try again."
        }`
      );
    } finally {
      setActionLoading(false);
    }
  };

  // =========================================================
  // VIEW DOCUMENT
  // =========================================================

  const viewDocument = async (document) => {
    if (!document?.filePath) {
      alert("This document is unavailable.");
      return;
    }

    try {
      const url = await getDocumentUrl(document.filePath);

      if (!url) {
        alert("Unable to generate a secure document link.");

        return;
      }

      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error("Document viewing failed:", error);

      alert("The document could not be opened.");
    }
  };

  // =========================================================
  // STATUS STYLE
  // =========================================================

  const getStatusStyle = (status) => {
    if (status === "Approved") {
      return darkMode
        ? "bg-emerald-900/40 text-emerald-300 border-emerald-700"
        : "bg-emerald-50 text-emerald-700 border-emerald-200";
    }

    if (status === "Rejected") {
      return darkMode
        ? "bg-red-900/40 text-red-300 border-red-700"
        : "bg-red-50 text-red-700 border-red-200";
    }

    if (status === "Suspended") {
      return darkMode
        ? "bg-slate-800 text-slate-300 border-slate-600"
        : "bg-slate-100 text-slate-600 border-slate-200";
    }

    return darkMode
      ? "bg-amber-900/40 text-amber-300 border-amber-700"
      : "bg-amber-50 text-amber-700 border-amber-200";
  };

  // =========================================================
  // SHARED STYLES
  // =========================================================

  const panel = darkMode
    ? "bg-slate-900 border-slate-700"
    : "bg-white border-slate-200";

  const border = darkMode ? "border-slate-700" : "border-slate-200";

  const heading = darkMode ? "text-white" : "text-slate-900";

  const muted = darkMode ? "text-slate-400" : "text-slate-500";

  const secondaryText = darkMode ? "text-slate-300" : "text-slate-700";

  // =========================================================
  // STATUS FILTER BUTTON
  // =========================================================

  const statusFilters = [
    {
      key: "All",
      label: "All",
      count: companies.length,
    },
    {
      key: "Pending Review",
      label: "Pending",
      count: pendingCount,
    },
    {
      key: "Approved",
      label: "Approved",
      count: approvedCount,
    },
    {
      key: "Rejected",
      label: "Rejected",
      count: rejectedCount,
    },
    {
      key: "Suspended",
      label: "Suspended",
      count: suspendedCount,
    },
  ];

  // =========================================================
  // RETURN
  // =========================================================

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* =====================================================
          PAGE HEADER
          ===================================================== */}

      <div className="mb-6">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <p
              className={`text-[10px] uppercase tracking-widest font-bold mb-1 ${
                darkMode ? "text-slate-500" : "text-slate-400"
              }`}
            >
              Administration
            </p>

            <h1 className={`text-xl sm:text-2xl font-bold ${heading}`}>
              Company Management
            </h1>

            <p className={`text-xs sm:text-sm mt-1 ${muted}`}>
              Review, verify, and manage companies registered in the internship
              system.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchCompanies}
            disabled={loading}
            className={`h-10 px-4 rounded-lg border text-xs font-semibold transition ${
              darkMode
                ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                : "border-slate-300 text-slate-700 hover:bg-slate-50"
            } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {loading ? "Loading..." : "↻ Refresh"}
          </button>
        </div>
      </div>

      {/* =====================================================
          SUMMARY CARDS
          ===================================================== */}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <div className={`border rounded-xl p-4 ${panel}`}>
          <p className={`text-[10px] uppercase font-bold ${muted}`}>
            Pending Review
          </p>

          <p className="text-2xl font-black text-amber-500 mt-1">
            {pendingCount}
          </p>

          <p className={`text-[10px] mt-1 ${muted}`}>
            Companies waiting for verification
          </p>
        </div>

        <div className={`border rounded-xl p-4 ${panel}`}>
          <p className={`text-[10px] uppercase font-bold ${muted}`}>Approved</p>

          <p className="text-2xl font-black text-emerald-500 mt-1">
            {approvedCount}
          </p>

          <p className={`text-[10px] mt-1 ${muted}`}>
            Verified company registrations
          </p>
        </div>

        <div className={`border rounded-xl p-4 ${panel}`}>
          <p className={`text-[10px] uppercase font-bold ${muted}`}>Rejected</p>

          <p className="text-2xl font-black text-red-500 mt-1">
            {rejectedCount}
          </p>

          <p className={`text-[10px] mt-1 ${muted}`}>
            Registrations requiring correction
          </p>
        </div>
      </div>

      {/* =====================================================
          SEARCH
          ===================================================== */}

      <div className={`border rounded-xl p-3 sm:p-4 mb-3 ${panel}`}>
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex-1 relative">
            <span
              className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm ${muted}`}
            >
              🔎
            </span>

            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search company, representative, personal email, company email, industry..."
              className={`w-full h-10 pl-9 pr-3 rounded-lg border text-xs sm:text-sm outline-none transition ${
                darkMode
                  ? "bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
                  : "bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-blue-500"
              }`}
            />
          </div>

          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className={`h-10 px-3 rounded-lg border text-xs font-semibold transition ${
                darkMode
                  ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                  : "border-slate-300 text-slate-700 hover:bg-slate-50"
              }`}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* =====================================================
          STATUS FILTER TABS
          ===================================================== */}

      <div className={`border rounded-xl p-2 mb-5 ${panel}`}>
        <div className="flex flex-wrap gap-1">
          {statusFilters.map((filter) => {
            const active = filterStatus === filter.key;

            return (
              <button
                key={filter.key}
                type="button"
                onClick={() => setFilterStatus(filter.key)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] sm:text-xs font-semibold transition ${
                  active
                    ? darkMode
                      ? "bg-blue-600 text-white"
                      : "bg-blue-600 text-white"
                    : darkMode
                    ? "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <span>{filter.label}</span>

                <span
                  className={`min-w-5 h-5 px-1.5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                    active
                      ? "bg-white/20 text-white"
                      : darkMode
                      ? "bg-slate-800 text-slate-400"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {filter.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* =====================================================
          TABLE
          ===================================================== */}

      <div className={`border rounded-xl overflow-hidden ${panel}`}>
        <div className={`px-4 py-3 border-b ${border}`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className={`text-sm font-bold ${heading}`}>
                Registered Companies
              </h2>

              <p className={`text-[10px] mt-0.5 ${muted}`}>
                {loading
                  ? "Loading companies..."
                  : `${filteredCompanies.length} ${
                      filteredCompanies.length === 1 ? "company" : "companies"
                    } found`}
              </p>
            </div>

            {(searchTerm || filterStatus !== "All") && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setFilterStatus("All");
                }}
                className={`text-[10px] font-semibold ${
                  darkMode
                    ? "text-blue-400 hover:text-blue-300"
                    : "text-blue-600 hover:text-blue-700"
                }`}
              >
                Reset filters
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] border-collapse">
            <thead>
              <tr className={darkMode ? "bg-slate-800" : "bg-slate-50"}>
                <th
                  className={`px-4 py-3 border-b text-left text-[10px] font-bold uppercase tracking-wide ${border} ${
                    darkMode ? "text-slate-300" : "text-slate-600"
                  }`}
                >
                  Company
                </th>

                <th
                  className={`px-4 py-3 border-b text-left text-[10px] font-bold uppercase tracking-wide ${border} ${
                    darkMode ? "text-slate-300" : "text-slate-600"
                  }`}
                >
                  Representative
                </th>

                <th
                  className={`px-4 py-3 border-b text-left text-[10px] font-bold uppercase tracking-wide ${border} ${
                    darkMode ? "text-slate-300" : "text-slate-600"
                  }`}
                >
                  Contact Emails
                </th>

                <th
                  className={`px-4 py-3 border-b text-left text-[10px] font-bold uppercase tracking-wide ${border} ${
                    darkMode ? "text-slate-300" : "text-slate-600"
                  }`}
                >
                  Industry
                </th>

                <th
                  className={`px-4 py-3 border-b text-left text-[10px] font-bold uppercase tracking-wide ${border} ${
                    darkMode ? "text-slate-300" : "text-slate-600"
                  }`}
                >
                  Registered
                </th>

                <th
                  className={`px-4 py-3 border-b text-center text-[10px] font-bold uppercase tracking-wide ${border} ${
                    darkMode ? "text-slate-300" : "text-slate-600"
                  }`}
                >
                  Status
                </th>

                <th
                  className={`px-4 py-3 border-b text-center text-[10px] font-bold uppercase tracking-wide ${border} ${
                    darkMode ? "text-slate-300" : "text-slate-600"
                  }`}
                >
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className={`px-4 py-16 text-center ${muted}`}>
                    <div className="text-2xl mb-2 animate-pulse">🏢</div>

                    <p className="text-sm font-semibold">
                      Loading companies...
                    </p>

                    <p className="text-xs mt-1">
                      Fetching registrations from Supabase.
                    </p>
                  </td>
                </tr>
              ) : filteredCompanies.length > 0 ? (
                filteredCompanies.map((company) => (
                  <tr
                    key={company.id}
                    className={`transition ${
                      darkMode ? "hover:bg-slate-800/70" : "hover:bg-slate-50"
                    }`}
                  >
                    {/* COMPANY */}

                    <td className={`px-4 py-3 border-b ${border}`}>
                      <div className="min-w-[190px]">
                        <p className={`text-xs font-bold ${heading}`}>
                          {company.company}
                        </p>

                        {company.website ? (
                          <a
                            href={
                              company.website.startsWith("http")
                                ? company.website
                                : `https://${company.website}`
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="inline-block text-[10px] mt-1 text-blue-500 hover:underline truncate max-w-[190px]"
                          >
                            🌐 {company.website}
                          </a>
                        ) : (
                          <p className={`text-[10px] mt-1 ${muted}`}>
                            No website provided
                          </p>
                        )}
                      </div>
                    </td>

                    {/* REPRESENTATIVE */}

                    <td className={`px-4 py-3 border-b ${border}`}>
                      <div className="min-w-[160px]">
                        <p className={`text-xs font-semibold ${secondaryText}`}>
                          {company.contact}
                        </p>

                        <p className={`text-[10px] mt-1 ${muted}`}>
                          {company.designation || "Representative"}
                        </p>
                      </div>
                    </td>

                    {/* EMAILS */}

                    <td className={`px-4 py-3 border-b ${border}`}>
                      <div className="space-y-1.5 min-w-[250px]">
                        {/* PERSONAL EMAIL */}

                        <div>
                          <p
                            className={`text-[9px] uppercase tracking-wide font-bold ${muted}`}
                          >
                            Personal / Login
                          </p>

                          {company.personalEmail ? (
                            <a
                              href={`mailto:${company.personalEmail}`}
                              className={`text-[10px] hover:underline break-all ${
                                darkMode ? "text-blue-300" : "text-blue-600"
                              }`}
                            >
                              {company.personalEmail}
                            </a>
                          ) : (
                            <p className={`text-[10px] ${muted}`}>
                              Not available
                            </p>
                          )}
                        </div>

                        {/* COMPANY EMAIL */}

                        <div>
                          <p
                            className={`text-[9px] uppercase tracking-wide font-bold ${muted}`}
                          >
                            Company / HR
                          </p>

                          {company.companyEmail ? (
                            <a
                              href={`mailto:${company.companyEmail}`}
                              className={`text-[10px] hover:underline break-all ${
                                darkMode
                                  ? "text-emerald-300"
                                  : "text-emerald-600"
                              }`}
                            >
                              {company.companyEmail}
                            </a>
                          ) : (
                            <p className={`text-[10px] ${muted}`}>
                              Not provided
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* INDUSTRY */}

                    <td className={`px-4 py-3 border-b text-xs ${border}`}>
                      <span
                        className={
                          darkMode ? "text-slate-300" : "text-slate-600"
                        }
                      >
                        {company.industry || "Not specified"}
                      </span>
                    </td>

                    {/* REGISTERED */}

                    <td className={`px-4 py-3 border-b ${border}`}>
                      <div className="min-w-[100px]">
                        <p className={`text-xs font-medium ${secondaryText}`}>
                          {formatShortDate(company.registeredAt)}
                        </p>

                        <p className={`text-[10px] mt-0.5 ${muted}`}>
                          Registration
                        </p>
                      </div>
                    </td>

                    {/* STATUS */}

                    <td className={`px-4 py-3 border-b text-center ${border}`}>
                      <span
                        className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[10px] font-bold border whitespace-nowrap ${getStatusStyle(
                          company.status
                        )}`}
                      >
                        {company.status}
                      </span>
                    </td>

                    {/* ACTION */}

                    <td className={`px-4 py-3 border-b text-center ${border}`}>
                      <button
                        type="button"
                        onClick={() => setSelectedCompany(company)}
                        className={`px-3.5 py-1.5 rounded-lg border text-[10px] font-semibold transition ${
                          darkMode
                            ? "border-slate-600 text-slate-300 hover:bg-slate-800"
                            : "border-slate-300 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className={`px-4 py-12 text-center ${muted}`}>
                    <div className="text-2xl mb-2">🏢</div>

                    <p className="text-sm font-semibold">No companies found</p>

                    <p className="text-xs mt-1">
                      Try changing your search or status filter.
                    </p>

                    {(searchTerm || filterStatus !== "All") && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchTerm("");
                          setFilterStatus("All");
                        }}
                        className="mt-3 text-xs font-semibold text-blue-500 hover:underline"
                      >
                        Clear all filters
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =====================================================
          FOOTER INFO
          ===================================================== */}

      <div
        className={`mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-[10px] ${muted}`}
      >
        <span>
          Showing {filteredCompanies.length} of {companies.length} registered
          companies
        </span>

        {filterStatus !== "All" && (
          <span>
            Filtered by: <strong className={heading}>{filterStatus}</strong>
          </span>
        )}
      </div>

      {/* =====================================================
          COMPANY REVIEW MODAL
          ===================================================== */}

      {selectedCompany && !showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSelectedCompany(null)}
          />

          <div
            className={`relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border shadow-2xl ${panel}`}
          >
            {/* HEADER */}

            <div className={`p-5 border-b ${border}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p
                    className={`text-[10px] uppercase tracking-widest font-bold ${muted}`}
                  >
                    Company Registration Review
                  </p>

                  <h2 className={`text-xl font-black mt-1 ${heading}`}>
                    {selectedCompany.company}
                  </h2>

                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span
                      className={`px-2.5 py-1 rounded-full border text-[10px] font-bold ${getStatusStyle(
                        selectedCompany.status
                      )}`}
                    >
                      {selectedCompany.status}
                    </span>

                    <span className={`text-[10px] ${muted}`}>
                      Registration ID: {selectedCompany.id}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedCompany(null)}
                  className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center text-lg ${
                    darkMode
                      ? "hover:bg-slate-800 text-slate-400"
                      : "hover:bg-slate-100 text-slate-500"
                  }`}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
            </div>

            {/* CONTENT */}

            <div className="p-5 space-y-6">
              {/* =================================================
                  COMPANY INFORMATION
                  ================================================= */}

              <section>
                <div className="mb-3">
                  <h3 className={`text-sm font-bold ${heading}`}>
                    Company Information
                  </h3>

                  <p className={`text-[10px] mt-1 ${muted}`}>
                    Official information submitted by the company.
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <p className={`text-[10px] uppercase font-bold ${muted}`}>
                      Company Name
                    </p>

                    <p className={`text-sm font-medium mt-1 ${heading}`}>
                      {selectedCompany.company}
                    </p>
                  </div>

                  <div>
                    <p className={`text-[10px] uppercase font-bold ${muted}`}>
                      Industry
                    </p>

                    <p className={`text-sm font-medium mt-1 ${heading}`}>
                      {selectedCompany.industry || "Not specified"}
                    </p>
                  </div>

                  <div>
                    <p className={`text-[10px] uppercase font-bold ${muted}`}>
                      Representative
                    </p>

                    <p className={`text-sm font-medium mt-1 ${heading}`}>
                      {selectedCompany.contact}
                    </p>
                  </div>

                  <div>
                    <p className={`text-[10px] uppercase font-bold ${muted}`}>
                      Designation
                    </p>

                    <p className={`text-sm font-medium mt-1 ${heading}`}>
                      {selectedCompany.designation || "Not provided"}
                    </p>
                  </div>

                  <div>
                    <p className={`text-[10px] uppercase font-bold ${muted}`}>
                      Phone Number
                    </p>

                    <p className={`text-sm font-medium mt-1 ${heading}`}>
                      {selectedCompany.phone || "Not provided"}
                    </p>
                  </div>

                  <div>
                    <p className={`text-[10px] uppercase font-bold ${muted}`}>
                      Registered Date
                    </p>

                    <p className={`text-sm font-medium mt-1 ${heading}`}>
                      {selectedCompany.registeredAt
                        ? formatDate(selectedCompany.registeredAt)
                        : "Unknown"}
                    </p>
                  </div>

                  <div className="sm:col-span-2">
                    <p className={`text-[10px] uppercase font-bold ${muted}`}>
                      Address
                    </p>

                    <p className={`text-sm font-medium mt-1 ${heading}`}>
                      {selectedCompany.address || "Not provided"}
                    </p>
                  </div>

                  <div className="sm:col-span-2">
                    <p className={`text-[10px] uppercase font-bold ${muted}`}>
                      Website
                    </p>

                    {selectedCompany.website ? (
                      <a
                        href={
                          selectedCompany.website.startsWith("http")
                            ? selectedCompany.website
                            : `https://${selectedCompany.website}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-medium mt-1 text-blue-500 hover:underline break-all"
                      >
                        {selectedCompany.website}
                      </a>
                    ) : (
                      <p className={`text-sm font-medium mt-1 ${muted}`}>
                        Not provided
                      </p>
                    )}
                  </div>
                </div>
              </section>

              {/* =================================================
                  ACCOUNT & CONTACT INFORMATION
                  ================================================= */}

              <section>
                <div className="mb-3">
                  <h3 className={`text-sm font-bold ${heading}`}>
                    Account & Contact Information
                  </h3>

                  <p className={`text-[10px] mt-1 ${muted}`}>
                    The personal email is used for the SIMS account, while the
                    company email represents the official company or HR contact.
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  {/* PERSONAL EMAIL */}

                  <div
                    className={`rounded-xl border p-4 ${
                      darkMode
                        ? "bg-blue-950/20 border-blue-900/50"
                        : "bg-blue-50 border-blue-100"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                          darkMode ? "bg-blue-900/40" : "bg-blue-100"
                        }`}
                      >
                        👤
                      </div>

                      <div className="min-w-0">
                        <p
                          className={`text-[10px] uppercase font-bold ${
                            darkMode ? "text-blue-300" : "text-blue-700"
                          }`}
                        >
                          Personal Email
                        </p>

                        <p className={`text-[9px] mt-0.5 ${muted}`}>
                          SIMS / login account
                        </p>

                        {selectedCompany.personalEmail ? (
                          <a
                            href={`mailto:${selectedCompany.personalEmail}`}
                            className={`block text-xs font-semibold mt-2 break-all hover:underline ${
                              darkMode ? "text-blue-300" : "text-blue-700"
                            }`}
                          >
                            {selectedCompany.personalEmail}
                          </a>
                        ) : (
                          <p className={`text-xs mt-2 ${muted}`}>
                            Not available
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* COMPANY EMAIL */}

                  <div
                    className={`rounded-xl border p-4 ${
                      darkMode
                        ? "bg-emerald-950/20 border-emerald-900/50"
                        : "bg-emerald-50 border-emerald-100"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                          darkMode ? "bg-emerald-900/40" : "bg-emerald-100"
                        }`}
                      >
                        🏢
                      </div>

                      <div className="min-w-0">
                        <p
                          className={`text-[10px] uppercase font-bold ${
                            darkMode ? "text-emerald-300" : "text-emerald-700"
                          }`}
                        >
                          Company Email
                        </p>

                        <p className={`text-[9px] mt-0.5 ${muted}`}>
                          Official company / HR contact
                        </p>

                        {selectedCompany.companyEmail ? (
                          <a
                            href={`mailto:${selectedCompany.companyEmail}`}
                            className={`block text-xs font-semibold mt-2 break-all hover:underline ${
                              darkMode ? "text-emerald-300" : "text-emerald-700"
                            }`}
                          >
                            {selectedCompany.companyEmail}
                          </a>
                        ) : (
                          <p className={`text-xs mt-2 ${muted}`}>
                            Not provided
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* =================================================
                  SUBMITTED DOCUMENTS
                  ================================================= */}

              <section>
                <div className="flex items-end justify-between gap-3 mb-3">
                  <div>
                    <h3 className={`text-sm font-bold ${heading}`}>
                      Submitted Documents
                    </h3>

                    <p className={`text-[10px] mt-1 ${muted}`}>
                      Review these files before approving the company.
                    </p>
                  </div>

                  <span className={`text-[10px] font-semibold ${muted}`}>
                    {selectedCompany.documents?.length || 0} files
                  </span>
                </div>

                <div className="space-y-2">
                  {selectedCompany.documents?.length > 0 ? (
                    selectedCompany.documents.map((document, index) => (
                      <div
                        key={index}
                        className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 rounded-xl border ${border}`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                              darkMode ? "bg-slate-800" : "bg-slate-100"
                            }`}
                          >
                            📄
                          </div>

                          <div className="min-w-0">
                            <p className={`text-xs font-semibold ${heading}`}>
                              {document.type}
                            </p>

                            <p
                              className={`text-[10px] mt-0.5 ${muted} truncate`}
                            >
                              {document.fileName}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => viewDocument(document)}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-semibold text-center transition shrink-0"
                        >
                          View File
                        </button>
                      </div>
                    ))
                  ) : (
                    <div
                      className={`rounded-xl border p-5 text-center ${border}`}
                    >
                      <div className="text-xl mb-2">📂</div>

                      <p className={`text-xs font-semibold ${heading}`}>
                        No documents submitted
                      </p>

                      <p className={`text-[10px] mt-1 ${muted}`}>
                        This registration does not contain any uploaded
                        verification documents.
                      </p>
                    </div>
                  )}
                </div>
              </section>

              {/* =================================================
                  REJECTION REASON
                  ================================================= */}

              {selectedCompany.status === "Rejected" &&
                selectedCompany.rejectionReason && (
                  <section
                    className={`rounded-xl border p-4 ${
                      darkMode
                        ? "bg-red-950/30 border-red-900"
                        : "bg-red-50 border-red-200"
                    }`}
                  >
                    <p className="text-[10px] uppercase font-bold text-red-500">
                      Latest Rejection Reason
                    </p>

                    <p
                      className={`text-sm mt-1 ${
                        darkMode ? "text-red-200" : "text-red-700"
                      }`}
                    >
                      {selectedCompany.rejectionReason}
                    </p>
                  </section>
                )}

              {/* =================================================
                  REJECTION HISTORY
                  ================================================= */}

              {selectedCompany.rejectionHistory?.length > 0 && (
                <section>
                  <div className="mb-3">
                    <h3 className={`text-sm font-bold ${heading}`}>
                      Rejection History
                    </h3>

                    <p className={`text-[10px] mt-1 ${muted}`}>
                      Previous rejection records are preserved for
                      administrative reference.
                    </p>
                  </div>

                  <div className="space-y-2">
                    {selectedCompany.rejectionHistory.map((history, index) => (
                      <div
                        key={index}
                        className={`rounded-xl border p-3 ${border}`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span
                            className={`text-[10px] font-bold ${
                              darkMode ? "text-slate-300" : "text-slate-600"
                            }`}
                          >
                            Rejection #{index + 1}
                          </span>

                          <span className={`text-[10px] ${muted}`}>
                            {history.rejectedAt}
                          </span>
                        </div>

                        <p
                          className={`text-xs mt-2 ${
                            darkMode ? "text-slate-300" : "text-slate-700"
                          }`}
                        >
                          {history.reason}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* =================================================
                  ACCOUNT STATUS
                  ================================================= */}

              <section
                className={`rounded-xl border p-4 ${
                  darkMode
                    ? "bg-slate-800/50 border-slate-700"
                    : "bg-slate-50 border-slate-200"
                }`}
              >
                <p className={`text-[10px] uppercase font-bold ${muted}`}>
                  Account Status
                </p>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-2">
                  <div>
                    <p className={`text-xs font-semibold ${heading}`}>
                      SIMS Company Account
                    </p>

                    <p className={`text-[10px] mt-0.5 ${muted}`}>
                      User account and company registration status.
                    </p>

                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedCompany.userStatus && (
                        <span
                          className={`text-[9px] px-2 py-1 rounded-full border ${
                            selectedCompany.userStatus === "active"
                              ? darkMode
                                ? "bg-emerald-900/30 text-emerald-300 border-emerald-800"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : darkMode
                              ? "bg-slate-800 text-slate-400 border-slate-700"
                              : "bg-slate-100 text-slate-600 border-slate-200"
                          }`}
                        >
                          User: {selectedCompany.userStatus}
                        </span>
                      )}

                      {selectedCompany.userRole && (
                        <span
                          className={`text-[9px] px-2 py-1 rounded-full border ${
                            darkMode
                              ? "bg-slate-800 text-slate-400 border-slate-700"
                              : "bg-white text-slate-500 border-slate-200"
                          }`}
                        >
                          Role: {selectedCompany.userRole}
                        </span>
                      )}
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold ${getStatusStyle(
                      selectedCompany.status
                    )} px-2.5 py-1 rounded-full border whitespace-nowrap`}
                  >
                    {selectedCompany.status}
                  </span>
                </div>
              </section>
            </div>

            {/* =================================================
                MODAL ACTIONS
                ================================================= */}

            <div className={`p-5 border-t ${border}`}>
              {selectedCompany.status === "Pending Review" && (
                <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => openRejectModal(selectedCompany)}
                    className={`px-4 py-2.5 rounded-lg border text-xs font-semibold transition ${
                      darkMode
                        ? "border-red-800 text-red-400 hover:bg-red-950/40"
                        : "border-red-200 text-red-600 hover:bg-red-50"
                    } ${actionLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    Reject Registration
                  </button>

                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => approveCompany(selectedCompany.id)}
                    className={`px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition ${
                      actionLoading ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {actionLoading ? "Processing..." : "Approve Company"}
                  </button>
                </div>
              )}

              {selectedCompany.status === "Rejected" && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => reopenCompany(selectedCompany.id)}
                    className={`px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition ${
                      actionLoading ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {actionLoading ? "Processing..." : "Reopen for Review"}
                  </button>
                </div>
              )}

              {selectedCompany.status === "Suspended" && (
                <div className={`text-[10px] ${muted}`}>
                  This company account is currently suspended.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          REJECT MODAL
          ===================================================== */}

      {showRejectModal && selectedCompany && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              if (actionLoading) return;

              setShowRejectModal(false);
              setRejectReason("");
            }}
          />

          <div
            className={`relative w-full max-w-lg rounded-2xl border shadow-2xl ${panel}`}
          >
            {/* HEADER */}

            <div className={`p-5 border-b ${border}`}>
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                    darkMode ? "bg-red-950/50" : "bg-red-50"
                  }`}
                >
                  ⚠️
                </div>

                <div>
                  <h2 className={`text-lg font-bold ${heading}`}>
                    Reject Registration
                  </h2>

                  <p className={`text-xs mt-1 ${muted}`}>
                    This will reject the company's registration and record the
                    reason.
                  </p>
                </div>
              </div>
            </div>

            {/* CONTENT */}

            <div className="p-5 space-y-4">
              {/* COMPANY */}

              <div
                className={`rounded-xl border p-4 ${
                  darkMode
                    ? "bg-slate-800/60 border-slate-700"
                    : "bg-slate-50 border-slate-200"
                }`}
              >
                <p
                  className={`text-[10px] uppercase tracking-wide font-bold ${muted}`}
                >
                  Company
                </p>

                <p className={`text-sm font-bold mt-1 ${heading}`}>
                  {selectedCompany.company}
                </p>

                <p className={`text-xs mt-1 ${muted}`}>
                  {selectedCompany.contact}
                </p>
              </div>

              {/* EMAIL INFORMATION */}

              <div className="grid sm:grid-cols-2 gap-3">
                <div
                  className={`rounded-xl border p-3 ${
                    darkMode
                      ? "bg-blue-950/20 border-blue-900/50"
                      : "bg-blue-50 border-blue-100"
                  }`}
                >
                  <p
                    className={`text-[9px] uppercase tracking-wide font-bold ${
                      darkMode ? "text-blue-300" : "text-blue-700"
                    }`}
                  >
                    Personal Email
                  </p>

                  <p
                    className={`text-[10px] mt-1 break-all ${
                      darkMode ? "text-blue-200" : "text-blue-700"
                    }`}
                  >
                    {selectedCompany.personalEmail || "Not available"}
                  </p>

                  <p className={`text-[9px] mt-1 ${muted}`}>
                    SIMS login account
                  </p>
                </div>

                <div
                  className={`rounded-xl border p-3 ${
                    darkMode
                      ? "bg-emerald-950/20 border-emerald-900/50"
                      : "bg-emerald-50 border-emerald-100"
                  }`}
                >
                  <p
                    className={`text-[9px] uppercase tracking-wide font-bold ${
                      darkMode ? "text-emerald-300" : "text-emerald-700"
                    }`}
                  >
                    Company Email
                  </p>

                  <p
                    className={`text-[10px] mt-1 break-all ${
                      darkMode ? "text-emerald-200" : "text-emerald-700"
                    }`}
                  >
                    {selectedCompany.companyEmail || "Not provided"}
                  </p>

                  <p className={`text-[9px] mt-1 ${muted}`}>
                    Official company / HR contact
                  </p>
                </div>
              </div>

              {/* REASON */}

              <div>
                <label
                  className={`block text-xs font-semibold mb-2 ${heading}`}
                >
                  Rejection Reason
                </label>

                <textarea
                  rows="5"
                  maxLength={500}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Example: The submitted business permit could not be verified. Please submit a valid and readable copy."
                  className={`w-full border rounded-xl px-4 py-3 text-sm resize-none outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 ${
                    darkMode
                      ? "bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                      : "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
                  }`}
                />

                <div className="flex justify-between mt-1">
                  <p className={`text-[10px] ${muted}`}>
                    This reason will be stored with the registration.
                  </p>

                  <p className={`text-[10px] ${muted}`}>
                    {rejectReason.length}/500
                  </p>
                </div>
              </div>

              {/* INFO */}

              <div
                className={`flex items-start gap-3 rounded-xl border p-3 ${
                  darkMode
                    ? "bg-slate-800/50 border-slate-700"
                    : "bg-slate-50 border-slate-200"
                }`}
              >
                <span className="text-sm">ℹ️</span>

                <div>
                  <p className={`text-xs font-semibold ${heading}`}>
                    Registration status will be updated
                  </p>

                  <p className={`text-[10px] mt-0.5 ${muted}`}>
                    The company status will change from pending to rejected in
                    Supabase. The linked SIMS user account will also be
                    inactive.
                  </p>
                </div>
              </div>
            </div>

            {/* ACTIONS */}

            <div className={`p-5 border-t ${border}`}>
              <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectReason("");
                  }}
                  className={`px-4 py-2.5 rounded-lg border text-xs font-semibold ${
                    darkMode
                      ? "border-slate-600 text-slate-300 hover:bg-slate-800"
                      : "border-slate-300 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={rejectCompany}
                  disabled={!rejectReason.trim() || actionLoading}
                  className={`px-4 py-2.5 rounded-lg text-xs font-semibold text-white transition ${
                    !rejectReason.trim() || actionLoading
                      ? "bg-red-300 cursor-not-allowed"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {actionLoading ? "Processing..." : "Reject Registration"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyManagement;
