import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";

const contactDetails = [
  {
    title: "Email us",
    value: "internlinksupport@gmail.com",
    description: "For questions and general inquiries",
    href: "mailto:support@internlink.com",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect
          x="3"
          y="5"
          width="18"
          height="14"
          rx="3"
          stroke="currentColor"
          strokeWidth="1.7"
        />
        <path
          d="m4 7 8 6 8-6"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: "Our institution",
    value: "Bataan Peninsula State University",
    description: "Supporting student internship experiences",
    href: null,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M3 9 12 4l9 5M5 10v8m4-8v8m6-8v8m4-8v8M3 21h18M2 18h20"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

const socialLinks = [
  { label: "LinkedIn", href: "https://www.linkedin.com/" },
  { label: "GitHub", href: "https://github.com/eljaylosa" },
];

const initialFormData = {
  name: "",
  email: "",
  message: "",
};

const statusStyles = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  error: "border-red-200 bg-red-50 text-red-800",
};

const Contact = () => {
  const [formData, setFormData] = useState(initialFormData);
  const [website, setWebsite] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formStatus, setFormStatus] = useState(null);

  useEffect(() => {
    const elements = document.querySelectorAll("[data-contact-reveal]");

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      elements.forEach((element) => element.classList.add("contact-visible"));
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("contact-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    elements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (formStatus) {
      setFormStatus(null);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting) return;

    const name = formData.name.trim();
    const email = formData.email.trim();
    const message = formData.message.trim();

    if (name.length < 2) {
      setFormStatus({
        type: "error",
        message: "Please enter your full name.",
      });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFormStatus({
        type: "error",
        message: "Please enter a valid email address.",
      });
      return;
    }

    if (message.length < 10) {
      setFormStatus({
        type: "error",
        message: "Please enter a message with at least 10 characters.",
      });
      return;
    }

    setIsSubmitting(true);
    setFormStatus(null);

    try {
      const { data, error } = await supabase.functions.invoke("contact-form", {
        body: {
          name,
          email,
          message,
          website,
        },
      });

      if (error) {
        console.error("[Contact] Function request failed:", error);
        throw new Error(
          "We couldn't submit your message. Please try again in a moment."
        );
      }

      if (!data?.success) {
        throw new Error(
          data?.message || "Something went wrong. Please try again."
        );
      }

      setFormStatus({
        type: data.notificationSent === false ? "warning" : "success",
        message:
          data.message || "Your message has been submitted successfully.",
      });

      setFormData(initialFormData);
      setWebsite("");
    } catch (error) {
      console.error("[Contact] Submission error:", error);

      setFormStatus({
        type: "error",
        message:
          error?.message ||
          "We couldn't submit your message. Please try again later.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="contact-page relative min-h-screen overflow-hidden bg-[#f7f9fd] px-4 pb-16 pt-28 font-mono text-slate-800 sm:px-6 sm:pt-32 lg:pb-24">
      <style>{`
        .contact-page {
          --contact-blue: #2563eb;
        }

        .contact-page .contact-reveal {
          opacity: 0;
          transform: translateY(22px);
          transition: opacity 750ms ease, transform 750ms cubic-bezier(.2,.7,.2,1);
        }

        .contact-page .contact-reveal.contact-visible {
          opacity: 1;
          transform: translateY(0);
        }

        .contact-page .contact-field {
          transition: border-color 220ms ease, background-color 220ms ease, box-shadow 220ms ease, transform 220ms ease;
        }

        .contact-page .contact-field:focus {
          transform: translateY(-1px);
          border-color: #60a5fa;
          background-color: #fff;
          box-shadow: 0 0 0 4px rgba(59,130,246,.11), 0 8px 20px -16px rgba(37,99,235,.5);
        }

        .contact-page .contact-card {
          transition: transform 300ms ease, box-shadow 300ms ease, border-color 300ms ease;
        }

        .contact-page .contact-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 18px 35px -24px rgba(15,23,42,.45);
        }

        .contact-page .contact-icon {
          transition: transform 280ms ease, background-color 280ms ease, color 280ms ease;
        }

        .contact-page .contact-card:hover .contact-icon {
          transform: scale(1.06) rotate(-3deg);
          background-color: rgba(59,130,246,.15);
          color: #93c5fd;
        }

        .contact-page .contact-submit {
          transition: transform 220ms ease, box-shadow 220ms ease, background-color 220ms ease;
        }

        .contact-page .contact-submit:not(:disabled):hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 24px -10px rgba(37,99,235,.6);
        }

        .contact-page .contact-orb {
          animation: contactFloat 9s ease-in-out infinite;
        }

        .contact-page .contact-orb-delay {
          animation: contactFloat 11s ease-in-out infinite reverse;
        }

        .contact-page .contact-map iframe {
          transition: filter 350ms ease, transform 500ms ease;
        }

        .contact-page .contact-map:hover iframe {
          filter: saturate(1.08);
        }

        .contact-page button:focus-visible,
        .contact-page a:focus-visible {
          outline: 3px solid #93c5fd;
          outline-offset: 4px;
        }

        @keyframes contactFloat {
          0%, 100% { transform: translateY(0) }
          50% { transform: translateY(-14px) }
        }

        @media (prefers-reduced-motion: reduce) {
          .contact-page *,
          .contact-page *::before,
          .contact-page *::after {
            animation-duration: .01ms !important;
            animation-iteration-count: 1 !important;
            scroll-behavior: auto !important;
            transition-duration: .01ms !important;
          }

          .contact-page .contact-reveal {
            opacity: 1;
            transform: none;
          }
        }
      `}</style>

      {/* Background decoration */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[600px] bg-[radial-gradient(ellipse_at_top,_rgba(219,234,254,0.75),_transparent_68%)]"
        aria-hidden="true"
      />
      <div
        className="contact-orb pointer-events-none absolute -right-24 top-40 h-72 w-72 rounded-full bg-blue-200/25 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="contact-orb-delay pointer-events-none absolute -left-28 top-[650px] h-72 w-72 rounded-full bg-indigo-200/25 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-6xl">
        {/* Page introduction */}
        <header
          className="contact-reveal mx-auto mb-12 max-w-3xl text-center sm:mb-16"
          data-contact-reveal
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700 shadow-sm shadow-blue-100/50 backdrop-blur">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-50" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-600" />
            </span>
            Get in touch
          </span>

          <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
            Let's start a
            <span className="mt-1 block bg-gradient-to-r from-blue-700 via-indigo-600 to-violet-600 bg-clip-text pb-2 text-transparent">
              conversation.
            </span>
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:mt-5 sm:text-base sm:leading-8">
            Have questions about SIMS or the internship process? Find the
            information you need or reach out to our team.
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-slate-500 sm:text-sm">
            <span className="inline-flex items-center gap-2">
              <svg
                className="h-4 w-4 text-emerald-600"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="m5 12 4 4L19 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Simple inquiry form
            </span>
            <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:block" />
            <span className="inline-flex items-center gap-2">
              <svg
                className="h-4 w-4 text-emerald-600"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinejoin="round"
                />
                <path
                  d="m9 12 2 2 4-4"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Direct support
            </span>
          </div>
        </header>

        {/* Main contact panel */}
        <div
          className="contact-reveal grid overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white shadow-[0_25px_80px_-35px_rgba(30,64,175,0.22)] lg:grid-cols-[1.05fr_0.95fr]"
          data-contact-reveal
        >
          {/* Contact form */}
          <section className="p-6 sm:p-9 lg:p-12">
            <div className="mb-8">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-blue-700">
                Send an inquiry
              </p>

              <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
                How can we help?
              </h2>

              <p className="mt-3 text-sm leading-7 text-slate-500">
                Fill in the details below to send your message to our team.
              </p>
            </div>

            {formStatus && (
              <div
                className={`mb-7 flex gap-3 rounded-xl border p-4 text-sm leading-6 shadow-sm ${
                  statusStyles[formStatus.type] || statusStyles.error
                }`}
                role={formStatus.type === "error" ? "alert" : "status"}
                aria-live="polite"
              >
                <svg
                  className="mt-0.5 h-5 w-5 shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  {formStatus.type === "success" ? (
                    <path
                      d="m5 12 4 4L19 6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  ) : (
                    <>
                      <circle
                        cx="12"
                        cy="12"
                        r="9"
                        stroke="currentColor"
                        strokeWidth="1.7"
                      />
                      <path
                        d="M12 11v5m0-8h.01"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </>
                  )}
                </svg>
                <p>{formStatus.message}</p>
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="space-y-6"
              aria-busy={isSubmitting}
            >
              {/* Honeypot: intentionally hidden from real visitors. */}
              <div
                className="absolute -left-[9999px] h-px w-px overflow-hidden"
                aria-hidden="true"
              >
                <label htmlFor="contact-website">Leave this field empty</label>
                <input
                  type="text"
                  id="contact-website"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={website}
                  onChange={(event) => setWebsite(event.target.value)}
                />
              </div>

              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Full name <span className="text-blue-600">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  autoComplete="name"
                  required
                  minLength={2}
                  maxLength={100}
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  disabled={isSubmitting}
                  className="contact-field w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Email address <span className="text-blue-600">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  autoComplete="email"
                  required
                  maxLength={254}
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  disabled={isSubmitting}
                  className="contact-field w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label
                    htmlFor="message"
                    className="block text-sm font-bold text-slate-700"
                  >
                    Your message <span className="text-blue-600">*</span>
                  </label>
                  <span
                    className={`text-xs tabular-nums ${
                      formData.message.length >= 950
                        ? "text-amber-600"
                        : "text-slate-400"
                    }`}
                  >
                    {formData.message.length}/1000
                  </span>
                </div>

                <textarea
                  id="message"
                  name="message"
                  required
                  minLength={10}
                  rows={5}
                  maxLength={1000}
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Tell us how we can help..."
                  disabled={isSubmitting}
                  className="contact-field w-full resize-y rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3.5 text-sm leading-6 text-slate-900 outline-none placeholder:text-slate-400 hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="contact-submit flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 text-sm font-extrabold text-white shadow-lg shadow-blue-600/15 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="h-4 w-4 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="9"
                        stroke="currentColor"
                        strokeWidth="3"
                        opacity="0.25"
                      />
                      <path
                        d="M21 12a9 9 0 0 0-9-9"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                    </svg>
                    Sending...
                  </>
                ) : (
                  <>
                    Send message
                    <svg
                      className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M22 2 11 13m11-11-7 20-4-9-9-4L22 2Z"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </>
                )}
              </button>

              <p className="text-center text-xs leading-5 text-slate-400">
                {isSubmitting
                  ? "Please wait while we submit your inquiry."
                  : "Your inquiry will be submitted to our support team."}
              </p>
            </form>
          </section>

          {/* Contact information */}
          <aside className="relative isolate overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-[#172554] p-6 text-white sm:p-9 lg:p-12">
            <div
              className="pointer-events-none absolute -right-24 -top-24 -z-10 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute -bottom-24 -left-24 -z-10 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(135deg,rgba(255,255,255,0.035),transparent_55%)]"
              aria-hidden="true"
            />

            <div className="relative">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-blue-300">
                Contact information
              </p>

              <h2 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">
                We're here to help.
              </h2>

              <p className="mt-4 text-sm leading-7 text-slate-300">
                Whether you need help navigating SIMS or have questions about
                internship coordination, start with the details below.
              </p>

              <div className="mt-9 space-y-4">
                {contactDetails.map((detail, index) => (
                  <div
                    key={detail.title}
                    className="contact-card flex gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.045] p-4 hover:border-blue-400/30 hover:bg-white/[0.075] sm:p-5"
                    style={{ transitionDelay: `${index * 40}ms` }}
                  >
                    <div className="contact-icon flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-blue-300">
                      <span className="h-6 w-6">{detail.icon}</span>
                    </div>

                    <div className="min-w-0 pt-0.5">
                      <h3 className="text-sm font-extrabold text-white">
                        {detail.title}
                      </h3>

                      {detail.href ? (
                        <a
                          href={detail.href}
                          className="mt-1 block break-words text-sm font-semibold text-blue-300 transition-colors hover:text-white"
                        >
                          {detail.value}
                        </a>
                      ) : (
                        <p className="mt-1 text-sm font-semibold leading-6 text-slate-100">
                          {detail.value}
                        </p>
                      )}

                      <p className="mt-1 text-xs leading-5 text-slate-400">
                        {detail.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="my-8 h-px bg-gradient-to-r from-white/20 via-white/10 to-transparent" />

              <div>
                <h3 className="text-sm font-extrabold text-white">
                  Connect with us
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Find our development work and professional updates.
                </p>

                <div className="mt-4 flex flex-wrap gap-3">
                  {socialLinks.map((social) => (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-slate-200 transition duration-200 hover:-translate-y-0.5 hover:border-blue-400/50 hover:bg-blue-400/10 hover:text-white"
                    >
                      {social.label}
                      <span
                        className="text-xs text-blue-300 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                        aria-hidden="true"
                      >
                        ↗
                      </span>
                    </a>
                  ))}
                </div>
              </div>

              {/* Map */}
              <div className="contact-map mt-8 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
                <div className="flex items-center justify-between gap-3 px-4 py-4">
                  <div>
                    <p className="text-sm font-extrabold text-white">
                      Find us on the map
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-400">
                      Bataan Peninsula State University
                    </p>
                  </div>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-blue-300">
                    <svg
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"
                        stroke="currentColor"
                        strokeWidth="1.7"
                      />
                      <circle
                        cx="12"
                        cy="10"
                        r="2.5"
                        stroke="currentColor"
                        strokeWidth="1.7"
                      />
                    </svg>
                  </div>
                </div>

                <div className="h-52 overflow-hidden bg-slate-800 sm:h-60">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!4v1784474738672!6m8!1m7!1sCAoSF0NJSE0wb2dLRUlDQWdJREx1c2U2amdF!2m2!1d14.69133977023693!2d120.5029083616517!3f51.257904!4f0!5f0.7820865974627469"
                    className="h-full w-full border-0 grayscale-[20%] transition duration-500 hover:grayscale-0"
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="strict-origin-when-cross-origin"
                    title="Map showing the contact location"
                  />
                </div>
              </div>

              <div className="mt-6 flex items-center gap-3 text-xs leading-5 text-slate-400">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
                  ✓
                </span>
                <p>We appreciate your interest in InternLink.</p>
              </div>
            </div>
          </aside>
        </div>

        <footer className="mt-8 text-center">
          <p className="text-xs leading-6 text-slate-400">
            InternLink <span className="mx-1.5 text-slate-300">·</span>
            Supporting a better internship experience
          </p>
        </footer>
      </div>
    </main>
  );
};

export default Contact;
