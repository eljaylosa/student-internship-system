import React from "react";

const MaintenancePage = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
      <div className="w-full max-w-lg text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-8 w-8 text-red-400"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.42 3.93 4.31 16.3a1.5 1.5 0 0 0 1.3 2.25h12.78a1.5 1.5 0 0 0 1.3-2.25L12.58 3.93a.67.67 0 0 0-1.16 0Z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.5" />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 15.5h.01"
            />
          </svg>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          System Under Maintenance
        </h1>

        <p className="mt-4 text-sm leading-7 text-slate-400">
          The system is currently under maintenance. Please try again later.
        </p>

        <div className="mt-8 rounded-lg border border-slate-800 bg-slate-900 px-5 py-4">
          <p className="text-xs text-slate-500">
            We are performing system maintenance to improve the service.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MaintenancePage;
