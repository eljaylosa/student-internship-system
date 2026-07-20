import React from "react";
import eljay from "../../assets/team/eljay.jpg";

import noProfileImg from "../../assets/team/no-profile.jpg"; // Placeholder image for missing profiles

const About = () => {
  // Listahan ng  grupo base sa pinasa nateng document info
  const teamMembers = [
    {
      name: "Losa, Eljay G.",
      role: "Researcher / Developer",
      image: eljay,
    },
    {
      name: "Luna, Jeush Andrei R.",
      role: "Researcher / Developer",
      image: noProfileImg,
    },
    {
      name: "Mapaquit, Jonas Miguel D.",
      role: "Researcher / Developer",
      image: noProfileImg,
    },
    {
      name: "Pagauisan, Issa Jane A.",
      role: "Researcher / Developer",
      image: noProfileImg,
    },
  ];

  // Ang 3 pangunahing user sectors na tinutulungan ng system naten
  const stakeholders = [
    {
      title: "BPSU Students",
      desc: "Easily upload requirements like CBAR Titles and PDS sheets digitally without handling physical prints.",
    },
    {
      title: "Faculty Advisers",
      desc: "Monitor student submissions, evaluate terminal records, and track deployments efficiently.",
    },
    {
      title: "Cooperating Schools",
      desc: "Verify intern records, evaluate professional behavior, and communicate directly with BPSU.",
    },
  ];

  return (
    <section className="bg-gray-50 min-h-screen py-36 px-6 font-mono">
      <div className="max-w-5xl mx-auto">
        {/* --- MAIN HEADER SECTION --- */}
        <div className="text-center mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
            Software Engineering 1 Project
          </span>
          <h1 className="text-5xl font-bold mt-3 mb-4 text-gray-800">
            About InternLink
          </h1>
          <p className="text-base text-gray-600 max-w-3xl mx-auto leading-relaxed">
            InternLink is a Web-Based and Mobile Student Internship Management
            System (SIMS) tailored for Bataan Peninsula State University. It
            replaces slow, legacy manual administrative tasks with fluid
            cloud-based automation.
          </p>
        </div>

        {/* --- 2-COLUMN OVERVIEW & PROBLEM CORNER --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm text-left">
            <h3 className="text-lg font-bold text-gray-800 mb-3 border-b pb-2 border-gray-100">
              The Project Vision
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              At present, many internship-related activities such as application
              processing, document submission, and record management are still
              handled manually or through separate communication platforms.
              InternLink centralizes everything inside a secure web and mobile
              ecosystem.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm text-left">
            <h3 className="text-lg font-bold text-gray-800 mb-3 border-b pb-2 border-gray-100">
              System Target Scope
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              By securing role-based token authentication levels, our platform
              covers end-to-end coordination from the primary document mapping
              stages down to final evaluation submission logs with fast data
              retrieval speeds.
            </p>
          </div>
        </div>

        {/* --- STAKEHOLDERS CORE MATRIX --- */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">
            Target Users
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stakeholders.map((user, idx) => (
              <div
                key={idx}
                className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm text-left"
              >
                <div className="text-xl mb-2">👤</div>
                <h4 className="font-bold text-sm text-gray-800 mb-1">
                  {user.title}
                </h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {user.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* --- DEVELOPMENT GROUP CREDENTIALS & SUBMISSION --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {/* Research Group List (Group 8) */}
          <div className="group relative overflow-hidden bg-white p-8 rounded-2xl border border-gray-100 shadow-sm text-left flex flex-col justify-between transition-all duration-300">
            {/* --- STANDARD TEXT CARD VIEW LAYER --- */}
            <div>
              <div className="flex justify-between items-center mb-4 border-b pb-2 border-gray-100">
                <h3 className="text-lg font-bold text-gray-800">
                  The Research Team
                </h3>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-semibold">
                  Group 8
                </span>
              </div>
              <ul className="space-y-2.5">
                {teamMembers.map((member, i) => (
                  <li
                    key={i}
                    className="flex justify-between items-center text-xs"
                  >
                    <span className="text-gray-700 font-medium">
                      {member.name}
                    </span>
                    <span className="text-gray-400 text-[10px] uppercase tracking-wider">
                      {member.role}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-50 text-[11px] text-gray-400">
              Section:{" "}
              <span className="text-gray-600 font-bold">BSIT-NW3F</span>
            </div>

            {/* --- 2. THE HOVER HIDDEN PICTURE GRID OVERLAY (EXPANDED TO FULL SCREEN) --- */}
            <div className="fixed inset-0 bg-gray-950/95 flex items-center justify-center p-6 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-100 ease-out z-50 backdrop-blur-md">
              <div className="max-w-4xl w-full bg-gray-900 border border-gray-800 rounded-3xl p-8 transform scale-95 group-hover:scale-100 transition-all duration-300 delay-75">
                {/* Overlay Header Layout */}
                <div className="flex justify-between items-center mb-8 border-b border-gray-800 pb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white uppercase tracking-wider font-mono">
                      Project Researchers & Developers
                    </h3>
                    <p className="text-xs text-gray-500 font-mono mt-1">
                      Group 8 Core Architecture Authors
                    </p>
                  </div>
                  <span className="text-xs bg-blue-600 text-white px-3 py-1 rounded-full font-bold font-mono">
                    BSIT-NW3F
                  </span>
                </div>

                {/* EXPANDED PICTURE GRID: Changed to large showcase frames */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {teamMembers.map((member, i) => (
                    <div
                      key={i}
                      className="bg-gray-800/30 p-4 rounded-2xl border border-gray-800/80 flex flex-col items-center text-center group/member"
                    >
                      {/* Drastically Scaled Up Profile Image Frame (w-32 h-32 or w-40 h-40) */}
                      <div className="w-32 h-32 md:w-40 md:h-40 rounded-xl overflow-hidden bg-gray-800 border border-gray-700 mb-4 shadow-md transition-transform duration-300 group-hover/member:scale-105">
                        <img
                          src={member.image}
                          alt={member.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = "https://unsplash.com";
                          }}
                        />
                      </div>
                      {/* Expanded Metadata Text */}
                      <div className="w-full">
                        <p className="text-sm font-bold text-white truncate font-mono">
                          {member.name.split(",")[0]}
                        </p>
                        <p className="text-xs text-blue-400 font-mono mt-1">
                          {member.name.split(",")[1] || "Researcher"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-[10px] text-center text-gray-600 font-mono tracking-wider mt-8 border-t border-gray-800/60 pt-4">
                  InternLink Engine • Software Engineering 1 • BPSU Capstone
                </p>
              </div>
            </div>
          </div>

          {/* Academic Submission Directives */}
          <div className="bg-blue-600 text-white p-8 rounded-2xl shadow-md text-left flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold mb-2 text-blue-100">
                Course Verification
              </h3>
              <p className="text-xs text-blue-100 leading-relaxed mb-6">
                This project platform is presented as an output component in
                partial fulfillment of the requirements for the course
                structural curriculum.
              </p>
              <div className="space-y-1">
                <span className="text-[10px] uppercase text-blue-200 block tracking-wider">
                  Submitted To:
                </span>
                <span className="font-bold text-sm text-white">
                  Prof. Benjamin III F. Delgado
                </span>
              </div>
            </div>
            <div className="mt-6 text-[11px] text-blue-200">
              Date: July 17, 2026
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
