import React, { useState } from "react";
import { Link } from "react-router-dom";

const SignUp = () => {
  // Active role tab
  const [activeRole, setActiveRole] = useState("student");

  // Independent form states for each user role
  const [forms, setForms] = useState({
    student: {
      fullName: "",
      studentId: "",
      email: "",
      department: "",
      phone: "",
      yearLevel: "",
      password: "",
      confirmPassword: "",
      agreeTerms: false,
    },

    faculty: {
      fullName: "",
      employeeId: "",
      email: "",
      department: "",
      phone: "",
      position: "",
      password: "",
      confirmPassword: "",
      agreeTerms: false,
    },

    company: {
      fullName: "",
      companyName: "",
      email: "",
      designation: "",
      phone: "",
      industry: "",
      password: "",
      confirmPassword: "",
      agreeTerms: false,
    },
  });

  // Update form fields based on the selected role
  const handleChange = (role, field, value) => {
    setForms((prev) => ({
      ...prev,
      [role]: {
        ...prev[role],
        [field]: value,
      },
    }));
  };

  // Handle registration
  const handleSubmit = (e) => {
    e.preventDefault();

    const currentForm = forms[activeRole];

    // Validate password confirmation
    if (currentForm.password !== currentForm.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    // Validate terms and conditions
    if (!currentForm.agreeTerms) {
      alert("You must agree to the Terms & Conditions.");
      return;
    }

    console.log(`Registering ${activeRole} account:`, currentForm);

    alert(
      `Account created successfully as a ${activeRole
        .replace("faculty", "faculty adviser")
        .replace("company", "company supervisor")}!`
    );
  };

  // Portal configuration matching the Login page
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
      key: "faculty",
      label: "Faculty Adviser",
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
            d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      ),
    },
  ];

  // Get the currently selected portal
  const activePortal = portals.find((portal) => portal.key === activeRole);

  // Shared input styles
  const inputClass =
    "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-800 focus:bg-white transition";

  const labelClass =
    "block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5";

  // Calculate password strength
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
      };
    }

    if (strength === 2) {
      return {
        label: "Weak",
        width: "40%",
        color: "bg-orange-500",
      };
    }

    if (strength === 3) {
      return {
        label: "Medium",
        width: "60%",
        color: "bg-yellow-500",
      };
    }

    if (strength === 4) {
      return {
        label: "Strong",
        width: "80%",
        color: "bg-blue-500",
      };
    }

    return {
      label: "Very Strong",
      width: "100%",
      color: "bg-emerald-500",
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 font-sans text-gray-800 flex flex-col">
      {/* System Navigation Top Bar */}
      <header className="bg-slate-900 border-b border-slate-800 text-white px-8 py-4 flex justify-between items-center shadow-md">
        <Link
          to="/"
          className="text-xs uppercase tracking-widest text-slate-400 hover:text-white transition cursor-pointer font-bold"
        >
          Home
        </Link>

        <div className="text-sm md:text-base font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-200 text-center">
          STUDENT INTERNSHIP MANAGEMENT SYSTEM
        </div>

        <Link
          to="/login"
          className="text-xs uppercase tracking-widest text-slate-400 hover:text-white transition cursor-pointer font-bold"
        >
          Login
        </Link>
      </header>

      {/* Main Registration Area */}
      <main className="flex-1 flex flex-col items-center justify-center py-14 px-4 max-w-3xl mx-auto w-full">
        {/* Page Heading */}
        <div className="text-center mb-10">
          <h2 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl mb-3">
            Create Your Account
          </h2>

          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Select your gateway portal below to create your account.
          </p>
        </div>

        {/* Role Tabs */}
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

        {/* Active Registration Card */}
        <div className="bg-white rounded-2xl p-8 md:p-10 shadow-xl border border-slate-100 w-full transition-all duration-300">
          {/* Portal Icon */}
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-6 shadow-inner">
              {activePortal.icon}
            </div>
          </div>

          {/* Portal Header */}
          <h3 className="font-bold text-xl text-slate-800 text-center mb-1">
            {activePortal.label}
          </h3>

          <p className="text-xs text-slate-400 mb-8 tracking-wide font-medium uppercase text-center">
            {activeRole} Registration
          </p>

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
            <div>
              <label className={labelClass}>Full Name</label>

              <input
                type="text"
                required
                placeholder="Juan Dela Cruz"
                value={forms[activeRole].fullName}
                onChange={(e) =>
                  handleChange(activeRole, "fullName", e.target.value)
                }
                className={inputClass}
              />
            </div>

            {/* Student ID */}
            {activeRole === "student" && (
              <div>
                <label className={labelClass}>Student ID</label>

                <input
                  type="text"
                  required
                  placeholder="2024-00123"
                  value={forms.student.studentId}
                  onChange={(e) =>
                    handleChange("student", "studentId", e.target.value)
                  }
                  className={inputClass}
                />
              </div>
            )}

            {/* Faculty Employee ID */}
            {activeRole === "faculty" && (
              <div>
                <label className={labelClass}>Employee ID</label>

                <input
                  type="text"
                  required
                  placeholder="EMP-99231"
                  value={forms.faculty.employeeId}
                  onChange={(e) =>
                    handleChange("faculty", "employeeId", e.target.value)
                  }
                  className={inputClass}
                />
              </div>
            )}

            {/* Company Name */}
            {activeRole === "company" && (
              <div>
                <label className={labelClass}>Company Name</label>

                <input
                  type="text"
                  required
                  placeholder="Tech Solutions Inc."
                  value={forms.company.companyName}
                  onChange={(e) =>
                    handleChange("company", "companyName", e.target.value)
                  }
                  className={inputClass}
                />
              </div>
            )}

            {/* Email */}
            <div>
              <label className={labelClass}>Email Address</label>

              <input
                type="email"
                required
                placeholder="email@university.edu.ph"
                value={forms[activeRole].email}
                onChange={(e) =>
                  handleChange(activeRole, "email", e.target.value)
                }
                className={inputClass}
              />
            </div>

            {/* Student Fields */}
            {activeRole === "student" && (
              <>
                <div>
                  <label className={labelClass}>Department</label>

                  <input
                    type="text"
                    required
                    placeholder="Computer Science"
                    value={forms.student.department}
                    onChange={(e) =>
                      handleChange("student", "department", e.target.value)
                    }
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Year Level</label>

                  <select
                    required
                    value={forms.student.yearLevel}
                    onChange={(e) =>
                      handleChange("student", "yearLevel", e.target.value)
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
                  </select>
                </div>
              </>
            )}

            {/* Faculty Fields */}
            {activeRole === "faculty" && (
              <>
                <div>
                  <label className={labelClass}>Department / College</label>

                  <input
                    type="text"
                    required
                    placeholder="College of Information Technology"
                    value={forms.faculty.department}
                    onChange={(e) =>
                      handleChange("faculty", "department", e.target.value)
                    }
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Academic Rank / Position</label>

                  <input
                    type="text"
                    required
                    placeholder="Assistant Professor"
                    value={forms.faculty.position}
                    onChange={(e) =>
                      handleChange("faculty", "position", e.target.value)
                    }
                    className={inputClass}
                  />
                </div>
              </>
            )}

            {/* Company Fields */}
            {activeRole === "company" && (
              <>
                <div>
                  <label className={labelClass}>Corporate Designation</label>

                  <input
                    type="text"
                    required
                    placeholder="HR Manager / Lead Developer"
                    value={forms.company.designation}
                    onChange={(e) =>
                      handleChange("company", "designation", e.target.value)
                    }
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Industry</label>

                  <input
                    type="text"
                    required
                    placeholder="Information Technology"
                    value={forms.company.industry}
                    onChange={(e) =>
                      handleChange("company", "industry", e.target.value)
                    }
                    className={inputClass}
                  />
                </div>
              </>
            )}

            {/* Phone */}
            <div>
              <label className={labelClass}>Phone Number</label>

              <input
                type="tel"
                required
                placeholder="+63 9XX XXX XXXX"
                value={forms[activeRole].phone}
                onChange={(e) =>
                  handleChange(activeRole, "phone", e.target.value)
                }
                className={inputClass}
              />
            </div>

            {/* Password */}
            <div>
              <label className={labelClass}>Password</label>

              <input
                type="password"
                required
                placeholder="••••••••"
                value={forms[activeRole].password}
                onChange={(e) =>
                  handleChange(activeRole, "password", e.target.value)
                }
                className={inputClass}
              />

              {/* Password Strength Meter */}
              {forms[activeRole].password && (
                <div className="mt-3">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Password Strength
                    </span>

                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider ${
                        getPasswordStrength(forms[activeRole].password)
                          .label === "Very Weak"
                          ? "text-red-500"
                          : getPasswordStrength(forms[activeRole].password)
                              .label === "Weak"
                          ? "text-orange-500"
                          : getPasswordStrength(forms[activeRole].password)
                              .label === "Medium"
                          ? "text-yellow-600"
                          : getPasswordStrength(forms[activeRole].password)
                              .label === "Strong"
                          ? "text-blue-500"
                          : "text-emerald-500"
                      }`}
                    >
                      {getPasswordStrength(forms[activeRole].password).label}
                    </span>
                  </div>

                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        getPasswordStrength(forms[activeRole].password).color
                      }`}
                      style={{
                        width: getPasswordStrength(forms[activeRole].password)
                          .width,
                      }}
                    />
                  </div>

                  <p className="text-[10px] text-slate-400 mt-2">
                    Use at least 8 characters with uppercase, lowercase,
                    numbers, and symbols.
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className={labelClass}>Confirm Password</label>

              <input
                type="password"
                required
                placeholder="••••••••"
                value={forms[activeRole].confirmPassword}
                onChange={(e) =>
                  handleChange(activeRole, "confirmPassword", e.target.value)
                }
                className={inputClass}
              />
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-start gap-3 pt-1">
              <input
                type="checkbox"
                required
                checked={forms[activeRole].agreeTerms}
                onChange={(e) =>
                  handleChange(activeRole, "agreeTerms", e.target.checked)
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

            {/* Create Account Button */}
            <button
              type="submit"
              className={`w-full bg-gradient-to-r ${activePortal.accent} text-white py-3 rounded-xl text-sm font-semibold tracking-wide shadow-sm hover:opacity-95 transition-all duration-200 cursor-pointer`}
            >
              Create {activePortal.label} Account
            </button>
          </form>

          {/* Login Redirect */}
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

        {/* Footer */}
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
