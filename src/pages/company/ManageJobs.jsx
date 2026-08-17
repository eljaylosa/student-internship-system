import React, { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";

const STORAGE_KEY = "sims_company_jobs";

const DEFAULT_JOBS = [
  {
    id: 1,
    title: "Software Engineering Intern",
    department: "Information Technology",
    location: "Bataan",
    type: "On-site",
    slots: 3,
    status: "Active",
    description:
      "Assist the development team with building, testing, and maintaining software applications.",
    requirements: [
      "BS Information Technology or related course",
      "Basic knowledge of JavaScript",
      "Basic understanding of software development",
      "Good communication skills",
    ],
    createdAt: "August 10, 2026",
  },
  {
    id: 2,
    title: "UI/UX Design Intern",
    department: "Design",
    location: "Remote",
    type: "Remote",
    slots: 2,
    status: "Active",
    description:
      "Assist the design team in creating user interfaces, wireframes, and prototypes.",
    requirements: [
      "Basic knowledge of Figma",
      "Understanding of UI/UX principles",
      "Creative problem-solving skills",
    ],
    createdAt: "August 8, 2026",
  },
  {
    id: 3,
    title: "Marketing Intern",
    department: "Marketing",
    location: "Bataan",
    type: "Hybrid",
    slots: 2,
    status: "Closed",
    description:
      "Support marketing campaigns, social media activities, and promotional projects.",
    requirements: [
      "Marketing or business-related course",
      "Good written communication",
      "Basic social media knowledge",
    ],
    createdAt: "August 2, 2026",
  },
];

const ManageJobs = () => {
  const { darkMode } = useOutletContext();

  // =========================================
  // JOB STATE
  // =========================================

  const [jobs, setJobs] = useState(() => {
    try {
      const savedJobs = localStorage.getItem(STORAGE_KEY);

      return savedJobs ? JSON.parse(savedJobs) : DEFAULT_JOBS;
    } catch {
      return DEFAULT_JOBS;
    }
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // =========================================
  // MODAL STATE
  // =========================================

  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  const [modalMode, setModalMode] = useState("create");

  const [selectedJob, setSelectedJob] = useState(null);

  // =========================================
  // FORM STATE
  // =========================================

  const [form, setForm] = useState({
    title: "",
    department: "",
    location: "",
    type: "On-site",
    slots: 1,
    status: "Active",
    description: "",
    requirements: "",
  });

  // =========================================
  // THEME CLASSES
  // =========================================

  const pageText = darkMode ? "text-slate-100" : "text-slate-900";

  const mutedText = darkMode ? "text-slate-400" : "text-slate-500";

  const cardClass = darkMode
    ? "bg-slate-900 border-slate-700"
    : "bg-white border-slate-200";

  const inputClass = darkMode
    ? "w-full h-10 px-3 rounded-lg border border-slate-700 bg-slate-800 text-sm text-slate-200 placeholder:text-slate-500 outline-none focus:border-slate-500 transition"
    : "w-full h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:bg-white focus:border-slate-400 transition";

  // =========================================
  // SAVE TO LOCAL STORAGE
  // =========================================

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
  }, [jobs]);

  // =========================================
  // FILTER JOBS
  // =========================================

  const filteredJobs = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return jobs.filter((job) => {
      const matchesSearch =
        !query ||
        job.title.toLowerCase().includes(query) ||
        job.department.toLowerCase().includes(query) ||
        job.location.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "All" || job.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [jobs, searchQuery, statusFilter]);

  // =========================================
  // FORM HANDLERS
  // =========================================

  const handleInputChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setForm({
      title: "",
      department: "",
      location: "",
      type: "On-site",
      slots: 1,
      status: "Active",
      description: "",
      requirements: "",
    });
  };

  // =========================================
  // CREATE JOB
  // =========================================

  const openCreateModal = () => {
    resetForm();

    setSelectedJob(null);
    setModalMode("create");

    setShowViewModal(false);
    setShowModal(true);
  };

  // =========================================
  // EDIT JOB
  // =========================================

  const openEditModal = (job) => {
    setForm({
      title: job.title,
      department: job.department,
      location: job.location,
      type: job.type,
      slots: job.slots,
      status: job.status,
      description: job.description,
      requirements: job.requirements.join("\n"),
    });

    setSelectedJob(job);
    setModalMode("edit");

    setShowViewModal(false);
    setShowModal(true);
  };

  // =========================================
  // SAVE JOB
  // =========================================

  const handleSaveJob = (e) => {
    e.preventDefault();

    if (!form.title.trim() || !form.department.trim()) {
      alert("Please provide a job title and department.");
      return;
    }

    const requirements = form.requirements
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);

    if (modalMode === "create") {
      const newJob = {
        id: Date.now(),
        title: form.title.trim(),
        department: form.department.trim(),
        location: form.location.trim(),
        type: form.type,
        slots: Number(form.slots),
        status: form.status,
        description: form.description.trim(),
        requirements,
        createdAt: new Date().toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        }),
      };

      setJobs((prev) => [newJob, ...prev]);
    } else {
      setJobs((prev) =>
        prev.map((job) =>
          job.id === selectedJob.id
            ? {
                ...job,
                title: form.title.trim(),
                department: form.department.trim(),
                location: form.location.trim(),
                type: form.type,
                slots: Number(form.slots),
                status: form.status,
                description: form.description.trim(),
                requirements,
              }
            : job
        )
      );
    }

    setShowModal(false);
    resetForm();
    setSelectedJob(null);
  };

  // =========================================
  // DELETE JOB
  // =========================================

  const handleDeleteJob = (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this job posting?"
    );

    if (!confirmed) return;

    setJobs((prev) => prev.filter((job) => job.id !== id));

    if (selectedJob?.id === id) {
      setSelectedJob(null);
      setShowViewModal(false);
      setShowModal(false);
    }
  };

  // =========================================
  // CHANGE STATUS
  // =========================================

  const handleToggleStatus = (job) => {
    const newStatus = job.status === "Active" ? "Closed" : "Active";

    setJobs((prev) =>
      prev.map((item) =>
        item.id === job.id
          ? {
              ...item,
              status: newStatus,
            }
          : item
      )
    );

    if (selectedJob?.id === job.id) {
      setSelectedJob((prev) =>
        prev
          ? {
              ...prev,
              status: newStatus,
            }
          : null
      );
    }
  };

  // =========================================
  // VIEW JOB
  // =========================================

  const handleViewJob = (job) => {
    setSelectedJob(job);

    // Make sure the edit/create modal is closed.
    setShowModal(false);

    // Open the dedicated view modal.
    setShowViewModal(true);
  };

  // =========================================
  // CLOSE VIEW MODAL
  // =========================================

  const closeViewModal = () => {
    setShowViewModal(false);
    setSelectedJob(null);
  };

  // =========================================
  // CLOSE CREATE / EDIT MODAL
  // =========================================

  const closeFormModal = () => {
    setShowModal(false);
    setSelectedJob(null);
    resetForm();
  };

  // =========================================
  // STATUS BADGE
  // =========================================

  const getStatusClass = (status) => {
    if (status === "Active") {
      return darkMode
        ? "bg-emerald-950 text-emerald-400 border-emerald-900"
        : "bg-emerald-50 text-emerald-700 border-emerald-200";
    }

    if (status === "Closed") {
      return darkMode
        ? "bg-red-950 text-red-400 border-red-900"
        : "bg-red-50 text-red-700 border-red-200";
    }

    return darkMode
      ? "bg-slate-800 text-slate-400 border-slate-700"
      : "bg-slate-100 text-slate-500 border-slate-200";
  };

  return (
    <div className="p-5 md:p-6 lg:p-8 max-w-[1400px] mx-auto">
      {/* =========================================
          PAGE HEADER
      ========================================= */}

      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <p
            className={`text-xs uppercase tracking-widest font-bold ${mutedText}`}
          >
            Company Portal
          </p>

          <h1 className={`text-2xl font-black mt-1 ${pageText}`}>
            Manage Jobs
          </h1>

          <p className={`text-sm mt-1 ${mutedText}`}>
            Create, update, and manage your internship job postings.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="w-fit px-5 py-2.5 rounded-lg bg-slate-800 text-white text-xs font-bold hover:bg-slate-700 transition"
        >
          + Post New Job
        </button>
      </div>

      {/* =========================================
          SEARCH + FILTER
      ========================================= */}

      <section className={`border rounded-xl p-4 mb-5 ${cardClass}`}>
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search jobs..."
              className={inputClass}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`${inputClass} md:w-44`}
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Closed">Closed</option>
            <option value="Draft">Draft</option>
          </select>
        </div>
      </section>

      {/* =========================================
          JOB LIST
      ========================================= */}

      <div className="space-y-4">
        {filteredJobs.length > 0 ? (
          filteredJobs.map((job) => (
            <article
              key={job.id}
              className={`border rounded-xl p-5 ${cardClass}`}
            >
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h2 className={`text-base font-bold ${pageText}`}>
                      {job.title}
                    </h2>

                    <span
                      className={`px-2 py-1 rounded-full border text-[9px] uppercase tracking-wide font-bold ${getStatusClass(
                        job.status
                      )}`}
                    >
                      {job.status}
                    </span>
                  </div>

                  <p className={`text-xs ${mutedText}`}>
                    {job.department} • {job.location} • {job.type}
                  </p>

                  <p className={`text-xs mt-3 leading-relaxed ${mutedText}`}>
                    {job.description}
                  </p>

                  <div className="flex flex-wrap gap-2 mt-4">
                    <span
                      className={`px-2.5 py-1 rounded-md text-[10px] ${
                        darkMode
                          ? "bg-slate-800 text-slate-400"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {job.slots} {job.slots === 1 ? "slot" : "slots"}
                    </span>

                    <span
                      className={`px-2.5 py-1 rounded-md text-[10px] ${
                        darkMode
                          ? "bg-slate-800 text-slate-400"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      Posted {job.createdAt}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 lg:justify-end">
                  {/* VIEW */}

                  <button
                    type="button"
                    onClick={() => handleViewJob(job)}
                    className={`px-4 py-2 rounded-lg border text-xs font-semibold transition ${
                      darkMode
                        ? "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    View
                  </button>

                  {/* EDIT */}

                  <button
                    type="button"
                    onClick={() => openEditModal(job)}
                    className="px-4 py-2 rounded-lg bg-slate-800 text-white text-xs font-semibold hover:bg-slate-700 transition"
                  >
                    Edit
                  </button>

                  {/* STATUS */}

                  <button
                    type="button"
                    onClick={() => handleToggleStatus(job)}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
                      job.status === "Active"
                        ? darkMode
                          ? "bg-red-950 text-red-400 hover:bg-red-900"
                          : "bg-red-50 text-red-600 hover:bg-red-100"
                        : darkMode
                        ? "bg-emerald-950 text-emerald-400 hover:bg-emerald-900"
                        : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                    }`}
                  >
                    {job.status === "Active" ? "Close" : "Reopen"}
                  </button>

                  {/* DELETE */}

                  <button
                    type="button"
                    onClick={() => handleDeleteJob(job.id)}
                    className="px-4 py-2 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))
        ) : (
          <div
            className={`border border-dashed rounded-xl p-10 text-center ${cardClass}`}
          >
            <div className={`text-sm font-bold ${pageText}`}>
              No jobs found
            </div>

            <p className={`text-xs mt-1 ${mutedText}`}>
              Try changing your search or status filter.
            </p>
          </div>
        )}
      </div>

      {/* =====================================================
          VIEW JOB MODAL
      ===================================================== */}

      {showViewModal && selectedJob && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              closeViewModal();
            }
          }}
        >
          <div
            className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border shadow-xl ${cardClass}`}
          >
            <div className="p-6">
              {/* HEADER */}

              <div className="flex items-start justify-between gap-4 mb-6">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className={`text-lg font-bold ${pageText}`}>
                      {selectedJob.title}
                    </h2>

                    <span
                      className={`px-2 py-1 rounded-full border text-[9px] font-bold uppercase ${getStatusClass(
                        selectedJob.status
                      )}`}
                    >
                      {selectedJob.status}
                    </span>
                  </div>

                  <p className={`text-xs mt-1 ${mutedText}`}>
                    {selectedJob.department} • {selectedJob.location} •{" "}
                    {selectedJob.type}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeViewModal}
                  aria-label="Close job details"
                  className={`w-8 h-8 flex items-center justify-center rounded-lg text-xl leading-none transition ${
                    darkMode
                      ? "text-slate-400 hover:bg-slate-800 hover:text-white"
                      : "text-slate-400 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  ×
                </button>
              </div>

              {/* JOB DETAILS */}

              <div className="space-y-6">
                {/* DESCRIPTION */}

                <div>
                  <p className={`text-xs font-bold ${pageText}`}>
                    Description
                  </p>

                  <p
                    className={`text-sm mt-2 leading-relaxed whitespace-pre-line ${mutedText}`}
                  >
                    {selectedJob.description || "No description provided."}
                  </p>
                </div>

                {/* REQUIREMENTS */}

                <div>
                  <p className={`text-xs font-bold ${pageText}`}>
                    Requirements
                  </p>

                  {selectedJob.requirements &&
                  selectedJob.requirements.length > 0 ? (
                    <ul className={`mt-3 space-y-2 text-sm ${mutedText}`}>
                      {selectedJob.requirements.map((requirement, index) => (
                        <li key={index} className="flex gap-2">
                          <span className="flex-shrink-0">•</span>
                          <span>{requirement}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className={`text-sm mt-2 ${mutedText}`}>
                      No requirements specified.
                    </p>
                  )}
                </div>

                {/* INFO */}

                <div
                  className={`grid grid-cols-1 sm:grid-cols-3 gap-4 border-t pt-5 ${
                    darkMode ? "border-slate-700" : "border-slate-200"
                  }`}
                >
                  <div>
                    <p className={`text-[10px] ${mutedText}`}>
                      Internship Type
                    </p>

                    <p className={`text-sm font-semibold mt-1 ${pageText}`}>
                      {selectedJob.type}
                    </p>
                  </div>

                  <div>
                    <p className={`text-[10px] ${mutedText}`}>
                      Available Slots
                    </p>

                    <p className={`text-sm font-semibold mt-1 ${pageText}`}>
                      {selectedJob.slots}
                    </p>
                  </div>

                  <div>
                    <p className={`text-[10px] ${mutedText}`}>Posted</p>

                    <p className={`text-sm font-semibold mt-1 ${pageText}`}>
                      {selectedJob.createdAt}
                    </p>
                  </div>
                </div>
              </div>

              {/* BUTTONS */}

              <div
                className={`flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-7 border-t pt-5 ${
                  darkMode ? "border-slate-700" : "border-slate-200"
                }`}
              >
                <button
                  type="button"
                  onClick={closeViewModal}
                  className={`px-5 py-2.5 rounded-lg border text-xs font-semibold transition ${
                    darkMode
                      ? "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={() => openEditModal(selectedJob)}
                  className="px-5 py-2.5 rounded-lg bg-slate-800 text-white text-xs font-bold hover:bg-slate-700 transition"
                >
                  Edit Job
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          CREATE / EDIT MODAL
      ===================================================== */}

      {showModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              closeFormModal();
            }
          }}
        >
          <div
            className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border shadow-xl ${cardClass}`}
          >
            <form onSubmit={handleSaveJob}>
              <div className="p-6">
                {/* HEADER */}

                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className={`text-lg font-bold ${pageText}`}>
                      {modalMode === "create"
                        ? "Post New Job"
                        : "Edit Job Posting"}
                    </h2>

                    <p className={`text-xs mt-1 ${mutedText}`}>
                      {modalMode === "create"
                        ? "Create a new internship opportunity."
                        : "Update the details of this job posting."}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={closeFormModal}
                    aria-label="Close modal"
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-xl transition ${
                      darkMode
                        ? "text-slate-400 hover:bg-slate-800 hover:text-white"
                        : "text-slate-400 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    ×
                  </button>
                </div>

                {/* FORM */}

                <div className="space-y-4">
                  {/* JOB TITLE */}

                  <div>
                    <label
                      className={`block text-xs font-bold mb-1.5 ${pageText}`}
                    >
                      Job Title
                    </label>

                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) =>
                        handleInputChange("title", e.target.value)
                      }
                      placeholder="e.g. Software Engineering Intern"
                      className={inputClass}
                    />
                  </div>

                  {/* DEPARTMENT */}

                  <div>
                    <label
                      className={`block text-xs font-bold mb-1.5 ${pageText}`}
                    >
                      Department
                    </label>

                    <input
                      type="text"
                      value={form.department}
                      onChange={(e) =>
                        handleInputChange("department", e.target.value)
                      }
                      placeholder="e.g. Information Technology"
                      className={inputClass}
                    />
                  </div>

                  {/* LOCATION + TYPE */}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label
                        className={`block text-xs font-bold mb-1.5 ${pageText}`}
                      >
                        Location
                      </label>

                      <input
                        type="text"
                        value={form.location}
                        onChange={(e) =>
                          handleInputChange("location", e.target.value)
                        }
                        placeholder="e.g. Bataan"
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label
                        className={`block text-xs font-bold mb-1.5 ${pageText}`}
                      >
                        Internship Type
                      </label>

                      <select
                        value={form.type}
                        onChange={(e) =>
                          handleInputChange("type", e.target.value)
                        }
                        className={inputClass}
                      >
                        <option value="On-site">On-site</option>
                        <option value="Remote">Remote</option>
                        <option value="Hybrid">Hybrid</option>
                      </select>
                    </div>
                  </div>

                  {/* SLOTS + STATUS */}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label
                        className={`block text-xs font-bold mb-1.5 ${pageText}`}
                      >
                        Internship Slots
                      </label>

                      <input
                        type="number"
                        min="1"
                        value={form.slots}
                        onChange={(e) =>
                          handleInputChange("slots", e.target.value)
                        }
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label
                        className={`block text-xs font-bold mb-1.5 ${pageText}`}
                      >
                        Status
                      </label>

                      <select
                        value={form.status}
                        onChange={(e) =>
                          handleInputChange("status", e.target.value)
                        }
                        className={inputClass}
                      >
                        <option value="Active">Active</option>
                        <option value="Draft">Draft</option>
                        <option value="Closed">Closed</option>
                      </select>
                    </div>
                  </div>

                  {/* DESCRIPTION */}

                  <div>
                    <label
                      className={`block text-xs font-bold mb-1.5 ${pageText}`}
                    >
                      Job Description
                    </label>

                    <textarea
                      value={form.description}
                      onChange={(e) =>
                        handleInputChange("description", e.target.value)
                      }
                      placeholder="Describe the internship role..."
                      rows={4}
                      className={`${inputClass} h-auto py-3 resize-none`}
                    />
                  </div>

                  {/* REQUIREMENTS */}

                  <div>
                    <label
                      className={`block text-xs font-bold mb-1.5 ${pageText}`}
                    >
                      Requirements
                    </label>

                    <textarea
                      value={form.requirements}
                      onChange={(e) =>
                        handleInputChange("requirements", e.target.value)
                      }
                      placeholder={
                        "Enter one requirement per line\nExample:\nBS Information Technology student\nBasic JavaScript knowledge"
                      }
                      rows={5}
                      className={`${inputClass} h-auto py-3 resize-none`}
                    />

                    <p className={`text-[10px] mt-1.5 ${mutedText}`}>
                      Enter each requirement on a separate line.
                    </p>
                  </div>
                </div>

                {/* BUTTONS */}

                <div className="flex justify-end gap-2 mt-6">
                  <button
                    type="button"
                    onClick={closeFormModal}
                    className={`px-5 py-2.5 rounded-lg border text-xs font-semibold transition ${
                      darkMode
                        ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-lg bg-slate-800 text-white text-xs font-bold hover:bg-slate-700 transition"
                  >
                    {modalMode === "create" ? "Post Job" : "Save Changes"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageJobs;

