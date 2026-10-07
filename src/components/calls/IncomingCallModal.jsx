import React from "react";

export default function IncomingCallModal({
  call,
  onAccept,
  onDecline,
  accepting = false,
}) {
  if (!call) {
    return null;
  }

  const isVideoCall = call.call_type === "video";

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm overflow-hidden rounded-3xl border border-white/10 bg-white shadow-2xl dark:bg-slate-900">
        {/* =================================================
            HEADER
        ================================================= */}

        <div className="flex flex-col items-center px-6 pb-6 pt-8">
          <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-3xl font-bold text-white shadow-lg">
            ?
          </div>

          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Incoming {isVideoCall ? "video" : "audio"} call
          </p>

          <h2 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
            Incoming Call
          </h2>

          <p className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">
            Someone is calling you
          </p>
        </div>

        {/* =================================================
            ACTIONS
        ================================================= */}

        <div className="flex gap-3 border-t border-slate-200 p-5 dark:border-slate-800">
          <button
            type="button"
            onClick={onDecline}
            disabled={accepting}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-red-500 px-4 py-3 font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span>✕</span>
            Decline
          </button>

          <button
            type="button"
            onClick={onAccept}
            disabled={accepting}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span>
              {accepting ? "..." : isVideoCall ? "🎥" : "📞"}
            </span>

            {accepting ? "Connecting..." : "Accept"}
          </button>
        </div>
      </div>
    </div>
  );
}