import React, { useEffect, useRef, useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { supabaseCompany } from "../../supabaseClient";
import { INDUSTRIES } from "../../constants/industries";

// =========================================================
// STORAGE
// =========================================================
//
// IMPORTANT:
// - Company logo is stored separately from company documents.
// - The companies table does NOT contain company_logo_url.
// - Company logo path is stored in auth.user_metadata.
//
// If your existing company registration documents are stored
// in another bucket, change ONLY this constant.
// =========================================================

const COMPANY_LOGO_BUCKET = "company-logos";
const VERIFICATION_DOCUMENTS_BUCKET = "verification-documents";

// =========================================================
// EMPTY COMPANY
// =========================================================

const EMPTY_COMPANY = {
  id: null,
  userId: null,

  companyName: "",
  companyEmail: "",
  companyPhone: "",
  companyAddress: "",

  website: "",
  industry: "",
  designation: "",

  businessRegistrationUrl: null,
  birRegistrationUrl: null,
  supportingDocumentUrl: null,

  companyLogoUrl: null,

  status: "pending",
};

// =========================================================
// PROFILE
// =========================================================

const Profile = () => {
  const { darkMode } = useOutletContext();
  const navigateTo = useNavigate();

  const [companyDetails, setCompanyDetails] = useState(EMPTY_COMPANY);
  const [draftDetails, setDraftDetails] = useState(EMPTY_COMPANY);

  const [editDetails, setEditDetails] = useState(false);

  const [loading, setLoading] = useState(true);
  const [savingDetails, setSavingDetails] = useState(false);
  const [savingLogo, setSavingLogo] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [companyLogo, setCompanyLogo] = useState(null);

  const [selectedLogoFile, setSelectedLogoFile] = useState(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState(null);

  const fileInputRef = useRef(null);

  // =========================================================
  // THEME
  // =========================================================

  const pageText = darkMode ? "text-slate-100" : "text-slate-900";

  const mutedText = darkMode ? "text-slate-400" : "text-slate-500";

  const cardClass = darkMode
    ? "bg-slate-900 border-slate-700"
    : "bg-white border-slate-200";

  const inputClass = darkMode
    ? "bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-purple-500"
    : "bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-purple-400";

  const readOnlyClass = darkMode
    ? "bg-slate-800/60 border-slate-700 text-slate-400"
    : "bg-slate-100 border-slate-200 text-slate-500";

  // =========================================================
  // HELPERS
  // =========================================================

  const mapCompany = (data, user = null) => ({
    id: data?.id || null,

    userId: data?.user_id || user?.id || null,

    companyName: data?.company_name || "",
    companyEmail: data?.company_email || "",
    companyPhone: data?.company_phone || "",
    companyAddress: data?.company_address || "",

    website: data?.website || "",
    industry: data?.industry || "",
    designation: data?.designation || "",

    businessRegistrationUrl: data?.business_registration_url || null,

    birRegistrationUrl: data?.bir_registration_url || null,

    supportingDocumentUrl: data?.supporting_document_url || null,

    // companies table does NOT contain company_logo_url.
    // Logo is stored in auth user metadata.
    companyLogoUrl:
      user?.user_metadata?.company_logo_url ||
      user?.user_metadata?.companyLogoUrl ||
      null,

    status: data?.status || "pending",
  });

  const getCompanyInitials = (name) => {
    const words = name?.trim().split(/\s+/).filter(Boolean) || [];

    if (!words.length) {
      return "CO";
    }

    if (words.length === 1) {
      return words[0].slice(0, 2).toUpperCase();
    }

    return words
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  };

  const formatStatus = (status) => {
    if (!status) {
      return "Unknown";
    }

    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getStatusClasses = (status) => {
    switch (status) {
      case "active":
        return darkMode
          ? "bg-emerald-950 text-emerald-300 border-emerald-900"
          : "bg-emerald-50 text-emerald-700 border-emerald-200";

      case "pending":
        return darkMode
          ? "bg-amber-950 text-amber-300 border-amber-900"
          : "bg-amber-50 text-amber-700 border-amber-200";

      case "rejected":
        return darkMode
          ? "bg-red-950 text-red-300 border-red-900"
          : "bg-red-50 text-red-700 border-red-200";

      case "suspended":
        return darkMode
          ? "bg-orange-950 text-orange-300 border-orange-900"
          : "bg-orange-50 text-orange-700 border-orange-200";

      default:
        return darkMode
          ? "bg-slate-800 text-slate-300 border-slate-700"
          : "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  // =========================================================
  // CHECK IF VALUE IS A COMPLETE URL
  // =========================================================

  const isFullUrl = (value) => {
    return /^https?:\/\//i.test(value || "");
  };

  // =========================================================
  // COMPANY LOGO URL
  // =========================================================

  const getCompanyLogoUrl = async (path) => {
    if (!path) {
      return null;
    }

    // If auth metadata already contains a complete URL,
    // use it directly.
    if (isFullUrl(path)) {
      return path;
    }

    try {
      const { data, error: urlError } = await supabaseCompany.storage
        .from(COMPANY_LOGO_BUCKET)
        .createSignedUrl(path, 60 * 60);

      if (urlError) {
        console.warn("Unable to create company logo URL:", urlError);

        return null;
      }

      return data?.signedUrl || null;
    } catch (err) {
      console.warn("Unable to resolve company logo:", err);

      return null;
    }
  };

  // =========================================================
  // BUSINESS DOCUMENT URL
  // =========================================================
  //
  // Handles:
  //
  // 1. Complete URL
  // 2. Supabase Storage path
  //
  // IMPORTANT:
  // A missing bucket must NOT prevent the company profile
  // itself from loading.
  // =========================================================

  const getBusinessDocumentUrl = async (path) => {
    if (!path) {
      return null;
    }

    // -------------------------------------------------------
    // COMPLETE URL
    // -------------------------------------------------------
    //
    // If the database already contains:
    //
    // https://....supabase.co/storage/v1/object/...
    //
    // there is no reason to call Storage again.
    //

    if (isFullUrl(path)) {
      return path;
    }

    // -------------------------------------------------------
    // STORAGE PATH
    // -------------------------------------------------------

    try {
      const { data, error: urlError } = await supabaseCompany.storage
        .from(VERIFICATION_DOCUMENTS_BUCKET)
        .createSignedUrl(path, 60 * 60);

      if (urlError) {
        console.warn(
          `Unable to load business document from bucket "${VERIFICATION_DOCUMENTS_BUCKET}":`,
          urlError
        );

        return null;
      }

      return data?.signedUrl || null;
    } catch (err) {
      console.warn("Unable to resolve business document:", err);

      return null;
    }
  };

  // =========================================================
  // LOAD COMPANY
  // =========================================================

  const loadCompany = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      // -------------------------------------------------------
      // AUTH USER
      // -------------------------------------------------------

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

      // -------------------------------------------------------
      // COMPANY DATABASE RECORD
      // -------------------------------------------------------

      const { data, error: companyError } = await supabaseCompany
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
            business_registration_url,
            bir_registration_url,
            supporting_document_url,
            status
          `
        )
        .eq("user_id", user.id)
        .maybeSingle();

      if (companyError) {
        throw companyError;
      }

      if (!data) {
        throw new Error("Company profile not found.");
      }

      // -------------------------------------------------------
      // MAP DATABASE RECORD
      // -------------------------------------------------------

      const mapped = mapCompany(data, user);

      // -------------------------------------------------------
      // RESOLVE STORAGE URLS
      // -------------------------------------------------------
      //
      // These operations are intentionally independent.
      // If one document fails, the other documents can still
      // load.
      // -------------------------------------------------------

      const logoUrl = await getCompanyLogoUrl(mapped.companyLogoUrl);

      const businessRegistrationUrl = await getBusinessDocumentUrl(
        mapped.businessRegistrationUrl
      );

      const birRegistrationUrl = await getBusinessDocumentUrl(
        mapped.birRegistrationUrl
      );

      const supportingDocumentUrl = await getBusinessDocumentUrl(
        mapped.supportingDocumentUrl
      );

      // -------------------------------------------------------
      // DISPLAY COMPANY
      // -------------------------------------------------------
      //
      // For display:
      // - use resolved URL when available
      // - otherwise use null
      //
      // We do NOT put an unusable Storage path into the <a>
      // href because that would create a broken link.
      // -------------------------------------------------------

      const displayCompany = {
        ...mapped,

        companyLogoUrl: logoUrl || null,

        businessRegistrationUrl: businessRegistrationUrl || null,

        birRegistrationUrl: birRegistrationUrl || null,

        supportingDocumentUrl: supportingDocumentUrl || null,
      };

      setCompanyDetails(displayCompany);
      setDraftDetails(displayCompany);

      setCompanyLogo(logoUrl);

      // -------------------------------------------------------
      // CLEANUP PREVIOUS LOGO PREVIEW
      // -------------------------------------------------------

      if (logoPreviewUrl) {
        URL.revokeObjectURL(logoPreviewUrl);
      }

      setLogoPreviewUrl(null);
      setSelectedLogoFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      console.error("Error loading company profile:", err);

      setError(err.message || "Failed to load company profile.");
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    loadCompany();

    return () => {
      if (logoPreviewUrl) {
        URL.revokeObjectURL(logoPreviewUrl);
      }
    };
  }, []);

  // =========================================================
  // EDIT DETAILS
  // =========================================================

  const handleEditDetails = () => {
    setDraftDetails(companyDetails);

    setError("");
    setSuccess("");

    setEditDetails(true);
  };

  const handleCancelEdit = () => {
    setDraftDetails(companyDetails);

    setEditDetails(false);

    setError("");
  };

  const handleDetailsChange = (field, value) => {
    setDraftDetails((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // =========================================================
  // SAVE DETAILS
  // =========================================================

  const handleSaveDetails = async () => {
    if (!companyDetails.id) {
      return;
    }

    const requiredFields = [
      ["companyName", "Company name"],
      ["companyEmail", "Company email"],
      ["companyPhone", "Company phone"],
      ["companyAddress", "Company address"],
      ["industry", "Industry"],
      ["designation", "Designation"],
    ];

    for (const [field, label] of requiredFields) {
      if (!draftDetails[field]?.trim()) {
        setError(`${label} is required.`);
        return;
      }
    }

    try {
      setSavingDetails(true);

      setError("");
      setSuccess("");

      const { data, error: updateError } = await supabaseCompany
        .from("companies")
        .update({
          company_name: draftDetails.companyName.trim(),

          company_email: draftDetails.companyEmail.trim(),

          company_phone: draftDetails.companyPhone.trim(),

          company_address: draftDetails.companyAddress.trim(),

          website: draftDetails.website?.trim() || null,

          industry: draftDetails.industry.trim(),

          designation: draftDetails.designation.trim(),

          updated_at: new Date().toISOString(),
        })
        .eq("id", companyDetails.id)
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
            business_registration_url,
            bir_registration_url,
            supporting_document_url,
            status
          `
        )
        .single();

      if (updateError) {
        throw updateError;
      }

      // -------------------------------------------------------
      // GET AUTH USER AGAIN
      // -------------------------------------------------------

      const {
        data: { user },
      } = await supabaseCompany.auth.getUser();

      const updated = mapCompany(data, user);

      setCompanyDetails((prev) => ({
        ...updated,

        companyLogoUrl: prev.companyLogoUrl,

        businessRegistrationUrl: prev.businessRegistrationUrl,

        birRegistrationUrl: prev.birRegistrationUrl,

        supportingDocumentUrl: prev.supportingDocumentUrl,
      }));

      setDraftDetails((prev) => ({
        ...updated,

        companyLogoUrl: prev.companyLogoUrl,

        businessRegistrationUrl: prev.businessRegistrationUrl,

        birRegistrationUrl: prev.birRegistrationUrl,

        supportingDocumentUrl: prev.supportingDocumentUrl,
      }));

      setEditDetails(false);

      setSuccess("Company details updated successfully.");
    } catch (err) {
      console.error("Error updating company:", err);

      setError(err.message || "Failed to update company details.");
    } finally {
      setSavingDetails(false);
    }
  };

  // =========================================================
  // LOGO FILE PICKER
  // =========================================================

  const handleLogoClick = () => {
    fileInputRef.current?.click();
  };

  const handleLogoChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");

      event.target.value = "";

      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Company logo must be 5 MB or smaller.");

      event.target.value = "";

      return;
    }

    if (logoPreviewUrl) {
      URL.revokeObjectURL(logoPreviewUrl);
    }

    const preview = URL.createObjectURL(file);

    setSelectedLogoFile(file);
    setLogoPreviewUrl(preview);

    setError("");
    setSuccess("");
  };

  // =========================================================
  // CANCEL LOGO
  // =========================================================

  const handleCancelLogo = () => {
    if (logoPreviewUrl) {
      URL.revokeObjectURL(logoPreviewUrl);
    }

    setLogoPreviewUrl(null);
    setSelectedLogoFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // =========================================================
  // SAVE LOGO
  // =========================================================

  const handleSaveLogo = async () => {
    if (!selectedLogoFile || !companyDetails.id || !companyDetails.userId) {
      return;
    }

    try {
      setSavingLogo(true);

      setError("");
      setSuccess("");

      // -------------------------------------------------------
      // AUTH USER
      // -------------------------------------------------------

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

      // -------------------------------------------------------
      // FILE EXTENSION
      // -------------------------------------------------------

      const extension =
        selectedLogoFile.name.split(".").pop()?.toLowerCase() || "png";

      // -------------------------------------------------------
      // FILE PATH
      // -------------------------------------------------------

      const filePath = `${
        companyDetails.userId
      }/company-logo-${Date.now()}.${extension}`;

      // -------------------------------------------------------
      // UPLOAD
      // -------------------------------------------------------

      const { error: uploadError } = await supabaseCompany.storage
        .from(COMPANY_LOGO_BUCKET)
        .upload(filePath, selectedLogoFile, {
          cacheControl: "3600",
          upsert: false,
          contentType: selectedLogoFile.type,
        });

      if (uploadError) {
        throw uploadError;
      }

      // -------------------------------------------------------
      // OLD LOGO
      // -------------------------------------------------------

      const oldLogoPath =
        user.user_metadata?.company_logo_url ||
        user.user_metadata?.companyLogoUrl ||
        null;

      // -------------------------------------------------------
      // SAVE PATH TO AUTH METADATA
      // -------------------------------------------------------

      const { error: metadataError } = await supabaseCompany.auth.updateUser({
        data: {
          company_logo_url: filePath,
        },
      });

      if (metadataError) {
        // Roll back upload if metadata update failed.
        await supabaseCompany.storage
          .from(COMPANY_LOGO_BUCKET)
          .remove([filePath]);

        throw metadataError;
      }

      // -------------------------------------------------------
      // DELETE OLD LOGO
      // -------------------------------------------------------

      if (oldLogoPath && !isFullUrl(oldLogoPath) && oldLogoPath !== filePath) {
        const { error: removeError } = await supabaseCompany.storage
          .from(COMPANY_LOGO_BUCKET)
          .remove([oldLogoPath]);

        if (removeError) {
          console.warn("Could not remove old company logo:", removeError);
        }
      }

      // -------------------------------------------------------
      // NEW SIGNED URL
      // -------------------------------------------------------

      const newLogoUrl = await getCompanyLogoUrl(filePath);

      // -------------------------------------------------------
      // UPDATE STATE
      // -------------------------------------------------------

      setCompanyDetails((prev) => ({
        ...prev,

        companyLogoUrl: newLogoUrl || null,
      }));

      setDraftDetails((prev) => ({
        ...prev,

        companyLogoUrl: newLogoUrl || null,
      }));

      setCompanyLogo(newLogoUrl || null);

      handleCancelLogo();

      setSuccess("Company logo updated successfully.");
    } catch (err) {
      console.error("Error uploading company logo:", err);

      setError(err.message || "Failed to upload company logo.");
    } finally {
      setSavingLogo(false);
    }
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className={`p-5 md:p-6 lg:p-8 ${pageText}`}>
        <div className="min-h-[500px] flex items-center justify-center">
          <div className="text-center">
            <div
              className={`w-10 h-10 rounded-full border-4 animate-spin mx-auto mb-4 ${
                darkMode
                  ? "border-slate-700 border-t-purple-500"
                  : "border-slate-200 border-t-purple-600"
              }`}
            />

            <p className={`text-sm ${mutedText}`}>Loading company profile...</p>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // DISPLAY VALUES
  // =========================================================

  const displayedLogo = logoPreviewUrl || companyLogo;

  const initials = getCompanyInitials(companyDetails.companyName);

  // =========================================================
  // RETURN
  // =========================================================

  return (
    <div className={`p-5 md:p-6 lg:p-8 max-w-[1400px] mx-auto ${pageText}`}>
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="mb-6">
        <p className="text-xs uppercase tracking-widest font-bold mb-1 text-purple-500">
          Company Portal
        </p>

        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">
              Company Profile
            </h1>

            <p className={`text-sm mt-1 ${mutedText}`}>
              Manage your company's information, logo, and business details.
            </p>
          </div>

          <button
            type="button"
            onClick={loadCompany}
            className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition ${
              darkMode
                ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                : "border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* =====================================================
          FEEDBACK
      ===================================================== */}

      {error && (
        <div
          className={`mb-6 p-4 rounded-xl border ${
            darkMode
              ? "bg-red-950/30 border-red-900 text-red-300"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          <p className="text-xs font-bold">Unable to complete request</p>

          <p className="text-xs mt-1">{error}</p>
        </div>
      )}

      {success && (
        <div
          className={`mb-6 p-4 rounded-xl border ${
            darkMode
              ? "bg-emerald-950/30 border-emerald-900 text-emerald-300"
              : "bg-emerald-50 border-emerald-200 text-emerald-700"
          }`}
        >
          <p className="text-xs font-bold">✓ {success}</p>
        </div>
      )}

      {/* =====================================================
          COMPANY HERO
      ===================================================== */}

      <section className={`border rounded-2xl p-5 md:p-7 ${cardClass}`}>
        <div className="flex flex-col lg:flex-row gap-7 lg:items-center">
          {/* =================================================
              COMPANY LOGO
          ================================================= */}

          <div className="flex-shrink-0 flex flex-col items-center lg:items-start">
            <div
              className={`w-40 h-40 md:w-48 md:h-48 rounded-2xl border-2 overflow-hidden flex items-center justify-center ${
                darkMode
                  ? "bg-slate-800 border-slate-700"
                  : "bg-slate-50 border-slate-200"
              }`}
            >
              {displayedLogo ? (
                <img
                  src={displayedLogo}
                  alt={`${companyDetails.companyName} logo`}
                  className="w-full h-full object-contain p-3"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";

                    const fallback =
                      event.currentTarget.parentElement?.querySelector(
                        "[data-logo-fallback]"
                      );

                    if (fallback) {
                      fallback.classList.remove("hidden");
                    }
                  }}
                />
              ) : null}

              <div
                data-logo-fallback
                className={`${displayedLogo ? "hidden" : ""} text-center px-4`}
              >
                <div
                  className={`w-20 h-20 mx-auto rounded-2xl flex items-center justify-center text-2xl font-black ${
                    darkMode
                      ? "bg-purple-950 text-purple-300"
                      : "bg-purple-50 text-purple-600"
                  }`}
                >
                  {initials}
                </div>

                <p className={`text-[10px] mt-3 ${mutedText}`}>Company Logo</p>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleLogoChange}
              className="hidden"
            />

            {!selectedLogoFile ? (
              <button
                type="button"
                onClick={handleLogoClick}
                className="mt-4 w-40 md:w-48 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition"
              >
                {companyLogo ? "Change Logo" : "Upload Logo"}
              </button>
            ) : (
              <div className="mt-4 w-40 md:w-48 space-y-2">
                <button
                  type="button"
                  onClick={handleSaveLogo}
                  disabled={savingLogo}
                  className="w-full px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold transition"
                >
                  {savingLogo ? "Saving..." : "Save Logo"}
                </button>

                <button
                  type="button"
                  onClick={handleCancelLogo}
                  disabled={savingLogo}
                  className={`w-full px-4 py-2.5 rounded-xl text-xs font-bold transition ${
                    darkMode
                      ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Cancel
                </button>
              </div>
            )}

            <p
              className={`text-[10px] text-center lg:text-left mt-2 ${mutedText}`}
            >
              PNG, JPG, or WEBP · Max 5 MB
            </p>
          </div>

          {/* =================================================
              COMPANY SUMMARY
          ================================================= */}

          <div className="min-w-0 flex-1">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-2xl md:text-3xl font-black break-words">
                  {companyDetails.companyName || "Company"}
                </h2>

                <p className={`text-sm mt-1 ${mutedText}`}>
                  {companyDetails.industry || "Industry not specified"}
                </p>

                <p className={`text-xs mt-2 ${mutedText}`}>
                  {companyDetails.designation || "Designation not specified"}
                </p>
              </div>

              <span
                className={`inline-flex w-fit px-3 py-1.5 rounded-full border text-[10px] font-bold ${getStatusClasses(
                  companyDetails.status
                )}`}
              >
                ● {formatStatus(companyDetails.status)}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
              <MiniInfo
                label="Company Email"
                value={companyDetails.companyEmail}
                darkMode={darkMode}
              />

              <MiniInfo
                label="Company Phone"
                value={companyDetails.companyPhone}
                darkMode={darkMode}
              />

              <MiniInfo
                label="Website"
                value={companyDetails.website || "Not provided"}
                darkMode={darkMode}
              />

              <MiniInfo
                label="Address"
                value={companyDetails.companyAddress}
                darkMode={darkMode}
              />
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          COMPANY INFORMATION
      ===================================================== */}

      <section className={`mt-6 border rounded-2xl p-5 md:p-6 ${cardClass}`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h2 className="text-lg font-black">Company Information</h2>

            <p className={`text-xs mt-1 ${mutedText}`}>
              Keep your registered company information up to date.
            </p>
          </div>

          {!editDetails && (
            <button
              type="button"
              onClick={handleEditDetails}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition"
            >
              Edit Details
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <ProfileField
            label="Company Name"
            value={
              editDetails
                ? draftDetails.companyName
                : companyDetails.companyName
            }
            editable={editDetails}
            onChange={(value) => handleDetailsChange("companyName", value)}
            darkMode={darkMode}
            inputClass={inputClass}
            readOnlyClass={readOnlyClass}
          />

          <ProfileField
            label="Industry"
            type="select"
            value={
              editDetails ? draftDetails.industry : companyDetails.industry
            }
            editable={editDetails}
            onChange={(value) => handleDetailsChange("industry", value)}
            options={INDUSTRIES}
            darkMode={darkMode}
            inputClass={inputClass}
            readOnlyClass={readOnlyClass}
          />

          <ProfileField
            label="Designation"
            value={
              editDetails
                ? draftDetails.designation
                : companyDetails.designation
            }
            editable={editDetails}
            onChange={(value) => handleDetailsChange("designation", value)}
            darkMode={darkMode}
            inputClass={inputClass}
            readOnlyClass={readOnlyClass}
          />

          <ProfileField
            label="Company Email"
            type="email"
            value={
              editDetails
                ? draftDetails.companyEmail
                : companyDetails.companyEmail
            }
            editable={editDetails}
            onChange={(value) => handleDetailsChange("companyEmail", value)}
            darkMode={darkMode}
            inputClass={inputClass}
            readOnlyClass={readOnlyClass}
          />

          <ProfileField
            label="Company Phone"
            value={
              editDetails
                ? draftDetails.companyPhone
                : companyDetails.companyPhone
            }
            editable={editDetails}
            onChange={(value) => handleDetailsChange("companyPhone", value)}
            darkMode={darkMode}
            inputClass={inputClass}
            readOnlyClass={readOnlyClass}
          />

          <ProfileField
            label="Website"
            value={editDetails ? draftDetails.website : companyDetails.website}
            editable={editDetails}
            onChange={(value) => handleDetailsChange("website", value)}
            placeholder="https://example.com"
            darkMode={darkMode}
            inputClass={inputClass}
            readOnlyClass={readOnlyClass}
          />

          <div className="md:col-span-2">
            <ProfileField
              label="Company Address"
              value={
                editDetails
                  ? draftDetails.companyAddress
                  : companyDetails.companyAddress
              }
              editable={editDetails}
              onChange={(value) => handleDetailsChange("companyAddress", value)}
              darkMode={darkMode}
              inputClass={inputClass}
              readOnlyClass={readOnlyClass}
            />
          </div>
        </div>

        {editDetails && (
          <div
            className={`flex flex-col sm:flex-row gap-3 mt-6 pt-5 border-t ${
              darkMode ? "border-slate-700" : "border-slate-200"
            }`}
          >
            <button
              type="button"
              onClick={handleSaveDetails}
              disabled={savingDetails}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold transition"
            >
              {savingDetails ? "Saving..." : "Save Changes"}
            </button>

            <button
              type="button"
              onClick={handleCancelEdit}
              disabled={savingDetails}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold transition ${
                darkMode
                  ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Cancel
            </button>
          </div>
        )}
      </section>

      {/* =====================================================
          BUSINESS DOCUMENTS
      ===================================================== */}

      <section className={`mt-6 border rounded-2xl p-5 md:p-6 ${cardClass}`}>
        <div className="mb-5">
          <h2 className="text-lg font-black">Business Documents</h2>

          <p className={`text-xs mt-1 ${mutedText}`}>
            Documents submitted for company verification.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <BusinessDocumentCard
            title="Business Registration"
            value={companyDetails.businessRegistrationUrl}
            darkMode={darkMode}
            mutedText={mutedText}
          />

          <BusinessDocumentCard
            title="BIR Registration"
            value={companyDetails.birRegistrationUrl}
            darkMode={darkMode}
            mutedText={mutedText}
          />

          <BusinessDocumentCard
            title="Supporting Document"
            value={companyDetails.supportingDocumentUrl}
            darkMode={darkMode}
            mutedText={mutedText}
          />
        </div>
      </section>

      {/* =====================================================
          QUICK ACTIONS
      ===================================================== */}

      <section className={`mt-6 border rounded-2xl p-5 md:p-6 ${cardClass}`}>
        <div className="mb-5">
          <h2 className="text-lg font-black">Quick Actions</h2>

          <p className={`text-xs mt-1 ${mutedText}`}>
            Continue managing your company's internship operations.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => navigateTo("/company/jobs")}
            className="px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition"
          >
            Manage Internship Jobs
          </button>

          <button
            type="button"
            onClick={() => navigateTo("/company/interns")}
            className={`px-5 py-3 rounded-xl border text-xs font-bold transition ${
              darkMode
                ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                : "border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            View Interns
          </button>
        </div>
      </section>
    </div>
  );
};

// =========================================================
// PROFILE FIELD
// =========================================================

const ProfileField = ({
  label,
  value,
  onChange,
  editable,
  type = "text",
  options = [],
  placeholder = "",
  darkMode,
  inputClass,
  readOnlyClass,
}) => {
  return (
    <div>
      <label
        className={`block text-xs font-bold mb-1.5 ${
          darkMode ? "text-slate-200" : "text-slate-800"
        }`}
      >
        {label}
      </label>

      {type === "select" ? (
        <select
          value={value || ""}
          disabled={!editable}
          onChange={(event) => onChange(event.target.value)}
          className={`w-full h-11 px-3 rounded-xl border text-sm outline-none transition ${
            editable ? inputClass : readOnlyClass
          }`}
        >
          <option value="">Select industry</option>

          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={value || ""}
          disabled={!editable}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className={`w-full h-11 px-3 rounded-xl border text-sm outline-none transition ${
            editable ? inputClass : readOnlyClass
          }`}
        />
      )}
    </div>
  );
};

// =========================================================
// MINI INFO
// =========================================================

const MiniInfo = ({ label, value, darkMode }) => {
  return (
    <div
      className={`p-3 rounded-xl border ${
        darkMode
          ? "bg-slate-800/70 border-slate-700"
          : "bg-slate-50 border-slate-200"
      }`}
    >
      <p className="text-[9px] uppercase tracking-wider font-bold text-slate-400">
        {label}
      </p>

      <p className="text-xs font-semibold mt-1 break-words">{value || "—"}</p>
    </div>
  );
};

// =========================================================
// BUSINESS DOCUMENT CARD
// =========================================================

const BusinessDocumentCard = ({ title, value, darkMode, mutedText }) => {
  const isAvailable = Boolean(value);

  return (
    <div
      className={`p-4 rounded-xl border ${
        darkMode
          ? "bg-slate-800/60 border-slate-700"
          : "bg-slate-50 border-slate-200"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            darkMode
              ? "bg-purple-950 text-purple-300"
              : "bg-purple-50 text-purple-600"
          }`}
        >
          📄
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold">{title}</p>

          <p className={`text-[10px] mt-1 ${mutedText}`}>
            {isAvailable ? "Submitted" : "Not available"}
          </p>

          {isAvailable ? (
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex mt-3 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-bold transition"
            >
              View Document
            </a>
          ) : (
            <span
              className={`inline-flex mt-3 px-3 py-1.5 rounded-lg text-[10px] font-bold ${
                darkMode
                  ? "bg-slate-700 text-slate-400"
                  : "bg-slate-200 text-slate-500"
              }`}
            >
              Not Available
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
