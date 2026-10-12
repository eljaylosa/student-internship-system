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

  const setCallIncomingCall = call.setIncomingCall;

  // Keep the provider synchronized with the realtime incoming-call state.
  // Also clear stale modal state when the incoming call disappears.
  useEffect(() => {
    setIncomingCallState(realtimeIncomingCall ?? null);
    setCallIncomingCall(realtimeIncomingCall ?? null);
  }, [realtimeIncomingCall, setCallIncomingCall]);

  const handleAccept = useCallback(async () => {
    if (!incomingCall?.id) return;

    try {
      await call.acceptCall(incomingCall);

      clearIncomingCall();
      setIncomingCallState(null);
      setCallIncomingCall(null);
    } catch (error) {
      console.error("[CallProvider] Failed to accept call:", error);
    }
  }, [incomingCall, call.acceptCall, clearIncomingCall, setCallIncomingCall]);

  const handleDecline = useCallback(async () => {
    if (!incomingCall?.id) return;

    try {
      await call.declineCall(incomingCall.id);

      clearIncomingCall();
      setIncomingCallState(null);
      setCallIncomingCall(null);
    } catch (error) {
      console.error("[CallProvider] Failed to decline call:", error);
    }
  }, [incomingCall, call.declineCall, clearIncomingCall, setCallIncomingCall]);

  const handleEndCall = useCallback(async () => {
    try {
      await call.endCall();
    } catch (error) {
      console.error("[CallProvider] Failed to end call:", error);
    }
  }, [call.endCall]);

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
