import React, { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";

// Temporary page-local demo data. This page intentionally has no mockStore dependency.
const localState = {
  "informationItems": [
    {
      "id": "INFO-001",
      "title": "Internship Guidelines",
      "category": "Guidelines",
      "description": "Important guidelines and requirements that students should follow during their internship.",
      "content": "Review the internship guidelines before beginning your internship. This includes requirements, responsibilities, and important procedures.",
      "status": "Published",
      "createdAt": "2026-08-01T09:00:00.000Z",
      "updatedAt": "2026-08-01T09:00:00.000Z"
    },
    {
      "id": "INFO-002",
      "title": "Internship Requirements",
      "category": "Requirements",
      "description": "Complete list of requirements that must be submitted before starting your internship.",
      "content": "Students are required to complete and submit all necessary documents before their internship can officially begin.",
      "status": "Published",
      "createdAt": "2026-08-01T09:00:00.000Z",
      "updatedAt": "2026-08-01T09:00:00.000Z"
    },
    {
      "id": "INFO-003",
      "title": "Application Process",
      "category": "Application",
      "description": "Learn how to apply for an internship and track your application status.",
      "content": "Choose a company, select your preferred position, provide your availability, and submit your internship application.",
      "status": "Published",
      "createdAt": "2026-08-01T09:00:00.000Z",
      "updatedAt": "2026-08-01T09:00:00.000Z"
    },
    {
      "id": "INFO-004",
      "title": "Document Submission",
      "category": "Documents",
      "description": "Information about the documents required for your internship application.",
      "content": "Students must submit the required internship documents through the Document Submission section of the portal.",
      "status": "Published",
      "createdAt": "2026-08-01T09:00:00.000Z",
      "updatedAt": "2026-08-01T09:00:00.000Z"
    },
    {
      "id": "INFO-005",
      "title": "Internship Policies",
      "category": "Policies",
      "description": "Important policies and rules that students must observe during their internship.",
      "content": "Students are expected to follow the policies of both the institution and their assigned internship company.",
      "status": "Published",
      "createdAt": "2026-08-01T09:00:00.000Z",
      "updatedAt": "2026-08-01T09:00:00.000Z"
    },
    {
      "id": "INFO-006",
      "title": "Frequently Asked Questions",
      "category": "FAQ",
      "description": "Answers to common questions about the internship process and requirements.",
      "content": "Find answers to commonly asked questions regarding applications, documents, internship requirements, and other procedures.",
      "status": "Published",
      "createdAt": "2026-08-01T09:00:00.000Z",
      "updatedAt": "2026-08-01T09:00:00.000Z"
    }
  ]
};


const Info = () => {
  const { darkMode } = useOutletContext();
  const state = localState;

  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [selectedInfo, setSelectedInfo] = useState(null);

  // =========================================
  // THEME CLASSES
  // =========================================

  const cardClass = darkMode
    ? "bg-slate-900 border-slate-700"
    : "bg-white border-slate-200";

  const headingClass = darkMode ? "text-slate-100" : "text-slate-900";

  const mutedClass = darkMode ? "text-slate-400" : "text-slate-500";

  const inputClass = darkMode
    ? "bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-500 focus:border-slate-500 focus:ring-slate-700"
    : "bg-white border-slate-300 text-slate-800 placeholder:text-slate-400 focus:border-slate-800 focus:ring-slate-100";

  // =========================================
  // INFORMATION DATA
  // =========================================
  // Student Portal now reads information managed
  // by Admin Portal > Information Management.
  //
  // Only published information should be shown.
  // =========================================

  const informationItems = useMemo(() => {
    return (state.informationItems || []).filter(
      (item) => item.status === "Published"
    );
  }, [state.informationItems]);

  // =========================================
  // CATEGORIES
  // =========================================

  const categories = useMemo(() => {
    const uniqueCategories = [
      ...new Set(
        informationItems
          .map((item) => item.category)
          .filter(Boolean)
      ),
    ];

    return ["All", ...uniqueCategories];
  }, [informationItems]);

  // =========================================
  // FILTER INFORMATION
  // =========================================

  const filteredInformation = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return informationItems.filter((item) => {
      const matchesSearch =
        item.title?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.content?.toLowerCase().includes(query);

      const matchesCategory =
        category === "All" || item.category === category;

      return matchesSearch && matchesCategory;
    });
  }, [informationItems, searchQuery, category]);

  // =========================================
  // VIEW DETAILS
  // =========================================

  const handleViewDetails = (item) => {
    setSelectedInfo(item);
  };

  const closeDetails = () => {
    setSelectedInfo(null);
  };

  // =========================================
  // CLEAR FILTERS
  // =========================================

  const clearFilters = () => {
    setSearchQuery("");
    setCategory("All");
  };

  // =========================================
  // RENDER
  // =========================================

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
          Internship Information
        </h1>

        <p className={`text-sm mt-1 ${mutedClass}`}>
          Browse important information and resources about your internship.
        </p>
      </div>

      {/* =========================================
          SEARCH & FILTER
      ========================================= */}

      <div className="flex flex-col md:flex-row gap-3 mb-6">
        {/* SEARCH */}

        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search information..."
            className={`w-full h-11 px-4 pr-10 rounded-xl border text-sm outline-none transition focus:ring-2 ${inputClass}`}
          />

          <span
            className={`absolute right-4 top-1/2 -translate-y-1/2 text-sm ${
              darkMode ? "text-slate-500" : "text-slate-400"
            }`}
          >
            ⌕
          </span>
        </div>

        {/* CATEGORY */}

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={`h-11 md:w-48 px-4 rounded-xl border text-sm outline-none transition focus:ring-2 ${inputClass}`}
        >
          {categories.map((item) => (
            <option
              key={item}
              value={item}
              className={
                darkMode
                  ? "bg-slate-800 text-slate-100"
                  : "bg-white text-slate-900"
              }
            >
              {item === "All" ? "Category" : item}
            </option>
          ))}
        </select>

        {/* CLEAR FILTER */}

        <button
          type="button"
          onClick={clearFilters}
          className={`h-11 px-5 rounded-xl border text-xs font-bold transition ${
            darkMode
              ? "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
              : "border-slate-300 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          Clear Filter
        </button>
      </div>

      {/* =========================================
          RESULT COUNT
      ========================================= */}

      <div className="flex items-center justify-between mb-4">
        <p className={`text-xs font-semibold ${mutedClass}`}>
          {filteredInformation.length}{" "}
          {filteredInformation.length === 1
            ? "information item"
            : "information items"}
        </p>

        {category !== "All" && (
          <span className={`text-xs font-semibold ${mutedClass}`}>
            Category: {category}
          </span>
        )}
      </div>

      {/* =========================================
          INFORMATION GRID
      ========================================= */}

      {filteredInformation.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredInformation.map((item) => (
            <article
              key={item.id}
              className={`${cardClass} rounded-xl overflow-hidden border transition-all duration-200 ${
                darkMode
                  ? "hover:border-slate-500 hover:shadow-lg"
                  : "hover:border-slate-500 hover:shadow-md"
              }`}
            >
              {/* =====================================
                  IMAGE / THUMBNAIL
              ===================================== */}

              <div
                className={`h-40 border-b flex items-center justify-center ${
                  darkMode
                    ? "bg-slate-800 border-slate-700"
                    : "bg-slate-100 border-slate-200"
                }`}
              >
                <div className="w-full h-full flex items-center justify-center relative">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div
                      className={`w-[78%] h-[72%] rounded-lg border flex items-center justify-center ${
                        darkMode
                          ? "border-slate-600 bg-slate-700"
                          : "border-slate-300 bg-slate-200"
                      }`}
                    >
                      <span
                        className={`text-4xl ${
                          darkMode ? "text-slate-500" : "text-slate-400"
                        }`}
                      >
                        ▧
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* =====================================
                  CARD CONTENT
              ===================================== */}

              <div className="p-4">
                {/* CATEGORY */}

                <div className="mb-2">
                  <span
                    className={`inline-flex px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide ${
                      darkMode
                        ? "bg-slate-800 text-slate-400"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {item.category || "General"}
                  </span>
                </div>

                {/* TITLE */}

                <h2 className={`text-sm font-bold mb-2 ${headingClass}`}>
                  {item.title}
                </h2>

                {/* DESCRIPTION */}

                <p
                  className={`text-xs leading-relaxed line-clamp-2 min-h-[36px] ${mutedClass}`}
                >
                  {item.description || "No description available."}
                </p>

                {/* BUTTON */}

                <button
                  type="button"
                  onClick={() => handleViewDetails(item)}
                  className={`w-full mt-4 h-9 rounded-lg text-white text-xs font-bold transition ${
                    darkMode
                      ? "bg-slate-700 hover:bg-slate-600"
                      : "bg-slate-800 hover:bg-slate-700"
                  }`}
                >
                  View Details
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        /* =========================================
           NO RESULTS
        ========================================= */

        <div className={`border rounded-xl py-16 text-center ${cardClass}`}>
          <div
            className={`text-3xl mb-3 ${
              darkMode ? "text-slate-600" : "text-slate-300"
            }`}
          >
            ⌕
          </div>

          <h2 className={`text-sm font-bold ${headingClass}`}>
            No information found
          </h2>

          <p className={`text-xs mt-1 ${mutedClass}`}>
            {informationItems.length === 0
              ? "There is currently no published internship information."
              : "Try changing your search or category filter."}
          </p>

          {(searchQuery || category !== "All") && (
            <button
              type="button"
              onClick={clearFilters}
              className={`mt-4 px-5 py-2.5 rounded-lg text-white text-xs font-bold transition ${
                darkMode
                  ? "bg-slate-700 hover:bg-slate-600"
                  : "bg-slate-800 hover:bg-slate-700"
              }`}
            >
              Reset Filters
            </button>
          )}
        </div>
      )}

      {/* =========================================
          DETAILS MODAL
      ========================================= */}

      {selectedInfo && (
        <div
          className={`fixed inset-0 z-50 backdrop-blur-sm flex items-center justify-center p-5 ${
            darkMode ? "bg-black/60" : "bg-slate-900/40"
          }`}
          onClick={closeDetails}
        >
          <div
            className={`w-full max-w-2xl rounded-2xl shadow-2xl border overflow-hidden ${cardClass}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* MODAL HEADER */}

            <div
              className={`px-6 py-5 border-b flex items-start justify-between gap-4 ${
                darkMode ? "border-slate-700" : "border-slate-100"
              }`}
            >
              <div>
                <span
                  className={`inline-flex px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide mb-2 ${
                    darkMode
                      ? "bg-slate-800 text-slate-400"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {selectedInfo.category || "General"}
                </span>

                <h2 className={`text-lg font-bold ${headingClass}`}>
                  {selectedInfo.title}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeDetails}
                className={`w-9 h-9 rounded-lg transition flex items-center justify-center ${
                  darkMode
                    ? "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900"
                }`}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* MODAL BODY */}

            <div className="p-6">
              {/* IMAGE */}

              <div
                className={`h-44 rounded-xl flex items-center justify-center mb-5 border overflow-hidden ${
                  darkMode
                    ? "bg-slate-800 border-slate-700"
                    : "bg-slate-100 border-slate-200"
                }`}
              >
                {selectedInfo.imageUrl ? (
                  <img
                    src={selectedInfo.imageUrl}
                    alt={selectedInfo.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span
                    className={`text-5xl ${
                      darkMode ? "text-slate-600" : "text-slate-300"
                    }`}
                  >
                    ▧
                  </span>
                )}
              </div>

              {/* OVERVIEW */}

              <p
                className={`text-sm font-semibold mb-2 ${
                  darkMode ? "text-slate-200" : "text-slate-800"
                }`}
              >
                Overview
              </p>

              <p
                className={`text-sm leading-relaxed ${
                  darkMode ? "text-slate-400" : "text-slate-500"
                }`}
              >
                {selectedInfo.content ||
                  selectedInfo.description ||
                  "No additional information available."}
              </p>

              {/* ADDITIONAL INFORMATION */}

              <div
                className={`mt-5 p-4 rounded-xl border ${
                  darkMode
                    ? "bg-slate-800 border-slate-700"
                    : "bg-slate-50 border-slate-200"
                }`}
              >
                <p
                  className={`text-xs font-bold mb-1 ${
                    darkMode ? "text-slate-200" : "text-slate-700"
                  }`}
                >
                  Information
                </p>

                <p
                  className={`text-xs leading-relaxed ${
                    darkMode ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  Please review this information carefully and make sure you
                  understand the applicable internship procedures and
                  requirements.
                </p>
              </div>
            </div>

            {/* MODAL FOOTER */}

            <div
              className={`px-6 py-4 border-t flex justify-end ${
                darkMode ? "border-slate-700" : "border-slate-100"
              }`}
            >
              <button
                type="button"
                onClick={closeDetails}
                className={`px-5 py-2.5 rounded-lg text-white text-xs font-bold transition ${
                  darkMode
                    ? "bg-slate-700 hover:bg-slate-600"
                    : "bg-slate-800 hover:bg-slate-700"
                }`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Info;

