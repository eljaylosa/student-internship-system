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
    name: "Prof. Smith",
    email: "prof.smith@university.edu",
    phone: "+63 912 345 6789",
    department: "Information Technology",
  });

  const [profileMessage, setProfileMessage] = useState("");

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
  // LOAD REGISTRAR SCHOOL
  // =========================================================

  useEffect(() => {
    loadRegistrarSchool();
  }, []);

  const loadRegistrarSchool = async () => {
    try {
      setSchoolLoading(true);
      setSchoolMessage({
        type: "",
        text: "",
      });

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
      // Get registrar's school
      // -------------------------------------------------------

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

      setSchoolId(registrar.school_id);

      // -------------------------------------------------------
      // Get school information
      // -------------------------------------------------------

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
      console.error("Failed to load registrar school:", error);

      setSchoolMessage({
        type: "error",
        text: error.message || "Failed to load your school information.",
      });
    } finally {
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
    // Validate file type
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
    // Validate file size
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
      // Get authenticated user
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
      // Verify registrar is actually assigned to this school
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
      // Get extension
      // -----------------------------------------------------

      const extension = file.name.split(".").pop()?.toLowerCase() || "png";

      // -----------------------------------------------------
      // Unique file path
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
      // Upload to Storage
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
      // Generate public URL
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

      console.log("Generated public logo URL:", publicUrl);

      // -----------------------------------------------------
      // Save URL to schools.logo_url
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

      console.log("Updated school record:", updatedSchool);

      // -----------------------------------------------------
      // Update UI
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
            Manage your profile, school information, notifications, and account
            security.
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
                  Update your registrar account information.
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
                  Manage your school's information and official logo used for
                  internship completion certificates.
                </p>
              </div>

              <div className="max-w-[700px]">
                {/* SCHOOL DETAILS */}

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
                      <div className="grid grid-cols-1 sm:grid-cols-[140px_minmax(0,1fr)] gap-1.5 sm:gap-4 mb-6">
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

                      {/* LOGO AREA */}

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
                            This logo will automatically appear on internship
                            completion certificates issued to students from your
                            school.
                          </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-5 sm:items-center">
                          {/* LOGO PREVIEW */}

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
                                className="w-full h-full object-contain p-4"
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

                            <p
                              className={`
                                text-[10px]
                                mt-1
                                ${bodyTextClass}
                              `}
                            >
                              Upload your official school logo before deploying
                              students.
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

                        {/* READY STATUS */}

                        {!schoolLoading && (
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
                                mt-0.5
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
                                  ? "Your school logo is configured and ready to be used on internship certificates."
                                  : "Please upload your school's official logo before deploying students."}
                              </p>
                            </div>
                          </div>
                        )}
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
                      {/* CURRENT PASSWORD */}

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

                      {/* NEW PASSWORD */}

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

                      {/* CONFIRM PASSWORD */}

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
