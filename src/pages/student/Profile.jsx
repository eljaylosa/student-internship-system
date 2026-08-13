import React, { useRef, useState } from "react";

const Profile = () => {
  const photoInputRef = useRef(null);
  const resumeInputRef = useRef(null);

  const [isEditing, setIsEditing] = useState(false);

  // =========================================
  // PROFILE INFORMATION
  // =========================================

  const [profile, setProfile] = useState({
    fullName: "John Doe",
    studentId: "2026-00001",
    email: "john.doe@bpsu.edu.ph",
    phone: "+63 912 345 6789",
    address: "Limay, Bataan",
    emergencyContact: "Jane Doe - +63 912 987 6543",
  });

  // =========================================
  // ACADEMIC RECORDS
  // =========================================

  const [academicRecords] = useState({
    program: "BS Information Technology",
    yearLevel: "2nd Year",
    department: "College of Information and Communications Technology",
    gwa: "1.75",
  });

  // =========================================
  // UPLOAD STATES
  // =========================================

  const [profilePhoto, setProfilePhoto] = useState(null);
  const [resume, setResume] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // =========================================
  // PROFILE HANDLERS
  // =========================================

  const handleProfileChange = (field, value) => {
    setProfile((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveProfile = () => {
    setIsEditing(false);

    alert("Profile information saved successfully.");
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  // =========================================
  // PROFILE PHOTO
  // =========================================

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file.");
      return;
    }

    // Optional file-size validation
    if (file.size > 5 * 1024 * 1024) {
      alert("Profile photo must be less than 5MB.");
      return;
    }

    const imageUrl = URL.createObjectURL(file);

    setProfilePhoto(imageUrl);
  };

  // =========================================
  // RESUME
  // =========================================

  const handleResumeChange = (file) => {
    if (!file) return;

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.type)) {
      alert("Please upload a PDF, DOC, or DOCX file.");
      return;
    }

    // 10MB maximum
    if (file.size > 10 * 1024 * 1024) {
      alert("Resume must be less than 10MB.");
      return;
    }

    setResume(file);
  };

  const handleResumeInput = (e) => {
    const file = e.target.files?.[0];

    if (file) {
      handleResumeChange(file);
    }
  };

  // =========================================
  // DRAG & DROP
  // =========================================

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();

    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];

    if (file) {
      handleResumeChange(file);
    }
  };

  // =========================================
  // RENDER
  // =========================================

  return (
    <div className="p-5 md:p-6 lg:p-8 max-w-[1400px] mx-auto">
      {/* =========================================
          PAGE HEADER
      ========================================= */}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <p className="text-xs uppercase tracking-widest font-bold text-blue-600 mb-1">
            Account
          </p>

          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">
            My Profile
          </h1>

          <p className="text-sm text-slate-500 mt-1">
            View and manage your student information.
          </p>
        </div>

        {/* ACTION BUTTONS */}

        {!isEditing ? (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition shadow-sm"
          >
            Edit Profile
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCancelEdit}
              className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-semibold hover:bg-slate-50 transition"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSaveProfile}
              className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition shadow-sm"
            >
              Save Changes
            </button>
          </div>
        )}
      </div>

      {/* =========================================
          PROFILE + PERSONAL DETAILS
      ========================================= */}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        {/* =========================================
            PROFILE PHOTO
        ========================================= */}

        <section className="bg-white border border-slate-200 rounded-2xl p-6">
          <div className="mb-5">
            <h2 className="font-bold text-lg text-slate-900">Profile Photo</h2>

            <p className="text-xs text-slate-400 mt-1">Your profile picture</p>
          </div>

          <div className="flex flex-col items-center">
            {/* PHOTO */}

            <div className="w-32 h-32 rounded-2xl border border-slate-200 bg-slate-100 overflow-hidden flex items-center justify-center shadow-sm">
              {profilePhoto ? (
                <img
                  src={profilePhoto}
                  alt="Student profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto rounded-full bg-slate-200 flex items-center justify-center text-3xl">
                    👤
                  </div>

                  <p className="text-[10px] text-slate-400 mt-2">No Photo</p>
                </div>
              )}
            </div>

            {/* HIDDEN INPUT */}

            <input
              ref={photoInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handlePhotoChange}
              className="hidden"
            />

            {/* BUTTON */}

            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              className="mt-5 px-8 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition"
            >
              {profilePhoto ? "Change Photo" : "Upload Photo"}
            </button>

            <p className="text-[11px] text-slate-400 mt-3 text-center">
              JPG, PNG or WEBP • Max 5MB
            </p>
          </div>
        </section>

        {/* =========================================
            PERSONAL DETAILS
        ========================================= */}

        <section className="xl:col-span-2 bg-white border border-slate-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-bold text-lg text-slate-900">
                Personal Details
              </h2>

              <p className="text-xs text-slate-400 mt-1">
                Your registered student information
              </p>
            </div>

            {isEditing && (
              <span className="text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600">
                Editing
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* FULL NAME */}

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2">
                Full Name
              </label>

              <input
                type="text"
                value={profile.fullName}
                disabled={!isEditing}
                onChange={(e) =>
                  handleProfileChange("fullName", e.target.value)
                }
                className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition ${
                  isEditing
                    ? "bg-white border-slate-300 focus:ring-2 focus:ring-slate-200"
                    : "bg-slate-50 border-slate-200 text-slate-600"
                }`}
              />
            </div>

            {/* STUDENT ID */}

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2">
                Student ID
              </label>

              <input
                type="text"
                value={profile.studentId}
                disabled
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-sm"
              />

              <p className="text-[10px] text-slate-400 mt-1.5">
                Student ID cannot be changed.
              </p>
            </div>

            {/* EMAIL */}

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2">
                Email Address
              </label>

              <input
                type="email"
                value={profile.email}
                disabled={!isEditing}
                onChange={(e) => handleProfileChange("email", e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition ${
                  isEditing
                    ? "bg-white border-slate-300 focus:ring-2 focus:ring-slate-200"
                    : "bg-slate-50 border-slate-200 text-slate-600"
                }`}
              />
            </div>

            {/* PHONE */}

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2">
                Phone Number
              </label>

              <input
                type="text"
                value={profile.phone}
                disabled={!isEditing}
                onChange={(e) => handleProfileChange("phone", e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition ${
                  isEditing
                    ? "bg-white border-slate-300 focus:ring-2 focus:ring-slate-200"
                    : "bg-slate-50 border-slate-200 text-slate-600"
                }`}
              />
            </div>

            {/* ADDRESS */}

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2">
                Address
              </label>

              <input
                type="text"
                value={profile.address}
                disabled={!isEditing}
                onChange={(e) => handleProfileChange("address", e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition ${
                  isEditing
                    ? "bg-white border-slate-300 focus:ring-2 focus:ring-slate-200"
                    : "bg-slate-50 border-slate-200 text-slate-600"
                }`}
              />
            </div>

            {/* EMERGENCY CONTACT */}

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2">
                Emergency Contact
              </label>

              <input
                type="text"
                value={profile.emergencyContact}
                disabled={!isEditing}
                onChange={(e) =>
                  handleProfileChange("emergencyContact", e.target.value)
                }
                className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition ${
                  isEditing
                    ? "bg-white border-slate-300 focus:ring-2 focus:ring-slate-200"
                    : "bg-slate-50 border-slate-200 text-slate-600"
                }`}
              />
            </div>
          </div>
        </section>
      </div>

      {/* =========================================
          ACADEMIC RECORDS
      ========================================= */}

      <section className="bg-white border border-slate-200 rounded-2xl p-6 mb-6">
        <div className="mb-5">
          <h2 className="font-bold text-lg text-slate-900">Academic Records</h2>

          <p className="text-xs text-slate-400 mt-1">
            Current academic information
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* PROGRAM */}

          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-2">
              Program
            </p>

            <p className="text-sm font-semibold text-slate-800">
              {academicRecords.program}
            </p>
          </div>

          {/* YEAR LEVEL */}

          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-2">
              Year Level
            </p>

            <p className="text-sm font-semibold text-slate-800">
              {academicRecords.yearLevel}
            </p>
          </div>

          {/* DEPARTMENT */}

          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-2">
              Department
            </p>

            <p className="text-sm font-semibold text-slate-800">
              {academicRecords.department}
            </p>
          </div>

          {/* GWA */}

          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-2">
              GWA
            </p>

            <p className="text-sm font-semibold text-slate-800">
              {academicRecords.gwa}
            </p>
          </div>
        </div>
      </section>

      {/* =========================================
          RESUME / CV
      ========================================= */}

      <section className="bg-white border border-slate-200 rounded-2xl p-6">
        <div className="mb-5">
          <h2 className="font-bold text-lg text-slate-900">Resume / CV</h2>

          <p className="text-xs text-slate-400 mt-1">
            Upload your latest resume for internship applications.
          </p>
        </div>

        {/* HIDDEN INPUT */}

        <input
          ref={resumeInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={handleResumeInput}
          className="hidden"
        />

        {/* UPLOAD AREA */}

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => resumeInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 md:p-10 text-center cursor-pointer transition ${
            isDragging
              ? "border-blue-500 bg-blue-50"
              : "border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300"
          }`}
        >
          {resume ? (
            <>
              <div className="w-12 h-12 mx-auto rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-xl mb-3">
                ✓
              </div>

              <p className="font-semibold text-sm text-slate-800 break-all">
                {resume.name}
              </p>

              <p className="text-xs text-slate-400 mt-1">
                {(resume.size / 1024 / 1024).toFixed(2)} MB
              </p>

              <p className="text-xs text-blue-600 font-semibold mt-3">
                Click to replace file
              </p>
            </>
          ) : (
            <>
              <div className="w-12 h-12 mx-auto rounded-xl bg-slate-200 flex items-center justify-center text-xl mb-3">
                📄
              </div>

              <p className="font-semibold text-sm text-slate-700">
                Drag & Drop to Upload
              </p>

              <p className="text-xs text-slate-400 mt-1">
                or click anywhere in this area to browse
              </p>

              <p className="text-[10px] text-slate-400 mt-3">
                PDF, DOC, DOCX • Maximum 10MB
              </p>
            </>
          )}
        </div>

        {/* UPLOAD BUTTON */}

        <div className="flex justify-center mt-4">
          <button
            type="button"
            onClick={() => resumeInputRef.current?.click()}
            className="px-10 py-3 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition"
          >
            {resume ? "Replace Resume" : "Upload Resume"}
          </button>
        </div>
      </section>
    </div>
  );
};

export default Profile;
