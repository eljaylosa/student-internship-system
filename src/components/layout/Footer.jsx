import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-400 py-16 mt-0 border-t border-gray-800 font-mono">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        {/* --- MAIN FOOTER GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12 text-left">
          {/* Column 1: Project & University Identity */}
          <div className="space-y-4">
            <Link
              to="/"
              className="text-white font-bold text-xl hover:text-blue-400 transition"
            >
              InternLink
            </Link>
            <p className="text-xs leading-relaxed text-gray-500">
              A Web-Based and Mobile Student Internship Management System (SIMS)
              engineered for Bataan Peninsula State University (BPSU).
            </p>
            <div className="text-[11px] text-gray-600 bg-gray-950 p-3 rounded-lg border border-gray-800 inline-block">
              📍 Balanga City, Bataan, PH
            </div>
          </div>

          {/* Column 2: System Quick Links */}
          <div className="space-y-4">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider">
              Navigation
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Link to="/" className="hover:text-blue-400 transition">
                Home
              </Link>
              <Link to="/about" className="hover:text-blue-400 transition">
                About
              </Link>
              <Link to="/services" className="hover:text-blue-400 transition">
                Services
              </Link>
              <Link to="/contact" className="hover:text-blue-400 transition">
                Contact
              </Link>
            </div>
          </div>

          {/* Column 3: Academic Submission Metadata */}
          <div className="space-y-3 text-xs">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider">
              Project Blueprint
            </h4>
            <p className="text-gray-500 text-[11px]">
              Course:{" "}
              <span className="text-gray-300">Software Engineering 1</span>
              <br />
              Section: <span className="text-gray-300">BSIT-NW3F</span>
              <br />
              Authors: <span className="text-gray-300">Group No. 8</span>
            </p>
            <div className="border-t border-gray-800 pt-2 text-[10px] text-gray-600">
              Submitted to: Prof. Benjamin III F. Delgado
            </div>
          </div>
        </div>

        {/* --- BOTTOM BASE COPYRIGHT STRIP --- */}
        <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row justify-between items-center text-xs text-gray-600 gap-4">
          <p>
            &copy; {new Date().getFullYear()} InternLink Project Ecosystem. All
            rights reserved.
          </p>
          <div className="flex gap-6 text-[11px]">
            <span className="text-gray-700">v1.0.0 Stable Build</span>
            <a href="#top" className="hover:text-gray-400 transition">
              Back to top ↑
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
