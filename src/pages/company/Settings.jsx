import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabaseCompany } from "../../supabaseClient";
import { INDUSTRIES } from "../../constants/industries";

const COMPANY_LOGO_BUCKET = "company-logos";

const Settings = () => {
  const outletContext = useOutletContext();
  const darkMode = outletContext?.darkMode ?? false;

  // =========================================================
  // LOADING
  // =========================================================

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);

  // =========================================================
  // PROFILE
  // =========================================================

  const [profile, setProfile] = useState({
    companyName: "",
    supervisorName: "",
    email: "",
    companyEmail: "",
    phone: "",
    address: "",
    website: "",
    industry: "",
    position: "",
    status: "",
  });

  const [profileMessage, setProfileMessage] = useState({
    type: "",
    text: "",
  });

  // =========================================================
  // COMPANY LOGO
  // =========================================================

  const [logoPath, setLogoPath] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoMessage, setLogoMessage] = useState({
    type: "",
    text: "",
  });

  // =========================================================
  // NOTIFICATIONS
  // =========================================================
  //
  // These are UI preferences for now.
  // The actual Notifications system will be implemented later.
  //

  const [notifications, setNotifications] = useState({
    applicationUpdates: true,
    documentUpdates: true,
    evaluationReminders: true,
    messages: true,
    systemUpdates: true,
  });

  // =========================================================
  // SECURITY
  // =========================================================

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
  // HELPERS
  // =========================================================

  const getSupervisorName = (user) => {
    if (!user) return "";

    const firstName = user.first_name?.trim() || "";
    const middleName = user.middle_name?.trim() || "";
    const lastName = user.last_name?.trim() || "";

    return [firstName, middleName, lastName].filter(Boolean).join(" ").trim();
  };

  const getLogoUrl = async (path) => {
    if (!path) return null;

    const rawPath = String(path).trim();

    if (!rawPath) return null;

    if (/^https?:\/\//i.test(rawPath)) {
      return rawPath;
    }

    const cleanPath = rawPath.replace(/^\/+/, "");

    const { data, error } = await supabaseCompany.storage
      .from(COMPANY_LOGO_BUCKET)
      .createSignedUrl(cleanPath, 60 * 60);

    if (error) {
      console.error("Error creating company logo URL:", error);
      return null;
    }

    return data?.signedUrl || null;
  };

  // =========================================================
  // LOAD COMPANY SETTINGS
  // =========================================================

  useEffect(() => {
    let mounted = true;

    const loadSettings = async () => {
      setLoading(true);

      try {
        const {
          data: { user },
          error: authError,
        } = await supabaseCompany.auth.getUser();

        if (authError) {
          throw authError;
        }

        if (!user) {
          throw new Error("No authenticated company account found.");
        }

        // -----------------------------------------------------
        // LOAD USER PROFILE
        // -----------------------------------------------------

        const { data: userProfile, error: userError } = await supabaseCompany
          .from("users")
          .select("id, email, first_name, middle_name, last_name, status")
          .eq("id", user.id)
          .maybeSingle();

        if (userError) {
          throw userError;
        }

        // -----------------------------------------------------
        // LOAD COMPANY PROFILE
        // -----------------------------------------------------

        const { data: company, error: companyError } = await supabaseCompany
          .from("companies")
          .select(
            `
                id,
                user_id,
                company_name,
                company_email,
                company_phone,
                company_address,
                website,
                industry,
                designation,
                status
              `
          )
          .eq("user_id", user.id)
          .maybeSingle();

        if (companyError) {
          throw companyError;
        }

        if (!company) {
          throw new Error(
            "No company profile is associated with this account."
          );
        }

        if (!mounted) return;

        setProfile({
          companyName: company.company_name || "",
          supervisorName: getSupervisorName(userProfile),
          email: userProfile?.email || user.email || "",
          companyEmail: company.company_email || "",
          phone: company.company_phone || "",
          address: company.company_address || "",
          website: company.website || "",
          industry: company.industry || "",
          position: company.designation || "",
          status: company.status || userProfile?.status || "",
        });

        // -----------------------------------------------------
        // LOAD COMPANY LOGO
        // -----------------------------------------------------

        const storedLogoPath =
          user?.user_metadata?.company_logo_url ||
          user?.user_metadata?.companyLogoUrl ||
          "";

        setLogoPath(storedLogoPath);

        if (storedLogoPath) {
          const signedUrl = await getLogoUrl(storedLogoPath);

          if (mounted) {
            setLogoUrl(signedUrl || "");
          }
        }
      } catch (error) {
        console.error("Error loading company settings:", error);

        if (mounted) {
          setProfileMessage({
            type: "error",
            text: error?.message || "Unable to load company settings.",
          });
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadSettings();

    return () => {
      mounted = false;
    };
  }, []);

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

    setSavingProfile(true);

    setProfileMessage({
      type: "",
      text: "",
    });

    try {
      const {
        data: { user },
        error: authError,
      } = await supabaseCompany.auth.getUser();

      if (authError) {
        throw authError;
      }

      if (!user) {
        throw new Error("No authenticated company account found.");
      }

      const { error } = await supabaseCompany
        .from("companies")
        .update({
          company_name: profile.companyName.trim(),
          company_email: profile.companyEmail.trim(),
          company_phone: profile.phone.trim(),
          company_address: profile.address.trim(),
          website: profile.website.trim(),
          industry: profile.industry,
          designation: profile.position.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (error) {
        throw error;
      }

      setProfileMessage({
        type: "success",
        text: "Company profile settings saved successfully.",
      });

      setTimeout(() => {
        setProfileMessage({
          type: "",
          text: "",
        });
      }, 3000);
    } catch (error) {
      console.error("Error saving company profile:", error);

      setProfileMessage({
        type: "error",
        text: error?.message || "Unable to save company profile settings.",
      });
    } finally {
      setSavingProfile(false);
    }
  };

  // =========================================================
  // LOGO HANDLERS
  // =========================================================

  const handleLogoFileChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      setLogoFile(null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      setLogoMessage({
        type: "error",
        text: "Please select a valid image file.",
      });

      e.target.value = "";
      setLogoFile(null);
      return;
    }

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      setLogoMessage({
        type: "error",
        text: "Company logo must be 5 MB or smaller.",
      });

      e.target.value = "";
      setLogoFile(null);
      return;
    }

    setLogoFile(file);

    setLogoMessage({
      type: "",
      text: "",
    });
  };

  const handleUploadLogo = async () => {
    if (!logoFile) {
      setLogoMessage({
        type: "error",
        text: "Please select a company logo first.",
      });

      return;
    }

    setUploadingLogo(true);

    setLogoMessage({
      type: "",
      text: "",
    });

    try {
      const {
        data: { user },
        error: authError,
      } = await supabaseCompany.auth.getUser();

      if (authError) {
        throw authError;
      }

      if (!user) {
        throw new Error("No authenticated company account found.");
      }

      const extension = logoFile.name.split(".").pop()?.toLowerCase() || "png";

      const filePath = `${user.id}/company-logo-${Date.now()}.${extension}`;

      const { error: uploadError } = await supabaseCompany.storage
        .from(COMPANY_LOGO_BUCKET)
        .upload(filePath, logoFile, {
          cacheControl: "3600",
          upsert: false,
          contentType: logoFile.type,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { error: metadataError } = await supabaseCompany.auth.updateUser({
        data: {
          company_logo_url: filePath,
        },
      });

      if (metadataError) {
        // Clean up the uploaded file if metadata update fails.
        await supabaseCompany.storage
          .from(COMPANY_LOGO_BUCKET)
          .remove([filePath]);

        throw metadataError;
      }

      const signedUrl = await getLogoUrl(filePath);

      setLogoPath(filePath);
      setLogoUrl(signedUrl || "");
      setLogoFile(null);

      setLogoMessage({
        type: "success",
        text: "Company logo updated successfully.",
      });

      setTimeout(() => {
        setLogoMessage({
          type: "",
          text: "",
        });
      }, 3000);
    } catch (error) {
      console.error("Error uploading company logo:", error);

      setLogoMessage({
        type: "error",
        text: error?.message || "Unable to update company logo.",
      });
    } finally {
      setUploadingLogo(false);
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

  const handleChangePassword = async (e) => {
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

    try {
      const {
        data: { user },
        error: authError,
      } = await supabaseCompany.auth.getUser();

      if (authError) {
        throw authError;
      }

      if (!user?.email) {
        throw new Error("Unable to determine the current account email.");
      }

      // -----------------------------------------------------
      // VERIFY CURRENT PASSWORD
      // -----------------------------------------------------

      const { error: verificationError } =
        await supabaseCompany.auth.signInWithPassword({
          email: user.email,
          password: current,
        });

      if (verificationError) {
        throw new Error("Current password is incorrect.");
      }

      // -----------------------------------------------------
      // UPDATE PASSWORD
      // -----------------------------------------------------

      const { error: updateError } = await supabaseCompany.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        throw updateError;
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
    } catch (error) {
      console.error("Error changing password:", error);

      setPasswordMessage({
        type: "error",
        text: error?.message || "Unable to change password.",
      });
    }
  };

  // =========================================================
  // SIGN OUT OTHER SESSIONS
  // =========================================================

  const handleSignOutOtherSessions = async () => {
    setSecurityMessage("");

    try {
      const { error } = await supabaseCompany.auth.signOut({
        scope: "others",
      });

      if (error) {
        throw error;
      }

      setSecurityMessage(
        "Other active sessions have been signed out successfully."
      );

      setTimeout(() => {
        setSecurityMessage("");
      }, 3000);
    } catch (error) {
      console.error("Error signing out other sessions:", error);

      setSecurityMessage(
        error?.message || "Unable to sign out other sessions."
      );
    }
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
  // LOADING STATE
  // =========================================================

  if (loading) {
    return (
      <div className="w-full min-h-full p-3 sm:p-5 md:p-6 lg:p-8">
        <div className="max-w-[1400px] mx-auto">
          <div className="mb-5 sm:mb-6">
            <p
              className={`text-[10px] sm:text-xs uppercase tracking-widest font-bold mb-1 ${
                darkMode ? "text-slate-500" : "text-slate-400"
              }`}
            >
              Company Portal
            </p>

            <h1 className={`text-xl sm:text-2xl font-black ${pageTitleClass}`}>
              Account Settings
            </h1>

            <p className={`text-xs sm:text-sm mt-1 ${bodyTextClass}`}>
              Loading your company settings...
            </p>
          </div>

          <div
            className={`
              max-w-[1000px]
              border
              rounded-xl
              shadow-sm
              p-8
              ${panelClass}
            `}
          >
            <div
              className={`animate-pulse h-4 w-48 rounded ${
                darkMode ? "bg-slate-700" : "bg-slate-200"
              }`}
            />
          </div>
        </div>
      </div>
    );
  }

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
            Company Portal
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
            Manage your company information, notifications, and account
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
                  Company Settings
                </h2>

                <p
                  className={`
                    text-[11px]
                    sm:text-xs
                    mt-1
                    ${bodyTextClass}
                  `}
                >
                  Update your company information and supervisor account
                  details.
                </p>
              </div>

              <form onSubmit={handleSaveProfile} className="max-w-[700px]">
                <div className="space-y-4">
                  {/* COMPANY LOGO */}

                  <div
                    className="
                      grid
                      grid-cols-1
                      sm:grid-cols-[140px_minmax(0,1fr)]
                      gap-1.5
                      sm:gap-4
                      sm:items-start
                    "
                  >
                    <label
                      className={`
                        text-xs
                        font-semibold
                        sm:pt-2
                        ${labelClass}
                      `}
                    >
                      Company Logo
                    </label>

                    <div className="space-y-3">
                      <div className="flex items-center gap-4">
                        <div
                          className={`
                            w-20
                            h-20
                            rounded-xl
                            border
                            overflow-hidden
                            flex
                            items-center
                            justify-center
                            flex-shrink-0
                            ${
                              darkMode
                                ? "bg-slate-900 border-slate-700"
                                : "bg-slate-50 border-slate-200"
                            }
                          `}
                        >
                          {logoUrl ? (
                            <img
                              src={logoUrl}
                              alt="Company logo"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span
                              className={`
                                text-2xl
                                font-black
                                ${
                                  darkMode ? "text-slate-500" : "text-slate-400"
                                }
                              `}
                            >
                              {profile.companyName
                                ?.trim()
                                ?.charAt(0)
                                ?.toUpperCase() || "C"}
                            </span>
                          )}
                        </div>

                        <div className="min-w-0">
                          <p
                            className={`
                              text-sm
                              font-semibold
                              ${darkMode ? "text-slate-200" : "text-slate-800"}
                            `}
                          >
                            Upload company logo
                          </p>

                          <p
                            className={`
                              text-[10px]
                              sm:text-xs
                              mt-1
                              ${bodyTextClass}
                            `}
                          >
                            PNG, JPG, JPEG, or other image formats up to 5 MB.
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <label
                          className="
                            inline-flex
                            items-center
                            px-4
                            py-2.5
                            rounded-lg
                            border
                            border-slate-300
                            text-xs
                            font-bold
                            cursor-pointer
                            transition
                            hover:bg-slate-100
                          "
                        >
                          Choose Image
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoFileChange}
                            className="hidden"
                          />
                        </label>

                        {logoFile && (
                          <button
                            type="button"
                            onClick={handleUploadLogo}
                            disabled={uploadingLogo}
                            className="
                              px-4
                              py-2.5
                              rounded-lg
                              bg-purple-600
                              text-white
                              text-xs
                              font-bold
                              hover:bg-purple-700
                              disabled:opacity-60
                              disabled:cursor-not-allowed
                              transition
                            "
                          >
                            {uploadingLogo ? "Uploading..." : "Upload Logo"}
                          </button>
                        )}
                      </div>

                      {logoFile && (
                        <p
                          className={`
                            text-[10px]
                            sm:text-xs
                            ${bodyTextClass}
                          `}
                        >
                          Selected: {logoFile.name}
                        </p>
                      )}

                      {logoMessage.text && (
                        <div
                          className={`
                            px-4
                            py-3
                            rounded-lg
                            border
                            text-xs
                            font-medium
                            ${
                              logoMessage.type === "success"
                                ? darkMode
                                  ? "bg-emerald-950/40 text-emerald-300 border-emerald-800"
                                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : darkMode
                                ? "bg-red-950/40 text-red-300 border-red-800"
                                : "bg-red-50 text-red-700 border-red-200"
                            }
                          `}
                        >
                          {logoMessage.text}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* COMPANY NAME */}

                  <div
                    className="
                      grid
                      grid-cols-1
                      sm:grid-cols-[140px_minmax(0,1fr)]
                      gap-1.5
                      sm:gap-4
                      sm:items-center
                    "
                  >
                    <label className={`text-xs font-semibold ${labelClass}`}>
                      Company Name
                    </label>

                    <input
                      type="text"
                      value={profile.companyName}
                      onChange={(e) =>
                        handleProfileChange("companyName", e.target.value)
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

                  {/* SUPERVISOR NAME */}

                  <div
                    className="
                      grid
                      grid-cols-1
                      sm:grid-cols-[140px_minmax(0,1fr)]
                      gap-1.5
                      sm:gap-4
                      sm:items-center
                    "
                  >
                    <label className={`text-xs font-semibold ${labelClass}`}>
                      Supervisor Name
                    </label>

                    <input
                      type="text"
                      value={profile.supervisorName}
                      readOnly
                      className={`
                        w-full
                        h-10
                        px-3
                        rounded-lg
                        border
                        text-sm
                        outline-none
                        ${
                          darkMode
                            ? "bg-slate-900/60 border-slate-700 text-slate-400"
                            : "bg-slate-100 border-slate-300 text-slate-500"
                        }
                      `}
                    />

                    <p
                      className={`
                        sm:col-start-2
                        text-[10px]
                        -mt-1
                        ${bodyTextClass}
                      `}
                    >
                      Your supervisor name is managed through your account
                      profile.
                    </p>
                  </div>

                  {/* ACCOUNT EMAIL */}

                  <div
                    className="
                      grid
                      grid-cols-1
                      sm:grid-cols-[140px_minmax(0,1fr)]
                      gap-1.5
                      sm:gap-4
                      sm:items-center
                    "
                  >
                    <label className={`text-xs font-semibold ${labelClass}`}>
                      Account Email
                    </label>

                    <input
                      type="email"
                      value={profile.email}
                      readOnly
                      className={`
                        w-full
                        h-10
                        px-3
                        rounded-lg
                        border
                        text-sm
                        outline-none
                        ${
                          darkMode
                            ? "bg-slate-900/60 border-slate-700 text-slate-400"
                            : "bg-slate-100 border-slate-300 text-slate-500"
                        }
                      `}
                    />
                  </div>

                  {/* COMPANY EMAIL */}

                  <div
                    className="
                      grid
                      grid-cols-1
                      sm:grid-cols-[140px_minmax(0,1fr)]
                      gap-1.5
                      sm:gap-4
                      sm:items-center
                    "
                  >
                    <label className={`text-xs font-semibold ${labelClass}`}>
                      Company Email
                    </label>

                    <input
                      type="email"
                      value={profile.companyEmail}
                      onChange={(e) =>
                        handleProfileChange("companyEmail", e.target.value)
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

                  <div
                    className="
                      grid
                      grid-cols-1
                      sm:grid-cols-[140px_minmax(0,1fr)]
                      gap-1.5
                      sm:gap-4
                      sm:items-center
                    "
                  >
                    <label className={`text-xs font-semibold ${labelClass}`}>
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

                  {/* ADDRESS */}

                  <div
                    className="
                      grid
                      grid-cols-1
                      sm:grid-cols-[140px_minmax(0,1fr)]
                      gap-1.5
                      sm:gap-4
                      sm:items-start
                    "
                  >
                    <label
                      className={`text-xs font-semibold sm:pt-2 ${labelClass}`}
                    >
                      Address
                    </label>

                    <textarea
                      value={profile.address}
                      onChange={(e) =>
                        handleProfileChange("address", e.target.value)
                      }
                      rows={3}
                      className={`
                        w-full
                        px-3
                        py-2.5
                        rounded-lg
                        border
                        text-sm
                        outline-none
                        transition
                        resize-y
                        ${inputClass}
                      `}
                    />
                  </div>

                  {/* WEBSITE */}

                  <div
                    className="
                      grid
                      grid-cols-1
                      sm:grid-cols-[140px_minmax(0,1fr)]
                      gap-1.5
                      sm:gap-4
                      sm:items-center
                    "
                  >
                    <label className={`text-xs font-semibold ${labelClass}`}>
                      Website
                    </label>

                    <input
                      type="url"
                      value={profile.website}
                      onChange={(e) =>
                        handleProfileChange("website", e.target.value)
                      }
                      placeholder="https://example.com"
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

                  {/* INDUSTRY */}

                  <div
                    className="
                      grid
                      grid-cols-1
                      sm:grid-cols-[140px_minmax(0,1fr)]
                      gap-1.5
                      sm:gap-4
                      sm:items-center
                    "
                  >
                    <label className={`text-xs font-semibold ${labelClass}`}>
                      Industry
                    </label>

                    <select
                      value={profile.industry}
                      onChange={(e) =>
                        handleProfileChange("industry", e.target.value)
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
                    >
                      <option value="">Select industry</option>

                      {INDUSTRIES.map((industry) => (
                        <option key={industry} value={industry}>
                          {industry}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* DESIGNATION */}

                  <div
                    className="
                      grid
                      grid-cols-1
                      sm:grid-cols-[140px_minmax(0,1fr)]
                      gap-1.5
                      sm:gap-4
                      sm:items-center
                    "
                  >
                    <label className={`text-xs font-semibold ${labelClass}`}>
                      Designation
                    </label>

                    <input
                      type="text"
                      value={profile.position}
                      onChange={(e) =>
                        handleProfileChange("position", e.target.value)
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

                  {/* STATUS */}

                  <div
                    className="
                      grid
                      grid-cols-1
                      sm:grid-cols-[140px_minmax(0,1fr)]
                      gap-1.5
                      sm:gap-4
                      sm:items-center
                    "
                  >
                    <label className={`text-xs font-semibold ${labelClass}`}>
                      Account Status
                    </label>

                    <input
                      type="text"
                      value={profile.status || "Active"}
                      readOnly
                      className={`
                        w-full
                        h-10
                        px-3
                        rounded-lg
                        border
                        text-sm
                        outline-none
                        ${
                          darkMode
                            ? "bg-slate-900/60 border-slate-700 text-slate-400"
                            : "bg-slate-100 border-slate-300 text-slate-500"
                        }
                      `}
                    />
                  </div>
                </div>

                {/* PROFILE MESSAGE */}

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
                  disabled={savingProfile}
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
                  {savingProfile ? "Saving..." : "Save Changes"}
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
                  Choose which company internship notifications you want to
                  receive.
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
                {/* APPLICATION UPDATES */}

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
                      Application Updates
                    </p>

                    <p
                      className={`
                        text-[10px]
                        sm:text-xs
                        mt-1
                        ${bodyTextClass}
                      `}
                    >
                      Receive updates when students submit or update internship
                      applications.
                    </p>
                  </div>

                  <NotificationSwitch
                    enabled={notifications.applicationUpdates}
                    onClick={() => toggleNotification("applicationUpdates")}
                    label="application updates"
                  />
                </div>

                {/* DOCUMENT UPDATES */}

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
                      Document Updates
                    </p>

                    <p
                      className={`
                        text-[10px]
                        sm:text-xs
                        mt-1
                        ${bodyTextClass}
                      `}
                    >
                      Get notified when interns submit required documents.
                    </p>
                  </div>

                  <NotificationSwitch
                    enabled={notifications.documentUpdates}
                    onClick={() => toggleNotification("documentUpdates")}
                    label="document updates"
                  />
                </div>

                {/* EVALUATION REMINDERS */}

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
                      Evaluation Reminders
                    </p>

                    <p
                      className={`
                        text-[10px]
                        sm:text-xs
                        mt-1
                        ${bodyTextClass}
                      `}
                    >
                      Receive reminders when intern evaluations are due.
                    </p>
                  </div>

                  <NotificationSwitch
                    enabled={notifications.evaluationReminders}
                    onClick={() => toggleNotification("evaluationReminders")}
                    label="evaluation reminders"
                  />
                </div>

                {/* MESSAGES */}

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
                      Messages
                    </p>

                    <p
                      className={`
                        text-[10px]
                        sm:text-xs
                        mt-1
                        ${bodyTextClass}
                      `}
                    >
                      Receive notifications when you receive new messages.
                    </p>
                  </div>

                  <NotificationSwitch
                    enabled={notifications.messages}
                    onClick={() => toggleNotification("messages")}
                    label="messages"
                  />
                </div>

                {/* SYSTEM UPDATES */}

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
                      Receive updates about system maintenance and portal
                      activity.
                    </p>
                  </div>

                  <NotificationSwitch
                    enabled={notifications.systemUpdates}
                    onClick={() => toggleNotification("systemUpdates")}
                    label="system updates"
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
                  Manage your company supervisor account security.
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
                      Update your company supervisor account password.
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

                      {/* ACTIONS */}

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

                            setPasswords({
                              current: "",
                              newPassword: "",
                              confirmPassword: "",
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

                {/* SIGN OUT OTHER SESSIONS */}

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
                      Active Sessions
                    </p>

                    <p
                      className={`
                        text-[10px]
                        sm:text-xs
                        mt-1
                        ${bodyTextClass}
                      `}
                    >
                      Sign out your company account from other active devices.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleSignOutOtherSessions}
                    className="
                      px-5
                      py-2.5
                      rounded-lg
                      border
                      border-red-300
                      text-red-600
                      text-xs
                      font-bold
                      hover:bg-red-50
                      transition
                    "
                  >
                    Sign Out Other Sessions
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
                      font-medium
                      ${
                        securityMessage.toLowerCase().includes("successfully")
                          ? darkMode
                            ? "bg-emerald-950/40 text-emerald-300 border-emerald-800"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : darkMode
                          ? "bg-red-950/40 text-red-300 border-red-800"
                          : "bg-red-50 text-red-700 border-red-200"
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
