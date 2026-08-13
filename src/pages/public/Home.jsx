import React from "react";
import { Link } from "react-router-dom";

const Home = () => {
  // Stat counters derived directly from BPSU's deployment scope goals
  const systemStats = [
    { value: "4+", label: "Research Group Authors" },
    { value: "100%", label: "Digital Document Auditing" },
    { value: "0ms", label: "Manual Processing Overhead" },
    { value: "RBAC", label: "Role-Based Token Security" },
  ];

  // User sectors defined in Section II of your Software Engineering document
  const portalRoles = [
    {
      title: "Student Portal",
      action: "Submit CBAR & PDS",
      icon: "🎓",
      color: "hover:border-blue-500",
    },
    {
      title: "Faculty Adviser",
      action: "Review Portfolio Assets",
      icon: "👨‍🏫",
      color: "hover:border-green-500",
    },
    {
      title: "School Clerk / Admin",
      action: "Map School Deployment",
      icon: "💼",
      color: "hover:border-purple-500",
    },
  ];

  return (
    <div className="bg-gray-50 min-h-screen font-mono">
      {/* --- 1. HERO MAIN SECTION --- */}
      <section className="min-h-screen flex items-center justify-center pt-24 px-6 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-4 py-1.5 rounded-full mb-6 inline-block">
            Student Internship Management System (SIMS)
          </span>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-gray-900 leading-tight">
            Streamlining BPSU Internships via{" "}
            <span className="text-blue-600">InternLink</span>
          </h1>
          <p className="text-base md:text-lg mb-10 text-gray-600 max-w-2xl mx-auto leading-relaxed">
            A specialized web and mobile environment engineered to eliminate
            manual sorting, misplaced portfolios, and application bottlenecks
            between students and cooperating institutions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {/* Swapped standard anchor to active React-Router router hooks */}
            <Link
              to="/services"
              className="cursor-pointer w-full sm:w-auto bg-blue-600 text-white px-8 py-4 rounded-full font-semibold hover:bg-blue-700 transition duration-300 shadow-md hover:shadow-lg text-center"
            >
              Explore System Architecture
            </Link>
            <Link
              to="/contact"
              className="cursor-pointer w-full sm:w-auto bg-transparent border-2 border-gray-200 text-gray-700 px-8 py-4 rounded-full font-semibold hover:bg-gray-100 transition duration-300 text-center"
            >
              Get In Touch
            </Link>
          </div>
        </div>
      </section>

      {/* --- 2. SYSTEM METRICS / STATS STRIP --- */}
      <section className="bg-blue-600 py-12 px-6 text-white border-y border-blue-700">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {systemStats.map((stat, i) => (
            <div key={i} className="space-y-1">
              <div className="text-3xl md:text-4xl font-extrabold">
                {stat.value}
              </div>
              <div className="text-[11px] uppercase tracking-wider text-blue-100">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* --- 3. ROLE-BASED PORTALS OVERVIEW --- */}
      <section className="py-24 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Role-Based Ecosystem
          </h2>
          <p className="text-xs text-gray-500">
            Every authorization layer maps directly to dedicated interface
            profiles.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {portalRoles.map((role, idx) => (
            <div
              key={idx}
              className={`cursor-pointer bg-white p-8 rounded-2xl border border-gray-100 shadow-sm transition-all duration-300 transform hover:-translate-y-1 text-left flex flex-col justify-between ${role.color}`}
            >
              <div>
                <div className="text-3xl mb-4">{role.icon}</div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">
                  {role.title}
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed mb-6">
                  Access point for processing core data streams such as{" "}
                  {role.action} parameters securely.
                </p>
              </div>
              {/* Link to the respective portal is available upon authentication. */}
              <Link
                to="/signup"
                className="text-xs font-semibold text-blue-600 block"
              >
                Initialize Gateway →
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* --- 4. PRE-EMPTIVE SCOPE SCOPE LIMITATIONS NOTICE (SECTION III) --- */}
      <section className="bg-white py-16 px-6 border-t border-gray-100">
        <div className="max-w-4xl mx-auto bg-amber-50/60 border border-amber-200/70 rounded-2xl p-6 md:p-8 text-left">
          <div className="flex items-start gap-4">
            <span className="text-2xl mt-0.5">⚠️</span>
            <div>
              <h4 className="text-sm font-bold text-amber-800 uppercase tracking-wider mb-2 font-mono">
                System Scope & Parameters Notice
              </h4>
              <p className="text-xs text-amber-700 leading-relaxed mb-3">
                To preserve strict software boundaries outlined under Section
                III (Limitations) of our project guidelines:
              </p>
              <ul className="list-disc list-inside space-y-1.5 text-xs text-amber-700/90 pl-1">
                <li>
                  This platform does <span className="font-bold">not</span> run
                  continuous background GPS location tracing or active biometric
                  attendance monitors.
                </li>
                <li>
                  InternLink does <span className="font-bold">not</span> employ
                  artificial intelligence algorithms to map matching
                  assignments; structural placement remains within local
                  academic administrative control.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
