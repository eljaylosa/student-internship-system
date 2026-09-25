import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "../../supabaseClient";

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
    labelClass,
    inputClass,
    darkMode,
    disabled,
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
            disabled={disabled}
          />

          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            disabled={disabled}
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


const Profile = () => {
  const { darkMode } = useOutletContext();

  // =========================================================
  // PROFILE STATE
  // =========================================================

  const [profile, setProfile] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    role: "admin",
    status: "active",
  });

  const [originalProfile, setOriginalProfile] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    role: "admin",
    status: "active",
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

  const [loading, setLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState("");

  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // =========================================================
  // LOAD PROFILE
  // =========================================================

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setProfileError("");

      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        throw authError;
      }

      if (!authUser) {
        throw new Error("Your administrator session is no longer valid.");
      }

      const { data: userRecord, error: userError } = await supabase
        .from("users")
        .select(
          `
          id,
          email,
          role,
          first_name,
          middle_name,
          last_name,
          status
        `
        )
        .eq("id", authUser.id)
        .maybeSingle();

      if (userError) {
        throw userError;
      }

      if (!userRecord) {
        throw new Error("Administrator profile could not be found.");
      }

      if (userRecord.role !== "admin") {
        throw new Error("This account does not have administrator access.");
      }

      const loadedProfile = {
        firstName: userRecord.first_name || "",
        middleName: userRecord.middle_name || "",
        lastName: userRecord.last_name || "",
        email: userRecord.email || authUser.email || "",
        role: userRecord.role || "admin",
        status: userRecord.status || "active",
      };

      setProfile(loadedProfile);
      setOriginalProfile(loadedProfile);
    } catch (error) {
      console.error("Load admin profile error:", error);
      setProfileError(
        error?.message || "Failed to load administrator profile."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // UPDATE PROFILE
  // =========================================================

  const updateProfile = (key, value) => {
    setProfile((prev) => ({
      ...prev,
      [key]: value,
    }));

    setProfileSaved(false);
    setProfileError("");
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

  const handleSaveProfile = async () => {
    if (profileSaving) return;

    const firstName = profile.firstName.trim();
    const middleName = profile.middleName.trim();
    const lastName = profile.lastName.trim();

    if (!firstName || !lastName) {
      setProfileError("First Name and Last Name are required.");
      setProfileSaved(false);
      return;
    }

    try {
      setProfileSaving(true);
      setProfileSaved(false);
      setProfileError("");

      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        throw authError;
      }

      if (!authUser || authUser.id !== originalProfile.id) {
        // The profile does not expose the ID to the UI, so this check
        // is intentionally handled again below using the authenticated user.
      }

      if (!authUser) {
        throw new Error("Your administrator session is no longer valid.");
      }

      const { data: currentUser, error: currentUserError } = await supabase
        .from("users")
        .select(
          `
          id,
          email,
          role,
          first_name,
          middle_name,
          last_name,
          status
        `
        )
        .eq("id", authUser.id)
        .maybeSingle();

      if (currentUserError) {
        throw currentUserError;
      }

      if (!currentUser) {
        throw new Error("Administrator profile could not be found.");
      }

      if (currentUser.role !== "admin") {
        throw new Error("This account does not have administrator access.");
      }

      const { data: updatedUser, error: updateError } = await supabase
        .from("users")
        .update({
          first_name: firstName,
          middle_name: middleName || null,
          last_name: lastName,
          updated_at: new Date().toISOString(),
        })
        .eq("id", authUser.id)
        .select(
          `
          id,
          email,
          role,
          first_name,
          middle_name,
          last_name,
          status
        `
        )
        .maybeSingle();

      if (updateError) {
        throw updateError;
      }

      if (!updatedUser) {
        throw new Error("Unable to retrieve the updated profile.");
      }

      // -------------------------------------------------------
      // Create audit log after successful update
      // -------------------------------------------------------

      const changedFields = [];

      if ((currentUser.first_name || "") !== (updatedUser.first_name || "")) {
        changedFields.push("first_name");
      }

      if ((currentUser.middle_name || "") !== (updatedUser.middle_name || "")) {
        changedFields.push("middle_name");
      }

      if ((currentUser.last_name || "") !== (updatedUser.last_name || "")) {
        changedFields.push("last_name");
      }

      if (changedFields.length > 0) {
        const { error: auditError } = await supabase.functions.invoke(
          "create-audit-log",
          {
            body: {
              action: "UPDATE",
              module: "Administrator Profile",
              target_entity_type: "User",
              target_entity_id: authUser.id,
              details: {
                name:
                  [
                    updatedUser.first_name,
                    updatedUser.middle_name,
                    updatedUser.last_name,
                  ]
                    .filter(Boolean)
                    .join(" ")
                    .trim() || "System Administrator",

                role: updatedUser.role,

                email: updatedUser.email || authUser.email || null,

                updated_fields: changedFields,

                previous_values: {
                  first_name: currentUser.first_name || null,
                  middle_name: currentUser.middle_name || null,
                  last_name: currentUser.last_name || null,
                },

                new_values: {
                  first_name: updatedUser.first_name || null,
                  middle_name: updatedUser.middle_name || null,
                  last_name: updatedUser.last_name || null,
                },
              },
            },
          }
        );

        if (auditError) {
          console.error("Profile update audit log error:", auditError);
        }
      }

      const updatedProfile = {
        firstName: updatedUser.first_name || "",
        middleName: updatedUser.middle_name || "",
        lastName: updatedUser.last_name || "",
        email: updatedUser.email || authUser.email || "",
        role: updatedUser.role || "admin",
        status: updatedUser.status || "active",
      };

      setProfile(updatedProfile);
      setOriginalProfile(updatedProfile);
      setProfileSaved(true);

      setTimeout(() => {
        setProfileSaved(false);
      }, 3000);
    } catch (error) {
      console.error("Update admin profile error:", error);

      setProfileError(
        error?.message || "Failed to update administrator profile."
      );
    } finally {
      setProfileSaving(false);
    }
  };

  // =========================================================
  // CHANGE PASSWORD
  // =========================================================

  const handleChangePassword = async () => {
    if (passwordSaving) return;

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

    if (passwords.currentPassword === passwords.newPassword) {
      setPasswordError(
        "New password must be different from your current password."
      );
      return;
    }

    try {
      setPasswordSaving(true);

      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        throw authError;
      }

      if (!authUser || !authUser.email) {
        throw new Error("Your administrator session is no longer valid.");
      }

      const { data: userRecord, error: userRecordError } = await supabase
        .from("users")
        .select(
          `
          id,
          email,
          role,
          first_name,
          middle_name,
          last_name,
          status
        `
        )
        .eq("id", authUser.id)
        .maybeSingle();

      if (userRecordError) {
        throw userRecordError;
      }

      if (!userRecord) {
        throw new Error("Administrator profile could not be found.");
      }

      if (userRecord.role !== "admin") {
        throw new Error("This account does not have administrator access.");
      }

      // -------------------------------------------------------
      // Verify current password
      // -------------------------------------------------------

      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: authUser.email,
        password: passwords.currentPassword,
      });

      if (verifyError) {
        throw new Error("Current password is incorrect.");
      }

      // -------------------------------------------------------
      // Update password
      // -------------------------------------------------------

      const { error: passwordUpdateError } = await supabase.auth.updateUser({
        password: passwords.newPassword,
      });

      if (passwordUpdateError) {
        throw passwordUpdateError;
      }

      // -------------------------------------------------------
      // Create audit log after successful password change
      // -------------------------------------------------------

      const { error: auditError } = await supabase.functions.invoke(
        "create-audit-log",
        {
          body: {
            action: "UPDATE",
            module: "Authentication",
            target_entity_type: "User",
            target_entity_id: authUser.id,
            details: {
              name:
                [
                  userRecord.first_name,
                  userRecord.middle_name,
                  userRecord.last_name,
                ]
                  .filter(Boolean)
                  .join(" ")
                  .trim() || "System Administrator",

              role: userRecord.role,

              email: userRecord.email || authUser.email || null,

              updated_fields: ["password"],
            },
          },
        }
      );

      if (auditError) {
        console.error("Password change audit log error:", auditError);
      }

      setPasswordMessage("Password changed successfully.");

      setPasswords({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    } catch (error) {
      console.error("Change admin password error:", error);

      setPasswordError(
        error?.message || "Failed to change administrator password."
      );
    } finally {
      setPasswordSaving(false);
    }
  };

  // =========================================================
  // RESET PROFILE
  // =========================================================

  const handleResetProfile = () => {
    setProfile({
      ...originalProfile,
    });

    setProfileSaved(false);
    setProfileError("");
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
  // RETURN
  // =========================================================

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="animate-pulse">
          <div
            className={`h-7 w-56 rounded mb-2 ${
              darkMode ? "bg-slate-800" : "bg-slate-200"
            }`}
          />

          <div
            className={`h-4 w-96 max-w-full rounded mb-6 ${
              darkMode ? "bg-slate-800" : "bg-slate-200"
            }`}
          />

          <div
            className={`h-48 rounded-lg ${
              darkMode ? "bg-slate-900" : "bg-slate-100"
            }`}
          />
        </div>
      </div>
    );
  }

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

      {profileError && (
        <div
          className={`mb-5 p-3 rounded-lg border text-xs font-semibold ${
            darkMode
              ? "bg-red-950/40 border-red-900 text-red-300"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          {profileError}
        </div>
      )}

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
              {profile.firstName} {profile.middleName} {profile.lastName}
            </h2>

            <p
              className={`text-xs mt-1 ${
                darkMode ? "text-slate-400" : "text-slate-500"
              }`}
            >
              Administrator Account
            </p>

            <span className="inline-flex mt-2 px-2 py-1 rounded text-[9px] font-bold bg-green-100 text-green-700">
              {profile.status.toUpperCase()}
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
                disabled={profileSaving}
              />
            </div>

            {/* MIDDLE NAME */}

            <div>
              <label className={labelClass}>Middle Name</label>

              <input
                type="text"
                value={profile.middleName}
                onChange={(e) => updateProfile("middleName", e.target.value)}
                className={inputClass}
                disabled={profileSaving}
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
                disabled={profileSaving}
              />
            </div>

            {/* EMAIL */}

            <div>
              <label className={labelClass}>Email Address</label>

              <input
                type="email"
                value={profile.email}
                className={`${inputClass} cursor-not-allowed opacity-70`}
                disabled
              />

              <p
                className={`text-[9px] mt-1 ${
                  darkMode ? "text-slate-500" : "text-slate-500"
                }`}
              >
                Email is tied to your authenticated administrator account.
              </p>
            </div>

            {/* ROLE */}

            <div>
              <label className={labelClass}>Role</label>

              <input
                type="text"
                value="System Administrator"
                className={`${inputClass} cursor-not-allowed opacity-70`}
                disabled
              />
            </div>

            {/* POSITION */}

            <div>
              <label className={labelClass}>Position</label>

              <input
                type="text"
                value="System Administrator"
                className={`${inputClass} cursor-not-allowed opacity-70`}
                disabled
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
            disabled={profileSaving}
            className={`px-5 py-2.5 rounded-md text-xs font-bold transition ${
              profileSaving ? "opacity-60 cursor-not-allowed" : ""
            } ${
              darkMode
                ? "bg-white text-slate-900 hover:bg-slate-200"
                : "bg-slate-800 text-white hover:bg-slate-700"
            }`}
          >
            {profileSaving ? "Saving..." : "Save Profile"}
          </button>

          <button
            type="button"
            onClick={handleResetProfile}
            disabled={profileSaving}
            className={`px-5 py-2.5 rounded-md text-xs font-bold border transition ${
              profileSaving ? "opacity-60 cursor-not-allowed" : ""
            } ${
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
            labelClass={labelClass}
            inputClass={inputClass}
            darkMode={darkMode}
            disabled={passwordSaving}
          />

          {/* NEW PASSWORD */}

          <PasswordInput
            label="New Password"
            value={passwords.newPassword}
            onChange={(value) => updatePassword("newPassword", value)}
            showPassword={showNewPassword}
            setShowPassword={setShowNewPassword}
            placeholder="Enter new password"
            labelClass={labelClass}
            inputClass={inputClass}
            darkMode={darkMode}
            disabled={passwordSaving}
          />

          {/* CONFIRM PASSWORD */}

          <PasswordInput
            label="Confirm New Password"
            value={passwords.confirmPassword}
            onChange={(value) => updatePassword("confirmPassword", value)}
            showPassword={showConfirmPassword}
            setShowPassword={setShowConfirmPassword}
            placeholder="Confirm new password"
            labelClass={labelClass}
            inputClass={inputClass}
            darkMode={darkMode}
            disabled={passwordSaving}
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
            disabled={passwordSaving}
            className={`px-5 py-2.5 rounded-md text-xs font-bold transition ${
              passwordSaving ? "opacity-60 cursor-not-allowed" : ""
            } ${
              darkMode
                ? "bg-white text-slate-900 hover:bg-slate-200"
                : "bg-slate-800 text-white hover:bg-slate-700"
            }`}
          >
            {passwordSaving ? "Changing Password..." : "Change Password"}
          </button>
        </div>
      </section>
    </div>
  );
};

export default Profile;
