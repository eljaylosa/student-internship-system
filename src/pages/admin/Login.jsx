import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";

const AdminLogin = () => {
  const navigate = useNavigate();

  // =========================================================
  // STATE
  // =========================================================

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // =========================================================
  // HANDLE INPUT
  // =========================================================

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    setErrorMessage("");
  };

  // =========================================================
  // HANDLE LOGIN
  // =========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setErrorMessage("");

    const email = formData.email.trim();
    const password = formData.password;

    // ---------------------------------------------------------
    // BASIC VALIDATION
    // ---------------------------------------------------------

    if (!email || !password) {
      setErrorMessage("Please enter your email and password.");
      return;
    }

    setIsLoading(true);

    try {
      // -------------------------------------------------------
      // SIGN IN THROUGH SUPABASE AUTH
      // -------------------------------------------------------

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Admin login error:", error);

        setErrorMessage(
          error.message === "Invalid login credentials"
            ? "Invalid administrator credentials."
            : error.message
        );

        return;
      }

      // -------------------------------------------------------
      // VERIFY AUTH USER
      // -------------------------------------------------------

      const authenticatedUser = data?.user;

      if (!authenticatedUser) {
        console.error("No authenticated user returned from Supabase.");

        setErrorMessage(
          "Unable to establish an administrator session. Please try again."
        );

        return;
      }

      console.log("Admin authenticated successfully:", {
        id: authenticatedUser.id,
        email: authenticatedUser.email,
      });

      // -------------------------------------------------------
      // ADMIN EMAIL CHECK
      // -------------------------------------------------------
      //
      // Since this is a dedicated Admin Login page, we only
      // allow the designated administrator account here.
      //
      // This prevents another Supabase Auth account from using
      // the Admin Login page.
      // -------------------------------------------------------

      if (authenticatedUser.email?.toLowerCase() !== "admin@gmail.com") {
        console.error(
          "Authenticated account is not authorized as administrator:",
          authenticatedUser.email
        );

        await supabase.auth.signOut();

        setErrorMessage("This account is not authorized as an administrator.");

        return;
      }

      // -------------------------------------------------------
      // SUCCESS
      // -------------------------------------------------------

      navigate("/admin/dashboard", {
        replace: true,
      });
    } catch (error) {
      console.error("Unexpected admin login error:", error);

      setErrorMessage(
        "Something went wrong while signing in. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // =========================================================
  // RETURN
  // =========================================================

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* =====================================================
            ADMIN LOGIN CARD
        ===================================================== */}

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          {/* ===================================================
              HEADER
          =================================================== */}

          <div className="px-6 sm:px-8 pt-8 pb-6 text-center">
            {/* ADMIN ICON */}

            <div className="mx-auto mb-5 w-14 h-14 rounded-xl bg-slate-800 flex items-center justify-center">
              <span className="text-2xl text-white">⚙</span>
            </div>

            {/* LABEL */}

            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400 mb-1">
              SIMS Administration
            </p>

            {/* TITLE */}

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
              Administrator Login
            </h1>

            {/* DESCRIPTION */}

            <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
              Sign in to access the Student Internship Management System
              administration portal.
            </p>
          </div>

          {/* ===================================================
              FORM
          =================================================== */}

          <form onSubmit={handleSubmit} className="px-6 sm:px-8 pb-8">
            {/* ERROR MESSAGE */}

            {errorMessage && (
              <div className="mb-5 px-4 py-3 rounded-lg border bg-red-50 border-red-200 text-red-700">
                <p className="text-xs font-medium">{errorMessage}</p>
              </div>
            )}

            {/* EMAIL */}

            <div className="mb-4">
              <label
                htmlFor="admin-email"
                className="block text-xs font-bold text-slate-700 mb-1.5"
              >
                Administrator Email
              </label>

              <input
                id="admin-email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="Enter administrator email"
                autoComplete="email"
                disabled={isLoading}
                className="
                  w-full
                  h-11
                  px-3
                  rounded-lg
                  border
                  border-slate-300
                  bg-slate-50
                  text-sm
                  text-slate-800
                  placeholder:text-slate-400
                  outline-none
                  transition
                  focus:bg-white
                  focus:border-slate-700
                  disabled:opacity-60
                  disabled:cursor-not-allowed
                "
              />
            </div>

            {/* PASSWORD */}

            <div className="mb-6">
              <label
                htmlFor="admin-password"
                className="block text-xs font-bold text-slate-700 mb-1.5"
              >
                Password
              </label>

              <div className="relative">
                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  placeholder="Enter administrator password"
                  autoComplete="current-password"
                  disabled={isLoading}
                  className="
                    w-full
                    h-11
                    px-3
                    pr-20
                    rounded-lg
                    border
                    border-slate-300
                    bg-slate-50
                    text-sm
                    text-slate-800
                    placeholder:text-slate-400
                    outline-none
                    transition
                    focus:bg-white
                    focus:border-slate-700
                    disabled:opacity-60
                    disabled:cursor-not-allowed
                  "
                />

                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => setShowPassword(!showPassword)}
                  className="
                    absolute
                    right-3
                    top-1/2
                    -translate-y-1/2
                    text-[10px]
                    font-bold
                    text-slate-500
                    hover:text-slate-800
                    transition
                    disabled:opacity-40
                  "
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* LOGIN BUTTON */}

            <button
              type="submit"
              disabled={isLoading}
              className="
                w-full
                h-11
                rounded-lg
                bg-slate-800
                text-white
                text-xs
                font-bold
                hover:bg-slate-700
                disabled:bg-slate-400
                disabled:cursor-not-allowed
                transition
              "
            >
              {isLoading ? "Signing In..." : "Sign In as Administrator"}
            </button>

            {/* SECURITY NOTICE */}

            <div className="mt-6 pt-5 border-t border-slate-200">
              <div className="flex items-start gap-2.5">
                <span className="text-sm">🔒</span>

                <p className="text-[10px] text-slate-400 leading-relaxed">
                  This area is restricted to authorized system administrators.
                  Unauthorized access is prohibited.
                </p>
              </div>
            </div>
          </form>
        </div>

        {/* =====================================================
            BACK TO PUBLIC SITE
        ===================================================== */}

        <button
          type="button"
          onClick={() => navigate("/")}
          className="
            block
            mx-auto
            mt-5
            text-xs
            font-semibold
            text-slate-500
            hover:text-slate-900
            transition
          "
        >
          ← Back to Main Website
        </button>

        {/* =====================================================
            DEVELOPMENT NOTE
        ===================================================== */}

        <p className="text-center text-[9px] text-slate-400 mt-4">
          SIMS Administration Portal
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
