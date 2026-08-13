// 1. Fixed: Added useState to the React import line
import React, { useState, useRef } from "react";

const Services = () => {
  const specsRef = useRef(null);

  // 2. Fixed: Added the missing (e) parameter to intercept click events safely
  const handleScrollToSpecs = (e) => {
    e.preventDefault();
    specsRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const [activeService, setActiveService] = useState(null);

  const servicesList = [
    {
      title: "Digital Requirement Submission",
      description:
        "Replaces traditional hard-copy submissions. Students can directly upload critical digital files like CBAR Titles, portfolios, and Personal Data Sheets (PDS).",
      details: {
        objectives: [
          "Upload, review, and manage documents digitally.",
          "Eliminate manual submission delays and misplaced files.",
        ],
        limitations: [
          "Limited to submitted reports and status updates.",
          "Requires a stable internet connection for file uploads.",
        ],
      },
    },
    {
      title: "Centralized Records Management",
      description:
        "Maintains a secure, reliable repository for active student profiles, deployment data, evaluation forms, and comprehensive internship documents.",
      details: {
        objectives: [
          "Manage student profiles and company information safely.",
          "Maintain clean internship records for administrators in a central database.",
        ],
        limitations: [
          "Does not track live attendance or physical location data.",
        ],
      },
    },
    {
      title: "Automated Deployment Mapping",
      description:
        "Assists department heads and clerks in cleanly tracking school assignments, establishing partner network rosters, and distributing students to faculty advisers.",
      details: {
        objectives: [
          "Efficiently assign students to appropriate faculty advisers.",
          "Organize cooperating school locations relative to student residences.",
        ],
      },
    },
    {
      title: "Formal Role-Based Coordination",
      description:
        "Establishes dedicated notification systems and interaction pathways between student interns, university instructors, and cooperating school principals.",
      details: {
        objectives: [
          "Facilitate communication via role-based system accounts.",
          "Send quick announcements and broadcast systemic updates.",
        ],
        limitations: [
          "No AI-based matching; placements remain institutional decisions.",
        ],
      },
    },
    // here to add more services if needed
  ];

  return (
    <>
      <section className="bg-gray-50 min-h-screen flex items-center justify-center py-36 px-6 relative">
        <div className="max-w-7xl mx-auto text-center">
          {/* Section Header */}
          <h1 className="text-5xl font-bold mb-4 font-mono text-gray-800">
            Our Services
          </h1>
          <p className="text-lg mb-12 font-mono text-gray-600 max-w-3xl mx-auto">
            InternLink eliminates standard administrative overhead by
            modernizing document workflows and record keeping for BPSU students.
          </p>

          {/* System Value Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {servicesList.map((service, index) => (
              <div
                key={index}
                onClick={() => setActiveService(service)}
                className="cursor-pointer group bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:bg-blue-50 transition-all duration-300 transform hover:-translate-y-1 text-left flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-mono font-bold mb-4 text-sm group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                    0{index + 1}
                  </div>
                  <h3 className="text-lg font-bold font-mono mb-2 text-gray-800 group-hover:text-blue-900">
                    {service.title}
                  </h3>
                  <p className="text-gray-600 font-mono text-xs leading-relaxed">
                    {service.description}
                  </p>
                </div>

                <span className="mt-6 text-blue-600 font-mono text-xs font-semibold block group-hover:underline">
                  View service scope →
                </span>
              </div>
            ))}
          </div>

          {/* Dynamic Modal Overlay */}
          {activeService && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-white max-w-lg w-full rounded-2xl p-8 text-left shadow-2xl relative border border-gray-100">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveService(null);
                  }}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl font-bold font-mono p-2 cursor-pointer"
                >
                  ✕
                </button>

                <h2 className="text-2xl font-bold font-mono text-gray-900 mb-2">
                  {activeService.title}
                </h2>
                <p className="text-sm font-mono text-gray-600 mb-6 border-b pb-4">
                  {activeService.description}
                </p>

                <div className="mb-4">
                  <h4 className="text-xs font-bold font-mono uppercase text-blue-600 tracking-wider mb-2">
                    System Objectives
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-xs text-gray-700 font-mono">
                    {activeService.details.objectives.map((obj, i) => (
                      <li key={i}>{obj}</li>
                    ))}
                  </ul>
                </div>

                {activeService.details.limitations && (
                  <div>
                    <h4 className="text-xs font-bold font-mono uppercase text-red-500 tracking-wider mb-2">
                      Scope Limitations
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-xs text-gray-700 font-mono">
                      {activeService.details.limitations.map((lim, i) => (
                        <li key={i}>{lim}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Core Interactive Action Trigger */}
          <button
            onClick={handleScrollToSpecs}
            className="cursor-pointer inline-block bg-blue-600 text-white px-8 py-3 rounded-full hover:bg-blue-700 transition duration-300 font-mono shadow-md hover:shadow-lg"
          >
            Explore InternLink Capabilities
          </button>
        </div>
      </section>

      {/* 3. Fixed: Added target layout structure referenced by specsRef anchor mapping */}
      <section
        ref={specsRef}
        className="bg-white py-24 px-6 border-t border-gray-100"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold font-mono text-gray-900 mb-2">
              System Capabilities & Requirements
            </h2>
            <p className="text-sm font-mono text-gray-500">
              Core platform infrastructure built strictly under Software
              Engineering 1 functional goals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Functional Column */}
            <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100 text-left">
              <h3 className="text-lg font-bold font-mono text-blue-600 mb-4 flex items-center gap-2">
                ⚙️ Functional Rules
              </h3>
              <ul className="space-y-3 font-mono text-xs text-gray-600 list-disc list-inside">
                <li>Create user accounts protected by role-based filters.</li>
                <li>
                  Digital submission interface for CBAR titles and profile
                  assets.
                </li>
                <li>
                  Centralized structural framework hosting company listings.
                </li>
                <li>
                  System-wide announcement broadsheets and live notification
                  flags.
                </li>
              </ul>
            </div>

            {/* Non-Functional Column */}
            <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100 text-left">
              <h3 className="text-lg font-bold font-mono text-green-600 mb-4 flex items-center gap-2">
                🛡️ Platform Integrity
              </h3>
              <ul className="space-y-3 font-mono text-xs text-gray-600 list-disc list-inside">
                <li>
                  Adaptive viewport structures rendering flawlessly across
                  tablets and mobile phones.
                </li>
                <li>
                  Rapid internal read, fetch, and file upload execution latency
                  speeds.
                </li>
                <li>
                  Reliable database architecture preserving historical intern
                  classes.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Services;
