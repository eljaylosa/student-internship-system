import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";

const Profile = () => {
  const { darkMode } = useOutletContext();

  // =========================================================
  // PROFILE STATE
  // =========================================================

  const [profile, setProfile] = useState({
    firstName: "System",
    lastName: "Administrator",
    email: "admin@sims.edu.ph",
    contactNumber: "09123456789",
    username: "administrator",
    position: "System Administrator",
  });

  // =========================================================
  // PASSWORD STATE
  // =========================================================

  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // =========================================================
  // STATUS
  // =========================================================

  const [profileSaved, setProfileSaved] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // =========================================================
  // UPDATE PROFILE
  // =========================================================

  const updateProfile = (key, value) => {
    setProfile((prev) => ({
      ...prev,
      [key]: value,
    }));

    setProfileSaved(false);
  };

  // =========================================================
  // UPDATE PASSWORD
  // =========================================================

  const updatePassword = (key, value) => {
    setPasswords((prev) => ({
      ...prev,
      [key]: value,
    }));

    setPasswordMessage("");
    setPasswordError("");
  };

  // =========================================================
  // SAVE PROFILE
  // =========================================================

  const handleSaveProfile = () => {
    setProfileSaved(true);

    setTimeout(() => {
      setProfileSaved(false);
    }, 3000);
  };

  // =========================================================
  // CHANGE PASSWORD
  // =========================================================

  const handleChangePassword = () => {
    setPasswordMessage("");
    setPasswordError("");

    if (
      !passwords.currentPassword ||
      !passwords.newPassword ||
      !passwords.confirmPassword
    ) {
      setPasswordError("Please complete all password fields.");
      return;
    }

    if (passwords.newPassword.length < 8) {
      setPasswordError("New password must contain at least 8 characters.");
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      setPasswordError("New password and confirmation do not match.");
      return;
    }

    setPasswordMessage("Password changed successfully.");

    setPasswords({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  // =========================================================
  // RESET PROFILE
  // =========================================================

  const handleResetProfile = () => {
    setProfile({
      firstName: "System",
      lastName: "Administrator",
      email: "admin@sims.edu.ph",
      contactNumber: "09123456789",
      username: "administrator",
      position: "System Administrator",
    });

    setProfileSaved(false);
  };

  // =========================================================
  // STYLES
  // =========================================================

  const cardClass = `
    border rounded-lg transition-colors duration-300
    ${darkMode ? "bg-slate-900 border-slate-700" : "bg-white border-slate-300"}
  `;

  const inputClass = `
    w-full px-3 py-2.5 text-xs rounded-md border outline-none transition
    ${
      darkMode
        ? "bg-slate-800 border-slate-700 text-slate-100 focus:border-blue-500"
        : "bg-white border-slate-300 text-slate-900 focus:border-slate-500"
    }
  `;

  const labelClass = `
    block text-[11px] font-semibold mb-1.5
    ${darkMode ? "text-slate-300" : "text-slate-700"}
  `;

  // =========================================================
  // PASSWORD INPUT
  // =========================================================

  const PasswordInput = ({
    label,
    value,
    onChange,
    showPassword,
    setShowPassword,
    placeholder,
  }) => {
    return (
      <div>
        <label className={labelClass}>{label}</label>

        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={`${inputClass} pr-16`}
          />

          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className={`absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-[10px] font-semibold ${
              darkMode
                ? "text-slate-400 hover:text-white"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
      </div>
    );
  };

  // =========================================================
  // RETURN
  // =========================================================

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="mb-6">
        <h1
          className={`text-xl sm:text-2xl font-bold ${
            darkMode ? "text-white" : "text-slate-900"
          }`}
        >
          Administrator Profile
        </h1>

        <p
          className={`text-xs sm:text-sm mt-1 ${
            darkMode ? "text-slate-400" : "text-slate-500"
          }`}
        >
          Manage your administrator account information and security settings.
        </p>
      </div>

      {/* =====================================================
          DEMO NOTICE
      ===================================================== */}

      <div
        className={`mb-5 p-3 rounded-lg border text-[10px] leading-relaxed ${
          darkMode
            ? "bg-red-950/40 border-red-900 text-red-300"
            : "bg-red-50 border-red-200 text-red-700"
        }`}
      >
        <p className="font-bold mb-1">⚠️ Demo Project</p>

        <p>
          Profile changes and password changes are currently simulated. No
          database is connected yet.
        </p>
      </div>

      {/* =====================================================
          PROFILE CARD
      ===================================================== */}

      <section className={`${cardClass} p-4 sm:p-6 mb-5`}>
        {/* PROFILE HEADER */}

        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0 ${
              darkMode ? "bg-white text-slate-900" : "bg-slate-800 text-white"
            }`}
          >
            SA
          </div>

          <div>
            <h2
              className={`text-base font-bold ${
                darkMode ? "text-white" : "text-slate-900"
              }`}
            >
              System Administrator
            </h2>

            <p
              className={`text-xs mt-1 ${
                darkMode ? "text-slate-400" : "text-slate-500"
              }`}
            >
              Administrator Account
            </p>

            <span className="inline-flex mt-2 px-2 py-1 rounded text-[9px] font-bold bg-green-100 text-green-700">
              ACTIVE
            </span>
          </div>
        </div>

        {/* PROFILE INFORMATION */}

        <div
          className={`border-t pt-5 ${
            darkMode ? "border-slate-700" : "border-slate-200"
          }`}
        >
          <h3
            className={`text-sm font-bold mb-4 ${
              darkMode ? "text-white" : "text-slate-900"
            }`}
          >
            Personal Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* FIRST NAME */}

            <div>
              <label className={labelClass}>First Name</label>

              <input
                type="text"
                value={profile.firstName}
                onChange={(e) => updateProfile("firstName", e.target.value)}
                className={inputClass}
              />
            </div>

            {/* LAST NAME */}

            <div>
              <label className={labelClass}>Last Name</label>

              <input
                type="text"
                value={profile.lastName}
                onChange={(e) => updateProfile("lastName", e.target.value)}
                className={inputClass}
              />
            </div>

            {/* EMAIL */}

            <div>
              <label className={labelClass}>Email Address</label>

              <input
                type="email"
                value={profile.email}
                onChange={(e) => updateProfile("email", e.target.value)}
                className={inputClass}
              />
            </div>

            {/* CONTACT */}

            <div>
              <label className={labelClass}>Contact Number</label>

              <input
                type="text"
                value={profile.contactNumber}
                onChange={(e) => updateProfile("contactNumber", e.target.value)}
                className={inputClass}
              />
            </div>

            {/* USERNAME */}

            <div>
              <label className={labelClass}>Username</label>

              <input
                type="text"
                value={profile.username}
                onChange={(e) => updateProfile("username", e.target.value)}
                className={inputClass}
              />
            </div>

            {/* POSITION */}

            <div>
              <label className={labelClass}>Position</label>

              <input
                type="text"
                value={profile.position}
                onChange={(e) => updateProfile("position", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* PROFILE ACTIONS */}

        <div
          className={`mt-6 pt-5 border-t flex flex-col sm:flex-row items-stretch sm:items-center gap-2 ${
            darkMode ? "border-slate-700" : "border-slate-200"
          }`}
        >
          <button
            type="button"
            onClick={handleSaveProfile}
            className={`px-5 py-2.5 rounded-md text-xs font-bold transition ${
              darkMode
                ? "bg-white text-slate-900 hover:bg-slate-200"
                : "bg-slate-800 text-white hover:bg-slate-700"
            }`}
          >
            Save Profile
          </button>

          <button
            type="button"
            onClick={handleResetProfile}
            className={`px-5 py-2.5 rounded-md text-xs font-bold border transition ${
              darkMode
                ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                : "border-slate-300 text-slate-600 hover:bg-slate-100"
            }`}
          >
            Reset
          </button>

          {profileSaved && (
            <span
              className={`text-xs font-semibold sm:ml-2 ${
                darkMode ? "text-green-400" : "text-green-600"
              }`}
            >
              ✓ Profile updated successfully.
            </span>
          )}
        </div>
      </section>

      {/* =====================================================
          CHANGE PASSWORD
      ===================================================== */}

      <section className={`${cardClass} p-4 sm:p-6`}>
        <div className="mb-5">
          <h2
            className={`text-sm font-bold ${
              darkMode ? "text-white" : "text-slate-900"
            }`}
          >
            Change Password
          </h2>

          <p
            className={`text-[10px] mt-1 ${
              darkMode ? "text-slate-500" : "text-slate-500"
            }`}
          >
            Update your administrator account password.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* CURRENT PASSWORD */}

          <PasswordInput
            label="Current Password"
            value={passwords.currentPassword}
            onChange={(value) => updatePassword("currentPassword", value)}
            showPassword={showCurrentPassword}
            setShowPassword={setShowCurrentPassword}
            placeholder="Enter current password"
          />

          {/* NEW PASSWORD */}

          <PasswordInput
            label="New Password"
            value={passwords.newPassword}
            onChange={(value) => updatePassword("newPassword", value)}
            showPassword={showNewPassword}
            setShowPassword={setShowNewPassword}
            placeholder="Enter new password"
          />

          {/* CONFIRM PASSWORD */}

          <PasswordInput
            label="Confirm New Password"
            value={passwords.confirmPassword}
            onChange={(value) => updatePassword("confirmPassword", value)}
            showPassword={showConfirmPassword}
            setShowPassword={setShowConfirmPassword}
            placeholder="Confirm new password"
          />
        </div>

        <p
          className={`text-[10px] mt-3 ${
            darkMode ? "text-slate-500" : "text-slate-500"
          }`}
        >
          Password must contain at least 8 characters.
        </p>

        {/* PASSWORD MESSAGE */}

        {passwordError && (
          <div className="mt-4 p-3 rounded-md text-xs font-semibold bg-red-50 border border-red-200 text-red-700">
            {passwordError}
          </div>
        )}

        {passwordMessage && (
          <div className="mt-4 p-3 rounded-md text-xs font-semibold bg-green-50 border border-green-200 text-green-700">
            ✓ {passwordMessage}
          </div>
        )}

        {/* PASSWORD BUTTON */}

        <div className="mt-5">
          <button
            type="button"
            onClick={handleChangePassword}
            className={`px-5 py-2.5 rounded-md text-xs font-bold transition ${
              darkMode
                ? "bg-white text-slate-900 hover:bg-slate-200"
                : "bg-slate-800 text-white hover:bg-slate-700"
            }`}
          >
            Change Password
          </button>
        </div>
      </section>
    </div>
  );
};

export default Profile;
