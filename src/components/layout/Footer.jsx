import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const navigationLinks = [
    { label: "Home", to: "/" },
    { label: "About", to: "/about" },
    { label: "Services", to: "/services" },
    { label: "Contact", to: "/contact" },
  ];

  return (
    <footer className="relative isolate overflow-hidden border-t border-white/[0.08] bg-[#080b12] font-sans text-white">
      {/* Ambient background effects */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -top-40 left-1/4 h-80 w-80 rounded-full bg-blue-600/[0.12] blur-[120px]" />
        <div className="absolute -bottom-48 right-0 h-96 w-96 rounded-full bg-indigo-600/[0.10] blur-[140px]" />

        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage: "linear-gradient(to bottom, black, transparent 85%)",
          }}
        />
      </div>

      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        {/* Main content */}
        <div className="grid gap-14 py-16 sm:py-20 lg:grid-cols-12 lg:gap-12 lg:py-24">
          {/* Brand section */}
          <div className="lg:col-span-6">
            <Link
              to="/"
              aria-label="InternLink home"
              className="group inline-flex items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-4 focus-visible:ring-offset-[#080b12]"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-blue-400/20 bg-blue-500/10 shadow-[0_0_30px_rgba(59,130,246,0.12)] transition duration-300 group-hover:border-blue-400/40 group-hover:bg-blue-500/15">
                <svg
                  aria-hidden="true"
                  className="h-6 w-6 text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.7"
                    d="M7 7h10v10M7 17 17 7"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.7"
                    d="M5 12a7 7 0 0 1 7-7"
                  />
                </svg>
              </span>

              <span className="text-2xl font-bold tracking-tight sm:text-3xl">
                Intern<span className="text-blue-400">Link</span>
              </span>
            </Link>

            <p className="mt-6 max-w-lg text-sm leading-7 text-slate-400 sm:text-base sm:leading-8">
              Connecting students, universities, and companies through a smarter
              internship management experience.
            </p>

            <div className="mt-7 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.09] bg-white/[0.035] px-3.5 py-2 text-xs text-slate-300">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                Student Internship Management System
              </span>
            </div>

            <div className="mt-10 flex items-center gap-3 text-sm text-slate-500">
              <svg
                aria-hidden="true"
                className="h-4 w-4 shrink-0 text-slate-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.7"
                  d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11Z"
                />
                <circle cx="12" cy="10" r="2.2" strokeWidth="1.7" />
              </svg>
              Balanga City, Bataan, Philippines
            </div>
          </div>

          {/* Navigation */}
          <div className="grid grid-cols-2 gap-10 sm:gap-14 lg:col-span-3 lg:gap-8">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Navigation
              </h2>

              <nav
                aria-label="Footer navigation"
                className="mt-6 flex flex-col items-start gap-4"
              >
                {navigationLinks.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="text-sm text-slate-300 transition duration-200 hover:translate-x-1 hover:text-blue-400 focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>

            <div>
              <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Get Started
              </h2>

              <div className="mt-6 flex flex-col items-start gap-4">
                <Link
                  to="/login"
                  className="text-sm text-slate-300 transition duration-200 hover:translate-x-1 hover:text-blue-400 focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                >
                  Log in
                </Link>

                <Link
                  to="/signup"
                  className="text-sm text-slate-300 transition duration-200 hover:translate-x-1 hover:text-blue-400 focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                >
                  Create account
                </Link>

                <Link
                  to="/contact"
                  className="mt-1 inline-flex items-center gap-2 rounded-xl border border-blue-400/20 bg-blue-500/10 px-4 py-2.5 text-xs font-semibold text-blue-300 transition duration-200 hover:border-blue-400/40 hover:bg-blue-500/15 hover:text-blue-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                >
                  Get in touch
                  <svg
                    aria-hidden="true"
                    className="h-3.5 w-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.8"
                      d="M5 12h14m-6-6 6 6-6 6"
                    />
                  </svg>
                </Link>
              </div>
            </div>
          </div>

          {/* Academic project details */}
          <div className="lg:col-span-3">
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Project Details
            </h2>

            <div className="mt-6 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
              <p className="text-sm font-medium leading-6 text-slate-200">
                Bataan Peninsula State University
              </p>

              <div className="my-5 h-px bg-white/[0.08]" />

              <div className="space-y-4 text-xs leading-5">
                <div>
                  <p className="text-slate-500">Course</p>
                  <p className="mt-1 text-slate-300">Software Engineering 1</p>
                </div>

                <div>
                  <p className="text-slate-500">Section / Group</p>
                  <p className="mt-1 text-slate-300">BSIT-NW3F · Group No. 8</p>
                </div>

                <div>
                  <p className="text-slate-500">Submitted to</p>
                  <p className="mt-1 text-slate-300">
                    Prof. Benjamin F. Delgado III
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col gap-5 border-t border-white/[0.08] py-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-6 text-slate-500">
            © {currentYear} InternLink. Built for a better internship
            experience.
          </p>

          <div className="flex flex-wrap items-center gap-5">
            <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 font-mono text-[10px] tracking-wide text-slate-500">
              v1.0.0
            </span>

            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="group inline-flex items-center gap-2 rounded-md text-xs font-medium text-slate-400 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-4 focus-visible:ring-offset-[#080b12]"
            >
              Back to top
              <svg
                aria-hidden="true"
                className="h-4 w-4 transition-transform duration-200 group-hover:-translate-y-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.7"
                  d="m6 14 6-6 6 6"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
