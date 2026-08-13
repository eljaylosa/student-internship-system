import "./App.css";
import React from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

import ScrollToTop from "./assets/ScrollToTop.jsx";

// PUBLIC
import Home from "./pages/public/Home.jsx";
import Navbar from "./components/layout/Navbar.jsx";
import About from "./pages/public/About.jsx";
import Services from "./pages/public/Services.jsx";
import Contact from "./pages/public/Contact.jsx";
import Footer from "./components/layout/Footer.jsx";

// AUTH
import SignUp from "./pages/public/SignUp.jsx";
import Login from "./pages/public/Login.jsx";
import TermsAndConditions from "./pages/public/Terms-&-Condition.jsx";
import PrivacyPolicy from "./pages/public/Privacy-Policy.jsx";

// STUDENT PORTAL
import StudentDashboard from "./pages/student/Dashboard.jsx";
import StudentProfile from "./pages/student/Profile.jsx";
import StudentApplication from "./pages/student/Application.jsx";
import StudentDocuments from "./pages/student/Documents.jsx";
import StudentNotification from "./pages/student/Notification.jsx";
import StudentInfo from "./pages/student/Info.jsx";
import StudentMessages from "./pages/student/Messages.jsx";
import StudentSettings from "./pages/student/Settings.jsx";

// LAYOUTS
import StudentPortalLayout from "./components/portal/StudentPortalLayout.jsx";

function AppContent() {
  const location = useLocation();

  const isPortal = location.pathname.startsWith("/student/");

  return (
    <>
      <ScrollToTop />

      {!isPortal && <Navbar />}

      <Routes>
        {/* PUBLIC */}

        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/services" element={<Services />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/terms" element={<TermsAndConditions />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />

        {/* STUDENT PORTAL */}

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
      </Routes>

      {!isPortal && <Footer />}
    </>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
