import "./App.css";
import React from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useLocation,
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
// LAYOUTS
// =========================================================

import StudentPortalLayout from "./components/portal/StudentPortalLayout.jsx";
import FacultyPortalLayout from "./components/portal/FacultyPortalLayout.jsx";

// =========================================================
// APP CONTENT
// =========================================================

function AppContent() {
  const location = useLocation();

  // =========================================================
  // PORTAL DETECTION
  // =========================================================

  const isStudentPortal = location.pathname.startsWith("/student");
  const isFacultyPortal = location.pathname.startsWith("/faculty");

  const isPortal = isStudentPortal || isFacultyPortal;

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

        <Route path="/student" element={<StudentPortalLayout />}>
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="profile" element={<StudentProfile />} />
          <Route path="application" element={<StudentApplication />} />
          <Route path="documents" element={<StudentDocuments />} />
          <Route path="notifications" element={<StudentNotification />} />
          <Route path="info" element={<StudentInfo />} />
          <Route path="messages" element={<StudentMessages />} />
          <Route path="settings" element={<StudentSettings />} />
        </Route>

        {/* =====================================================
            FACULTY PORTAL
        ===================================================== */}

        <Route path="/faculty" element={<FacultyPortalLayout />}>
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
