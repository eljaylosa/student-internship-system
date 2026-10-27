import { useRef, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronRight,
  FileText,
  FileUp,
  GraduationCap,
  Info,
  Lightbulb,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  UploadCloud,
  X,
  MapPin,
  AlertCircle,
  TrendingUp,
  BookOpen,
} from "lucide-react";

// Adjust this import path if AIMatching.jsx is nested differently.
import { supabaseStudent } from "../../supabaseClient";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const SUPPORTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getScoreColor(score, darkMode) {
  if (score >= 80) {
    return darkMode
      ? "text-emerald-300 bg-emerald-500/10 border-emerald-500/20"
      : "text-emerald-700 bg-emerald-50 border-emerald-200";
  }

  if (score >= 60) {
    return darkMode
      ? "text-amber-300 bg-amber-500/10 border-amber-500/20"
      : "text-amber-700 bg-amber-50 border-amber-200";
  }

  return darkMode
    ? "text-slate-300 bg-slate-800 border-slate-700"
    : "text-slate-600 bg-slate-100 border-slate-200";
}

function normalizeSkills(skills) {
  if (!Array.isArray(skills)) return [];
  return skills.filter((skill) => typeof skill === "string" && skill.trim());
}

export default function AIMatching() {
  const navigate = useNavigate();
  const outletContext = useOutletContext();
  const darkMode = outletContext?.darkMode ?? false;

  const fileInputRef = useRef(null);

  const [resume, setResume] = useState(null);
  const [error, setError] = useState("");
  const [isMatching, setIsMatching] = useState(false);
  const [profile, setProfile] = useState(null);
  const [matches, setMatches] = useState([]);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [matchMessage, setMatchMessage] = useState("");

  const pageBg = darkMode
    ? "bg-slate-950 text-slate-100"
    : "bg-slate-50 text-slate-900";

  const cardBg = darkMode
    ? "border-slate-800 bg-slate-900"
    : "border-slate-200 bg-white";

  const mutedText = darkMode ? "text-slate-400" : "text-slate-500";
  const subtleBg = darkMode ? "bg-slate-800/70" : "bg-slate-50";
  const divider = darkMode ? "border-slate-800" : "border-slate-100";

  const handleFile = (file) => {
    setError("");
    setMatchMessage("");

    if (!file) return;

    const extension = file.name.split(".").pop()?.toLowerCase();
    const isValidType =
      SUPPORTED_TYPES.includes(file.type) &&
      ["pdf", "docx"].includes(extension);

    if (!isValidType) {
      setError("Please select a PDF or DOCX resume.");
      return;
    }

    if (file.size === 0) {
      setError("This file is empty. Please select another resume.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("Your resume exceeds the 5 MB limit.");
      return;
    }

    setResume(file);
    setProfile(null);
    setMatches([]);
    setHasAnalyzed(false);
  };

  const handleFileInput = (event) => {
    handleFile(event.target.files?.[0]);
    event.target.value = "";
  };

  const handleDrop = (event) => {
    event.preventDefault();
    handleFile(event.dataTransfer.files?.[0]);
  };

  const removeResume = () => {
    setResume(null);
    setError("");
    setMatchMessage("");
    setProfile(null);
    setMatches([]);
    setHasAnalyzed(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleApplyNow = (match) => {
    if (!match?.opportunity_id) {
      setError("Unable to open this internship. Please try again.");
      return;
    }

    navigate("/student/application", {
      state: {
        selectedOpportunityId: match.opportunity_id,
        selectedOpportunity: {
          id: match.opportunity_id,
          title: match.title || "Internship Opportunity",
          company_name: match.company_name || "Company not specified",
        },
        source: "ai-matching",
      },
    });
  };

  const handleMatchResume = async () => {
    if (!resume || isMatching) return;

    setError("");
    setMatchMessage("");
    setIsMatching(true);
    setProfile(null);
    setMatches([]);
    setHasAnalyzed(false);

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabaseStudent.auth.getSession();

      if (sessionError) throw sessionError;

      if (!session?.access_token) {
        throw new Error(
          "Your session has expired. Please sign in again before matching your resume."
        );
      }

      const formData = new FormData();
      formData.append("resume", resume, resume.name);

      const { data, error: functionError } =
        await supabaseStudent.functions.invoke("ai-resume-matching", {
          body: formData,
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

      if (functionError) {
        let message =
          functionError.message || "The AI matching request failed.";

        // Supabase Functions errors may contain the server's response body.
        if (functionError.context) {
          try {
            const response = functionError.context;
            const body =
              typeof response.json === "function"
                ? await response.json()
                : null;

            if (body?.error) message = body.error;
            else if (body?.message) message = body.message;
          } catch {
            // Keep the original function error message.
          }
        }

        throw new Error(message);
      }

      if (!data || !Array.isArray(data.matches)) {
        throw new Error(
          "The matching service returned an unexpected response. Please check the Edge Function."
        );
      }

      const validMatches = data.matches
        .filter((match) => match && match.opportunity_id)
        .map((match) => {
          const rawScore = match.match_score ?? match.score;

          const parsedScore = Number(rawScore);

          return {
            ...match,
            score: Number.isFinite(parsedScore)
              ? Math.max(0, Math.min(100, parsedScore))
              : 0,
            matching_skills: normalizeSkills(match.matching_skills),
            missing_skills: normalizeSkills(match.missing_skills),
          };
        })
        .sort((a, b) => b.score - a.score);

      setProfile(data.profile || null);
      setMatches(validMatches);
      setHasAnalyzed(true);

      if (validMatches.length === 0) {
        setMatchMessage(
          "Your resume was analyzed, but no matching active internship opportunities were returned. Try again later or browse available opportunities."
        );
      } else {
        setMatchMessage(
          `Analysis complete. We found ${
            validMatches.length
          } potential internship match${
            validMatches.length === 1 ? "" : "es"
          } for your resume.`
        );
      }
    } catch (err) {
      console.error("[AI Matching] Error:", err);

      setError(
        err?.message ||
          "Something went wrong while analyzing your resume. Please try again."
      );
    } finally {
      setIsMatching(false);
    }
  };

  return (
    <div className={`min-h-full ${pageBg}`}>
      <div className="mx-auto max-w-7xl space-y-7 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {/* Back navigation */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className={`inline-flex items-center gap-2 rounded-lg text-sm font-semibold transition ${
            darkMode
              ? "text-slate-400 hover:text-white"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Internship Application
        </button>

        {/* Page heading */}
        <section
          className={`relative overflow-hidden rounded-2xl border p-6 sm:p-8 ${cardBg}`}
        >
          <div
            className={`pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full blur-3xl ${
              darkMode ? "bg-purple-500/10" : "bg-purple-400/10"
            }`}
          />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <div
                className={`mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${
                  darkMode
                    ? "bg-purple-500/10 text-purple-300"
                    : "bg-purple-50 text-purple-700"
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                AI-POWERED CAREER ASSISTANCE
              </div>

              <h1 className="text-2xl font-black tracking-tight sm:text-3xl lg:text-4xl">
                Find Your Best-Fit Internship
              </h1>

              <p
                className={`mt-3 max-w-xl text-sm leading-6 sm:text-base ${mutedText}`}
              >
                Upload your resume to discover internship opportunities that
                align with your skills, education, experience, and career goals.
              </p>
            </div>

            <div
              className={`flex h-24 w-24 shrink-0 items-center justify-center self-start rounded-2xl lg:h-28 lg:w-28 ${
                darkMode
                  ? "bg-purple-500/10 text-purple-300"
                  : "bg-purple-50 text-purple-600"
              }`}
            >
              <Target className="h-12 w-12 lg:h-14 lg:w-14" strokeWidth={1.5} />
            </div>
          </div>

          {/* Process steps */}
          <div
            className={`relative mt-8 grid gap-3 border-t pt-6 sm:grid-cols-3 ${divider}`}
          >
            {[
              {
                number: "01",
                title: "Upload your resume",
                description: "Choose your latest CV or resume.",
                icon: FileUp,
              },
              {
                number: "02",
                title: "Analyze your qualifications",
                description: "Identify relevant skills and experience.",
                icon: Sparkles,
              },
              {
                number: "03",
                title: "Explore your matches",
                description: "Review relevant internship opportunities.",
                icon: Target,
              },
            ].map((step) => {
              const Icon = step.icon;

              return (
                <div key={step.number} className="flex items-start gap-3 py-2">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      darkMode
                        ? "bg-slate-800 text-purple-300"
                        : "bg-purple-50 text-purple-600"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  <div>
                    <p className={`text-xs font-bold ${mutedText}`}>
                      STEP {step.number}
                    </p>
                    <h2 className="mt-1 text-sm font-bold">{step.title}</h2>
                    <p className={`mt-1 text-xs leading-5 ${mutedText}`}>
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Main content */}
        <div className="grid items-start gap-6 lg:grid-cols-12">
          {/* Resume upload */}
          <section
            className={`rounded-2xl border p-5 sm:p-6 lg:col-span-7 ${cardBg}`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                  darkMode
                    ? "bg-blue-500/10 text-blue-300"
                    : "bg-blue-50 text-blue-600"
                }`}
              >
                <FileUp className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-lg font-bold">Upload your resume</h2>
                <p className={`mt-1 text-sm leading-5 ${mutedText}`}>
                  Use your most recent resume so the AI can assess your
                  qualifications against available internships.
                </p>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleFileInput}
              className="hidden"
              aria-label="Choose resume file"
            />

            {!resume ? (
              <div
                onDragOver={(event) => event.preventDefault()}
                onDrop={handleDrop}
                className={`mt-6 flex min-h-64 flex-col items-center justify-center rounded-2xl border-2 border-dashed px-5 py-8 text-center transition ${
                  darkMode
                    ? "border-slate-700 bg-slate-950/40 hover:border-purple-500/60"
                    : "border-slate-300 bg-slate-50/70 hover:border-purple-400"
                }`}
              >
                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-2xl ${
                    darkMode
                      ? "bg-slate-800 text-purple-300"
                      : "bg-white text-purple-600 shadow-sm"
                  }`}
                >
                  <UploadCloud className="h-8 w-8" />
                </div>

                <h3 className="mt-5 text-base font-bold">
                  Drop your resume here
                </h3>
                <p className={`mt-2 text-sm ${mutedText}`}>
                  or browse files from your device
                </p>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                >
                  <FileUp className="h-4 w-4" />
                  Choose Resume
                </button>

                <p className={`mt-4 text-xs ${mutedText}`}>
                  PDF or DOCX · Maximum file size: 5 MB
                </p>
              </div>
            ) : (
              <div
                className={`mt-6 rounded-2xl border p-4 ${
                  darkMode
                    ? "border-emerald-500/20 bg-emerald-500/5"
                    : "border-emerald-200 bg-emerald-50/70"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                      darkMode
                        ? "bg-slate-800 text-emerald-300"
                        : "bg-white text-emerald-600"
                    }`}
                  >
                    <FileText className="h-6 w-6" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="break-all text-sm font-bold">
                        {resume.name}
                      </p>
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                    </div>

                    <p className={`mt-1 text-xs ${mutedText}`}>
                      {formatFileSize(resume.size)} ·{" "}
                      {resume.name.split(".").pop()?.toUpperCase()} file
                    </p>

                    <p className="mt-2 text-xs font-medium text-emerald-500">
                      File selected successfully
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={removeResume}
                    disabled={isMatching}
                    aria-label="Remove selected resume"
                    title="Remove resume"
                    className={`rounded-lg p-2 transition disabled:cursor-not-allowed disabled:opacity-50 ${
                      darkMode
                        ? "text-slate-400 hover:bg-slate-800 hover:text-red-400"
                        : "text-slate-500 hover:bg-white hover:text-red-600"
                    }`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <button
                  type="button"
                  disabled={isMatching}
                  onClick={() => fileInputRef.current?.click()}
                  className={`mt-4 inline-flex items-center gap-2 text-sm font-bold disabled:opacity-50 ${
                    darkMode
                      ? "text-purple-300 hover:text-purple-200"
                      : "text-purple-700 hover:text-purple-800"
                  }`}
                >
                  <RefreshCw className="h-4 w-4" />
                  Replace resume
                </button>
              </div>
            )}

            {error && (
              <div
                role="alert"
                className={`mt-4 flex items-start gap-2 rounded-xl border p-3 text-sm ${
                  darkMode
                    ? "border-red-500/20 bg-red-500/10 text-red-300"
                    : "border-red-200 bg-red-50 text-red-700"
                }`}
              >
                <Info className="mt-0.5 h-4 w-4 shrink-0" />
                <p className="flex-1 break-words">{error}</p>
                <button
                  type="button"
                  onClick={() => setError("")}
                  aria-label="Dismiss error"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {matchMessage && (
              <div
                role="status"
                className={`mt-4 flex items-start gap-2 rounded-xl border p-3 text-sm ${
                  darkMode
                    ? "border-purple-500/20 bg-purple-500/10 text-purple-200"
                    : "border-purple-200 bg-purple-50 text-purple-800"
                }`}
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{matchMessage}</p>
              </div>
            )}

            <div
              className={`mt-5 flex items-start gap-3 rounded-xl p-4 ${subtleBg}`}
            >
              <ShieldCheck
                className={`mt-0.5 h-5 w-5 shrink-0 ${
                  darkMode ? "text-emerald-400" : "text-emerald-600"
                }`}
              />
              <div>
                <p className="text-sm font-semibold">
                  Your information matters
                </p>
                <p className={`mt-1 text-xs leading-5 ${mutedText}`}>
                  Your resume is sent to the SIMS matching Edge Function for
                  analysis. It should not be stored unless the server is
                  explicitly configured to save it. The matching service and AI
                  provider process the resume to generate recommendations.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleMatchResume}
              disabled={!resume || isMatching}
              title={
                !resume
                  ? "Upload a resume first"
                  : isMatching
                  ? "Analyzing your resume"
                  : "Analyze your resume and find internship matches"
              }
              className={`mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold text-white transition focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:cursor-not-allowed ${
                resume && !isMatching
                  ? "bg-purple-600 hover:bg-purple-700"
                  : "bg-purple-600/60"
              }`}
            >
              {isMatching ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Analyzing Your Resume...
                </>
              ) : hasAnalyzed ? (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Analyze Again
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  {resume
                    ? "Find My Internship Matches"
                    : "Upload a Resume to Continue"}
                </>
              )}
            </button>

            <p className={`mt-3 text-center text-xs ${mutedText}`}>
              {isMatching
                ? "This may take a little while. Please keep this page open."
                : "AI recommendations are suggestions to help guide your internship search."}
            </p>
          </section>

          {/* Side panel */}
          <aside className="space-y-6 lg:col-span-5">
            <section className={`rounded-2xl border p-5 sm:p-6 ${cardBg}`}>
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                    darkMode
                      ? "bg-amber-500/10 text-amber-300"
                      : "bg-amber-50 text-amber-600"
                  }`}
                >
                  <Lightbulb className="h-5 w-5" />
                </div>
                <h2 className="text-base font-bold">How matching works</h2>
              </div>

              <div className="mt-5 space-y-5">
                <div className="flex gap-3">
                  <div className={`mt-0.5 ${mutedText}`}>
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">
                      Understand your qualifications
                    </h3>
                    <p className={`mt-1 text-xs leading-5 ${mutedText}`}>
                      Identify relevant education, skills, experience, and
                      certifications from your resume.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className={`mt-0.5 ${mutedText}`}>
                    <BriefcaseBusiness className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">
                      Compare internship opportunities
                    </h3>
                    <p className={`mt-1 text-xs leading-5 ${mutedText}`}>
                      Compare your qualifications against active opportunities
                      returned by the SIMS matching service.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className={`mt-0.5 ${mutedText}`}>
                    <Target className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">
                      Review personalized matches
                    </h3>
                    <p className={`mt-1 text-xs leading-5 ${mutedText}`}>
                      Review match scores, relevant qualifications, and skills
                      you may want to develop.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section
              className={`overflow-hidden rounded-2xl border p-5 sm:p-6 ${
                darkMode
                  ? "border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-slate-900"
                  : "border-purple-100 bg-gradient-to-br from-purple-50 to-white"
              }`}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-600 text-white">
                <Sparkles className="h-5 w-5" />
              </div>

              <h2 className="mt-4 text-base font-bold">
                More than just a match score
              </h2>

              <p className={`mt-2 text-sm leading-6 ${mutedText}`}>
                Understand why an opportunity may fit your background—not just
                receive a percentage.
              </p>

              <ul className="mt-4 space-y-3">
                {[
                  "Relevant skills and qualifications",
                  "Potential skill gaps to work on",
                  "A clearer view of internship suitability",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-purple-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          </aside>
        </div>

        {/* Recommended matches */}
        <section className={`overflow-hidden rounded-2xl border ${cardBg}`}>
          <div className={`border-b p-5 sm:p-6 ${divider}`}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-purple-500" />
                  <h2 className="text-lg font-bold">
                    Your Recommended Matches
                  </h2>
                </div>
                <p className={`mt-1 text-sm ${mutedText}`}>
                  Internship opportunities ranked by how well they match your
                  qualifications.
                </p>
              </div>

              {hasAnalyzed && (
                <span
                  className={`w-fit rounded-full px-3 py-1.5 text-xs font-bold ${
                    darkMode
                      ? "bg-purple-500/10 text-purple-300"
                      : "bg-purple-50 text-purple-700"
                  }`}
                >
                  {matches.length} match{matches.length === 1 ? "" : "es"} found
                </span>
              )}
            </div>
          </div>

          {isMatching ? (
            <div className="flex flex-col items-center px-5 py-12 text-center sm:px-8">
              <div
                className={`flex h-16 w-16 items-center justify-center rounded-2xl ${
                  darkMode
                    ? "bg-purple-500/10 text-purple-300"
                    : "bg-purple-50 text-purple-600"
                }`}
              >
                <LoaderCircle className="h-8 w-8 animate-spin" />
              </div>

              <h3 className="mt-5 text-base font-bold">
                Analyzing your qualifications
              </h3>
              <p className={`mt-2 max-w-md text-sm leading-6 ${mutedText}`}>
                The AI is reviewing your resume and comparing it with the
                internship opportunities provided by SIMS.
              </p>
            </div>
          ) : matches.length > 0 ? (
            <div className="space-y-4 p-4 sm:p-6">
              {profile && (
                <div className={`rounded-xl border p-4 ${divider} ${subtleBg}`}>
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-purple-500" />
                    <h3 className="text-sm font-bold">Resume overview</h3>
                  </div>

                  {profile.summary && (
                    <p className={`mt-2 text-sm leading-6 ${mutedText}`}>
                      {profile.summary}
                    </p>
                  )}

                  {normalizeSkills(profile.skills).length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {normalizeSkills(profile.skills).map((skill, index) => (
                        <span
                          key={`${skill}-${index}`}
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            darkMode
                              ? "bg-slate-700 text-slate-200"
                              : "bg-white text-slate-700"
                          }`}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {matches.map((match, index) => {
                const score = match.score;
                const matchingSkills = match.matching_skills;
                const missingSkills = match.missing_skills;

                return (
                  <article
                    key={match.opportunity_id}
                    className={`rounded-2xl border p-4 sm:p-5 ${
                      darkMode
                        ? "border-slate-800 bg-slate-950/40"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500">
                        <BriefcaseBusiness className="h-6 w-6" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className={`text-xs font-bold ${mutedText}`}>
                              MATCH #{index + 1}
                            </p>
                            <h3 className="mt-1 text-base font-bold">
                              {match.title || "Internship Opportunity"}
                            </h3>
                            <p className={`mt-1 text-sm ${mutedText}`}>
                              {match.company_name || "Company not specified"}
                            </p>
                          </div>

                          <div
                            className={`flex shrink-0 flex-col items-center rounded-xl border px-3 py-2 ${getScoreColor(
                              score,
                              darkMode
                            )}`}
                          >
                            <span className="text-xl font-black">{score}%</span>
                            <span className="text-[10px] font-bold uppercase tracking-wide">
                              Match
                            </span>
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
                          {match.location && (
                            <span
                              className={`inline-flex items-center gap-1.5 text-xs ${mutedText}`}
                            >
                              <MapPin className="h-3.5 w-3.5" />
                              {match.location}
                            </span>
                          )}

                          {match.position_type && (
                            <span
                              className={`inline-flex items-center gap-1.5 text-xs ${mutedText}`}
                            >
                              <BriefcaseBusiness className="h-3.5 w-3.5" />
                              {match.position_type}
                            </span>
                          )}
                        </div>

                        {match.explanation && (
                          <p className={`mt-4 text-sm leading-6 ${mutedText}`}>
                            {match.explanation}
                          </p>
                        )}

                        {matchingSkills.length > 0 && (
                          <div className="mt-4">
                            <h4 className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="h-4 w-4" />
                              Matching skills
                            </h4>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {matchingSkills.map((skill, skillIndex) => (
                                <span
                                  key={`${skill}-${skillIndex}`}
                                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                                    darkMode
                                      ? "bg-emerald-500/10 text-emerald-300"
                                      : "bg-emerald-50 text-emerald-700"
                                  }`}
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {missingSkills.length > 0 && (
                          <div className="mt-4">
                            <h4 className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400">
                              <TrendingUp className="h-4 w-4" />
                              Skills to develop
                            </h4>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {missingSkills.map((skill, skillIndex) => (
                                <span
                                  key={`${skill}-${skillIndex}`}
                                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                                    darkMode
                                      ? "bg-amber-500/10 text-amber-300"
                                      : "bg-amber-50 text-amber-700"
                                  }`}
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {match.recommendation && (
                          <div className={`mt-4 rounded-xl p-3 ${subtleBg}`}>
                            <p className="text-xs font-bold">
                              AI recommendation
                            </p>
                            <p
                              className={`mt-1 text-sm leading-5 ${mutedText}`}
                            >
                              {match.recommendation}
                            </p>
                          </div>
                        )}

                        <div className="mt-5 flex flex-col gap-3 border-t border-slate-200/70 pt-4 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between">
                          <p className={`text-xs leading-5 ${mutedText}`}>
                            Interested in this opportunity? Continue to the
                            application page.
                          </p>

                          <button
                            type="button"
                            onClick={() => handleApplyNow(match)}
                            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                          >
                            Apply Now
                            <ArrowRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center px-5 py-10 text-center sm:px-8 sm:py-14">
              <div
                className={`flex h-16 w-16 items-center justify-center rounded-2xl ${
                  darkMode
                    ? "bg-slate-800 text-purple-300"
                    : "bg-purple-50 text-purple-600"
                }`}
              >
                {hasAnalyzed ? (
                  <AlertCircle className="h-8 w-8" strokeWidth={1.5} />
                ) : (
                  <BriefcaseBusiness className="h-8 w-8" strokeWidth={1.5} />
                )}
              </div>

              <h3 className="mt-5 text-base font-bold">
                {hasAnalyzed
                  ? "No matching opportunities returned"
                  : "Your matches will appear here"}
              </h3>

              <p className={`mt-2 max-w-md text-sm leading-6 ${mutedText}`}>
                {hasAnalyzed
                  ? "Try again later or browse available internship opportunities. A low number of matches does not necessarily mean you are unqualified."
                  : "Upload your resume and select Find My Internship Matches to receive personalized recommendations."}
              </p>

              <button
                type="button"
                onClick={() => navigate(-1)}
                className={`mt-5 inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition ${
                  darkMode
                    ? "border-slate-700 hover:bg-slate-800"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                Browse Internship Opportunities
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </section>

        <p className={`pb-2 text-center text-xs ${mutedText}`}>
          AI recommendations are guidance only. You remain in control of which
          internship opportunities you choose to apply for.
        </p>
      </div>
    </div>
  );
}
