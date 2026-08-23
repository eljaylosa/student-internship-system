import React, { useEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabaseStudent } from "../../supabaseClient";

const PROFILE_PHOTO_BUCKET = "profile-photos";
const RESUME_BUCKET = "verification-documents";

const Profile = () => {
  const { darkMode } = useOutletContext();

  const photoInputRef = useRef(null);
  const resumeInputRef = useRef(null);

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [userId, setUserId] = useState(null);

  // =========================================
  // PROFILE INFORMATION
  // =========================================

  const emptyProfile = {
    fullName: "",
    studentId: "",
    email: "",
    phone: "",
    address: "",
    emergencyContact: "",
  };

  const [profile, setProfile] = useState(emptyProfile);
  const [originalProfile, setOriginalProfile] = useState(emptyProfile);

  // =========================================
  // ACADEMIC RECORDS
  // =========================================

  const emptyAcademicRecords = {
    school: "",
    schoolId: null,
    program: "",
    yearLevel: "",
    department: "",
  };

  const [academicRecords, setAcademicRecords] = useState(emptyAcademicRecords);

  const [originalAcademicRecords, setOriginalAcademicRecords] =
    useState(emptyAcademicRecords);

  // =========================================
  // UPLOAD STATES
  // =========================================

  const [profilePhoto, setProfilePhoto] = useState(null);
  const [profilePhotoPath, setProfilePhotoPath] = useState(null);

  const [resume, setResume] = useState(null);
  const [resumePath, setResumePath] = useState(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isResumeOpening, setIsResumeOpening] = useState(false);

  // =========================================
  // LOAD STUDENT PROFILE
  // =========================================

  useEffect(() => {
    loadStudentProfile();
  }, []);

  const loadStudentProfile = async () => {
    try {
      setIsLoading(true);

      const {
        data: { user },
        error: authError,
      } = await supabaseStudent.auth.getUser();

      if (authError) {
        throw authError;
      }

      if (!user) {
        throw new Error("No authenticated user found.");
      }

      setUserId(user.id);

      // -----------------------------------------
      // GET USER INFORMATION
      // -----------------------------------------

      const { data: userData, error: userError } = await supabaseStudent
        .from("users")
        .select("id, email, first_name, middle_name, last_name, status")
        .eq("id", user.id)
        .single();

      if (userError) {
        throw userError;
      }

      // -----------------------------------------
      // GET STUDENT INFORMATION
      //
      // students.school_id
      //        ↓
      // schools.id
      //        ↓
      // schools.name
      // -----------------------------------------

      const { data: studentData, error: studentError } = await supabaseStudent
        .from("students")
        .select(
          `
              id,
              student_id,
              school_id,
              phone,
              address,
              emergency_contact,
              program,
              year_level,
              department,
              profile_photo_url,
              resume_url,
              resume_name,
              schools (
                id,
                name,
                code
              )
            `
        )
        .eq("id", user.id)
        .maybeSingle();

      if (studentError) {
        throw studentError;
      }

      // -----------------------------------------
      // FULL NAME
      // -----------------------------------------

      const fullName = [
        userData.first_name,
        userData.middle_name,
        userData.last_name,
      ]
        .filter(Boolean)
        .join(" ");

      const loadedProfile = {
        fullName: fullName || "",
        studentId: studentData?.student_id || "",
        email: userData.email || "",
        phone: studentData?.phone || "",
        address: studentData?.address || "",
        emergencyContact: studentData?.emergency_contact || "",
      };

      // -----------------------------------------
      // ACADEMIC RECORDS
      // -----------------------------------------

      const loadedAcademicRecords = {
        school: studentData?.schools?.name || "",
        schoolId: studentData?.school_id || null,
        program: studentData?.program || "",
        yearLevel: studentData?.year_level || "",
        department: studentData?.department || "",
      };

      setProfile(loadedProfile);
      setOriginalProfile(loadedProfile);

      setAcademicRecords(loadedAcademicRecords);
      setOriginalAcademicRecords(loadedAcademicRecords);

      // -----------------------------------------
      // PROFILE PHOTO
      // -----------------------------------------

      if (studentData?.profile_photo_url) {
        setProfilePhotoPath(studentData.profile_photo_url);

        await loadStoragePreview(studentData.profile_photo_url, "profile");
      }

      // -----------------------------------------
      // RESUME
      // -----------------------------------------

      if (studentData?.resume_url) {
        setResumePath(studentData.resume_url);

        setResume({
          name: studentData.resume_name || "Current Resume",
          size: 0,
          type: "",
          existing: true,
        });
      }
    } catch (error) {
      console.error("Error loading student profile:", error);

      alert(error.message || "Unable to load your profile information.");
    } finally {
      setIsLoading(false);
    }
  };

  // =========================================
  // STORAGE PATH HELPER
  // =========================================

  const getStoragePath = (path, bucket) => {
    if (!path) return null;

    let storagePath = path;

    if (path.startsWith("http")) {
      const publicMarker = `/storage/v1/object/public/${bucket}/`;

      if (path.includes(publicMarker)) {
        storagePath = path.split(publicMarker)[1];
      } else {
        const signedMarker = `/storage/v1/object/sign/${bucket}/`;

        if (path.includes(signedMarker)) {
          storagePath = path.split(signedMarker)[1].split("?")[0];
        }
      }
    }

    return decodeURIComponent(storagePath);
  };

  // =========================================
  // STORAGE PREVIEW
  // =========================================

  const loadStoragePreview = async (path, type) => {
    try {
      if (!path) return;

      const bucket = type === "profile" ? PROFILE_PHOTO_BUCKET : RESUME_BUCKET;

      const storagePath = getStoragePath(path, bucket);

      if (!storagePath) return;

      const { data, error } = await supabaseStudent.storage
        .from(bucket)
        .createSignedUrl(storagePath, 60 * 60);

      if (error) {
        console.error("Error creating signed URL:", error);

        return;
      }

      if (type === "profile" && data?.signedUrl) {
        setProfilePhoto(data.signedUrl);
      }
    } catch (error) {
      console.error("Storage preview error:", error);
    }
  };

  // =========================================
  // PROFILE HANDLERS
  // =========================================

  const handleProfileChange = (field, value) => {
    setProfile((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAcademicChange = (field, value) => {
    // School is intentionally not editable.
    if (field === "school" || field === "schoolId") {
      return;
    }

    setAcademicRecords((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // =========================================
  // SAVE PROFILE
  // =========================================

  const handleSaveProfile = async () => {
    if (!userId) {
      alert("Unable to identify your account.");
      return;
    }

    try {
      setIsSaving(true);

      // -----------------------------------------
      // UPDATE USERS
      // -----------------------------------------

      const nameParts = profile.fullName.trim().split(/\s+/).filter(Boolean);

      const firstName = nameParts[0] || "";

      const lastName =
        nameParts.length > 1 ? nameParts[nameParts.length - 1] : "";

      const middleName =
        nameParts.length > 2 ? nameParts.slice(1, -1).join(" ") : "";

      const { error: userError } = await supabaseStudent
        .from("users")
        .update({
          first_name: firstName,
          middle_name: middleName,
          last_name: lastName,
        })
        .eq("id", userId);

      if (userError) {
        throw userError;
      }

      // -----------------------------------------
      // UPDATE STUDENT
      //
      // IMPORTANT:
      // Do NOT use upsert here.
      //
      // The student record was already created
      // during admin approval.
      //
      // Using UPDATE avoids requiring an INSERT
      // RLS policy for the student.
      // -----------------------------------------

      const studentPayload = {
        student_id: profile.studentId || null,

        phone: profile.phone || null,

        address: profile.address || null,

        emergency_contact: profile.emergencyContact || null,

        // Academic Records
        //
        // school_id is intentionally NOT changed.
        // The student's registered school is controlled
        // by the registration/approval process.
        program: academicRecords.program || null,

        year_level: academicRecords.yearLevel || null,

        department: academicRecords.department || null,

        profile_photo_url: profilePhotoPath || null,

        resume_url: resumePath || null,

        resume_name: resume?.name || null,

        updated_at: new Date().toISOString(),
      };

      const { data: updatedStudent, error: studentError } =
        await supabaseStudent
          .from("students")
          .update(studentPayload)
          .eq("id", userId)
          .select("id")
          .maybeSingle();

      if (studentError) {
        throw studentError;
      }

      if (!updatedStudent) {
        throw new Error("Your student record could not be updated.");
      }

      // -----------------------------------------
      // UPDATE LOCAL ORIGINAL VALUES
      // -----------------------------------------

      setOriginalProfile({
        ...profile,
      });

      setOriginalAcademicRecords({
        ...academicRecords,
      });

      setIsEditing(false);

      alert("Profile information saved successfully.");
    } catch (error) {
      console.error("Error saving student profile:", error);

      alert(error.message || "Unable to save your profile information.");
    } finally {
      setIsSaving(false);
    }
  };

  // =========================================
  // CANCEL EDIT
  // =========================================

  const handleCancelEdit = () => {
    setProfile(originalProfile);
    setAcademicRecords(originalAcademicRecords);

    setIsEditing(false);
  };

  // =========================================
  // PROFILE PHOTO
  // =========================================

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Profile photo must be less than 5MB.");
      return;
    }

    if (!userId) {
      alert("Unable to identify your account.");
      return;
    }

    try {
      setIsSaving(true);

      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";

      const storagePath = `profile-photos/${userId}/profile-photo.${extension}`;

      // -----------------------------------------
      // UPLOAD PROFILE PHOTO
      // -----------------------------------------

      const { error: uploadError } = await supabaseStudent.storage
        .from(PROFILE_PHOTO_BUCKET)
        .upload(storagePath, file, {
          upsert: true,
          contentType: file.type,
        });

      if (uploadError) {
        throw uploadError;
      }

      // -----------------------------------------
      // SAVE STORAGE PATH
      //
      // UPDATE instead of UPSERT.
      // -----------------------------------------

      const { error: updateError } = await supabaseStudent
        .from("students")
        .update({
          profile_photo_url: storagePath,

          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (updateError) {
        throw updateError;
      }

      setProfilePhotoPath(storagePath);

      // -----------------------------------------
      // REFRESH SIGNED PREVIEW
      // -----------------------------------------

      const { data: signedData, error: signedError } =
        await supabaseStudent.storage
          .from(PROFILE_PHOTO_BUCKET)
          .createSignedUrl(storagePath, 60 * 60);

      if (!signedError && signedData?.signedUrl) {
        setProfilePhoto(signedData.signedUrl);
      }

      alert("Profile photo updated successfully.");
    } catch (error) {
      console.error("Profile photo upload error:", error);

      alert(error.message || "Unable to upload your profile photo.");
    } finally {
      setIsSaving(false);

      if (photoInputRef.current) {
        photoInputRef.current.value = "";
      }
    }
  };

  // =========================================
  // RESUME UPLOAD
  // =========================================

  const handleResumeChange = async (file) => {
    if (!file) return;

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.type)) {
      alert("Please upload a PDF, DOC, or DOCX file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert("Resume must be less than 10MB.");
      return;
    }

    if (!userId) {
      alert("Unable to identify your account.");
      return;
    }

    try {
      setIsSaving(true);

      const extension = file.name.split(".").pop()?.toLowerCase() || "pdf";

      const storagePath = `resumes/${userId}/resume.${extension}`;

      // -----------------------------------------
      // REMOVE OLD RESUME IF EXTENSION CHANGED
      // -----------------------------------------

      if (resumePath) {
        const oldPath = getStoragePath(resumePath, RESUME_BUCKET);

        if (oldPath && oldPath !== storagePath) {
          const { error: removeError } = await supabaseStudent.storage
            .from(RESUME_BUCKET)
            .remove([oldPath]);

          if (removeError) {
            console.warn("Unable to remove old resume:", removeError.message);
          }
        }
      }

      // -----------------------------------------
      // UPLOAD NEW RESUME
      // -----------------------------------------

      const { error: uploadError } = await supabaseStudent.storage
        .from(RESUME_BUCKET)
        .upload(storagePath, file, {
          upsert: true,
          contentType: file.type,
        });

      if (uploadError) {
        throw uploadError;
      }

      // -----------------------------------------
      // SAVE RESUME PATH + NAME
      //
      // UPDATE instead of UPSERT.
      // -----------------------------------------

      const { error: updateError } = await supabaseStudent
        .from("students")
        .update({
          resume_url: storagePath,

          resume_name: file.name,

          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (updateError) {
        throw updateError;
      }

      setResumePath(storagePath);

      setResume({
        name: file.name,
        size: file.size,
        type: file.type,
        existing: false,
      });

      alert("Resume uploaded successfully.");
    } catch (error) {
      console.error("Resume upload error:", error);

      alert(error.message || "Unable to upload your resume.");
    } finally {
      setIsSaving(false);

      if (resumeInputRef.current) {
        resumeInputRef.current.value = "";
      }
    }
  };

  // =========================================
  // RESUME INPUT
  // =========================================

  const handleResumeInput = (e) => {
    const file = e.target.files?.[0];

    if (file) {
      handleResumeChange(file);
    }
  };

  // =========================================
  // OPEN RESUME
  // =========================================

  const openResume = async () => {
    if (!resumePath) {
      alert("No resume has been uploaded yet.");
      return;
    }

    try {
      setIsResumeOpening(true);

      const storagePath = getStoragePath(resumePath, RESUME_BUCKET);

      if (!storagePath) {
        throw new Error("Invalid resume storage path.");
      }

      const { data, error } = await supabaseStudent.storage
        .from(RESUME_BUCKET)
        .createSignedUrl(storagePath, 60 * 60);

      if (error) {
        throw error;
      }

      if (!data?.signedUrl) {
        throw new Error("Unable to generate resume link.");
      }

      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error("Open resume error:", error);

      alert(error.message || "Unable to open your resume.");
    } finally {
      setIsResumeOpening(false);
    }
  };

  // =========================================
  // DOWNLOAD RESUME
  // =========================================

  const downloadResume = async () => {
    if (!resumePath) {
      alert("No resume has been uploaded yet.");
      return;
    }

    try {
      setIsResumeOpening(true);

      const storagePath = getStoragePath(resumePath, RESUME_BUCKET);

      if (!storagePath) {
        throw new Error("Invalid resume storage path.");
      }

      const { data, error } = await supabaseStudent.storage
        .from(RESUME_BUCKET)
        .createSignedUrl(storagePath, 60 * 60);

      if (error) {
        throw error;
      }

      if (!data?.signedUrl) {
        throw new Error("Unable to generate download link.");
      }

      const response = await fetch(data.signedUrl);

      if (!response.ok) {
        throw new Error("Unable to download the resume.");
      }

      const blob = await response.blob();

      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = blobUrl;

      link.download = resume?.name || "resume";

      document.body.appendChild(link);

      link.click();

      link.remove();

      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download resume error:", error);

      alert(error.message || "Unable to download your resume.");
    } finally {
      setIsResumeOpening(false);
    }
  };

  // =========================================
  // DRAG & DROP
  // =========================================

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();

    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];

    if (file) {
      handleResumeChange(file);
    }
  };

  // =========================================
  // THEME CLASSES
  // =========================================

  const cardClass = darkMode
    ? "bg-slate-900 border-slate-700"
    : "bg-white border-slate-200";

  const headingClass = darkMode ? "text-white" : "text-slate-900";

  const mutedClass = darkMode ? "text-slate-400" : "text-slate-500";

  const labelClass = darkMode ? "text-slate-300" : "text-slate-500";

  const inputClass = (editing = false) =>
    `w-full px-4 py-3 rounded-xl border text-sm outline-none transition ${
      editing
        ? darkMode
          ? "bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
          : "bg-white border-slate-300 text-slate-900 focus:ring-2 focus:ring-slate-200"
        : darkMode
        ? "bg-slate-800 border-slate-700 text-slate-300"
        : "bg-slate-50 border-slate-200 text-slate-600"
    }`;

  // =========================================
  // LOADING
  // =========================================

  if (isLoading) {
    return (
      <div className="p-5 md:p-6 lg:p-8 max-w-[1400px] mx-auto">
        <div className={`border rounded-2xl p-10 text-center ${cardClass}`}>
          <div className="text-2xl mb-3">⏳</div>

          <p className={`font-semibold ${headingClass}`}>
            Loading your profile...
          </p>

          <p className={`text-sm mt-1 ${mutedClass}`}>
            Please wait while we retrieve your information.
          </p>
        </div>
      </div>
    );
  }

  // =========================================
  // RENDER
  // =========================================

  return (
    <div className="p-5 md:p-6 lg:p-8 max-w-[1400px] mx-auto">
      {/* PAGE HEADER */}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <p className="text-xs uppercase tracking-widest font-bold text-blue-600 mb-1">
            Account
          </p>

          <h1
            className={`text-2xl md:text-3xl font-black tracking-tight ${headingClass}`}
          >
            My Profile
          </h1>

          <p className={`text-sm mt-1 ${mutedClass}`}>
            View and manage your student information.
          </p>
        </div>

        {!isEditing ? (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            disabled={isSaving}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition shadow-sm ${
              darkMode
                ? "bg-white text-slate-900 hover:bg-slate-200"
                : "bg-slate-900 text-white hover:bg-slate-800"
            } disabled:opacity-50`}
          >
            Edit Profile
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCancelEdit}
              disabled={isSaving}
              className={`px-5 py-2.5 rounded-xl border text-sm font-semibold transition ${
                darkMode
                  ? "border-slate-600 bg-slate-800 text-slate-300 hover:bg-slate-700"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              } disabled:opacity-50`}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSaveProfile}
              disabled={isSaving}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition shadow-sm ${
                darkMode
                  ? "bg-white text-slate-900 hover:bg-slate-200"
                  : "bg-slate-900 text-white hover:bg-slate-800"
              } disabled:opacity-50`}
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </div>

      {/* PROFILE + PERSONAL DETAILS */}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        {/* PROFILE PHOTO */}

        <section className={`border rounded-2xl p-6 ${cardClass}`}>
          <div className="mb-5">
            <h2 className={`font-bold text-lg ${headingClass}`}>
              Profile Photo
            </h2>

            <p className={`text-xs mt-1 ${mutedClass}`}>Your profile picture</p>
          </div>

          <div className="flex flex-col items-center">
            <div
              className={`w-32 h-32 rounded-2xl border overflow-hidden flex items-center justify-center shadow-sm ${
                darkMode
                  ? "border-slate-700 bg-slate-800"
                  : "border-slate-200 bg-slate-100"
              }`}
            >
              {profilePhoto ? (
                <img
                  src={profilePhoto}
                  alt="Student profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center">
                  <div
                    className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center text-3xl ${
                      darkMode ? "bg-slate-700" : "bg-slate-200"
                    }`}
                  >
                    👤
                  </div>

                  <p className={`text-[10px] mt-2 ${mutedClass}`}>No Photo</p>
                </div>
              )}
            </div>

            <input
              ref={photoInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handlePhotoChange}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              disabled={isSaving}
              className={`mt-5 px-8 py-2.5 rounded-xl text-xs font-semibold transition ${
                darkMode
                  ? "bg-white text-slate-900 hover:bg-slate-200"
                  : "bg-slate-900 text-white hover:bg-slate-800"
              } disabled:opacity-50`}
            >
              {profilePhoto ? "Change Photo" : "Upload Photo"}
            </button>

            <p className={`text-[11px] mt-3 text-center ${mutedClass}`}>
              JPG, PNG or WEBP • Max 5MB
            </p>
          </div>
        </section>

        {/* PERSONAL DETAILS */}

        <section
          className={`xl:col-span-2 border rounded-2xl p-6 ${cardClass}`}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className={`font-bold text-lg ${headingClass}`}>
                Personal Details
              </h2>

              <p className={`text-xs mt-1 ${mutedClass}`}>
                Your registered student information
              </p>
            </div>

            {isEditing && (
              <span
                className={`text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full ${
                  darkMode
                    ? "bg-blue-950 text-blue-400"
                    : "bg-blue-50 text-blue-600"
                }`}
              >
                Editing
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* FULL NAME */}

            <div>
              <label className={`block text-xs font-bold mb-2 ${labelClass}`}>
                Full Name
              </label>

              <input
                type="text"
                value={profile.fullName}
                disabled={!isEditing}
                onChange={(e) =>
                  handleProfileChange("fullName", e.target.value)
                }
                className={inputClass(isEditing)}
              />
            </div>

            {/* STUDENT ID */}

            <div>
              <label className={`block text-xs font-bold mb-2 ${labelClass}`}>
                Student ID
              </label>

              <input
                type="text"
                value={profile.studentId}
                disabled
                className={inputClass(false)}
              />

              <p className={`text-[10px] mt-1.5 ${mutedClass}`}>
                Student ID cannot be changed.
              </p>
            </div>

            {/* EMAIL */}

            <div>
              <label className={`block text-xs font-bold mb-2 ${labelClass}`}>
                Email Address
              </label>

              <input
                type="email"
                value={profile.email}
                disabled
                className={inputClass(false)}
              />

              <p className={`text-[10px] mt-1.5 ${mutedClass}`}>
                Email is managed by your account.
              </p>
            </div>

            {/* PHONE */}

            <div>
              <label className={`block text-xs font-bold mb-2 ${labelClass}`}>
                Phone Number
              </label>

              <input
                type="text"
                value={profile.phone}
                disabled={!isEditing}
                onChange={(e) => handleProfileChange("phone", e.target.value)}
                className={inputClass(isEditing)}
              />
            </div>

            {/* ADDRESS */}

            <div>
              <label className={`block text-xs font-bold mb-2 ${labelClass}`}>
                Address
              </label>

              <input
                type="text"
                value={profile.address}
                disabled={!isEditing}
                onChange={(e) => handleProfileChange("address", e.target.value)}
                className={inputClass(isEditing)}
              />
            </div>

            {/* EMERGENCY CONTACT */}

            <div>
              <label className={`block text-xs font-bold mb-2 ${labelClass}`}>
                Emergency Contact
              </label>

              <input
                type="text"
                value={profile.emergencyContact}
                disabled={!isEditing}
                onChange={(e) =>
                  handleProfileChange("emergencyContact", e.target.value)
                }
                className={inputClass(isEditing)}
              />
            </div>
          </div>
        </section>
      </div>

      {/* ACADEMIC RECORDS */}

      <section className={`border rounded-2xl p-6 mb-6 ${cardClass}`}>
        <div className="mb-5">
          <h2 className={`font-bold text-lg ${headingClass}`}>
            Academic Records
          </h2>

          <p className={`text-xs mt-1 ${mutedClass}`}>
            Current academic information
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* SCHOOL */}

          <div
            className={`border rounded-xl p-4 ${
              darkMode
                ? "border-slate-700 bg-slate-800"
                : "border-slate-200 bg-slate-50"
            }`}
          >
            <p
              className={`text-[10px] uppercase tracking-wider font-bold mb-2 ${mutedClass}`}
            >
              School
            </p>

            <p className={`text-sm font-semibold ${headingClass}`}>
              {academicRecords.school || "Not provided"}
            </p>

            <p className={`text-[10px] mt-2 ${mutedClass}`}>
              School is based on your registration record.
            </p>
          </div>

          {/* PROGRAM */}

          <div
            className={`border rounded-xl p-4 ${
              darkMode
                ? "border-slate-700 bg-slate-800"
                : "border-slate-200 bg-slate-50"
            }`}
          >
            <p
              className={`text-[10px] uppercase tracking-wider font-bold mb-2 ${mutedClass}`}
            >
              Program
            </p>

            {isEditing ? (
              <input
                type="text"
                value={academicRecords.program}
                onChange={(e) =>
                  handleAcademicChange("program", e.target.value)
                }
                placeholder="Enter program"
                className={inputClass(true)}
              />
            ) : (
              <p className={`text-sm font-semibold ${headingClass}`}>
                {academicRecords.program || "Not provided"}
              </p>
            )}
          </div>

          {/* YEAR LEVEL */}

          <div
            className={`border rounded-xl p-4 ${
              darkMode
                ? "border-slate-700 bg-slate-800"
                : "border-slate-200 bg-slate-50"
            }`}
          >
            <p
              className={`text-[10px] uppercase tracking-wider font-bold mb-2 ${mutedClass}`}
            >
              Year Level
            </p>

            {isEditing ? (
              <input
                type="text"
                value={academicRecords.yearLevel}
                onChange={(e) =>
                  handleAcademicChange("yearLevel", e.target.value)
                }
                placeholder="Enter year level"
                className={inputClass(true)}
              />
            ) : (
              <p className={`text-sm font-semibold ${headingClass}`}>
                {academicRecords.yearLevel || "Not provided"}
              </p>
            )}
          </div>

          {/* DEPARTMENT */}

          <div
            className={`border rounded-xl p-4 ${
              darkMode
                ? "border-slate-700 bg-slate-800"
                : "border-slate-200 bg-slate-50"
            }`}
          >
            <p
              className={`text-[10px] uppercase tracking-wider font-bold mb-2 ${mutedClass}`}
            >
              Department
            </p>

            {isEditing ? (
              <input
                type="text"
                value={academicRecords.department}
                onChange={(e) =>
                  handleAcademicChange("department", e.target.value)
                }
                placeholder="Enter department"
                className={inputClass(true)}
              />
            ) : (
              <p className={`text-sm font-semibold ${headingClass}`}>
                {academicRecords.department || "Not provided"}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* RESUME / CV */}

      <section className={`border rounded-2xl p-6 ${cardClass}`}>
        <div className="mb-5">
          <h2 className={`font-bold text-lg ${headingClass}`}>Resume / CV</h2>

          <p className={`text-xs mt-1 ${mutedClass}`}>
            Upload your latest resume for internship applications.
          </p>
        </div>

        <input
          ref={resumeInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={handleResumeInput}
          className="hidden"
        />

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => resumeInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 md:p-10 text-center cursor-pointer transition ${
            isDragging
              ? "border-blue-500 bg-blue-950/30"
              : darkMode
              ? "border-slate-700 bg-slate-800 hover:bg-slate-750 hover:border-slate-600"
              : "border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300"
          }`}
        >
          {resume ? (
            <>
              <div
                className={`w-12 h-12 mx-auto rounded-xl flex items-center justify-center text-xl mb-3 ${
                  darkMode
                    ? "bg-emerald-950 text-emerald-400"
                    : "bg-emerald-100 text-emerald-600"
                }`}
              >
                ✓
              </div>

              <p className={`font-semibold text-sm break-all ${headingClass}`}>
                {resume.name}
              </p>

              {resume.size > 0 && (
                <p className={`text-xs mt-1 ${mutedClass}`}>
                  {(resume.size / 1024 / 1024).toFixed(2)} MB
                </p>
              )}

              {resume.existing && (
                <p className={`text-xs mt-1 ${mutedClass}`}>Uploaded resume</p>
              )}

              <p className="text-xs text-blue-500 font-semibold mt-3">
                Click to replace file
              </p>
            </>
          ) : (
            <>
              <div
                className={`w-12 h-12 mx-auto rounded-xl flex items-center justify-center text-xl mb-3 ${
                  darkMode ? "bg-slate-700" : "bg-slate-200"
                }`}
              >
                📄
              </div>

              <p className={`font-semibold text-sm ${headingClass}`}>
                Drag & Drop to Upload
              </p>

              <p className={`text-xs mt-1 ${mutedClass}`}>
                or click anywhere in this area to browse
              </p>

              <p className={`text-[10px] mt-3 ${mutedClass}`}>
                PDF, DOC, DOCX • Maximum 10MB
              </p>
            </>
          )}
        </div>

        {resume && resumePath && (
          <div className="flex flex-col sm:flex-row justify-center gap-2 mt-4">
            <button
              type="button"
              onClick={openResume}
              disabled={isResumeOpening || isSaving}
              className={`px-6 py-3 rounded-xl text-xs font-bold transition disabled:opacity-50 ${
                darkMode
                  ? "bg-white text-slate-900 hover:bg-slate-200"
                  : "bg-slate-900 text-white hover:bg-slate-800"
              }`}
            >
              {isResumeOpening ? "Opening..." : "View Resume"}
            </button>

            <button
              type="button"
              onClick={downloadResume}
              disabled={isResumeOpening || isSaving}
              className={`px-6 py-3 rounded-xl border text-xs font-bold transition disabled:opacity-50 ${
                darkMode
                  ? "border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {isResumeOpening ? "Processing..." : "Download Resume"}
            </button>

            <button
              type="button"
              onClick={() => resumeInputRef.current?.click()}
              disabled={isSaving}
              className={`px-6 py-3 rounded-xl border text-xs font-bold transition disabled:opacity-50 ${
                darkMode
                  ? "border-blue-900 text-blue-400 hover:bg-blue-950"
                  : "border-blue-200 text-blue-600 hover:bg-blue-50"
              }`}
            >
              Replace Resume
            </button>
          </div>
        )}

        {!resume && (
          <div className="flex justify-center mt-4">
            <button
              type="button"
              onClick={() => resumeInputRef.current?.click()}
              disabled={isSaving}
              className={`px-10 py-3 rounded-xl text-xs font-bold transition ${
                darkMode
                  ? "bg-white text-slate-900 hover:bg-slate-200"
                  : "bg-slate-900 text-white hover:bg-slate-800"
              } disabled:opacity-50`}
            >
              Upload Resume
            </button>
          </div>
        )}
      </section>
    </div>
  );
};

export default Profile;
