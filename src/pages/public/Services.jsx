import React, { useEffect, useRef, useState } from "react";

const servicesList = [
  {
    number: "01",
    category: "DOCUMENT WORKFLOW",
    title: "Digital Requirement Submission",
    description:
      "Submit and manage internship requirements digitally, reducing paperwork and keeping important documents organized.",
    icon: "↗",
    accent: "blue",
    details: {
      objectives: [
        "Upload and manage internship documents digitally.",
        "Keep submitted requirements organized and accessible.",
        "Reduce delays caused by manual submissions and misplaced files.",
      ],
      limitations: [
        "File uploads require a stable internet connection.",
        "Submission and approval depend on the configured system workflow.",
      ],
    },
  },
  {
    number: "02",
    category: "RECORDS & DATA",
    title: "Centralized Records Management",
    description:
      "Keep student profiles, deployment information, evaluations, and internship records organized in one centralized system.",
    icon: "▤",
    accent: "violet",
    details: {
      objectives: [
        "Maintain organized student and company records.",
        "Centralize internship information for authorized users.",
        "Preserve historical internship records for future reference.",
      ],
      limitations: [
        "Does not provide continuous GPS tracking or biometric attendance monitoring.",
        "Access to records depends on user permissions and system policies.",
      ],
    },
  },
  {
    number: "03",
    category: "INTERNSHIP COORDINATION",
    title: "Deployment Management",
    description:
      "Support internship coordination by organizing student assignments, registrar adviser relationships, and cooperating company information.",
    icon: "⌖",
    accent: "emerald",
    details: {
      objectives: [
        "Organize student internship assignments.",
        "Help track relationships between students, registrars, and companies.",
        "Keep placement information accessible to authorized personnel.",
      ],
      limitations: [
        "Internship placements remain subject to institutional decisions.",
        "The system does not automatically guarantee or determine student placement suitability.",
      ],
    },
  },
  {
    number: "04",
    category: "COMMUNICATION",
    title: "Role-Based Coordination",
    description:
      "Connect students, registrar, and company through role-aware communication and system notifications.",
    icon: "⌁",
    accent: "amber",
    details: {
      objectives: [
        "Provide communication channels based on user roles and permissions.",
        "Help users keep track of relevant updates and notifications.",
        "Support coordination throughout the internship process.",
      ],
      limitations: [
        "Available actions depend on the user's role and access permissions.",
        "The system does not use AI to automatically match students with internship placements.",
      ],
    },
  },
];

const capabilities = [
  {
    number: "01",
    title: "Account & access management",
    description:
      "Role-based access for students, registrar, company, and authorized administrators.",
  },
  {
    number: "02",
    title: "Internship application workflow",
    description:
      "Organized application statuses and coordination throughout the placement process.",
  },
  {
    number: "03",
    title: "Notifications & messaging",
    description:
      "Relevant system updates and communication tools that help keep participants connected.",
  },
  {
    number: "04",
    title: "Responsive interface",
    description:
      "A flexible layout designed to work across desktop computers, tablets, and mobile devices.",
  },
];

const accentClasses = {
  blue: {
    icon: "bg-blue-50 text-blue-700 group-hover:bg-blue-600 group-hover:text-white",
    label: "text-blue-700",
    glow: "from-blue-500/10",
    border: "group-hover:border-blue-200",
  },
  violet: {
    icon: "bg-violet-50 text-violet-700 group-hover:bg-violet-600 group-hover:text-white",
    label: "text-violet-700",
    glow: "from-violet-500/10",
    border: "group-hover:border-violet-200",
  },
  emerald: {
    icon: "bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white",
    label: "text-emerald-700",
    glow: "from-emerald-500/10",
    border: "group-hover:border-emerald-200",
  },
  amber: {
    icon: "bg-amber-50 text-amber-700 group-hover:bg-amber-500 group-hover:text-white",
    label: "text-amber-700",
    glow: "from-amber-500/10",
    border: "group-hover:border-amber-200",
  },
};

function Services() {
  const specsRef = useRef(null);
  const [activeService, setActiveService] = useState(null);

  const handleScrollToSpecs = () => {
    specsRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  useEffect(() => {
    const elements = document.querySelectorAll("[data-reveal]");

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      elements.forEach((element) => element.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    elements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!activeService) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") setActiveService(null);
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeService]);

  return (
    <main className="public-services services-page min-h-screen overflow-hidden bg-white text-slate-900">
      <style>{`
        .services-page {
          --services-ink: #172554;
          --services-blue: #2563eb;
        }

        .services-page .service-reveal {
          opacity: 0;
          transform: translateY(24px);
          transition:
            opacity 700ms ease,
            transform 700ms cubic-bezier(.2,.7,.2,1);
        }

        .services-page .service-reveal.is-visible {
          opacity: 1;
          transform: translateY(0);
        }

        .services-page .service-grid-card {
          transition:
            transform 300ms ease,
            box-shadow 300ms ease,
            border-color 300ms ease;
        }

        .services-page .service-grid-card:hover {
          transform: translateY(-7px);
          box-shadow: 0 24px 55px -32px rgba(30, 64, 175, .38);
        }

        .services-page .service-grid-card:focus-visible,
        .services-page button:focus-visible {
          outline: 3px solid #93c5fd;
          outline-offset: 4px;
        }

        .services-page .service-orb {
          animation: serviceFloat 8s ease-in-out infinite;
        }

        .services-page .service-orb-delayed {
          animation: serviceFloat 10s ease-in-out infinite reverse;
        }

        .services-page .service-modal-panel {
          animation: serviceModalIn 220ms ease-out both;
        }

        @keyframes serviceFloat {
          0%, 100% { transform: translateY(0) }
          50% { transform: translateY(-15px) }
        }

        @keyframes serviceModalIn {
          from { opacity: 0; transform: translateY(12px) scale(.98) }
          to { opacity: 1; transform: translateY(0) scale(1) }
        }

        @media (prefers-reduced-motion: reduce) {
          .services-page *,
          .services-page *::before,
          .services-page *::after {
            animation-duration: .01ms !important;
            animation-iteration-count: 1 !important;
            scroll-behavior: auto !important;
            transition-duration: .01ms !important;
          }

          .services-page .service-reveal {
            opacity: 1;
            transform: none;
          }
        }
      `}</style>

      {/* Hero */}
      <section className="relative isolate px-5 pb-20 pt-24 sm:px-8 sm:pb-24 sm:pt-28 lg:pb-28 lg:pt-32">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_left,_rgba(219,234,254,0.75),_transparent_52%),linear-gradient(to_bottom,#ffffff,#f8fbff)]" />
        <div className="service-orb pointer-events-none absolute -right-20 top-24 -z-10 h-64 w-64 rounded-full bg-blue-200/30 blur-3xl sm:right-0 sm:h-80 sm:w-80" />
        <div className="service-orb-delayed pointer-events-none absolute -left-24 bottom-10 -z-10 h-56 w-56 rounded-full bg-violet-200/30 blur-3xl" />

        <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.05fr_.95fr] lg:gap-16">
          <div className="service-reveal" data-reveal>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-700 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-blue-600" />
              What InternLink offers
            </div>

            <h1 className="max-w-3xl text-4xl font-extrabold leading-[1.1] tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Internship management,
              <span className="mt-2 block bg-gradient-to-r from-blue-700 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
                made more organized.
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              InternLink brings internship requirements, student records,
              placement coordination, and communication into one web-based
              Student Internship Management System.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleScrollToSpecs}
                className="inline-flex items-center justify-center gap-3 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl"
              >
                Explore capabilities
                <span aria-hidden="true">↓</span>
              </button>

              <a
                href="#services-overview"
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white/80 px-6 py-3.5 text-sm font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
              >
                Discover our services
              </a>
            </div>

            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-500">
              <span className="inline-flex items-center gap-2">
                <span className="text-emerald-600">✓</span>
                Centralized records
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="text-emerald-600">✓</span>
                Role-based access
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="text-emerald-600">✓</span>
                Responsive design
              </span>
            </div>
          </div>

          {/* Dashboard-inspired visual */}
          <div
            className="service-reveal relative mx-auto w-full max-w-xl"
            data-reveal
          >
            <div className="absolute -inset-5 rounded-[2rem] bg-gradient-to-br from-blue-200/60 via-violet-100/50 to-transparent blur-2xl" />

            <div className="relative overflow-hidden rounded-3xl border border-white bg-white/90 p-4 shadow-2xl shadow-blue-950/10 backdrop-blur sm:p-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-lg font-black text-white">
                    I
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-slate-900">
                      InternLink
                    </p>
                    <p className="text-xs text-slate-500">
                      Internship workspace
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                  Organized
                </span>
              </div>

              <div className="py-6">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                  Platform overview
                </p>
                <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">
                  Everything in one place.
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  A shared workspace for the people involved in internship
                  coordination.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    icon: "▤",
                    label: "Digital documents",
                    note: "Requirements",
                    color: "bg-blue-50 text-blue-700",
                  },
                  {
                    icon: "◎",
                    label: "Student records",
                    note: "Profiles & details",
                    color: "bg-violet-50 text-violet-700",
                  },
                  {
                    icon: "⌖",
                    label: "Deployment",
                    note: "Placement workflow",
                    color: "bg-emerald-50 text-emerald-700",
                  },
                  {
                    icon: "↗",
                    label: "Coordination",
                    note: "Updates & messages",
                    color: "bg-amber-50 text-amber-700",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 transition hover:border-blue-100 hover:bg-white"
                  >
                    <div
                      className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl text-lg font-bold ${item.color}`}
                    >
                      {item.icon}
                    </div>
                    <p className="text-sm font-bold text-slate-800">
                      {item.label}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{item.note}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-700 shadow-sm">
                  ✓
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    Connected workflows
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Designed to support students, registrars, and company.
                  </p>
                </div>
              </div>
            </div>

            <div className="service-orb absolute -right-3 top-16 hidden rounded-2xl border border-white bg-white px-4 py-3 shadow-xl sm:block">
              <p className="text-xs font-bold text-slate-800">
                One connected platform
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Built around internship workflows
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Services grid */}
      <section
        id="services-overview"
        className="scroll-mt-24 border-y border-slate-100 bg-slate-50/70 px-5 py-20 sm:px-8 sm:py-24"
      >
        <div className="mx-auto max-w-7xl">
          <div
            className="service-reveal mx-auto mb-12 max-w-3xl text-center sm:mb-16"
            data-reveal
          >
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-blue-700">
              Core services
            </p>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
              Built around the internship journey.
            </h2>
            <p className="mt-4 leading-7 text-slate-600">
              Explore the main areas where InternLink helps organize
              requirements, records, placement coordination, and communication.
              Select any service to learn more about its objectives and scope.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {servicesList.map((service, index) => {
              const accent = accentClasses[service.accent];

              return (
                <button
                  key={service.number}
                  type="button"
                  onClick={() => setActiveService(service)}
                  className={`service-reveal service-grid-card group relative flex h-full min-h-[330px] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 text-left ${accent.border}`}
                  data-reveal
                  style={{ transitionDelay: `${index * 80}ms` }}
                  aria-label={`View details for ${service.title}`}
                >
                  <div
                    className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${accent.glow} to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
                  />

                  <div className="relative flex items-center justify-between">
                    <span className="text-xs font-extrabold tracking-[0.16em] text-slate-400">
                      SERVICE / {service.number}
                    </span>
                    <span
                      className={`flex h-11 w-11 items-center justify-center rounded-2xl text-xl font-bold transition-all duration-300 group-hover:rotate-3 group-hover:scale-110 ${accent.icon}`}
                    >
                      {service.icon}
                    </span>
                  </div>

                  <div className="relative mt-7">
                    <p
                      className={`text-[10px] font-extrabold tracking-[0.16em] ${accent.label}`}
                    >
                      {service.category}
                    </p>
                    <h3 className="mt-3 text-xl font-extrabold leading-snug text-slate-900">
                      {service.title}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {service.description}
                    </p>
                  </div>

                  <div
                    className={`relative mt-auto flex items-center justify-between border-t border-slate-100 pt-5 text-sm font-bold ${accent.label}`}
                  >
                    <span>Explore service</span>
                    <span
                      aria-hidden="true"
                      className="transition-transform duration-300 group-hover:translate-x-1.5"
                    >
                      →
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Capability section */}
      <section
        ref={specsRef}
        id="capabilities"
        className="scroll-mt-20 px-5 py-20 sm:px-8 sm:py-24"
      >
        <div className="mx-auto max-w-7xl">
          <div
            className="service-reveal grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:gap-16"
            data-reveal
          >
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-blue-700">
                Platform capabilities
              </p>
              <h2 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-slate-950 sm:text-4xl">
                The essentials for a more connected internship process.
              </h2>
              <p className="mt-5 leading-7 text-slate-600">
                InternLink provides a centralized digital environment for
                organizing key internship activities and supporting
                collaboration between authorized participants.
              </p>

              <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50/70 p-5">
                <p className="text-sm font-extrabold text-blue-950">
                  Designed for three key participants
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {["Students", "Registrar", "Company"].map((role) => (
                    <span
                      key={role}
                      className="rounded-full border border-blue-100 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {capabilities.map((capability) => (
                <article
                  key={capability.number}
                  className="rounded-2xl border border-slate-200 bg-white p-6 transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-950/5"
                >
                  <span className="text-xs font-extrabold tracking-[0.16em] text-blue-600">
                    {capability.number}
                  </span>
                  <h3 className="mt-4 text-lg font-extrabold text-slate-900">
                    {capability.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {capability.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Scope and requirements */}
      <section className="bg-slate-950 px-5 py-20 text-white sm:px-8 sm:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="service-reveal mb-12 max-w-3xl" data-reveal>
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-blue-300">
              System scope
            </p>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Purposeful functionality. Clear boundaries.
            </h2>
            <p className="mt-4 leading-7 text-slate-300">
              The platform focuses on internship administration and
              coordination. These requirements describe its intended behavior
              without promising functionality beyond the system's actual scope.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div
              className="service-reveal rounded-3xl border border-white/10 bg-white/[0.04] p-7 sm:p-8"
              data-reveal
            >
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-400/10 text-xl text-blue-300">
                  ✓
                </span>
                <h3 className="text-xl font-extrabold">
                  Functional requirements
                </h3>
              </div>
              <ul className="mt-6 space-y-4 text-sm leading-6 text-slate-300">
                {[
                  "Provide account access according to assigned user roles.",
                  "Support digital submission and management of internship documents.",
                  "Organize student profiles, applications, and placement information.",
                  "Support relevant notifications and role-based communication.",
                  "Help authorized participants manage internship workflow updates.",
                ].map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-0.5 text-blue-300">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div
              className="service-reveal rounded-3xl border border-white/10 bg-white/[0.04] p-7 sm:p-8"
              data-reveal
              style={{ transitionDelay: "100ms" }}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-400/10 text-xl text-emerald-300">
                  ◈
                </span>
                <h3 className="text-xl font-extrabold">
                  Quality & limitations
                </h3>
              </div>
              <ul className="mt-6 space-y-4 text-sm leading-6 text-slate-300">
                {[
                  "Provide a responsive interface for desktop and mobile devices.",
                  "Organize information through a centralized database.",
                  "Protect access to system features through role-based permissions.",
                  "Require an internet connection for online platform access and uploads.",
                  "Exclude continuous GPS or biometric attendance monitoring and AI-based placement matching.",
                ].map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-0.5 text-emerald-300">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <p
            className="service-reveal mt-8 text-xs leading-6 text-slate-400"
            data-reveal
          >
            Note: Actual features and access are subject to the deployed
            application, configured permissions, and institutional workflow.
          </p>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="px-5 py-20 sm:px-8 sm:py-24">
        <div
          className="service-reveal relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-700 via-indigo-700 to-violet-800 px-6 py-12 text-center shadow-2xl shadow-blue-950/15 sm:px-12 sm:py-16"
          data-reveal
        >
          <div className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -bottom-36 -left-12 h-72 w-72 rounded-full border border-white/10" />

          <div className="relative mx-auto max-w-3xl">
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-blue-200">
              InternLink
            </p>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              A more organized way to manage internships.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl leading-7 text-blue-100">
              Bring internship information and coordination together in one
              platform designed around the needs of students, registrars, and
              company.
            </p>
            <a
              href="/about"
              className="mt-8 inline-flex items-center justify-center gap-3 rounded-xl bg-white px-6 py-3.5 text-sm font-extrabold text-blue-800 shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-50"
            >
              Learn about InternLink
              <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
      </section>

      {/* Service details modal */}
      {activeService && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setActiveService(null);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="service-modal-title"
            className="service-modal-panel relative my-auto max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-white/70 bg-white p-6 shadow-2xl sm:p-8"
          >
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-blue-700">
                  Service {activeService.number} / {activeService.category}
                </p>
                <h2
                  id="service-modal-title"
                  className="mt-3 pr-2 text-2xl font-extrabold leading-tight tracking-tight text-slate-950 sm:text-3xl"
                >
                  {activeService.title}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setActiveService(null)}
                aria-label="Close service details"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-lg text-slate-600 transition hover:bg-slate-200 hover:text-slate-950"
              >
                ×
              </button>
            </div>

            <p className="mt-5 text-sm leading-7 text-slate-600">
              {activeService.description}
            </p>

            <div className="mt-7 rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
              <h3 className="flex items-center gap-2 text-sm font-extrabold text-blue-950">
                <span className="text-blue-600">✓</span>
                System objectives
              </h3>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
                {activeService.details.objectives.map((objective) => (
                  <li key={objective} className="flex gap-3">
                    <span className="mt-0.5 text-blue-600">•</span>
                    <span>{objective}</span>
                  </li>
                ))}
              </ul>
            </div>

            {activeService.details.limitations && (
              <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50/70 p-5">
                <h3 className="flex items-center gap-2 text-sm font-extrabold text-amber-950">
                  <span className="text-amber-600">!</span>
                  Scope limitations
                </h3>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
                  {activeService.details.limitations.map((limitation) => (
                    <li key={limitation} className="flex gap-3">
                      <span className="mt-0.5 text-amber-600">•</span>
                      <span>{limitation}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button
              type="button"
              onClick={() => setActiveService(null)}
              className="mt-6 w-full rounded-xl bg-slate-900 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-slate-800"
            >
              Got it
            </button>
          </section>
        </div>
      )}
    </main>
  );
}

export default Services;
