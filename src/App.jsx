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
import ResetPassword from "./pages/public/ResetPassword";
import TermsAndConditions from "./pages/public/Terms-&-Condition.jsx";
import PrivacyPolicy from "./pages/public/Privacy-Policy.jsx";

// =========================================================
// STUDENT PORTAL
// =========================================================

import StudentDashboard from "./pages/student/Dashboard.jsx";
import StudentProfile from "./pages/student/Profile.jsx";
import StudentApplication from "./pages/student/Application.jsx";
import StudentDocuments from "./pages/student/Documents.jsx";
import StudentDocumentTemplate from "./pages/student/DocumentTemplate.jsx";
import StudentNotification from "./pages/student/Notification.jsx";
import StudentInfo from "./pages/student/Info.jsx";
import StudentMessages from "./pages/student/Messages.jsx";
import StudentSettings from "./pages/student/Settings.jsx";
import StudentEvaluation from "./pages/student/Evaluation.jsx";

// =========================================================
// REGISTRAR PORTAL
// =========================================================

import RegistrarDashboard from "./pages/registrar/Dashboard.jsx";
import RegistrarProfile from "./pages/registrar/Profile.jsx";
import RegistrarStudentLists from "./pages/registrar/StudentLists.jsx";
import RegistrarReviewApplications from "./pages/registrar/ReviewApplications.jsx";
import RegistrarDocuments from "./pages/registrar/Documents.jsx";
import RegistrarManageDeployments from "./pages/registrar/ManageDeployments.jsx";
import RegistrarEvaluations from "./pages/registrar/Evaluations.jsx";
import RegistrarReports from "./pages/registrar/Reports.jsx";
import RegistrarNotification from "./pages/registrar/Notification.jsx";
import RegistrarMessages from "./pages/registrar/Messages.jsx";
import RegistrarSettings from "./pages/registrar/Settings.jsx";

// =========================================================
// COMPANY PORTAL
// =========================================================

import CompanyDashboard from "./pages/company/Dashboard.jsx";
import CompanyManageJobs from "./pages/company/ManageJobs.jsx";
import CompanyManageApplication from "./pages/company/ManageApplications.jsx";
import CompanyInterns from "./pages/company/Interns.jsx";
import CompanyEvaluate from "./pages/company/Evaluate.jsx";
import CompanyFeedback from "./pages/company/Feedback.jsx";
import CompanyNotification from "./pages/company/Notification.jsx";
import CompanyMessages from "./pages/company/Messages.jsx";
import CompanySettings from "./pages/company/Settings.jsx";
import CompanyVerificationUpload from "./pages/company/VerificationUpload.jsx";

// =========================================================
// ADMIN PORTAL
// =========================================================

import AdminLogin from "./pages/admin/Login.jsx";
import AdminDashboard from "./pages/admin/Dashboard.jsx";
import AdminProfile from "./pages/admin/Profile.jsx";
import AdminUserManagement from "./pages/admin/UserManagement.jsx";
import AdminCompanyManagement from "./pages/admin/CompanyManagement.jsx";
import AdminInternshipRecords from "./pages/admin/InternshipRecords.jsx";
import AdminDocumentManagement from "./pages/admin/DocumentManagement.jsx";
import AdminInformationManagement from "./pages/admin/InformationManagement";
import AdminEvaluationManagement from "./pages/admin/EvaluationManagement.jsx";
import AdminReports from "./pages/admin/Reports.jsx";
import AdminSystemNotification from "./pages/admin/SystemNotification.jsx";
import AdminSystemSettings from "./pages/admin/SystemSettings.jsx";
import AdminAuditLogs from "./pages/admin/AuditLogs.jsx";

// =========================================================
// LAYOUTS
// =========================================================

import StudentPortalLayout from "./components/portal/StudentPortalLayout.jsx";
import RegistrarPortalLayout from "./components/portal/RegistrarPortalLayout.jsx";
import CompanyPortalLayout from "./components/portal/CompanyPortalLayout.jsx";
import AdminPortalLayout from "./components/portal/AdminPortalLayout.jsx";
import ReviewCreateRequests from "./pages/admin/ReviewCreateRequests.jsx";

// Temporary frontend-only demo users.
// Authentication is intentionally not implemented yet.
const demoUsers = {
  student: {
    id: "USR-001",
    role: "student",
    email: "student@gmail.com",
    profileId: "STU-001",
  },

  registrar: {
    id: "USR-002",
    role: "registrar",
    email: "registrar@gmail.com",
    profileId: "FAC-001",
  },

  company: {
    id: "USR-003",
    role: "company",
    email: "company@gmail.com",
    profileId: "SUP-001",
  },

  admin: {
    id: "USR-004",
    role: "admin",
    email: "admin@sims.local",
    profileId: "ADM-001",
  },
};

// =========================================================
// ROLE GUARD
// =========================================================

function RoleGuard({ role, children }) {
  const pathname = useLocation().pathname;
  const currentUser = demoUsers[role];

  if (!currentUser) {
    return (
      <Navigate
        to={role === "admin" ? "/admin/login" : "/login"}
        replace
        state={{ from: pathname }}
      />
    );
  }

  if (currentUser.role !== role && currentUser.role !== "admin") {
    return <Navigate to={"/" + currentUser.role + "/dashboard"} replace />;
  }

  return children;
}

// =========================================================
// APP CONTENT
// =========================================================

function AppContent() {
  const location = useLocation();

  // =========================================================
  // PORTAL DETECTION
  // =========================================================

  const isStudentPortal = location.pathname.startsWith("/student");
  const isRegistrarPortal = location.pathname.startsWith("/registrar");
  const isCompanyPortal = location.pathname.startsWith("/company");
  const isAdminPortal = location.pathname.startsWith("/admin");

  const isPortal =
    isStudentPortal || isRegistrarPortal || isCompanyPortal || isAdminPortal;

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
        <Route path="/reset-password" element={<ResetPassword />} />
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
          <Route path="templates" element={<StudentDocumentTemplate />} />
          <Route path="notifications" element={<StudentNotification />} />
          <Route path="info" element={<StudentInfo />} />
          <Route path="evaluation" element={<StudentEvaluation />} />
          <Route path="messages" element={<StudentMessages />} />
          <Route path="settings" element={<StudentSettings />} />
        </Route>

        {/* =====================================================
            REGISTRAR PORTAL
        ===================================================== */}

        <Route
          path="/registrar"
          element={
            <RoleGuard role="registrar">
              <RegistrarPortalLayout />
            </RoleGuard>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />

          <Route path="dashboard" element={<RegistrarDashboard />} />
          <Route path="profile" element={<RegistrarProfile />} />
          <Route path="students" element={<RegistrarStudentLists />} />
          <Route
            path="applications"
            element={<RegistrarReviewApplications />}
          />
          <Route path="documents" element={<RegistrarDocuments />} />
          <Route path="deployment" element={<RegistrarManageDeployments />} />
          <Route path="evaluations" element={<RegistrarEvaluations />} />
          <Route path="reports" element={<RegistrarReports />} />
          <Route path="notifications" element={<RegistrarNotification />} />
          <Route path="messages" element={<RegistrarMessages />} />
          <Route path="settings" element={<RegistrarSettings />} />
        </Route>

        {/* =====================================================
    COMPANY VERIFICATION DOCUMENT UPLOAD
    Public route accessed through secure email link
===================================================== */}

        <Route
          path="/company/verification-upload"
          element={<CompanyVerificationUpload />}
        />

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
          <Route path="jobs" element={<CompanyManageJobs />} />
          <Route path="applications" element={<CompanyManageApplication />} />
          <Route path="interns" element={<CompanyInterns />} />
          <Route path="evaluate" element={<CompanyEvaluate />} />
          <Route path="feedback" element={<CompanyFeedback />} />
          <Route path="notifications" element={<CompanyNotification />} />
          <Route path="messages" element={<CompanyMessages />} />

          {/* Company information is now managed through Settings */}
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
          <Route path="requests" element={<ReviewCreateRequests />} />
          <Route path="companies" element={<AdminCompanyManagement />} />
          <Route path="internships" element={<AdminInternshipRecords />} />
          <Route path="documents" element={<AdminDocumentManagement />} />
          <Route path="information" element={<AdminInformationManagement />} />
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
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
