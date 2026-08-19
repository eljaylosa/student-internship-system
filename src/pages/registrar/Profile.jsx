import React, { useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";

const Profile = () => {
  const { darkMode } = useOutletContext();

  // =========================================================
  // REGISTRAR DATA
  // =========================================================

  const registrar = {
    name: "Prof. Smith",
    employeeId: "REG-2026-001",
    email: "prof.smith@university.edu",
    department: "Information Technology",
    position: "Registrar Adviser",
    specialization: "Web Development",
  };

  // =========================================================
  // PROFILE STATE
  // =========================================================

  const initialProfile = {
    name: registrar.name,
    email: registrar.email,
    department: registrar.department,
    position: registrar.position,
    specialization: registrar.specialization,
  };

  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState(initialProfile);
  const [savedProfile, setSavedProfile] = useState(initialProfile);

  // =========================================================
  // PHOTO STATE
  // =========================================================

  const [profilePhoto, setProfilePhoto] = useState(null);
  const fileInputRef = useRef(null);

  // =========================================================
  // PROFILE HANDLERS
  // =========================================================

  const handleProfileChange = (field, value) => {
    setProfileData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleEditDetails = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setProfileData(savedProfile);
    setIsEditing(false);
  };

  const handleSaveDetails = () => {
    setSavedProfile(profileData);
    setIsEditing(false);
  };

  // =========================================================
  // PHOTO HANDLERS
  // =========================================================

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Please select an image smaller than 5MB.");
      return;
    }

    const imageUrl = URL.createObjectURL(file);

    setProfilePhoto((previousPhoto) => {
      if (previousPhoto) {
        URL.revokeObjectURL(previousPhoto);
      }

      return imageUrl;
    });
  };

  // =========================================================
  // ASSIGNED STUDENTS
  // =========================================================

  const assignedStudents = [
    {
      id: 1,
      name: "John Doe",
      studentId: "2024-00123",
      company: "Tech Solutions Inc.",
      status: "Active",
    },
    {
      id: 2,
      name: "Jane Smith",
      studentId: "2024-00124",
      company: "Digital Innovations Corp.",
      status: "Active",
    },
    {
      id: 3,
      name: "Michael Cruz",
      studentId: "2024-00125",
      company: "NextGen Software",
      status: "Pending",
    },
    {
      id: 4,
      name: "Sarah Garcia",
      studentId: "2024-00126",
      company: "CloudWorks Technologies",
      status: "Active",
    },
  ];

  // =========================================================
  // THEME CLASSES
  // =========================================================

  const pageHeadingClass = darkMode ? "text-slate-100" : "text-slate-900";

  const mutedClass = darkMode ? "text-slate-400" : "text-slate-500";

  const cardClass = darkMode
    ? "bg-slate-900 border-slate-700"
    : "bg-white border-slate-300";

  const panelClass = darkMode
    ? "bg-slate-800 border-slate-700"
    : "bg-slate-50 border-slate-200";

  const labelClass = darkMode ? "text-slate-400" : "text-slate-600";

  // =========================================================
  // INPUT CLASS
  // =========================================================

  const getInputClass = (editing = false) => {
    if (darkMode) {
      return editing
        ? "bg-slate-800 border-slate-600 text-slate-100 focus:border-slate-400"
        : "bg-slate-800 border-slate-700 text-slate-300";
    }

    return editing
      ? "bg-white border-slate-300 text-slate-800 focus:border-slate-700"
      : "bg-slate-50 border-slate-200 text-slate-700";
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="w-full min-h-full p-3 sm:p-5 md:p-6 lg:p-8">
      <div className="max-w-[1400px] mx-auto">
        {/* =====================================================
            PAGE HEADER
        ===================================================== */}

        <div className="mb-5 sm:mb-6">
          <p
            className={`text-[10px] sm:text-xs uppercase tracking-widest font-bold mb-1 ${
              darkMode ? "text-slate-500" : "text-slate-400"
            }`}
          >
            Registrar Portal
          </p>

          <h1 className={`text-xl sm:text-2xl font-black ${pageHeadingClass}`}>
            My Profile
          </h1>

          <p className={`text-xs sm:text-sm mt-1 ${mutedClass}`}>
            View and manage your registrar information and assigned students.
          </p>
        </div>

        {/* =====================================================
            PROFILE GRID
        ===================================================== */}

        <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-5">
          {/* ===================================================
              PROFILE PHOTO CARD
          =================================================== */}

          <section
            className={`border rounded-xl shadow-sm overflow-hidden ${cardClass}`}
          >
            <div className="p-5">
              {/* PHOTO */}

              <div
                className={`w-full aspect-square max-w-[220px] mx-auto rounded-xl border overflow-hidden flex items-center justify-center ${
                  darkMode
                    ? "bg-slate-800 border-slate-700"
                    : "bg-slate-100 border-slate-300"
                }`}
              >
                {profilePhoto ? (
                  <img
                    src={profilePhoto}
                    alt={`${profileData.name} profile`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className={`w-28 h-28 sm:w-32 sm:h-32 rounded-xl flex items-center justify-center text-3xl sm:text-4xl font-black ${
                      darkMode
                        ? "bg-slate-700 text-slate-300"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {profileData.name
                      .split(" ")
                      .map((word) => word[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                )}
              </div>

              {/* NAME */}

              <div className="text-center mt-5">
                <h2 className={`text-base font-bold ${pageHeadingClass}`}>
                  {profileData.name}
                </h2>

                <p className={`text-xs mt-1 ${mutedClass}`}>
                  {profileData.position}
                </p>
              </div>

              {/* HIDDEN FILE INPUT */}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />

              {/* EDIT PHOTO */}

              <button
                type="button"
                onClick={handlePhotoClick}
                className={`w-full mt-5 h-10 rounded-lg border text-xs font-bold transition ${
                  darkMode
                    ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
                    : "bg-slate-100 border-slate-300 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                }`}
              >
                {profilePhoto ? "Change Photo" : "Edit Photo"}
              </button>

              <p className={`text-[10px] text-center mt-2 ${mutedClass}`}>
                JPG, PNG, GIF, or other image files up to 5MB.
              </p>
            </div>
          </section>

          {/* ===================================================
              REGISTRAR DETAILS
          =================================================== */}

          <section
            className={`border rounded-xl shadow-sm overflow-hidden ${cardClass}`}
          >
            {/* HEADER */}

            <div
              className={`px-5 py-4 sm:px-6 sm:py-5 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
                darkMode ? "border-slate-700" : "border-slate-200"
              }`}
            >
              <div>
                <h2
                  className={`text-base sm:text-lg font-bold ${pageHeadingClass}`}
                >
                  Registrar Details
                </h2>

                <p className={`text-xs mt-1 ${mutedClass}`}>
                  Manage your registrar information.
                </p>
              </div>

              {/* EDIT / SAVE / CANCEL */}

              {!isEditing ? (
                <button
                  type="button"
                  onClick={handleEditDetails}
                  className={`h-9 px-4 rounded-lg text-xs font-bold transition ${
                    darkMode
                      ? "bg-slate-700 text-slate-100 hover:bg-slate-600"
                      : "bg-slate-800 text-white hover:bg-slate-700"
                  }`}
                >
                  Edit Details
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className={`h-9 px-4 rounded-lg border text-xs font-bold transition ${
                      darkMode
                        ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                        : "bg-white border-slate-300 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveDetails}
                    className="h-9 px-4 rounded-lg bg-slate-800 text-white text-xs font-bold hover:bg-slate-700 transition"
                  >
                    Save Changes
                  </button>
                </div>
              )}
            </div>

            {/* DETAILS */}

            <div className="p-5 sm:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* FULL NAME */}

                <div>
                  <label
                    className={`block text-xs font-bold mb-1.5 ${labelClass}`}
                  >
                    Full Name
                  </label>

                  <input
                    type="text"
                    value={profileData.name}
                    disabled={!isEditing}
                    onChange={(e) =>
                      handleProfileChange("name", e.target.value)
                    }
                    className={`w-full h-11 px-3 rounded-lg border text-xs sm:text-sm outline-none transition ${getInputClass(
                      isEditing
                    )}`}
                  />
                </div>

                {/* EMPLOYEE ID */}

                <div>
                  <label
                    className={`block text-xs font-bold mb-1.5 ${labelClass}`}
                  >
                    Employee ID
                  </label>

                  <input
                    type="text"
                    value={registrar.employeeId}
                    disabled
                    className={`w-full h-11 px-3 rounded-lg border text-xs sm:text-sm outline-none ${
                      darkMode
                        ? "bg-slate-800 border-slate-700 text-slate-500"
                        : "bg-slate-100 border-slate-200 text-slate-500"
                    }`}
                  />
                </div>

                {/* EMAIL */}

                <div>
                  <label
                    className={`block text-xs font-bold mb-1.5 ${labelClass}`}
                  >
                    Email
                  </label>

                  <input
                    type="email"
                    value={profileData.email}
                    disabled={!isEditing}
                    onChange={(e) =>
                      handleProfileChange("email", e.target.value)
                    }
                    className={`w-full h-11 px-3 rounded-lg border text-xs sm:text-sm outline-none transition ${getInputClass(
                      isEditing
                    )}`}
                  />
                </div>

                {/* DEPARTMENT */}

                <div>
                  <label
                    className={`block text-xs font-bold mb-1.5 ${labelClass}`}
                  >
                    Department
                  </label>

                  <input
                    type="text"
                    value={profileData.department}
                    disabled={!isEditing}
                    onChange={(e) =>
                      handleProfileChange("department", e.target.value)
                    }
                    className={`w-full h-11 px-3 rounded-lg border text-xs sm:text-sm outline-none transition ${getInputClass(
                      isEditing
                    )}`}
                  />
                </div>

                {/* POSITION */}

                <div>
                  <label
                    className={`block text-xs font-bold mb-1.5 ${labelClass}`}
                  >
                    Position
                  </label>

                  <input
                    type="text"
                    value={profileData.position}
                    disabled={!isEditing}
                    onChange={(e) =>
                      handleProfileChange("position", e.target.value)
                    }
                    className={`w-full h-11 px-3 rounded-lg border text-xs sm:text-sm outline-none transition ${getInputClass(
                      isEditing
                    )}`}
                  />
                </div>

                {/* SPECIALIZATION */}

                <div>
                  <label
                    className={`block text-xs font-bold mb-1.5 ${labelClass}`}
                  >
                    Specialization
                  </label>

                  <input
                    type="text"
                    value={profileData.specialization}
                    disabled={!isEditing}
                    onChange={(e) =>
                      handleProfileChange("specialization", e.target.value)
                    }
                    className={`w-full h-11 px-3 rounded-lg border text-xs sm:text-sm outline-none transition ${getInputClass(
                      isEditing
                    )}`}
                  />
                </div>
              </div>

              {/* INFO */}

              <div className={`mt-6 p-4 rounded-lg border ${panelClass}`}>
                <p
                  className={`text-xs font-bold mb-1 ${
                    darkMode ? "text-slate-200" : "text-slate-700"
                  }`}
                >
                  Profile Information
                </p>

                <p className={`text-xs leading-relaxed ${mutedClass}`}>
                  Keep your registrar information accurate and up to date.
                  Employee ID is managed by the institution and cannot be
                  changed here.
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* =====================================================
            ASSIGNED STUDENTS
        ===================================================== */}

        <section
          className={`mt-5 border rounded-xl shadow-sm overflow-hidden ${cardClass}`}
        >
          {/* HEADER */}

          <div
            className={`px-5 py-4 sm:px-6 sm:py-5 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 ${
              darkMode ? "border-slate-700" : "border-slate-200"
            }`}
          >
            <div>
              <h2
                className={`text-base sm:text-lg font-bold ${pageHeadingClass}`}
              >
                Assigned Students Overview
              </h2>

              <p className={`text-xs mt-1 ${mutedClass}`}>
                Students currently assigned to you and their internship
                companies.
              </p>
            </div>

            <span
              className={`self-start sm:self-auto px-3 py-1.5 rounded-md text-[10px] font-bold ${
                darkMode
                  ? "bg-slate-800 text-slate-400"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {assignedStudents.length} Students
            </span>
          </div>

          {/* STUDENT TABLE */}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr
                  className={`border-b ${
                    darkMode
                      ? "bg-slate-800 border-slate-700"
                      : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <th
                    className={`px-5 py-3 text-left text-[10px] uppercase tracking-wide font-bold ${mutedClass}`}
                  >
                    Student
                  </th>

                  <th
                    className={`px-5 py-3 text-left text-[10px] uppercase tracking-wide font-bold ${mutedClass}`}
                  >
                    Student ID
                  </th>

                  <th
                    className={`px-5 py-3 text-left text-[10px] uppercase tracking-wide font-bold ${mutedClass}`}
                  >
                    Assigned Company
                  </th>

                  <th
                    className={`px-5 py-3 text-left text-[10px] uppercase tracking-wide font-bold ${mutedClass}`}
                  >
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {assignedStudents.map((student) => (
                  <tr
                    key={student.id}
                    className={`border-b last:border-b-0 transition ${
                      darkMode
                        ? "border-slate-700 hover:bg-slate-800"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {/* STUDENT */}

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center text-[10px] font-bold ${
                            darkMode
                              ? "bg-slate-800 text-slate-300"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {student.name
                            .split(" ")
                            .map((word) => word[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>

                        <div>
                          <p
                            className={`text-xs font-bold ${
                              darkMode ? "text-slate-100" : "text-slate-900"
                            }`}
                          >
                            {student.name}
                          </p>

                          <p className={`text-[10px] mt-0.5 ${mutedClass}`}>
                            Assigned Student
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* STUDENT ID */}

                    <td className={`px-5 py-4 text-xs ${mutedClass}`}>
                      {student.studentId}
                    </td>

                    {/* ASSIGNED COMPANY */}

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                            darkMode
                              ? "bg-slate-800 text-slate-300"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          🏢
                        </div>

                        <div>
                          <p
                            className={`text-xs font-semibold ${
                              darkMode ? "text-slate-200" : "text-slate-800"
                            }`}
                          >
                            {student.company}
                          </p>

                          <p className={`text-[10px] mt-0.5 ${mutedClass}`}>
                            Internship Company
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* STATUS */}

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-md text-[10px] font-bold ${
                          student.status === "Active"
                            ? darkMode
                              ? "bg-emerald-950 text-emerald-400"
                              : "bg-emerald-50 text-emerald-700"
                            : darkMode
                            ? "bg-amber-950 text-amber-400"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {student.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* MOBILE NOTE */}

          <div
            className={`px-5 py-3 border-t text-[10px] md:hidden ${
              darkMode
                ? "border-slate-700 text-slate-500"
                : "border-slate-200 text-slate-400"
            }`}
          >
            Swipe horizontally to view all student information.
          </div>
        </section>
      </div>
    </div>
  );
};

export default Profile;
