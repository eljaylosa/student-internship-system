import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";

const SignUp = () => {
  const navigate = useNavigate();

  const [activeRole, setActiveRole] = useState("student");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [forms, setForms] = useState({
    student: {
      firstName: "",
      middleInitial: "",
      lastName: "",
      studentId: "",
      email: "",
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

  const handleChange = (role, field, value) => {
    setForms((prev) => ({
      ...prev,
      [role]: {
        ...prev[role],
        [field]: value,
      },
    }));
  };

  const handleFileChange = (role, field, file) => {
    handleChange(role, field, file);
  };

  /*
   * Upload a verification document to Supabase Storage.
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
   * Submit Student / Registrar registration.
   */
  const submitCreateRequest = async (currentForm) => {
    /*
     * Convert uploaded documents into data that can be
     * securely sent to the Edge Function.
     */

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

    /*
     * Call the Edge Function.
     */
    const { data, error } = await supabase.functions.invoke(
      "create-registration-request",
      {
        body: {
          email: currentForm.email.trim(),
          password: currentForm.password,

          role: activeRole,

          firstName: currentForm.firstName.trim(),

          middleInitial: currentForm.middleInitial?.trim() || "",

          lastName: currentForm.lastName.trim(),

          phone: currentForm.phone.trim(),

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
        error.message || "Unable to submit your registration request."
      );
    }

    if (!data?.success) {
      throw new Error(
        data?.error || "Unable to submit your registration request."
      );
    }

    return data;
  };

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
        error.message || "Unable to submit company registration."
      );
    }

    if (!data?.success) {
      throw new Error(data?.error || "Unable to submit company registration.");
    }

    return data;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting) return;

    const currentForm = forms[activeRole];

    /*
     * PASSWORD VALIDATION
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
     * COMPANY
     *
     * Company remains separate because CompanyManagement.jsx
     * handles companies.
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

        navigate("/login", { replace: true });
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
     * STUDENT DOCUMENT VALIDATION
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
     * REGISTRAR DOCUMENT VALIDATION
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

    try {
      setIsSubmitting(true);

      await submitCreateRequest(currentForm);

      alert(
        activeRole === "student"
          ? "Registration submitted successfully. Your Student account is now pending review by the administrator."
          : "Registration submitted successfully. Your Registrar Adviser account is now pending review by the administrator."
      );

      navigate("/login", { replace: true });
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

  const inputClass =
    "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-800 focus:bg-white transition";

  const labelClass =
    "block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5";

  const sectionClass = "border border-slate-100 rounded-xl p-5 bg-slate-50/50";

  const fileInputClass =
    "w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:bg-slate-100 file:text-slate-700 file:font-semibold hover:file:bg-slate-200";

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
                  style={{ width: strength.width }}
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
                Your registration and submitted documents will be reviewed by a
                SIMS administrator.
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
                Your credentials will be reviewed before your Registrar Adviser
                account can be activated.
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
              Your COR and Student ID will be reviewed before your account can
              be fully activated.
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 font-sans text-gray-800 flex flex-col">
      {/* NAVIGATION */}
      {/* <header className="bg-slate-900 border-b border-slate-800 text-white px-8 py-4 flex justify-between items-center shadow-md">
        <Link
          to="/"
          className="text-xs uppercase tracking-widest text-slate-400 hover:text-white transition font-bold"
        >
          Home
        </Link>

        <div className="text-sm md:text-base font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-200 text-center">
          STUDENT INTERNSHIP MANAGEMENT SYSTEM
        </div>

        <Link
          to="/login"
          className="text-xs uppercase tracking-widest text-slate-400 hover:text-white transition font-bold"
        >
          Login
        </Link>
      </header> */}

      {/* MAIN */}
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
              onClick={() => setActiveRole(portal.key)}
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

                  <input
                    type="email"
                    required
                    placeholder="Enter your email address"
                    value={currentForm.email}
                    onChange={(event) =>
                      handleChange(activeRole, "email", event.target.value)
                    }
                    className={inputClass}
                  />

                  <p className="text-[10px] text-slate-400 mt-1.5">
                    This email will be used for account verification and
                    important SIMS notifications.
                  </p>
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

            {/* STUDENT INFORMATION */}
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

            {/* REGISTRAR INFORMATION */}
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

            {/* COMPANY INFORMATION */}
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
              disabled={isSubmitting}
              className={`w-full bg-gradient-to-r ${
                activePortal.accent
              } text-white py-3.5 rounded-xl text-sm font-semibold tracking-wide shadow-sm transition-all duration-200 ${
                isSubmitting
                  ? "opacity-60 cursor-not-allowed"
                  : "hover:opacity-95"
              }`}
            >
              {isSubmitting
                ? "Submitting Registration..."
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
