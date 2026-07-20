import React, { useState } from "react";
import { Link } from "react-router-dom";

const SignUp = () => {
  // Main form state holding your document's key user parameters
  const [signUpData, setSignUpData] = useState({
    name: "",
    email: "",
    password: "",
    role: "student", // Default starting selection
  });

  const handleChange = (e) => {
    setSignUpData({ ...signUpData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Ready for your backend connection (Firebase/Supabase/Node.js)
    console.log("Registering User Parameters:", signUpData);
    alert(`Account created successfully as a ${signUpData.role}!`);
  };

  return (
    <section className="bg-gray-50 min-h-screen flex items-center justify-center py-28 px-6 font-mono">
      <div className="max-w-md w-full mx-auto bg-white p-8 md:p-10 rounded-2xl shadow-sm border border-gray-100 text-left">
        {/* Header Block */}
        <div className="mb-8 text-center">
          <h3 className="text-red-400">
            *The portal is currently in development
          </h3>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Create Account
          </h2>
          <p className="text-xs text-gray-500">
            Join the InternLink project tracking environment.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Full Name Input */}
          <div>
            <label
              htmlFor="name"
              className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide"
            >
              Full Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              value={signUpData.name}
              onChange={handleChange}
              placeholder="Your Name"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-xs"
            />
          </div>

          {/* Institutional Email Input */}
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
              value={signUpData.email}
              onChange={handleChange}
              placeholder="username@gmail.com"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-xs"
            />
          </div>

          {/* --- THE ROLE COMBOBOX SELECT INPUT --- */}
          <div>
            <label
              htmlFor="role"
              className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide"
            >
              Sign Up As:
            </label>
            <div className="relative">
              <select
                id="role"
                name="role"
                value={signUpData.role}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-xs text-gray-700 cursor-pointer appearance-none"
              >
                <option value="student">🎓 Student Portal</option>
                <option value="faculty-adviser">👨‍🏫 Faculty Adviser</option>
                <option value="school-clerk">💼 School Clerk / Admin</option>
              </select>
              {/* Custom Vector Selection Down Arrow Decoration */}
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                <svg className="fill-current h-4 w-4" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Account Password Input */}
          <div>
            <label
              htmlFor="password"
              className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              required
              value={signUpData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-xs"
            />
          </div>

          {/* Submit Action Button */}
          <button
            type="submit"
            className="w-full cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl text-xs tracking-wide transition shadow-sm hover:shadow duration-200"
          >
            Register Profile
          </button>
        </form>

        {/* Form Bottom Toggle Link */}
        <p className="mt-6 text-center text-xs text-gray-500">
          Already registered?{" "}
          <Link to="/login" className="text-blue-600 hover:underline font-bold">
            Log In here
          </Link>
        </p>
      </div>
    </section>
  );
};

export default SignUp;
