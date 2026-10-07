import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import useCall from "../hooks/useCall";
import useIncomingCalls from "../hooks/useIncomingCalls";

import IncomingCallModal from "../components/calls/IncomingCallModal";
import ActiveCall from "../components/calls/ActiveCall";

const CallContext = createContext(null);

export function CallProvider({ children }) {
  const call = useCall();

  const { incomingCall: realtimeIncomingCall, clearIncomingCall } =
    useIncomingCalls();

  const [incomingCall, setIncomingCallState] = useState(null);

  // =========================================================
  // SYNC REALTIME INCOMING CALL
  // =========================================================

  useEffect(() => {
    if (!realtimeIncomingCall) {
      return;
    }

    setIncomingCallState(realtimeIncomingCall);

    call.setIncomingCall(realtimeIncomingCall);
  }, [realtimeIncomingCall, call]);

  // =========================================================
  // ACCEPT
  // =========================================================

  const handleAccept = useCallback(async () => {
    if (!incomingCall) {
      return;
    }

    try {
      await call.acceptCall(incomingCall);

      clearIncomingCall();
      setIncomingCallState(null);
    } catch (error) {
      console.error("Failed to accept incoming call:", error);
    }
  }, [incomingCall, call, clearIncomingCall]);

  // =========================================================
  // DECLINE
  // =========================================================

  const handleDecline = useCallback(async () => {
    if (!incomingCall?.id) {
      return;
    }

    try {
      await call.declineCall(incomingCall.id);

      clearIncomingCall();
      setIncomingCallState(null);
    } catch (error) {
      console.error("Failed to decline incoming call:", error);
    }
  }, [incomingCall, call, clearIncomingCall]);

  // =========================================================
  // END ACTIVE CALL
  // =========================================================

  const handleEndCall = useCallback(async () => {
    try {
      await call.endCall();
    } catch (error) {
      console.error("Failed to end call:", error);
    }
  }, [call]);

  // =========================================================
  // CONTEXT VALUE
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

      {/* =====================================================
          INCOMING CALL
      ===================================================== */}

      {!call.currentCall && incomingCall && (
        <IncomingCallModal
          call={incomingCall}
          onAccept={handleAccept}
          onDecline={handleDecline}
        />
      )}

      {/* =====================================================
          ACTIVE CALL
      ===================================================== */}

      {call.currentCall && (
        <ActiveCall
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

// ===========================================================
// HOOK
// ===========================================================

export function useCallContext() {
  const context = useContext(CallContext);

  if (!context) {
    throw new Error("useCallContext must be used inside CallProvider.");
  }

  return context;
}

export default CallProvider;
