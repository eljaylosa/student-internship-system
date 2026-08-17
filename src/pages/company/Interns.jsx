import React, { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";

const STORAGE_KEY = "sims_company_intern_attendance";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const DEFAULT_INTERNS = [
  {
    id: 1,
    name: "John Doe",
    attendance: {
      Mon: { present: true, time: "8:00" },
      Tue: { present: true, time: "8:00" },
      Wed: { present: true, time: "8:00" },
      Thu: { present: true, time: "8:00" },
      Fri: { present: true, time: "8:00" },
      Sat: { present: false, time: "--" },
      Sun: { present: false, time: "--" },
    },
  },
  {
    id: 2,
    name: "Jane Smith",
    attendance: {
      Mon: { present: true, time: "8:00" },
      Tue: { present: true, time: "8:00" },
      Wed: { present: true, time: "8:00" },
      Thu: { present: true, time: "8:00" },
      Fri: { present: true, time: "8:00" },
      Sat: { present: false, time: "--" },
      Sun: { present: false, time: "--" },
    },
  },
  {
    id: 3,
    name: "Mike Wilson",
    attendance: {
      Mon: { present: true, time: "8:00" },
      Tue: { present: true, time: "8:00" },
      Wed: { present: true, time: "8:00" },
      Thu: { present: true, time: "8:00" },
      Fri: { present: true, time: "8:00" },
      Sat: { present: false, time: "--" },
      Sun: { present: false, time: "--" },
    },
  },
];

const Interns = () => {
  const { darkMode } = useOutletContext();

  // =========================================
  // ATTENDANCE DATA
  // =========================================

  const [interns, setInterns] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      return saved ? JSON.parse(saved) : DEFAULT_INTERNS;
    } catch {
      return DEFAULT_INTERNS;
    }
  });

  const [searchQuery, setSearchQuery] = useState("");

  // =========================================
  // SAVE ATTENDANCE
  // =========================================

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(interns));
  }, [interns]);

  // =========================================
  // THEME CLASSES
  // =========================================

  const pageText = darkMode ? "text-slate-100" : "text-slate-900";

  const mutedText = darkMode ? "text-slate-400" : "text-slate-500";

  const cardClass = darkMode
    ? "bg-slate-900 border-slate-700"
    : "bg-white border-slate-200";

  const tableHeaderClass = darkMode
    ? "bg-slate-800 border-slate-700 text-slate-300"
    : "bg-slate-100 border-slate-200 text-slate-700";

  const inputClass = darkMode
    ? "w-full h-10 px-3 rounded-lg border border-slate-700 bg-slate-800 text-sm text-slate-200 placeholder:text-slate-500 outline-none focus:border-slate-500 transition"
    : "w-full h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:bg-white focus:border-slate-400 transition";

  // =========================================
  // FILTER INTERNS
  // =========================================

  const filteredInterns = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    if (!query) {
      return interns;
    }

    return interns.filter((intern) =>
      intern.name.toLowerCase().includes(query)
    );
  }, [interns, searchQuery]);

  // =========================================
  // TOGGLE ATTENDANCE
  // =========================================

  const handleToggleAttendance = (internId, day) => {
    setInterns((prev) =>
      prev.map((intern) => {
        if (intern.id !== internId) {
          return intern;
        }

        const currentAttendance = intern.attendance[day];

        const newPresent = !currentAttendance.present;

        return {
          ...intern,
          attendance: {
            ...intern.attendance,
            [day]: {
              present: newPresent,
              time: newPresent ? "8:00" : "--",
            },
          },
        };
      })
    );
  };

  // =========================================
  // CALCULATE PRESENT DAYS
  // =========================================

  const getPresentCount = (intern) => {
    return DAYS.filter((day) => intern.attendance[day]?.present).length;
  };

  // =========================================
  // RENDER
  // =========================================

  return (
    <div className="p-5 md:p-6 lg:p-8 max-w-[1400px] mx-auto">
      {/* =========================================
          PAGE HEADER
      ========================================= */}

      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-5">
        <div>
          <p
            className={`text-xs uppercase tracking-widest font-bold ${mutedText}`}
          >
            Company Portal
          </p>

          <h1 className={`text-2xl font-black mt-1 ${pageText}`}>
            Assigned Interns
          </h1>

          <p className={`text-sm mt-1 ${mutedText}`}>
            Monitor intern attendance and daily activity.
          </p>
        </div>

        {/* SEARCH */}

        <div className="w-full md:w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search intern..."
            className={inputClass}
          />
        </div>
      </div>

      {/* =========================================
          ATTENDANCE LEGEND
      ========================================= */}

      <div
        className={`flex flex-wrap items-center gap-4 mb-4 text-[10px] ${mutedText}`}
      >
        <div className="flex items-center gap-2">
          <span
            className={`w-4 h-4 border rounded-sm ${
              darkMode
                ? "bg-slate-500 border-slate-400"
                : "bg-slate-600 border-slate-700"
            }`}
          />

          <span>Present</span>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`w-4 h-4 border rounded-sm ${
              darkMode
                ? "bg-slate-800 border-slate-700"
                : "bg-slate-100 border-slate-300"
            }`}
          />

          <span>Absent / No record</span>
        </div>

        <span className="ml-auto">
          Click an attendance cell to toggle status.
        </span>
      </div>

      {/* =========================================
          ATTENDANCE TABLE
      ========================================= */}

      <section className={`border rounded-xl overflow-hidden ${cardClass}`}>
        {/* HORIZONTAL SCROLL CONTAINER */}

        <div className="overflow-x-auto">
          <div className="min-w-[850px]">
            {/* TABLE HEADER */}

            <div
              className={`grid grid-cols-[160px_repeat(7,minmax(85px,1fr))] border-b ${tableHeaderClass}`}
            >
              {/* INTERN HEADER */}

              <div className="px-4 py-4 border-r">
                <h2 className={`text-sm font-bold ${pageText}`}>
                  Intern Attendance
                </h2>

                <p className={`text-[9px] mt-1 ${mutedText}`}>
                  {filteredInterns.length}{" "}
                  {filteredInterns.length === 1 ? "intern" : "interns"}
                </p>
              </div>

              {/* DAYS */}

              {DAYS.map((day) => (
                <div
                  key={day}
                  className={`px-2 py-3 text-center border-r last:border-r-0 ${
                    darkMode ? "border-slate-700" : "border-slate-200"
                  }`}
                >
                  <div className={`text-xs font-bold ${pageText}`}>{day}</div>

                  <div className={`text-[9px] mt-1 ${mutedText}`}>8:00</div>
                </div>
              ))}
            </div>

            {/* =========================================
                INTERN ROWS
            ========================================= */}

            {filteredInterns.length > 0 ? (
              filteredInterns.map((intern) => (
                <div
                  key={intern.id}
                  className={`grid grid-cols-[160px_repeat(7,minmax(85px,1fr))] border-b last:border-b-0 ${
                    darkMode ? "border-slate-700" : "border-slate-200"
                  }`}
                >
                  {/* INTERN NAME */}

                  <div
                    className={`p-4 border-r flex flex-col justify-center ${
                      darkMode ? "border-slate-700" : "border-slate-200"
                    }`}
                  >
                    <p className={`text-xs font-bold ${pageText}`}>
                      {intern.name}
                    </p>

                    <p className={`text-[9px] mt-2 ${mutedText}`}>
                      {getPresentCount(intern)}/7 days present
                    </p>
                  </div>

                  {/* ATTENDANCE CELLS */}

                  {DAYS.map((day) => {
                    const attendance = intern.attendance[day];

                    const isPresent = attendance?.present;

                    const isWeekend = day === "Sat" || day === "Sun";

                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => handleToggleAttendance(intern.id, day)}
                        title={
                          isPresent
                            ? `${intern.name} - ${day}: Present at ${attendance.time}`
                            : `${intern.name} - ${day}: No attendance record`
                        }
                        className={`min-h-[105px] p-3 border-r last:border-r-0 flex flex-col items-center justify-center transition ${
                          darkMode
                            ? "border-slate-700 hover:bg-slate-800"
                            : "border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {/* STATUS BLOCK */}

                        <span
                          className={`w-full max-w-[58px] h-5 border rounded-sm ${
                            isPresent
                              ? darkMode
                                ? "bg-slate-500 border-slate-400"
                                : "bg-slate-600 border-slate-700"
                              : isWeekend
                              ? darkMode
                                ? "bg-slate-800 border-slate-700"
                                : "bg-slate-100 border-slate-300"
                              : darkMode
                              ? "bg-slate-800 border-slate-600"
                              : "bg-slate-100 border-slate-300"
                          }`}
                        />

                        {/* TIME */}

                        <span
                          className={`text-[9px] mt-3 ${
                            isPresent ? pageText : mutedText
                          }`}
                        >
                          {isPresent ? `${attendance.time}` : "--"}
                        </span>

                        {/* STATUS LABEL */}

                        <span
                          className={`text-[8px] mt-1 ${
                            isPresent
                              ? darkMode
                                ? "text-slate-300"
                                : "text-slate-600"
                              : mutedText
                          }`}
                        >
                          {isPresent ? "Present" : "Absent"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))
            ) : (
              /* =========================================
                  EMPTY STATE
              ========================================= */

              <div className="p-12 text-center">
                <div className={`text-sm font-bold ${pageText}`}>
                  No interns found
                </div>

                <p className={`text-xs mt-1 ${mutedText}`}>
                  Try searching for a different intern.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* =========================================
          SUMMARY
      ========================================= */}

      {filteredInterns.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
          {/* TOTAL INTERNS */}

          <div className={`border rounded-xl p-4 ${cardClass}`}>
            <p className={`text-[10px] uppercase tracking-wide ${mutedText}`}>
              Assigned Interns
            </p>

            <p className={`text-xl font-black mt-1 ${pageText}`}>
              {filteredInterns.length}
            </p>
          </div>

          {/* PRESENT TODAY */}

          <div className={`border rounded-xl p-4 ${cardClass}`}>
            <p className={`text-[10px] uppercase tracking-wide ${mutedText}`}>
              Present Records
            </p>

            <p className={`text-xl font-black mt-1 ${pageText}`}>
              {filteredInterns.reduce(
                (total, intern) =>
                  total +
                  DAYS.filter((day) => intern.attendance[day]?.present).length,
                0
              )}
            </p>
          </div>

          {/* TOTAL RECORDS */}

          <div className={`border rounded-xl p-4 ${cardClass}`}>
            <p className={`text-[10px] uppercase tracking-wide ${mutedText}`}>
              Attendance Records
            </p>

            <p className={`text-xl font-black mt-1 ${pageText}`}>
              {filteredInterns.length * DAYS.length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Interns;
