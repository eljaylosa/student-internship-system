import React, { useState } from "react";

const Contact = () => {
  // Simple state management for form fields
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission logic here (e.g., API call)
    console.log("Form submitted:", formData);
    alert("Thank you! Your message has been sent.");
    setFormData({ name: "", email: "", message: "" });
  };

  return (
    <section className="bg-gray-50 min-h-screen flex items-center justify-center py-35 px-6">
      <div className="max-w-6xl w-full mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold font-mono text-gray-800 mb-4">
            Contact Us
          </h1>
          <p className="text-lg font-mono text-gray-600 max-w-xl mx-auto">
            Have questions about our internship platform? Reach out and our team
            will get back to you shortly.
          </p>
        </div>

        {/* 2-Column Grid Container */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-gray-100">
          {/* Column 1: Contact Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <h3 className="text-red-400">
              *This form is currrently in development
            </h3>
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-semibold font-mono text-gray-700 mb-2"
              >
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition font-mono text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold font-mono text-gray-700 mb-2"
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="johndoe@example.com"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition font-mono text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="message"
                className="block text-sm font-semibold font-mono text-gray-700 mb-2"
              >
                Your Message
              </label>
              <textarea
                id="message"
                name="message"
                required
                rows="5"
                value={formData.message}
                onChange={handleChange}
                placeholder="Type your message here..."
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition font-mono text-sm resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white font-semibold font-mono py-3 px-6 rounded-lg hover:bg-blue-700 transition duration-300 shadow-md hover:shadow-lg"
            >
              Send Message
            </button>
          </form>

          {/* Column 2: Location & Social Media */}
          <div className="space-y-8 lg:pl-8">
            {/* Location Sub-section */}
            <div>
              <h3 className="text-xl font-bold font-mono text-gray-800 mb-3">
                Our Headquarters
              </h3>
              <p className="text-gray-600 font-mono text-sm leading-relaxed mb-4">
                152 Tuyo Vicinal Road, Upper Tuyo, Balanga City, 2100 Bataan
                <br />
                Saint Joseph College, Balanga City, Bataan
                <br />
              </p>
              <p className="font-bold text-xl my-2.5">
                Bataan Peninsula State University
              </p>
              <p className="text-gray-600 font-mono text-sm">
                <strong>Email:</strong> support@internlink.com
                <br />
                <strong>Phone:</strong> 123456789
              </p>
            </div>

            {/* Social Media Links Sub-section */}
            <div>
              <h3 className="text-xl font-bold font-mono text-gray-800 mb-4">
                Connect With Us
              </h3>
              <div className="flex flex-wrap gap-4">
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-mono text-gray-600 hover:text-blue-600 hover:border-blue-600 transition"
                >
                  LinkedIn
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-mono text-gray-600 hover:text-sky-500 hover:border-sky-500 transition"
                >
                  Twitter
                </a>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-mono text-gray-600 hover:text-gray-900 hover:border-gray-900 transition"
                >
                  GitHub
                </a>
              </div>
            </div>

            {/* Placeholder for optional Interactive Map Embed */}
            <div className="w-full h-48 bg-gray-100 rounded-xl border border-gray-200 overflow-hidden shadow-inner">
              <iframe
                src="https://www.google.com/maps/embed?pb=!4v1784474738672!6m8!1m7!1sCAoSF0NJSE0wb2dLRUlDQWdJREx1c2U2amdF!2m2!1d14.69133977023693!2d120.5029083616517!3f51.257904!4f0!5f0.7820865974627469"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                title="Company Location Map"
              ></iframe>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
