import React, { useEffect, useRef, useState } from "react";

function getRecipientInfo(call, callContact) {
  // Prefer the separately stored contact so database updates
  // cannot accidentally replace the displayed recipient.
  const recipient =
    callContact ||
    call?.recipient ||
    call?.otherUser ||
    call?.contact ||
    call?.recipientDetails ||
    call ||
    {};

  const fullName = [
    recipient.first_name,
    recipient.middle_name,
    recipient.last_name,
  ]
    .filter(Boolean)
    .join(" ");

  const name =
    recipient.name ||
    recipient.company_name ||
    recipient.companyName ||
    recipient.full_name ||
    recipient.fullName ||
    fullName ||
    recipient.caller_name ||
    recipient.callerName ||
    "Contact";

  const role =
    recipient.role ||
    recipient.user_role ||
    recipient.roleValue ||
    recipient.contactType ||
    recipient.contact_type ||
    "";

  const roleLabel =
    role === "company" ? "Company Supervisor" : role.replace(/_/g, " ");

  const photoUrl =
    recipient.profilePhotoUrl ||
    recipient.profile_photo_url ||
    recipient.caller_photo_url ||
    recipient.callerPhotoUrl ||
    recipient.companyLogoUrl ||
    recipient.company_logo_url ||
    recipient.logoUrl ||
    recipient.logo_url ||
    recipient.photoUrl ||
    recipient.photo_url ||
    recipient.avatarUrl ||
    recipient.avatar_url ||
    recipient.image_url ||
    null;

  const initials =
    name === "Contact"
      ? "?"
      : name
          .trim()
          .split(/\s+/)
          .slice(0, 2)
          .map((part) => part[0])
          .join("")
          .toUpperCase();

  return {
    name,
    roleLabel,
    photoUrl,
    initials,
  };
}

function RecipientAvatar({ recipient, size = "large" }) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [recipient.photoUrl]);

  const sizeClass =
    size === "small" ? "h-12 w-12 text-base" : "h-32 w-32 text-4xl";

  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 font-bold text-white shadow-2xl ${sizeClass}`}
    >
      {recipient.photoUrl && !imageFailed ? (
        <img
          src={recipient.photoUrl}
          alt={recipient.name}
          className="h-full w-full object-cover"
          onError={() => {
            console.warn(
              "[ActiveCall] Recipient image failed to load:",
              recipient.photoUrl
            );
            setImageFailed(true);
          }}
        />
      ) : (
        recipient.initials
      )}
    </div>
  );
}

export default function ActiveCall({
  call,
  callContact,
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

  const recipient = getRecipientInfo(call, callContact);

  const statusText =
    {
      idle: "Call ended",
      connecting: "Connecting...",
      ringing: `Calling ${recipient.name}...`,
      connected: "Connected",
      accepted: "Connecting...",
      ended: "Call ended",
      declined: "Call declined",
      cancelled: "Call cancelled",
      missed: "Missed call",
      failed: "Connection failed",
    }[callStatus] || "Connecting...";

  const remoteHasVideo = Boolean(
    remoteStream?.getVideoTracks().some((track) => track.readyState === "live")
  );

  // Attach local video.
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

  // Attach remote video.
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

  // Attach remote audio.
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

  useEffect(() => {
    endingRef.current = false;
    setEnding(false);
    setMediaError("");
  }, [call?.id, callType]);

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

  const recipientDetails = (
    <div className="flex flex-col items-center">
      <RecipientAvatar recipient={recipient} />

      <h2 className="mt-5 max-w-full break-words text-center text-2xl font-bold">
        {recipient.name}
      </h2>

      {recipient.roleLabel && (
        <p className="mt-1 text-sm text-slate-400">{recipient.roleLabel}</p>
      )}

      <p className="mt-2 text-sm text-slate-300" aria-live="polite">
        {statusText}
      </p>
    </div>
  );

  // AUDIO CALL
  if (!isVideoCall) {
    return (
      <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-slate-950 p-6 text-white">
        <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />

        <div className="flex w-full max-w-md flex-col items-center">
          {recipientDetails}

          {mediaError && (
            <p className="mt-4 max-w-sm text-center text-sm text-amber-300">
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

  // VIDEO CALL
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
          <div className="flex flex-col items-center">
            <RecipientAvatar recipient={recipient} />

            <h2 className="mt-5 max-w-[80vw] break-words text-center text-xl font-bold">
              {recipient.name}
            </h2>

            {recipient.roleLabel && (
              <p className="mt-1 text-sm text-slate-300">
                {recipient.roleLabel}
              </p>
            )}

            <p className="mt-2 text-sm text-slate-400" aria-live="polite">
              {callStatus === "connected"
                ? "Waiting for their video..."
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

      {/* CALL STATUS AND RECIPIENT */}
      <div className="absolute left-4 top-4 flex max-w-[calc(100%-9rem)] items-center gap-3 rounded-2xl bg-black/60 p-3 backdrop-blur-md">
        <RecipientAvatar recipient={recipient} size="small" />

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{recipient.name}</p>
          <p className="text-xs text-slate-300">{statusText}</p>
        </div>
      </div>

      {mediaError && (
        <div className="absolute left-4 right-4 top-24 rounded-xl bg-amber-950/90 p-3 text-sm text-amber-100 sm:left-auto sm:right-4 sm:max-w-sm">
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
