import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { STATUS, useMockStore } from "../../data/mockStore.jsx";

export default function ManageJobs() {
  const { darkMode } = useOutletContext();

  const { state, createOpportunity, updateOpportunity, deleteOpportunity } =
    useMockStore();

  const companyId = "COM-001";
  const supervisorId = state.currentUser?.profileId || "SUP-001";

  const opportunities = state.opportunities.filter(
    (item) => item.companyId === companyId
  );

  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    availability: "",
    openings: 1,
  });

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const card = darkMode
    ? "bg-slate-900 border-slate-700"
    : "bg-white border-slate-200";

  const input = darkMode
    ? "bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500"
    : "bg-white border-slate-300 text-slate-900 placeholder-slate-400";

  const muted = darkMode ? "text-slate-400" : "text-slate-500";

  const border = darkMode ? "border-slate-700" : "border-slate-200";

  const getStatusStyle = (status) => {
    if (status === STATUS.opportunity.ACTIVE) {
      return darkMode
        ? "bg-emerald-950 text-emerald-400 border-emerald-800"
        : "bg-emerald-50 text-emerald-700 border-emerald-200";
    }

    if (status === STATUS.opportunity.CLOSED) {
      return darkMode
        ? "bg-slate-800 text-slate-400 border-slate-700"
        : "bg-slate-100 text-slate-600 border-slate-200";
    }

    return darkMode
      ? "bg-amber-950 text-amber-400 border-amber-800"
      : "bg-amber-50 text-amber-700 border-amber-200";
  };

  /* -----------------------------------------
     CREATE
  ----------------------------------------- */

  const create = (event) => {
    event.preventDefault();

    if (!form.title.trim()) {
      return alert("Please enter an internship title.");
    }

    if (!form.description.trim()) {
      return alert("Please enter a description.");
    }

    if (!form.location.trim()) {
      return alert("Please enter the internship location.");
    }

    if (!form.availability.trim()) {
      return alert("Please enter the internship availability.");
    }

    if (Number(form.openings) < 1) {
      return alert("There must be at least 1 opening.");
    }

    createOpportunity({
      ...form,
      companyId,
      supervisorId,
      openings: Number(form.openings),
    });

    setForm({
      title: "",
      description: "",
      location: "",
      availability: "",
      openings: 1,
    });
  };

  /* -----------------------------------------
     START EDIT
  ----------------------------------------- */

  const startEdit = (opportunity) => {
    setEditingId(opportunity.id);

    setEditForm({
      title: opportunity.title || "",
      description: opportunity.description || "",
      location: opportunity.location || "",
      availability: opportunity.availability || "",
      openings: opportunity.openings || 1,
    });
  };

  /* -----------------------------------------
     SAVE EDIT
  ----------------------------------------- */

  const saveEdit = (id) => {
    if (!editForm.title.trim()) {
      return alert("Please enter an internship title.");
    }

    if (!editForm.description.trim()) {
      return alert("Please enter a description.");
    }

    if (!editForm.location.trim()) {
      return alert("Please enter the internship location.");
    }

    if (!editForm.availability.trim()) {
      return alert("Please enter the internship availability.");
    }

    if (Number(editForm.openings) < 1) {
      return alert("There must be at least 1 opening.");
    }

    updateOpportunity(id, {
      title: editForm.title,
      description: editForm.description,
      location: editForm.location,
      availability: editForm.availability,
      openings: Number(editForm.openings),
    });

    setEditingId(null);
    setEditForm({});
  };

  /* -----------------------------------------
     DELETE
  ----------------------------------------- */

  const handleDelete = (opportunity) => {
    const confirmed = window.confirm(
      `Delete "${opportunity.title}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    deleteOpportunity(opportunity.id);

    if (editingId === opportunity.id) {
      setEditingId(null);
      setEditForm({});
    }
  };

  /* -----------------------------------------
     CANCEL EDIT
  ----------------------------------------- */

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  return (
    <div
      className={`p-5 md:p-6 lg:p-8 max-w-[1200px] mx-auto ${
        darkMode ? "text-slate-100" : "text-slate-900"
      }`}
    >
      {/* =========================================
          PAGE HEADER
      ========================================= */}

      <div className="mb-8">
        <p className="text-xs uppercase tracking-widest font-bold text-slate-400 mb-1">
          Company Portal
        </p>

        <h1 className="text-2xl md:text-3xl font-black">
          Internship Opportunities
        </h1>

        <p className={`text-sm mt-2 max-w-2xl ${muted}`}>
          Create and manage internship opportunities that students can browse
          and apply for.
        </p>
      </div>

      {/* =========================================
          CREATE OPPORTUNITY
      ========================================= */}

      <section className={`border rounded-2xl mb-8 ${card}`}>
        <div className={`px-5 py-4 border-b ${border}`}>
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                darkMode ? "bg-blue-950" : "bg-blue-50"
              }`}
            >
              <span className="text-lg">＋</span>
            </div>

            <div>
              <h2 className="font-bold text-base">
                Create Internship Opportunity
              </h2>

              <p className={`text-xs mt-0.5 ${muted}`}>
                New opportunities start as drafts so you can review them before
                publishing.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={create} className="p-5">
          <div className="grid md:grid-cols-2 gap-5">
            {/* TITLE */}

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-2">
                Internship Title <span className="text-red-500">*</span>
              </label>

              <input
                type="text"
                className={`w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${input}`}
                placeholder="e.g. Web Developer Intern"
                value={form.title}
                onChange={(event) =>
                  setForm({
                    ...form,
                    title: event.target.value,
                  })
                }
              />
            </div>

            {/* LOCATION */}

            <div>
              <label className="block text-sm font-semibold mb-2">
                Location <span className="text-red-500">*</span>
              </label>

              <input
                type="text"
                className={`w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${input}`}
                placeholder="e.g. Balanga, Bataan"
                value={form.location}
                onChange={(event) =>
                  setForm({
                    ...form,
                    location: event.target.value,
                  })
                }
              />
            </div>

            {/* PERIOD */}

            <div>
              <label className="block text-sm font-semibold mb-2">
                Internship Period <span className="text-red-500">*</span>
              </label>

              <input
                type="text"
                className={`w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${input}`}
                placeholder="e.g. June - August 2026"
                value={form.availability}
                onChange={(event) =>
                  setForm({
                    ...form,
                    availability: event.target.value,
                  })
                }
              />
            </div>

            {/* OPENINGS */}

            <div>
              <label className="block text-sm font-semibold mb-2">
                Number of Openings <span className="text-red-500">*</span>
              </label>

              <input
                type="number"
                min="1"
                className={`w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${input}`}
                value={form.openings}
                onChange={(event) =>
                  setForm({
                    ...form,
                    openings: event.target.value,
                  })
                }
              />

              <p className={`text-xs mt-1.5 ${muted}`}>
                How many interns can you accept?
              </p>
            </div>

            {/* DESCRIPTION */}

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-2">
                Description <span className="text-red-500">*</span>
              </label>

              <textarea
                rows="4"
                className={`w-full border rounded-xl px-4 py-3 text-sm outline-none resize-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${input}`}
                placeholder="Describe the internship role, responsibilities, and what the intern will learn..."
                value={form.description}
                onChange={(event) =>
                  setForm({
                    ...form,
                    description: event.target.value,
                  })
                }
              />
            </div>
          </div>

          <div
            className={`mt-6 pt-5 border-t flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${border}`}
          >
            <p className={`text-xs ${muted}`}>
              You can edit the opportunity before publishing it.
            </p>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition"
            >
              Create Draft
            </button>
          </div>
        </form>
      </section>

      {/* =========================================
          OPPORTUNITIES HEADER
      ========================================= */}

      <section>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-4">
          <div>
            <h2 className="text-lg font-bold">Your Opportunities</h2>

            <p className={`text-xs mt-1 ${muted}`}>
              Draft, active, and closed internship opportunities.
            </p>
          </div>

          <div className={`text-xs font-semibold ${muted}`}>
            {opportunities.length}{" "}
            {opportunities.length === 1 ? "opportunity" : "opportunities"}
          </div>
        </div>

        {/* =========================================
            EMPTY STATE
        ========================================= */}

        {opportunities.length === 0 ? (
          <div className={`border rounded-2xl p-10 text-center ${card}`}>
            <div className="text-3xl mb-3">📋</div>

            <h3 className="font-bold">No opportunities yet</h3>

            <p className={`text-sm mt-1 ${muted}`}>
              Create your first internship opportunity using the form above.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {opportunities.map((opportunity) => {
              const isEditing = editingId === opportunity.id;

              return (
                <article
                  key={opportunity.id}
                  className={`border rounded-2xl p-5 ${card}`}
                >
                  {/* =========================================
                      CARD HEADER
                  ========================================= */}

                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-base">
                          {opportunity.title}
                        </h3>

                        <span
                          className={`px-2.5 py-1 rounded-full border text-[11px] font-bold ${getStatusStyle(
                            opportunity.status
                          )}`}
                        >
                          {opportunity.status}
                        </span>
                      </div>

                      <p className={`text-xs mt-1 ${muted}`}>
                        {opportunity.id}
                      </p>
                    </div>

                    {/* =========================================
                        ACTIONS
                    ========================================= */}

                    <div className="flex flex-wrap gap-2">
                      {/* DRAFT ACTIONS */}

                      {opportunity.status === STATUS.opportunity.DRAFT && (
                        <>
                          {!isEditing && (
                            <button
                              type="button"
                              className="px-4 py-2 rounded-lg border text-xs font-semibold transition hover:bg-slate-50 dark:hover:bg-slate-800"
                              onClick={() => startEdit(opportunity)}
                            >
                              Edit Draft
                            </button>
                          )}

                          <button
                            type="button"
                            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition"
                            onClick={() =>
                              updateOpportunity(opportunity.id, {
                                status: STATUS.opportunity.ACTIVE,
                              })
                            }
                          >
                            Publish
                          </button>

                          <button
                            type="button"
                            className="px-4 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold transition"
                            onClick={() => handleDelete(opportunity)}
                          >
                            Delete
                          </button>
                        </>
                      )}

                      {/* ACTIVE ACTION */}

                      {opportunity.status === STATUS.opportunity.ACTIVE && (
                        <button
                          type="button"
                          className={`px-4 py-2 rounded-lg border text-xs font-semibold transition ${
                            darkMode
                              ? "border-slate-600 hover:bg-slate-800"
                              : "border-slate-300 hover:bg-slate-50"
                          }`}
                          onClick={() =>
                            updateOpportunity(opportunity.id, {
                              status: STATUS.opportunity.CLOSED,
                            })
                          }
                        >
                          Close Opportunity
                        </button>
                      )}

                      {/* CLOSED ACTION */}

                      {opportunity.status === STATUS.opportunity.CLOSED && (
                        <button
                          type="button"
                          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition"
                          onClick={() =>
                            updateOpportunity(opportunity.id, {
                              status: STATUS.opportunity.ACTIVE,
                            })
                          }
                        >
                          Reopen
                        </button>
                      )}
                    </div>
                  </div>

                  {/* =========================================
                      EDIT FORM
                  ========================================= */}

                  {isEditing && (
                    <div
                      className={`mt-5 p-5 rounded-xl border ${
                        darkMode
                          ? "bg-slate-800/60 border-slate-700"
                          : "bg-slate-50 border-slate-200"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-5">
                        <div>
                          <h4 className="font-bold text-sm">Edit Draft</h4>

                          <p className={`text-xs mt-1 ${muted}`}>
                            Make your changes before publishing.
                          </p>
                        </div>

                        <span className="text-xs font-bold text-amber-600">
                          Draft
                        </span>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        {/* TITLE */}

                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold mb-2">
                            Internship Title
                          </label>

                          <input
                            type="text"
                            className={`w-full border rounded-lg px-3 py-2.5 text-sm ${input}`}
                            value={editForm.title}
                            onChange={(event) =>
                              setEditForm({
                                ...editForm,
                                title: event.target.value,
                              })
                            }
                          />
                        </div>

                        {/* LOCATION */}

                        <div>
                          <label className="block text-xs font-bold mb-2">
                            Location
                          </label>

                          <input
                            type="text"
                            className={`w-full border rounded-lg px-3 py-2.5 text-sm ${input}`}
                            value={editForm.location}
                            onChange={(event) =>
                              setEditForm({
                                ...editForm,
                                location: event.target.value,
                              })
                            }
                          />
                        </div>

                        {/* PERIOD */}

                        <div>
                          <label className="block text-xs font-bold mb-2">
                            Internship Period
                          </label>

                          <input
                            type="text"
                            className={`w-full border rounded-lg px-3 py-2.5 text-sm ${input}`}
                            value={editForm.availability}
                            onChange={(event) =>
                              setEditForm({
                                ...editForm,
                                availability: event.target.value,
                              })
                            }
                          />
                        </div>

                        {/* OPENINGS */}

                        <div>
                          <label className="block text-xs font-bold mb-2">
                            Number of Openings
                          </label>

                          <input
                            type="number"
                            min="1"
                            className={`w-full border rounded-lg px-3 py-2.5 text-sm ${input}`}
                            value={editForm.openings}
                            onChange={(event) =>
                              setEditForm({
                                ...editForm,
                                openings: event.target.value,
                              })
                            }
                          />
                        </div>

                        {/* DESCRIPTION */}

                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold mb-2">
                            Description
                          </label>

                          <textarea
                            rows="4"
                            className={`w-full border rounded-lg px-3 py-2.5 text-sm resize-none ${input}`}
                            value={editForm.description}
                            onChange={(event) =>
                              setEditForm({
                                ...editForm,
                                description: event.target.value,
                              })
                            }
                          />
                        </div>
                      </div>

                      {/* EDIT ACTIONS */}

                      <div
                        className={`flex justify-end gap-2 mt-5 pt-4 border-t ${border}`}
                      >
                        <button
                          type="button"
                          className={`px-4 py-2 rounded-lg border text-xs font-semibold ${
                            darkMode
                              ? "border-slate-600 hover:bg-slate-700"
                              : "border-slate-300 hover:bg-white"
                          }`}
                          onClick={cancelEdit}
                        >
                          Cancel
                        </button>

                        <button
                          type="button"
                          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
                          onClick={() => saveEdit(opportunity.id)}
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  )}

                  {/* =========================================
                      DETAILS
                  ========================================= */}

                  {!isEditing && (
                    <>
                      <div
                        className={`grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5 pt-5 border-t ${border}`}
                      >
                        <div>
                          <p
                            className={`text-[11px] uppercase font-bold ${muted}`}
                          >
                            Location
                          </p>

                          <p className="text-sm font-medium mt-1">
                            {opportunity.location || "Not specified"}
                          </p>
                        </div>

                        <div>
                          <p
                            className={`text-[11px] uppercase font-bold ${muted}`}
                          >
                            Internship Period
                          </p>

                          <p className="text-sm font-medium mt-1">
                            {opportunity.availability || "Not specified"}
                          </p>
                        </div>

                        <div>
                          <p
                            className={`text-[11px] uppercase font-bold ${muted}`}
                          >
                            Available Positions
                          </p>

                          <p className="text-sm font-medium mt-1">
                            {opportunity.openings}{" "}
                            {opportunity.openings === 1
                              ? "opening"
                              : "openings"}
                          </p>
                        </div>
                      </div>

                      {/* DESCRIPTION */}

                      <div className="mt-5">
                        <p
                          className={`text-[11px] uppercase font-bold ${muted}`}
                        >
                          Description
                        </p>

                        <p
                          className={`text-sm mt-1.5 leading-relaxed ${muted}`}
                        >
                          {opportunity.description ||
                            "No description provided."}
                        </p>
                      </div>
                    </>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
