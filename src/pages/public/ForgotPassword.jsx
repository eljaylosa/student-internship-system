import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";

const ForgotPassword = () => {
  const navigate = useNavigate();

  // =========================================================
  // FORM
  // =========================================================

  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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

    // =======================================================
    // VALIDATE EMAIL
    // =======================================================

    if (!normalizedEmail) {
      setError("Please enter your email address.");
      return;
    }

    try {
      setIsSubmitting(true);

      // =====================================================
      // PASSWORD RESET EDGE FUNCTION
      // =====================================================
      //
      // We intentionally do NOT send a role here.
      //
      // Password recovery is based on the email address.
      // The Edge Function generates the secure Supabase
      // recovery link and sends it through Gmail SMTP.
      //
      // We do NOT call:
      //
      // supabase.auth.resetPasswordForEmail(...)
      //
      // because that uses Supabase's built-in email provider.
      // =====================================================

      const { data, error: functionError } = await supabase.functions.invoke(
        "send-password-reset-email",
        {
          body: {
            email: normalizedEmail,
          },
        }
      );

      // =====================================================
      // EDGE FUNCTION ERROR
      // =====================================================

      if (functionError) {
        console.error("Password reset Edge Function error:", functionError);

        setError("Unable to send the password reset email. Please try again.");

        return;
      }

      // =====================================================
      // FUNCTION RESPONSE ERROR
      // =====================================================

      if (data?.error) {
        console.error("Password reset request failed:", data.error);

        setError("Unable to send the password reset email. Please try again.");

        return;
      }

      // =====================================================
      // GENERIC SUCCESS MESSAGE
      // =====================================================
      //
      // Do not reveal whether the email exists in the system.
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
      <main className="flex-1 flex flex-col items-center justify-center py-20 px-4 max-w-3xl mx-auto w-full">
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
            CARD
        =================================================== */}

        <div className="bg-white rounded-2xl p-8 md:p-10 shadow-xl border border-slate-100 w-full max-w-lg">
          {/* =================================================
              ICON
          ================================================= */}

          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-6 shadow-inner">
              <svg
                className="w-8 h-8 text-slate-700"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
          </div>

          <h3 className="font-bold text-xl text-slate-800 text-center mb-1">
            Reset Your Password
          </h3>

          <p className="text-xs text-slate-400 mb-8 tracking-wide font-medium uppercase text-center">
            Account Recovery
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

          {!message && (
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-800 focus:bg-white transition disabled:opacity-60"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-slate-700 to-slate-900 text-white py-3 rounded-xl text-sm font-semibold tracking-wide shadow-sm hover:opacity-95 transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Sending Reset Link..." : "Send Reset Link"}
              </button>
            </form>
          )}

          {/* =================================================
              BACK TO LOGIN
          ================================================= */}

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() =>
                navigate("/login", {
                  state: {
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
                className="font-bold text-slate-700 hover:underline"
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
