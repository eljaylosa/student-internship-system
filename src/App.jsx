import "./App.css";
import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from "./components/Home/Home.jsx";
import Navbar from "./components/Navbar/Navbar.jsx";
import About from "./components/About/About.jsx";
import Services from "./components/Services/Services.jsx";
import Contact from "./components/Contact/Contact.jsx";
import Footer from "./components/Footer/Footer.jsx";

// auth
import SignUp from "./components/Auth/Signup.jsx";
import Login from "./components/Auth/Login.jsx";
import TermsAndConditions from "./components/Auth/Terms & Privacy Policy/Terms-&-Condition.jsx";
import PrivacyPolicy from "./components/Auth/Terms & Privacy Policy/Privacy-Policy.jsx";

import ScrollToTop from "./assets/ScrollToTop.jsx";
function App() {
  return (
    <>
      <Router>
        <ScrollToTop />
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<Services />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/login" element={<Login />} />

          <Route path="/terms" element={<TermsAndConditions />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />

          
        </Routes>
        <Footer />
      </Router>
    </>
  );
}

export default App;
