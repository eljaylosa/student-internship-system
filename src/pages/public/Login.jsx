import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { getUserHome, useMockStore } from "../../data/mockStore.jsx";

const Login = () => {
  // Active role tab
  const [activeRole, setActiveRole] = useState("student");

  // Independent form states for each user role
  const [forms, setForms] = useState({
    student: {
      emailOrId: "",
      password: "",
    },

    faculty: {
      emailOrId: "",
      password: "",
    },

    company: {
      emailOrId: "",
      password: "",
    },
  });

  // Update the form based on the selected role
  const handleChange = (role, field, value) => {
    setForms((prev) => ({
      ...prev,
      [role]: {
        ...prev[role],
        [field]: value,
      },
    }));
  };

  const navigate = useNavigate();
  const { login } = useMockStore();

  const demoAccounts = {
    student: { email: "student@gmail.com", id: "STU-001", password: "password" },
    faculty: { email: "faculty@gmail.com", id: "FAC-001", password: "password" },
    company: { email: "company@gmail.com", id: "SUP-001", password: "password" },
  };

  // Handle login submission through the shared frontend session.
  const handleSubmit = (e) => {
    e.preventDefault();
    const currentForm = forms[activeRole];
    const result = login(activeRole, currentForm.emailOrId.trim(), currentForm.password);
    if (!result.ok) {
      alert(result.message);
      return;
    }
    navigate(getUserHome(activeRole), { replace: true });
  };

  // Portal configuration
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

        <span className="text-xs uppercase tracking-widest text-white border-b-2 border-blue-400 pb-0.5 font-bold">
          Login
        </span>
      </header>

      {/* Main Login Area */}
      <main className="flex-1 flex flex-col items-center justify-center py-14 px-4 max-w-3xl mx-auto w-full">
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
            {/* Account Access ID */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Account Access ID
              </label>

              <input
                type="text"
                required
                placeholder="Email or ID Number"
                value={forms[activeRole].emailOrId}
                onChange={(e) =>
                  handleChange(activeRole, "emailOrId", e.target.value)
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-800 focus:bg-white transition"
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
                placeholder="••••••••"
                value={forms[activeRole].password}
                onChange={(e) =>
                  handleChange(activeRole, "password", e.target.value)
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-800 focus:bg-white transition"
              />
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              className={`w-full bg-gradient-to-r ${activePortal.accent} text-white py-3 rounded-xl text-sm font-semibold tracking-wide shadow-sm hover:opacity-95 transition-all duration-200 cursor-pointer`}
            >
              Sign In as {activePortal.label}
            </button>

            {/* Forgot Password */}
            <div className="text-center">
              <a
                href="#"
                className="text-xs font-semibold text-slate-400 hover:text-slate-800 hover:underline transition"
              >
                Forgot Password?
              </a>
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
