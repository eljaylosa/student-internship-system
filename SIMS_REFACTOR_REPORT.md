# SIMS Frontend Refactor Report

## Outcome

The React/Vite SIMS frontend has been refactored so page and portal-layout consumers no longer import or call `useMockStore()`. Temporary data required by affected pages now lives in page-local constants, and temporary action handlers remain local to the consuming component where the existing UI expects an interaction. `src/data/mockStore.jsx` was retained as requested and is not deleted.

The former Faculty frontend has been converted to Registrar terminology and routes. The visual structure, styling, and page layouts were not intentionally redesigned.

## Inspection summary before changes

The original project used `mockStore.jsx` from `App.jsx`, both student/faculty portal layouts, 11 admin pages, four company pages, three faculty pages, the public login page, and six student pages. These consumers read shared users, students, companies, assignments, applications, documents, evaluations, notifications, templates, settings, logs, and dashboard values. They also called mock actions for login/logout, document management, transactions, assignment updates, notifications, evaluations, attendance, document review/submission, application updates, and application drafts.

The original Faculty route tree was `/faculty` with dashboard, profile, students, applications, documents, evaluations, reports, notifications, messages, and settings child routes. Faculty terminology also appeared in admin management pages, company/student messaging and status text, and public signup/legal content.

## Main files changed

| Area | Files and changes |
|---|---|
| Application shell | `src/App.jsx` now uses local demo users and local role guards; the global `MockStoreProvider` and `useMockStore()` dependency were removed. |
| Registrar layout | `src/components/portal/RegistrarPortalLayout.jsx` replaces `FacultyPortalLayout.jsx`; sidebar paths and user-facing labels use Registrar. |
| Registrar pages | The former `src/pages/faculty/` pages now live under `src/pages/registrar/`: `Dashboard`, `Documents`, `Evaluations`, `Messages`, `Notification`, `Profile`, `Reports`, `ReviewApplications`, `Settings`, and `StudentLists`. |
| Admin pages | Affected admin pages now use page-local data and local temporary handlers; Faculty-facing labels were converted to Registrar where applicable. |
| Company pages | `Evaluate`, `Feedback`, `Interns`, and `ManageJobs` now use local demo data and local temporary handlers; affected Faculty wording was converted. |
| Public pages | `Login`, `Signup`, `Privacy-Policy`, and `Terms-&-Condition` were updated for the email/password-only demo-login direction and Registrar terminology. |
| Student pages | `Application`, `Dashboard`, `DocumentTemplate`, `Documents`, `Evaluation`, `Info`, `Messages`, and `Notification` now use local demo data where they previously consumed the mock store; affected Faculty wording was converted. |
| Existing store | `src/data/mockStore.jsx` remains present. Its demo registrar account uses the `registrar` role while relationship identifiers remain intact. |

## Remaining mockStore references

Only `src/data/mockStore.jsx` itself still defines `MockStoreProvider` and `useMockStore()`. No other source file contains a `useMockStore()` call, `MockStoreProvider` usage, or mockStore import.

## Faculty references and preserved identifiers

A static source audit found no remaining user-facing `Faculty`, `FACULTY`, or `/faculty` references outside the retained store’s internal relationship model. The following identifiers were intentionally preserved because they represent existing data relationships rather than user-facing role names: `facultyId`, `reviewerId` values that point to `FAC-001`, `adviserId` compatibility fields where present, and the existing profile identifier `FAC-001`. The Registrar demo user continues to use `profileId: "FAC-001"` so existing student/application/assignment relationships do not break.

## Routes

The Registrar portal is now available at `/registrar`, with child routes `/registrar/dashboard`, `/registrar/profile`, `/registrar/students`, `/registrar/applications`, `/registrar/documents`, `/registrar/evaluations`, `/registrar/reports`, `/registrar/notifications`, `/registrar/messages`, and `/registrar/settings`. The old `/faculty` route tree was removed rather than retained as an alias, matching the requested Registrar route conversion.

## Login direction

No real authentication, backend, API, database, Supabase, Firebase, or new state-management library was added. The application shell uses local demo users only. The retained mock store’s login signature was aligned to email and password, and the public login UI no longer depends on a mock-store login call. Existing profile and relationship IDs remain data fields, not login inputs.

## Verification

`npm run build` completed successfully with Vite 8.1.5. Vite emitted only the existing large-chunk warning. A source audit confirmed that no page/component imports or calls the mock store and that no stale Faculty route or user-facing Faculty terminology remains. The project’s ESLint configuration still reports a large set of existing React 19 lint-rule violations, including unused default React imports and pre-existing hook/style rules; these are separate from the successful production build and were not addressed because the request was a data-layer and role terminology refactor rather than a lint-rule cleanup.

## Frontend data flow after refactor

Each affected page now owns a minimal static snapshot containing only the data it renders. Component-local temporary handlers preserve the current button and form flows without persisting to a backend. The application shell owns only local demo role selection for route guards. `mockStore.jsx` remains available as an untouched legacy module for a later backend/data-layer replacement, but it is no longer part of the active page rendering path.
