import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabaseCompany } from "../../supabaseClient";

const STATUS = {
  opportunity: {
    DRAFT: "draft",
    ACTIVE: "active",
    CLOSED: "closed",
  },
};

export default function ManageJobs() {
  const { darkMode } = useOutletContext();

  // =========================================================
  // STATE
  // =========================================================

  const [company, setCompany] = useState(null);
  const [opportunities, setOpportunities] = useState([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    internshipStart: "",
    internshipEnd: "",
    openings: 1,
  });

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  // =========================================================
  // LOAD COMPANY + OPPORTUNITIES
  // =========================================================

  useEffect(() => {
    loadCompanyAndOpportunities();
  }, []);

  const loadCompanyAndOpportunities = async () => {
    setLoading(true);

    try {
      // -------------------------------------------------------
      // GET CURRENT AUTHENTICATED USER
      // -------------------------------------------------------

      const {
        data: { user },
        error: authError,
      } = await supabaseCompany.auth.getUser();

      if (authError) {
        throw authError;
      }

      if (!user) {
        throw new Error("You are not logged in.");
      }

      // -------------------------------------------------------
      // FIND COMPANY BELONGING TO CURRENT USER
      // -------------------------------------------------------

      const { data: companyData, error: companyError } = await supabaseCompany
        .from("companies")
        .select("id, company_name, user_id, status")
        .eq("user_id", user.id)
        .maybeSingle();

      if (companyError) {
        throw companyError;
      }

      if (!companyData) {
        throw new Error("No company record was found for your account.");
      }

      setCompany(companyData);

      // -------------------------------------------------------
      // LOAD COMPANY OPPORTUNITIES
      // -------------------------------------------------------

      const { data: opportunityData, error: opportunityError } =
        await supabaseCompany
          .from("opportunities")
          .select("*")
          .eq("company_id", companyData.id)
          .order("created_at", {
            ascending: false,
          });

      if (opportunityError) {
        throw opportunityError;
      }

      // -------------------------------------------------------
      // LOAD CAPACITY FOR EACH OPPORTUNITY
      // -------------------------------------------------------

      const opportunitiesWithCapacity = await Promise.all(
        (opportunityData || []).map(async (opportunity) => {
          const { data: capacityData, error: capacityError } =
            await supabaseCompany.rpc("get_opportunity_capacity", {
              p_opportunity_id: opportunity.id,
            });

          if (capacityError) {
            console.error(
              `Unable to load capacity for opportunity ${opportunity.id}:`,
              capacityError
            );

            // Fallback so the opportunity still displays
            return {
              ...opportunity,
              capacity: {
                total_openings: opportunity.openings || 0,
                occupied_slots: 0,
                available_slots: opportunity.openings || 0,
              },
            };
          }

          const capacity = capacityData?.[0] || {
            total_openings: opportunity.openings || 0,
            occupied_slots: 0,
            available_slots: opportunity.openings || 0,
          };

          return {
            ...opportunity,
            capacity,
          };
        })
      );

      setOpportunities(opportunitiesWithCapacity);
    } catch (error) {
      console.error("Error loading company opportunities:", error);

      alert(error.message || "Unable to load your internship opportunities.");
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // DATE HELPERS
  // =========================================================

  const formatDate = (dateString) => {
    if (!dateString) return "Not specified";

    const date = new Date(`${dateString}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
      return dateString;
    }

    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDateRange = (start, end, fallbackAvailability = "") => {
    if (start && end) {
      return `${formatDate(start)} - ${formatDate(end)}`;
    }

    if (fallbackAvailability) {
      return fallbackAvailability;
    }

    return "Not specified";
  };

  const validateInternshipDates = (start, end) => {
    if (!start) {
      return "Please select the internship start date.";
    }

    if (!end) {
      return "Please select the internship end date.";
    }

    if (end < start) {
      return "Internship end date cannot be before the start date.";
    }

    return null;
  };

  // =========================================================
  // STYLES
  // =========================================================

  const card = darkMode
    ? "bg-slate-900 border-slate-700"
    : "bg-white border-slate-200";

  const input = darkMode
    ? "bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500"
    : "bg-white border-slate-300 text-slate-900 placeholder-slate-400";

  const muted = darkMode ? "text-slate-400" : "text-slate-500";

  const border = darkMode ? "border-slate-700" : "border-slate-200";

  // =========================================================
  // STATUS STYLE
  // =========================================================

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

  // =========================================================
  // CREATE OPPORTUNITY
  // =========================================================

  const create = async (event) => {
    event.preventDefault();

    if (!company) {
      return alert("Company information is not available.");
    }

    if (!form.title.trim()) {
      return alert("Please enter an internship title.");
    }

    if (!form.description.trim()) {
      return alert("Please enter a description.");
    }

    if (!form.location.trim()) {
      return alert("Please enter the internship location.");
    }

    const dateError = validateInternshipDates(
      form.internshipStart,
      form.internshipEnd
    );

    if (dateError) {
      return alert(dateError);
    }

    if (Number(form.openings) < 1) {
      return alert("There must be at least 1 opening.");
    }

    setSubmitting(true);

    try {
      const availability = `${form.internshipStart} - ${form.internshipEnd}`;

      const { data, error } = await supabaseCompany
        .from("opportunities")
        .insert({
          company_id: company.id,
          title: form.title.trim(),
          description: form.description.trim(),
          location: form.location.trim(),

          internship_start: form.internshipStart,
          internship_end: form.internshipEnd,

          availability,

          openings: Number(form.openings),
          position_type: "On-site",
          requirements: [],
          status: STATUS.opportunity.DRAFT,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      const newOpportunity = {
        ...data,
        capacity: {
          total_openings: Number(data.openings),
          occupied_slots: 0,
          available_slots: Number(data.openings),
        },
      };

      setOpportunities((previous) => [newOpportunity, ...previous]);

      setForm({
        title: "",
        description: "",
        location: "",
        internshipStart: "",
        internshipEnd: "",
        openings: 1,
      });

      alert("Internship opportunity created as a draft.");
    } catch (error) {
      console.error("Create opportunity error:", error);

      alert(error.message || "Unable to create the internship opportunity.");
    } finally {
      setSubmitting(false);
    }
  };

  // =========================================================
  // START EDIT
  // =========================================================

  const startEdit = (opportunity) => {
    setEditingId(opportunity.id);

    setEditForm({
      title: opportunity.title || "",
      description: opportunity.description || "",
      location: opportunity.location || "",

      internshipStart: opportunity.internship_start || "",
      internshipEnd: opportunity.internship_end || "",

      openings: opportunity.openings || 1,
    });
  };

  // =========================================================
  // SAVE EDIT
  // =========================================================

  const saveEdit = async (id) => {
    if (!editForm.title?.trim()) {
      return alert("Please enter an internship title.");
    }

    if (!editForm.description?.trim()) {
      return alert("Please enter a description.");
    }

    if (!editForm.location?.trim()) {
      return alert("Please enter the internship location.");
    }

    const dateError = validateInternshipDates(
      editForm.internshipStart,
      editForm.internshipEnd
    );

    if (dateError) {
      return alert(dateError);
    }

    if (Number(editForm.openings) < 1) {
      return alert("There must be at least 1 opening.");
    }

    setSubmitting(true);

    try {
      const availability = `${editForm.internshipStart} - ${editForm.internshipEnd}`;

      const { data, error } = await supabaseCompany
        .from("opportunities")
        .update({
          title: editForm.title.trim(),
          description: editForm.description.trim(),
          location: editForm.location.trim(),

          internship_start: editForm.internshipStart,
          internship_end: editForm.internshipEnd,

          availability,

          openings: Number(editForm.openings),
        })
        .eq("id", id)
        .eq("company_id", company.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // -------------------------------------------------------
      // REFRESH CAPACITY AFTER OPENINGS CHANGE
      // -------------------------------------------------------

      const { data: capacityData, error: capacityError } =
        await supabaseCompany.rpc("get_opportunity_capacity", {
          p_opportunity_id: id,
        });

      if (capacityError) {
        console.error("Unable to refresh opportunity capacity:", capacityError);
      }

      const capacity = capacityData?.[0] || {
        total_openings: Number(data.openings),
        occupied_slots: 0,
        available_slots: Number(data.openings),
      };

      const updatedOpportunity = {
        ...data,
        capacity,
      };

      setOpportunities((previous) =>
        previous.map((opportunity) =>
          opportunity.id === id ? updatedOpportunity : opportunity
        )
      );

      setEditingId(null);
      setEditForm({});

      alert("Opportunity updated successfully.");
    } catch (error) {
      console.error("Update opportunity error:", error);

      alert(error.message || "Unable to update the opportunity.");
    } finally {
      setSubmitting(false);
    }
  };

  // =========================================================
  // UPDATE STATUS
  // =========================================================

  const updateStatus = async (id, status) => {
    if (!company) return;

    setSubmitting(true);

    try {
      const updateData = {
        status,
      };

      // -------------------------------------------------------
      // MANUAL CLOSE
      // -------------------------------------------------------

      if (status === STATUS.opportunity.CLOSED) {
        updateData.closure_reason = "manual";
      }

      // -------------------------------------------------------
      // MANUAL REOPEN
      // -------------------------------------------------------

      if (status === STATUS.opportunity.ACTIVE) {
        updateData.closure_reason = null;
      }

      const { data, error } = await supabaseCompany
        .from("opportunities")
        .update(updateData)
        .eq("id", id)
        .eq("company_id", company.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // -------------------------------------------------------
      // REFRESH CAPACITY
      // -------------------------------------------------------

      const { data: capacityData, error: capacityError } =
        await supabaseCompany.rpc("get_opportunity_capacity", {
          p_opportunity_id: id,
        });

      if (capacityError) {
        console.error("Unable to refresh opportunity capacity:", capacityError);
      }

      const capacity = capacityData?.[0] || {
        total_openings: Number(data.openings),
        occupied_slots: 0,
        available_slots: Number(data.openings),
      };

      const updatedOpportunity = {
        ...data,
        capacity,
      };

      setOpportunities((previous) =>
        previous.map((opportunity) =>
          opportunity.id === id ? updatedOpportunity : opportunity
        )
      );
    } catch (error) {
      console.error("Update opportunity status error:", error);

      alert(error.message || "Unable to update the opportunity status.");
    } finally {
      setSubmitting(false);
    }
  };

  // =========================================================
  // DELETE
  // =========================================================

  const handleDelete = async (opportunity) => {
    const confirmed = window.confirm(
      `Delete "${opportunity.title}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    setSubmitting(true);

    try {
      const { error } = await supabaseCompany
        .from("opportunities")
        .delete()
        .eq("id", opportunity.id)
        .eq("company_id", company.id);

      if (error) {
        throw error;
      }

      setOpportunities((previous) =>
        previous.filter((item) => item.id !== opportunity.id)
      );

      if (editingId === opportunity.id) {
        setEditingId(null);
        setEditForm({});
      }
    } catch (error) {
      console.error("Delete opportunity error:", error);

      alert(error.message || "Unable to delete the opportunity.");
    } finally {
      setSubmitting(false);
    }
  };

  // =========================================================
  // CANCEL EDIT
  // =========================================================

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div
        className={`p-8 max-w-[1200px] mx-auto ${
          darkMode ? "text-slate-100" : "text-slate-900"
        }`}
      >
        <div className={`border rounded-2xl p-10 text-center ${card}`}>
          <div className="text-2xl mb-3">⏳</div>

          <h3 className="font-bold">Loading opportunities...</h3>

          <p className={`text-sm mt-1 ${muted}`}>
            Please wait while we load your company data.
          </p>
        </div>
      </div>
    );
  }

  // =========================================================
  // RETURN
  // =========================================================

  return (
    <div
      className={`p-5 md:p-6 lg:p-8 max-w-[1200px] mx-auto ${
        darkMode ? "text-slate-100" : "text-slate-900"
      }`}
    >
      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

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

      {/* =====================================================
          CREATE OPPORTUNITY
      ===================================================== */}

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

            {/* INTERNSHIP START */}

            <div>
              <label className="block text-sm font-semibold mb-2">
                Internship Start <span className="text-red-500">*</span>
              </label>

              <input
                type="date"
                className={`w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${input}`}
                value={form.internshipStart}
                onChange={(event) =>
                  setForm({
                    ...form,
                    internshipStart: event.target.value,
                  })
                }
              />
            </div>

            {/* INTERNSHIP END */}

            <div>
              <label className="block text-sm font-semibold mb-2">
                Internship End <span className="text-red-500">*</span>
              </label>

              <input
                type="date"
                min={form.internshipStart || undefined}
                className={`w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${input}`}
                value={form.internshipEnd}
                onChange={(event) =>
                  setForm({
                    ...form,
                    internshipEnd: event.target.value,
                  })
                }
              />
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
              You can edit the opportunity before or after publishing.
            </p>

            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-sm font-semibold transition"
            >
              {submitting ? "Creating..." : "Create Draft"}
            </button>
          </div>
        </form>
      </section>

      {/* =====================================================
          OPPORTUNITIES
      ===================================================== */}

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

        {/* EMPTY */}

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

              const internshipPeriod = formatDateRange(
                opportunity.internship_start,
                opportunity.internship_end,
                opportunity.availability
              );

              const totalOpenings =
                opportunity.capacity?.total_openings ??
                opportunity.openings ??
                0;

              const occupiedSlots = opportunity.capacity?.occupied_slots ?? 0;

              const availableSlots =
                opportunity.capacity?.available_slots ??
                Math.max(totalOpenings - occupiedSlots, 0);

              const isFull = availableSlots <= 0;

              return (
                <article
                  key={opportunity.id}
                  className={`border rounded-2xl p-5 ${card}`}
                >
                  {/* =================================================
                      HEADER
                  ================================================= */}

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
                          {opportunity.status.charAt(0).toUpperCase() +
                            opportunity.status.slice(1)}
                        </span>

                        {opportunity.status === STATUS.opportunity.ACTIVE &&
                          isFull && (
                            <span
                              className={`px-2.5 py-1 rounded-full border text-[11px] font-bold ${
                                darkMode
                                  ? "bg-red-950 text-red-400 border-red-800"
                                  : "bg-red-50 text-red-700 border-red-200"
                              }`}
                            >
                              Full
                            </span>
                          )}
                      </div>

                      <p className={`text-xs mt-1 ${muted}`}>
                        {opportunity.id}
                      </p>
                    </div>

                    {/* ACTIONS */}

                    <div className="flex flex-wrap gap-2">
                      {!isEditing && (
                        <button
                          type="button"
                          disabled={submitting}
                          className={`px-4 py-2 rounded-lg border text-xs font-semibold transition ${
                            darkMode
                              ? "border-slate-600 hover:bg-slate-800"
                              : "border-slate-300 hover:bg-slate-50"
                          }`}
                          onClick={() => startEdit(opportunity)}
                        >
                          Edit
                        </button>
                      )}

                      {/* DRAFT → PUBLISH */}

                      {opportunity.status === STATUS.opportunity.DRAFT && (
                        <button
                          type="button"
                          disabled={submitting}
                          className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold transition"
                          onClick={() =>
                            updateStatus(
                              opportunity.id,
                              STATUS.opportunity.ACTIVE
                            )
                          }
                        >
                          Publish
                        </button>
                      )}

                      {/* ACTIVE → CLOSE */}

                      {opportunity.status === STATUS.opportunity.ACTIVE && (
                        <button
                          type="button"
                          disabled={submitting}
                          className={`px-4 py-2 rounded-lg border text-xs font-semibold transition ${
                            darkMode
                              ? "border-slate-600 hover:bg-slate-800"
                              : "border-slate-300 hover:bg-slate-50"
                          }`}
                          onClick={() =>
                            updateStatus(
                              opportunity.id,
                              STATUS.opportunity.CLOSED
                            )
                          }
                        >
                          Close Opportunity
                        </button>
                      )}

                      {/* CLOSED → REOPEN */}

                      {opportunity.status === STATUS.opportunity.CLOSED && (
                        <button
                          type="button"
                          disabled={submitting}
                          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold transition"
                          onClick={() =>
                            updateStatus(
                              opportunity.id,
                              STATUS.opportunity.ACTIVE
                            )
                          }
                        >
                          Reopen
                        </button>
                      )}

                      {/* DELETE */}

                      <button
                        type="button"
                        disabled={submitting}
                        className="px-4 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 text-xs font-semibold transition"
                        onClick={() => handleDelete(opportunity)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* =================================================
                      EDIT FORM
                  ================================================= */}

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
                          <h4 className="font-bold text-sm">
                            Edit Opportunity
                          </h4>

                          <p className={`text-xs mt-1 ${muted}`}>
                            Update the internship details and schedule.
                          </p>
                        </div>

                        <span
                          className={`px-2.5 py-1 rounded-full border text-[11px] font-bold ${getStatusStyle(
                            opportunity.status
                          )}`}
                        >
                          {opportunity.status.charAt(0).toUpperCase() +
                            opportunity.status.slice(1)}
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

                        {/* INTERNSHIP START */}

                        <div>
                          <label className="block text-xs font-bold mb-2">
                            Internship Start
                          </label>

                          <input
                            type="date"
                            className={`w-full border rounded-lg px-3 py-2.5 text-sm ${input}`}
                            value={editForm.internshipStart}
                            onChange={(event) =>
                              setEditForm({
                                ...editForm,
                                internshipStart: event.target.value,
                              })
                            }
                          />
                        </div>

                        {/* INTERNSHIP END */}

                        <div>
                          <label className="block text-xs font-bold mb-2">
                            Internship End
                          </label>

                          <input
                            type="date"
                            min={editForm.internshipStart || undefined}
                            className={`w-full border rounded-lg px-3 py-2.5 text-sm ${input}`}
                            value={editForm.internshipEnd}
                            onChange={(event) =>
                              setEditForm({
                                ...editForm,
                                internshipEnd: event.target.value,
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
                          disabled={submitting}
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
                          disabled={submitting}
                          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold"
                          onClick={() => saveEdit(opportunity.id)}
                        >
                          {submitting ? "Saving..." : "Save Changes"}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* =================================================
                      DETAILS
                  ================================================= */}

                  {!isEditing && (
                    <>
                      <div
                        className={`grid grid-cols-1 sm:grid-cols-4 gap-4 mt-5 pt-5 border-t ${border}`}
                      >
                        {/* LOCATION */}

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

                        {/* INTERNSHIP PERIOD */}

                        <div>
                          <p
                            className={`text-[11px] uppercase font-bold ${muted}`}
                          >
                            Internship Period
                          </p>

                          <p className="text-sm font-medium mt-1">
                            {internshipPeriod}
                          </p>
                        </div>

                        {/* TOTAL OPENINGS */}

                        <div>
                          <p
                            className={`text-[11px] uppercase font-bold ${muted}`}
                          >
                            Total Openings
                          </p>

                          <p className="text-sm font-medium mt-1">
                            {totalOpenings}{" "}
                            {totalOpenings === 1 ? "opening" : "openings"}
                          </p>
                        </div>

                        {/* AVAILABLE SLOTS */}

                        <div>
                          <p
                            className={`text-[11px] uppercase font-bold ${muted}`}
                          >
                            Available Slots
                          </p>

                          <p
                            className={`text-sm font-bold mt-1 ${
                              isFull
                                ? darkMode
                                  ? "text-red-400"
                                  : "text-red-600"
                                : darkMode
                                ? "text-emerald-400"
                                : "text-emerald-600"
                            }`}
                          >
                            {availableSlots} / {totalOpenings}
                          </p>

                          <p className={`text-[11px] mt-0.5 ${muted}`}>
                            {occupiedSlots}{" "}
                            {occupiedSlots === 1 ? "intern" : "interns"}{" "}
                            currently occupying slots
                          </p>
                        </div>
                      </div>

                      {/* SLOT SUMMARY */}

                      <div
                        className={`mt-4 rounded-xl border px-4 py-3 ${
                          isFull
                            ? darkMode
                              ? "bg-red-950/30 border-red-900"
                              : "bg-red-50 border-red-200"
                            : darkMode
                            ? "bg-emerald-950/20 border-emerald-900"
                            : "bg-emerald-50 border-emerald-200"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p
                              className={`text-xs font-bold ${
                                isFull
                                  ? darkMode
                                    ? "text-red-400"
                                    : "text-red-700"
                                  : darkMode
                                  ? "text-emerald-400"
                                  : "text-emerald-700"
                              }`}
                            >
                              {isFull
                                ? "Opportunity is full"
                                : `${availableSlots} ${
                                    availableSlots === 1
                                      ? "slot is"
                                      : "slots are"
                                  } still available`}
                            </p>

                            <p className={`text-[11px] mt-0.5 ${muted}`}>
                              Capacity is calculated from pending, active, and
                              suspended internships.
                            </p>
                          </div>

                          <div className="text-right shrink-0">
                            <p className="text-sm font-black">
                              {occupiedSlots} / {totalOpenings}
                            </p>

                            <p className={`text-[10px] ${muted}`}>occupied</p>
                          </div>
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
