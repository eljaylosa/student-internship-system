import { useCallback, useEffect, useRef, useState } from "react";
import { supabaseStudent } from "../supabaseClient";
import WebRTCService from "../services/webrtcService";
import CallSignalingService from "../services/callSignalingService";

export default function useCall() {
  const [currentCall, setCurrentCall] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);

  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  const [callStatus, setCallStatus] = useState("idle");
  const [callType, setCallType] = useState(null);

  const [isMuted, setIsMuted] = useState(false);
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);

  const [error, setError] = useState("");

  const webRTCRef = useRef(null);
  const signalingRef = useRef(null);

  const currentCallRef = useRef(null);
  const isCallerRef = useRef(false);

  const remoteDescriptionSetRef = useRef(false);
  const pendingIceCandidatesRef = useRef([]);

  const offerSentRef = useRef(false);
  const receiverReadyRef = useRef(false);

  // =========================================================
  // CLEANUP
  // =========================================================

  const cleanupCall = useCallback(async () => {
    try {
      if (signalingRef.current) {
        await signalingRef.current.disconnect();
        signalingRef.current = null;
      }
    } catch (error) {
      console.error("Failed to disconnect call signaling:", error);
    }

    if (webRTCRef.current) {
      webRTCRef.current.close();
      webRTCRef.current = null;
    }

    currentCallRef.current = null;

    setCurrentCall(null);
    setIncomingCall(null);

    setLocalStream(null);
    setRemoteStream(null);

    setCallStatus("idle");
    setCallType(null);

    setIsMuted(false);
    setIsCameraEnabled(true);

    remoteDescriptionSetRef.current = false;
    pendingIceCandidatesRef.current = [];

    offerSentRef.current = false;
    receiverReadyRef.current = false;
  }, []);

  // =========================================================
  // SEND OFFER
  // =========================================================

  const sendOffer = useCallback(async () => {
    if (!isCallerRef.current) {
      return;
    }

    if (offerSentRef.current) {
      return;
    }

    if (!receiverReadyRef.current) {
      return;
    }

    if (!webRTCRef.current) {
      return;
    }

    if (!signalingRef.current) {
      return;
    }

    try {
      const offer = await webRTCRef.current.createOffer();

      await signalingRef.current.sendOffer(offer);

      offerSentRef.current = true;

      setCallStatus("ringing");
    } catch (error) {
      console.error("Failed to create/send WebRTC offer:", error);

      setError(error?.message || "Failed to establish the call connection.");
    }
  }, []);

  // =========================================================
  // HANDLE WEBRTC SIGNALS
  // =========================================================

  const handleSignal = useCallback(
    async (signal) => {
      if (!signal) {
        return;
      }

      try {
        // -----------------------------------------------------
        // RECEIVER READY
        // -----------------------------------------------------

        if (signal.type === "ready") {
          if (!isCallerRef.current) {
            return;
          }

          receiverReadyRef.current = true;

          await sendOffer();

          return;
        }

        // -----------------------------------------------------
        // OFFER
        // -----------------------------------------------------

        if (signal.type === "offer") {
          if (isCallerRef.current) {
            return;
          }

          if (!webRTCRef.current) {
            return;
          }

          await webRTCRef.current.setRemoteDescription(signal.offer);

          remoteDescriptionSetRef.current = true;

          // ---------------------------------------------------
          // Add ICE candidates that arrived before the offer.
          // ---------------------------------------------------

          for (const candidate of pendingIceCandidatesRef.current) {
            try {
              await webRTCRef.current.addIceCandidate(candidate);
            } catch (error) {
              console.error("Failed to add queued ICE candidate:", error);
            }
          }

          pendingIceCandidatesRef.current = [];

          const answer = await webRTCRef.current.createAnswer();

          if (signalingRef.current) {
            await signalingRef.current.sendAnswer(answer);
          }

          setCallStatus("connecting");

          return;
        }

        // -----------------------------------------------------
        // ANSWER
        // -----------------------------------------------------

        if (signal.type === "answer") {
          if (!isCallerRef.current) {
            return;
          }

          if (!webRTCRef.current) {
            return;
          }

          await webRTCRef.current.setRemoteDescription(signal.answer);

          remoteDescriptionSetRef.current = true;

          for (const candidate of pendingIceCandidatesRef.current) {
            try {
              await webRTCRef.current.addIceCandidate(candidate);
            } catch (error) {
              console.error("Failed to add queued ICE candidate:", error);
            }
          }

          pendingIceCandidatesRef.current = [];

          setCallStatus("connecting");

          return;
        }

        // -----------------------------------------------------
        // ICE CANDIDATE
        // -----------------------------------------------------

        if (signal.type === "ice-candidate") {
          if (!webRTCRef.current) {
            return;
          }

          if (!remoteDescriptionSetRef.current) {
            pendingIceCandidatesRef.current.push(signal.candidate);

            return;
          }

          await webRTCRef.current.addIceCandidate(signal.candidate);

          return;
        }

        // -----------------------------------------------------
        // END
        // -----------------------------------------------------

        if (signal.type === "end") {
          await cleanupCall();
        }
      } catch (error) {
        console.error("Failed to process WebRTC signal:", error);

        setError(error?.message || "A WebRTC signaling error occurred.");
      }
    },
    [cleanupCall, sendOffer]
  );

  // =========================================================
  // SETUP WEBRTC
  // =========================================================

  const setupWebRTC = useCallback(async ({ isCaller, type }) => {
    isCallerRef.current = isCaller;

    remoteDescriptionSetRef.current = false;
    pendingIceCandidatesRef.current = [];

    const rtc = new WebRTCService({
      onRemoteStream: (stream) => {
        setRemoteStream(stream);
      },

      onIceCandidate: async (candidate) => {
        try {
          if (signalingRef.current) {
            await signalingRef.current.sendIceCandidate(candidate);
          }
        } catch (error) {
          console.error("Failed to send ICE candidate:", error);
        }
      },

      onConnectionStateChange: (state) => {
        console.log("[WebRTC] Connection state:", state);

        if (state === "connected") {
          setCallStatus("connected");
        }

        if (state === "failed") {
          setCallStatus("ended");

          setError("The call connection failed.");
        }

        if (state === "disconnected") {
          console.log("[WebRTC] Connection disconnected.");
        }

        if (state === "closed") {
          setCallStatus("ended");
        }
      },

      onTrackEnded: () => {
        console.log("[WebRTC] Remote track ended.");
      },
    });

    webRTCRef.current = rtc;

    const stream = await rtc.getLocalStream({
      audio: true,
      video: type === "video",
    });

    rtc.createPeerConnection();
    rtc.addLocalTracks();

    setLocalStream(stream);

    setIsMuted(false);

    setIsCameraEnabled(type === "video");

    return rtc;
  }, []);

  // =========================================================
  // CONNECT SIGNALING
  // =========================================================

  const connectSignaling = useCallback(
    async (callId) => {
      if (!callId) {
        throw new Error("A valid call ID is required.");
      }

      if (signalingRef.current) {
        return signalingRef.current;
      }

      const signaling = new CallSignalingService({
        callId,

        onSignal: handleSignal,

        onStatus: (status) => {
          console.log("[Call Signaling] Status:", status);
        },
      });

      signalingRef.current = signaling;

      await signaling.connect();

      return signaling;
    },
    [handleSignal]
  );

  // =========================================================
  // START CALL
  // =========================================================

  const startCall = useCallback(
    async (conversationId, type = "audio") => {
      if (!conversationId) {
        throw new Error("A valid conversation ID is required.");
      }

      if (type !== "audio" && type !== "video") {
        throw new Error("Call type must be audio or video.");
      }

      if (currentCallRef.current) {
        throw new Error("You already have an active call.");
      }

      try {
        setError("");

        setCallStatus("connecting");
        setCallType(type);

        receiverReadyRef.current = false;
        offerSentRef.current = false;

        // -----------------------------------------------------
        // Create database call.
        // -----------------------------------------------------

        const { data, error } = await supabaseStudent.rpc("create_call", {
          p_conversation_id: conversationId,

          p_call_type: type,
        });

        if (error) {
          throw error;
        }

        if (!data) {
          throw new Error("The call could not be created.");
        }

        const call = data;

        currentCallRef.current = call;

        setCurrentCall(call);

        // -----------------------------------------------------
        // Connect to signaling FIRST.
        // -----------------------------------------------------

        await connectSignaling(call.id);

        // -----------------------------------------------------
        // Setup caller WebRTC.
        // -----------------------------------------------------

        await setupWebRTC({
          isCaller: true,
          type,
        });

        // -----------------------------------------------------
        // DO NOT SEND OFFER YET.
        //
        // We wait for the receiver to send:
        //
        //     { type: "ready" }
        //
        // This prevents the offer from being lost.
        // -----------------------------------------------------

        setCallStatus("ringing");

        return call;
      } catch (error) {
        console.error("Failed to start call:", error);

        setError(error?.message || "Unable to start the call.");

        await cleanupCall();

        throw error;
      }
    },
    [cleanupCall, connectSignaling, setupWebRTC]
  );

  // =========================================================
  // ACCEPT CALL
  // =========================================================

  const acceptCall = useCallback(
    async (call) => {
      if (!call?.id) {
        throw new Error("A valid call is required.");
      }

      try {
        setError("");

        setCallStatus("connecting");

        setCallType(call.call_type);

        // -----------------------------------------------------
        // Accept call in database.
        // -----------------------------------------------------

        const { data, error } = await supabaseStudent.rpc("accept_call", {
          p_call_id: call.id,
        });

        if (error) {
          throw error;
        }

        if (!data) {
          throw new Error("The call could not be accepted.");
        }

        currentCallRef.current = data;

        setCurrentCall(data);

        setIncomingCall(null);

        // -----------------------------------------------------
        // Connect signaling BEFORE sending ready.
        // -----------------------------------------------------

        await connectSignaling(call.id);

        // -----------------------------------------------------
        // Setup receiver WebRTC.
        // -----------------------------------------------------

        await setupWebRTC({
          isCaller: false,
          type: call.call_type,
        });

        // -----------------------------------------------------
        // Tell caller we're ready.
        // -----------------------------------------------------

        if (signalingRef.current) {
          await signalingRef.current.sendReady();
        }

        return data;
      } catch (error) {
        console.error("Failed to accept call:", error);

        setError(error?.message || "Unable to accept the call.");

        await cleanupCall();

        throw error;
      }
    },
    [cleanupCall, connectSignaling, setupWebRTC]
  );

  // =========================================================
  // DECLINE CALL
  // =========================================================

  const declineCall = useCallback(async (callId) => {
    if (!callId) {
      return;
    }

    try {
      setError("");

      const { error } = await supabaseStudent.rpc("decline_call", {
        p_call_id: callId,
      });

      if (error) {
        throw error;
      }

      setIncomingCall(null);
    } catch (error) {
      console.error("Failed to decline call:", error);

      setError(error?.message || "Unable to decline the call.");

      throw error;
    }
  }, []);

  // =========================================================
  // CANCEL CALL
  // =========================================================

  const cancelCall = useCallback(
    async (callId) => {
      const targetCallId = callId || currentCallRef.current?.id;

      if (!targetCallId) {
        return;
      }

      try {
        setError("");

        // -----------------------------------------------------
        // Tell the other participant first.
        // -----------------------------------------------------

        if (signalingRef.current) {
          try {
            await signalingRef.current.sendEnd();
          } catch (error) {
            console.error("Failed to send call end signal:", error);
          }
        }

        const { error } = await supabaseStudent.rpc("cancel_call", {
          p_call_id: targetCallId,
        });

        if (error) {
          throw error;
        }

        await cleanupCall();
      } catch (error) {
        console.error("Failed to cancel call:", error);

        setError(error?.message || "Unable to cancel the call.");

        throw error;
      }
    },
    [cleanupCall]
  );

  // =========================================================
  // END CALL
  // =========================================================

  const endCall = useCallback(
    async (callId) => {
      const targetCallId = callId || currentCallRef.current?.id;

      if (!targetCallId) {
        return;
      }

      try {
        setError("");

        // -----------------------------------------------------
        // Signal the other participant before cleanup.
        // -----------------------------------------------------

        if (signalingRef.current) {
          try {
            await signalingRef.current.sendEnd();
          } catch (error) {
            console.error("Failed to send call end signal:", error);
          }
        }

        const { error } = await supabaseStudent.rpc("end_call", {
          p_call_id: targetCallId,
        });

        if (error) {
          throw error;
        }

        await cleanupCall();
      } catch (error) {
        console.error("Failed to end call:", error);

        setError(error?.message || "Unable to end the call.");

        throw error;
      }
    },
    [cleanupCall]
  );

  // =========================================================
  // TOGGLE MUTE
  // =========================================================

  const toggleMute = useCallback(() => {
    if (!webRTCRef.current) {
      return;
    }

    const enabled = webRTCRef.current.toggleAudio();

    setIsMuted(!enabled);
  }, []);

  // =========================================================
  // TOGGLE CAMERA
  // =========================================================

  const toggleCamera = useCallback(() => {
    if (!webRTCRef.current) {
      return;
    }

    const enabled = webRTCRef.current.toggleVideo();

    setIsCameraEnabled(enabled);
  }, []);

  // =========================================================
  // SET INCOMING CALL
  // =========================================================

  const updateIncomingCall = useCallback((call) => {
    setIncomingCall(call);
  }, []);

  // =========================================================
  // UNMOUNT CLEANUP
  // =========================================================

  useEffect(() => {
    return () => {
      if (signalingRef.current) {
        signalingRef.current.disconnect();
        signalingRef.current = null;
      }

      if (webRTCRef.current) {
        webRTCRef.current.close();
        webRTCRef.current = null;
      }
    };
  }, []);

  // =========================================================
  // RETURN
  // =========================================================

  return {
    currentCall,
    incomingCall,

    localStream,
    remoteStream,

    callStatus,
    callType,

    isMuted,
    isCameraEnabled,

    error,

    startCall,
    acceptCall,
    declineCall,
    cancelCall,
    endCall,

    toggleMute,
    toggleCamera,

    setIncomingCall: updateIncomingCall,

    cleanupCall,
  };
}
