import React from "react";
import { useNavigate, useOutletContext } from "react-router-dom";

const Dashboard = () => {
  const { darkMode } = useOutletContext();
  const navigate = useNavigate();

  // =========================================================
  // DASHBOARD DATA
  // =========================================================

  const analyticsCards = [
    {
      title: "Active Interns",
      count: 3,
    },
    {
      title: "Evaluations",
      count: 2,
    },
    {
      title: "Tasks",
      count: 4,
    },
    {
      title: "Positions",
      count: 1,
    },
  ];

  const activeInterns = [
    {
      id: "2024-001",
      name: "John Doe",
      position: "Software Engineering Intern",
      status: "Active",
    },
    {
      id: "2024-002",
      name: "Sarah Lee",
      position: "UI/UX Design Intern",
      status: "Active",
    },
    {
      id: "2024-003",
      name: "Michael Cruz",
      position: "Web Development Intern",
      status: "Active",
    },
  ];

  const alerts = [
    {
      id: 1,
      message: "2 evaluations are pending.",
    },
    {
      id: 2,
      message: "1 internship position is awaiting approval.",
    },
  ];

  // =========================================================
  // THEME CLASSES
  // =========================================================

  const headingClass = darkMode
    ? "text-slate-100"
    : "text-slate-900";

  const mutedClass = darkMode
    ? "text-slate-400"
    : "text-slate-500";

  const cardClass = darkMode
    ? "bg-slate-900 border-slate-700"
    : "bg-white border-slate-200";

  const tableHeaderClass = darkMode
    ? "bg-slate-800 text-slate-300 border-slate-700"
    : "bg-slate-50 text-slate-600 border-slate-200";

  const tableRowClass = darkMode
    ? "border-slate-700"
    : "border-slate-200";

  const tableTextClass = darkMode
    ? "text-slate-200"
    : "text-slate-700";

  // =========================================================
  // QUICK ACTIONS
  // =========================================================

  const handleEvaluateIntern = () => {
    navigate("/company/evaluate");
  };

  const handleSubmitFeedback = () => {
    navigate("/company/feedback");
  };

  const handlePostPosition = () => {
    navigate("/company/jobs");
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="w-full min-h-full p-4 sm:p-5 md:p-6 lg:p-8">
      <div className="max-w-[1400px] mx-auto">

        {/* =====================================================
            PAGE INTRO
        ===================================================== */}

        <div className="mb-6">
          <p
            className={`text-xs uppercase tracking-widest font-bold ${mutedClass}`}
          >
            Company Portal
          </p>

          <h1
            className={`text-2xl md:text-3xl font-black mt-1 ${headingClass}`}
          >
            Company Dashboard
          </h1>

          <p className={`text-sm mt-1 ${mutedClass}`}>
            Monitor your interns, evaluations, tasks, and internship
            opportunities.
          </p>
        </div>

        {/* =====================================================
            ANALYTICS CARDS
        ===================================================== */}

        <div
          className="
            grid
            grid-cols-2
            lg:grid-cols-4
            gap-3
            md:gap-4
            mb-5
          "
        >
          {analyticsCards.map((card) => (
            <div
              key={card.title}
              className={`
                border
                rounded-xl
                p-4
                sm:p-5
                ${cardClass}
              `}
            >
              <div className="flex flex-col items-center justify-center text-center min-h-[90px]">
                <span
                  className={`
                    text-2xl
                    sm:text-3xl
                    font-black
                    ${headingClass}
                  `}
                >
                  {card.count}
                </span>

                <span
                  className={`
                    text-[10px]
                    sm:text-xs
                    mt-2
                    font-medium
                    ${mutedClass}
                  `}
                >
                  {card.title}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* =====================================================
            ACTIVE INTERNS OVERVIEW
        ===================================================== */}

        <section
          className={`
            border
            rounded-xl
            overflow-hidden
            ${cardClass}
          `}
        >
          <div className="p-4 sm:p-5">
            <div className="mb-4">
              <h2
                className={`text-base sm:text-lg font-bold ${headingClass}`}
              >
                Active Interns Overview
              </h2>

              <p className={`text-xs mt-1 ${mutedClass}`}>
                Overview of students currently assigned to your company.
              </p>
            </div>

            {/* DESKTOP TABLE */}

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th
                      className={`
                        text-left
                        px-4
                        py-3
                        text-[10px]
                        uppercase
                        tracking-wide
                        font-bold
                        border
                        ${tableHeaderClass}
                      `}
                    >
                      Student ID
                    </th>

                    <th
                      className={`
                        text-left
                        px-4
                        py-3
                        text-[10px]
                        uppercase
                        tracking-wide
                        font-bold
                        border
                        ${tableHeaderClass}
                      `}
                    >
                      Student Name
                    </th>

                    <th
                      className={`
                        text-left
                        px-4
                        py-3
                        text-[10px]
                        uppercase
                        tracking-wide
                        font-bold
                        border
                        ${tableHeaderClass}
                      `}
                    >
                      Position
                    </th>

                    <th
                      className={`
                        text-left
                        px-4
                        py-3
                        text-[10px]
                        uppercase
                        tracking-wide
                        font-bold
                        border
                        ${tableHeaderClass}
                      `}
                    >
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {activeInterns.map((intern) => (
                    <tr
                      key={intern.id}
                      className={`border ${tableRowClass}`}
                    >
                      <td
                        className={`
                          px-4
                          py-4
                          text-xs
                          border
                          ${tableRowClass}
                          ${tableTextClass}
                        `}
                      >
                        {intern.id}
                      </td>

                      <td
                        className={`
                          px-4
                          py-4
                          text-xs
                          font-semibold
                          border
                          ${tableRowClass}
                          ${tableTextClass}
                        `}
                      >
                        {intern.name}
                      </td>

                      <td
                        className={`
                          px-4
                          py-4
                          text-xs
                          border
                          ${tableRowClass}
                          ${mutedClass}
                        `}
                      >
                        {intern.position}
                      </td>

                      <td
                        className={`
                          px-4
                          py-4
                          text-xs
                          border
                          ${tableRowClass}
                        `}
                      >
                        <span
                          className={`
                            inline-flex
                            px-2.5
                            py-1
                            rounded-full
                            text-[9px]
                            font-bold
                            ${
                              darkMode
                                ? "bg-emerald-950/50 text-emerald-400"
                                : "bg-emerald-50 text-emerald-700"
                            }
                          `}
                        >
                          {intern.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* MOBILE CARDS */}

            <div className="md:hidden space-y-3">
              {activeInterns.map((intern) => (
                <div
                  key={intern.id}
                  className={`
                    border
                    rounded-lg
                    p-4
                    ${tableRowClass}
                    ${
                      darkMode
                        ? "bg-slate-800"
                        : "bg-slate-50"
                    }
                  `}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p
                        className={`text-sm font-bold ${headingClass}`}
                      >
                        {intern.name}
                      </p>

                      <p
                        className={`text-[10px] mt-1 ${mutedClass}`}
                      >
                        {intern.id}
                      </p>
                    </div>

                    <span
                      className={`
                        px-2.5
                        py-1
                        rounded-full
                        text-[9px]
                        font-bold
                        ${
                          darkMode
                            ? "bg-emerald-950/50 text-emerald-400"
                            : "bg-emerald-50 text-emerald-700"
                        }
                      `}
                    >
                      {intern.status}
                    </span>
                  </div>

                  <div
                    className={`
                      h-px
                      my-3
                      ${
                        darkMode
                          ? "bg-slate-700"
                          : "bg-slate-200"
                      }
                    `}
                  />

                  <p className={`text-xs ${mutedClass}`}>
                    {intern.position}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* =====================================================
            ALERTS + QUICK ACTIONS
        ===================================================== */}

        <div
          className="
            grid
            grid-cols-1
            lg:grid-cols-2
            gap-4
            mt-4
          "
        >

          {/* ===================================================
              ALERTS
          =================================================== */}

          <section
            className={`
              border
              rounded-xl
              p-4
              sm:p-5
              ${cardClass}
            `}
          >
            <div className="mb-4">
              <h2
                className={`text-base font-bold ${headingClass}`}
              >
                Alerts
              </h2>

              <p className={`text-xs mt-1 ${mutedClass}`}>
                Important items that may require your attention.
              </p>
            </div>

            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`
                    border
                    rounded-lg
                    px-4
                    py-3
                    ${
                      darkMode
                        ? "border-red-900/60 bg-red-950/20"
                        : "border-red-200 bg-red-50"
                    }
                  `}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`
                        mt-1
                        w-2
                        h-2
                        flex-shrink-0
                        rounded-full
                        ${
                          darkMode
                            ? "bg-red-400"
                            : "bg-red-500"
                        }
                      `}
                    />

                    <p
                      className={`
                        text-xs
                        leading-relaxed
                        ${
                          darkMode
                            ? "text-red-300"
                            : "text-red-700"
                        }
                      `}
                    >
                      {alert.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ===================================================
              QUICK ACTIONS
          =================================================== */}

          <section
            className={`
              border
              rounded-xl
              p-4
              sm:p-5
              ${cardClass}
            `}
          >
            <div className="mb-4">
              <h2
                className={`text-base font-bold ${headingClass}`}
              >
                Quick Actions
              </h2>

              <p className={`text-xs mt-1 ${mutedClass}`}>
                Quickly access common company tasks.
              </p>
            </div>

            <div className="space-y-2.5">

              {/* EVALUATE INTERN */}

              <button
                type="button"
                onClick={handleEvaluateIntern}
                className={`
                  w-full
                  h-10
                  px-4
                  rounded-lg
                  text-xs
                  font-bold
                  transition
                  ${
                    darkMode
                      ? "bg-slate-700 text-slate-100 hover:bg-slate-600"
                      : "bg-slate-800 text-white hover:bg-slate-700"
                  }
                `}
              >
                Evaluate Intern
              </button>

              {/* SUBMIT FEEDBACK */}

              <button
                type="button"
                onClick={handleSubmitFeedback}
                className={`
                  w-full
                  h-10
                  px-4
                  rounded-lg
                  text-xs
                  font-bold
                  transition
                  ${
                    darkMode
                      ? "bg-slate-700 text-slate-100 hover:bg-slate-600"
                      : "bg-slate-800 text-white hover:bg-slate-700"
                  }
                `}
              >
                Submit Feedback
              </button>

              {/* POST POSITION */}

              <button
                type="button"
                onClick={handlePostPosition}
                className={`
                  w-full
                  h-10
                  px-4
                  rounded-lg
                  text-xs
                  font-bold
                  transition
                  ${
                    darkMode
                      ? "bg-slate-700 text-slate-100 hover:bg-slate-600"
                      : "bg-slate-800 text-white hover:bg-slate-700"
                  }
                `}
              >
                Post Position
              </button>

            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
