import React, { useState } from "react";
import { Link } from "react-router-dom";

const Login = () => {
  // Authentication form state parameters
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
    role: "student", // Default configuration matching your signup model
    rememberMe: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setLoginData({
      ...loginData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Ready for integration with your API / Backend framework
    console.log("Authenticating User Session Data:", loginData);
    alert(
      `Logged in successfully to the ${loginData.role} dashboard environment!`
    );
  };

  return (
    <section className="bg-gray-50 min-h-screen flex items-center justify-center py-28 px-6 font-mono">
      <div className="max-w-md w-full mx-auto bg-white p-8 md:p-10 rounded-2xl shadow-sm border border-gray-100 text-left">
        {/* Header Block */}
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome Back
          </h2>
          <p className="text-xs text-gray-500">
            Access your InternLink gateway portal.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Institutional Email Address Input */}
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide"
            >
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              value={loginData.email}
              onChange={handleChange}
              placeholder="username@bpsu.edu.ph"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-xs"
            />
          </div>

          {/* Account Password Input */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label
                htmlFor="password"
                className="block text-xs font-bold text-gray-700 uppercase tracking-wide"
              >
                Password
              </label>
              <a href="#" className="text-[11px] text-blue-600 hover:underline">
                Forgot Password?
              </a>
            </div>
            <input
              type="password"
              id="password"
              name="password"
              required
              value={loginData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-xs"
            />
          </div>

          {/* Portal Gateway Role Selection Combobox */}
          <div>
            <label
              htmlFor="role"
              className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide"
            >
              Select Gateway Portal:
            </label>
            <div className="relative">
              <select
                id="role"
                name="role"
                value={loginData.role}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-xs text-gray-700 cursor-pointer appearance-none"
              >
                <option value="student">🎓 Student Portal</option>
                <option value="faculty-adviser">👨‍🏫 Faculty Adviser</option>
                <option value="school-clerk">💼 School Clerk / Admin</option>
              </select>
              {/* Custom Down Arrow Decoration vector layout layer */}
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                <svg className="fill-current h-4 w-4" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Session Persistent Options Checkbox */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="rememberMe"
              name="rememberMe"
              checked={loginData.rememberMe}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
            />
            <label
              htmlFor="rememberMe"
              className="ml-2 block text-xs text-gray-600 cursor-pointer select-none"
            >
              Remember my credentials
            </label>
          </div>

          {/* Submit Action Button */}
          <button
            type="submit"
            className="w-full cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl text-xs tracking-wide transition shadow-sm hover:shadow duration-200"
          >
            Sign In to Portal
          </button>
        </form>

        {/* Form Bottom Toggle Redirection Link */}
        <p className="mt-6 text-center text-xs text-gray-500">
          New to the platform?{" "}
          <Link
            to="/signup"
            className="text-blue-600 hover:underline font-bold"
          >
            Create an account
          </Link>
        </p>
      </div>
    </section>
  );
};

export default Login;
