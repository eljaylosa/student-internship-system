import React from "react";
import { Link } from "react-router-dom";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 font-sans text-gray-800 flex flex-col">
      <header className="bg-slate-900 border-b border-slate-800 text-white px-8 py-4 flex justify-between items-center shadow-md">
        <div className="flex space-x-6 text-xs uppercase tracking-widest text-slate-400 font-bold">
          <Link to="/" className="hover:text-white transition">
            Home
          </Link>
          <span className="text-white border-b-2 border-blue-400 pb-0.5">
            Privacy
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
            PRIVACY POLICY
          </h2>
          <p className="text-sm text-slate-500">Last updated: July 2026</p>
        </div>

        <div className="bg-white rounded-2xl p-8 md:p-10 shadow-xl border border-slate-100 w-full space-y-6 text-sm text-slate-600 leading-relaxed">
          <div>
            <h3 className="font-bold text-base text-slate-900 mb-2 uppercase tracking-wide">
              1. Data Collection Parameters
            </h3>
            <p className="mb-2">
              To operate secure system workflows, we collect foundational
              tracking data during setup and everyday operations:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong className="text-slate-800">Account Credentials:</strong>{" "}
                Full names, institutional IDs, telephone nodes, and email
                pathways.
              </li>
              <li>
                <strong className="text-slate-800">
                  Tracking Inventories:
                </strong>{" "}
                Hourly activity logs, internship metrics, performance
                evaluations, and uploaded training files.
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-base text-slate-900 mb-2 uppercase tracking-wide">
              2. How Data Is Utilized
            </h3>
            <p>
              All stored components serve educational administrative purposes.
              We use records to verify mandatory internship requirements,
              validate operational company logs, generate official university
              evaluation reports, and resolve system logging errors.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-base text-slate-900 mb-2 uppercase tracking-wide">
              3. Information Sharing Boundaries
            </h3>
            <p>
              Your data parameters are never distributed or commercialized to
              outside marketing brokers. Structural records are shared
              exclusively inside your mapped system environment between the
              student, assigned registrars, and the specific host company
              supervisor.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-base text-slate-900 mb-2 uppercase tracking-wide">
              4. System Security
            </h3>
            <p>
              We implement industry-standard database encryption configurations
              to safeguard structural parameter values against unauthorized
              breaches. Users remain completely responsible for preserving the
              confidentiality of individual portal login passwords.
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
              SIMS Data Protection Protocol
            </span>
          </div>
        </div>
      </main>

      <footer className="bg-slate-900 border-t border-slate-800 text-slate-500 text-center py-4 text-[11px] tracking-wide font-medium">
        &copy; 2026 SIMS |{" "}
        <span className="text-slate-300">Privacy Policy</span> |{" "}
        <Link to="/terms" className="hover:text-slate-300">
          Terms of Service
        </Link>
      </footer>
    </div>
  );
};

export default PrivacyPolicy;
