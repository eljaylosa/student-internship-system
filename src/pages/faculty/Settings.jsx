import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";

const Settings = () => {
  const { darkMode } = useOutletContext();

  // =========================================================
  // PROFILE
  // =========================================================

  const [profile, setProfile] = useState({
    name: "Prof. Smith",
    email: "prof.smith@university.edu",
    phone: "+63 912 345 6789",
    department: "Information Technology",
  });

  const [profileMessage, setProfileMessage] = useState("");

  // =========================================================
  // NOTIFICATIONS
  // =========================================================

  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    systemUpdates: true,
    studentSubmissions: true,
  });

  // =========================================================
  // SECURITY
  // =========================================================

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [securityMessage, setSecurityMessage] = useState("");

  // =========================================================
  // CHANGE PASSWORD
  // =========================================================

  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const [passwords, setPasswords] = useState({
    current: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [passwordMessage, setPasswordMessage] = useState({
    type: "",
    text: "",
  });

  // =========================================================
  // THEME CLASSES
  // =========================================================

  const pageTitleClass = darkMode ? "text-slate-100" : "text-slate-900";

  const headingClass = darkMode ? "text-slate-100" : "text-slate-900";

  const bodyTextClass = darkMode ? "text-slate-400" : "text-slate-500";

  const labelClass = darkMode ? "text-slate-300" : "text-slate-700";

  const panelClass = darkMode
    ? "bg-slate-800 border-slate-700"
    : "bg-white border-slate-300";

  const sectionCardClass = darkMode
    ? "bg-slate-800 border-slate-700"
    : "bg-white border-slate-200";

  const inputClass = darkMode
    ? "bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-slate-500"
    : "bg-slate-50 border-slate-300 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-slate-700";

  const dividerClass = darkMode ? "border-slate-700" : "border-slate-200";

  // =========================================================
  // PROFILE HANDLERS
  // =========================================================

  const handleProfileChange = (field, value) => {
    setProfile((prev) => ({
      ...prev,
      [field]: value,
    }));

    setProfileMessage("");
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();

    setProfileMessage("Profile settings saved successfully.");

    setTimeout(() => {
      setProfileMessage("");
    }, 3000);
  };

  // =========================================================
  // NOTIFICATION HANDLER
  // =========================================================

  const toggleNotification = (type) => {
    setNotifications((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  // =========================================================
  // 2FA HANDLER
  // =========================================================

  const handleToggle2FA = () => {
    const newValue = !twoFactorEnabled;

    setTwoFactorEnabled(newValue);

    setSecurityMessage(
      newValue
        ? "Two-factor authentication has been enabled."
        : "Two-factor authentication has been disabled."
    );

    setTimeout(() => {
      setSecurityMessage("");
    }, 3000);
  };

  // =========================================================
  // PASSWORD HANDLERS
  // =========================================================

  const handlePasswordChange = (field, value) => {
    setPasswords((prev) => ({
      ...prev,
      [field]: value,
    }));

    setPasswordMessage({
      type: "",
      text: "",
    });
  };

  const handleChangePassword = (e) => {
    e.preventDefault();

    const { current, newPassword, confirmPassword } = passwords;

    if (!current || !newPassword || !confirmPassword) {
      setPasswordMessage({
        type: "error",
        text: "Please complete all password fields.",
      });

      return;
    }

    if (newPassword.length < 8) {
      setPasswordMessage({
        type: "error",
        text: "New password must be at least 8 characters.",
      });

      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({
        type: "error",
        text: "New password and confirmation do not match.",
      });

      return;
    }

    setPasswordMessage({
      type: "success",
      text: "Password changed successfully.",
    });

    setPasswords({
      current: "",
      newPassword: "",
      confirmPassword: "",
    });

    setTimeout(() => {
      setShowPasswordForm(false);
      setPasswordMessage({
        type: "",
        text: "",
      });
    }, 1500);
  };

  // =========================================================
  // NOTIFICATION SWITCH
  // =========================================================

  const NotificationSwitch = ({ enabled, onClick, label }) => (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Toggle ${label}`}
      className={`
        relative
        flex-shrink-0
        w-11
        h-6
        rounded-full
        transition-colors
        duration-200
        ${
          enabled
            ? darkMode
              ? "bg-slate-300"
              : "bg-slate-800"
            : darkMode
            ? "bg-slate-600"
            : "bg-slate-300"
        }
      `}
    >
      <span
        className={`
          absolute
          top-1
          w-4
          h-4
          rounded-full
          transition-all
          duration-200
          ${
            enabled
              ? "left-6 bg-white"
              : darkMode
              ? "left-1 bg-slate-300"
              : "left-1 bg-white"
          }
        `}
      />
    </button>
  );

  // =========================================================
  // RETURN
  // =========================================================

  return (
    <div className="w-full min-h-full p-3 sm:p-5 md:p-6 lg:p-8">
      <div className="max-w-[1400px] mx-auto">
        {/* =====================================================
            PAGE HEADER
        ===================================================== */}

        <div className="mb-5 sm:mb-6">
          <p
            className={`
              text-[10px]
              sm:text-xs
              uppercase
              tracking-widest
              font-bold
              mb-1
              ${darkMode ? "text-slate-500" : "text-slate-400"}
            `}
          >
            Faculty Portal
          </p>

          <h1
            className={`
              text-xl
              sm:text-2xl
              font-black
              ${pageTitleClass}
            `}
          >
            Account Settings
          </h1>

          <p
            className={`
              text-xs
              sm:text-sm
              mt-1
              ${bodyTextClass}
            `}
          >
            Manage your profile, notifications, and account security.
          </p>
        </div>

        {/* =====================================================
            SETTINGS CONTAINER
        ===================================================== */}

        <section
          className={`
            max-w-[1000px]
            border
            rounded-xl
            shadow-sm
            overflow-hidden
            ${panelClass}
          `}
        >
          <div className="p-4 sm:p-6 md:p-7 lg:p-8 space-y-8 sm:space-y-10">
            {/* =================================================
                PROFILE SETTINGS
            ================================================= */}

            <section>
              <div className="mb-5">
                <h2
                  className={`
                    text-base
                    sm:text-lg
                    font-bold
                    ${headingClass}
                  `}
                >
                  Profile Settings
                </h2>

                <p
                  className={`
                    text-[11px]
                    sm:text-xs
                    mt-1
                    ${bodyTextClass}
                  `}
                >
                  Update your faculty account information.
                </p>
              </div>

              <form onSubmit={handleSaveProfile} className="max-w-[650px]">
                <div className="space-y-4">
                  {/* NAME */}

                  <div className="grid grid-cols-1 sm:grid-cols-[140px_minmax(0,1fr)] gap-1.5 sm:gap-4 sm:items-center">
                    <label
                      className={`
                        text-xs
                        font-semibold
                        ${labelClass}
                      `}
                    >
                      Name
                    </label>

                    <input
                      type="text"
                      value={profile.name}
                      onChange={(e) =>
                        handleProfileChange("name", e.target.value)
                      }
                      className={`
                        w-full
                        h-10
                        px-3
                        rounded-lg
                        border
                        text-sm
                        outline-none
                        transition
                        ${inputClass}
                      `}
                    />
                  </div>

                  {/* EMAIL */}

                  <div className="grid grid-cols-1 sm:grid-cols-[140px_minmax(0,1fr)] gap-1.5 sm:gap-4 sm:items-center">
                    <label
                      className={`
                        text-xs
                        font-semibold
                        ${labelClass}
                      `}
                    >
                      Email
                    </label>

                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) =>
                        handleProfileChange("email", e.target.value)
                      }
                      className={`
                        w-full
                        h-10
                        px-3
                        rounded-lg
                        border
                        text-sm
                        outline-none
                        transition
                        ${inputClass}
                      `}
                    />
                  </div>

                  {/* PHONE */}

                  <div className="grid grid-cols-1 sm:grid-cols-[140px_minmax(0,1fr)] gap-1.5 sm:gap-4 sm:items-center">
                    <label
                      className={`
                        text-xs
                        font-semibold
                        ${labelClass}
                      `}
                    >
                      Phone
                    </label>

                    <input
                      type="text"
                      value={profile.phone}
                      onChange={(e) =>
                        handleProfileChange("phone", e.target.value)
                      }
                      className={`
                        w-full
                        h-10
                        px-3
                        rounded-lg
                        border
                        text-sm
                        outline-none
                        transition
                        ${inputClass}
                      `}
                    />
                  </div>

                  {/* DEPARTMENT */}

                  <div className="grid grid-cols-1 sm:grid-cols-[140px_minmax(0,1fr)] gap-1.5 sm:gap-4 sm:items-center">
                    <label
                      className={`
                        text-xs
                        font-semibold
                        ${labelClass}
                      `}
                    >
                      Department
                    </label>

                    <input
                      type="text"
                      value={profile.department}
                      onChange={(e) =>
                        handleProfileChange("department", e.target.value)
                      }
                      className={`
                        w-full
                        h-10
                        px-3
                        rounded-lg
                        border
                        text-sm
                        outline-none
                        transition
                        ${inputClass}
                      `}
                    />
                  </div>
                </div>

                {/* PROFILE MESSAGE */}

                {profileMessage && (
                  <div
                    className={`
                      mt-4
                      px-4
                      py-3
                      rounded-lg
                      border
                      text-xs
                      font-medium
                      ${
                        darkMode
                          ? "bg-emerald-950/40 text-emerald-300 border-emerald-800"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200"
                      }
                    `}
                  >
                    {profileMessage}
                  </div>
                )}

                <button
                  type="submit"
                  className="
                    mt-5
                    px-6
                    py-2.5
                    rounded-lg
                    bg-slate-800
                    text-white
                    text-xs
                    font-bold
                    hover:bg-slate-700
                    transition
                  "
                >
                  Save Changes
                </button>
              </form>
            </section>

            {/* DIVIDER */}

            <div className={`border-t ${dividerClass}`} />

            {/* =================================================
                NOTIFICATION PREFERENCES
            ================================================= */}

            <section>
              <div className="mb-5">
                <h2
                  className={`
                    text-base
                    sm:text-lg
                    font-bold
                    ${headingClass}
                  `}
                >
                  Notification Preferences
                </h2>

                <p
                  className={`
                    text-[11px]
                    sm:text-xs
                    mt-1
                    ${bodyTextClass}
                  `}
                >
                  Choose which notifications you want to receive.
                </p>
              </div>

              <div
                className={`
                  max-w-[700px]
                  border
                  rounded-xl
                  overflow-hidden
                  ${darkMode ? "border-slate-700" : "border-slate-200"}
                `}
              >
                {/* EMAIL ALERTS */}

                <div
                  className={`
                    flex
                    items-center
                    justify-between
                    gap-4
                    px-4
                    sm:px-5
                    py-4
                    border-b
                    ${dividerClass}
                  `}
                >
                  <div>
                    <p
                      className={`
                        text-sm
                        font-semibold
                        ${darkMode ? "text-slate-200" : "text-slate-800"}
                      `}
                    >
                      Email Alerts
                    </p>

                    <p
                      className={`
                        text-[10px]
                        sm:text-xs
                        mt-1
                        ${bodyTextClass}
                      `}
                    >
                      Receive important updates through email.
                    </p>
                  </div>

                  <NotificationSwitch
                    enabled={notifications.emailAlerts}
                    onClick={() => toggleNotification("emailAlerts")}
                    label="email alerts"
                  />
                </div>

                {/* SYSTEM UPDATES */}

                <div
                  className={`
                    flex
                    items-center
                    justify-between
                    gap-4
                    px-4
                    sm:px-5
                    py-4
                    border-b
                    ${dividerClass}
                  `}
                >
                  <div>
                    <p
                      className={`
                        text-sm
                        font-semibold
                        ${darkMode ? "text-slate-200" : "text-slate-800"}
                      `}
                    >
                      System Updates
                    </p>

                    <p
                      className={`
                        text-[10px]
                        sm:text-xs
                        mt-1
                        ${bodyTextClass}
                      `}
                    >
                      Receive updates about portal activity.
                    </p>
                  </div>

                  <NotificationSwitch
                    enabled={notifications.systemUpdates}
                    onClick={() => toggleNotification("systemUpdates")}
                    label="system updates"
                  />
                </div>

                {/* STUDENT SUBMISSIONS */}

                <div
                  className="
                    flex
                    items-center
                    justify-between
                    gap-4
                    px-4
                    sm:px-5
                    py-4
                  "
                >
                  <div>
                    <p
                      className={`
                        text-sm
                        font-semibold
                        ${darkMode ? "text-slate-200" : "text-slate-800"}
                      `}
                    >
                      Student Submissions
                    </p>

                    <p
                      className={`
                        text-[10px]
                        sm:text-xs
                        mt-1
                        ${bodyTextClass}
                      `}
                    >
                      Get notified when students submit applications or
                      documents.
                    </p>
                  </div>

                  <NotificationSwitch
                    enabled={notifications.studentSubmissions}
                    onClick={() => toggleNotification("studentSubmissions")}
                    label="student submissions"
                  />
                </div>
              </div>
            </section>

            {/* DIVIDER */}

            <div className={`border-t ${dividerClass}`} />

            {/* =================================================
                SECURITY
            ================================================= */}

            <section>
              <div className="mb-5">
                <h2
                  className={`
                    text-base
                    sm:text-lg
                    font-bold
                    ${headingClass}
                  `}
                >
                  Security
                </h2>

                <p
                  className={`
                    text-[11px]
                    sm:text-xs
                    mt-1
                    ${bodyTextClass}
                  `}
                >
                  Manage additional security options for your account.
                </p>
              </div>

              <div className="max-w-[700px] space-y-3">
                {/* 2FA */}

                <div
                  className={`
                    flex
                    flex-col
                    sm:flex-row
                    sm:items-center
                    justify-between
                    gap-4
                    border
                    rounded-xl
                    p-4
                    sm:p-5
                    ${sectionCardClass}
                  `}
                >
                  <div>
                    <p
                      className={`
                        text-sm
                        font-semibold
                        ${darkMode ? "text-slate-200" : "text-slate-800"}
                      `}
                    >
                      Two-Factor Authentication
                    </p>

                    <p
                      className={`
                        text-[10px]
                        sm:text-xs
                        mt-1
                        ${bodyTextClass}
                      `}
                    >
                      Add an extra layer of protection to your account.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleToggle2FA}
                    className={`
                      px-5
                      py-2.5
                      rounded-lg
                      text-xs
                      font-bold
                      transition
                      ${
                        twoFactorEnabled
                          ? "bg-emerald-600 text-white hover:bg-emerald-700"
                          : "bg-slate-800 text-white hover:bg-slate-700"
                      }
                    `}
                  >
                    {twoFactorEnabled ? "2FA Enabled" : "Enable 2FA"}
                  </button>
                </div>

                {/* CHANGE PASSWORD */}

                <div
                  className={`
                    flex
                    flex-col
                    sm:flex-row
                    sm:items-center
                    justify-between
                    gap-4
                    border
                    rounded-xl
                    p-4
                    sm:p-5
                    ${sectionCardClass}
                  `}
                >
                  <div>
                    <p
                      className={`
                        text-sm
                        font-semibold
                        ${darkMode ? "text-slate-200" : "text-slate-800"}
                      `}
                    >
                      Password
                    </p>

                    <p
                      className={`
                        text-[10px]
                        sm:text-xs
                        mt-1
                        ${bodyTextClass}
                      `}
                    >
                      Update your account password regularly for better
                      security.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordForm(!showPasswordForm);
                      setPasswordMessage({
                        type: "",
                        text: "",
                      });
                    }}
                    className="
                      px-5
                      py-2.5
                      rounded-lg
                      bg-slate-800
                      text-white
                      text-xs
                      font-bold
                      hover:bg-slate-700
                      transition
                    "
                  >
                    Change Password
                  </button>
                </div>

                {/* PASSWORD FORM */}

                {showPasswordForm && (
                  <div
                    className={`
                      border
                      rounded-xl
                      p-4
                      sm:p-5
                      ${sectionCardClass}
                    `}
                  >
                    <form onSubmit={handleChangePassword} className="space-y-4">
                      <div>
                        <label
                          className={`
                            block
                            text-xs
                            font-bold
                            mb-1.5
                            ${labelClass}
                          `}
                        >
                          Current Password
                        </label>

                        <input
                          type="password"
                          value={passwords.current}
                          onChange={(e) =>
                            handlePasswordChange("current", e.target.value)
                          }
                          placeholder="Enter current password"
                          className={`
                            w-full
                            h-10
                            px-3
                            rounded-lg
                            border
                            text-sm
                            outline-none
                            transition
                            ${inputClass}
                          `}
                        />
                      </div>

                      <div>
                        <label
                          className={`
                            block
                            text-xs
                            font-bold
                            mb-1.5
                            ${labelClass}
                          `}
                        >
                          New Password
                        </label>

                        <input
                          type="password"
                          value={passwords.newPassword}
                          onChange={(e) =>
                            handlePasswordChange("newPassword", e.target.value)
                          }
                          placeholder="Enter new password"
                          className={`
                            w-full
                            h-10
                            px-3
                            rounded-lg
                            border
                            text-sm
                            outline-none
                            transition
                            ${inputClass}
                          `}
                        />

                        <p
                          className={`
                            text-[10px]
                            mt-1.5
                            ${bodyTextClass}
                          `}
                        >
                          Use at least 8 characters.
                        </p>
                      </div>

                      <div>
                        <label
                          className={`
                            block
                            text-xs
                            font-bold
                            mb-1.5
                            ${labelClass}
                          `}
                        >
                          Confirm New Password
                        </label>

                        <input
                          type="password"
                          value={passwords.confirmPassword}
                          onChange={(e) =>
                            handlePasswordChange(
                              "confirmPassword",
                              e.target.value
                            )
                          }
                          placeholder="Confirm new password"
                          className={`
                            w-full
                            h-10
                            px-3
                            rounded-lg
                            border
                            text-sm
                            outline-none
                            transition
                            ${inputClass}
                          `}
                        />
                      </div>

                      {/* PASSWORD MESSAGE */}

                      {passwordMessage.text && (
                        <div
                          className={`
                            px-4
                            py-3
                            rounded-lg
                            border
                            text-xs
                            font-medium
                            ${
                              passwordMessage.type === "success"
                                ? darkMode
                                  ? "bg-emerald-950/40 text-emerald-300 border-emerald-800"
                                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : darkMode
                                ? "bg-red-950/40 text-red-300 border-red-800"
                                : "bg-red-50 text-red-700 border-red-200"
                            }
                          `}
                        >
                          {passwordMessage.text}
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="submit"
                          className="
                            px-5
                            py-2.5
                            rounded-lg
                            bg-slate-800
                            text-white
                            text-xs
                            font-bold
                            hover:bg-slate-700
                            transition
                          "
                        >
                          Update Password
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setShowPasswordForm(false);
                            setPasswordMessage({
                              type: "",
                              text: "",
                            });
                          }}
                          className={`
                            px-5
                            py-2.5
                            rounded-lg
                            border
                            text-xs
                            font-bold
                            transition
                            ${
                              darkMode
                                ? "border-slate-600 text-slate-300 hover:bg-slate-700"
                                : "border-slate-300 text-slate-600 hover:bg-slate-100"
                            }
                          `}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* SECURITY MESSAGE */}

                {securityMessage && (
                  <div
                    className={`
                      px-4
                      py-3
                      rounded-lg
                      border
                      text-xs
                      font-medium
                      ${
                        darkMode
                          ? "bg-slate-800 border-slate-700 text-slate-300"
                          : "bg-slate-100 border-slate-200 text-slate-600"
                      }
                    `}
                  >
                    {securityMessage}
                  </div>
                )}
              </div>
            </section>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Settings;
