import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "../../supabaseClient";

const ManageSchools = () => {
  const { darkMode } = useOutletContext();

  // =========================================================
  // STATE
  // =========================================================

  const [schools, setSchools] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    status: "active",
  });

  // =========================================================
  // FETCH SCHOOLS
  // =========================================================

  const fetchSchools = async () => {
    setIsLoading(true);
    setError("");

    const { data, error: fetchError } = await supabase
      .from("schools")
      .select("*")
      .order("name", { ascending: true });

    if (fetchError) {
      console.error("Error fetching schools:", fetchError);

      setError(`Unable to load schools: ${fetchError.message}`);

      setSchools([]);
    } else {
      setSchools(data || []);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    fetchSchools();
  }, []);

  // =========================================================
  // FORM HELPERS
  // =========================================================

  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      status: "active",
    });

    setEditingSchool(null);
  };

  const openAddModal = () => {
    resetForm();
    setError("");
    setSuccess("");
    setIsModalOpen(true);
  };

  const openEditModal = (school) => {
    setEditingSchool(school);

    setFormData({
      name: school.name || "",
      code: school.code || "",
      status: school.status || "active",
    });

    setError("");
    setSuccess("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSaving) return;

    setIsModalOpen(false);
    resetForm();
  };

  // =========================================================
  // FORM INPUT
  // =========================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =========================================================
  // SAVE SCHOOL
  // =========================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const schoolName = formData.name.trim();
    const schoolCode = formData.code.trim().toUpperCase();

    if (!schoolName) {
      setError("School name is required.");
      return;
    }

    setIsSaving(true);

    try {
      if (editingSchool) {
        // ===================================================
        // UPDATE
        // ===================================================

        const { error: updateError } = await supabase
          .from("schools")
          .update({
            name: schoolName,
            code: schoolCode || null,
            status: formData.status,
          })
          .eq("id", editingSchool.id);

        if (updateError) {
          throw updateError;
        }

        setSuccess("School updated successfully.");
      } else {
        // ===================================================
        // INSERT
        // ===================================================

        const { error: insertError } = await supabase.from("schools").insert([
          {
            name: schoolName,
            code: schoolCode || null,
            status: formData.status,
          },
        ]);

        if (insertError) {
          throw insertError;
        }

        setSuccess("School added successfully.");
      }

      setIsModalOpen(false);
      resetForm();

      await fetchSchools();
    } catch (saveError) {
      console.error("Error saving school:", saveError);

      if (saveError.code === "23505") {
        if (saveError.message?.includes("schools_name_key")) {
          setError("A school with this name already exists.");
        } else if (saveError.message?.includes("schools_code_key")) {
          setError("A school with this code already exists.");
        } else {
          setError("A school with the same information already exists.");
        }
      } else {
        setError(saveError.message || "Unable to save the school.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  // =========================================================
  // TOGGLE SCHOOL STATUS
  // =========================================================

  const toggleSchoolStatus = async (school) => {
    setError("");
    setSuccess("");

    const newStatus = school.status === "active" ? "inactive" : "active";

    const action = newStatus === "active" ? "activate" : "deactivate";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} "${school.name}"?`
    );

    if (!confirmed) return;

    const { error: updateError } = await supabase
      .from("schools")
      .update({
        status: newStatus,
      })
      .eq("id", school.id);

    if (updateError) {
      console.error("Error changing school status:", updateError);

      setError(`Unable to ${action} school: ${updateError.message}`);

      return;
    }

    setSuccess(`${school.name} has been ${newStatus}.`);

    await fetchSchools();
  };

  // =========================================================
  // FILTER
  // =========================================================

  const filteredSchools = schools.filter((school) => {
    const search = searchTerm.toLowerCase().trim();

    if (!search) return true;

    return (
      school.name?.toLowerCase().includes(search) ||
      school.code?.toLowerCase().includes(search) ||
      school.status?.toLowerCase().includes(search)
    );
  });

  // =========================================================
  // STATS
  // =========================================================

  const totalSchools = schools.length;

  const activeSchools = schools.filter(
    (school) => school.status === "active"
  ).length;

  const inactiveSchools = schools.filter(
    (school) => school.status === "inactive"
  ).length;

  // =========================================================
  // FORMAT DATE
  // =========================================================

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1
            className={`text-xl sm:text-2xl font-bold ${
              darkMode ? "text-white" : "text-slate-900"
            }`}
          >
            School Management
          </h1>

          <p
            className={`text-sm mt-1 ${
              darkMode ? "text-slate-400" : "text-slate-500"
            }`}
          >
            Manage the schools available during student and registrar
            registration.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 text-white text-sm font-semibold hover:bg-slate-700 transition"
        >
          <span className="text-lg leading-none">+</span>
          Add School
        </button>
      </div>

      {/* =====================================================
          ALERTS
      ===================================================== */}

      {error && (
        <div
          className={`mb-5 p-4 rounded-xl border ${
            darkMode
              ? "bg-red-950/40 border-red-900 text-red-300"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          <div className="flex items-start gap-3">
            <span>⚠️</span>

            <div>
              <p className="text-sm font-bold">Something went wrong</p>

              <p className="text-xs mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div
          className={`mb-5 p-4 rounded-xl border ${
            darkMode
              ? "bg-emerald-950/40 border-emerald-900 text-emerald-300"
              : "bg-emerald-50 border-emerald-200 text-emerald-700"
          }`}
        >
          <div className="flex items-center gap-3">
            <span>✓</span>

            <p className="text-sm font-semibold">{success}</p>
          </div>
        </div>
      )}

      {/* =====================================================
          STAT CARDS
      ===================================================== */}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {/* TOTAL */}

        <div
          className={`rounded-xl border p-5 ${
            darkMode
              ? "bg-slate-900 border-slate-700"
              : "bg-white border-slate-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p
                className={`text-xs font-medium ${
                  darkMode ? "text-slate-400" : "text-slate-500"
                }`}
              >
                Total Schools
              </p>

              <p className="text-2xl font-bold mt-2">{totalSchools}</p>
            </div>

            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                darkMode ? "bg-slate-800" : "bg-slate-100"
              }`}
            >
              🏫
            </div>
          </div>
        </div>

        {/* ACTIVE */}

        <div
          className={`rounded-xl border p-5 ${
            darkMode
              ? "bg-slate-900 border-slate-700"
              : "bg-white border-slate-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p
                className={`text-xs font-medium ${
                  darkMode ? "text-slate-400" : "text-slate-500"
                }`}
              >
                Active Schools
              </p>

              <p className="text-2xl font-bold mt-2">{activeSchools}</p>
            </div>

            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                darkMode
                  ? "bg-emerald-950 text-emerald-300"
                  : "bg-emerald-100 text-emerald-700"
              }`}
            >
              ✓
            </div>
          </div>
        </div>

        {/* INACTIVE */}

        <div
          className={`rounded-xl border p-5 ${
            darkMode
              ? "bg-slate-900 border-slate-700"
              : "bg-white border-slate-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p
                className={`text-xs font-medium ${
                  darkMode ? "text-slate-400" : "text-slate-500"
                }`}
              >
                Inactive Schools
              </p>

              <p className="text-2xl font-bold mt-2">{inactiveSchools}</p>
            </div>

            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                darkMode ? "bg-red-950 text-red-300" : "bg-red-100 text-red-700"
              }`}
            >
              ×
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          SCHOOL TABLE
      ===================================================== */}

      <div
        className={`rounded-xl border overflow-hidden ${
          darkMode
            ? "bg-slate-900 border-slate-700"
            : "bg-white border-slate-200"
        }`}
      >
        {/* TABLE HEADER */}

        <div
          className={`p-4 border-b ${
            darkMode ? "border-slate-700" : "border-slate-200"
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold">Registered Schools</h2>

              <p
                className={`text-xs mt-1 ${
                  darkMode ? "text-slate-400" : "text-slate-500"
                }`}
              >
                These schools will appear in registration dropdowns when active.
              </p>
            </div>

            {/* SEARCH */}

            <div className="relative w-full sm:w-64">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm">
                🔍
              </span>

              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search schools..."
                className={`w-full pl-9 pr-3 py-2.5 rounded-lg border text-sm outline-none transition ${
                  darkMode
                    ? "bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-slate-500"
                    : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-slate-400"
                }`}
              />
            </div>
          </div>
        </div>

        {/* LOADING */}

        {isLoading ? (
          <div className="p-10 text-center">
            <div className="text-2xl mb-3 animate-pulse">🏫</div>

            <p
              className={`text-sm ${
                darkMode ? "text-slate-400" : "text-slate-500"
              }`}
            >
              Loading schools...
            </p>
          </div>
        ) : filteredSchools.length === 0 ? (
          /* EMPTY */

          <div className="p-10 text-center">
            <div className="text-3xl mb-3">🏫</div>

            <h3 className="text-sm font-bold">
              {schools.length === 0
                ? "No schools registered yet"
                : "No schools found"}
            </h3>

            <p
              className={`text-xs mt-1 max-w-md mx-auto ${
                darkMode ? "text-slate-400" : "text-slate-500"
              }`}
            >
              {schools.length === 0
                ? "Add a school to make it available in the Student and Registrar registration forms."
                : "Try searching using a different school name or code."}
            </p>

            {schools.length === 0 && (
              <button
                type="button"
                onClick={openAddModal}
                className="mt-4 px-4 py-2 rounded-lg bg-slate-800 text-white text-xs font-semibold hover:bg-slate-700 transition"
              >
                + Add Your First School
              </button>
            )}
          </div>
        ) : (
          /* TABLE */

          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr
                  className={`text-left text-xs ${
                    darkMode
                      ? "bg-slate-800 text-slate-400"
                      : "bg-slate-50 text-slate-500"
                  }`}
                >
                  <th className="px-5 py-3 font-semibold">School</th>

                  <th className="px-5 py-3 font-semibold">Code</th>

                  <th className="px-5 py-3 font-semibold">Status</th>

                  <th className="px-5 py-3 font-semibold">Created</th>

                  <th className="px-5 py-3 font-semibold text-right">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredSchools.map((school) => (
                  <tr
                    key={school.id}
                    className={`border-t transition ${
                      darkMode
                        ? "border-slate-700 hover:bg-slate-800/60"
                        : "border-slate-100 hover:bg-slate-50"
                    }`}
                  >
                    {/* SCHOOL */}

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            darkMode ? "bg-slate-800" : "bg-slate-100"
                          }`}
                        >
                          🏫
                        </div>

                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">
                            {school.name}
                          </p>

                          <p
                            className={`text-[10px] mt-0.5 ${
                              darkMode ? "text-slate-500" : "text-slate-400"
                            }`}
                          >
                            School
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* CODE */}

                    <td className="px-5 py-4">
                      <span
                        className={`text-xs font-mono ${
                          darkMode ? "text-slate-300" : "text-slate-700"
                        }`}
                      >
                        {school.code || "—"}
                      </span>
                    </td>

                    {/* STATUS */}

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          school.status === "active"
                            ? darkMode
                              ? "bg-emerald-950 text-emerald-300"
                              : "bg-emerald-100 text-emerald-700"
                            : darkMode
                            ? "bg-red-950 text-red-300"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            school.status === "active"
                              ? "bg-emerald-500"
                              : "bg-red-500"
                          }`}
                        />

                        {school.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </td>

                    {/* CREATED */}

                    <td className="px-5 py-4">
                      <span
                        className={`text-xs ${
                          darkMode ? "text-slate-400" : "text-slate-500"
                        }`}
                      >
                        {formatDate(school.created_at)}
                      </span>
                    </td>

                    {/* ACTIONS */}

                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(school)}
                          className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition ${
                            darkMode
                              ? "bg-slate-800 text-slate-200 hover:bg-slate-700"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          }`}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleSchoolStatus(school)}
                          className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition ${
                            school.status === "active"
                              ? darkMode
                                ? "text-red-400 hover:bg-red-950"
                                : "text-red-600 hover:bg-red-50"
                              : darkMode
                              ? "text-emerald-400 hover:bg-emerald-950"
                              : "text-emerald-600 hover:bg-emerald-50"
                          }`}
                        >
                          {school.status === "active"
                            ? "Deactivate"
                            : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* =====================================================
          ADD / EDIT MODAL
      ===================================================== */}

      {isModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isSaving) {
              closeModal();
            }
          }}
        >
          <div
            className={`w-full max-w-lg rounded-2xl shadow-2xl border overflow-hidden ${
              darkMode
                ? "bg-slate-900 border-slate-700"
                : "bg-white border-slate-200"
            }`}
          >
            {/* MODAL HEADER */}

            <div
              className={`px-5 py-4 border-b flex items-center justify-between ${
                darkMode ? "border-slate-700" : "border-slate-200"
              }`}
            >
              <div>
                <h2 className="text-base font-bold">
                  {editingSchool ? "Edit School" : "Add School"}
                </h2>

                <p
                  className={`text-xs mt-1 ${
                    darkMode ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  {editingSchool
                    ? "Update the school's information."
                    : "Register a school for student and registrar registration."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={isSaving}
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg transition ${
                  darkMode
                    ? "text-slate-400 hover:bg-slate-800"
                    : "text-slate-500 hover:bg-slate-100"
                }`}
              >
                ×
              </button>
            </div>

            {/* MODAL FORM */}

            <form onSubmit={handleSubmit}>
              <div className="p-5 space-y-5">
                {/* SCHOOL NAME */}

                <div>
                  <label
                    htmlFor="school-name"
                    className="block text-xs font-bold mb-2"
                  >
                    School Name
                    <span className="text-red-500 ml-1">*</span>
                  </label>

                  <input
                    id="school-name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Bataan Peninsula State University"
                    disabled={isSaving}
                    className={`w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition ${
                      darkMode
                        ? "bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-slate-500"
                        : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-slate-400"
                    }`}
                  />
                </div>

                {/* SCHOOL CODE */}

                <div>
                  <label
                    htmlFor="school-code"
                    className="block text-xs font-bold mb-2"
                  >
                    School Code
                  </label>

                  <input
                    id="school-code"
                    name="code"
                    type="text"
                    value={formData.code}
                    onChange={handleChange}
                    placeholder="e.g. BPSU"
                    disabled={isSaving}
                    className={`w-full px-3 py-2.5 rounded-lg border text-sm uppercase outline-none transition ${
                      darkMode
                        ? "bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-slate-500"
                        : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-slate-400"
                    }`}
                  />

                  <p
                    className={`text-[10px] mt-1.5 ${
                      darkMode ? "text-slate-500" : "text-slate-400"
                    }`}
                  >
                    Optional. This will be shown in registration forms.
                  </p>
                </div>

                {/* STATUS */}

                <div>
                  <label
                    htmlFor="school-status"
                    className="block text-xs font-bold mb-2"
                  >
                    Status
                  </label>

                  <select
                    id="school-status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    disabled={isSaving}
                    className={`w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition ${
                      darkMode
                        ? "bg-slate-800 border-slate-700 text-white focus:border-slate-500"
                        : "bg-white border-slate-200 text-slate-900 focus:border-slate-400"
                    }`}
                  >
                    <option value="active">Active</option>

                    <option value="inactive">Inactive</option>
                  </select>

                  <p
                    className={`text-[10px] mt-1.5 ${
                      darkMode ? "text-slate-500" : "text-slate-400"
                    }`}
                  >
                    Only active schools will appear in the Student and Registrar
                    signup dropdowns.
                  </p>
                </div>
              </div>

              {/* MODAL FOOTER */}

              <div
                className={`px-5 py-4 border-t flex justify-end gap-2 ${
                  darkMode ? "border-slate-700" : "border-slate-200"
                }`}
              >
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSaving}
                  className={`px-4 py-2.5 rounded-lg text-xs font-semibold transition ${
                    darkMode
                      ? "text-slate-300 hover:bg-slate-800"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2.5 rounded-lg bg-slate-800 text-white text-xs font-semibold hover:bg-slate-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
                >
                  {isSaving
                    ? "Saving..."
                    : editingSchool
                    ? "Save Changes"
                    : "Add School"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageSchools;
