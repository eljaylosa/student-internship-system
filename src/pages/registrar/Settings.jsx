import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabaseRegistrar } from "../../supabaseClient";

const SCHOOL_LOGO_BUCKET = "school-assets";

const Settings = () => {
  const { darkMode } = useOutletContext();

  // =========================================================
  // PROFILE
  // =========================================================

  const [profile, setProfile] = useState({
    email: "",
    employeeId: "",
    phone: "",
    address: "",
    department: "",
    position: "",
    specialization: "",
  });

  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);

  const [profileMessage, setProfileMessage] = useState({
    type: "",
    text: "",
  });

  // =========================================================
  // SCHOOL INFORMATION
  // =========================================================

  const [school, setSchool] = useState(null);
  const [schoolId, setSchoolId] = useState(null);

  const [schoolLoading, setSchoolLoading] = useState(true);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const [schoolMessage, setSchoolMessage] = useState({
    type: "",
    text: "",
  });

  // =========================================================
  // NOTIFICATIONS
  // =========================================================

  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    portalNotifications: true,
    studentSubmissions: true,
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
  // CHANGE PASSWORD
  // =========================================================

  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const [passwords, setPasswords] = useState({
    current: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    newPassword: false,
    confirmPassword: false,
  });

  const [passwordLoading, setPasswordLoading] = useState(false);

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
  // LOAD ACCOUNT + REGISTRAR + SCHOOL
  // =========================================================

  useEffect(() => {
    loadSettingsData();
  }, []);

  const loadSettingsData = async () => {
    try {
      setProfileLoading(true);
      setSchoolLoading(true);

      setProfileMessage({
        type: "",
        text: "",
      });

      setSchoolMessage({
        type: "",
        text: "",
      });

      // -------------------------------------------------------
      // AUTH USER
      // -------------------------------------------------------

      const {
        data: { user },
        error: userError,
      } = await supabaseRegistrar.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        throw new Error("You are not authenticated.");
      }

      // -------------------------------------------------------
      // REGISTRAR
      //
      // IMPORTANT:
      // registrars.id = users.id
      // There is NO user_id column.
      // -------------------------------------------------------

      const { data: registrar, error: registrarError } = await supabaseRegistrar
        .from("registrars")
        .select(
          `
              id,
              employee_id,
              department,
              position,
              specialization,
              phone,
              address,
              school_id
            `
        )
        .eq("id", user.id)
        .single();

      if (registrarError) {
        throw registrarError;
      }

      // -------------------------------------------------------
      // PROFILE
      //
      // Full Name is intentionally NOT loaded here.
      // It is already managed/displayed in the Registrar Profile.
      //
      // Email comes directly from Supabase Auth.
      // -------------------------------------------------------

      setProfile({
        email: user.email || "",
        employeeId: registrar.employee_id || "",
        phone: registrar.phone || "",
        address: registrar.address || "",
        department: registrar.department || "",
        position: registrar.position || "",
        specialization: registrar.specialization || "",
      });

      // -------------------------------------------------------
      // SCHOOL
      // -------------------------------------------------------

      if (!registrar.school_id) {
        setSchoolId(null);
        setSchool(null);

        setSchoolMessage({
          type: "error",
          text: "Your registrar account is not assigned to a school.",
        });

        return;
      }

      setSchoolId(registrar.school_id);

      const { data: schoolData, error: schoolError } = await supabaseRegistrar
        .from("schools")
        .select(
          `
              id,
              name,
              code,
              logo_url
            `
        )
        .eq("id", registrar.school_id)
        .single();

      if (schoolError) {
        throw schoolError;
      }

      setSchool(schoolData);
    } catch (error) {
      console.error("Failed to load registrar settings:", error);

      setProfileMessage({
        type: "error",
        text: error?.message || "Failed to load your account information.",
      });

      setSchoolMessage({
        type: "error",
        text: error?.message || "Failed to load your school information.",
      });
    } finally {
      setProfileLoading(false);
      setSchoolLoading(false);
    }
  };

  // =========================================================
  // PROFILE HANDLERS
  // =========================================================

  const handleProfileChange = (field, value) => {
    setProfile((prev) => ({
      ...prev,
      [field]: value,
    }));

    setProfileMessage({
      type: "",
      text: "",
    });
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();

    setProfileMessage({
      type: "",
      text: "",
    });

    if (!profile.department.trim()) {
      setProfileMessage({
        type: "error",
        text: "Department is required.",
      });

      return;
    }

    if (!profile.position.trim()) {
      setProfileMessage({
        type: "error",
        text: "Position is required.",
      });

      return;
    }

    setProfileSaving(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabaseRegistrar.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        throw new Error("You are not authenticated.");
      }

      // -------------------------------------------------------
      // UPDATE REGISTRAR TABLE
      // -------------------------------------------------------

      const { data: updatedRegistrar, error } = await supabaseRegistrar
        .from("registrars")
        .update({
          phone: profile.phone.trim() || null,
          address: profile.address.trim() || null,
          department: profile.department.trim(),
          position: profile.position.trim(),
          specialization: profile.specialization.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)
        .select(
          `
            id,
            employee_id,
            department,
            position,
            specialization,
            phone,
            address,
            school_id
          `
        )
        .single();

      if (error) {
        console.error("Registrar profile update failed:", error);

        throw error;
      }

      // -------------------------------------------------------
      // UPDATE LOCAL STATE
      // -------------------------------------------------------

      setProfile((prev) => ({
        ...prev,
        phone: updatedRegistrar.phone || "",
        address: updatedRegistrar.address || "",
        department: updatedRegistrar.department || "",
        position: updatedRegistrar.position || "",
        specialization: updatedRegistrar.specialization || "",
      }));

      setProfileMessage({
        type: "success",
        text: "Profile settings saved successfully.",
      });
    } catch (error) {
      console.error("Failed to save registrar profile:", error);

      setProfileMessage({
        type: "error",
        text: error?.message || "Failed to save your profile settings.",
      });
    } finally {
      setProfileSaving(false);
    }
  };

  // =========================================================
  // SCHOOL LOGO HANDLER
  // =========================================================

  const handleSchoolLogoUpload = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setSchoolMessage({
      type: "",
      text: "",
    });

    const resetInput = () => {
      event.target.value = "";
    };

    // -------------------------------------------------------
    // VALIDATE TYPE
    // -------------------------------------------------------

    const allowedTypes = ["image/png", "image/jpeg", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setSchoolMessage({
        type: "error",
        text: "Please upload a PNG, JPG, or WebP image.",
      });

      resetInput();
      return;
    }

    // -------------------------------------------------------
    // VALIDATE SIZE
    // -------------------------------------------------------

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      setSchoolMessage({
        type: "error",
        text: "School logo must be 5MB or smaller.",
      });

      resetInput();
      return;
    }

    if (!schoolId) {
      setSchoolMessage({
        type: "error",
        text: "School information is not available.",
      });

      resetInput();
      return;
    }

    try {
      setUploadingLogo(true);

      // -----------------------------------------------------
      // GET AUTH USER
      // -----------------------------------------------------

      const {
        data: { user },
        error: userError,
      } = await supabaseRegistrar.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        throw new Error("You are not authenticated.");
      }

      // -----------------------------------------------------
      // VERIFY REGISTRAR SCHOOL
      // -----------------------------------------------------

      const { data: registrar, error: registrarError } = await supabaseRegistrar
        .from("registrars")
        .select("school_id")
        .eq("id", user.id)
        .single();

      if (registrarError) {
        throw registrarError;
      }

      if (!registrar?.school_id) {
        throw new Error("Your registrar account is not assigned to a school.");
      }

      if (registrar.school_id !== schoolId) {
        throw new Error(
          "You are not authorized to update this school's information."
        );
      }

      // -----------------------------------------------------
      // FILE EXTENSION
      // -----------------------------------------------------

      const extension = file.name.split(".").pop()?.toLowerCase() || "png";

      // -----------------------------------------------------
      // UNIQUE PATH
      // -----------------------------------------------------

      const filePath = `school-logos/${schoolId}/${crypto.randomUUID()}.${extension}`;

      console.log("Uploading school logo:", {
        bucket: SCHOOL_LOGO_BUCKET,
        filePath,
        schoolId,
        fileType: file.type,
        fileSize: file.size,
      });

      // -----------------------------------------------------
      // UPLOAD
      // -----------------------------------------------------

      const { data: uploadedFile, error: uploadError } =
        await supabaseRegistrar.storage
          .from(SCHOOL_LOGO_BUCKET)
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type,
          });

      if (uploadError) {
        console.error("Storage upload failed:", uploadError);

        throw new Error(`Failed to upload school logo: ${uploadError.message}`);
      }

      console.log("School logo uploaded:", uploadedFile);

      // -----------------------------------------------------
      // PUBLIC URL
      // -----------------------------------------------------

      const { data: publicUrlData } = supabaseRegistrar.storage
        .from(SCHOOL_LOGO_BUCKET)
        .getPublicUrl(filePath);

      const publicUrl = publicUrlData?.publicUrl;

      if (!publicUrl) {
        throw new Error(
          "The logo was uploaded, but Supabase could not generate its public URL."
        );
      }

      // -----------------------------------------------------
      // SAVE TO SCHOOL
      // -----------------------------------------------------

      const { data: updatedSchool, error: schoolUpdateError } =
        await supabaseRegistrar
          .from("schools")
          .update({
            logo_url: publicUrl,
          })
          .eq("id", schoolId)
          .select("id, name, code, logo_url")
          .single();

      if (schoolUpdateError) {
        console.error("schools.logo_url update failed:", schoolUpdateError);

        throw new Error(
          `Logo uploaded to Storage, but saving the logo URL failed: ${schoolUpdateError.message}`
        );
      }

      if (!updatedSchool) {
        throw new Error(
          "The logo was uploaded, but the school record was not updated."
        );
      }

      // -----------------------------------------------------
      // UPDATE UI
      // -----------------------------------------------------

      setSchool(updatedSchool);

      setSchoolMessage({
        type: "success",
        text: "School logo uploaded and saved successfully. It will be used for internship completion certificates.",
      });
    } catch (error) {
      console.error("School logo upload error:", error);

      setSchoolMessage({
        type: "error",
        text: error?.message || "Failed to upload and save the school logo.",
      });
    } finally {
      setUploadingLogo(false);
      resetInput();
    }
  };

  // =========================================================
  // NOTIFICATION HANDLER
  // =========================================================

  const toggleNotification = (type) => {
    setNotifications((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));

    setNotificationMessage(
      "Notification preferences are currently stored for this session. They will be connected to the SIMS Notifications system when that module is implemented."
    );

    window.setTimeout(() => {
      setNotificationMessage("");
    }, 5000);
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

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    const { current, newPassword, confirmPassword } = passwords;

    setPasswordMessage({
      type: "",
      text: "",
    });

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

    if (current === newPassword) {
      setPasswordMessage({
        type: "error",
        text: "Your new password must be different from your current password.",
      });

      return;
    }

    setPasswordLoading(true);

    try {
      // -----------------------------------------------------
      // GET USER
      // -----------------------------------------------------

      const {
        data: { user },
        error: userError,
      } = await supabaseRegistrar.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user?.email) {
        throw new Error("Unable to verify your account. Please sign in again.");
      }

      // -----------------------------------------------------
      // VERIFY CURRENT PASSWORD
      // -----------------------------------------------------

      const { error: verifyError } =
        await supabaseRegistrar.auth.signInWithPassword({
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

      // -----------------------------------------------------
      // UPDATE PASSWORD
      // -----------------------------------------------------

      const { error: updateError } = await supabaseRegistrar.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        console.error("Password update failed:", updateError);

        throw updateError;
      }

      setPasswordMessage({
        type: "success",
        text: "Password updated successfully.",
      });

      setPasswords({
        current: "",
        newPassword: "",
        confirmPassword: "",
      });

      setShowPasswords({
        current: false,
        newPassword: false,
        confirmPassword: false,
      });
    } catch (error) {
      console.error("Password update error:", error);

      setPasswordMessage({
        type: "error",
        text:
          error?.message || "Unable to update your password. Please try again.",
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  // =========================================================
  // SIGN OUT OTHER SESSIONS
  // =========================================================

  const handleLogoutOtherSessions = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to sign out of all other SIMS sessions? Your current session will remain active."
    );

    if (!confirmed) {
      return;
    }

    setLogoutLoading(true);

    setSecurityMessage({
      type: "",
      text: "",
    });

    try {
      const { error } = await supabaseRegistrar.auth.signOut({
        scope: "others",
      });

      if (error) {
        throw error;
      }

      setSecurityMessage({
        type: "success",
        text: "All other sessions have been signed out.",
      });
    } catch (error) {
      console.error("Failed to sign out other sessions:", error);

      setSecurityMessage({
        type: "error",
        text: error?.message || "Unable to sign out other sessions.",
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
        <label
          className={`
            block
            text-xs
            font-bold
            mb-1.5
            ${labelClass}
          `}
        >
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
              h-10
              px-3
              pr-14
              rounded-lg
              border
              text-sm
              outline-none
              transition
              disabled:opacity-60
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
              text-[11px]
              font-semibold
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
  // NOTIFICATION SWITCH
  // =========================================================

  const NotificationSwitch = ({ enabled, onClick, label }) => (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Toggle ${label}`}
      aria-pressed={enabled}
      className={`
        relative
        flex-shrink-0
        w-11
        h-6
        rounded-full
        transition-colors
        duration-200
        focus:outline-none
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
            Registrar Portal
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
            Manage your registrar profile, school information, notifications,
            and account security.
          </p>
        </div>

        {/* =====================================================
            SETTINGS PANEL
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
          <div
            className="
              p-4
              sm:p-6
              md:p-7
              lg:p-8
              space-y-8
              sm:space-y-10
            "
          >
            {/* =================================================
                PROFILE
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
                  Manage the information associated with your registrar account.
                </p>
              </div>

              {profileLoading ? (
                <div
                  className={`
                    max-w-[700px]
                    border
                    rounded-xl
                    p-5
                    ${sectionCardClass}
                  `}
                >
                  <p
                    className={`
                      text-sm
                      font-semibold
                      ${headingClass}
                    `}
                  >
                    Loading profile...
                  </p>

                  <p
                    className={`
                      text-xs
                      mt-1
                      ${bodyTextClass}
                    `}
                  >
                    Please wait while we load your registrar information.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSaveProfile} className="max-w-[700px]">
                  <div className="space-y-4">
                    {/* EMAIL */}

                    <div>
                      <label
                        className={`
                          block
                          text-xs
                          font-semibold
                          mb-1.5
                          ${labelClass}
                        `}
                      >
                        Email
                      </label>

                      <input
                        type="email"
                        value={profile.email}
                        disabled
                        className={`
                          w-full
                          h-10
                          px-3
                          rounded-lg
                          border
                          text-sm
                          opacity-70
                          cursor-not-allowed
                          ${inputClass}
                        `}
                      />

                      <p
                        className={`
                          text-[10px]
                          mt-1
                          ${bodyTextClass}
                        `}
                      >
                        Your registered authentication email.
                      </p>
                    </div>

                    {/* EMPLOYEE ID */}

                    <div>
                      <label
                        className={`
                          block
                          text-xs
                          font-semibold
                          mb-1.5
                          ${labelClass}
                        `}
                      >
                        Employee ID
                      </label>

                      <input
                        type="text"
                        value={profile.employeeId}
                        disabled
                        className={`
                          w-full
                          h-10
                          px-3
                          rounded-lg
                          border
                          text-sm
                          opacity-70
                          cursor-not-allowed
                          ${inputClass}
                        `}
                      />
                    </div>

                    {/* PHONE */}

                    <div>
                      <label
                        className={`
                          block
                          text-xs
                          font-semibold
                          mb-1.5
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
                        placeholder="Enter phone number"
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

                    {/* ADDRESS */}

                    <div>
                      <label
                        className={`
                          block
                          text-xs
                          font-semibold
                          mb-1.5
                          ${labelClass}
                        `}
                      >
                        Address
                      </label>

                      <textarea
                        value={profile.address}
                        onChange={(e) =>
                          handleProfileChange("address", e.target.value)
                        }
                        placeholder="Enter address"
                        rows={3}
                        className={`
                          w-full
                          px-3
                          py-2.5
                          rounded-lg
                          border
                          text-sm
                          outline-none
                          resize-y
                          transition
                          ${inputClass}
                        `}
                      />
                    </div>

                    {/* DEPARTMENT */}

                    <div>
                      <label
                        className={`
                          block
                          text-xs
                          font-semibold
                          mb-1.5
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
                        placeholder="Enter department"
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

                    {/* POSITION */}

                    <div>
                      <label
                        className={`
                          block
                          text-xs
                          font-semibold
                          mb-1.5
                          ${labelClass}
                        `}
                      >
                        Position
                      </label>

                      <input
                        type="text"
                        value={profile.position}
                        onChange={(e) =>
                          handleProfileChange("position", e.target.value)
                        }
                        placeholder="Enter position"
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

                    {/* SPECIALIZATION */}

                    <div>
                      <label
                        className={`
                          block
                          text-xs
                          font-semibold
                          mb-1.5
                          ${labelClass}
                        `}
                      >
                        Specialization
                      </label>

                      <input
                        type="text"
                        value={profile.specialization}
                        onChange={(e) =>
                          handleProfileChange("specialization", e.target.value)
                        }
                        placeholder="Enter specialization (optional)"
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

                  {/* MESSAGE */}

                  {profileMessage.text && (
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
                          profileMessage.type === "success"
                            ? darkMode
                              ? "bg-emerald-950/40 text-emerald-300 border-emerald-800"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : darkMode
                            ? "bg-red-950/40 text-red-300 border-red-800"
                            : "bg-red-50 text-red-700 border-red-200"
                        }
                      `}
                    >
                      {profileMessage.text}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={profileSaving}
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
                      disabled:opacity-60
                      disabled:cursor-not-allowed
                      transition
                    "
                  >
                    {profileSaving ? "Saving..." : "Save Changes"}
                  </button>
                </form>
              )}
            </section>

            {/* DIVIDER */}

            <div className={`border-t ${dividerClass}`} />

            {/* =================================================
                SCHOOL INFORMATION
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
                  School Information
                </h2>

                <p
                  className={`
                    text-[11px]
                    sm:text-xs
                    mt-1
                    ${bodyTextClass}
                  `}
                >
                  Manage your assigned school's official information and
                  certificate logo.
                </p>
              </div>

              <div className="max-w-[700px]">
                <div
                  className={`
                    border
                    rounded-xl
                    p-4
                    sm:p-5
                    ${sectionCardClass}
                  `}
                >
                  {schoolLoading ? (
                    <div>
                      <p
                        className={`
                          text-sm
                          font-semibold
                          ${headingClass}
                        `}
                      >
                        Loading school information...
                      </p>

                      <p
                        className={`
                          text-xs
                          mt-1
                          ${bodyTextClass}
                        `}
                      >
                        Please wait while we load your assigned school.
                      </p>
                    </div>
                  ) : school ? (
                    <>
                      {/* SCHOOL DETAILS */}

                      <div
                        className="
                          grid
                          grid-cols-1
                          sm:grid-cols-[140px_minmax(0,1fr)]
                          gap-1.5
                          sm:gap-4
                          mb-6
                        "
                      >
                        <span
                          className={`
                            text-xs
                            font-semibold
                            ${labelClass}
                          `}
                        >
                          School
                        </span>

                        <div>
                          <p
                            className={`
                              text-sm
                              font-bold
                              ${headingClass}
                            `}
                          >
                            {school.name || "Unnamed School"}
                          </p>

                          {school.code && (
                            <p
                              className={`
                                text-xs
                                mt-0.5
                                ${bodyTextClass}
                              `}
                            >
                              School Code: {school.code}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* LOGO */}

                      <div
                        className={`
                          border-t
                          pt-5
                          ${dividerClass}
                        `}
                      >
                        <div className="mb-4">
                          <p
                            className={`
                              text-sm
                              font-semibold
                              ${headingClass}
                            `}
                          >
                            Official School Logo
                          </p>

                          <p
                            className={`
                              text-[10px]
                              sm:text-xs
                              mt-1
                              ${bodyTextClass}
                            `}
                          >
                            This logo is used on internship completion
                            certificates for students from your school.
                          </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-5 sm:items-center">
                          {/* PREVIEW */}

                          <div
                            className={`
                              w-36
                              h-36
                              rounded-xl
                              border-2
                              border-dashed
                              flex
                              items-center
                              justify-center
                              overflow-hidden
                              flex-shrink-0
                              ${
                                darkMode
                                  ? "border-slate-600 bg-slate-900"
                                  : "border-slate-300 bg-slate-50"
                              }
                            `}
                          >
                            {school.logo_url ? (
                              <img
                                src={school.logo_url}
                                alt={`${school.name} logo`}
                                className="
                                  w-full
                                  h-full
                                  object-contain
                                  p-4
                                "
                              />
                            ) : (
                              <div className="text-center px-4">
                                <p
                                  className={`
                                    text-xs
                                    font-medium
                                    ${bodyTextClass}
                                  `}
                                >
                                  No logo uploaded
                                </p>
                              </div>
                            )}
                          </div>

                          {/* UPLOAD */}

                          <div className="flex-1">
                            <label
                              className={`
                                inline-flex
                                items-center
                                justify-center
                                px-5
                                py-2.5
                                rounded-lg
                                text-xs
                                font-bold
                                transition
                                ${
                                  uploadingLogo
                                    ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                                    : "bg-slate-800 text-white hover:bg-slate-700 cursor-pointer"
                                }
                              `}
                            >
                              {uploadingLogo
                                ? "Uploading..."
                                : school.logo_url
                                ? "Replace School Logo"
                                : "Upload School Logo"}

                              <input
                                type="file"
                                accept="image/png,image/jpeg,image/webp"
                                onChange={handleSchoolLogoUpload}
                                disabled={uploadingLogo}
                                className="hidden"
                              />
                            </label>

                            <p
                              className={`
                                text-[10px]
                                mt-2
                                ${bodyTextClass}
                              `}
                            >
                              PNG, JPG, or WebP · Maximum 5MB
                            </p>
                          </div>
                        </div>

                        {/* SCHOOL MESSAGE */}

                        {schoolMessage.text && (
                          <div
                            className={`
                              mt-5
                              px-4
                              py-3
                              rounded-lg
                              border
                              text-xs
                              font-medium
                              ${
                                schoolMessage.type === "success"
                                  ? darkMode
                                    ? "bg-emerald-950/40 text-emerald-300 border-emerald-800"
                                    : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : darkMode
                                  ? "bg-red-950/40 text-red-300 border-red-800"
                                  : "bg-red-50 text-red-700 border-red-200"
                              }
                            `}
                          >
                            {schoolMessage.text}
                          </div>
                        )}

                        {/* STATUS */}

                        <div
                          className={`
                            mt-5
                            flex
                            items-start
                            gap-3
                            rounded-lg
                            border
                            px-4
                            py-3
                            ${
                              school.logo_url
                                ? darkMode
                                  ? "bg-emerald-950/30 border-emerald-900"
                                  : "bg-emerald-50 border-emerald-200"
                                : darkMode
                                ? "bg-amber-950/30 border-amber-900"
                                : "bg-amber-50 border-amber-200"
                            }
                          `}
                        >
                          <div
                            className={`
                              mt-1
                              w-2
                              h-2
                              rounded-full
                              flex-shrink-0
                              ${
                                school.logo_url
                                  ? "bg-emerald-500"
                                  : "bg-amber-500"
                              }
                            `}
                          />

                          <div>
                            <p
                              className={`
                                text-xs
                                font-bold
                                ${
                                  school.logo_url
                                    ? darkMode
                                      ? "text-emerald-300"
                                      : "text-emerald-700"
                                    : darkMode
                                    ? "text-amber-300"
                                    : "text-amber-700"
                                }
                              `}
                            >
                              {school.logo_url
                                ? "School Logo Ready"
                                : "School Logo Required"}
                            </p>

                            <p
                              className={`
                                text-[10px]
                                sm:text-xs
                                mt-0.5
                                ${
                                  school.logo_url
                                    ? darkMode
                                      ? "text-emerald-400"
                                      : "text-emerald-600"
                                    : darkMode
                                    ? "text-amber-400"
                                    : "text-amber-600"
                                }
                              `}
                            >
                              {school.logo_url
                                ? "Your school's official logo is configured for internship completion certificates."
                                : "Upload the official school logo before certificates are generated."}
                            </p>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div>
                      <p
                        className={`
                          text-sm
                          font-semibold
                          ${headingClass}
                        `}
                      >
                        School information unavailable
                      </p>

                      <p
                        className={`
                          text-xs
                          mt-1
                          ${bodyTextClass}
                        `}
                      >
                        Your registrar account could not be linked to a school.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* DIVIDER */}

            <div className={`border-t ${dividerClass}`} />

            {/* =================================================
                NOTIFICATIONS
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
                  Choose which SIMS notifications you want to receive.
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
                {/* EMAIL */}

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
                      Email Notifications
                    </p>

                    <p
                      className={`
                        text-[10px]
                        sm:text-xs
                        mt-1
                        ${bodyTextClass}
                      `}
                    >
                      Receive important SIMS updates through your registered
                      email.
                    </p>
                  </div>

                  <NotificationSwitch
                    enabled={notifications.emailAlerts}
                    onClick={() => toggleNotification("emailAlerts")}
                    label="email notifications"
                  />
                </div>

                {/* PORTAL */}

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
                      Portal Notifications
                    </p>

                    <p
                      className={`
                        text-[10px]
                        sm:text-xs
                        mt-1
                        ${bodyTextClass}
                      `}
                    >
                      Receive alerts and updates inside the SIMS portal.
                    </p>
                  </div>

                  <NotificationSwitch
                    enabled={notifications.portalNotifications}
                    onClick={() => toggleNotification("portalNotifications")}
                    label="portal notifications"
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
                      documents for review.
                    </p>
                  </div>

                  <NotificationSwitch
                    enabled={notifications.studentSubmissions}
                    onClick={() => toggleNotification("studentSubmissions")}
                    label="student submission notifications"
                  />
                </div>
              </div>

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
                        ? "bg-slate-900 border-slate-700 text-slate-400"
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
                  Manage your password and active account sessions.
                </p>
              </div>

              <div className="max-w-[700px] space-y-3">
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
                      Change your SIMS account password.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordForm((prev) => !prev);

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
                    {showPasswordForm ? "Close" : "Change Password"}
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

                      <p
                        className={`
                          text-[10px]
                          -mt-2
                          ${bodyTextClass}
                        `}
                      >
                        New password must contain at least 8 characters.
                      </p>

                      {renderPasswordField(
                        "confirmPassword",
                        "Confirm New Password",
                        "Confirm new password"
                      )}

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
                          disabled={passwordLoading}
                          className="
                            px-5
                            py-2.5
                            rounded-lg
                            bg-slate-800
                            text-white
                            text-xs
                            font-bold
                            hover:bg-slate-700
                            disabled:opacity-60
                            disabled:cursor-not-allowed
                            transition
                          "
                        >
                          {passwordLoading ? "Updating..." : "Update Password"}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setShowPasswordForm(false);

                            setPasswords({
                              current: "",
                              newPassword: "",
                              confirmPassword: "",
                            });

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

                {/* OTHER SESSIONS */}

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
                      Account Sessions
                    </p>

                    <p
                      className={`
                        text-[10px]
                        sm:text-xs
                        mt-1
                        ${bodyTextClass}
                      `}
                    >
                      Sign out of SIMS sessions on other devices while keeping
                      this session active.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleLogoutOtherSessions}
                    disabled={logoutLoading}
                    className="
                      flex-shrink-0
                      px-5
                      py-2.5
                      rounded-lg
                      bg-slate-800
                      text-white
                      text-xs
                      font-bold
                      hover:bg-slate-700
                      disabled:opacity-60
                      disabled:cursor-not-allowed
                      transition
                    "
                  >
                    {logoutLoading
                      ? "Signing Out..."
                      : "Sign Out Other Sessions"}
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
                      font-medium
                      ${
                        securityMessage.type === "success"
                          ? darkMode
                            ? "bg-emerald-950/40 text-emerald-300 border-emerald-800"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : darkMode
                          ? "bg-red-950/40 text-red-300 border-red-800"
                          : "bg-red-50 text-red-700 border-red-200"
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
                      ? "border-slate-700 bg-slate-900/50"
                      : "border-slate-200 bg-slate-50"
                  }
                `}
              >
                <div className="flex gap-3">
                  <div className="flex-shrink-0 text-sm">🔒</div>

                  <div>
                    <p
                      className={`
                        text-sm
                        font-semibold
                        ${headingClass}
                      `}
                    >
                      Keep your account secure
                    </p>

                    <p
                      className={`
                        text-xs
                        mt-1
                        leading-5
                        ${bodyTextClass}
                      `}
                    >
                      Never share your SIMS password with anyone. If you believe
                      your account has been compromised, change your password
                      and sign out of other sessions.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Settings;
