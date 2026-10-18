import React from "react";
import { Link } from "react-router-dom";

const PrivacyPolicy = () => {
  return (
    <div className="public-privacy-policy min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 font-sans text-gray-800 flex flex-col">
      <header className="bg-slate-900 border-b border-slate-800 text-white px-8 py-4 flex justify-between items-center shadow-md gap-4">
        <div className="flex space-x-6 text-xs uppercase tracking-widest text-slate-400 font-bold">
          <Link to="/" className="hover:text-white transition">
            Home
          </Link>
          <span className="text-white border-b-2 border-blue-400 pb-0.5">
            Privacy
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
            PRIVACY POLICY
          </h2>
          <p className="text-sm text-slate-500">
            Last updated: October 18, 2026
          </p>
        </div>

        <div className="bg-white rounded-2xl p-8 md:p-10 shadow-xl border border-slate-100 w-full space-y-6 text-sm text-slate-600 leading-relaxed">
          <p>
            This Privacy Policy explains how the Student Internship Management
            System (SIMS) collects, uses, stores, and shares personal
            information when users register for or use the system. SIMS supports
            internship-related activities involving students, registrar
            advisers, company supervisors, and authorized administrators.
          </p>

          <p>
            SIMS should be operated in accordance with applicable Philippine
            data protection laws, including the Data Privacy Act of 2012
            (Republic Act No. 10173), its implementing rules, and applicable
            guidance. The responsible school or organization should identify the
            appropriate personal information controller and provide any notices
            or consent required by law.
          </p>

          <div>
            <h3 className="font-bold text-base text-slate-900 mb-2 uppercase tracking-wide">
              1. Personal Information We May Collect
            </h3>
            <p className="mb-2">
              Depending on your role, the features you use, and the information
              you submit, SIMS may process the following categories of
              information:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-slate-800">
                  Account and contact information:
                </strong>{" "}
                Name, email address, telephone number, account identifier, role,
                and account status.
              </li>
              <li>
                <strong className="text-slate-800">
                  School and organization information:
                </strong>{" "}
                School association, school identification details, organization
                information, and relevant registration data.
              </li>
              <li>
                <strong className="text-slate-800">
                  Verification documents:
                </strong>{" "}
                Documents submitted for registration review, which may include
                student identification, certificate of registration, employee
                identification, appointment letters, or company registration
                information, depending on the user's role.
              </li>
              <li>
                <strong className="text-slate-800">Profile information:</strong>{" "}
                Profile photos and other details users choose or are required to
                provide.
              </li>
              <li>
                <strong className="text-slate-800">
                  Internship and academic records:
                </strong>{" "}
                Applications, opportunities, placement information, submitted
                requirements, evaluations, status updates, and related records
                supported by the system.
              </li>
              <li>
                <strong className="text-slate-800">
                  Messages and attachments:
                </strong>{" "}
                Message content, conversation information, and files users
                upload through available communication features.
              </li>
              <li>
                <strong className="text-slate-800">
                  Technical and security information:
                </strong>{" "}
                Information generated by system operations, such as relevant
                timestamps, account activity records, error logs, and security
                or audit events where these are implemented.
              </li>
            </ul>
            <p className="mt-2">
              The exact information collected depends on the features
              implemented and the information submitted by each user. Users
              should not submit unrelated or unnecessary sensitive personal
              information.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-base text-slate-900 mb-2 uppercase tracking-wide">
              2. How We Use Personal Information
            </h3>
            <p className="mb-2">
              Subject to applicable law and the relevant lawful basis for
              processing, SIMS may use personal information to:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Create, authenticate, and manage user accounts.</li>
              <li>Verify email addresses and review registration documents.</li>
              <li>
                Support account approval, rejection, suspension, and
                deactivation workflows.
              </li>
              <li>
                Manage internship opportunities, applications, placements,
                requirements, and evaluations.
              </li>
              <li>
                Provide messaging, notifications, and other available
                communication features.
              </li>
              <li>
                Display profile information and relevant records to authorized
                users.
              </li>
              <li>
                Maintain system functionality, investigate technical errors,
                prevent misuse, and protect system security.
              </li>
              <li>
                Respond to user inquiries and comply with applicable legal or
                institutional obligations.
              </li>
            </ul>
            <p className="mt-2">
              Personal information should only be processed for specified,
              legitimate purposes and in a manner consistent with applicable
              data protection requirements.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-base text-slate-900 mb-2 uppercase tracking-wide">
              3. AI Chatbot and External AI Processing
            </h3>
            <p>
              SIMS includes an AI-powered support chatbot that uses Google's
              Gemini API to generate responses. When a user sends a message to
              the chatbot, the conversation messages included in the request may
              be transmitted to Google for processing and response generation.
            </p>
            <p className="mt-2">
              The chatbot is intended to provide general assistance about SIMS.
              Users should not enter passwords, one-time verification codes, API
              keys, or unnecessary personal, confidential, or sensitive
              information into chatbot messages.
            </p>
            <p className="mt-2">
              AI processing is subject to the applicable Google service terms,
              privacy documentation, and configuration used by SIMS. Do not
              assume that chatbot conversations are never retained by the
              external provider. The responsible school or system operator
              should verify the applicable provider settings and disclose the
              relevant processing and retention arrangements.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-base text-slate-900 mb-2 uppercase tracking-wide">
              4. How Information May Be Shared
            </h3>
            <p className="mb-2">
              SIMS does not use personal information for sale to advertising or
              marketing brokers. Information may be made available to the
              following parties when necessary, authorized, and lawful:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-slate-800">
                  Authorized school personnel:
                </strong>{" "}
                Relevant student and internship records may be accessible to
                authorized registrar advisers and administrators for their
                assigned responsibilities.
              </li>
              <li>
                <strong className="text-slate-800">
                  Assigned company supervisors:
                </strong>{" "}
                Relevant application, placement, and internship information may
                be available to the company supervisor responsible for the
                student's placement.
              </li>
              <li>
                <strong className="text-slate-800">Other system users:</strong>{" "}
                Certain information may be visible to intended conversation
                participants or other users when required by a feature and
                permitted by system access rules.
              </li>
              <li>
                <strong className="text-slate-800">Service providers:</strong>{" "}
                Relevant information may be processed by providers supporting
                database hosting, file storage, authentication, email delivery,
                or AI chatbot functionality.
              </li>
              <li>
                <strong className="text-slate-800">
                  Authorities or other parties:
                </strong>{" "}
                Information may be disclosed when legally required or when
                another lawful basis permits the disclosure.
              </li>
            </ul>
            <p className="mt-2">
              Access depends on user roles, system permissions, applicable
              configurations, and the purpose of the relevant feature. The
              responsible operator should review these arrangements against the
              actual database policies and service agreements.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-base text-slate-900 mb-2 uppercase tracking-wide">
              5. Data Storage and Third-Party Services
            </h3>
            <p>
              SIMS uses Supabase services for supported backend functions, which
              may include database operations, authentication, and file storage.
              The system also uses an external email service for applicable
              email workflows and Google Gemini for AI chatbot responses.
            </p>
            <p className="mt-2">
              Information may be processed on infrastructure operated by these
              providers. Data location, international transfers, retention, and
              provider access depend on the configured services and applicable
              agreements. The system operator should review provider
              documentation and settings to confirm these details.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-base text-slate-900 mb-2 uppercase tracking-wide">
              6. Data Retention and Account Deactivation
            </h3>
            <p>
              Personal information should be retained only for as long as
              reasonably necessary to fulfill the stated purposes, comply with
              applicable requirements, resolve disputes, maintain legitimate
              academic records, or protect system security.
            </p>
            <p className="mt-2">
              Deactivating an account does not necessarily delete its associated
              database records, messages, attachments, or uploaded documents.
              The applicable retention period and deletion process depend on the
              system's actual configuration, institutional recordkeeping
              requirements, and applicable law.
            </p>
            <p className="mt-2">
              The responsible school or organization should establish and
              communicate appropriate retention and secure disposal procedures.
              This policy does not promise immediate deletion unless such
              deletion is supported and has been confirmed.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-base text-slate-900 mb-2 uppercase tracking-wide">
              7. Security Measures
            </h3>
            <p>
              SIMS uses technical and organizational measures intended to
              protect personal information, which may include role-based access
              controls, authentication, database access policies, and
              restrictions on private file access where configured.
            </p>
            <p className="mt-2">
              No online service can guarantee absolute security. Users must keep
              their passwords and verification codes confidential, sign out of
              shared devices, and report suspected unauthorized access or
              exposure of personal information through the appropriate support
              channel.
            </p>
            <p className="mt-2">
              The responsible operator should periodically review database
              permissions, storage access rules, third-party integrations,
              backups, and incident response procedures to ensure they reflect
              the actual system and applicable requirements.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-base text-slate-900 mb-2 uppercase tracking-wide">
              8. Your Privacy Rights
            </h3>
            <p>
              Subject to applicable law and any relevant exceptions, data
              subjects may have rights concerning their personal information,
              including the right to be informed, access applicable information,
              request correction, object to certain processing, request erasure
              or blocking where legally available, and seek appropriate
              remedies.
            </p>
            <p className="mt-2">
              The availability and scope of each right depend on the
              circumstances and applicable legal requirements. To make a
              privacy-related request, contact the responsible school or
              organization through its designated privacy or support channel.
              Identity verification may be necessary before a request is
              processed.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-base text-slate-900 mb-2 uppercase tracking-wide">
              9. Children's and Sensitive Personal Information
            </h3>
            <p>
              Users should provide only the information necessary for legitimate
              SIMS purposes. Where information involving minors or sensitive
              personal information is processed, the responsible institution
              must apply the additional safeguards, lawful basis, notices, and
              consent requirements applicable to that processing.
            </p>
            <p className="mt-2">
              Users must not access or disclose another person's sensitive
              information unless they are authorized to do so and have a
              legitimate purpose.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-base text-slate-900 mb-2 uppercase tracking-wide">
              10. Cookies, Local Storage, and Device Information
            </h3>
            <p>
              SIMS may use browser storage or similar technologies to remember
              interface preferences or support application functionality.
              Authentication and other technical data may also be handled by the
              services used by the system.
            </p>
            <p className="mt-2">
              The exact technologies and data stored depend on the application
              configuration. Users can review their browser settings to manage
              local storage, although removing stored data may affect
              preferences or sign-in functionality.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-base text-slate-900 mb-2 uppercase tracking-wide">
              11. External Links and Third-Party Policies
            </h3>
            <p>
              SIMS may direct users to third-party websites or services. Those
              services may have their own privacy policies and practices. Users
              should review the applicable policies before submitting personal
              information to an external service.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-base text-slate-900 mb-2 uppercase tracking-wide">
              12. Changes to This Privacy Policy
            </h3>
            <p>
              This policy may be updated when SIMS features, service providers,
              data processing practices, or legal requirements change. The
              revised policy will be published on this page with an updated
              date. Where required, users will receive appropriate notice or be
              asked for consent.
            </p>
            <p className="mt-2">
              Users should periodically review this page to understand the
              current privacy practices applicable to their use of SIMS.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-base text-slate-900 mb-2 uppercase tracking-wide">
              13. Contact and Privacy Inquiries
            </h3>
            <p>
              For questions about this policy, requests concerning personal
              information, or privacy-related concerns, contact the responsible
              school or organization through its official support channel or
              designated Data Protection Officer, where applicable.
            </p>
            <p className="mt-2">
              The published version of this policy should identify the
              responsible organization and provide a verified privacy contact
              before the policy is treated as final.
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
              SIMS Data Protection Policy
            </span>
          </div>
        </div>
      </main>

      <footer className="bg-slate-900 border-t border-slate-800 text-slate-500 text-center py-4 text-[11px] tracking-wide font-medium">
        &copy; 2026 SIMS |{" "}
        <span className="text-slate-300">Privacy Policy</span> |{" "}
        <Link to="/terms" className="hover:text-slate-300">
          Terms of Service
        </Link>
      </footer>
    </div>
  );
};

export default PrivacyPolicy;
