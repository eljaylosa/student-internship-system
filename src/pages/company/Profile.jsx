import React, { useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const { darkMode } = useOutletContext();

  const navigateTo = useNavigate();

  // =========================================
  // COMPANY PROFILE
  // =========================================

  const [companyDetails, setCompanyDetails] = useState({
    companyName: "ABC Corporation",
    industry: "Information Technology",
    contactPerson: "John Doe",
    email: "contact@abccorp.com",
    phone: "+63 912 345 6789",
    address: "Bataan, Philippines",
  });

  const [editDetails, setEditDetails] = useState(false);

  const [draftDetails, setDraftDetails] = useState(companyDetails);

  const [companyLogo, setCompanyLogo] = useState(null);

  const fileInputRef = useRef(null);

  // =========================================
  // JOB POSTINGS
  // =========================================

  const [jobPostings] = useState([
    {
      id: 1,
      title: "Software Engineering Intern",
      department: "IT Department",
      slots: 3,
      status: "Active",
    },
    {
      id: 2,
      title: "UI/UX Design Intern",
      department: "Design",
      slots: 2,
      status: "Active",
    },
    {
      id: 3,
      title: "Marketing Intern",
      department: "Marketing",
      slots: 2,
      status: "Open",
    },
    {
      id: 4,
      title: "Database Intern",
      department: "IT Department",
      slots: 1,
      status: "Active",
    },
  ]);

  // =========================================
  // COMMON CLASSES
  // =========================================

  const pageText = darkMode ? "text-slate-100" : "text-slate-900";

  const mutedText = darkMode ? "text-slate-400" : "text-slate-500";

  const cardClass = darkMode
    ? "bg-slate-900 border-slate-700"
    : "bg-white border-slate-200";

  const inputClass = darkMode
    ? "bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-slate-500"
    : "bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-slate-400";

  const tableHeaderClass = darkMode
    ? "bg-slate-800 border-slate-700 text-slate-300"
    : "bg-slate-50 border-slate-200 text-slate-600";

  const tableCellClass = darkMode
    ? "border-slate-700 text-slate-300"
    : "border-slate-200 text-slate-700";

  // =========================================
  // EDIT DETAILS
  // =========================================

  const handleEditDetails = () => {
    setDraftDetails(companyDetails);
    setEditDetails(true);
  };

  const handleCancelEdit = () => {
    setDraftDetails(companyDetails);
    setEditDetails(false);
  };

  const handleDetailsChange = (field, value) => {
    setDraftDetails((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveDetails = () => {
    setCompanyDetails(draftDetails);
    setEditDetails(false);
  };

  // =========================================
  // LOGO UPLOAD
  // =========================================

  const handleLogoClick = () => {
    fileInputRef.current?.click();
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }

    const imageUrl = URL.createObjectURL(file);

    setCompanyLogo(imageUrl);
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
          className={`text-xs uppercase tracking-widest font-bold mb-1 ${mutedText}`}
        >
          Company Portal
        </p>

        <h1 className={`text-2xl font-black ${pageText}`}>Company Profile</h1>

        <p className={`text-sm mt-1 ${mutedText}`}>
          Manage your company information and job postings.
        </p>
      </div>

      {/* =========================================
          PROFILE AREA
      ========================================= */}

      <section className={`border rounded-2xl p-5 md:p-7 lg:p-8 ${cardClass}`}>
        <div className="grid grid-cols-1 xl:grid-cols-[260px_minmax(0,1fr)] gap-8">
          {/* =========================================
              COMPANY LOGO
          ========================================= */}

          <div>
            <div
              className={`border rounded-xl p-5 flex flex-col items-center ${cardClass}`}
            >
              <div
                className={`w-44 h-44 sm:w-48 sm:h-48 rounded-lg border flex items-center justify-center overflow-hidden ${
                  darkMode
                    ? "bg-slate-800 border-slate-700"
                    : "bg-slate-100 border-slate-300"
                }`}
              >
                {companyLogo ? (
                  <img
                    src={companyLogo}
                    alt="Company Logo"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center">
                    <div
                      className={`text-4xl font-black ${
                        darkMode ? "text-slate-500" : "text-slate-300"
                      }`}
                    >
                      ABC
                    </div>

                    <p className={`text-[10px] mt-2 ${mutedText}`}>
                      Company Logo
                    </p>
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="hidden"
              />

              <button
                type="button"
                onClick={handleLogoClick}
                className={`mt-4 w-full px-4 py-2.5 rounded-lg text-xs font-bold transition ${
                  darkMode
                    ? "bg-slate-700 text-white hover:bg-slate-600"
                    : "bg-slate-800 text-white hover:bg-slate-700"
                }`}
              >
                Edit Logo
              </button>

              <p className={`text-[10px] text-center mt-2 ${mutedText}`}>
                JPG, PNG, or WEBP
              </p>
            </div>
          </div>

          {/* =========================================
              COMPANY DETAILS
          ========================================= */}

          <div className={`border rounded-xl p-5 md:p-6 ${cardClass}`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
              <div>
                <h2 className={`text-lg font-bold ${pageText}`}>
                  Company Details
                </h2>

                <p className={`text-xs mt-1 ${mutedText}`}>
                  Keep your company information up to date.
                </p>
              </div>

              {!editDetails && (
                <button
                  type="button"
                  onClick={handleEditDetails}
                  className={`px-5 py-2.5 rounded-lg text-xs font-bold transition ${
                    darkMode
                      ? "bg-slate-700 text-white hover:bg-slate-600"
                      : "bg-slate-800 text-white hover:bg-slate-700"
                  }`}
                >
                  Edit Details
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Company Name */}

              <div>
                <label className={`block text-xs font-bold mb-1.5 ${pageText}`}>
                  Company Name
                </label>

                <input
                  type="text"
                  value={
                    editDetails
                      ? draftDetails.companyName
                      : companyDetails.companyName
                  }
                  disabled={!editDetails}
                  onChange={(e) =>
                    handleDetailsChange("companyName", e.target.value)
                  }
                  className={`w-full h-11 px-3 rounded-lg border text-sm outline-none transition ${
                    !editDetails
                      ? darkMode
                        ? "bg-slate-800/60 border-slate-700 text-slate-400"
                        : "bg-slate-100 border-slate-200 text-slate-500"
                      : inputClass
                  }`}
                />
              </div>

              {/* Industry */}

              <div>
                <label className={`block text-xs font-bold mb-1.5 ${pageText}`}>
                  Industry
                </label>

                <input
                  type="text"
                  value={
                    editDetails
                      ? draftDetails.industry
                      : companyDetails.industry
                  }
                  disabled={!editDetails}
                  onChange={(e) =>
                    handleDetailsChange("industry", e.target.value)
                  }
                  className={`w-full h-11 px-3 rounded-lg border text-sm outline-none transition ${
                    !editDetails
                      ? darkMode
                        ? "bg-slate-800/60 border-slate-700 text-slate-400"
                        : "bg-slate-100 border-slate-200 text-slate-500"
                      : inputClass
                  }`}
                />
              </div>

              {/* Contact Person */}

              <div>
                <label className={`block text-xs font-bold mb-1.5 ${pageText}`}>
                  Contact Person
                </label>

                <input
                  type="text"
                  value={
                    editDetails
                      ? draftDetails.contactPerson
                      : companyDetails.contactPerson
                  }
                  disabled={!editDetails}
                  onChange={(e) =>
                    handleDetailsChange("contactPerson", e.target.value)
                  }
                  className={`w-full h-11 px-3 rounded-lg border text-sm outline-none transition ${
                    !editDetails
                      ? darkMode
                        ? "bg-slate-800/60 border-slate-700 text-slate-400"
                        : "bg-slate-100 border-slate-200 text-slate-500"
                      : inputClass
                  }`}
                />
              </div>

              {/* Email */}

              <div>
                <label className={`block text-xs font-bold mb-1.5 ${pageText}`}>
                  Email
                </label>

                <input
                  type="email"
                  value={
                    editDetails ? draftDetails.email : companyDetails.email
                  }
                  disabled={!editDetails}
                  onChange={(e) => handleDetailsChange("email", e.target.value)}
                  className={`w-full h-11 px-3 rounded-lg border text-sm outline-none transition ${
                    !editDetails
                      ? darkMode
                        ? "bg-slate-800/60 border-slate-700 text-slate-400"
                        : "bg-slate-100 border-slate-200 text-slate-500"
                      : inputClass
                  }`}
                />
              </div>

              {/* Phone */}

              <div>
                <label className={`block text-xs font-bold mb-1.5 ${pageText}`}>
                  Phone
                </label>

                <input
                  type="text"
                  value={
                    editDetails ? draftDetails.phone : companyDetails.phone
                  }
                  disabled={!editDetails}
                  onChange={(e) => handleDetailsChange("phone", e.target.value)}
                  className={`w-full h-11 px-3 rounded-lg border text-sm outline-none transition ${
                    !editDetails
                      ? darkMode
                        ? "bg-slate-800/60 border-slate-700 text-slate-400"
                        : "bg-slate-100 border-slate-200 text-slate-500"
                      : inputClass
                  }`}
                />
              </div>

              {/* Address */}

              <div>
                <label className={`block text-xs font-bold mb-1.5 ${pageText}`}>
                  Address
                </label>

                <input
                  type="text"
                  value={
                    editDetails ? draftDetails.address : companyDetails.address
                  }
                  disabled={!editDetails}
                  onChange={(e) =>
                    handleDetailsChange("address", e.target.value)
                  }
                  className={`w-full h-11 px-3 rounded-lg border text-sm outline-none transition ${
                    !editDetails
                      ? darkMode
                        ? "bg-slate-800/60 border-slate-700 text-slate-400"
                        : "bg-slate-100 border-slate-200 text-slate-500"
                      : inputClass
                  }`}
                />
              </div>
            </div>

            {/* SAVE / CANCEL */}

            {editDetails && (
              <div
                className={`flex flex-col sm:flex-row gap-3 mt-6 pt-5 border-t ${
                  darkMode ? "border-slate-700" : "border-slate-200"
                }`}
              >
                <button
                  type="button"
                  onClick={handleSaveDetails}
                  className="px-6 py-2.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition"
                >
                  Save Changes
                </button>

                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className={`px-6 py-2.5 rounded-lg text-xs font-bold transition ${
                    darkMode
                      ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* =========================================
            JOB POSTINGS
        ========================================= */}

        <div className={`mt-8 border rounded-xl overflow-hidden ${cardClass}`}>
          <div className="p-5 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
              <div>
                <h2 className={`text-lg font-bold ${pageText}`}>
                  Job Postings
                </h2>

                <p className={`text-xs mt-1 ${mutedText}`}>
                  Overview of your company's internship positions.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  navigateTo("/company/jobs");
                }}
                className={`px-5 py-2.5 rounded-lg text-xs font-bold transition ${
                  darkMode
                    ? "bg-slate-700 text-white hover:bg-slate-600"
                    : "bg-slate-800 text-white hover:bg-slate-700"
                }`}
              >
                Manage Jobs
              </button>
            </div>

            {/* DESKTOP TABLE */}

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th
                      className={`text-left text-xs font-bold px-4 py-3 border ${tableHeaderClass}`}
                    >
                      Position
                    </th>

                    <th
                      className={`text-left text-xs font-bold px-4 py-3 border ${tableHeaderClass}`}
                    >
                      Department
                    </th>

                    <th
                      className={`text-left text-xs font-bold px-4 py-3 border ${tableHeaderClass}`}
                    >
                      Slots
                    </th>

                    <th
                      className={`text-left text-xs font-bold px-4 py-3 border ${tableHeaderClass}`}
                    >
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {jobPostings.map((job) => (
                    <tr key={job.id}>
                      <td
                        className={`text-xs px-4 py-3 border ${tableCellClass}`}
                      >
                        {job.title}
                      </td>

                      <td
                        className={`text-xs px-4 py-3 border ${tableCellClass}`}
                      >
                        {job.department}
                      </td>

                      <td
                        className={`text-xs px-4 py-3 border ${tableCellClass}`}
                      >
                        {job.slots}
                      </td>

                      <td
                        className={`text-xs px-4 py-3 border ${tableCellClass}`}
                      >
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            job.status === "Active"
                              ? darkMode
                                ? "bg-emerald-950 text-emerald-400"
                                : "bg-emerald-50 text-emerald-700"
                              : darkMode
                              ? "bg-blue-950 text-blue-400"
                              : "bg-blue-50 text-blue-700"
                          }`}
                        >
                          {job.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* MOBILE CARDS */}

            <div className="md:hidden space-y-3">
              {jobPostings.map((job) => (
                <div
                  key={job.id}
                  className={`border rounded-lg p-4 ${
                    darkMode
                      ? "border-slate-700 bg-slate-800"
                      : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className={`text-sm font-bold ${pageText}`}>
                        {job.title}
                      </p>

                      <p className={`text-xs mt-1 ${mutedText}`}>
                        {job.department}
                      </p>
                    </div>

                    <span
                      className={`px-2 py-1 rounded-full text-[9px] font-bold ${
                        job.status === "Active"
                          ? darkMode
                            ? "bg-emerald-950 text-emerald-400"
                            : "bg-emerald-50 text-emerald-700"
                          : darkMode
                          ? "bg-blue-950 text-blue-400"
                          : "bg-blue-50 text-blue-700"
                      }`}
                    >
                      {job.status}
                    </span>
                  </div>

                  <div className={`mt-3 text-xs ${mutedText}`}>
                    Available Slots:{" "}
                    <span className={`font-bold ${pageText}`}>{job.slots}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Profile;
