import React, { useState } from "react";

export default function IncomingCallModal({
  call,
  onAccept,
  onDecline,
  accepting = false,
}) {
  const [processing, setProcessing] = useState(false);

  if (!call) {
    return null;
  }

  const isVideoCall = call.call_type === "video";
  const isBusy = accepting || processing;

  const callerName =
    call.caller_name ||
    call.caller?.full_name ||
    call.caller?.name ||
    "Someone";

  const initials = callerName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  const handleAction = async (action) => {
    if (isBusy) {
      return;
    }

    setProcessing(true);

    try {
      await action?.();
    } catch (error) {
      console.error("[IncomingCallModal] Call action failed:", error);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="incoming-call-title"
      aria-describedby="incoming-call-description"
    >
      <div className="w-full max-w-sm overflow-hidden rounded-3xl border border-white/10 bg-white shadow-2xl dark:bg-slate-900">
        {/* CALLER */}

        <div className="flex flex-col items-center px-6 pb-6 pt-8">
          <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-2xl font-bold text-white shadow-lg">
            {initials || "?"}
          </div>

          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Incoming {isVideoCall ? "video" : "audio"} call
          </p>

          <h2
            id="incoming-call-title"
            className="mt-1 text-xl font-bold text-slate-900 dark:text-white"
          >
            {callerName}
          </h2>

          <p
            id="incoming-call-description"
            className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400"
          >
            {isBusy
              ? isVideoCall
                ? "Connecting your video call..."
                : "Connecting your audio call..."
              : "Would you like to answer?"}
          </p>
        </div>

        {/* ACTIONS */}

        <div className="flex gap-3 border-t border-slate-200 p-5 dark:border-slate-800">
          <button
            type="button"
            onClick={() => handleAction(onDecline)}
            disabled={isBusy}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-red-500 px-4 py-3 font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span aria-hidden="true">✕</span>
            Decline
          </button>

          <button
            type="button"
            onClick={() => handleAction(onAccept)}
            disabled={isBusy}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span aria-hidden="true">
              {isBusy ? "…" : isVideoCall ? "🎥" : "📞"}
            </span>
            {isBusy ? "Connecting..." : "Accept"}
          </button>
        </div>
      </div>
    </div>
  );
}
