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
      industry: "Information Technology",
      status: "Verified",
    },
    {
      id: 2,
      company: "Innovate Labs",
      contact: "Sarah Cruz",
      industry: "Software Development",
      status: "Verified",
    },
    {
      id: 3,
      company: "Bataan Digital Corp.",
      contact: "James Reyes",
      industry: "Technology",
      status: "Verified",
    },
    {
      id: 4,
      company: "Future Systems",
      contact: "Anna Garcia",
      industry: "Information Technology",
      status: "Pending",
    },
    {
      id: 5,
      company: "NextGen Solutions",
      contact: "Michael Tan",
      industry: "Software Development",
      status: "Pending",
    },
    {
      id: 6,
      company: "Digital Works PH",
      contact: "Kevin Ramos",
      industry: "Digital Services",
      status: "Pending",
    },
  ]);

  // =========================================================
  // STATES
  // =========================================================

  const [searchTerm, setSearchTerm] = useState("");

  const [filterStatus, setFilterStatus] = useState("All");

  const [selectedCompanies, setSelectedCompanies] = useState([]);

  // =========================================================
  // FILTERED COMPANIES
  // =========================================================

  const filteredCompanies = useMemo(() => {
    return companies.filter((company) => {
      const search = searchTerm.toLowerCase();

      const matchesSearch =
        company.company.toLowerCase().includes(search) ||
        company.contact.toLowerCase().includes(search) ||
        company.industry.toLowerCase().includes(search);

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
    const filteredIds = filteredCompanies.map((company) => company.id);

    const allSelected = filteredIds.every((id) =>
      selectedCompanies.includes(id)
    );

    if (allSelected) {
      setSelectedCompanies((prev) =>
        prev.filter((id) => !filteredIds.includes(id))
      );
    } else {
      setSelectedCompanies((prev) => [...new Set([...prev, ...filteredIds])]);
    }
  };

  // =========================================================
  // VERIFY COMPANY
  // =========================================================

  const verifyCompany = (id) => {
    setCompanies((prev) =>
      prev.map((company) =>
        company.id === id
          ? {
              ...company,
              status: "Verified",
            }
          : company
      )
    );

    setSelectedCompanies((prev) =>
      prev.filter((companyId) => companyId !== id)
    );
  };

  // =========================================================
  // VERIFY SELECTED
  // =========================================================

  const verifySelected = () => {
    if (selectedCompanies.length === 0) {
      return;
    }

    setCompanies((prev) =>
      prev.map((company) =>
        selectedCompanies.includes(company.id)
          ? {
              ...company,
              status: "Verified",
            }
          : company
      )
    );

    setSelectedCompanies([]);
  };

  // =========================================================
  // SELECT ALL STATE
  // =========================================================

  const filteredIds = filteredCompanies.map((company) => company.id);

  const isAllSelected =
    filteredIds.length > 0 &&
    filteredIds.every((id) => selectedCompanies.includes(id));

  // =========================================================
  // STATUS STYLE
  // =========================================================

  const getStatusStyle = (status) => {
    if (status === "Verified") {
      return darkMode
        ? "bg-green-900/50 text-green-300 border-green-700"
        : "bg-green-100 text-green-700 border-green-200";
    }

    return darkMode
      ? "bg-orange-900/50 text-orange-300 border-orange-700"
      : "bg-orange-100 text-orange-700 border-orange-200";
  };

  // =========================================================
  // RETURN
  // =========================================================

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <div className="mb-5">
        <h1
          className={`text-lg sm:text-xl font-bold ${
            darkMode ? "text-white" : "text-slate-900"
          }`}
        >
          Company Management
        </h1>

        <p
          className={`text-xs sm:text-sm mt-1 ${
            darkMode ? "text-slate-400" : "text-slate-500"
          }`}
        >
          Manage and verify registered companies.
        </p>
      </div>

      {/* =====================================================
          FILTER / SEARCH BAR
      ===================================================== */}

      <div
        className={`border rounded-lg p-3 sm:p-4 mb-5 ${
          darkMode
            ? "bg-slate-900 border-slate-700"
            : "bg-white border-slate-200"
        }`}
      >
        <div className="flex flex-col lg:flex-row gap-3">
          {/* SEARCH */}

          <div className="flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search company, contact, or industry..."
              className={`w-full h-10 px-3 rounded-md border text-xs sm:text-sm outline-none transition ${
                darkMode
                  ? "bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
                  : "bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-blue-500"
              }`}
            />
          </div>

          {/* FILTER */}

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className={`h-10 px-3 rounded-md border text-xs sm:text-sm outline-none cursor-pointer ${
              darkMode
                ? "bg-slate-800 border-slate-700 text-white"
                : "bg-white border-slate-300 text-slate-700"
            }`}
          >
            <option value="All">All Status</option>
            <option value="Verified">Verified</option>
            <option value="Pending">Pending</option>
          </select>

          {/* VERIFY SELECTED */}

          <button
            type="button"
            onClick={verifySelected}
            disabled={selectedCompanies.length === 0}
            className={`h-10 px-4 rounded-md text-xs sm:text-sm font-semibold transition ${
              selectedCompanies.length === 0
                ? darkMode
                  ? "bg-slate-800 text-slate-600 cursor-not-allowed"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
                : "bg-slate-800 text-white hover:bg-slate-700"
            }`}
          >
            Verify Selected
            {selectedCompanies.length > 0 && ` (${selectedCompanies.length})`}
          </button>
        </div>
      </div>

      {/* =====================================================
          TABLE
      ===================================================== */}

      <div
        className={`border rounded-lg overflow-hidden ${
          darkMode
            ? "bg-slate-900 border-slate-700"
            : "bg-white border-slate-200"
        }`}
      >
        {/* TABLE HEADER */}

        <div
          className={`px-4 py-3 border-b flex items-center justify-between ${
            darkMode ? "border-slate-700" : "border-slate-200"
          }`}
        >
          <div>
            <h2
              className={`text-sm font-bold ${
                darkMode ? "text-white" : "text-slate-900"
              }`}
            >
              Registered Companies
            </h2>

            <p
              className={`text-[10px] mt-0.5 ${
                darkMode ? "text-slate-500" : "text-slate-400"
              }`}
            >
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

        {/* RESPONSIVE TABLE */}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] border-collapse">
            {/* =================================================
                TABLE HEAD
            ================================================= */}

            <thead>
              <tr className={darkMode ? "bg-slate-800" : "bg-slate-50"}>
                {/* CHECKBOX */}

                <th
                  className={`w-12 px-3 py-3 border-b text-center ${
                    darkMode ? "border-slate-700" : "border-slate-200"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={toggleSelectAll}
                    className="cursor-pointer"
                    aria-label="Select all companies"
                  />
                </th>

                {/* COMPANY */}

                <th
                  className={`px-3 py-3 border-b text-left text-[10px] font-bold uppercase tracking-wide ${
                    darkMode
                      ? "border-slate-700 text-slate-300"
                      : "border-slate-200 text-slate-600"
                  }`}
                >
                  Company
                </th>

                {/* CONTACT */}

                <th
                  className={`px-3 py-3 border-b text-left text-[10px] font-bold uppercase tracking-wide ${
                    darkMode
                      ? "border-slate-700 text-slate-300"
                      : "border-slate-200 text-slate-600"
                  }`}
                >
                  Contact
                </th>

                {/* INDUSTRY */}

                <th
                  className={`px-3 py-3 border-b text-left text-[10px] font-bold uppercase tracking-wide ${
                    darkMode
                      ? "border-slate-700 text-slate-300"
                      : "border-slate-200 text-slate-600"
                  }`}
                >
                  Industry
                </th>

                {/* STATUS */}

                <th
                  className={`px-3 py-3 border-b text-center text-[10px] font-bold uppercase tracking-wide ${
                    darkMode
                      ? "border-slate-700 text-slate-300"
                      : "border-slate-200 text-slate-600"
                  }`}
                >
                  Status
                </th>

                {/* ACTION */}

                <th
                  className={`px-3 py-3 border-b text-center text-[10px] font-bold uppercase tracking-wide ${
                    darkMode
                      ? "border-slate-700 text-slate-300"
                      : "border-slate-200 text-slate-600"
                  }`}
                >
                  Action
                </th>
              </tr>
            </thead>

            {/* =================================================
                TABLE BODY
            ================================================= */}

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
                        className={`px-3 py-3 border-b text-center ${
                          darkMode ? "border-slate-700" : "border-slate-200"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleCompanySelection(company.id)}
                          className="cursor-pointer"
                          aria-label={`Select ${company.company}`}
                        />
                      </td>

                      {/* COMPANY */}

                      <td
                        className={`px-3 py-3 border-b ${
                          darkMode ? "border-slate-700" : "border-slate-200"
                        }`}
                      >
                        <div>
                          <p
                            className={`text-xs font-semibold ${
                              darkMode ? "text-white" : "text-slate-900"
                            }`}
                          >
                            {company.company}
                          </p>

                          <p
                            className={`text-[10px] mt-0.5 ${
                              darkMode ? "text-slate-500" : "text-slate-400"
                            }`}
                          >
                            Company ID: {company.id}
                          </p>
                        </div>
                      </td>

                      {/* CONTACT */}

                      <td
                        className={`px-3 py-3 border-b text-xs ${
                          darkMode
                            ? "border-slate-700 text-slate-300"
                            : "border-slate-200 text-slate-600"
                        }`}
                      >
                        {company.contact}
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
                        className={`px-3 py-3 border-b text-center ${
                          darkMode ? "border-slate-700" : "border-slate-200"
                        }`}
                      >
                        <span
                          className={`inline-flex items-center justify-center px-2.5 py-1 rounded text-[10px] font-bold border ${getStatusStyle(
                            company.status
                          )}`}
                        >
                          {company.status}
                        </span>
                      </td>

                      {/* ACTION */}

                      <td
                        className={`px-3 py-3 border-b text-center ${
                          darkMode ? "border-slate-700" : "border-slate-200"
                        }`}
                      >
                        {company.status === "Pending" ? (
                          <button
                            type="button"
                            onClick={() => verifyCompany(company.id)}
                            className="px-4 py-1.5 rounded text-[10px] font-semibold bg-slate-700 text-white hover:bg-slate-600 transition"
                          >
                            Verify
                          </button>
                        ) : (
                          <span
                            className={`text-[10px] ${
                              darkMode ? "text-slate-500" : "text-slate-400"
                            }`}
                          >
                            Verified
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan="6"
                    className={`px-4 py-12 text-center ${
                      darkMode ? "text-slate-500" : "text-slate-400"
                    }`}
                  >
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

      <div
        className={`mt-3 text-[10px] ${
          darkMode ? "text-slate-500" : "text-slate-400"
        }`}
      >
        Showing {filteredCompanies.length} of {companies.length} registered
        companies
      </div>
    </div>
  );
};

export default CompanyManagement;
