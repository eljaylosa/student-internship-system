import React, { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";

const InformationManagement = () => {
  const { darkMode } = useOutletContext();

  // =========================================================
  // INFORMATION DATA
  // =========================================================

  const [informationItems, setInformationItems] = useState([
    {
      id: 1,
      title: "Internship Guidelines",
      category: "Guidelines",
      description:
        "Important guidelines and requirements that students should follow during their internship.",
      content:
        "Students must follow all university and company internship guidelines throughout their internship period. Review the required procedures, responsibilities, attendance policies, and reporting requirements before starting.",
      status: "Published",
      updatedAt: "August 18, 2026",
    },
    {
      id: 2,
      title: "Internship Requirements",
      category: "Requirements",
      description:
        "Complete list of requirements that must be submitted before starting an internship.",
      content:
        "Students are required to complete and submit all necessary documents before their internship can officially begin. Make sure all requirements are complete and properly approved.",
      status: "Published",
      updatedAt: "August 17, 2026",
    },
    {
      id: 3,
      title: "Application Process",
      category: "Application",
      description:
        "Learn how to apply for an internship and track your application status.",
      content:
        "Students should select an appropriate company and internship position, submit their application, and monitor their application status through the Student Portal.",
      status: "Published",
      updatedAt: "August 15, 2026",
    },
    {
      id: 4,
      title: "Document Submission",
      category: "Documents",
      description:
        "Information about the documents required for the internship process.",
      content:
        "Students must submit all required internship documents through the Document Submission section. Documents must follow the required format and should be submitted before the specified deadlines.",
      status: "Published",
      updatedAt: "August 14, 2026",
    },
    {
      id: 5,
      title: "Internship Policies",
      category: "Policies",
      description:
        "Important policies and rules students must observe during their internship.",
      content:
        "Students are expected to follow the policies of both the institution and their assigned internship company. Failure to follow applicable policies may affect the student's internship status.",
      status: "Published",
      updatedAt: "August 12, 2026",
    },
    {
      id: 6,
      title: "Frequently Asked Questions",
      category: "FAQ",
      description: "Answers to common questions about the internship process.",
      content:
        "This section provides answers to common questions regarding internship applications, document requirements, company placement, internship hours, and completion procedures.",
      status: "Draft",
      updatedAt: "August 10, 2026",
    },
  ]);

  // =========================================================
  // UI STATE
  // =========================================================

  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const [showForm, setShowForm] = useState(false);
  const [selectedInformation, setSelectedInformation] = useState(null);
  const [editingInformation, setEditingInformation] = useState(null);

  const [feedback, setFeedback] = useState("");

  // =========================================================
  // FORM STATE
  // =========================================================

  const emptyForm = {
    title: "",
    category: "Guidelines",
    description: "",
    content: "",
    status: "Draft",
  };

  const [formData, setFormData] = useState(emptyForm);

  // =========================================================
  // CATEGORIES
  // =========================================================

  const categories = [
    "Guidelines",
    "Requirements",
    "Application",
    "Documents",
    "Policies",
    "FAQ",
  ];

  // =========================================================
  // THEME CLASSES
  // =========================================================

  const pageClass = darkMode
    ? "bg-slate-950 text-slate-100"
    : "bg-slate-50 text-slate-900";

  const cardClass = darkMode
    ? "bg-slate-900 border-slate-700"
    : "bg-white border-slate-200";

  const mutedClass = darkMode ? "text-slate-400" : "text-slate-500";

  const inputClass = `w-full h-10 px-3 rounded-lg border text-xs outline-none transition ${
    darkMode
      ? "bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-slate-500"
      : "bg-white border-slate-300 text-slate-800 placeholder:text-slate-400 focus:border-slate-500"
  }`;

  // =========================================================
  // FILTER
  // =========================================================

  const filteredInformation = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return informationItems.filter((item) => {
      const matchesSearch =
        !query ||
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.content.toLowerCase().includes(query);

      const matchesCategory = category === "All" || item.category === category;

      const matchesStatus =
        statusFilter === "All" || item.status === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [informationItems, searchQuery, category, statusFilter]);

  // =========================================================
  // FEEDBACK
  // =========================================================

  const showFeedback = (message) => {
    setFeedback(message);

    setTimeout(() => {
      setFeedback("");
    }, 3000);
  };

  // =========================================================
  // OPEN ADD FORM
  // =========================================================

  const handleAdd = () => {
    setEditingInformation(null);
    setFormData(emptyForm);
    setShowForm(true);
  };

  // =========================================================
  // OPEN EDIT FORM
  // =========================================================

  const handleEdit = (item) => {
    setEditingInformation(item);

    setFormData({
      title: item.title,
      category: item.category,
      description: item.description,
      content: item.content,
      status: item.status,
    });

    setShowForm(true);
  };

  // =========================================================
  // CLOSE FORM
  // =========================================================

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingInformation(null);
    setFormData(emptyForm);
  };

  // =========================================================
  // FORM INPUT
  // =========================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // =========================================================
  // SAVE INFORMATION
  // =========================================================

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      showFeedback("Please enter an information title.");
      return;
    }

    if (!formData.description.trim()) {
      showFeedback("Please enter a description.");
      return;
    }

    if (!formData.content.trim()) {
      showFeedback("Please enter the information content.");
      return;
    }

    // =======================================================
    // EDIT EXISTING
    // =======================================================

    if (editingInformation) {
      setInformationItems((previous) =>
        previous.map((item) =>
          item.id === editingInformation.id
            ? {
                ...item,
                ...formData,
                updatedAt: new Date().toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                }),
              }
            : item
        )
      );

      showFeedback("Information updated successfully.");
    }

    // =======================================================
    // CREATE NEW
    // =======================================================
    else {
      const newInformation = {
        id: Date.now(),
        ...formData,
        updatedAt: new Date().toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        }),
      };

      setInformationItems((previous) => [newInformation, ...previous]);

      showFeedback("Information created successfully.");
    }

    handleCloseForm();
  };

  // =========================================================
  // DELETE
  // =========================================================

  const handleDelete = (item) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${item.title}"?`
    );

    if (!confirmed) return;

    setInformationItems((previous) =>
      previous.filter((information) => information.id !== item.id)
    );

    if (selectedInformation?.id === item.id) {
      setSelectedInformation(null);
    }

    showFeedback("Information deleted successfully.");
  };

  // =========================================================
  // STATUS BADGE
  // =========================================================

  const StatusBadge = ({ status }) => {
    const published = status === "Published";

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
          published
            ? darkMode
              ? "bg-emerald-950/50 text-emerald-300"
              : "bg-emerald-50 text-emerald-700"
            : darkMode
            ? "bg-amber-950/50 text-amber-300"
            : "bg-amber-50 text-amber-700"
        }`}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            published ? "bg-emerald-500" : "bg-amber-500"
          }`}
        />

        {status}
      </span>
    );
  };

  // =========================================================
  // RETURN
  // =========================================================

  return (
    <div
      className={`min-h-[calc(100vh-5rem)] p-5 md:p-6 lg:p-8 transition-colors duration-300 ${pageClass}`}
    >
      <div className="max-w-[1400px] mx-auto">
        {/* ===================================================
            HEADER
        =================================================== */}

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div>
            <p
              className={`text-xs uppercase tracking-widest font-bold mb-1 ${
                darkMode ? "text-slate-500" : "text-slate-400"
              }`}
            >
              Administrator Portal
            </p>

            <h1 className="text-2xl font-black">Information Management</h1>

            <p className={`text-sm mt-1 ${mutedClass}`}>
              Create and manage internship information displayed to students.
            </p>
          </div>

          <button
            type="button"
            onClick={handleAdd}
            className={`h-10 px-5 rounded-lg text-xs font-bold text-white transition ${
              darkMode
                ? "bg-slate-700 hover:bg-slate-600"
                : "bg-slate-800 hover:bg-slate-700"
            }`}
          >
            + Add Information
          </button>
        </div>

        {/* ===================================================
            DEMO NOTICE
        =================================================== */}

        <div
          className={`mb-5 p-3 rounded-lg border text-[10px] leading-relaxed ${
            darkMode
              ? "bg-blue-950/30 border-blue-900 text-blue-300"
              : "bg-blue-50 border-blue-200 text-blue-700"
          }`}
        >
          <p className="font-bold mb-1">ℹ️ Information Management</p>

          <p>
            Information published here will eventually be displayed in the
            Student Portal under Internship Information.
          </p>
        </div>

        {/* ===================================================
            FEEDBACK
        =================================================== */}

        {feedback && (
          <div
            className={`mb-5 px-4 py-3 rounded-lg border text-xs font-semibold ${
              feedback.includes("successfully")
                ? darkMode
                  ? "bg-emerald-950/40 border-emerald-800 text-emerald-300"
                  : "bg-emerald-50 border-emerald-200 text-emerald-700"
                : darkMode
                ? "bg-blue-950/40 border-blue-800 text-blue-300"
                : "bg-blue-50 border-blue-200 text-blue-700"
            }`}
          >
            {feedback}
          </div>
        )}

        {/* ===================================================
            FILTERS
        =================================================== */}

        <div className={`border rounded-xl p-4 mb-5 ${cardClass}`}>
          <div className="flex flex-col lg:flex-row gap-3">
            {/* SEARCH */}

            <div className="flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search information..."
                className={inputClass}
              />
            </div>

            {/* CATEGORY */}

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={`${inputClass} lg:w-48`}
            >
              <option value="All">All Categories</option>

              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            {/* STATUS */}

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`${inputClass} lg:w-40`}
            >
              <option value="All">All Status</option>
              <option value="Published">Published</option>
              <option value="Draft">Draft</option>
            </select>

            {/* CLEAR */}

            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setCategory("All");
                setStatusFilter("All");
              }}
              className={`h-10 px-4 rounded-lg border text-xs font-bold transition ${
                darkMode
                  ? "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700"
                  : "border-slate-300 bg-white text-slate-600 hover:bg-slate-100"
              }`}
            >
              Clear
            </button>
          </div>
        </div>

        {/* ===================================================
            RESULT COUNT
        =================================================== */}

        <div className="flex items-center justify-between mb-4">
          <p className={`text-xs font-semibold ${mutedClass}`}>
            {filteredInformation.length}{" "}
            {filteredInformation.length === 1
              ? "information item"
              : "information items"}
          </p>
        </div>

        {/* ===================================================
            INFORMATION TABLE
        =================================================== */}

        <div className={`border rounded-xl overflow-hidden ${cardClass}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead
                className={
                  darkMode
                    ? "bg-slate-800 text-slate-300"
                    : "bg-slate-100 text-slate-600"
                }
              >
                <tr>
                  <th className="px-4 py-3 font-bold">Information</th>

                  <th className="px-4 py-3 font-bold">Category</th>

                  <th className="px-4 py-3 font-bold">Status</th>

                  <th className="px-4 py-3 font-bold">Last Updated</th>

                  <th className="px-4 py-3 font-bold text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredInformation.map((item) => (
                  <tr
                    key={item.id}
                    className={`border-t transition ${
                      darkMode
                        ? "border-slate-800 hover:bg-slate-800/50"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {/* INFORMATION */}

                    <td className="px-4 py-4 min-w-[280px]">
                      <p className="font-bold">{item.title}</p>

                      <p
                        className={`text-[10px] mt-1 line-clamp-2 max-w-md ${mutedClass}`}
                      >
                        {item.description}
                      </p>
                    </td>

                    {/* CATEGORY */}

                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-md text-[10px] font-bold ${
                          darkMode
                            ? "bg-slate-800 text-slate-400"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {item.category}
                      </span>
                    </td>

                    {/* STATUS */}

                    <td className="px-4 py-4">
                      <StatusBadge status={item.status} />
                    </td>

                    {/* UPDATED */}

                    <td className={`px-4 py-4 whitespace-nowrap ${mutedClass}`}>
                      {item.updatedAt}
                    </td>

                    {/* ACTIONS */}

                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedInformation(item)}
                          className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition ${
                            darkMode
                              ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          View
                        </button>

                        <button
                          type="button"
                          onClick={() => handleEdit(item)}
                          className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition ${
                            darkMode
                              ? "bg-slate-700 text-white hover:bg-slate-600"
                              : "bg-slate-800 text-white hover:bg-slate-700"
                          }`}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(item)}
                          className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition ${
                            darkMode
                              ? "text-red-400 hover:bg-red-950/40"
                              : "text-red-600 hover:bg-red-50"
                          }`}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {/* =================================================
                    NO RESULTS
                ================================================= */}

                {filteredInformation.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-4 py-16 text-center">
                      <div
                        className={`text-3xl mb-3 ${
                          darkMode ? "text-slate-700" : "text-slate-300"
                        }`}
                      >
                        ⌕
                      </div>

                      <p className="text-sm font-bold">No information found</p>

                      <p className={`text-xs mt-1 ${mutedClass}`}>
                        Try changing your search or filters.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* =====================================================
          ADD / EDIT MODAL
      ===================================================== */}

      {showForm && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center p-5 ${
            darkMode ? "bg-black/60" : "bg-slate-900/40"
          }`}
          onClick={handleCloseForm}
        >
          <div
            className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border shadow-2xl ${cardClass}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* MODAL HEADER */}

            <div
              className={`px-6 py-5 border-b flex items-start justify-between ${
                darkMode ? "border-slate-700" : "border-slate-200"
              }`}
            >
              <div>
                <h2 className="text-lg font-bold">
                  {editingInformation ? "Edit Information" : "Add Information"}
                </h2>

                <p className={`text-xs mt-1 ${mutedClass}`}>
                  {editingInformation
                    ? "Update the selected internship information."
                    : "Create information that can be displayed to students."}
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseForm}
                className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  darkMode
                    ? "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
              >
                ×
              </button>
            </div>

            {/* FORM */}

            <form onSubmit={handleSubmit} className="p-6">
              {/* TITLE */}

              <div className="mb-4">
                <label className="block text-xs font-bold mb-1.5">Title</label>

                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g. Internship Guidelines"
                  className={inputClass}
                />
              </div>

              {/* CATEGORY + STATUS */}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-bold mb-1.5">
                    Category
                  </label>

                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className={inputClass}
                  >
                    {categories.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1.5">
                    Status
                  </label>

                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className={inputClass}
                  >
                    <option value="Draft">Draft</option>
                    <option value="Published">Published</option>
                  </select>
                </div>
              </div>

              {/* DESCRIPTION */}

              <div className="mb-4">
                <label className="block text-xs font-bold mb-1.5">
                  Description
                </label>

                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Short description displayed on the information card."
                  className={`${inputClass} h-auto py-2 resize-none`}
                />
              </div>

              {/* CONTENT */}

              <div className="mb-6">
                <label className="block text-xs font-bold mb-1.5">
                  Content
                </label>

                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleChange}
                  rows="8"
                  placeholder="Enter the complete information students should read..."
                  className={`${inputClass} h-auto py-2 resize-y`}
                />

                <p className={`text-[10px] mt-1 ${mutedClass}`}>
                  This is the full content displayed when students select "View
                  Details."
                </p>
              </div>

              {/* ACTIONS */}

              <div
                className={`flex justify-end gap-3 pt-4 border-t ${
                  darkMode ? "border-slate-700" : "border-slate-200"
                }`}
              >
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className={`h-9 px-5 rounded-lg border text-xs font-bold ${
                    darkMode
                      ? "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700"
                      : "border-slate-300 bg-white text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className={`h-9 px-6 rounded-lg text-xs font-bold text-white ${
                    darkMode
                      ? "bg-slate-700 hover:bg-slate-600"
                      : "bg-slate-800 hover:bg-slate-700"
                  }`}
                >
                  {editingInformation ? "Save Changes" : "Create Information"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================
          VIEW MODAL
      ===================================================== */}

      {selectedInformation && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center p-5 ${
            darkMode ? "bg-black/60" : "bg-slate-900/40"
          }`}
          onClick={() => setSelectedInformation(null)}
        >
          <div
            className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border shadow-2xl ${cardClass}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* HEADER */}

            <div
              className={`px-6 py-5 border-b flex items-start justify-between gap-4 ${
                darkMode ? "border-slate-700" : "border-slate-200"
              }`}
            >
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
                      darkMode
                        ? "bg-slate-800 text-slate-400"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {selectedInformation.category}
                  </span>

                  <StatusBadge status={selectedInformation.status} />
                </div>

                <h2 className="text-lg font-bold">
                  {selectedInformation.title}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setSelectedInformation(null)}
                className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  darkMode
                    ? "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
              >
                ×
              </button>
            </div>

            {/* BODY */}

            <div className="p-6">
              <p
                className={`text-xs font-bold uppercase tracking-wide mb-2 ${mutedClass}`}
              >
                Description
              </p>

              <p
                className={`text-sm leading-relaxed mb-6 ${
                  darkMode ? "text-slate-300" : "text-slate-600"
                }`}
              >
                {selectedInformation.description}
              </p>

              <p
                className={`text-xs font-bold uppercase tracking-wide mb-2 ${mutedClass}`}
              >
                Information Content
              </p>

              <div
                className={`p-4 rounded-xl border text-sm leading-relaxed whitespace-pre-wrap ${
                  darkMode
                    ? "bg-slate-800 border-slate-700 text-slate-300"
                    : "bg-slate-50 border-slate-200 text-slate-600"
                }`}
              >
                {selectedInformation.content}
              </div>

              <p className={`text-[10px] mt-4 ${mutedClass}`}>
                Last updated: {selectedInformation.updatedAt}
              </p>
            </div>

            {/* FOOTER */}

            <div
              className={`px-6 py-4 border-t flex justify-end gap-2 ${
                darkMode ? "border-slate-700" : "border-slate-200"
              }`}
            >
              <button
                type="button"
                onClick={() => {
                  setSelectedInformation(null);
                  handleEdit(selectedInformation);
                }}
                className={`px-5 py-2.5 rounded-lg text-xs font-bold ${
                  darkMode
                    ? "bg-slate-700 text-white hover:bg-slate-600"
                    : "bg-slate-800 text-white hover:bg-slate-700"
                }`}
              >
                Edit
              </button>

              <button
                type="button"
                onClick={() => setSelectedInformation(null)}
                className={`px-5 py-2.5 rounded-lg border text-xs font-bold ${
                  darkMode
                    ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                    : "border-slate-300 text-slate-600 hover:bg-slate-100"
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

export default InformationManagement;
