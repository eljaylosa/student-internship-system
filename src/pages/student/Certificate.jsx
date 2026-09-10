import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabaseStudent } from "../../supabaseClient";

const Certificate = () => {
  const { certificateId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [certificate, setCertificate] = useState(null);
  const [student, setStudent] = useState(null);
  const [company, setCompany] = useState(null);
  const [companySupervisor, setCompanySupervisor] = useState("");
  const [registrar, setRegistrar] = useState("");
  const [opportunity, setOpportunity] = useState(null);
  const [school, setSchool] = useState(null);

  useEffect(() => {
    loadCertificate();
  }, [certificateId]);

  const loadCertificate = async () => {
    try {
      setLoading(true);
      setError("");

      if (!certificateId) {
        throw new Error("Certificate ID is missing.");
      }

      // ============================================================
      // GET AUTHENTICATED USER
      // ============================================================
      const {
        data: { user },
        error: authError,
      } = await supabaseStudent.auth.getUser();

      if (authError) {
        throw authError;
      }

      if (!user) {
        throw new Error("You are not authenticated.");
      }

      // ============================================================
      // GET STUDENT
      // ============================================================
      const { data: studentData, error: studentError } = await supabaseStudent
        .from("students")
        .select(
          `
            id,
            student_id,
            phone,
            address,
            program,
            year_level,
            department,
            school_id,
            users (
              id,
              email,
              first_name,
              middle_name,
              last_name
            )
          `
        )
        .eq("id", user.id)
        .maybeSingle();

      if (studentError) {
        throw studentError;
      }

      if (!studentData) {
        throw new Error("Student profile could not be found.");
      }

      setStudent(studentData);

      // ============================================================
      // GET CERTIFICATE
      // ============================================================
      const { data: certificateData, error: certificateError } =
        await supabaseStudent
          .from("certificates")
          .select(
            `
            id,
            assignment_id,
            student_id,
            company_id,
            certificate_number,
            issued_at,
            certificate_url,
            school_id,
            school_logo_url
          `
          )
          .eq("id", certificateId)
          .eq("student_id", user.id)
          .maybeSingle();

      if (certificateError) {
        throw certificateError;
      }

      if (!certificateData) {
        throw new Error(
          "Certificate not found or you do not have permission to view it."
        );
      }

      setCertificate(certificateData);

      // ============================================================
      // GET ASSIGNMENT
      // ============================================================
      const { data: assignmentData, error: assignmentError } =
        await supabaseStudent
          .from("assignments")
          .select(
            `
            id,
            application_id,
            student_id,
            opportunity_id,
            company_id,
            status,
            start_date,
            end_date,
            deployed_at
          `
          )
          .eq("id", certificateData.assignment_id)
          .eq("student_id", user.id)
          .maybeSingle();

      if (assignmentError) {
        throw assignmentError;
      }

      if (!assignmentData) {
        throw new Error("The internship assignment could not be found.");
      }

      // ============================================================
      // GET COMPANY
      // ============================================================
      const { data: companyData, error: companyError } = await supabaseStudent
        .from("companies")
        .select(
          `
            id,
            user_id,
            company_name,
            company_email,
            company_phone,
            company_address,
            website,
            industry,
            designation
          `
        )
        .eq("id", assignmentData.company_id)
        .maybeSingle();

      if (companyError) {
        throw companyError;
      }

      setCompany(companyData);

      // ============================================================
      // GET OPPORTUNITY
      //
      // We use the opportunity attached to the completed assignment.
      // This preserves the internship title shown on the certificate
      // even if the opportunity is no longer active.
      // ============================================================
      const { data: opportunityData, error: opportunityError } =
        await supabaseStudent
          .from("opportunities")
          .select(
            `
            id,
            title,
            description
          `
          )
          .eq("id", assignmentData.opportunity_id)
          .maybeSingle();

      if (opportunityError) {
        throw opportunityError;
      }

      setOpportunity(opportunityData);

      // ============================================================
      // GET SCHOOL
      // ============================================================
      const schoolId =
        certificateData.school_id || studentData.school_id || null;

      if (schoolId) {
        const { data: schoolData, error: schoolError } = await supabaseStudent
          .from("schools")
          .select(
            `
              id,
              name,
              logo_url
            `
          )
          .eq("id", schoolId)
          .maybeSingle();

        if (schoolError) {
          throw schoolError;
        }

        setSchool(schoolData);
      }

      // ============================================================
      // GET CERTIFICATE SIGNATORIES
      //
      // Uses SECURITY DEFINER RPC because students may not have
      // direct SELECT access to the registrar/company users.
      // ============================================================
      const { data: signatoryData, error: signatoryError } =
        await supabaseStudent.rpc("get_certificate_signatories", {
          p_certificate_id: certificateId,
        });

      if (signatoryError) {
        throw signatoryError;
      }

      const signatory = signatoryData?.[0];

      if (signatory) {
        setRegistrar(signatory.registrar_name || "");
        setCompanySupervisor(signatory.company_supervisor_name || "");
      } else {
        setRegistrar("");
        setCompanySupervisor("");
      }

      console.log("Certificate signatories:", {
        certificateId,
        registrar: signatory?.registrar_name,
        companySupervisor: signatory?.company_supervisor_name,
      });
    } catch (err) {
      console.error("Error loading certificate:", err);

      setError(
        err?.message || "Something went wrong while loading the certificate."
      );
    } finally {
      setLoading(false);
    }
  };

  // ================================================================
  // HELPERS
  // ================================================================

  const getFullName = (user) => {
    if (!user) return "Student";

    return [user.first_name, user.middle_name, user.last_name]
      .filter(Boolean)
      .join(" ");
  };

  const formatDate = (date) => {
    if (!date) return "N/A";

    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const studentName = getFullName(student?.users);

  const registrarName = registrar || "Registrar Adviser";

  const supervisorName = companySupervisor || "Company Supervisor";

  const schoolName = school?.name || "School";

  const schoolLogo = certificate?.school_logo_url || school?.logo_url || null;

  const companyName = company?.company_name || "Company";

  // ================================================================
  // INTERNSHIP POSITION
  //
  // The certificate should display the internship opportunity title.
  //
  // Example:
  // "As Web Developer"
  // "As UI/UX Designer Intern"
  // "As Software Development Intern"
  //
  // We intentionally prioritize opportunity.title instead of
  // company.designation because the opportunity represents the
  // actual internship position the student completed.
  // ================================================================
  const internshipPosition = opportunity?.title || "Intern";

  // ================================================================
  // PRINT / PDF
  //
  // Browser's native print dialog handles "Save as PDF".
  // CSS below hides EVERYTHING except #certificate.
  // ================================================================
  const handlePrint = () => {
    window.print();
  };

  // ================================================================
  // LOADING
  // ================================================================
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-slate-800" />

          <p className="text-sm font-medium text-slate-600">
            Loading certificate...
          </p>
        </div>
      </div>
    );
  }

  // ================================================================
  // ERROR
  // ================================================================
  if (error) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <div className="w-full max-w-lg rounded-2xl bg-white p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
            <svg
              className="h-7 w-7 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z"
              />
            </svg>
          </div>

          <h2 className="text-xl font-bold text-slate-800">
            Unable to Load Certificate
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">{error}</p>

          <button
            onClick={() => navigate("/student/status")}
            className="mt-6 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Back to View Status
          </button>
        </div>
      </div>
    );
  }

  // ================================================================
  // CERTIFICATE
  // ================================================================
  return (
    <>
      {/* ============================================================
          PRINT-ONLY OVERRIDES
      ============================================================ */}
      <style>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 0;
          }

          html,
          body {
            width: 297mm !important;
            height: 210mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            overflow: hidden !important;
          }

          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          body * {
            visibility: hidden !important;
          }

          #certificate,
          #certificate * {
            visibility: visible !important;
          }

          #certificate {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;

            width: 297mm !important;
            height: 210mm !important;

            min-width: 297mm !important;
            min-height: 210mm !important;

            max-width: none !important;
            max-height: none !important;

            margin: 0 !important;
            padding: 0 !important;

            box-shadow: none !important;
            overflow: hidden !important;

            background: #ffffff !important;
            color: #111827 !important;

            page-break-after: avoid !important;
            page-break-before: avoid !important;
            page-break-inside: avoid !important;

            aspect-ratio: auto !important;
          }

          #certificate .certificate-content {
            top: 11mm !important;
            left: 15mm !important;
            right: 15mm !important;
            bottom: 11mm !important;
          }

          #certificate .certificate-outer-border {
            top: 5mm !important;
            left: 5mm !important;
            right: 5mm !important;
            bottom: 5mm !important;
            border-width: 0.8mm !important;
          }

          #certificate .certificate-inner-border {
            top: 7.5mm !important;
            left: 7.5mm !important;
            right: 7.5mm !important;
            bottom: 7.5mm !important;
            border-width: 0.25mm !important;
          }

          #certificate .school-logo,
          #certificate .school-logo-placeholder {
            width: 19mm !important;
            height: 19mm !important;
            margin-bottom: 2mm !important;
          }

          #certificate .school-name {
            font-size: 3.4mm !important;
          }

          #certificate .header-divider {
            margin-top: 2.5mm !important;
          }

          #certificate .certificate-title {
            margin-top: 5mm !important;
          }

          #certificate .certificate-title h1 {
            font-size: 10mm !important;
          }

          #certificate .certificate-title h2 {
            font-size: 4.8mm !important;
            margin-top: 1.5mm !important;
          }

          #certificate .certificate-body {
            margin-top: 5mm !important;
          }

          #certificate .intro-text {
            font-size: 4mm !important;
          }

          #certificate .student-name {
            font-size: 8mm !important;
            margin-top: 2mm !important;
          }

          #certificate .name-divider {
            margin-top: 1.5mm !important;
          }

          #certificate .completion-text {
            margin-top: 3mm !important;
            font-size: 3.4mm !important;
            line-height: 1.3 !important;
          }

          #certificate .company-name {
            margin-top: 1mm !important;
            font-size: 5.2mm !important;
          }

          #certificate .position-text {
            margin-top: 1mm !important;
            font-size: 3.4mm !important;
          }

          #certificate .period-text {
            margin-top: 1.8mm !important;
            font-size: 3.4mm !important;
          }

          #certificate .recognition-text {
            margin-top: 2.2mm !important;
            font-size: 2.8mm !important;
            line-height: 1.25 !important;
          }

          #certificate .signature-section {
            column-gap: 30mm !important;
            max-width: 185mm !important;
          }

          #certificate .signature-space {
            height: 7mm !important;
          }

          #certificate .signature-name {
            font-size: 3.2mm !important;
            padding-top: 1.5mm !important;
          }

          #certificate .signature-label {
            font-size: 2.5mm !important;
            margin-top: 0.5mm !important;
          }

          #certificate .certificate-footer {
            margin-top: 4mm !important;
          }

          #certificate .footer-label {
            font-size: 2.2mm !important;
          }

          #certificate .footer-value {
            font-size: 2.8mm !important;
            margin-top: 0.8mm !important;
          }

          #certificate .certificate-controls {
            display: none !important;
          }
        }
      `}</style>

      {/* ============================================================
          PAGE
      ============================================================ */}
      <div className="min-h-screen bg-slate-100 px-4 py-8 md:px-8">
        {/* ==========================================================
            CONTROLS
        ========================================================== */}
        <div className="certificate-controls mx-auto mb-6 flex w-full max-w-6xl items-center justify-between gap-4">
          <button
            onClick={() => navigate("/student/status")}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6v-8z"
              />
            </svg>
            Print / Save as PDF
          </button>
        </div>

        {/* ==========================================================
            CERTIFICATE
        ========================================================== */}
        <div
          id="certificate"
          className="relative mx-auto aspect-[297/210] w-full max-w-6xl overflow-hidden bg-white shadow-2xl"
        >
          {/* OUTER BORDER */}
          <div className="certificate-outer-border pointer-events-none absolute inset-[5mm] border-[0.8mm] border-slate-800" />

          {/* INNER BORDER */}
          <div className="certificate-inner-border pointer-events-none absolute inset-[7.5mm] border-[0.25mm] border-slate-400" />

          {/* ========================================================
              CONTENT
          ======================================================== */}
          <div className="certificate-content absolute inset-[11mm_15mm] flex flex-col items-center text-center">
            {/* ======================================================
                SCHOOL HEADER
            ====================================================== */}
            <div className="flex flex-col items-center">
              {schoolLogo ? (
                <img
                  src={schoolLogo}
                  alt={`${schoolName} logo`}
                  className="school-logo mb-2 h-[19mm] w-[19mm] object-contain"
                />
              ) : (
                <div className="school-logo-placeholder mb-2 flex h-[19mm] w-[19mm] items-center justify-center rounded-full border border-slate-300 bg-slate-50 text-xs text-slate-400">
                  LOGO
                </div>
              )}

              <div className="school-name text-[3.4mm] font-bold uppercase tracking-[0.12em] text-slate-800">
                {schoolName}
              </div>

              <div className="header-divider mt-[2.5mm] h-px w-32 bg-slate-300" />
            </div>

            {/* ======================================================
                TITLE
            ====================================================== */}
            <div className="certificate-title mt-[5mm]">
              <h1 className="font-serif text-[10mm] font-bold uppercase tracking-[0.08em] text-slate-900">
                Certificate
              </h1>

              <h2 className="mt-[1.5mm] text-[4.8mm] font-semibold uppercase tracking-[0.25em] text-slate-600">
                of Internship Completion
              </h2>
            </div>

            {/* ======================================================
                BODY
            ====================================================== */}
            <div className="certificate-body mt-[5mm] flex w-full flex-col items-center">
              <p className="intro-text text-[4mm] text-slate-600">
                This is to certify that
              </p>

              <div className="student-name mt-[2mm] font-serif text-[8mm] font-bold text-slate-900">
                {studentName}
              </div>

              <div className="name-divider mt-[1.5mm] h-px w-[90mm] bg-slate-400" />

              <p className="completion-text mt-[3mm] max-w-[205mm] text-[3.4mm] leading-[1.3] text-slate-600">
                has successfully completed the required internship program and
                demonstrated commitment, professionalism, and dedication during
                the internship period at
              </p>

              {/* COMPANY */}
              <div className="company-name mt-[1mm] font-serif text-[5.2mm] font-bold text-slate-900">
                {companyName}
              </div>

              {/* INTERNSHIP POSITION */}
              <div className="position-text mt-[1mm] text-[3.4mm] font-medium text-slate-600">
                As {internshipPosition}
              </div>

              {/* DATE */}
              <div className="period-text mt-[1.8mm] text-[3.4mm] text-slate-600">
                {formatDate(certificate?.issued_at)}
              </div>

              <p className="recognition-text mt-[2.2mm] max-w-[190mm] text-[2.8mm] leading-[1.25] text-slate-500">
                In recognition of the successful completion of the internship
                requirements and the valuable experience gained throughout the
                training period.
              </p>
            </div>

            {/* ======================================================
                SIGNATURES
            ====================================================== */}
            <div className="signature-section mt-auto grid w-full max-w-[185mm] grid-cols-2 gap-x-[30mm]">
              {/* REGISTRAR */}
              <div className="flex flex-col items-center">
                <div className="signature-space h-[7mm]" />

                <div className="signature-name w-full border-t border-slate-700 pt-[1.5mm] text-[3.2mm] font-bold uppercase text-slate-800">
                  {registrarName}
                </div>

                <div className="signature-label mt-[0.5mm] text-[2.5mm] font-medium uppercase tracking-[0.08em] text-slate-500">
                  Registrar Adviser
                </div>
              </div>

              {/* COMPANY SUPERVISOR */}
              <div className="flex flex-col items-center">
                <div className="signature-space h-[7mm]" />

                <div className="signature-name w-full border-t border-slate-700 pt-[1.5mm] text-[3.2mm] font-bold uppercase text-slate-800">
                  {supervisorName}
                </div>

                <div className="signature-label mt-[0.5mm] text-[2.5mm] font-medium uppercase tracking-[0.08em] text-slate-500">
                  Company Supervisor
                </div>
              </div>
            </div>

            {/* ======================================================
                FOOTER
            ====================================================== */}
            <div className="certificate-footer mt-[4mm] flex items-center gap-8 text-center">
              <div>
                <div className="footer-label text-[2.2mm] font-medium uppercase tracking-[0.12em] text-slate-400">
                  Certificate No.
                </div>

                <div className="footer-value mt-[0.8mm] text-[2.8mm] font-semibold text-slate-700">
                  {certificate?.certificate_number || "N/A"}
                </div>
              </div>

              <div className="h-7mm w-px bg-slate-300" />

              <div>
                <div className="footer-label text-[2.2mm] font-medium uppercase tracking-[0.12em] text-slate-400">
                  Date Issued
                </div>

                <div className="footer-value mt-[0.8mm] text-[2.8mm] font-semibold text-slate-700">
                  {formatDate(certificate?.issued_at)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ==========================================================
            SMALL SCREEN NOTE
        ========================================================== */}
        <div className="certificate-controls mx-auto mt-5 max-w-6xl text-center">
          <p className="text-xs text-slate-500">
            Tip: Choose <span className="font-semibold">Save as PDF</span> in
            the browser print dialog to save your certificate as a PDF.
          </p>
        </div>
      </div>
    </>
  );
};

export default Certificate;
