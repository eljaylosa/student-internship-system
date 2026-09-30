import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabaseStudent } from "../../supabaseClient";

const Settings = () => {
  const { darkMode } = useOutletContext();

  // =========================================================
  // ACCOUNT
  // =========================================================

  const [account, setAccount] = useState({
    email: "",
    studentId: "",
  });

  const [accountLoading, setAccountLoading] = useState(true);

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

  const [passwordLoading, setPasswordLoading] = useState(false);

  const [passwordMessage, setPasswordMessage] = useState({
    type: "",
    text: "",
  });

  // =========================================================
  // NOTIFICATION PREFERENCES
  // =========================================================
  //
  // Notification preferences are kept locally for now.
  // They can be connected to the notification system when
  // the Notifications module is implemented.
  //

  const [notificationPreferences, setNotificationPreferences] = useState({
    email: true,
    portal: true,
  });

  const [notificationMessage, setNotificationMessage] = useState("");

  // =========================================================
  // SECURITY
  // =========================================================

  const [securityMessage, setSecurityMessage] = useState({
    type: "",
    text: "",
  });

  const [logoutLoading, setLogoutLoading] = useState(false);

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
  // LOAD ACCOUNT
  // =========================================================

  useEffect(() => {
    let mounted = true;

    const loadAccount = async () => {
      setAccountLoading(true);

      try {
        const {
          data: { user },
          error: authError,
        } = await supabaseStudent.auth.getUser();

        if (authError) {
          console.error("Error loading authenticated user:", authError);
          return;
        }

        if (!user) {
          return;
        }

        let studentId = "";

        const { data: student, error: studentError } = await supabaseStudent
          .from("students")
          .select("student_id")
          .eq("id", user.id)
          .maybeSingle();

        if (studentError) {
          console.warn("Unable to load student information:", studentError);
        } else {
          studentId = student?.student_id || "";
        }

        if (!mounted) return;

        setAccount({
          email: user.email || "",
          studentId,
        });
      } catch (error) {
        console.error("Unexpected account loading error:", error);
      } finally {
        if (mounted) {
          setAccountLoading(false);
        }
      }
    };

    loadAccount();

    return () => {
      mounted = false;
    };
  }, []);

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

  const handleUpdatePassword = async (e) => {
    e.preventDefault();

    const { current, newPassword, confirm } = passwords;

    setPasswordMessage({
      type: "",
      text: "",
    });

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

    if (current === newPassword) {
      setPasswordMessage({
        type: "error",
        text: "Your new password must be different from your current password.",
      });

      return;
    }

    setPasswordLoading(true);

    try {
      // -------------------------------------------------------
      // GET CURRENT AUTH USER
      // -------------------------------------------------------

      const {
        data: { user },
        error: userError,
      } = await supabaseStudent.auth.getUser();

      if (userError || !user?.email) {
        console.error("Unable to get authenticated user:", userError);

        setPasswordMessage({
          type: "error",
          text: "Unable to verify your account. Please sign in again.",
        });

        return;
      }

      // -------------------------------------------------------
      // VERIFY CURRENT PASSWORD
      // -------------------------------------------------------

      const { error: verifyError } =
        await supabaseStudent.auth.signInWithPassword({
          email: user.email,
          password: current,
        });

      if (verifyError) {
        console.error("Current password verification failed:", verifyError);

        setPasswordMessage({
          type: "error",
          text: "Your current password is incorrect.",
        });

        return;
      }

      // -------------------------------------------------------
      // UPDATE PASSWORD
      // -------------------------------------------------------

      const { error: updateError } = await supabaseStudent.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        console.error("Password update failed:", updateError);

        setPasswordMessage({
          type: "error",
          text:
            updateError.message ||
            "Unable to update your password. Please try again.",
        });

        return;
      }

      setPasswordMessage({
        type: "success",
        text: "Password updated successfully.",
      });

      setPasswords({
        current: "",
        newPassword: "",
        confirm: "",
      });

      setShowPasswords({
        current: false,
        newPassword: false,
        confirm: false,
      });
    } catch (error) {
      console.error("Unexpected password update error:", error);

      setPasswordMessage({
        type: "error",
        text: "Something went wrong while updating your password.",
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  // =========================================================
  // NOTIFICATION HANDLERS
  // =========================================================

  const toggleNotification = (type) => {
    setNotificationPreferences((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));

    setNotificationMessage(
      "Notification preferences are saved for this session. Full notification settings will be connected when the Notifications system is added."
    );

    window.setTimeout(() => {
      setNotificationMessage("");
    }, 5000);
  };

  // =========================================================
  // SIGN OUT OTHER SESSIONS
  // =========================================================

  const handleLogoutSessions = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to sign out of all other sessions? Your current session will remain active."
    );

    if (!confirmed) return;

    setLogoutLoading(true);

    setSecurityMessage({
      type: "",
      text: "",
    });

    try {
      const { error } = await supabaseStudent.auth.signOut({
        scope: "others",
      });

      if (error) {
        console.error("Unable to sign out other sessions:", error);

        setSecurityMessage({
          type: "error",
          text:
            error.message ||
            "Unable to sign out other sessions. Please try again.",
        });

        return;
      }

      setSecurityMessage({
        type: "success",
        text: "All other sessions have been signed out.",
      });
    } catch (error) {
      console.error("Unexpected session logout error:", error);

      setSecurityMessage({
        type: "error",
        text: "Something went wrong while signing out other sessions.",
      });
    } finally {
      setLogoutLoading(false);
    }
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
            autoComplete={
              field === "current" ? "current-password" : "new-password"
            }
            disabled={passwordLoading}
            className={`
              w-full
              h-11
              px-3
              pr-14
              rounded-lg
              border
              text-sm
              outline-none
              transition
              disabled:opacity-60
              disabled:cursor-not-allowed
              ${inputClass}
            `}
          />

          <button
            type="button"
            onClick={() => togglePasswordVisibility(field)}
            disabled={passwordLoading}
            className={`
              absolute
              right-3
              top-1/2
              -translate-y-1/2
              text-xs
              font-medium
              transition
              disabled:opacity-50
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
  // TOGGLE
  // =========================================================

  const renderToggle = (enabled, onClick, label) => {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        aria-pressed={enabled}
        className={`
          relative
          flex-shrink-0
          w-11
          h-6
          rounded-full
          transition
          focus:outline-none
          focus:ring-2
          ${
            enabled
              ? darkMode
                ? "bg-slate-500 focus:ring-slate-600"
                : "bg-slate-800 focus:ring-slate-300"
              : darkMode
              ? "bg-slate-700 focus:ring-slate-600"
              : "bg-slate-300 focus:ring-slate-200"
          }
        `}
      >
        <span
          className={`
            absolute
            top-1
            w-4
            h-4
            bg-white
            rounded-full
            shadow-sm
            transition-all
            ${enabled ? "left-6" : "left-1"}
          `}
        />
      </button>
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
          Manage your account, password, notifications, and security.
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
              ACCOUNT INFORMATION
          ================================================= */}

          <section>
            <div className="mb-5">
              <h2 className={`text-lg font-bold ${headingClass}`}>
                Account Information
              </h2>

              <p className={`text-xs mt-1 ${mutedClass}`}>
                Basic information associated with your student account.
              </p>
            </div>

            <div className="max-w-[700px] grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* EMAIL */}

              <div
                className={`
                  border
                  rounded-xl
                  p-5
                  ${innerCardClass}
                `}
              >
                <p
                  className={`text-[10px] uppercase tracking-wider font-bold ${mutedClass}`}
                >
                  Registered Email
                </p>

                {accountLoading ? (
                  <div
                    className={`
                      mt-2
                      h-5
                      w-40
                      rounded
                      animate-pulse
                      ${darkMode ? "bg-slate-800" : "bg-slate-100"}
                    `}
                  />
                ) : (
                  <p
                    className={`text-sm font-semibold mt-2 break-all ${headingClass}`}
                  >
                    {account.email || "Not available"}
                  </p>
                )}

                <p className={`text-[10px] mt-2 ${mutedClass}`}>
                  Your verified account email.
                </p>
              </div>

              {/* STUDENT ID */}

              <div
                className={`
                  border
                  rounded-xl
                  p-5
                  ${innerCardClass}
                `}
              >
                <p
                  className={`text-[10px] uppercase tracking-wider font-bold ${mutedClass}`}
                >
                  Student ID
                </p>

                {accountLoading ? (
                  <div
                    className={`
                      mt-2
                      h-5
                      w-32
                      rounded
                      animate-pulse
                      ${darkMode ? "bg-slate-800" : "bg-slate-100"}
                    `}
                  />
                ) : (
                  <p className={`text-sm font-semibold mt-2 ${headingClass}`}>
                    {account.studentId || "Not available"}
                  </p>
                )}

                <p className={`text-[10px] mt-2 ${mutedClass}`}>
                  Your registered student identifier.
                </p>
              </div>

              {/* ROLE */}

              <div
                className={`
                  border
                  rounded-xl
                  p-5
                  ${innerCardClass}
                  md:col-span-2
                `}
              >
                <p
                  className={`text-[10px] uppercase tracking-wider font-bold ${mutedClass}`}
                >
                  Account Type
                </p>

                <div className="flex items-center gap-3 mt-2">
                  <span
                    className={`
                      inline-flex
                      items-center
                      px-2.5
                      py-1
                      rounded-full
                      text-[10px]
                      font-bold
                      ${
                        darkMode
                          ? "bg-slate-800 text-slate-300"
                          : "bg-slate-100 text-slate-700"
                      }
                    `}
                  >
                    STUDENT
                  </span>

                  <span className={`text-xs ${mutedClass}`}>
                    Student Portal Account
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* DIVIDER */}

          <div className={`border-t ${dividerClass}`} />

          {/* =================================================
              CHANGE PASSWORD
          ================================================= */}

          <section>
            <div className="mb-5">
              <h2 className={`text-lg font-bold ${headingClass}`}>
                Change Password
              </h2>

              <p className={`text-xs mt-1 ${mutedClass}`}>
                Verify your current password before setting a new one.
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

                <div
                  className={`
                    flex
                    flex-wrap
                    gap-x-4
                    gap-y-1
                    text-[10px]
                    -mt-2
                    ${mutedClass}
                  `}
                >
                  <span>• At least 8 characters</span>

                  <span>• Different from your current password</span>
                </div>

                {renderPasswordField(
                  "confirm",
                  "Confirm New Password",
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
                    border
                    ${
                      passwordMessage.type === "success"
                        ? darkMode
                          ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : darkMode
                        ? "bg-red-950 text-red-300 border-red-800"
                        : "bg-red-50 text-red-700 border-red-200"
                    }
                  `}
                >
                  {passwordMessage.text}
                </div>
              )}

              <button
                type="submit"
                disabled={passwordLoading}
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
                  disabled:opacity-60
                  disabled:cursor-not-allowed
                  transition
                "
              >
                {passwordLoading ? "Updating Password..." : "Update Password"}
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
                Choose how you want to receive important SIMS updates.
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
                    Receive important updates through your registered email.
                  </p>
                </div>

                {renderToggle(
                  notificationPreferences.email,
                  () => toggleNotification("email"),
                  "Toggle email notifications"
                )}
              </div>

              {/* PORTAL */}

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
                    Portal Notifications
                  </p>

                  <p className={`text-xs mt-1 ${mutedClass}`}>
                    Receive alerts and updates inside the SIMS portal.
                  </p>
                </div>

                {renderToggle(
                  notificationPreferences.portal,
                  () => toggleNotification("portal"),
                  "Toggle portal notifications"
                )}
              </div>
            </div>

            {/* NOTIFICATION MESSAGE */}

            {notificationMessage && (
              <div
                className={`
                  max-w-[700px]
                  mt-3
                  px-4
                  py-3
                  rounded-lg
                  border
                  text-xs
                  ${
                    darkMode
                      ? "bg-slate-800 border-slate-700 text-slate-300"
                      : "bg-slate-50 border-slate-200 text-slate-600"
                  }
                `}
              >
                {notificationMessage}
              </div>
            )}
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
                Manage your active SIMS account sessions.
              </p>
            </div>

            <div className="max-w-[700px] space-y-3">
              {/* SESSION SECURITY */}

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
                    Account Sessions
                  </p>

                  <p className={`text-xs mt-1 ${mutedClass}`}>
                    Sign out of SIMS sessions on other devices while keeping
                    this current session active.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleLogoutSessions}
                  disabled={logoutLoading}
                  className={`
                    flex-shrink-0
                    px-5
                    py-2.5
                    rounded-lg
                    text-xs
                    font-bold
                    transition
                    disabled:opacity-60
                    disabled:cursor-not-allowed
                    ${
                      darkMode
                        ? "bg-slate-700 text-white hover:bg-slate-600"
                        : "bg-slate-800 text-white hover:bg-slate-700"
                    }
                  `}
                >
                  {logoutLoading ? "Signing Out..." : "Sign Out Other Sessions"}
                </button>
              </div>

              {/* SECURITY MESSAGE */}

              {securityMessage.text && (
                <div
                  className={`
                    px-4
                    py-3
                    rounded-lg
                    border
                    text-xs
                    ${
                      securityMessage.type === "success"
                        ? darkMode
                          ? "bg-emerald-950 border-emerald-800 text-emerald-300"
                          : "bg-emerald-50 border-emerald-200 text-emerald-700"
                        : darkMode
                        ? "bg-red-950 border-red-800 text-red-300"
                        : "bg-red-50 border-red-200 text-red-700"
                    }
                  `}
                >
                  {securityMessage.text}
                </div>
              )}
            </div>
          </section>

          {/* DIVIDER */}

          <div className={`border-t ${dividerClass}`} />

          {/* =================================================
              SECURITY NOTE
          ================================================= */}

          <section>
            <div
              className={`
                max-w-[700px]
                rounded-xl
                border
                p-5
                ${
                  darkMode
                    ? "border-slate-700 bg-slate-800/50"
                    : "border-slate-200 bg-slate-50"
                }
              `}
            >
              <div className="flex gap-3">
                <div className="flex-shrink-0 text-sm">🔒</div>

                <div>
                  <p className={`text-sm font-semibold ${headingClass}`}>
                    Keep your account secure
                  </p>

                  <p className={`text-xs mt-1 leading-5 ${mutedClass}`}>
                    Never share your SIMS password with anyone. If you believe
                    your account has been compromised, change your password
                    immediately and sign out of other sessions.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </section>
    </div>
  );
};

export default Settings;
