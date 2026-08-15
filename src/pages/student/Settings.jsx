import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";

const Settings = () => {
  const { darkMode } = useOutletContext();

  // =========================================================
  // PASSWORD
  // =========================================================

  const [passwords, setPasswords] = useState({
    current: "",
    newPassword: "",
    confirm: "",
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    newPassword: false,
    confirm: false,
  });

  const [passwordMessage, setPasswordMessage] = useState({
    type: "",
    text: "",
  });

  // =========================================================
  // NOTIFICATION PREFERENCES
  // =========================================================

  const [notificationPreferences, setNotificationPreferences] = useState({
    email: true,
    push: true,
    sms: false,
  });

  // =========================================================
  // SECURITY
  // =========================================================

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [securityMessage, setSecurityMessage] = useState("");

  // =========================================================
  // THEME CLASSES
  // =========================================================

  const headingClass = darkMode ? "text-slate-100" : "text-slate-900";

  const mutedClass = darkMode ? "text-slate-400" : "text-slate-500";

  const cardClass = darkMode
    ? "bg-slate-900 border-slate-700"
    : "bg-white border-slate-200";

  const inputClass = darkMode
    ? "bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-500 focus:bg-slate-900 focus:border-slate-500"
    : "bg-slate-50 border-slate-300 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-slate-700";

  const dividerClass = darkMode ? "border-slate-700" : "border-slate-200";

  const innerCardClass = darkMode
    ? "border-slate-700 bg-slate-900"
    : "border-slate-200 bg-white";

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

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleUpdatePassword = (e) => {
    e.preventDefault();

    const { current, newPassword, confirm } = passwords;

    if (!current || !newPassword || !confirm) {
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

    if (newPassword !== confirm) {
      setPasswordMessage({
        type: "error",
        text: "New password and confirmation do not match.",
      });

      return;
    }

    // Frontend placeholder.
    // This will later connect to Supabase.

    setPasswordMessage({
      type: "success",
      text: "Password updated successfully.",
    });

    setPasswords({
      current: "",
      newPassword: "",
      confirm: "",
    });
  };

  // =========================================================
  // NOTIFICATION HANDLERS
  // =========================================================

  const toggleNotification = (type) => {
    setNotificationPreferences((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  // =========================================================
  // TWO-FACTOR AUTHENTICATION
  // =========================================================

  const handleToggle2FA = () => {
    const newValue = !twoFactorEnabled;

    setTwoFactorEnabled(newValue);

    setSecurityMessage(
      newValue
        ? "Two-factor authentication has been enabled."
        : "Two-factor authentication has been disabled."
    );
  };

  // =========================================================
  // LOGOUT SESSIONS
  // =========================================================

  const handleLogoutSessions = () => {
    const confirmed = window.confirm(
      "Are you sure you want to log out of all other sessions?"
    );

    if (!confirmed) return;

    setSecurityMessage("All other sessions have been logged out.");
  };

  // =========================================================
  // PASSWORD FIELD
  // =========================================================

  const renderPasswordField = (field, label, placeholder) => {
    return (
      <div>
        <label className={`block text-xs font-bold mb-1.5 ${headingClass}`}>
          {label}
        </label>

        <div className="relative">
          <input
            type={showPasswords[field] ? "text" : "password"}
            value={passwords[field]}
            onChange={(e) => handlePasswordChange(field, e.target.value)}
            placeholder={placeholder}
            className={`
              w-full
              h-11
              px-3
              pr-12
              rounded-lg
              border
              text-sm
              outline-none
              transition
              ${inputClass}
            `}
          />

          <button
            type="button"
            onClick={() => togglePasswordVisibility(field)}
            className={`
              absolute
              right-3
              top-1/2
              -translate-y-1/2
              text-xs
              transition
              ${
                darkMode
                  ? "text-slate-500 hover:text-slate-200"
                  : "text-slate-400 hover:text-slate-700"
              }
            `}
          >
            {showPasswords[field] ? "Hide" : "Show"}
          </button>
        </div>
      </div>
    );
  };

  // =========================================================
  // RETURN
  // =========================================================

  return (
    <div className="p-5 md:p-6 lg:p-8 max-w-[1400px] mx-auto">
      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <div className="mb-6">
        <p
          className={`
            text-xs
            uppercase
            tracking-widest
            font-bold
            mb-1
            ${darkMode ? "text-slate-500" : "text-slate-400"}
          `}
        >
          Student Portal
        </p>

        <h1 className={`text-2xl font-black ${headingClass}`}>
          Account Settings
        </h1>

        <p className={`text-sm mt-1 ${mutedClass}`}>
          Manage your password, notifications, and account security.
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
          ${cardClass}
        `}
      >
        <div className="p-5 md:p-7 lg:p-8 space-y-10">
          {/* =================================================
              CHANGE PASSWORD
          ================================================= */}

          <section>
            <div className="mb-5">
              <h2 className={`text-lg font-bold ${headingClass}`}>
                Change Password
              </h2>

              <p className={`text-xs mt-1 ${mutedClass}`}>
                Update your password to keep your account secure.
              </p>
            </div>

            <form onSubmit={handleUpdatePassword} className="max-w-[600px]">
              <div className="space-y-4">
                {renderPasswordField(
                  "current",
                  "Current Password",
                  "Enter current password"
                )}

                {renderPasswordField(
                  "newPassword",
                  "New Password",
                  "Enter new password"
                )}

                <p className={`text-[10px] -mt-2 ${mutedClass}`}>
                  Use at least 8 characters.
                </p>

                {renderPasswordField(
                  "confirm",
                  "Confirm Password",
                  "Confirm new password"
                )}
              </div>

              {/* PASSWORD MESSAGE */}

              {passwordMessage.text && (
                <div
                  className={`
                    mt-4
                    px-4
                    py-3
                    rounded-lg
                    text-xs
                    font-medium
                    ${
                      passwordMessage.type === "success"
                        ? darkMode
                          ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : darkMode
                        ? "bg-red-950 text-red-300 border border-red-800"
                        : "bg-red-50 text-red-700 border border-red-200"
                    }
                  `}
                >
                  {passwordMessage.text}
                </div>
              )}

              <button
                type="submit"
                className="
                  mt-5
                  px-6
                  py-3
                  rounded-lg
                  bg-slate-800
                  dark:bg-slate-700
                  text-white
                  text-xs
                  font-bold
                  hover:bg-slate-700
                  dark:hover:bg-slate-600
                  transition
                "
              >
                Update Password
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
              <h2 className={`text-lg font-bold ${headingClass}`}>
                Notification Preferences
              </h2>

              <p className={`text-xs mt-1 ${mutedClass}`}>
                Choose how you want to receive important updates.
              </p>
            </div>

            <div
              className={`
                max-w-[700px]
                border
                rounded-xl
                overflow-hidden
                ${innerCardClass}
              `}
            >
              {/* EMAIL */}

              <div
                className={`
                  flex
                  items-center
                  justify-between
                  gap-4
                  px-5
                  py-4
                  border-b
                  ${dividerClass}
                `}
              >
                <div>
                  <p className={`text-sm font-semibold ${headingClass}`}>
                    Email Notifications
                  </p>

                  <p className={`text-xs mt-1 ${mutedClass}`}>
                    Receive updates through your registered email.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => toggleNotification("email")}
                  className={`
                    relative
                    flex-shrink-0
                    w-11
                    h-6
                    rounded-full
                    transition
                    ${
                      notificationPreferences.email
                        ? darkMode
                          ? "bg-slate-600"
                          : "bg-slate-800"
                        : darkMode
                        ? "bg-slate-700"
                        : "bg-slate-300"
                    }
                  `}
                  aria-label="Toggle email notifications"
                >
                  <span
                    className={`
                      absolute
                      top-1
                      w-4
                      h-4
                      bg-white
                      rounded-full
                      transition-all
                      ${notificationPreferences.email ? "left-6" : "left-1"}
                    `}
                  />
                </button>
              </div>

              {/* PUSH */}

              <div
                className={`
                  flex
                  items-center
                  justify-between
                  gap-4
                  px-5
                  py-4
                  border-b
                  ${dividerClass}
                `}
              >
                <div>
                  <p className={`text-sm font-semibold ${headingClass}`}>
                    Push Notifications
                  </p>

                  <p className={`text-xs mt-1 ${mutedClass}`}>
                    Receive notifications directly from the portal.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => toggleNotification("push")}
                  className={`
                    relative
                    flex-shrink-0
                    w-11
                    h-6
                    rounded-full
                    transition
                    ${
                      notificationPreferences.push
                        ? darkMode
                          ? "bg-slate-600"
                          : "bg-slate-800"
                        : darkMode
                        ? "bg-slate-700"
                        : "bg-slate-300"
                    }
                  `}
                  aria-label="Toggle push notifications"
                >
                  <span
                    className={`
                      absolute
                      top-1
                      w-4
                      h-4
                      bg-white
                      rounded-full
                      transition-all
                      ${notificationPreferences.push ? "left-6" : "left-1"}
                    `}
                  />
                </button>
              </div>

              {/* SMS */}

              <div
                className="
                  flex
                  items-center
                  justify-between
                  gap-4
                  px-5
                  py-4
                "
              >
                <div>
                  <p className={`text-sm font-semibold ${headingClass}`}>
                    SMS Alerts
                  </p>

                  <p className={`text-xs mt-1 ${mutedClass}`}>
                    Receive important alerts through SMS.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => toggleNotification("sms")}
                  className={`
                    relative
                    flex-shrink-0
                    w-11
                    h-6
                    rounded-full
                    transition
                    ${
                      notificationPreferences.sms
                        ? darkMode
                          ? "bg-slate-600"
                          : "bg-slate-800"
                        : darkMode
                        ? "bg-slate-700"
                        : "bg-slate-300"
                    }
                  `}
                  aria-label="Toggle SMS alerts"
                >
                  <span
                    className={`
                      absolute
                      top-1
                      w-4
                      h-4
                      bg-white
                      rounded-full
                      transition-all
                      ${notificationPreferences.sms ? "left-6" : "left-1"}
                    `}
                  />
                </button>
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
              <h2 className={`text-lg font-bold ${headingClass}`}>Security</h2>

              <p className={`text-xs mt-1 ${mutedClass}`}>
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
                  p-5
                  ${innerCardClass}
                `}
              >
                <div>
                  <p className={`text-sm font-semibold ${headingClass}`}>
                    Two-Factor Authentication
                  </p>

                  <p className={`text-xs mt-1 ${mutedClass}`}>
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
                        : darkMode
                        ? "bg-slate-700 text-white hover:bg-slate-600"
                        : "bg-slate-800 text-white hover:bg-slate-700"
                    }
                  `}
                >
                  {twoFactorEnabled ? "2FA Enabled" : "Enable 2FA"}
                </button>
              </div>

              {/* LOGOUT SESSIONS */}

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
                  p-5
                  ${
                    darkMode
                      ? "border-red-900 bg-red-950/40"
                      : "border-red-200 bg-red-50"
                  }
                `}
              >
                <div>
                  <p
                    className={`
                      text-sm
                      font-semibold
                      ${darkMode ? "text-red-300" : "text-red-800"}
                    `}
                  >
                    Active Sessions
                  </p>

                  <p
                    className={`
                      text-xs
                      mt-1
                      ${darkMode ? "text-red-400" : "text-red-600"}
                    `}
                  >
                    Log out of all other devices where your account is currently
                    signed in.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleLogoutSessions}
                  className="
                    px-5
                    py-2.5
                    rounded-lg
                    bg-red-600
                    text-white
                    text-xs
                    font-bold
                    hover:bg-red-700
                    transition
                  "
                >
                  Logout Sessions
                </button>
              </div>

              {/* SECURITY MESSAGE */}

              {securityMessage && (
                <div
                  className={`
                    px-4
                    py-3
                    rounded-lg
                    border
                    text-xs
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
  );
};

export default Settings;
