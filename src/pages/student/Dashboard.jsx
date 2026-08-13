import React from "react";

const Dashboard = () => {
  // -----------------------------------------
  // DASHBOARD DATA
  // -----------------------------------------

  const analyticsCards = [
    {
      title: "Active Internships",
      count: 23,
      bg: "bg-blue-50",
      icon: "💼",
    },
    {
      title: "Applications Sent",
      count: 5,
      bg: "bg-emerald-50",
      icon: "📝",
    },
    {
      title: "Under Review",
      count: 2,
      bg: "bg-amber-50",
      icon: "⏳",
    },
    {
      title: "Offer Received",
      count: 1,
      bg: "bg-purple-50",
      icon: "🎉",
    },
  ];

  const recentApplications = [
    {
      company: "DataWorks",
      position: "Data Analyst Intern",
      status: "Under Review",
      statusColor: "bg-amber-100 text-amber-800",
      date: "May 09, 2026",
    },
    {
      company: "TechSolutions Inc.",
      position: "Web Developer Intern",
      status: "Shortlisted",
      statusColor: "bg-blue-100 text-blue-800",
      date: "May 08, 2026",
    },
    {
      company: "Creative Minds",
      position: "UI/UX Design Intern",
      status: "Applied",
      statusColor: "bg-gray-100 text-gray-800",
      date: "May 07, 2026",
    },
    {
      company: "WriteWay Agency",
      position: "Content Writing Intern",
      status: "Rejected",
      statusColor: "bg-red-100 text-red-800",
      date: "May 06, 2026",
    },
    {
      company: "Brandify Co.",
      position: "Marketing Intern",
      status: "Offer Received",
      statusColor: "bg-emerald-100 text-emerald-800",
      date: "May 05, 2026",
    },
  ];

  const deadlines = [
    {
      month: "MAY",
      day: "15",
      title: "ABC Corp Internship",
      desc: "Application Deadline",
      tag: "2 days left",
      tagColor: "bg-red-50 text-red-600 border-red-100",
    },
    {
      month: "MAY",
      day: "20",
      title: "DataWorks Internship",
      desc: "Assessment Deadline",
      tag: "7 days left",
      tagColor: "bg-amber-50 text-amber-600 border-amber-100",
    },
    {
      month: "MAY",
      day: "28",
      title: "Creative Minds Internship",
      desc: "Application Deadline",
      tag: "15 days left",
      tagColor: "bg-emerald-50 text-emerald-600 border-emerald-100",
    },
  ];

  const announcements = [
    {
      type: "Event",
      date: "May 10, 2026",
      title: "Summer Internship Fair 2026",
      description:
        "Join us via web portal stream on May 18 for our annual internship event.",
      icon: "📅",
      color: "bg-blue-50 text-blue-600",
    },
    {
      type: "Training",
      date: "May 08, 2026",
      title: "Resume Design Workshop",
      description:
        "Improve your technical portfolios and resumes with live advice from advisers.",
      icon: "🎓",
      color: "bg-purple-50 text-purple-600",
    },
  ];

  return (
    <div className="p-5 md:p-6 lg:p-8 max-w-[1600px] mx-auto">
      {/* =========================================
          WELCOME HEADER
      ========================================= */}

      <section className="mb-8">
        <p className="text-sm font-medium text-blue-600 mb-2">
          Student Dashboard
        </p>

        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Welcome back, John! 👋
        </h1>

        <p className="mt-2 text-slate-500">
          Here's what is happening with your internship programs today.
        </p>
      </section>

      {/* =========================================
          ANALYTICS CARDS
      ========================================= */}

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        {analyticsCards.map((card) => (
          <div
            key={card.title}
            className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  {card.title}
                </p>

                <p className="text-3xl font-bold mt-2 text-slate-900">
                  {card.count}
                </p>
              </div>

              <div
                className={`w-12 h-12 rounded-xl ${card.bg} flex items-center justify-center text-lg`}
              >
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* =========================================
          APPLICATION STATUS + DEADLINES
      ========================================= */}

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        {/* APPLICATION STATUS */}

        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-bold text-lg text-slate-900">
                Application Status
              </h2>

              <p className="text-sm text-slate-400 mt-1">
                Overview of your applications
              </p>
            </div>

            <button
              type="button"
              className="text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              View Details
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-8">
            {/* DONUT */}

            <div className="relative w-40 h-40 flex-shrink-0">
              <div
                className="w-full h-full rounded-full"
                style={{
                  background:
                    "conic-gradient(#3b82f6 0deg 116deg, #f59e0b 116deg 197deg, #8b5cf6 197deg 255deg, #10b981 255deg 278deg, #e2e8f0 278deg 360deg)",
                }}
              />

              <div className="absolute inset-5 bg-white rounded-full flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-slate-900">31</span>

                <span className="text-xs text-slate-400">Total</span>
              </div>
            </div>

            {/* LEGEND */}

            <div className="space-y-4 flex-1 w-full">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-sm text-slate-600">Applied</span>
                </div>

                <span className="font-bold text-slate-900">10</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="text-sm text-slate-600">Review</span>
                </div>

                <span className="font-bold text-slate-900">7</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-purple-500" />
                  <span className="text-sm text-slate-600">Interview</span>
                </div>

                <span className="font-bold text-slate-900">5</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-sm text-slate-600">Offers</span>
                </div>

                <span className="font-bold text-slate-900">2</span>
              </div>
            </div>
          </div>
        </div>

        {/* UPCOMING DEADLINES */}

        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-bold text-lg text-slate-900">
                Upcoming Deadlines
              </h2>

              <p className="text-sm text-slate-400 mt-1">
                Important internship dates
              </p>
            </div>

            <button
              type="button"
              className="text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              View All
            </button>
          </div>

          <div className="space-y-4">
            {deadlines.map((deadline) => (
              <div
                key={deadline.title}
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition"
              >
                <div className="w-14 h-14 rounded-xl border border-slate-200 bg-slate-50 flex flex-col items-center justify-center flex-shrink-0">
                  <span className="text-[9px] font-bold text-slate-400">
                    {deadline.month}
                  </span>

                  <span className="text-xl font-bold text-slate-900">
                    {deadline.day}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate text-slate-900">
                    {deadline.title}
                  </p>

                  <p className="text-xs text-slate-400 mt-1">{deadline.desc}</p>
                </div>

                <span
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full border whitespace-nowrap ${deadline.tagColor}`}
                >
                  {deadline.tag}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================
          RECENT APPLICATIONS + ANNOUNCEMENTS
      ========================================= */}

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* RECENT APPLICATIONS */}

        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="p-6 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-lg text-slate-900">
                Recent Applications
              </h2>

              <p className="text-sm text-slate-400 mt-1">
                Your latest internship applications
              </p>
            </div>

            <button
              type="button"
              className="text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              View All Applications
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-y border-slate-100 bg-slate-50/50">
                  <th className="text-left px-6 py-3 text-xs font-bold text-slate-400 uppercase">
                    Company
                  </th>

                  <th className="text-left px-6 py-3 text-xs font-bold text-slate-400 uppercase">
                    Position
                  </th>

                  <th className="text-left px-6 py-3 text-xs font-bold text-slate-400 uppercase">
                    Status
                  </th>

                  <th className="text-left px-6 py-3 text-xs font-bold text-slate-400 uppercase">
                    Date
                  </th>
                </tr>
              </thead>

              <tbody>
                {recentApplications.map((application) => (
                  <tr
                    key={`${application.company}-${application.position}`}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition"
                  >
                    <td className="px-6 py-4">
                      <span className="font-semibold text-sm text-slate-900">
                        {application.company}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">
                        {application.position}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${application.statusColor}`}
                      >
                        {application.status}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-400">
                        {application.date}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ANNOUNCEMENTS */}

        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-bold text-lg text-slate-900">
                Latest Announcements
              </h2>

              <p className="text-sm text-slate-400 mt-1">
                Updates from your department
              </p>
            </div>

            <button
              type="button"
              className="text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              View All
            </button>
          </div>

          <div className="space-y-5">
            {announcements.map((announcement) => (
              <div
                key={announcement.title}
                className="border-b border-slate-100 last:border-0 pb-5 last:pb-0"
              >
                <div className="flex gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${announcement.color}`}
                  >
                    {announcement.icon}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[10px] font-bold uppercase text-slate-400">
                        {announcement.type}
                      </span>

                      <span className="text-[10px] text-slate-300">•</span>

                      <span className="text-[10px] text-slate-400">
                        {announcement.date}
                      </span>
                    </div>

                    <h3 className="font-semibold text-sm text-slate-900">
                      {announcement.title}
                    </h3>

                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {announcement.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================
          TIP
      ========================================= */}

      <div className="mt-6 bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center flex-shrink-0">
          💡
        </div>

        <div>
          <p className="text-sm font-bold text-blue-900">Tip</p>

          <p className="text-sm text-blue-700">
            Keep your profile and documents updated to increase your chances of
            getting matched with relevant internship opportunities.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
