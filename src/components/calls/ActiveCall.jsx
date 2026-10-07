import React, { useEffect, useRef } from "react";

export default function ActiveCall({
  callType,
  localStream,
  remoteStream,
  callStatus,
  isMuted,
  isCameraEnabled,
  onToggleMute,
  onToggleCamera,
  onEndCall,
}) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const isVideoCall = callType === "video";

  // =========================================================
  // LOCAL VIDEO
  // =========================================================

  useEffect(() => {
    if (!localVideoRef.current) {
      return;
    }

    localVideoRef.current.srcObject = localStream || null;
  }, [localStream]);

  // =========================================================
  // REMOTE VIDEO
  // =========================================================

  useEffect(() => {
    if (!remoteVideoRef.current) {
      return;
    }

    remoteVideoRef.current.srcObject = remoteStream || null;
  }, [remoteStream]);

  // =========================================================
  // AUDIO CALL
  // =========================================================

  if (!isVideoCall) {
    return (
      <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-slate-950 p-6 text-white">
        <div className="flex w-full max-w-md flex-col items-center">
          {/* Avatar */}

          <div className="flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-5xl font-bold shadow-2xl">
            ?
          </div>

          <h2 className="mt-6 text-2xl font-bold">Voice Call</h2>

          <p className="mt-2 text-sm text-slate-400">
            {callStatus === "connected"
              ? "Connected"
              : callStatus === "connecting"
              ? "Connecting..."
              : "Calling..."}
          </p>

          {/* Controls */}

          <div className="mt-12 flex items-center gap-5">
            <button
              type="button"
              onClick={onToggleMute}
              className={`flex h-14 w-14 items-center justify-center rounded-full transition ${
                isMuted
                  ? "bg-white text-slate-900"
                  : "bg-slate-800 text-white hover:bg-slate-700"
              }`}
              title={isMuted ? "Unmute microphone" : "Mute microphone"}
            >
              {isMuted ? "🔇" : "🎤"}
            </button>

            <button
              type="button"
              onClick={onEndCall}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 text-2xl text-white shadow-lg transition hover:bg-red-600"
              title="End call"
            >
              📞
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // VIDEO CALL
  // =========================================================

  return (
    <div className="fixed inset-0 z-[9998] overflow-hidden bg-black text-white">
      {/* =====================================================
          REMOTE VIDEO
      ===================================================== */}

      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className="h-full w-full object-cover"
      />

      {/* =====================================================
          FALLBACK WHEN REMOTE VIDEO IS NOT READY
      ===================================================== */}

      {!remoteStream && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-4xl font-bold">
              ?
            </div>

            <p className="mt-5 text-lg font-semibold">
              {callStatus === "connected"
                ? "Waiting for video..."
                : "Connecting..."}
            </p>
          </div>
        </div>
      )}

      {/* =====================================================
          LOCAL VIDEO
      ===================================================== */}

      <div className="absolute right-4 top-4 h-40 w-28 overflow-hidden rounded-2xl border border-white/20 bg-slate-900 shadow-xl sm:h-48 sm:w-36">
        <video
          ref={localVideoRef}
          autoPlay
          muted
          playsInline
          className={`h-full w-full object-cover ${
            isCameraEnabled ? "" : "hidden"
          }`}
        />

        {!isCameraEnabled && (
          <div className="flex h-full items-center justify-center text-xs text-slate-400">
            Camera off
          </div>
        )}
      </div>

      {/* =====================================================
          STATUS
      ===================================================== */}

      <div className="absolute left-4 top-4 rounded-full bg-black/50 px-4 py-2 text-sm backdrop-blur-md">
        {callStatus === "connected" ? "Connected" : "Connecting..."}
      </div>

      {/* =====================================================
          CONTROLS
      ===================================================== */}

      <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 items-center gap-4 rounded-full bg-black/60 px-5 py-4 backdrop-blur-md">
        <button
          type="button"
          onClick={onToggleMute}
          className={`flex h-12 w-12 items-center justify-center rounded-full transition ${
            isMuted
              ? "bg-white text-slate-900"
              : "bg-slate-800 text-white hover:bg-slate-700"
          }`}
          title={isMuted ? "Unmute microphone" : "Mute microphone"}
        >
          {isMuted ? "🔇" : "🎤"}
        </button>

        <button
          type="button"
          onClick={onToggleCamera}
          className={`flex h-12 w-12 items-center justify-center rounded-full transition ${
            !isCameraEnabled
              ? "bg-white text-slate-900"
              : "bg-slate-800 text-white hover:bg-slate-700"
          }`}
          title={isCameraEnabled ? "Turn camera off" : "Turn camera on"}
        >
          {isCameraEnabled ? "📹" : "📷"}
        </button>

        <button
          type="button"
          onClick={onEndCall}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-xl text-white shadow-lg transition hover:bg-red-600"
          title="End call"
        >
          📞
        </button>
      </div>
    </div>
  );
}
