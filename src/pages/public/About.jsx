import React, { useEffect } from "react";

import eljay from "../../assets/images/eljay.jpg";
import jeush from "../../assets/images/jeush.jpg";
import jonas from "../../assets/images/jonas.jpg";
import issa from "../../assets/images/issa.jpg";  

const teamMembers = [
  {
    name: "Eljay G. Losa",
    surname: "Losa",
    role: "Researcher & Developer",
    image: eljay,
    number: "01",
  },
  {
    name: "Jeush Andrei R. Luna",
    surname: "Luna",
    role: "Researcher & Developer",
    image: jeush,
    number: "02",
  },
  {
    name: "Jonas Miguel D. Mapaquit",
    surname: "Mapaquit",
    role: "Researcher & Developer",
    image: jonas,
    number: "03",
  },
  {
    name: "Issa Jane A. Pagauisan",
    surname: "Pagauisan",
    role: "Researcher & Developer",
    image: issa,
    number: "04",
  },
];

const stakeholders = [
  {
    number: "01",
    title: "Students",
    description:
      "Submit internship applications and requirements digitally, track application progress, and keep important documents organized in one place.",
    color: "blue",
    icon: (
      <>
        <path d="M22 10 12 5 2 10l10 5 10-5Z" />
        <path d="M6 12v5c3.5 3 8.5 3 12 0v-5" />
        <path d="M22 10v6" />
      </>
    ),
  },
  {
    number: "02",
    title: "Registrar Advisers",
    description:
      "Review student submissions, manage internship records, monitor application progress, and coordinate requirements efficiently.",
    color: "indigo",
    icon: (
      <>
        <path d="M8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3" />
        <path d="M16 3h5v5" />
        <path d="m10 14 11-11" />
        <path d="M8 10h4" />
        <path d="M8 14h2" />
      </>
    ),
  },
  {
    number: "03",
    title: "Company Supervisors",
    description:
      "Manage internship opportunities, coordinate with assigned interns, review student progress, and submit internship evaluations.",
    color: "sky",
    icon: (
      <>
        <rect x="3" y="7" width="18" height="14" rx="2" />
        <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <path d="M3 12h18" />
        <path d="M10 12v2h4v-2" />
      </>
    ),
  },
];

const highlights = [
  { value: "03", label: "Primary user groups" },
  { value: "01", label: "Centralized platform" },
  { value: "360°", label: "Internship coordination" },
];

function Icon({ children, className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function SectionLabel({ children }) {
  return (
    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50/90 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-blue-700 transition-all duration-300 hover:border-blue-300 hover:bg-blue-100 hover:shadow-md hover:shadow-blue-500/10">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-600" />
      {children}
    </div>
  );
}

export default function About() {
  useEffect(() => {
    const elements = document.querySelectorAll("[data-reveal]");

    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !("IntersectionObserver" in window)
    ) {
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
        threshold: 0.1,
        rootMargin: "0px 0px -35px 0px",
      }
    );

    elements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, []);

  return (
    <main className="about-page min-h-screen overflow-hidden bg-white text-slate-900 pt-20">
      <style>{`
        .about-page {
          --about-blue: #2563eb;
          --about-indigo: #4f46e5;
        }

        html {
          scroll-behavior: smooth;
        }

        .about-grid {
          background-image:
            linear-gradient(rgba(59, 130, 246, .065) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, .065) 1px, transparent 1px);
          background-size: 38px 38px;
          mask-image: linear-gradient(to bottom, black 0%, transparent 90%);
          -webkit-mask-image: linear-gradient(to bottom, black 0%, transparent 90%);
        }

        .about-reveal {
          opacity: 0;
          transform: translateY(24px);
          transition:
            opacity 700ms ease,
            transform 700ms cubic-bezier(.2,.7,.2,1);
        }

        .about-reveal.is-visible {
          opacity: 1;
          transform: translateY(0);
        }

        .about-delay-1 { transition-delay: 100ms; }
        .about-delay-2 { transition-delay: 180ms; }
        .about-delay-3 { transition-delay: 260ms; }

        .about-float {
          animation: aboutFloat 6s ease-in-out infinite;
        }

        .about-float-delayed {
          animation: aboutFloat 7s ease-in-out 1s infinite;
        }

        .about-orb {
          animation: aboutOrb 12s ease-in-out infinite alternate;
        }

        .about-orb-delayed {
          animation: aboutOrb 15s ease-in-out 2s infinite alternate-reverse;
        }

        .about-card {
          position: relative;
          isolation: isolate;
          overflow: hidden;
          transition:
            transform 350ms cubic-bezier(.2,.7,.2,1),
            border-color 350ms ease,
            box-shadow 350ms ease;
        }

        .about-card::before {
          content: "";
          position: absolute;
          z-index: -1;
          inset: 0;
          pointer-events: none;
          opacity: 0;
          background: radial-gradient(
            circle at 50% 0%,
            rgba(96,165,250,.13),
            transparent 70%
          );
          transition: opacity 350ms ease;
        }

        .about-card:hover {
          transform: translateY(-7px);
          border-color: rgb(147 197 253);
          box-shadow: 0 24px 55px -25px rgba(37,99,235,.32);
        }

        .about-card:hover::before {
          opacity: 1;
        }

        .about-team-card {
          transition:
            transform 350ms cubic-bezier(.2,.7,.2,1),
            box-shadow 350ms ease,
            border-color 350ms ease;
        }

        .about-team-card:hover {
          transform: translateY(-8px);
          border-color: rgb(147 197 253);
          box-shadow: 0 25px 50px -25px rgba(30,64,175,.35);
        }

        .about-team-image {
          transition: transform 800ms cubic-bezier(.2,.7,.2,1);
        }

        .about-team-card:hover .about-team-image {
          transform: scale(1.08);
        }

        .about-image-overlay {
          transition: opacity 350ms ease;
        }

        .about-team-card:hover .about-image-overlay {
          opacity: 1;
        }

        .about-shine {
          position: relative;
          isolation: isolate;
          overflow: hidden;
        }

        .about-shine::after {
          content: "";
          position: absolute;
          z-index: -1;
          inset: 0;
          background: linear-gradient(
            115deg,
            transparent 20%,
            rgba(255,255,255,.18) 45%,
            transparent 70%
          );
          transform: translateX(-130%);
          transition: transform 750ms ease;
          pointer-events: none;
        }

        .about-shine:hover::after {
          transform: translateX(130%);
        }

        .about-button {
          transition:
            transform 250ms ease,
            box-shadow 250ms ease,
            background-color 250ms ease,
            border-color 250ms ease;
        }

        .about-button:hover {
          transform: translateY(-3px);
        }

        .about-arrow {
          transition: transform 250ms ease;
        }

        .about-button:hover .about-arrow {
          transform: translateX(4px);
        }

        .about-icon-box {
          transition:
            transform 350ms cubic-bezier(.2,.7,.2,1),
            box-shadow 350ms ease;
        }

        .about-card:hover .about-icon-box {
          transform: rotate(-5deg) scale(1.08);
          box-shadow: 0 8px 20px -10px rgba(37,99,235,.35);
        }

        .about-gradient-text {
          background-size: 200% auto;
          animation: aboutGradient 7s ease infinite;
        }

        @keyframes aboutFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-9px); }
        }

        @keyframes aboutOrb {
          from { transform: translate3d(0, 0, 0) scale(1); }
          to { transform: translate3d(18px, -20px, 0) scale(1.08); }
        }

        @keyframes aboutGradient {
          0%, 100% { background-position: 0% center; }
          50% { background-position: 100% center; }
        }

        @media (prefers-reduced-motion: reduce) {
          .about-reveal,
          .about-reveal.is-visible {
            opacity: 1;
            transform: none;
            transition: none;
          }

          .about-float,
          .about-float-delayed,
          .about-orb,
          .about-orb-delayed,
          .about-gradient-text {
            animation: none;
          }

          .about-card,
          .about-team-card,
          .about-team-image,
          .about-button,
          .about-icon-box {
            transition: none;
          }

          .about-card:hover,
          .about-team-card:hover,
          .about-button:hover {
            transform: none;
          }

          .about-shine::after {
            display: none;
          }
        }
      `}</style>

      {/* HERO */}
      <section className="relative isolate px-5 pb-16 pt-6 sm:px-8 sm:pb-20 sm:pt-8 lg:pb-24 lg:pt-10">
        <div className="about-grid pointer-events-none absolute inset-x-0 top-0 -z-10 h-[620px]" />

        <div className="about-orb pointer-events-none absolute -left-32 top-20 -z-10 h-80 w-80 rounded-full bg-blue-100/70 blur-[100px]" />
        <div className="about-orb-delayed pointer-events-none absolute -right-28 top-20 -z-10 h-96 w-96 rounded-full bg-indigo-100/70 blur-[120px]" />

        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.1fr_.9fr] lg:gap-16">
          <div data-reveal className="about-reveal">
            <SectionLabel>Software Engineering 1 Project</SectionLabel>

            <h1 className="max-w-3xl text-4xl font-semibold leading-[1.12] tracking-[-0.055em] text-slate-950 sm:text-5xl md:text-6xl lg:text-[68px]">
              A better way to
              <span className="about-gradient-text mt-1 block bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 bg-clip-text pb-2 text-transparent">
                manage internships.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">
              Meet InternLink, a web-based Student Internship Management System
              designed to bring students, registrar advisers, and company
              supervisors together in one organized digital environment.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href="#our-mission"
                className="about-button about-shine group inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/30 focus:outline-none focus:ring-4 focus:ring-blue-200"
              >
                Discover our mission
                <Icon className="about-arrow h-4 w-4">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </Icon>
              </a>

              <a
                href="#our-team"
                className="about-button inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white/90 px-5 py-3 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:bg-blue-50 focus:outline-none focus:ring-4 focus:ring-blue-100"
              >
                Meet the team
                <Icon className="about-arrow h-4 w-4">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </Icon>
              </a>
            </div>

            <div className="mt-9 flex flex-wrap items-center gap-x-5 gap-y-3 text-xs text-slate-500">
              <span className="inline-flex items-center gap-2">
                <Icon className="h-4 w-4 text-blue-600">
                  <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" />
                  <path d="m9 12 2 2 4-4" />
                </Icon>
                Role-based access
              </span>
              <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:block" />
              <span className="inline-flex items-center gap-2">
                <Icon className="h-4 w-4 text-blue-600">
                  <rect x="3" y="4" width="18" height="16" rx="2" />
                  <path d="M7 8h10M7 12h6M7 16h8" />
                </Icon>
                Centralized records
              </span>
            </div>
          </div>

          {/* PROJECT PREVIEW */}
          <div
            data-reveal
            className="about-reveal about-delay-2 relative mx-auto w-full max-w-xl lg:ml-auto"
          >
            <div className="pointer-events-none absolute -inset-5 rounded-[36px] bg-gradient-to-br from-blue-100/80 via-indigo-50/70 to-transparent blur-2xl" />

            <div className="group relative rounded-[28px] border border-white bg-white/80 p-3 shadow-[0_30px_100px_-35px_rgba(30,64,175,.28)] backdrop-blur-xl transition duration-500 hover:-translate-y-1 hover:shadow-[0_35px_100px_-30px_rgba(37,99,235,.32)] sm:p-4">
              <div className="rounded-[21px] border border-slate-100 bg-white p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/20 transition-transform duration-300 group-hover:rotate-6 group-hover:scale-105">
                      <Icon className="h-5 w-5">
                        <path d="M12 3v18" />
                        <path d="M3 12h18" />
                        <path d="m5.6 5.6 12.8 12.8" />
                        <path d="M18.4 5.6 5.6 18.4" />
                      </Icon>
                    </div>
                    <div>
                      <p className="text-sm font-bold tracking-tight text-slate-900">
                        InternLink
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        Internship workspace
                      </p>
                    </div>
                  </div>

                  <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-[10px] font-semibold text-emerald-700">
                    Connected workflow
                  </span>
                </div>

                <div className="mt-6">
                  <p className="text-xs font-medium text-slate-500">
                    One platform, shared progress
                  </p>
                  <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
                    Internship management
                  </h2>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4 transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/10">
                    <div className="about-icon-box flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                      <Icon className="h-[18px] w-[18px]">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="10" cy="7" r="4" />
                        <path d="M20 8v6M23 11h-6" />
                      </Icon>
                    </div>
                    <p className="mt-4 text-lg font-bold text-slate-900">
                      Students
                    </p>
                    <p className="mt-1 text-[11px] leading-5 text-slate-500">
                      Applications & requirements
                    </p>
                  </div>

                  <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-4 transition duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-500/10">
                    <div className="about-icon-box flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                      <Icon className="h-[18px] w-[18px]">
                        <path d="M8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3" />
                        <path d="M16 3h5v5" />
                        <path d="m10 14 11-11" />
                      </Icon>
                    </div>
                    <p className="mt-4 text-lg font-bold text-slate-900">
                      Advisers
                    </p>
                    <p className="mt-1 text-[11px] leading-5 text-slate-500">
                      Reviews & coordination
                    </p>
                  </div>

                  <div className="col-span-2 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 transition duration-300 hover:border-blue-200 hover:bg-blue-50/60">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-700 shadow-sm ring-1 ring-slate-200/80">
                          <Icon className="h-5 w-5">
                            <rect x="3" y="7" width="18" height="14" rx="2" />
                            <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            <path d="M3 12h18" />
                          </Icon>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            Company supervisors
                          </p>
                          <p className="mt-1 text-[11px] text-slate-500">
                            Opportunities & evaluations
                          </p>
                        </div>
                      </div>
                      <Icon className="about-arrow h-5 w-5 shrink-0 text-blue-600">
                        <path d="m9 18 6-6-6-6" />
                      </Icon>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex items-center gap-3 rounded-xl border border-blue-100/80 bg-blue-50/60 px-4 py-3 transition-colors duration-300 hover:bg-blue-100/70">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
                    <Icon className="h-4 w-4">
                      <path d="m5 12 4 4L19 6" />
                    </Icon>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-800">
                      Designed for connected workflows
                    </p>
                    <p className="mt-1 text-[10px] leading-4 text-slate-500">
                      Bring internship-related tasks into one platform.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="about-float absolute -left-4 top-20 hidden rounded-2xl border border-white bg-white/95 p-3 shadow-xl shadow-blue-950/10 sm:block md:-left-8">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Icon className="h-5 w-5">
                    <path d="m5 12 4 4L19 6" />
                  </Icon>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Organized</p>
                  <p className="mt-1 text-[10px] text-slate-500">
                    Digital records
                  </p>
                </div>
              </div>
            </div>

            <div className="about-float-delayed absolute -bottom-5 right-4 hidden rounded-2xl border border-white bg-white/95 p-3 shadow-xl shadow-blue-950/10 sm:block md:-right-5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Icon className="h-5 w-5">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3 2" />
                  </Icon>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Connected</p>
                  <p className="mt-1 text-[10px] text-slate-500">
                    Shared progress
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* HIGHLIGHTS */}
        <div
          data-reveal
          className="about-reveal mx-auto mt-16 grid max-w-5xl grid-cols-1 divide-y divide-slate-200 rounded-2xl border border-slate-200/80 bg-white/90 px-6 shadow-sm backdrop-blur-sm transition duration-300 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-950/5 sm:mt-20 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:px-3"
        >
          {highlights.map((item) => (
            <div
              key={item.label}
              className="group px-5 py-6 text-center sm:py-7"
            >
              <p className="text-3xl font-semibold tracking-tight text-slate-900 transition-transform duration-300 group-hover:-translate-y-1 group-hover:text-blue-600">
                {item.value}
              </p>
              <p className="mt-2 text-xs text-slate-500">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* MISSION */}
      <section
        id="our-mission"
        className="scroll-mt-24 border-y border-slate-100 bg-slate-50/70 px-5 py-20 sm:px-8 sm:py-24"
      >
        <div className="mx-auto max-w-7xl">
          <div data-reveal className="about-reveal max-w-2xl">
            <SectionLabel>Why InternLink</SectionLabel>
            <h2 className="text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl lg:text-5xl">
              Less fragmented work.
              <span className="block text-blue-600">
                More organized coordination.
              </span>
            </h2>
            <p className="mt-5 text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">
              Internship coordination involves multiple people, documents,
              reviews, and decisions. InternLink aims to make those interactions
              easier to follow through a centralized, role-based web
              application.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            <article
              data-reveal
              className="about-reveal about-card rounded-3xl border border-slate-200/80 bg-white p-7 shadow-sm sm:p-9"
            >
              <div className="about-icon-box flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <Icon className="h-6 w-6">
                  <path d="M12 3v18" />
                  <path d="M3 12h18" />
                  <path d="m5.6 5.6 12.8 12.8" />
                  <path d="M18.4 5.6 5.6 18.4" />
                </Icon>
              </div>

              <p className="mt-6 text-[10px] font-bold uppercase tracking-[.2em] text-blue-600">
                Our vision
              </p>
              <h3 className="mt-2 text-xl font-semibold tracking-tight text-slate-900">
                One reliable digital workspace
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Many internship activities can become difficult to track when
                handled through separate documents and communication channels.
                InternLink is designed to centralize submissions, application
                updates, records, and coordination in one accessible workspace.
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                {[
                  "Centralized records",
                  "Clearer workflows",
                  "Digital access",
                ].map((tag) => (
                  <span
                    key={tag}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-[10px] font-medium text-slate-600 transition duration-200 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </article>

            <article
              data-reveal
              className="about-reveal about-delay-1 about-card rounded-3xl border border-slate-200/80 bg-white p-7 shadow-sm sm:p-9"
            >
              <div className="about-icon-box flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <Icon className="h-6 w-6">
                  <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" />
                  <path d="m9 12 2 2 4-4" />
                </Icon>
              </div>

              <p className="mt-6 text-[10px] font-bold uppercase tracking-[.2em] text-indigo-600">
                Our approach
              </p>
              <h3 className="mt-2 text-xl font-semibold tracking-tight text-slate-900">
                Purpose-built for each role
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Students, registrar advisers, and company supervisors have
                different responsibilities. InternLink uses role-based access
                and dedicated portal workflows to support their respective
                tasks, from submitting requirements to reviewing internship
                progress and evaluations.
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                {[
                  "Role-based access",
                  "Review workflows",
                  "Progress tracking",
                ].map((tag) => (
                  <span
                    key={tag}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-[10px] font-medium text-slate-600 transition duration-200 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* TARGET USERS */}
      <section className="px-5 py-20 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-7xl">
          <div
            data-reveal
            className="about-reveal mx-auto max-w-2xl text-center"
          >
            <SectionLabel>Built around people</SectionLabel>
            <h2 className="text-3xl font-semibold tracking-[-.04em] text-slate-950 sm:text-4xl lg:text-5xl">
              Three roles. One connected system.
            </h2>
            <p className="mt-5 text-sm leading-7 text-slate-600 sm:text-base">
              Each user group has a dedicated purpose within the internship
              management process.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {stakeholders.map((user, index) => (
              <article
                key={user.title}
                data-reveal
                className={`about-reveal ${
                  index === 1
                    ? "about-delay-1"
                    : index === 2
                    ? "about-delay-2"
                    : ""
                } about-card rounded-3xl border border-slate-200/80 bg-white p-7 shadow-sm sm:p-8`}
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`about-icon-box flex h-12 w-12 items-center justify-center rounded-2xl ${
                      user.color === "indigo"
                        ? "bg-indigo-50 text-indigo-600"
                        : user.color === "sky"
                        ? "bg-sky-50 text-sky-600"
                        : "bg-blue-50 text-blue-600"
                    }`}
                  >
                    <Icon className="h-6 w-6">{user.icon}</Icon>
                  </div>
                  <span className="font-mono text-xs text-slate-300 transition-colors duration-300 group-hover:text-blue-500">
                    / {user.number}
                  </span>
                </div>

                <h3 className="mt-7 text-xl font-semibold tracking-tight text-slate-900">
                  {user.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {user.description}
                </p>

                <div className="mt-7 flex items-center gap-2 border-t border-slate-100 pt-5 text-xs font-semibold text-slate-600 transition-colors group-hover:text-blue-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  Dedicated portal experience
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* TEAM */}
      <section
        id="our-team"
        className="scroll-mt-24 border-y border-slate-100 bg-slate-50/70 px-5 py-20 sm:px-8 sm:py-24"
      >
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div data-reveal className="about-reveal max-w-2xl">
              <SectionLabel>Meet the people behind it</SectionLabel>
              <h2 className="text-3xl font-semibold tracking-[-.04em] text-slate-950 sm:text-4xl lg:text-5xl">
                Built by Group 8.
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
                A student research and development team working to make
                internship coordination more organized through technology.
              </p>
            </div>

            <div
              data-reveal
              className="about-reveal about-delay-1 flex shrink-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-950/5"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-xs font-bold text-blue-700">
                G8
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  BSIT-NW3F
                </p>
                <p className="mt-1 text-[11px] text-slate-500">
                  Research & development team
                </p>
              </div>
            </div>
          </div>

          <div className="mt-11 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {teamMembers.map((member, index) => (
              <article
                key={member.number}
                data-reveal
                className={`about-reveal ${
                  index === 1
                    ? "about-delay-1"
                    : index === 2
                    ? "about-delay-2"
                    : index === 3
                    ? "about-delay-3"
                    : ""
                } about-team-card group overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm`}
              >
                <div className="relative aspect-[4/4.3] overflow-hidden bg-slate-100">
                  <img
                    src={member.image}
                    alt={`${member.name}, ${member.role}`}
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = noProfileImg;
                    }}
                    className="about-team-image h-full w-full object-cover object-center"
                  />

                  <div className="about-image-overlay absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/5 to-transparent opacity-80" />

                  <div className="absolute left-4 top-4 rounded-lg border border-white/50 bg-white/90 px-2.5 py-1.5 font-mono text-[10px] font-semibold text-slate-700 backdrop-blur-sm transition duration-300 group-hover:border-blue-200 group-hover:bg-blue-50">
                    MEMBER / {member.number}
                  </div>

                  <div className="absolute inset-x-4 bottom-4 translate-y-1 transition-transform duration-300 group-hover:translate-y-0">
                    <p className="text-lg font-semibold tracking-tight text-white">
                      {member.surname}
                    </p>
                    <p className="mt-1 text-xs text-white/85">{member.role}</p>
                  </div>
                </div>

                <div className="p-5">
                  <p className="text-sm font-semibold leading-6 text-slate-800 transition-colors duration-300 group-hover:text-blue-700">
                    {member.name}
                  </p>
                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                    <span className="text-[10px] font-medium uppercase tracking-[.12em] text-slate-400">
                      Research team
                    </span>
                    <Icon className="about-arrow h-4 w-4 text-slate-400 group-hover:text-blue-600">
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </Icon>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ACADEMIC DETAILS */}
      <section className="px-5 py-20 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-7xl">
          <div
            data-reveal
            className="about-reveal about-shine relative isolate overflow-hidden rounded-[32px] bg-gradient-to-br from-blue-700 via-blue-700 to-indigo-800 p-7 text-white shadow-2xl shadow-blue-900/15 transition duration-500 hover:shadow-[0_30px_80px_-25px_rgba(30,64,175,.4)] sm:p-10 lg:p-14"
          >
            <div className="pointer-events-none absolute -right-20 -top-24 -z-10 h-80 w-80 rounded-full border border-white/10 transition-transform duration-700 hover:scale-110" />
            <div className="pointer-events-none absolute -right-8 -top-12 -z-10 h-56 w-56 rounded-full border border-white/10" />
            <div className="pointer-events-none absolute -bottom-36 left-1/3 -z-10 h-80 w-80 rounded-full bg-indigo-500/30 blur-3xl" />

            <div className="grid gap-10 lg:grid-cols-[1fr_.75fr] lg:items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[.2em] text-blue-100 transition duration-300 hover:bg-white/20">
                  Academic project
                </div>

                <h2 className="mt-5 max-w-xl text-3xl font-semibold leading-tight tracking-[-.04em] sm:text-4xl lg:text-5xl">
                  Technology with an academic purpose.
                </h2>

                <p className="mt-5 max-w-xl text-sm leading-7 text-blue-100 sm:text-base sm:leading-8">
                  InternLink is developed as a Software Engineering 1 project in
                  partial fulfillment of the course requirements. It applies web
                  development concepts to a practical internship management use
                  case.
                </p>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/[.08] p-6 backdrop-blur-sm transition duration-300 hover:border-white/30 hover:bg-white/[.12] sm:p-7">
                <div className="flex items-start gap-4">
                  <div className="about-icon-box flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white">
                    <Icon className="h-5 w-5">
                      <path d="M12 3 2 8l10 5 10-5-10-5Z" />
                      <path d="m2 12 10 5 10-5" />
                      <path d="m2 16 10 5 10-5" />
                    </Icon>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[.15em] text-blue-200">
                      Submitted to
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      Prof. Benjamin III F. Delgado
                    </p>
                    <p className="mt-2 text-xs leading-6 text-blue-100/80">
                      Software Engineering 1
                      <br />
                      BSIT-NW3F · Group 8
                    </p>
                  </div>
                </div>

                <div className="mt-6 border-t border-white/15 pt-5">
                  <div className="flex items-center justify-between gap-4 text-xs">
                    <span className="text-blue-200">Submission date</span>
                    <span className="font-semibold text-white">
                      July 17, 2026
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SCOPE NOTE */}
          <div
            data-reveal
            className="about-reveal mt-6 flex flex-col gap-4 rounded-2xl border border-amber-200/80 bg-amber-50/70 p-5 transition duration-300 hover:border-amber-300 hover:bg-amber-50 hover:shadow-lg hover:shadow-amber-950/5 sm:flex-row sm:items-start sm:p-6"
          >
            <div className="about-icon-box flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <Icon className="h-5 w-5">
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
                <path d="M10.3 3.9 1.8 18.1A2 2 0 0 0 3.5 21h17a2 2 0 0 0 1.7-2.9L13.7 3.9a2 2 0 0 0-3.4 0Z" />
              </Icon>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-amber-950">
                Project scope and limitations
              </h3>
              <p className="mt-2 text-xs leading-6 text-amber-900/80 sm:text-sm">
                InternLink focuses on internship applications, document
                workflows, coordination, and evaluations. Continuous GPS or
                biometric attendance monitoring and AI-based internship
                assignment matching are outside the current project scope.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="px-5 pb-20 sm:px-8 sm:pb-24">
        <div
          data-reveal
          className="about-reveal group relative mx-auto max-w-5xl overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-6 py-10 text-center transition duration-500 hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-950/10 sm:px-10 sm:py-14"
        >
          <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-blue-100/60 blur-3xl transition-transform duration-700 group-hover:scale-150" />
          <div className="pointer-events-none absolute -bottom-28 -left-12 h-48 w-48 rounded-full bg-indigo-100/60 blur-3xl transition-transform duration-700 group-hover:scale-125" />

          <div className="relative">
            <div className="about-icon-box mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
              <Icon className="h-6 w-6">
                <path d="M12 3v18" />
                <path d="M3 12h18" />
                <path d="m5.6 5.6 12.8 12.8" />
                <path d="M18.4 5.6 5.6 18.4" />
              </Icon>
            </div>

            <h2 className="mx-auto mt-6 max-w-2xl text-3xl font-semibold tracking-[-.04em] text-slate-950 sm:text-4xl">
              Better coordination starts with a better system.
            </h2>

            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
              Explore how InternLink brings internship applications, records,
              and people together in one digital workspace.
            </p>

            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <a
                href="/services"
                className="about-button about-shine group/button inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/30 focus:outline-none focus:ring-4 focus:ring-blue-200"
              >
                Explore our services
                <Icon className="about-arrow h-4 w-4">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </Icon>
              </a>

              <a
                href="/contact"
                className="about-button inline-flex min-h-[48px] items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:bg-blue-50 focus:outline-none focus:ring-4 focus:ring-blue-100"
              >
                Contact the team
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
