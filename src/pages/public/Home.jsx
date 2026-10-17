import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const highlights = [
  {
    value: "01",
    title: "Student-centered",
    description:
      "A dedicated portal for internship applications, documents, and placement updates.",
    icon: "graduation",
  },
  {
    value: "02",
    title: "Registrar coordination",
    description:
      "Registrar workflows for reviewing student records and coordinating internship progress.",
    icon: "academic",
  },
  {
    value: "03",
    title: "Company connections",
    description:
      "A dedicated workspace for internship opportunities and assigned student supervision.",
    icon: "briefcase",
  },
];

const workflow = [
  {
    number: "01",
    title: "Create an account",
    description:
      "Register through the appropriate portal and complete the required verification steps.",
  },
  {
    number: "02",
    title: "Manage applications",
    description:
      "Submit required documents and follow the progress of internship applications.",
  },
  {
    number: "03",
    title: "Track your journey",
    description:
      "Keep placement information, communications, and internship progress organized.",
  },
];

function ArrowIcon({ className = "h-4 w-4" }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        d="M5 12h14m-6-6 6 6-6 6"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function PortalIcon({ type }) {
  const paths = {
    graduation: (
      <>
        <path
          d="m3 9 9-5 9 5-9 5-9-5Z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M7 11.3V16c3.1 2.5 6.9 2.5 10 0v-4.7M21 9v6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    ),
    academic: (
      <>
        <path
          d="M4 19V5m0 0h12l-2.5 3L16 11H4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M9 19h11M13 15h7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    ),
    briefcase: (
      <>
        <rect x="3" y="7" width="18" height="13" rx="2" />
        <path
          d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18m-11 0v2h4v-2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      viewBox="0 0 24 24"
    >
      {paths[type]}
    </svg>
  );
}

function DashboardPreview() {
  const [activePortal, setActivePortal] = useState(0);

  const portals = [
    {
      key: "student",
      label: "Student Portal",
      eyebrow: "Student Dashboard",
      title: "Welcome back!",
      description: "Your internship journey, organized.",
      initials: "S",
      color: "blue",
      sidebar: ["Dashboard", "Applications", "Status", "Messages"],
      stats: [
        { label: "Applications", value: "Application tracking", color: "blue" },
        { label: "Status", value: "Placement updates", color: "indigo" },
      ],
      overviewTitle: "Internship overview",
      overview: [
        ["Application status", "In progress", "blue"],
        ["Required documents", "Document tracking", "indigo"],
        ["Placement updates", "Stay informed", "emerald"],
      ],
    },
    {
      key: "registrar",
      label: "Registrar Portal",
      eyebrow: "Registrar Dashboard",
      title: "Academic overview",
      description: "Keep student internship records organized.",
      initials: "R",
      color: "violet",
      sidebar: ["Dashboard", "Students", "Applications", "Reports"],
      stats: [
        {
          label: "Student records",
          value: "Record management",
          color: "violet",
        },
        { label: "Applications", value: "Review progress", color: "indigo" },
      ],
      overviewTitle: "Registrar workspace",
      overview: [
        ["Student records", "Review student information", "violet"],
        ["Application reviews", "Check submitted applications", "indigo"],
        ["Internship coordination", "Track academic progress", "blue"],
      ],
    },
    {
      key: "company",
      label: "Company Portal",
      eyebrow: "Company Dashboard",
      title: "Manage your interns",
      description: "Coordinate opportunities and student progress.",
      initials: "C",
      color: "purple",
      sidebar: ["Dashboard", "Opportunities", "My Interns", "Evaluations"],
      stats: [
        {
          label: "Opportunities",
          value: "Internship listings",
          color: "purple",
        },
        { label: "My interns", value: "Intern supervision", color: "indigo" },
      ],
      overviewTitle: "Company workspace",
      overview: [
        ["Internship opportunities", "Manage available positions", "purple"],
        ["Assigned interns", "Monitor intern progress", "indigo"],
        ["Evaluations", "Review internship performance", "blue"],
      ],
    },
  ];

  const portal = portals[activePortal];

  const colorStyles = {
    blue: {
      icon: "bg-blue-50 text-blue-600",
      active: "bg-blue-50 text-blue-700",
      bar: "bg-blue-500",
      dot: "bg-blue-600",
      glow: "bg-blue-500/[0.12]",
    },
    indigo: {
      icon: "bg-indigo-50 text-indigo-600",
      active: "bg-indigo-50 text-indigo-700",
      bar: "bg-indigo-500",
      dot: "bg-indigo-600",
      glow: "bg-indigo-500/[0.12]",
    },
    violet: {
      icon: "bg-violet-50 text-violet-600",
      active: "bg-violet-50 text-violet-700",
      bar: "bg-violet-500",
      dot: "bg-violet-600",
      glow: "bg-violet-500/[0.12]",
    },
    purple: {
      icon: "bg-purple-50 text-purple-600",
      active: "bg-purple-50 text-purple-700",
      bar: "bg-purple-500",
      dot: "bg-purple-600",
      glow: "bg-purple-500/[0.12]",
    },
    emerald: {
      icon: "bg-emerald-50 text-emerald-600",
      active: "bg-emerald-50 text-emerald-700",
      bar: "bg-emerald-500",
      dot: "bg-emerald-600",
      glow: "bg-emerald-500/[0.12]",
    },
  };

  const currentStyle = colorStyles[portal.color];

  const goToPortal = (index) => {
    setActivePortal((index + portals.length) % portals.length);
  };

  const handleKeyDown = (event) => {
    if (event.key === "ArrowLeft") goToPortal(activePortal - 1);
    if (event.key === "ArrowRight") goToPortal(activePortal + 1);
  };

  return (
    <div className="dashboard-float relative mx-auto w-full max-w-[560px]">
      <div
        aria-hidden="true"
        className={`absolute -inset-6 rounded-[36px] ${currentStyle.glow} blur-3xl transition-colors duration-300`}
      />

      <div className="relative overflow-hidden rounded-[24px] border border-white/70 bg-white/90 p-3 shadow-[0_30px_100px_-35px_rgba(37,99,235,0.38)] backdrop-blur-xl sm:rounded-[28px] sm:p-4">
        <div className="overflow-hidden rounded-[18px] border border-slate-200/80 bg-slate-50">
          {/* Application window header */}
          <div className="flex h-12 items-center justify-between gap-2 border-b border-slate-200/80 bg-white px-3 sm:px-4">
            <div
              className="flex shrink-0 items-center gap-1.5"
              aria-hidden="true"
            >
              <span className="h-2 w-2 rounded-full bg-red-300" />
              <span className="h-2 w-2 rounded-full bg-amber-300" />
              <span className="h-2 w-2 rounded-full bg-emerald-300" />
            </div>

            <span className="truncate text-[8px] font-semibold tracking-[0.1em] text-slate-400 sm:text-[10px] sm:tracking-[0.16em]">
              INTERNLINK / {portal.label.toUpperCase()}
            </span>

            <div
              className={`h-6 w-6 shrink-0 rounded-full ${currentStyle.icon} text-center text-[10px] font-bold leading-6`}
            >
              {portal.initials}
            </div>
          </div>

          <div className="grid grid-cols-[78px_minmax(0,1fr)] sm:grid-cols-[112px_minmax(0,1fr)]">
            {/* Sidebar */}
            <div className="space-y-3 border-r border-slate-200/80 bg-white p-2.5 sm:space-y-4 sm:p-4">
              <div className="mb-5 flex items-center gap-1.5 sm:mb-6">
                <span
                  className={`h-5 w-5 shrink-0 rounded-md ${currentStyle.dot}`}
                />
                <span className="hidden text-[10px] font-bold text-slate-700 sm:inline">
                  InternLink
                </span>
              </div>

              {portal.sidebar.map((label, index) => (
                <div
                  key={label}
                  className={`rounded-lg px-2 py-2 text-[8px] leading-3 sm:text-[9px] ${
                    index === 0
                      ? `${currentStyle.active} font-semibold`
                      : "text-slate-400"
                  }`}
                >
                  {label}
                </div>
              ))}
            </div>

            {/* Dashboard content */}
            <div className="min-w-0 p-3 sm:p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p
                    className={`text-[8px] font-semibold uppercase tracking-[0.1em] sm:text-[9px] ${
                      currentStyle.icon.split(" ")[1]
                    }`}
                  >
                    {portal.eyebrow}
                  </p>

                  <h3 className="mt-1 text-sm font-bold tracking-tight text-slate-900 sm:text-lg">
                    {portal.title}
                  </h3>

                  <p className="mt-1 text-[8px] leading-4 text-slate-500 sm:text-[10px]">
                    {portal.description}
                  </p>
                </div>

                <div className="hidden shrink-0 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[8px] text-slate-500 sm:block sm:text-[9px]">
                  My workspace
                </div>
              </div>

              {/* Summary cards */}
              <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-6 sm:gap-3">
                {portal.stats.map((stat) => {
                  const style = colorStyles[stat.color];

                  return (
                    <div
                      key={stat.label}
                      className="min-w-0 rounded-xl border border-slate-200/80 bg-white p-2.5 sm:p-3"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="truncate text-[8px] text-slate-500 sm:text-[9px]">
                          {stat.label}
                        </span>

                        <span
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] ${style.icon}`}
                        >
                          ↗
                        </span>
                      </div>

                      <div className="mt-2 h-2 w-10 rounded-full bg-slate-200" />

                      <p className="mt-2 truncate text-[7px] text-slate-400 sm:text-[8px]">
                        {stat.value}
                      </p>

                      <div className="mt-2 h-1 w-full rounded-full bg-slate-100">
                        <div
                          className={`h-full w-3/5 rounded-full ${style.bar}`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Portal overview */}
              <div className="mt-3 rounded-xl border border-slate-200/80 bg-white p-3 sm:mt-4 sm:p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[9px] font-bold text-slate-800 sm:text-[10px]">
                    {portal.overviewTitle}
                  </span>

                  <span className="shrink-0 text-[7px] text-slate-400 sm:text-[8px]">
                    Portal preview
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  {portal.overview.map(([label, status, color]) => {
                    const style = colorStyles[color];

                    return (
                      <div
                        key={label}
                        className="flex items-center justify-between gap-2"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <span
                            className={`h-7 w-7 shrink-0 rounded-lg ${style.icon}`}
                          />

                          <div className="min-w-0">
                            <p className="truncate text-[8px] font-semibold text-slate-700 sm:text-[9px]">
                              {label}
                            </p>

                            <p className="mt-0.5 truncate text-[7px] text-slate-400 sm:text-[8px]">
                              InternLink workspace
                            </p>
                          </div>
                        </div>

                        <span className="max-w-[86px] shrink-0 truncate rounded-full bg-slate-100 px-2 py-1 text-[7px] text-slate-500 sm:max-w-none sm:text-[8px]">
                          {status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <p className="mt-3 text-center text-[8px] text-slate-400">
                Illustrative interface preview · Not live account data
              </p>
            </div>
          </div>
        </div>

        {/* Previous / Next controls */}
        <div className="flex items-center justify-between gap-2 px-1 pb-1 pt-3 sm:px-2 sm:pt-4">
          <button
            type="button"
            onClick={() => goToPortal(activePortal - 1)}
            onKeyDown={handleKeyDown}
            aria-label="Previous portal preview"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:px-4"
          >
            <svg
              aria-hidden="true"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="m15 18-6-6 6-6"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
              />
            </svg>
            <span className="hidden sm:inline">Previous</span>
          </button>

          <div
            className="flex items-center justify-center gap-2"
            aria-label={`Portal ${activePortal + 1} of ${portals.length}: ${
              portal.label
            }`}
            aria-live="polite"
          >
            {portals.map((item, index) => (
              <button
                key={item.key}
                type="button"
                onClick={() => goToPortal(index)}
                aria-label={`Show ${item.label}`}
                aria-current={activePortal === index ? "true" : undefined}
                className={`h-2.5 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                  activePortal === index
                    ? `w-6 ${colorStyles[item.color].dot}`
                    : "w-2.5 bg-slate-300 hover:bg-slate-400"
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => goToPortal(activePortal + 1)}
            onKeyDown={handleKeyDown}
            aria-label="Next portal preview"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:px-4"
          >
            <span className="hidden sm:inline">Next</span>
            <svg
              aria-hidden="true"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="m9 18 6-6-6-6"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
              />
            </svg>
          </button>
        </div>

        <p className="mt-1 text-center text-[9px] font-medium text-slate-400">
          {activePortal + 1} / {portals.length} · {portal.label}
        </p>
      </div>

      {/* Floating decorative label */}
      <div className="float-slow absolute -left-2 top-10 hidden rounded-2xl border border-white/80 bg-white/95 p-3 shadow-xl shadow-blue-900/10 sm:flex sm:items-center sm:gap-3 md:-left-8">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-xl ${currentStyle.icon}`}
        >
          <PortalIcon
            type={
              activePortal === 0
                ? "graduation"
                : activePortal === 1
                ? "academic"
                : "briefcase"
            }
          />
        </div>

        <div>
          <p className="text-[10px] font-bold text-slate-800">{portal.label}</p>
          <p className="mt-1 text-[9px] text-slate-500">One connected system</p>
        </div>
      </div>

      <div className="float-delayed absolute -bottom-5 right-2 hidden rounded-2xl border border-white/80 bg-white/95 p-3 shadow-xl shadow-blue-900/10 sm:block md:-right-5">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <svg
              aria-hidden="true"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="m5 12 4 4L19 6"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
          </span>

          <div>
            <p className="text-[10px] font-bold text-slate-800">
              Organized workflows
            </p>
            <p className="mt-1 text-[9px] text-slate-500">
              Less scattered information
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const Home = () => {
  useEffect(() => {
    const elements = document.querySelectorAll("[data-reveal]");

    if (!("IntersectionObserver" in window)) {
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
      {
        threshold: 0.12,
        rootMargin: "0px 0px -40px 0px",
      }
    );

    elements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, []);

  return (
    <main className="public-home min-h-screen overflow-hidden bg-white font-sans text-slate-900">
      <style>{`
        @keyframes hero-enter {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes ambient-drift {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50% { transform: translate3d(20px, -18px, 0) scale(1.06); }
        }

        @keyframes dashboard-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-9px); }
        }

        @keyframes float-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-7px); }
        }

        @keyframes reveal-up {
          from { opacity: 0; transform: translateY(22px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .hero-enter {
          opacity: 0;
          animation: hero-enter 700ms cubic-bezier(.2,.7,.2,1) forwards;
        }

        .hero-delay-1 { animation-delay: 100ms; }
        .hero-delay-2 { animation-delay: 220ms; }
        .hero-delay-3 { animation-delay: 340ms; }
        .hero-delay-4 { animation-delay: 460ms; }

        .ambient-drift { animation: ambient-drift 12s ease-in-out infinite; }
        .dashboard-float { animation: dashboard-float 7s ease-in-out infinite; }
        .float-slow { animation: float-slow 5s ease-in-out infinite; }
        .float-delayed { animation: float-slow 6s ease-in-out 1s infinite; }

        [data-reveal] {
          opacity: 0;
          transform: translateY(22px);
          transition: opacity 700ms ease, transform 700ms cubic-bezier(.2,.7,.2,1);
        }

        [data-reveal].is-visible {
          opacity: 1;
          transform: translateY(0);
        }

        .feature-card {
          transition: transform 250ms ease, border-color 250ms ease, box-shadow 250ms ease;
        }

        .feature-card:hover {
          transform: translateY(-6px);
          border-color: rgba(96, 165, 250, 0.45);
          box-shadow: 0 22px 50px -28px rgba(37, 99, 235, 0.28);
        }

        .cta-shine { position: relative; overflow: hidden; }
        .cta-shine::after {
          content: "";
          position: absolute;
          inset: 0;
          transform: translateX(-130%);
          background: linear-gradient(110deg, transparent 25%, rgba(255,255,255,.18) 50%, transparent 75%);
          transition: transform 650ms ease;
          pointer-events: none;
        }
        .cta-shine:hover::after { transform: translateX(130%); }

        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            scroll-behavior: auto !important;
            transition-duration: 0.01ms !important;
          }
          [data-reveal] { opacity: 1; transform: none; }
        }
      `}</style>

      {/* =====================================================
          1. HERO
      ====================================================== */}
      <section className="relative isolate flex min-h-[760px] items-center overflow-hidden bg-[#f8faff] px-5 pb-20 pt-32 sm:px-8 sm:pb-28 sm:pt-36 lg:min-h-[820px] lg:px-10">
        {/* Background effects */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
        >
          <div
            className="absolute inset-0 opacity-[0.34]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(148,163,184,0.14) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.14) 1px, transparent 1px)",
              backgroundSize: "52px 52px",
              maskImage: "linear-gradient(to bottom, black, transparent 90%)",
            }}
          />
          <div className="ambient-drift absolute -right-20 top-0 h-[420px] w-[420px] rounded-full bg-blue-300/25 blur-[100px] sm:h-[560px] sm:w-[560px]" />
          <div className="ambient-drift absolute -left-40 bottom-0 h-[320px] w-[320px] rounded-full bg-indigo-300/20 blur-[100px]" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-white to-transparent" />
        </div>

        <div className="mx-auto grid w-full max-w-7xl items-center gap-16 lg:grid-cols-[0.94fr_1.06fr] lg:gap-10">
          {/* Hero copy */}
          <div className="relative z-10 text-center lg:text-left">
            <div className="hero-enter hero-delay-1 inline-flex max-w-full items-center gap-2 rounded-full border border-blue-200/80 bg-white/80 px-3.5 py-2 shadow-sm shadow-blue-900/[0.03] backdrop-blur">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-600" />
              </span>
              <span className="text-[9px] font-bold uppercase tracking-[0.13em] text-slate-600 sm:text-[10px] sm:tracking-[0.17em]">
                Student Internship Management System
              </span>
            </div>

            <h1 className="hero-enter hero-delay-2 mt-7 text-[2.65rem] font-bold leading-[1.08] tracking-[-0.055em] text-slate-950 sm:text-6xl lg:text-[4.4rem] xl:text-[5rem]">
              Your next chapter
              <br />
              starts with{" "}
              <span className="relative inline-block bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-500 bg-clip-text text-transparent">
                InternLink.
              </span>
            </h1>

            <p className="hero-enter hero-delay-3 mx-auto mt-6 max-w-xl text-sm leading-7 text-slate-600 sm:text-base sm:leading-8 lg:mx-0">
              A smarter way to navigate your internship journey. Connect student
              applications, academic coordination, and company supervision in
              one organized digital experience.
            </p>

            <div className="hero-enter hero-delay-4 mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
              <Link
                to="/signup"
                className="cta-shine group inline-flex min-h-13 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition duration-300 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                Get started
                <ArrowIcon className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>

              <Link
                to="/services"
                className="group inline-flex min-h-13 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-6 py-3.5 text-sm font-semibold text-slate-700 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-white hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                Explore the platform
                <svg
                  aria-hidden="true"
                  className="h-4 w-4 transition-transform duration-200 group-hover:translate-y-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M12 5v14m-7-7 7 7 7-7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.8"
                  />
                </svg>
              </Link>
            </div>

            <div className="hero-enter hero-delay-4 mt-9 flex flex-wrap items-center justify-center gap-x-5 gap-y-3 text-[11px] text-slate-500 lg:justify-start">
              <span className="inline-flex items-center gap-2">
                <svg
                  aria-hidden="true"
                  className="h-4 w-4 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="m5 12 4 4L19 6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.8"
                  />
                </svg>
                Organized applications
              </span>
              <span className="inline-flex items-center gap-2">
                <svg
                  aria-hidden="true"
                  className="h-4 w-4 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="m5 12 4 4L19 6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.8"
                  />
                </svg>
                Role-based workspaces
              </span>
            </div>
          </div>

          {/* Visual product preview */}
          <div className="hero-enter hero-delay-3 relative mx-auto w-full max-w-[590px] px-1 pb-5 pt-2 sm:px-4 sm:py-8 lg:px-0">
            <DashboardPreview />
          </div>
        </div>

        <div
          aria-hidden="true"
          className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 items-center gap-3 text-[9px] font-semibold uppercase tracking-[0.25em] text-slate-400 lg:flex"
        >
          <span className="h-px w-8 bg-slate-300" />
          A more connected journey
          <span className="h-px w-8 bg-slate-300" />
        </div>
      </section>

      {/* =====================================================
          2. PLATFORM HIGHLIGHTS
      ====================================================== */}
      <section className="relative border-y border-slate-200/80 bg-white px-5 py-9 sm:px-8 lg:px-10">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-y-7 sm:grid-cols-4 sm:gap-5">
          {[
            ["03", "Core user portals"],
            ["01", "Connected platform"],
            ["360°", "Internship visibility"],
            ["RBAC", "Role-based access"],
          ].map(([value, label], index) => (
            <div
              key={label}
              data-reveal
              style={{ transitionDelay: `${index * 100}ms` }}
              className={`text-center ${
                index !== 0 ? "sm:border-l sm:border-slate-200" : ""
              }`}
            >
              <p className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                {value}
              </p>
              <p className="mt-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-slate-500 sm:text-[11px]">
                {label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* =====================================================
          3. ROLE-BASED ECOSYSTEM
      ====================================================== */}
      <section className="relative overflow-hidden bg-[#f8faff] px-5 py-20 sm:px-8 sm:py-28 lg:px-10 lg:py-32">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-40 top-20 h-96 w-96 rounded-full bg-blue-200/25 blur-[100px]"
        />

        <div className="relative mx-auto max-w-7xl">
          <div
            data-reveal
            className="mx-auto mb-12 max-w-2xl text-center sm:mb-16"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.17em] text-blue-700">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
              One ecosystem
            </span>

            <h2 className="mt-5 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
              Different roles.
              <br className="hidden sm:block" />{" "}
              <span className="text-blue-600">One connected journey.</span>
            </h2>

            <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
              Every stakeholder has a dedicated workspace designed around their
              responsibilities, keeping internship coordination clear and
              organized.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {highlights.map((item, index) => (
              <article
                key={item.number}
                data-reveal
                style={{ transitionDelay: `${index * 130}ms` }}
                className="feature-card group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm sm:p-8"
              >
                <div
                  aria-hidden="true"
                  className="absolute right-0 top-0 h-28 w-28 rounded-full bg-blue-100/60 opacity-0 blur-3xl transition-opacity duration-300 group-hover:opacity-100"
                />

                <div className="relative flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-600 transition duration-300 group-hover:scale-105 group-hover:border-blue-200">
                    <PortalIcon type={item.icon} />
                  </div>

                  <span className="font-mono text-xs tracking-widest text-slate-300">
                    / {item.number}
                  </span>
                </div>

                <h3 className="relative mt-7 text-lg font-bold tracking-tight text-slate-900">
                  {item.title}
                </h3>

                <p className="relative mt-3 flex-1 text-sm leading-7 text-slate-500">
                  {item.description}
                </p>

                <div className="relative mt-7 border-t border-slate-100 pt-5">
                  <Link
                    to="/login"
                    className="group/link inline-flex items-center gap-2 text-xs font-semibold text-blue-600 transition-colors hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    Access your portal
                    <ArrowIcon className="h-3.5 w-3.5 transition-transform duration-200 group-hover/link:translate-x-1" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================
          4. HOW IT WORKS
      ====================================================== */}
      <section className="relative overflow-hidden bg-white px-5 py-20 sm:px-8 sm:py-28 lg:px-10 lg:py-32">
        <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:gap-24">
          <div data-reveal className="lg:sticky lg:top-32 lg:self-start">
            <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.17em] text-slate-600">
              Simple by design
            </span>

            <h2 className="mt-5 text-3xl font-bold leading-tight tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
              From first step
              <br />
              to{" "}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">
                internship-ready.
              </span>
            </h2>

            <p className="mt-5 max-w-md text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">
              Bring the important parts of internship coordination into one
              place, with clear steps for students and the people supporting
              their progress.
            </p>

            <Link
              to="/services"
              className="group mt-7 inline-flex items-center gap-2 rounded-lg text-sm font-semibold text-blue-600 transition-colors hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              Discover the platform
              <ArrowIcon className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="relative">
            <div
              aria-hidden="true"
              className="absolute bottom-10 left-[23px] top-10 w-px bg-gradient-to-b from-blue-300 via-blue-200 to-transparent sm:left-[27px]"
            />

            <div className="space-y-4">
              {workflow.map((step, index) => (
                <article
                  key={step.number}
                  data-reveal
                  style={{ transitionDelay: `${index * 150}ms` }}
                  className="group relative flex gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 transition duration-300 hover:border-blue-200 hover:bg-blue-50/30 sm:gap-6 sm:p-7"
                >
                  <div className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-white font-mono text-xs font-bold text-blue-600 shadow-sm transition duration-300 group-hover:border-blue-300 group-hover:bg-blue-600 group-hover:text-white sm:h-14 sm:w-14 sm:rounded-2xl sm:text-sm">
                    {step.number}
                  </div>

                  <div className="min-w-0 flex-1 pt-1">
                    <h3 className="text-base font-bold text-slate-900 sm:text-lg">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-xs leading-6 text-slate-500 sm:text-sm sm:leading-7">
                      {step.description}
                    </p>
                  </div>

                  <ArrowIcon className="mt-2 hidden h-4 w-4 shrink-0 text-slate-300 transition duration-200 group-hover:translate-x-1 group-hover:text-blue-600 sm:block" />
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          5. SCOPE & TRANSPARENCY
      ====================================================== */}
      <section className="bg-[#f8faff] px-5 py-16 sm:px-8 sm:py-20 lg:px-10">
        <div
          data-reveal
          className="mx-auto max-w-7xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="grid lg:grid-cols-[0.72fr_1.28fr]">
            <div className="relative overflow-hidden bg-slate-950 p-7 text-white sm:p-10">
              <div
                aria-hidden="true"
                className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-blue-600/25 blur-3xl"
              />

              <div className="relative">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-blue-300">
                  <svg
                    aria-hidden="true"
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M12 3 4.5 6v5c0 5 3.2 8.1 7.5 10 4.3-1.9 7.5-5 7.5-10V6L12 3Z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.6"
                    />
                    <path
                      d="m9 12 2 2 4-4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.8"
                    />
                  </svg>
                </div>

                <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.2em] text-blue-300">
                  Built with clarity
                </p>

                <h2 className="mt-3 text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
                  Purposeful technology.
                  <br />
                  Clear boundaries.
                </h2>

                <p className="mt-4 text-sm leading-7 text-slate-400">
                  Designed around the defined scope of the InternLink academic
                  project.
                </p>
              </div>
            </div>

            <div className="space-y-6 p-6 sm:p-10">
              <div className="flex items-start gap-4">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <svg
                    aria-hidden="true"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M5 12h14M12 5l7 7-7 7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.8"
                    />
                  </svg>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    No continuous GPS tracking
                  </h3>
                  <p className="mt-2 text-xs leading-6 text-slate-500 sm:text-sm sm:leading-7">
                    The defined project scope excludes continuous background GPS
                    location tracing and active biometric attendance monitoring.
                  </p>
                </div>
              </div>

              <div className="h-px bg-slate-100" />

              <div className="flex items-start gap-4">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  <svg
                    aria-hidden="true"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M12 8v4l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.7"
                    />
                  </svg>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Academic control over placements
                  </h3>
                  <p className="mt-2 text-xs leading-6 text-slate-500 sm:text-sm sm:leading-7">
                    Internship placements remain subject to the platform's
                    defined academic and administrative workflows, rather than
                    AI-based assignment matching.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          6. FINAL CTA
      ====================================================== */}
      <section className="relative overflow-hidden bg-white px-5 py-20 sm:px-8 sm:py-28 lg:px-10">
        <div
          data-reveal
          className="relative isolate mx-auto max-w-7xl overflow-hidden rounded-[28px] bg-slate-950 px-6 py-14 text-center shadow-2xl shadow-blue-950/10 sm:rounded-[36px] sm:px-12 sm:py-20 lg:py-24"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
          >
            <div className="ambient-drift absolute -left-20 -top-48 h-96 w-96 rounded-full bg-blue-600/35 blur-[100px]" />
            <div className="ambient-drift absolute -bottom-56 -right-20 h-[450px] w-[450px] rounded-full bg-indigo-600/25 blur-[120px]" />
            <div
              className="absolute inset-0 opacity-[0.07]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
                backgroundSize: "44px 44px",
              }}
            />
          </div>

          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-200">
            Your internship journey starts here
          </span>

          <h2 className="mx-auto mt-6 max-w-3xl text-3xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
            Make your next step
            <br className="hidden sm:block" />{" "}
            <span className="bg-gradient-to-r from-blue-300 via-blue-400 to-indigo-300 bg-clip-text text-transparent">
              a connected one.
            </span>
          </h2>

          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-slate-300 sm:text-base sm:leading-8">
            Get started with InternLink and bring your internship applications
            and coordination into one organized experience.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              to="/signup"
              className="cta-shine group inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-slate-950 shadow-lg transition duration-300 hover:-translate-y-0.5 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              Create your account
              <ArrowIcon className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>

            <Link
              to="/contact"
              className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/[0.05] px-6 py-3.5 text-sm font-semibold text-white transition duration-200 hover:border-white/40 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              Contact us
            </Link>
          </div>

          <p className="mt-7 text-[10px] leading-5 text-slate-400">
            Bataan Peninsula State University · InternLink SIMS
          </p>
        </div>
      </section>
    </main>
  );
};

export default Home;
