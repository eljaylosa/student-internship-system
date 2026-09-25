import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "../../supabaseClient";

// Temporary page-local demo data. This page intentionally has no mockStore dependency.
const localState = {
  settings: {
    systemName: "Student Internship Management System",
    academicYear: "2026 - 2027",
    internshipDuration: "480",
    maintenanceMode: false,
    emailNotifications: true,
    systemNotifications: true,
    applicationNotifications: true,
  },
};
const STATUS = {
  user: {
    ACTIVE: "Active",
    INACTIVE: "Inactive",
    PENDING: "Pending",
  },
  company: {
    PENDING: "Pending",
    VERIFIED: "Verified",
    ACTIVE: "Active",
    INACTIVE: "Inactive",
  },
  opportunity: {
    DRAFT: "Draft",
    ACTIVE: "Active",
    CLOSED: "Closed",
  },
  application: {
    DRAFT: "Draft",
    SUBMITTED: "Submitted",
    UNDER_REVIEW: "Under Review",
    INFO_REQUESTED: "Information Requested",
    APPROVED: "Approved",
    REJECTED: "Rejected",
    WITHDRAWN: "Withdrawn",
  },
  assignment: {
    PENDING: "Pending",
    ACTIVE: "Active",
    COMPLETED: "Completed",
    SUSPENDED: "Suspended",
    TERMINATED: "Terminated",
  },
  document: {
    NOT_SUBMITTED: "Not Submitted",
    SUBMITTED: "Submitted",
    PENDING_REVIEW: "Pending Review",
    APPROVED: "Approved",
    NEEDS_REVISION: "Needs Revision",
  },
  evaluation: {
    DRAFT: "Draft",
    SUBMITTED: "Submitted",
    RETURNED: "Returned",
    FINALIZED: "Finalized",
  },
};

// =========================================================
// COMPONENT
// =========================================================

const SystemSettings = () => {
  const { darkMode } = useOutletContext();

  // =========================================================
  // LOCAL FORM STATE
  //
  // These temporarily hold the values while editing.
  // They are saved to mockStore only when Save Settings
  // is clicked.
  // =========================================================

  const [systemName, setSystemName] = useState(
    "Student Internship Management System"
  );

  const [academicYear, setAcademicYear] = useState("2026 - 2027");

  const [maintenanceMode, setMaintenanceMode] = useState(false);

  const [emailNotifications, setEmailNotifications] = useState(true);

  const [systemNotifications, setSystemNotifications] = useState(true);

  const [applicationNotifications, setApplicationNotifications] =
    useState(true);

  // =========================================================
  // PAGE STATE
  // =========================================================

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [feedback, setFeedback] = useState("");

  const [feedbackType, setFeedbackType] = useState("success");

  // =========================================================
  // FEEDBACK HELPER
  // =========================================================

  const showFeedback = (message, type = "success") => {
    setFeedback(message);
    setFeedbackType(type);

    setTimeout(() => {
      setFeedback("");
    }, 3500);
  };

  // =========================================================
  // LOAD SYSTEM SETTINGS
  // =========================================================

  const loadSettings = async () => {
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("system_settings")
        .select(
          `
          id,
          system_name,
          academic_year,
          email_notifications,
          system_notifications,
          application_notifications,
          maintenance_mode,
          updated_at,
          updated_by
        `
        )
        .limit(1)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        showFeedback(
          "System settings were not found. Please run the system settings SQL setup first.",
          "error"
        );
        return;
      }

      setSystemName(data.system_name || "Student Internship Management System");

      setAcademicYear(data.academic_year || "2026 - 2027");

      setEmailNotifications(data.email_notifications ?? true);

      setSystemNotifications(data.system_notifications ?? true);

      setApplicationNotifications(data.application_notifications ?? true);

      setMaintenanceMode(data.maintenance_mode ?? false);
    } catch (error) {
      console.error("Error loading system settings:", error);

      showFeedback(
        error?.message || "Failed to load system settings.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    loadSettings();
  }, []);

  // =========================================================
  // SAVE SETTINGS
  // =========================================================

  const handleSaveSettings = async () => {
    if (saving) return;

    setSaving(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        throw new Error("Your session has expired. Please sign in again.");
      }

      const { data: currentSettings, error: currentError } = await supabase
        .from("system_settings")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (currentError) {
        throw currentError;
      }

      if (!currentSettings) {
        throw new Error("System settings record was not found.");
      }

      if (!systemName.trim()) {
        throw new Error("System name cannot be empty.");
      }

      const updatedSettings = {
        system_name: systemName.trim(),
        academic_year: academicYear,
        email_notifications: emailNotifications,
        system_notifications: systemNotifications,
        application_notifications: applicationNotifications,
        maintenance_mode: maintenanceMode,
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      };

      const { error: updateError } = await supabase
        .from("system_settings")
        .update(updatedSettings)
        .eq("id", currentSettings.id);

      if (updateError) {
        throw updateError;
      }

      // =====================================================
      // AUDIT LOG
      // =====================================================

      const changedFields = [];

      if (currentSettings.system_name !== updatedSettings.system_name) {
        changedFields.push("system_name");
      }

      if (currentSettings.academic_year !== updatedSettings.academic_year) {
        changedFields.push("academic_year");
      }

      if (
        currentSettings.email_notifications !==
        updatedSettings.email_notifications
      ) {
        changedFields.push("email_notifications");
      }

      if (
        currentSettings.system_notifications !==
        updatedSettings.system_notifications
      ) {
        changedFields.push("system_notifications");
      }

      if (
        currentSettings.application_notifications !==
        updatedSettings.application_notifications
      ) {
        changedFields.push("application_notifications");
      }

      if (
        currentSettings.maintenance_mode !== updatedSettings.maintenance_mode
      ) {
        changedFields.push("maintenance_mode");
      }

      if (changedFields.length > 0) {
        const { error: auditError } = await supabase.functions.invoke(
          "create-audit-log",
          {
            body: {
              action: "UPDATE",
              module: "System Settings",
              target_entity_type: "system_settings",
              target_entity_id: currentSettings.id,
              details: {
                updated_fields: changedFields,
                previous_values: {
                  system_name: currentSettings.system_name,
                  academic_year: currentSettings.academic_year,
                  email_notifications: currentSettings.email_notifications,
                  system_notifications: currentSettings.system_notifications,
                  application_notifications:
                    currentSettings.application_notifications,
                  maintenance_mode: currentSettings.maintenance_mode,
                },
                new_values: {
                  system_name: updatedSettings.system_name,
                  academic_year: updatedSettings.academic_year,
                  email_notifications: updatedSettings.email_notifications,
                  system_notifications: updatedSettings.system_notifications,
                  application_notifications:
                    updatedSettings.application_notifications,
                  maintenance_mode: updatedSettings.maintenance_mode,
                },
              },
            },
          }
        );

        if (auditError) {
          console.error("Settings saved, but audit log failed:", auditError);
        }
      }

      showFeedback("System settings saved successfully.");
    } catch (error) {
      console.error("Error saving system settings:", error);

      showFeedback(
        error?.message || "Failed to save system settings.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // RESET SETTINGS
  // =========================================================

  const handleResetSettings = async () => {
    if (saving) return;

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("system_settings")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error("System settings record was not found.");
      }

      setSystemName(data.system_name || "Student Internship Management System");

      setAcademicYear(data.academic_year || "2026 - 2027");

      setEmailNotifications(data.email_notifications ?? true);

      setSystemNotifications(data.system_notifications ?? true);

      setApplicationNotifications(data.application_notifications ?? true);

      setMaintenanceMode(data.maintenance_mode ?? false);

      showFeedback("Unsaved changes have been reset.");
    } catch (error) {
      console.error("Error resetting system settings:", error);

      showFeedback(
        error?.message || "Failed to reset system settings.",
        "error"
      );
    } finally {
      setLoading(false);
    }
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
    disabled = false,
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
          aria-label={label}
          disabled={disabled}
          onClick={() => onChange(!checked)}
          className={`relative flex-shrink-0 w-9 h-5 rounded-full p-0.5 transition ${
            disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
          } ${
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
  // LOADING STATE
  // =========================================================

  if (loading) {
    return (
      <div
        className={`min-h-[calc(100vh-5rem)] px-4 py-6 sm:px-6 lg:px-8 transition-colors duration-300 ${
          darkMode
            ? "bg-slate-950 text-slate-100"
            : "bg-slate-50 text-slate-900"
        }`}
      >
        <div className="max-w-5xl mx-auto">
          <section
            className={`border rounded-lg p-6 ${
              darkMode
                ? "bg-slate-900 border-slate-700"
                : "bg-white border-slate-400"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-4 h-4 border-2 rounded-full animate-spin ${
                  darkMode
                    ? "border-slate-600 border-t-slate-200"
                    : "border-slate-300 border-t-slate-700"
                }`}
              />

              <span className="text-xs font-semibold">
                Loading system settings...
              </span>
            </div>
          </section>
        </div>
      </div>
    );
  }

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
              Manage system configuration, internship workflow, notifications,
              and maintenance settings.
            </p>
          </div>

          {/* =================================================
              FEEDBACK
          ================================================= */}

          {feedback && (
            <div
              className={`mb-5 px-3 py-2 border rounded-sm text-[10px] ${
                feedbackType === "success"
                  ? darkMode
                    ? "bg-emerald-950/40 border-emerald-800 text-emerald-300"
                    : "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : darkMode
                  ? "bg-red-950/40 border-red-800 text-red-300"
                  : "bg-red-50 border-red-200 text-red-700"
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
                    disabled={saving}
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
                    disabled={saving}
                  >
                    <option value="2025 - 2026">2025 - 2026</option>

                    <option value="2026 - 2027">2026 - 2027</option>

                    <option value="2027 - 2028">2027 - 2028</option>

                    <option value="2028 - 2029">2028 - 2029</option>

                    <option value="2029 - 2030">2029 - 2030</option>
                  </select>
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
              INTERNSHIP WORKFLOW
          ================================================= */}

          <div className="mb-5">
            <h2 className="text-sm font-bold mb-2">Internship Workflow</h2>

            <div className={sectionClass}>
              <div
                className={`flex items-center justify-between gap-4 py-3 border-b ${
                  darkMode ? "border-slate-700" : "border-slate-200"
                }`}
              >
                <div>
                  <p className="text-xs font-semibold">
                    Student Internship Applications
                  </p>

                  <p
                    className={`text-[10px] mt-1 leading-relaxed ${
                      darkMode ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    Student applications are part of the core internship
                    workflow. Students may apply whenever an internship
                    opportunity is active and available.
                  </p>
                </div>

                <span
                  className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[9px] font-bold ${
                    darkMode
                      ? "bg-emerald-950/50 text-emerald-300"
                      : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  Required
                </span>
              </div>

              <div
                className={`flex items-center justify-between gap-4 py-3 border-b ${
                  darkMode ? "border-slate-700" : "border-slate-200"
                }`}
              >
                <div>
                  <p className="text-xs font-semibold">
                    Internship Documents Before Submission
                  </p>

                  <p
                    className={`text-[10px] mt-1 leading-relaxed ${
                      darkMode ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    Required internship documents must be included with the
                    student's application before submission.
                  </p>
                </div>

                <span
                  className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[9px] font-bold ${
                    darkMode
                      ? "bg-emerald-950/50 text-emerald-300"
                      : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  Required
                </span>
              </div>

              <div className="flex items-center justify-between gap-4 py-3">
                <div>
                  <p className="text-xs font-semibold">
                    Approved Documents Before Deployment
                  </p>

                  <p
                    className={`text-[10px] mt-1 leading-relaxed ${
                      darkMode ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    Students cannot be deployed until their required internship
                    documents have been approved.
                  </p>
                </div>

                <span
                  className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[9px] font-bold ${
                    darkMode
                      ? "bg-emerald-950/50 text-emerald-300"
                      : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  Required
                </span>
              </div>
            </div>
          </div>

          {/* =================================================
              REGISTRATION & ACCOUNTS
          ================================================= */}

          <div className="mb-5">
            <h2 className="text-sm font-bold mb-2">
              Registration &amp; Accounts
            </h2>

            <div className={sectionClass}>
              <div
                className={`flex items-center justify-between gap-4 py-3 border-b ${
                  darkMode ? "border-slate-700" : "border-slate-200"
                }`}
              >
                <div>
                  <p className="text-xs font-semibold">Email Verification</p>

                  <p
                    className={`text-[10px] mt-1 leading-relaxed ${
                      darkMode ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    New Student, Registrar Adviser, and Company Supervisor
                    registrations require email verification.
                  </p>
                </div>

                <span
                  className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[9px] font-bold ${
                    darkMode
                      ? "bg-emerald-950/50 text-emerald-300"
                      : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  Required
                </span>
              </div>

              <div className="flex items-center justify-between gap-4 py-3">
                <div>
                  <p className="text-xs font-semibold">
                    Admin Approval for New Accounts
                  </p>

                  <p
                    className={`text-[10px] mt-1 leading-relaxed ${
                      darkMode ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    Verified registration requests must be reviewed and approved
                    by an administrator before account activation.
                  </p>
                </div>

                <span
                  className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[9px] font-bold ${
                    darkMode
                      ? "bg-emerald-950/50 text-emerald-300"
                      : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  Required
                </span>
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
                disabled={saving}
              />

              <SettingToggle
                checked={systemNotifications}
                onChange={setSystemNotifications}
                label="System Notifications"
                description="Enable notifications for important system events and updates."
                disabled={saving}
              />

              <SettingToggle
                checked={applicationNotifications}
                onChange={setApplicationNotifications}
                label="Application Notifications"
                description="Notify users about internship application status changes."
                disabled={saving}
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
                description="Temporarily restrict access to the system while maintenance is being performed. Administrators can still access the admin portal."
                danger
                disabled={saving}
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
                  enabled. Normal users will see the maintenance page, while the
                  administrator portal remains accessible.
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
              disabled={saving}
              className={`h-9 px-6 border rounded-sm text-[10px] font-semibold transition ${
                saving ? "opacity-50 cursor-not-allowed" : ""
              } ${
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
              disabled={saving}
              className={`h-9 px-7 border rounded-sm text-[10px] font-semibold transition ${
                saving ? "opacity-50 cursor-not-allowed" : ""
              } ${
                darkMode
                  ? "bg-slate-700 border-slate-500 text-white hover:bg-slate-600"
                  : "bg-slate-700 border-slate-800 text-white hover:bg-slate-800"
              }`}
            >
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SystemSettings;
