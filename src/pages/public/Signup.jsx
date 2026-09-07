import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";

const SignUp = () => {
  const navigate = useNavigate();

  const [activeRole, setActiveRole] = useState("student");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSupportingInfo, setShowSupportingInfo] = useState(false);

  /*
   * =========================================================
   * EMAIL VERIFICATION
   * =========================================================
   */

  const emptyVerification = {
    email: "",
    code: "",
    isCodeSent: false,
    isVerified: false,
    isSending: false,
    isVerifying: false,
    expiresAt: null,
    resendAvailableAt: null,
    attemptsRemaining: null,
  };

  const [verification, setVerification] = useState(emptyVerification);

  const [verificationCountdown, setVerificationCountdown] = useState(0);

  /*
   * =========================================================
   * SCHOOLS
   * =========================================================
   */

  const [schools, setSchools] = useState([]);
  const [isLoadingSchools, setIsLoadingSchools] = useState(true);
  const [schoolLoadError, setSchoolLoadError] = useState("");

  /*
   * Load all active schools from Supabase.
   */

  useEffect(() => {
    const loadSchools = async () => {
      try {
        setIsLoadingSchools(true);
        setSchoolLoadError("");

        const { data, error } = await supabase
          .from("schools")
          .select("id, name, code")
          .eq("status", "active")
          .order("name", {
            ascending: true,
          });

        if (error) {
          console.error("Error loading schools:", error);

          setSchoolLoadError(
            "Unable to load the available schools. Please try again."
          );

          return;
        }

        setSchools(data || []);
      } catch (error) {
        console.error("School loading error:", error);

        setSchoolLoadError(
          "Unable to load the available schools. Please try again."
        );
      } finally {
        setIsLoadingSchools(false);
      }
    };

    loadSchools();
  }, []);

  /*
   * =========================================================
   * VERIFICATION COUNTDOWN
   * =========================================================
   */

  useEffect(() => {
    if (!verification.resendAvailableAt) {
      setVerificationCountdown(0);
      return;
    }

    const updateCountdown = () => {
      const remaining = Math.max(
        0,
        Math.ceil(
          (new Date(verification.resendAvailableAt).getTime() - Date.now()) /
            1000
        )
      );

      setVerificationCountdown(remaining);

      if (remaining <= 0) {
        setVerification((prev) => ({
          ...prev,
          resendAvailableAt: null,
        }));
      }
    };

    updateCountdown();

    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [verification.resendAvailableAt]);

  /*
   * =========================================================
   * FORMS
   * =========================================================
   */

  const [forms, setForms] = useState({
    student: {
      firstName: "",
      middleInitial: "",
      lastName: "",
      studentId: "",
      email: "",
      schoolId: "",
      department: "",
      program: "",
      yearLevel: "",
      phone: "",
      cor: null,
      studentIdDocument: null,
      password: "",
      confirmPassword: "",
      agreeTerms: false,
    },

    registrar: {
      firstName: "",
      middleInitial: "",
      lastName: "",
      employeeId: "",
      email: "",
      schoolId: "",
      department: "",
      position: "",
      phone: "",
      employeeIdDocument: null,
      appointmentLetter: null,
      password: "",
      confirmPassword: "",
      agreeTerms: false,
    },

    company: {
      firstName: "",
      middleInitial: "",
      lastName: "",
      companyName: "",
      companyEmail: "",
      companyPhone: "",
      companyAddress: "",
      website: "",
      industry: "",
      designation: "",
      email: "",
      phone: "",
      businessRegistration: null,
      birRegistration: null,
      supportingDocument: null,
      password: "",
      confirmPassword: "",
      agreeTerms: false,
    },
  });

  /*
   * =========================================================
   * HANDLE FORM CHANGE
   * =========================================================
   */

  const handleChange = (role, field, value) => {
    setForms((prev) => ({
      ...prev,
      [role]: {
        ...prev[role],
        [field]: value,
      },
    }));

    /*
     * Email verification belongs to the email address.
     *
     * If ANY role changes their email, the previous
     * verification is immediately invalidated.
     */

    if (field === "email") {
      setVerification({
        ...emptyVerification,
      });
    }
  };

  const handleFileChange = (role, field, file) => {
    handleChange(role, field, file);
  };

  /*
   * =========================================================
   * EMAIL VERIFICATION HELPERS
   * =========================================================
   */

  const normalizeEmail = (email) => {
    return email.trim().toLowerCase();
  };

  /*
   * =========================================================
   * SEND VERIFICATION CODE
   * =========================================================
   */

  const sendVerificationCode = async () => {
    const email = normalizeEmail(currentForm.email);

    if (!email) {
      alert("Please enter your email address first.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      alert("Please enter a valid email address.");
      return;
    }

    // Prevent frontend resend while cooldown is active
    if (
      verification.resendAvailableAt &&
      Date.now() < verification.resendAvailableAt
    ) {
      const remainingSeconds = Math.ceil(
        (verification.resendAvailableAt - Date.now()) / 1000
      );

      alert(
        `⏳ Please wait ${remainingSeconds} second${
          remainingSeconds !== 1 ? "s" : ""
        } before requesting another code.`
      );

      return;
    }

    setVerification((prev) => ({
      ...prev,
      isSending: true,
    }));

    try {
      const { data, error } = await supabase.functions.invoke(
        "send-email-verification",
        {
          body: {
            email,
          },
        }
      );

      // =====================================================
      // GET ACTUAL EDGE FUNCTION ERROR BODY
      // =====================================================

      let response = data;

      if (error?.context?.json) {
        try {
          const errorBody = await error.context.json();

          if (errorBody) {
            response = errorBody;
          }
        } catch (parseError) {
          console.error("Unable to parse Edge Function error:", parseError);
        }
      }

      // =====================================================
      // HANDLE SERVER ERROR
      // =====================================================

      if (error && !response) {
        throw new Error(error.message || "Unable to send verification code.");
      }

      if (!response?.success) {
        // -----------------------------------------------
        // COOLDOWN
        // -----------------------------------------------

        if (response?.cooldown) {
          const retryAfter = Number(response.retryAfter) || 60;

          setVerification((prev) => ({
            ...prev,
            resendAvailableAt: Date.now() + retryAfter * 1000,
          }));

          alert(
            `⏳ Please wait ${retryAfter} second${
              retryAfter !== 1 ? "s" : ""
            } before requesting another verification code.`
          );

          return;
        }

        // -----------------------------------------------
        // OTHER ERROR
        // -----------------------------------------------

        throw new Error(
          response?.error ||
            response?.message ||
            "Unable to send verification code."
        );
      }

      // =====================================================
      // SUCCESS
      // =====================================================

      const cooldownSeconds = Number(response.cooldownSeconds) || 60;

      setVerification({
        email,
        code: "",
        isCodeSent: true,
        isVerified: false,
        isSending: false,
        isVerifying: false,
        expiresAt: response.expiresAt
          ? new Date(response.expiresAt).getTime()
          : null,
        resendAvailableAt: Date.now() + cooldownSeconds * 1000,
        attemptsRemaining: 5,
      });

      alert("📧 A new verification code has been sent to your email.");
    } catch (error) {
      console.error("Send verification code error:", error);

      alert(
        `❌ ${
          error?.message ||
          "Unable to send verification code. Please try again."
        }`
      );
    } finally {
      setVerification((prev) => ({
        ...prev,
        isSending: false,
      }));
    }
  };

  /*
   * =========================================================
   * VERIFY EMAIL CODE
   * =========================================================
   */

  const verifyEmailCode = async () => {
    const email = normalizeEmail(currentForm.email);
    const code = verification.code.trim();

    if (!email) {
      alert("Please enter your email address first.");
      return;
    }

    if (!/^\d{6}$/.test(code)) {
      alert("Please enter the 6-digit verification code.");
      return;
    }

    setVerification((prev) => ({
      ...prev,
      isVerifying: true,
    }));

    try {
      const { data, error } = await supabase.functions.invoke(
        "verify-email-code",
        {
          body: {
            email,
            code,
          },
        }
      );

      // =====================================================
      // GET THE ACTUAL ERROR BODY FROM THE EDGE FUNCTION
      // =====================================================

      let response = data;

      if (error?.context?.json) {
        try {
          const errorBody = await error.context.json();

          if (errorBody) {
            response = errorBody;
          }
        } catch (parseError) {
          console.error("Unable to parse Edge Function error:", parseError);
        }
      }

      // =====================================================
      // HANDLE ERROR RESPONSE
      // =====================================================

      if (error && !response) {
        throw new Error(
          error.message || "Unable to verify your email address."
        );
      }

      if (!response?.success) {
        // -----------------------------------------------
        // MAX ATTEMPTS
        // -----------------------------------------------

        if (response?.maxAttemptsReached) {
          setVerification((prev) => ({
            ...prev,
            isCodeSent: false,
            isVerified: false,
            code: "",
            expiresAt: null,
            resendAvailableAt: prev.resendAvailableAt,
            attemptsRemaining: 0,
          }));

          alert(
            "🔒 Maximum verification attempts reached.\n\nPlease request a new verification code."
          );

          return;
        }

        // -----------------------------------------------
        // EXPIRED CODE
        // -----------------------------------------------

        if (response?.expired) {
          setVerification((prev) => ({
            ...prev,
            isCodeSent: false,
            isVerified: false,
            code: "",
            expiresAt: null,
            resendAvailableAt: null,
            attemptsRemaining: null,
          }));

          alert(
            "⏰ Your verification code has expired.\n\nPlease request a new verification code."
          );

          return;
        }

        // -----------------------------------------------
        // WRONG CODE
        // -----------------------------------------------

        if (response?.attemptsRemaining !== undefined) {
          setVerification((prev) => ({
            ...prev,
            attemptsRemaining: response.attemptsRemaining,
          }));

          alert(
            `❌ Incorrect verification code.\n\nAttempts remaining: ${response.attemptsRemaining}`
          );

          return;
        }

        // -----------------------------------------------
        // OTHER SERVER ERROR
        // -----------------------------------------------

        throw new Error(
          response?.error ||
            response?.message ||
            "Unable to verify your email address."
        );
      }

      // =====================================================
      // SUCCESS
      // =====================================================

      setVerification((prev) => ({
        ...prev,
        isVerified: true,
        isVerifying: false,
        attemptsRemaining: null,
      }));

      alert("✅ Email address verified successfully!");
    } catch (error) {
      console.error("Email verification error:", error);

      alert(
        `❌ ${
          error?.message ||
          "Unable to verify your email address. Please try again."
        }`
      );
    } finally {
      setVerification((prev) => ({
        ...prev,
        isVerifying: false,
      }));
    }
  };

  /*
   * =========================================================
   * CHANGE EMAIL
   * =========================================================
   */

  const changeVerificationEmail = () => {
    setVerification({
      ...emptyVerification,
    });
  };

  /*
   * =========================================================
   * FILE TO BASE64
   * =========================================================
   */

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      if (!file) {
        resolve(null);
        return;
      }

      const reader = new FileReader();

      reader.onload = () => {
        resolve({
          name: file.name,
          type: file.type,
          data: reader.result,
        });
      };

      reader.onerror = () => {
        reject(new Error(`Unable to read ${file.name}.`));
      };

      reader.readAsDataURL(file);
    });
  };

  /*
   * =========================================================
   * SUBMIT STUDENT / REGISTRAR REGISTRATION
   * =========================================================
   */

  const submitCreateRequest = async (currentForm) => {
    let corFile = null;
    let studentIdFile = null;

    let employeeIdFile = null;
    let appointmentLetterFile = null;

    if (activeRole === "student") {
      corFile = await fileToBase64(currentForm.cor);

      studentIdFile = await fileToBase64(currentForm.studentIdDocument);
    }

    if (activeRole === "registrar") {
      employeeIdFile = await fileToBase64(currentForm.employeeIdDocument);

      appointmentLetterFile = await fileToBase64(currentForm.appointmentLetter);
    }

    const { data, error } = await supabase.functions.invoke(
      "create-registration-request",
      {
        body: {
          email: currentForm.email.trim(),

          password: currentForm.password,

          role: activeRole,

          firstName: currentForm.firstName.trim(),

          /*
           * Removed the old resubmission:true.
           *
           * The backend determines whether this
           * is a rejected resubmission itself.
           */

          middleInitial: currentForm.middleInitial?.trim() || "",

          lastName: currentForm.lastName.trim(),

          phone: currentForm.phone.trim(),

          /*
           * SCHOOL
           */

          schoolId:
            activeRole === "student" || activeRole === "registrar"
              ? currentForm.schoolId
              : null,

          studentId:
            activeRole === "student" ? currentForm.studentId.trim() : null,

          employeeId:
            activeRole === "registrar" ? currentForm.employeeId.trim() : null,

          department: currentForm.department?.trim() || "",

          program: activeRole === "student" ? currentForm.program.trim() : null,

          yearLevel: activeRole === "student" ? currentForm.yearLevel : null,

          position:
            activeRole === "registrar" ? currentForm.position.trim() : null,

          corFile,

          studentIdFile,

          employeeIdFile,

          appointmentLetterFile,
        },
      }
    );

    if (error) {
      console.error("Registration Edge Function error:", error);

      throw new Error(
        data?.error ||
          error.message ||
          "Unable to submit your registration request."
      );
    }

    if (!data?.success) {
      throw new Error(
        data?.error || "Unable to submit your registration request."
      );
    }

    return data;
  };

  /*
   * =========================================================
   * SUBMIT COMPANY REGISTRATION
   * =========================================================
   */

  const submitCompanyRegistration = async (currentForm) => {
    const businessRegistration = await fileToBase64(
      currentForm.businessRegistration
    );

    const birRegistration = await fileToBase64(currentForm.birRegistration);

    const supportingDocument = await fileToBase64(
      currentForm.supportingDocument
    );

    const { data, error } = await supabase.functions.invoke(
      "create-company-registration",
      {
        body: {
          email: currentForm.email.trim(),

          password: currentForm.password,

          firstName: currentForm.firstName.trim(),

          middleInitial: currentForm.middleInitial?.trim() || "",

          lastName: currentForm.lastName.trim(),

          phone: currentForm.phone.trim(),

          companyName: currentForm.companyName.trim(),

          companyEmail: currentForm.companyEmail.trim(),

          companyPhone: currentForm.companyPhone.trim(),

          companyAddress: currentForm.companyAddress.trim(),

          website: currentForm.website?.trim() || "",

          industry: currentForm.industry.trim(),

          designation: currentForm.designation.trim(),

          businessRegistration,

          birRegistration,

          supportingDocument,
        },
      }
    );

    if (error) {
      console.error("Company Registration Edge Function error:", error);

      throw new Error(
        data?.error || error.message || "Unable to submit company registration."
      );
    }

    if (!data?.success) {
      throw new Error(data?.error || "Unable to submit company registration.");
    }

    return data;
  };

  /*
   * =========================================================
   * HANDLE SUBMIT
   * =========================================================
   */

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting) return;

    const currentForm = forms[activeRole];

    /*
     * =======================================================
     * EMAIL VERIFICATION
     * =======================================================
     *
     * ALL PORTALS now require email verification:
     *
     * Student
     * Registrar Adviser
     * Company Supervisor
     */

    if (!verification.isVerified) {
      alert("Please verify your email address before creating your account.");

      return;
    }

    const currentEmail = normalizeEmail(currentForm.email);

    if (verification.email !== currentEmail) {
      alert(
        "The verified email does not match your current email address. Please verify this email again."
      );

      return;
    }

    /*
     * =======================================================
     * PASSWORD VALIDATION
     * =======================================================
     */

    if (currentForm.password !== currentForm.confirmPassword) {
      alert("Passwords do not match.");

      return;
    }

    if (currentForm.password.length < 8) {
      alert("Password must be at least 8 characters long.");

      return;
    }

    if (!currentForm.agreeTerms) {
      alert("You must agree to the Terms & Conditions and Privacy Policy.");

      return;
    }

    /*
     * =======================================================
     * SCHOOL VALIDATION
     * =======================================================
     */

    if (activeRole === "student" || activeRole === "registrar") {
      if (!currentForm.schoolId) {
        alert("Please select your school before continuing.");

        return;
      }

      if (schools.length === 0) {
        alert(
          "There are currently no active schools available for registration."
        );

        return;
      }
    }

    /*
     * =======================================================
     * COMPANY
     * =======================================================
     */

    if (activeRole === "company") {
      if (!currentForm.businessRegistration) {
        alert("Please upload your business registration document.");

        return;
      }

      if (!currentForm.birRegistration) {
        alert("Please upload your BIR registration document.");

        return;
      }

      try {
        setIsSubmitting(true);

        await submitCompanyRegistration(currentForm);

        alert(
          "Company registration submitted successfully. Your account is now pending review by the administrator."
        );

        navigate("/login", {
          replace: true,
        });
      } catch (error) {
        console.error("Company registration error:", error);

        alert(
          error?.message ||
            "Something went wrong while submitting your company registration."
        );
      } finally {
        setIsSubmitting(false);
      }

      return;
    }

    /*
     * =======================================================
     * STUDENT DOCUMENT VALIDATION
     * =======================================================
     */

    if (activeRole === "student") {
      if (!currentForm.cor) {
        alert("Please upload your Certificate of Registration (COR).");

        return;
      }

      if (!currentForm.studentIdDocument) {
        alert("Please upload your Student ID.");

        return;
      }
    }

    /*
     * =======================================================
     * REGISTRAR DOCUMENT VALIDATION
     * =======================================================
     */

    if (activeRole === "registrar") {
      if (!currentForm.employeeIdDocument) {
        alert("Please upload your University / Employee ID.");

        return;
      }

      if (!currentForm.appointmentLetter) {
        alert(
          "Please upload your Proof of Appointment / Authorization Letter."
        );

        return;
      }
    }

    /*
     * =======================================================
     * STUDENT / REGISTRAR SUBMISSION
     * =======================================================
     */

    try {
      setIsSubmitting(true);

      await submitCreateRequest(currentForm);

      alert(
        activeRole === "student"
          ? "Registration submitted successfully. Your Student account is now pending review by the administrator."
          : "Registration submitted successfully. Your Registrar Adviser account is now pending review by the administrator."
      );

      navigate("/login", {
        replace: true,
      });
    } catch (error) {
      console.error("Registration error:", error);

      alert(
        error?.message ||
          "Something went wrong while creating your account. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  /*
   * =========================================================
   * PORTALS
   * =========================================================
   */

  const portals = [
    {
      key: "student",
      label: "Student",
      accent: "from-blue-500 to-indigo-600",
      activeText: "text-blue-600",
      icon: (
        <svg
          className="w-8 h-8 text-blue-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 14l9-5-9-5-9 5 9 5z"
          />

          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
          />
        </svg>
      ),
    },

    {
      key: "registrar",
      label: "Registrar Adviser",
      accent: "from-emerald-500 to-teal-600",
      activeText: "text-emerald-600",
      icon: (
        <svg
          className="w-8 h-8 text-emerald-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6m-6 4h3"
          />
        </svg>
      ),
    },

    {
      key: "company",
      label: "Company Supervisor",
      accent: "from-purple-500 to-purple-700",
      activeText: "text-purple-600",
      icon: (
        <svg
          className="w-8 h-8 text-purple-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v1m4 7h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      ),
    },
  ];

  const activePortal = portals.find((portal) => portal.key === activeRole);

  const currentForm = forms[activeRole];

  /*
   * =========================================================
   * STYLES
   * =========================================================
   */

  const inputClass =
    "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-800 focus:bg-white transition";

  const labelClass =
    "block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5";

  const sectionClass = "border border-slate-100 rounded-xl p-5 bg-slate-50/50";

  const fileInputClass =
    "w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:bg-slate-100 file:text-slate-700 file:font-semibold hover:file:bg-slate-200";

  /*
   * =========================================================
   * PASSWORD STRENGTH
   * =========================================================
   */

  const getPasswordStrength = (password) => {
    let strength = 0;

    if (password.length >= 8) strength++;

    if (/[A-Z]/.test(password)) strength++;

    if (/[a-z]/.test(password)) strength++;

    if (/[0-9]/.test(password)) strength++;

    if (/[^A-Za-z0-9]/.test(password)) strength++;

    if (strength <= 1) {
      return {
        label: "Very Weak",
        width: "20%",
        color: "bg-red-500",
        textColor: "text-red-500",
      };
    }

    if (strength === 2) {
      return {
        label: "Weak",
        width: "40%",
        color: "bg-orange-500",
        textColor: "text-orange-500",
      };
    }

    if (strength === 3) {
      return {
        label: "Medium",
        width: "60%",
        color: "bg-yellow-500",
        textColor: "text-yellow-600",
      };
    }

    if (strength === 4) {
      return {
        label: "Strong",
        width: "80%",
        color: "bg-blue-500",
        textColor: "text-blue-500",
      };
    }

    return {
      label: "Very Strong",
      width: "100%",
      color: "bg-emerald-500",
      textColor: "text-emerald-500",
    };
  };

  /*
   * =========================================================
   * NAME FIELDS
   * =========================================================
   */

  const renderNameFields = () => (
    <div>
      <label className={labelClass}>Full Name</label>

      <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_80px] gap-3">
        <input
          type="text"
          required
          placeholder="First Name"
          value={currentForm.firstName}
          onChange={(event) =>
            handleChange(activeRole, "firstName", event.target.value)
          }
          className={inputClass}
        />

        <input
          type="text"
          required
          placeholder="Last Name"
          value={currentForm.lastName}
          onChange={(event) =>
            handleChange(activeRole, "lastName", event.target.value)
          }
          className={inputClass}
        />

        <input
          type="text"
          maxLength={2}
          placeholder="M.I."
          value={currentForm.middleInitial}
          onChange={(event) =>
            handleChange(
              activeRole,
              "middleInitial",
              event.target.value.toUpperCase()
            )
          }
          className={inputClass}
        />
      </div>

      <p className="text-[10px] text-slate-400 mt-1.5">
        Enter your name exactly as it appears on your official records.
      </p>
    </div>
  );

  /*
   * =========================================================
   * SCHOOL DROPDOWN
   * =========================================================
   */

  const renderSchoolField = () => {
    if (activeRole !== "student" && activeRole !== "registrar") {
      return null;
    }

    return (
      <div>
        <label className={labelClass}>
          School
          <span className="text-red-500 ml-1">*</span>
        </label>

        <select
          required
          value={currentForm.schoolId}
          onChange={(event) =>
            handleChange(activeRole, "schoolId", event.target.value)
          }
          disabled={isLoadingSchools || schools.length === 0}
          className={`${inputClass} cursor-pointer ${
            isLoadingSchools || schools.length === 0
              ? "cursor-not-allowed opacity-60"
              : ""
          }`}
        >
          <option value="" disabled>
            {isLoadingSchools
              ? "Loading schools..."
              : schools.length === 0
              ? "No schools available"
              : "Select your school"}
          </option>

          {schools.map((school) => (
            <option key={school.id} value={school.id}>
              {school.name}
              {school.code ? ` (${school.code})` : ""}
            </option>
          ))}
        </select>

        {schoolLoadError ? (
          <p className="text-[10px] text-red-500 mt-1.5">{schoolLoadError}</p>
        ) : schools.length === 0 && !isLoadingSchools ? (
          <p className="text-[10px] text-red-500 mt-1.5">
            No active schools have been registered yet. Please contact the
            administrator.
          </p>
        ) : (
          <p className="text-[10px] text-slate-400 mt-1.5">
            Select the school where you are currently enrolled or employed.
          </p>
        )}
      </div>
    );
  };

  /*
   * =========================================================
   * EMAIL VERIFICATION UI
   * =========================================================
   */

  const renderEmailVerification = () => {
    const email = normalizeEmail(currentForm.email);

    return (
      <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4">
        {!verification.isVerified ? (
          <>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={sendVerificationCode}
                disabled={
                  verification.isSending || verificationCountdown > 0 || !email
                }
                className={`sm:w-auto px-5 py-3 rounded-xl text-xs font-bold transition-all ${
                  verification.isSending || verificationCountdown > 0 || !email
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                    : activeRole === "student"
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : activeRole === "registrar"
                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                    : "bg-purple-600 text-white hover:bg-purple-700"
                }`}
              >
                {verification.isSending
                  ? "Sending..."
                  : verificationCountdown > 0
                  ? `Resend in ${verificationCountdown}s`
                  : verification.isCodeSent
                  ? "Resend Code"
                  : "Send Verification Code"}
              </button>

              {verification.isCodeSent && (
                <button
                  type="button"
                  onClick={changeVerificationEmail}
                  className="px-5 py-3 rounded-xl text-xs font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
                >
                  Change Email
                </button>
              )}
            </div>

            {verification.isCodeSent && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <label className={labelClass}>6-Digit Verification Code</label>

                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder="Enter 6-digit code"
                    value={verification.code}
                    onChange={(event) => {
                      const value = event.target.value
                        .replace(/\D/g, "")
                        .slice(0, 6);

                      setVerification((prev) => ({
                        ...prev,
                        code: value,
                      }));
                    }}
                    className={`${inputClass} tracking-[0.35em] text-center font-bold`}
                  />

                  <button
                    type="button"
                    onClick={verifyEmailCode}
                    disabled={
                      verification.isVerifying || verification.code.length !== 6
                    }
                    className={`sm:w-36 px-5 py-3 rounded-xl text-xs font-bold transition ${
                      verification.isVerifying || verification.code.length !== 6
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                        : "bg-slate-900 text-white hover:bg-slate-800"
                    }`}
                  >
                    {verification.isVerifying ? "Verifying..." : "Verify Code"}
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 mt-2">
                  <p className="text-[10px] text-slate-400">
                    We sent a verification code to{" "}
                    <span className="font-semibold text-slate-600">
                      {verification.email}
                    </span>
                  </p>

                  {verification.expiresAt && (
                    <p className="text-[10px] text-slate-400">
                      Code expires in 10 minutes.
                    </p>
                  )}
                </div>

                {verification.attemptsRemaining !== null && (
                  <p className="text-[10px] text-slate-400 mt-1">
                    Attempts remaining:{" "}
                    <span className="font-semibold">
                      {verification.attemptsRemaining}
                    </span>
                  </p>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                ✓
              </div>

              <div>
                <p className="text-sm font-bold text-emerald-700">
                  Email Verified
                </p>

                <p className="text-[10px] text-slate-400">
                  {verification.email}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={changeVerificationEmail}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 hover:underline"
            >
              Change Email
            </button>
          </div>
        )}
      </div>
    );
  };

  /*
   * =========================================================
   * PASSWORD FIELDS
   * =========================================================
   */

  const renderPasswordFields = () => {
    const strength = currentForm.password
      ? getPasswordStrength(currentForm.password)
      : null;

    return (
      <>
        <div>
          <label className={labelClass}>Password</label>

          <input
            type="password"
            required
            minLength={8}
            placeholder="Create a strong password"
            value={currentForm.password}
            onChange={(event) =>
              handleChange(activeRole, "password", event.target.value)
            }
            className={inputClass}
          />

          {strength && (
            <div className="mt-3">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Password Strength
                </span>

                <span
                  className={`text-[10px] font-bold uppercase tracking-wider ${strength.textColor}`}
                >
                  {strength.label}
                </span>
              </div>

              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
                  style={{
                    width: strength.width,
                  }}
                />
              </div>

              <p className="text-[10px] text-slate-400 mt-2">
                Use at least 8 characters with uppercase, lowercase, numbers,
                and symbols.
              </p>
            </div>
          )}
        </div>

        <div>
          <label className={labelClass}>Confirm Password</label>

          <input
            type="password"
            required
            minLength={8}
            placeholder="Re-enter your password"
            value={currentForm.confirmPassword}
            onChange={(event) =>
              handleChange(activeRole, "confirmPassword", event.target.value)
            }
            className={inputClass}
          />

          {currentForm.confirmPassword &&
            currentForm.password !== currentForm.confirmPassword && (
              <p className="text-[10px] text-red-500 mt-1.5 font-medium">
                Passwords do not match.
              </p>
            )}
        </div>
      </>
    );
  };

  /*
   * =========================================================
   * VERIFICATION NOTICE
   * =========================================================
   */

  const renderVerificationNotice = () => {
    if (activeRole === "company") {
      return (
        <div className="rounded-xl border border-purple-100 bg-purple-50 p-4">
          <div className="flex gap-3">
            <div className="text-lg">🔐</div>

            <div>
              <p className="text-sm font-bold text-purple-900">
                Company verification is required
              </p>

              <p className="text-xs text-purple-700 leading-relaxed mt-1">
                Your email must be verified first. Your registration and
                submitted documents will then be reviewed by a SIMS
                administrator.
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (activeRole === "registrar") {
      return (
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
          <div className="flex gap-3">
            <div className="text-lg">🏛️</div>

            <div>
              <p className="text-sm font-bold text-emerald-900">
                Registrar verification is required
              </p>

              <p className="text-xs text-emerald-700 leading-relaxed mt-1">
                Your email must be verified first. Your credentials will then be
                reviewed before your Registrar Adviser account can be activated.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
        <div className="flex gap-3">
          <div className="text-lg">✉️</div>

          <div>
            <p className="text-sm font-bold text-blue-900">
              Student verification is required
            </p>

            <p className="text-xs text-blue-700 leading-relaxed mt-1">
              Your email must be verified first. Your COR and Student ID will
              then be reviewed before your account can be fully activated.
            </p>
          </div>
        </div>
      </div>
    );
  };

  /*
   * =========================================================
   * ROLE CHANGE
   * =========================================================
   */

  const handleRoleChange = (role) => {
    setActiveRole(role);

    /*
     * Always reset verification when
     * switching signup portals.
     */

    setVerification({
      ...emptyVerification,
    });
  };

  /*
   * =========================================================
   * RENDER
   * =========================================================
   */

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 font-sans text-gray-800 flex flex-col">
      <main className="flex-1 flex flex-col items-center py-30 px-4 max-w-3xl mx-auto w-full">
        {/* PAGE HEADER */}

        <div className="text-center mb-10">
          <h2 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl mb-3">
            Create Your Account
          </h2>

          <p className="text-sm text-slate-500 max-w-lg mx-auto">
            Select your portal and provide accurate information to create your
            SIMS account.
          </p>
        </div>

        {/* ROLE TABS */}

        <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1.5 rounded-xl w-full mb-8 shadow-inner border border-slate-200">
          {portals.map((portal) => (
            <button
              key={portal.key}
              type="button"
              onClick={() => handleRoleChange(portal.key)}
              className={`py-3 px-2 rounded-lg text-xs font-bold tracking-wider transition-all duration-200 uppercase ${
                activeRole === portal.key
                  ? `bg-gradient-to-r ${portal.accent} text-white shadow-md scale-[1.02]`
                  : "text-slate-500 hover:text-slate-800 hover:bg-white"
              }`}
            >
              {portal.label}
            </button>
          ))}
        </div>

        {/* FORM CARD */}

        <div className="bg-white rounded-2xl p-8 md:p-10 shadow-xl border border-slate-100 w-full">
          {/* PORTAL ICON */}

          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-6 shadow-inner">
              {activePortal.icon}
            </div>
          </div>

          <h3 className="font-bold text-xl text-slate-800 text-center mb-1">
            {activePortal.label}
          </h3>

          <p className="text-xs text-slate-400 mb-8 tracking-wide font-medium uppercase text-center">
            {activeRole === "company"
              ? "Company Registration"
              : `${activePortal.label} Registration`}
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* PERSONAL INFORMATION */}

            <section className={sectionClass}>
              <div className="mb-5">
                <h4 className="text-sm font-bold text-slate-800">
                  Personal Information
                </h4>

                <p className="text-xs text-slate-400 mt-1">
                  Provide your legal name and contact information.
                </p>
              </div>

              <div className="space-y-5">
                {renderNameFields()}

                {/* EMAIL */}

                <div>
                  <label className={labelClass}>Email Address</label>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="email"
                      required
                      placeholder="Enter your email address"
                      value={currentForm.email}
                      disabled={
                        verification.isCodeSent && !verification.isVerified
                      }
                      onChange={(event) =>
                        handleChange(activeRole, "email", event.target.value)
                      }
                      className={`${inputClass} ${
                        verification.isVerified
                          ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                          : ""
                      }`}
                    />
                  </div>

                  <p className="text-[10px] text-slate-400 mt-1.5">
                    This email will be used for account verification and
                    important SIMS notifications.
                  </p>

                  {renderEmailVerification()}
                </div>

                {/* PHONE */}

                <div>
                  <label className={labelClass}>Mobile Number</label>

                  <input
                    type="tel"
                    required
                    placeholder="+63 9XX XXX XXXX"
                    value={currentForm.phone}
                    onChange={(event) =>
                      handleChange(activeRole, "phone", event.target.value)
                    }
                    className={inputClass}
                  />
                </div>
              </div>
            </section>

            {/* =================================================
                STUDENT INFORMATION
            ================================================= */}

            {activeRole === "student" && (
              <>
                <section className={sectionClass}>
                  <div className="mb-5">
                    <h4 className="text-sm font-bold text-slate-800">
                      Student Information
                    </h4>

                    <p className="text-xs text-slate-400 mt-1">
                      Enter your official university information.
                    </p>
                  </div>

                  <div className="space-y-5">
                    {renderSchoolField()}

                    <div>
                      <label className={labelClass}>Student ID</label>

                      <input
                        type="text"
                        required
                        placeholder="e.g. 2024-00123"
                        value={currentForm.studentId}
                        onChange={(event) =>
                          handleChange(
                            "student",
                            "studentId",
                            event.target.value
                          )
                        }
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>College / Department</label>

                      <input
                        type="text"
                        required
                        placeholder="e.g. College of Information and Communications Technology"
                        value={currentForm.department}
                        onChange={(event) =>
                          handleChange(
                            "student",
                            "department",
                            event.target.value
                          )
                        }
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Program</label>

                      <input
                        type="text"
                        required
                        placeholder="e.g. BS Information Technology"
                        value={currentForm.program}
                        onChange={(event) =>
                          handleChange("student", "program", event.target.value)
                        }
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Year Level</label>

                      <select
                        required
                        value={currentForm.yearLevel}
                        onChange={(event) =>
                          handleChange(
                            "student",
                            "yearLevel",
                            event.target.value
                          )
                        }
                        className={`${inputClass} cursor-pointer`}
                      >
                        <option value="" disabled>
                          Select Year Level
                        </option>

                        <option value="1st Year">1st Year</option>

                        <option value="2nd Year">2nd Year</option>

                        <option value="3rd Year">3rd Year</option>

                        <option value="4th Year">4th Year</option>

                        <option value="5th Year">5th Year</option>

                        <option value="6th Year">6th Year</option>

                        <option value="7th Year">7th Year</option>

                        <option value="Graduate / Master's">
                          Graduate / Master's
                        </option>

                        <option value="Doctoral / PhD">Doctoral / PhD</option>

                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </section>

                {/* STUDENT DOCUMENTS */}

                <section className={sectionClass}>
                  <div className="mb-5">
                    <h4 className="text-sm font-bold text-slate-800">
                      Student Verification Documents
                    </h4>

                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Upload your current university documents.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className={labelClass}>
                        Certificate of Registration (COR)
                        <span className="text-red-500 ml-1">*</span>
                      </label>

                      <input
                        type="file"
                        required
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(event) =>
                          handleFileChange(
                            "student",
                            "cor",
                            event.target.files?.[0] || null
                          )
                        }
                        className={fileInputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>
                        Student ID
                        <span className="text-red-500 ml-1">*</span>
                      </label>

                      <input
                        type="file"
                        required
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(event) =>
                          handleFileChange(
                            "student",
                            "studentIdDocument",
                            event.target.files?.[0] || null
                          )
                        }
                        className={fileInputClass}
                      />
                    </div>
                  </div>
                </section>
              </>
            )}

            {/* =================================================
                REGISTRAR INFORMATION
            ================================================= */}

            {activeRole === "registrar" && (
              <>
                <section className={sectionClass}>
                  <div className="mb-5">
                    <h4 className="text-sm font-bold text-slate-800">
                      Registrar Information
                    </h4>

                    <p className="text-xs text-slate-400 mt-1">
                      Enter your official university employment information.
                    </p>
                  </div>

                  <div className="space-y-5">
                    {renderSchoolField()}

                    <div>
                      <label className={labelClass}>Employee ID</label>

                      <input
                        type="text"
                        required
                        placeholder="e.g. EMP-99231"
                        value={currentForm.employeeId}
                        onChange={(event) =>
                          handleChange(
                            "registrar",
                            "employeeId",
                            event.target.value
                          )
                        }
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>College / Department</label>

                      <input
                        type="text"
                        required
                        placeholder="e.g. College of Information Technology"
                        value={currentForm.department}
                        onChange={(event) =>
                          handleChange(
                            "registrar",
                            "department",
                            event.target.value
                          )
                        }
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>
                        Position / Designation
                      </label>

                      <input
                        type="text"
                        required
                        placeholder="e.g. Registrar Adviser"
                        value={currentForm.position}
                        onChange={(event) =>
                          handleChange(
                            "registrar",
                            "position",
                            event.target.value
                          )
                        }
                        className={inputClass}
                      />
                    </div>
                  </div>
                </section>

                {/* REGISTRAR DOCUMENTS */}

                <section className={sectionClass}>
                  <div className="mb-5">
                    <h4 className="text-sm font-bold text-slate-800">
                      Registrar Verification Documents
                    </h4>

                    <p className="text-xs text-slate-400 mt-1">
                      Upload your university credentials and authorization
                      documents.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className={labelClass}>
                        University / Employee ID
                        <span className="text-red-500 ml-1">*</span>
                      </label>

                      <input
                        type="file"
                        required
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(event) =>
                          handleFileChange(
                            "registrar",
                            "employeeIdDocument",
                            event.target.files?.[0] || null
                          )
                        }
                        className={fileInputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>
                        Proof of Appointment / Authorization Letter
                        <span className="text-red-500 ml-1">*</span>
                      </label>

                      <input
                        type="file"
                        required
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(event) =>
                          handleFileChange(
                            "registrar",
                            "appointmentLetter",
                            event.target.files?.[0] || null
                          )
                        }
                        className={fileInputClass}
                      />
                    </div>
                  </div>
                </section>
              </>
            )}

            {/* =================================================
                COMPANY INFORMATION
            ================================================= */}

            {activeRole === "company" && (
              <>
                <section className={sectionClass}>
                  <div className="mb-5">
                    <h4 className="text-sm font-bold text-slate-800">
                      Company Information
                    </h4>

                    <p className="text-xs text-slate-400 mt-1">
                      Provide the official information of your organization.
                    </p>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <label className={labelClass}>
                        Registered Company Name
                      </label>

                      <input
                        type="text"
                        required
                        placeholder="e.g. ABC Technologies Inc."
                        value={currentForm.companyName}
                        onChange={(event) =>
                          handleChange(
                            "company",
                            "companyName",
                            event.target.value
                          )
                        }
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>
                        Company Email Address
                      </label>

                      <input
                        type="email"
                        required
                        placeholder="hr@company.com"
                        value={currentForm.companyEmail}
                        onChange={(event) =>
                          handleChange(
                            "company",
                            "companyEmail",
                            event.target.value
                          )
                        }
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>
                        Company Contact Number
                      </label>

                      <input
                        type="tel"
                        required
                        placeholder="+63 9XX XXX XXXX"
                        value={currentForm.companyPhone}
                        onChange={(event) =>
                          handleChange(
                            "company",
                            "companyPhone",
                            event.target.value
                          )
                        }
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Industry</label>

                      <input
                        type="text"
                        required
                        placeholder="e.g. Information Technology"
                        value={currentForm.industry}
                        onChange={(event) =>
                          handleChange(
                            "company",
                            "industry",
                            event.target.value
                          )
                        }
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Company Address</label>

                      <textarea
                        required
                        rows="3"
                        placeholder="Complete business address"
                        value={currentForm.companyAddress}
                        onChange={(event) =>
                          handleChange(
                            "company",
                            "companyAddress",
                            event.target.value
                          )
                        }
                        className={`${inputClass} resize-none`}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>
                        Company Website
                        <span className="ml-1 text-slate-400 font-medium normal-case">
                          (Optional)
                        </span>
                      </label>

                      <input
                        type="url"
                        placeholder="https://company.com"
                        value={currentForm.website}
                        onChange={(event) =>
                          handleChange("company", "website", event.target.value)
                        }
                        className={inputClass}
                      />
                    </div>
                  </div>
                </section>

                {/* COMPANY REPRESENTATIVE */}

                <section className={sectionClass}>
                  <div className="mb-5">
                    <h4 className="text-sm font-bold text-slate-800">
                      Company Representative
                    </h4>
                  </div>

                  <div>
                    <label className={labelClass}>Position / Designation</label>

                    <input
                      type="text"
                      required
                      placeholder="e.g. HR Manager / Company Supervisor"
                      value={currentForm.designation}
                      onChange={(event) =>
                        handleChange(
                          "company",
                          "designation",
                          event.target.value
                        )
                      }
                      className={inputClass}
                    />
                  </div>
                </section>

                {/* COMPANY DOCUMENTS */}

                <section className={sectionClass}>
                  <div className="mb-5">
                    <h4 className="text-sm font-bold text-slate-800">
                      Company Verification Documents
                    </h4>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className={labelClass}>
                        Business Registration *
                      </label>

                      <input
                        type="file"
                        required
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(event) =>
                          handleFileChange(
                            "company",
                            "businessRegistration",
                            event.target.files?.[0] || null
                          )
                        }
                        className={fileInputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>BIR Registration *</label>

                      <input
                        type="file"
                        required
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(event) =>
                          handleFileChange(
                            "company",
                            "birRegistration",
                            event.target.files?.[0] || null
                          )
                        }
                        className={fileInputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>
                        Supporting Document
                        <span className="ml-1 text-slate-400 font-medium normal-case">
                          (Optional)
                        </span>
                        <span className="relative inline-flex ml-1 group">
                          <button
                            type="button"
                            onClick={() =>
                              setShowSupportingInfo((prev) => !prev)
                            }
                            className="flex items-center justify-center w-4 h-4 rounded-full border border-slate-400 text-[10px] font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-help"
                            aria-label="Show supporting document examples"
                          >
                            ?
                          </button>

                          <span
                            className={`absolute left-1/2 bottom-full mb-2 -translate-x-1/2 w-80 sm:w-96 max-h-80 overflow-y-auto px-4 py-3 rounded-lg bg-slate-800 text-white text-xs font-normal normal-case leading-relaxed shadow-lg z-50 transition-all duration-200 ${
                              showSupportingInfo
                                ? "opacity-100 visible"
                                : "opacity-0 invisible pointer-events-none"
                            } md:group-hover:opacity-100 md:group-hover:visible`}
                          >
                            <span className="block font-semibold text-sm mb-2">
                              Supporting Document Examples
                            </span>

                            <ol className="list-decimal list-inside space-y-1.5 text-slate-200">
                              <li>
                                <span className="font-medium text-white">
                                  Company Profile / Company Information Sheet
                                </span>{" "}
                                — basic company details, services, address,
                                contact person
                              </li>

                              <li>
                                <span className="font-medium text-white">
                                  Mayor’s Permit / Business Permit
                                </span>{" "}
                                — if hindi ito already your required Business
                                Permit
                              </li>

                              <li>
                                <span className="font-medium text-white">
                                  DTI Certificate of Business Name Registration
                                </span>{" "}
                                — for sole proprietorship
                              </li>

                              <li>
                                <span className="font-medium text-white">
                                  SEC Certificate of Registration / Articles of
                                  Incorporation
                                </span>{" "}
                                — for corporations
                              </li>

                              <li>
                                <span className="font-medium text-white">
                                  BIR Certificate of Registration (Form 2303)
                                </span>{" "}
                                — if not already required
                              </li>

                              <li>
                                <span className="font-medium text-white">
                                  Barangay Business Clearance
                                </span>
                              </li>

                              <li>
                                <span className="font-medium text-white">
                                  Organizational Chart
                                </span>{" "}
                                — useful for larger companies
                              </li>

                              <li>
                                <span className="font-medium text-white">
                                  Proof of Office/Business Address
                                </span>{" "}
                                — lease agreement, utility bill, etc.
                              </li>

                              <li>
                                <span className="font-medium text-white">
                                  Company Accreditation/Certification
                                </span>{" "}
                                — if applicable
                              </li>

                              <li>
                                <span className="font-medium text-white">
                                  Government-issued accreditation or license
                                </span>{" "}
                                — if the company's industry requires one
                              </li>

                              <li>
                                <span className="font-medium text-white">
                                  Authorization Letter
                                </span>{" "}
                                — if the person registering isn't the
                                owner/company head
                              </li>

                              <li>
                                <span className="font-medium text-white">
                                  Company ID of Authorized Representative
                                </span>
                              </li>

                              <li>
                                <span className="font-medium text-white">
                                  Partnership Agreement
                                </span>{" "}
                                — for partnerships
                              </li>

                              <li>
                                <span className="font-medium text-white">
                                  Board Resolution / Secretary's Certificate
                                </span>{" "}
                                — if needed to establish authorization
                              </li>

                              <li>
                                <span className="font-medium text-white">
                                  Other official company documents
                                </span>{" "}
                                relevant to verification
                              </li>
                            </ol>

                            <span className="block mt-3 pt-2 border-t border-slate-600 text-slate-300 italic">
                              These documents are optional. Upload only
                              documents that are applicable and may help verify
                              your company.
                            </span>

                            <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
                          </span>
                        </span>
                      </label>

                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(event) =>
                          handleFileChange(
                            "company",
                            "supportingDocument",
                            event.target.files?.[0] || null
                          )
                        }
                        className={fileInputClass}
                      />
                    </div>
                  </div>
                </section>
              </>
            )}

            {/* VERIFICATION NOTICE */}

            {renderVerificationNotice()}

            {/* SECURITY */}

            <section className={sectionClass}>
              <div className="mb-5">
                <h4 className="text-sm font-bold text-slate-800">
                  Account Security
                </h4>

                <p className="text-xs text-slate-400 mt-1">
                  Create the password you will use to sign in to SIMS.
                </p>
              </div>

              <div className="space-y-5">{renderPasswordFields()}</div>
            </section>

            {/* TERMS */}

            <div className="flex items-start gap-3 pt-1">
              <input
                type="checkbox"
                required
                checked={currentForm.agreeTerms}
                onChange={(event) =>
                  handleChange(activeRole, "agreeTerms", event.target.checked)
                }
                className="mt-1 h-4 w-4 rounded border-slate-300"
              />

              <label className="text-xs text-slate-500 leading-relaxed">
                I agree to the{" "}
                <Link
                  to="/terms"
                  className="font-semibold text-slate-800 hover:underline"
                >
                  Terms & Conditions
                </Link>{" "}
                and{" "}
                <Link
                  to="/privacy"
                  className="font-semibold text-slate-800 hover:underline"
                >
                  Privacy Policy
                </Link>
                .
              </label>
            </div>

            {/* SUBMIT */}

            <button
              type="submit"
              disabled={isSubmitting || !verification.isVerified}
              className={`w-full bg-gradient-to-r ${
                activePortal.accent
              } text-white py-3.5 rounded-xl text-sm font-semibold tracking-wide shadow-sm transition-all duration-200 ${
                isSubmitting || !verification.isVerified
                  ? "opacity-60 cursor-not-allowed"
                  : "hover:opacity-95"
              }`}
            >
              {isSubmitting
                ? "Submitting Registration..."
                : !verification.isVerified
                ? "Verify Email First"
                : activeRole === "company"
                ? "Submit Company Registration"
                : `Create ${activePortal.label} Account`}
            </button>
          </form>

          {/* LOGIN */}

          <div className="border-t border-slate-100 mt-8 pt-6 text-center">
            <p className="text-sm text-slate-500">
              Already have an account?{" "}
              <Link
                to="/login"
                className={`font-bold ${activePortal.activeText} hover:underline`}
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>

        {/* FOOTER */}

        <footer className="mt-8 text-center text-xs text-slate-400">
          © 2026 SIMS |{" "}
          <Link to="/privacy" className="hover:text-slate-700">
            Privacy Policy
          </Link>{" "}
          |{" "}
          <Link to="/terms" className="hover:text-slate-700">
            Terms of Service
          </Link>
        </footer>
      </main>
    </div>
  );
};

export default SignUp;
