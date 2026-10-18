import React from "react";
import { Link } from "react-router-dom";

const TermsAndConditions = () => {
  return (
    <div className="public-terms-conditions min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 font-sans text-gray-800 flex flex-col">
      <header className="bg-slate-900 border-b border-slate-800 text-white px-8 py-4 flex justify-between items-center shadow-md gap-4">
        <div className="flex space-x-6 text-xs uppercase tracking-widest text-slate-400 font-bold">
          <Link to="/" className="hover:text-white transition">
            Home
          </Link>
          <span className="text-white border-b-2 border-blue-400 pb-0.5">
            Terms
          </span>
        </div>

        <div className="text-sm md:text-base font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-200 text-center">
          STUDENT INTERNSHIP MANAGEMENT SYSTEM
        </div>

        <div className="flex space-x-6 text-xs uppercase tracking-widest text-slate-400 font-bold">
          <Link to="/login" className="hover:text-white transition">
            Login
          </Link>
          <Link to="/signup" className="hover:text-white transition">
            Sign Up
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center py-12 px-4 max-w-3xl w-full mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl mb-2">
            TERMS & CONDITIONS
          </h2>
          <p className="text-sm text-slate-500">
            Last updated: October 18, 2026
          </p>
        </div>

        <div className="bg-white rounded-2xl p-8 md:p-10 shadow-xl border border-slate-100 w-full space-y-6 text-sm text-slate-600 leading-relaxed">
          <p>
            These Terms and Conditions govern access to and use of the Student
            Internship Management System (SIMS). SIMS is intended to support
            communication, documentation, and coordination among students,
            registrar advisers, company supervisors, and authorized
            administrators involved in internship activities.
          </p>

          <p>
            By creating an account, accessing, or using SIMS, you acknowledge
            that you have read and understood these terms. If you do not agree
            with them, do not use the system. Where separate consent or
            acknowledgment is required, it must be obtained separately.
          </p>

          <div>
            <h3 className="font-bold text-base text-slate-900 mb-2 uppercase tracking-wide">
              1. Eligibility and User Accounts
            </h3>
            <p className="mb-2">
              SIMS access depends on the user's role, registration details, and
              applicable school or organization approval. Users must provide
              accurate, current, and truthful information and must not
              impersonate another person or organization.
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-slate-800">Students:</strong> Must
                provide valid student information and required registration
                documents, follow internship procedures, and submit truthful
                information and supporting records.
              </li>
              <li>
                <strong className="text-slate-800">Registrar:</strong> Must use
                their authorized accounts to review student information,
                registration records, internship requirements, and submissions
                within their assigned responsibilities.
              </li>
              <li>
                <strong className="text-slate-800">Company:</strong> Must
                provide accurate organizational information and use authorized
                access to manage relevant internship opportunities, student
                placements, and supervision-related records.
              </li>
              <li>
                <strong className="text-slate-800">Administrators:</strong> Must
                use administrative privileges only for legitimate
                system-management, account-review, and operational purposes.
              </li>
            </ul>
            <p className="mt-2">
              Registration may require identity or eligibility documents and
              email verification. Submitting a registration request does not
              guarantee approval or immediate access. Users must keep their
              login credentials confidential and promptly report suspected
              unauthorized account access.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-base text-slate-900 mb-2 uppercase tracking-wide">
              2. Account Approval and Access
            </h3>
            <p>
              SIMS may provide account review, approval, rejection, suspension,
              or deactivation workflows. Access to features may depend on
              account status, role, school association, permissions, and
              applicable system rules. Users must not attempt to bypass
              verification, access restrictions, or authorization controls.
            </p>
            <p className="mt-2">
              Users must not share accounts or use another person's account
              without authorization. SIMS administrators may investigate
              reported misuse and take appropriate action consistent with
              applicable rules, institutional procedures, and relevant law.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-base text-slate-900 mb-2 uppercase tracking-wide">
              3. Acceptable Use and Prohibited Conduct
            </h3>
            <p className="mb-2">
              Users must use SIMS lawfully, respectfully, and for its intended
              educational and internship-related purposes. Prohibited conduct
              includes:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Providing false information or falsifying internship, placement,
                evaluation, or supporting records.
              </li>
              <li>
                Forging approvals, impersonating a student or supervisor, or
                misrepresenting an organization's authority.
              </li>
              <li>
                Accessing another user's account, private messages, files, or
                records without authorization.
              </li>
              <li>
                Uploading malicious files, attempting to exploit system
                vulnerabilities, interfering with services, or bypassing
                security and access controls.
              </li>
              <li>
                Sending threatening, harassing, fraudulent, unlawful, or
                unsolicited abusive messages through system features.
              </li>
              <li>
                Using SIMS to distribute unlawful material or to collect,
                disclose, or misuse another person's personal information
                without proper authority.
              </li>
            </ul>
            <p className="mt-2">
              Suspected violations may be reviewed and may result in
              restrictions, account suspension or deactivation, referral to the
              relevant school or organization, or other appropriate action. Any
              action should be proportionate to the circumstances and consistent
              with applicable law and institutional procedures.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-base text-slate-900 mb-2 uppercase tracking-wide">
              4. Internship Opportunities and Placements
            </h3>
            <p>
              SIMS supports the submission and review of internship
              opportunities, applications, requirements, and placement-related
              records. Submission of an application or opportunity does not by
              itself guarantee acceptance, placement, completion, academic
              credit, or employment.
            </p>
            <p className="mt-2">
              Students must provide truthful application information and submit
              the documents required for the applicable process. Company
              supervisors and registrar advisers are responsible for carrying
              out reviews and decisions within their respective authority. Users
              must not misrepresent an application's status or claim an approval
              that has not been granted.
            </p>
            <p className="mt-2">
              Users remain responsible for following applicable school policies,
              internship agreements, workplace rules, attendance requirements,
              and lawful instructions from authorized supervisors. SIMS records
              and status indicators should not be treated as a substitute for
              formal institutional decisions where separate approval is
              required.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-base text-slate-900 mb-2 uppercase tracking-wide">
              5. Messages, Attachments, and Uploaded Content
            </h3>
            <p>
              Where messaging and file-attachment features are available, users
              must communicate respectfully and share only content they are
              authorized to disclose. Do not send passwords, verification codes,
              payment credentials, or unnecessary sensitive personal information
              through messages.
            </p>
            <p className="mt-2">
              Users must have the necessary rights or permission to upload
              documents, images, and other files. Do not upload malware,
              unlawful content, confidential records without authorization, or
              material that infringes another person's rights.
            </p>
            <p className="mt-2">
              Messages, attachments, and other submitted content may be
              processed and stored to provide system functionality, maintain
              records, support authorized reviews, and address security or
              operational issues. Access and retention are subject to applicable
              permissions, system configuration, the Privacy Policy, and
              relevant law.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-base text-slate-900 mb-2 uppercase tracking-wide">
              6. AI Chatbot and Automated Assistance
            </h3>
            <p>
              SIMS may provide an AI-powered chatbot to answer general questions
              about system features and procedures. AI responses are
              informational and may be incomplete, inaccurate, or outdated.
              Users should verify important requirements and decisions with the
              appropriate registrar adviser, company supervisor, or SIMS
              administrator.
            </p>
            <p className="mt-2">
              The chatbot should not be treated as an official determination of
              account status, internship eligibility, placement approval, or
              institutional policy. Do not submit passwords, one-time
              verification codes, API keys, or unnecessary confidential personal
              information to the chatbot.
            </p>
            <p className="mt-2">
              AI requests may be processed by an external AI service to generate
              responses. The handling of information sent to that service is
              described in the Privacy Policy and is subject to the applicable
              service configuration and terms.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-base text-slate-900 mb-2 uppercase tracking-wide">
              7. Privacy and Personal Information
            </h3>
            <p>
              SIMS may process account details, contact information, school or
              organization information, registration documents, profile photos,
              internship records, messages, attachments, and technical
              information necessary to operate and protect the system.
            </p>
            <p className="mt-2">
              Personal information must be handled according to the SIMS Privacy
              Policy and applicable data protection laws, including the
              Philippine Data Privacy Act of 2012 where applicable. Users must
              not access, disclose, download, or reuse personal information
              beyond their authorized responsibilities.
            </p>
            <p className="mt-2">
              For more information about the purposes of processing, data
              sharing, retention, safeguards, and applicable data subject
              rights, please review our{" "}
              <Link
                to="/privacy"
                className="font-semibold text-blue-700 hover:underline"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </div>

          <div>
            <h3 className="font-bold text-base text-slate-900 mb-2 uppercase tracking-wide">
              8. Intellectual Property and System Availability
            </h3>
            <p>
              Unless otherwise indicated, SIMS interface elements, branding,
              software, and related materials are owned by or used with
              permission from their respective rights holders. Users may not
              copy, modify, distribute, reverse engineer, or commercially
              exploit protected parts of the system except as permitted by law
              or with appropriate authorization.
            </p>
            <p className="mt-2">
              SIMS may be updated, maintained, restricted, or temporarily
              unavailable due to maintenance, technical problems, security
              concerns, or third-party service interruptions. Continuous,
              error-free availability is not guaranteed. Users should retain
              copies of important documents where appropriate and permitted.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-base text-slate-900 mb-2 uppercase tracking-wide">
              9. Third-Party Services
            </h3>
            <p>
              SIMS may rely on third-party services for functions such as
              database and file storage, email delivery, authentication, or
              AI-generated responses. These services may be governed by their
              own terms and privacy practices. Their availability and
              performance may affect SIMS functionality.
            </p>
            <p className="mt-2">
              SIMS will handle third-party integrations and disclosures in
              accordance with its Privacy Policy, applicable agreements, and
              relevant legal requirements.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-base text-slate-900 mb-2 uppercase tracking-wide">
              10. Disclaimers and Limitation of Responsibility
            </h3>
            <p>
              SIMS is a system for supporting internship administration,
              communication, and record management. It does not independently
              guarantee the accuracy of every user-submitted record, the conduct
              of users, the quality of a workplace, or the outcome of an
              internship.
            </p>
            <p className="mt-2">
              Students and host organizations remain responsible for complying
              with applicable workplace requirements, safety obligations, school
              policies, and their own agreements. Issues involving workplace
              safety, harassment, disputes, supervision, or academic decisions
              should be raised with the appropriate institution or organization
              and, where necessary, the relevant authority.
            </p>
            <p className="mt-2">
              Nothing in these terms excludes or limits any responsibility or
              right that cannot lawfully be excluded or limited under applicable
              law.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-base text-slate-900 mb-2 uppercase tracking-wide">
              11. Suspension, Deactivation, and Termination
            </h3>
            <p>
              Access may be restricted or an account may be suspended or
              deactivated when necessary to address suspected misuse, protect
              users or system security, comply with institutional requirements,
              or enforce these terms. Where appropriate, the affected user
              should be informed of the reason and any available review or
              appeal process, subject to legitimate security, privacy, and legal
              restrictions.
            </p>
            <p className="mt-2">
              Account deactivation does not necessarily mean that all associated
              records are immediately deleted. Certain records may need to be
              retained for legitimate operational, academic, security,
              dispute-resolution, or legal purposes, subject to the Privacy
              Policy and applicable law.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-base text-slate-900 mb-2 uppercase tracking-wide">
              12. Changes to These Terms
            </h3>
            <p>
              These terms may be revised when SIMS features, institutional
              procedures, or applicable legal requirements change. The updated
              version will be published on this page with a revised update date.
              Where required, users will be notified or asked to provide renewed
              acknowledgment or consent.
            </p>
            <p className="mt-2">
              Continued use of SIMS is subject to the terms applicable to that
              use, without overriding any consent or notice required by law.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-base text-slate-900 mb-2 uppercase tracking-wide">
              13. Contact and Questions
            </h3>
            <p>
              If you have questions about these terms, account access, or the
              operation of SIMS, contact the appropriate school or organization
              representative or use the official SIMS contact channel, where
              available.
            </p>
          </div>

          <div className="flex items-center justify-between gap-4 pt-6 border-t border-slate-100">
            <Link
              to="/signup"
              className="text-xs font-bold text-slate-900 hover:underline"
            >
              &lt;&lt; Return to Registration
            </Link>
            <span className="text-xs text-slate-400 font-medium text-right">
              SIMS Official Compliance Portal
            </span>
          </div>
        </div>
      </main>

      <footer className="bg-slate-900 border-t border-slate-800 text-slate-500 text-center py-4 text-[11px] tracking-wide font-medium">
        &copy; 2026 SIMS |{" "}
        <Link to="/privacy" className="hover:text-slate-300">
          Privacy Policy
        </Link>{" "}
        | <span className="text-slate-300">Terms of Service</span>
      </footer>
    </div>
  );
};

export default TermsAndConditions;
