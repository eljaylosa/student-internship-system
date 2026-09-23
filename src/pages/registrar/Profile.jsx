import React, { useEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabaseRegistrar } from "../../supabaseClient";

// =============================================================
// PROFILE PHOTO STORAGE
// =============================================================

const PROFILE_PHOTO_BUCKET = "profile-photos";
const PROFILE_PHOTO_FOLDER = "registrars";

// =============================================================
// ASSIGNED STUDENTS PAGINATION
// =============================================================

const ASSIGNED_STUDENTS_PER_PAGE = 5;

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

  const [assignedStudents, setAssignedStudents] = useState([]);
  const [assignedStudentsLoading, setAssignedStudentsLoading] = useState(true);

  const [assignedStudentsPage, setAssignedStudentsPage] = useState(1);

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
        storagePath = decodeURIComponent(storedValue.split(publicMarker)[1]);
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
  // LOAD ASSIGNED STUDENTS
  // ===========================================================

  const loadAssignedStudents = async (schoolId) => {
    setAssignedStudentsLoading(true);

    try {
      if (!schoolId) {
        setAssignedStudents([]);
        setAssignedStudentsPage(1);
        return;
      }

      // =======================================================
      // GET STUDENTS FROM REGISTRAR'S SCHOOL
      // =======================================================

      const { data: studentData, error: studentError } = await supabaseRegistrar
        .from("students")
        .select(
          `
              id,
              student_id,
              school_id,
              profile_photo_url,
              created_at,
              users (
                id,
                first_name,
                middle_name,
                last_name
              )
            `
        )
        .eq("school_id", schoolId)
        .order("created_at", { ascending: false });

      if (studentError) {
        throw studentError;
      }

      if (!studentData?.length) {
        setAssignedStudents([]);
        setAssignedStudentsPage(1);

        console.log("👥 No students found for registrar school:", schoolId);

        return;
      }

      const studentIds = studentData.map((student) => student.id);

      // =======================================================
      // CREATE SIGNED PROFILE PHOTO URLS
      // =======================================================

      const profilePhotoEntries = await Promise.all(
        studentData.map(async (student) => ({
          id: student.id,
          url: await createProfilePhotoUrl(student.profile_photo_url),
        }))
      );

      const profilePhotoMap = new Map(
        profilePhotoEntries.map((entry) => [entry.id, entry.url])
      );

      // =======================================================
      // GET INTERNSHIP ASSIGNMENTS
      // =======================================================

      const { data: assignmentData, error: assignmentError } =
        await supabaseRegistrar
          .from("assignments")
          .select(
            `
              id,
              student_id,
              company_id,
              status,
              start_date,
              end_date,
              deployed_at,
              updated_at,
              companies (
                id,
                company_name
              )
            `
          )
          .in("student_id", studentIds)
          .order("updated_at", { ascending: false });

      if (assignmentError) {
        throw assignmentError;
      }

      // =======================================================
      // LATEST ASSIGNMENT PER STUDENT
      // =======================================================

      const latestAssignmentByStudent = new Map();

      (assignmentData || []).forEach((assignment) => {
        if (!latestAssignmentByStudent.has(assignment.student_id)) {
          latestAssignmentByStudent.set(assignment.student_id, assignment);
        }
      });

      // =======================================================
      // GET CURRENT APPLICATIONS
      // =======================================================

      const { data: applicationData, error: applicationError } =
        await supabaseRegistrar
          .from("applications")
          .select(
            `
              id,
              student_id,
              status,
              updated_at,
              created_at
            `
          )
          .in("student_id", studentIds)
          .order("updated_at", { ascending: false });

      if (applicationError) {
        throw applicationError;
      }

      // =======================================================
      // LATEST APPLICATION PER STUDENT
      // =======================================================

      const latestApplicationByStudent = new Map();

      (applicationData || []).forEach((application) => {
        if (!latestApplicationByStudent.has(application.student_id)) {
          latestApplicationByStudent.set(application.student_id, application);
        }
      });

      // =======================================================
      // FORMAT STUDENTS
      // =======================================================

      const formattedStudents = studentData.map((student) => {
        const userRecord = Array.isArray(student.users)
          ? student.users[0]
          : student.users;

        const studentName = [
          userRecord?.first_name,
          userRecord?.middle_name,
          userRecord?.last_name,
        ]
          .filter(Boolean)
          .join(" ")
          .trim();

        const assignment = latestAssignmentByStudent.get(student.id);
        const application = latestApplicationByStudent.get(student.id);

        const assignmentStatus = assignment?.status?.toLowerCase();
        const applicationStatus = application?.status?.toLowerCase();

        // =====================================================
        // SAME STATUS LOGIC AS MAIN STUDENT LISTS
        // =====================================================

        let status = "Not Started";

        if (assignmentStatus === "active" || assignmentStatus === "suspended") {
          // Suspended is intentionally displayed as Active
          // to match the main Student Lists.
          status = "Active";
        } else if (assignmentStatus === "completed") {
          status = "Completed";
        } else if (assignmentStatus === "terminated") {
          status = "Terminated";
        } else if (assignmentStatus === "pending") {
          status = "Pending";
        } else if (
          applicationStatus === "submitted" ||
          applicationStatus === "under_review" ||
          applicationStatus === "info_requested" ||
          applicationStatus === "approved" ||
          applicationStatus === "accepted"
        ) {
          // Application-stage students are still pending assignment.
          status = "Pending";
        }

        return {
          id: student.id,

          name: studentName || "Unknown Student",

          studentId: student.student_id || "N/A",

          profilePhotoUrl: profilePhotoMap.get(student.id) || null,

          company: assignment?.companies?.company_name || "Not assigned",

          status,

          schoolId: student.school_id,

          assignmentStatus: assignment?.status || null,

          applicationStatus: application?.status || null,

          assignmentId: assignment?.id || null,

          startDate: assignment?.start_date || null,

          endDate: assignment?.end_date || null,
        };
      });

      setAssignedStudents(formattedStudents);

      // Always start pagination at page 1 after loading.
      setAssignedStudentsPage(1);

      console.log(
        "👥 School-scoped assigned students loaded:",
        formattedStudents
      );
    } catch (error) {
      console.error("❌ Load assigned students error:", error);

      setAssignedStudents([]);
      setAssignedStudentsPage(1);

      alert(error.message || "Unable to load your assigned students.");
    } finally {
      setAssignedStudentsLoading(false);
    }
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

      const { data: userData, error: userError } = await supabaseRegistrar
        .from("users")
        .select("id, email, role, first_name, middle_name, last_name, status")
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

      let schoolName = "";

      if (registrarData.school_id) {
        const { data: schoolData, error: schoolError } = await supabaseRegistrar
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

      // Load school-scoped students.
      await loadAssignedStudents(registrarData.school_id);

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

      const nameParts = profileData.name.trim().split(/\s+/);

      const firstName = nameParts[0] || "";

      const lastName =
        nameParts.length > 1 ? nameParts[nameParts.length - 1] : "";

      const middleName =
        nameParts.length > 2 ? nameParts.slice(1, -1).join(" ") : null;

      // =======================================================
      // UPDATE USERS
      // =======================================================

      const { data: updatedUsers, error: userError } = await supabaseRegistrar
        .from("users")
        .update({
          first_name: firstName,
          middle_name: middleName,
          last_name: lastName,
          email: profileData.email.trim(),
        })
        .eq("id", user.id)
        .select("id, email, role, first_name, middle_name, last_name, status");

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
      // UPDATE REGISTRAR
      // =======================================================

      const { data: updatedRegistrars, error: registrarError } =
        await supabaseRegistrar
          .from("registrars")
          .update({
            department: profileData.department.trim(),
            position: profileData.position.trim(),
            specialization: profileData.specialization.trim() || null,
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

      console.log("✅ Registrar record updated:", updatedRegistrar);

      // =======================================================
      // RELOAD SCHOOL NAME
      // =======================================================

      let schoolName = profileData.school;

      if (updatedRegistrar.school_id) {
        const { data: schoolData, error: schoolError } = await supabaseRegistrar
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
      // BUILD UPDATED PROFILE
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
        specialization: updatedRegistrar.specialization || "",

        phone: updatedRegistrar.phone || "",
        address: updatedRegistrar.address || "",
      };

      // =======================================================
      // UPDATE LOCAL STATE
      // =======================================================

      setProfileData(updatedProfile);
      setSavedProfile(updatedProfile);

      setRegistrar({
        ...updatedUser,
        ...updatedRegistrar,
        school_name: schoolName,
      });

      setIsEditing(false);

      console.log("✅ Final updated profile:", updatedProfile);

      alert("Profile updated successfully.");
    } catch (error) {
      console.error("❌ Save registrar profile error:", error);

      alert(error.message || "Unable to save your profile.");
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

      console.log("📷 Uploading profile photo for:", user.id);

      temporaryImageUrl = URL.createObjectURL(file);

      setProfilePhoto((previousPhoto) => {
        if (previousPhoto && previousPhoto.startsWith("blob:")) {
          URL.revokeObjectURL(previousPhoto);
        }

        return temporaryImageUrl;
      });

      const safeFileName = sanitizeFileName(file.name);

      const fileExtension = safeFileName.includes(".")
        ? safeFileName.substring(safeFileName.lastIndexOf("."))
        : "";

      const storagePath = `${PROFILE_PHOTO_FOLDER}/${
        user.id
      }/profile-${Date.now()}${fileExtension}`;

      console.log("📁 Profile photo storage path:", storagePath);

      const { error: uploadError } = await supabaseRegistrar.storage
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

      const { data: updatedRegistrars, error: photoUpdateError } =
        await supabaseRegistrar
          .from("registrars")
          .update({
            profile_photo_url: storagePath,
          })
          .eq("id", user.id)
          .select("id, profile_photo_url");

      if (photoUpdateError) {
        throw photoUpdateError;
      }

      if (!updatedRegistrars || updatedRegistrars.length === 0) {
        throw new Error(
          "The photo was uploaded, but your registrar profile could not be updated with the photo path. Please check your Supabase RLS policy."
        );
      }

      const updatedRegistrar = updatedRegistrars[0];

      console.log(
        "✅ Registrar photo path saved:",
        updatedRegistrar.profile_photo_url
      );

      const { data: signedUrlData, error: signedUrlError } =
        await supabaseRegistrar.storage
          .from(PROFILE_PHOTO_BUCKET)
          .createSignedUrl(storagePath, 60 * 60);

      if (signedUrlError) {
        throw signedUrlError;
      }

      if (!signedUrlData?.signedUrl) {
        throw new Error(
          "The photo was uploaded, but a display URL could not be generated."
        );
      }

      const signedUrl = signedUrlData.signedUrl;

      console.log("🔗 Signed profile photo URL created.");

      setRegistrar((previous) => ({
        ...(previous || {}),
        profile_photo_url: storagePath,
      }));

      setProfilePhoto(signedUrl);

      if (temporaryImageUrl && temporaryImageUrl.startsWith("blob:")) {
        URL.revokeObjectURL(temporaryImageUrl);
      }

      alert("Profile photo updated successfully.");
    } catch (error) {
      console.error("❌ Profile photo upload error:", error);

      if (temporaryImageUrl && temporaryImageUrl.startsWith("blob:")) {
        URL.revokeObjectURL(temporaryImageUrl);
      }

      try {
        const {
          data: { user },
        } = await supabaseRegistrar.auth.getUser();

        if (user) {
          const { data: currentRegistrar, error: reloadError } =
            await supabaseRegistrar
              .from("registrars")
              .select("profile_photo_url")
              .eq("id", user.id)
              .maybeSingle();

          if (reloadError) {
            console.error("❌ Failed to reload registrar photo:", reloadError);
          } else if (currentRegistrar?.profile_photo_url) {
            const restoredPhoto = await createProfilePhotoUrl(
              currentRegistrar.profile_photo_url
            );

            setProfilePhoto(restoredPhoto);
          } else {
            setProfilePhoto(null);
          }
        }
      } catch (reloadError) {
        console.error("❌ Failed to restore profile photo:", reloadError);

        setProfilePhoto(null);
      }

      alert(error.message || "Unable to upload your profile photo.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  // ===========================================================
  // ASSIGNED STUDENTS
  // ===========================================================

  const getAssignedStudentStatusClass = (status) => {
    switch (status) {
      case "Active":
        return darkMode
          ? "bg-emerald-950 text-emerald-400"
          : "bg-emerald-50 text-emerald-700";

      case "Completed":
        return darkMode
          ? "bg-blue-950 text-blue-400"
          : "bg-blue-50 text-blue-700";

      case "Terminated":
        return darkMode ? "bg-red-950 text-red-400" : "bg-red-50 text-red-700";

      case "Pending":
        return darkMode
          ? "bg-amber-950 text-amber-400"
          : "bg-amber-50 text-amber-700";

      case "Not Started":
      default:
        return darkMode
          ? "bg-slate-800 text-slate-400"
          : "bg-slate-100 text-slate-500";
    }
  };

  // ===========================================================
  // PAGINATION
  // ===========================================================

  const totalAssignedStudents = assignedStudents.length;

  const totalAssignedStudentPages = Math.max(
    1,
    Math.ceil(totalAssignedStudents / ASSIGNED_STUDENTS_PER_PAGE)
  );

  const assignedStudentsStartIndex =
    (assignedStudentsPage - 1) * ASSIGNED_STUDENTS_PER_PAGE;

  const assignedStudentsEndIndex =
    assignedStudentsStartIndex + ASSIGNED_STUDENTS_PER_PAGE;

  const paginatedAssignedStudents = assignedStudents.slice(
    assignedStudentsStartIndex,
    assignedStudentsEndIndex
  );

  const showingStart =
    totalAssignedStudents === 0 ? 0 : assignedStudentsStartIndex + 1;

  const showingEnd = Math.min(assignedStudentsEndIndex, totalAssignedStudents);

  const goToPreviousAssignedStudentsPage = () => {
    setAssignedStudentsPage((previousPage) => Math.max(1, previousPage - 1));
  };

  const goToNextAssignedStudentsPage = () => {
    setAssignedStudentsPage((previousPage) =>
      Math.min(totalAssignedStudentPages, previousPage + 1)
    );
  };

  // ===========================================================
  // THEME CLASSES
  // ===========================================================

  const pageHeadingClass = darkMode ? "text-slate-100" : "text-slate-900";

  const mutedClass = darkMode ? "text-slate-400" : "text-slate-500";

  const cardClass = darkMode
    ? "bg-slate-900 border-slate-700"
    : "bg-white border-slate-300";

  const panelClass = darkMode
    ? "bg-slate-800 border-slate-700"
    : "bg-slate-50 border-slate-200";

  const labelClass = darkMode ? "text-slate-400" : "text-slate-600";

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
          <div className="text-2xl mb-3">⏳</div>

          <h2 className={`font-bold ${pageHeadingClass}`}>
            Loading Profile...
          </h2>

          <p className={`text-sm mt-1 ${mutedClass}`}>
            Please wait while we load your registrar information.
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
              darkMode ? "text-slate-500" : "text-slate-400"
            }`}
          >
            Registrar Portal
          </p>

          <h1 className={`text-xl sm:text-2xl font-black ${pageHeadingClass}`}>
            My Profile
          </h1>

          <p className={`text-xs sm:text-sm mt-1 ${mutedClass}`}>
            View and manage your registrar information and assigned students.
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
                      .map((word) => word[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                )}
              </div>

              <div className="text-center mt-5">
                <h2 className={`text-base font-bold ${pageHeadingClass}`}>
                  {profileData.name}
                </h2>

                <p className={`text-xs mt-1 ${mutedClass}`}>
                  {profileData.position || "Registrar Adviser"}
                </p>

                {profileData.employeeId && (
                  <p className={`text-[10px] mt-1 ${mutedClass}`}>
                    Employee ID: {profileData.employeeId}
                  </p>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />

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

              <p className={`text-[10px] text-center mt-2 ${mutedClass}`}>
                JPG, PNG, GIF, or other image files up to 5MB.
              </p>
            </div>
          </section>

          {/* ===================================================
              REGISTRAR DETAILS
          =================================================== */}

          <section
            className={`border rounded-xl shadow-sm overflow-hidden ${cardClass}`}
          >
            <div
              className={`px-5 py-4 sm:px-6 sm:py-5 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
                darkMode ? "border-slate-700" : "border-slate-200"
              }`}
            >
              <div>
                <h2
                  className={`text-base sm:text-lg font-bold ${pageHeadingClass}`}
                >
                  Registrar Details
                </h2>

                <p className={`text-xs mt-1 ${mutedClass}`}>
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
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              )}
            </div>

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
                      handleProfileChange("name", e.target.value)
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
                      handleProfileChange("email", e.target.value)
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
                      handleProfileChange("phone", e.target.value)
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
                    value={profileData.school || "School not assigned"}
                    disabled
                    readOnly
                    className={`w-full h-11 px-3 rounded-lg border text-xs sm:text-sm outline-none ${
                      darkMode
                        ? "bg-slate-800 border-slate-700 text-slate-400"
                        : "bg-slate-100 border-slate-200 text-slate-500"
                    }`}
                  />

                  <p className={`text-[10px] mt-1 ${mutedClass}`}>
                    School is assigned during account registration and cannot be
                    changed here.
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
                      handleProfileChange("department", e.target.value)
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
                      handleProfileChange("position", e.target.value)
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
                    value={profileData.specialization}
                    disabled={!isEditing}
                    onChange={(e) =>
                      handleProfileChange("specialization", e.target.value)
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
                      handleProfileChange("address", e.target.value)
                    }
                    className={`w-full h-11 px-3 rounded-lg border text-xs sm:text-sm outline-none transition ${getInputClass(
                      isEditing
                    )}`}
                    placeholder="Enter address"
                  />
                </div>
              </div>

              {/* INFO */}

              <div className={`mt-6 p-4 rounded-lg border ${panelClass}`}>
                <p
                  className={`text-xs font-bold mb-1 ${
                    darkMode ? "text-slate-200" : "text-slate-700"
                  }`}
                >
                  Profile Information
                </p>

                <p className={`text-xs leading-relaxed ${mutedClass}`}>
                  Your profile information is loaded directly from your SIMS
                  account. Employee ID and School are managed by the institution
                  and cannot be changed here.
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
              darkMode ? "border-slate-700" : "border-slate-200"
            }`}
          >
            <div>
              <h2
                className={`text-base sm:text-lg font-bold ${pageHeadingClass}`}
              >
                Assigned Students Overview
              </h2>

              <p className={`text-xs mt-1 ${mutedClass}`}>
                Students currently assigned to you and their internship
                companies.
              </p>
            </div>

            <span
              className={`self-start sm:self-auto px-3 py-1.5 rounded-md text-[10px] font-bold ${
                darkMode
                  ? "bg-slate-800 text-slate-400"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {assignedStudentsLoading
                ? "Loading..."
                : `${assignedStudents.length} ${
                    assignedStudents.length === 1 ? "Student" : "Students"
                  }`}
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
                {assignedStudentsLoading ? (
                  <tr>
                    <td
                      colSpan={4}
                      className={`px-5 py-10 text-center text-xs ${mutedClass}`}
                    >
                      Loading assigned students...
                    </td>
                  </tr>
                ) : assignedStudents.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className={`px-5 py-10 text-center ${mutedClass}`}
                    >
                      <div className="text-2xl mb-2">👥</div>

                      <p className="text-xs font-semibold">
                        No assigned students found.
                      </p>

                      <p className="text-[10px] mt-1">
                        Students assigned within your school will appear here.
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedAssignedStudents.map((student) => (
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
                          {/* PROFILE PHOTO */}

                          <div
                            className={`w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center text-[10px] font-bold ${
                              darkMode
                                ? "bg-slate-800 text-slate-300"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {student.profilePhotoUrl ? (
                              <img
                                src={student.profilePhotoUrl}
                                alt={`${student.name} profile`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              student.name
                                .split(" ")
                                .filter(Boolean)
                                .map((word) => word[0])
                                .join("")
                                .slice(0, 2)
                                .toUpperCase()
                            )}
                          </div>

                          <div>
                            <p
                              className={`text-xs font-bold ${
                                darkMode ? "text-slate-100" : "text-slate-900"
                              }`}
                            >
                              {student.name}
                            </p>

                            <p className={`text-[10px] mt-0.5 ${mutedClass}`}>
                              Assigned Student
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* STUDENT ID */}

                      <td className={`px-5 py-4 text-xs ${mutedClass}`}>
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
                                darkMode ? "text-slate-200" : "text-slate-800"
                              }`}
                            >
                              {student.company}
                            </p>

                            <p className={`text-[10px] mt-0.5 ${mutedClass}`}>
                              Internship Company
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* STATUS */}

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-md text-[10px] font-bold ${getAssignedStudentStatusClass(
                            student.status
                          )}`}
                        >
                          {student.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* ===================================================
              PAGINATION
          =================================================== */}

          {!assignedStudentsLoading &&
            assignedStudents.length > ASSIGNED_STUDENTS_PER_PAGE && (
              <div
                className={`px-5 py-3 border-t flex items-center justify-between gap-4 ${
                  darkMode ? "border-slate-700" : "border-slate-200"
                }`}
              >
                {/* SHOWING TEXT */}

                <p className={`text-[10px] sm:text-xs ${mutedClass}`}>
                  Showing{" "}
                  <span
                    className={`font-bold ${
                      darkMode ? "text-slate-200" : "text-slate-700"
                    }`}
                  >
                    {showingStart}-{showingEnd}
                  </span>{" "}
                  of{" "}
                  <span
                    className={`font-bold ${
                      darkMode ? "text-slate-200" : "text-slate-700"
                    }`}
                  >
                    {totalAssignedStudents}
                  </span>{" "}
                  students
                </p>

                {/* PAGINATION CONTROLS */}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={goToPreviousAssignedStudentsPage}
                    disabled={assignedStudentsPage === 1}
                    aria-label="Previous students"
                    className={`w-8 h-8 rounded-lg border flex items-center justify-center text-sm font-bold transition disabled:opacity-30 disabled:cursor-not-allowed ${
                      darkMode
                        ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                        : "bg-white border-slate-300 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    ←
                  </button>

                  <span
                    className={`min-w-[45px] text-center text-[10px] font-bold ${mutedClass}`}
                  >
                    {assignedStudentsPage} / {totalAssignedStudentPages}
                  </span>

                  <button
                    type="button"
                    onClick={goToNextAssignedStudentsPage}
                    disabled={
                      assignedStudentsPage === totalAssignedStudentPages
                    }
                    aria-label="Next students"
                    className={`w-8 h-8 rounded-lg border flex items-center justify-center text-sm font-bold transition disabled:opacity-30 disabled:cursor-not-allowed ${
                      darkMode
                        ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                        : "bg-white border-slate-300 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    →
                  </button>
                </div>
              </div>
            )}

          {/* MOBILE NOTE */}

          <div
            className={`px-5 py-3 border-t text-[10px] md:hidden ${
              darkMode
                ? "border-slate-700 text-slate-500"
                : "border-slate-200 text-slate-400"
            }`}
          >
            Swipe horizontally to view all student information.
          </div>
        </section>
      </div>
    </div>
  );
};

export default Profile;
