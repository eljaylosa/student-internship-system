import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  supabaseStudent,
  supabaseRegistrar,
  supabaseCompany,
} from "../../supabaseClient";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // =========================================================
  // ACTIVE ROLE
  // =========================================================

  const [activeRole, setActiveRole] = useState(
    location.state?.role || "student"
  );

  // =========================================================
  // FORM
  // =========================================================

  const [email, setEmail] = useState(location.state?.email || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // =========================================================
  // PORTAL CONFIGURATION
  // =========================================================

  const portals = [
    {
      key: "student",
      label: "Student",
      accent: "from-blue-500 to-indigo-600",
      activeText: "text-blue-600",
      ring: "focus:ring-blue-500",
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
      ring: "focus:ring-emerald-500",
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
      ring: "focus:ring-purple-500",
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

  const activePortal = portals.find((portal) => portal.key === activeRole);

  // =========================================================
  // GET ROLE-SPECIFIC SUPABASE CLIENT
  // =========================================================

  const getSupabaseClient = (role) => {
    switch (role) {
      case "student":
        return supabaseStudent;

      case "registrar":
        return supabaseRegistrar;

      case "company":
        return supabaseCompany;

      default:
        return null;
    }
  };

  // =========================================================
  // CHANGE PORTAL
  // =========================================================

  const handleRoleChange = (role) => {
    if (isSubmitting) {
      return;
    }

    setActiveRole(role);
    setMessage("");
    setError("");
  };

  // =========================================================
  // SEND PASSWORD RECOVERY EMAIL
  // =========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) {
      return;
    }

    setMessage("");
    setError("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError("Please enter your email address.");
      return;
    }

    const supabaseClient = getSupabaseClient(activeRole);

    if (!supabaseClient) {
      setError("Invalid portal selected.");
      return;
    }

    try {
      setIsSubmitting(true);

      // =====================================================
      // IMPORTANT:
      // Include the selected role in the reset URL.
      //
      // This allows ResetPassword.jsx to know which
      // portal-specific Supabase client should handle
      // the recovery session.
      // =====================================================

      const redirectUrl = `${window.location.origin}/reset-password?role=${activeRole}`;

      const { error: resetError } =
        await supabaseClient.auth.resetPasswordForEmail(normalizedEmail, {
          redirectTo: redirectUrl,
        });

      if (resetError) {
        console.error("Password recovery error:", resetError);

        setError("Unable to send the password reset email. Please try again.");

        return;
      }

      // =====================================================
      // SECURITY:
      // Always use a generic success message.
      //
      // Do not tell the user whether the email exists.
      // =====================================================

      setMessage(
        "If an account exists with that email address, a password reset link has been sent. Please check your inbox."
      );
    } catch (err) {
      console.error("Unexpected password recovery error:", err);

      setError(
        "Something went wrong while requesting a password reset. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 font-sans text-gray-800 flex flex-col">
      <main className="flex-1 flex flex-col items-center justify-center py-30 px-4 max-w-3xl mx-auto w-full">
        {/* ===================================================
            HEADER
        =================================================== */}

        <div className="text-center mb-10">
          <h2 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl mb-3">
            Forgot Your Password?
          </h2>

          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Enter your email address and we'll send you a secure password reset
            link.
          </p>
        </div>

        {/* ===================================================
            PORTAL SELECTOR
        =================================================== */}

        <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1.5 rounded-xl w-full mb-8 shadow-inner border border-slate-200">
          {portals.map((portal) => (
            <button
              key={portal.key}
              type="button"
              onClick={() => handleRoleChange(portal.key)}
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

        {/* ===================================================
            CARD
        =================================================== */}

        <div className="bg-white rounded-2xl p-8 md:p-10 shadow-xl border border-slate-100 w-full">
          {/* ICON */}

          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-6 shadow-inner">
              {activePortal.icon}
            </div>
          </div>

          <h3 className="font-bold text-xl text-slate-800 text-center mb-1">
            Reset Your Password
          </h3>

          <p className="text-xs text-slate-400 mb-8 tracking-wide font-medium uppercase text-center">
            {activePortal.label} Gateway
          </p>

          {/* =================================================
              MESSAGE
          ================================================= */}

          {message && (
            <div className="mb-6 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {message}
            </div>
          )}

          {/* =================================================
              ERROR
          ================================================= */}

          {error && (
            <div className="mb-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* =================================================
              FORM
          ================================================= */}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="forgot-password-email"
                className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5"
              >
                Email Address
              </label>

              <input
                id="forgot-password-email"
                type="email"
                required
                disabled={isSubmitting}
                autoComplete="email"
                placeholder="Enter your registered email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setMessage("");
                  setError("");
                }}
                className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 ${activePortal.ring} focus:bg-white transition disabled:opacity-60`}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full bg-gradient-to-r ${activePortal.accent} text-white py-3 rounded-xl text-sm font-semibold tracking-wide shadow-sm hover:opacity-95 transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              {isSubmitting ? "Sending Reset Link..." : "Send Reset Link"}
            </button>
          </form>

          {/* =================================================
              BACK TO LOGIN
          ================================================= */}

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() =>
                navigate("/login", {
                  state: {
                    role: activeRole,
                    email,
                  },
                })
              }
              disabled={isSubmitting}
              className="text-xs font-semibold text-slate-400 hover:text-slate-800 hover:underline transition disabled:opacity-50"
            >
              ← Back to Login
            </button>
          </div>

          {/* =================================================
              CREATE ACCOUNT
          ================================================= */}

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

        {/* ===================================================
            FOOTER
        =================================================== */}

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

export default ForgotPassword;
