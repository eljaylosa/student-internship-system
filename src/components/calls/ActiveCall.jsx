import React, { useEffect, useRef, useState } from "react";

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
  const remoteAudioRef = useRef(null);
  const endingRef = useRef(false);

  const [ending, setEnding] = useState(false);
  const [mediaError, setMediaError] = useState("");

  const isVideoCall = callType === "video";

  const statusText =
    {
      idle: "Call ended",
      connecting: "Connecting...",
      ringing: "Calling...",
      connected: "Connected",
      ended: "Call ended",
      failed: "Connection failed",
    }[callStatus] || "Connecting...";

  const remoteHasVideo = Boolean(
    remoteStream?.getVideoTracks().some((track) => track.readyState === "live")
  );

  // =========================================================
  // LOCAL VIDEO
  // =========================================================

  useEffect(() => {
    const video = localVideoRef.current;

    if (!video) return;

    video.srcObject = localStream || null;

    if (localStream) {
      video.play().catch((error) => {
        console.warn("[ActiveCall] Local video playback:", error);
      });
    }

    return () => {
      if (video.srcObject === localStream) {
        video.srcObject = null;
      }
    };
  }, [localStream, isVideoCall]);

  // =========================================================
  // REMOTE VIDEO
  // =========================================================

  useEffect(() => {
    const video = remoteVideoRef.current;

    if (!video) return;

    video.srcObject = remoteStream || null;

    if (remoteStream) {
      video.play().catch((error) => {
        console.warn("[ActiveCall] Remote video playback:", error);
        setMediaError(
          "Media playback was blocked. Check your browser's playback settings."
        );
      });
    }

    return () => {
      if (video.srcObject === remoteStream) {
        video.srcObject = null;
      }
    };
  }, [remoteStream, isVideoCall]);

  // =========================================================
  // REMOTE AUDIO
  // =========================================================

  useEffect(() => {
    const audio = remoteAudioRef.current;

    if (!audio) return;

    audio.srcObject = remoteStream || null;

    if (remoteStream) {
      audio.play().catch((error) => {
        console.warn("[ActiveCall] Remote audio playback:", error);
        setMediaError(
          "Audio playback was blocked. Interact with the page and try again."
        );
      });
    }

    return () => {
      if (audio.srcObject === remoteStream) {
        audio.srcObject = null;
      }
    };
  }, [remoteStream]);

  // =========================================================
  // RESET ENDING STATE FOR A NEW CALL
  // =========================================================

  useEffect(() => {
    endingRef.current = false;
    setEnding(false);
    setMediaError("");
  }, [callType]);

  // =========================================================
  // END CALL
  // =========================================================

  const handleEndCall = async () => {
    if (endingRef.current) return;

    endingRef.current = true;
    setEnding(true);

    try {
      await onEndCall?.();
    } catch (error) {
      console.error("[ActiveCall] Failed to end call:", error);
      endingRef.current = false;
      setEnding(false);
    }
  };

  const handleToggleMute = () => {
    setMediaError("");
    onToggleMute?.();
  };

  const handleToggleCamera = () => {
    setMediaError("");
    onToggleCamera?.();
  };

  // =========================================================
  // AUDIO CALL
  // =========================================================

  if (!isVideoCall) {
    return (
      <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-slate-950 p-6 text-white">
        <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />

        <div className="flex w-full max-w-md flex-col items-center">
          <div className="flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-5xl font-bold shadow-2xl">
            ?
          </div>

          <h2 className="mt-6 text-2xl font-bold">Voice Call</h2>

          <p className="mt-2 text-sm text-slate-400" aria-live="polite">
            {statusText}
          </p>

          {mediaError && (
            <p className="mt-3 max-w-sm text-center text-sm text-amber-300">
              {mediaError}
            </p>
          )}

          <div className="mt-12 flex items-center gap-5">
            <button
              type="button"
              onClick={handleToggleMute}
              disabled={ending}
              className={`flex h-14 w-14 items-center justify-center rounded-full transition disabled:opacity-50 ${
                isMuted
                  ? "bg-white text-slate-900"
                  : "bg-slate-800 text-white hover:bg-slate-700"
              }`}
              title={isMuted ? "Unmute microphone" : "Mute microphone"}
              aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
            >
              {isMuted ? "🔇" : "🎤"}
            </button>

            <button
              type="button"
              onClick={handleEndCall}
              disabled={ending}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 text-2xl text-white shadow-lg transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
              title="End call"
              aria-label="End call"
            >
              {ending ? "…" : "📞"}
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
      <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />

      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className={`h-full w-full object-cover ${
          remoteHasVideo ? "" : "hidden"
        }`}
      />

      {!remoteHasVideo && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-4xl font-bold">
              ?
            </div>

            <p className="mt-5 text-lg font-semibold" aria-live="polite">
              {callStatus === "connected"
                ? "Waiting for the other person's video..."
                : statusText}
            </p>
          </div>
        </div>
      )}

      {/* LOCAL VIDEO */}

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

      {/* STATUS */}

      <div className="absolute left-4 top-4 rounded-full bg-black/50 px-4 py-2 text-sm backdrop-blur-md">
        {statusText}
      </div>

      {mediaError && (
        <div className="absolute left-4 right-4 top-16 rounded-xl bg-amber-950/90 p-3 text-sm text-amber-100 sm:left-auto sm:right-4 sm:max-w-sm">
          {mediaError}
        </div>
      )}

      {/* CONTROLS */}

      <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 items-center gap-4 rounded-full bg-black/60 px-5 py-4 backdrop-blur-md">
        <button
          type="button"
          onClick={handleToggleMute}
          disabled={ending}
          className={`flex h-12 w-12 items-center justify-center rounded-full transition disabled:opacity-50 ${
            isMuted
              ? "bg-white text-slate-900"
              : "bg-slate-800 text-white hover:bg-slate-700"
          }`}
          title={isMuted ? "Unmute microphone" : "Mute microphone"}
          aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
        >
          {isMuted ? "🔇" : "🎤"}
        </button>

        <button
          type="button"
          onClick={handleToggleCamera}
          disabled={ending}
          className={`flex h-12 w-12 items-center justify-center rounded-full transition disabled:opacity-50 ${
            !isCameraEnabled
              ? "bg-white text-slate-900"
              : "bg-slate-800 text-white hover:bg-slate-700"
          }`}
          title={isCameraEnabled ? "Turn camera off" : "Turn camera on"}
          aria-label={isCameraEnabled ? "Turn camera off" : "Turn camera on"}
        >
          {isCameraEnabled ? "📹" : "📷"}
        </button>

        <button
          type="button"
          onClick={handleEndCall}
          disabled={ending}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-xl text-white shadow-lg transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
          title="End call"
          aria-label="End call"
        >
          {ending ? "…" : "📞"}
        </button>
      </div>
    </div>
  );
}
