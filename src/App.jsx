import "./App.css";
import React from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useLocation,
  Navigate,
} from "react-router-dom";

import ScrollToTop from "./assets/ScrollToTop.jsx";

// =========================================================
// PUBLIC
// =========================================================

import Home from "./pages/public/Home.jsx";
import Navbar from "./components/layout/Navbar.jsx";
import About from "./pages/public/About.jsx";
import Services from "./pages/public/Services.jsx";
import Contact from "./pages/public/Contact.jsx";
import Footer from "./components/layout/Footer.jsx";

// =========================================================
// AUTH
// =========================================================

import SignUp from "./pages/public/Signup.jsx";
import Login from "./pages/public/Login.jsx";
import TermsAndConditions from "./pages/public/Terms-&-Condition.jsx";
import PrivacyPolicy from "./pages/public/Privacy-Policy.jsx";

// =========================================================
// STUDENT PORTAL
// =========================================================

import StudentDashboard from "./pages/student/Dashboard.jsx";
import StudentProfile from "./pages/student/Profile.jsx";
import StudentApplication from "./pages/student/Application.jsx";
import StudentDocuments from "./pages/student/Documents.jsx";
import StudentNotification from "./pages/student/Notification.jsx";
import StudentInfo from "./pages/student/Info.jsx";
import StudentMessages from "./pages/student/Messages.jsx";
import StudentSettings from "./pages/student/Settings.jsx";
import StudentEvaluation from "./pages/student/Evaluation.jsx"

// =========================================================
// FACULTY PORTAL
// =========================================================

import FacultyDashboard from "./pages/faculty/Dashboard.jsx";
import FacultyProfile from "./pages/faculty/Profile.jsx";
import FacultyStudentLists from "./pages/faculty/StudentLists.jsx";
import FacultyReviewApplications from "./pages/faculty/ReviewApplications.jsx";
import FacultyDocuments from "./pages/faculty/Documents.jsx";
import FacultyEvaluations from "./pages/faculty/Evaluations.jsx";
import FacultyReports from "./pages/faculty/Reports.jsx";
import FacultyNotification from "./pages/faculty/Notification.jsx";
import FacultyMessages from "./pages/faculty/Messages.jsx";
import FacultySettings from "./pages/faculty/Settings.jsx";

// =========================================================
// COMPANY PORTAL
// =========================================================

import CompanyDashboard from "./pages/company/Dashboard.jsx";
import CompanyProfile from "./pages/company/Profile.jsx";
import CompanyManageJobs from "./pages/company/ManageJobs.jsx";
import CompanyInterns from "./pages/company/Interns.jsx";
import CompanyEvaluate from "./pages/company/Evaluate.jsx";
import CompanyFeedback from "./pages/company/Feedback.jsx";
import CompanyNotification from "./pages/company/Notification.jsx";
import CompanyMessages from "./pages/company/Messages.jsx";
import CompanySettings from "./pages/company/Settings.jsx";

// =========================================================
// ADMIN PORTAL
// =========================================================

import AdminLogin from "./pages/admin/Login.jsx";
import AdminDashboard from "./pages/admin/Dashboard.jsx";
import AdminProfile from "./pages/admin/Profile.jsx"
import AdminUserManagement from "./pages/admin/UserManagement.jsx";
import AdminCompanyManagement from "./pages/admin/CompanyManagement.jsx";
import AdminInternshipRecords from "./pages/admin/InternshipRecords.jsx";
import AdminDocumentManagement from "./pages/admin/DocumentManagement.jsx";
import AdminEvaluationManagement from "./pages/admin/EvaluationManagement.jsx";
import AdminReports from "./pages/admin/Reports.jsx";
import AdminSystemNotification from "./pages/admin/SystemNotification.jsx";
import AdminSystemSettings from "./pages/admin/SystemSettings.jsx";
import AdminAuditLogs from "./pages/admin/AuditLogs.jsx"

// =========================================================
// LAYOUTS
// =========================================================

import StudentPortalLayout from "./components/portal/StudentPortalLayout.jsx";
import FacultyPortalLayout from "./components/portal/FacultyPortalLayout.jsx";
import CompanyPortalLayout from "./components/portal/CompanyPortalLayout.jsx";
import AdminPortalLayout from "./components/portal/AdminPortalLayout.jsx";
import { MockStoreProvider, useMockStore } from "./data/mockStore.jsx";

// =========================================================
// APP CONTENT
// =========================================================

function RoleGuard({ role, children }) {
  const { state } = useMockStore();
  const pathname = useLocation().pathname;
  if (!state.currentUser) return <Navigate to={role === "admin" ? "/admin/login" : "/login"} replace state={{ from: pathname }} />;
  if (state.currentUser.role !== role && state.currentUser.role !== "admin") return <Navigate to={"/" + state.currentUser.role + "/dashboard"} replace />;
  return children;
}

function AppContent() {
  const location = useLocation();

  // =========================================================
  // PORTAL DETECTION
  // =========================================================

  const isStudentPortal = location.pathname.startsWith("/student");
  const isFacultyPortal = location.pathname.startsWith("/faculty");
  const isCompanyPortal = location.pathname.startsWith("/company");
  const isAdminPortal = location.pathname.startsWith("/admin");

  const isPortal =
    isStudentPortal || isFacultyPortal || isCompanyPortal || isAdminPortal;

  return (
    <>
      <ScrollToTop />

      {/* PUBLIC NAVBAR */}
      {!isPortal && <Navbar />}

      <Routes>
        {/* =====================================================
            PUBLIC ROUTES
        ===================================================== */}
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/services" element={<Services />} />
        <Route path="/contact" element={<Contact />} />
        {/* =====================================================
            AUTH ROUTES
        ===================================================== */}
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/terms" element={<TermsAndConditions />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        {/* =====================================================
            STUDENT PORTAL
        ===================================================== */}
        <Route
          path="/student"
          element={
            <RoleGuard role="student">
              <StudentPortalLayout />
            </RoleGuard>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="profile" element={<StudentProfile />} />
          <Route path="application" element={<StudentApplication />} />
          <Route path="documents" element={<StudentDocuments />} />
          <Route path="notifications" element={<StudentNotification />} />
          <Route path="info" element={<StudentInfo />} />
          <Route path="evaluation" element={<StudentEvaluation />} />
          <Route path="messages" element={<StudentMessages />} />
          <Route path="settings" element={<StudentSettings />} />
        </Route>
        {/* =====================================================
            FACULTY PORTAL
        ===================================================== */}
        <Route
          path="/faculty"
          element={
            <RoleGuard role="faculty">
              <FacultyPortalLayout />
            </RoleGuard>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<FacultyDashboard />} />
          <Route path="profile" element={<FacultyProfile />} />
          <Route path="students" element={<FacultyStudentLists />} />
          <Route path="applications" element={<FacultyReviewApplications />} />
          <Route path="documents" element={<FacultyDocuments />} />
          <Route path="evaluations" element={<FacultyEvaluations />} />
          <Route path="reports" element={<FacultyReports />} />
          <Route path="notifications" element={<FacultyNotification />} />
          <Route path="messages" element={<FacultyMessages />} />
          <Route path="settings" element={<FacultySettings />} />
        </Route>
        {/* =====================================================
            COMPANY PORTAL
        ===================================================== */}
        <Route
          path="/company"
          element={
            <RoleGuard role="company">
              <CompanyPortalLayout />
            </RoleGuard>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<CompanyDashboard />} />
          <Route path="profile" element={<CompanyProfile />} />
          <Route path="jobs" element={<CompanyManageJobs />} />
          <Route path="interns" element={<CompanyInterns />} />
          <Route path="evaluate" element={<CompanyEvaluate />} />
          <Route path="feedback" element={<CompanyFeedback />} />
          <Route path="notifications" element={<CompanyNotification />} />
          <Route path="messages" element={<CompanyMessages />} />
          <Route path="settings" element={<CompanySettings />} />
        </Route>

        {/* =====================================================
            ADMIN PORTAL
        ===================================================== */}

        {/* ADMIN LOGIN */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* ADMIN ENVIRONMENT */}
        <Route
          path="/admin"
          element={
            <RoleGuard role="admin">
              <AdminPortalLayout />
            </RoleGuard>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="profile" element={<AdminProfile />} />
          <Route path="users" element={<AdminUserManagement />} />
          <Route path="companies" element={<AdminCompanyManagement />} />
          <Route path="internships" element={<AdminInternshipRecords />} />
          <Route path="documents" element={<AdminDocumentManagement />} />
          <Route path="evaluations" element={<AdminEvaluationManagement />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="notifications" element={<AdminSystemNotification />} />
          <Route path="settings" element={<AdminSystemSettings />} />
          <Route path="audit-logs" element={<AdminAuditLogs />} />
        </Route>
      </Routes>

      {/* PUBLIC FOOTER */}
      {!isPortal && <Footer />}
    </>
  );
}

// =========================================================
// APP
// =========================================================

function App() {
  return (
    <MockStoreProvider>
      <Router>
        <AppContent />
      </Router>
    </MockStoreProvider>
  );
}

export default App;
