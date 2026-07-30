import React from "react";
import { Link } from "react-router-dom";

const TermsAndConditions = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 font-sans text-gray-800 flex flex-col">
      <header className="bg-slate-900 border-b border-slate-800 text-white px-8 py-4 flex justify-between items-center shadow-md">
        <div className="flex space-x-6 text-xs uppercase tracking-widest text-slate-400 font-bold">
          <Link to="/" className="hover:text-white transition">
            Home
          </Link>
          <span className="text-white border-b-2 border-blue-400 pb-0.5">
            Terms
          </span>
        </div>
        <div className="text-sm md:text-base font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-200 text-center">
          STUDENT INTERNSHIP MANAGEMENT SYSTEM
        </div>
        <div className="flex space-x-6 text-xs uppercase tracking-widest text-slate-400 font-bold">
          <Link to="/login" className="hover:text-white transition">
            Login
          </Link>
          <Link to="/signup" className="hover:text-white transition">
            Sign Up
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center py-12 px-4 max-w-3xl w-full mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl mb-2">
            TERMS & CONDITIONS
          </h2>
          <p className="text-sm text-slate-500">Last updated: July 2026</p>
        </div>

        <div className="bg-white rounded-2xl p-8 md:p-10 shadow-xl border border-slate-100 w-full space-y-6 text-sm text-slate-600 leading-relaxed">
          <div>
            <h3 className="font-bold text-base text-slate-900 mb-2 uppercase tracking-wide">
              1. Agreement to Terms
            </h3>
            <p>
              By accessing or using the Student Internship Management System
              (SIMS), you agree to be bound by these Terms and Conditions. If
              you disagree with any part of these terms, you may not access the
              portal services.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-base text-slate-900 mb-2 uppercase tracking-wide">
              2. User Accounts and Roles
            </h3>
            <p className="mb-2">
              Users must register under their appropriate organizational
              identity. Accurate and genuine identification details must be
              provided at all times:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong className="text-slate-800">Students:</strong>{" "}
                Responsible for logging genuine training hours and submitting
                accurate documentation.
              </li>
              <li>
                <strong className="text-slate-800">Faculty Advisers:</strong>{" "}
                Responsible for reviewing, evaluating, and supervising student
                submittals.
              </li>
              <li>
                <strong className="text-slate-800">Company Supervisors:</strong>{" "}
                Responsible for validating workspace hours and verifying field
                attendance.
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-base text-slate-900 mb-2 uppercase tracking-wide">
              3. Code of Conduct
            </h3>
            <p>
              Any attempt to falsify internship hours, forge digital supervisor
              signatures, upload malicious software, or compromise secure logs
              will result in immediate profile suspension and termination.
              Academic infractions will be forwarded directly to university
              administrators.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-base text-slate-900 mb-2 uppercase tracking-wide">
              4. Limitation of Liability
            </h3>
            <p>
              The platform manages structural monitoring logs between
              educational branches and corporate entities. SIMS is not
              responsible for physical disputes, safety concerns, or workplace
              conflicts occurring inside host establishment premises.
            </p>
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-slate-100">
            <Link
              to="/signup"
              className="text-xs font-bold text-slate-900 hover:underline"
            >
              &lt;&lt; Return to Registration
            </Link>
            <span className="text-xs text-slate-400 font-medium">
              SIMS Official Compliance Portal
            </span>
          </div>
        </div>
      </main>

      <footer className="bg-slate-900 border-t border-slate-800 text-slate-500 text-center py-4 text-[11px] tracking-wide font-medium">
        &copy; 2026 SIMS |{" "}
        <Link to="/privacy-policy" className="hover:text-slate-300">
          Privacy Policy
        </Link>{" "}
        | <span className="text-slate-300">Terms of Service</span>
      </footer>
    </div>
  );
};

export default TermsAndConditions;
