import React, { useMemo, useState } from "react";

const Info = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [selectedInfo, setSelectedInfo] = useState(null);

  // =========================================
  // INTERNSHIP INFORMATION
  // =========================================

  const informationItems = [
    {
      id: 1,
      title: "Internship Guidelines",
      category: "Guidelines",
      description:
        "Important guidelines and requirements that students should follow during their internship.",
      content:
        "Review the internship guidelines before beginning your internship. This includes requirements, responsibilities, and important procedures.",
    },
    {
      id: 2,
      title: "Internship Requirements",
      category: "Requirements",
      description:
        "Complete list of requirements that must be submitted before starting your internship.",
      content:
        "Students are required to complete and submit all necessary documents before their internship can officially begin.",
    },
    {
      id: 3,
      title: "Application Process",
      category: "Application",
      description:
        "Learn how to apply for an internship and track your application status.",
      content:
        "Choose a company, select your preferred position, provide your availability, and submit your internship application.",
    },
    {
      id: 4,
      title: "Document Submission",
      category: "Documents",
      description:
        "Information about the documents required for your internship application.",
      content:
        "Students must submit the required internship documents through the Document Submission section of the portal.",
    },
    {
      id: 5,
      title: "Internship Policies",
      category: "Policies",
      description:
        "Important policies and rules that students must observe during their internship.",
      content:
        "Students are expected to follow the policies of both the institution and their assigned internship company.",
    },
    {
      id: 6,
      title: "Frequently Asked Questions",
      category: "FAQ",
      description:
        "Answers to common questions about the internship process and requirements.",
      content:
        "Find answers to commonly asked questions regarding applications, documents, internship requirements, and other procedures.",
    },
  ];

  // =========================================
  // CATEGORIES
  // =========================================

  const categories = [
    "All",
    "Guidelines",
    "Requirements",
    "Application",
    "Documents",
    "Policies",
    "FAQ",
  ];

  // =========================================
  // FILTER INFORMATION
  // =========================================

  const filteredInformation = useMemo(() => {
    return informationItems.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = category === "All" || item.category === category;

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, category]);

  // =========================================
  // VIEW DETAILS
  // =========================================

  const handleViewDetails = (item) => {
    setSelectedInfo(item);
  };

  const closeDetails = () => {
    setSelectedInfo(null);
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
          Internship Information
        </h1>

        <p className="text-sm text-slate-500 mt-1">
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
            placeholder="Search..."
            className="w-full h-11 px-4 pr-10 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 outline-none transition focus:border-slate-800 focus:ring-2 focus:ring-slate-100"
          />

          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
            ⌕
          </span>
        </div>

        {/* CATEGORY */}

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="h-11 md:w-48 px-4 bg-white border border-slate-300 rounded-xl text-sm text-slate-700 outline-none transition focus:border-slate-800 focus:ring-2 focus:ring-slate-100"
        >
          {categories.map((item) => (
            <option key={item} value={item}>
              {item === "All" ? "Category" : item}
            </option>
          ))}
        </select>

        {/* FILTER BUTTON */}

        <button
          type="button"
          onClick={() => {
            setSearchQuery("");
            setCategory("All");
          }}
          className="h-11 px-5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
        >
          Clear Filter
        </button>
      </div>

      {/* =========================================
          RESULT COUNT
      ========================================= */}

      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold text-slate-400">
          {filteredInformation.length}{" "}
          {filteredInformation.length === 1
            ? "information item"
            : "information items"}
        </p>

        {category !== "All" && (
          <span className="text-xs font-semibold text-slate-500">
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
              className="bg-white border border-slate-300 rounded-xl overflow-hidden transition-all duration-200 hover:border-slate-500 hover:shadow-md"
            >
              {/* =====================================
                  IMAGE / THUMBNAIL
              ===================================== */}

              <div className="h-40 bg-slate-100 border-b border-slate-200 flex items-center justify-center">
                <div className="w-full h-full flex items-center justify-center relative">
                  {/* Placeholder graphic */}

                  <div className="w-[78%] h-[72%] border border-slate-300 bg-slate-200 rounded-lg flex items-center justify-center">
                    <span className="text-4xl text-slate-400">▧</span>
                  </div>
                </div>
              </div>

              {/* =====================================
                  CARD CONTENT
              ===================================== */}

              <div className="p-4">
                {/* CATEGORY */}

                <div className="mb-2">
                  <span className="inline-flex px-2.5 py-1 rounded-md bg-slate-100 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                    {item.category}
                  </span>
                </div>

                {/* TITLE */}

                <h2 className="text-sm font-bold text-slate-900 mb-2">
                  {item.title}
                </h2>

                {/* DESCRIPTION */}

                <p className="text-xs leading-relaxed text-slate-500 line-clamp-2 min-h-[36px]">
                  {item.description}
                </p>

                {/* BUTTON */}

                <button
                  type="button"
                  onClick={() => handleViewDetails(item)}
                  className="w-full mt-4 h-9 rounded-lg bg-slate-800 text-white text-xs font-bold hover:bg-slate-700 transition"
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

        <div className="border border-slate-200 rounded-xl bg-white py-16 text-center">
          <div className="text-3xl text-slate-300 mb-3">⌕</div>

          <h2 className="text-sm font-bold text-slate-800">
            No information found
          </h2>

          <p className="text-xs text-slate-400 mt-1">
            Try changing your search or category filter.
          </p>

          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setCategory("All");
            }}
            className="mt-4 px-5 py-2.5 rounded-lg bg-slate-800 text-white text-xs font-bold hover:bg-slate-700 transition"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* =========================================
          DETAILS MODAL
      ========================================= */}

      {selectedInfo && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-5"
          onClick={closeDetails}
        >
          <div
            className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* MODAL HEADER */}

            <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between gap-4">
              <div>
                <span className="inline-flex px-2.5 py-1 rounded-md bg-slate-100 text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-2">
                  {selectedInfo.category}
                </span>

                <h2 className="text-lg font-bold text-slate-900">
                  {selectedInfo.title}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeDetails}
                className="w-9 h-9 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition flex items-center justify-center"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* MODAL BODY */}

            <div className="p-6">
              {/* IMAGE */}

              <div className="h-44 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center mb-5">
                <span className="text-5xl text-slate-300">▧</span>
              </div>

              <p className="text-sm font-semibold text-slate-800 mb-2">
                Overview
              </p>

              <p className="text-sm text-slate-500 leading-relaxed">
                {selectedInfo.content}
              </p>

              <div className="mt-5 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-xs font-bold text-slate-700 mb-1">
                  Information
                </p>

                <p className="text-xs text-slate-500 leading-relaxed">
                  Please review this information carefully and make sure you
                  understand the applicable internship procedures and
                  requirements.
                </p>
              </div>
            </div>

            {/* MODAL FOOTER */}

            <div className="px-6 py-4 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={closeDetails}
                className="px-5 py-2.5 rounded-lg bg-slate-800 text-white text-xs font-bold hover:bg-slate-700 transition"
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
