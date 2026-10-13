import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import useCall from "../hooks/useCall";
import useIncomingCalls from "../hooks/useIncomingCalls";

import IncomingCallModal from "../components/calls/IncomingCallModal";
import ActiveCall from "../components/calls/ActiveCall";
import ringtoneUrl from "../assets/ringtones/ringtone.mp3";

const CallContext = createContext(null);

const RINGTONE_PATH = ringtoneUrl;
const RINGTONE_VOLUME = 0.7;

export function CallProvider({ children }) {
  const call = useCall();

  const { incomingCall: realtimeIncomingCall, clearIncomingCall } =
    useIncomingCalls();

  const [incomingCall, setIncomingCallState] = useState(null);

  const incomingCallRef = useRef(null);
  const ringtoneRef = useRef(null);
  const ringtoneUnlockedRef = useRef(false);

  const setCallIncomingCall = call.setIncomingCall;

  // =========================================================
  // SYNCHRONIZE INCOMING CALL STATE
  // =========================================================

  useEffect(() => {
    const nextCall = realtimeIncomingCall ?? null;

    incomingCallRef.current = nextCall;
    setIncomingCallState(nextCall);
    setCallIncomingCall(nextCall);
  }, [realtimeIncomingCall, setCallIncomingCall]);

  // =========================================================
  // INITIALIZE CUSTOM RINGTONE
  // =========================================================

  useEffect(() => {
    const audio = new Audio(RINGTONE_PATH);

    audio.loop = true;
    audio.volume = RINGTONE_VOLUME;
    audio.preload = "auto";

    ringtoneRef.current = audio;

    const unlockAudio = async () => {
      try {
        // Browsers may require a user gesture before audio playback.
        await audio.play();
        audio.pause();
        audio.currentTime = 0;

        ringtoneUnlockedRef.current = true;

        // If a call arrived before audio was unlocked, start ringing now.
        if (incomingCallRef.current) {
          try {
            await audio.play();
          } catch (error) {
            console.warn(
              "[CallProvider] Could not start the incoming ringtone:",
              error
            );
          }
        }
      } catch (error) {
        // Autoplay can be blocked before the user interacts with the page.
        console.debug(
          "[CallProvider] Ringtone audio is waiting for user interaction.",
          error?.message || error
        );
      }
    };

    document.addEventListener("pointerdown", unlockAudio);
    document.addEventListener("keydown", unlockAudio);

    return () => {
      document.removeEventListener("pointerdown", unlockAudio);
      document.removeEventListener("keydown", unlockAudio);

      audio.pause();
      audio.currentTime = 0;

      if (ringtoneRef.current === audio) {
        ringtoneRef.current = null;
      }
    };
  }, []);

  // =========================================================
  // START / STOP RINGTONE
  // =========================================================

  const stopRingtone = useCallback(() => {
    const audio = ringtoneRef.current;

    if (!audio) return;

    audio.pause();

    try {
      audio.currentTime = 0;
    } catch {
      // Ignore reset errors if the audio metadata has not loaded.
    }
  }, []);

  const startRingtone = useCallback(async () => {
    const audio = ringtoneRef.current;

    if (!audio || !incomingCallRef.current) return;

    try {
      // Avoid restarting an already-playing ringtone.
      if (!audio.paused) return;

      await audio.play();
      ringtoneUnlockedRef.current = true;
    } catch (error) {
      console.warn(
        "[CallProvider] Ringtone playback failed:",
        error?.message || error
      );
    }
  }, []);

  // Ring only while an incoming call is waiting to be answered.
  useEffect(() => {
    if (incomingCall && !call.currentCall) {
      void startRingtone();
    } else {
      stopRingtone();
    }
  }, [incomingCall?.id, call.currentCall?.id, startRingtone, stopRingtone]);

  // =========================================================
  // ACCEPT / DECLINE / END
  // =========================================================

  const handleAccept = useCallback(async () => {
    if (!incomingCall?.id) return;

    stopRingtone();

    try {
      await call.acceptCall(incomingCall);

      clearIncomingCall();
      incomingCallRef.current = null;
      setIncomingCallState(null);
      setCallIncomingCall(null);
    } catch (error) {
      console.error("[CallProvider] Failed to accept call:", error);

      // If accepting failed and the incoming call still exists,
      // allow the ringtone effect to start it again.
      if (incomingCallRef.current?.id === incomingCall.id) {
        void startRingtone();
      }
    }
  }, [
    incomingCall,
    call.acceptCall,
    clearIncomingCall,
    setCallIncomingCall,
    startRingtone,
    stopRingtone,
  ]);

  const handleDecline = useCallback(async () => {
    if (!incomingCall?.id) return;

    stopRingtone();

    try {
      await call.declineCall(incomingCall.id);

      clearIncomingCall();
      incomingCallRef.current = null;
      setIncomingCallState(null);
      setCallIncomingCall(null);
    } catch (error) {
      console.error("[CallProvider] Failed to decline call:", error);

      if (incomingCallRef.current?.id === incomingCall.id) {
        void startRingtone();
      }
    }
  }, [
    incomingCall,
    call.declineCall,
    clearIncomingCall,
    setCallIncomingCall,
    startRingtone,
    stopRingtone,
  ]);

  const handleEndCall = useCallback(async () => {
    try {
      await call.endCall();
    } catch (error) {
      console.error("[CallProvider] Failed to end call:", error);
    } finally {
      stopRingtone();
    }
  }, [call.endCall, stopRingtone]);

  // =========================================================
  // CONTEXT
  // =========================================================

  const value = {
    ...call,
    incomingCall,
    acceptIncomingCall: handleAccept,
    declineIncomingCall: handleDecline,
  };

  return (
    <CallContext.Provider value={value}>
      {children}

      {!call.currentCall && incomingCall && (
        <IncomingCallModal
          call={incomingCall}
          onAccept={handleAccept}
          onDecline={handleDecline}
        />
      )}

      {call.currentCall && (
        <ActiveCall
          call={call.currentCall}
          callContact={call.callContact}
          callType={call.callType}
          localStream={call.localStream}
          remoteStream={call.remoteStream}
          callStatus={call.callStatus}
          isMuted={call.isMuted}
          isCameraEnabled={call.isCameraEnabled}
          onToggleMute={call.toggleMute}
          onToggleCamera={call.toggleCamera}
          onEndCall={handleEndCall}
        />
      )}
    </CallContext.Provider>
  );
}

export function useCallContext() {
  const context = useContext(CallContext);

  if (!context) {
    throw new Error("useCallContext must be used within a CallProvider");
  }

  return context;
}

export default CallProvider;
