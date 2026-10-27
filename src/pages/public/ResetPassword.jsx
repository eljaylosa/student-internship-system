import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";

const PASSWORD_RULES = [
  {
    label: "At least 8 characters",
    test: (password) => password.length >= 8,
  },
  {
    label: "One uppercase letter (A–Z)",
    test: (password) => /[A-Z]/.test(password),
  },
  {
    label: "One lowercase letter (a–z)",
    test: (password) => /[a-z]/.test(password),
  },
  {
    label: "One number (0–9)",
    test: (password) => /\d/.test(password),
  },
  {
    label: "One special character (!@#$%)",
    test: (password) => /[^A-Za-z0-9]/.test(password),
  },
];

const EyeIcon = ({ visible }) =>
  visible ? (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 3l18 18" />
      <path d="M10.58 10.59a2 2 0 002.83 2.83" />
      <path d="M9.88 5.09A10.76 10.76 0 0112 4.88c5.23 0 8.63 4.05 9.5 7.12a11.77 11.77 0 01-4.16 5.36" />
      <path d="M6.61 6.61C4.4 8.03 3.02 10.03 2.5 12c.87 3.07 4.27 7.12 9.5 7.12 1.17 0 2.25-.23 3.23-.63" />
    </svg>
  ) : (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );

const ResetPassword = () => {
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sessionInvalid, setSessionInvalid] = useState(false);

  const passwordChecks = PASSWORD_RULES.map((rule) => ({
    label: rule.label,
    passed: rule.test(password),
  }));

  const isStrongPassword = passwordChecks.every((rule) => rule.passed);

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (sessionError) {
          console.error("Password recovery session error:", sessionError);

          setError(
            "Unable to verify your password recovery session. Please request a new reset link."
          );
          setSessionInvalid(true);
          return;
        }

        if (!session) {
          setError(
            "This password reset link is invalid, expired, or has already been used. Please request a new reset link."
          );
          setSessionInvalid(true);
          return;
        }

        console.log("Password recovery session verified:", {
          email: session.user?.email,
          userId: session.user?.id,
        });
      } catch (err) {
        console.error("Unexpected password recovery session error:", err);

        if (mounted) {
          setError(
            "Unable to verify your password recovery session. Please request a new reset link."
          );
          setSessionInvalid(true);
        }
      } finally {
        if (mounted) {
          setCheckingSession(false);
        }
      }
    };

    checkSession();

    return () => {
      mounted = false;
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    setError("");
    setMessage("");

    if (!password || !confirmPassword) {
      setError("Please enter and confirm your password.");
      return;
    }

    if (!isStrongPassword) {
      setError("Your password does not meet all the strength requirements.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("Recovery session verification error:", sessionError);

        setError(
          "Unable to verify your password recovery session. Please request a new reset link."
        );
        setSessionInvalid(true);
        return;
      }

      if (!session) {
        setError(
          "This password reset session is invalid or has expired. Please request a new reset link."
        );
        setSessionInvalid(true);
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        console.error("Password update error:", updateError);

        setError(
          updateError.message ||
            "Unable to update your password. Please try again."
        );
        return;
      }

      setPassword("");
      setConfirmPassword("");
      setShowPassword(false);
      setShowConfirmPassword(false);

      setMessage(
        "Your password has been updated successfully. You can now log in."
      );

      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) {
        console.warn("Recovery session sign-out warning:", signOutError);
      }

      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 2000);
    } catch (err) {
      console.error("Unexpected password update error:", err);

      setError(
        "Something went wrong while updating your password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = (value) => {
    setPassword(value);
    setError("");
  };

  const handleConfirmPasswordChange = (value) => {
    setConfirmPassword(value);
    setError("");
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 text-center max-w-md w-full">
          <div className="w-12 h-12 mx-auto mb-5 rounded-xl bg-slate-100 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-slate-500 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
          </div>

          <h2 className="text-xl font-bold text-slate-800">
            Verifying Reset Link
          </h2>

          <p className="text-sm text-slate-500 mt-2">
            Please wait while we verify your password recovery session.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 font-sans text-gray-800 flex flex-col">
      <main className="flex-1 flex flex-col items-center justify-center py-20 px-4 w-full">
        <div className="w-full max-w-lg">
          <div className="bg-white rounded-2xl p-8 md:p-10 shadow-xl border border-slate-100">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-6 shadow-inner">
                <svg
                  className="w-8 h-8 text-slate-700"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
            </div>

            <h1 className="text-2xl font-black tracking-tight text-slate-900 text-center">
              Reset Your Password
            </h1>

            <p className="text-sm text-slate-500 text-center mt-2 mb-8">
              Create a strong new password for your SIMS account.
            </p>

            {error && (
              <div
                role="alert"
                className="mb-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            {message && (
              <div
                role="status"
                className="mb-6 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
              >
                {message}
              </div>
            )}

            {!sessionInvalid && !message && (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* NEW PASSWORD */}
                <div>
                  <label
                    htmlFor="new-password"
                    className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5"
                  >
                    New Password
                  </label>

                  <div className="relative">
                    <input
                      id="new-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => handlePasswordChange(e.target.value)}
                      placeholder="Enter your new password"
                      autoComplete="new-password"
                      disabled={loading}
                      required
                      aria-describedby="password-requirements"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pr-12 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-800 focus:bg-white transition disabled:opacity-60"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      disabled={loading}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      aria-pressed={showPassword}
                      className="absolute inset-y-0 right-0 z-10 flex items-center justify-center w-12 text-slate-400 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 rounded-r-xl disabled:opacity-50"
                    >
                      <EyeIcon visible={showPassword} />
                    </button>
                  </div>

                  <div
                    id="password-requirements"
                    className="mt-3 rounded-xl bg-slate-50 border border-slate-100 p-3"
                  >
                    <p className="text-xs font-semibold text-slate-600 mb-2">
                      Password requirements
                    </p>

                    <ul className="space-y-1.5">
                      {passwordChecks.map((rule) => (
                        <li
                          key={rule.label}
                          className={`flex items-center gap-2 text-xs ${
                            rule.passed ? "text-emerald-700" : "text-slate-500"
                          }`}
                        >
                          {rule.passed ? (
                            <svg
                              className="w-4 h-4 shrink-0"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              aria-hidden="true"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16Zm3.78-9.72a.75.75 0 00-1.06-1.06L9 10.94 7.28 9.22a.75.75 0 10-1.06 1.06l2.25 2.25a.75.75 0 001.06 0l4.25-4.25Z"
                                clipRule="evenodd"
                              />
                            </svg>
                          ) : (
                            <span
                              className="w-4 h-4 shrink-0 rounded-full border border-slate-300"
                              aria-hidden="true"
                            />
                          )}
                          <span>{rule.label}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* CONFIRM PASSWORD */}
                <div>
                  <label
                    htmlFor="confirm-password"
                    className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5"
                  >
                    Confirm Password
                  </label>

                  <div className="relative">
                    <input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) =>
                        handleConfirmPasswordChange(e.target.value)
                      }
                      placeholder="Confirm your new password"
                      autoComplete="new-password"
                      disabled={loading}
                      required
                      aria-invalid={
                        confirmPassword.length > 0 &&
                        password !== confirmPassword
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pr-12 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-800 focus:bg-white transition disabled:opacity-60"
                    />

                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      disabled={loading}
                      aria-label={
                        showConfirmPassword
                          ? "Hide confirm password"
                          : "Show confirm password"
                      }
                      aria-pressed={showConfirmPassword}
                      className="absolute inset-y-0 right-0 z-10 flex items-center justify-center w-12 text-slate-400 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 rounded-r-xl disabled:opacity-50"
                    >
                      <EyeIcon visible={showConfirmPassword} />
                    </button>
                  </div>

                  {confirmPassword.length > 0 && (
                    <p
                      className={`mt-1.5 text-xs ${
                        password === confirmPassword
                          ? "text-emerald-700"
                          : "text-red-600"
                      }`}
                    >
                      {password === confirmPassword
                        ? "Passwords match."
                        : "Passwords do not match."}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || !isStrongPassword}
                  className="w-full bg-gradient-to-r from-slate-700 to-slate-900 text-white py-3 rounded-xl text-sm font-semibold tracking-wide shadow-sm hover:opacity-95 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Updating Password..." : "Update Password"}
                </button>
              </form>
            )}

            {sessionInvalid && (
              <button
                type="button"
                onClick={() => navigate("/forgot-password", { replace: true })}
                className="w-full mt-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-semibold hover:bg-slate-50 transition"
              >
                Request a New Reset Link
              </button>
            )}

            {message && (
              <button
                type="button"
                onClick={() => navigate("/login", { replace: true })}
                className="w-full mt-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-semibold hover:bg-slate-50 transition"
              >
                Back to Login
              </button>
            )}
          </div>

          <div className="text-center mt-6">
            <p className="text-xs text-slate-400">
              © 2026 SIMS |{" "}
              <button
                type="button"
                onClick={() => navigate("/privacy")}
                className="hover:text-slate-700"
              >
                Privacy Policy
              </button>{" "}
              |{" "}
              <button
                type="button"
                onClick={() => navigate("/terms")}
                className="hover:text-slate-700"
              >
                Terms of Service
              </button>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ResetPassword;
