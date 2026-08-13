import React, { useState } from "react";

const Settings = () => {
  // -----------------------------------------
  // PASSWORD
  // -----------------------------------------

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

  // -----------------------------------------
  // NOTIFICATION PREFERENCES
  // -----------------------------------------

  const [notificationPreferences, setNotificationPreferences] = useState({
    email: true,
    push: true,
    sms: false,
  });

  // -----------------------------------------
  // SECURITY
  // -----------------------------------------

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  const [securityMessage, setSecurityMessage] = useState("");

  // -----------------------------------------
  // PASSWORD HANDLERS
  // -----------------------------------------

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

  // -----------------------------------------
  // NOTIFICATION HANDLERS
  // -----------------------------------------

  const toggleNotification = (type) => {
    setNotificationPreferences((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  // -----------------------------------------
  // 2FA
  // -----------------------------------------

  const handleToggle2FA = () => {
    const newValue = !twoFactorEnabled;

    setTwoFactorEnabled(newValue);

    setSecurityMessage(
      newValue
        ? "Two-factor authentication has been enabled."
        : "Two-factor authentication has been disabled."
    );
  };

  // -----------------------------------------
  // LOGOUT SESSIONS
  // -----------------------------------------

  const handleLogoutSessions = () => {
    const confirmed = window.confirm(
      "Are you sure you want to log out of all other sessions?"
    );

    if (!confirmed) return;

    setSecurityMessage("All other sessions have been logged out.");
  };

  return (
    <div className="p-5 md:p-6 lg:p-8 max-w-[1400px] mx-auto">
      {/* =========================================
          PAGE HEADER
      ========================================= */}

      <div className="mb-6">
        <p className="text-xs uppercase tracking-widest font-bold text-slate-400 mb-1">
          Student Portal
        </p>

        <h1 className="text-2xl font-black text-slate-900">Account Settings</h1>

        <p className="text-sm text-slate-500 mt-1">
          Manage your password, notifications, and account security.
        </p>
      </div>

      {/* =========================================
          SETTINGS CONTAINER
      ========================================= */}

      <section className="max-w-[1000px] border border-slate-300 bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 md:p-7 lg:p-8 space-y-10">
          {/* =========================================
              CHANGE PASSWORD
          ========================================= */}

          <section>
            <div className="mb-5">
              <h2 className="text-lg font-bold text-slate-900">
                Change Password
              </h2>

              <p className="text-xs text-slate-400 mt-1">
                Update your password to keep your account secure.
              </p>
            </div>

            <form onSubmit={handleUpdatePassword} className="max-w-[600px]">
              <div className="space-y-4">
                {/* Current Password */}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Current Password
                  </label>

                  <div className="relative">
                    <input
                      type={showPasswords.current ? "text" : "password"}
                      value={passwords.current}
                      onChange={(e) =>
                        handlePasswordChange("current", e.target.value)
                      }
                      placeholder="Enter current password"
                      className="w-full h-11 px-3 pr-12 rounded-lg border border-slate-300 bg-slate-50 text-sm outline-none focus:bg-white focus:border-slate-700 transition"
                    />

                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility("current")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700"
                    >
                      {showPasswords.current ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                {/* New Password */}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    New Password
                  </label>

                  <div className="relative">
                    <input
                      type={showPasswords.newPassword ? "text" : "password"}
                      value={passwords.newPassword}
                      onChange={(e) =>
                        handlePasswordChange("newPassword", e.target.value)
                      }
                      placeholder="Enter new password"
                      className="w-full h-11 px-3 pr-12 rounded-lg border border-slate-300 bg-slate-50 text-sm outline-none focus:bg-white focus:border-slate-700 transition"
                    />

                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility("newPassword")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700"
                    >
                      {showPasswords.newPassword ? "Hide" : "Show"}
                    </button>
                  </div>

                  <p className="text-[10px] text-slate-400 mt-1.5">
                    Use at least 8 characters.
                  </p>
                </div>

                {/* Confirm Password */}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Confirm Password
                  </label>

                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? "text" : "password"}
                      value={passwords.confirm}
                      onChange={(e) =>
                        handlePasswordChange("confirm", e.target.value)
                      }
                      placeholder="Confirm new password"
                      className="w-full h-11 px-3 pr-12 rounded-lg border border-slate-300 bg-slate-50 text-sm outline-none focus:bg-white focus:border-slate-700 transition"
                    />

                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility("confirm")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700"
                    >
                      {showPasswords.confirm ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Password Message */}

              {passwordMessage.text && (
                <div
                  className={`mt-4 px-4 py-3 rounded-lg text-xs font-medium ${
                    passwordMessage.type === "success"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                >
                  {passwordMessage.text}
                </div>
              )}

              <button
                type="submit"
                className="mt-5 px-6 py-3 rounded-lg bg-slate-800 text-white text-xs font-bold hover:bg-slate-700 transition"
              >
                Update Password
              </button>
            </form>
          </section>

          {/* DIVIDER */}

          <div className="border-t border-slate-200" />

          {/* =========================================
              NOTIFICATION PREFERENCES
          ========================================= */}

          <section>
            <div className="mb-5">
              <h2 className="text-lg font-bold text-slate-900">
                Notification Preferences
              </h2>

              <p className="text-xs text-slate-400 mt-1">
                Choose how you want to receive important updates.
              </p>
            </div>

            <div className="max-w-[700px] border border-slate-200 rounded-xl overflow-hidden">
              {/* Email */}

              <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-slate-200">
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Email Notifications
                  </p>

                  <p className="text-xs text-slate-400 mt-1">
                    Receive updates through your registered email.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => toggleNotification("email")}
                  className={`relative flex-shrink-0 w-11 h-6 rounded-full transition ${
                    notificationPreferences.email
                      ? "bg-slate-800"
                      : "bg-slate-300"
                  }`}
                  aria-label="Toggle email notifications"
                >
                  <span
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                      notificationPreferences.email ? "left-6" : "left-1"
                    }`}
                  />
                </button>
              </div>

              {/* Push */}

              <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-slate-200">
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Push Notifications
                  </p>

                  <p className="text-xs text-slate-400 mt-1">
                    Receive notifications directly from the portal.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => toggleNotification("push")}
                  className={`relative flex-shrink-0 w-11 h-6 rounded-full transition ${
                    notificationPreferences.push
                      ? "bg-slate-800"
                      : "bg-slate-300"
                  }`}
                  aria-label="Toggle push notifications"
                >
                  <span
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                      notificationPreferences.push ? "left-6" : "left-1"
                    }`}
                  />
                </button>
              </div>

              {/* SMS */}

              <div className="flex items-center justify-between gap-4 px-5 py-4">
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    SMS Alerts
                  </p>

                  <p className="text-xs text-slate-400 mt-1">
                    Receive important alerts through SMS.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => toggleNotification("sms")}
                  className={`relative flex-shrink-0 w-11 h-6 rounded-full transition ${
                    notificationPreferences.sms
                      ? "bg-slate-800"
                      : "bg-slate-300"
                  }`}
                  aria-label="Toggle SMS alerts"
                >
                  <span
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                      notificationPreferences.sms ? "left-6" : "left-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          </section>

          {/* DIVIDER */}

          <div className="border-t border-slate-200" />

          {/* =========================================
              SECURITY
          ========================================= */}

          <section>
            <div className="mb-5">
              <h2 className="text-lg font-bold text-slate-900">Security</h2>

              <p className="text-xs text-slate-400 mt-1">
                Manage additional security options for your account.
              </p>
            </div>

            <div className="max-w-[700px] space-y-3">
              {/* 2FA */}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-200 rounded-xl p-5">
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Two-Factor Authentication
                  </p>

                  <p className="text-xs text-slate-400 mt-1">
                    Add an extra layer of protection to your account.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleToggle2FA}
                  className={`px-5 py-2.5 rounded-lg text-xs font-bold transition ${
                    twoFactorEnabled
                      ? "bg-emerald-600 text-white hover:bg-emerald-700"
                      : "bg-slate-800 text-white hover:bg-slate-700"
                  }`}
                >
                  {twoFactorEnabled ? "2FA Enabled" : "Enable 2FA"}
                </button>
              </div>

              {/* Logout Sessions */}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-red-200 bg-red-50 rounded-xl p-5">
                <div>
                  <p className="text-sm font-semibold text-red-800">
                    Active Sessions
                  </p>

                  <p className="text-xs text-red-600 mt-1">
                    Log out of all other devices where your account is currently
                    signed in.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleLogoutSessions}
                  className="px-5 py-2.5 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition"
                >
                  Logout Sessions
                </button>
              </div>

              {/* Security Message */}

              {securityMessage && (
                <div className="px-4 py-3 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-600">
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
