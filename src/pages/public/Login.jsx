import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  supabaseStudent,
  supabaseRegistrar,
  supabaseCompany,
} from "../../supabaseClient";

const Login = () => {
  const navigate = useNavigate();

  // =========================================================
  // FORM STATES
  // =========================================================

  const [credential, setCredential] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // =========================================================
  // ROLE-SPECIFIC SUPABASE CLIENTS
  // =========================================================

  const roleClients = {
    student: supabaseStudent,
    registrar: supabaseRegistrar,
    company: supabaseCompany,
  };

  // =========================================================
  // CREATE AUDIT LOG
  // =========================================================

  const createAuditLog = async (
    supabaseClient,
    {
      action,
      module,
      targetEntityType = null,
      targetEntityId = null,
      details = null,
    }
  ) => {
    try {
      const { data, error } = await supabaseClient.functions.invoke(
        "create-audit-log",
        {
          body: {
            action,
            module,
            target_entity_type: targetEntityType,
            target_entity_id: targetEntityId,
            details,
          },
        }
      );

      if (error) {
        console.error("Create audit log function error:", error);
        return null;
      }

      if (!data?.success) {
        console.error("Create audit log failed:", data?.error);
        return null;
      }

      console.log("Audit log created successfully:", data.auditLog);
      return data.auditLog;
    } catch (error) {
      console.error("Unexpected audit log error:", error);
      return null;
    }
  };

  // =========================================================
  // RESOLVE LOGIN CREDENTIAL
  // =========================================================

  const resolveLoginEmail = async (inputCredential) => {
    const normalizedCredential = inputCredential.trim();

    if (!normalizedCredential) {
      throw new Error("Please enter your email or account ID.");
    }

    const { data, error } = await supabaseCompany.functions.invoke(
      "resolve-login-credential",
      {
        body: {
          credential: normalizedCredential,
        },
      }
    );

    if (error) {
      console.error("Resolve login credential function error:", error);
      throw new Error(
        "Unable to verify your login credential. Please try again."
      );
    }

    if (!data?.success) {
      throw new Error(data?.error || "Invalid login credential.");
    }

    if (!data?.email || !data?.role) {
      throw new Error(
        "Unable to identify your SIMS account. Please contact the administrator."
      );
    }

    const resolvedEmail = data.email.trim().toLowerCase();
    const resolvedRole = data.role.toLowerCase();

    if (!roleClients[resolvedRole]) {
      throw new Error(
        "Your account has an unsupported SIMS role. Please contact the administrator."
      );
    }

    console.log("Login credential resolved:", {
      credentialType: normalizedCredential.includes("@")
        ? "email"
        : "identifier",
      role: resolvedRole,
    });

    return {
      email: resolvedEmail,
      role: resolvedRole,
    };
  };

  // =========================================================
  // AUTHENTICATE USING ROLE-SPECIFIC CLIENT
  // =========================================================

  const authenticateUser = async (email, userPassword, resolvedRole) => {
    const client = roleClients[resolvedRole];

    if (!client) {
      throw new Error("Unable to identify your SIMS account role.");
    }

    console.log(`Attempting authentication using ${resolvedRole} client...`);

    const { data, error } = await client.auth.signInWithPassword({
      email,
      password: userPassword,
    });

    if (error || !data?.user) {
      console.warn(
        `Authentication failed using ${resolvedRole} client:`,
        error
      );
      throw new Error("Invalid email or password.");
    }

    console.log("Authentication successful:", {
      role: resolvedRole,
      userId: data.user.id,
    });

    return {
      role: resolvedRole,
      client,
      authData: data,
    };
  };

  // =========================================================
  // LOGIN
  // =========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) return;

    const normalizedCredential = credential.trim();

    if (!normalizedCredential || !password) {
      alert("Email or account ID and password are required.");
      return;
    }

    let authenticatedClient = null;

    try {
      setIsSubmitting(true);

      // 1. RESOLVE CREDENTIAL
      const { email, role: resolvedRole } = await resolveLoginEmail(
        normalizedCredential
      );

      // 2. AUTHENTICATE
      const authentication = await authenticateUser(
        email,
        password,
        resolvedRole
      );

      const {
        role: authenticatedRole,
        client: supabaseClient,
        authData,
      } = authentication;

      authenticatedClient = supabaseClient;

      const authenticatedUser = authData.user;

      // 3. FETCH OFFICIAL USER RECORD
      const { data: userRecord, error: userError } = await supabaseClient
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

        await supabaseClient.auth.signOut();
        authenticatedClient = null;

        throw new Error(
          "Unable to load your SIMS account information. Please try again."
        );
      }

      // 4. VERIFY USER RECORD
      if (!userRecord) {
        console.error(
          "Authenticated account has no users table record:",
          authenticatedUser.id
        );

        await supabaseClient.auth.signOut();
        authenticatedClient = null;

        throw new Error(
          "Your account has not been activated in SIMS yet. Please contact the administrator."
        );
      }

      console.log("SIMS user record:", userRecord);

      // 5. VERIFY ACCOUNT STATUS
      const accountStatus = userRecord.status?.toLowerCase();

      if (accountStatus !== "active") {
        await supabaseClient.auth.signOut();
        authenticatedClient = null;

        if (accountStatus === "pending") {
          throw new Error(
            "Your account is still pending approval. Please wait for the administrator to review your registration."
          );
        }

        if (accountStatus === "rejected") {
          throw new Error(
            "Your SIMS account is currently rejected. Please submit a new registration request."
          );
        }

        throw new Error(
          "Your SIMS account is not currently active. Please contact the administrator."
        );
      }

      // 6. DETECT AND VERIFY ROLE
      const databaseRole = userRecord.role?.toLowerCase();

      if (!roleClients[databaseRole]) {
        await supabaseClient.auth.signOut();
        authenticatedClient = null;

        throw new Error(
          "Your account has an unsupported SIMS role. Please contact the administrator."
        );
      }

      if (resolvedRole !== databaseRole) {
        console.error("Resolved role does not match database role:", {
          resolvedRole,
          databaseRole,
        });

        await supabaseClient.auth.signOut();
        authenticatedClient = null;

        throw new Error(
          "Unable to verify your account role. Please contact the administrator."
        );
      }

      if (authenticatedRole !== databaseRole) {
        console.error("Authenticated role mismatch:", {
          authenticatedRole,
          databaseRole,
        });

        await supabaseClient.auth.signOut();
        authenticatedClient = null;

        throw new Error(
          "Your account role could not be verified. Please try again."
        );
      }

      console.log("Account role detected:", databaseRole);

      // 7. DETERMINE DESTINATION
      const destinations = {
        student: "/student/dashboard",
        registrar: "/registrar/dashboard",
        company: "/company/dashboard",
      };

      const destination = destinations[databaseRole];

      // 8. CREATE LOGIN AUDIT LOG
      const fullName = [
        userRecord.first_name,
        userRecord.middle_name,
        userRecord.last_name,
      ]
        .filter(Boolean)
        .join(" ")
        .trim();

      await createAuditLog(supabaseClient, {
        action: "LOGIN",
        module: "Authentication",
        targetEntityType: "User",
        targetEntityId: userRecord.id,
        details: {
          name: fullName || null,
          email: userRecord.email,
          role: userRecord.role,
          portal: databaseRole,
          login_method: normalizedCredential.includes("@")
            ? "email"
            : "identifier",
        },
      });

      // 9. SUCCESSFUL LOGIN
      console.log("Login successful:", {
        id: userRecord.id,
        email: userRecord.email,
        role: databaseRole,
        status: userRecord.status,
        destination,
      });

      navigate(destination, {
        replace: true,
      });
    } catch (error) {
      console.error("Unexpected login error:", error);

      if (authenticatedClient) {
        await authenticatedClient.auth.signOut();
      }

      alert(
        error?.message ||
          "Something went wrong while signing in. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div
      className="public-login flex min-h-screen flex-col bg-slate-50 text-slate-900 transition-colors duration-300"
      style={{ colorScheme: "light" }}
    >
      <main className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-14 sm:py-20">
        {/* BACKGROUND DECORATION */}
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden"
          aria-hidden="true"
        >
          <div className="absolute -left-24 -top-32 h-80 w-80 rounded-full bg-blue-200/40 blur-3xl" />
          <div className="absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-indigo-200/40 blur-3xl" />
        </div>

        <div className="relative z-10 w-full max-w-md">
          {/* HEADER */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200/60">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-7 w-7"
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 3 3.5 7.5 12 12l8.5-4.5L12 3Z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.5 10.2v5.1c3.5 2.5 7.5 2.5 11 0v-5.1M21 8v6"
                />
              </svg>
            </div>

            <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-slate-500">
              Student Internships Management System
            </p>

            <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              Welcome back
            </h1>

            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-500">
              Sign in to access your SIMS account and continue where you left
              off.
            </p>
          </div>

          {/* LOGIN CARD */}
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60">
            <div className="h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600" />

            <div className="p-6 sm:p-8">
              {/* CARD HEADER */}
              <div className="mb-7 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-7 w-7"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M10 17l5-5-5-5m5 5H3"
                    />
                  </svg>
                </div>

                <h2 className="text-xl font-extrabold text-slate-900">
                  Sign in to your account
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Enter your registered email address or account ID.
                </p>
              </div>

              {/* LOGIN FORM */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* EMAIL OR ACCOUNT ID */}
                <div>
                  <label
                    htmlFor="login-credential"
                    className="mb-2 block text-xs font-bold text-slate-700"
                  >
                    Email Address or Account ID
                  </label>

                  <input
                    id="login-credential"
                    type="text"
                    required
                    disabled={isSubmitting}
                    autoComplete="username"
                    placeholder="Enter your email or account ID"
                    value={credential}
                    onChange={(e) => setCredential(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 disabled:opacity-60"
                  />

                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    You may use your email address, Student Number, or Employee
                    ID.
                  </p>
                </div>

                {/* PASSWORD */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label
                      htmlFor="login-password"
                      className="block text-xs font-bold text-slate-700"
                    >
                      Password
                    </label>

                    <Link
                      to="/forgot-password"
                      className="text-xs font-semibold text-indigo-600 transition hover:text-indigo-700 hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  <div className="relative">
                    <input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      required
                      disabled={isSubmitting}
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 disabled:opacity-60"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((previous) => !previous)}
                      disabled={isSubmitting}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      aria-pressed={showPassword}
                      className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-slate-400 transition hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 disabled:opacity-50"
                    >
                      {showPassword ? (
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          className="h-5 w-5"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m3 3 18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.1A10.8 10.8 0 0 1 12 4.9c5.2 0 8.6 4 9.5 7.1a11.8 11.8 0 0 1-4.2 5.4M6.6 6.6C4.4 8 3 10 2.5 12c.9 3.1 4.3 7.1 9.5 7.1 1.2 0 2.3-.2 3.2-.6"
                          />
                        </svg>
                      ) : (
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          className="h-5 w-5"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z"
                          />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* SIGN IN BUTTON */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 px-4 py-3.5 text-sm font-bold text-white shadow-md transition hover:brightness-105 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        className="h-4 w-4"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 12h14m-6-6 6 6-6 6"
                        />
                      </svg>
                    </>
                  )}
                </button>
              </form>

              {/* CREATE ACCOUNT */}
              <div className="mt-7 border-t border-slate-200 pt-6 text-center">
                <p className="text-sm text-slate-500">
                  Don't have an account?{" "}
                  <Link
                    to="/signup"
                    className="font-bold text-indigo-600 hover:text-indigo-700 hover:underline"
                  >
                    Create an account
                  </Link>
                </p>
              </div>
            </div>
          </section>

          {/* FOOTER */}
          <footer className="mt-7 text-center text-xs text-slate-500">
            <p>© 2026 SIMS. All rights reserved.</p>

            <div className="mt-2 flex items-center justify-center gap-3">
              <Link
                to="/privacy"
                className="transition hover:text-slate-800"
              >
                Privacy Policy
              </Link>

              <span aria-hidden="true">·</span>

              <Link
                to="/terms"
                className="transition hover:text-slate-800"
              >
                Terms of Service
              </Link>
            </div>

            {/* ADMIN LOGIN REMAINS SEPARATE */}
            <p className="mt-3 text-[11px] text-slate-500">
              Administrator?{" "}
              <Link
                to="/admin/login"
                className="font-semibold text-slate-600 hover:text-slate-900 hover:underline"
              >
                Go to Admin Login
              </Link>
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
};

export default Login;

