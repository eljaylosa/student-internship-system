import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import getPortalSupabaseClient from "../services/getPortalSupabaseClient";
import WebRTCService from "../services/webrtcService";
import CallSignalingService from "../services/callSignalingService";

const TERMINAL_CALL_STATUSES = new Set([
  "declined",
  "cancelled",
  "ended",
  "missed",
]);

const ACTIVE_CALL_STATUSES = new Set(["ringing", "accepted"]);
const HEARTBEAT_INTERVAL_MS = 15_000;

export default function useCall() {
  const location = useLocation();

  const portalClient = useMemo(
    () => getPortalSupabaseClient(location.pathname),
    [location.pathname]
  );

  const [currentCall, setCurrentCall] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callStatus, setCallStatus] = useState("idle");
  const [callType, setCallType] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);
  const [error, setError] = useState("");
  const [callContact, setCallContact] = useState(null);

  const webRTCRef = useRef(null);
  const signalingRef = useRef(null);
  const callStatusChannelRef = useRef(null);

  const currentCallRef = useRef(null);
  const currentCallStatusRef = useRef(null);
  const activeClientRef = useRef(null);
  const isCallerRef = useRef(false);

  const remoteDescriptionSetRef = useRef(false);
  const pendingIceCandidatesRef = useRef([]);
  const offerSentRef = useRef(false);
  const receiverReadyRef = useRef(false);

  const startingCallRef = useRef(false);
  const acceptingCallRef = useRef(false);
  const cleaningUpRef = useRef(false);
  const mountedRef = useRef(true);

  const getActiveClient = useCallback(
    () => activeClientRef.current || portalClient,
    [portalClient]
  );

  // =========================================================
  // CLEANUP LOCAL CALL RESOURCES
  // =========================================================

  const cleanupCall = useCallback(async () => {
    if (cleaningUpRef.current) return;

    cleaningUpRef.current = true;

    const client = getActiveClient();

    try {
      const statusChannel = callStatusChannelRef.current;
      callStatusChannelRef.current = null;

      if (statusChannel) {
        try {
          await client.removeChannel(statusChannel);
        } catch (cleanupError) {
          console.error(
            "[Call] Failed to remove call-status channel:",
            cleanupError
          );
        }
      }

      const signaling = signalingRef.current;
      signalingRef.current = null;

      if (signaling) {
        try {
          await signaling.disconnect();
        } catch (cleanupError) {
          console.error("[Call] Failed to disconnect signaling:", cleanupError);
        }
      }

      const rtc = webRTCRef.current;
      webRTCRef.current = null;

      if (rtc) {
        try {
          rtc.close();
        } catch (cleanupError) {
          console.error("[Call] Failed to close WebRTC:", cleanupError);
        }
      }

      currentCallRef.current = null;
      currentCallStatusRef.current = null;
      activeClientRef.current = null;
      isCallerRef.current = false;

      remoteDescriptionSetRef.current = false;
      pendingIceCandidatesRef.current = [];
      offerSentRef.current = false;
      receiverReadyRef.current = false;

      if (mountedRef.current) {
        setCallContact(null);
        setCurrentCall(null);
        setIncomingCall(null);
        setLocalStream(null);
        setRemoteStream(null);
        setCallStatus("idle");
        setCallType(null);
        setIsMuted(false);
        setIsCameraEnabled(true);
      }
    } finally {
      cleaningUpRef.current = false;
    }
  }, [getActiveClient]);

  // =========================================================
  // CALL STATUS REALTIME SUBSCRIPTION
  // =========================================================

  const subscribeToCallStatus = useCallback(
    async (callId, client) => {
      if (!callId || !client) {
        throw new Error("Call ID and Supabase client are required.");
      }

      if (callStatusChannelRef.current) {
        const previous = callStatusChannelRef.current;
        callStatusChannelRef.current = null;

        await client.removeChannel(previous);
      }

      const channel = client.channel(`call-status:${callId}`).on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "calls",
          filter: `id=eq.${callId}`,
        },
        (payload) => {
          const updatedCall = payload?.new;

          if (!updatedCall?.status) return;
          if (currentCallRef.current?.id !== callId) return;

          console.log("[Call] Database status update:", updatedCall.status);

          currentCallStatusRef.current = updatedCall.status;

          const nextCall = {
            ...currentCallRef.current,
            ...updatedCall,
          };

          currentCallRef.current = nextCall;

          if (mountedRef.current) {
            setCurrentCall(nextCall);
          }

          if (TERMINAL_CALL_STATUSES.has(updatedCall.status)) {
            void cleanupCall();
          }
        }
      );

      callStatusChannelRef.current = channel;

      channel.subscribe((status, subscriptionError) => {
        console.log("[Call Status Realtime]", status);

        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.warn(
            "[Call] Call-status subscription unavailable:",
            subscriptionError || status
          );
        }
      });
    },
    [cleanupCall]
  );

  // =========================================================
  // SEND WEBRTC OFFER
  // =========================================================

  const sendOffer = useCallback(async () => {
    if (
      !isCallerRef.current ||
      offerSentRef.current ||
      !receiverReadyRef.current ||
      !webRTCRef.current ||
      !signalingRef.current
    ) {
      return;
    }

    try {
      const offer = await webRTCRef.current.createOffer();
      await signalingRef.current.sendOffer(offer);

      offerSentRef.current = true;

      if (mountedRef.current) {
        setCallStatus("ringing");
      }

      console.log("[Call] WebRTC offer sent.");
    } catch (offerError) {
      console.error("[Call] Failed to create/send offer:", offerError);

      if (mountedRef.current) {
        setError(
          offerError?.message || "Failed to establish the call connection."
        );
      }
    }
  }, []);

  // =========================================================
  // HANDLE WEBRTC SIGNALS
  // =========================================================

  const handleSignal = useCallback(
    async (signal) => {
      if (!signal || cleaningUpRef.current) return;

      try {
        switch (signal.type) {
          case "ready": {
            if (!isCallerRef.current) return;

            receiverReadyRef.current = true;
            await sendOffer();
            return;
          }

          case "offer": {
            if (isCallerRef.current || !webRTCRef.current) return;

            await webRTCRef.current.setRemoteDescription(signal.offer);
            remoteDescriptionSetRef.current = true;

            for (const candidate of pendingIceCandidatesRef.current) {
              try {
                await webRTCRef.current.addIceCandidate(candidate);
              } catch (candidateError) {
                console.error(
                  "[Call] Failed to add queued ICE candidate:",
                  candidateError
                );
              }
            }

            pendingIceCandidatesRef.current = [];

            const answer = await webRTCRef.current.createAnswer();

            if (signalingRef.current) {
              await signalingRef.current.sendAnswer(answer);
            }

            if (mountedRef.current) {
              setCallStatus("connecting");
            }

            console.log("[Call] WebRTC answer sent.");
            return;
          }

          case "answer": {
            if (!isCallerRef.current || !webRTCRef.current) return;

            await webRTCRef.current.setRemoteDescription(signal.answer);
            remoteDescriptionSetRef.current = true;

            for (const candidate of pendingIceCandidatesRef.current) {
              try {
                await webRTCRef.current.addIceCandidate(candidate);
              } catch (candidateError) {
                console.error(
                  "[Call] Failed to add queued ICE candidate:",
                  candidateError
                );
              }
            }

            pendingIceCandidatesRef.current = [];

            if (mountedRef.current) {
              setCallStatus("connecting");
            }

            console.log("[Call] WebRTC answer received.");
            return;
          }

          case "ice-candidate": {
            if (!webRTCRef.current || !signal.candidate) return;

            if (!remoteDescriptionSetRef.current) {
              pendingIceCandidatesRef.current.push(signal.candidate);
              return;
            }

            await webRTCRef.current.addIceCandidate(signal.candidate);
            return;
          }

          case "end": {
            console.log("[Call] Received remote end signal.");
            await cleanupCall();
            return;
          }

          default: {
            console.warn("[Call] Unknown signaling event:", signal.type);
          }
        }
      } catch (signalError) {
        console.error("[Call] Failed to process signal:", signalError);

        if (mountedRef.current) {
          setError(
            signalError?.message || "A WebRTC signaling error occurred."
          );
        }
      }
    },
    [cleanupCall, sendOffer]
  );

  // =========================================================
  // CONNECT SIGNALING
  // =========================================================

  const connectSignaling = useCallback(
    async (callId, client) => {
      if (!callId) {
        throw new Error("A valid call ID is required.");
      }

      if (signalingRef.current) {
        return signalingRef.current;
      }

      const signaling = new CallSignalingService({
        callId,
        client,
        onSignal: handleSignal,
        onStatus: (status) => {
          console.log("[Call Signaling] Status:", status);
        },
      });

      signalingRef.current = signaling;

      try {
        await signaling.connect();
        return signaling;
      } catch (signalingError) {
        if (signalingRef.current === signaling) {
          signalingRef.current = null;
        }

        throw signalingError;
      }
    },
    [handleSignal]
  );

  // =========================================================
  // SETUP WEBRTC
  // =========================================================

  const setupWebRTC = useCallback(
    async ({ isCaller, type }) => {
      isCallerRef.current = isCaller;

      remoteDescriptionSetRef.current = false;
      pendingIceCandidatesRef.current = [];

      const rtc = new WebRTCService({
        onRemoteStream: (stream) => {
          if (mountedRef.current) {
            setRemoteStream(stream);
          }
        },

        onIceCandidate: async (candidate) => {
          try {
            if (signalingRef.current) {
              await signalingRef.current.sendIceCandidate(candidate);
            }
          } catch (candidateError) {
            console.error(
              "[Call] Failed to send ICE candidate:",
              candidateError
            );
          }
        },

        onConnectionStateChange: (state) => {
          console.log("[WebRTC] Connection state:", state);

          if (!mountedRef.current) return;

          if (state === "connected") {
            setCallStatus("connected");
            return;
          }

          if (state === "failed") {
            setCallStatus("ended");
            setError(
              "The call connection failed. Check the network and try again."
            );

            void (async () => {
              try {
                const callId = currentCallRef.current?.id;
                const status = currentCallStatusRef.current;
                const client = getActiveClient();

                if (callId && status === "ringing" && isCallerRef.current) {
                  await client.rpc("cancel_call", {
                    p_call_id: callId,
                  });
                } else if (callId && status === "accepted") {
                  await client.rpc("end_call", {
                    p_call_id: callId,
                  });
                }
              } catch (terminationError) {
                console.warn(
                  "[Call] Failed to terminate after connection failure:",
                  terminationError
                );
              } finally {
                await cleanupCall();
              }
            })();

            return;
          }

          if (state === "disconnected") {
            console.warn(
              "[WebRTC] Connection disconnected; waiting for recovery."
            );
            return;
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

      try {
        const stream = await rtc.getLocalStream({
          audio: true,
          video: type === "video",
        });

        if (cleaningUpRef.current || webRTCRef.current !== rtc) {
          rtc.close();
          throw new Error("Call setup was cancelled.");
        }

        rtc.createPeerConnection();
        rtc.addLocalTracks();

        if (mountedRef.current) {
          setLocalStream(stream);
          setIsMuted(false);
          setIsCameraEnabled(type === "video");
        }

        return rtc;
      } catch (setupError) {
        rtc.close();

        if (webRTCRef.current === rtc) {
          webRTCRef.current = null;
        }

        throw setupError;
      }
    },
    [cleanupCall, getActiveClient]
  );

  // =========================================================
  // START CALL
  // =========================================================

  const startCall = useCallback(
    async (conversationId, type = "audio", recipient = null) => {
      if (!conversationId) {
        throw new Error("A valid conversation ID is required.");
      }

      if (type !== "audio" && type !== "video") {
        throw new Error("Call type must be audio or video.");
      }

      if (
        startingCallRef.current ||
        acceptingCallRef.current ||
        currentCallRef.current
      ) {
        throw new Error("You already have a call in progress.");
      }

      startingCallRef.current = true;

      const client = portalClient;
      activeClientRef.current = client;

      let createdCallId = null;

      try {
        setError("");
        setCallStatus("connecting");
        setCallType(type);

        receiverReadyRef.current = false;
        offerSentRef.current = false;

        // Recover abandoned calls before creating a new one.
        const { error: recoveryError } = await client.rpc(
          "recover_stale_calls"
        );

        if (recoveryError) {
          // Recovery must not silently be treated as successful.
          // The database's create_call check remains authoritative.
          console.warn("[Call] Stale-call recovery failed:", recoveryError);
        }

        const { data, error: createError } = await client.rpc("create_call", {
          p_conversation_id: conversationId,
          p_call_type: type,
        });

        if (createError) throw createError;

        if (!data?.id) {
          throw new Error("The call could not be created.");
        }

        createdCallId = data.id;

        const callWithRecipient = {
          ...data,
          recipient,
        };

        currentCallRef.current = callWithRecipient;
        currentCallStatusRef.current = data.status || "ringing";
        isCallerRef.current = true;

        setCallContact(recipient);
        setCurrentCall(callWithRecipient);

        await subscribeToCallStatus(data.id, client);
        await connectSignaling(data.id, client);
        await setupWebRTC({ isCaller: true, type });

        setCallStatus("ringing");

        console.log("[Call] Outgoing call initialized:", data.id);

        return data;
      } catch (startError) {
        console.error("[Call] Failed to start call:", startError);

        if (createdCallId) {
          try {
            const status = currentCallStatusRef.current;

            const rpcName = status === "accepted" ? "end_call" : "cancel_call";

            const { error: terminationError } = await client.rpc(rpcName, {
              p_call_id: createdCallId,
            });

            if (terminationError) {
              console.error(
                "[Call] Failed to terminate partially initialized call:",
                terminationError
              );
            }
          } catch (terminationError) {
            console.error(
              "[Call] Cleanup after call creation failed:",
              terminationError
            );
          }
        }

        if (mountedRef.current) {
          setError(startError?.message || "Unable to start the call.");
        }

        await cleanupCall();
        throw startError;
      } finally {
        startingCallRef.current = false;
      }
    },
    [
      portalClient,
      cleanupCall,
      connectSignaling,
      setupWebRTC,
      subscribeToCallStatus,
    ]
  );

  // =========================================================
  // ACCEPT INCOMING CALL
  // =========================================================

  const acceptCall = useCallback(
    async (call) => {
      if (!call?.id) {
        throw new Error("A valid call is required.");
      }

      if (
        acceptingCallRef.current ||
        startingCallRef.current ||
        currentCallRef.current
      ) {
        throw new Error("You already have a call in progress.");
      }

      acceptingCallRef.current = true;

      const client = portalClient;
      activeClientRef.current = client;

      let databaseAccepted = false;

      try {
        setError("");
        setCallStatus("connecting");
        setCallType(call.call_type);

        const { data, error: acceptError } = await client.rpc("accept_call", {
          p_call_id: call.id,
        });

        if (acceptError) throw acceptError;

        if (!data?.id) {
          throw new Error("The call could not be accepted.");
        }

        databaseAccepted = true;

        const acceptedCall = {
          ...call,
          ...data,

          // Preserve caller information from the incoming call object.
          caller:
            call?.caller ??
            call?.callerDetails ??
            call?.otherUser ??
            call?.contact ??
            null,

          // Preserve any existing recipient/contact metadata.
          recipient:
            call?.recipient ?? call?.otherUser ?? call?.contact ?? null,
        };

        currentCallRef.current = acceptedCall;
        currentCallStatusRef.current = acceptedCall.status || "accepted";
        isCallerRef.current = false;

        setCallContact(acceptedCall.caller);
        setCurrentCall(acceptedCall);
        setIncomingCall(null);

        await subscribeToCallStatus(call.id, client);
        await connectSignaling(call.id, client);
        await setupWebRTC({ isCaller: false, type: call.call_type });

        if (signalingRef.current) {
          await signalingRef.current.sendReady();
        }

        console.log("[Call] Incoming call accepted:", call.id);

        return data;
      } catch (acceptError) {
        console.error("[Call] Failed to accept call:", acceptError);

        if (databaseAccepted) {
          try {
            const { error: endError } = await client.rpc("end_call", {
              p_call_id: call.id,
            });

            if (endError) {
              console.error(
                "[Call] Failed to end partially accepted call:",
                endError
              );
            }
          } catch (endError) {
            console.error(
              "[Call] Cleanup after accept failure failed:",
              endError
            );
          }
        }

        if (mountedRef.current) {
          setError(acceptError?.message || "Unable to accept the call.");
        }

        await cleanupCall();
        throw acceptError;
      } finally {
        acceptingCallRef.current = false;
      }
    },
    [
      portalClient,
      cleanupCall,
      connectSignaling,
      setupWebRTC,
      subscribeToCallStatus,
    ]
  );

  // =========================================================
  // DECLINE INCOMING CALL
  // =========================================================

  const declineCall = useCallback(
    async (callId) => {
      if (!callId) return;

      setError("");

      const { error: declineError } = await portalClient.rpc("decline_call", {
        p_call_id: callId,
      });

      if (declineError) {
        console.error("[Call] Failed to decline call:", declineError);

        if (mountedRef.current) {
          setError(declineError.message || "Unable to decline the call.");
        }

        throw declineError;
      }

      setIncomingCall(null);

      console.log("[Call] Incoming call declined:", callId);
    },
    [portalClient]
  );

  // =========================================================
  // CANCEL OUTGOING RINGING CALL
  // =========================================================

  const cancelCall = useCallback(
    async (callId) => {
      const targetCallId = callId || currentCallRef.current?.id;
      if (!targetCallId) return;

      const client = getActiveClient();

      setError("");

      const { error: cancelError } = await client.rpc("cancel_call", {
        p_call_id: targetCallId,
      });

      if (cancelError) {
        console.error("[Call] Failed to cancel call:", cancelError);

        if (mountedRef.current) {
          setError(cancelError.message || "Unable to cancel the call.");
        }

        throw cancelError;
      }

      if (signalingRef.current) {
        try {
          await signalingRef.current.sendEnd();
        } catch (signalError) {
          console.warn(
            "[Call] Cancellation signal could not be sent:",
            signalError
          );
        }
      }

      await cleanupCall();

      console.log("[Call] Outgoing call cancelled:", targetCallId);
    },
    [cleanupCall, getActiveClient]
  );

  // =========================================================
  // END ACCEPTED CALL OR CANCEL RINGING CALL
  // =========================================================

  const endCall = useCallback(
    async (callId) => {
      const call = currentCallRef.current;
      const targetCallId = callId || call?.id;

      if (!targetCallId) return;

      const client = getActiveClient();

      let latestStatus = currentCallStatusRef.current || call?.status || null;

      try {
        const { data, error: detailsError } = await client.rpc(
          "get_call_details",
          { p_call_id: targetCallId }
        );

        if (!detailsError && data?.status) {
          latestStatus = data.status;
          currentCallStatusRef.current = data.status;

          if (currentCallRef.current?.id === targetCallId) {
            currentCallRef.current = {
              ...currentCallRef.current,
              ...data,
            };

            if (mountedRef.current) {
              setCurrentCall(currentCallRef.current);
            }
          }
        } else if (detailsError) {
          console.warn(
            "[Call] Could not refresh call status before ending:",
            detailsError
          );
        }
      } catch (detailsError) {
        console.warn("[Call] Call status refresh failed:", detailsError);
      }

      if (TERMINAL_CALL_STATUSES.has(latestStatus)) {
        await cleanupCall();
        return;
      }

      if (isCallerRef.current && latestStatus === "ringing") {
        await cancelCall(targetCallId);
        return;
      }

      setError("");

      const { error: endError } = await client.rpc("end_call", {
        p_call_id: targetCallId,
      });

      if (endError) {
        console.error("[Call] Failed to end call:", endError);

        if (mountedRef.current) {
          setError(endError.message || "Unable to end the call.");
        }

        throw endError;
      }

      if (signalingRef.current) {
        try {
          await signalingRef.current.sendEnd();
        } catch (signalError) {
          console.warn("[Call] End signal could not be sent:", signalError);
        }
      }

      await cleanupCall();

      console.log("[Call] Call ended:", targetCallId);
    },
    [cancelCall, cleanupCall, getActiveClient]
  );

  // =========================================================
  // TOGGLE MICROPHONE
  // =========================================================

  const toggleMute = useCallback(() => {
    if (!webRTCRef.current) return;

    const audioEnabled = webRTCRef.current.toggleAudio();
    setIsMuted(!audioEnabled);
  }, []);

  // =========================================================
  // TOGGLE CAMERA
  // =========================================================

  const toggleCamera = useCallback(() => {
    if (!webRTCRef.current || callType !== "video") return;

    const cameraEnabled = webRTCRef.current.toggleVideo();
    setIsCameraEnabled(cameraEnabled);
  }, [callType]);

  // =========================================================
  // SET INCOMING CALL
  // =========================================================

  const updateIncomingCall = useCallback((call) => {
    setIncomingCall(call);
  }, []);

  // =========================================================
  // PARTICIPANT HEARTBEAT
  // =========================================================

  useEffect(() => {
    const callId = currentCall?.id;
    const status = currentCall?.status;

    if (!callId || !ACTIVE_CALL_STATUSES.has(status)) {
      return undefined;
    }

    let stopped = false;
    let inFlight = false;
    let intervalId;

    const sendHeartbeat = async () => {
      if (stopped || inFlight) return;

      const client = getActiveClient();

      inFlight = true;

      try {
        const { data, error: heartbeatError } = await client.rpc(
          "heartbeat_call",
          { p_call_id: callId }
        );

        if (heartbeatError) {
          console.warn("[Call] Heartbeat failed:", heartbeatError.message);
        } else if (data === false) {
          console.warn(
            "[Call] Heartbeat was not accepted; the call may no longer be active."
          );
        }
      } catch (heartbeatError) {
        console.warn("[Call] Heartbeat request failed:", heartbeatError);
      } finally {
        inFlight = false;
      }
    };

    void sendHeartbeat();

    intervalId = setInterval(() => {
      void sendHeartbeat();
    }, HEARTBEAT_INTERVAL_MS);

    return () => {
      stopped = true;
      clearInterval(intervalId);
    };
  }, [currentCall?.id, currentCall?.status, getActiveClient]);

  // =========================================================
  // UNMOUNT CLEANUP
  // =========================================================

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;

      const client = activeClientRef.current || portalClient;

      const statusChannel = callStatusChannelRef.current;
      callStatusChannelRef.current = null;

      if (statusChannel) {
        void client.removeChannel(statusChannel);
      }

      const signaling = signalingRef.current;
      signalingRef.current = null;

      if (signaling) {
        void signaling.disconnect();
      }

      const rtc = webRTCRef.current;
      webRTCRef.current = null;

      if (rtc) {
        rtc.close();
      }

      currentCallRef.current = null;
      currentCallStatusRef.current = null;
      activeClientRef.current = null;
    };
  }, []);

  return {
    currentCall,
    incomingCall,
    callContact,
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
