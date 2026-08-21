import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";

const Login = () => {
  // =========================================================
  // ACTIVE ROLE TAB
  // =========================================================

  const [activeRole, setActiveRole] = useState("student");

  // =========================================================
  // FORM STATES
  // =========================================================

  const [forms, setForms] = useState({
    student: {
      email: "",
      password: "",
    },

    registrar: {
      email: "",
      password: "",
    },

    company: {
      email: "",
      password: "",
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

  // =========================================================
  // UPDATE FORM
  // =========================================================

  const handleChange = (role, field, value) => {
    setForms((prev) => ({
      ...prev,
      [role]: {
        ...prev[role],
        [field]: value,
      },
    }));
  };

  // =========================================================
  // LOGIN
  // =========================================================
  //
  // Flow:
  //
  // Email + Password
  //       ↓
  // Supabase Auth
  //       ↓
  // Authenticated user
  //       ↓
  // public.users
  //       ↓
  // Check status
  //       ↓
  // Check role
  //       ↓
  // Redirect
  //
  // =========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) {
      return;
    }

    const currentForm = forms[activeRole];

    const email = currentForm.email.trim().toLowerCase();
    const password = currentForm.password;

    if (!email || !password) {
      alert("Please enter your email and password.");
      return;
    }

    try {
      setIsSubmitting(true);

      // =====================================================
      // 1. AUTHENTICATE THROUGH SUPABASE AUTH
      // =====================================================

      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (authError) {
        console.error("Login authentication error:", authError);

        alert("Invalid email or password.");
        return;
      }

      const authenticatedUser = authData?.user;

      if (!authenticatedUser) {
        alert("Unable to authenticate your account.");
        return;
      }

      console.log("User authenticated successfully:", {
        id: authenticatedUser.id,
        email: authenticatedUser.email,
      });

      // =====================================================
      // 2. FETCH OFFICIAL USER RECORD
      // =====================================================

      const { data: userRecord, error: userError } = await supabase
        .from("users")
        .select(
          `
          id,
          email,
          role,
          first_name,
          middle_name,
          last_name,
          status
        `
        )
        .eq("id", authenticatedUser.id)
        .maybeSingle();

      if (userError) {
        console.error("Users table error:", userError);

        // Sign out because the authenticated account does
        // not have a valid SIMS user record.
        await supabase.auth.signOut();

        alert(
          "Unable to load your SIMS account information. Please try again."
        );

        return;
      }

      // =====================================================
      // 3. MAKE SURE USERS RECORD EXISTS
      // =====================================================

      if (!userRecord) {
        console.error(
          "Authenticated account has no users table record:",
          authenticatedUser.id
        );

        await supabase.auth.signOut();

        alert(
          "Your account has not been activated in SIMS yet. Please contact the administrator."
        );

        return;
      }

      console.log("SIMS user record:", userRecord);

      // =====================================================
      // 4. CHECK ACCOUNT STATUS
      // =====================================================

      const accountStatus = userRecord.status?.toLowerCase();

      if (accountStatus !== "active") {
        console.warn("Inactive SIMS account:", {
          id: userRecord.id,
          status: userRecord.status,
        });

        await supabase.auth.signOut();

        if (accountStatus === "pending") {
          alert(
            "Your account is still pending approval. Please wait for the administrator to review your registration."
          );
        } else if (accountStatus === "rejected") {
          alert(
            "Your SIMS account is currently rejected. Please submit a new registration request."
          );
        } else {
          alert(
            "Your SIMS account is not currently active. Please contact the administrator."
          );
        }

        return;
      }

      // =====================================================
      // 5. CHECK SELECTED PORTAL ROLE
      // =====================================================

      const databaseRole = userRecord.role?.toLowerCase();

      if (databaseRole !== activeRole) {
        console.warn("Portal role mismatch:", {
          selectedPortal: activeRole,
          databaseRole,
        });

        await supabase.auth.signOut();

        let expectedPortal = "the selected portal";

        if (databaseRole === "student") {
          expectedPortal = "Student";
        } else if (databaseRole === "registrar") {
          expectedPortal = "Registrar Adviser";
        } else if (databaseRole === "company") {
          expectedPortal = "Company Supervisor";
        }

        alert(
          `This account belongs to the ${expectedPortal} portal. Please select the correct portal to continue.`
        );

        return;
      }

      // =====================================================
      // 6. DETERMINE DESTINATION
      // =====================================================

      let destination = "/";

      switch (databaseRole) {
        case "student":
          destination = "/student/dashboard";
          break;

        case "registrar":
          destination = "/registrar/dashboard";
          break;

        case "company":
          destination = "/company/dashboard";
          break;

        default:
          console.error("Unsupported user role:", databaseRole);

          await supabase.auth.signOut();

          alert(
            "Your account has an unsupported SIMS role. Please contact the administrator."
          );

          return;
      }

      // =====================================================
      // 7. SUCCESSFUL LOGIN
      // =====================================================

      console.log("Login successful:", {
        id: userRecord.id,
        email: userRecord.email,
        role: userRecord.role,
        status: userRecord.status,
        destination,
      });

      navigate(destination, {
        replace: true,
      });
    } catch (error) {
      console.error("Unexpected login error:", error);

      alert("Something went wrong while signing in. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // =========================================================
  // PORTAL CONFIGURATION
  // =========================================================

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
      label: "Registrar Advisor",
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
            d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0 6.22-.62 9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      ),
    },
  ];

  // =========================================================
  // ACTIVE PORTAL
  // =========================================================

  const activePortal = portals.find((portal) => portal.key === activeRole);

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 font-sans text-gray-800 flex flex-col">
      {/* Main Login Area */}

      <main className="flex-1 flex flex-col items-center justify-center py-30 px-4 max-w-3xl mx-auto w-full">
        {/* Page Heading */}

        <div className="text-center mb-10">
          <h2 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl mb-3">
            Login to Your Account
          </h2>

          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Welcome back! Select your gateway portal below to access your portal
            space.
          </p>
        </div>

        {/* Role Tabs */}

        <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1.5 rounded-xl w-full mb-8 shadow-inner border border-slate-200">
          {portals.map((portal) => (
            <button
              key={portal.key}
              type="button"
              onClick={() => setActiveRole(portal.key)}
              disabled={isSubmitting}
              className={`py-3 px-2 rounded-lg text-xs font-bold tracking-wider transition-all duration-200 uppercase ${
                activeRole === portal.key
                  ? `bg-gradient-to-r ${portal.accent} text-white shadow-md scale-[1.02]`
                  : "text-slate-500 hover:text-slate-800 hover:bg-white"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {portal.label}
            </button>
          ))}
        </div>

        {/* Active Login Card */}

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
            {activeRole} Gateway
          </p>

          {/* Login Form */}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Email Address
              </label>

              <input
                type="email"
                required
                disabled={isSubmitting}
                placeholder="Enter your email"
                value={forms[activeRole].email}
                onChange={(e) =>
                  handleChange(activeRole, "email", e.target.value)
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-800 focus:bg-white transition disabled:opacity-60"
              />
            </div>

            {/* Password */}

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Password
              </label>

              <input
                type="password"
                required
                disabled={isSubmitting}
                placeholder="••••••••"
                value={forms[activeRole].password}
                onChange={(e) =>
                  handleChange(activeRole, "password", e.target.value)
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-800 focus:bg-white transition disabled:opacity-60"
              />
            </div>

            {/* Sign In Button */}

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full bg-gradient-to-r ${activePortal.accent} text-white py-3 rounded-xl text-sm font-semibold tracking-wide shadow-sm hover:opacity-95 transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              {isSubmitting
                ? "Signing In..."
                : `Sign In as ${activePortal.label}`}
            </button>

            {/* Forgot Password */}

            <div className="text-center">
              <button
                type="button"
                onClick={() =>
                  alert("Password recovery will be available soon.")
                }
                disabled={isSubmitting}
                className="text-xs font-semibold text-slate-400 hover:text-slate-800 hover:underline transition disabled:opacity-50"
              >
                Forgot Password?
              </button>
            </div>
          </form>

          {/* Sign Up Redirect */}

          <div className="border-t border-slate-100 mt-8 pt-6 text-center">
            <p className="text-sm text-slate-500">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className={`font-bold ${activePortal.activeText} hover:underline`}
              >
                Create Account
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

export default Login;
