import React, { useEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabaseRegistrar } from "../../supabaseClient";

// =============================================================
// PROFILE PHOTO STORAGE
// =============================================================

const PROFILE_PHOTO_BUCKET = "profile-photos";
const PROFILE_PHOTO_FOLDER = "registrars";

// =============================================================
// PROFILE
// =============================================================

const Profile = () => {
  const { darkMode } = useOutletContext();

  // ===========================================================
  // STATE
  // ===========================================================

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [registrar, setRegistrar] = useState(null);

  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    employeeId: "",
    school: "",
    department: "",
    position: "",
    specialization: "",
    phone: "",
    address: "",
  });

  const [savedProfile, setSavedProfile] = useState({
    name: "",
    email: "",
    employeeId: "",
    school: "",
    department: "",
    position: "",
    specialization: "",
    phone: "",
    address: "",
  });

  const [isEditing, setIsEditing] = useState(false);

  // ===========================================================
  // PHOTO STATE
  // ===========================================================

  const [profilePhoto, setProfilePhoto] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const fileInputRef = useRef(null);

  // ===========================================================
  // LOAD PROFILE ON MOUNT
  // ===========================================================

  useEffect(() => {
    loadProfile();

    return () => {
      setProfilePhoto((currentPhoto) => {
        if (currentPhoto?.startsWith("blob:")) {
          URL.revokeObjectURL(currentPhoto);
        }

        return currentPhoto;
      });
    };
  }, []);

  // ===========================================================
  // CREATE SIGNED PHOTO URL
  // ===========================================================

  const createProfilePhotoUrl = async (storedValue) => {
    if (!storedValue) {
      return null;
    }

    if (
      !storedValue.startsWith("http://") &&
      !storedValue.startsWith("https://")
    ) {
      const { data, error } = await supabaseRegistrar.storage
        .from(PROFILE_PHOTO_BUCKET)
        .createSignedUrl(storedValue, 60 * 60);

      if (error) {
        console.error("❌ Failed to create signed photo URL:", error);
        return null;
      }

      return data?.signedUrl || null;
    }

    try {
      const publicMarker = `/storage/v1/object/public/${PROFILE_PHOTO_BUCKET}/`;
      const signMarker = `/storage/v1/object/sign/${PROFILE_PHOTO_BUCKET}/`;

      let storagePath = null;

      if (storedValue.includes(publicMarker)) {
        storagePath = decodeURIComponent(
          storedValue.split(publicMarker)[1]
        );
      } else if (storedValue.includes(signMarker)) {
        storagePath = decodeURIComponent(
          storedValue.split(signMarker)[1].split("?")[0]
        );
      }

      if (storagePath) {
        const { data, error } = await supabaseRegistrar.storage
          .from(PROFILE_PHOTO_BUCKET)
          .createSignedUrl(storagePath, 60 * 60);

        if (!error && data?.signedUrl) {
          return data.signedUrl;
        }
      }
    } catch (error) {
      console.error("❌ Failed to convert old photo URL:", error);
    }

    return storedValue;
  };

  // ===========================================================
  // LOAD REGISTRAR PROFILE
  // ===========================================================

  const loadProfile = async () => {
    setLoading(true);

    try {
      // =======================================================
      // 1. GET AUTH USER
      // =======================================================

      const {
        data: { user },
        error: authError,
      } = await supabaseRegistrar.auth.getUser();

      if (authError) {
        throw authError;
      }

      if (!user) {
        throw new Error("You are not logged in.");
      }

      console.log("👤 Auth user:", user.id);

      // =======================================================
      // 2. GET USERS RECORD
      // =======================================================

      const { data: userData, error: userError } =
        await supabaseRegistrar
          .from("users")
          .select(
            "id, email, role, first_name, middle_name, last_name, status"
          )
          .eq("id", user.id)
          .maybeSingle();

      if (userError) {
        throw userError;
      }

      if (!userData) {
        throw new Error("Your SIMS user record could not be found.");
      }

      console.log("👤 Users record:", userData);

      // =======================================================
      // 3. VERIFY REGISTRAR ROLE
      // =======================================================

      if (userData.role?.toLowerCase() !== "registrar") {
        throw new Error("This account is not a Registrar account.");
      }

      // =======================================================
      // 4. GET REGISTRAR RECORD
      // =======================================================
      //
      // IMPORTANT:
      //
      // The column is school_id.
      //
      // DO NOT use:
      //     school
      //
      // The actual database relationship is:
      //
      //     registrars.school_id
      //
      // =======================================================

      const { data: registrarData, error: registrarError } =
        await supabaseRegistrar
          .from("registrars")
          .select(
            `
              id,
              employee_id,
              school_id,
              department,
              position,
              specialization,
              phone,
              address,
              profile_photo_url
            `
          )
          .eq("id", user.id)
          .maybeSingle();

      if (registrarError) {
        throw registrarError;
      }

      if (!registrarData) {
        throw new Error(
          "No registrar profile was found for this account. Please make sure the registrar account was approved by the administrator."
        );
      }

      console.log("🏛️ Registrars record:", registrarData);

      // =======================================================
      // 5. GET SCHOOL
      // =======================================================
      //
      // School is NOT editable from this profile.
      //
      // The school_id comes from the registrar record, which
      // should already have been assigned during signup/approval.
      //
      // We only READ the school name here.
      // =======================================================

      let schoolName = "";

      if (registrarData.school_id) {
        const { data: schoolData, error: schoolError } =
          await supabaseRegistrar
            .from("schools")
            .select("id, name")
            .eq("id", registrarData.school_id)
            .maybeSingle();

        if (schoolError) {
          throw schoolError;
        }

        if (schoolData) {
          schoolName = schoolData.name || "";
        }
      }

      console.log("🏫 School:", schoolName);

      // =======================================================
      // 6. BUILD FULL NAME
      // =======================================================

      const fullName = [
        userData.first_name,
        userData.middle_name,
        userData.last_name,
      ]
        .filter(Boolean)
        .join(" ")
        .trim();

      // =======================================================
      // 7. BUILD PROFILE DATA
      // =======================================================

      const loadedProfile = {
        name: fullName,
        email: userData.email || "",

        employeeId: registrarData.employee_id || "",

        school: schoolName,

        department: registrarData.department || "",
        position: registrarData.position || "",
        specialization: registrarData.specialization || "",

        phone: registrarData.phone || "",
        address: registrarData.address || "",
      };

      // =======================================================
      // 8. SAVE STATE
      // =======================================================

      setRegistrar({
        ...userData,
        ...registrarData,
        school_name: schoolName,
      });

      setProfileData(loadedProfile);
      setSavedProfile(loadedProfile);

      // =======================================================
      // 9. LOAD PROFILE PHOTO
      // =======================================================

      if (registrarData.profile_photo_url) {
        const photoUrl = await createProfilePhotoUrl(
          registrarData.profile_photo_url
        );

        setProfilePhoto(photoUrl);
      } else {
        setProfilePhoto(null);
      }

      console.log("✅ Registrar profile loaded:", loadedProfile);
    } catch (error) {
      console.error("❌ Load registrar profile error:", error);

      alert(error.message || "Unable to load your profile.");
    } finally {
      setLoading(false);
    }
  };

  // ===========================================================
  // PROFILE HANDLERS
  // ===========================================================

  const handleProfileChange = (field, value) => {
    setProfileData((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleEditDetails = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setProfileData(savedProfile);
    setIsEditing(false);
  };

  // ===========================================================
  // SAVE PROFILE DETAILS
  // ===========================================================

  const handleSaveDetails = async () => {
    if (!profileData.name.trim()) {
      return alert("Please enter your full name.");
    }

    if (!profileData.email.trim()) {
      return alert("Please enter your email.");
    }

    if (!profileData.department.trim()) {
      return alert("Please enter your department.");
    }

    if (!profileData.position.trim()) {
      return alert("Please enter your position.");
    }

    setSaving(true);

    try {
      // =======================================================
      // GET AUTH USER
      // =======================================================

      const {
        data: { user },
        error: authError,
      } = await supabaseRegistrar.auth.getUser();

      if (authError) {
        throw authError;
      }

      if (!user) {
        throw new Error("You are not logged in.");
      }

      console.log("💾 Saving registrar profile:", user.id);

      // =======================================================
      // SPLIT FULL NAME
      // =======================================================

      const nameParts = profileData.name.trim().split(/\s+/);

      const firstName = nameParts[0] || "";

      const lastName =
        nameParts.length > 1
          ? nameParts[nameParts.length - 1]
          : "";

      const middleName =
        nameParts.length > 2
          ? nameParts.slice(1, -1).join(" ")
          : null;

      // =======================================================
      // 1. UPDATE USERS TABLE
      // =======================================================

      const { data: updatedUsers, error: userError } =
        await supabaseRegistrar
          .from("users")
          .update({
            first_name: firstName,
            middle_name: middleName,
            last_name: lastName,
            email: profileData.email.trim(),
          })
          .eq("id", user.id)
          .select(
            "id, email, role, first_name, middle_name, last_name, status"
          );

      if (userError) {
        throw userError;
      }

      if (!updatedUsers || updatedUsers.length === 0) {
        throw new Error(
          "Your user information was not updated. Your Supabase RLS policy may not allow you to update your own users record."
        );
      }

      const updatedUser = updatedUsers[0];

      console.log("✅ Users record updated:", updatedUser);

      // =======================================================
      // 2. UPDATE REGISTRAR TABLE
      // =======================================================
      //
      // IMPORTANT:
      //
      // school_id IS INTENTIONALLY NOT UPDATED.
      //
      // The school is institution-managed and was already
      // selected/assigned during signup and approval.
      //
      // =======================================================

      const {
        data: updatedRegistrars,
        error: registrarError,
      } = await supabaseRegistrar
        .from("registrars")
        .update({
          department: profileData.department.trim(),

          position: profileData.position.trim(),

          specialization:
            profileData.specialization.trim() || null,

          phone: profileData.phone.trim() || null,

          address: profileData.address.trim() || null,
        })
        .eq("id", user.id)
        .select(
          `
            id,
            employee_id,
            school_id,
            department,
            position,
            specialization,
            phone,
            address,
            profile_photo_url
          `
        );

      if (registrarError) {
        throw registrarError;
      }

      if (!updatedRegistrars || updatedRegistrars.length === 0) {
        throw new Error(
          "Your registrar information was not updated. The registrar record exists, but your Supabase RLS policy may not allow you to update it."
        );
      }

      const updatedRegistrar = updatedRegistrars[0];

      console.log(
        "✅ Registrar record updated:",
        updatedRegistrar
      );

      // =======================================================
      // 3. RELOAD SCHOOL NAME
      // =======================================================

      let schoolName = profileData.school;

      if (updatedRegistrar.school_id) {
        const { data: schoolData, error: schoolError } =
          await supabaseRegistrar
            .from("schools")
            .select("id, name")
            .eq("id", updatedRegistrar.school_id)
            .maybeSingle();

        if (schoolError) {
          throw schoolError;
        }

        if (schoolData) {
          schoolName = schoolData.name || "";
        }
      }

      // =======================================================
      // 4. BUILD UPDATED PROFILE
      // =======================================================

      const updatedProfile = {
        name: [
          updatedUser.first_name,
          updatedUser.middle_name,
          updatedUser.last_name,
        ]
          .filter(Boolean)
          .join(" ")
          .trim(),

        email: updatedUser.email || "",

        employeeId: updatedRegistrar.employee_id || "",

        school: schoolName,

        department: updatedRegistrar.department || "",

        position: updatedRegistrar.position || "",

        specialization:
          updatedRegistrar.specialization || "",

        phone: updatedRegistrar.phone || "",

        address: updatedRegistrar.address || "",
      };

      // =======================================================
      // 5. UPDATE LOCAL STATE
      // =======================================================

      setProfileData(updatedProfile);
      setSavedProfile(updatedProfile);

      setRegistrar({
        ...updatedUser,
        ...updatedRegistrar,
        school_name: schoolName,
      });

      setIsEditing(false);

      console.log(
        "✅ Final updated profile:",
        updatedProfile
      );

      alert("Profile updated successfully.");
    } catch (error) {
      console.error(
        "❌ Save registrar profile error:",
        error
      );

      alert(
        error.message ||
          "Unable to save your profile."
      );
    } finally {
      setSaving(false);
    }
  };

  // ===========================================================
  // PHOTO HANDLERS
  // ===========================================================

  const handlePhotoClick = () => {
    if (uploadingPhoto) return;

    fileInputRef.current?.click();
  };

  // ===========================================================
  // SANITIZE FILE NAME
  // ===========================================================

  const sanitizeFileName = (fileName) => {
    return fileName
      .toLowerCase()
      .replace(/[^a-z0-9.-]/g, "-")
      .replace(/-+/g, "-");
  };

  // ===========================================================
  // UPLOAD PROFILE PHOTO
  // ===========================================================

  const handlePhotoChange = async (event) => {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) return;

    // =======================================================
    // VALIDATE IMAGE
    // =======================================================

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Please select an image smaller than 5MB.");
      return;
    }

    setUploadingPhoto(true);

    let temporaryImageUrl = null;

    try {
      // =======================================================
      // GET AUTH USER
      // =======================================================

      const {
        data: { user },
        error: authError,
      } = await supabaseRegistrar.auth.getUser();

      if (authError) {
        throw authError;
      }

      if (!user) {
        throw new Error("You are not logged in.");
      }

      console.log(
        "📷 Uploading profile photo for:",
        user.id
      );

      // =======================================================
      // SHOW TEMPORARY PREVIEW
      // =======================================================

      temporaryImageUrl = URL.createObjectURL(file);

      setProfilePhoto((previousPhoto) => {
        if (
          previousPhoto &&
          previousPhoto.startsWith("blob:")
        ) {
          URL.revokeObjectURL(previousPhoto);
        }

        return temporaryImageUrl;
      });

      // =======================================================
      // CREATE STORAGE PATH
      // =======================================================

      const safeFileName = sanitizeFileName(file.name);

      const fileExtension = safeFileName.includes(".")
        ? safeFileName.substring(
            safeFileName.lastIndexOf(".")
          )
        : "";

      const storagePath = `${PROFILE_PHOTO_FOLDER}/${
        user.id
      }/profile-${Date.now()}${fileExtension}`;

      console.log(
        "📁 Profile photo storage path:",
        storagePath
      );

      // =======================================================
      // UPLOAD TO STORAGE
      // =======================================================

      const { error: uploadError } =
        await supabaseRegistrar.storage
          .from(PROFILE_PHOTO_BUCKET)
          .upload(storagePath, file, {
            cacheControl: "3600",
            upsert: true,
            contentType: file.type,
          });

      if (uploadError) {
        throw uploadError;
      }

      console.log("✅ Profile photo uploaded.");

      // =======================================================
      // SAVE STORAGE PATH
      // =======================================================

      const {
        data: updatedRegistrars,
        error: photoUpdateError,
      } = await supabaseRegistrar
        .from("registrars")
        .update({
          profile_photo_url: storagePath,
        })
        .eq("id", user.id)
        .select("id, profile_photo_url");

      if (photoUpdateError) {
        throw photoUpdateError;
      }

      if (
        !updatedRegistrars ||
        updatedRegistrars.length === 0
      ) {
        throw new Error(
          "The photo was uploaded, but your registrar profile could not be updated with the photo path. Please check your Supabase RLS policy."
        );
      }

      const updatedRegistrar =
        updatedRegistrars[0];

      console.log(
        "✅ Registrar photo path saved:",
        updatedRegistrar.profile_photo_url
      );

      // =======================================================
      // CREATE SIGNED URL
      // =======================================================

      const {
        data: signedUrlData,
        error: signedUrlError,
      } = await supabaseRegistrar.storage
        .from(PROFILE_PHOTO_BUCKET)
        .createSignedUrl(
          storagePath,
          60 * 60
        );

      if (signedUrlError) {
        throw signedUrlError;
      }

      if (!signedUrlData?.signedUrl) {
        throw new Error(
          "The photo was uploaded, but a display URL could not be generated."
        );
      }

      const signedUrl =
        signedUrlData.signedUrl;

      console.log(
        "🔗 Signed profile photo URL created."
      );

      // =======================================================
      // UPDATE LOCAL STATE
      // =======================================================

      setRegistrar((previous) => ({
        ...(previous || {}),
        profile_photo_url: storagePath,
      }));

      setProfilePhoto(signedUrl);

      // =======================================================
      // CLEAN TEMPORARY PREVIEW
      // =======================================================

      if (
        temporaryImageUrl &&
        temporaryImageUrl.startsWith("blob:")
      ) {
        URL.revokeObjectURL(
          temporaryImageUrl
        );
      }

      alert(
        "Profile photo updated successfully."
      );
    } catch (error) {
      console.error(
        "❌ Profile photo upload error:",
        error
      );

      if (
        temporaryImageUrl &&
        temporaryImageUrl.startsWith("blob:")
      ) {
        URL.revokeObjectURL(
          temporaryImageUrl
        );
      }

      // =======================================================
      // RESTORE SAVED PHOTO
      // =======================================================

      try {
        const {
          data: { user },
        } =
          await supabaseRegistrar.auth.getUser();

        if (user) {
          const {
            data: currentRegistrar,
            error: reloadError,
          } = await supabaseRegistrar
            .from("registrars")
            .select("profile_photo_url")
            .eq("id", user.id)
            .maybeSingle();

          if (reloadError) {
            console.error(
              "❌ Failed to reload registrar photo:",
              reloadError
            );
          } else if (
            currentRegistrar?.profile_photo_url
          ) {
            const restoredPhoto =
              await createProfilePhotoUrl(
                currentRegistrar.profile_photo_url
              );

            setProfilePhoto(restoredPhoto);
          } else {
            setProfilePhoto(null);
          }
        }
      } catch (reloadError) {
        console.error(
          "❌ Failed to restore profile photo:",
          reloadError
        );

        setProfilePhoto(null);
      }

      alert(
        error.message ||
          "Unable to upload your profile photo."
      );
    } finally {
      setUploadingPhoto(false);
    }
  };

  // ===========================================================
  // ASSIGNED STUDENTS
  // ===========================================================

  const assignedStudents = [
    {
      id: 1,
      name: "John Doe",
      studentId: "2024-00123",
      company: "Tech Solutions Inc.",
      status: "Active",
    },
    {
      id: 2,
      name: "Jane Smith",
      studentId: "2024-00124",
      company: "Digital Innovations Corp.",
      status: "Active",
    },
    {
      id: 3,
      name: "Michael Cruz",
      studentId: "2024-00125",
      company: "NextGen Software",
      status: "Pending",
    },
    {
      id: 4,
      name: "Sarah Garcia",
      studentId: "2024-00126",
      company: "CloudWorks Technologies",
      status: "Active",
    },
  ];

  // ===========================================================
  // THEME CLASSES
  // ===========================================================

  const pageHeadingClass = darkMode
    ? "text-slate-100"
    : "text-slate-900";

  const mutedClass = darkMode
    ? "text-slate-400"
    : "text-slate-500";

  const cardClass = darkMode
    ? "bg-slate-900 border-slate-700"
    : "bg-white border-slate-300";

  const panelClass = darkMode
    ? "bg-slate-800 border-slate-700"
    : "bg-slate-50 border-slate-200";

  const labelClass = darkMode
    ? "text-slate-400"
    : "text-slate-600";

  // ===========================================================
  // INPUT CLASS
  // ===========================================================

  const getInputClass = (editing = false) => {
    if (darkMode) {
      return editing
        ? "bg-slate-800 border-slate-600 text-slate-100 focus:border-slate-400"
        : "bg-slate-800 border-slate-700 text-slate-300";
    }

    return editing
      ? "bg-white border-slate-300 text-slate-800 focus:border-slate-700"
      : "bg-slate-50 border-slate-200 text-slate-700";
  };

  // ===========================================================
  // LOADING
  // ===========================================================

  if (loading) {
    return (
      <div className="w-full min-h-full p-5 md:p-8">
        <div
          className={`max-w-[1400px] mx-auto border rounded-xl p-10 text-center ${cardClass}`}
        >
          <div className="text-2xl mb-3">
            ⏳
          </div>

          <h2
            className={`font-bold ${pageHeadingClass}`}
          >
            Loading Profile...
          </h2>

          <p
            className={`text-sm mt-1 ${mutedClass}`}
          >
            Please wait while we load your
            registrar information.
          </p>
        </div>
      </div>
    );
  }

  // ===========================================================
  // RENDER
  // ===========================================================

  return (
    <div className="w-full min-h-full p-3 sm:p-5 md:p-6 lg:p-8">
      <div className="max-w-[1400px] mx-auto">

        {/* =====================================================
            PAGE HEADER
        ===================================================== */}

        <div className="mb-5 sm:mb-6">
          <p
            className={`text-[10px] sm:text-xs uppercase tracking-widest font-bold mb-1 ${
              darkMode
                ? "text-slate-500"
                : "text-slate-400"
            }`}
          >
            Registrar Portal
          </p>

          <h1
            className={`text-xl sm:text-2xl font-black ${pageHeadingClass}`}
          >
            My Profile
          </h1>

          <p
            className={`text-xs sm:text-sm mt-1 ${mutedClass}`}
          >
            View and manage your registrar
            information and assigned students.
          </p>
        </div>

        {/* =====================================================
            PROFILE GRID
        ===================================================== */}

        <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-5">

          {/* ===================================================
              PROFILE PHOTO CARD
          =================================================== */}

          <section
            className={`border rounded-xl shadow-sm overflow-hidden ${cardClass}`}
          >
            <div className="p-5">

              {/* PHOTO */}

              <div
                className={`w-full aspect-square max-w-[220px] mx-auto rounded-xl border overflow-hidden flex items-center justify-center ${
                  darkMode
                    ? "bg-slate-800 border-slate-700"
                    : "bg-slate-100 border-slate-300"
                }`}
              >
                {profilePhoto ? (
                  <img
                    src={profilePhoto}
                    alt={`${profileData.name} profile`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className={`w-28 h-28 sm:w-32 sm:h-32 rounded-xl flex items-center justify-center text-3xl sm:text-4xl font-black ${
                      darkMode
                        ? "bg-slate-700 text-slate-300"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {profileData.name
                      .split(" ")
                      .filter(Boolean)
                      .map(
                        (word) => word[0]
                      )
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                )}
              </div>

              {/* NAME */}

              <div className="text-center mt-5">
                <h2
                  className={`text-base font-bold ${pageHeadingClass}`}
                >
                  {profileData.name}
                </h2>

                <p
                  className={`text-xs mt-1 ${mutedClass}`}
                >
                  {profileData.position ||
                    "Registrar Adviser"}
                </p>

                {profileData.employeeId && (
                  <p
                    className={`text-[10px] mt-1 ${mutedClass}`}
                  >
                    Employee ID:{" "}
                    {profileData.employeeId}
                  </p>
                )}
              </div>

              {/* FILE INPUT */}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />

              {/* EDIT PHOTO */}

              <button
                type="button"
                onClick={handlePhotoClick}
                disabled={uploadingPhoto}
                className={`w-full mt-5 h-10 rounded-lg border text-xs font-bold transition disabled:opacity-50 disabled:cursor-not-allowed ${
                  darkMode
                    ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
                    : "bg-slate-100 border-slate-300 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                }`}
              >
                {uploadingPhoto
                  ? "Uploading..."
                  : profilePhoto
                  ? "Change Photo"
                  : "Edit Photo"}
              </button>

              <p
                className={`text-[10px] text-center mt-2 ${mutedClass}`}
              >
                JPG, PNG, GIF, or other image
                files up to 5MB.
              </p>
            </div>
          </section>

          {/* ===================================================
              REGISTRAR DETAILS
          =================================================== */}

          <section
            className={`border rounded-xl shadow-sm overflow-hidden ${cardClass}`}
          >

            {/* HEADER */}

            <div
              className={`px-5 py-4 sm:px-6 sm:py-5 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
                darkMode
                  ? "border-slate-700"
                  : "border-slate-200"
              }`}
            >
              <div>
                <h2
                  className={`text-base sm:text-lg font-bold ${pageHeadingClass}`}
                >
                  Registrar Details
                </h2>

                <p
                  className={`text-xs mt-1 ${mutedClass}`}
                >
                  Manage your registrar information.
                </p>
              </div>

              {!isEditing ? (
                <button
                  type="button"
                  onClick={handleEditDetails}
                  className={`h-9 px-4 rounded-lg text-xs font-bold transition ${
                    darkMode
                      ? "bg-slate-700 text-slate-100 hover:bg-slate-600"
                      : "bg-slate-800 text-white hover:bg-slate-700"
                  }`}
                >
                  Edit Details
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={saving}
                    className={`h-9 px-4 rounded-lg border text-xs font-bold transition ${
                      darkMode
                        ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                        : "bg-white border-slate-300 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveDetails}
                    disabled={saving}
                    className="h-9 px-4 rounded-lg bg-slate-800 text-white text-xs font-bold hover:bg-slate-700 disabled:opacity-50 transition"
                  >
                    {saving
                      ? "Saving..."
                      : "Save Changes"}
                  </button>
                </div>
              )}
            </div>

            {/* DETAILS */}

            <div className="p-5 sm:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                {/* FULL NAME */}

                <div>
                  <label
                    className={`block text-xs font-bold mb-1.5 ${labelClass}`}
                  >
                    Full Name
                  </label>

                  <input
                    type="text"
                    value={profileData.name}
                    disabled={!isEditing}
                    onChange={(e) =>
                      handleProfileChange(
                        "name",
                        e.target.value
                      )
                    }
                    className={`w-full h-11 px-3 rounded-lg border text-xs sm:text-sm outline-none transition ${getInputClass(
                      isEditing
                    )}`}
                  />
                </div>

                {/* EMPLOYEE ID */}

                <div>
                  <label
                    className={`block text-xs font-bold mb-1.5 ${labelClass}`}
                  >
                    Employee ID
                  </label>

                  <input
                    type="text"
                    value={profileData.employeeId}
                    disabled
                    className={`w-full h-11 px-3 rounded-lg border text-xs sm:text-sm outline-none ${
                      darkMode
                        ? "bg-slate-800 border-slate-700 text-slate-500"
                        : "bg-slate-100 border-slate-200 text-slate-500"
                    }`}
                  />
                </div>

                {/* EMAIL */}

                <div>
                  <label
                    className={`block text-xs font-bold mb-1.5 ${labelClass}`}
                  >
                    Email
                  </label>

                  <input
                    type="email"
                    value={profileData.email}
                    disabled={!isEditing}
                    onChange={(e) =>
                      handleProfileChange(
                        "email",
                        e.target.value
                      )
                    }
                    className={`w-full h-11 px-3 rounded-lg border text-xs sm:text-sm outline-none transition ${getInputClass(
                      isEditing
                    )}`}
                  />
                </div>

                {/* PHONE */}

                <div>
                  <label
                    className={`block text-xs font-bold mb-1.5 ${labelClass}`}
                  >
                    Phone Number
                  </label>

                  <input
                    type="text"
                    value={profileData.phone}
                    disabled={!isEditing}
                    onChange={(e) =>
                      handleProfileChange(
                        "phone",
                        e.target.value
                      )
                    }
                    className={`w-full h-11 px-3 rounded-lg border text-xs sm:text-sm outline-none transition ${getInputClass(
                      isEditing
                    )}`}
                    placeholder="Enter phone number"
                  />
                </div>

                {/* SCHOOL */}

                <div>
                  <label
                    className={`block text-xs font-bold mb-1.5 ${labelClass}`}
                  >
                    School
                  </label>

                  <input
                    type="text"
                    value={
                      profileData.school ||
                      "School not assigned"
                    }
                    disabled
                    readOnly
                    className={`w-full h-11 px-3 rounded-lg border text-xs sm:text-sm outline-none ${
                      darkMode
                        ? "bg-slate-800 border-slate-700 text-slate-400"
                        : "bg-slate-100 border-slate-200 text-slate-500"
                    }`}
                  />

                  <p
                    className={`text-[10px] mt-1 ${mutedClass}`}
                  >
                    School is assigned during
                    account registration and cannot
                    be changed here.
                  </p>
                </div>

                {/* DEPARTMENT */}

                <div>
                  <label
                    className={`block text-xs font-bold mb-1.5 ${labelClass}`}
                  >
                    Department
                  </label>

                  <input
                    type="text"
                    value={profileData.department}
                    disabled={!isEditing}
                    onChange={(e) =>
                      handleProfileChange(
                        "department",
                        e.target.value
                      )
                    }
                    className={`w-full h-11 px-3 rounded-lg border text-xs sm:text-sm outline-none transition ${getInputClass(
                      isEditing
                    )}`}
                  />
                </div>

                {/* POSITION */}

                <div>
                  <label
                    className={`block text-xs font-bold mb-1.5 ${labelClass}`}
                  >
                    Position
                  </label>

                  <input
                    type="text"
                    value={profileData.position}
                    disabled={!isEditing}
                    onChange={(e) =>
                      handleProfileChange(
                        "position",
                        e.target.value
                      )
                    }
                    className={`w-full h-11 px-3 rounded-lg border text-xs sm:text-sm outline-none transition ${getInputClass(
                      isEditing
                    )}`}
                  />
                </div>

                {/* SPECIALIZATION */}

                <div>
                  <label
                    className={`block text-xs font-bold mb-1.5 ${labelClass}`}
                  >
                    Specialization
                  </label>

                  <input
                    type="text"
                    value={
                      profileData.specialization
                    }
                    disabled={!isEditing}
                    onChange={(e) =>
                      handleProfileChange(
                        "specialization",
                        e.target.value
                      )
                    }
                    className={`w-full h-11 px-3 rounded-lg border text-xs sm:text-sm outline-none transition ${getInputClass(
                      isEditing
                    )}`}
                    placeholder="Enter specialization"
                  />
                </div>

                {/* ADDRESS */}

                <div>
                  <label
                    className={`block text-xs font-bold mb-1.5 ${labelClass}`}
                  >
                    Address
                  </label>

                  <input
                    type="text"
                    value={profileData.address}
                    disabled={!isEditing}
                    onChange={(e) =>
                      handleProfileChange(
                        "address",
                        e.target.value
                      )
                    }
                    className={`w-full h-11 px-3 rounded-lg border text-xs sm:text-sm outline-none transition ${getInputClass(
                      isEditing
                    )}`}
                    placeholder="Enter address"
                  />
                </div>
              </div>

              {/* INFO */}

              <div
                className={`mt-6 p-4 rounded-lg border ${panelClass}`}
              >
                <p
                  className={`text-xs font-bold mb-1 ${
                    darkMode
                      ? "text-slate-200"
                      : "text-slate-700"
                  }`}
                >
                  Profile Information
                </p>

                <p
                  className={`text-xs leading-relaxed ${mutedClass}`}
                >
                  Your profile information is loaded
                  directly from your SIMS account.
                  Employee ID and School are managed
                  by the institution and cannot be
                  changed here.
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* =====================================================
            ASSIGNED STUDENTS
        ===================================================== */}

        <section
          className={`mt-5 border rounded-xl shadow-sm overflow-hidden ${cardClass}`}
        >
          {/* HEADER */}

          <div
            className={`px-5 py-4 sm:px-6 sm:py-5 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 ${
              darkMode
                ? "border-slate-700"
                : "border-slate-200"
            }`}
          >
            <div>
              <h2
                className={`text-base sm:text-lg font-bold ${pageHeadingClass}`}
              >
                Assigned Students Overview
              </h2>

              <p
                className={`text-xs mt-1 ${mutedClass}`}
              >
                Students currently assigned to you
                and their internship companies.
              </p>
            </div>

            <span
              className={`self-start sm:self-auto px-3 py-1.5 rounded-md text-[10px] font-bold ${
                darkMode
                  ? "bg-slate-800 text-slate-400"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {assignedStudents.length} Students
            </span>
          </div>

          {/* TABLE */}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr
                  className={`border-b ${
                    darkMode
                      ? "bg-slate-800 border-slate-700"
                      : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <th
                    className={`px-5 py-3 text-left text-[10px] uppercase tracking-wide font-bold ${mutedClass}`}
                  >
                    Student
                  </th>

                  <th
                    className={`px-5 py-3 text-left text-[10px] uppercase tracking-wide font-bold ${mutedClass}`}
                  >
                    Student ID
                  </th>

                  <th
                    className={`px-5 py-3 text-left text-[10px] uppercase tracking-wide font-bold ${mutedClass}`}
                  >
                    Assigned Company
                  </th>

                  <th
                    className={`px-5 py-3 text-left text-[10px] uppercase tracking-wide font-bold ${mutedClass}`}
                  >
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {assignedStudents.map(
                  (student) => (
                    <tr
                      key={student.id}
                      className={`border-b last:border-b-0 transition ${
                        darkMode
                          ? "border-slate-700 hover:bg-slate-800"
                          : "border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {/* STUDENT */}

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-lg flex items-center justify-center text-[10px] font-bold ${
                              darkMode
                                ? "bg-slate-800 text-slate-300"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {student.name
                              .split(" ")
                              .map(
                                (word) =>
                                  word[0]
                              )
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>

                          <div>
                            <p
                              className={`text-xs font-bold ${
                                darkMode
                                  ? "text-slate-100"
                                  : "text-slate-900"
                              }`}
                            >
                              {student.name}
                            </p>

                            <p
                              className={`text-[10px] mt-0.5 ${mutedClass}`}
                            >
                              Assigned Student
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* STUDENT ID */}

                      <td
                        className={`px-5 py-4 text-xs ${mutedClass}`}
                      >
                        {student.studentId}
                      </td>

                      {/* COMPANY */}

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                              darkMode
                                ? "bg-slate-800 text-slate-300"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            🏢
                          </div>

                          <div>
                            <p
                              className={`text-xs font-semibold ${
                                darkMode
                                  ? "text-slate-200"
                                  : "text-slate-800"
                              }`}
                            >
                              {student.company}
                            </p>

                            <p
                              className={`text-[10px] mt-0.5 ${mutedClass}`}
                            >
                              Internship Company
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* STATUS */}

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-md text-[10px] font-bold ${
                            student.status ===
                            "Active"
                              ? darkMode
                                ? "bg-emerald-950 text-emerald-400"
                                : "bg-emerald-50 text-emerald-700"
                              : darkMode
                              ? "bg-amber-950 text-amber-400"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {student.status}
                        </span>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>

          {/* MOBILE NOTE */}

          <div
            className={`px-5 py-3 border-t text-[10px] md:hidden ${
              darkMode
                ? "border-slate-700 text-slate-500"
                : "border-slate-200 text-slate-400"
            }`}
          >
            Swipe horizontally to view all
            student information.
          </div>
        </section>
      </div>
    </div>
  );
};

export default Profile;

