import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useMockStore } from "../../data/mockStore";

// =========================================================
// COMPONENT
// =========================================================

const SystemSettings = () => {
  const { darkMode } = useOutletContext();

  const { state, updateSystemSettings } = useMockStore();

  // =========================================================
  // STORE SETTINGS
  // =========================================================

  const storeSettings = state.settings;

  // =========================================================
  // LOCAL FORM STATE
  //
  // These temporarily hold the values while editing.
  // They are saved to mockStore only when Save Settings
  // is clicked.
  // =========================================================

  const [systemName, setSystemName] = useState(
    storeSettings.systemName || "Student Internship Management System"
  );

  const [academicYear, setAcademicYear] = useState(
    storeSettings.academicYear || "2026 - 2027"
  );

  const [internshipDuration, setInternshipDuration] = useState(
    storeSettings.internshipDuration || "480"
  );

  const [maintenanceMode, setMaintenanceMode] = useState(
    storeSettings.maintenanceMode ?? false
  );

  const [emailNotifications, setEmailNotifications] = useState(
    storeSettings.emailNotifications ?? true
  );

  const [systemNotifications, setSystemNotifications] = useState(
    storeSettings.systemNotifications ?? true
  );

  const [applicationNotifications, setApplicationNotifications] = useState(
    storeSettings.applicationNotifications ?? true
  );

  // =========================================================
  // SECURITY SETTINGS
  //
  // These are not currently stored in initialState.settings,
  // so we keep them locally for now.
  // =========================================================

  const [sessionTimeout, setSessionTimeout] = useState("30");

  const [twoFactorAuthentication, setTwoFactorAuthentication] = useState(false);

  // =========================================================
  // FEEDBACK
  // =========================================================

  const [feedback, setFeedback] = useState("");

  // =========================================================
  // SYNC FORM WITH STORE
  //
  // If the store changes from another component, update
  // the form values as well.
  // =========================================================

  useEffect(() => {
    setSystemName(
      storeSettings.systemName || "Student Internship Management System"
    );

    setAcademicYear(storeSettings.academicYear || "2026 - 2027");

    setInternshipDuration(storeSettings.internshipDuration || "480");

    setMaintenanceMode(storeSettings.maintenanceMode ?? false);

    setEmailNotifications(storeSettings.emailNotifications ?? true);

    setSystemNotifications(storeSettings.systemNotifications ?? true);

    setApplicationNotifications(storeSettings.applicationNotifications ?? true);
  }, [
    storeSettings.systemName,
    storeSettings.academicYear,
    storeSettings.internshipDuration,
    storeSettings.maintenanceMode,
    storeSettings.emailNotifications,
    storeSettings.systemNotifications,
    storeSettings.applicationNotifications,
  ]);

  // =========================================================
  // FEEDBACK HELPER
  // =========================================================

  const showFeedback = (message) => {
    setFeedback(message);

    setTimeout(() => {
      setFeedback("");
    }, 3000);
  };

  // =========================================================
  // SAVE SETTINGS
  // =========================================================

  const handleSaveSettings = () => {
    updateSystemSettings({
      systemName,
      academicYear,
      internshipDuration,
      maintenanceMode,
      emailNotifications,
      systemNotifications,
      applicationNotifications,
    });

    showFeedback("System settings saved successfully.");
  };

  // =========================================================
  // RESET SETTINGS
  // =========================================================

  const handleResetSettings = () => {
    const defaultSettings = {
      systemName: "Student Internship Management System",
      academicYear: "2026 - 2027",
      internshipDuration: "480",
      maintenanceMode: false,
      emailNotifications: true,
      systemNotifications: true,
      applicationNotifications: true,
    };

    // Reset local form

    setSystemName(defaultSettings.systemName);

    setAcademicYear(defaultSettings.academicYear);

    setInternshipDuration(defaultSettings.internshipDuration);

    setMaintenanceMode(defaultSettings.maintenanceMode);

    setEmailNotifications(defaultSettings.emailNotifications);

    setSystemNotifications(defaultSettings.systemNotifications);

    setApplicationNotifications(defaultSettings.applicationNotifications);

    // Reset security settings

    setSessionTimeout("30");

    setTwoFactorAuthentication(false);

    // Save reset values to mockStore

    updateSystemSettings(defaultSettings);

    showFeedback("Settings have been reset.");
  };

  // =========================================================
  // TOGGLE COMPONENT
  // =========================================================

  const SettingToggle = ({
    checked,
    onChange,
    label,
    description,
    danger = false,
  }) => {
    return (
      <div
        className={`flex items-center justify-between gap-4 py-3 border-b last:border-b-0 ${
          darkMode ? "border-slate-700" : "border-slate-200"
        }`}
      >
        <div className="min-w-0">
          <p
            className={`text-xs font-semibold ${
              danger ? (darkMode ? "text-red-400" : "text-red-600") : ""
            }`}
          >
            {label}
          </p>

          {description && (
            <p
              className={`text-[10px] mt-1 leading-relaxed ${
                darkMode ? "text-slate-400" : "text-slate-500"
              }`}
            >
              {description}
            </p>
          )}
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={checked}
          onClick={() => onChange(!checked)}
          className={`relative flex-shrink-0 w-9 h-5 rounded-full p-0.5 transition ${
            checked
              ? danger
                ? "bg-red-600"
                : "bg-slate-700"
              : darkMode
              ? "bg-slate-600"
              : "bg-slate-300"
          }`}
        >
          <span
            className={`block w-4 h-4 bg-white rounded-full transition-transform ${
              checked ? "translate-x-4" : "translate-x-0"
            }`}
          />
        </button>
      </div>
    );
  };

  // =========================================================
  // INPUT CLASS
  // =========================================================

  const inputClass = `w-full h-9 border rounded-sm px-3 text-xs outline-none transition ${
    darkMode
      ? "bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 focus:border-slate-400"
      : "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-slate-500"
  }`;

  // =========================================================
  // SECTION CLASS
  // =========================================================

  const sectionClass = `border rounded-sm p-4 ${
    darkMode ? "bg-slate-800 border-slate-600" : "bg-slate-50 border-slate-300"
  }`;

  // =========================================================
  // RETURN
  // =========================================================

  return (
    <div
      className={`min-h-[calc(100vh-5rem)] px-4 py-6 sm:px-6 lg:px-8 transition-colors duration-300 ${
        darkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"
      }`}
    >
      <div className="max-w-5xl mx-auto">
        {/* ===================================================
            DEMO NOTICE
        =================================================== */}

        <div
          className={`mb-5 p-3 rounded-lg text-[10px] leading-relaxed border ${
            darkMode
              ? "bg-red-950/40 border-red-900 text-red-300"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          <p className="font-bold mb-1">⚠️ Demo Project</p>

          <p>
            These system settings are currently stored in the application's mock
            store for demonstration.
          </p>

          <p className="mt-1">
            No database or permanent server-side configuration is implemented
            yet.
          </p>
        </div>

        {/* ===================================================
            SYSTEM SETTINGS CONTAINER
        =================================================== */}

        <section
          className={`border rounded-lg p-4 sm:p-5 lg:p-6 ${
            darkMode
              ? "bg-slate-900 border-slate-700"
              : "bg-white border-slate-400"
          }`}
        >
          {/* =================================================
              PAGE TITLE
          ================================================= */}

          <div className="mb-6">
            <h1 className="text-lg sm:text-xl font-bold">System Settings</h1>

            <p
              className={`text-xs mt-1 ${
                darkMode ? "text-slate-400" : "text-slate-500"
              }`}
            >
              Manage system configuration, notifications, and security settings.
            </p>
          </div>

          {/* =================================================
              FEEDBACK
          ================================================= */}

          {feedback && (
            <div
              className={`mb-5 px-3 py-2 border rounded-sm text-[10px] ${
                feedback.includes("successfully")
                  ? darkMode
                    ? "bg-emerald-950/40 border-emerald-800 text-emerald-300"
                    : "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : darkMode
                  ? "bg-blue-950/40 border-blue-800 text-blue-300"
                  : "bg-blue-50 border-blue-200 text-blue-700"
              }`}
            >
              {feedback}
            </div>
          )}

          {/* =================================================
              SYSTEM CONFIGURATION
          ================================================= */}

          <div className="mb-5">
            <h2 className="text-sm font-bold mb-2">System Configuration</h2>

            <div className={sectionClass}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* SYSTEM NAME */}

                <div>
                  <label
                    htmlFor="system-name"
                    className="block text-[10px] font-bold mb-1.5"
                  >
                    System Name
                  </label>

                  <input
                    id="system-name"
                    type="text"
                    value={systemName}
                    onChange={(e) => setSystemName(e.target.value)}
                    className={inputClass}
                  />
                </div>

                {/* ACADEMIC YEAR */}

                <div>
                  <label
                    htmlFor="academic-year"
                    className="block text-[10px] font-bold mb-1.5"
                  >
                    Academic Year
                  </label>

                  <select
                    id="academic-year"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className={inputClass}
                  >
                    <option value="2025 - 2026">2025 - 2026</option>
                    <option value="2026 - 2027">2026 - 2027</option>
                    <option value="2027 - 2028">2027 - 2028</option>
                  </select>
                </div>

                {/* INTERNSHIP DURATION */}

                <div>
                  <label
                    htmlFor="internship-duration"
                    className="block text-[10px] font-bold mb-1.5"
                  >
                    Required Internship Hours
                  </label>

                  <input
                    id="internship-duration"
                    type="number"
                    min="1"
                    value={internshipDuration}
                    onChange={(e) => setInternshipDuration(e.target.value)}
                    className={inputClass}
                  />

                  <p
                    className={`text-[9px] mt-1 ${
                      darkMode ? "text-slate-500" : "text-slate-400"
                    }`}
                  >
                    Required hours before an internship can be completed.
                  </p>
                </div>

                {/* SYSTEM STATUS */}

                <div>
                  <label className="block text-[10px] font-bold mb-1.5">
                    System Status
                  </label>

                  <div
                    className={`h-9 border rounded-sm flex items-center px-3 ${
                      darkMode
                        ? "bg-slate-900 border-slate-600"
                        : "bg-white border-slate-300"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full mr-2 ${
                        maintenanceMode ? "bg-red-500" : "bg-emerald-500"
                      }`}
                    />

                    <span className="text-xs font-semibold">
                      {maintenanceMode ? "Maintenance Mode" : "System Online"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* =================================================
              NOTIFICATION SETTINGS
          ================================================= */}

          <div className="mb-5">
            <h2 className="text-sm font-bold mb-2">Notification Settings</h2>

            <div className={sectionClass}>
              <SettingToggle
                checked={emailNotifications}
                onChange={setEmailNotifications}
                label="Email Notifications"
                description="Allow the system to send email notifications to users."
              />

              <SettingToggle
                checked={systemNotifications}
                onChange={setSystemNotifications}
                label="System Notifications"
                description="Enable notifications for important system events and updates."
              />

              <SettingToggle
                checked={applicationNotifications}
                onChange={setApplicationNotifications}
                label="Application Notifications"
                description="Notify users about internship application status changes."
              />
            </div>
          </div>

          {/* =================================================
              SECURITY SETTINGS
          ================================================= */}

          <div className="mb-5">
            <h2 className="text-sm font-bold mb-2">Security Settings</h2>

            <div className={sectionClass}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* SESSION TIMEOUT */}

                <div>
                  <label
                    htmlFor="session-timeout"
                    className="block text-[10px] font-bold mb-1.5"
                  >
                    Session Timeout
                  </label>

                  <select
                    id="session-timeout"
                    value={sessionTimeout}
                    onChange={(e) => setSessionTimeout(e.target.value)}
                    className={inputClass}
                  >
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="60">1 hour</option>
                    <option value="120">2 hours</option>
                  </select>
                </div>

                {/* PASSWORD POLICY */}

                <div>
                  <label className="block text-[10px] font-bold mb-1.5">
                    Password Policy
                  </label>

                  <div
                    className={`h-9 border rounded-sm flex items-center px-3 text-[10px] ${
                      darkMode
                        ? "bg-slate-900 border-slate-600 text-slate-300"
                        : "bg-white border-slate-300 text-slate-600"
                    }`}
                  >
                    Minimum 8 characters
                  </div>
                </div>
              </div>

              <SettingToggle
                checked={twoFactorAuthentication}
                onChange={setTwoFactorAuthentication}
                label="Two-Factor Authentication"
                description="Require an additional verification step when administrators sign in."
              />
            </div>
          </div>

          {/* =================================================
              MAINTENANCE
          ================================================= */}

          <div className="mb-6">
            <h2 className="text-sm font-bold mb-2">Maintenance</h2>

            <div
              className={`border rounded-sm p-4 ${
                darkMode
                  ? "bg-red-950/20 border-red-900"
                  : "bg-red-50 border-red-200"
              }`}
            >
              <SettingToggle
                checked={maintenanceMode}
                onChange={setMaintenanceMode}
                label="Maintenance Mode"
                description="Temporarily restrict access to the system while maintenance is being performed."
                danger
              />

              {maintenanceMode && (
                <div
                  className={`mt-3 p-3 border rounded-sm text-[10px] ${
                    darkMode
                      ? "bg-red-950/40 border-red-800 text-red-300"
                      : "bg-white border-red-200 text-red-700"
                  }`}
                >
                  <strong>Warning:</strong> Maintenance mode is currently
                  enabled. Users may be unable to access the system.
                </div>
              )}
            </div>
          </div>

          {/* =================================================
              ACTION BUTTONS
          ================================================= */}

          <div
            className={`flex flex-wrap items-center justify-between gap-3 pt-4 border-t ${
              darkMode ? "border-slate-700" : "border-slate-200"
            }`}
          >
            <button
              type="button"
              onClick={handleResetSettings}
              className={`h-9 px-6 border rounded-sm text-[10px] font-semibold transition ${
                darkMode
                  ? "bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700"
                  : "bg-white border-slate-300 text-slate-600 hover:bg-slate-100"
              }`}
            >
              Reset
            </button>

            <button
              type="button"
              onClick={handleSaveSettings}
              className={`h-9 px-7 border rounded-sm text-[10px] font-semibold transition ${
                darkMode
                  ? "bg-slate-700 border-slate-500 text-white hover:bg-slate-600"
                  : "bg-slate-700 border-slate-800 text-white hover:bg-slate-800"
              }`}
            >
              Save Settings
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SystemSettings;
