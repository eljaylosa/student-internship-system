import React, { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";

// =========================================================
// COMPANY MANAGEMENT
// =========================================================

const CompanyManagement = () => {
  const { darkMode } = useOutletContext();

  // =========================================================
  // COMPANY DATA
  // =========================================================

  const [companies, setCompanies] = useState([
    {
      id: 1,
      company: "Tech Solutions Inc.",
      contact: "Mark Santos",
      email: "mark@techsolutions.com",
      phone: "+63 917 123 4567",
      industry: "Information Technology",
      designation: "HR Manager",
      status: "Approved",
      emailVerified: true,
      submittedAt: "August 5, 2026",
      rejectionReason: "",
      rejectionEmailSent: false,
      rejectionEmailSentAt: null,
      reopenEmailSent: false,
      reopenEmailSentAt: null,
      rejectionHistory: [],
      documents: [
        {
          type: "DTI / SEC Registration",
          fileName: "tech-solutions-registration.pdf",
          fileUrl: "#",
        },
        {
          type: "Business Permit",
          fileName: "tech-solutions-business-permit.pdf",
          fileUrl: "#",
        },
        {
          type: "BIR Registration",
          fileName: "tech-solutions-bir.pdf",
          fileUrl: "#",
        },
      ],
    },

    {
      id: 2,
      company: "Innovate Labs",
      contact: "Sarah Cruz",
      email: "sarah@innovatelabs.com",
      phone: "+63 918 456 7890",
      industry: "Software Development",
      designation: "Operations Manager",
      status: "Approved",
      emailVerified: true,
      submittedAt: "August 6, 2026",
      rejectionReason: "",
      rejectionEmailSent: false,
      rejectionEmailSentAt: null,
      reopenEmailSent: false,
      reopenEmailSentAt: null,
      rejectionHistory: [],
      documents: [
        {
          type: "DTI / SEC Registration",
          fileName: "innovate-labs-registration.pdf",
          fileUrl: "#",
        },
        {
          type: "Business Permit",
          fileName: "innovate-labs-business-permit.pdf",
          fileUrl: "#",
        },
      ],
    },

    {
      id: 3,
      company: "Bataan Digital Corp.",
      contact: "James Reyes",
      email: "james@bataandigital.com",
      phone: "+63 919 222 3344",
      industry: "Technology",
      designation: "Company Supervisor",
      status: "Approved",
      emailVerified: true,
      submittedAt: "August 7, 2026",
      rejectionReason: "",
      rejectionEmailSent: false,
      rejectionEmailSentAt: null,
      reopenEmailSent: false,
      reopenEmailSentAt: null,
      rejectionHistory: [],
      documents: [
        {
          type: "DTI / SEC Registration",
          fileName: "bataan-digital-registration.pdf",
          fileUrl: "#",
        },
        {
          type: "Business Permit",
          fileName: "bataan-digital-permit.pdf",
          fileUrl: "#",
        },
        {
          type: "BIR Registration",
          fileName: "bataan-digital-bir.pdf",
          fileUrl: "#",
        },
      ],
    },

    {
      id: 4,
      company: "Future Systems",
      contact: "Anna Garcia",
      email: "anna@futuresystems.ph",
      phone: "+63 917 555 1020",
      industry: "Information Technology",
      designation: "HR Manager",
      status: "Pending Review",
      emailVerified: false,
      submittedAt: "August 13, 2026",
      rejectionReason: "",
      rejectionEmailSent: false,
      rejectionEmailSentAt: null,
      reopenEmailSent: false,
      reopenEmailSentAt: null,
      rejectionHistory: [],
      documents: [
        {
          type: "DTI / SEC Registration",
          fileName: "future-systems-registration.pdf",
          fileUrl: "#",
        },
        {
          type: "Business Permit",
          fileName: "future-systems-business-permit.pdf",
          fileUrl: "#",
        },
        {
          type: "BIR Registration",
          fileName: "future-systems-bir.pdf",
          fileUrl: "#",
        },
      ],
    },

    {
      id: 5,
      company: "NextGen Solutions",
      contact: "Michael Tan",
      email: "michael@nextgensolutions.ph",
      phone: "+63 918 771 4432",
      industry: "Software Development",
      designation: "Lead Developer",
      status: "Pending Review",
      emailVerified: false,
      submittedAt: "August 13, 2026",
      rejectionReason: "",
      rejectionEmailSent: false,
      rejectionEmailSentAt: null,
      reopenEmailSent: false,
      reopenEmailSentAt: null,
      rejectionHistory: [],
      documents: [
        {
          type: "DTI / SEC Registration",
          fileName: "nextgen-registration.pdf",
          fileUrl: "#",
        },
        {
          type: "Business Permit",
          fileName: "nextgen-business-permit.pdf",
          fileUrl: "#",
        },
      ],
    },

    {
      id: 6,
      company: "Digital Works PH",
      contact: "Kevin Ramos",
      email: "kevin@digitalworks.ph",
      phone: "+63 919 884 2211",
      industry: "Digital Services",
      designation: "Company Representative",
      status: "Rejected",
      emailVerified: false,
      submittedAt: "August 11, 2026",
      rejectionReason:
        "Submitted business registration document could not be verified.",
      rejectionEmailSent: true,
      rejectionEmailSentAt: "August 11, 2026",
      reopenEmailSent: false,
      reopenEmailSentAt: null,
      rejectionHistory: [
        {
          reason:
            "Submitted business registration document could not be verified.",
          rejectedAt: "August 11, 2026",
        },
      ],
      documents: [
        {
          type: "DTI / SEC Registration",
          fileName: "digital-works-registration.pdf",
          fileUrl: "#",
        },
        {
          type: "Business Permit",
          fileName: "digital-works-permit.pdf",
          fileUrl: "#",
        },
      ],
    },
  ]);

  // =========================================================
  // STATES
  // =========================================================

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showBulkRejectModal, setShowBulkRejectModal] = useState(false);
  const [bulkRejectReason, setBulkRejectReason] = useState("");

  // =========================================================
  // EMAIL PLACEHOLDER
  // =========================================================
  //
  // This is intentionally kept in the frontend for now.
  //
  // Later this function should call your backend / Supabase
  // Edge Function / email provider.
  //
  // =========================================================

  const sendCompanyEmail = async ({
    type,
    companyName,
    contactName,
    recipientEmail,
    reason = "",
  }) => {
    console.log("EMAIL NOTIFICATION", {
      type,
      companyName,
      contactName,
      recipientEmail,
      reason,
    });

    /*
      ========================================================
      FUTURE REAL EMAIL IMPLEMENTATION
      ========================================================

      Example:

      await fetch("/api/company-notification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type,
          companyName,
          contactName,
          recipientEmail,
          reason,
        }),
      });

      ========================================================
    */

    return true;
  };

  // =========================================================
  // DATE FORMATTER
  // =========================================================

  const getCurrentDate = () => {
    return new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // =========================================================
  // FILTERED COMPANIES
  // =========================================================

  const filteredCompanies = useMemo(() => {
    return companies.filter((company) => {
      const search = searchTerm.toLowerCase().trim();

      const matchesSearch =
        company.company.toLowerCase().includes(search) ||
        company.contact.toLowerCase().includes(search) ||
        company.industry.toLowerCase().includes(search) ||
        company.email.toLowerCase().includes(search);

      const matchesStatus =
        filterStatus === "All" || company.status === filterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [companies, searchTerm, filterStatus]);

  // =========================================================
  // SELECT COMPANY
  // =========================================================

  const toggleCompanySelection = (id) => {
    setSelectedCompanies((prev) =>
      prev.includes(id)
        ? prev.filter((companyId) => companyId !== id)
        : [...prev, id]
    );
  };

  // =========================================================
  // SELECT ALL
  // =========================================================

  const toggleSelectAll = () => {
    const pendingIds = filteredCompanies
      .filter((company) => company.status === "Pending Review")
      .map((company) => company.id);

    const allSelected =
      pendingIds.length > 0 &&
      pendingIds.every((id) => selectedCompanies.includes(id));

    if (allSelected) {
      setSelectedCompanies((prev) =>
        prev.filter((id) => !pendingIds.includes(id))
      );
    } else {
      setSelectedCompanies((prev) => [...new Set([...prev, ...pendingIds])]);
    }
  };

  // =========================================================
  // APPROVE COMPANY
  // =========================================================

  const approveCompany = (id) => {
    setCompanies((prev) =>
      prev.map((company) =>
        company.id === id
          ? {
              ...company,
              status: "Approved",
              emailVerified: false,
              rejectionReason: "",
            }
          : company
      )
    );

    setSelectedCompanies((prev) =>
      prev.filter((companyId) => companyId !== id)
    );

    setSelectedCompany((current) =>
      current?.id === id
        ? {
            ...current,
            status: "Approved",
            emailVerified: false,
            rejectionReason: "",
          }
        : current
    );

    /*
      LATER:

      After approval:
      1. Update company registration status in database.
      2. Generate email verification token.
      3. Send verification email.
      4. Optionally send SMS verification.
    */
  };

  // =========================================================
  // APPROVE SELECTED
  // =========================================================

  const approveSelected = () => {
    if (selectedCompanies.length === 0) return;

    setCompanies((prev) =>
      prev.map((company) =>
        selectedCompanies.includes(company.id)
          ? {
              ...company,
              status: "Approved",
              emailVerified: false,
              rejectionReason: "",
            }
          : company
      )
    );

    setSelectedCompanies([]);
  };

  // =========================================================
  // OPEN BULK REJECT MODAL
  // =========================================================

  const openBulkRejectModal = () => {
    const pendingSelected = selectedCompanies.filter((id) => {
      const company = companies.find((item) => item.id === id);
      return company?.status === "Pending Review";
    });

    if (pendingSelected.length === 0) {
      alert("Please select at least one company with Pending Review status.");
      return;
    }

    setSelectedCompanies(pendingSelected);
    setBulkRejectReason("");
    setShowBulkRejectModal(true);
  };

  // =========================================================
  // REJECT SELECTED
  // =========================================================

  const rejectSelected = async () => {
    const reason = bulkRejectReason.trim();

    if (!reason) {
      alert(
        "Please provide a reason for rejecting the selected registrations."
      );
      return;
    }

    const pendingSelectedCompanies = companies.filter(
      (company) =>
        selectedCompanies.includes(company.id) &&
        company.status === "Pending Review"
    );

    if (pendingSelectedCompanies.length === 0) {
      alert("No pending companies are selected.");
      setShowBulkRejectModal(false);
      setBulkRejectReason("");
      setSelectedCompanies([]);
      return;
    }

    try {
      const rejectedAt = getCurrentDate();

      // Prepare the notification for every selected company.
      await Promise.all(
        pendingSelectedCompanies.map((company) =>
          sendCompanyEmail({
            type: "registration_rejected",
            companyName: company.company,
            contactName: company.contact,
            recipientEmail: company.email,
            reason,
          })
        )
      );

      const updatedIds = new Set(
        pendingSelectedCompanies.map((company) => company.id)
      );

      setCompanies((prev) =>
        prev.map((company) => {
          if (!updatedIds.has(company.id)) return company;

          return {
            ...company,
            status: "Rejected",
            emailVerified: false,
            rejectionReason: reason,
            rejectionEmailSent: true,
            rejectionEmailSentAt: rejectedAt,
            rejectionHistory: [
              ...(company.rejectionHistory || []),
              {
                reason,
                rejectedAt,
              },
            ],
          };
        })
      );

      setSelectedCompanies([]);
      setShowBulkRejectModal(false);
      setBulkRejectReason("");

      // Keep an open company review modal in sync if its company was part of
      // the bulk rejection.
      setSelectedCompany((current) => {
        if (!current || !updatedIds.has(current.id)) return current;

        return {
          ...current,
          status: "Rejected",
          emailVerified: false,
          rejectionReason: reason,
          rejectionEmailSent: true,
          rejectionEmailSentAt: rejectedAt,
          rejectionHistory: [
            ...(current.rejectionHistory || []),
            {
              reason,
              rejectedAt,
            },
          ],
        };
      });

      alert(
        `${pendingSelectedCompanies.length} registration${
          pendingSelectedCompanies.length === 1 ? "" : "s"
        } rejected successfully.\n\nA rejection notification has been prepared for each selected company.`
      );
    } catch (error) {
      console.error("Bulk rejection failed:", error);
      alert("The selected companies could not be rejected. Please try again.");
    }
  };

  // =========================================================
  // OPEN REJECT MODAL
  // =========================================================

  const openRejectModal = (company) => {
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

    try {
      const rejectedAt = getCurrentDate();

      // =====================================================
      // SEND REJECTION EMAIL
      // =====================================================

      await sendCompanyEmail({
        type: "registration_rejected",
        companyName: selectedCompany.company,
        contactName: selectedCompany.contact,
        recipientEmail: selectedCompany.email,
        reason,
      });

      // =====================================================
      // CREATE REJECTION HISTORY ENTRY
      // =====================================================

      const historyEntry = {
        reason,
        rejectedAt,
      };

      const updatedCompany = {
        ...selectedCompany,
        status: "Rejected",
        emailVerified: false,
        rejectionReason: reason,
        rejectionEmailSent: true,
        rejectionEmailSentAt: rejectedAt,
        rejectionHistory: [
          ...(selectedCompany.rejectionHistory || []),
          historyEntry,
        ],
      };

      // =====================================================
      // UPDATE COMPANY
      // =====================================================

      setCompanies((prev) =>
        prev.map((company) =>
          company.id === selectedCompany.id ? updatedCompany : company
        )
      );

      setSelectedCompanies((prev) =>
        prev.filter((id) => id !== selectedCompany.id)
      );

      setSelectedCompany(updatedCompany);

      setShowRejectModal(false);
      setRejectReason("");

      alert(
        `Registration rejected successfully.\n\nA rejection notification has been prepared for ${selectedCompany.email}.`
      );
    } catch (error) {
      console.error("Rejection failed:", error);

      alert("The company could not be rejected. Please try again.");
    }
  };

  // =========================================================
  // REOPEN COMPANY
  // =========================================================

  const reopenCompany = async (id) => {
    const company = companies.find((item) => item.id === id);

    if (!company) return;

    try {
      const reopenedAt = getCurrentDate();

      // =====================================================
      // SEND REOPEN EMAIL
      // =====================================================

      await sendCompanyEmail({
        type: "registration_reopened",
        companyName: company.company,
        contactName: company.contact,
        recipientEmail: company.email,
      });

      // =====================================================
      // UPDATE COMPANY
      // =====================================================

      const updatedCompany = {
        ...company,
        status: "Pending Review",
        reopenEmailSent: true,
        reopenEmailSentAt: reopenedAt,
      };

      setCompanies((prev) =>
        prev.map((item) => (item.id === id ? updatedCompany : item))
      );

      setSelectedCompany((current) =>
        current?.id === id ? updatedCompany : current
      );

      alert(
        `Registration reopened successfully.\n\nA reopening notification has been prepared for ${company.email}.`
      );
    } catch (error) {
      console.error("Reopen failed:", error);

      alert("The company could not be reopened. Please try again.");
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
  // COUNTS
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

  const pendingIds = filteredCompanies
    .filter((company) => company.status === "Pending Review")
    .map((company) => company.id);

  const isAllSelected =
    pendingIds.length > 0 &&
    pendingIds.every((id) => selectedCompanies.includes(id));

  // =========================================================
  // SHARED STYLES
  // =========================================================

  const panel = darkMode
    ? "bg-slate-900 border-slate-700"
    : "bg-white border-slate-200";

  const border = darkMode ? "border-slate-700" : "border-slate-200";

  const heading = darkMode ? "text-white" : "text-slate-900";

  const muted = darkMode ? "text-slate-400" : "text-slate-500";

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
          FILTER / SEARCH
      ===================================================== */}

      <div className={`border rounded-xl p-3 sm:p-4 mb-5 ${panel}`}>
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search company, contact, email, or industry..."
              className={`w-full h-10 px-3 rounded-lg border text-xs sm:text-sm outline-none transition ${
                darkMode
                  ? "bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
                  : "bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-blue-500"
              }`}
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className={`h-10 px-3 rounded-lg border text-xs sm:text-sm outline-none cursor-pointer ${
              darkMode
                ? "bg-slate-800 border-slate-700 text-white"
                : "bg-white border-slate-300 text-slate-700"
            }`}
          >
            <option value="All">All Status</option>
            <option value="Pending Review">Pending Review</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Suspended">Suspended</option>
          </select>

          <button
            type="button"
            onClick={approveSelected}
            disabled={selectedCompanies.length === 0}
            className={`h-10 px-4 rounded-lg text-xs font-semibold transition ${
              selectedCompanies.length === 0
                ? darkMode
                  ? "bg-slate-800 text-slate-600 cursor-not-allowed"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
                : "bg-emerald-600 text-white hover:bg-emerald-700"
            }`}
          >
            Approve Selected
            {selectedCompanies.length > 0 && ` (${selectedCompanies.length})`}
          </button>

          <button
            type="button"
            onClick={openBulkRejectModal}
            disabled={selectedCompanies.length === 0}
            className={`h-10 px-4 rounded-lg text-xs font-semibold transition ${
              selectedCompanies.length === 0
                ? darkMode
                  ? "bg-slate-800 text-slate-600 cursor-not-allowed"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
                : "bg-red-600 text-white hover:bg-red-700"
            }`}
          >
            Reject Selected
            {selectedCompanies.length > 0 && ` (${selectedCompanies.length})`}
          </button>
        </div>
      </div>

      {/* =====================================================
          TABLE
      ===================================================== */}

      <div className={`border rounded-xl overflow-hidden ${panel}`}>
        <div
          className={`px-4 py-3 border-b flex items-center justify-between ${border}`}
        >
          <div>
            <h2 className={`text-sm font-bold ${heading}`}>
              Registered Companies
            </h2>

            <p className={`text-[10px] mt-0.5 ${muted}`}>
              {filteredCompanies.length} companies found
            </p>
          </div>

          {selectedCompanies.length > 0 && (
            <span
              className={`text-[10px] font-semibold px-2 py-1 rounded ${
                darkMode
                  ? "bg-blue-900/40 text-blue-300"
                  : "bg-blue-50 text-blue-600"
              }`}
            >
              {selectedCompanies.length} selected
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] border-collapse">
            <thead>
              <tr className={darkMode ? "bg-slate-800" : "bg-slate-50"}>
                <th className={`w-12 px-3 py-3 border-b text-center ${border}`}>
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={toggleSelectAll}
                    className="cursor-pointer"
                    aria-label="Select pending companies"
                  />
                </th>

                <th
                  className={`px-3 py-3 border-b text-left text-[10px] font-bold uppercase tracking-wide ${border} ${
                    darkMode ? "text-slate-300" : "text-slate-600"
                  }`}
                >
                  Company
                </th>

                <th
                  className={`px-3 py-3 border-b text-left text-[10px] font-bold uppercase tracking-wide ${border} ${
                    darkMode ? "text-slate-300" : "text-slate-600"
                  }`}
                >
                  Contact
                </th>

                <th
                  className={`px-3 py-3 border-b text-left text-[10px] font-bold uppercase tracking-wide ${border} ${
                    darkMode ? "text-slate-300" : "text-slate-600"
                  }`}
                >
                  Industry
                </th>

                <th
                  className={`px-3 py-3 border-b text-center text-[10px] font-bold uppercase tracking-wide ${border} ${
                    darkMode ? "text-slate-300" : "text-slate-600"
                  }`}
                >
                  Status
                </th>

                <th
                  className={`px-3 py-3 border-b text-center text-[10px] font-bold uppercase tracking-wide ${border} ${
                    darkMode ? "text-slate-300" : "text-slate-600"
                  }`}
                >
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredCompanies.length > 0 ? (
                filteredCompanies.map((company) => {
                  const isSelected = selectedCompanies.includes(company.id);

                  return (
                    <tr
                      key={company.id}
                      className={`transition ${
                        darkMode ? "hover:bg-slate-800/70" : "hover:bg-slate-50"
                      }`}
                    >
                      {/* CHECKBOX */}

                      <td
                        className={`px-3 py-3 border-b text-center ${border}`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={company.status !== "Pending Review"}
                          onChange={() => toggleCompanySelection(company.id)}
                          className={`${
                            company.status === "Pending Review"
                              ? "cursor-pointer"
                              : "cursor-not-allowed opacity-40"
                          }`}
                          aria-label={`Select ${company.company}`}
                        />
                      </td>

                      {/* COMPANY */}

                      <td className={`px-3 py-3 border-b ${border}`}>
                        <div>
                          <p className={`text-xs font-semibold ${heading}`}>
                            {company.company}
                          </p>

                          <p className={`text-[10px] mt-0.5 ${muted}`}>
                            Submitted {company.submittedAt}
                          </p>
                        </div>
                      </td>

                      {/* CONTACT */}

                      <td className={`px-3 py-3 border-b ${border}`}>
                        <p
                          className={`text-xs ${
                            darkMode ? "text-slate-300" : "text-slate-700"
                          }`}
                        >
                          {company.contact}
                        </p>

                        <p className={`text-[10px] mt-0.5 ${muted}`}>
                          {company.email}
                        </p>
                      </td>

                      {/* INDUSTRY */}

                      <td
                        className={`px-3 py-3 border-b text-xs ${
                          darkMode
                            ? "border-slate-700 text-slate-300"
                            : "border-slate-200 text-slate-600"
                        }`}
                      >
                        {company.industry}
                      </td>

                      {/* STATUS */}

                      <td
                        className={`px-3 py-3 border-b text-center ${border}`}
                      >
                        <span
                          className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusStyle(
                            company.status
                          )}`}
                        >
                          {company.status}
                        </span>
                      </td>

                      {/* ACTION */}

                      <td
                        className={`px-3 py-3 border-b text-center ${border}`}
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedCompany(company)}
                          className={`px-3 py-1.5 rounded-lg border text-[10px] font-semibold transition ${
                            darkMode
                              ? "border-slate-600 text-slate-300 hover:bg-slate-800"
                              : "border-slate-300 text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className={`px-4 py-12 text-center ${muted}`}>
                    <div className="text-2xl mb-2">🏢</div>

                    <p className="text-sm font-semibold">No companies found</p>

                    <p className="text-xs mt-1">
                      Try changing your search or filter.
                    </p>
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

      <div className={`mt-3 text-[10px] ${muted}`}>
        Showing {filteredCompanies.length} of {companies.length} registered
        companies
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
            {/* MODAL HEADER */}

            <div className={`p-5 border-b ${border}`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p
                    className={`text-[10px] uppercase tracking-widest font-bold ${muted}`}
                  >
                    Company Registration Review
                  </p>

                  <h2 className={`text-xl font-black mt-1 ${heading}`}>
                    {selectedCompany.company}
                  </h2>

                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className={`px-2.5 py-1 rounded-full border text-[10px] font-bold ${getStatusStyle(
                        selectedCompany.status
                      )}`}
                    >
                      {selectedCompany.status}
                    </span>

                    <span className={`text-[10px] ${muted}`}>
                      Company ID: {selectedCompany.id}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedCompany(null)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg ${
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

            {/* MODAL CONTENT */}

            <div className="p-5 space-y-6">
              {/* COMPANY DETAILS */}

              <section>
                <h3 className={`text-sm font-bold ${heading}`}>
                  Registration Information
                </h3>

                <div className="grid sm:grid-cols-2 gap-4 mt-3">
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
                      {selectedCompany.industry}
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
                      {selectedCompany.designation}
                    </p>
                  </div>

                  <div>
                    <p className={`text-[10px] uppercase font-bold ${muted}`}>
                      Email Address
                    </p>

                    <p className={`text-sm font-medium mt-1 ${heading}`}>
                      {selectedCompany.email}
                    </p>
                  </div>

                  <div>
                    <p className={`text-[10px] uppercase font-bold ${muted}`}>
                      Phone Number
                    </p>

                    <p className={`text-sm font-medium mt-1 ${heading}`}>
                      {selectedCompany.phone}
                    </p>
                  </div>
                </div>
              </section>

              {/* DOCUMENTS */}

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
                  {selectedCompany.documents?.map((document, index) => (
                    <div
                      key={index}
                      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 rounded-xl border ${border}`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                            darkMode ? "bg-slate-800" : "bg-slate-100"
                          }`}
                        >
                          📄
                        </div>

                        <div>
                          <p className={`text-xs font-semibold ${heading}`}>
                            {document.type}
                          </p>

                          <p className={`text-[10px] mt-0.5 ${muted}`}>
                            {document.fileName}
                          </p>
                        </div>
                      </div>

                      <a
                        href={document.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-semibold text-center transition"
                      >
                        View File
                      </a>
                    </div>
                  ))}
                </div>
              </section>

              {/* REJECTION REASON */}

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

                    {selectedCompany.rejectionEmailSent && (
                      <p
                        className={`text-[10px] mt-2 ${
                          darkMode ? "text-red-300" : "text-red-600"
                        }`}
                      >
                        📧 Rejection notification sent to{" "}
                        {selectedCompany.email}
                        {selectedCompany.rejectionEmailSentAt
                          ? ` on ${selectedCompany.rejectionEmailSentAt}`
                          : "."}
                      </p>
                    )}
                  </section>
                )}

              {/* REJECTION HISTORY */}

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

              {/* NOTIFICATION STATUS */}

              <section
                className={`rounded-xl border p-4 ${
                  darkMode
                    ? "bg-slate-800/50 border-slate-700"
                    : "bg-slate-50 border-slate-200"
                }`}
              >
                <p className={`text-[10px] uppercase font-bold ${muted}`}>
                  Registration Notifications
                </p>

                <div className="grid sm:grid-cols-2 gap-3 mt-3">
                  {/* REJECTION EMAIL */}

                  <div
                    className={`rounded-lg border p-3 ${
                      darkMode ? "border-slate-700" : "border-slate-200"
                    }`}
                  >
                    <p className={`text-xs font-semibold ${heading}`}>
                      Rejection Email
                    </p>

                    <p className="text-[10px] mt-1">
                      <span
                        className={
                          selectedCompany.rejectionEmailSent
                            ? "text-emerald-500"
                            : muted
                        }
                      >
                        {selectedCompany.rejectionEmailSent
                          ? "✓ Sent"
                          : "Not sent"}
                      </span>
                    </p>

                    {selectedCompany.rejectionEmailSentAt && (
                      <p className={`text-[10px] mt-1 ${muted}`}>
                        {selectedCompany.rejectionEmailSentAt}
                      </p>
                    )}
                  </div>

                  {/* REOPEN EMAIL */}

                  <div
                    className={`rounded-lg border p-3 ${
                      darkMode ? "border-slate-700" : "border-slate-200"
                    }`}
                  >
                    <p className={`text-xs font-semibold ${heading}`}>
                      Reopen Notification
                    </p>

                    <p className="text-[10px] mt-1">
                      <span
                        className={
                          selectedCompany.reopenEmailSent
                            ? "text-emerald-500"
                            : muted
                        }
                      >
                        {selectedCompany.reopenEmailSent
                          ? "✓ Sent"
                          : "Not sent"}
                      </span>
                    </p>

                    {selectedCompany.reopenEmailSentAt && (
                      <p className={`text-[10px] mt-1 ${muted}`}>
                        {selectedCompany.reopenEmailSentAt}
                      </p>
                    )}
                  </div>
                </div>
              </section>

              {/* EMAIL STATUS */}

              <section
                className={`rounded-xl border p-4 ${
                  darkMode
                    ? "bg-slate-800/50 border-slate-700"
                    : "bg-slate-50 border-slate-200"
                }`}
              >
                <p className={`text-[10px] uppercase font-bold ${muted}`}>
                  Account Verification
                </p>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-2">
                  <div>
                    <p className={`text-xs font-semibold ${heading}`}>
                      Email Verification
                    </p>

                    <p className={`text-[10px] mt-0.5 ${muted}`}>
                      Approval and email verification are separate steps.
                    </p>
                  </div>

                  <span
                    className={`text-[10px] font-bold ${
                      selectedCompany.emailVerified
                        ? "text-emerald-500"
                        : "text-amber-500"
                    }`}
                  >
                    {selectedCompany.emailVerified
                      ? "Email Verified"
                      : "Not Yet Verified"}
                  </span>
                </div>
              </section>
            </div>

            {/* MODAL ACTIONS */}

            <div className={`p-5 border-t ${border}`}>
              {selectedCompany.status === "Pending Review" && (
                <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                  <button
                    type="button"
                    onClick={() => openRejectModal(selectedCompany)}
                    className={`px-4 py-2.5 rounded-lg border text-xs font-semibold transition ${
                      darkMode
                        ? "border-red-800 text-red-400 hover:bg-red-950/40"
                        : "border-red-200 text-red-600 hover:bg-red-50"
                    }`}
                  >
                    Reject Registration
                  </button>

                  <button
                    type="button"
                    onClick={() => approveCompany(selectedCompany.id)}
                    className="px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition"
                  >
                    Approve Company
                  </button>
                </div>
              )}

              {selectedCompany.status === "Rejected" && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => reopenCompany(selectedCompany.id)}
                    className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition"
                  >
                    Reopen for Review & Notify
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          BULK REJECT MODAL
      ===================================================== */}

      {showBulkRejectModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setShowBulkRejectModal(false);
              setBulkRejectReason("");
            }}
          />

          <div
            className={`relative w-full max-w-lg rounded-2xl border shadow-2xl ${panel}`}
          >
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
                    Reject Selected Companies
                  </h2>

                  <p className={`text-xs mt-1 ${muted}`}>
                    You are about to reject {selectedCompanies.length} selected
                    registration{selectedCompanies.length === 1 ? "" : "s"}.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div
                className={`rounded-xl border p-4 ${
                  darkMode
                    ? "bg-red-950/20 border-red-900/50"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <p className={`text-xs font-semibold ${heading}`}>
                  Selected registrations
                </p>
                <p className={`text-[10px] mt-1 ${muted}`}>
                  All selected companies with Pending Review status will be
                  rejected using the same reason.
                </p>
              </div>

              <div>
                <label
                  className={`block text-xs font-semibold mb-2 ${heading}`}
                >
                  Rejection Reason
                </label>

                <textarea
                  rows="5"
                  maxLength={500}
                  value={bulkRejectReason}
                  onChange={(e) => setBulkRejectReason(e.target.value)}
                  placeholder="Example: The submitted business documents could not be verified. Please submit valid and readable copies."
                  className={`w-full border rounded-xl px-4 py-3 text-sm resize-none outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 ${
                    darkMode
                      ? "bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                      : "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
                  }`}
                />

                <div className="flex justify-between mt-1">
                  <p className={`text-[10px] ${muted}`}>
                    This reason will be included in the rejection notification.
                  </p>

                  <p className={`text-[10px] ${muted}`}>
                    {bulkRejectReason.length}/500
                  </p>
                </div>
              </div>

              <div
                className={`flex items-start gap-3 rounded-xl border p-3 ${
                  darkMode
                    ? "bg-slate-800/50 border-slate-700"
                    : "bg-slate-50 border-slate-200"
                }`}
              >
                <span className="text-sm">📧</span>
                <div>
                  <p className={`text-xs font-semibold ${heading}`}>
                    Companies will be notified
                  </p>
                  <p className={`text-[10px] mt-0.5 ${muted}`}>
                    Each selected company representative will receive the
                    rejection notification using this reason.
                  </p>
                </div>
              </div>
            </div>

            <div className={`p-5 border-t ${border}`}>
              <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowBulkRejectModal(false);
                    setBulkRejectReason("");
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
                  onClick={rejectSelected}
                  disabled={!bulkRejectReason.trim()}
                  className={`px-4 py-2.5 rounded-lg text-xs font-semibold text-white transition ${
                    !bulkRejectReason.trim()
                      ? "bg-red-300 cursor-not-allowed"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  Reject Selected & Notify
                </button>
              </div>
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
            onClick={() => setShowRejectModal(false)}
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
                    This will reject the company's registration and notify the
                    representative by email.
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

              {/* EMAIL */}

              <div
                className={`rounded-xl border p-4 ${
                  darkMode
                    ? "bg-blue-950/20 border-blue-900/50"
                    : "bg-blue-50 border-blue-100"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p
                      className={`text-[10px] uppercase tracking-wide font-bold ${muted}`}
                    >
                      Notification Email
                    </p>

                    <p
                      className={`text-xs font-semibold mt-1 ${
                        darkMode ? "text-blue-300" : "text-blue-700"
                      }`}
                    >
                      {selectedCompany.email}
                    </p>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                      darkMode
                        ? "bg-blue-900/40 text-blue-300"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    EMAIL
                  </span>
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
                    This message will be included in the rejection email.
                  </p>

                  <p className={`text-[10px] ${muted}`}>
                    {rejectReason.length}/500
                  </p>
                </div>
              </div>

              {/* EMAIL NOTICE */}

              <div
                className={`flex items-start gap-3 rounded-xl border p-3 ${
                  darkMode
                    ? "bg-slate-800/50 border-slate-700"
                    : "bg-slate-50 border-slate-200"
                }`}
              >
                <span className="text-sm">📧</span>

                <div>
                  <p className={`text-xs font-semibold ${heading}`}>
                    Company will be notified
                  </p>

                  <p className={`text-[10px] mt-0.5 ${muted}`}>
                    The rejection reason will be sent to{" "}
                    <span className="font-semibold">
                      {selectedCompany.email}
                    </span>
                    .
                  </p>
                </div>
              </div>
            </div>

            {/* ACTIONS */}

            <div className={`p-5 border-t ${border}`}>
              <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                <button
                  type="button"
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
                  disabled={!rejectReason.trim()}
                  className={`px-4 py-2.5 rounded-lg text-xs font-semibold text-white transition ${
                    !rejectReason.trim()
                      ? "bg-red-300 cursor-not-allowed"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  Reject & Notify Company
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
