import React, { useState } from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const closeMenu = () => setIsOpen(false);

  return (
    <nav className="bg-white/95 backdrop-blur-md shadow-sm fixed w-full z-50 top-0 left-0 border-b border-gray-100 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-6 md:px-8 h-20 flex justify-between items-center">
        {/* Brand Logo Link */}
        <Link
          to="/"
          onClick={closeMenu}
          className="font-bold text-2xl text-gray-900 hover:text-blue-600 font-mono tracking-tight transition duration-200"
        >
          Intern<span className="text-blue-600">Link</span>
        </Link>

        {/* --- DESKTOP NAVIGATION LINKS --- */}
        <div className="hidden md:flex space-x-8 items-center">
          <div className="flex space-x-6">
            <Link
              to="/"
              className="text-gray-600 hover:text-blue-600 font-mono text-sm font-medium transition duration-200"
            >
              Home
            </Link>
            <Link
              to="/about"
              className="text-gray-600 hover:text-blue-600 font-mono text-sm font-medium transition duration-200"
            >
              About
            </Link>
            <Link
              to="/services"
              className="text-gray-600 hover:text-blue-600 font-mono text-sm font-medium transition duration-200"
            >
              Services
            </Link>
            <Link
              to="/contact"
              className="text-gray-600 hover:text-blue-600 font-mono text-sm font-medium transition duration-200"
            >
              Contact
            </Link>
          </div>

          {/* Desktop Visual Divider Separator */}
          <div className="h-5 w-px bg-gray-200"></div>

          {/* Desktop Authentication Section */}
          <div className="flex space-x-3 items-center">
            <Link
              to="/login"
              className="cursor-pointer text-gray-700 hover:text-blue-600 border border-gray-200 hover:border-blue-600 px-4 py-2 rounded-xl text-xs font-semibold font-mono tracking-wide transition-all duration-200"
            >
              Login
            </Link>
            <Link
              to="/Signup"
              className="cursor-pointer bg-blue-600 text-white border border-transparent hover:bg-blue-700 px-4 py-2 rounded-xl text-xs font-semibold font-mono tracking-wide shadow-sm hover:shadow transition-all duration-200"
            >
              Sign Up
            </Link>
          </div>
        </div>

        {/* --- MOBILE BURGER ACTION TRIGGER BUTTON --- */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          type="button"
          className="md:hidden text-gray-600 hover:text-blue-600 focus:outline-none cursor-pointer p-2 rounded-xl border border-transparent hover:bg-gray-50 transition"
          aria-label="Toggle Navigation Menu"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {isOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* --- MOBILE DROPDOWN EXTENSION DRAWER --- */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 absolute top-full left-0 w-full shadow-xl py-6 px-6 flex flex-col space-y-3 backdrop-blur-md">
          <Link
            to="/"
            onClick={closeMenu}
            className="text-gray-600 hover:text-blue-600 font-mono text-sm font-medium py-2.5 px-3 rounded-xl hover:bg-gray-50 transition"
          >
            Home
          </Link>
          <Link
            to="/about"
            onClick={closeMenu}
            className="text-gray-600 hover:text-blue-600 font-mono text-sm font-medium py-2.5 px-3 rounded-xl hover:bg-gray-50 transition"
          >
            About
          </Link>
          <Link
            to="/services"
            onClick={closeMenu}
            className="text-gray-600 hover:text-blue-600 font-mono text-sm font-medium py-2.5 px-3 rounded-xl hover:bg-gray-50 transition"
          >
            Services
          </Link>
          <Link
            to="/contact"
            onClick={closeMenu}
            className="text-gray-600 hover:text-blue-600 font-mono text-sm font-medium py-2.5 px-3 rounded-xl hover:bg-gray-50 transition mb-2"
          >
            Contact
          </Link>

          {/* Mobile Split Button Matrix Group */}
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100">
            <Link
              to="/login"
              onClick={closeMenu}
              className="cursor-pointer text-center text-gray-700 border border-gray-200 py-3 rounded-xl text-xs font-semibold font-mono transition active:bg-gray-50"
            >
              Login
            </Link>
            <Link
              to="/signup"
              onClick={closeMenu}
              className="cursor-pointer text-center bg-blue-600 text-white py-3 rounded-xl text-xs font-semibold font-mono shadow-sm transition active:bg-blue-700"
            >
              Sign Up
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
